/* =========================================================================
   Temas de color + fondo diseñado (sin imágenes).
   COLORS en la escena puede ser:
     "midnight"                              → tema por nombre
     { theme: "ocean", accent: "#4DA3FF" }   → tema + overrides
   ========================================================================= */
(function () {
  "use strict";

  const THEMES = {
    // Negro azulado + menta. Tema por defecto.
    midnight: { mode: "dark", bg0: "#04060B", bg1: "#0A1020", ink: "#F3F6FB", muted: "#8E97AB", accent: "#5CF2B0", accent2: "#7C8CFF", warn: "#FF6B6B" },
    // Blanco cálido + azul tinta. Para versiones claras.
    ivory: { mode: "light", bg0: "#F6F4EF", bg1: "#E9E6DE", ink: "#0E1015", muted: "#5D6270", accent: "#1F5BFF", accent2: "#0FAF7A", warn: "#E5484D" },
    emerald: { mode: "dark", bg0: "#020D09", bg1: "#062118", ink: "#ECFFF6", muted: "#86A99A", accent: "#34E3A0", accent2: "#B8F25C", warn: "#FF7A6B" },
    ocean: { mode: "dark", bg0: "#030916", bg1: "#07193A", ink: "#EEF5FF", muted: "#8A9BB8", accent: "#4DA3FF", accent2: "#66E3FF", warn: "#FF6B81" },
    violet: { mode: "dark", bg0: "#08050F", bg1: "#170E2E", ink: "#F6F2FF", muted: "#9B92B5", accent: "#A78BFA", accent2: "#F0ABFC", warn: "#FB7185" },
    gold: { mode: "dark", bg0: "#080705", bg1: "#1A150C", ink: "#F7F3EA", muted: "#A39A86", accent: "#E3B664", accent2: "#F5D9A0", warn: "#F2775F" },
    // Combinación moderna: menta + violeta.
    aurora: { mode: "dark", bg0: "#05060F", bg1: "#0E1030", ink: "#F4F5FF", muted: "#9096B4", accent: "#7CF2C2", accent2: "#A78BFA", warn: "#FF7A90" },
  };

  function hexToRgb(h) {
    const v = h.replace("#", "");
    const n = parseInt(v.length === 3 ? v.split("").map((c) => c + c).join("") : v, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const rgba = (h, a) => { const [r, g, b] = hexToRgb(h); return `rgba(${r},${g},${b},${a})`; };

  function resolve(colors) {
    if (typeof colors === "string") return Object.assign({}, THEMES[colors] || THEMES.midnight);
    const base = THEMES[(colors && colors.theme) || "midnight"] || THEMES.midnight;
    return Object.assign({}, base, colors || {});
  }

  function apply(colors) {
    const th = resolve(colors);
    const dark = th.mode !== "light";
    const r = document.documentElement.style;
    r.setProperty("--bg0", th.bg0);
    r.setProperty("--bg1", th.bg1);
    r.setProperty("--ink", th.ink);
    r.setProperty("--muted", th.muted);
    r.setProperty("--accent", th.accent);
    r.setProperty("--accent2", th.accent2);
    r.setProperty("--warn", th.warn);
    r.setProperty("--accent-soft", rgba(th.accent, dark ? 0.14 : 0.12));
    r.setProperty("--accent-line", rgba(th.accent, 0.45));
    r.setProperty("--warn-soft", rgba(th.warn, 0.14));
    r.setProperty("--glow", rgba(th.accent, dark ? 0.22 : 0.16));
    r.setProperty("--glow2", rgba(th.accent2, dark ? 0.16 : 0.12));
    r.setProperty("--glow-warn", rgba(th.warn, dark ? 0.2 : 0.14));
    r.setProperty("--card", dark ? "rgba(255,255,255,0.045)" : "rgba(255,255,255,0.72)");
    r.setProperty("--card-strong", dark ? "rgba(255,255,255,0.075)" : "rgba(255,255,255,0.92)");
    r.setProperty("--card-border", dark ? "rgba(255,255,255,0.10)" : "rgba(14,16,21,0.08)");
    r.setProperty("--line", dark ? "rgba(255,255,255,0.08)" : "rgba(14,16,21,0.08)");
    r.setProperty("--shadow", dark ? "0 40px 90px rgba(0,0,0,0.55), 0 8px 24px rgba(0,0,0,0.35)" : "0 40px 80px rgba(20,24,40,0.14), 0 6px 18px rgba(20,24,40,0.08)");
    r.setProperty("--grain", dark ? "0.06" : "0.035");
    r.setProperty("--on-accent", dark ? "#04110B" : "#FFFFFF");
    document.documentElement.dataset.mode = th.mode;
    window.Themes.current = th;
    return th;
  }

  /* ---------------------------------------------------------------------
     Fondo continuo: persiste entre escenas para dar sensación de espacio.
     Capas: base → glows volumétricos → anillos → grilla → partículas → grano → viñeta
     Cada escena puede pedir opts.bg = { glow:[x,y], tint:"accent"|"warn"|"accent2", rings:0..1, grid:0..1, intensity }
     y el fondo interpola entre estados.
     --------------------------------------------------------------------- */
  const Background = {
    create(stage, meta) {
      const M = window.Engine.M;
      const el = document.createElement("div");
      el.className = "bg";
      el.innerHTML = `
        <div class="bg-base"></div>
        <div class="bg-glow g1"></div>
        <div class="bg-glow g2"></div>
        <div class="bg-glow g3"></div>
        <svg class="bg-rings" viewBox="-540 -960 1080 1920" preserveAspectRatio="xMidYMid slice"></svg>
        <div class="bg-grid"></div>
        <div class="bg-particles"></div>`;
      stage.appendChild(el);
      // grano y viñeta van por encima de las escenas
      const fx = document.createElement("div");
      fx.className = "fx";
      fx.innerHTML = `<div class="bg-grain"></div><div class="bg-vignette"></div>`;
      stage.appendChild(fx);

      const rings = el.querySelector(".bg-rings");
      const ringR = [180, 300, 440, 600, 790, 1010];
      rings.innerHTML = ringR.map((r, i) =>
        `<circle r="${r}" fill="none" stroke="var(--ink)" stroke-opacity="${0.07 - i * 0.008}" stroke-width="1.5" ${i % 2 ? 'stroke-dasharray="2 10"' : ""}/>`
      ).join("") + `<circle class="ring-arc" r="440" fill="none" stroke="var(--accent)" stroke-opacity="0.35" stroke-width="2" stroke-linecap="round" stroke-dasharray="120 2645"/>`;

      const parts = el.querySelector(".bg-particles");
      const R = M.rng(7);
      const P = [];
      for (let i = 0; i < 26; i++) {
        const d = document.createElement("i");
        const p = { x: R() * 1080, y: R() * 1920, z: 0.3 + R() * 0.9, s: 2 + R() * 3, ph: R() * 6.28, sp: 6 + R() * 14 };
        d.style.width = d.style.height = p.s + "px";
        parts.appendChild(d);
        P.push([d, p]);
      }

      const g1 = el.querySelector(".g1"), g2 = el.querySelector(".g2"), g3 = el.querySelector(".g3");
      const grid = el.querySelector(".bg-grid"), grain = fx.querySelector(".bg-grain");
      const arc = el.querySelector(".ring-arc");
      const DEF = { glow: [0, -220], glow2: [260, 520], intensity: 1, tint: 0, rings: 0.6, grid: 0.35, ringScale: 1 };

      function sceneState(e) {
        const b = Object.assign({}, DEF, (e && e.opts.bg) || {});
        b.tint = b.tint === "warn" ? 1 : typeof b.tint === "number" ? b.tint : 0;
        return b;
      }
      function mix(a, b, p) {
        const o = {};
        for (const k in a) o[k] = Array.isArray(a[k]) ? a[k].map((v, i) => M.lerp(v, b[k][i], p)) : M.lerp(a[k], b[k], p);
        return o;
      }

      return {
        el,
        update(t, TL) {
          // estado interpolado entre la escena anterior y la actual (0,9 s)
          let i = TL.findIndex((e) => t >= e.start && t < e.end);
          if (i < 0) i = TL.length - 1;
          const cur = sceneState(TL[i]);
          const prev = i > 0 ? sceneState(TL[i - 1]) : cur;
          const p = M.ease.inOutCubic(M.clamp((t - TL[i].start + 0.25) / 0.9));
          const s = mix(prev, cur, p);

          const drift = (f, a) => Math.sin(t * f) * a;
          g1.style.transform = `translate(${s.glow[0] + drift(0.31, 40)}px, ${s.glow[1] + drift(0.23, 50)}px) scale(${1 + drift(0.4, 0.06)})`;
          g1.style.opacity = 0.9 * s.intensity * (1 - s.tint);
          g3.style.transform = `translate(${s.glow[0] + drift(0.27, 30)}px, ${s.glow[1] + drift(0.21, 40)}px)`;
          g3.style.opacity = 0.95 * s.intensity * s.tint;
          g2.style.transform = `translate(${s.glow2[0] + drift(0.19, 60)}px, ${s.glow2[1] + drift(0.25, 40)}px)`;
          g2.style.opacity = 0.75 * s.intensity;
          rings.style.opacity = s.rings;
          rings.style.transform = `scale(${s.ringScale * (1 + t * 0.004)}) rotate(${t * 2.2}deg)`;
          arc.style.strokeDashoffset = -t * 90;
          grid.style.opacity = s.grid;
          grid.style.backgroundPosition = `0px ${(t * 14) % 120}px`;
          for (const [d, q] of P) {
            const y = ((q.y - t * q.sp * q.z) % 1920 + 1920) % 1920;
            const x = q.x + Math.sin(t * 0.5 + q.ph) * 14 * q.z;
            d.style.transform = `translate(${x}px, ${y}px)`;
            d.style.opacity = (0.15 + 0.35 * q.z) * (0.6 + 0.4 * Math.sin(t * 1.3 + q.ph));
          }
          // grano: desplazamiento pseudoaleatorio por frame (determinista)
          const f = Math.floor(t * 24);
          grain.style.backgroundPosition = `${(f * 137) % 256}px ${(f * 91) % 256}px`;
        },
      };
    },
  };

  window.Themes = { THEMES, apply, resolve, rgba };
  window.Background = Background;
})();
