// Sanity harness: runs every step generator against randomized inputs and
// asserts the *algorithmic* result is correct. Run with `npm run verify`.
import { sortingAlgorithms } from '../src/algorithms/sorting.js';
import { searchingAlgorithms } from '../src/algorithms/searching.js';
import { geometryAlgorithms } from '../src/algorithms/geometry.js';
import { mathAlgorithms } from '../src/algorithms/maths.js';
import { quantumAlgorithms } from '../src/algorithms/quantum.js';
import { dot2, multiplicativeOrder, validShorBases } from '../src/lib/quantum.js';

let checks = 0;
let failures = 0;
const fail = (msg) => {
  failures++;
  console.error(`  ✗ ${msg}`);
};
const assert = (cond, msg) => {
  checks++;
  if (!cond) fail(msg);
};

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randArray = (n) => Array.from({ length: n }, () => randInt(1, 99));

// ─── Frame shape ─────────────────────────────────────────────────────────────
const checkFrames = (frames, label) => {
  assert(Array.isArray(frames) && frames.length > 0, `${label}: no frames`);
  for (const f of frames) {
    assert(typeof f.message === 'string' && f.message.length > 0, `${label}: frame missing message`);
    assert(typeof f.stats === 'object', `${label}: frame missing stats`);
  }
};

// ─── Sorting ─────────────────────────────────────────────────────────────────
console.log('Sorting…');
for (const algo of sortingAlgorithms) {
  for (let t = 0; t < 60; t++) {
    const n = randInt(1, 40);
    const input =
      t % 4 === 0 ? randArray(n)
      : t % 4 === 1 ? [...randArray(n)].sort((a, b) => a - b)
      : t % 4 === 2 ? [...randArray(n)].sort((a, b) => b - a)
      : Array.from({ length: n }, () => randInt(1, 4) * 20);
    const frames = algo.generate(input);
    checkFrames(frames, algo.id);
    const out = frames[frames.length - 1].array;
    const expected = [...input].sort((a, b) => a - b);
    assert(JSON.stringify(out) === JSON.stringify(expected), `${algo.id}: wrong result for [${input}] → [${out}]`);
    const lastSorted = frames[frames.length - 1].sorted;
    assert(lastSorted.length === n, `${algo.id}: final frame doesn't mark all ${n} indices sorted (got ${lastSorted.length})`);
    assert(frames[0].array.length === n, `${algo.id}: first frame array length mismatch`);
  }
  console.log(`  ✓ ${algo.id}`);
}

// ─── Searching ───────────────────────────────────────────────────────────────
console.log('Searching…');
for (const algo of searchingAlgorithms) {
  for (let t = 0; t < 80; t++) {
    const n = randInt(1, 30);
    const sorted = [];
    let v = randInt(1, 5);
    for (let i = 0; i < n; i++) {
      sorted.push(v);
      v += randInt(1, 7);
    }
    const array = algo.requiresSorted ? sorted : [...sorted].sort(() => Math.random() - 0.5);
    const target = t % 2 === 0 ? array[randInt(0, n - 1)] : -randInt(1, 50);
    const frames = algo.generate({ array, target });
    checkFrames(frames, algo.id);
    const last = frames[frames.length - 1];
    const realIdx = array.indexOf(target);
    if (realIdx >= 0) {
      assert(last.found !== null && array[last.found] === target, `${algo.id}: missed ${target} in [${array}]`);
    } else {
      assert(last.notFound === true && last.found === null, `${algo.id}: claimed to find absent ${target} in [${array}]`);
    }
  }
  console.log(`  ✓ ${algo.id}`);
}

// ─── Geometry ────────────────────────────────────────────────────────────────
console.log('Geometry…');
const dist = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);
const bruteClosest = (pts) => {
  let best = Infinity;
  for (let i = 0; i < pts.length; i++)
    for (let j = i + 1; j < pts.length; j++) best = Math.min(best, dist(pts[i], pts[j]));
  return best;
};
const refHull = (pts) => {
  // reference monotone chain returning hull point count (collinear-free)
  const P = pts.map((p, i) => i).sort((a, b) => pts[a].x - pts[b].x || pts[a].y - pts[b].y);
  const cross = (o, a, b) =>
    (pts[a].x - pts[o].x) * (pts[b].y - pts[o].y) - (pts[a].y - pts[o].y) * (pts[b].x - pts[o].x);
  const build = (seq) => {
    const ch = [];
    for (const id of seq) {
      while (ch.length >= 2 && cross(ch[ch.length - 2], ch[ch.length - 1], id) <= 0) ch.pop();
      ch.push(id);
    }
    return ch;
  };
  const lower = build(P);
  const upper = build([...P].reverse());
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
};

