import { describe, expect, it } from "vitest";
import { ShopUpdateSchema } from "@/lib/admin/api";
import { isLogoImage, MAX_LOGO_LENGTH } from "@/lib/admin/logo";

const data = (type: string, bytes: number[]) => `data:image/${type};base64,${Buffer.from(bytes).toString("base64")}`;
const png = data("png", [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2]);
const jpeg = data("jpeg", [0xff, 0xd8, 0xff, 0xe0, 1, 2]);
const webp = data("webp", [...Buffer.from("RIFF"), 1, 0, 0, 0, ...Buffer.from("WEBP"), 1]);

describe("uploaded logo", () => {
  it.each([png, jpeg, webp])("accepts a real image", (logo) => {
    expect(isLogoImage(logo)).toBe(true);
    expect(ShopUpdateSchema.safeParse({ logoUrl: logo }).success).toBe(true);
  });

  it("rejects SVG, because it can carry scripts", () => {
    const svg = `data:image/svg+xml;base64,${Buffer.from("<svg onload=alert(1)>").toString("base64")}`;
    expect(isLogoImage(svg)).toBe(false);
    expect(ShopUpdateSchema.safeParse({ logoUrl: svg }).success).toBe(false);
  });

  it("rejects a file pretending to be an image", () => {
    expect(isLogoImage(data("png", [...Buffer.from("<html>not png")]))).toBe(false);
    expect(isLogoImage("data:image/png;base64,@@@@")).toBe(false);
  });

  it("rejects an oversized logo", () => {
    expect(isLogoImage(png + "A".repeat(MAX_LOGO_LENGTH))).toBe(false);
  });

  it("still allows a secure link or no logo", () => {
    expect(ShopUpdateSchema.safeParse({ logoUrl: "https://example.com/logo.png" }).success).toBe(true);
    expect(ShopUpdateSchema.safeParse({ logoUrl: "" }).success).toBe(true);
    expect(ShopUpdateSchema.safeParse({ logoUrl: "http://example.com/logo.png" }).success).toBe(false);
  });
});
