/* Idea 5 · Primera impresión online (tema claro) */
const BRAND = "PRESENCE";
const TAGLINE = "Gestión de presencia online · Argentina";
const CTA = "Escribime por WhatsApp";
const COLORS = "ivory";
const DURATION = 20;

scene("gancho", 3.0, [
  TextReveal({ text: "No hay segunda\n*primera impresión*.", size: 120, weight: 800, y: -40, role: "hero", cue: "impact" }),
], { camera: { from: { z: -140 }, to: { z: 60 } } });

scene("busqueda", 4.4, [
  TextReveal({ text: "Y hoy pasa\n*en la pantalla*.", size: 104, y: -540 }),
  Typewriter({ text: "tu negocio", at: 0.6, variant: "search", width: 820, size: 48, y: -180, z: 40, placeholder: "Buscar" }),
  UICard({ kind: "web", at: 1.7, width: 820, y: 280, rx: 8, float: 6 }),
], { camera: { from: { z: -80, rx: 4 }, to: { z: 30 } } });

scene("mensaje", 4.6, [
  Eyebrow({ text: "Lo que tiene que decir", y: -690 }),
  TextReveal({ text: "\"Esto está\n*bien hecho*.\"", size: 120, y: -530 }),
  PillCascade({ at: 1.0, y: 170, items: [
    { icon: "eye", text: "Se entiende rápido" },
    { icon: "star", text: "Se ve profesional" },
    { icon: "chat", text: "Te contactan fácil", hl: true },
  ] }),
], { transition: { type: "push" }, camera: { from: { z: -90, rx: 8 }, to: { z: 30 } } });

scene("remate", 3.4, [
  TextReveal({ text: "La primera impresión es", size: 70, color: "muted", y: -330, role: "body", cue: null }),
  KeywordCircle({ text: "online", at: 0.3, size: 200, y: -110 }),
], { transition: { type: "zoom" }, camera: { from: { z: -140 }, to: { z: 70 } }, bg: { rings: 1, ringScale: 0.7 } });

scene("cierre", null, [OutroBrand({ at: 0.15, y: -40 })]);
