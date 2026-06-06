import Legend from './Legend';

// Orthographic-ish projection: z up, y right, x toward the viewer (down-left).
const CX = 200;
const CY = 200;
const R = 142;
const px = (x, y) => CX + R * y - 0.38 * R * x;
const py = (x, z) => CY - R * z + 0.26 * R * x;
const proj = (v) => `${px(v.x, v.y)},${py(v.x, v.z)}`;

/** Sampled projection of a great circle, as an SVG path. */
function circlePath(fn) {
  const pts = [];
  for (let i = 0; i <= 72; i++) {
    const t = (i / 72) * 2 * Math.PI;
    const v = fn(t);
    pts.push(`${i === 0 ? 'M' : 'L'}${px(v.x, v.y).toFixed(1)},${py(v.x, v.z).toFixed(1)}`);
  }
  return pts.join(' ');
}

const EQUATOR = circlePath((t) => ({ x: Math.cos(t), y: Math.sin(t), z: 0 }));
const MERIDIAN_XZ = circlePath((t) => ({ x: Math.sin(t), y: 0, z: Math.cos(t) }));
const MERIDIAN_YZ = circlePath((t) => ({ x: 0, y: Math.sin(t), z: Math.cos(t) }));

const AXIS_MARKS = [
  { v: { x: 0, y: 0, z: 1.18 }, label: '|0⟩', strong: true },
  { v: { x: 0, y: 0, z: -1.2 }, label: '|1⟩', strong: true },
  { v: { x: 1.25, y: 0, z: 0 }, label: '|+⟩', strong: false },
  { v: { x: -1.28, y: 0, z: 0 }, label: '|−⟩', strong: false },
  { v: { x: 0, y: 1.22, z: 0 }, label: '|+i⟩', strong: false },
  { v: { x: 0, y: -1.24, z: 0 }, label: '|−i⟩', strong: false },
];

const LEGEND_ITEMS = [
  { label: 'State |ψ⟩', color: '#A78BFA' },
  { label: 'Rotation path', color: '#FBBF24' },
  { label: 'Equator shadow', color: '#5C6880' },
];

function ProbBar({ label, p, color }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[11px] text-muted">{label}</span>
        <span className="tnum font-mono text-xs font-bold text-fg">{(p * 100).toFixed(1)}%</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full transition-all duration-200"
          style={{ width: `${p * 100}%`, background: color }}
        />
      </div>
    </div>
  );
}

export default function BlochCanvas({ frame }) {
  const tipX = px(frame.x, frame.y);
  const tipY = py(frame.x, frame.z);
  const shadowX = px(frame.x, frame.y);
  const shadowY = py(frame.x, 0);

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex min-h-0 flex-1 flex-col items-center gap-2 p-2 sm:p-3 md:flex-row md:gap-4">
        <div className="relative min-h-0 flex-1 self-stretch">
          <svg viewBox="0 0 400 400" className="mx-auto h-full w-full max-w-[460px]" role="img" aria-label={frame.message}>
            <defs>
              <radialGradient id="bloch-sphere" cx="38%" cy="32%" r="75%">
                <stop offset="0%" stopColor="rgba(139,92,246,0.16)" />
                <stop offset="100%" stopColor="rgba(139,92,246,0.03)" />
              </radialGradient>
              <marker id="bloch-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#A78BFA" />
              </marker>
            </defs>

            {/* Sphere body + great circles */}
            <circle cx={CX} cy={CY} r={R} fill="url(#bloch-sphere)" stroke="#2C3A5C" strokeWidth="1.5" />
            <path d={EQUATOR} fill="none" stroke="#2C3A5C" strokeWidth="1" strokeDasharray="4 5" />
            <path d={MERIDIAN_XZ} fill="none" stroke="#1E2740" strokeWidth="1" strokeDasharray="3 6" />
            <path d={MERIDIAN_YZ} fill="none" stroke="#1E2740" strokeWidth="1" strokeDasharray="3 6" />

            {/* Axis pole markers */}
            {AXIS_MARKS.map((m) => (
              <text
                key={m.label}
                x={px(m.v.x, m.v.y)}
                y={py(m.v.x, m.v.z) + 4}
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
                fontSize={m.strong ? 15 : 12}
                fontWeight={m.strong ? 700 : 500}
                fill={m.strong ? '#E8ECF4' : '#5C6880'}
                stroke="#070A12"
                strokeWidth="3"
                paintOrder="stroke"
              >
                {m.label}
              </text>
            ))}

            {/* Rotation trail */}
            {frame.trail.length > 1 && (
              <polyline
                points={frame.trail.map(proj).join(' ')}
                fill="none"
                stroke="#FBBF24"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.75"
              />
            )}

            {/* Shadow on the equator plane (depth cue) */}
            <line x1={tipX} y1={tipY} x2={shadowX} y2={shadowY} stroke="#5C6880" strokeWidth="1" strokeDasharray="2 4" opacity="0.6" />
            <circle cx={shadowX} cy={shadowY} r="2.5" fill="#5C6880" opacity="0.6" />

            {/* State arrow */}
            <line x1={CX} y1={CY} x2={tipX} y2={tipY} stroke="#A78BFA" strokeWidth="3" strokeLinecap="round" markerEnd="url(#bloch-arrow)" />
            <circle cx={tipX} cy={tipY} r="5" fill="#E8ECF4" stroke="#8B5CF6" strokeWidth="2.5" />

            {/* Active gate badge */}
            {frame.activeGate && (
              <text x={CX} y={36} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="15" fontWeight="700" fill="#FBBF24" stroke="#070A12" strokeWidth="4" paintOrder="stroke">
                {frame.activeGate}
              </text>
            )}
          </svg>
        </div>

        {/* State readout */}
        <div className="w-full shrink-0 space-y-3 rounded-xl border border-line bg-raised/60 p-3.5 md:w-56">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-faint">State</div>
            <p className="tnum mt-1.5 break-all font-mono text-[12px] leading-relaxed text-fg">
              |ψ⟩ = <span className="text-brand-bright">{frame.alpha}</span>·|0⟩
              <br />
              &emsp;+ <span className="text-accent">{frame.beta}</span>·|1⟩
            </p>
          </div>
          <ProbBar label="P(measure 0)" p={frame.p0} color="#A78BFA" />
          <ProbBar label="P(measure 1)" p={frame.p1} color="#22D3EE" />
          <p className="tnum font-mono text-[10px] leading-relaxed text-faint">
            x {frame.x.toFixed(2)} · y {frame.y.toFixed(2)} · z {frame.z.toFixed(2)}
          </p>
        </div>
      </div>
      <div className="border-t border-line/60 py-2">
        <Legend items={LEGEND_ITEMS} />
      </div>
    </div>
  );
}
