import { lookup, type LookupAddress } from "node:dns";
import https from "node:https";
import net from "node:net";
import zlib from "node:zlib";
import { extractColors, logoCandidates, stylesheetLinks, type BrandColors } from "./extract";

const TIMEOUT_MS = 8000;
const MAX_PAGE_BYTES = 2_000_000;
const MAX_LOGO_BYTES = 2_500_000;
const MAX_REDIRECTS = 3;

const BLOCKED = new net.BlockList();
for (const [address, prefix] of [["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24], ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4]] as const) {
  BLOCKED.addSubnet(address, prefix, "ipv4");
}
for (const [address, prefix] of [["::", 128], ["::1", 128], ["64:ff9b::", 96], ["100::", 64], ["2001:db8::", 32], ["fc00::", 7], ["fe80::", 10], ["ff00::", 8]] as const) {
  BLOCKED.addSubnet(address, prefix, "ipv6");
}

export function isPublicAddress(ip: string): boolean {
  const family = net.isIP(ip);
  return family !== 0 && !BLOCKED.check(ip, family === 6 ? "ipv6" : "ipv4");
}

/** Only public HTTPS sites on the normal port. This route must never reach internal services. */
export function normalizeWebsite(value: string): string | null {
  const text = value.trim();
  if (!text || /\s/.test(text)) return null;
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(text) ? text : `https://${text}`);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443")) return null;
    if (net.isIP(host.replace(/^\[|\]$/g, "")) || !host.includes(".") || /(^|\.)(localhost|local|internal|intranet|lan|home|corp)$/.test(host)) return null;
    url.hash = "";
    return url.href;
  } catch {
    return null;
  }
}

// Checked at connection time, so a domain cannot pass validation and then switch to a private IP.
const publicLookup: net.LookupFunction = (hostname, options, callback) => {
  lookup(hostname, { ...options, all: true }, (error, addresses) => {
    const list = addresses as unknown as LookupAddress[] | undefined;
    if (error || !list?.length) return callback(error ?? new Error("No address"), "", 0);
    if (!list.every((item) => isPublicAddress(item.address))) return callback(new Error("Private address blocked"), "", 0);
    if (options.all) return (callback as unknown as (e: null, a: LookupAddress[]) => void)(null, list);
    callback(null, list[0].address, list[0].family);
  });
};

function requestOnce(url: string, maxBytes: number) {
  return new Promise<{ status: number; location?: string; type: string; body: Buffer }>((resolve, reject) => {
    const request = https.get(url, { lookup: publicLookup, timeout: TIMEOUT_MS, headers: { "user-agent": "Mozilla/5.0 (compatible; BrandPreview/1.0)", accept: "*/*", "accept-encoding": "gzip, br" } }, (response) => {
      const status = response.statusCode ?? 0;
      if (status >= 300 && status < 400) {
        response.resume();
        return resolve({ status, location: response.headers.location, type: "", body: Buffer.alloc(0) });
      }
      const encoding = response.headers["content-encoding"];
      const stream = encoding === "br" ? response.pipe(zlib.createBrotliDecompress()) : encoding === "gzip" ? response.pipe(zlib.createGunzip()) : response;
      const chunks: Buffer[] = [];
      let size = 0;
      stream.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > maxBytes) {
          request.destroy(new Error("Response too large"));
          return;
        }
        chunks.push(chunk);
      });
      stream.on("end", () => resolve({ status, type: String(response.headers["content-type"] ?? ""), body: Buffer.concat(chunks) }));
      stream.on("error", reject);
      response.on("error", reject);
    });
    request.on("timeout", () => request.destroy(new Error("Timed out")));
    request.on("error", reject);
  });
}

async function safeGet(start: string, maxBytes: number) {
  let url = start;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const safe = normalizeWebsite(url);
    if (!safe) throw new Error("Unsafe URL");
    const result = await requestOnce(safe, maxBytes);
    if (!result.location) {
      if (result.status !== 200) throw new Error(`Status ${result.status}`);
      return { ...result, url: safe };
    }
    url = new URL(result.location, safe).href;
  }
  throw new Error("Too many redirects");
}

function imageType(body: Buffer): string | null {
  if (body.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (body.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return "image/jpeg";
  if (body.subarray(0, 4).toString("latin1") === "RIFF" && body.subarray(8, 12).toString("latin1") === "WEBP") return "image/webp";
  return /^\s*(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*<svg[\s>]/i.test(body.subarray(0, 1000).toString("utf8")) ? "image/svg+xml" : null;
}

export type WebsiteBrand = BrandColors & { logo: string | null; url: string };

export async function readWebsiteBrand(website: string): Promise<WebsiteBrand | null> {
  const page = await safeGet(website, MAX_PAGE_BYTES);
  if (!/html/i.test(page.type)) return null;
  const html = page.body.toString("utf8");
  const sheets = await Promise.allSettled(stylesheetLinks(html, page.url).map((link) => safeGet(link, MAX_PAGE_BYTES)));
  const css = sheets.flatMap((sheet) => (sheet.status === "fulfilled" ? [sheet.value.body.toString("utf8")] : [])).join("\n");
  const colors = extractColors(html, css);

  let logo: string | null = null;
  for (const candidate of logoCandidates(html, page.url)) {
    const image = await safeGet(candidate, MAX_LOGO_BYTES).catch(() => null);
    const type = image && imageType(image.body);
    if (image && type) {
      logo = `data:${type};base64,${image.body.toString("base64")}`;
      break;
    }
  }
  if (!colors && !logo) return null;
  return { primary: colors?.primary ?? "#1F2937", surface: colors?.surface ?? null, accent: colors?.accent ?? null, logo, url: page.url };
}
