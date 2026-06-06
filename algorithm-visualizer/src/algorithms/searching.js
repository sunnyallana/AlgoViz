// ─── Searching algorithms ────────────────────────────────────────────────────
// Input: { array, target }. Frames describe pointer positions and which cells
// are ruled out:
//   current    – index being examined           (amber ring)
//   low/mid/high – binary-search pointers       (labelled chips)
//   eliminated – indices proven not to contain the target (dimmed)
//   found      – index where target was found   (emerald pulse)
//   notFound   – search exhausted

const sframe = (extra = {}) => ({
  current: null,
  low: null,
  mid: null,
  high: null,
  eliminated: [],
  found: null,
  notFound: false,
  message: '',
  codeLine: null,
  stats: {},
  ...extra,
});

const rangeArr = (from, to) => {
  const out = [];
  for (let i = from; i <= to; i++) out.push(i);
  return out;
};

// ─── Linear Search ───────────────────────────────────────────────────────────

function linearSearchFrames({ array, target }) {
  const a = array;
  const n = a.length;
  const frames = [];
  let comparisons = 0;
  const stats = () => ({ Comparisons: comparisons });

  frames.push(
    sframe({
      codeLine: 0,
      stats: stats(),
      message: `Looking for ${target}. Linear Search simply checks every value, left to right — no assumptions about the data.`,
    })
  );

  for (let i = 0; i < n; i++) {
    comparisons++;
    const hit = a[i] === target;
    frames.push(
      sframe({
        current: i,
        eliminated: rangeArr(0, i - 1),
        codeLine: 1,
        stats: stats(),
        message: `Check index ${i}: is ${a[i]} = ${target}? ${hit ? 'YES — found it!' : 'No, keep going.'}`,
      })
    );
    if (hit) {
      frames.push(
        sframe({
          found: i,
          eliminated: rangeArr(0, i - 1),
          codeLine: 1,
          stats: stats(),
          message: `Found ${target} at index ${i} after ${comparisons} comparison${comparisons === 1 ? '' : 's'}.`,
        })
      );
      return frames;
    }
  }
  frames.push(
    sframe({
      notFound: true,
      eliminated: rangeArr(0, n - 1),
      codeLine: 2,
      stats: stats(),
      message: `Checked all ${n} values — ${target} is not in the array. (${comparisons} comparisons)`,
    })
  );
  return frames;
}

// ─── Binary Search ───────────────────────────────────────────────────────────

function binarySearchFrames({ array, target }) {
  const a = array;
  const n = a.length;
  const frames = [];
  let comparisons = 0;
  const stats = () => ({ Comparisons: comparisons });
  const outside = (low, high) => [...rangeArr(0, low - 1), ...rangeArr(high + 1, n - 1)];

  let low = 0;
  let high = n - 1;

  frames.push(
    sframe({
      low,
      high,
      codeLine: 0,
      stats: stats(),
      message: `Looking for ${target}. The array is SORTED — so one comparison at the middle can discard half of everything that remains.`,
    })
  );

  while (low <= high) {
    const mid = (low + high) >> 1;
    frames.push(
      sframe({
        low,
        mid,
        high,
        eliminated: outside(low, high),
        codeLine: 2,
        stats: stats(),
        message: `Search window is [${low}..${high}] (${high - low + 1} value${high - low === 0 ? '' : 's'}). Middle is index ${mid}, value ${a[mid]}.`,
      })
    );
    comparisons++;
    if (a[mid] === target) {
      frames.push(
        sframe({
          found: mid,
          low,
          mid,
          high,
          eliminated: outside(low, high),
          codeLine: 3,
          stats: stats(),
          message: `${a[mid]} = ${target} — found it at index ${mid} in only ${comparisons} comparison${comparisons === 1 ? '' : 's'}!`,
        })
      );
      return frames;
    }
    if (a[mid] < target) {
      low = mid + 1;
      frames.push(
        sframe({
          low,
          high,
          eliminated: outside(low, high),
          codeLine: 4,
          stats: stats(),
          message: `${a[mid]} < ${target}, so the target can only be RIGHT of the middle. Discard everything up to index ${mid}.`,
        })
      );
    } else {
      high = mid - 1;
      frames.push(
        sframe({
          low,
          high,
          eliminated: outside(low, high),
          codeLine: 5,
          stats: stats(),
          message: `${a[mid]} > ${target}, so the target can only be LEFT of the middle. Discard everything from index ${mid} up.`,
        })
      );
    }
  }
  frames.push(
    sframe({
      notFound: true,
      eliminated: rangeArr(0, n - 1),
      codeLine: 6,
      stats: stats(),
      message: `The window closed without finding ${target} — it is not in the array. Only ${comparisons} comparisons for ${n} values!`,
    })
  );
  return frames;
}

