/* Idea 2 · Google Maps abandonado */
const BRAND = "PRESENCE";
const TAGLINE = "Gestión de presencia online · Argentina";
const CTA = "Escribime por WhatsApp";
const COLORS = "ocean";
const DURATION = 25;

scene("gancho", 2.6, [
  TextReveal({ text: "Tu ficha de Google\nestá *abandonada*.", size: 112, weight: 800, y: -40, role: "hero", cue: "impact" }),
], { camera: { from: { z: -140 }, to: { z: 60 } } });

scene("ficha", 4.2, [
  Eyebrow({ text: "Lo que ve tu cliente", y: -690 }),
  TextReveal({ text: "Datos viejos.\nCero *señales de vida*.", size: 96, y: -530 }),
  UICard({ kind: "maps", at: 0.9, width: 820, y: 170, rx: 8, float: 6, data: { rating: "3,6", count: 9, status: "Horario no disponible" } }),
], { camera: { from: { z: -80 }, to: { z: 30 } }, bg: { tint: "warn" } });

scene("errores", 4.8, [
  TextReveal({ text: "Y el cliente *duda*:", size: 110, accent: "warn", y: -560 }),
  HexFeature({ icon: "clock", label: "¿Está abierto?", tone: "warn", at: 0.8, x: -240, y: -60, labelSize: 44 }),
  HexFeature({ icon: "eye", label: "¿Sigue existiendo?", tone: "warn", at: 1.2, x: 240, y: -60, labelSize: 44, z: -40 }),
  HexFeature({ icon: "phone", label: "¿Me van a atender?", tone: "warn", at: 1.6, x: 0, y: 330, labelSize: 44, z: 40 }),
], { camera: { from: { z: -60, ry: -5 }, to: { z: 40, ry: 4 } }, bg: { tint: "warn" } });

scene("vidriera", 3.2, [
  TextReveal({ text: "Tu ficha es tu\n*vidriera* en Google.", size: 110, y: -60, marks: { vidriera: "underline" } }),
], { transition: { type: "zoom" }, camera: { from: { z: -60 }, to: { z: 60 } } });

scene("solucion", 5.0, [
  Eyebrow({ text: "La dejo al día", y: -690 }),
  TextReveal({ text: "Ficha completa,\n*todos los meses*:", size: 100, y: -530 }),
  PillCascade({ at: 1.0, y: 170, items: [
    { icon: "clock", text: "Horarios reales" },
    { icon: "eye", text: "Fotos actuales" },
    { icon: "phone", text: "Datos que funcionan" },
    { icon: "spark", text: "Publicaciones al día", hl: true },
  ] }),
], { transition: { type: "push" }, camera: { from: { z: -90, rx: 8 }, to: { z: 30 } } });

scene("cierre", null, [OutroBrand({ at: 0.15, y: -40 })]);
