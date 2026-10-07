#!/usr/bin/env node
// Control de calidad previo al render.
//   node snap.js <escena> [--max-iter 6]
// Genera capturas de revisión, detecta problemas de layout, corrige lo que puede
// (fixes.json), vuelve a generar previews y termina con código 0 sólo si pasa.
import fs from "node:fs";
import path from "node:path";
import { OUT, launch, openScene, readFixes, fixesPath, sceneExists, run, parseArgs, prepareVoice } from "./lib.js";

const TEXT_ROLES = new Set(["hero", "headline", "body", "eyebrow", "ui"]);
const MIN_FONT = { hero: 34, headline: 34, body: 34, eyebrow: 26, ui: 26 };
const SCREEN = { left: 24, right: 1056, top: 120, bottom: 1780 }; // para UI (tarjetas)
const EMPTY_GAP = 420; // px verticales sin contenido dentro de una composición

const area = (r) => Math.max(0, r.w) * Math.max(0, r.h);
function inter(a, b) {
  const x = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const y = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  return { w: x, h: y, a: x * y };
}

/* Analiza una escena muestreando su tiempo; devuelve errores y advertencias. */
async function analyzeScene(page, info, s, idx) {
  const errors = [], warns = [];
  const next = info.scenes[idx + 1];
  const tStart = s.start + (idx > 0 ? 0.3 : 0.05);
  const tEnd = s.end - (next ? 0.3 : 0.05);
  const samples = [];
  for (let t = tStart; t <= tEnd; t += 0.2) samples.push(+t.toFixed(3));
  const hero = Math.min(tEnd, s.start + s.settle + 0.1);
  samples.push(+hero.toFixed(3));

  const seen = new Set();
  const push = (arr, key, msg) => { if (!seen.has(key)) { seen.add(key); arr.push(msg); } };

  for (const t of samples) {
    const items = (await page.evaluate((t) => __qa(t), t)).filter((i) => i.scene === s.id);
    const vis = items.filter((i) => i.opacity > 0.6 && i.role !== "deco");
    for (const it of vis) {
      const isUI = it.role === "ui";
      const B = isUI ? SCREEN : info.safe;
      const o = {
        left: B.left - it.x, right: it.x + it.w - B.right,
        top: B.top - it.y, bottom: it.y + it.h - B.bottom,
      };
      for (const side of ["left", "right", "top", "bottom"]) {
        if (o[side] > 2) push(errors, `safe:${it.id}:${side}`, { type: "fuera-de-zona", id: it.id, side, px: Math.round(o[side]), t, w: it.w, h: it.h });
      }
      if (it.clipped) push(errors, `clip:${it.id}`, { type: "texto-cortado", id: it.id, t });
      if (Math.abs(t - hero) < 1e-6 && it.minFont != null && it.minFont < (MIN_FONT[it.role] || 30)) {
        push(errors, `font:${it.id}`, { type: "texto-chico", id: it.id, px: +it.minFont.toFixed(1), min: MIN_FONT[it.role], t });
      }
    }
    // superposiciones entre bloques de texto (las tarjetas UI pueden apilarse entre sí)
    for (let a = 0; a < vis.length; a++) for (let b = a + 1; b < vis.length; b++) {
      const A = vis[a], Bx = vis[b];
      if (A.role === "ui" && Bx.role === "ui") continue;
      const I = inter(A, Bx);
      if (I.a > 0.02 * Math.min(area(A), area(Bx)) && I.h > 6) {
        push(errors, `ov:${A.id}:${Bx.id}`, { type: "superposicion", ids: [A.id, Bx.id], h: Math.round(I.h), t });
      }
    }
    // zonas vacías y jerarquía en el momento de reposo
    if (Math.abs(t - hero) < 1e-6) {
      const all = items.filter((i) => i.opacity > 0.5).map((i) => [Math.max(i.y, info.safe.top), Math.min(i.y + i.h, info.safe.bottom)]).filter(([a, b]) => b > a).sort((a, b) => a[0] - b[0]);
      let gap = 0, end = all.length ? all[0][1] : 0;
      for (const [a, b] of all) { gap = Math.max(gap, a - end); end = Math.max(end, b); }
      if (all.length > 1 && gap > EMPTY_GAP) push(warns, `gap:${s.id}`, { type: "zona-vacia", px: Math.round(gap), t });
      // composición cargada arriba: mucho aire entre el último bloque y el borde inferior de la zona segura
      if (all.length) {
        const top = all[0][0] - info.safe.top, bottom = info.safe.bottom - end;
        if (bottom - top > 520) push(warns, `low:${s.id}`, { type: "zona-vacia-abajo", px: Math.round(bottom), t });
      }
      const fonts = vis.filter((i) => i.maxFont && i.role !== "ui").map((i) => i.maxFont).sort((a, b) => b - a);
      if (fonts.length > 1 && fonts[0] / fonts[1] < 1.15) push(warns, `hier:${s.id}`, { type: "jerarquia-debil", ratio: +(fonts[0] / fonts[1]).toFixed(2), t });
    }
  }
  // animaciones superpuestas: entradas que arrancan durante la transición de entrada
  for (const it of s.items) {
    if (it.exit != null && it.settle != null && it.exit < it.settle) push(warns, `exit:${it.id}`, { type: "sale-antes-de-asentarse", id: it.id });
  }
  if (s.settle > s.dur - 0.35) push(warns, `late:${s.id}`, { type: "poco-tiempo-de-lectura", settle: +s.settle.toFixed(2), dur: s.dur });
  return { errors, warns, hero };
}

