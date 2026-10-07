/* Video demo: "Tu presencia online" · versión corta con locución (15–20 s)
   Cada escena con `vo` y duración null dura lo que tarda la voz en decir su frase.
   Coordenadas: x/y en px desde el centro de la pantalla (1080×1920). y negativo = arriba.
   Zona segura para texto: y entre -760 y +600. */

const BRAND = "Iván Bologna";
const TAGLINE = "Gestor de presencia online · Argentina";
const CTA = "Escribime por WhatsApp";
const COLORS = "midnight";
const DURATION = [15, 20];
const VOICE = { voice: "em_alex", speed: 1.15 };

/* ---------- GANCHO ---------- */
scene("gancho", null, [
  TextReveal({ text: "Atención.", at: 0.0, size: 190, weight: 800, y: -330, role: "hero", cue: "impact", cueGain: 0.9, stagger: 0, wordDur: 0.45, blur: 30, rise: 50 }),
  TextReveal({ text: "Si tenés un negocio,\n*mirá esto.*", at: 0.35, size: 104, weight: 800, y: 60, role: "headline", stagger: 0.09, wordCue: "tick", cue: null }),
], { vo: "Si tenés un negocio, mirá esto.", voAt: 0.25, hold: 0.1,
     camera: { from: { z: -140 }, to: { z: 60 }, ease: "outCubic" }, bg: { glow: [0, -160], rings: 0.9, ringScale: 0.85 } });

/* ---------- PROBLEMA ---------- */
scene("cinco", null, [
  TextReveal({ text: "Te *googlean* y deciden\nen 5 segundos.", at: 0.0, size: 84, y: -590, role: "headline" }),
  Typewriter({ text: "tu negocio", at: 0.0, cps: 18, variant: "search", width: 820, size: 46, y: -330, z: 40, placeholder: "Buscar en Google" }),
  ProgressRing({ at: 0.7, dur: 1.8, from: 0, to: 5, suffix: "s", diameter: 520, numberSize: 210, y: 170, label: "¿confío o no?" }),
], { vo: "Te googlean, y en cinco segundos deciden si confiar en vos.", voAt: 0.05, hold: 0.15,
     transition: { type: "zoom" }, camera: { from: { z: -60, y: -20 }, to: { z: 60, y: 20 } }, bg: { glow: [0, 150], rings: 1, ringScale: 0.6, grid: 0.2 } });

/* ---------- PÉRDIDAS ---------- */
scene("perdes", null, [
  TextReveal({ text: "Si tu presencia está\ndescuidada, *perdés:*", at: 0.0, size: 92, weight: 800, accent: "warn", y: -560, role: "headline", stagger: 0.06 }),
  HexFeature({ icon: "users", label: "Clientes", tone: "warn", badge: "down", at: 1.45, x: -250, y: 20, float: 5 }),
  HexFeature({ icon: "shield", label: "Reputación", tone: "warn", badge: "down", at: 1.85, x: 250, y: 20, z: -60, float: 5, phase: 1.2, cuePitch: 1.1 }),
  HexFeature({ icon: "trend", label: "Ventas", tone: "warn", badge: "down", at: 2.3, x: 0, y: 380, z: 40, float: 5, phase: 2.4, cuePitch: 1.2 }),
], { vo: "Si tu presencia está descuidada, perdés clientes, reputación y ventas.", voAt: 0.05, hold: 0.2,
     camera: { from: { z: -60, ry: -6 }, to: { z: 40, ry: 5 } }, bg: { tint: "warn", glow: [0, 100], rings: 0.4, grid: 0.25 } });

/* ---------- SOLUCIÓN ---------- */
scene("ordeno", null, [
  TextReveal({ text: "Te ordeno *todo*:", at: 0.0, size: 112, y: -580, role: "headline" }),
  PillCascade({
    at: 0.5, stagger: 0.32, size: 50, width: 820, y: 110, ry: -4,
    items: [
      { icon: "web", text: "Web clara" },
      { icon: "pin", text: "Google Maps al día" },
      { icon: "star", text: "Reseñas reales" },
      { icon: "chat", text: "WhatsApp directo" },
      { icon: "layers", text: "Todo en un solo lugar", hl: true },
    ],
  }),
], { vo: "Yo te ordeno todo: web, Google Maps, reseñas y WhatsApp.", voAt: 0.05, hold: 0.2,
     transition: { type: "push" }, camera: { from: { z: -90, rx: 8 }, to: { z: 30, rx: 0 } }, bg: { glow: [-150, 0], glow2: [300, -500], rings: 0.5 } });

/* ---------- IDEA CENTRAL ---------- */
scene("palanca", null, [
  TextReveal({ text: "No es un gasto.", at: 0.0, size: 96, color: "muted", y: -400, role: "body", marks: { gasto: "strike" }, markAt: 0.55, cue: null }),
  KeywordCircle({ text: "palanca", at: 0.9, size: 200, y: -120, circleAt: 1.2 }),
  Lever({ at: 0.7, y: 250, width: 640 }),
], { vo: "No es un gasto. Es palanca.", voAt: 0.05, hold: 0.45,
     transition: { type: "blur" }, camera: { from: { z: -120 }, to: { z: 70 } }, bg: { glow: [0, -110], rings: 1, ringScale: 0.7, intensity: 1.3 } });

/* ---------- CIERRE ---------- */
scene("cierre", null, [
  OutroBrand({ at: 0.0, y: -40 }),
], { vo: "Soy Iván Bologna. Escribime por WhatsApp.", voAt: 0.2, hold: 0.9,
     transition: { type: "zoom", sound: "whoosh" }, camera: { from: { z: -60 }, to: { z: 20 }, breathe: 0.5 }, bg: { glow: [0, -300], glow2: [0, 500], rings: 0.7 } });
