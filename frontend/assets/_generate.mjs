// Genera los archivos fuente de icono y splash para MiFinanzas.
// Monograma "MF" en blanco sobre morado de marca (#aa3bff).
// Ejecutar desde frontend/:  node assets/_generate.mjs
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const DIR = dirname(fileURLToPath(import.meta.url));
const PURPLE = "#aa3bff";

// Trazo del monograma. M y F claramente separadas, trazo fino y elegante.
const STROKE = 54;
// Bounding box del contenido, con el grosor del trazo incluido:
//   M: x 60..340 (stroke -> 33..367),  F: x 448..614 (stroke -> 421..641)
//   y 60..470 (stroke -> 33..497)
const VB = { x: 33, y: 33, w: 641 - 33, h: 497 - 33 }; // "33 33 608 464"
const RATIO = VB.h / VB.w;

const MF = `
  <g fill="none" stroke="#ffffff" stroke-width="${STROKE}"
     stroke-linecap="round" stroke-linejoin="round">
    <path d="M60,470 L60,60 L200,318 L340,60 L340,470"/>
    <path d="M448,470 L448,60 L614,60"/>
    <path d="M448,250 L582,250"/>
  </g>`;

function mark(canvas, markWidth) {
  const h = markWidth * RATIO;
  // Corrección óptica: la "F" abierta hace que el conjunto parezca desplazado
  // a la derecha; lo compensamos con un pequeño empujón a la izquierda.
  const x = Math.round((canvas - markWidth) / 2 - markWidth * 0.025);
  const y = Math.round((canvas - h) / 2);
  return `<svg x="${x}" y="${y}" width="${markWidth}" height="${Math.round(h)}"
              viewBox="${VB.x} ${VB.y} ${VB.w} ${VB.h}"
              preserveAspectRatio="xMidYMid meet">${MF}</svg>`;
}

function svg(canvas, { bg, markWidth }) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas}" height="${canvas}" viewBox="0 0 ${canvas} ${canvas}">
       ${bg ? `<rect width="${canvas}" height="${canvas}" fill="${bg}"/>` : ""}
       ${markWidth ? mark(canvas, markWidth) : ""}
     </svg>`
  );
}

const out = (name) => join(DIR, name);
async function png(name, buf, size) {
  await sharp(buf, { density: 384 }).resize(size, size).png().toFile(out(name));
  console.log("  ", name);
}

console.log("Generando assets de MiFinanzas...");
await png("icon.png", svg(1024, { bg: PURPLE, markWidth: 560 }), 1024);
await png("icon-background.png", svg(1024, { bg: PURPLE }), 1024);
await png("icon-foreground.png", svg(1024, { markWidth: 500 }), 1024);
await png("splash.png", svg(2732, { bg: PURPLE, markWidth: 600 }), 2732);
await png("splash-dark.png", svg(2732, { bg: PURPLE, markWidth: 600 }), 2732);
console.log("Hecho.");
