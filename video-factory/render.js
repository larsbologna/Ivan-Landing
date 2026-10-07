#!/usr/bin/env node
// Render determinista de una escena a MP4 1080×1920.
//   node render.js <escena> [--workers 4] [--fps 30] [--force] [--keep-frames] [--music pad|pulse|none]
// Flujo: QA (snap.js) → frames en paralelo → cues.json → audio.wav → MP4 → autoanálisis.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { OUT, ROOT, launch, openScene, readFixes, sceneExists, run, parseArgs } from "./lib.js";
import { snap } from "./snap.js";

const args = parseArgs(process.argv.slice(2));
const name = args._[0] || "presencia";
if (!sceneExists(name)) { console.error(`No existe scenes/${name}.js`); process.exit(1); }

const dir = path.join(OUT, name);
const framesDir = path.join(dir, "frames");
fs.mkdirSync(dir, { recursive: true });
const t0 = Date.now();
const secs = () => ((Date.now() - t0) / 1000).toFixed(1) + " s";

// 1. Control de calidad: sólo se renderiza si pasa.
console.log(`[1/5] QA de "${name}"`);
const qa = await snap(name, { log: (...a) => console.log(...a) });
if (!qa.pass && !args.force) {
  console.error(`✗ QA no aprobado. Revisá out/${name}/qa/qa-report.md (o usá --force).`);
  process.exit(1);
}
const fixes = readFixes(name);

// 2. Frames en paralelo
const fps = +(args.fps || qa.info.fps || 30);
const duration = qa.info.duration;
const total = Math.round(duration * fps);
const workers = Math.max(1, Math.min(+(args.workers || Math.min(4, os.cpus().length)), total));
fs.rmSync(framesDir, { recursive: true, force: true });
fs.mkdirSync(framesDir, { recursive: true });
console.log(`[2/5] ${total} frames · ${fps} fps · ${duration.toFixed(2)} s · ${workers} workers`);

let done = 0;
async function worker(w) {
  const browser = await launch();
  try {
    const page = await openScene(browser, name, fixes);
    // captura por CDP: PNG sin pérdida, ~7× más rápido que page.screenshot()
    const cdp = await page.context().newCDPSession(page);
    // reparto intercalado por bloques: carga pareja aunque haya escenas más pesadas
    const BLOCK = 15;
    for (let b = w * BLOCK; b < total; b += workers * BLOCK) {
      for (let i = b; i < Math.min(total, b + BLOCK); i++) {
        await page.evaluate((t) => window.__seek(t), i / fps);
        const { data } = await cdp.send("Page.captureScreenshot", { format: "png", optimizeForSpeed: true, captureBeyondViewport: false });
        fs.writeFileSync(path.join(framesDir, String(i).padStart(5, "0") + ".png"), Buffer.from(data, "base64"));
        done++;
        if (done % 60 === 0) process.stdout.write(`      ${done}/${total} (${secs()})\n`);
      }
    }
  } finally {
    await browser.close();
  }
}
await Promise.all(Array.from({ length: workers }, (_, w) => worker(w)));
const missing = Array.from({ length: total }, (_, i) => i).filter((i) => !fs.existsSync(path.join(framesDir, String(i).padStart(5, "0") + ".png")));
if (missing.length) { console.error("Faltan frames:", missing.slice(0, 10)); process.exit(1); }

// 3. Cues de audio
console.log(`[3/5] cues.json`);
{
  const browser = await launch();
  const page = await openScene(browser, name, fixes);
  const cues = await page.evaluate(() => window.__cues());
  await browser.close();
  fs.writeFileSync(path.join(dir, "cues.json"), JSON.stringify(cues, null, 1));
  console.log(`      ${cues.length} eventos de audio`);
}

// 4. Audio procedural
console.log(`[4/5] audio.wav`);
await run("python3", ["-I", path.join(ROOT, "audio", "sfx.py"), path.join(dir, "cues.json"), path.join(dir, "audio.wav"),
  "--duration", String(duration), "--music", String(args.music || qa.info.meta.music || "pad")]);

// 5. MP4 (H.264 High + AAC, BT.709, faststart)
console.log(`[5/5] ${name}.mp4`);
const mp4 = path.join(dir, `${name}.mp4`);
await run("ffmpeg", ["-v", "error", "-y",
  "-framerate", String(fps), "-i", path.join(framesDir, "%05d.png"),
  "-i", path.join(dir, "audio.wav"),
  "-vf", "scale=in_range=full:out_range=tv:out_color_matrix=bt709:flags=lanczos+accurate_rnd,format=yuv420p",
  "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-profile:v", "high", "-tune", "animation",
  "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
  "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
  "-movflags", "+faststart", "-shortest", mp4]);

// póster (último frame, sirve de miniatura) y autoanálisis del render
await run("ffmpeg", ["-v", "error", "-y", "-i", path.join(framesDir, String(total - 1).padStart(5, "0") + ".png"), "-q:v", "2", path.join(dir, "poster.jpg")]);
await run("bash", [path.join(ROOT, "analysis", "analyze.sh"), mp4, path.join(dir, "analysis")], { quiet: true }).catch((e) => console.warn("análisis:", e.message));
if (!args["keep-frames"]) fs.rmSync(framesDir, { recursive: true, force: true });

const size = (fs.statSync(mp4).size / 1048576).toFixed(1);
console.log(`✓ ${path.relative(ROOT, mp4)} · ${size} MB · ${secs()}`);
