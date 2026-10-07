/* Idea 9 · Cómo te eligen los clientes */
const BRAND = "PRESENCE";
const TAGLINE = "Gestión de presencia online · Argentina";
const CTA = "Escribime por WhatsApp";
const COLORS = "gold";
const DURATION = 26.5;

scene("gancho", 2.6, [
  TextReveal({ text: "Así te elige\nun *cliente*:", size: 130, weight: 800, y: -40, role: "hero", cue: "impact" }),
], { camera: { from: { z: -140 }, to: { z: 60 } } });

scene("paso1", 3.6, [
  Eyebrow({ text: "Paso 1", y: -690 }),
  TextReveal({ text: "*Busca.*", size: 160, y: -520 }),
  Glyph({ icon: "search", size: 260, at: 0.3, y: -150, float: 6 }),
  Typewriter({ text: "abierto ahora cerca", at: 0.6, variant: "search", width: 840, size: 48, y: 200, z: 40 }),
], { camera: { from: { z: -80 }, to: { z: 30 } } });

scene("paso2", 3.8, [
  Eyebrow({ text: "Paso 2", y: -690 }),
  TextReveal({ text: "*Compara.*", size: 160, y: -520 }),
  UICard({ kind: "results", at: 0.6, width: 860, y: 170, rx: 8, float: 6 }),
], { transition: { type: "push" }, camera: { from: { z: -80 }, to: { z: 30 } } });

scene("paso3", 3.8, [
  Eyebrow({ text: "Paso 3", y: -690 }),
  TextReveal({ text: "*Confía.*", size: 160, y: -520 }),
  UICard({ kind: "review", at: 0.6, width: 820, y: 130, z: 40, float: 6, glow: true }),
], { transition: { type: "push" }, camera: { from: { z: -80 }, to: { z: 30 } } });

scene("paso4", 4.4, [
  Eyebrow({ text: "Paso 4", y: -690 }),
  TextReveal({ text: "*Escribe.*", size: 160, y: -520 }),
  UICard({ kind: "chat", at: 0.6, width: 820, y: 150, z: 40, float: 6 }),
], { transition: { type: "push" }, camera: { from: { z: -80 }, to: { z: 30 } } });

scene("remate", 3.8, [
  TextReveal({ text: "Cada paso es una", size: 80, color: "muted", y: -330, role: "body", cue: null }),
  KeywordCircle({ text: "chance", at: 0.3, size: 200, y: -110 }),
  TextReveal({ text: "de ganarlo o perderlo.", size: 70, color: "muted", y: 140, at: 1.4, role: "body" }),
], { transition: { type: "zoom" }, camera: { from: { z: -140 }, to: { z: 70 } }, bg: { rings: 1, ringScale: 0.7 } });

scene("cierre", null, [OutroBrand({ at: 0.15, y: -40 })]);