/* Traduce errores en correcciones (fixes.json). Devuelve true si cambió algo. */
function computeFixes(info, results, fixes) {
  let changed = false;
  const byId = new Map(info.scenes.flatMap((s) => s.items.map((i) => [i.id, i])));
  const get = (id) => (fixes[id] = fixes[id] || { opts: {} });
  const safe = info.safe;
  for (const r of results) {
    for (const e of r.errors) {
      if (e.type === "fuera-de-zona" || e.type === "texto-cortado") {
        const it = byId.get(e.id); if (!it) continue;
        const f = get(e.id);
        if (e.type === "texto-cortado" || e.side === "left" || e.side === "right") {
          // achicar: tamaño tipográfico si existe, si no escala general
          const k = e.type === "texto-cortado" ? 0.92 : Math.min(0.95, (safe.right - safe.left) / (e.w + 4));
          if (it.size && (it.kind === "TextReveal" || it.kind === "KeywordCircle")) f.opts.size = Math.round((f.opts.size ?? it.size) * k);
          else f.opts.scale = +((f.opts.scale ?? it.scale) * k).toFixed(3);
        } else {
          const dy = (e.px + 12) * (e.side === "top" ? 1 : -1);
          f.opts.y = Math.round((f.opts.y ?? it.y) + dy);
          if (e.h > safe.bottom - safe.top - 40) f.opts.scale = +((f.opts.scale ?? it.scale) * 0.92).toFixed(3);
        }
        f.reason = (f.reason || []).concat(`${e.type}${e.side ? ":" + e.side : ""}`);
        changed = true;
      }
      if (e.type === "superposicion") {
        // se separan: el de arriba sube y el de abajo baja la mitad de la superposición + aire
        const [a, b] = e.ids.map((id) => byId.get(id));
        if (!a || !b) continue;
        const fa = get(a.id), fb = get(b.id);
        const ya = fa.opts.y ?? a.y, yb = fb.opts.y ?? b.y;
        const [up, down, fu, fd] = ya <= yb ? [a, b, fa, fb] : [b, a, fb, fa];
        const half = Math.ceil(e.h / 2) + 14;
        fu.opts.y = Math.round((fu.opts.y ?? up.y) - half);
        fd.opts.y = Math.round((fd.opts.y ?? down.y) + half);
        fu.reason = (fu.reason || []).concat("superposicion");
        fd.reason = (fd.reason || []).concat("superposicion");
        changed = true;
      }
    }
  }
  return changed;
}

