// Icono adaptativo de Android para MiFinanzas — versión corregida.
//
// @capacitor/assets 3.0.5 genera el icono adaptativo mal: mete el fondo en un
// <inset> (deja las esquinas transparentes al recortar) y usa tamaños de icono
// legacy para las capas. Este script sobrescribe esas capas y el XML con una
// versión correcta: fondo morado a sangre + monograma "MF" en la zona segura.
//
// Ejecutar SIEMPRE después de `npx capacitor-assets generate`, desde frontend/:
//   node assets/_android-icons.mjs
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { writeFileSync, mkdirSync } from "node:fs";

const DIR = dirname(fileURLToPath(import.meta.url));
const RES = join(DIR, "..", "android", "app", "src", "main", "res");
const PURPLE = "#aa3bff";

// Tamaños de la capa completa del icono adaptativo (108dp) por densidad.
const DENSITIES = { ldpi: 81, mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };

const STROKE = 54;
const VB = { x: 33, y: 33, w: 608, h: 464 };
const RATIO = VB.h / VB.w;
const MF = `
  <g fill="none" stroke="#ffffff" stroke-width="${STROKE}"
     stroke-linecap="round" stroke-linejoin="round">
    <path d="M60,470 L60,60 L200,318 L340,60 L340,470"/>
    <path d="M448,470 L448,60 L614,60"/>
    <path d="M448,250 L582,250"/>
  </g>`;

// El monograma ocupa el 50% del lienzo para que, aun con máscara circular,
// las esquinas de la "F" queden dentro de la zona segura.
function foregroundSvg(size) {
  const markW = size * 0.5;
  const h = markW * RATIO;
  const x = Math.round((size - markW) / 2 - markW * 0.025);
  const y = Math.round((size - h) / 2);
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
       <svg x="${x}" y="${y}" width="${Math.round(markW)}" height="${Math.round(h)}"
            viewBox="${VB.x} ${VB.y} ${VB.w} ${VB.h}" preserveAspectRatio="xMidYMid meet">${MF}</svg>
     </svg>`
  );
}

const ADAPTIVE_XML = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
    <monochrome android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
`;

console.log("Corrigiendo icono adaptativo de Android...");
for (const [density, size] of Object.entries(DENSITIES)) {
  const dir = join(RES, `mipmap-${density}`);
  mkdirSync(dir, { recursive: true });
  await sharp({ create: { width: size, height: size, channels: 4, background: PURPLE } })
    .png().toFile(join(dir, "ic_launcher_background.png"));
  await sharp(foregroundSvg(size), { density: 384 })
    .resize(size, size).png().toFile(join(dir, "ic_launcher_foreground.png"));
  console.log(`   mipmap-${density}  (${size}px)`);
}
writeFileSync(join(RES, "mipmap-anydpi-v26", "ic_launcher.xml"), ADAPTIVE_XML);
writeFileSync(join(RES, "mipmap-anydpi-v26", "ic_launcher_round.xml"), ADAPTIVE_XML);
console.log("   mipmap-anydpi-v26/ic_launcher.xml + ic_launcher_round.xml");
console.log("Hecho.");
