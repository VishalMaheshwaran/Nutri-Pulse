import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// CRC32 implementation
function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const body = Buffer.concat([typeBuf, data]);
  const crc = crc32(body);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);

  return Buffer.concat([lenBuf, body, crcBuf]);
}

function generatePng(size, isMaskable = false) {
  const width = size;
  const height = size;

  // Raw RGBA pixels with per-line filter byte 0
  const rowLength = 1 + width * 4;
  const rawData = Buffer.alloc(rowLength * height);

  const center = size / 2;
  const outerRadius = size * 0.44;
  const innerRadius = size * 0.28;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background color: #020617 (slate-950)
      let r = 2;
      let g = 6;
      let b = 23;
      let a = 255;

      // Outer circle glow/gradient ring
      if (dist < outerRadius) {
        // Emerald to cyan gradient
        const t = (x + y) / (width + height); // 0 to 1
        const gradR = Math.round(16 * (1 - t) + 6 * t);
        const gradG = Math.round(185 * (1 - t) + 182 * t);
        const gradB = Math.round(129 * (1 - t) + 212 * t);

        if (dist > innerRadius) {
          // Ring accent
          r = gradR;
          g = gradG;
          b = gradB;
        } else {
          // Center core: Dark background with bright nutrition pulse/flame symbol
          const innerDist = dist / innerRadius;
          // Flame/leaf shape math or central 'N' pulse
          if (innerDist < 0.65) {
            // Bright emerald core
            r = 16;
            g = 185;
            b = 129;
          } else {
            r = Math.round(15 * (1 - innerDist) + 2 * innerDist);
            g = Math.round(23 * (1 - innerDist) + 6 * innerDist);
            b = Math.round(42 * (1 - innerDist) + 23 * innerDist);
          }
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8-bit
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // deflate
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // no interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);

  // IEND
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate PWA icons
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generatePng(192));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generatePng(512));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), generatePng(512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generatePng(180));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), generatePng(64));

console.log('Successfully generated all PWA icons in /public!');