async function captureReviews(page, info, results, dir) {
  fs.mkdirSync(dir, { recursive: true });
  const odir = path.join(dir, "overlay");
  fs.mkdirSync(odir, { recursive: true });
  for (const d of [dir, odir]) for (const f of fs.readdirSync(d)) if (/^\d\d-.*\.(png|jpg)$/.test(f)) fs.rmSync(path.join(d, f));
  const files = [];
  for (let i = 0; i < info.scenes.length; i++) {
    const s = info.scenes[i], r = results[i];
    const name = `${String(i + 1).padStart(2, "0")}-${s.id}`;
    const items = await page.evaluate((t) => __qa(t), r.hero);
    await page.screenshot({ path: path.join(dir, name + ".jpg"), type: "jpeg", quality: 88 });
    // overlay: zona segura + cajas (rojo = con error)
    const bad = new Set(r.errors.flatMap((e) => e.ids || [e.id]));
    await page.evaluate(({ items, safe, bad }) => {
      const st = document.getElementById("stage");
      const add = (cls, x, y, w, h) => { const d = document.createElement("div"); d.className = cls; Object.assign(d.style, { left: x + "px", top: y + "px", width: w + "px", height: h + "px" }); st.appendChild(d); return d; };
      add("qa-safe qa-tmp", safe.left, safe.top, safe.right - safe.left, safe.bottom - safe.top);
      for (const it of items) if (it.opacity > 0.3 && it.role !== "deco") add("qa-box qa-tmp" + (bad.includes(it.id) ? " bad" : ""), it.x, it.y, it.w, it.h);
    }, { items, safe: info.safe, bad: [...bad] });
    await page.screenshot({ path: path.join(odir, name + ".jpg"), type: "jpeg", quality: 80 });
    await page.evaluate(() => document.querySelectorAll(".qa-tmp").forEach((d) => d.remove()));
    files.push(name);
  }
  // hoja de contactos de las capturas de revisión
  const cols = Math.min(5, files.length);
  await run("ffmpeg", ["-v", "error", "-y", "-pattern_type", "glob", "-i", path.join(dir, "[0-9][0-9]-*.jpg"),
    "-vf", `scale=270:-1,tile=${cols}x${Math.ceil(files.length / cols)}:padding=6:color=0x111111`, "-frames:v", "1", path.join(dir, "contact.jpg")], { quiet: true });
  await run("ffmpeg", ["-v", "error", "-y", "-pattern_type", "glob", "-i", path.join(odir, "[0-9][0-9]-*.jpg"),
    "-vf", `scale=270:-1,tile=${cols}x${Math.ceil(files.length / cols)}:padding=6:color=0x111111`, "-frames:v", "1", path.join(dir, "contact-overlay.jpg")], { quiet: true });
  return files;
}

function report(name, info, results, iterations, pass, fixes, files) {
  const L = [];
  L.push(`# QA · ${name}`, "", `Estado: **${pass ? "APROBADO" : "NO APROBADO"}** · iteraciones: ${iterations} · duración ${info.duration.toFixed(2)} s · ${info.scenes.length} escenas`, "");
  L.push("![Revisión](contact.jpg)", "", "Con zona segura y cajas de layout: `contact-overlay.jpg` (capturas individuales en `overlay/`)", "");
  L.push("| # | Escena | Inicio | Dur. | Reposo | Errores | Advertencias |", "|---|---|---|---|---|---|---|");
  info.scenes.forEach((s, i) => {
    const r = results[i];
    const fmt = (a) => a.map((e) => e.type + (e.id ? ` (${e.id}${e.side ? " " + e.side : ""}${e.px ? " " + e.px + "px" : ""})` : e.px ? ` (${e.px}px)` : e.ratio ? ` (${e.ratio})` : "")).join("<br>") || "—";
    L.push(`| ${i + 1} | ${s.id} | ${s.start.toFixed(2)} | ${s.dur.toFixed(2)} | ${(s.start + s.settle).toFixed(2)} | ${fmt(r.errors)} | ${fmt(r.warns)} |`);
  });
  const fx = Object.entries(fixes);
  L.push("", "## Correcciones automáticas aplicadas", "");
  if (!fx.length) L.push("Ninguna: el layout pasó a la primera.");
  else for (const [id, f] of fx) L.push(`- \`${id}\` → ${JSON.stringify(f.opts)} (${[...new Set(f.reason || [])].join(", ")})`);
  L.push("", "## Reglas", "", "- Zona segura de texto: x 80–1000, y 200–1560 (fuera quedan los controles de Reels/TikTok).",
    "- Tamaño mínimo efectivo: 34 px titulares y cuerpo, 26 px etiquetas y UI.",
    "- Sin superposición entre bloques de texto visibles (opacidad > 0,6).",
    `- Zona vacía: advertencia si hay más de ${EMPTY_GAP} px verticales sin contenido.`,
    "- Jerarquía: advertencia si el texto principal no es al menos 1,15× el segundo.");
  fs.writeFileSync(path.join(OUT, name, "qa", "qa-report.md"), L.join("\n") + "\n");
}

