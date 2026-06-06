// ─── Math algorithms (big-number multiplication) ─────────────────────────────
// Input: { a, b } — digit strings. All arithmetic uses BigInt for exactness.
//
// Long multiplication frames (kind: 'long'):
//   partials   – precomputed rows [{ digit, place, raw, shifted }]
//   revealed   – how many partial rows are visible
//   activeRow  – row currently being computed
//   sumCount   – how many rows have been folded into the running sum
//   sumSoFar   – the running sum (string)
//   total      – final product once complete
//
// Karatsuba frames (kind: 'karatsuba'):
//   calls      – snapshot of every recursive call card
//   activeId   – call currently executing

const PLACE_NAMES = ['units', 'tens', 'hundreds', 'thousands', 'ten-thousands', 'hundred-thousands', 'millions'];
const placeName = (p) => PLACE_NAMES[p] ?? `10^${p}`;

// ─── Long (schoolbook) multiplication ────────────────────────────────────────

function longMultiplicationFrames({ a, b }) {
  const x = BigInt(a);
  const frames = [];
  const digitsB = b.split('').reverse(); // index = place value
  const partials = digitsB.map((ch, place) => {
    const raw = x * BigInt(ch);
    return {
      digit: ch,
      place,
      raw: raw.toString(),
      shifted: (raw * 10n ** BigInt(place)).toString(),
    };
  });

  const push = (extra) =>
    frames.push({
      kind: 'long',
      a,
      b,
      partials,
      revealed: 0,
      activeRow: null,
      activeDigitPlace: null,
      sumCount: 0,
      sumSoFar: null,
      total: null,
      message: '',
      codeLine: null,
      stats: {},
      ...extra,
    });

  push({
    codeLine: 0,
    stats: { 'Partial rows': 0, Additions: 0 },
    message: `Multiply ${a} × ${b} the schoolbook way: one row per digit of ${b}, then add the rows. Just like on paper — but watch how the work grows with every digit.`,
  });

  partials.forEach((row, i) => {
    push({
      revealed: i + 1,
      activeRow: i,
      activeDigitPlace: row.place,
      codeLine: row.place === 0 ? 2 : 3,
      stats: { 'Partial rows': i + 1, Additions: 0 },
      message:
        row.place === 0
          ? `The ${placeName(0)} digit of ${b} is ${row.digit}:  ${row.digit} × ${a} = ${row.raw}. No shift for the units row.`
          : `The ${placeName(row.place)} digit is ${row.digit}:  ${row.digit} × ${a} = ${row.raw}, then shift ${row.place} place${row.place === 1 ? '' : 's'} left → ${row.shifted}.`,
    });
  });

  let running = BigInt(partials[0].shifted);
  push({
    revealed: partials.length,
    sumCount: 1,
    sumSoFar: running.toString(),
    codeLine: 5,
    stats: { 'Partial rows': partials.length, Additions: 0 },
    message:
      partials.length === 1
        ? 'Only one row — nothing to add.'
        : `Now add the rows together, starting with ${running}.`,
  });
  for (let i = 1; i < partials.length; i++) {
    const prev = running;
    running += BigInt(partials[i].shifted);
    push({
      revealed: partials.length,
      activeRow: i,
      sumCount: i + 1,
      sumSoFar: running.toString(),
      codeLine: 5,
      stats: { 'Partial rows': partials.length, Additions: i },
      message: `${prev} + ${partials[i].shifted} = ${running}.`,
    });
  }
  push({
    revealed: partials.length,
    sumCount: partials.length,
    sumSoFar: running.toString(),
    total: running.toString(),
    codeLine: 6,
    stats: { 'Partial rows': partials.length, Additions: Math.max(0, partials.length - 1) },
    message: `Answer: ${a} × ${b} = ${running}. Every digit of ${b} needed a full pass over ${a} — that's why this is O(n²) in the number of digits.`,
  });
  return frames;
}

// ─── Karatsuba multiplication ────────────────────────────────────────────────

