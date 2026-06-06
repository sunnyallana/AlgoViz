// ─── Quantum math core ───────────────────────────────────────────────────────
// Exact, dependency-free helpers. Single-qubit states are complex pairs
// { ar, ai, br, bi } (α|0⟩ + β|1⟩); multi-qubit algorithm states in this app
// stay REAL (H + phase oracles + diffusion preserve realness), so those use
// plain number arrays.

// ── Single qubit (Bloch sphere) ──────────────────────────────────────────────

export const KET0 = { ar: 1, ai: 0, br: 0, bi: 0 };

/** Named gates as rotations: axis (unit vector) + angle. */
export const BLOCH_GATES = {
  X: { axis: [1, 0, 0], angle: Math.PI, label: 'X' },
  Y: { axis: [0, 1, 0], angle: Math.PI, label: 'Y' },
  Z: { axis: [0, 0, 1], angle: Math.PI, label: 'Z' },
  H: { axis: [1 / Math.SQRT2, 0, 1 / Math.SQRT2], angle: Math.PI, label: 'H' },
  S: { axis: [0, 0, 1], angle: Math.PI / 2, label: 'S' },
  Sdg: { axis: [0, 0, 1], angle: -Math.PI / 2, label: 'S†' },
  T: { axis: [0, 0, 1], angle: Math.PI / 4, label: 'T' },
  Tdg: { axis: [0, 0, 1], angle: -Math.PI / 4, label: 'T†' },
};

/** Apply Rn(θ) = cos(θ/2)·I − i·sin(θ/2)·(n̂·σ) to a single-qubit state. */
export function rotate(state, axis, angle) {
  const [nx, ny, nz] = axis;
  const c = Math.cos(angle / 2);
  const s = Math.sin(angle / 2);
  // M = [[c − i·s·nz,  −i·s·nx − s·ny], [−i·s·nx + s·ny,  c + i·s·nz]]
  const m00r = c, m00i = -s * nz;
  const m01r = -s * ny, m01i = -s * nx;
  const m10r = s * ny, m10i = -s * nx;
  const m11r = c, m11i = s * nz;
  const { ar, ai, br, bi } = state;
  return {
    ar: m00r * ar - m00i * ai + m01r * br - m01i * bi,
    ai: m00r * ai + m00i * ar + m01r * bi + m01i * br,
    br: m10r * ar - m10i * ai + m11r * br - m11i * bi,
    bi: m10r * ai + m10i * ar + m11r * bi + m11i * br,
  };
}

/** Bloch coordinates: x = 2·Re(ᾱβ), y = 2·Im(ᾱβ), z = |α|² − |β|². */
export function blochVector({ ar, ai, br, bi }) {
  return {
    x: 2 * (ar * br + ai * bi),
    y: 2 * (ar * bi - ai * br),
    z: ar * ar + ai * ai - (br * br + bi * bi),
  };
}

export const prob0 = ({ ar, ai }) => ar * ar + ai * ai;

/** Rotate out the global phase (make α real ≥ 0) for friendly display. */
export function displayAmplitudes(state) {
  const { ar, ai, br, bi } = state;
  const magA = Math.hypot(ar, ai);
  let phase = 0;
  if (magA > 1e-9) phase = Math.atan2(ai, ar);
  else phase = Math.atan2(bi, br);
  const cp = Math.cos(-phase);
  const sp = Math.sin(-phase);
  return {
    ar: ar * cp - ai * sp,
    ai: ar * sp + ai * cp,
    br: br * cp - bi * sp,
    bi: br * sp + bi * cp,
  };
}

export function fmtComplex(re, im) {
  const r = Math.abs(re) < 0.005 ? 0 : re;
  const i = Math.abs(im) < 0.005 ? 0 : im;
  if (i === 0) return r.toFixed(2);
  if (r === 0) return `${i.toFixed(2)}i`;
  return `${r.toFixed(2)} ${i < 0 ? '−' : '+'} ${Math.abs(i).toFixed(2)}i`;
}

// ── Real n-qubit vectors (Deutsch, Deutsch–Jozsa, Grover, Simon) ─────────────

/** |0…0⟩ as a real amplitude vector of dimension 2^n. */
export function basisState(n) {
  const v = new Array(1 << n).fill(0);
  v[0] = 1;
  return v;
}

