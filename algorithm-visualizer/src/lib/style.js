/**
 * Inline track-fill so range sliders always show progress in brand colour.
 * Longhand `backgroundImage` only — the `.slider` class supplies
 * `background-clip: content-box` (6px visible track in a 20px touch target),
 * and mixing shorthand + longhand in one style object trips React.
 */
export const fillStyle = (val, min, max) => {
  const p = max > min ? ((val - min) / (max - min)) * 100 : 0;
  return { backgroundImage: `linear-gradient(to right, #8B5CF6 ${p}%, #1E2740 ${p}%)` };
};
