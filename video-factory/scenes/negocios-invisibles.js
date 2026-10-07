/* Idea 6 · Negocios invisibles */
const BRAND = "PRESENCE";
const TAGLINE = "Gestión de presencia online · Argentina";
const CTA = "Escribime por WhatsApp";
const COLORS = "midnight";
const DURATION = 20.5;

scene("gancho", 3.0, [
  TextReveal({ text: "Hay negocios buenísimos\nque nadie *encuentra*.", size: 104, weight: 800, y: -40, role: "hero", cue: "impact" }),
], { camera: { from: { z: -140 }, to: { z: 60 } } });

scene("busqueda", 4.6, [
  Eyebrow({ text: "Tu cliente busca", y: -690 }),
  Typewriter({ text: "cerca de mí", at: 0.2, variant: "search", width: 820, size: 50, y: -500, z: 40, placeholder: "Buscar en Google" }),
  UICard({ kind: "results", at: 1.4, width: 860, y: 110, rx: 8, float: 6, data: { items: [["Otro negocio", "4,7", "Abierto ahora", false], ["La competencia", "4,5", "Responde rápido", false], ["Otro más", "4,3", "Con fotos", false]] } }),
  TextReveal({ text: "*¿Y vos?*", size: 110, accent: "warn", y: 500, at: 2.8 }),
], { camera: { from: { z: -80, rx: 4 }, to: { z: 30 } } });

scene("existir", 3.4, [
  TextReveal({ text: "Si no aparecés,\npara tu cliente\n*no existís*.", size: 108, y: -60 }),
], { transition: { type: "zoom" }, camera: { from: { z: -60 }, to: { z: 60 } }, bg: { tint: "warn" } });

scene("solucion", 5.0, [
  Eyebrow({ text: "Hacerte visible", y: -690 }),
  TextReveal({ text: "Aparecer donde\n*te buscan*:", size: 100, y: -530 }),
  PillCascade({ at: 1.0, y: 170, items: [
    { icon: "pin", text: "Google Maps completo" },
    { icon: "web", text: "Web que se encuentra" },
    { icon: "star", text: "Reseñas activas" },
    { icon: "layers", text: "Todo conectado", hl: true },
  ] }),
], { transition: { type: "push" }, camera: { from: { z: -90, rx: 8 }, to: { z: 30 } } });

scene("cierre", null, [OutroBrand({ at: 0.15, y: -40 })]);
