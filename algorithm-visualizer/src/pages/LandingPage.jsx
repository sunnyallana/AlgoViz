import { useEffect, useState } from 'react';
import { motion, MotionConfig } from 'framer-motion';
import {
  ArrowRight,
  ChevronRight,
  Code2,
  MessageSquareText,
  MousePointerClick,
  Play,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { ALGORITHMS, CATEGORIES, algorithmsInCategory, getAlgorithm } from '../algorithms';
import { randomArray } from '../lib/data';
import SortingCanvas from '../components/visualizers/SortingCanvas';
import { Logo } from '../components/layout/Header';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

// ─── Live hero demo: real Bubble Sort frames, auto-looping ───────────────────

function LiveSortDemo() {
  const [frames, setFrames] = useState(() => getAlgorithm('bubble-sort').generate(randomArray(9)));
  const [i, setI] = useState(0);
  const [reduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    if (reduced) {
      setI(frames.length - 1);
      return undefined;
    }
    const atEnd = i >= frames.length - 1;
    const t = setTimeout(
      () => {
        if (atEnd) {
          setFrames(getAlgorithm('bubble-sort').generate(randomArray(9)));
          setI(0);
        } else {
          setI((v) => v + 1);
        }
      },
      atEnd ? 2000 : 200
    );
    return () => clearTimeout(t);
  }, [i, frames, reduced]);

  const frame = frames[Math.min(i, frames.length - 1)];

  return (
    <div className="relative">
      <div className="absolute -inset-6 rounded-[2rem] bg-brand/15 blur-3xl" aria-hidden="true" />
      <div className="card relative overflow-hidden">
        <div className="flex items-center gap-1.5 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-action/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-compare/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-mint/70" />
          <span className="ml-auto font-mono text-[10px] tracking-wide text-faint">bubble-sort · live</span>
        </div>
        <div className="h-52 border-y border-line bg-abyss/60 sm:h-64">
          <SortingCanvas frame={frame} showLegend={false} />
        </div>
        <p className="tnum truncate px-4 py-2.5 font-mono text-[11px] text-muted">{frame.message}</p>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Play,
    title: 'Step-by-step playback',
    text: 'Play, pause, scrub and single-step through every operation. Nothing happens off-screen — you control the clock.',
  },
  {
    icon: Code2,
    title: 'Pseudocode in sync',
    text: 'The exact line of pseudocode being executed lights up as the animation runs, connecting the picture to the code.',
  },
  {
    icon: MessageSquareText,
    title: 'Plain-English narration',
    text: 'Every single step explains itself: what is being compared, why it swaps, what just got ruled out.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Bring your own data',
    text: 'Type your own numbers, click points onto the canvas, pick worst-case presets — then watch how the algorithm copes.',
  },
];

const STEPS = [
  { n: '01', title: 'Pick an algorithm', text: `${ALGORITHMS.length} classics across sorting, searching, geometry, math and quantum — each tagged by difficulty.` },
  { n: '02', title: 'Press play', text: 'Watch the data move with colour-coded states and live operation counters.' },
  { n: '03', title: 'Understand why', text: 'Follow the highlighted pseudocode and narration until the “aha” clicks.' },
];

