// Icono adaptativo de Android para MiFinanzas — versión corregida.
//
// @capacitor/assets 3.0.5 genera el icono adaptativo mal: mete el fondo en un
// <inset> (deja las esquinas transparentes al recortar) y usa tamaños de icono
// legacy para las capas. Este script sobrescribe esas capas y el XML con una
// versión correcta: degradé a sangre + barras ascendentes en la zona segura.
//
// Ejecutar SIEMPRE después de `npx capacitor-assets generate`, desde frontend/:
//   node assets/_android-icons.mjs
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { writeFileSync, mkdirSync } from "node:fs";

const DIR = dirname(fileURLToPath(import.meta.url));
const RES = join(DIR, "..", "android", "app", "src", "main", "res");
const GRADIENT_FROM = "#059669";
const GRADIENT_TO = "#0369A1";

// Tamaños de la capa completa del icono adaptativo (108dp) por densidad.
const DENSITIES = { ldpi: 81, mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };

// Mismas barras que _generate.mjs, escaladas al 55% del lienzo para que
// queden dentro de la zona segura de la máscara (círculo/squircle/etc).
const BASELINE = 712;
const BARS = [
  { x: 302, w: 120, h: 200 },
  { x: 462, w: 120, h: 320 },
  { x: 622, w: 120, h: 440 },
];
const SCALE = 0.55;
const OFFSET = (1024 * (1 - SCALE)) / 2;
function foregroundSvg(size) {
  const bars = BARS.map(
    (b) =>
      `<rect x="${OFFSET + b.x * SCALE}" y="${OFFSET + (BASELINE - b.h) * SCALE}" width="${b.w * SCALE}" height="${b.h * SCALE}" rx="${28 * SCALE}" fill="#ffffff"/>`
  ).join("\n");
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">${bars}</svg>`
  );
}

function backgroundSvg(size) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">
       <defs>
         <linearGradient id="bg" x1="0" y1="0" x2="1024" y2="1024" gradientUnits="userSpaceOnUse">
           <stop offset="0" stop-color="${GRADIENT_FROM}"/>
           <stop offset="1" stop-color="${GRADIENT_TO}"/>
         </linearGradient>
       </defs>
       <rect width="1024" height="1024" fill="url(#bg)"/>
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
  await sharp(backgroundSvg(size), { density: 384 })
    .resize(size, size).png().toFile(join(dir, "ic_launcher_background.png"));
  await sharp(foregroundSvg(size), { density: 384 })
    .resize(size, size).png().toFile(join(dir, "ic_launcher_foreground.png"));
  console.log(`   mipmap-${density}  (${size}px)`);
}
writeFileSync(join(RES, "mipmap-anydpi-v26", "ic_launcher.xml"), ADAPTIVE_XML);
writeFileSync(join(RES, "mipmap-anydpi-v26", "ic_launcher_round.xml"), ADAPTIVE_XML);
console.log("   mipmap-anydpi-v26/ic_launcher.xml + ic_launcher_round.xml");
console.log("Hecho.");
