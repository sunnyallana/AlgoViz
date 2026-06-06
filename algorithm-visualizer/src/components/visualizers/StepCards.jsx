import { useEffect, useRef } from 'react';

/** Generic step-card list (Euclidean GCD, fast exponentiation, Shor's classical work). */
export default function StepCards({ frame }) {
  const activeRef = useRef(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [frame.activeStep, frame.steps.length, frame.result]);

  return (
    <div className="h-full overflow-y-auto p-3 sm:p-4">
      {frame.steps.length === 0 && !frame.result && (
        <p className="flex h-full items-center justify-center text-center text-sm text-muted">
          Press play to walk through the steps.
        </p>
      )}
      <div className="mx-auto max-w-xl space-y-2">
        {frame.steps.map((s, i) => {
          const active = frame.activeStep === i;
          return (
            <div
              key={i}
              ref={active ? activeRef : undefined}
              className={`rounded-xl border p-3 transition-all duration-200 ${
                active ? 'border-brand bg-brand-ghost shadow-glow-sm' : 'border-line bg-panel'
              }`}
            >
              <p className="break-all font-mono text-xs font-semibold text-fg sm:text-sm">{s.formula}</p>
              {s.note && <p className="mt-1 break-all font-mono text-[11px] leading-relaxed text-muted">{s.note}</p>}
            </div>
          );
        })}
        {frame.result && (
          <div ref={activeRef} className="rounded-xl border border-mint/40 bg-mint/10 p-3.5 text-center">
            <p className="break-all font-mono text-sm font-bold text-mint sm:text-base">{frame.result}</p>
          </div>
        )}
      </div>
    </div>
  );
}
