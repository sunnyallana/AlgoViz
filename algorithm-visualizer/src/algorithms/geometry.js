// ─── Geometry algorithms ─────────────────────────────────────────────────────
// Input: an array of points {x, y} in a 100 × 62 data space (y rendered
// upwards). Frames reference points by index:
//   compare      – [i, j] pair being measured        (dashed amber segment)
//   best         – [i, j] closest pair so far        (emerald segment)
//   hull / hullDone – chain(s) of indices            (violet polyline)
//   hullClosed   – hull is complete (closed polygon)
//   candidate    – point under consideration         (amber)
//   rejectedEdge – [i, j] edge being removed         (rose flash)
//   divideX      – x of the divide line              (dashed vertical)
//   strip        – [x1, x2] candidate band           (cyan tint)
//   activeSet    – indices in the current sub-problem (others dimmed)
//   highlight    – emphasized points

const gframe = (extra = {}) => ({
  compare: null,
  best: null,
  bestDist: null,
  hull: [],
  hullDone: [],
  hullClosed: false,
  candidate: null,
  rejectedEdge: null,
  divideX: null,
  strip: null,
  activeSet: null,
  highlight: [],
  message: '',
  codeLine: null,
  stats: {},
  ...extra,
});

const dist = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);
const fmt = (d) => d.toFixed(1);

// ─── Closest Pair — Brute Force ──────────────────────────────────────────────

function closestPairBruteFrames(points) {
  const n = points.length;
  const frames = [];
  if (n < 2) {
    frames.push(gframe({ message: 'Add at least 2 points (click the canvas) to find a closest pair.' }));
    return frames;
  }
  let calcs = 0;
  const stats = () => ({ 'Distance calcs': calcs });
  let best = Infinity;
  let bestPair = null;

  frames.push(
    gframe({
      codeLine: 0,
      stats: stats(),
      message: `Brute force: measure the distance between ALL ${(n * (n - 1)) / 2} possible pairs of the ${n} points and keep the smallest.`,
    })
  );

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = dist(points[i], points[j]);
      calcs++;
      const better = d < best;
      frames.push(
        gframe({
          compare: [i, j],
          best: bestPair,
          bestDist: bestPair ? best : null,
          codeLine: 2,
          stats: stats(),
          message: `Distance P${i} ↔ P${j} = ${fmt(d)}. ${better ? 'Smaller than anything so far!' : `Not smaller than the current best (${fmt(best)}).`}`,
        })
      );
      if (better) {
        best = d;
        bestPair = [i, j];
        frames.push(
          gframe({
            best: bestPair,
            bestDist: best,
            highlight: [i, j],
            codeLine: 3,
            stats: stats(),
            message: `New closest pair: P${i} and P${j} at distance ${fmt(best)}.`,
          })
        );
      }
    }
  }
  frames.push(
    gframe({
      best: bestPair,
      bestDist: best,
      highlight: bestPair,
      stats: stats(),
      message: `Done — closest pair is P${bestPair[0]} and P${bestPair[1]} (distance ${fmt(best)}) after ${calcs} distance calculations. Every pair had to be checked.`,
    })
  );
  return frames;
}

// ─── Closest Pair — Divide & Conquer ─────────────────────────────────────────

