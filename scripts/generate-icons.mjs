/**
 * Generates PWA icons (pixel clock motif) into public/icons/.
 * Run: node scripts/generate-icons.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "icons");

const BG = [17, 17, 17, 255];
const FRAME = [139, 69, 19, 255];
const FACE = [42, 31, 31, 255];
const HANDS = [232, 224, 213, 255];
const MARK = [196, 165, 116, 255];

function setPixel(data, size, x, y, color) {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    data[i] = color[0];
    data[i + 1] = color[1];
    data[i + 2] = color[2];
    data[i + 3] = color[3];
}

function fillRect(data, size, x, y, w, h, color) {
    for (let py = y; py < y + h; py++) {
        for (let px = x; px < x + w; px++) {
            setPixel(data, size, px, py, color);
        }
    }
}

function drawClock(size) {
    const data = new Uint8Array(size * size * 4);
    for (let i = 0; i < data.length; i += 4) {
        data[i] = BG[0];
        data[i + 1] = BG[1];
        data[i + 2] = BG[2];
        data[i + 3] = BG[3];
    }

    const margin = Math.floor(size * 0.12);
    const dialSize = size - margin * 2;
    const cx = Math.floor(size / 2);
    const cy = Math.floor(size / 2);
    const radius = Math.floor(dialSize / 2);

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const dx = x - cx;
            const dy = y - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= radius && dist >= radius - Math.max(2, Math.floor(size * 0.04))) {
                setPixel(data, size, x, y, FRAME);
            } else if (dist < radius - Math.max(2, Math.floor(size * 0.04))) {
                setPixel(data, size, x, y, FACE);
            }
        }
    }

    const tickLen = Math.max(2, Math.floor(size * 0.06));
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
        const inner = radius - tickLen - Math.floor(size * 0.08);
        const outer = radius - Math.floor(size * 0.08);
        const x1 = Math.round(cx + Math.cos(angle) * inner);
        const y1 = Math.round(cy + Math.sin(angle) * inner);
        const x2 = Math.round(cx + Math.cos(angle) * outer);
        const y2 = Math.round(cy + Math.sin(angle) * outer);
        drawLine(data, size, x1, y1, x2, y2, MARK);
    }

    // Hour hand toward 11, minute toward 12 (clock stopped at eleven)
    drawLine(data, size, cx, cy, cx - Math.floor(radius * 0.35), cy - Math.floor(radius * 0.2), HANDS);
    drawLine(data, size, cx, cy, cx, cy - Math.floor(radius * 0.45), HANDS);
    setPixel(data, size, cx, cy, HANDS);
    fillRect(data, size, cx - 2, cy - 2, 4, 4, MARK);

    return data;
}

function drawLine(data, size, x0, y0, x1, y1, color) {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    let x = x0;
    let y = y0;
    while (true) {
        setPixel(data, size, x, y, color);
        if (x === x1 && y === y1) break;
        const e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            x += sx;
        }
        if (e2 < dx) {
            err += dx;
            y += sy;
        }
    }
}

function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
        crc ^= buf[i];
        for (let j = 0; j < 8; j++) {
            crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
        }
    }
    return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
    const typeBuf = Buffer.from(type, "ascii");
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
    return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(rgba, width, height) {
    const stride = width * 4;
    const raw = Buffer.alloc((stride + 1) * height);
    for (let y = 0; y < height; y++) {
        const rowStart = y * (stride + 1);
        raw[rowStart] = 0;
        rgba.copy(raw, rowStart + 1, y * stride, y * stride + stride);
    }
    const compressed = deflateSync(raw);

    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8;
    ihdr[9] = 6;
    ihdr[10] = 0;
    ihdr[11] = 0;
    ihdr[12] = 0;

    return Buffer.concat([
        signature,
        pngChunk("IHDR", ihdr),
        pngChunk("IDAT", compressed),
        pngChunk("IEND", Buffer.alloc(0))
    ]);
}

mkdirSync(outDir, { recursive: true });

for (const size of [180, 192, 512]) {
    const rgba = drawClock(size);
    const png = encodePng(Buffer.from(rgba), size, size);
    const name = size === 180 ? "apple-touch-icon.png" : `icon-${size}.png`;
    writeFileSync(join(outDir, name), png);
    console.log(`Wrote ${name}`);
}
