import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");

const BACKGROUND = "#ebe8e0";
const FOREGROUND = "#4d4d4d";

function createIconSvg(size, maskable = false) {
    const padding = maskable ? size * 0.2 : size * 0.15;
    const innerSize = size - padding * 2;
    const radius = maskable ? innerSize * 0.22 : innerSize * 0.18;
    const fontSize = innerSize * 0.48;
    const x = padding + innerSize / 2;
    const y = padding + innerSize / 2 + fontSize * 0.34;

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${BACKGROUND}" />
  <rect x="${padding}" y="${padding}" width="${innerSize}" height="${innerSize}" rx="${radius}" fill="${FOREGROUND}" />
  <text x="${x}" y="${y}" text-anchor="middle" fill="${BACKGROUND}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="${fontSize}" font-weight="700">V</text>
</svg>`;
}

async function writePng(filename, size, maskable = false) {
    const svg = createIconSvg(size, maskable);
    const outputPath = path.join(publicDir, filename);
    await sharp(Buffer.from(svg)).png().toFile(outputPath);
}

await mkdir(publicDir, { recursive: true });
await writePng("icon-192x192.png", 192);
await writePng("icon-512x512.png", 512);
await writePng("icon-maskable-512x512.png", 512, true);

console.log("Generated PWA icons in public/");
