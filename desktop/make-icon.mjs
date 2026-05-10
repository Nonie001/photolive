import sharp from "sharp";
import fs from "fs";

// Create a simple 256x256 blue square PNG
const svg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">
    <rect width="256" height="256" rx="48" fill="#3B82F6"/>
    <circle cx="128" cy="110" r="40" fill="white" opacity="0.9"/>
    <rect x="68" y="155" width="120" height="70" rx="10" fill="white" opacity="0.9"/>
  </svg>`
);

await sharp(svg).resize(256, 256).png().toFile("resources/icon.png");
console.log("icon.png created");

// Create ICO from PNG (multi-size)
const sizes = [16, 32, 64, 128, 256];
const pngBuffers = await Promise.all(
  sizes.map((s) => sharp(svg).resize(s, s).png().toBuffer())
);

// Write ICO file manually
// ICO format: ICONDIR + ICONDIRENTRY[] + image data
const numImages = sizes.length;
const headerSize = 6;
const entrySize = 16;
const dataOffset = headerSize + entrySize * numImages;

let offset = dataOffset;
const entries = [];
for (let i = 0; i < numImages; i++) {
  const buf = pngBuffers[i];
  entries.push({ size: sizes[i], buf, offset });
  offset += buf.length;
}

const totalSize = offset;
const ico = Buffer.alloc(totalSize);

// ICONDIR
ico.writeUInt16LE(0, 0); // reserved
ico.writeUInt16LE(1, 2); // type: 1 = ICO
ico.writeUInt16LE(numImages, 4); // count

// ICONDIRENTRY
for (let i = 0; i < numImages; i++) {
  const e = entries[i];
  const base = headerSize + i * entrySize;
  const sz = e.size === 256 ? 0 : e.size; // 256 is stored as 0 in ICO
  ico.writeUInt8(sz, base + 0); // width
  ico.writeUInt8(sz, base + 1); // height
  ico.writeUInt8(0, base + 2); // color count
  ico.writeUInt8(0, base + 3); // reserved
  ico.writeUInt16LE(1, base + 4); // planes
  ico.writeUInt16LE(32, base + 6); // bit count
  ico.writeUInt32LE(e.buf.length, base + 8); // size
  ico.writeUInt32LE(e.offset, base + 12); // offset
}

// Image data
for (const e of entries) {
  e.buf.copy(ico, e.offset);
}

fs.writeFileSync("resources/icon.ico", ico);
fs.writeFileSync("resources/icon.icns", pngBuffers[pngBuffers.length - 1]); // macOS uses PNG-in-icns or just PNG
console.log("icon.ico created");
console.log("icon.icns created");
