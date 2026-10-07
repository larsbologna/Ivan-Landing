/* Idea 7 · Reservas perdidas */
const BRAND = "PRESENCE";
const TAGLINE = "Gestión de presencia online · Argentina";
const CTA = "Escribime por WhatsApp";
const COLORS = "aurora";
const DURATION = 21;

scene("gancho", 2.8, [
  TextReveal({ text: "¿Cuántas reservas\nse te *escapan*?", size: 116, weight: 800, y: -40, role: "hero", cue: "impact" }),
], { camera: { from: { z: -140 }, to: { z: 60 } } });

scene("chat", 4.4, [
  UICard({ kind: "chat", at: 0.2, width: 820, y: -150, z: 40, float: 6, data: { sub: "últ. vez ayer", messages: [["in", "¿Tienen lugar el sábado?"], ["in", "Somos 4"], ["in", "Bueno, buscamos otro lado"]] } }),
  TextReveal({ text: "Mensaje sin responder\n= *turno vacío*.", size: 84, accent: "warn", y: 430, at: 2.2 }),
], { camera: { from: { z: -80, rx: 4 }, to: { z: 30 } }, bg: { tint: "warn" } });

scene("reserva", 4.6, [
  Eyebrow({ text: "La alternativa", y: -690 }),
  TextReveal({ text: "Que reserven\n*solos*, a cualquier hora.", size: 92, y: -530 }),
  UICard({ kind: "booking", at: 0.9, width: 820, y: 170, rx: 6, float: 6, glow: true }),
], { transition: { type: "push" }, camera: { from: { z: -80, rx: 6 }, to: { z: 30 } } });

scene("solucion", 4.8, [
  TextReveal({ text: "Sin llamadas.\n*Sin idas y vueltas.*", size: 100, y: -540 }),
  PillCascade({ at: 0.9, y: 150, items: [
    { icon: "calendar", text: "Agenda online" },
    { icon: "chat", text: "Confirmación por WhatsApp" },
    { icon: "clock", text: "Recordatorio automático", hl: true },
  ] }),
], { camera: { from: { z: -90, rx: 8 }, to: { z: 30 } } });

scene("cierre", null, [OutroBrand({ at: 0.15, y: -40 })]);