const GLOSSARY = [
  { term: 'Algorithm', def: 'A precise, repeatable recipe of steps that turns an input into an output.' },
  { term: 'Big-O notation', def: 'How the work grows as the data grows: O(n²) means doubling the input quadruples the work — O(log n) barely notices.' },
  { term: 'Comparison', def: 'The basic question sorting asks: “which of these two values is bigger?” Counting comparisons measures the real cost.' },
  { term: 'In-place', def: 'Works inside the original array, using almost no extra memory.' },
  { term: 'Stable', def: 'Equal values keep their original order — sort people by name then by city, and namesakes stay alphabetical.' },
  { term: 'Divide & conquer', def: 'Split the problem, solve the pieces (often recursively), combine the answers. Merge Sort, Quick Sort and Karatsuba all live here.' },
  { term: 'Recursion', def: 'A function that solves a big case by calling itself on smaller cases, down to a trivially easy “base case”.' },
  { term: 'Logarithmic', def: 'Work that grows by ONE step each time the input doubles. A billion items? About 30 halvings.' },
  { term: 'Qubit', def: 'A quantum bit: not just 0 or 1, but a point on a sphere — α|0⟩ + β|1⟩, holding both at once.' },
  { term: 'Superposition', def: 'One register holding every input simultaneously. The catch: reading it collapses everything to a single answer.' },
  { term: 'Interference', def: 'Quantum amplitudes can be negative — wrong answers can CANCEL while right answers reinforce. Every quantum speed-up is engineered interference.' },
  { term: 'Measurement', def: 'The moment quantum becomes classical: the state collapses to one outcome, with probability = amplitude². Irreversible.' },
];

/** Heat colours for complexity strings: green = cheap, amber = moderate, rose = quadratic. */
const complexityTone = (c) => {
  if (c.includes('²')) return 'text-action';
  if (/n log n|\^1\.|n log log|√|O\(n\)/.test(c)) return 'text-compare';
  return 'text-mint';
};

