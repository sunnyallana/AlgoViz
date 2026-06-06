// ─── Sorting algorithms ──────────────────────────────────────────────────────
// Every generator returns an array of "frames". A frame is a full snapshot the
// canvas can render directly:
//   array    – the values at this moment
//   compare  – indices being compared        (amber)
//   action   – indices swapped / written     (rose)
//   special  – pivot / key / slot markers    (cyan)
//   range    – [lo, hi] active window        (soft band)
//   sorted   – indices locked in final place (emerald)
//   message  – plain-English narration
//   codeLine – pseudocode line to highlight
//   stats    – cumulative counters ({ label: value })

function makeFramePusher(a, frames, locked, stats) {
  return (extra = {}) =>
    frames.push({
      array: [...a],
      compare: [],
      action: [],
      special: [],
      range: null,
      sorted: [...locked],
      message: '',
      codeLine: null,
      stats: stats(),
      ...extra,
    });
}

// ─── Bubble Sort ─────────────────────────────────────────────────────────────

function bubbleSortFrames(input) {
  const a = [...input];
  const n = a.length;
  const frames = [];
  const locked = [];
  let comparisons = 0;
  let swaps = 0;
  const push = makeFramePusher(a, frames, locked, () => ({ Comparisons: comparisons, Swaps: swaps }));

  push({
    codeLine: 0,
    message: 'Bubble Sort walks through the list again and again, swapping neighbours that are out of order. Big values "bubble up" to the end.',
  });

  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - i - 1; j++) {
      comparisons++;
      const out = a[j] > a[j + 1];
      push({
        compare: [j, j + 1],
        codeLine: 3,
        message: `Compare neighbours ${a[j]} and ${a[j + 1]} — ${out ? `${a[j]} is bigger, so they must swap.` : 'already in order, leave them.'}`,
      });
      if (out) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swaps++;
        swapped = true;
        push({
          action: [j, j + 1],
          codeLine: 4,
          message: `Swapped — now ${a[j]} comes before ${a[j + 1]}.`,
        });
      }
    }
    locked.push(n - 1 - i);
    push({
      codeLine: 6,
      message: `Pass ${i + 1} complete — ${a[n - 1 - i]} has bubbled into its final position.`,
    });
    if (!swapped) {
      for (let k = n - i - 2; k >= 0; k--) locked.push(k);
      push({
        codeLine: 6,
        message: 'A whole pass with zero swaps — everything is already in order. Stopping early!',
      });
      break;
    }
  }
  for (let k = 0; k < n; k++) if (!locked.includes(k)) locked.push(k);
  push({
    message: `Sorted! ${n} values ordered with ${comparisons} comparisons and ${swaps} swaps.`,
  });
  return frames;
}

// ─── Selection Sort ──────────────────────────────────────────────────────────

function selectionSortFrames(input) {
  const a = [...input];
  const n = a.length;
  const frames = [];
  const locked = [];
  let comparisons = 0;
  let swaps = 0;
  const push = makeFramePusher(a, frames, locked, () => ({ Comparisons: comparisons, Swaps: swaps }));

  push({
    codeLine: 0,
    message: 'Selection Sort repeatedly finds the smallest remaining value and puts it at the front of the unsorted part.',
  });

  for (let i = 0; i < n - 1; i++) {
    let min = i;
    push({
      special: [min],
      range: [i, n - 1],
      codeLine: 1,
      message: `Hunt for the smallest value between index ${i} and ${n - 1}. Start by assuming it's ${a[i]}.`,
    });
    for (let j = i + 1; j < n; j++) {
      comparisons++;
      const smaller = a[j] < a[min];
      push({
        compare: [j],
        special: [min],
        range: [i, n - 1],
        codeLine: 3,
        message: `Is ${a[j]} smaller than the current minimum ${a[min]}? ${smaller ? 'Yes!' : 'No.'}`,
      });
      if (smaller) {
        min = j;
        push({
          special: [min],
          range: [i, n - 1],
          codeLine: 4,
          message: `New minimum found: ${a[min]} at index ${min}.`,
        });
      }
    }
    if (min !== i) {
      [a[i], a[min]] = [a[min], a[i]];
      swaps++;
      push({
        action: [i, min],
        codeLine: 5,
        message: `Swap ${a[min]} out and bring ${a[i]} to index ${i} — the smallest of the rest.`,
      });
    } else {
      push({
        codeLine: 5,
        message: `${a[i]} was already the smallest — no swap needed.`,
      });
    }
    locked.push(i);
    push({ message: `Index ${i} is final: ${a[i]}.` });
  }
  locked.push(n - 1);
  push({
    message: `Sorted! Notice: always exactly ${n - 1} passes, with ${comparisons} comparisons but only ${swaps} swaps — Selection Sort swaps very little.`,
  });
  return frames;
}

