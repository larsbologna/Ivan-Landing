/* Idea 4 · Redes sociales vs. web propia */
const BRAND = "PRESENCE";
const TAGLINE = "Gestión de presencia online · Argentina";
const CTA = "Escribime por WhatsApp";
const COLORS = "violet";
const DURATION = 20.5;

scene("gancho", 2.6, [
  TextReveal({ text: "Instagram\n*no es tu web*.", size: 140, weight: 800, y: -40, role: "hero", cue: "impact" }),
], { camera: { from: { z: -140 }, to: { z: 60 } } });

scene("redes", 4.6, [
  Eyebrow({ text: "En redes", y: -690 }),
  TextReveal({ text: "Estás *alquilando*.", size: 116, accent: "warn", y: -540 }),
  HexFeature({ icon: "trend", label: "Algoritmo", tone: "warn", at: 0.8, x: -240, y: -40 }),
  HexFeature({ icon: "eye", label: "Info perdida", tone: "warn", at: 1.2, x: 240, y: -40, z: -40 }),
  HexFeature({ icon: "search", label: "Difícil de encontrar", tone: "warn", at: 1.6, x: 0, y: 340, labelSize: 46, z: 40 }),
], { camera: { from: { z: -60, ry: -5 }, to: { z: 40, ry: 4 } }, bg: { tint: "warn" } });

scene("web", 4.6, [
  Eyebrow({ text: "Tu web", y: -690 }),
  TextReveal({ text: "Es *tuya*.", size: 150, y: -540 }),
  UICard({ kind: "web", at: 0.7, width: 820, y: 140, z: 40, glow: true, float: 6 }),
], { transition: { type: "push" }, camera: { from: { z: -80, rx: 6 }, to: { z: 30 } } });

scene("ambas", 4.4, [
  TextReveal({ text: "Usá las dos,\n*bien conectadas*:", size: 100, y: -540 }),
  PillCascade({ at: 0.9, y: 140, items: [
    { icon: "grid", text: "Redes para mostrarte" },
    { icon: "web", text: "Web para decidir" },
    { icon: "chat", text: "WhatsApp para cerrar", hl: true },
  ] }),
], { camera: { from: { z: -90, rx: 8 }, to: { z: 30 } } });

scene("cierre", null, [OutroBrand({ at: 0.15, y: -40 })]);
