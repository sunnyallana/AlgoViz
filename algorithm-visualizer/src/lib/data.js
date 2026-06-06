// ─── Random data generators for every visualizer ────────────────────────────

export const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** Public shuffled copy (used to show linear search on unsorted data). */
export const shuffledCopy = (arr) => shuffle(arr);

/** Distinct values evenly spread across 8–100 so every bar height is readable. */
export function randomArray(n) {
  const values = Array.from({ length: n }, (_, i) => Math.round(8 + (92 * (i + 1)) / n));
  return shuffle(values);
}

/** Sorted array with a handful of random adjacent swaps — best case demos. */
export function nearlySortedArray(n) {
  const a = Array.from({ length: n }, (_, i) => Math.round(8 + (92 * (i + 1)) / n));
  const swaps = Math.max(1, Math.floor(n / 8));
  for (let s = 0; s < swaps; s++) {
    const i = randInt(0, n - 2);
    [a[i], a[i + 1]] = [a[i + 1], a[i]];
  }
  return a;
}

/** Strictly descending — the classic worst case. */
export function reversedArray(n) {
  return Array.from({ length: n }, (_, i) => Math.round(8 + (92 * (n - i)) / n));
}

/** Only a few distinct values — shows how algorithms handle duplicates. */
export function fewUniqueArray(n) {
  const pool = [18, 42, 66, 90];
  return Array.from({ length: n }, () => pool[randInt(0, pool.length - 1)]);
}

export const SORT_PRESETS = [
  { id: 'random', label: 'Random', make: randomArray },
  { id: 'nearly', label: 'Nearly sorted', make: nearlySortedArray },
  { id: 'reversed', label: 'Reversed', make: reversedArray },
  { id: 'fewUnique', label: 'Few unique', make: fewUniqueArray },
];

/** Sorted distinct values for searching (binary / jump need sorted input). */
export function sortedDistinctArray(n) {
  const a = [];
  let v = randInt(2, 8);
  for (let i = 0; i < n; i++) {
    a.push(v);
    v += randInt(2, 9);
  }
  return a;
}

/**
 * Random 2D points in a 100 × 62 data space with a minimum spacing so labels
 * and pair-lines stay readable.
 */
export function randomPoints(n) {
  const pts = [];
  const MIN_D2 = 8 * 8;
  let guard = 0;
  while (pts.length < n && guard < 4000) {
    guard++;
    const p = { x: randInt(7, 93), y: randInt(7, 55) };
    const tooClose = pts.some((q) => (q.x - p.x) ** 2 + (q.y - p.y) ** 2 < MIN_D2);
    if (!tooClose || guard % 80 === 0) pts.push(p);
  }
  return pts;
}
