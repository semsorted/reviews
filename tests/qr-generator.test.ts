import { describe, expect, it } from "vitest";
import { generateQrPng, generateQrSvg } from "@/lib/qr/generator";

const url = "https://reviews.example.com/r/AbCdEf123456";

describe("QR generator", () => {
  it("creates a PNG data URL", async () => {
    const png = await generateQrPng({ url, width: 400 });
    expect(png.startsWith("data:image/png;base64,")).toBe(true);
    expect(png.length).toBeGreaterThan(100);
  });

  it("uses a dark print-safe color for SVG output", async () => {
    const svg = await generateQrSvg({ url });
    expect(svg).toContain("<svg");
    expect(svg.toLowerCase()).toContain("#111111");
  });
});