export async function snap(name, { maxIter = 6, log = console.log } = {}) {
  if (!sceneExists(name)) throw new Error(`No existe scenes/${name}.js`);
  const dir = path.join(OUT, name, "qa");
  fs.mkdirSync(dir, { recursive: true });
  let fixes = readFixes(name);
  const browser = await launch();
  let info, results, pass = false, iter = 0, page;
  try {
    await prepareVoice(browser, name, log);
    while (iter < maxIter) {
      iter++;
      if (page) await page.close();
      page = await openScene(browser, name, fixes);
      info = await page.evaluate(() => __info());
      results = [];
      for (let i = 0; i < info.scenes.length; i++) results.push(await analyzeScene(page, info, info.scenes[i], i));
      const errs = results.flatMap((r) => r.errors);
      const declared = info.meta.duration;
      if (typeof declared === "number" && Math.abs(declared - info.duration) > 0.05) errs.push({ type: "duracion", msg: `DURATION=${declared} pero las escenas suman ${info.duration}` });
      if (Array.isArray(declared) && (info.duration < declared[0] - 0.01 || info.duration > declared[1] + 0.01)) errs.push({ type: "duracion", msg: `DURATION=[${declared}] pero el video dura ${info.duration.toFixed(2)} s` });
      // la locución tiene que entrar en su escena (y no pisar la siguiente)
      for (const sc of info.scenes) if (sc.voDur && sc.voAt + sc.voDur > sc.dur + 0.3) errs.push({ type: "voz-no-entra", id: sc.id, msg: `${sc.id}: voz ${sc.voDur.toFixed(2)} s en escena de ${sc.dur.toFixed(2)} s` });
      log(`  iteración ${iter}: ${errs.length} errores, ${results.flatMap((r) => r.warns).length} advertencias`);
      for (const e of errs) log("    ✗", e.type, e.id || (e.ids || []).join(" ↔ ") || "", e.side || "", e.px != null ? e.px + "px" : "", e.msg || "");
      if (!errs.length) { pass = true; break; }
      const changed = computeFixes(info, results, fixes);
      fs.writeFileSync(fixesPath(name), JSON.stringify(fixes, null, 2));
      if (!changed) { log("  sin correcciones automáticas posibles para estos errores"); break; }
    }
    const files = await captureReviews(page, info, results, dir);
    fs.writeFileSync(path.join(dir, "qa.json"), JSON.stringify({ pass, iterations: iter, duration: info.duration, scenes: info.scenes.map((s, i) => ({ ...s, ...results[i] })), fixes }, null, 2));
    report(name, info, results, iter, pass, fixes, files);
    for (const w of results.flatMap((r) => r.warns)) log("    ! advertencia", w.type, w.id || "", w.px ? w.px + "px" : "", w.ratio || "");
  } finally {
    await browser.close();
  }
  return { pass, info, results, fixes };
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs(process.argv.slice(2));
  const name = args._[0] || "presencia";
  if (args.reset) fs.rmSync(fixesPath(name), { force: true });
  console.log(`QA de "${name}"`);
  const r = await snap(name, { maxIter: +(args["max-iter"] || 6) });
  console.log(r.pass ? `✓ aprobado → out/${name}/qa/` : `✗ no aprobado → revisá out/${name}/qa/qa-report.md`);
  process.exit(r.pass ? 0 : 1);
}