function CheatSheet({ onLaunch }) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line text-[10px] uppercase tracking-widest text-faint">
              <th scope="col" className="px-4 py-3 font-semibold">Algorithm</th>
              <th scope="col" className="px-4 py-3 font-semibold">Best</th>
              <th scope="col" className="px-4 py-3 font-semibold">Average</th>
              <th scope="col" className="px-4 py-3 font-semibold">Worst</th>
              <th scope="col" className="px-4 py-3 font-semibold">Space</th>
            </tr>
          </thead>
          {CATEGORIES.map((cat) => (
            <tbody key={cat.id}>
              <tr className="border-b border-line/60 bg-raised/40">
                <td colSpan={5} className="px-4 py-2">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: cat.accent }}>
                    <cat.icon size={11} aria-hidden="true" />
                    {cat.label}
                  </span>
                </td>
              </tr>
              {algorithmsInCategory(cat.id).map((a) => (
                <tr
                  key={a.id}
                  onClick={() => onLaunch(a.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onLaunch(a.id); } }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Open ${a.name} in the visualizer`}
                  className="group cursor-pointer border-b border-line/40 transition-colors duration-150 last:border-b-0 hover:bg-raised/60 focus-visible:bg-raised/60"
                >
                  <td className="px-4 py-2.5 text-[13px] font-medium text-muted transition-colors duration-150 group-hover:text-fg">
                    <span className="inline-flex items-center gap-1.5">
                      {a.name}
                      <ChevronRight size={13} className="opacity-0 transition-opacity duration-150 group-hover:opacity-100" aria-hidden="true" />
                    </span>
                  </td>
                  <td className={`tnum px-4 py-2.5 font-mono text-xs ${complexityTone(a.complexity.best)}`}>{a.complexity.best}</td>
                  <td className={`tnum px-4 py-2.5 font-mono text-xs ${complexityTone(a.complexity.average)}`}>{a.complexity.average}</td>
                  <td className={`tnum px-4 py-2.5 font-mono text-xs ${complexityTone(a.complexity.worst)}`}>{a.complexity.worst}</td>
                  <td className={`tnum px-4 py-2.5 font-mono text-xs ${complexityTone(a.complexity.space)}`}>{a.complexity.space}</td>
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </div>
  );
}

export default function LandingPage({ onLaunch }) {
  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-screen overflow-x-clip bg-abyss">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-40 left-1/2 h-[480px] w-[760px] -translate-x-1/2 rounded-full bg-brand/15 blur-[140px]" />
          <div className="absolute -left-44 top-1/3 h-80 w-80 rounded-full bg-accent/10 blur-[120px]" />
          <div className="absolute -right-44 top-2/3 h-80 w-80 rounded-full bg-mint/10 blur-[120px]" />
        </div>

        {/* Nav */}
        <header className="sticky top-0 z-30 border-b border-line/60 bg-abyss/75 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
            <Logo />
            <nav className="hidden items-center gap-6 text-sm font-medium text-muted md:flex" aria-label="Main">
              <a href="#algorithms" className="transition-colors duration-200 hover:text-fg">Algorithms</a>
              <a href="#cheatsheet" className="transition-colors duration-200 hover:text-fg">Cheat sheet</a>
              <a href="#features" className="transition-colors duration-200 hover:text-fg">Features</a>
              <a href="#glossary" className="transition-colors duration-200 hover:text-fg">Glossary</a>
            </nav>
            <button
              type="button"
              onClick={() => onLaunch()}
              className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-semibold text-white shadow-glow-sm transition-all duration-200 hover:bg-brand-bright"
            >
              Launch app
            </button>
          </div>
        </header>

        <main className="relative">
          {/* Hero */}
          <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:grid-cols-2">
            {/* min-w-0 keeps the nowrap demo message from blowing up the column width */}
            <motion.div className="min-w-0" variants={stagger} initial="hidden" animate="show">
              <motion.span
                variants={fadeUp}
                className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand-ghost px-3 py-1 text-xs font-semibold text-brand-bright"
              >
                <Sparkles size={13} aria-hidden="true" />
                {ALGORITHMS.length} interactive algorithms · zero setup
              </motion.span>
              <motion.h1
                variants={fadeUp}
                className="mt-5 font-display text-4xl font-bold leading-[1.08] tracking-tight text-fg sm:text-5xl lg:text-6xl"
              >
                See algorithms <span className="text-gradient">think</span>.
              </motion.h1>
              <motion.p variants={fadeUp} className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
                AlgoViz runs sorting, searching, geometry, big-number math — and real quantum algorithms — one step
                at a time, with synced pseudocode, live counters and a plain-English explanation of every single move.
              </motion.p>
              <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onLaunch()}
                  className="group inline-flex h-12 cursor-pointer items-center gap-2 rounded-xl bg-brand px-6 text-sm font-semibold text-white shadow-glow-sm transition-all duration-200 hover:bg-brand-bright hover:shadow-glow"
                >
                  Start visualizing
                  <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
                </button>
                <a
                  href="#algorithms"
                  className="inline-flex h-12 items-center rounded-xl border border-line bg-raised px-6 text-sm font-semibold text-muted transition-colors duration-200 hover:border-line-bright hover:text-fg"
                >
                  Browse algorithms
                </a>
              </motion.div>
              <motion.dl variants={fadeUp} className="mt-10 flex gap-10">
                <div>
                  <dt className="font-display text-2xl font-bold text-fg">{ALGORITHMS.length}</dt>
                  <dd className="mt-0.5 text-xs font-medium text-faint">algorithms</dd>
                </div>
                <div>
                  <dt className="font-display text-2xl font-bold text-fg">{CATEGORIES.length}</dt>
                  <dd className="mt-0.5 text-xs font-medium text-faint">categories</dd>
                </div>
                <div>
                  <dt className="font-display text-2xl font-bold text-fg">every</dt>
                  <dd className="mt-0.5 text-xs font-medium text-faint">step explained</dd>
                </div>
              </motion.dl>
            </motion.div>

            <motion.div className="min-w-0" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}>
              <LiveSortDemo />
            </motion.div>
          </section>

          {/* Algorithm catalogue */}
          <motion.section
            id="algorithms"
            className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-100px' }}
          >
            <motion.h2 variants={fadeUp} className="font-display text-2xl font-bold tracking-tight text-fg sm:text-3xl">
              Five worlds to explore
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-2 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
              Start with a beginner sort, finish by factoring numbers on a simulated quantum computer. Click any
              algorithm to jump straight in.
            </motion.p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {CATEGORIES.map((cat) => (
                <motion.div key={cat.id} variants={fadeUp} className="card flex flex-col p-5 transition-colors duration-200 hover:border-line-bright">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: `${cat.accent}1A`, color: cat.accent }}
                  >
                    <cat.icon size={19} aria-hidden="true" />
                  </div>
                  <h3 className="mt-3.5 font-display text-lg font-semibold text-fg">{cat.label}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">{cat.blurb}</p>
                  <ul className="mt-4 space-y-0.5">
                    {algorithmsInCategory(cat.id).map((a) => (
                      <li key={a.id}>
                        <button
                          type="button"
                          onClick={() => onLaunch(a.id)}
                          className="group flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] font-medium text-muted transition-colors duration-150 hover:bg-raised hover:text-fg"
                        >
                          {a.name}
                          <ChevronRight size={14} className="shrink-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100" aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Big-O cheat sheet */}
          <motion.section
            id="cheatsheet"
            className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-100px' }}
          >
            <motion.h2 variants={fadeUp} className="font-display text-2xl font-bold tracking-tight text-fg sm:text-3xl">
              Big-O at a glance
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-2 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
              Every algorithm on one card — <span className="text-mint">green</span> is cheap,{' '}
              <span className="text-compare">amber</span> is moderate, <span className="text-action">rose</span> is the
              quadratic danger zone. Click any row to see the trade-off live.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-8">
              <CheatSheet onLaunch={onLaunch} />
            </motion.div>
          </motion.section>

          {/* Features */}
          <motion.section
            id="features"
            className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-100px' }}
          >
            <motion.h2 variants={fadeUp} className="font-display text-2xl font-bold tracking-tight text-fg sm:text-3xl">
              Built for the moment it clicks
            </motion.h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {FEATURES.map((f) => (
                <motion.div key={f.title} variants={fadeUp} className="card flex gap-4 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-ghost text-brand-bright">
                    <f.icon size={18} aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-semibold text-fg">{f.title}</h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted">{f.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Glossary */}
          <motion.section
            id="glossary"
            className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-100px' }}
          >
            <motion.h2 variants={fadeUp} className="font-display text-2xl font-bold tracking-tight text-fg sm:text-3xl">
              Words you&rsquo;ll meet
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-2 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
              Eight terms that unlock every algorithms textbook — in plain English.
            </motion.p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {GLOSSARY.map((g) => (
                <motion.div key={g.term} variants={fadeUp} className="card p-4">
                  <h3 className="font-display text-sm font-semibold text-brand-bright">{g.term}</h3>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{g.def}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* How it works */}
          <motion.section
            id="how"
            className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-100px' }}
          >
            <motion.h2 variants={fadeUp} className="font-display text-2xl font-bold tracking-tight text-fg sm:text-3xl">
              Three steps to “aha”
            </motion.h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {STEPS.map((s) => (
                <motion.div key={s.n} variants={fadeUp} className="card p-5">
                  <span className="font-mono text-xs font-semibold tracking-widest text-brand-bright">{s.n}</span>
                  <h3 className="mt-2 font-display text-base font-semibold text-fg">{s.title}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">{s.text}</p>
                </motion.div>
              ))}
            </div>
            <motion.div variants={fadeUp} className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={() => onLaunch()}
                className="group inline-flex h-12 cursor-pointer items-center gap-2 rounded-xl bg-brand px-7 text-sm font-semibold text-white shadow-glow-sm transition-all duration-200 hover:bg-brand-bright hover:shadow-glow"
              >
                <MousePointerClick size={16} aria-hidden="true" />
                Open the visualizer
              </button>
            </motion.div>
          </motion.section>
        </main>

        <footer className="relative border-t border-line/60">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-center sm:flex-row sm:px-6 sm:text-left">
            <Logo />
            <p className="text-xs leading-relaxed text-faint">
              Built by Sunny Shaban Ali — born as a Design &amp; Analysis of Algorithms course project, rebuilt for learners.
            </p>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
