/* Video demo: "Tu presencia online"
   Coordenadas: x/y en px desde el centro de la pantalla (1080×1920). y negativo = arriba.
   Zona segura para texto: y entre -760 y +600. */

const BRAND = "PRESENCE";
const TAGLINE = "Gestión de presencia online · Argentina";
const CTA = "Escribime por WhatsApp";
const COLORS = "midnight";
const DURATION = 38.4;

/* ---------- GANCHO ---------- */
scene("atencion", 1.8, [
  TextReveal({ text: "Atención.", at: 0.12, size: 210, weight: 800, y: -40, role: "hero", cue: "impact", cueGain: 0.9, stagger: 0, wordDur: 0.7, blur: 30, rise: 60 }),
], { camera: { from: { z: -160 }, to: { z: 60 }, ease: "outCubic" }, bg: { glow: [0, -60], rings: 0.9, ringScale: 0.85 } });

scene("mira", 2.8, [
  TextReveal({ text: "Si tenés un negocio,\n*mirá esto.*", at: 0.05, size: 124, weight: 800, y: -40, role: "hero", stagger: 0.11, wordCue: "tick" }),
], { transition: { type: "zoom" }, camera: { from: { z: -60, y: 20 }, to: { z: 70, y: -10 } }, bg: { glow: [120, -200], rings: 0.5 } });

/* ---------- PROBLEMA ---------- */
scene("googlea", 3.8, [
  Eyebrow({ text: "El primer contacto", at: 0.0, y: -690 }),
  TextReveal({ text: "Tu cliente\nte *googlea*.", at: 0.1, size: 124, weight: 800, y: -480, role: "headline" }),
  Typewriter({ text: "abierto ahora cerca de mí", at: 0.6, variant: "search", width: 880, size: 46, y: -150, z: 40, placeholder: "Buscar en Google" }),
  UICard({ kind: "results", at: 2.35, width: 880, y: 320, z: -40, rx: 10, float: 6 }),
], { camera: { from: { z: -80, y: -40, rx: 4 }, to: { z: 30, y: 30, rx: 0 } }, bg: { glow: [-200, -300], glow2: [300, 600] } });

scene("cinco", 5.0, [
  TextReveal({ text: "Y decide en *5 segundos*\nsi confiar en vos.", at: 0.05, size: 92, y: -560, role: "headline" }),
  ProgressRing({ at: 0.9, dur: 3.2, from: 0, to: 5, suffix: "s", diameter: 600, numberSize: 240, y: 150 }),
], { camera: { from: { z: -40 }, to: { z: 80 } }, bg: { glow: [0, 150], rings: 1, ringScale: 0.62, grid: 0.2 } });

/* ---------- PÉRDIDAS ---------- */
scene("perdes", 5.0, [
  TextReveal({ text: "Si tu presencia online\nestá descuidada,", at: 0.05, size: 76, weight: 700, color: "muted", y: -650, role: "body", stagger: 0.06 }),
  TextReveal({ text: "*perdés:*", at: 0.85, size: 180, weight: 800, accent: "warn", y: -420, role: "headline", cue: "impact", cueGain: 0.7, stagger: 0 }),
  HexFeature({ icon: "users", label: "Clientes", tone: "warn", badge: "down", at: 1.6, x: -250, y: 40, z: 0, float: 5 }),
  HexFeature({ icon: "shield", label: "Reputación", tone: "warn", badge: "down", at: 2.0, x: 250, y: 40, z: -60, float: 5, phase: 1.2, cuePitch: 1.1 }),
  HexFeature({ icon: "trend", label: "Ventas", tone: "warn", badge: "down", at: 2.4, x: 0, y: 410, z: 40, float: 5, phase: 2.4, cuePitch: 1.2 }),
], { camera: { from: { z: -60, ry: -6 }, to: { z: 40, ry: 5 } }, bg: { tint: "warn", glow: [0, 100], rings: 0.4, grid: 0.25 } });

/* ---------- SOLUCIÓN ---------- */
scene("cascada", 5.6, [
  Eyebrow({ text: "La solución", at: 0.0, y: -700 }),
  TextReveal({ text: "Te lo dejo *ordenado*:", at: 0.1, size: 104, y: -545, role: "headline" }),
  PillCascade({
    at: 1.0, stagger: 0.48, size: 50, width: 820, y: 140, ry: -4,
    items: [
      { icon: "web", text: "Web clara" },
      { icon: "pin", text: "Google Maps al día" },
      { icon: "star", text: "Reseñas reales" },
      { icon: "chat", text: "WhatsApp directo" },
      { icon: "grid", text: "Redes ordenadas" },
      { icon: "layers", text: "Todo en un solo lugar", hl: true },
    ],
  }),
], { transition: { type: "push" }, camera: { from: { z: -90, rx: 8 }, to: { z: 30, rx: 0 } }, bg: { glow: [-150, 0], glow2: [300, -500], rings: 0.5 } });

scene("unlugar", 4.0, [
  TextReveal({ text: "*Todo* en un solo lugar.", at: 0.05, size: 100, y: -620, role: "headline" }),
  UICard({ kind: "maps", at: 0.9, x: -330, y: -400, z: -560, ry: 16, width: 600, role: "deco", dim: 0.75, float: 8 }),
  UICard({ kind: "review", at: 1.2, x: 320, y: 660, z: -520, ry: -16, width: 600, role: "deco", dim: 0.75, float: 8, phase: 2 }),
  UICard({ kind: "web", at: 0.45, x: 0, y: 90, z: 90, width: 800, glow: true, float: 5, phase: 1, data: { title: "Tu negocio, claro y fácil de contactar." } }),
], { camera: { from: { z: -120, ry: 3 }, to: { z: 20, ry: -2 } }, bg: { glow: [0, 40], rings: 0.8, ringScale: 0.9 } });

/* ---------- IDEA CENTRAL ---------- */
scene("gasto", 2.8, [
  TextReveal({ text: "Tu presencia online\nno es un gasto.", at: 0.05, size: 112, y: -60, role: "headline", marks: { gasto: "strike" }, markAt: 1.5, markDim: true }),
], { transition: { type: "blur" }, camera: { from: { z: -40 }, to: { z: 60 } }, bg: { glow: [0, -100], rings: 0.3, grid: 0.15 } });

scene("palanca", 3.6, [
  TextReveal({ text: "Es", at: 0.0, size: 96, weight: 700, color: "muted", y: -330, role: "body", cue: null }),
  KeywordCircle({ text: "palanca", at: 0.2, size: 200, y: -110, circleAt: 0.75 }),
  Lever({ at: 1.25, y: 270, width: 680 }),
], { transition: { type: "zoom" }, camera: { from: { z: -140 }, to: { z: 70 } }, bg: { glow: [0, -110], rings: 1, ringScale: 0.7, intensity: 1.3 } });

/* ---------- CIERRE ---------- */
scene("cierre", null, [
  OutroBrand({ at: 0.15, y: -40, note: "Te respondo yo, sin vueltas." }),
], { transition: { type: "blur", sound: "whoosh" }, camera: { from: { z: -60 }, to: { z: 20 }, breathe: 0.5 }, bg: { glow: [0, -300], glow2: [0, 500], rings: 0.7 } });
