/* Idea 10 · QR / NFC para pedir reseñas */
const BRAND = "PRESENCE";
const TAGLINE = "Gestión de presencia online · Argentina";
const CTA = "Escribime por WhatsApp";
const COLORS = "aurora";
const DURATION = 22;

scene("gancho", 2.8, [
  TextReveal({ text: "Pedir reseñas\nno tiene que ser *incómodo*.", size: 110, weight: 800, y: -40, role: "hero", cue: "impact" }),
], { camera: { from: { z: -140 }, to: { z: 60 } } });

scene("qr", 3.6, [
  Glyph({ icon: "qr", size: 340, at: 0.1, y: -260, cue: "pop", float: 6 }),
  TextReveal({ text: "Un *QR* en el mostrador.", size: 96, y: 160, at: 0.5 }),
], { camera: { from: { z: -80 }, to: { z: 40 } }, bg: { glow: [0, -260], rings: 0.9, ringScale: 0.7 } });

scene("nfc", 3.6, [
  Glyph({ icon: "phone", size: 340, at: 0.1, y: -260, cue: "pop", float: 6 }),
  TextReveal({ text: "O un *toque* con el celular.", size: 96, y: 160, at: 0.5 }),
], { transition: { type: "push" }, camera: { from: { z: -80 }, to: { z: 40 } }, bg: { glow: [0, -260], rings: 0.9, ringScale: 0.7 } });

scene("resena", 4.0, [
  TextReveal({ text: "Y la reseña\n*queda publicada*.", size: 100, y: -560 }),
  UICard({ kind: "review", at: 0.8, width: 820, y: 120, z: 40, float: 6, glow: true }),
], { transition: { type: "push" }, camera: { from: { z: -80, ry: 4 }, to: { z: 30, ry: -3 } } });

scene("remate", 3.4, [
  TextReveal({ text: "Más reseñas reales,\n*sin pedir de más*.", size: 100, y: -60 }),
], { transition: { type: "zoom" }, camera: { from: { z: -60 }, to: { z: 60 } } });

scene("cierre", null, [OutroBrand({ at: 0.15, y: -40 })]);
