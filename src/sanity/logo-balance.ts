/* The homepage strip's logos, balanced by eye rather than by their image
   bounds. Each mark is read once (a small PNG of it, from the image CDN or
   public/): where its ink actually is, past any transparent padding, and
   how much of that box is ink. From those it gets one number, its shape:
   the width it is shown at, as a multiple of the strip's --logo-size
   (media.css). Every mark then covers the same area of ink box, nudged up
   when its drawing is light (thin lines) and down when it is heavy (solid
   lettering). A mark that can't be read (no transparency, or the fetch
   fails) falls back to its proportions alone. */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { inflateSync } from 'node:zlib';

/** How width follows proportions: 0.5 is equal area; a little less keeps very long wordmarks from running on */
const SHAPE_WEIGHT = 0.45;
/** The ink coverage the nudge is measured against: a typical wordmark */
const REFERENCE_DENSITY = 0.3;
/** How strongly the nudge follows density: 0 ignores it, 0.5 would match ink pixel for pixel */
const DENSITY_WEIGHT = 0.25;
/** The most the nudge may grow or shrink a mark */
const NUDGE_RANGE: [number, number] = [0.8, 1.25];
/** The width each mark is read at: plenty to find its edges */
const SAMPLE_WIDTH = 160;

/** A mark's ink box: its width as a fraction of the picture's, its proportions, and how much of it is ink */
type Ink = { width: number; aspect: number; density: number };

const cache = new Map<string, Promise<Ink | null>>();

/** The width to show a logo at, as a multiple of --logo-size; undefined when nothing is known of it */
export async function logoShape(src: string, width?: number, height?: number): Promise<number | undefined> {
  if (!cache.has(src)) cache.set(src, readInk(src).catch(() => null));
  const ink = await cache.get(src)!;
  if (!ink) return width && height ? (width / height) ** SHAPE_WEIGHT : undefined;
  const nudge = clamp((REFERENCE_DENSITY / ink.density) ** DENSITY_WEIGHT, ...NUDGE_RANGE);
  // the formula sets the ink box's width; the picture is wider by its padding
  return (ink.aspect ** SHAPE_WEIGHT * nudge) / ink.width;
}

async function readInk(src: string): Promise<Ink | null> {
  const png = src.startsWith('http') ? await fetchPng(src) : await readFile(join(process.cwd(), 'public', src.replace(/^\//, '')));
  const image = decodePng(png);
  if (!image) return null;
  const { width: w, height: h, alpha } = image;
  let minX = w, minY = h, maxX = -1, maxY = -1, ink = 0, opaque = true;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = alpha[y * w + x];
      if (a < 255) opaque = false;
      if (a <= 20) continue;
      ink += a / 255;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  // a mark on a solid ground has no edges to find
  if (opaque || maxX < 0) return null;
  const iw = maxX - minX + 1, ih = maxY - minY + 1;
  return { width: iw / w, aspect: iw / ih, density: ink / (iw * ih) };
}

async function fetchPng(src: string) {
  const url = new URL(src);
  url.searchParams.set('w', String(SAMPLE_WIDTH));
  url.searchParams.set('fm', 'png');
  url.searchParams.delete('auto');
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

/** A PNG's alpha channel, one byte per pixel; null for what it can't read (16-bit, interlaced, no transparency) */
function decodePng(buffer: Buffer): { width: number; height: number; alpha: Uint8Array } | null {
  if (buffer.readUInt32BE(0) !== 0x89504e47) return null;
  let offset = 8, width = 0, height = 0, depth = 0, type = 0, interlace = 0;
  let transparency: Buffer | null = null;
  const data: Buffer[] = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const name = buffer.toString('latin1', offset + 4, offset + 8);
    const body = buffer.subarray(offset + 8, offset + 8 + length);
    if (name === 'IHDR') {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      depth = body[8];
      type = body[9];
      interlace = body[12];
    } else if (name === 'tRNS') transparency = body;
    else if (name === 'IDAT') data.push(body);
    else if (name === 'IEND') break;
    offset += 12 + length;
  }
  const channels = ({ 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 } as Record<number, number>)[type];
  if (depth !== 8 || interlace || !channels) return null;
  if ((type === 0 || type === 2) && !transparency) return null;

  // undo each row's filter, then keep the alpha
  const raw = inflateSync(Buffer.concat(data));
  const stride = width * channels;
  const pixels = new Uint8Array(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const row = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let i = 0; i < stride; i++) {
      const left = i >= channels ? pixels[y * stride + i - channels] : 0;
      const up = y ? pixels[(y - 1) * stride + i] : 0;
      const upLeft = y && i >= channels ? pixels[(y - 1) * stride + i - channels] : 0;
      const predict =
        filter === 1 ? left
        : filter === 2 ? up
        : filter === 3 ? (left + up) >> 1
        : filter === 4 ? paeth(left, up, upLeft)
        : 0;
      pixels[y * stride + i] = (row[i] + predict) & 0xff;
    }
  }
  const alpha = new Uint8Array(width * height);
  for (let p = 0; p < width * height; p++) {
    if (type === 6) alpha[p] = pixels[p * 4 + 3];
    else if (type === 4) alpha[p] = pixels[p * 2 + 1];
    else if (type === 3) alpha[p] = transparency && pixels[p] < transparency.length ? transparency[pixels[p]] : 255;
    else alpha[p] = 255; // gray or RGB with one transparent colour: treated as opaque, so read as no edges
  }
  return { width, height, alpha };
}

function paeth(a: number, b: number, c: number) {
  const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
