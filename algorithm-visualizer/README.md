# AlgoViz — Interactive Algorithm Visualizer

Watch 27 classic algorithms run **one step at a time** — with synced pseudocode, live
operation counters and a plain-English explanation of every single move. Built for people
learning algorithms for the first time.

> This is the app workspace. For the full showcase — screenshots, the algorithm catalogue
> and the story — see the [repository README](../README.md).

## Algorithms

| Category | Algorithms | Visualization |
|----------|------------|---------------|
| **Sorting** (8) | Bubble, Selection, Cocktail Shaker, Insertion, Shell, Merge, Quick, Heap | Animated bars with colour-coded compare / swap / pivot / sorted states |
| **Searching** (5) | Linear, Binary, Jump, Interpolation, Exponential | Array cells with LOW / MID / HIGH pointers and ruled-out dimming |
| **Geometry** (3) | Closest Pair (Brute Force), Closest Pair (Divide & Conquer), Convex Hull (Monotone Chain) | SVG plane — divide lines, candidate strips, rubber-band hull building |
| **Math** (5) | Long Multiplication, Karatsuba, Euclidean GCD, Fast Exponentiation, Sieve of Eratosthenes | Schoolbook partial products · recursion call trees · step cards · prime grid |
| **Quantum** (6) | Bloch Sphere Playground, Deutsch, Deutsch–Jozsa, Grover, Simon, Shor (Period Finding) | Exact state-vector simulation — interactive Bloch sphere, signed amplitude bars, QFT spectra |

## What makes it beginner-friendly

- **Narrated steps** — every frame explains *what* is happening and *why* ("17 > 9, so they must swap").
- **Pseudocode in sync** — the executing line lights up as the animation runs.
- **Live counters** — comparisons, swaps, distance calculations… watch O(n²) vs O(n log n) become real numbers.
- **Properties & real-world uses** — Stable / In-place / Adaptive badges, complexity tiles and "where it's used" for every algorithm.
- **Big-O cheat sheet + glossary** — the landing page doubles as a reference card.
- **Your own data** — custom arrays, click-to-place points, worst-case presets (reversed, nearly-sorted, few-unique).
- **Full playback control** — play / pause / single-step / scrub the timeline / 1–25 steps per second.
- **Keyboard shortcuts** — `Space` play/pause · `←` `→` step · `R` reset.

## Tech

React 18 · Vite 5 · Tailwind CSS 3 · Framer Motion · Lucide icons — no UI framework, fully custom components.

Every algorithm is a **pure step generator**: it returns an array of frames (full snapshots with
highlights, narration, pseudocode line and stats) that a single playback engine drives. Adding a
new algorithm means writing one generator + metadata in `src/algorithms/`.

```
src/
├── algorithms/        # step generators + metadata (the registry)
│   ├── sorting.js     #   8 sorts
│   ├── searching.js   #   5 searches
│   ├── geometry.js    #   closest pair ×2, convex hull
│   ├── maths.js       #   multiplication ×2, GCD, fast power, sieve
│   ├── quantum.js     #   Bloch, Deutsch, Deutsch–Jozsa, Grover, Simon, Shor
│   └── index.js       #   categories + lookup
├── lib/quantum.js     # exact quantum math (rotations, Walsh–Hadamard, QFT spectra)
├── hooks/usePlayback.js   # the playback engine + keyboard shortcuts
├── components/
│   ├── visualizers/   # Sorting, Search, Geometry, Math, Sieve, Bloch, Quantum canvases
│   ├── controls/      # PlaybackBar, DataControls (incl. quantum gate palette)
│   ├── panels/        # CodePanel, InfoPanel, StatusStrip
│   └── layout/        # Header, Sidebar
└── pages/             # LandingPage, VisualizerPage
```

## Run it

```bash
npm install
npm run dev       # local dev server
npm run build     # production build
npm run verify    # correctness harness — runs every generator against
                  # randomized inputs and asserts the results (340k+ checks,
                  # incl. quantum vs closed-form theory)
npm run lint
```

## Author

**Sunny Shaban Ali**
