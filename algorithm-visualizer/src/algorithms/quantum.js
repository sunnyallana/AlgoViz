// ─── Quantum algorithms ──────────────────────────────────────────────────────
// Everything here is EXACT simulation — no hand-waving. Single-qubit states on
// the Bloch sphere ('bloch' frames), real amplitude vectors for the oracle
// algorithms ('quantum' frames, signed bars), spectra for Shor ('quantum'
// frames in spectrum mode via `probs`), and classical work as 'steps' cards.

import {
  KET0,
  BLOCH_GATES,
  rotate,
  blochVector,
  prob0,
  displayAmplitudes,
  fmtComplex,
  basisState,
  hadamardAll,
  hadamardBit,
  phaseOracle,
  diffusion,
  binLabel,
  dot2,
  gcdInt,
  modPow,
  multiplicativeOrder,
  combSpectrum,
  convergents,
} from '../lib/quantum.js';

const qframe = (extra = {}) => ({
  kind: 'quantum',
  amps: null,
  probs: null,
  nLabels: 0,
  marked: null,
  mean: null,
  highlight: [],
  colors: null,
  notes: [],
  peaks: null,
  message: '',
  codeLine: null,
  stats: {},
  ...extra,
});

const stepsFrame = (extra = {}) => ({
  kind: 'steps',
  steps: [],
  activeStep: null,
  result: null,
  message: '',
  codeLine: null,
  stats: {},
  ...extra,
});

const pct = (p) => `${(p * 100).toFixed(p * 100 >= 99.95 || p === 0 ? 0 : 1)}%`;

// ─── Bloch Sphere playground ─────────────────────────────────────────────────

const GATE_LINE = { X: 1, Y: 1, Z: 1, H: 2, S: 3, Sdg: 3, T: 4, Tdg: 4 };
const AXIS_NAME = { X: 'the X axis', Y: 'the Y axis', Z: 'the Z axis', H: 'the X+Z diagonal', S: 'the Z axis', Sdg: 'the Z axis', T: 'the Z axis', Tdg: 'the Z axis' };
const SUBSTEPS = 12;

function blochFrames({ ops }) {
  const frames = [];
  let state = KET0;
  let gates = 0;
  let measures = 0;
  const stats = () => ({ Gates: gates, Measurements: measures });

  const push = (st, extra = {}) => {
    const v = blochVector(st);
    const d = displayAmplitudes(st);
    frames.push({
      kind: 'bloch',
      x: v.x,
      y: v.y,
      z: v.z,
      alpha: fmtComplex(d.ar, d.ai),
      beta: fmtComplex(d.br, d.bi),
      p0: prob0(st),
      p1: 1 - prob0(st),
      trail: [],
      activeGate: null,
      message: '',
      codeLine: 0,
      stats: stats(),
      ...extra,
    });
  };

  push(state, {
    message: 'The qubit starts in |0⟩ — the arrow points to the north pole. Click gates below to rotate it, then Measure to collapse it.',
    codeLine: 0,
  });

  for (const op of ops) {
    if (op.type === 'gate') {
      const g = BLOCH_GATES[op.g];
      gates++;
      const deg = Math.round((Math.abs(g.angle) * 180) / Math.PI);
      const trail = [];
      for (let s = 1; s <= SUBSTEPS; s++) {
        const st = rotate(state, g.axis, (g.angle * s) / SUBSTEPS);
        trail.push(blochVector(st));
        const done = s === SUBSTEPS;
        push(st, {
          trail: [...trail],
          activeGate: g.label,
          codeLine: GATE_LINE[op.g],
          message: done
            ? `${g.label} complete — now P(0) = ${pct(prob0(st))}, P(1) = ${pct(1 - prob0(st))}.`
            : `${g.label}: rotating ${deg}° around ${AXIS_NAME[op.g]}…`,
        });
      }
      state = rotate(state, g.axis, g.angle);
    } else if (op.type === 'measure') {
      measures++;
      const p = prob0(state);
      push(state, {
        codeLine: 5,
        message: `Measure! The arrow's height decides the odds: P(0) = ${pct(p)}, P(1) = ${pct(1 - p)}. Rolling the quantum dice…`,
      });
      state = op.outcome === 0 ? { ...KET0 } : { ar: 0, ai: 0, br: 1, bi: 0 };
      push(state, {
        codeLine: 5,
        message: `Outcome: |${op.outcome}⟩ (it had a ${pct(op.outcome === 0 ? p : 1 - p)} chance). The superposition is gone — measurement snapped the arrow to a pole.`,
      });
    }
  }
  return frames;
}

