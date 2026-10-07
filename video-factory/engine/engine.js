/* =========================================================================
   Iván Bologna · Video Factory — engine.js
   Motor determinista: todo el estado visual es función pura de t.
   - Sin requestAnimationFrame, sin timers, sin transiciones CSS.
   - window.__seek(t)   → dibuja el frame del segundo t
   - window.__info()    → duración, fps, escenas
   - window.__cues()    → eventos de audio [{t, type, gain, pan, pitch}]
   - window.__qa(t)     → cajas de layout para el control de calidad
   ========================================================================= */
(function () {
  "use strict";

  const W = 1080, H = 1920;
  const SAFE = { left: 80, right: 1000, top: 200, bottom: 1560 };

  /* ---------- matemática ---------- */
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, p) => a + (b - a) * p;
  const prog = (t, start, dur) => (dur <= 0 ? (t >= start ? 1 : 0) : clamp((t - start) / dur));
  const ease = {
    linear: (p) => p,
    outCubic: (p) => 1 - Math.pow(1 - p, 3),
    inCubic: (p) => p * p * p,
    inOutCubic: (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
    outExpo: (p) => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p)),
    inExpo: (p) => (p <= 0 ? 0 : Math.pow(2, 10 * p - 10)),
    inOutExpo: (p) =>
      p <= 0 ? 0 : p >= 1 ? 1 : p < 0.5 ? Math.pow(2, 20 * p - 10) / 2 : (2 - Math.pow(2, -20 * p + 10)) / 2,
    outQuint: (p) => 1 - Math.pow(1 - p, 5),
    outBack: (p) => { const c = 1.6; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); },
  };
  /* Resorte amortiguado analítico (sin integración paso a paso → seekeable). */
  function spring(t, { freq = 2.2, damping = 0.55 } = {}) {
    if (t <= 0) return 0;
    const w = 2 * Math.PI * freq, z = damping;
    if (z >= 1) return 1 - Math.exp(-w * t) * (1 + w * t);
    const wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t));
  }
  /* PRNG con semilla (mulberry32). */
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const M = { clamp, lerp, prog, ease, spring, rng };

  /* ---------- registro de escenas ---------- */
  const scenes = [];
  function scene(id, dur, items, opts) {
    if (typeof id === "object") { opts = id; id = opts.id; dur = opts.dur; items = opts.items; }
    scenes.push({ id, dur, items: items || [], opts: opts || {} });
  }

  /* Overrides de QA (fixes.json inyectado por snap.js) */
  const FIXES = (window.__FIXES__ || {});

  /* ---------- estado ---------- */
  const state = { built: false, timeline: [], cues: [], duration: 0, meta: {} };
  const root = () => document.getElementById("stage");

  function readGlobal(name, fallback) {
    try { return (0, eval)(`typeof ${name} !== "undefined" ? ${name} : undefined`) ?? fallback; }
    catch (e) { return fallback; }
  }

  function build() {
    const meta = {
      brand: readGlobal("BRAND", "Iván Bologna"),
      tagline: readGlobal("TAGLINE", ""),
      cta: readGlobal("CTA", ""),
      colors: readGlobal("COLORS", "midnight"),
      duration: readGlobal("DURATION", null),
      fps: readGlobal("FPS", 30),
      music: readGlobal("MUSIC", "pad"),
      voice: readGlobal("VOICE", null),
    };
    state.meta = meta;
    window.Themes.apply(meta.colors);

    // Duraciones: escenas sin dur reparten el resto de DURATION.
    // Locución: window.__VO__ = { escena: segundos } (lo inyecta snap/render tras sintetizar la voz).
    // Una escena con vo y dur null dura lo que su frase: voAt + voz + hold.
    const VO = window.__VO__ || {};
    scenes.forEach((s) => {
      s.voAt = s.opts.voAt ?? 0.12;
      s.voDur = s.opts.vo && VO[s.id] ? VO[s.id] : 0;
      if (!s.dur && s.voDur) s.dur = +(s.voAt + s.voDur + (s.opts.hold ?? 0.25)).toFixed(3);
    });
    // DURATION: número exacto (las escenas sin dur reparten el resto) o rango [mín, máx].
    const exact = typeof meta.duration === "number" ? meta.duration : null;
    const fixed = scenes.reduce((s, sc) => s + (sc.dur || 0), 0);
    const free = scenes.filter((s) => !s.dur).length;
    const rest = exact ? Math.max(0, exact - fixed) : 0;
    scenes.forEach((s) => { if (!s.dur) s.dur = exact && free ? Math.max(1.5, rest / free) : 2.5; });
    // Rango [mín, máx]: si el video queda corto, se estiran las pausas (40 % al cierre, el resto parejo).
    if (Array.isArray(meta.duration) && scenes.length) {
      const total = scenes.reduce((a, sc) => a + sc.dur, 0);
      const target = meta.duration[0] + 0.3;
      if (total < meta.duration[0]) {
        const deficit = target - total;
        const last = scenes[scenes.length - 1];
        const others = scenes.length > 1 ? scenes.slice(0, -1) : [];
        last.dur += others.length ? deficit * 0.4 : deficit;
        others.forEach((sc) => (sc.dur += (deficit * 0.6) / others.length));
        scenes.forEach((sc) => (sc.dur = +sc.dur.toFixed(3)));
      }
    }

    const stage = root();
    const bg = window.Background.create(stage, meta);
    state.bg = bg;

    let t0 = 0;
    scenes.forEach((sc, i) => {
      const tr = Object.assign({ type: "blur", dur: 0.45, sound: "whoosh" }, sc.opts.transition || {});
      const el = document.createElement("div");
      el.className = "scene";
      el.dataset.scene = sc.id;
      const cam = document.createElement("div");
      cam.className = "camera";
      const world = document.createElement("div");
      world.className = "world";
      cam.appendChild(world);
      el.appendChild(cam);
      stage.appendChild(el);

      const entry = { ...sc, index: i, start: t0, end: t0 + sc.dur, tr, el, cam, world, nodes: [] };
      const ctx = makeCtx(entry, meta);
      sc.items.forEach((item, k) => {
        if (!item || typeof item.build !== "function") return;
        const id = item.opts.id || `${sc.id}/${k}`;
        const fix = FIXES[id] || {};
        const node = item.build(ctx, Object.assign({}, item.opts, fix.opts || {}), id);
        node.id = id;
        node.kind = item.kind;
        node.fix = fix;
        node.opts = Object.assign({}, item.opts, fix.opts || {});
        entry.nodes.push(node);
      });
      if (i > 0) ctx.cue(-tr.dur * 0.35, tr.sound, { gain: 0.55, pan: 0 });
      if (sc.voDur) state.cues.push({ t: +(t0 + sc.voAt).toFixed(4), type: "vo", id: sc.id, gain: 1, pan: 0, pitch: 1, scene: sc.id });
      state.timeline.push(entry);
      t0 += sc.dur;
    });
    state.duration = exact && Math.abs(exact - t0) < 0.05 ? exact : +t0.toFixed(3);
    state.cues.sort((a, b) => a.t - b.t);
    state.built = true;
  }

  function makeCtx(entry, meta) {
    return {
      M, meta, scene: entry, W, H, SAFE,
      world: entry.world,
      cue(localT, type, o = {}) {
        if (!type) return;
        const t = entry.start + localT;
        if (t < 0) return;
        state.cues.push({ t: +t.toFixed(4), type, gain: o.gain ?? 1, pan: o.pan ?? 0, pitch: o.pitch ?? 1, scene: entry.id });
      },
    };
  }

  /* Estilo de una capa posicionada: x/y desde el centro, z de profundidad. */
  function placeStyle(el, o) {
    el.style.transform = `translate(-50%,-50%) translate3d(${o.x || 0}px, ${o.y || 0}px, ${o.z || 0}px)` +
      (o.rx ? ` rotateX(${o.rx}deg)` : "") + (o.ry ? ` rotateY(${o.ry}deg)` : "") + (o.rz ? ` rotateZ(${o.rz}deg)` : "") +
      (o.scale && o.scale !== 1 ? ` scale(${o.scale})` : "");
  }

  /* Cámara: interpola from → to durante la escena (más deriva sutil). */
  function cameraTransform(entry, lt) {
    const c = entry.opts.camera || {};
    const from = Object.assign({ x: 0, y: 0, z: -40, rx: 0, ry: 0, rz: 0 }, c.from || {});
    const to = Object.assign({ x: 0, y: 0, z: 40, rx: 0, ry: 0, rz: 0 }, c.to || {});
    const e = ease[c.ease || "inOutCubic"];
    const p = e(clamp(lt / entry.dur));
    const v = {};
    for (const k of ["x", "y", "z", "rx", "ry", "rz"]) v[k] = lerp(from[k], to[k], p);
    // respiración de cámara: amplitud mínima, determinista
    const br = c.breathe ?? 1;
    v.x += Math.sin((entry.start + lt) * 0.9) * 3 * br;
    v.y += Math.cos((entry.start + lt) * 0.7) * 3 * br;
    return `translate3d(${-v.x}px, ${-v.y}px, ${v.z}px) rotateX(${v.rx}deg) rotateY(${v.ry}deg) rotateZ(${v.rz}deg)`;
  }

  function seek(t) {
    if (!state.built) build();
    t = clamp(t, 0, state.duration);
    state.t = t;
    state.bg.update(t, state.timeline);
    const TL = state.timeline;
    for (let i = 0; i < TL.length; i++) {
      const e = TL[i];
      const next = TL[i + 1];
      const inHalf = i > 0 ? e.tr.dur / 2 : 0;
      const outHalf = next ? next.tr.dur / 2 : 0;
      const visible = t >= e.start - inHalf && t <= e.end + outHalf + (next ? 0 : 1);
      e.el.style.display = visible ? "block" : "none";
      if (!visible) continue;
      const lt = t - e.start;
      // transición de entrada / salida
      let pin = 1, pout = 0;
      if (i > 0 && lt < inHalf) pin = clamp((lt + inHalf) / e.tr.dur);
      if (next && t > e.end - outHalf) pout = clamp((t - (e.end - outHalf)) / next.tr.dur);
      window.SceneTransition.apply(e.el, pin, pout, e.tr, next ? next.tr : null);
      e.cam.style.transform = cameraTransform(e, lt);
      for (const n of e.nodes) n.update(lt);
    }
    return t;
  }

  /* ---------- QA ---------- */
  function qa(t) {
    seek(t);
    const out = [];
    for (const e of state.timeline) {
      if (e.el.style.display === "none") continue;
      for (const n of e.nodes) {
        if (!n.el) continue;
        const r = n.el.getBoundingClientRect();
        const op = n.visibility ? n.visibility(t - e.start) : 1;
        const texts = [...n.el.querySelectorAll("[data-qa-text]")].concat(n.el.matches("[data-qa-text]") ? [n.el] : []);
        let minFont = Infinity, clipped = false;
        for (const tx of texts) {
          const tr = tx.getBoundingClientRect();
          const k = tx.offsetWidth ? tr.width / tx.offsetWidth : 1; // escala efectiva (cámara + capa)
          const fs = parseFloat(getComputedStyle(tx).fontSize) * k;
          if (tr.width > 0) minFont = Math.min(minFont, fs);
          if (tx.scrollWidth > tx.clientWidth + 2 && getComputedStyle(tx).overflow !== "visible") clipped = true;
        }
        out.push({
          id: n.id, kind: n.kind, scene: e.id, role: n.role || "deco",
          x: r.left, y: r.top, w: r.width, h: r.height,
          opacity: op, minFont: isFinite(minFont) ? minFont : null,
          maxFont: n.fontSize || null, clipped: clipped || !!(n.overflow && n.overflow()),
          settle: e.start + (n.settle ?? 0), exit: n.exit != null ? e.start + n.exit : null,
        });
      }
    }
    return out;
  }

  function info() {
    if (!state.built) build();
    return {
      duration: state.duration, fps: state.meta.fps, meta: state.meta, safe: SAFE, width: W, height: H,
      scenes: state.timeline.map((e) => ({
        id: e.id, start: e.start, end: e.end, dur: e.dur, vo: e.opts.vo || null, voAt: e.voAt, voDur: e.voDur,
        settle: Math.max(0, ...e.nodes.map((n) => n.settle ?? 0)),
        items: e.nodes.map((n) => ({
          id: n.id, kind: n.kind, role: n.role, settle: n.settle, exit: n.exit,
          x: n.opts.x || 0, y: n.opts.y || 0, size: n.opts.size ?? null, scale: n.opts.scale ?? 1, fontSize: n.fontSize ?? null,
        })),
      })),
    };
  }

  window.Engine = { M, W, H, SAFE, placeStyle, scene, state };
  window.scene = scene;
  window.__seek = (t) => seek(t);
  window.__info = info;
  window.__cues = () => { if (!state.built) build(); return state.cues; };
  window.__qa = qa;
  window.__ready = false;
  window.__boot = async function () {
    await document.fonts.ready;
    // fuerza la carga de todas las variantes declaradas
    await Promise.all([...document.fonts].map((f) => f.load().catch(() => null)));
    build();
    seek(0);
    window.__ready = true;
  };
})();
