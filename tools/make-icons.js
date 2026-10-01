// Outil de développement : génère les icônes PNG de la PWA (dessin original :
// plateau, voiture rouge, véhicule bleu et flèche de sortie).
// Usage : node tools/make-icons.js   (modules intégrés uniquement)

import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

const BG = [0x37, 0x47, 0x4f];
const SHAPES = [
  // [type, couleur, géométrie] en coordonnées normalisées du contenu (0..1)
  ["rect", [0xe3, 0xe8, 0xee], { x0: 0.04, y0: 0.08, x1: 0.78, y1: 0.92, r: 0.05 }],
  ["rect", [0x15, 0x65, 0xc0], { x0: 0.6, y0: 0.13, x1: 0.73, y1: 0.47, r: 0.04 }],
  ["rect", [0xd3, 0x2f, 0x2f], { x0: 0.09, y0: 0.53, x1: 0.55, y1: 0.73, r: 0.05 }],
  ["rect", [0xee, 0xa0, 0xa0], { x0: 0.43, y0: 0.57, x1: 0.49, y1: 0.69, r: 0.015 }],
  ["tri", [0xff, 0xb3, 0x00], { ax: 0.81, ay: 0.48, bx: 0.98, by: 0.63, cx: 0.81, cy: 0.78 }],
];

function inRoundRect(x, y, { x0, y0, x1, y1, r }) {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const dx = Math.max(x0 + r - x, 0, x - (x1 - r));
  const dy = Math.max(y0 + r - y, 0, y - (y1 - r));
  return dx * dx + dy * dy <= r * r;
}

function inTriangle(x, y, { ax, ay, bx, by, cx, cy }) {
  const s = (px, py, qx, qy) => (x - qx) * (py - qy) - (px - qx) * (y - qy);
  const d1 = s(ax, ay, bx, by);
  const d2 = s(bx, by, cx, cy);
  const d3 = s(cx, cy, ax, ay);
  const neg = d1 < 0 || d2 < 0 || d3 < 0;
  const pos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(neg && pos);
}

function colorAt(u, v, margin) {
  const x = (u - margin) / (1 - 2 * margin);
  const y = (v - margin) / (1 - 2 * margin);
  let color = BG;
  for (const [type, c, g] of SHAPES) {
    if (type === "rect" ? inRoundRect(x, y, g) : inTriangle(x, y, g)) color = c;
  }
  return color;
}

/** Image RGBA opaque, anticrénelée par suréchantillonnage 4x4. */
function draw(size, margin) {
  const N = 4;
  const pixels = Buffer.alloc(size * size * 4);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const sum = [0, 0, 0];
      for (let sy = 0; sy < N; sy++) {
        for (let sx = 0; sx < N; sx++) {
          const c = colorAt((px + (sx + 0.5) / N) / size, (py + (sy + 0.5) / N) / size, margin);
          sum[0] += c[0];
          sum[1] += c[1];
          sum[2] += c[2];
        }
      }
      const i = (py * size + px) * 4;
      pixels[i] = Math.round(sum[0] / (N * N));
      pixels[i + 1] = Math.round(sum[1] / (N * N));
      pixels[i + 2] = Math.round(sum[2] / (N * N));
      pixels[i + 3] = 255;
    }
  }
  return pixels;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng(size, pixels) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // profondeur
  header[9] = 6; // RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filtre « None »
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const ICONS = [
  ["icons/icon-192.png", 192, 0.06],
  ["icons/icon-512.png", 512, 0.06],
  ["icons/icon-maskable-512.png", 512, 0.16], // motif dans la zone sûre centrale
  ["icons/apple-touch-icon.png", 180, 0.08],
];

mkdirSync("icons", { recursive: true });
for (const [file, size, margin] of ICONS) {
  writeFileSync(file, encodePng(size, draw(size, margin)));
  console.log(`${file} (${size}x${size})`);
}
