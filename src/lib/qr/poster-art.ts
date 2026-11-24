export type PosterArt = "fashion" | "clinic" | "food" | "beauty";

const FASHION_TYPES = new Set(["Clothing store", "Saree and ethnic wear", "Kids wear", "Boutique", "Tailor", "Footwear store", "Jewellery store", "Watch and accessories"]);

/** Which set of faint background drawings suits this business. Types without a clear set get none. */
export function artFor(category: string, group: string | null): PosterArt | null {
  if (FASHION_TYPES.has(category)) return "fashion";
  if (group === "Health") return "clinic";
  if (group === "Food and drink") return "food";
  if (group === "Beauty and wellness") return "beauty";
  return null;
}

const leaf = "M50 92C50 60 50 34 50 8" + [[-13, 72, -38], [13, 64, 38], [-13, 46, -38], [13, 38, 38], [0, 16, 0]].map(([dx, y, a]) => ellipse(50 + dx, y, a)).join("");
function ellipse(cx: number, cy: number, angle: number) {
  const rx = 8, ry = 15, k = 0.5523;
  const [c, s] = [Math.cos((angle * Math.PI) / 180), Math.sin((angle * Math.PI) / 180)];
  const p = (x: number, y: number) => `${(cx + x * c - y * s).toFixed(1)} ${(cy + x * s + y * c).toFixed(1)}`;
  return `M${p(0, -ry)}C${p(rx * k, -ry)} ${p(rx, -ry * k)} ${p(rx, 0)}C${p(rx, ry * k)} ${p(rx * k, ry)} ${p(0, ry)}C${p(-rx * k, ry)} ${p(-rx, ry * k)} ${p(-rx, 0)}C${p(-rx, -ry * k)} ${p(-rx * k, -ry)} ${p(0, -ry)}Z`;
}

/** Simple outline drawings on a 100×100 grid. */
const SYMBOLS: Record<PosterArt, string[]> = {
  fashion: [
    "M34 14L14 26L22 42L32 36V88H68V36L78 42L86 26L66 14C62 22 38 22 34 14ZM42 16L50 30L58 16M50 30V88",
    "M42 10L38 30L28 42L18 90H82L72 42L62 30L58 10M38 30H62M30 50H70M42 10Q50 22 58 10",
    "M50 24a6 6 0 1 0-6-6M50 24v6L12 54a4 4 0 0 0 2.5 7H85.5a4 4 0 0 0 2.5-7L50 30",
    "M42 12H58L54 28L63 84L50 94L37 84L46 28ZM42 12L50 20L58 12",
    "M25 78a9 9 0 1 0 18 0a9 9 0 1 0-18 0M57 78a9 9 0 1 0 18 0a9 9 0 1 0-18 0M40 70L62 14M60 70L38 14",
    "M20 86L80 14M80 14C94 4 88 30 70 34C54 38 64 58 40 58",
    "M20 50a30 30 0 1 0 60 0a30 30 0 1 0-60 0M28 50a22 22 0 1 0 44 0a22 22 0 1 0-44 0M39 42h6M55 42h6M39 58h6M55 58h6",
  ],
  clinic: [
    leaf,
    "M40 12H60V40H88V60H60V88H40V60H12V40H40Z",
    "M28 12V42A22 22 0 0 0 72 42V12M50 64V72A18 18 0 0 0 86 72M78 56a8 8 0 1 0 16 0a8 8 0 1 0-16 0",
    "M50 10C70 40 82 58 82 72A32 32 0 0 1 18 72C18 58 30 40 50 10ZM36 70A14 14 0 0 0 50 84",
    "M6 54H30L38 30L52 78L62 44L68 54H94",
    "M16 40L60 12A16 16 0 0 1 84 36L40 84A16 16 0 0 1 16 60ZM38 28L72 62",
    "M30 14C38 10 44 18 50 18C56 18 62 10 70 14C84 20 80 44 74 56C70 66 70 90 62 90C54 90 56 66 50 66C44 66 46 90 38 90C30 90 30 66 26 56C20 44 16 20 30 14Z",
  ],
  food: [
    "M30 10V38M22 10V30a8 8 0 0 0 16 0V10M30 38V90M70 10C58 20 58 42 70 50V90",
    "M16 46H78L72 78H22ZM78 52h8a8 8 0 0 1 0 16h-9M30 30c0-6 6-6 6-12M46 30c0-6 6-6 6-12",
    "M14 62H86M22 62a28 28 0 0 1 56 0M50 30V24M44 24H56M10 70H90",
    "M30 30C44 10 80 26 70 56C62 78 30 80 22 62C12 48 20 38 30 30ZM60 24L76 10",
    "M14 70a36 36 0 0 1 72 0ZM50 22V14M10 76H90",
    "M20 30L80 30M24 30L32 80H68L76 30M38 30L42 80M62 30L58 80",
    "M50 14L84 80H16ZM38 58a4 4 0 1 0 8 0a4 4 0 1 0-8 0M56 66a4 4 0 1 0 8 0a4 4 0 1 0-8 0",
  ],
  beauty: [
    "M50 8L58 40L90 50L58 60L50 92L42 60L10 50L42 40ZM80 14v14M73 21h14",
    "M25 78a9 9 0 1 0 18 0a9 9 0 1 0-18 0M57 78a9 9 0 1 0 18 0a9 9 0 1 0-18 0M40 70L62 14M60 70L38 14",
    "M30 50a20 26 0 1 0 40 0a20 26 0 1 0-40 0M50 76V94M38 94H62",
    "M30 90V40H46V90ZM30 40V28L38 14L46 28V40",
    "M50 50a8 8 0 1 0 16 0a8 8 0 1 0-16 0M50 50C50 30 30 24 30 40C30 52 44 54 50 50ZM50 50C70 50 76 30 60 30C48 30 46 44 50 50ZM50 50C50 70 70 76 70 60C70 48 56 46 50 50ZM50 50C30 50 24 70 40 70C52 70 54 56 50 50Z",
    "M14 70H86L80 34H20ZM30 34V20H70V34M38 52H62",
    "M16 40L84 40M22 40Q22 80 50 84Q78 80 78 40M30 24V40M50 20V40M70 24V40",
  ],
};

/** Staggered rows of drawings across a 520×780 sheet, leaving the header area clear for text. */
export function artTiles(art: PosterArt) {
  const symbols = SYMBOLS[art];
  const tiles: { d: string; transform: string }[] = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 5; col++) {
      const x = col * 118 - 20 + (row % 2 ? 59 : 0);
      const y = row * 108 - 10;
      const [cx, cy] = [x + 32, y + 32];
      if (((cx - 260) / 215) ** 2 + ((cy - 170) / 135) ** 2 < 1) continue;
      const rotation = [-22, -12, 0, 12, 22][(row * 3 + col * 2) % 5];
      tiles.push({ d: symbols[(row * 3 + col * 2) % symbols.length], transform: `translate(${x} ${y}) rotate(${rotation} 40 40) scale(.8)` });
    }
  }
  return tiles;
}