/** Apply H to one qubit (given by its bit position) of a real state. */
export function hadamardBit(v, bit) {
  const mask = 1 << bit;
  const next = [...v];
  for (let i = 0; i < v.length; i++) {
    if (i & mask) continue;
    const j = i | mask;
    next[i] = (v[i] + v[j]) / Math.SQRT2;
    next[j] = (v[i] - v[j]) / Math.SQRT2;
  }
  return next;
}

/** Apply H to every qubit of a real state (real Walsh–Hadamard transform). */
export function hadamardAll(v) {
  let out = v;
  for (let bit = 1; bit < v.length; bit <<= 1) {
    out = hadamardBit(out, Math.log2(bit));
  }
  return out;
}

/** Phase oracle: flip the sign of every basis state in `flips` (a Set). */
export function phaseOracle(v, flips) {
  return v.map((a, i) => (flips.has(i) ? -a : a));
}

/** Grover diffusion: reflect every amplitude about the mean. */
export function diffusion(v) {
  const mean = v.reduce((s, a) => s + a, 0) / v.length;
  return { out: v.map((a) => 2 * mean - a), mean };
}

export const binLabel = (i, n) => `|${i.toString(2).padStart(n, '0')}⟩`;
export const dot2 = (a, b) => {
  // parity of bitwise AND — the GF(2) inner product y·s
  let x = a & b;
  let p = 0;
  while (x) {
    p ^= x & 1;
    x >>= 1;
  }
  return p;
};

// ── Number theory (Shor) ─────────────────────────────────────────────────────

export const gcdInt = (a, b) => (b === 0 ? a : gcdInt(b, a % b));

export function modPow(base, exp, mod) {
  let r = 1;
  let b = base % mod;
  let e = exp;
  while (e > 0) {
    if (e & 1) r = (r * b) % mod;
    b = (b * b) % mod;
    e >>= 1;
  }
  return r;
}

/** Multiplicative order of a mod N (the period r of a^x mod N). */
export function multiplicativeOrder(a, N) {
  let v = a % N;
  let r = 1;
  while (v !== 1) {
    v = (v * a) % N;
    r++;
    if (r > N) return -1;
  }
  return r;
}

/** Bases a for which Shor's classical post-processing succeeds on N. */
export function validShorBases(N) {
  const out = [];
  for (let a = 2; a < N; a++) {
    if (gcdInt(a, N) !== 1) continue;
    const r = multiplicativeOrder(a, N);
    if (r % 2 !== 0) continue;
    if (modPow(a, r / 2, N) === N - 1) continue; // a^(r/2) ≡ −1: gives trivial factors
    out.push(a);
  }
  return out;
}

/**
 * Probability spectrum of the QFT of a comb |x₀⟩,|x₀+r⟩,… in a register of
 * size Q. |A(k)|² is independent of x₀, so we sum phases from x = 0, r, 2r…
 */
export function combSpectrum(Q, r) {
  const count = Math.ceil(Q / r);
  const probs = new Array(Q);
  for (let k = 0; k < Q; k++) {
    let re = 0;
    let im = 0;
    for (let j = 0; j < count; j++) {
      const ang = (2 * Math.PI * k * (j * r)) / Q;
      re += Math.cos(ang);
      im += Math.sin(ang);
    }
    // |A(k)|² with the 1/√count (comb) and 1/√Q (QFT) prefactors
    probs[k] = (re * re + im * im) / (count * Q);
  }
  // Parseval says Σ = 1 already; renormalise to kill float drift.
  const total = probs.reduce((s, p) => s + p, 0);
  return probs.map((p) => p / total);
}

/** Continued-fraction convergents of k/Q; returns denominators ≤ maxDen. */
export function convergents(k, Q, maxDen) {
  const steps = [];
  const out = [];
  let num = k;
  let den = Q;
  const as = [];
  while (den !== 0 && as.length < 16) {
    const a = Math.floor(num / den);
    as.push(a);
    [num, den] = [den, num - a * den];
  }
  let pPrev = 1, p = as[0];
  let qPrev = 0, q = 1;
  out.push({ p, q });
  steps.push({ a: as[0], p, q });
  for (let i = 1; i < as.length; i++) {
    const pn = as[i] * p + pPrev;
    const qn = as[i] * q + qPrev;
    if (qn > maxDen) break;
    [pPrev, p, qPrev, q] = [p, pn, q, qn];
    out.push({ p, q });
    steps.push({ a: as[i], p, q });
  }
  return out;
}