// ─── Insertion Sort ──────────────────────────────────────────────────────────

function insertionSortFrames(input) {
  const a = [...input];
  const n = a.length;
  const frames = [];
  const locked = [];
  let comparisons = 0;
  let writes = 0;
  const push = makeFramePusher(a, frames, locked, () => ({ Comparisons: comparisons, Writes: writes }));

  push({
    codeLine: 0,
    message: 'Insertion Sort works like sorting playing cards in your hand: take the next card and slide it left until it fits.',
  });

  for (let i = 1; i < n; i++) {
    const key = a[i];
    push({
      special: [i],
      range: [0, i - 1],
      codeLine: 1,
      message: `Pick up ${key} (index ${i}). The left part [0..${i - 1}] is already sorted — find where ${key} belongs in it.`,
    });
    let j = i - 1;
    while (j >= 0 && a[j] > key) {
      comparisons++;
      push({
        compare: [j],
        special: [i],
        range: [0, i],
        codeLine: 3,
        message: `${a[j]} > ${key}, so ${a[j]} must move one slot right to make room.`,
      });
      a[j + 1] = a[j];
      writes++;
      push({
        action: [j + 1],
        range: [0, i],
        codeLine: 4,
        message: `Shifted ${a[j + 1]} into slot ${j + 1}.`,
      });
      j--;
    }
    if (j >= 0) {
      comparisons++;
      push({
        compare: [j],
        range: [0, i],
        codeLine: 3,
        message: `${a[j]} ≤ ${key} — stop here. ${key} belongs right after ${a[j]}.`,
      });
    }
    a[j + 1] = key;
    writes++;
    push({
      action: [j + 1],
      range: [0, i],
      codeLine: 6,
      message: `Drop ${key} into slot ${j + 1}. The first ${i + 1} values are now in order.`,
    });
  }
  for (let k = 0; k < n; k++) locked.push(k);
  push({
    message: `Sorted! ${comparisons} comparisons and ${writes} writes. On nearly-sorted data this gets close to a single fast pass — try the "Nearly sorted" preset!`,
  });
  return frames;
}

// ─── Merge Sort ──────────────────────────────────────────────────────────────

