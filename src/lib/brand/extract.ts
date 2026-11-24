export interface BrandColors {
  primary: string;
  surface: string | null;
  accent: string | null;
}

type Lch = { l: number; c: number; h: number };
/** How often a color appears, and how much of that is as a background. */
export type ColorCount = { hex: string; score: number; background: number };
type Seen = Lch & ColorCount;

const COLOR = /#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|oklch\([^)]*\)/i;
const STATUS = /error|danger|destructive|warning|success|info|whatsapp|facebook|instagram|twitter|youtube|linkedin/i;
const WEIGHT: Record<string, number> = { "background-color": 3, background: 3, color: 2, fill: 2, stroke: 1, "border-color": 1 };

const toHex = (r: number, g: number, b: number) =>
  `#${[r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("").toUpperCase()}`;

function toOklch(hex: string): Lch {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const [x, y, z] = [0.4122 * r + 0.5363 * g + 0.0514 * b, 0.2119 * r + 0.6807 * g + 0.1074 * b, 0.0883 * r + 0.2817 * g + 0.63 * b].map(Math.cbrt);
  const [l, a, bb] = [0.2105 * x + 0.7936 * y - 0.0041 * z, 1.978 * x - 2.4286 * y + 0.4506 * z, 0.0259 * x + 0.7828 * y - 0.8087 * z];
  return { l, c: Math.hypot(a, bb), h: ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360 };
}

function fromOklch(l: number, c: number, h: number): string {
  const [a, b] = [c * Math.cos((h * Math.PI) / 180), c * Math.sin((h * Math.PI) / 180)];
  const [x, y, z] = [l + 0.3963 * a + 0.2158 * b, l - 0.1056 * a - 0.0639 * b, l - 0.0895 * a - 1.2915 * b].map((v) => v ** 3);
  return toHex(
    ...([4.0767 * x - 3.3077 * y + 0.2309 * z, -1.2684 * x + 2.6098 * y - 0.3413 * z, -0.0041 * x - 0.7034 * y + 1.707 * z]
      .map((v) => Math.max(0, v))
      .map((v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055) * 255) as [number, number, number])
  );
}

function parseColor(raw: string): string | null {
  const value = raw.trim().toLowerCase();
  if (value.startsWith("#")) {
    const body = value.slice(1);
    if (body.length === 3 || body.length === 4) {
      if (body.length === 4 && body[3] !== "f") return null;
      return `#${body.slice(0, 3).split("").map((c) => c + c).join("")}`.toUpperCase();
    }
    if (body.length === 8 && parseInt(body.slice(6), 16) < 128) return null;
    return body.length === 6 || body.length === 8 ? `#${body.slice(0, 6)}`.toUpperCase() : null;
  }
  const parts = value.slice(value.indexOf("(") + 1, -1).split(/[\s,/]+/).filter(Boolean);
  if (parts.length < 3 || parts.some((part) => part.includes("var") || part === "none" || part === "from")) return null;
  const alpha = parts[3];
  if (alpha && (alpha.endsWith("%") ? parseFloat(alpha) / 100 : parseFloat(alpha)) < 0.5) return null;
  const n = parts.map(parseFloat);
  if (n.slice(0, 3).some(Number.isNaN)) return null;
  if (value.startsWith("rgb")) return toHex(...((parts.slice(0, 3).map((p, i) => (p.endsWith("%") ? n[i] * 2.55 : n[i]))) as [number, number, number]));
  if (value.startsWith("oklch")) return fromOklch(parts[0].endsWith("%") ? n[0] / 100 : n[0], n[1], n[2]);
  const [h, s, l] = [n[0], n[1] / 100, n[2] / 100];
  const f = (k: number) => {
    const t = (k + h / 30) % 12;
    return (l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(t - 3, 9 - t, 1))) * 255;
  };
  return toHex(f(0), f(8), f(4));
}

const hueGap = (a: number, b: number) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
const attr = (tag: string, name: string) => new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i").exec(tag)?.[1]?.replaceAll("&amp;", "&") ?? "";