const [cpBrute, cpDC, hull] = geometryAlgorithms;
for (let t = 0; t < 120; t++) {
  const n = randInt(2, 24);
  const pts = Array.from({ length: n }, () => ({ x: randInt(0, 100), y: randInt(0, 62) }));
  const expected = bruteClosest(pts);

  for (const algo of [cpBrute, cpDC]) {
    const frames = algo.generate(pts);
    checkFrames(frames, algo.id);
    const last = frames[frames.length - 1];
    assert(last.best !== null, `${algo.id}: no best pair for n=${n}`);
    const got = dist(pts[last.best[0]], pts[last.best[1]]);
    assert(Math.abs(got - expected) < 1e-9, `${algo.id}: got ${got}, expected ${expected} (n=${n})`);
  }

  if (n >= 3) {
    const frames = hull.generate(pts);
    checkFrames(frames, hull.id);
    const last = frames[frames.length - 1];
    assert(last.hullClosed, 'convex-hull: final frame not closed');
    const expectedHull = refHull(pts);
    assert(
      last.hull.length === expectedHull.length,
      `convex-hull: ${last.hull.length} hull points, expected ${expectedHull.length}`
    );
    // every point must be inside or on the hull (cross-product containment)
    const h = last.hull;
    for (let i = 0; i < pts.length; i++) {
      let ok = true;
      for (let e = 0; e < h.length; e++) {
        const a = pts[h[e]];
        const b = pts[h[(e + 1) % h.length]];
        const c = (b.x - a.x) * (pts[i].y - a.y) - (b.y - a.y) * (pts[i].x - a.x);
        if (c < -1e-9) ok = false;
      }
      assert(ok, `convex-hull: point ${i} lies outside the reported hull`);
    }
  }
}
console.log('  ✓ closest-pair-brute\n  ✓ closest-pair-dc\n  ✓ convex-hull');

// ─── Math ────────────────────────────────────────────────────────────────────
console.log('Math…');
const refGcd = (a, b) => (b === 0n ? a : refGcd(b, a % b));
const refPrimes = (N) => {
  const composite = new Array(N + 1).fill(false);
  const out = [];
  for (let i = 2; i <= N; i++) {
    if (composite[i]) continue;
    out.push(i);
    for (let m = i * i; m <= N; m += i) composite[m] = true;
  }
  return out;
};

for (const algo of mathAlgorithms) {
  for (let t = 0; t < 60; t++) {
    const digits = (maxLen) => {
      const len = randInt(1, maxLen);
      let s = String(randInt(1, 9));
      for (let i = 1; i < len; i++) s += String(randInt(0, 9));
      return s;
    };

    if (algo.id === 'sieve') {
      const limit = randInt(algo.minLimit, algo.maxLimit);
      const frames = algo.generate({ limit });
      checkFrames(frames, algo.id);
      const last = frames[frames.length - 1];
      const gotPrimes = [];
      for (let i = 2; i <= limit; i++) if (last.status[i] === 1) gotPrimes.push(i);
      const gotComposites = last.status.filter((s) => s === 2).length;
      const expected = refPrimes(limit);
      assert(
        JSON.stringify(gotPrimes) === JSON.stringify(expected),
        `sieve(${limit}): primes mismatch — got ${gotPrimes.length}, expected ${expected.length}`
      );
      assert(gotComposites === limit - 1 - expected.length, `sieve(${limit}): composite count wrong`);
      continue;
    }

    if (algo.id === 'euclid-gcd') {
      const a = t === 0 ? '0' : digits(algo.maxDigits);
      const b = t === 1 ? '0' : digits(algo.maxDigits);
      const frames = algo.generate({ a, b });
      checkFrames(frames, algo.id);
      const last = frames[frames.length - 1];
      const expected = refGcd(BigInt(a) > BigInt(b) ? BigInt(a) : BigInt(b), BigInt(a) > BigInt(b) ? BigInt(b) : BigInt(a)).toString();
      assert(
        last.result === `gcd(${a}, ${b}) = ${expected}`,
        `euclid-gcd: gcd(${a}, ${b}) → "${last.result}", expected ${expected}`
      );
      continue;
    }

    if (algo.id === 'fast-power') {
      const a = digits(algo.maxDigits);
      const b = t === 0 ? '0' : String(randInt(1, algo.maxB));
      const frames = algo.generate({ a, b });
      checkFrames(frames, algo.id);
      const last = frames[frames.length - 1];
      const expected = (BigInt(a) ** BigInt(b)).toString();
      assert(
        last.result === `${BigInt(a)}^${Number(b)} = ${expected}`,
        `fast-power: ${a}^${b} → "${last.result}", expected ${expected}`
      );
      continue;
    }

    // multiplication algorithms
    const a = t === 0 ? '0' : digits(algo.maxDigits);
    const b = t === 1 ? '0' : digits(algo.maxDigits);
    const frames = algo.generate({ a, b });
    checkFrames(frames, algo.id);
    const expected = (BigInt(a) * BigInt(b)).toString();
    const last = frames[frames.length - 1];
    const got = algo.id === 'long-multiplication' ? last.total : last.calls[0].result;
    assert(got === expected, `${algo.id}: ${a} × ${b} = ${got}, expected ${expected}`);
  }
  console.log(`  ✓ ${algo.id}`);
}

