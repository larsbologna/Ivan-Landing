/* Idea 5 · Primera impresión online (tema claro) */
const BRAND = "Iván Bologna";
const TAGLINE = "Gestor de presencia online · Argentina";
const CTA = "Escribime por WhatsApp";
const COLORS = "ivory";
const DURATION = [15, 20];
const VOICE = { voice: "em_alex", speed: 1.15 };

scene("gancho", null, [
  TextReveal({ text: "No hay segunda\n*primera impresión*.", size: 120, weight: 800, y: -40, role: "hero", cue: "impact" }),
], { vo: "No hay segunda primera impresión.", voAt: 0.2, hold: 0.25, camera: { from: { z: -140 }, to: { z: 60 } } });

scene("busqueda", null, [
  TextReveal({ text: "Y hoy pasa\n*en la pantalla*.", size: 104, y: -540 }),
  Typewriter({ text: "tu negocio", at: 0.3, cps: 18, variant: "search", width: 820, size: 48, y: -200, z: 40, placeholder: "Buscar" }),
  UICard({ kind: "web", at: 1.1, width: 820, y: 270, rx: 8, float: 6 }),
], { vo: "Y hoy, esa impresión pasa en la pantalla del celular.", voAt: 0.05, hold: 0.35, camera: { from: { z: -80, rx: 4 }, to: { z: 30 } } });

scene("mensaje", null, [
  TextReveal({ text: "Que diga:\n\"Esto está *bien hecho*.\"", size: 100, y: -530 }),
  PillCascade({ at: 0.5, stagger: 0.32, y: 170, items: [
    { icon: "eye", text: "Se entiende rápido" },
    { icon: "star", text: "Se ve profesional" },
    { icon: "chat", text: "Te contactan fácil", hl: true },
  ] }),
], { vo: "Lo que ven tiene que decir: esto está bien hecho.", voAt: 0.05, hold: 0.45, transition: { type: "push" }, camera: { from: { z: -90, rx: 8 }, to: { z: 30 } } });

scene("cierre", null, [OutroBrand({ at: 0.0, y: -40 })], { vo: "Soy Iván Bologna. Escribime por WhatsApp.", voAt: 0.2, hold: 0.9, transition: { type: "zoom" }, camera: { from: { z: -60 }, to: { z: 20 }, breathe: 0.5 } });
