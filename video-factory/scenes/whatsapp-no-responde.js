/* Idea 3 · WhatsApp que no responde */
const BRAND = "Iván Bologna";
const TAGLINE = "Gestor de presencia online · Argentina";
const CTA = "Escribime por WhatsApp";
const COLORS = "emerald";
const DURATION = [15, 20];
const VOICE = { voice: "em_alex", speed: 1.15 };

scene("gancho", null, [
  TextReveal({ text: "Te escribieron\na las *21:47*.", size: 124, weight: 800, y: -40, role: "hero", cue: "impact" }),
], { vo: "Te escribieron a las nueve y cuarenta y siete de la noche.", voAt: 0.2, hold: 0.2, camera: { from: { z: -140 }, to: { z: 60 } } });

scene("chat", null, [
  UICard({ kind: "chat", at: 0.0, width: 820, y: -150, z: 40, float: 6, data: { name: "Tu negocio", sub: "últ. vez hoy 18:02", messages: [["in", "Hola, ¿tienen turno mañana?"], ["in", "¿Hola?"], ["in", "Bueno, gracias igual"]] } }),
  TextReveal({ text: "Nadie *contestó*.", size: 100, accent: "warn", y: 430, at: 1.5 }),
], { vo: "Nadie contestó. Para la mañana, ya había elegido a otro.", voAt: 0.05, hold: 0.4, camera: { from: { z: -80, rx: 4 }, to: { z: 30 } }, bg: { tint: "warn" } });

scene("solucion", null, [
  TextReveal({ text: "Que nadie\n*se quede esperando*:", size: 100, y: -540 }),
  PillCascade({ at: 0.5, stagger: 0.32, y: 170, items: [
    { icon: "chat", text: "Mensaje de bienvenida" },
    { icon: "spark", text: "Respuestas rápidas" },
    { icon: "clock", text: "Horarios a la vista", hl: true },
  ] }),
], { vo: "Ordenamos tu WhatsApp para que nadie se quede esperando.", voAt: 0.05, hold: 0.45, transition: { type: "push" }, camera: { from: { z: -90, rx: 8 }, to: { z: 30 } } });

scene("cierre", null, [OutroBrand({ at: 0.0, y: -40 })], { vo: "Soy Iván Bologna. Escribime por WhatsApp.", voAt: 0.2, hold: 0.9, transition: { type: "zoom" }, camera: { from: { z: -60 }, to: { z: 20 }, breathe: 0.5 } });