// ─── Deutsch ─────────────────────────────────────────────────────────────────

const DEUTSCH_FNS = {
  const0: { f: () => 0, label: 'f(x) = 0', constant: true },
  const1: { f: () => 1, label: 'f(x) = 1', constant: true },
  id: { f: (x) => x, label: 'f(x) = x', constant: false },
  not: { f: (x) => 1 - x, label: 'f(x) = NOT x', constant: false },
};

function deutschFrames({ f }) {
  const fn = DEUTSCH_FNS[f];
  const frames = [];
  const push = (v, extra = {}) => frames.push(qframe({ amps: [...v], nLabels: 2, stats: { 'Oracle queries': extra.codeLine >= 2 ? 1 : 0 }, ...extra }));

  // |x y⟩, x = bit 1, y = bit 0. Start in |0 1⟩.
  let v = [0, 1, 0, 0];
  push(v, {
    codeLine: 0,
    message: `Is ${fn.label} constant or balanced? Classically you must call f twice. Quantum needs ONE call. Start with x = |0⟩ and a helper qubit y = |1⟩.`,
  });

  v = hadamardAll(v);
  push(v, {
    codeLine: 1,
    message: 'H on both qubits. x now asks f about 0 AND 1 at once — and the helper qubit became |−⟩, whose job is to turn answers into SIGNS.',
  });

  const flipped = [];
  const w = [...v];
  for (let x = 0; x < 2; x++) {
    if (fn.f(x) === 1) {
      [w[2 * x], w[2 * x + 1]] = [w[2 * x + 1], w[2 * x]];
      flipped.push(2 * x, 2 * x + 1);
    }
  }
  v = w;
  push(v, {
    codeLine: 2,
    highlight: flipped,
    message:
      flipped.length === 0
        ? `Oracle applied: ${fn.label} never returns 1, so nothing changes. The answer is hiding in the signs (all unchanged).`
        : `Oracle applied: wherever f(x) = 1, the |−⟩ helper flips that branch's sign (highlighted). One call answered BOTH questions.`,
  });

  v = hadamardBit(v, 1);
  push(v, {
    codeLine: 3,
    message: 'H on x interferes the two answers: if the signs AGREED (constant) they add up at x = 0; if they DISAGREED (balanced) they cancel at x = 0 and pile up at x = 1.',
  });

  const pX0 = v[0] * v[0] + v[1] * v[1];
  const verdictIdx = pX0 > 0.5 ? [0, 1] : [2, 3];
  push(v, {
    codeLine: 4,
    highlight: verdictIdx,
    message: `Measure x: it reads ${pX0 > 0.5 ? '0 — so f is CONSTANT' : '1 — so f is BALANCED'} (with certainty). Verdict for ${fn.label}: ${fn.constant ? 'constant' : 'balanced'} ✓ — found with a single query.`,
  });
  return frames;
}

// ─── Deutsch–Jozsa ───────────────────────────────────────────────────────────

function deutschJozsaFrames({ n, oracle, pattern }) {
  const N = 1 << n;
  const frames = [];
  let queries = 0;
  const stats = () => ({ 'Oracle queries': queries, 'Classical worst case': (N >> 1) + 1 });
  const push = (v, extra = {}) => frames.push(qframe({ amps: [...v], nLabels: n, stats: stats(), ...extra }));

  const flips = new Set();
  if (oracle === 'const1') for (let i = 0; i < N; i++) flips.add(i);
  if (oracle === 'balanced') for (let i = 0; i < N; i++) if ((pattern >> i) & 1) flips.add(i);
  const isConstant = oracle !== 'balanced';

  let v = basisState(n);
  push(v, {
    codeLine: 0,
    message: `A mystery function f over ${n}-bit inputs is promised to be all-same (constant) or exactly half-and-half (balanced). Classically the worst case needs ${(N >> 1) + 1} checks. Watch quantum do it in ONE.`,
  });

  v = hadamardAll(v);
  push(v, {
    codeLine: 1,
    message: `H on every qubit: all ${N} inputs now live in superposition with equal amplitude 1/√${N}.`,
  });

  queries = 1;
  v = phaseOracle(v, flips);
  push(v, {
    codeLine: 2,
    highlight: [...flips],
    message:
      oracle === 'const0'
        ? 'One oracle call: f is 0 everywhere, so no signs flip. (We don\'t know that yet!)'
        : oracle === 'const1'
          ? 'One oracle call: f is 1 everywhere — EVERY sign flips. A global flip changes nothing measurable… which is exactly the point.'
          : `One oracle call: f flips the sign of the ${flips.size} inputs where f(x) = 1 (highlighted). All answers gathered in a single query.`,
  });

  v = hadamardAll(v);
  push(v, {
    codeLine: 3,
    highlight: [0],
    message: isConstant
      ? `H again — interference time. The signs all agreed, so everything piles up on ${binLabel(0, n)}: its probability is now ${pct(v[0] * v[0])}.`
      : `H again — interference time. Half the signs disagreed, so the paths to ${binLabel(0, n)} cancel EXACTLY: its probability is ${pct(v[0] * v[0])}.`,
  });

  push(v, {
    codeLine: 4,
    marked: 0,
    highlight: isConstant ? [0] : v.map((a, i) => (a * a > 1e-9 ? i : -1)).filter((i) => i >= 0),
    message: `Measure: ${isConstant ? `all zeros → f is CONSTANT` : `something non-zero → f is BALANCED`} — with certainty, after 1 query instead of up to ${(N >> 1) + 1}. That is an exponential saving.`,
  });
  return frames;
}