// ─── Jump Search ─────────────────────────────────────────────────────────────

function jumpSearchFrames({ array, target }) {
  const a = array;
  const n = a.length;
  const frames = [];
  let comparisons = 0;
  const stats = () => ({ Comparisons: comparisons });
  const step = Math.max(1, Math.floor(Math.sqrt(n)));

  frames.push(
    sframe({
      codeLine: 0,
      stats: stats(),
      message: `Looking for ${target}. Jump Search hops ${step} at a time (√${n} ≈ ${step}) through the sorted array, then scans one block linearly.`,
    })
  );

  let prev = 0;
  let jump = step;

  while (a[Math.min(jump, n) - 1] < target) {
    comparisons++;
    const probe = Math.min(jump, n) - 1;
    frames.push(
      sframe({
        current: probe,
        eliminated: rangeArr(0, prev - 1),
        codeLine: 1,
        stats: stats(),
        message: `Probe the block end at index ${probe}: ${a[probe]} < ${target}, so the whole block [${prev}..${probe}] can't end with our target — jump ahead.`,
      })
    );
    prev = jump;
    jump += step;
    if (prev >= n) {
      frames.push(
        sframe({
          notFound: true,
          eliminated: rangeArr(0, n - 1),
          codeLine: 5,
          stats: stats(),
          message: `Jumped past the end of the array — ${target} is not here. (${comparisons} comparisons)`,
        })
      );
      return frames;
    }
  }
  comparisons++;
  const blockEnd = Math.min(jump, n) - 1;
  frames.push(
    sframe({
      current: blockEnd,
      eliminated: rangeArr(0, prev - 1),
      codeLine: 2,
      stats: stats(),
      message: `Block end at index ${blockEnd} holds ${a[blockEnd]} ≥ ${target} — if the target exists, it's inside block [${prev}..${blockEnd}]. Scan it linearly.`,
    })
  );

  for (let i = prev; i <= blockEnd; i++) {
    comparisons++;
    const hit = a[i] === target;
    frames.push(
      sframe({
        current: i,
        eliminated: [...rangeArr(0, i - 1)],
        codeLine: 4,
        stats: stats(),
        message: `Check index ${i}: is ${a[i]} = ${target}? ${hit ? 'YES — found it!' : a[i] > target ? `No — ${a[i]} is already bigger, so the target can't be further right either.` : 'No, next.'}`,
      })
    );
    if (hit) {
      frames.push(
        sframe({
          found: i,
          eliminated: rangeArr(0, i - 1),
          codeLine: 4,
          stats: stats(),
          message: `Found ${target} at index ${i} with ${comparisons} comparisons — fewer than linear, more than binary. That's the trade-off.`,
        })
      );
      return frames;
    }
    if (a[i] > target) break;
  }
  frames.push(
    sframe({
      notFound: true,
      eliminated: rangeArr(0, n - 1),
      codeLine: 5,
      stats: stats(),
      message: `${target} is not in the array. (${comparisons} comparisons)`,
    })
  );
  return frames;
}

// ─── Interpolation Search ────────────────────────────────────────────────────