function karatsubaFrames({ a, b }) {
  const frames = [];
  const calls = [];
  let nextId = 0;
  let recursiveCalls = 0;
  let directMults = 0;
  const stats = () => ({ 'Recursive calls': recursiveCalls, 'Direct multiplications': directMults });

  const push = (activeId, message, codeLine) =>
    frames.push({
      kind: 'karatsuba',
      a,
      b,
      calls: calls.map((c) => ({ ...c })),
      activeId,
      message,
      codeLine,
      stats: stats(),
    });

  push(
    null,
    'Karatsuba\'s trick: multiplying two half-size numbers three times is cheaper than four times — and recursion compounds the savings.',
    0
  );

  const kara = (x, y, depth) => {
    const id = nextId++;
    recursiveCalls++;
    const call = { id, depth, x: x.toString(), y: y.toString(), note: '', result: null, status: 'active' };
    calls.push(call);
    push(id, `Call karatsuba(${x}, ${y})${depth > 0 ? ` at depth ${depth}` : ''}.`, 0);

    if (x < 10n || y < 10n) {
      const r = x * y;
      directMults++;
      call.result = r.toString();
      call.status = 'done';
      call.note = 'base case — multiply directly';
      push(id, `Base case (a factor is a single digit): ${x} × ${y} = ${r}.`, 1);
      return r;
    }

    const m = Math.max(x.toString().length, y.toString().length) >> 1;
    const p = 10n ** BigInt(m);
    const A = x / p;
    const B = x % p;
    const C = y / p;
    const D = y % p;
    call.note = `${x} = ${A}·10^${m} + ${B}    ${y} = ${C}·10^${m} + ${D}`;
    push(id, `Split both numbers ${m} digit${m === 1 ? '' : 's'} from the right: ${x} → (${A} | ${B}), ${y} → (${C} | ${D}).`, 3);

    call.status = 'waiting';
    const z2 = kara(A, C, depth + 1); // high parts
    const z0 = kara(B, D, depth + 1); // low parts
    const z1 = kara(A + B, C + D, depth + 1) - z2 - z0; // the clever one
    call.status = 'active';
    push(
      id,
      `Back in (${x} × ${y}):  z1 = (${A}+${B})(${C}+${D}) − z2 − z0 = ${z1}. One multiplication replaced two!`,
      6
    );

    const r = z2 * p * p + z1 * p + z0;
    call.result = r.toString();
    call.status = 'done';
    push(id, `Combine:  ${z2}·10^${2 * m} + ${z1}·10^${m} + ${z0} = ${r}.`, 7);
    return r;
  };

  const result = kara(BigInt(a), BigInt(b), 0);
  push(0, `Finished: ${a} × ${b} = ${result}, using only ${directMults} single-digit multiplications across ${recursiveCalls} calls.`, 7);
  return frames;
}

// ─── Euclidean GCD ───────────────────────────────────────────────────────────
// 'steps' frames: a growing list of card rows, the active one highlighted.
//   steps: [{ formula, note }], activeStep, result

const stepsFrame = (extra) => ({
  kind: 'steps',
  steps: [],
  activeStep: null,
  result: null,
  message: '',
  codeLine: null,
  stats: {},
  ...extra,
});

function gcdFrames({ a, b }) {
  const frames = [];
  let x = BigInt(a);
  let y = BigInt(b);
  if (x < y) [x, y] = [y, x];
  const steps = [];
  let divisions = 0;
  const stats = () => ({ 'Division steps': divisions });
  const snap = (extra) => frames.push(stepsFrame({ steps: steps.map((s) => ({ ...s })), stats: stats(), ...extra }));

  snap({
    codeLine: 0,
    message: `Find gcd(${x}, ${y}) — the largest number dividing both. Euclid's 2,300-year-old insight: gcd(a, b) = gcd(b, a mod b). Shrink the problem until the remainder is 0.`,
  });

  while (y > 0n) {
    const q = x / y;
    const r = x % y;
    divisions++;
    steps.push({
      formula: `${x} = ${q} × ${y} + ${r}`,
      note: `gcd(${x}, ${y}) = gcd(${y}, ${r})`,
    });
    snap({
      activeStep: steps.length - 1,
      codeLine: 2,
      message: `Divide: ${x} = ${q} × ${y} with remainder ${r}. The pair shrinks to (${y}, ${r}).${r === 0n ? ' Remainder 0 — we are done!' : ''}`,
    });
    x = y;
    y = r;
  }

  snap({
    activeStep: null,
    result: `gcd(${a}, ${b}) = ${x}`,
    codeLine: 4,
    message: `The last non-zero remainder is the answer: gcd(${a}, ${b}) = ${x}, found in just ${divisions} division${divisions === 1 ? '' : 's'}.`,
  });
  return frames;
}

// ─── Fast (binary) exponentiation ────────────────────────────────────────────

