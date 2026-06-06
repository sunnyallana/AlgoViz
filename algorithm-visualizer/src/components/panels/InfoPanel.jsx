import { Check, Lightbulb, Wrench, X } from 'lucide-react';

const DIFFICULTY_STYLES = {
  Beginner: 'border-mint/40 bg-mint/10 text-mint',
  Intermediate: 'border-compare/40 bg-compare/10 text-compare',
  Advanced: 'border-action/40 bg-action/10 text-action',
};

const COMPLEXITY_TILES = [
  { key: 'best', label: 'Best', color: 'text-mint' },
  { key: 'average', label: 'Average', color: 'text-compare' },
  { key: 'worst', label: 'Worst', color: 'text-action' },
  { key: 'space', label: 'Space', color: 'text-accent' },
];

const PROPERTY_DEFS = [
  { key: 'stable', label: 'Stable', hint: 'Stable: equal values keep their original order after sorting.' },
  { key: 'inPlace', label: 'In-place', hint: 'In-place: sorts inside the original array, using almost no extra memory.' },
  { key: 'adaptive', label: 'Adaptive', hint: 'Adaptive: runs faster when the data is already partly sorted.' },
];

/** Beginner-friendly explainer: about, steps, key insight, properties, complexity, real-world uses. */
export default function InfoPanel({ algorithm }) {
  const { about, howItWorks, insight, complexity, difficulty, properties, realWorld } = algorithm;

  return (
    <div className="space-y-5 p-4">
      <div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${DIFFICULTY_STYLES[difficulty]}`}>
            {difficulty}
          </span>
          {properties &&
            PROPERTY_DEFS.map((p) => {
              const on = properties[p.key];
              return (
                <span
                  key={p.key}
                  title={p.hint}
                  className={`inline-flex cursor-help items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                    on ? 'border-line-bright bg-raised text-fg/80' : 'border-line bg-transparent text-faint'
                  }`}
                >
                  {on ? (
                    <Check size={11} strokeWidth={3} className="text-mint" aria-hidden="true" />
                  ) : (
                    <X size={11} strokeWidth={3} className="text-action/70" aria-hidden="true" />
                  )}
                  {p.label}
                </span>
              );
            })}
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-muted">{about}</p>
      </div>

      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-faint">How it works</h3>
        <ol className="mt-2.5 space-y-2.5">
          {howItWorks.map((step, i) => (
            <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed text-muted">
              <span className="tnum mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line bg-raised font-mono text-[10px] font-semibold text-brand-bright">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex gap-2.5 rounded-xl border border-brand/25 bg-brand-ghost p-3.5">
        <Lightbulb size={16} className="mt-0.5 shrink-0 text-brand-bright" aria-hidden="true" />
        <p className="text-[12.5px] leading-relaxed text-fg/85">{insight}</p>
      </section>

      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-faint">Complexity</h3>
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          {COMPLEXITY_TILES.map((t) => (
            <div key={t.key} className="rounded-lg border border-line bg-raised px-3 py-2.5 text-center">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-faint">
                {t.label}{t.key !== 'space' ? ' time' : ''}
              </div>
              <div className={`tnum mt-1 font-mono text-sm font-semibold ${t.color}`}>{complexity[t.key]}</div>
            </div>
          ))}
        </div>
      </section>

      {realWorld && (
        <section>
          <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-faint">
            <Wrench size={11} aria-hidden="true" />
            Used in the real world
          </h3>
          <ul className="mt-2.5 space-y-2">
            {realWorld.map((use, i) => (
              <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed text-muted">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent/70" aria-hidden="true" />
                <span>{use}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
