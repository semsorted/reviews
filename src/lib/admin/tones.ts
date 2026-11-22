export const TONE_CLASS = {
  blue: "bg-g-blue text-white",
  deep: "bg-[#174ea6] text-white",
  green: "bg-g-green text-white",
  yellow: "bg-g-yellow text-ink",
  red: "bg-g-red text-white",
} as const;

export type Tone = keyof typeof TONE_CLASS;

const SHOP_TONES: Tone[] = ["blue", "green", "yellow", "deep", "red"];

/** Each shop keeps one color, however the list is sorted or filtered. */
export function shopTone(id: string): Tone {
  const hash = [...id].reduce((total, char) => (total * 31 + char.charCodeAt(0)) >>> 0, 7);
  return SHOP_TONES[hash % SHOP_TONES.length];
}
