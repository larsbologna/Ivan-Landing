// Utilidades compartidas por snap.js y render.js
import { createRequire } from "node:module";
import { execSync, spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import fs from "node:fs";
import path from "node:path";

export const ROOT = path.dirname(fileURLToPath(import.meta.url));
export const OUT = path.join(ROOT, "out");

/* Playwright: usa el local si existe; si no, el global (no descarga browsers). */
export function loadPlaywright() {
  const require = createRequire(import.meta.url);
  try { return require("playwright"); } catch {}
  const groot = execSync("npm root -g").toString().trim();
  return require(path.join(groot, "playwright"));
}

export async function launch() {
  const { chromium } = loadPlaywright();
  const opts = {
    args: ["--hide-scrollbars", "--force-color-profile=srgb", "--disable-lcd-text", "--font-render-hinting=none", "--disable-gpu-rasterization"],
  };
  if (process.env.CHROMIUM_PATH) opts.executablePath = process.env.CHROMIUM_PATH;
  return chromium.launch(opts);
}

export function sceneExists(name) {
  return fs.existsSync(path.join(ROOT, "scenes", name + ".js"));
}

export function fixesPath(name) { return path.join(OUT, name, "qa", "fixes.json"); }
export function readFixes(name) {
  try { return JSON.parse(fs.readFileSync(fixesPath(name), "utf8")); } catch { return {}; }
}

/* Abre la escena en una página 1080×1920 con los fixes inyectados. */
export async function openScene(browser, name, fixes = {}) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await page.addInitScript((f) => { window.__FIXES__ = f; }, fixes);
  const url = pathToFileURL(path.join(ROOT, "engine", "index.html")).href + "?scene=" + encodeURIComponent(name);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(url, { waitUntil: "load" });
  try {
    await page.waitForFunction(() => window.__ready === true, null, { timeout: 20000 });
  } catch (e) {
    throw new Error("La escena no arrancó: " + (errors.join(" | ") || e.message));
  }
  if (errors.length) throw new Error("Errores en la página: " + errors.join(" | "));
  return page;
}

export function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: opts.quiet ? ["ignore", "ignore", "pipe"] : "inherit", ...opts });
    let err = "";
    if (p.stderr) p.stderr.on("data", (d) => (err += d));
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} salió con código ${code}\n${err}`))));
  });
}

export function parseArgs(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const s = argv[i];
    if (s.startsWith("--")) {
      const [k, v] = s.slice(2).split("=");
      if (v !== undefined) a[k] = v;
      else if (argv[i + 1] && !argv[i + 1].startsWith("--")) a[k] = argv[++i];
      else a[k] = true;
    } else a._.push(s);
  }
  return a;
}