function mergeSortFrames(input) {
  const a = [...input];
  const n = a.length;
  const frames = [];
  const locked = [];
  let comparisons = 0;
  let writes = 0;
  const push = makeFramePusher(a, frames, locked, () => ({ Comparisons: comparisons, Writes: writes }));

  push({
    codeLine: 0,
    message: 'Merge Sort splits the list in half again and again, then merges the sorted halves back together. Divide and conquer!',
  });

  const sort = (lo, hi) => {
    if (lo >= hi) {
      push({
        range: [lo, lo],
        codeLine: 1,
        message: `A single element (${a[lo]}) is sorted by definition.`,
      });
      return;
    }
    const mid = (lo + hi) >> 1;
    push({
      range: [lo, hi],
      codeLine: 2,
      message: `Split [${lo}..${hi}] into [${lo}..${mid}] and [${mid + 1}..${hi}].`,
    });
    sort(lo, mid);
    sort(mid + 1, hi);

    const L = a.slice(lo, mid + 1);
    const R = a.slice(mid + 1, hi + 1);
    push({
      range: [lo, hi],
      codeLine: 6,
      message: `Merge two sorted runs: [${L.join(', ')}] and [${R.join(', ')}].`,
    });
    let i = 0;
    let j = 0;
    let k = lo;
    while (i < L.length && j < R.length) {
      comparisons++;
      const takeLeft = L[i] <= R[j];
      push({
        special: [k],
        range: [lo, hi],
        codeLine: 7,
        message: `Slot ${k}: left run offers ${L[i]}, right run offers ${R[j]} → take ${takeLeft ? L[i] : R[j]} (the smaller).`,
      });
      a[k] = takeLeft ? L[i++] : R[j++];
      writes++;
      push({
        action: [k],
        range: [lo, hi],
        codeLine: 7,
        message: `Wrote ${a[k]} into slot ${k}.`,
      });
      k++;
    }
    while (i < L.length) {
      a[k] = L[i++];
      writes++;
      push({
        action: [k],
        range: [lo, hi],
        codeLine: 8,
        message: `Right run is empty — copy the leftover ${a[k]} into slot ${k}.`,
      });
      k++;
    }
    while (j < R.length) {
      a[k] = R[j++];
      writes++;
      push({
        action: [k],
        range: [lo, hi],
        codeLine: 8,
        message: `Left run is empty — copy the leftover ${a[k]} into slot ${k}.`,
      });
      k++;
    }
    push({
      range: [lo, hi],
      codeLine: 8,
      message: `[${lo}..${hi}] is now one sorted run.`,
    });
  };

  sort(0, n - 1);
  for (let k = 0; k < n; k++) locked.push(k);
  push({
    message: `Sorted! ${comparisons} comparisons and ${writes} writes — and it would take roughly the same effort even on the worst input. That reliability is Merge Sort's superpower.`,
  });
  return frames;
}

// ─── Quick Sort ──────────────────────────────────────────────────────────────

function quickSortFrames(input) {
  const a = [...input];
  const n = a.length;
  const frames = [];
  const locked = [];
  let comparisons = 0;
  let swaps = 0;
  const push = makeFramePusher(a, frames, locked, () => ({ Comparisons: comparisons, Swaps: swaps }));

  push({
    codeLine: 0,
    message: 'Quick Sort picks a "pivot", moves smaller values to its left and bigger ones to its right, then sorts each side the same way.',
  });

  const sort = (lo, hi) => {
    if (lo > hi) return;
    if (lo === hi) {
      locked.push(lo);
      push({ codeLine: 1, message: `A single element (${a[lo]}) — already in its final place.` });
      return;
    }
    const pivot = a[hi];
    push({
      range: [lo, hi],
      special: [hi],
      codeLine: 2,
      message: `Sort [${lo}..${hi}]. Pivot = ${pivot} (the last element). Goal: smaller values on the left, bigger on the right.`,
    });
    let i = lo;
    for (let j = lo; j < hi; j++) {
      comparisons++;
      const le = a[j] <= pivot;
      push({
        compare: [j],
        special: [hi],
        range: [lo, hi],
        codeLine: 5,
        message: `Is ${a[j]} ≤ pivot ${pivot}? ${le ? 'Yes — it belongs in the “smaller” zone.' : 'No — leave it on the right.'}`,
      });
      if (le) {
        if (i !== j) {
          [a[i], a[j]] = [a[j], a[i]];
          swaps++;
          push({
            action: [i, j],
            special: [hi],
            range: [lo, hi],
            codeLine: 6,
            message: `Swap ${a[j]} and ${a[i]} — the “smaller” zone grows to index ${i}.`,
          });
        }
        i++;
      }
    }
    if (i !== hi) {
      [a[i], a[hi]] = [a[hi], a[i]];
      swaps++;
    }
    locked.push(i);
    push({
      action: i !== hi ? [i, hi] : [],
      range: [lo, hi],
      codeLine: 7,
      message: `Drop the pivot ${a[i]} into index ${i} — everything left of it is smaller, everything right is bigger. ${a[i]} is FINAL.`,
    });
    sort(lo, i - 1);
    sort(i + 1, hi);
  };

  sort(0, n - 1);
  for (let k = 0; k < n; k++) if (!locked.includes(k)) locked.push(k);
  push({
    message: `Sorted! ${comparisons} comparisons and ${swaps} swaps. Try the "Reversed" preset to see how an unlucky pivot slows Quick Sort down.`,
  });
  return frames;
}