function closestPairDCFrames(points) {
  const n = points.length;
  const frames = [];
  if (n < 2) {
    frames.push(gframe({ message: 'Add at least 2 points (click the canvas) to find a closest pair.' }));
    return frames;
  }
  let calcs = 0;
  const stats = () => ({ 'Distance calcs': calcs });
  let best = Infinity;
  let bestPair = null;

  const order = points
    .map((_, i) => i)
    .sort((i, j) => points[i].x - points[j].x || points[i].y - points[j].y);

  frames.push(
    gframe({
      codeLine: 0,
      stats: stats(),
      message: `Sort the ${n} points left-to-right so we can split them cleanly. Instead of all ${(n * (n - 1)) / 2} pairs, we'll check far fewer.`,
    })
  );

  const consider = (i, j, extra) => {
    const d = dist(points[i], points[j]);
    calcs++;
    const better = d < best;
    frames.push(
      gframe({
        compare: [i, j],
        best: bestPair,
        bestDist: bestPair ? best : null,
        stats: stats(),
        ...extra,
        message: `${extra.message} Distance P${i} ↔ P${j} = ${fmt(d)}${better ? ' — new overall best!' : '.'}`,
      })
    );
    if (better) {
      best = d;
      bestPair = [i, j];
    }
    return d;
  };

  const solve = (ids, depth) => {
    if (ids.length <= 3) {
      frames.push(
        gframe({
          activeSet: ids,
          best: bestPair,
          bestDist: bestPair ? best : null,
          codeLine: 2,
          stats: stats(),
          message: `Only ${ids.length} point${ids.length === 1 ? '' : 's'} in this piece — small enough to check directly (recursion depth ${depth}).`,
        })
      );
      let local = Infinity;
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const d = consider(ids[i], ids[j], { activeSet: ids, codeLine: 2, message: 'Base case:' });
          local = Math.min(local, d);
        }
      }
      return local;
    }

    const m = ids.length >> 1;
    const midX = (points[ids[m - 1]].x + points[ids[m]].x) / 2;
    const left = ids.slice(0, m);
    const right = ids.slice(m);

    frames.push(
      gframe({
        activeSet: ids,
        divideX: midX,
        best: bestPair,
        bestDist: bestPair ? best : null,
        codeLine: 3,
        stats: stats(),
        message: `Split these ${ids.length} points at the dashed line (x ≈ ${midX.toFixed(0)}): ${left.length} on the left, ${right.length} on the right. Solve each side on its own.`,
      })
    );

    const dl = solve(left, depth + 1);
    const dr = solve(right, depth + 1);
    let d = Math.min(dl, dr);

    frames.push(
      gframe({
        activeSet: ids,
        divideX: midX,
        best: bestPair,
        bestDist: bestPair ? best : null,
        codeLine: 4,
        stats: stats(),
        message: `Best distance inside the two halves: ${fmt(d)}. But a closer pair could STRADDLE the split line — time to check the strip.`,
      })
    );

    const strip = ids
      .filter((id) => Math.abs(points[id].x - midX) < d)
      .sort((p, q) => points[p].y - points[q].y);

    frames.push(
      gframe({
        activeSet: ids,
        divideX: midX,
        strip: [midX - d, midX + d],
        best: bestPair,
        bestDist: bestPair ? best : null,
        codeLine: 5,
        stats: stats(),
        message: `Only points within ${fmt(d)} of the line could possibly beat ${fmt(d)} — that's ${strip.length} point${strip.length === 1 ? '' : 's'} (the cyan strip).`,
      })
    );

    for (let i = 0; i < strip.length; i++) {
      for (let j = i + 1; j < strip.length && points[strip[j]].y - points[strip[i]].y < d; j++) {
        const dd = consider(strip[i], strip[j], {
          activeSet: ids,
          divideX: midX,
          strip: [midX - d, midX + d],
          codeLine: 6,
          message: 'Strip check:',
        });
        if (dd < d) d = dd;
      }
    }
    return d;
  };

  solve(order, 0);

  frames.push(
    gframe({
      best: bestPair,
      bestDist: best,
      highlight: bestPair,
      codeLine: 7,
      stats: stats(),
      message: `Done — closest pair is P${bestPair[0]} and P${bestPair[1]} (distance ${fmt(best)}) with only ${calcs} distance calculations instead of ${(n * (n - 1)) / 2}.`,
    })
  );
  return frames;
}

// ─── Convex Hull — Andrew's Monotone Chain ───────────────────────────────────