// ─── Grover ──────────────────────────────────────────────────────────────────

function groverFrames({ n, marked }) {
  const N = 1 << n;
  const iterations = Math.max(1, Math.floor((Math.PI / 4) * Math.sqrt(N)));
  const frames = [];
  let queries = 0;
  const stats = () => ({ 'Oracle queries': queries, 'Classical expected': Math.ceil(N / 2) });
  const push = (v, extra = {}) => frames.push(qframe({ amps: [...v], nLabels: n, marked, stats: stats(), ...extra }));

  let v = basisState(n);
  push(v, {
    codeLine: 0,
    message: `One of ${N} drawers hides the treasure (${binLabel(marked, n)} — but the algorithm doesn't know that). Classically you'd open ~${Math.ceil(N / 2)} drawers. Grover needs ${iterations}.`,
  });

  v = hadamardAll(v);
  push(v, {
    codeLine: 0,
    message: `H on every qubit: every drawer equally likely, P = ${pct(1 / N)} each. Now amplify the right one.`,
  });

  for (let t = 1; t <= iterations; t++) {
    queries++;
    v = phaseOracle(v, new Set([marked]));
    push(v, {
      codeLine: 2,
      highlight: [marked],
      message: `Iteration ${t}/${iterations} — oracle: it recognises the marked item and flips its SIGN. Probabilities unchanged (P = ${pct(v[marked] * v[marked])}), but the flip sets up the next move…`,
    });

    const { out, mean } = diffusion(v);
    push(v, {
      codeLine: 3,
      mean,
      highlight: [marked],
      message: `Diffusion: reflect every bar about the mean (dashed line). The negative bar sits far below the mean — reflecting it makes it LARGE.`,
    });
    v = out;
    push(v, {
      codeLine: 3,
      mean,
      highlight: [marked],
      message: `After the reflection: P(${binLabel(marked, n)}) jumped to ${pct(v[marked] * v[marked])}. Everyone else shrank slightly.`,
    });
  }

  push(v, {
    codeLine: 4,
    highlight: [marked],
    message: `Measure: ${binLabel(marked, n)} with probability ${pct(v[marked] * v[marked])} — after only ${iterations} oracle quer${iterations === 1 ? 'y' : 'ies'} (~√${N}). Caution: extra iterations would overshoot and shrink it again!`,
  });
  return frames;
}

// ─── Simon ───────────────────────────────────────────────────────────────────

const PAIR_PALETTE = ['#8B5CF6', '#22D3EE', '#FBBF24', '#34D399', '#FB7185', '#A78BFA', '#F472B6', '#60A5FA'];