// ─── Heap Sort ───────────────────────────────────────────────────────────────

function heapSortFrames(input) {
  const a = [...input];
  const n = a.length;
  const frames = [];
  const locked = [];
  let comparisons = 0;
  let swaps = 0;
  const push = makeFramePusher(a, frames, locked, () => ({ Comparisons: comparisons, Swaps: swaps }));

  push({
    codeLine: 0,
    message: 'Heap Sort treats the array as a binary tree (index i has children 2i+1 and 2i+2) and first rearranges it into a max-heap: every parent ≥ its children.',
  });

  const siftDown = (start, end, phase) => {
    let i = start;
    for (;;) {
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      if (l > end) return;
      let big = l;
      if (r <= end) {
        comparisons++;
        push({
          compare: [l, r],
          special: [i],
          codeLine: 7,
          message: `${phase} Which child of ${a[i]} (index ${i}) is bigger: ${a[l]} or ${a[r]}?`,
        });
        if (a[r] > a[l]) big = r;
      }
      comparisons++;
      const ok = a[i] >= a[big];
      push({
        compare: [i, big],
        codeLine: 8,
        message: `Is parent ${a[i]} ≥ child ${a[big]}? ${ok ? 'Yes — heap rule holds here.' : 'No — they must swap.'}`,
      });
      if (ok) return;
      [a[i], a[big]] = [a[big], a[i]];
      swaps++;
      push({
        action: [i, big],
        codeLine: 9,
        message: `Swapped ${a[big]} down and ${a[i]} up. Keep sinking from index ${big}.`,
      });
      i = big;
    }
  };

  for (let i = (n >> 1) - 1; i >= 0; i--) {
    push({
      special: [i],
      codeLine: 0,
      message: `Build phase — fix the subtree rooted at index ${i} (value ${a[i]}).`,
    });
    siftDown(i, n - 1, 'Build phase:');
  }
  push({
    special: [0],
    codeLine: 1,
    message: `Max-heap ready — the biggest value (${a[0]}) sits at the root, index 0.`,
  });

  for (let end = n - 1; end > 0; end--) {
    [a[0], a[end]] = [a[end], a[0]];
    swaps++;
    locked.push(end);
    push({
      action: [0, end],
      codeLine: 2,
      message: `Swap the root ${a[end]} (largest) to the back — index ${end} is FINAL. Now repair the heap.`,
    });
    siftDown(0, end - 1, 'Repair:');
  }
  locked.push(0);
  push({
    message: `Sorted! ${comparisons} comparisons and ${swaps} swaps — guaranteed O(n log n) with no extra memory.`,
  });
  return frames;
}

// ─── Cocktail Shaker Sort ────────────────────────────────────────────────────

