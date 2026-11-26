import { chipFamily } from "./chip-families";
import { seededRandom } from "./instant-draft";
import { VISIBLE_CHIPS } from "./rules";

/** Today's date in India, so the chips change at midnight for customers, not at UTC midnight. */
export const indiaDay = (now = new Date()) => new Date(now.getTime() + 330 * 60_000).toISOString().slice(0, 10);

/** The name a chip shows today. Names take turns, so it changes every day and every name comes up. */
export function chipNameForDay(label: string, day: string): string {
  const names = chipFamily(label)?.names;
  if (!names) return label;
  const dayNumber = Math.floor(Date.parse(day) / 86_400_000);
  const offset = Math.floor(seededRandom(label.toLowerCase())() * names.length);
  return names[(dayNumber + offset) % names.length];
}

/**
 * The chips a customer sees today: every pinned chip, then a daily pick from the rest, in the admin's order.
 * A business with no more chips than fit sees all of them every day, as before.
 */
export function chipsForDay<T extends { id: string; label: string; isPinned: boolean }>(chips: T[], shopId: string, day: string): (T & { name: string })[] {
  let shown = chips;
  if (chips.length > VISIBLE_CHIPS) {
    const random = seededRandom(`${shopId}:${day}`);
    const pinned = chips.filter((chip) => chip.isPinned);
    const picked = new Set(
      chips
        .filter((chip) => !chip.isPinned)
        .map((chip) => ({ id: chip.id, key: random() }))
        .sort((a, b) => a.key - b.key)
        .slice(0, Math.max(0, VISIBLE_CHIPS - pinned.length))
        .map(({ id }) => id),
    );
    shown = [...pinned, ...chips.filter((chip) => picked.has(chip.id))];
  }
  return shown.map((chip) => ({ ...chip, name: chipNameForDay(chip.label, day) }));
}
