import Legend from './Legend';
import { binLabel } from '../../lib/quantum';

const BAR_LEGEND = [
  { label: 'Positive amplitude', color: '#8B5CF6' },
  { label: 'Negative amplitude', color: '#FB7185' },
  { label: 'Marked / measured', color: '#FBBF24' },
  { label: 'Mean (diffusion)', color: '#22D3EE' },
];

const SPECTRUM_LEGEND = [
  { label: 'Probability', color: '#22D3EE' },
  { label: 'Expected peaks', color: '#A78BFA' },
  { label: 'Measured k', color: '#FBBF24' },
];

// ─── Signed amplitude bars (≤ 64 basis states) ───────────────────────────────

function AmplitudeBars({ frame }) {
  const amps = frame.amps;
  const N = amps.length;
  const maxAmp = Math.max(...amps.map(Math.abs), 1e-9);
  const showKets = N <= 16;
  const showValues = N <= 8;
  const half = (a) => `${Math.min((Math.abs(a) / maxAmp) * 96, 96)}%`;

  return (
    <div className="relative flex h-full flex-col px-3 pt-2 sm:px-5">
      {frame.notes.length > 0 && (
        <div className="absolute right-3 top-2 z-10 flex max-w-[45%] flex-col items-end gap-1">
          {frame.notes.map((nte, i) => (
            <span key={i} className="tnum rounded-full border border-line-bright bg-abyss/85 px-2 py-0.5 font-mono text-[10px] text-muted backdrop-blur">
              {nte}
            </span>
          ))}
        </div>
      )}

      <div className="relative min-h-0 flex-1">
        {/* Mean line (Grover diffusion) */}
        {frame.mean !== null && (
          <div
            className="absolute inset-x-0 z-10 border-t-2 border-dashed border-accent/80 transition-all duration-200"
            style={{ top: `${50 - (frame.mean / maxAmp) * 48}%` }}
          >
            <span className="absolute -top-2.5 left-1 font-mono text-[9px] font-bold text-accent">mean</span>
          </div>
        )}
        {/* Zero line */}
        <div className="absolute inset-x-0 top-1/2 border-t border-line-bright/70" />

        <div className="flex h-full items-stretch justify-center gap-[3px] sm:gap-1.5">
          {amps.map((a, i) => {
            const isMarked = frame.marked === i;
            const isHi = frame.highlight.includes(i);
            const pos = a >= 0;
            const color = frame.colors
              ? frame.colors[i]
              : pos
                ? 'linear-gradient(180deg, #A78BFA 0%, #7C4DEF 100%)'
                : 'linear-gradient(0deg, #FB7185 0%, #E04A62 100%)';
            return (
              <div key={i} className="flex min-w-0 max-w-[64px] flex-1 flex-col">
                {/* Upper half (positive bars grow down→up from the centre) */}
                <div className="flex flex-1 flex-col items-center justify-end">
                  {showValues && pos && Math.abs(a) > 0.004 && (
                    <span className={`tnum mb-0.5 font-mono text-[10px] ${isHi || isMarked ? 'font-bold text-fg' : 'text-muted'}`}>
                      {a.toFixed(2)}
                    </span>
                  )}
                  {pos && (
                    <div
                      className={`w-full rounded-t-[3px] transition-all duration-200 ${isMarked || isHi ? 'ring-2 ring-compare/80' : ''}`}
                      style={{
                        height: half(a),
                        background: color,
                        boxShadow: isMarked || isHi ? '0 0 14px rgba(251,191,36,0.4)' : 'none',
                      }}
                      title={`P = ${(a * a * 100).toFixed(1)}%`}
                    />
                  )}
                </div>
                {/* Lower half (negative bars grow top→down from the centre) */}
                <div className="flex flex-1 flex-col items-center justify-start">
                  {!pos && Math.abs(a) > 1e-9 && (
                    <div
                      className={`w-full rounded-b-[3px] transition-all duration-200 ${isMarked || isHi ? 'ring-2 ring-compare/80' : ''}`}
                      style={{
                        height: half(a),
                        background: color,
                        boxShadow: isMarked || isHi ? '0 0 14px rgba(251,113,133,0.4)' : 'none',
                      }}
                      title={`P = ${(a * a * 100).toFixed(1)}%`}
                    />
                  )}
                  {showValues && !pos && Math.abs(a) > 0.004 && (
                    <span className={`tnum mt-0.5 font-mono text-[10px] ${isHi || isMarked ? 'font-bold text-action' : 'text-muted'}`}>
                      {a.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Basis-state labels */}
      <div className="flex justify-center gap-[3px] py-1.5 sm:gap-1.5">
        {amps.map((a, i) => (
          <span
            key={i}
            className={`tnum min-w-0 max-w-[64px] flex-1 truncate text-center font-mono text-[8px] leading-tight sm:text-[10px] ${
              frame.marked === i || frame.highlight.includes(i) ? 'font-bold text-compare' : 'text-faint'
            }`}
          >
            {showKets ? binLabel(i, frame.nLabels) : i}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Spectrum chart (Shor — hundreds of register values) ─────────────────────

function Spectrum({ frame }) {
  const probs = frame.probs;
  const Q = probs.length;
  const W = 800;
  const H = 300;
  const maxP = Math.max(...probs, 1e-12);
  const pts = probs.map((p, k) => `${((k + 0.5) / Q) * W},${H - 6 - (p / maxP) * (H - 40)}`);
  const area = `M0,${H - 6} L${pts.join(' L')} L${W},${H - 6} Z`;

  return (
    <div className="flex h-full flex-col px-3 pt-2 sm:px-5">
      <div className="relative min-h-0 flex-1">
        <span className="absolute right-1 top-1 z-10 rounded-full border border-line-bright bg-abyss/85 px-2 py-0.5 font-mono text-[10px] text-muted">
          register size Q = {Q}
        </span>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-full w-full">
          {/* Expected peak markers */}
          {frame.peaks?.map((p) => (
            <g key={p.k}>
              <line x1={((p.k + 0.5) / Q) * W} y1={14} x2={((p.k + 0.5) / Q) * W} y2={H - 6} stroke="#A78BFA" strokeWidth="1" strokeDasharray="3 5" opacity="0.5" />
              <text x={((p.k + 0.5) / Q) * W} y={10} textAnchor="middle" fontSize="11" fontFamily="JetBrains Mono, monospace" fill="#A78BFA">
                {p.label}
              </text>
            </g>
          ))}
          <path d={area} fill="rgba(34,211,238,0.16)" stroke="#22D3EE" strokeWidth="1.5" />
          {/* Measured k */}
          {frame.highlight.map((k) => (
            <g key={k}>
              <line x1={((k + 0.5) / Q) * W} y1={14} x2={((k + 0.5) / Q) * W} y2={H - 6} stroke="#FBBF24" strokeWidth="2" />
              <text x={((k + 0.5) / Q) * W} y={28} textAnchor="middle" fontSize="12" fontWeight="700" fontFamily="JetBrains Mono, monospace" fill="#FBBF24" stroke="#070A12" strokeWidth="3" paintOrder="stroke">
                k={k}
              </text>
            </g>
          ))}
          <line x1="0" y1={H - 6} x2={W} y2={H - 6} stroke="#2C3A5C" strokeWidth="1" />
        </svg>
      </div>
      <div className="flex justify-between py-1 font-mono text-[10px] text-faint">
        <span>0</span>
        <span>register value →</span>
        <span>{Q - 1}</span>
      </div>
    </div>
  );
}

export default function QuantumCanvas({ frame }) {
  const spectrumMode = frame.probs !== null;
  return (
    <div className="flex h-full w-full flex-col" role="img" aria-label={frame.message}>
      <div className="min-h-0 flex-1">
        {spectrumMode ? <Spectrum frame={frame} /> : <AmplitudeBars frame={frame} />}
      </div>
      <div className="border-t border-line/60 py-2">
        <Legend items={spectrumMode ? SPECTRUM_LEGEND : BAR_LEGEND} />
      </div>
    </div>
  );
}