function cocktailSortFrames(input) {
  const a = [...input];
  const n = a.length;
  const frames = [];
  const locked = [];
  let comparisons = 0;
  let swaps = 0;
  const push = makeFramePusher(a, frames, locked, () => ({ Comparisons: comparisons, Swaps: swaps }));

  push({
    codeLine: 0,
    message: 'Cocktail Shaker Sort is Bubble Sort that sweeps BOTH ways: big values bubble right, then small values bubble left.',
  });

  let start = 0;
  let end = n - 1;
  let swapped = true;
  while (swapped && start < end) {
    swapped = false;
    for (let j = start; j < end; j++) {
      comparisons++;
      const out = a[j] > a[j + 1];
      push({
        compare: [j, j + 1],
        range: [start, end],
        codeLine: 1,
        message: `Sweep right: compare ${a[j]} and ${a[j + 1]} — ${out ? 'out of order, swap them.' : 'fine, move on.'}`,
      });
      if (out) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swaps++;
        swapped = true;
        push({ action: [j, j + 1], range: [start, end], codeLine: 1, message: `Swapped — ${a[j]} before ${a[j + 1]}.` });
      }
    }
    locked.push(end);
    push({ codeLine: 2, message: `Right sweep done — ${a[end]} is locked at the end.` });
    end--;
    if (!swapped) break;

    swapped = false;
    for (let j = end; j > start; j--) {
      comparisons++;
      const out = a[j - 1] > a[j];
      push({
        compare: [j - 1, j],
        range: [start, end],
        codeLine: 3,
        message: `Sweep left: compare ${a[j - 1]} and ${a[j]} — ${out ? 'out of order, swap them.' : 'fine, keep going.'}`,
      });
      if (out) {
        [a[j - 1], a[j]] = [a[j], a[j - 1]];
        swaps++;
        swapped = true;
        push({ action: [j - 1, j], range: [start, end], codeLine: 3, message: `Swapped — ${a[j - 1]} before ${a[j]}.` });
      }
    }
    locked.push(start);
    push({ codeLine: 4, message: `Left sweep done — ${a[start]} is locked at the front.` });
    start++;
  }
  for (let k = 0; k < n; k++) if (!locked.includes(k)) locked.push(k);
  push({
    message: `Sorted! ${comparisons} comparisons and ${swaps} swaps. The two-way sweep fixes Bubble Sort's “turtle” problem — small values no longer crawl left one step per pass.`,
  });
  return frames;
}

// ─── Shell Sort ──────────────────────────────────────────────────────────────

function shellSortFrames(input) {
  const a = [...input];
  const n = a.length;
  const frames = [];
  const locked = [];
  let comparisons = 0;
  let writes = 0;
  const push = makeFramePusher(a, frames, locked, () => ({ Comparisons: comparisons, Writes: writes }));

  push({
    codeLine: 0,
    message: 'Shell Sort is Insertion Sort with a running start: first sort elements far apart (big gap), then shrink the gap until it is 1.',
  });

  for (let gap = n >> 1; gap >= 1; gap >>= 1) {
    push({
      codeLine: 1,
      message: `Gap = ${gap}: treat the array as ${Math.min(gap, n)} interleaved strands and insertion-sort each one. Far-apart swaps move values a long way fast.`,
    });
    for (let i = gap; i < n; i++) {
      const key = a[i];
      let j = i;
      while (j >= gap) {
        comparisons++;
        if (a[j - gap] > key) {
          push({
            compare: [j - gap],
            special: [i],
            codeLine: 5,
            message: `${a[j - gap]} (index ${j - gap}) > ${key}, so shift it ${gap} slot${gap === 1 ? '' : 's'} right.`,
          });
          a[j] = a[j - gap];
          writes++;
          push({ action: [j], codeLine: 6, message: `Shifted ${a[j]} into index ${j}.` });
          j -= gap;
        } else {
          push({
            compare: [j - gap],
            special: [i],
            codeLine: 5,
            message: `${a[j - gap]} ≤ ${key} — found the spot in this strand.`,
          });
          break;
        }
      }
      if (j !== i) {
        a[j] = key;
        writes++;
        push({ action: [j], codeLine: 7, message: `Place ${key} at index ${j}.` });
      }
    }
  }
  for (let k = 0; k < n; k++) locked.push(k);
  push({
    message: `Sorted! ${comparisons} comparisons and ${writes} writes. By the time gap reaches 1, the array is nearly sorted — exactly where Insertion Sort shines.`,
  });
  return frames;
}

// ─── Metadata ────────────────────────────────────────────────────────────────