/** Scores colors by how much the site uses them, then separates main, page background and accent. */
export function extractColors(html: string, css: string): BrandColors | null {
  const inline = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join("\n");
  const text = `${css}\n${inline}`;
  const tokens = new Map([...text.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+)/g)].map((m) => [m[1], m[2].trim()]));
  const seen = new Map<string, ColorCount>();
  const add = (hex: string | null, score: number, isBackground = false) => {
    if (!hex) return;
    const item = seen.get(hex) ?? { hex, score: 0, background: 0 };
    item.score += score;
    if (isBackground) item.background += score;
    seen.set(hex, item);
  };
  const resolve = (value: string, depth = 0): string | null => {
    const ref = /var\(\s*(--[\w-]+)/.exec(value)?.[1];
    if (ref) return depth > 4 || STATUS.test(ref) ? null : resolve(tokens.get(ref) ?? "", depth + 1);
    const color = COLOR.exec(value)?.[0];
    return color ? parseColor(color) : null;
  };

  for (const [name, value] of tokens) if (!STATUS.test(name) && !name.startsWith("--tw-")) add(resolve(value), /primary|brand|accent|main|theme/i.test(name) ? 3 : 1);
  for (const m of text.matchAll(/(?:^|[;{\s])(background-color|background|color|border-color|fill|stroke)\s*:\s*([^;{}]+)/g)) {
    add(resolve(m[2]), WEIGHT[m[1]], m[1].startsWith("background"));
  }
  const themeTag = [...html.matchAll(/<meta[^>]+>/gi)].map((m) => m[0]).find((tag) => /name=["']theme-color["']/i.test(tag));
  const theme = themeTag ? parseColor(attr(themeTag, "content")) : null;
  add(theme, 40);
  return pickBrand([...seen.values()], theme);
}

/** Separates main, page background and accent from scored colors. */
export function pickBrand(counts: ColorCount[], theme: string | null = null): BrandColors | null {
  const all: Seen[] = counts.map((item) => ({ ...item, ...toOklch(item.hex) }));
  const colored = all.filter((item) => item.c >= 0.035 && item.l >= 0.1 && item.l <= 0.97);
  if (!colored.length) return null;

  const buckets = new Map<number, Seen[]>();
  for (const item of colored) {
    const key = Math.round(item.h / 30) % 12;
    buckets.set(key, [...(buckets.get(key) ?? []), item]);
  }
  const family = [...buckets.values()].sort((a, b) => b.reduce((t, i) => t + i.score, 0) - a.reduce((t, i) => t + i.score, 0))[0];
  const byScore = [...family].sort((a, b) => b.score - a.score);
  const main = byScore.find((item) => item.hex === theme) ?? byScore.find((item) => item.l >= 0.15 && item.l <= 0.62) ?? byScore[0];
  const accent = colored
    .filter((item) => hueGap(item.h, main.h) >= 35 && item.l >= 0.45)
    .sort((a, b) => b.score * b.c - a.score * a.c)[0];
  const surface = all.filter((item) => item.background > 0 && item.l >= 0.93 && item.c <= 0.05 && item.hex !== "#FFFFFF").sort((a, b) => b.background - a.background)[0];
  return { primary: main.hex, surface: surface?.hex ?? null, accent: accent?.hex ?? null };
}

const originalImage = (src: string, base: string) => {
  try {
    const url = new URL(src, base);
    const inner = url.pathname.endsWith("/_next/image") ? url.searchParams.get("url") : null;
    return new URL(inner ?? url.href, base).href;
  } catch {
    return null;
  }
};

/** Best logo first. A logo meant for dark backgrounds comes last because the poster header is light. */
export function logoCandidates(html: string, base: string): string[] {
  const header = /<header[\s\S]*?<\/header>/i.exec(html)?.[0] ?? "";
  const found: { url: string; score: number }[] = [];
  for (const [index, tag] of [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]).entries()) {
    const label = `${attr(tag, "alt")} ${attr(tag, "class")} ${attr(tag, "id")} ${attr(tag, "src")}`;
    const inHeader = header.includes(tag);
    if (!/logo|brand/i.test(label) && !(inHeader && attr(tag, "alt"))) continue;
    const url = originalImage(attr(tag, "src"), base);
    if (!url || url.startsWith("data:")) continue;
    const dark = /on-dark|dark|white|footer|inverse/i.test(label);
    found.push({ url, score: (inHeader ? 4 : 0) + (/logo/i.test(label) ? 4 : 0) - (dark ? 5 : 0) - index / 100 });
  }
  const jsonLogo = /"logo"\s*:\s*(?:\{[^}]*?"url"\s*:\s*)?"([^"]+)"/.exec(html)?.[1];
  const jsonUrl = jsonLogo && originalImage(jsonLogo.replaceAll("\\/", "/"), base);
  if (jsonUrl) found.push({ url: jsonUrl, score: 2 });
  const touch = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]).find((tag) => /rel=["']apple-touch-icon/i.test(tag));
  const touchUrl = touch && originalImage(attr(touch, "href"), base);
  if (touchUrl) found.push({ url: touchUrl, score: -8 });
  return [...new Set(found.sort((a, b) => b.score - a.score).map((item) => item.url))].slice(0, 4);
}

export function stylesheetLinks(html: string, base: string): string[] {
  const links = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]).filter((tag) => /rel=["']?stylesheet/i.test(tag));
  return links.flatMap((tag) => {
    try {
      return [new URL(attr(tag, "href"), base).href];
    } catch {
      return [];
    }
  }).filter((url) => url.startsWith("https://") && !/fonts\.googleapis/.test(url)).slice(0, 4);
}