function convexHullFrames(points) {
  const n = points.length;
  const frames = [];
  if (n < 3) {
    frames.push(gframe({ message: 'Add at least 3 points (click the canvas) to build a convex hull.' }));
    return frames;
  }
  let tests = 0;
  const stats = () => ({ 'Orientation tests': tests });

  const order = points
    .map((_, i) => i)
    .sort((i, j) => points[i].x - points[j].x || points[i].y - points[j].y);

  const cross = (o, a, b) =>
    (points[a].x - points[o].x) * (points[b].y - points[o].y) -
    (points[a].y - points[o].y) * (points[b].x - points[o].x);

  frames.push(
    gframe({
      codeLine: 0,
      stats: stats(),
      message: `Convex hull = the tightest "rubber band" around all ${n} points. Sort the points left-to-right, then build the bottom and top boundaries separately.`,
    })
  );

  const buildChain = (seq, label, doneChain, codeAdd, codeWhile) => {
    const chain = [];
    for (const id of seq) {
      frames.push(
        gframe({
          candidate: id,
          hull: [...chain],
          hullDone: doneChain,
          codeLine: codeAdd,
          stats: stats(),
          message: `Consider P${id} for the ${label} boundary.`,
        })
      );
      while (chain.length >= 2) {
        tests++;
        const o = chain[chain.length - 2];
        const a = chain[chain.length - 1];
        // Same test for both chains — the reversed traversal handles the top.
        const turnsOutward = cross(o, a, id) > 0;
        if (turnsOutward) {
          frames.push(
            gframe({
              candidate: id,
              hull: [...chain],
              hullDone: doneChain,
              codeLine: codeWhile,
              stats: stats(),
              message: `P${o} → P${a} → P${id} bends outward — P${a} stays on the boundary.`,
            })
          );
          break;
        }
        const popped = chain.pop();
        frames.push(
          gframe({
            candidate: id,
            hull: [...chain],
            hullDone: doneChain,
            rejectedEdge: [o, popped],
            codeLine: codeWhile,
            stats: stats(),
            message: `P${o} → P${popped} → P${id} caves inward — P${popped} can't be on the ${label} boundary. Remove it.`,
          })
        );
      }
      chain.push(id);
      frames.push(
        gframe({
          hull: [...chain],
          hullDone: doneChain,
          highlight: [id],
          codeLine: codeAdd === 2 ? 4 : 5,
          stats: stats(),
          message: `P${id} joins the ${label} chain (${chain.length} point${chain.length === 1 ? '' : 's'} so far).`,
        })
      );
    }
    return chain;
  };

  const lower = buildChain(order, 'bottom', [], 2, 3);
  frames.push(
    gframe({
      hullDone: lower,
      stats: stats(),
      codeLine: 5,
      message: `Bottom boundary complete (${lower.length} points). Now sweep back right-to-left for the top boundary.`,
    })
  );
  const upper = buildChain([...order].reverse(), 'top', lower, 5, 3);

  const hull = [...lower.slice(0, -1), ...upper.slice(0, -1)];
  frames.push(
    gframe({
      hull,
      hullClosed: true,
      highlight: hull,
      codeLine: 6,
      stats: stats(),
      message: `Convex hull complete: ${hull.length} of the ${n} points form the boundary — every other point lies inside the rubber band. (${tests} orientation tests)`,
    })
  );
  return frames;
}

// ─── Metadata ────────────────────────────────────────────────────────────────