function fastPowFrames({ a, b }) {
  const frames = [];
  const x = BigInt(a);
  const e = Number(b);
  const bits = e.toString(2);
  const steps = [];
  let mults = 0;
  const stats = () => ({ Multiplications: mults });
  const snap = (extra) => frames.push(stepsFrame({ steps: steps.map((s) => ({ ...s })), stats: stats(), ...extra }));

  snap({
    codeLine: 0,
    message: `Compute ${x}^${e}. Naively that is ${Math.max(e - 1, 0)} multiplications — but ${e} in binary is ${bits}₂, and squaring lets us process one bit per step.`,
  });

  if (e === 0) {
    snap({ result: `${x}^0 = 1`, codeLine: 5, message: 'Anything to the power 0 is 1 — no work at all.' });
    return frames;
  }

  let result = 1n;
  let base = x;
  for (let i = 0; i < bits.length; i++) {
    const bit = (e >> i) & 1;
    if (bit === 1) {
      result *= base;
      mults++;
      steps.push({
        formula: `bit ${i} of ${bits}₂ is 1  →  result × base = ${result}`,
        note: `result picks up x^${2 ** i}`,
      });
      snap({
        activeStep: steps.length - 1,
        codeLine: 3,
        message: `Bit ${i} (worth 2^${i} = ${2 ** i}) is ON in ${e} — multiply it in: result becomes ${result}.`,
      });
    } else {
      steps.push({ formula: `bit ${i} of ${bits}₂ is 0  →  skip`, note: 'nothing multiplied in' });
      snap({
        activeStep: steps.length - 1,
        codeLine: 3,
        message: `Bit ${i} is OFF in ${e} — skip the multiply.`,
      });
    }
    if (i < bits.length - 1) {
      base *= base;
      mults++;
      steps.push({ formula: `square:  base = x^${2 ** (i + 1)} = ${base}`, note: 'one squaring per bit' });
      snap({
        activeStep: steps.length - 1,
        codeLine: 4,
        message: `Square the base — it now holds x^${2 ** (i + 1)}, ready for the next bit.`,
      });
    }
  }

  snap({
    result: `${x}^${e} = ${result}`,
    codeLine: 5,
    message: `${x}^${e} = ${result}, using only ${mults} multiplications instead of ${Math.max(e - 1, 0)}. Doubling the exponent costs just one more squaring.`,
  });
  return frames;
}

// ─── Sieve of Eratosthenes ───────────────────────────────────────────────────
// 'sieve' frames: status[i] ∈ 0 unknown · 1 prime · 2 composite
//   current: the prime whose multiples are being crossed out
//   marking: the multiple being crossed out right now

function sieveFrames({ limit }) {
  const N = limit;
  const frames = [];
  const status = new Array(N + 1).fill(0);
  let crossouts = 0;
  let primes = 0;
  const stats = () => ({ 'Cross-outs': crossouts, 'Primes found': primes });
  const snap = (extra) =>
    frames.push({
      kind: 'sieve',
      limit: N,
      status: [...status],
      current: null,
      marking: null,
      message: '',
      codeLine: null,
      stats: stats(),
      ...extra,
    });

  snap({
    codeLine: 0,
    message: `Find every prime up to ${N}, the way Eratosthenes did ~2,200 years ago: don't test numbers one by one — let the primes cross out their own multiples.`,
  });

  for (let p = 2; p * p <= N; p++) {
    if (status[p] === 2) {
      snap({
        current: p,
        codeLine: 1,
        message: `${p} is already crossed out (a multiple of a smaller prime) — skip it.`,
      });
      continue;
    }
    status[p] = 1;
    primes++;
    snap({
      current: p,
      codeLine: 2,
      message: `${p} was never crossed out — it is PRIME. Now cross out its multiples, starting at ${p}² = ${p * p} (smaller multiples were already handled by smaller primes).`,
    });
    for (let m = p * p; m <= N; m += p) {
      if (status[m] === 2) continue;
      status[m] = 2;
      crossouts++;
      snap({
        current: p,
        marking: m,
        codeLine: 3,
        message: `${m} = ${p} × ${m / p} — crossed out.`,
      });
    }
  }

  const newPrimes = [];
  for (let i = 2; i <= N; i++) {
    if (status[i] === 0) {
      status[i] = 1;
      primes++;
      newPrimes.push(i);
    }
  }
  snap({
    codeLine: 4,
    message: `Every number still unmarked has no divisor ≤ √${N}, so it must be prime: ${newPrimes.join(', ')}.`,
  });
  snap({
    message: `Done — ${primes} primes up to ${N}, found with only ${crossouts} cross-outs. No division, no primality tests: the composites eliminated themselves.`,
  });
  return frames;
}

