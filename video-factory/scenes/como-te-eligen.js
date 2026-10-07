/* Idea 9 · Cómo te eligen los clientes */
const BRAND = "Iván Bologna";
const TAGLINE = "Gestor de presencia online · Argentina";
const CTA = "Escribime por WhatsApp";
const COLORS = "gold";
const DURATION = [15, 20];
const VOICE = { voice: "em_alex", speed: 1.15 };

scene("gancho", null, [
  TextReveal({ text: "Así te elige\nun *cliente*:", size: 130, weight: 800, y: -40, role: "hero", cue: "impact" }),
], { vo: "Así te elige un cliente.", voAt: 0.2, hold: 0.2, camera: { from: { z: -140 }, to: { z: 60 } } });

scene("busca", null, [
  TextReveal({ text: "*Busca.*", size: 160, y: -520 }),
  Typewriter({ text: "abierto ahora cerca", at: 0.2, cps: 20, variant: "search", width: 840, size: 48, y: 60, z: 40 }),
], { vo: "Busca.", voAt: 0.05, hold: 1.0, camera: { from: { z: -80 }, to: { z: 30 } } });

scene("compara", null, [
  TextReveal({ text: "*Compara.*", size: 160, y: -520 }),
  UICard({ kind: "results", at: 0.15, width: 860, y: 170, rx: 8, float: 6 }),
], { vo: "Compara.", voAt: 0.05, hold: 1.0, transition: { type: "push" }, camera: { from: { z: -80 }, to: { z: 30 } } });

scene("confia", null, [
  TextReveal({ text: "*Confía.*", size: 160, y: -520 }),
  UICard({ kind: "review", at: 0.15, width: 820, y: 130, z: 40, float: 6, glow: true }),
], { vo: "Confía.", voAt: 0.05, hold: 1.0, transition: { type: "push" }, camera: { from: { z: -80 }, to: { z: 30 } } });

scene("escribe", null, [
  TextReveal({ text: "*Te escribe.*", size: 150, y: -520 }),
  UICard({ kind: "chat", at: 0.15, width: 820, y: 150, z: 40, float: 6 }),
], { vo: "Y te escribe. En cada paso, podés ganarlo o perderlo.", voAt: 0.05, hold: 0.3, transition: { type: "push" }, camera: { from: { z: -80 }, to: { z: 30 } } });

scene("cierre", null, [OutroBrand({ at: 0.0, y: -40 })], { vo: "Soy Iván Bologna. Escribime por WhatsApp.", voAt: 0.2, hold: 0.9, transition: { type: "zoom" }, camera: { from: { z: -60 }, to: { z: 20 }, breathe: 0.5 } });
