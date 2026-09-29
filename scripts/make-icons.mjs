// PWA PNG 아이콘 생성: PW_CHROMIUM=<chrome 경로> node scripts/make-icons.mjs
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
const svg = readFileSync("public/icon.svg", "utf8");
const b = await chromium.launch({ ...(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}) });
for (const [name, size, pad] of [["icon-192.png", 192, 0], ["icon-512.png", 512, 0], ["apple-touch-icon.png", 180, 0], ["icon-maskable-512.png", 512, 0.12]]) {
  const p = await b.newPage({ viewport: { width: size, height: size } });
  const inner = Math.round(size * (1 - pad * 2));
  await p.setContent(`<html><body style="margin:0;background:#121211;display:grid;place-items:center;width:${size}px;height:${size}px">${svg.replace("<svg ", `<svg width="${inner}" height="${inner}" `)}</body></html>`);
  await p.screenshot({ path: `public/${name}`, omitBackground: false });
  await p.close();
}
await b.close();
