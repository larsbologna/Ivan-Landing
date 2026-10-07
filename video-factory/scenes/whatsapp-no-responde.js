/* Idea 3 · WhatsApp que no responde */
const BRAND = "PRESENCE";
const TAGLINE = "Gestión de presencia online · Argentina";
const CTA = "Escribime por WhatsApp";
const COLORS = "emerald";
const DURATION = 24.5;

scene("gancho", 2.6, [
  TextReveal({ text: "Te escribieron\na las *21:47*.", size: 124, weight: 800, y: -40, role: "hero", cue: "impact" }),
], { camera: { from: { z: -140 }, to: { z: 60 } } });

scene("chat", 4.4, [
  UICard({ kind: "chat", at: 0.2, width: 820, y: -120, z: 40, float: 6, data: { name: "Tu negocio", sub: "últ. vez hoy 18:02", messages: [["in", "Hola, ¿tienen turno mañana?"], ["in", "¿Hola?"], ["in", "Bueno, gracias igual"]] } }),
  TextReveal({ text: "Nadie *contestó*.", size: 100, accent: "warn", y: 430, at: 2.2 }),
], { camera: { from: { z: -80, rx: 4 }, to: { z: 30 } }, bg: { tint: "warn" } });

scene("horas", 4.6, [
  TextReveal({ text: "Pasaron *12 horas*\nsin respuesta.", size: 96, y: -560 }),
  ProgressRing({ at: 0.8, dur: 3.0, from: 0, to: 12, suffix: "h", diameter: 580, numberSize: 220, y: 150 }),
], { camera: { from: { z: -40 }, to: { z: 80 } }, bg: { tint: "warn", rings: 1, ringScale: 0.62 } });

scene("otro", 3.2, [
  TextReveal({ text: "Para ese momento,\nya *eligió a otro*.", size: 108, y: -60 }),
], { transition: { type: "zoom" }, camera: { from: { z: -60 }, to: { z: 60 } } });

scene("solucion", 5.2, [
  Eyebrow({ text: "WhatsApp ordenado", y: -690 }),
  TextReveal({ text: "Que nadie\n*se quede esperando*:", size: 100, y: -530 }),
  PillCascade({ at: 1.0, y: 170, items: [
    { icon: "chat", text: "Mensaje de bienvenida" },
    { icon: "spark", text: "Respuestas rápidas" },
    { icon: "grid", text: "Catálogo claro" },
    { icon: "clock", text: "Horarios a la vista", hl: true },
  ] }),
], { transition: { type: "push" }, camera: { from: { z: -90, rx: 8 }, to: { z: 30 } } });

scene("cierre", null, [OutroBrand({ at: 0.15, y: -40 })]);
