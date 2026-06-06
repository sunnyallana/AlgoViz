import { useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import SieveCanvas from './SieveCanvas';
import StepCards from './StepCards';

// ─── Long multiplication: the classic stacked schoolbook layout ──────────────

function LongMultiplication({ frame }) {
  const { a, b, partials, revealed, activeRow, activeDigitPlace, sumSoFar, sumCount, total } = frame;
  const bDigits = b.split('');

  return (
    <div className="flex h-full items-center justify-center overflow-auto p-4">
      <div className="inline-flex flex-col items-end font-mono text-xl leading-relaxed tracking-wide sm:text-2xl">
        {/* Operands */}
        <span className="tnum text-fg">{a}</span>
        <span className="tnum text-fg">
          <span className="mr-3 text-muted">×</span>
          {bDigits.map((d, i) => {
            const place = bDigits.length - 1 - i;
            const active = activeDigitPlace === place;
            return (
              <span
                key={i}
                className={active ? 'rounded bg-compare/20 px-0.5 font-bold text-compare' : undefined}
              >
                {d}
              </span>
            );
          })}
        </span>
        <div className="my-1 h-px w-full min-w-[8ch] bg-line-bright" />

        {/* Partial product rows */}
        {partials.map((row, i) => {
          if (i >= revealed) return null;
          const isActive = activeRow === i;
          return (
            <span
              key={i}
              className={`tnum rounded px-1 transition-colors duration-200 ${
                isActive ? 'bg-compare/15 font-semibold text-compare' : 'text-fg/90'
              }`}
            >
              {row.raw}
              {row.place > 0 && <span className={isActive ? 'text-compare/60' : 'text-faint'}>{'0'.repeat(row.place)}</span>}
            </span>
          );
        })}

        {/* Sum */}
        {(sumCount > 1 || total) && (
          <>
            <div className="my-1 h-px w-full bg-line-bright" />
            <span className={`tnum rounded px-1 font-semibold ${total ? 'bg-mint/15 text-mint' : 'text-accent'}`}>
              {total ?? sumSoFar}
            </span>
            <span className="mt-1 text-[10px] font-sans font-medium uppercase tracking-widest text-faint">
              {total ? 'answer' : `running sum (${sumCount} of ${partials.length} rows)`}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Karatsuba: the recursion as a live call tree ────────────────────────────

const STATUS_STYLES = {
  active: 'border-brand bg-brand-ghost shadow-glow-sm',
  waiting: 'border-line bg-panel opacity-65',
  done: 'border-line bg-panel',
};

function Karatsuba({ frame }) {
  const activeRef = useRef(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [frame.activeId, frame.calls.length]);

  return (
    <div className="h-full overflow-y-auto p-3 sm:p-4">
      {frame.calls.length === 0 && (
        <p className="flex h-full items-center justify-center text-center text-sm text-muted">
          Press play to watch the recursion unfold.
        </p>
      )}
      <div className="mx-auto max-w-2xl space-y-2">
        {frame.calls.map((c) => {
          const isActive = frame.activeId === c.id && c.status !== 'done';
          return (
            <div
              key={c.id}
              ref={isActive ? activeRef : undefined}
              style={{ marginLeft: Math.min(c.depth, 5) * 18 }}
              className={`rounded-xl border p-2.5 transition-all duration-200 sm:p-3 ${
                isActive ? STATUS_STYLES.active : STATUS_STYLES[c.status]
              }`}
            >
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="break-all font-mono text-xs font-semibold text-fg sm:text-sm">
                  karatsuba({c.x}, {c.y})
                </span>
                {c.note.startsWith('base') && (
                  <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
                    base case
                  </span>
                )}
                {c.status === 'done' && (
                  <span className="inline-flex items-center gap-1 break-all rounded-full border border-mint/40 bg-mint/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-mint">
                    <Check size={11} strokeWidth={3} aria-hidden="true" /> {c.result}
                  </span>
                )}
              </div>
              {c.note && !c.note.startsWith('base') && (
                <p className="mt-1.5 break-all font-mono text-[11px] leading-relaxed text-muted">{c.note}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function MathCanvas({ frame }) {
  return (
    <div className="h-full w-full" role="img" aria-label={frame.message}>
      {frame.kind === 'long' ? (
        <LongMultiplication frame={frame} />
      ) : frame.kind === 'karatsuba' ? (
        <Karatsuba frame={frame} />
      ) : frame.kind === 'sieve' ? (
        <SieveCanvas frame={frame} />
      ) : (
        <StepCards frame={frame} />
      )}
    </div>
  );
}
