import Legend from './Legend';

const legendItems = (midLabel) => [
  { label: 'Not yet checked', color: '#4C5680' },
  { label: 'Checking now', color: '#FBBF24' },
  { label: 'Ruled out', color: '#4C5680', dim: true },
  { label: 'LOW / HIGH bounds', color: '#22D3EE' },
  { label: `${midLabel} probe`, color: '#A78BFA' },
  { label: 'Found', color: '#34D399' },
];

function cellClasses(i, frame) {
  if (frame.found === i)
    return 'border-mint bg-mint/15 text-mint animate-found-pulse';
  if (frame.current === i)
    return 'border-compare bg-compare/15 text-fg ring-2 ring-compare/30';
  if (frame.mid === i)
    return 'border-brand-bright bg-brand-ghost text-fg';
  if (frame.eliminated.includes(i))
    return 'border-line bg-panel text-faint opacity-35';
  return 'border-line-bright bg-raised text-fg';
}

function pointerLabel(i, frame, midLabel) {
  const parts = [];
  if (frame.low === i) parts.push({ t: 'LO', c: 'text-accent' });
  if (frame.mid === i) parts.push({ t: midLabel, c: 'text-brand-bright' });
  if (frame.high === i) parts.push({ t: 'HI', c: 'text-accent' });
  return parts;
}

export default function SearchCanvas({ frame, array, target, midLabel = 'MID' }) {
  const status = frame.found !== null
    ? { text: `Found at index ${frame.found}`, cls: 'border-mint/40 bg-mint/10 text-mint' }
    : frame.notFound
      ? { text: 'Not in the array', cls: 'border-action/40 bg-action/10 text-action' }
      : { text: 'Searching…', cls: 'border-line-bright bg-raised text-muted' };

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex flex-wrap items-center justify-center gap-2 px-3 pt-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-line-bright bg-raised px-3 py-1 text-xs font-medium text-muted">
          Target
          <span className="tnum font-mono text-sm font-bold text-fg">{target}</span>
        </span>
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${status.cls}`}
          role="status"
        >
          {status.text}
        </span>
      </div>

      <div
        className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-2 py-3 sm:px-4"
        role="img"
        aria-label={`Array of ${array.length} sorted values, searching for ${target}. ${frame.message}`}
      >
        <div className="flex max-w-3xl flex-wrap content-center justify-center gap-x-1.5 gap-y-2 sm:gap-x-2">
          {array.map((v, i) => {
            const pointers = pointerLabel(i, frame, midLabel);
            return (
              <div key={i} className="flex flex-col items-center">
                {/* Reserved pointer slot — no layout shift when chips appear */}
                <div className="flex h-4 items-end gap-0.5">
                  {frame.current === i && frame.found === null && (
                    <span className="text-[10px] font-bold leading-none text-compare">▼</span>
                  )}
                  {pointers.map((p) => (
                    <span key={p.t} className={`text-[9px] font-bold leading-none tracking-wide ${p.c}`}>
                      {p.t}
                    </span>
                  ))}
                </div>
                <div
                  className={`tnum flex h-10 w-10 items-center justify-center rounded-lg border font-mono text-sm font-semibold transition-all duration-200 sm:h-11 sm:w-11 ${cellClasses(i, frame)}`}
                >
                  {v}
                </div>
                <span className="tnum mt-1 font-mono text-[10px] leading-none text-faint">{i}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-line/60 py-2">
        <Legend items={legendItems(midLabel)} />
      </div>
    </div>
  );
}
