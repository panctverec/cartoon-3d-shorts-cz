// Stills (kontrolní snímky) z kompozice: jeden bundle, pak libovolné snímky jako JPEG.
// usage: node scripts/stills.mjs <výstupní-prefix> <snímek,snímek,...> [scale]
//   env COMP=<id kompozice> (výchozí Priklad), PROPS='{"post":{"audio":""}}' (bez zvuku, než existuje mix.wav)
//   env REMOTION_TMP=<složka na velkém disku> (každý bundle kopíruje public/ do temp složky; na malém C: to dojde)
//   env CHROME=<cesta k chrome.exe> (volitelné; jinak Remotion použije svůj Chrome Headless Shell)
// příklad: node scripts/stills.mjs projekty/_test/s_ 100,400 0.5
import fs from "node:fs";
if (process.env.REMOTION_TMP) { fs.mkdirSync(process.env.REMOTION_TMP, { recursive: true }); process.env.TEMP = process.env.TMP = process.env.REMOTION_TMP; }
const { bundle } = await import("@remotion/bundler");
const { renderStill, selectComposition } = await import("@remotion/renderer");
const path = await import("node:path");
const [prefix, frames, scale = "0.5"] = process.argv.slice(2);
if (!prefix || !frames) { console.error("usage: node scripts/stills.mjs <prefix> <frame,frame,...> [scale]"); process.exit(1); }
const inputProps = process.env.PROPS ? JSON.parse(process.env.PROPS) : {};
fs.mkdirSync(path.dirname(path.resolve(prefix + "x")), { recursive: true });
const browserExecutable = process.env.CHROME || null;
const chromiumOptions = { gl: "angle" };
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id: process.env.COMP || "Priklad", inputProps, browserExecutable, chromiumOptions });
const onBrowserLog = (l) => { if (l.type === "error" || l.type === "warning") console.log(`[${l.type}]`, l.text.slice(0, 300)); };
for (const f of frames.split(",").map(Number)) {
  const t0 = Date.now();
  await renderStill({ composition, serveUrl, frame: f, inputProps, output: `${prefix}${f}.jpg`, imageFormat: "jpeg", jpegQuality: 88, scale: Number(scale),
    browserExecutable, chromiumOptions, timeoutInMilliseconds: 180000, onBrowserLog });
  console.log("still", f, ((Date.now() - t0) / 1000).toFixed(1) + "s");
}