export const geometryAlgorithms = [
  {
    id: 'closest-pair-brute',
    name: 'Closest Pair (Brute Force)',
    category: 'geometry',
    difficulty: 'Beginner',
    tagline: 'Measure every possible pair of points',
    about:
      'Given points on a plane, which two are closest together? The brute-force answer: measure the distance between every possible pair and remember the smallest. Simple, always correct — and slow, because the number of pairs grows quadratically.',
    howItWorks: [
      'Take each point in turn.',
      'Measure its distance to every point after it (each amber dashed line is one measurement).',
      'Whenever a distance beats the best so far, remember that pair (emerald line).',
      'After all pairs are measured, the remembered pair is the answer.',
    ],
    insight: 'With n points there are n(n−1)/2 pairs — 10 points need 45 checks, but 1,000 points need 499,500. Watch the counter, then compare it with the Divide & Conquer version on the same points.',
    complexity: { best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
    pseudocode: [
      'best ← ∞',
      'for every pair of points (P, Q)',
      '  d ← distance(P, Q)',
      '  if d < best → best ← d, remember (P, Q)',
      'return the remembered pair',
    ],
    realWorld: [
      'Perfectly fine for small point sets — simplicity beats cleverness below ~1,000 points.',
      'The baseline used to test and verify the fast version.',
    ],
    generate: closestPairBruteFrames,
    minPoints: 2,
  },
  {
    id: 'closest-pair-dc',
    name: 'Closest Pair (Divide & Conquer)',
    category: 'geometry',
    difficulty: 'Advanced',
    tagline: 'Split the plane, solve halves, check the strip',
    about:
      'The clever O(n log n) solution to the closest-pair problem. Split the points down the middle, solve each half recursively, then handle the only tricky case: a pair that straddles the dividing line. Geometry guarantees only a thin strip of candidates can matter.',
    howItWorks: [
      'Sort points by x and split at the median (dashed line); dimmed points are outside the current sub-problem.',
      'Recursively find the closest pair inside each half — call the smaller answer d.',
      'A straddling pair could only beat d if both points lie within d of the line — the cyan strip.',
      'Inside the strip, each point needs comparing with just a handful of neighbours by height.',
    ],
    insight: 'The magic is the strip: sorted by y, each strip point needs at most ~7 comparisons no matter how many points exist. That bounded check is what turns O(n²) into O(n log n).',
    complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)' },
    pseudocode: [
      'sort all points by x',
      'solve(set):',
      '  if ≤ 3 points → check pairs directly',
      '  split the set at the median x',
      '  d ← min(solve(left), solve(right))',
      '  strip ← points within d of the line',
      '  compare strip points by height (≤ ~7 each)',
      '  return the best pair found',
    ],
    realWorld: [
      'Air-traffic control: which two aircraft are dangerously close?',
      'Collision detection broad-phase in games and simulations.',
      'Clustering: finding the tightest pair before merging groups.',
    ],
    generate: closestPairDCFrames,
    minPoints: 2,
  },
  {
    id: 'convex-hull',
    name: 'Convex Hull (Monotone Chain)',
    category: 'geometry',
    difficulty: 'Intermediate',
    tagline: 'Wrap a rubber band around all the points',
    about:
      "The convex hull is the smallest convex polygon containing every point — what you'd get by stretching a rubber band around nails on a board. Andrew's Monotone Chain builds it in two sweeps: bottom boundary left-to-right, top boundary right-to-left.",
    howItWorks: [
      'Sort the points left-to-right.',
      'Sweep rightwards, adding each point to the bottom chain.',
      'Whenever the last three chain points cave inward, the middle one cannot be on the hull — remove it (rose flash).',
      'Sweep back leftwards the same way for the top chain, then join the chains.',
    ],
    insight: 'Each point is added once and removed at most once, so building the chains is linear — the sort dominates at O(n log n). Convex hulls power collision detection, path planning and shape analysis.',
    complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)' },
    pseudocode: [
      'sort points by x (then y)',
      'bottom chain:',
      '  for each point, left → right:',
      '    while the last 2 chain points + it cave inward → remove the middle',
      '    add it to the chain',
      'top chain: same sweep, right → left',
      'hull ← bottom + top joined',
    ],
    realWorld: [
      'Collision bounding volumes in games and robotics.',
      'Shape analysis in computer vision (gesture outlines, object extents).',
      'Path planning: the shortest route around obstacle fields.',
    ],
    generate: convexHullFrames,
    minPoints: 3,
  },
];
