// Genera los archivos fuente de icono para MiFinanzas.
// Barras ascendentes en blanco sobre degradé verde-azul (#059669 -> #0369A1).
// El splash screen (splash.png / splash-dark.png) NO se regenera acá: sigue
// usando el monograma "MF" violeta original, son archivos independientes.
// Ejecutar desde frontend/:  node assets/_generate.mjs
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const DIR = dirname(fileURLToPath(import.meta.url));
const GRADIENT_FROM = "#059669";
const GRADIENT_TO = "#0369A1";

// Tres barras ascendentes centradas en un lienzo de 1024x1024.
const BASELINE = 712;
const BARS = [
  { x: 302, w: 120, h: 200 },
  { x: 462, w: 120, h: 320 },
  { x: 622, w: 120, h: 440 },
];
const barsMarkup = BARS.map(
  (b) => `<rect x="${b.x}" y="${BASELINE - b.h}" width="${b.w}" height="${b.h}" rx="28" fill="#ffffff"/>`
).join("\n");

const gradientDefs = `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1024" y2="1024" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${GRADIENT_FROM}"/>
      <stop offset="1" stop-color="${GRADIENT_TO}"/>
    </linearGradient>
  </defs>`;

function svg(canvas, { withBg, withBars }) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas}" height="${canvas}" viewBox="0 0 1024 1024">
       ${withBg ? `${gradientDefs}<rect width="1024" height="1024" fill="url(#bg)"/>` : ""}
       ${withBars ? barsMarkup : ""}
     </svg>`
  );
}

const out = (name) => join(DIR, name);
async function png(name, buf, size) {
  await sharp(buf, { density: 384 }).resize(size, size).png().toFile(out(name));
  console.log("  ", name);
}

console.log("Generando icono de MiFinanzas...");
await png("icon.png", svg(1024, { withBg: true, withBars: true }), 1024);
await png("icon-background.png", svg(1024, { withBg: true, withBars: false }), 1024);
await png("icon-foreground.png", svg(1024, { withBg: false, withBars: true }), 1024);
console.log("Hecho.");