function interpolationSearchFrames({ array, target }) {
  const a = array;
  const n = a.length;
  const frames = [];
  let comparisons = 0;
  const stats = () => ({ Comparisons: comparisons });
  const outside = (low, high) => [...rangeArr(0, low - 1), ...rangeArr(high + 1, n - 1)];

  let low = 0;
  let high = n - 1;

  frames.push(
    sframe({
      low,
      high,
      codeLine: 0,
      stats: stats(),
      message: `Looking for ${target}. Like finding "Smith" in a phone book — don't open the middle, open where the name SHOULD be. Interpolation estimates the position from the values.`,
    })
  );

  while (low <= high && target >= a[low] && target <= a[high]) {
    const pos =
      a[high] === a[low]
        ? low
        : low + Math.floor(((target - a[low]) * (high - low)) / (a[high] - a[low]));
    frames.push(
      sframe({
        low,
        mid: pos,
        high,
        eliminated: outside(low, high),
        codeLine: 3,
        stats: stats(),
        message: `Window [${low}..${high}] spans values ${a[low]}–${a[high]}. ${target} sits ${a[high] === a[low] ? 'right at the start' : `about ${Math.round(((target - a[low]) / (a[high] - a[low])) * 100)}% of the way in`} → estimate index ${pos} (value ${a[pos]}).`,
      })
    );
    comparisons++;
    if (a[pos] === target) {
      frames.push(
        sframe({
          found: pos,
          low,
          mid: pos,
          high,
          eliminated: outside(low, high),
          codeLine: 4,
          stats: stats(),
          message: `${a[pos]} = ${target} — found at index ${pos} in ${comparisons} comparison${comparisons === 1 ? '' : 's'}! On evenly-spread data the estimate is usually this good.`,
        })
      );
      return frames;
    }
    if (a[pos] < target) {
      low = pos + 1;
      frames.push(
        sframe({
          low,
          high,
          eliminated: outside(low, high),
          codeLine: 5,
          stats: stats(),
          message: `${a[pos]} < ${target} — the estimate landed short. Discard index ${pos} and everything left of it.`,
        })
      );
    } else {
      high = pos - 1;
      frames.push(
        sframe({
          low,
          high,
          eliminated: outside(low, high),
          codeLine: 6,
          stats: stats(),
          message: `${a[pos]} > ${target} — the estimate overshot. Discard index ${pos} and everything right of it.`,
        })
      );
    }
  }
  frames.push(
    sframe({
      notFound: true,
      eliminated: rangeArr(0, n - 1),
      codeLine: 7,
      stats: stats(),
      message:
        low > high
          ? `The window closed — ${target} is not in the array. (${comparisons} comparisons)`
          : `${target} is outside the value range ${a[low]}–${a[high]} of the remaining window — it can't be in the array. (${comparisons} comparisons)`,
    })
  );
  return frames;
}

// ─── Exponential Search ──────────────────────────────────────────────────────

function exponentialSearchFrames({ array, target }) {
  const a = array;
  const n = a.length;
  const frames = [];
  let comparisons = 0;
  const stats = () => ({ Comparisons: comparisons });
  const outside = (low, high) => [...rangeArr(0, low - 1), ...rangeArr(high + 1, n - 1)];

  frames.push(
    sframe({
      codeLine: 0,
      stats: stats(),
      message: `Looking for ${target}. Exponential Search races ahead in doubling jumps (1, 2, 4, 8…) to find a window that must contain the target, then binary-searches just that window.`,
    })
  );

  comparisons++;
  frames.push(
    sframe({
      current: 0,
      codeLine: 0,
      stats: stats(),
      message: `Check index 0 first: ${a[0]} ${a[0] === target ? `= ${target} — found immediately!` : `≠ ${target}, so start doubling.`}`,
    })
  );
  if (a[0] === target) {
    frames.push(sframe({ found: 0, codeLine: 0, stats: stats(), message: `Found ${target} at index 0.` }));
    return frames;
  }

  let bound = 1;
  while (bound < n && a[bound] < target) {
    comparisons++;
    frames.push(
      sframe({
        current: bound,
        eliminated: rangeArr(0, (bound >> 1)),
        codeLine: 2,
        stats: stats(),
        message: `Probe index ${bound}: ${a[bound]} < ${target} — still too small. Double the bound to ${bound * 2}.`,
      })
    );
    bound *= 2;
  }
  if (bound < n) {
    comparisons++;
    frames.push(
      sframe({
        current: bound,
        eliminated: rangeArr(0, (bound >> 1) - 1),
        codeLine: 2,
        stats: stats(),
        message: `Probe index ${bound}: ${a[bound]} ≥ ${target} — overshot! The target must be between index ${bound >> 1} and ${bound}.`,
      })
    );
  } else {
    frames.push(
      sframe({
        eliminated: rangeArr(0, (bound >> 1) - 1),
        codeLine: 2,
        stats: stats(),
        message: `The bound passed the end of the array — search the final window [${bound >> 1}..${n - 1}].`,
      })
    );
  }

  let low = bound >> 1;
  let high = Math.min(bound, n - 1);
  frames.push(
    sframe({
      low,
      high,
      eliminated: outside(low, high),
      codeLine: 3,
      stats: stats(),
      message: `Now ordinary binary search inside [${low}..${high}] — just ${high - low + 1} of the ${n} values.`,
    })
  );

  while (low <= high) {
    const mid = (low + high) >> 1;
    frames.push(
      sframe({
        low,
        mid,
        high,
        eliminated: outside(low, high),
        codeLine: 4,
        stats: stats(),
        message: `Middle of [${low}..${high}] is index ${mid} (value ${a[mid]}).`,
      })
    );
    comparisons++;
    if (a[mid] === target) {
      frames.push(
        sframe({
          found: mid,
          low,
          mid,
          high,
          eliminated: outside(low, high),
          codeLine: 4,
          stats: stats(),
          message: `${a[mid]} = ${target} — found at index ${mid} after ${comparisons} comparisons.`,
        })
      );
      return frames;
    }
    if (a[mid] < target) low = mid + 1;
    else high = mid - 1;
    frames.push(
      sframe({
        low,
        high,
        eliminated: outside(low, high),
        codeLine: 4,
        stats: stats(),
        message:
          a[mid] < target
            ? `${a[mid]} < ${target} — keep the right half.`
            : `${a[mid]} > ${target} — keep the left half.`,
      })
    );
  }
  frames.push(
    sframe({
      notFound: true,
      eliminated: rangeArr(0, n - 1),
      codeLine: 5,
      stats: stats(),
      message: `The window closed — ${target} is not in the array. (${comparisons} comparisons)`,
    })
  );
  return frames;
}