// ─── Metadata ────────────────────────────────────────────────────────────────

export const mathAlgorithms = [
  {
    id: 'long-multiplication',
    name: 'Long Multiplication',
    category: 'maths',
    difficulty: 'Beginner',
    tagline: 'The schoolbook method, digit by digit',
    about:
      'The multiplication you learned at school, viewed as an algorithm. Each digit of the bottom number produces one shifted partial product of the top number; adding the rows gives the answer. Computers used exactly this method for big numbers — until faster tricks were found.',
    howItWorks: [
      'Take the digits of the bottom number right to left: units, tens, hundreds…',
      'Multiply the entire top number by that single digit.',
      'Shift the row left by the digit\'s place value (that\'s the trailing zeros).',
      'Add all the rows to get the product.',
    ],
    insight: 'With n-digit numbers you do n × n single-digit multiplications — doubling the digits quadruples the work. That O(n²) wall is exactly what Karatsuba broke in 1960.',
    complexity: { best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)', space: 'O(n)' },
    pseudocode: [
      'write A on top, B below',
      'for each digit of B, right → left',
      '  multiply A by that digit',
      '  shift the row left by the digit\'s place',
      '  write the row down',
      'add all the rows',
      'the sum is A × B',
    ],
    realWorld: [
      'How CPU hardware multiplies machine-word numbers.',
      'Big-integer libraries still use it below the Karatsuba cutoff (~20 digits).',
    ],
    generate: longMultiplicationFrames,
    inputKind: 'pair',
    verb: 'Multiply',
    symbol: '×',
    maxDigits: 6,
  },
  {
    id: 'karatsuba',
    name: 'Karatsuba Multiplication',
    category: 'maths',
    difficulty: 'Advanced',
    tagline: 'Multiply faster with three multiplications instead of four',
    about:
      'In 1960, 23-year-old Anatoly Karatsuba disproved his professor Kolmogorov\'s conjecture that O(n²) multiplication was optimal. Splitting each number in half naively needs four half-size multiplications — Karatsuba found an algebraic identity that does it with three, recursively.',
    howItWorks: [
      'Split each number into a high and low half: x = a·10ᵐ + b, y = c·10ᵐ + d.',
      'Recursively compute z2 = a·c and z0 = b·d.',
      'The middle term needs a·d + b·c — but (a+b)(c+d) − z2 − z0 gives it with ONE multiplication.',
      'Combine: x·y = z2·10²ᵐ + z1·10ᵐ + z0.',
    ],
    insight: 'Three instead of four sounds small, but recursion amplifies it: the exponent drops from 2 to log₂3 ≈ 1.585. For 10,000-digit numbers, that\'s roughly 30× less work — this idea powers real cryptography libraries.',
    complexity: { best: 'O(n^1.585)', average: 'O(n^1.585)', worst: 'O(n^1.585)', space: 'O(n)' },
    pseudocode: [
      'karatsuba(x, y):',
      '  if x or y is a single digit → multiply directly',
      '  m ← half the digits',
      '  split: x = a·10ᵐ + b,   y = c·10ᵐ + d',
      '  z2 ← karatsuba(a, c)',
      '  z0 ← karatsuba(b, d)',
      '  z1 ← karatsuba(a+b, c+d) − z2 − z0',
      '  answer ← z2·10²ᵐ + z1·10ᵐ + z0',
    ],
    realWorld: [
      'Python\'s built-in big integers switch to Karatsuba for large numbers.',
      'GMP and cryptography libraries (RSA key math) rely on it and its descendants.',
    ],
    generate: karatsubaFrames,
    inputKind: 'pair',
    verb: 'Multiply',
    symbol: '×',
    maxDigits: 8,
  },
  {
    id: 'euclid-gcd',
    name: 'Euclidean GCD',
    category: 'maths',
    difficulty: 'Beginner',
    tagline: 'The oldest algorithm still in daily use (~300 BC)',
    about:
      'The greatest common divisor of two numbers is the largest number dividing both — and Euclid\'s Elements described how to find it around 300 BC, making this arguably the oldest algorithm in the world. The trick: any number dividing both a and b also divides a mod b, so the problem keeps shrinking.',
    howItWorks: [
      'Divide the bigger number by the smaller and keep only the remainder.',
      'Now find the gcd of the smaller number and that remainder — the same problem, but smaller.',
      'Repeat until the remainder is 0.',
      'The last non-zero remainder is the gcd.',
    ],
    insight: 'The remainder at least halves every two steps, so even for million-digit numbers the answer arrives in a few thousand steps — this exact loop runs inside RSA cryptography every time you open an https website.',
    complexity: { best: 'O(1)', average: 'O(log min(a,b))', worst: 'O(log min(a,b))', space: 'O(1)' },
    pseudocode: [
      'gcd(a, b):',
      '  while b ≠ 0',
      '    r ← a mod b      (the remainder)',
      '    a ← b,  b ← r',
      '  return a',
    ],
    realWorld: [
      'Reducing fractions to lowest terms.',
      'RSA key generation (modular inverses via the extended version).',
      'Computer algebra, cryptography and hash-table sizing — it is everywhere.',
    ],
    generate: gcdFrames,
    inputKind: 'pair',
    verb: 'Compute GCD',
    symbol: ',',
    maxDigits: 9,
  },
  {
    id: 'fast-power',
    name: 'Fast Exponentiation',
    category: 'maths',
    difficulty: 'Intermediate',
    tagline: 'xⁿ in log n steps by squaring',
    about:
      'Computing x¹³ naively takes 12 multiplications. But 13 = 1101 in binary — and that spells out a recipe: square your way through x¹, x², x⁴, x⁸ and multiply together exactly the powers where the binary digit is 1. This is "exponentiation by squaring".',
    howItWorks: [
      'Write the exponent in binary.',
      'Walk its bits from least to most significant, squaring the base each step (x¹ → x² → x⁴ → x⁸ …).',
      'Whenever the current bit is 1, multiply the running result by the current base power.',
      'After the last bit, the result is xⁿ.',
    ],
    insight: 'A 1,000,000 exponent needs only ~40 multiplications instead of a million. Combined with "mod m" at every step, this exact algorithm is the engine of RSA and Diffie–Hellman — the math behind the padlock in your browser.',
    complexity: { best: 'O(log n)', average: 'O(log n)', worst: 'O(log n)', space: 'O(1)' },
    pseudocode: [
      'power(x, n):',
      '  result ← 1,  base ← x',
      '  for each bit of n, right to left',
      '    if the bit is 1 → result ← result × base',
      '    base ← base × base',
      '  return result',
    ],
    realWorld: [
      'RSA and Diffie–Hellman: modular exponentiation secures every https connection.',
      'Computing huge Fibonacci numbers via matrix powers.',
      'Rolling-hash powers in string matching (Rabin–Karp).',
    ],
    generate: fastPowFrames,
    inputKind: 'pair',
    verb: 'Compute',
    symbol: '^',
    maxDigits: 3,
    maxDigitsB: 2,
    maxB: 30,
  },
  {
    id: 'sieve',
    name: 'Sieve of Eratosthenes',
    category: 'maths',
    difficulty: 'Beginner',
    tagline: 'Primes find themselves — composites cross themselves out',
    about:
      'How do you find ALL primes up to N? Testing each number for divisibility is slow. Eratosthenes (~240 BC) flipped the problem: walk through the numbers, and every time you meet one that was never crossed out, it is prime — so cross out all of ITS multiples. What survives the sieve is exactly the primes.',
    howItWorks: [
      'List the numbers from 2 to N.',
      'Take the next unmarked number p — it is prime (nothing smaller divides it).',
      'Cross out p², p²+p, p²+2p… (multiples below p² were already crossed out by smaller primes).',
      'Once p² exceeds N, every survivor is prime.',
    ],
    insight: 'Each composite is crossed out by its prime factors only — that adds up to about N·log log N work, breathtakingly close to linear. Note the first cross-out for p always starts at p²: that is why the sieve stops at √N.',
    complexity: { best: 'O(n log log n)', average: 'O(n log log n)', worst: 'O(n log log n)', space: 'O(n)' },
    pseudocode: [
      'mark 2..N as “maybe prime”',
      'for p ← 2 while p² ≤ N',
      '  if p is still unmarked → p is PRIME',
      '    cross out p², p²+p, p²+2p, …',
      'every number never crossed out is prime',
    ],
    realWorld: [
      'Generating prime tables for cryptographic key search.',
      'A staple of competitive programming and Project Euler.',
      'Segmented sieves find primes in astronomically high ranges.',
    ],
    generate: sieveFrames,
    inputKind: 'limit',
    minLimit: 10,
    maxLimit: 150,
  },
];
