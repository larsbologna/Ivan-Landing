/* Idea 10 · QR / NFC para pedir reseñas */
const BRAND = "Iván Bologna";
const TAGLINE = "Gestor de presencia online · Argentina";
const CTA = "Escribime por WhatsApp";
const COLORS = "aurora";
const DURATION = [15, 20];
const VOICE = { voice: "em_alex", speed: 1.15 };

scene("gancho", null, [
  TextReveal({ text: "Pedir reseñas\nno tiene que ser *incómodo*.", size: 110, weight: 800, y: -40, role: "hero", cue: "impact" }),
], { vo: "Pedir reseñas no tiene que ser incómodo.", voAt: 0.2, hold: 0.25, camera: { from: { z: -140 }, to: { z: 60 } } });

scene("qr", null, [
  Glyph({ icon: "qr", size: 300, at: 0.0, x: -200, y: -260, cue: "pop", float: 6 }),
  Glyph({ icon: "phone", size: 300, at: 0.9, x: 200, y: -260, cue: "pop", float: 6, phase: 1 }),
  TextReveal({ text: "Un *QR* en el mostrador\no un *toque* con el celular.", size: 84, y: 160, at: 0.2 }),
], { vo: "Un QR en el mostrador, o un toque con el celular.", voAt: 0.05, hold: 0.4, camera: { from: { z: -80 }, to: { z: 40 } }, bg: { glow: [0, -260], rings: 0.9, ringScale: 0.7 } });

scene("resena", null, [
  TextReveal({ text: "Y la reseña\n*queda publicada*.", size: 100, y: -560 }),
  UICard({ kind: "review", at: 0.4, width: 820, y: 120, z: 40, float: 6, glow: true }),
], { vo: "Y la reseña queda publicada, sin pedir de más.", voAt: 0.05, hold: 0.5, transition: { type: "push" }, camera: { from: { z: -80, ry: 4 }, to: { z: 30, ry: -3 } } });

scene("cierre", null, [OutroBrand({ at: 0.0, y: -40 })], { vo: "Soy Iván Bologna. Escribime por WhatsApp.", voAt: 0.2, hold: 0.9, transition: { type: "zoom" }, camera: { from: { z: -60 }, to: { z: 20 }, breathe: 0.5 } });