function simonFrames({ n, secret }) {
  const N = 1 << n;
  const frames = [];
  let runs = 0;
  const equations = [];
  const stats = () => ({ 'Quantum runs': runs, 'Equations collected': equations.length });

  // f(x) = min(x, x⊕s): a canonical 2-to-1 function with f(x) = f(x⊕s)
  const pairRep = (x) => Math.min(x, x ^ secret);
  const reps = [];
  for (let x = 0; x < N; x++) if (pairRep(x) === x) reps.push(x);
  const colorOf = (x) => PAIR_PALETTE[reps.indexOf(pairRep(x)) % PAIR_PALETTE.length];
  const colors = Array.from({ length: N }, (_, x) => colorOf(x));

  const push = (amps, extra = {}) => frames.push(qframe({ amps: [...amps], nLabels: n, stats: stats(), ...extra }));

  const validYs = [];
  for (let y = 1; y < N; y++) if (dot2(y, secret) === 0) validYs.push(y);
  const needed = n - 1;

  push(basisState(n), {
    codeLine: 0,
    message: `A black-box f hides a secret string s: it promises f(x) = f(x⊕s). Finding s classically needs ~√${N}·… many collisions — quantum needs about ${needed} run${needed === 1 ? '' : 's'}. (Secret: s = ${secret.toString(2).padStart(n, '0')} — shh, the algorithm doesn't know.)`,
  });

  const eqNotes = () => equations.map((y) => `${y.toString(2).padStart(n, '0')} · s ≡ 0`);

  for (let run = 0; run < needed; run++) {
    runs++;
    const uniform = new Array(N).fill(1 / Math.sqrt(N));
    push(uniform, {
      codeLine: 2,
      colors,
      notes: eqNotes(),
      message: `Run ${run + 1}: superpose all ${N} inputs and compute f. Inputs sharing a colour are PAIRS — each pair differs by exactly s. The pairing is there, but hidden.`,
    });

    const x0 = reps[run % reps.length];
    const pair = [x0, x0 ^ secret];
    const collapsed = new Array(N).fill(0);
    collapsed[pair[0]] = 1 / Math.SQRT2;
    collapsed[pair[1]] = 1 / Math.SQRT2;
    push(collapsed, {
      codeLine: 3,
      colors,
      highlight: pair,
      notes: eqNotes(),
      message: `Measure the OUTPUT register — suppose it reads f = ${pairRep(x0)}. The input register collapses to that one pair: (|${pair[0].toString(2).padStart(n, '0')}⟩ + |${pair[1].toString(2).padStart(n, '0')}⟩)/√2. The two survivors differ by exactly s!`,
    });

    const afterH = hadamardAll(collapsed);
    push(afterH, {
      codeLine: 4,
      notes: eqNotes(),
      message: `H on the input register: interference kills every y with y·s = 1. Only the ${validYs.length + 1} outputs with y·s ≡ 0 (mod 2) survive — each one is a CLUE about s.`,
    });

    const y = validYs[run % validYs.length];
    equations.push(y);
    push(afterH, {
      codeLine: 4,
      highlight: [y],
      notes: eqNotes(),
      message: `Measure: suppose we read y = ${y.toString(2).padStart(n, '0')}. That gives one linear equation: ${y.toString(2).padStart(n, '0')} · s ≡ 0 (mod 2).`,
    });
  }

  let solved = 0;
  for (let s = 1; s < N; s++) {
    if (equations.every((y) => dot2(y, s) === 0)) {
      solved = s;
      break;
    }
  }
  const lastAmps = new Array(N).fill(0);
  lastAmps[solved] = 1;
  push(lastAmps, {
    codeLine: 5,
    highlight: [solved],
    notes: [...eqNotes(), `solved: s = ${solved.toString(2).padStart(n, '0')}`],
    message: `Solve the system over GF(2): the only non-zero s satisfying ${equations.length === 1 ? 'the equation' : `all ${equations.length} equations`} is s = ${solved.toString(2).padStart(n, '0')} ✓. ${runs} quantum run${runs === 1 ? '' : 's'} versus exponentially many classical queries — Simon's algorithm directly inspired Shor.`,
  });
  return frames;
}

// ─── Shor (period finding + classical post-processing) ──────────────────────

