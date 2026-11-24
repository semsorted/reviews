import { describe, expect, it } from "vitest";
import { contentBox, imagePalette, logoPalette } from "./logo-image";

/** A white 100x100 page with a red 20x10 logo at (40, 60). */
function page() {
  const [width, height] = [100, 100];
  const data = new Uint8ClampedArray(width * height * 4).fill(255);
  for (let y = 60; y < 70; y++) for (let x = 40; x < 60; x++) data.set([200, 30, 30, 255], (y * width + x) * 4);
  data.set([0, 0, 0, 255], (5 * width + 5) * 4); // one speck of dust
  return { data, width, height };
}

describe("logo image", () => {
  it("trims the page around the logo", () => {
    const box = contentBox(page());
    expect(box.x).toBeCloseTo(0.37);
    expect(box.y).toBeCloseTo(0.57);
    expect(box.x + box.w).toBeCloseTo(0.63);
    expect(box.y + box.h).toBeCloseTo(0.73);
  });

  it("takes the logo's color as the poster color", () => {
    expect(imagePalette(page())?.primary).toBe("#CC2222");
  });
});

describe("logo on a colored background", () => {
  it("uses the background for the page and the logo color for the QR panel", () => {
    const { data, width, height } = page();
    for (let i = 0; i < data.length; i += 4) if (data[i] === 255) data.set([90, 20, 40], i);
    const palette = logoPalette({ data, width, height });
    expect(palette?.surface).toBe("#5A1428");
    expect(palette?.primary).not.toBe(palette?.surface);
  });
});
