import { useEffect, useMemo, useRef, useState } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import DataControls from '../components/controls/DataControls';
import PlaybackBar from '../components/controls/PlaybackBar';
import StatusStrip from '../components/panels/StatusStrip';
import CodePanel from '../components/panels/CodePanel';
import InfoPanel from '../components/panels/InfoPanel';
import SortingCanvas from '../components/visualizers/SortingCanvas';
import SearchCanvas from '../components/visualizers/SearchCanvas';
import GeometryCanvas from '../components/visualizers/GeometryCanvas';
import MathCanvas from '../components/visualizers/MathCanvas';
import BlochCanvas from '../components/visualizers/BlochCanvas';
import QuantumCanvas from '../components/visualizers/QuantumCanvas';
import StepCards from '../components/visualizers/StepCards';
import { getAlgorithm, DEFAULT_ALGORITHM_ID } from '../algorithms';
import { usePlayback, useKeyboardShortcuts } from '../hooks/usePlayback';
import {
  randomArray,
  SORT_PRESETS,
  sortedDistinctArray,
  shuffledCopy,
  randomPoints,
  randInt,
} from '../lib/data';
import { KET0, BLOCH_GATES, rotate, prob0, validShorBases } from '../lib/quantum';

/** Deterministic balanced oracle default: f(x) = parity of x. */
const parityPattern = (n) => {
  let mask = 0;
  for (let i = 0; i < 1 << n; i++) {
    let p = 0;
    let x = i;
    while (x) {
      p ^= x & 1;
      x >>= 1;
    }
    if (p) mask |= 1 << i;
  }
  return mask;
};

