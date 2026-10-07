/* Plantilla para un video nuevo. Copiá este archivo como scenes/<nombre>.js y corré:
     node snap.js <nombre>      → QA + capturas de revisión
     node render.js <nombre>    → MP4 en out/<nombre>/<nombre>.mp4
   Coordenadas: x/y en px desde el centro (1080×1920). Zona segura de texto: y entre -760 y +600.
   Temas: midnight · ivory · emerald · ocean · violet · gold · aurora  (o { theme, accent, ... }) */

const BRAND = "PRESENCE";
const TAGLINE = "Gestión de presencia online · Argentina";
const CTA = "Escribime por WhatsApp";
const COLORS = "midnight";
const DURATION = 16;

scene("gancho", 2.4, [
  TextReveal({ text: "Una frase\n*que frene el scroll.*", size: 120, weight: 800, y: -40, role: "hero" }),
]);

scene("idea", 4.0, [
  Eyebrow({ text: "Etiqueta", y: -690 }),
  TextReveal({ text: "El titular de la escena.", size: 100, y: -540 }),
  PillCascade({ at: 0.9, y: 120, items: [{ icon: "check", text: "Punto uno" }, { icon: "check", text: "Punto dos" }, { icon: "spark", text: "Punto clave", hl: true }] }),
]);

scene("remate", 3.4, [
  TextReveal({ text: "Es", size: 96, color: "muted", y: -330, role: "body", cue: null }),
  KeywordCircle({ text: "clave", at: 0.2, size: 200, y: -110 }),
]);

scene("cierre", null, [OutroBrand({ at: 0.15, y: -40 })]);
