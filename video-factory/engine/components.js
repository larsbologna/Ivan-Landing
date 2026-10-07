/* =========================================================================
   Componentes reutilizables. Cada uno devuelve { kind, opts, build(ctx, opts, id) }
   y build() devuelve un nodo { el, update(lt), settle, exit, role, visibility(lt) }.
   Todas las animaciones son funciones puras del tiempo local de la escena (lt).

   Opciones comunes a todos los componentes:
     at     segundo (local a la escena) en que empieza la entrada
     out    segundo en que sale (opcional; si no, sale con la escena)
     x,y,z  posición desde el centro de la pantalla y profundidad (px)
     rx,ry  inclinación 3D en grados
     float  amplitud de flotación en px (0 = quieto)
     id     identificador estable (para fixes de QA)
   ========================================================================= */
(function () {
  "use strict";
  const E = window.Engine;
  const { clamp, lerp, prog, ease, spring, rng } = E.M;

  /* ---------- íconos (trazos 24×24, sin marcas registradas) ---------- */
  const ICONS = {
    web: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 9h18"/><circle cx="6.5" cy="6.5" r=".6" fill="currentColor"/><circle cx="9" cy="6.5" r=".6" fill="currentColor"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.6"/>',
    star: '<path d="M12 3.5l2.6 5.5 6 .8-4.4 4.1 1.1 5.9L12 17l-5.3 2.8 1.1-5.9L3.4 9.8l6-.8z"/>',
    chat: '<path d="M20 11.5a8 8 0 0 1-11.6 7.1L4 20l1.4-4.2A8 8 0 1 1 20 11.5z"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c2 .7 3.2 2.4 3.6 5.2"/>',
    shield: '<path d="M12 3l7.5 3v5.5c0 4.6-3.1 8.2-7.5 9.5-4.4-1.3-7.5-4.9-7.5-9.5V6z"/>',
    trend: '<path d="M3 7l6 6 4-4 8 8"/><path d="M15 17h6v-6"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    phone: '<path d="M6.5 3.5h3l1.5 4-2 1.3a10 10 0 0 0 6.2 6.2l1.3-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2z"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    route: '<circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><path d="M8 18h7a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h7"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    qr: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
  };
  const icon = (name, size = 40, sw = 1.8) =>
    `<svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ICONS.spark}</svg>`;

  /* ---------- helpers comunes ---------- */
  function mk(tag, cls, html) {
    const d = document.createElement(tag);
    if (cls) d.className = cls;
    if (html != null) d.innerHTML = html;
    return d;
  }
  function layer(ctx, o, cls) {
    const el = mk("div", "layer " + (cls || ""));
    ctx.world.appendChild(el);
    E.placeStyle(el, o);
    return el;
  }
  /* Salida estándar: blur + fade + subida. */
  function exitAmt(o, lt) {
    if (o.out == null) return 0;
    return ease.inCubic(prog(lt, o.out, o.outDur || 0.4));
  }
  function place(el, o, lt, extra = {}) {
    const fl = o.float ? Math.sin(lt * 1.25 + (o.phase || 0)) * o.float : 0;
    E.placeStyle(el, {
      x: (o.x || 0) + (extra.dx || 0),
      y: (o.y || 0) + fl + (extra.dy || 0),
      z: (o.z || 0) + (extra.dz || 0),
      rx: (o.rx || 0) + (extra.rx || 0),
      ry: (o.ry || 0) + (extra.ry || 0),
      rz: (o.rz || 0) + (extra.rz || 0),
      scale: (o.scale || 1) * (extra.scale ?? 1),
    });
  }
  const colorVar = (c) => (c ? (c.startsWith("#") || c.startsWith("rgb") ? c : `var(--${c})`) : "var(--ink)");
  const norm = (w) => w.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9ñ]/g, "");

  function component(kind, defaults, buildFn) {
    return function (opts = {}) {
      return { kind, opts: Object.assign({}, defaults, opts), build: buildFn };
    };
  }

  /* Trazo "a mano" para marcas sobre palabras (pathLength=1 → animable). */
  const MARK_PATHS = {
    circle: "M10 58 C 4 22, 58 4, 90 18 C 106 28, 99 80, 58 93 C 22 103, -1 80, 5 47 C 8 31, 27 13, 47 10",
    strike: "M -2 56 C 30 50, 70 54, 102 46",
    underline: "M 0 104 C 30 98, 70 100, 100 95",
  };
  function markSvg(type, sw) {
    return `<svg class="mark mark-${type}" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="${MARK_PATHS[type]}" pathLength="1" vector-effect="non-scaling-stroke" stroke-width="${sw}"/></svg>`;
  }

  /* =======================================================================
     TextReveal — entrada palabra por palabra (blur + opacidad + translateY)
     text: "Texto con *acento*\nsegunda línea"
     marks: { palabra: "circle" | "strike" | "underline" }
     role: "hero" | "headline" | "body" | "eyebrow"
     ======================================================================= */
  const TextReveal = component("TextReveal", {
    at: 0, size: 96, weight: 700, maxWidth: 860, color: "ink", accent: "accent", stagger: 0.075, wordDur: 0.6,
    blur: 16, rise: 46, align: "center", lineHeight: 1.06, tracking: -0.025, role: "headline", fit: true,
    maxLines: 4, cue: "pop", cueGain: 0.5, wordCue: null, marks: null, markAt: null, upper: false, minSize: 36,
  }, function (ctx, o) {
    const el = layer(ctx, o, "text-layer");
    const box = mk("div", "tr-box");
    box.dataset.qaText = "";
    box.style.cssText = `max-width:${o.maxWidth}px;font-weight:${o.weight};line-height:${o.lineHeight};letter-spacing:${o.tracking}em;text-align:${o.align};color:${colorVar(o.color)};${o.upper ? "text-transform:uppercase;" : ""}${o.font ? `font-family:${o.font};` : ""}`;
    el.appendChild(box);

    const words = [];
    const lines = String(o.text).split("\n");
    lines.forEach((line, li) => {
      // *acento* puede abarcar varias palabras
      const parts = line.split(/(\*[^*]+\*)/).filter(Boolean);
      let prevAcc = false;
      parts.forEach((part) => {
        const acc = part.startsWith("*") && part.endsWith("*");
        const txt = acc ? part.slice(1, -1) : part;
        const toks = txt.split(/\s+/).filter(Boolean);
        // puntuación pegada a una palabra destacada: "*gasto*." → se une a la palabra anterior
        if (!acc && prevAcc && /^\S/.test(part) && toks.length) {
          const prev = words[words.length - 1];
          const glue = mk("span", "", toks.shift());
          glue.style.color = colorVar(o.color);
          prev.inner.appendChild(glue);
        }
        prevAcc = acc;
        toks.forEach((w) => {
          const s = mk("span", "w" + (acc ? " acc" : ""));
          const inner = mk("span", "wi", w.replace(/&/g, "&amp;").replace(/</g, "&lt;"));
          if (acc) inner.style.color = colorVar(o.accent);
          s.appendChild(inner);
          box.appendChild(s);
          box.appendChild(document.createTextNode(" "));
          words.push({ s, inner, key: norm(w) });
        });
      });
      if (li < lines.length - 1) box.appendChild(mk("br"));
    });

    // Ajuste automático de tamaño: la palabra más larga entra y no supera maxLines.
    let size = o.size;
    const fits = () => {
      box.style.fontSize = size + "px";
      if (box.scrollWidth > o.maxWidth + 1) return false;
      for (const w of words) if (w.s.offsetWidth > o.maxWidth) return false;
      const tops = new Set(words.map((w) => w.s.offsetTop));
      return tops.size <= o.maxLines;
    };
    if (o.fit) { let guard = 0; while (!fits() && size > o.minSize && guard++ < 60) size = Math.max(o.minSize, size * 0.96); }
    else box.style.fontSize = size + "px";

    // Marcas (círculo dibujado, tachado, subrayado)
    const marks = [];
    if (o.marks) {
      words.forEach((w, i) => {
        const type = o.marks[w.key];
        if (!type) return;
        w.s.classList.add("has-mark");
        const svg = mk("span", "mark-wrap", markSvg(type, Math.max(4, size * 0.05)));
        svg.firstChild.style.color = type === "strike" ? "var(--warn)" : colorVar(o.markColor || "accent");
        w.s.appendChild(svg);
        marks.push({ path: svg.querySelector("path"), i, type });
      });
    }

    const n = words.length;
    const wordStart = (i) => o.at + i * o.stagger;
    const wordsIn = wordStart(n - 1) + o.wordDur;
    const markStart = (m) => (o.markAt != null ? o.markAt : wordsIn + 0.15);
    const settle = marks.length ? Math.max(wordsIn, markStart(marks[0]) + 0.75) : wordsIn;
    marks.forEach((m) => ctx.cue(markStart(m), m.type === "circle" ? "swipe" : "swipe", { gain: 0.6 }));
    if (o.cue) ctx.cue(o.at, o.cue, { gain: o.cueGain, pitch: o.cuePitch || 1 });
    if (o.wordCue) words.forEach((w, i) => i > 0 && ctx.cue(wordStart(i), o.wordCue, { gain: 0.25, pan: (i % 2 ? 0.2 : -0.2) }));

    return {
      el, role: o.role, fontSize: size, settle, exit: o.out,
      visibility: (lt) => clamp((lt - wordStart(n - 1)) / o.wordDur) * (1 - exitAmt(o, lt)),
      overflow: () => words.some((w) => w.s.offsetWidth > o.maxWidth + 1),
      update(lt) {
        const ex = exitAmt(o, lt);
        place(el, o, lt, { dy: -ex * 40 });
        for (let i = 0; i < n; i++) {
          const p = ease.outCubic(prog(lt, wordStart(i), o.wordDur));
          const w = words[i].inner;
          const op = p * (1 - ex);
          const bl = (1 - p) * o.blur + ex * o.blur;
          w.style.opacity = op.toFixed(3);
          w.style.filter = bl > 0.05 ? `blur(${bl.toFixed(2)}px)` : "none";
          w.style.transform = `translateY(${((1 - p) * o.rise).toFixed(2)}px)`;
        }
        for (const m of marks) {
          const p = ease.inOutCubic(prog(lt, markStart(m), m.type === "circle" ? 0.7 : 0.45));
          m.path.style.strokeDashoffset = (1 - p).toFixed(4);
          m.path.parentNode.style.opacity = p > 0 ? 1 - ex : 0;
        }
        if (o.markDim && marks.length) {
          const p = prog(lt, markStart(marks[0]), 0.5);
          words.forEach((w, i) => { if (marks.some((m) => m.i === i)) w.inner.style.opacity = (1 - 0.55 * p) * (1 - ex); });
        }
      },
    };
  });

  /* Eyebrow: etiqueta chica con tracking amplio y línea a la izquierda. */
  const Eyebrow = (opts) => TextReveal(Object.assign({
    size: 30, weight: 600, upper: true, tracking: 0.26, color: "accent", role: "eyebrow", stagger: 0.04, wordDur: 0.5,
    rise: 16, blur: 8, cue: "tick", cueGain: 0.35, fit: false, maxWidth: 940,
  }, opts, { text: "— " + opts.text }));

  /* =======================================================================
     Typewriter — máquina de escribir con cursor
     variant: "plain" | "search" (barra de búsqueda estilizada)
     ======================================================================= */
  const Typewriter = component("Typewriter", {
    at: 0, text: "", cps: 15, size: 50, weight: 500, variant: "plain", width: 860, color: "ink", placeholder: "", role: "body", jitter: 0.35,
  }, function (ctx, o) {
    const el = layer(ctx, o, "tw-layer");
    const card = mk("div", o.variant === "search" ? "tw tw-search" : "tw");
    if (o.variant === "search") card.style.width = o.width + "px";
    card.innerHTML = (o.variant === "search" ? `<span class="tw-ico">${icon("search", o.size * 0.9, 2)}</span>` : "") +
      `<span class="tw-text" data-qa-text style="font-size:${o.size}px;font-weight:${o.weight};color:${colorVar(o.color)}"></span><span class="tw-caret" style="height:${o.size * 1.1}px"></span>`;
    el.appendChild(card);
    const txt = card.querySelector(".tw-text"), caret = card.querySelector(".tw-caret");

    // tiempos de cada carácter con variación humana determinista
    const R = rng(o.text.length * 131 + 7);
    const times = [];
    let t = o.at + 0.35;
    for (let i = 0; i < o.text.length; i++) {
      times.push(t);
      const ch = o.text[i];
      t += (1 / o.cps) * (1 + (R() - 0.5) * 2 * o.jitter) * (ch === " " ? 1.6 : 1);
    }
    const done = t;
    times.forEach((tt, i) => o.text[i] !== " " && ctx.cue(tt, "typewriter", { gain: 0.45 + R() * 0.2, pan: (R() - 0.5) * 0.3, pitch: 0.9 + R() * 0.2 }));
    if (o.variant === "search") ctx.cue(o.at, "swipe", { gain: 0.4 });

    return {
      el, role: o.role, fontSize: o.size, settle: done + 0.1, exit: o.out,
      visibility: (lt) => clamp((lt - o.at) / 0.4) * (1 - exitAmt(o, lt)),
      update(lt) {
        const ex = exitAmt(o, lt);
        const pin = ease.outExpo(prog(lt, o.at, 0.6));
        place(el, o, lt, { dz: (1 - pin) * -260, dy: (1 - pin) * 30 - ex * 30 });
        el.style.opacity = (pin * (1 - ex)).toFixed(3);
        let k = 0;
        while (k < times.length && lt >= times[k]) k++;
        txt.textContent = k === 0 && o.placeholder ? o.placeholder : o.text.slice(0, k);
        txt.classList.toggle("ph", k === 0 && !!o.placeholder);
        const typing = lt >= o.at && lt < done + 0.15;
        caret.style.opacity = typing ? 1 : (Math.floor(lt * 2.2) % 2 === 0 ? 1 : 0);
      },
    };
  });

  /* =======================================================================
     ProgressRing — anillo + contador con rebote
     ======================================================================= */
  const ProgressRing = component("ProgressRing", {
    at: 0, dur: 5, from: 0, to: 5, suffix: "s", label: "", diameter: 560, stroke: 20, tickCue: "tick", endCue: "ding",
    decimals: 0, steps: true, role: "hero", numberSize: 230,
  }, function (ctx, o) {
    const el = layer(ctx, o, "ring-layer");
    const D = o.diameter, r = D / 2 - o.stroke - 24, C = 2 * Math.PI * r;
    const ticks = Array.from({ length: 60 }, (_, i) => {
      const a = (i / 60) * Math.PI * 2, r1 = D / 2 - 6, r2 = r1 - (i % 5 === 0 ? 18 : 9);
      return `<line x1="${Math.cos(a) * r1}" y1="${Math.sin(a) * r1}" x2="${Math.cos(a) * r2}" y2="${Math.sin(a) * r2}" />`;
    }).join("");
    el.innerHTML = `
      <div class="ring" style="width:${D}px;height:${D}px">
        <svg viewBox="${-D / 2} ${-D / 2} ${D} ${D}" width="${D}" height="${D}">
          <defs><linearGradient id="rg-${ctx.scene.id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--accent)"/><stop offset="1" stop-color="var(--accent2)"/></linearGradient></defs>
          <g class="ring-ticks">${ticks}</g>
          <circle r="${r}" class="ring-track" stroke-width="${o.stroke}"/>
          <circle r="${r}" class="ring-prog" stroke="url(#rg-${ctx.scene.id})" stroke-width="${o.stroke}" stroke-dasharray="${C}" stroke-dashoffset="${C}" transform="rotate(-90)"/>
          <circle r="${o.stroke * 0.42}" class="ring-head" />
        </svg>
        <div class="ring-num" data-qa-text style="font-size:${o.numberSize}px"><span class="n">0</span><span class="suf">${o.suffix}</span></div>
      </div>
      ${o.label ? `<div class="ring-label" data-qa-text>${o.label}</div>` : ""}`;
    const prog$ = el.querySelector(".ring-prog"), head = el.querySelector(".ring-head"), num = el.querySelector(".n"), ring = el.querySelector(".ring");
    const ticksG = el.querySelector(".ring-ticks");
    const span = o.to - o.from;
    const stepCount = Math.abs(span);
    if (o.steps && stepCount <= 30) {
      for (let i = 1; i <= stepCount; i++) ctx.cue(o.at + (o.dur * i) / stepCount, i === stepCount ? o.endCue : o.tickCue, { gain: i === stepCount ? 0.8 : 0.55, pitch: 1 + i * 0.04 });
    }
    ctx.cue(o.at, "swipe", { gain: 0.35 });

    return {
      el, role: o.role, fontSize: o.numberSize, settle: o.at + o.dur + 0.4, exit: o.out,
      visibility: (lt) => clamp((lt - o.at) / 0.5) * (1 - exitAmt(o, lt)),
      update(lt) {
        const ex = exitAmt(o, lt);
        const pin = ease.outExpo(prog(lt, o.at - 0.25, 0.7));
        const p = clamp((lt - o.at) / o.dur);
        const val = o.from + span * p;
        const shown = o.steps ? (span >= 0 ? Math.floor(val + 1e-6) : Math.ceil(val - 1e-6)) : val;
        num.textContent = o.decimals ? shown.toFixed(o.decimals).replace(".", ",") : String(Math.round(shown));
        prog$.setAttribute("stroke-dashoffset", (C * (1 - p)).toFixed(2));
        const a = p * Math.PI * 2 - Math.PI / 2;
        head.setAttribute("cx", (Math.cos(a) * r).toFixed(2));
        head.setAttribute("cy", (Math.sin(a) * r).toFixed(2));
        head.style.opacity = p > 0 && p < 1 ? 1 : 0;
        // rebote en cada paso y rebote final
        const stepT = o.dur / Math.max(1, stepCount);
        const since = lt - o.at - Math.floor((lt - o.at) / stepT) * stepT;
        const bump = lt > o.at && p < 1 ? Math.exp(-since * 9) * 0.05 : 0;
        const endB = p >= 1 ? (1 - spring(lt - o.at - o.dur, { freq: 2.6, damping: 0.35 })) * -0.14 : 0;
        num.parentNode.style.transform = `translate(-50%,-50%) scale(${(1 + bump - endB * 0.9).toFixed(4)})`;
        ring.style.transform = `scale(${(0.7 + 0.3 * pin).toFixed(4)})`;
        ticksG.style.transform = `rotate(${lt * 6}deg)`;
        el.classList.toggle("done", p >= 1);
        place(el, o, lt, { dz: (1 - pin) * -500, dy: -ex * 40 });
        el.style.opacity = (pin * (1 - ex)).toFixed(3);
        el.style.filter = "none";
      },
    };
  });

  /* =======================================================================
     HexFeature — hexágono con ícono y etiqueta
     ======================================================================= */
  const HEX = (s) => {
    const pts = Array.from({ length: 6 }, (_, i) => { const a = (Math.PI / 3) * i - Math.PI / 2; return [Math.cos(a) * s, Math.sin(a) * s]; });
    // esquinas redondeadas
    const k = 0.18;
    let d = "";
    pts.forEach((p, i) => {
      const prev = pts[(i + 5) % 6], next = pts[(i + 1) % 6];
      const a = [lerp(p[0], prev[0], k), lerp(p[1], prev[1], k)], b = [lerp(p[0], next[0], k), lerp(p[1], next[1], k)];
      d += (i === 0 ? "M" : "L") + a[0].toFixed(1) + " " + a[1].toFixed(1) + " Q" + p[0].toFixed(1) + " " + p[1].toFixed(1) + " " + b[0].toFixed(1) + " " + b[1].toFixed(1);
    });
    return d + "Z";
  };
  const HexFeature = component("HexFeature", {
    at: 0, icon: "spark", label: "", tone: "accent", size: 250, labelSize: 50, badge: null, cue: "pop", role: "body",
  }, function (ctx, o) {
    const el = layer(ctx, o, "hex-layer tone-" + o.tone);
    const s = o.size / 2;
    el.innerHTML = `
      <div class="hex" style="width:${o.size}px;height:${o.size}px">
        <svg viewBox="${-s - 4} ${-s - 4} ${o.size + 8} ${o.size + 8}" width="${o.size}" height="${o.size}">
          <path d="${HEX(s)}" class="hex-fill"/>
          <path d="${HEX(s)}" class="hex-stroke" pathLength="1"/>
        </svg>
        <div class="hex-ico">${icon(o.icon, o.size * 0.36, 1.7)}</div>
        ${o.badge ? `<div class="hex-badge">${icon(o.badge, o.size * 0.13, 2.6)}</div>` : ""}
      </div>
      <div class="hex-label" data-qa-text style="font-size:${o.labelSize}px">${o.label}</div>`;
    const hex = el.querySelector(".hex"), stroke = el.querySelector(".hex-stroke"), label = el.querySelector(".hex-label"), badge = el.querySelector(".hex-badge");
    ctx.cue(o.at, o.cue, { gain: 0.6, pitch: o.cuePitch || 1, pan: clamp((o.x || 0) / 600, -0.6, 0.6) });
    if (badge) ctx.cue(o.at + 0.55, "tick", { gain: 0.4, pan: clamp((o.x || 0) / 600, -0.6, 0.6) });
    return {
      el, role: o.role, fontSize: o.labelSize, settle: o.at + 0.8, exit: o.out,
      visibility: (lt) => clamp((lt - o.at) / 0.5) * (1 - exitAmt(o, lt)),
      update(lt) {
        const ex = exitAmt(o, lt);
        const sp = spring(lt - o.at, { freq: 1.9, damping: 0.6 });
        const pin = clamp((lt - o.at) / 0.35);
        place(el, o, lt, { dz: (1 - sp) * -700, ry: (1 - sp) * 50, dy: -ex * 40 });
        el.style.opacity = (pin * (1 - ex)).toFixed(3);
        stroke.style.strokeDashoffset = (1 - ease.inOutCubic(prog(lt, o.at + 0.1, 0.8))).toFixed(4);
        const lp = ease.outCubic(prog(lt, o.at + 0.25, 0.5));
        label.style.opacity = lp.toFixed(3);
        label.style.transform = `translateY(${((1 - lp) * 24).toFixed(1)}px)`;
        label.style.filter = lp < 1 ? `blur(${((1 - lp) * 8).toFixed(2)}px)` : "none";
        if (badge) { const b = spring(lt - o.at - 0.55, { freq: 2.6, damping: 0.45 }); badge.style.transform = `scale(${Math.max(0, b).toFixed(3)})`; }
        hex.style.transform = `rotate(${Math.sin(lt * 0.8 + (o.phase || 0)) * 2}deg)`;
      },
    };
  });

  /* =======================================================================
     PillCascade — lista de pastillas que entran en cascada con spring
     items: [{ icon, text, hl }]
     ======================================================================= */
  const PillCascade = component("PillCascade", {
    at: 0, items: [], stagger: 0.42, size: 48, gap: 22, width: 860, from: "depth", cue: "pop", check: true, role: "body",
  }, function (ctx, o) {
    const el = layer(ctx, o, "pills-layer");
    const list = mk("div", "pills");
    list.style.gap = o.gap + "px";
    list.style.width = o.width + "px";
    const pills = o.items.map((it, i) => {
      const p = mk("div", "pill" + (it.hl ? " hl" : ""));
      p.style.fontSize = o.size + "px";
      p.innerHTML = `<span class="pill-ico">${icon(it.icon || "check", o.size * 0.82, 1.9)}</span><span class="pill-text" data-qa-text>${it.text}</span>` +
        (o.check ? `<span class="pill-check">${icon("check", o.size * 0.62, 2.6)}</span>` : "");
      list.appendChild(p);
      return { p, chk: p.querySelector(".pill-check"), start: o.at + i * o.stagger };
    });
    el.appendChild(list);
    pills.forEach((q, i) => ctx.cue(q.start, o.cue, { gain: 0.55, pitch: 1 + i * 0.07, pan: (i % 2 ? 0.25 : -0.25) }));
    const last = pills.length ? pills[pills.length - 1].start : o.at;
    return {
      el, role: o.role, fontSize: o.size, settle: last + 0.7, exit: o.out,
      visibility: (lt) => clamp((lt - last) / 0.4) * (1 - exitAmt(o, lt)),
      update(lt) {
        const ex = exitAmt(o, lt);
        place(el, o, lt, { dy: -ex * 40 });
        el.style.opacity = (1 - ex).toFixed(3);
        pills.forEach((q, i) => {
          const sp = spring(lt - q.start, { freq: 1.8, damping: 0.62 });
          const op = clamp((lt - q.start) / 0.3);
          const tx = o.from === "right" ? (1 - sp) * 420 : o.from === "left" ? (1 - sp) * -420 : 0;
          const tz = o.from === "depth" ? (1 - sp) * -520 : 0;
          const rx = o.from === "depth" ? (1 - sp) * -40 : 0;
          q.p.style.transform = `translate3d(${tx.toFixed(1)}px, ${((1 - sp) * 40).toFixed(1)}px, ${tz.toFixed(1)}px) rotateX(${rx.toFixed(2)}deg)`;
          q.p.style.opacity = op.toFixed(3);
          if (q.chk) { const c = spring(lt - q.start - 0.3, { freq: 2.4, damping: 0.5 }); q.chk.style.transform = `scale(${Math.max(0, c).toFixed(3)})`; }
        });
      },
    };
  });

  /* =======================================================================
     KeywordCircle — palabra destacada con círculo dibujado a mano
     ======================================================================= */
  const KeywordCircle = component("KeywordCircle", {
    at: 0, text: "", size: 200, weight: 800, color: "accent", circleColor: "accent", circleAt: null, upper: true, role: "hero",
    tracking: -0.02, cue: "impact", maxWidth: 900, glow: true,
  }, function (ctx, o) {
    const el = layer(ctx, o, "kw-layer");
    const box = mk("div", "kw");
    const word = mk("span", "kw-word", o.text);
    word.dataset.qaText = "";
    word.style.cssText = `font-weight:${o.weight};letter-spacing:${o.tracking}em;color:${colorVar(o.color)};${o.upper ? "text-transform:uppercase;" : ""}`;
    box.appendChild(word);
    box.insertAdjacentHTML("beforeend", markSvg("circle", Math.max(6, o.size * 0.045)).replace('class="mark', 'class="kw-circle mark'));
    el.appendChild(box);
    let size = o.size;
    word.style.fontSize = size + "px";
    let guard = 0;
    while (word.offsetWidth > o.maxWidth - 80 && guard++ < 60) { size *= 0.96; word.style.fontSize = size + "px"; }
    const svg = box.querySelector("svg"), path = svg.querySelector("path");
    svg.style.color = colorVar(o.circleColor);
    const cAt = o.circleAt != null ? o.circleAt : o.at + 0.55;
    ctx.cue(o.at, o.cue, { gain: 0.9 });
    ctx.cue(cAt, "swipe", { gain: 0.6 });
    ctx.cue(cAt + 0.65, "chime", { gain: 0.55 });
    return {
      el, role: o.role, fontSize: size, settle: cAt + 0.8, exit: o.out,
      visibility: (lt) => clamp((lt - o.at) / 0.4) * (1 - exitAmt(o, lt)),
      update(lt) {
        const ex = exitAmt(o, lt);
        const sp = spring(lt - o.at, { freq: 2.1, damping: 0.5 });
        const pin = clamp((lt - o.at) / 0.25);
        place(el, o, lt, { scale: 0.6 + 0.4 * Math.max(0, sp), dz: (1 - pin) * 300, dy: -ex * 40 });
        el.style.opacity = (pin * (1 - ex)).toFixed(3);
        const bl = (1 - pin) * 20;
        word.style.filter = bl > 0.05 ? `blur(${bl.toFixed(2)}px)` : "none";
        const cp = ease.inOutCubic(prog(lt, cAt, 0.7));
        path.style.strokeDashoffset = (1 - cp).toFixed(4);
        svg.style.opacity = cp > 0 ? 1 : 0;
        if (o.glow) word.style.textShadow = `0 0 ${(40 + 30 * Math.sin(lt * 2)).toFixed(1)}px var(--glow)`;
      },
    };
  });

  /* =======================================================================
     UICard — interfaces estilizadas (no son capturas reales)
     kind: "maps" | "chat" | "review" | "web" | "results" | "booking"
     ======================================================================= */
  const stars = (n, size) => Array.from({ length: 5 }, (_, i) => `<span class="st ${i < Math.round(n) ? "on" : ""}">${icon("star", size, 1.6)}</span>`).join("");
  const UI_TEMPLATES = {
    maps: (d) => `
      <div class="ui-map"><div class="ui-map-roads"></div><div class="ui-map-pin">${icon("pin", 64, 2)}</div></div>
      <div class="ui-pad">
        <div class="ui-title" data-qa-text>${d.name || "Tu negocio"}</div>
        <div class="ui-row"><span class="ui-rating" data-qa-text>${d.rating || "4,9"}</span><span class="ui-stars">${stars(parseFloat(String(d.rating || "4,9").replace(",", ".")) || 0, 30)}</span><span class="ui-muted" data-qa-text>(${d.count || 128})</span></div>
        <div class="ui-row ui-open" data-qa-text><i class="dot"></i>${d.status || "Abierto ahora · Cierra 20 h"}</div>
        <div class="ui-actions">${(d.actions || [["phone", "Llamar"], ["route", "Cómo llegar"], ["chat", "WhatsApp"]]).map(([ic, t], i) => `<span class="ui-btn ${i === 2 ? "pri" : ""}">${icon(ic, 30, 2)}<b data-qa-text>${t}</b></span>`).join("")}</div>
      </div>`,
    chat: (d) => `
      <div class="ui-chat-head"><span class="ui-avatar">${(d.name || "Tu negocio").slice(0, 1)}</span><div><div class="ui-title sm" data-qa-text>${d.name || "Tu negocio"}</div><div class="ui-muted sm ui-online" data-qa-text>${d.sub || "en línea"}</div></div></div>
      <div class="ui-chat">${(d.messages || [["in", "Hola, ¿tienen turno hoy?"], ["out", "¡Sí! Tengo 18:30 o 19:15. ¿Te lo reservo?"], ["in", "18:30, gracias"]]).map(([w, t]) => `<div class="bub ${w}" data-qa-text>${t}${w === "out" ? `<span class="tk">${icon("check", 22, 2.4)}${icon("check", 22, 2.4)}</span>` : ""}</div>`).join("")}</div>`,
    review: (d) => `
      <div class="ui-pad">
        <div class="ui-row"><span class="ui-avatar">${(d.author || "Lucía M.").slice(0, 1)}</span><div><div class="ui-title sm" data-qa-text>${d.author || "Lucía M."}</div><div class="ui-muted sm" data-qa-text>${d.when || "Reseña de Google · hace 2 días"}</div></div></div>
        <div class="ui-stars big">${stars(5, 40)}</div>
        <div class="ui-quote" data-qa-text>${d.text || "“Respondieron al toque y todo fue clarísimo.”"}</div>
      </div>`,
    web: (d) => `
      <div class="ui-browser"><i></i><i></i><i></i><span class="ui-url" data-qa-text>${d.url || "tunegocio.com.ar"}</span></div>
      <div class="ui-pad">
        <div class="ui-hero" data-qa-text>${d.title || "Todo lo que necesitás saber, en un solo lugar."}</div>
        <div class="ui-lines"><i style="width:92%"></i><i style="width:74%"></i></div>
        <div class="ui-actions"><span class="ui-btn pri">${icon("chat", 30, 2)}<b data-qa-text>${d.cta || "Escribinos"}</b></span><span class="ui-btn">${icon("calendar", 30, 2)}<b data-qa-text>Reservar</b></span></div>
      </div>`,
    results: (d) => `
      <div class="ui-pad">${(d.items || [["Tu negocio", "4,9", "Abierto ahora", true], ["Otro negocio", "3,8", "Sin horarios", false], ["Otro más", "4,1", "Sin fotos", false]]).map(([n, r, s, hl]) => `
        <div class="ui-result ${hl ? "hl" : ""}"><span class="ui-thumb"></span><div><div class="ui-title sm" data-qa-text>${n}</div><div class="ui-row"><span class="ui-rating sm" data-qa-text>${r}</span><span class="ui-stars">${stars(parseFloat(r.replace(",", ".")), 24)}</span></div><div class="ui-muted sm" data-qa-text>${s}</div></div></div>`).join("")}
      </div>`,
    booking: (d) => `
      <div class="ui-pad">
        <div class="ui-title" data-qa-text>${d.title || "Elegí tu horario"}</div>
        <div class="ui-slots">${(d.slots || ["10:00", "11:30", "15:00", "18:30"]).map((s, i) => `<span class="slot ${i === (d.pick ?? 3) ? "pick" : ""}" data-qa-text>${s}</span>`).join("")}</div>
        <div class="ui-actions"><span class="ui-btn pri wide">${icon("check", 30, 2.4)}<b data-qa-text>${d.cta || "Confirmar turno"}</b></span></div>
      </div>`,
  };
  const UICard = component("UICard", {
    at: 0, kind: "maps", width: 760, data: {}, cue: "swipe", role: "ui", from: "depth", glow: false, dim: 0,
  }, function (ctx, o) {
    const el = layer(ctx, o, "ui-layer");
    const card = mk("div", `ui-card ui-${o.kind}` + (o.glow ? " glow" : ""), UI_TEMPLATES[o.kind](o.data || {}));
    card.style.width = o.width + "px";
    // dim: profundidad de campo para tarjetas de fondo (0..1)
    if (o.dim) { card.style.filter = `blur(${(o.dim * 5).toFixed(1)}px)`; card.style.opacity = (1 - o.dim * 0.5).toFixed(2); }
    el.appendChild(card);
    const rows = [...card.querySelectorAll(".ui-pad > *, .bub, .ui-result, .ui-actions .ui-btn, .slot")];
    ctx.cue(o.at, o.cue, { gain: 0.45, pan: clamp((o.x || 0) / 600, -0.5, 0.5) });
    const bubs = [...card.querySelectorAll(".bub")];
    bubs.forEach((b, i) => ctx.cue(o.at + 0.5 + i * 0.55, "pop", { gain: 0.35, pitch: b.classList.contains("out") ? 1.2 : 0.95 }));
    return {
      el, role: o.role, fontSize: 34, settle: o.at + 0.6 + (bubs.length ? bubs.length * 0.55 : rows.length * 0.06), exit: o.out,
      visibility: (lt) => clamp((lt - o.at) / 0.5) * (1 - exitAmt(o, lt)),
      update(lt) {
        const ex = exitAmt(o, lt);
        const sp = spring(lt - o.at, { freq: 1.5, damping: 0.75 });
        const pin = clamp((lt - o.at) / 0.4);
        const dz = o.from === "depth" ? (1 - sp) * -900 : 0;
        const dx = o.from === "left" ? (1 - sp) * -700 : o.from === "right" ? (1 - sp) * 700 : 0;
        const dy = o.from === "bottom" ? (1 - sp) * 600 : 0;
        place(el, o, lt, { dz, dx, dy: dy - ex * 40, rx: (1 - sp) * 25 });
        el.style.opacity = (pin * (1 - ex)).toFixed(3);
        if (bubs.length) {
          bubs.forEach((b, i) => {
            const s = spring(lt - (o.at + 0.5 + i * 0.55), { freq: 2.2, damping: 0.6 });
            b.style.opacity = clamp((lt - (o.at + 0.5 + i * 0.55)) / 0.2).toFixed(3);
            b.style.transform = `translateY(${((1 - s) * 30).toFixed(1)}px) scale(${(0.9 + 0.1 * s).toFixed(3)})`;
          });
        } else {
          rows.forEach((r, i) => {
            const p = ease.outCubic(prog(lt, o.at + 0.2 + i * 0.06, 0.5));
            r.style.opacity = p.toFixed(3);
            r.style.transform = `translateY(${((1 - p) * 20).toFixed(1)}px)`;
          });
        }
      },
    };
  });

  /* =======================================================================
     Lever — palanca geométrica (barra + fulcro) que se inclina
     ======================================================================= */
  const Lever = component("Lever", { at: 0, width: 760, cue: "impact", role: "deco" }, function (ctx, o) {
    const el = layer(ctx, o, "lever-layer");
    const w = o.width;
    el.innerHTML = `<svg width="${w}" height="${w * 0.42}" viewBox="${-w / 2} ${-w * 0.26} ${w} ${w * 0.42}">
      <g class="lv-bar"><rect x="${-w * 0.46}" y="-7" width="${w * 0.92}" height="14" rx="7" class="lv-rect"/>
        <circle cx="${w * 0.42}" cy="-34" r="26" class="lv-load"/><rect x="${-w * 0.46}" y="-60" width="64" height="53" rx="12" class="lv-weight"/></g>
      <path d="M0 6 L46 ${w * 0.15} L-46 ${w * 0.15} Z" class="lv-fulcrum"/>
    </svg>`;
    const bar = el.querySelector(".lv-bar"), load = el.querySelector(".lv-load");
    ctx.cue(o.at + 0.55, o.cue, { gain: 0.6 });
    return {
      el, role: o.role, settle: o.at + 1.4, exit: o.out,
      visibility: (lt) => clamp((lt - o.at) / 0.4) * (1 - exitAmt(o, lt)),
      update(lt) {
        const ex = exitAmt(o, lt);
        const pin = ease.outCubic(prog(lt, o.at, 0.5));
        const tilt = spring(lt - o.at - 0.45, { freq: 1.4, damping: 0.45 });
        bar.style.transform = `rotate(${lerp(12, -12, Math.max(0, tilt)).toFixed(3)}deg)`;
        load.style.opacity = (0.5 + 0.5 * clamp(tilt)).toFixed(3);
        place(el, o, lt, { dy: (1 - pin) * 40 - ex * 40 });
        el.style.opacity = (pin * (1 - ex)).toFixed(3);
      },
    };
  });

  /* =======================================================================
     OutroBrand — cierre de marca
     ======================================================================= */
  const OutroBrand = component("OutroBrand", {
    at: 0, brand: null, tagline: null, cta: null, note: "", role: "hero", brandSize: 132, tracking: null, monogram: null, maxWidth: 900,
  }, function (ctx, o) {
    const brand = o.brand || ctx.meta.brand, tagline = o.tagline || ctx.meta.tagline, cta = o.cta || ctx.meta.cta;
    const isUpper = brand === brand.toUpperCase();
    // tracking final: amplio para marcas en mayúsculas, neutro para nombres propios
    const trkEnd = o.tracking ?? (isUpper ? 0.16 : -0.01);
    // monograma: iniciales si la marca tiene 2+ palabras (p. ej. "Iván Bologna" → IB)
    const words = brand.trim().split(/\s+/);
    const mono = o.monogram ?? (words.length > 1 ? words.slice(0, 2).map((w) => w[0]).join("").toUpperCase() : null);
    const el = layer(ctx, o, "outro-layer");
    el.innerHTML = `
      <div class="ob-mark">
        <svg viewBox="-100 -100 200 200" width="200" height="200">
          <defs><linearGradient id="obg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--accent)"/><stop offset="1" stop-color="var(--accent2)"/></linearGradient></defs>
          <rect x="-86" y="-86" width="172" height="172" rx="46" class="ob-sq"/>
          ${mono ? `<text class="ob-mono" text-anchor="middle" dominant-baseline="central" y="4" fill="url(#obg)">${mono}</text>
          <path d="M -70 -104 A 124 124 0 0 1 70 -104" class="ob-arc a2" pathLength="1"/>` : `
          <circle r="16" fill="url(#obg)" class="ob-dot"/>
          <path d="M -34 -34 A 48 48 0 0 1 34 -34" class="ob-arc a1" pathLength="1"/>
          <path d="M -54 -54 A 76 76 0 0 1 54 -54" class="ob-arc a2" pathLength="1" transform="translate(0 8)"/>
          <path d="M -34 34 A 48 48 0 0 0 34 34" class="ob-arc a3" pathLength="1"/>`}
        </svg>
      </div>
      <div class="ob-brand" data-qa-text style="font-size:${o.brandSize}px">${brand.split("").map((c) => `<span>${c === " " ? "&nbsp;" : c}</span>`).join("")}</div>
      <div class="ob-line"></div>
      <div class="ob-tag" data-qa-text>${tagline}</div>
      <div class="ob-cta"><span class="ob-cta-ico">${icon("chat", 50, 2)}</span><span data-qa-text>${cta}</span><i class="ob-shine"></i></div>
      ${o.note ? `<div class="ob-note" data-qa-text>${o.note}</div>` : ""}`;
    const mark = el.querySelector(".ob-mark"), letters = [...el.querySelectorAll(".ob-brand span")], line = el.querySelector(".ob-line");
    const tag = el.querySelector(".ob-tag"), btn = el.querySelector(".ob-cta"), shine = el.querySelector(".ob-shine"), note = el.querySelector(".ob-note");
    const arcs = [...el.querySelectorAll(".ob-arc")];
    // ajuste de ancho: la marca entra en maxWidth con su tracking final
    const brandEl = el.querySelector(".ob-brand");
    let bsize = o.brandSize;
    brandEl.style.letterSpacing = trkEnd + "em";
    for (let g = 0; g < 60 && brandEl.offsetWidth > o.maxWidth; g++) { bsize *= 0.96; brandEl.style.fontSize = bsize + "px"; }
    ctx.cue(o.at, "impact", { gain: 0.55 });
    ctx.cue(o.at + 0.35, "chime", { gain: 0.7 });
    ctx.cue(o.at + 1.35, "pop", { gain: 0.6, pitch: 1.1 });
    const fadeIn = (node, start, d = 0.55, rise = 24) => {
      if (!node) return;
      return (lt) => {
        const p = ease.outCubic(prog(lt, start, d));
        node.style.opacity = p.toFixed(3);
        node.style.transform = `translateY(${((1 - p) * rise).toFixed(1)}px)`;
        node.style.filter = p < 1 ? `blur(${((1 - p) * 10).toFixed(2)}px)` : "none";
      };
    };
    const fTag = fadeIn(tag, o.at + 0.9), fNote = fadeIn(note, o.at + 1.7);
    return {
      el, role: o.role, fontSize: bsize, settle: o.at + 2.0, exit: o.out,
      visibility: (lt) => clamp((lt - o.at - 1.3) / 0.5),
      update(lt) {
        place(el, o, lt);
        const ms = spring(lt - o.at, { freq: 1.6, damping: 0.55 });
        mark.style.transform = `scale(${Math.max(0, ms).toFixed(3)}) rotate(${((1 - ms) * -30).toFixed(2)}deg)`;
        mark.style.opacity = clamp((lt - o.at) / 0.25).toFixed(3);
        arcs.forEach((a, i) => (a.style.strokeDashoffset = (1 - ease.inOutCubic(prog(lt, o.at + 0.2 + i * 0.12, 0.6))).toFixed(4)));
        letters.forEach((s, i) => {
          const p = ease.outExpo(prog(lt, o.at + 0.3 + i * 0.045, 0.7));
          s.style.opacity = p.toFixed(3);
          s.style.filter = p < 1 ? `blur(${((1 - p) * 14).toFixed(2)}px)` : "none";
          s.style.transform = `translateY(${((1 - p) * 40).toFixed(1)}px)`;
        });
        const trk = lerp(trkEnd + 0.26, trkEnd, ease.outCubic(prog(lt, o.at + 0.3, 1.6)));
        brandEl.style.letterSpacing = trk.toFixed(4) + "em";
        line.style.transform = `scaleX(${ease.inOutCubic(prog(lt, o.at + 0.7, 0.7)).toFixed(4)})`;
        fTag(lt);
        const bs = spring(lt - o.at - 1.35, { freq: 1.9, damping: 0.55 });
        btn.style.opacity = clamp((lt - o.at - 1.35) / 0.25).toFixed(3);
        btn.style.transform = `scale(${(0.8 + 0.2 * Math.max(0, bs)).toFixed(4)})`;
        const sh = ((lt - o.at - 1.9) % 2.2) / 0.9;
        shine.style.transform = `translateX(${lerp(-140, 760, clamp(sh)).toFixed(1)}px) skewX(-20deg)`;
        shine.style.opacity = sh > 0 && sh < 1 ? 1 : 0;
        if (fNote) fNote(lt);
      },
    };
  });

  /* =======================================================================
     Glyph — ícono grande suelto (decorativo o de apoyo)
     ======================================================================= */
  const Glyph = component("Glyph", { at: 0, icon: "spark", size: 160, color: "accent", role: "deco", cue: null }, function (ctx, o) {
    const el = layer(ctx, o, "glyph-layer");
    el.innerHTML = `<div class="glyph" style="color:${colorVar(o.color)}">${icon(o.icon, o.size, 1.5)}</div>`;
    if (o.cue) ctx.cue(o.at, o.cue, { gain: 0.5 });
    return {
      el, role: o.role, settle: o.at + 0.6, exit: o.out,
      visibility: (lt) => clamp((lt - o.at) / 0.4) * (1 - exitAmt(o, lt)),
      update(lt) {
        const ex = exitAmt(o, lt);
        const sp = spring(lt - o.at, { freq: 1.8, damping: 0.6 });
        place(el, o, lt, { scale: Math.max(0, sp), dy: -ex * 30 });
        el.style.opacity = (clamp((lt - o.at) / 0.3) * (1 - ex)).toFixed(3);
      },
    };
  });

  /* =======================================================================
     SceneTransition — transición entre escenas (blur, fade, zoom, push)
     pin: progreso de entrada (0→1), pout: progreso de salida (0→1)
     ======================================================================= */
  const SceneTransition = {
    apply(el, pin, pout, trIn, trOut) {
      const ein = ease.inOutCubic(pin), eout = ease.inOutCubic(pout);
      let op = 1, blur = 0, scale = 1, ty = 0;
      const tin = trIn ? trIn.type : "fade", tout = trOut ? trOut.type : "fade";
      if (pin < 1) {
        op *= ein;
        if (tin === "blur") { blur += (1 - ein) * 26; scale *= lerp(0.94, 1, ein); }
        if (tin === "zoom") { blur += (1 - ein) * 18; scale *= lerp(0.7, 1, ein); }
        if (tin === "push") { blur += (1 - ein) * 12; ty += (1 - ein) * 220; }
      }
      if (pout > 0) {
        op *= 1 - eout;
        if (tout === "blur") { blur += eout * 26; scale *= lerp(1, 1.07, eout); }
        if (tout === "zoom") { blur += eout * 18; scale *= lerp(1, 1.5, eout); }
        if (tout === "push") { blur += eout * 12; ty -= eout * 220; }
      }
      el.style.opacity = op.toFixed(4);
      el.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "none";
      el.style.transform = scale !== 1 || ty ? `translateY(${ty.toFixed(1)}px) scale(${scale.toFixed(4)})` : "none";
    },
  };

  Object.assign(window, { TextReveal, Eyebrow, Typewriter, ProgressRing, HexFeature, PillCascade, KeywordCircle, UICard, Lever, OutroBrand, Glyph, SceneTransition });
  window.Components = { ICONS, icon };
})();
