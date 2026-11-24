import { pickBrand, type BrandColors, type ColorCount } from "@/lib/brand/extract";

const MAX_WIDTH = 720;
const MAX_HEIGHT = 360;
const MAX_LENGTH = 190_000;
const SAMPLE = 200;

/** Part of an image, in fractions of its width and height. */
export type Box = { x: number; y: number; w: number; h: number };
export const FULL: Box = { x: 0, y: 0, w: 1, h: 1 };

type Pixels = { data: Uint8ClampedArray; width: number; height: number };

const quantize = (data: Uint8ClampedArray, i: number) =>
  `#${[0, 1, 2].map((c) => (Math.round(data[i + c] / 17) * 17).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
const isClear = (data: Uint8ClampedArray, i: number) => data[i + 3] < 128;

const toHex = (rgb: number[]) => `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase()}`;

/** The most common color along the edges is the background. Its exact average lets the poster page match it. */
function backgroundOf({ data, width, height }: Pixels): [number, number, number] | null {
  const sums = new Map<string, number[]>();
  const edge = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    if (isClear(data, i)) return;
    const key = quantize(data, i);
    const sum = sums.get(key) ?? [0, 0, 0, 0];
    sums.set(key, [sum[0] + 1, sum[1] + data[i], sum[2] + data[i + 1], sum[3] + data[i + 2]]);
  };
  for (let x = 0; x < width; x++) {
    edge(x, 0);
    edge(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    edge(0, y);
    edge(width - 1, y);
  }
  const top = [...sums.values()].sort((a, b) => b[0] - a[0])[0];
  return top ? [top[1] / top[0], top[2] / top[0], top[3] / top[0]] : null;
}

function isBackground(data: Uint8ClampedArray, i: number, bg: [number, number, number] | null) {
  if (isClear(data, i)) return true;
  return bg !== null && Math.abs(data[i] - bg[0]) + Math.abs(data[i + 1] - bg[1]) + Math.abs(data[i + 2] - bg[2]) < 60;
}

/** Trims the plain page or screen around the logo. Stray specks are ignored. */
export function contentBox(pixels: Pixels): Box {
  const { data, width, height } = pixels;
  const bg = backgroundOf(pixels);
  const cols = new Array<number>(width).fill(0);
  const rows = new Array<number>(height).fill(0);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (isBackground(data, (y * width + x) * 4, bg)) continue;
      cols[x]++;
      rows[y]++;
    }
  }
  const span = (lines: number[], length: number) => {
    const min = Math.max(2, length * 0.01);
    const first = lines.findIndex((n) => n >= min);
    return first < 0 ? null : [first, lines.findLastIndex((n) => n >= min) + 1];
  };
  const [x, y] = [span(cols, height), span(rows, width)];
  if (!x || !y) return FULL;
  const pad = 0.03;
  const left = Math.max(0, x[0] / width - pad);
  const top = Math.max(0, y[0] / height - pad);
  return { x: left, y: top, w: Math.min(1, x[1] / width + pad) - left, h: Math.min(1, y[1] / height + pad) - top };
}

function countColors({ data }: Pixels, bg: [number, number, number] | null, skipBackground: boolean) {
  const counts = new Map<string, ColorCount>();
  for (let i = 0; i < data.length; i += 4) {
    if (isClear(data, i)) continue;
    const background = isBackground(data, i, bg);
    if (background && skipBackground) continue;
    const hex = quantize(data, i);
    const item = counts.get(hex) ?? { hex, score: 0, background: 0 };
    item.score++;
    if (background) item.background++;
    counts.set(hex, item);
  }
  return [...counts.values()];
}

/** A reference image: its colors are picked like a website's. */
export function imagePalette(pixels: Pixels): BrandColors | null {
  return pickBrand(countColors(pixels, backgroundOf(pixels), false));
}

/** A logo: its background fills the poster page, and its own color fills the QR panel. */
export function logoPalette(pixels: Pixels): BrandColors | null {
  const bg = backgroundOf(pixels);
  const ink = countColors(pixels, bg, true);
  const main = [...ink].sort((a, b) => b.score - a.score)[0];
  if (!main) return null;
  const brand = pickBrand(ink);
  return { primary: brand?.primary ?? main.hex, accent: brand?.accent ?? null, surface: bg && toHex(bg) };
}

export async function loadImage(source: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.src = source;
  await image.decode();
  return image;
}

function draw(image: HTMLImageElement, box: Box, scale: number) {
  const [width, height] = [image.naturalWidth || 512, image.naturalHeight || 512];
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * box.w * scale));
  canvas.height = Math.max(1, Math.round(height * box.h * scale));
  const context = canvas.getContext("2d", { willReadFrequently: true })!;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, width * box.x, height * box.y, width * box.w, height * box.h, 0, 0, canvas.width, canvas.height);
  return { canvas, context };
}

/** A small copy is enough to find the logo and its colors. */
export function sample(image: HTMLImageElement, box: Box = FULL): Pixels {
  const scale = SAMPLE / Math.max((image.naturalWidth || 512) * box.w, (image.naturalHeight || 512) * box.h);
  const { canvas, context } = draw(image, box, Math.min(1, scale));
  return { data: context.getImageData(0, 0, canvas.width, canvas.height).data, width: canvas.width, height: canvas.height };
}

/** Keeps the logo's shape and transparency, then shrinks it until it fits the database limit. */
export async function toLogoData(source: string | HTMLImageElement, box: Box = FULL): Promise<string> {
  const image = typeof source === "string" ? await loadImage(source) : source;
  const [width, height] = [(image.naturalWidth || 512) * box.w, (image.naturalHeight || 512) * box.h];
  let scale = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height, 1);
  for (let attempt = 0; attempt < 6; attempt++) {
    const { canvas } = draw(image, box, scale);
    const webp = canvas.toDataURL("image/webp", 0.92);
    const data = webp.startsWith("data:image/webp") ? webp : canvas.toDataURL("image/png");
    if (data.length <= MAX_LENGTH) return data;
    scale *= 0.75;
  }
  throw new Error("Logo too large");
}
