/* Idea 6 · Negocios invisibles */
const BRAND = "Iván Bologna";
const TAGLINE = "Gestor de presencia online · Argentina";
const CTA = "Escribime por WhatsApp";
const COLORS = "midnight";
const DURATION = [15, 20];
const VOICE = { voice: "em_alex", speed: 1.15 };

scene("gancho", null, [
  TextReveal({ text: "Hay negocios buenísimos\nque nadie *encuentra*.", size: 104, weight: 800, y: -40, role: "hero", cue: "impact" }),
], { vo: "Hay negocios buenísimos que nadie encuentra.", voAt: 0.2, hold: 0.25, camera: { from: { z: -140 }, to: { z: 60 } } });

scene("busqueda", null, [
  Typewriter({ text: "cerca de mí", at: 0.0, cps: 16, variant: "search", width: 820, size: 50, y: -540, z: 40, placeholder: "Buscar en Google" }),
  UICard({ kind: "results", at: 0.7, width: 860, y: 60, rx: 8, float: 6, data: { items: [["Otro negocio", "4,7", "Abierto ahora", false], ["La competencia", "4,5", "Responde rápido", false], ["Otro más", "4,3", "Con fotos", false]] } }),
  TextReveal({ text: "*¿Y vos?*", size: 110, accent: "warn", y: 480, at: 1.9 }),
], { vo: "Tu cliente busca cerca, y aparecen todos menos vos.", voAt: 0.05, hold: 0.45, camera: { from: { z: -80, rx: 4 }, to: { z: 30 } } });

scene("solucion", null, [
  TextReveal({ text: "Aparecé donde\n*te buscan*:", size: 104, y: -540 }),
  PillCascade({ at: 0.5, stagger: 0.32, y: 170, items: [
    { icon: "pin", text: "Google Maps completo" },
    { icon: "web", text: "Web que se encuentra" },
    { icon: "layers", text: "Todo conectado", hl: true },
  ] }),
], { vo: "Te hago visible donde te están buscando.", voAt: 0.05, hold: 0.5, transition: { type: "push" }, camera: { from: { z: -90, rx: 8 }, to: { z: 30 } } });

scene("cierre", null, [OutroBrand({ at: 0.0, y: -40 })], { vo: "Soy Iván Bologna. Escribime por WhatsApp.", voAt: 0.2, hold: 0.9, transition: { type: "zoom" }, camera: { from: { z: -60 }, to: { z: 20 }, breathe: 0.5 } });