// ─── Quantum ─────────────────────────────────────────────────────────────────
console.log('Quantum…');
const [bloch, deutsch, dj, grover, simon, shor] = quantumAlgorithms;
const EPS = 1e-9;
const close = (a, b, eps = EPS) => Math.abs(a - b) < eps;

// Bloch: final coordinates vs hand-computed analytic states
{
  const CASES = [
    { ops: [], v: [0, 0, 1] },
    { ops: ['X'], v: [0, 0, -1] },
    { ops: ['H'], v: [1, 0, 0] },
    { ops: ['H', 'S'], v: [0, 1, 0] },
    { ops: ['H', 'S', 'H'], v: [0, -1, 0] },
    { ops: ['H', 'T'], v: [Math.SQRT1_2, Math.SQRT1_2, 0] },
    { ops: ['H', 'H'], v: [0, 0, 1] },
    { ops: ['X', 'X'], v: [0, 0, 1] },
    { ops: ['H', 'Z', 'H'], v: [0, 0, -1] }, // HZH = X
    { ops: ['S', 'Sdg'], v: [0, 0, 1] },
    { ops: ['T', 'T'], v: [0, 0, 1] }, // phases on |0⟩ do nothing visible
  ];
  for (const c of CASES) {
    const frames = bloch.generate({ ops: c.ops.map((g) => ({ type: 'gate', g })) });
    checkFrames(frames, 'bloch-sphere');
    const f = frames[frames.length - 1];
    assert(
      close(f.x, c.v[0], 1e-6) && close(f.y, c.v[1], 1e-6) && close(f.z, c.v[2], 1e-6),
      `bloch: [${c.ops}] → (${f.x.toFixed(3)}, ${f.y.toFixed(3)}, ${f.z.toFixed(3)}), expected (${c.v})`
    );
    assert(close(f.p0 + f.p1, 1, 1e-9), `bloch: [${c.ops}] probabilities don't sum to 1`);
  }
  // measurement collapses to the recorded outcome
  const m = bloch.generate({ ops: [{ type: 'gate', g: 'H' }, { type: 'measure', outcome: 1 }] });
  const lastM = m[m.length - 1];
  assert(close(lastM.z, -1, 1e-9) && close(lastM.p1, 1, 1e-9), 'bloch: measure→1 did not collapse to |1⟩');
}
console.log('  ✓ bloch-sphere');

// Deutsch: certainty for all four functions
for (const f of ['const0', 'const1', 'id', 'not']) {
  const frames = deutsch.generate({ f });
  checkFrames(frames, 'deutsch');
  const v = frames[frames.length - 1];
  const expectConstant = f === 'const0' || f === 'const1';
  const saysConstant = v.message.includes('CONSTANT');
  assert(saysConstant === expectConstant, `deutsch(${f}): verdict wrong`);
}
console.log('  ✓ deutsch');

