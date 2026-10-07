/* Idea 8 · Errores comunes en Google Business */
const BRAND = "PRESENCE";
const TAGLINE = "Gestión de presencia online · Argentina";
const CTA = "Escribime por WhatsApp";
const COLORS = "ocean";
const DURATION = 21;

scene("gancho", 2.8, [
  Eyebrow({ text: "Google Business", y: -260 }),
  TextReveal({ text: "5 errores que\n*te cuestan clientes*.", size: 110, weight: 800, y: -40, role: "hero", cue: "impact" }),
], { camera: { from: { z: -140 }, to: { z: 60 } } });

scene("lista", 6.4, [
  TextReveal({ text: "¿Cuántos *tenés*?", size: 110, y: -580 }),
  PillCascade({ at: 0.8, stagger: 0.6, y: 120, check: false, size: 48, items: [
    { icon: "clock", text: "Horarios desactualizados" },
    { icon: "grid", text: "Categoría equivocada" },
    { icon: "eye", text: "Sin fotos reales" },
    { icon: "star", text: "Reseñas sin responder" },
    { icon: "phone", text: "Teléfono que no atiende" },
  ] }),
], { camera: { from: { z: -90, rx: 8 }, to: { z: 30 } }, bg: { tint: "warn" } });

scene("remate", 3.4, [
  TextReveal({ text: "Todos tienen", size: 80, color: "muted", y: -330, role: "body", cue: null }),
  KeywordCircle({ text: "arreglo", at: 0.3, size: 200, y: -110 }),
], { transition: { type: "zoom" }, camera: { from: { z: -140 }, to: { z: 70 } }, bg: { rings: 1, ringScale: 0.7 } });

scene("ficha", 4.0, [
  TextReveal({ text: "Y tu ficha queda *así*:", size: 92, y: -600 }),
  UICard({ kind: "maps", at: 0.6, width: 820, y: 120, z: 40, float: 6, glow: true }),
], { transition: { type: "push" }, camera: { from: { z: -80 }, to: { z: 30 } } });

scene("cierre", null, [OutroBrand({ at: 0.15, y: -40 })]);
