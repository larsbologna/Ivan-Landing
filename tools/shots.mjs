// Capturas de control y generación de og-image.png. Uso: node tools/shots.mjs [carpeta-salida]
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = process.argv[2] || root;
const url = "file://" + path.join(root, "index.html");
const browser = await chromium.launch();
const errors = [];
for (const [name, vp] of [["desktop", { width: 1440, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
  const page = await browser.newPage({ viewport: vp, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => errors.push(`${name}: ${e.message}`));
  page.on("console", (m) => m.type() === "error" && errors.push(`${name} console: ${m.text()}`));
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(out, `shot-${name}-hero.png`) });
  // recorrer para disparar reveals
  const h = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 400) { await page.evaluate((y) => scrollTo(0, y), y); await page.waitForTimeout(120); }
  await page.waitForTimeout(800);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  if (overflow > 0) errors.push(`${name}: overflow horizontal ${overflow}px`);
  await page.screenshot({ path: path.join(out, `shot-${name}-full.png`), fullPage: true });
  await page.close();
}
// og-image
const og = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await og.emulateMedia({ reducedMotion: "reduce" });
await og.goto(url, { waitUntil: "networkidle" });
await og.addStyleTag({ content: ".hd,.fab,.hero-cta,.vis-cap,.flow{display:none!important}.hero{padding:40px 0}.hero-g{min-height:0!important;grid-template-areas:'copy vis'!important}.h1{font-size:60px}" });
await og.waitForTimeout(500);
await og.screenshot({ path: path.join(root, "og-image.png") });
await browser.close();
console.log(errors.length ? errors.join("\n") : "Sin errores de consola ni overflow.");
