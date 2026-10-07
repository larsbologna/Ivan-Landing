/* Idea 7 · Reservas perdidas */
const BRAND = "Iván Bologna";
const TAGLINE = "Gestor de presencia online · Argentina";
const CTA = "Escribime por WhatsApp";
const COLORS = "aurora";
const DURATION = [15, 20];
const VOICE = { voice: "em_alex", speed: 1.15 };

scene("gancho", null, [
  TextReveal({ text: "¿Cuántas reservas\nse te *escapan*?", size: 116, weight: 800, y: -40, role: "hero", cue: "impact" }),
], { vo: "¿Cuántas reservas se te escapan?", voAt: 0.2, hold: 0.25, camera: { from: { z: -140 }, to: { z: 60 } } });

scene("chat", null, [
  UICard({ kind: "chat", at: 0.0, width: 820, y: -150, z: 40, float: 6, data: { sub: "últ. vez ayer", messages: [["in", "¿Tienen lugar el sábado?"], ["in", "Somos 4"], ["in", "Bueno, buscamos otro lado"]] } }),
  TextReveal({ text: "Mensaje sin responder\n= *turno vacío*.", size: 84, accent: "warn", y: 430, at: 1.6 }),
], { vo: "Cada mensaje sin responder es un turno vacío.", voAt: 0.05, hold: 0.5, camera: { from: { z: -80, rx: 4 }, to: { z: 30 } }, bg: { tint: "warn" } });

scene("reserva", null, [
  TextReveal({ text: "Que reserven\n*solos*, a toda hora.", size: 100, y: -530 }),
  UICard({ kind: "booking", at: 0.4, width: 820, y: 170, rx: 6, float: 6, glow: true }),
], { vo: "Con reservas online, te eligen a cualquier hora, sin llamar.", voAt: 0.05, hold: 0.4, transition: { type: "push" }, camera: { from: { z: -80, rx: 6 }, to: { z: 30 } } });

scene("cierre", null, [OutroBrand({ at: 0.0, y: -40 })], { vo: "Soy Iván Bologna. Escribime por WhatsApp.", voAt: 0.2, hold: 0.9, transition: { type: "zoom" }, camera: { from: { z: -60 }, to: { z: 20 }, breathe: 0.5 } });