function shorFrames({ N, a }) {
  const frames = [];
  const steps = [];
  let stage = { 'Modulus N': N };
  const pushSteps = (extra = {}) =>
    frames.push(stepsFrame({ steps: steps.map((s) => ({ ...s })), stats: { ...stage }, ...extra }));
  const pushQ = (probs, extra = {}) => frames.push(qframe({ probs, stats: { ...stage }, ...extra }));

  const r = multiplicativeOrder(a, N);
  let Q = 1;
  while (Q < N * N) Q <<= 1;
  const nWork = Math.log2(Q);

  steps.push({ formula: `Goal: factor N = ${N}`, note: 'Shor (1994): factoring reduces to PERIOD FINDING — and quantum computers find periods fast.' });
  pushSteps({ activeStep: 0, codeLine: 0, message: `Factor N = ${N}. RSA encryption rests on this being hard for big N — Shor's algorithm is why quantum computers threaten it.` });

  steps.push({ formula: `Pick a = ${a};  gcd(${a}, ${N}) = ${gcdInt(a, N)}`, note: 'coprime ✓ — no lucky factor, so we need the period' });
  pushSteps({ activeStep: 1, codeLine: 0, message: `Pick a base a = ${a}, coprime to ${N}. Now consider the sequence f(x) = ${a}ˣ mod ${N} — it must eventually repeat with some period r.` });

  const seq = [1, a % N, (a * a) % N, modPow(a, 3, N)];
  steps.push({ formula: `f(x) = ${a}ˣ mod ${N}:  ${seq.join(', ')}, …`, note: 'find the period r of this sequence — this is the quantum part' });
  pushSteps({ activeStep: 2, codeLine: 1, message: `f(x) = ${a}ˣ mod ${N} goes ${seq.join(', ')}, … and repeats every r steps. Finding r classically means walking the sequence; quantum reads it out at once.` });

  stage = { 'Modulus N': N, 'Work register Q': Q };
  const uniform = new Array(Q).fill(1 / Q);
  pushQ(uniform, {
    codeLine: 2,
    message: `Quantum part. A work register of ${nWork} qubits holds ALL ${Q} values of x in superposition (flat spectrum — every x equally likely), and f(x) is computed for all of them at once.`,
  });

  const comb = new Array(Q).fill(0);
  const combCount = Math.ceil(Q / r);
  for (let x = 0; x < Q; x += r) comb[x] = 1 / combCount;
  pushQ(comb, {
    codeLine: 3,
    message: `Measure the OUTPUT register — suppose it reads 1. Only the x with ${a}ˣ mod ${N} = 1 survive: x = 0, ${r}, ${2 * r}, … A perfect comb with spacing r = the period. (Any outcome gives the same spacing, just shifted — and shifts don't change what comes next.)`,
  });

  const spectrum = combSpectrum(Q, r);
  const peaks = [];
  for (let i = 0; i < r; i++) peaks.push({ k: Math.round((i * Q) / r), label: i === 0 ? '0' : `${i}·Q/r` });
  pushQ(spectrum, {
    codeLine: 4,
    peaks,
    message: `The Quantum Fourier Transform turns the comb's rhythm into sharp peaks at multiples of Q/r = ${(Q / r).toFixed(1)}. The period is now written in frequency space — readable by a single measurement.`,
  });

  const k = Math.round(Q / r);
  stage = { 'Modulus N': N, 'Work register Q': Q, 'Measured k': k };
  pushQ(spectrum, {
    codeLine: 4,
    peaks,
    highlight: [k],
    message: `Measure the work register: suppose we read k = ${k} (the first non-zero peak — k = 0 would be unlucky, just rerun). Now classical math takes over.`,
  });

  const convs = convergents(k, Q, N);
  steps.push({ formula: `measured k = ${k},  so k/Q = ${k}/${Q} ≈ ${(k / Q).toFixed(4)}`, note: 'k/Q should be close to a fraction j/r — continued fractions find it' });
  pushSteps({ activeStep: steps.length - 1, codeLine: 5, message: `k/Q = ${k}/${Q}. The peak sits near j/r for some j — continued fractions recover that fraction in lowest terms.` });

  for (const c of convs) {
    const works = c.q > 1 && modPow(a, c.q, N) === 1;
    steps.push({
      formula: `convergent: ${c.p}/${c.q}${works ? `  →  ${a}^${c.q} mod ${N} = 1  ✓` : c.q === 1 ? '' : `  →  ${a}^${c.q} mod ${N} = ${modPow(a, c.q, N)} ✗`}`,
      note: works ? `the denominator ${c.q} is the period r!` : 'denominator too small — next convergent',
    });
    pushSteps({
      activeStep: steps.length - 1,
      codeLine: 5,
      message: works
        ? `Convergent ${c.p}/${c.q}: testing r = ${c.q} … ${a}^${c.q} mod ${N} = 1 ✓ — the period is r = ${c.q}.`
        : `Convergent ${c.p}/${c.q}: r = ${c.q} doesn't satisfy ${a}^r ≡ 1, keep going.`,
    });
    if (works) break;
  }

  stage = { 'Modulus N': N, 'Period r': r };
  const half = modPow(a, r / 2, N);
  const f1 = gcdInt(half - 1, N);
  const f2 = gcdInt(half + 1, N);
  steps.push({ formula: `r = ${r} is even, and ${a}^{r/2} = ${a}^${r / 2} mod ${N} = ${half}`, note: `so (${half}−1)(${half}+1) ≡ 0 mod ${N} — each bracket shares a factor with N` });
  pushSteps({ activeStep: steps.length - 1, codeLine: 6, message: `r = ${r} is even, so ${a}^{r/2} = ${half}. Then (${half}−1)·(${half}+1) ≡ ${a}^r − 1 ≡ 0 (mod ${N}) — the factors of N hide in those two brackets.` });

  steps.push({ formula: `gcd(${half}−1, ${N}) = ${f1},   gcd(${half}+1, ${N}) = ${f2}`, note: 'Euclid finishes the job' });
  pushSteps({
    activeStep: steps.length - 1,
    result: `${N} = ${f1} × ${f2}`,
    codeLine: 6,
    message: `gcd(${half - 1}, ${N}) = ${f1} and gcd(${half + 1}, ${N}) = ${f2} — so ${N} = ${f1} × ${f2}. Factored! The only quantum step was finding r; everything else was Euclid and fractions.`,
  });
  return frames;
}