export const sortingAlgorithms = [
  {
    id: 'bubble-sort',
    name: 'Bubble Sort',
    category: 'sorting',
    difficulty: 'Beginner',
    tagline: 'Swap out-of-order neighbours until nothing moves',
    about:
      'The friendliest first sorting algorithm. It sweeps through the list comparing each pair of neighbours and swapping them when the left one is bigger. After every full sweep, the largest remaining value has "bubbled" to its final spot at the end.',
    howItWorks: [
      'Compare the first two values; swap them if the left one is bigger.',
      'Slide one position right and repeat to the end of the list — that is one pass.',
      'Each pass locks the biggest remaining value into its final place at the end.',
      'If a whole pass makes zero swaps, the list is sorted — stop early.',
    ],
    insight: 'Watch the largest values race to the right while small ones crawl left one step per pass — that is why it is slow, and why it is called Bubble Sort.',
    complexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
    pseudocode: [
      'for i ← 0 to n−2',
      '  swapped ← false',
      '  for j ← 0 to n−i−2',
      '    if a[j] > a[j+1]',
      '      swap a[j], a[j+1]',
      '      swapped ← true',
      '  if not swapped → stop (sorted)',
    ],
    properties: { stable: true, inPlace: true, adaptive: true },
    realWorld: [
      'The “hello world” of sorting — the standard first algorithm in every CS course.',
      'One cheap pass doubles as a check for already-sorted data.',
      'Graphics rasterizers use it on tiny, nearly-sorted edge lists.',
    ],
    generate: bubbleSortFrames,
  },
  {
    id: 'selection-sort',
    name: 'Selection Sort',
    category: 'sorting',
    difficulty: 'Beginner',
    tagline: 'Find the minimum, put it in front, repeat',
    about:
      'Selection Sort splits the list into a sorted front and an unsorted back. Each round it scans the unsorted part for the smallest value and swaps it to the front — exactly how most people sort physical objects.',
    howItWorks: [
      'Scan the whole unsorted part to find the smallest value.',
      'Swap it with the first unsorted element — that position is now final.',
      'The sorted region grows by one from the left each round.',
      'Repeat until one element remains; it must already be the largest.',
    ],
    insight: 'It always does the same number of comparisons, sorted input or not — but it makes at most n−1 swaps, the fewest of any classic sort. Handy when writes are expensive.',
    complexity: { best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
    pseudocode: [
      'for i ← 0 to n−2',
      '  min ← i',
      '  for j ← i+1 to n−1',
      '    if a[j] < a[min]',
      '      min ← j',
      '  swap a[i], a[min]',
    ],
    properties: { stable: false, inPlace: true, adaptive: false },
    realWorld: [
      'When writes are expensive (flash / EEPROM memory) — it makes the fewest swaps possible.',
      'Grabbing the k smallest items without sorting everything.',
    ],
    generate: selectionSortFrames,
  },
  {
    id: 'cocktail-sort',
    name: 'Cocktail Shaker Sort',
    category: 'sorting',
    difficulty: 'Beginner',
    tagline: 'Bubble Sort that sweeps in both directions',
    about:
      'A two-way Bubble Sort: sweep left-to-right so the biggest value lands at the end, then sweep right-to-left so the smallest lands at the front. The sorted region grows from BOTH ends toward the middle — like shaking a cocktail back and forth.',
    howItWorks: [
      'Sweep rightwards, swapping out-of-order neighbours; the largest value locks in at the end.',
      'Sweep back leftwards the same way; the smallest value locks in at the front.',
      'Shrink the active window from both sides and repeat.',
      'A sweep with zero swaps means everything in between is already sorted.',
    ],
    insight: 'Plain Bubble Sort has a “turtle” problem: a tiny value near the end crawls left only one step per pass. The backward sweep rescues turtles in a single pass — same O(n²) worst case, but often noticeably fewer passes.',
    complexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
    pseudocode: [
      'repeat until a sweep makes no swaps:',
      '  sweep left → right, swapping bad neighbours',
      '  lock the biggest at the end',
      '  sweep right → left, swapping bad neighbours',
      '  lock the smallest at the front',
    ],
    properties: { stable: true, inPlace: true, adaptive: true },
    realWorld: [
      'Same niches as Bubble Sort, but finishes nearly-sorted data in fewer passes.',
      'A neat stepping stone for understanding why sweep direction matters.',
    ],
    generate: cocktailSortFrames,
  },
  {
    id: 'insertion-sort',
    name: 'Insertion Sort',
    category: 'sorting',
    difficulty: 'Beginner',
    tagline: 'Slide each new value into the sorted part — like sorting cards',
    about:
      'Insertion Sort keeps the left side of the list sorted and grows it one element at a time. Each new value is pulled out and slid left past everything bigger than it, exactly like inserting a playing card into a sorted hand.',
    howItWorks: [
      'Start with the second element — call it the "key".',
      'Shift every larger value in the sorted left part one slot right.',
      'Drop the key into the gap that opens up.',
      'Move to the next element and repeat until the end.',
    ],
    insight: 'On data that is already nearly sorted it flies — almost O(n). That is why real-world libraries (like Python’s Timsort) use insertion sort for small or nearly-ordered chunks.',
    complexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
    pseudocode: [
      'for i ← 1 to n−1',
      '  key ← a[i]',
      '  j ← i−1',
      '  while j ≥ 0 and a[j] > key',
      '    a[j+1] ← a[j]   (shift right)',
      '    j ← j−1',
      '  a[j+1] ← key      (insert)',
    ],
    properties: { stable: true, inPlace: true, adaptive: true },
    realWorld: [
      'Inside Python\'s Timsort and Rust\'s sort for small runs — real languages ship it today.',
      'Online sorting: keeping a list ordered as items arrive one by one.',
      'How most people naturally sort a hand of cards.',
    ],
    generate: insertionSortFrames,
  },
  {
    id: 'shell-sort',
    name: 'Shell Sort',
    category: 'sorting',
    difficulty: 'Intermediate',
    tagline: 'Insertion Sort over shrinking gaps',
    about:
      'Insertion Sort\'s weakness is that values move only one slot at a time. Shell Sort (Donald Shell, 1959) fixes that by first insertion-sorting elements that are a large GAP apart — letting values leap across the array — then shrinking the gap until a final ordinary insertion pass finishes the job.',
    howItWorks: [
      'Start with a big gap (here: half the array length).',
      'Insertion-sort every "strand" of elements that are gap apart — one shift moves a value gap slots.',
      'Halve the gap and repeat.',
      'When the gap reaches 1 it is plain Insertion Sort — but on data that is already nearly sorted.',
    ],
    insight: 'Each gap pass leaves the array "h-sorted", so by the final gap-1 pass almost nothing has far to travel. With good gap sequences Shell Sort runs around O(n^1.3) — a huge practical win from one simple idea.',
    complexity: { best: 'O(n log n)', average: '≈O(n^1.3)', worst: 'O(n²)', space: 'O(1)' },
    pseudocode: [
      'gap ← n / 2',
      'while gap ≥ 1',
      '  insertion-sort every gap-th strand:',
      '  for i ← gap to n−1',
      '    key ← a[i],  j ← i',
      '    while j ≥ gap and a[j−gap] > key',
      '      a[j] ← a[j−gap];  j ← j−gap',
      '    a[j] ← key',
      '  gap ← gap / 2',
    ],
    properties: { stable: false, inPlace: true, adaptive: true },
    realWorld: [
      'Embedded systems and tiny C libraries (e.g. uClibc\'s qsort) — strong results with zero recursion and zero extra memory.',
      'A practical middle ground when n is medium and code size matters.',
    ],
    generate: shellSortFrames,
  },
  {
    id: 'merge-sort',
    name: 'Merge Sort',
    category: 'sorting',
    difficulty: 'Intermediate',
    tagline: 'Split in half, sort each half, merge — divide & conquer',
    about:
      'Merge Sort is the textbook divide-and-conquer algorithm. It recursively splits the list until pieces have one element (trivially sorted), then merges pairs of sorted runs back together by repeatedly taking the smaller front value.',
    howItWorks: [
      'Split the list into two halves, and keep splitting until every piece is a single element.',
      'Merge two sorted pieces: repeatedly compare their front values and take the smaller one.',
      'Each merged piece is sorted — merge upward until one sorted list remains.',
      'The cyan marker shows the slot being decided; rose shows the value being written.',
    ],
    insight: 'Its O(n log n) time is guaranteed — no unlucky inputs exist. The price: it needs O(n) extra memory for the merge buffers.',
    complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)' },
    pseudocode: [
      'mergeSort(lo, hi):',
      '  if lo ≥ hi → done',
      '  mid ← (lo + hi) / 2',
      '  mergeSort(lo, mid)',
      '  mergeSort(mid+1, hi)',
      '  merge the two halves:',
      '    copy halves into L and R',
      '    repeatedly write the smaller front of L / R back',
      '    copy any leftovers back',
    ],
    properties: { stable: true, inPlace: false, adaptive: false },
    realWorld: [
      'External sorting: files far too big for RAM, merged chunk by chunk.',
      'The stable backbone of Timsort (Python, Java objects) — stability matters when sorting people by name, then by city.',
      'Counting inversions ("how out-of-order is this list?").',
    ],
    generate: mergeSortFrames,
  },
  {
    id: 'quick-sort',
    name: 'Quick Sort',
    category: 'sorting',
    difficulty: 'Intermediate',
    tagline: 'Partition around a pivot, then conquer each side',
    about:
      'Quick Sort picks a pivot value and partitions the list so everything smaller sits left of the pivot and everything bigger sits right. The pivot lands in its final position, and the two sides are sorted recursively. Usually the fastest comparison sort in practice.',
    howItWorks: [
      'Choose a pivot (here: the last element of the current range).',
      'Walk the range, swapping every value ≤ pivot into a growing "smaller" zone on the left.',
      'Swap the pivot just after that zone — it is now in its FINAL spot (emerald).',
      'Recursively repeat on the left and right sides.',
    ],
    insight: 'Everything hinges on the pivot. A middle-ish pivot halves the problem (n log n); a terrible pivot (try the Reversed preset) peels off one element at a time (n²).',
    complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n²)', space: 'O(log n)' },
    pseudocode: [
      'quickSort(lo, hi):',
      '  if the range has ≤ 1 element → done',
      '  pivot ← a[hi]',
      '  i ← lo',
      '  for j ← lo to hi−1',
      '    if a[j] ≤ pivot',
      '      swap a[i], a[j];  i ← i+1',
      '  swap a[i], a[hi]   (pivot is final)',
      '  quickSort(lo, i−1);  quickSort(i+1, hi)',
    ],
    properties: { stable: false, inPlace: true, adaptive: false },
    realWorld: [
      'The default in-memory sort behind C\'s qsort and many language runtimes.',
      'Quickselect (the same partition idea) finds medians and top-k in O(n).',
      'Databases use its partitioning idea for query execution.',
    ],
    generate: quickSortFrames,
  },
  {
    id: 'heap-sort',
    name: 'Heap Sort',
    category: 'sorting',
    difficulty: 'Advanced',
    tagline: 'Build a max-heap, then repeatedly extract the largest',
    about:
      'Heap Sort views the array as a binary tree stored by index: the children of position i live at 2i+1 and 2i+2. It first rearranges the array into a max-heap (every parent ≥ its children), then repeatedly swaps the root — always the maximum — to the back.',
    howItWorks: [
      'Build phase: walk parents from the middle backwards, sinking each one below its larger children until every parent ≥ its children.',
      'The maximum is now at index 0 (the root).',
      'Swap it with the last unsorted element — that slot becomes final.',
      'Sink the new root to repair the heap, and repeat.',
    ],
    insight: 'The array IS the tree — no pointers needed. Heap Sort guarantees O(n log n) with zero extra memory, though in practice it jumps around memory more than Quick Sort, so it is usually a bit slower.',
    complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(1)' },
    pseudocode: [
      'build a max-heap (sift each parent down)',
      'the root a[0] is now the maximum',
      'for end ← n−1 down to 1',
      '  swap a[0] and a[end]   (max goes to back)',
      '  shrink the heap; sift the new root down',
      'siftDown(i):',
      '  while i has a child inside the heap',
      '    pick the larger child',
      '    if a[i] ≥ that child → stop',
      '    swap them; continue from the child',
    ],
    properties: { stable: false, inPlace: true, adaptive: false },
    realWorld: [
      'The heap itself powers priority queues: OS schedulers, Dijkstra\'s shortest path, event simulation.',
      'Introsort (C++ std::sort) falls back to Heap Sort to guarantee O(n log n) in the worst case.',
    ],
    generate: heapSortFrames,
  },
];