// Deutsch–Jozsa: P(|0…0⟩) is exactly 1 (constant) or 0 (balanced)
for (let n = 2; n <= 4; n++) {
  const N = 1 << n;
  const oracles = [{ oracle: 'const0', pattern: 0 }, { oracle: 'const1', pattern: 0 }];
  for (let t = 0; t < 20; t++) {
    // random balanced pattern: exactly N/2 ones
    const idx = Array.from({ length: N }, (_, i) => i).sort(() => Math.random() - 0.5);
    let pattern = 0;
    for (let i = 0; i < N / 2; i++) pattern |= 1 << idx[i];
    oracles.push({ oracle: 'balanced', pattern });
  }
  for (const o of oracles) {
    const frames = dj.generate({ n, ...o });
    checkFrames(frames, 'deutsch-jozsa');
    const amps = frames[frames.length - 1].amps;
    const p0 = amps[0] * amps[0];
    const isConstant = o.oracle !== 'balanced';
    assert(
      isConstant ? close(p0, 1, 1e-9) : close(p0, 0, 1e-9),
      `deutsch-jozsa n=${n} ${o.oracle}: P(0…0)=${p0}`
    );
    const norm = amps.reduce((s, a) => s + a * a, 0);
    assert(close(norm, 1, 1e-9), `deutsch-jozsa n=${n}: state not normalised (${norm})`);
  }
}
console.log('  ✓ deutsch-jozsa');

// Grover: marked-state probability after optimal iterations matches sin²((2t+1)θ)
for (let n = 2; n <= 4; n++) {
  const N = 1 << n;
  for (let marked = 0; marked < N; marked++) {
    const frames = grover.generate({ n, marked });
    checkFrames(frames, 'grover');
    const amps = frames[frames.length - 1].amps;
    const p = amps[marked] * amps[marked];
    const t = Math.max(1, Math.floor((Math.PI / 4) * Math.sqrt(N)));
    const theta = Math.asin(1 / Math.sqrt(N));
    const expected = Math.sin((2 * t + 1) * theta) ** 2;
    assert(close(p, expected, 1e-9), `grover n=${n} marked=${marked}: P=${p}, theory ${expected}`);
    assert(p > 0.9, `grover n=${n}: success probability only ${p}`);
  }
}
console.log('  ✓ grover');

// Simon: every collected equation satisfies y·s = 0 and the solver recovers s
for (const n of [2, 3]) {
  for (let secret = 1; secret < 1 << n; secret++) {
    const frames = simon.generate({ n, secret });
    checkFrames(frames, 'simon');
    const last = frames[frames.length - 1];
    const solvedNote = last.notes.find((x) => x.startsWith('solved'));
    assert(solvedNote !== undefined, `simon n=${n} s=${secret}: no solution note`);
    const got = parseInt(solvedNote.split('= ')[1], 2);
    assert(got === secret, `simon n=${n}: solved ${got}, expected ${secret}`);
    for (const eq of last.notes.filter((x) => x.includes('· s'))) {
      const y = parseInt(eq.split(' ')[0], 2);
      assert(dot2(y, secret) === 0, `simon: equation y=${y} violates y·s=0 for s=${secret}`);
    }
  }
}
console.log('  ✓ simon');

// Shor: every offered (N, a) ends in a correct non-trivial factorisation
for (const N of [15, 21, 35]) {
  const bases = validShorBases(N);
  assert(bases.length > 0, `shor: no valid bases for ${N}`);
  for (const a of bases) {
    const frames = shor.generate({ N, a });
    checkFrames(frames, 'shor-period');
    const last = frames[frames.length - 1];
    assert(last.result !== null, `shor(${N}, ${a}): no result`);
    const m = last.result.match(/(\d+) = (\d+) × (\d+)/);
    assert(m !== null, `shor(${N}, ${a}): malformed result "${last.result}"`);
    const [, nn, f1, f2] = m.map(Number);
    assert(nn === N && f1 * f2 === N && f1 > 1 && f2 > 1, `shor(${N}, ${a}): ${f1} × ${f2} ≠ ${N} or trivial`);
    // the spectrum frame's top peaks must sit at multiples of Q/r
    const spec = frames.find((fr) => fr.kind === 'quantum' && fr.peaks);
    const r = multiplicativeOrder(a, N);
    const Q = spec.probs.length;
    const top = spec.probs
      .map((p, k) => [p, k])
      .sort((x, y) => y[0] - x[0])
      .slice(0, r)
      .map(([, k]) => k)
      .sort((x, y) => x - y);
    for (const k of top) {
      const nearest = Math.round((k * r) / Q) * (Q / r);
      assert(Math.abs(k - nearest) <= 1, `shor(${N}, ${a}): peak at k=${k} not near a multiple of Q/r=${Q / r}`);
    }
  }
}
console.log('  ✓ shor-period');

console.log(`\n${checks} checks, ${failures} failure${failures === 1 ? '' : 's'}.`);
process.exit(failures ? 1 : 0);
