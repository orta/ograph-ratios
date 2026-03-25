#!/usr/bin/env node
import { execFileSync } from "child_process";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const ratios = Array.from({ length: 15 }, (_, i) =>
  Math.round((0.3 + i * 0.1) * 10) / 10
); // 0.3 to 1.7

/** HSL → #rrggbb */
function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x) => Math.round(x * 255).toString(16).padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

const items = [];

for (const ratio of ratios) {
  const folder = `ratio-${ratio.toFixed(1)}`;
  mkdirSync(folder, { recursive: true });

  const width = ratio <= 1 ? Math.round(800 * ratio) : 800;
  const height = ratio <= 1 ? 800 : Math.round(800 / ratio);

  // Hue: 240 (blue) at ratio 0.3 → 0 (red) at ratio 1.7
  const hue = Math.round(((1.7 - ratio) / 1.4) * 240);
  const color1 = hslToHex(hue, 70, 45);
  const color2 = hslToHex(hue, 70, 22);

  const imgPath = join(folder, "image.png");

  execFileSync("convert", [
    "-size", `${width}x${height}`,
    `gradient:${color1}-${color2}`,
    "-gravity", "Center",
    "-font", "DejaVu-Sans-Bold",
    "-pointsize", "72",
    "-fill", "white",
    "-annotate", "0x0+0-50", ratio.toFixed(1),
    "-pointsize", "32",
    "-fill", "rgba(255,255,255,0.75)",
    "-annotate", "0x0+0+40", `${width} x ${height}px`,
    imgPath,
  ]);

  console.log(`  ${imgPath}  (${width}×${height})`);

  writeFileSync(
    join(folder, "index.html"),
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>OG Ratio ${ratio.toFixed(1)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta property="og:title" content="Aspect Ratio ${ratio.toFixed(1)}">
  <meta property="og:description" content="OpenGraph image with aspect ratio ${ratio.toFixed(1)} (${width}x${height}px)">
  <meta property="og:image" content="./image.png">
  <meta property="og:image:width" content="${width}">
  <meta property="og:image:height" content="${height}">
  <meta property="og:type" content="website">
  <style>
    body { font-family: system-ui, sans-serif; max-width: 900px; margin: 40px auto; padding: 0 20px; background: #0f0f0f; color: #eee; }
    h1 { font-size: 2rem; margin-bottom: 4px; }
    .meta { color: #888; font-size: 0.9rem; margin-bottom: 24px; }
    img { max-width: 100%; border: 1px solid #333; border-radius: 8px; display: block; }
    a { color: #60a5fa; }
  </style>
</head>
<body>
  <p><a href="../index.html">← Back to all ratios</a></p>
  <h1>Aspect ratio ${ratio.toFixed(1)}</h1>
  <p class="meta">${width} × ${height}px</p>
  <img src="./image.png" alt="OG image ratio ${ratio.toFixed(1)}">
</body>
</html>`
  );

  items.push({ ratio, width, height, folder });
}

const cards = items
  .map(
    ({ ratio, width, height, folder }) => `
    <a class="card" href="./${folder}/index.html">
      <div class="img-wrap">
        <img src="./${folder}/image.png" alt="ratio ${ratio.toFixed(1)}" loading="lazy">
      </div>
      <div class="info">
        <span class="ratio">${ratio.toFixed(1)}</span>
        <span class="dims">${width} × ${height}</span>
      </div>
    </a>`
  )
  .join("");

writeFileSync(
  "index.html",
  `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>OpenGraph Aspect Ratio Tester</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, sans-serif;
      background: #0a0a0a;
      color: #eee;
      padding: 40px 20px;
    }
    h1 { font-size: 2rem; margin-bottom: 8px; }
    .subtitle { color: #666; margin-bottom: 40px; font-size: 0.95rem; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
    }
    .card {
      display: block;
      background: #1a1a1a;
      border: 1px solid #2a2a2a;
      border-radius: 10px;
      overflow: hidden;
      text-decoration: none;
      color: inherit;
      transition: border-color 0.15s, transform 0.15s;
    }
    .card:hover {
      border-color: #555;
      transform: translateY(-2px);
    }
    .img-wrap {
      background: #111;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 180px;
      padding: 12px;
    }
    .img-wrap img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      border-radius: 4px;
    }
    .info {
      padding: 10px 14px 12px;
      display: flex;
      align-items: baseline;
      gap: 10px;
    }
    .ratio { font-size: 1.25rem; font-weight: 600; }
    .dims { font-size: 0.8rem; color: #666; }
  </style>
</head>
<body>
  <h1>OpenGraph Aspect Ratio Tester</h1>
  <p class="subtitle">Ratios from 0.3 (portrait) to 1.7 (landscape) — all images bounded to 800×800px. Click any card to view the og:image metadata page.</p>
  <div class="grid">${cards}
  </div>
</body>
</html>`
);

console.log("\nDone! Open index.html to browse.");
