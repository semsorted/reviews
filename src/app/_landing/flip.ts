const clamp = (value: number) => Math.min(1, Math.max(0, value));

/** Each page rests for the first 30% of its scroll, then turns. Returns 0 (flat) to 1 (turned). */
export function leafTurn(progress: number, index: number, count: number): number {
  if (index >= count - 1) return 0;
  const turn = clamp((clamp(progress) * (count - 1) - index - 0.3) / 0.7);
  return turn * turn * (3 - 2 * turn);
}

export function activePage(progress: number, count: number): number {
  let page = 0;
  while (page < count - 1 && leafTurn(progress, page, count) >= 0.5) page++;
  return page;
}
