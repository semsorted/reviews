export type PosterSizeKey = "4x6" | "a5" | "a4" | "custom";
export type SizeUnit = "in" | "cm" | "mm";
export type PosterSize = {
  key: PosterSizeKey;
  label: string;
  wMm: number;
  hMm: number;
  /** The query that reopens this size. */
  query: Record<string, string>;
  /** What the admin typed in the custom form, kept so the form can show it again. */
  input: { w: string; h: string; unit: string };
  error?: string;
};

export const PRESETS = {
  "4x6": { label: "4×6 inch", wMm: 101.6, hMm: 152.4 },
  a5: { label: "A5", wMm: 148, hMm: 210 },
  a4: { label: "A4", wMm: 210, hMm: 297 },
} as const;
const UNIT_MM: Record<SizeUnit, number> = { in: 25.4, cm: 10, mm: 1 };
const NUMBER = /^\d{1,4}(\.\d{1,2})?$/;
const SIDE_MM = [75, 600] as const;
const RATIO = [0.4, 2.5] as const;
/** Each design keeps its own shape and is centred on sheets that are wider than it. */
export const DESIGN_RATIO = { normal: 1.5, custom: 297 / 210 } as const;
const QR_SHARE = { normal: 0.56, custom: 0.54 } as const;

const first = (value: unknown) => (typeof value === "string" ? value : undefined);
const round = (mm: number) => Math.round(mm * 10) / 10;

function preset(key: keyof typeof PRESETS, input: PosterSize["input"], error?: string): PosterSize {
  return { key, ...PRESETS[key], query: { size: key }, input, error };
}

export function parsePosterSize(query: { size?: unknown; w?: unknown; h?: unknown; unit?: unknown }): PosterSize {
  const size = first(query.size);
  const input = { w: first(query.w) ?? "", h: first(query.h) ?? "", unit: first(query.unit) ?? "in" };
  if (size === "a4" || size === "a5") return preset(size, input);
  if (size !== "custom") return preset("4x6", input);

  const unit = input.unit as SizeUnit;
  const valid = NUMBER.test(input.w) && NUMBER.test(input.h) && unit in UNIT_MM;
  const wMm = valid ? round(Number(input.w) * UNIT_MM[unit]) : 0;
  const hMm = valid ? round(Number(input.h) * UNIT_MM[unit]) : 0;
  const ratio = hMm / wMm;
  const fits = [wMm, hMm].every((side) => side >= SIDE_MM[0] && side <= SIDE_MM[1]) && ratio >= RATIO[0] && ratio <= RATIO[1];
  if (!valid || !fits) {
    return preset("4x6", input, "Use a size from 7.5 cm to 60 cm on each side, with the height between 0.4 and 2.5 times the width. Showing 4×6 inch instead.");
  }
  return { key: "custom", label: `${input.w}×${input.h} ${unit}`, wMm, hMm, query: { size: "custom", w: input.w, h: input.h, unit }, input };
}

/** Printed QR width in mm, so small custom sizes can be checked for scanning. */
export function qrMm(size: { wMm: number; hMm: number }, design: keyof typeof DESIGN_RATIO) {
  return Math.min(size.wMm, size.hMm / DESIGN_RATIO[design]) * QR_SHARE[design];
}
