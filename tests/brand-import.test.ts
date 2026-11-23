import { describe, expect, it } from "vitest";
import { ShopUpdateSchema } from "@/lib/admin/api";
import { extractColors, logoCandidates, stylesheetLinks } from "@/lib/brand/extract";
import { isPublicAddress, normalizeWebsite } from "@/lib/brand/fetch";
import { posterFor } from "@/lib/qr/poster";

const contrast = (a: string, b: string) => {
  const lum = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const clinicCss = `:root{--color-ivory:#f8f5ee;--color-surface:#fff;--color-forest-900:#012f1e;--color-forest-600:#177550;--color-accent-600:#8a6400;--color-accent-500:#f7b702;--color-error:#a3402a;--color-charcoal:#22221d}
.a{background-color:var(--color-ivory)}.b{background-color:var(--color-ivory)}.c{background-color:var(--color-forest-900)}.d{color:var(--color-forest-600)}.e{background-color:var(--color-accent-500)}.f{color:var(--color-error)}.g{background:#25863f}`;

describe("reading a website's brand", () => {
  it("finds the main, background and accent colors", () => {
    expect(extractColors('<meta name="theme-color" content="#012F1E"/>', clinicCss)).toEqual({ primary: "#012F1E", surface: "#F8F5EE", accent: "#F7B702" });
  });

  it("reads modern CSS color formats", () => {
    expect(extractColors("", ".a{background:rgb(120 20 60)}.b{background:rgb(120 20 60)}.c{color:oklch(0.8 0.16 85)}")?.primary).toBe("#78143C");
  });

  it("returns nothing for a black and white page", () => {
    expect(extractColors("", ".a{color:#111;background:#fff;border-color:#ddd}")).toBeNull();
  });

  it("picks the header logo for light backgrounds", () => {
    const html = `<header><img alt="Aura" class="logo" src="/_next/image?url=%2Fmedia%2Flogo-on-light.png&amp;w=3840&amp;q=75"></header><img src="/hero.jpg"><footer><img alt="logo" src="/_next/image?url=%2Fmedia%2Flogo-on-dark.png&amp;w=640"></footer>`;
    expect(logoCandidates(html, "https://clinic.example/")[0]).toBe("https://clinic.example/media/logo-on-light.png");
  });

  it("never treats a normal photo as a logo", () => {
    expect(logoCandidates('<img src="/hero.jpg" alt="Our team">', "https://clinic.example/")).toEqual([]);
  });

  it("finds stylesheets on the page", () => {
    expect(stylesheetLinks('<link rel="stylesheet" href="/a.css"><link href="/b.css?v=1" rel="stylesheet">', "https://x.example/page")).toEqual(["https://x.example/a.css", "https://x.example/b.css?v=1"]);
  });
});

describe("website link safety", () => {
  it.each(["auracureclinic.com", "https://www.auracureclinic.com/", "https://shop.example.in:443/about"])("accepts %s", (value) => {
    expect(normalizeWebsite(value)?.startsWith("https://")).toBe(true);
  });

  it.each(["http://example.com", "ftp://example.com", "https://localhost", "https://127.0.0.1", "https://169.254.169.254/latest", "https://[::1]/", "https://user:pass@example.com", "https://example.com:8443", "https://db.internal", "https://printer.local", "not a link", ""])("refuses %s", (value) => {
    expect(normalizeWebsite(value)).toBeNull();
  });

  it.each(["127.0.0.1", "10.2.3.4", "172.16.0.9", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "::1", "fe80::1", "fd00::1", "::ffff:127.0.0.1", "::ffff:169.254.169.254"])("blocks private address %s", (ip) => {
    expect(isPublicAddress(ip)).toBe(false);
  });

  it.each(["8.8.8.8", "76.76.21.21", "2606:4700:4700::1111"])("allows public address %s", (ip) => {
    expect(isPublicAddress(ip)).toBe(true);
  });
});

describe("branded poster colors", () => {
  it("uses the website palette exactly", () => {
    expect(posterFor("Clinic", "en", "#012F1E", { surface: "#F8F5EE", accent: "#F7B702" })).toMatchObject({ background: "#012F1E", page: "#F8F5EE", accent: "#F7B702", foreground: "#FFFFFF", ink: "#012F1E" });
  });

  it("gives every business type a designed palette without a website", () => {
    expect(posterFor("Clinic", "en", "#1A73E8").background).not.toBe("#1A73E8");
    expect(posterFor("Restaurant", "en", "#D93025").background).not.toBe(posterFor("Clinic", "en", "#188038").background);
  });

  it.each([
    ["#FFFFFF", "#FFFFFF", "#FFFFFF"], ["#FBBC04", "#FFF8E1", "#FBBC04"], ["#012F1E", "#012F1E", "#012F1E"], ["#7B1FA2", "#F7B702", "#7B1FA2"], ["#000000", "#111111", "#222222"],
  ])("keeps text readable on %s, %s, %s", (primary, surface, accent) => {
    const poster = posterFor("Clinic", "en", primary, { surface, accent });
    expect(contrast(poster.background, poster.foreground)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(poster.page, poster.ink)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(poster.page, poster.muted)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(poster.background, poster.accent)).toBeGreaterThanOrEqual(3);
    expect(contrast(poster.accent, poster.onAccent)).toBeGreaterThanOrEqual(4.5);
  });

  it("speaks to patients on health posters", () => {
    expect(posterFor("Clinic", "en", "#012F1E").line).toContain("patients");
    expect(posterFor("Bakery", "en", "#012F1E").line).not.toContain("patients");
  });
});

describe("saving a brand", () => {
  it("accepts brand fields", () => {
    expect(ShopUpdateSchema.safeParse({ websiteUrl: "https://www.auracureclinic.com/", surfaceColor: "#F8F5EE", accentColor: "#F7B702" }).success).toBe(true);
    expect(ShopUpdateSchema.safeParse({ websiteUrl: "", surfaceColor: null, accentColor: null }).success).toBe(true);
  });
  it("refuses bad brand fields", () => {
    expect(ShopUpdateSchema.safeParse({ websiteUrl: "http://example.com" }).success).toBe(false);
    expect(ShopUpdateSchema.safeParse({ accentColor: "gold" }).success).toBe(false);
  });
});
