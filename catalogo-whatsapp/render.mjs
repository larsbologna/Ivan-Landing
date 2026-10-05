// Renderiza cada slide de catalogo.html a PNG 1080x1080 (y 2160x2160 @2x).
// Uso: node catalogo-whatsapp/render.mjs
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";

const dir = path.dirname(fileURLToPath(import.meta.url));
const names = [
  "01-portada",
  "02-google-maps",
  "03-pagina-web",
  "04-reservas-online",
  "05-dashboard",
  "06-automatizacion-ia",
];

const browser = await chromium.launch();
for (const scale of [1, 2]) {
  const page = await browser.newPage({ deviceScaleFactor: scale, viewport: { width: 1200, height: 1200 } });
  await page.goto("file://" + path.join(dir, "catalogo.html"), { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  for (let i = 0; i < names.length; i++) {
    const suffix = scale === 1 ? "" : "@2x";
    await page.locator(`#s${i + 1}`).screenshot({ path: path.join(dir, "png", `${names[i]}${suffix}.png`) });
  }
  await page.close();
}
await browser.close();
console.log("ok");