// ─── Metadata ────────────────────────────────────────────────────────────────

export const searchingAlgorithms = [
  {
    id: 'linear-search',
    name: 'Linear Search',
    category: 'searching',
    difficulty: 'Beginner',
    tagline: 'Check every element, one by one',
    about:
      'The simplest possible search: walk the list from the start and compare every value with the target until you find it or run out of elements. It needs no preparation — the data can be in any order.',
    howItWorks: [
      'Start at index 0.',
      'Compare the current value with the target.',
      'Match → done. No match → move one step right.',
      'Reach the end without a match → the target is not there.',
    ],
    insight: 'On average it checks half the list, and in the worst case all of it. For 1,000,000 items that is up to 1,000,000 checks — binary search would need at most 20.',
    complexity: { best: 'O(1)', average: 'O(n)', worst: 'O(n)', space: 'O(1)' },
    pseudocode: [
      'for i ← 0 to n−1',
      '  if a[i] = target → return i',
      'return “not found”',
    ],
    realWorld: [
      'Unsorted data — the only option without preprocessing.',
      'Scanning streams and logs as data flows past.',
      'Tiny lists, where simplicity beats cleverness.',
    ],
    generate: linearSearchFrames,
    requiresSorted: false,
  },
  {
    id: 'binary-search',
    name: 'Binary Search',
    category: 'searching',
    difficulty: 'Beginner',
    tagline: 'Halve the search space with every comparison',
    about:
      'Binary Search is the reason sorted data is so valuable. Compare the target with the middle element: if it is smaller, the answer must be in the left half; if bigger, the right half. Either way, half of the remaining values vanish in a single comparison.',
    howItWorks: [
      'Keep two pointers, LOW and HIGH, around the part that could still contain the target.',
      'Look at the middle element between them.',
      'Target equal → found. Target bigger → move LOW past the middle. Target smaller → move HIGH before it.',
      'When LOW passes HIGH, the target does not exist in the array.',
    ],
    insight: 'Doubling the data adds just ONE extra step — a billion sorted items need at most 30 comparisons. This “halving” idea (logarithmic time) is one of the most important ideas in computer science.',
    complexity: { best: 'O(1)', average: 'O(log n)', worst: 'O(log n)', space: 'O(1)' },
    pseudocode: [
      'low ← 0,  high ← n−1',
      'while low ≤ high',
      '  mid ← (low + high) / 2',
      '  if a[mid] = target → return mid',
      '  if a[mid] < target → low ← mid+1',
      '  else → high ← mid−1',
      'return “not found”',
    ],
    realWorld: [
      'Database indexes and filesystem B-trees — binary search at planetary scale.',
      '`git bisect`: finding the commit that broke the build in log₂(commits) steps.',
      'Every standard library\'s sorted-array lookup (bisect, lower_bound…).',
    ],
    generate: binarySearchFrames,
    requiresSorted: true,
  },
  {
    id: 'jump-search',
    name: 'Jump Search',
    category: 'searching',
    difficulty: 'Intermediate',
    tagline: 'Hop in √n blocks, then scan one block',
    about:
      'Jump Search is a middle ground between linear and binary search. It leaps through a sorted array in fixed blocks of √n, checking only the last value of each block. Once it lands in a block that could contain the target, it scans just that block linearly.',
    howItWorks: [
      'Pick a block size of √n.',
      'Probe the last element of each block: while it is smaller than the target, jump to the next block.',
      'The target, if present, must be inside the current block.',
      'Linearly scan that single block.',
    ],
    insight: 'Why √n? It perfectly balances the two phases: about √n jumps plus at most √n scan steps. Useful when jumping backwards is expensive — unlike binary search, it only ever steps forward.',
    complexity: { best: 'O(1)', average: 'O(√n)', worst: 'O(√n)', space: 'O(1)' },
    pseudocode: [
      'step ← ⌊√n⌋',
      'while last value of current block < target → jump ahead',
      'target must be inside this block',
      'scan the block from its start:',
      '  if a[i] = target → return i',
      'return “not found”',
    ],
    realWorld: [
      'Sequential media (tape, spinning disks) where jumping backwards is expensive.',
      'Sorted data on slow external storage with cheap forward seeks.',
    ],
    generate: jumpSearchFrames,
    requiresSorted: true,
  },
  {
    id: 'interpolation-search',
    name: 'Interpolation Search',
    category: 'searching',
    difficulty: 'Intermediate',
    tagline: 'Estimate where the value should be — like a phone book',
    about:
      'Binary search always probes the middle. But when you look up "Smith" in a phone book, you open near the back — you use the VALUE to guess the position. Interpolation Search does exactly that: it assumes values are roughly evenly spread and probes the proportional spot.',
    howItWorks: [
      'Keep a LOW–HIGH window like binary search.',
      'Estimate where the target sits proportionally between a[LOW] and a[HIGH] — that index (EST) is the probe.',
      'Probe equal → found. Too small → search right of it. Too big → search left of it.',
      'If the target falls outside the window\'s value range, it cannot exist — stop early.',
    ],
    insight: 'On uniformly distributed data it averages O(log log n) — for a million values that is ~4 probes vs binary search\'s 20. The catch: on skewed data the estimates degrade, all the way to O(n) in the worst case.',
    complexity: { best: 'O(1)', average: 'O(log log n)', worst: 'O(n)', space: 'O(1)' },
    pseudocode: [
      'low ← 0,  high ← n−1',
      'while low ≤ high and a[low] ≤ target ≤ a[high]',
      '  estimate the position by proportion:',
      '  pos ← low + ⌊(target−a[low])·(high−low) / (a[high]−a[low])⌋',
      '  if a[pos] = target → return pos',
      '  if a[pos] < target → low ← pos+1',
      '  else → high ← pos−1',
      'return “not found”',
    ],
    realWorld: [
      'Phone-book style lookups over evenly distributed keys.',
      'In-memory tables of uniform numeric IDs and timestamps.',
    ],
    generate: interpolationSearchFrames,
    requiresSorted: true,
    midLabel: 'EST',
  },
  {
    id: 'exponential-search',
    name: 'Exponential Search',
    category: 'searching',
    difficulty: 'Intermediate',
    tagline: 'Double ahead to find the window, then binary search it',
    about:
      'What if the array is enormous — or you don\'t even know how long it is? Exponential Search probes indices 1, 2, 4, 8, 16… until it passes the target. Those doubling probes bracket the target in a small window, which a plain binary search then finishes off.',
    howItWorks: [
      'Check index 0, then probe indices 1, 2, 4, 8… while the values are still smaller than the target.',
      'The first probe that is ≥ the target closes the bracket: the answer lies between the previous probe and this one.',
      'That window has at most as many elements as the target\'s own index.',
      'Run binary search inside just that window.',
    ],
    insight: 'It needs about log₂(i) probes plus log₂(i) binary steps, where i is where the target actually lives — so finding something near the FRONT of a billion-element array is almost free. This is also the standard trick for "unbounded" (endless) sorted streams.',
    complexity: { best: 'O(1)', average: 'O(log i)', worst: 'O(log n)', space: 'O(1)' },
    pseudocode: [
      'if a[0] = target → return 0',
      'bound ← 1',
      'while bound < n and a[bound] < target → bound ← bound × 2',
      'window ← [bound/2 .. min(bound, n−1)]',
      'binary search inside the window',
      'return “not found”',
    ],
    realWorld: [
      'Unbounded or endless sorted streams where the length is unknown.',
      'Huge sorted logs when matches usually sit near the front.',
    ],
    generate: exponentialSearchFrames,
    requiresSorted: true,
  },
];
