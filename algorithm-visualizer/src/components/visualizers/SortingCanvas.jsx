import Legend from './Legend';

const BAR = {
  default: { bg: 'linear-gradient(180deg, #4C5680 0%, #384060 100%)', glow: 'none' },
  sorted: { bg: 'linear-gradient(180deg, #34D399 0%, #1F9D6E 100%)', glow: 'none' },
  compare: { bg: 'linear-gradient(180deg, #FBBF24 0%, #D99E0B 100%)', glow: '0 0 14px rgba(251,191,36,0.45)' },
  action: { bg: 'linear-gradient(180deg, #FB7185 0%, #E04A62 100%)', glow: '0 0 14px rgba(251,113,133,0.5)' },
  special: { bg: 'linear-gradient(180deg, #22D3EE 0%, #0FA8C2 100%)', glow: '0 0 14px rgba(34,211,238,0.45)' },
};

const LEGEND_ITEMS = [
  { label: 'Unsorted', color: '#4C5680' },
  { label: 'Comparing', color: '#FBBF24' },
  { label: 'Swapping / writing', color: '#FB7185' },
  { label: 'Pivot / key / slot', color: '#22D3EE' },
  { label: 'Sorted (final)', color: '#34D399' },
];

function barState(i, frame) {
  if (frame.action.includes(i)) return 'action';
  if (frame.compare.includes(i)) return 'compare';
  if (frame.special.includes(i)) return 'special';
  if (frame.sorted.includes(i)) return 'sorted';
  return 'default';
}

export default function SortingCanvas({ frame, showLegend = true }) {
  const arr = frame.array;
  const n = arr.length;
  const max = Math.max(...arr, 1);
  const showValues = n <= 20;
  const gap = n > 45 ? 1 : n > 28 ? 2 : 4;

  return (
    <div className="flex h-full w-full flex-col">
      <div
        className="relative min-h-0 flex-1 px-3 pt-2 sm:px-5"
        role="img"
        aria-label={`Bar chart of ${n} values. ${frame.message}`}
      >
        {/* Active-range band (merge / quick / selection windows) */}
        {frame.range && (
          <div
            className="pointer-events-none absolute inset-y-0 rounded-lg border-x border-line-bright/60 bg-white/[0.04] transition-all duration-200"
            style={{
              left: `calc(${(frame.range[0] / n) * 100}% + 0px)`,
              width: `${((frame.range[1] - frame.range[0] + 1) / n) * 100}%`,
            }}
          />
        )}
        <div className="relative flex h-full items-end" style={{ gap }}>
          {arr.map((v, i) => {
            const state = barState(i, frame);
            const s = BAR[state];
            return (
              <div key={i} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
                {showValues && (
                  <span
                    className={`tnum mb-1 font-mono text-[10px] leading-none sm:text-[11px] ${
                      state === 'default' ? 'text-muted' : 'text-fg font-semibold'
                    }`}
                  >
                    {v}
                  </span>
                )}
                <div
                  className="w-full rounded-t-[3px]"
                  style={{
                    height: `${Math.max((v / max) * 100, 2)}%`,
                    background: s.bg,
                    boxShadow: s.glow,
                    transition: 'height 160ms ease-out, background 120ms ease, box-shadow 120ms ease',
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
      {showLegend && (
        <div className="border-t border-line/60 py-2">
          <Legend items={LEGEND_ITEMS} />
        </div>
      )}
    </div>
  );
}