/** Random subset of exactly half the inputs (a valid balanced f). */
const randomBalancedPattern = (n) => {
  const N = 1 << n;
  const idx = Array.from({ length: N }, (_, i) => i);
  for (let i = N - 1; i > 0; i--) {
    const j = randInt(0, i);
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  let mask = 0;
  for (let i = 0; i < N / 2; i++) mask |= 1 << idx[i];
  return mask;
};

/** Replay the Bloch op list to get the current P(0) — used to roll a measurement. */
const blochProb0 = (ops) => {
  let st = KET0;
  for (const op of ops) {
    if (op.type === 'gate') {
      const g = BLOCH_GATES[op.g];
      st = rotate(st, g.axis, g.angle);
    } else {
      st = op.outcome === 0 ? { ...KET0 } : { ar: 0, ai: 0, br: 1, bi: 0 };
    }
  }
  return prob0(st);
};

const makeSearchState = (size) => {
  const sorted = sortedDistinctArray(size);
  return {
    size,
    sorted,
    shuffled: shuffledCopy(sorted),
    target: sorted[randInt(0, sorted.length - 1)],
  };
};

const PanelSection = ({ title, children, className = '' }) => (
  <section className={`card flex flex-col overflow-hidden ${className}`}>
    <h2 className="shrink-0 border-b border-line px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-faint">
      {title}
    </h2>
    <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
  </section>
);

export default function VisualizerPage({ initialAlgorithmId, onHome }) {
  const [algoId, setAlgoId] = useState(initialAlgorithmId || DEFAULT_ALGORITHM_ID);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const algorithm = getAlgorithm(algoId) ?? getAlgorithm(DEFAULT_ALGORITHM_ID);

  // ── Per-category data (each survives algorithm switches) ──────────────────
  const [sortState, setSortState] = useState(() => ({ preset: 'random', size: 25, values: randomArray(25) }));
  const [searchState, setSearchState] = useState(() => makeSearchState(15));
  const [geoState, setGeoState] = useState(() => ({ count: 10, points: randomPoints(10) }));
  const [mathState, setMathState] = useState({ a: '1234', b: '5678', limit: 60 });

  const presetMake = (preset) => SORT_PRESETS.find((p) => p.id === preset).make;
  const sortCtl = {
    size: sortState.size,
    preset: sortState.preset,
    setSize: (size) => setSortState((s) => ({ ...s, size, values: presetMake(s.preset)(size) })),
    setPreset: (preset) => setSortState((s) => ({ ...s, preset, values: presetMake(preset)(s.size) })),
    regenerate: () => setSortState((s) => ({ ...s, values: presetMake(s.preset)(s.size) })),
    applyCustom: (nums) => setSortState((s) => ({ ...s, size: nums.length, values: nums })),
  };

  const searchCtl = {
    size: searchState.size,
    target: searchState.target,
    setSize: (size) => setSearchState(makeSearchState(size)),
    regenerate: () => setSearchState((s) => makeSearchState(s.size)),
    applyTarget: (v) => setSearchState((s) => ({ ...s, target: v })),
    pickHit: () => setSearchState((s) => ({ ...s, target: s.sorted[randInt(0, s.sorted.length - 1)] })),
    pickMiss: () =>
      setSearchState((s) => {
        const present = new Set(s.sorted);
        const max = s.sorted[s.sorted.length - 1];
        let v;
        do {
          v = randInt(1, max + 5);
        } while (present.has(v));
        return { ...s, target: v };
      }),
  };

  const geoCtl = {
    count: geoState.count,
    setCount: (count) => setGeoState({ count, points: randomPoints(count) }),
    regenerate: () => setGeoState((g) => ({ ...g, points: randomPoints(g.count) })),
    clear: () => setGeoState((g) => ({ ...g, points: [] })),
  };
  const addPoint = (p) =>
    setGeoState((g) => (g.points.length >= 20 ? g : { ...g, points: [...g.points, p] }));

  const mathCtl = {
    a: mathState.a,
    b: mathState.b,
    limit: mathState.limit,
    apply: (a, b) => setMathState((s) => ({ ...s, a, b })),
    setLimit: (limit) => setMathState((s) => ({ ...s, limit })),
  };

  const [quantum, setQuantum] = useState(() => ({
    ops: [],
    deutschF: 'id',
    dj: { n: 3, oracle: 'balanced', pattern: parityPattern(3) },
    grover: { n: 3, marked: 5 },
    simon: { n: 2, secret: 3 },
    shor: { N: 15, a: 7 },
  }));

  const quantumCtl = {
    ops: quantum.ops,
    addGate: (g) => setQuantum((s) => ({ ...s, ops: [...s.ops, { type: 'gate', g }] })),
    measure: () =>
      setQuantum((s) => {
        // The dice are rolled HERE (not in the generator) so frames stay deterministic.
        const outcome = Math.random() < blochProb0(s.ops) ? 0 : 1;
        return { ...s, ops: [...s.ops, { type: 'measure', outcome }] };
      }),
    undo: () => setQuantum((s) => ({ ...s, ops: s.ops.slice(0, -1) })),
    resetOps: () => setQuantum((s) => ({ ...s, ops: [] })),
    deutschF: quantum.deutschF,
    setDeutschF: (f) => setQuantum((s) => ({ ...s, deutschF: f })),
    dj: quantum.dj,
    setDjN: (n) => setQuantum((s) => ({ ...s, dj: { ...s.dj, n, pattern: parityPattern(n) } })),
    setDjOracle: (oracle) => setQuantum((s) => ({ ...s, dj: { ...s.dj, oracle } })),
    rerollDj: () => setQuantum((s) => ({ ...s, dj: { ...s.dj, oracle: 'balanced', pattern: randomBalancedPattern(s.dj.n) } })),
    grover: quantum.grover,
    setGroverN: (n) => setQuantum((s) => ({ ...s, grover: { n, marked: Math.min(s.grover.marked, (1 << n) - 1) } })),
    randomGrover: () => setQuantum((s) => ({ ...s, grover: { ...s.grover, marked: randInt(0, (1 << s.grover.n) - 1) } })),
    simon: quantum.simon,
    setSimonN: (n) => setQuantum((s) => ({ ...s, simon: { n, secret: Math.min(Math.max(s.simon.secret, 1), (1 << n) - 1) } })),
    rerollSimon: () => setQuantum((s) => ({ ...s, simon: { ...s.simon, secret: randInt(1, (1 << s.simon.n) - 1) } })),
    shor: quantum.shor,
    setShorN: (N) => setQuantum((s) => ({ ...s, shor: { N, a: validShorBases(N)[0] } })),
    setShorA: (a) => setQuantum((s) => ({ ...s, shor: { ...s.shor, a } })),
  };

  // ── Frames ─────────────────────────────────────────────────────────────────
  const searchArray = algorithm.requiresSorted ? searchState.sorted : searchState.shuffled;

  const frames = useMemo(() => {
    switch (algorithm.category) {
      case 'sorting':
        return algorithm.generate(sortState.values);
      case 'searching':
        return algorithm.generate({ array: searchArray, target: searchState.target });
      case 'geometry':
        return algorithm.generate(geoState.points);
      case 'maths':
        return algorithm.generate(mathState);
      case 'quantum':
        switch (algorithm.id) {
          case 'bloch-sphere':
            return algorithm.generate({ ops: quantum.ops });
          case 'deutsch':
            return algorithm.generate({ f: quantum.deutschF });
          case 'deutsch-jozsa':
            return algorithm.generate(quantum.dj);
          case 'grover':
            return algorithm.generate(quantum.grover);
          case 'simon':
            return algorithm.generate(quantum.simon);
          default:
            return algorithm.generate(quantum.shor);
        }
      default:
        return [];
    }
  }, [algorithm, sortState.values, searchArray, searchState.target, geoState.points, mathState, quantum]);

  const pb = usePlayback(frames);
  useKeyboardShortcuts(pb);
  const frame = frames[Math.min(pb.index, frames.length - 1)];

  // Bloch playground: clicking a gate appends frames — jump there and animate,
  // instead of rewinding to the very beginning.
  const pbRef = useRef(pb);
  pbRef.current = pb;
  const prevRef = useRef({ id: null, len: 0 });
  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = { id: algorithm.id, len: frames.length };
    if (algorithm.id !== 'bloch-sphere' || prev.id !== 'bloch-sphere') return;
    if (frames.length > prev.len && prev.len > 0) {
      pbRef.current.seek(prev.len - 1);
      pbRef.current.play();
    } else if (frames.length < prev.len) {
      pbRef.current.seek(Math.max(frames.length - 1, 0));
    }
  }, [frames, algorithm.id]);

  const canvas = (() => {
    switch (algorithm.category) {
      case 'sorting':
        return <SortingCanvas frame={frame} />;
      case 'searching':
        return (
          <SearchCanvas
            frame={frame}
            array={searchArray}
            target={searchState.target}
            midLabel={algorithm.midLabel || 'MID'}
          />
        );
      case 'geometry':
        return (
          <GeometryCanvas
            frame={frame}
            points={geoState.points}
            mode={algoId === 'convex-hull' ? 'hull' : 'pairs'}
            onAddPoint={addPoint}
            interactive={geoState.points.length < 20}
          />
        );
      case 'maths':
        return <MathCanvas frame={frame} />;
      case 'quantum':
        if (frame.kind === 'bloch') return <BlochCanvas frame={frame} />;
        if (frame.kind === 'steps') return <StepCards frame={frame} />;
        return <QuantumCanvas frame={frame} />;
      default:
        return null;
    }
  })();

  return (
    <div className="flex min-h-screen flex-col bg-abyss lg:h-screen">
      <Header algorithm={algorithm} onMenu={() => setMobileNavOpen(true)} onHome={onHome} />

      <div className="flex flex-1 lg:min-h-0">
        <Sidebar
          selectedId={algoId}
          onSelect={setAlgoId}
          mobileOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
        />

        <main className="flex min-w-0 flex-1 flex-col gap-3 p-3 sm:p-4 lg:min-h-0">
          {/* Mobile gets the algorithm title here (header hides it) */}
          <div className="md:hidden">
            <h1 className="font-display text-lg font-semibold text-fg">{algorithm.name}</h1>
            <p className="text-xs text-faint">{algorithm.tagline}</p>
          </div>

          <DataControls algorithm={algorithm} sort={sortCtl} search={searchCtl} geo={geoCtl} math={mathCtl} quantum={quantumCtl} />

          <div className="card h-[46vh] min-h-[320px] overflow-hidden lg:h-auto lg:min-h-0 lg:flex-1">
            {canvas}
          </div>

          <StatusStrip frame={frame} />

          <div className="sticky bottom-2 z-20 lg:static">
            <PlaybackBar pb={pb} />
          </div>

          {/* Mobile / tablet: explainers flow below */}
          <div className="space-y-3 pb-2 lg:hidden">
            <PanelSection title="Pseudocode">
              <CodePanel pseudocode={algorithm.pseudocode} activeLine={frame.codeLine} />
            </PanelSection>
            <PanelSection title={`About ${algorithm.name}`}>
              <InfoPanel algorithm={algorithm} />
            </PanelSection>
          </div>
        </main>

        {/* Desktop: pinned explainer column */}
        <aside className="hidden w-[340px] shrink-0 flex-col gap-3 py-4 pr-4 lg:flex lg:min-h-0 xl:w-[380px]">
          <PanelSection title="Pseudocode" className="max-h-[45%] shrink-0">
            <CodePanel pseudocode={algorithm.pseudocode} activeLine={frame.codeLine} />
          </PanelSection>
          <PanelSection title={`About ${algorithm.name}`} className="min-h-0 flex-1">
            <InfoPanel algorithm={algorithm} />
          </PanelSection>
        </aside>
      </div>
    </div>
  );
}
