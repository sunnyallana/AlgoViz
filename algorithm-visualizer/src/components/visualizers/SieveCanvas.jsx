import Legend from './Legend';

const LEGEND_ITEMS = [
  { label: 'Unmarked', color: '#4C5680' },
  { label: 'Current prime', color: '#22D3EE' },
  { label: 'Crossing out', color: '#FB7185' },
  { label: 'Composite (crossed out)', color: '#4C5680', dim: true },
  { label: 'Prime', color: '#34D399' },
];

function cellClasses(i, frame) {
  if (frame.marking === i) return 'border-action bg-action/20 text-action ring-2 ring-action/30';
  if (frame.current === i) return 'border-accent bg-accent/15 text-accent ring-2 ring-accent/30';
  const st = frame.status[i];
  if (st === 1) return 'border-mint/50 bg-mint/10 text-mint';
  if (st === 2) return 'border-line bg-panel text-faint opacity-40 line-through';
  return 'border-line-bright bg-raised text-fg';
}

/** Number grid 2..N — primes stay lit, composites get crossed out. */
export default function SieveCanvas({ frame }) {
  const nums = [];
  for (let i = 2; i <= frame.limit; i++) nums.push(i);

  return (
    <div className="flex h-full w-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4" role="img" aria-label={frame.message}>
        <div
          className="mx-auto grid max-w-2xl gap-1.5"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(2.4rem, 1fr))' }}
        >
          {nums.map((i) => (
            <div
              key={i}
              className={`tnum flex h-10 items-center justify-center rounded-lg border font-mono text-[13px] font-semibold transition-all duration-150 ${cellClasses(i, frame)}`}
            >
              {i}
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-line/60 py-2">
        <Legend items={LEGEND_ITEMS} />
      </div>
    </div>
  );
}