// ─── Metadata ────────────────────────────────────────────────────────────────

export const quantumAlgorithms = [
  {
    id: 'bloch-sphere',
    name: 'Bloch Sphere Playground',
    category: 'quantum',
    difficulty: 'Beginner',
    tagline: 'One qubit, one sphere — every gate is a rotation',
    about:
      'A classical bit is 0 or 1. A qubit is a point on a sphere: the poles are |0⟩ and |1⟩, and everywhere in between is a superposition α|0⟩ + β|1⟩. Every quantum gate is just a rotation of this sphere — click gates and watch the state arrow swing, then measure to collapse it.',
    howItWorks: [
      'The arrow\'s height sets the odds: at the north pole P(0) = 100%, at the equator it\'s 50/50.',
      'X, Y, Z are half-turns around their axes (X is the quantum NOT — it swaps the poles).',
      'H is a half-turn around the X+Z diagonal: it takes |0⟩ to the equator — a perfect superposition.',
      'S and T are quarter- and eighth-turns around Z: they change the PHASE (longitude), invisible to a single measurement but vital for interference.',
      'Measure forces nature to choose: the arrow snaps to a pole with the corresponding probability.',
    ],
    insight: 'Try H then H: back to |0⟩ — gates are reversible rotations, and "randomness" only enters at measurement. Then try H, S, H: the phase you couldn\'t see becomes a probability you can. That invisible-then-visible trick is the engine of every quantum algorithm.',
    complexity: { best: 'O(1) per gate', average: 'O(1) per gate', worst: 'O(1) per gate', space: '1 qubit' },
    realWorld: [
      'The standard picture used to calibrate and debug real quantum hardware.',
      'Single-qubit rotations are the literal instruction set of IBM, Google and IonQ machines.',
    ],
    pseudocode: [
      '|ψ⟩ = α|0⟩ + β|1⟩ — a point on the sphere',
      'X / Y / Z — half-turns around the axes',
      'H — half-turn around the X+Z diagonal',
      'S, S† — quarter-turns around Z (phase)',
      'T, T† — eighth-turns around Z (phase)',
      'measure → |0⟩ with P = |α|², else |1⟩',
    ],
    generate: blochFrames,
  },
  {
    id: 'deutsch',
    name: 'Deutsch\'s Algorithm',
    category: 'quantum',
    difficulty: 'Intermediate',
    tagline: 'Ask one question, learn about two answers',
    about:
      'The "hello world" of quantum algorithms (1985). Given a one-bit function f, decide whether it is constant (f(0) = f(1)) or balanced (f(0) ≠ f(1)). Classically you must evaluate f twice. Deutsch\'s circuit does it with a single evaluation — by querying in superposition and letting the answers interfere.',
    howItWorks: [
      'Prepare x = |0⟩ and a helper qubit in |1⟩, then H both: x now represents 0 and 1 simultaneously.',
      'The helper, in state |−⟩, converts the oracle\'s answer into a SIGN on each branch (phase kickback).',
      'One oracle call writes f(0) and f(1) into the signs of the two branches.',
      'A final H interferes the branches: equal signs reinforce at x = 0; opposite signs cancel there and land on x = 1.',
      'Measure x: 0 means constant, 1 means balanced — with certainty.',
    ],
    insight: 'No measurement could read f(0) and f(1) from one call — that\'s still impossible. The trick is asking a GLOBAL question (are they equal?) and letting interference compute the comparison before you look.',
    complexity: { best: '1 query', average: '1 query', worst: '1 query', space: '2 qubits' },
    realWorld: [
      'The minimal demonstration of quantum advantage — first circuit run on most new hardware.',
      'Phase kickback, introduced here, powers Grover, Shor and quantum phase estimation.',
    ],
    pseudocode: [
      'prepare x = |0⟩ and helper y = |1⟩',
      'H on both — query in superposition',
      'oracle: y ← y ⊕ f(x)   (answer lands in the sign)',
      'H on x — interfere the two answers',
      'measure x: 0 → constant, 1 → balanced',
    ],
    generate: deutschFrames,
  },
  {
    id: 'deutsch-jozsa',
    name: 'Deutsch–Jozsa',
    category: 'quantum',
    difficulty: 'Intermediate',
    tagline: 'One query beats 2ⁿ⁻¹+1 — the first exponential gap',
    about:
      'The n-bit generalisation of Deutsch\'s problem: f maps n-bit strings to one bit and is promised to be constant or perfectly balanced. A classical algorithm may need 2ⁿ⁻¹+1 evaluations in the worst case. Deutsch–Jozsa (1992) always needs exactly one — the first provable exponential quantum speed-up.',
    howItWorks: [
      'H on n zero-qubits creates an equal superposition of all 2ⁿ inputs.',
      'One oracle call flips the sign of every input where f(x) = 1.',
      'A second round of H makes all paths to |00…0⟩ interfere: their contributions are the SUM of all the signs.',
      'Constant f → all signs equal → they add up: |00…0⟩ has probability 1. Balanced f → half and half → they cancel exactly: probability 0.',
      'Measure: all zeros ⇒ constant, anything else ⇒ balanced.',
    ],
    insight: 'Watch the amplitude at |00…0⟩ in the final step — it is literally the average of all 2ⁿ signs. Interference computes that average in one shot; a classical computer would have to look at the entries one by one.',
    complexity: { best: '1 query', average: '1 query', worst: '1 query', space: 'n qubits' },
    realWorld: [
      'The textbook benchmark circuit for early quantum processors.',
      'Its promise-problem structure shaped Bernstein–Vazirani, Simon and ultimately Shor.',
    ],
    pseudocode: [
      'prepare n qubits in |00…0⟩',
      'H on every qubit → all 2ⁿ inputs at once',
      'oracle flips the sign where f(x) = 1   (one query)',
      'H on every qubit — interfere all the answers',
      'measure: all zeros → constant, else → balanced',
    ],
    generate: deutschJozsaFrames,
  },
  {
    id: 'grover',
    name: 'Grover\'s Search',
    category: 'quantum',
    difficulty: 'Advanced',
    tagline: 'Find the needle in √N looks instead of N',
    about:
      'Searching an unstructured list of N items classically takes ~N/2 looks on average — there is nothing better. Grover (1996) finds the marked item in about (π/4)·√N oracle calls by repeatedly amplifying its amplitude: a million items need ~800 queries instead of half a million.',
    howItWorks: [
      'Start with all N basis states in equal superposition — every item equally likely.',
      'Oracle: flip the SIGN of the marked item\'s amplitude (probabilities don\'t change yet).',
      'Diffusion: reflect every amplitude about the mean — the negative bar lies far below the mean, so the reflection makes it large.',
      'Each oracle+diffusion round rotates the state a fixed angle toward the marked item.',
      'After ⌊π/4·√N⌋ rounds, measure: the marked item appears with near-certainty.',
    ],
    insight: 'The dashed mean line is the whole secret: flipping one sign barely moves the mean, so "reflect about the mean" hurts everyone a little and helps the flipped one enormously. And the rotation doesn\'t stop — run too many rounds and the probability shrinks again. Quantum algorithms must know when to stop.',
    complexity: { best: 'O(√N) queries', average: 'O(√N) queries', worst: 'O(√N) queries', space: 'n qubits' },
    realWorld: [
      'Generic speed-up for brute-force search: SAT solving, constraint problems, collision finding.',
      'Why symmetric crypto (AES) doubles key lengths to stay quantum-safe — Grover halves the effective bits.',
    ],
    pseudocode: [
      'H on every qubit → uniform superposition',
      'repeat ⌊π/4·√N⌋ times:',
      '  oracle: flip the sign of the marked item',
      '  diffusion: reflect every amplitude about the mean',
      'measure — the marked item, with high probability',
    ],
    generate: groverFrames,
  },
  {
    id: 'simon',
    name: 'Simon\'s Algorithm',
    category: 'quantum',
    difficulty: 'Advanced',
    tagline: 'Uncover a hidden XOR mask with a handful of runs',
    about:
      'A black-box f promises f(x) = f(x⊕s) for a secret string s — inputs come in hidden pairs that differ by exactly s. Classically, finding s needs exponentially many queries (you are hunting for a collision). Simon\'s algorithm (1994) collects one linear CLUE about s per run, and n−1 clues pin it down.',
    howItWorks: [
      'Superpose all inputs and compute f once — inputs sharing an output form pairs (same colour) that differ by s.',
      'Measure the OUTPUT: the input register collapses to one pair, (|x₀⟩ + |x₀⊕s⟩)/√2.',
      'Apply H: interference erases every y with y·s = 1. Only y satisfying y·s ≡ 0 (mod 2) can be measured.',
      'Each run therefore yields one linear equation about s.',
      'After n−1 independent equations, solve the system over GF(2) — the unique non-zero solution is s.',
    ],
    insight: 'You never learn x₀ — the pair is destroyed by the H. What survives is a fact about the DIFFERENCE of the pair, which is always s. Shor read this paper and realised periods could be found the same way; Simon is the direct ancestor of Shor.',
    complexity: { best: 'O(n) queries', average: 'O(n) queries', worst: 'O(n) queries', space: '2n qubits' },
    realWorld: [
      'The first exponential oracle separation between quantum and classical computing.',
      'Breaks certain symmetric-crypto constructions (Even–Mansour, some MACs) on a quantum computer.',
    ],
    pseudocode: [
      'promise: f(x) = f(x ⊕ s) for a secret s ≠ 0',
      'repeat until n−1 independent equations:',
      '  superpose all x and compute f(x)',
      '  measure f → state collapses to a pair {x₀, x₀⊕s}',
      '  H on inputs; measure y → y·s ≡ 0 (mod 2)',
      'solve the GF(2) system → s',
    ],
    generate: simonFrames,
  },
  {
    id: 'shor-period',
    name: 'Shor\'s Algorithm (Period Finding)',
    category: 'quantum',
    difficulty: 'Advanced',
    tagline: 'Factor numbers by hearing the rhythm of aˣ mod N',
    about:
      'The algorithm that made governments fund quantum computers. Factoring N reduces to finding the period r of f(x) = aˣ mod N — and a quantum Fourier transform reads that period out of a superposition almost instantly. This visualization runs the genuine pipeline on small N: superposition → collapse to a comb → QFT peaks → continued fractions → factors.',
    howItWorks: [
      'Classical setup: pick a coprime to N; the sequence aˣ mod N repeats with some hidden period r.',
      'A quantum register holds ALL x at once; computing f entangles each x with its value aˣ mod N.',
      'Measuring the output collapses the register to a perfect comb: x₀, x₀+r, x₀+2r, … — spacing r.',
      'The QFT converts that rhythm into sharp spectral peaks at multiples of Q/r; one measurement reads a peak k.',
      'Continued fractions on k/Q recover r, and gcd(a^{r/2} ± 1, N) hands over the factors.',
    ],
    insight: 'The comb\'s starting offset x₀ is random, but the QFT only hears the SPACING — like recognising a song\'s tempo no matter when you start listening. That shift-blindness is why the algorithm works every time the period is even and friendly. RSA\'s security is exactly the hardness of this problem — for classical computers.',
    complexity: { best: 'O((log N)³)', average: 'O((log N)³)', worst: 'O((log N)³)', space: 'O(log N) qubits' },
    realWorld: [
      'Breaks RSA and Diffie–Hellman once large fault-tolerant quantum computers exist.',
      'The reason post-quantum cryptography (lattice schemes, NIST 2024 standards) is being deployed today.',
    ],
    pseudocode: [
      'pick a coprime to N',
      'quantum: find the period r of f(x) = aˣ mod N',
      '  superpose all x and compute f(x)',
      '  measure f → a comb with spacing r',
      '  QFT → peaks at multiples of Q/r; measure k',
      'continued fractions on k/Q → r',
      'factors: gcd(a^{r/2} − 1, N) and gcd(a^{r/2} + 1, N)',
    ],
    generate: shorFrames,
  },
];
