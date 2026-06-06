import { useRef } from 'react';
import Legend from './Legend';

// Data space is 100 × 62, rendered into an 800 × 496 viewBox with y flipped
// so "up" in the math is up on screen.
const S = 8;
const W = 800;
const H = 496;
const sx = (x) => x * S;
const sy = (y) => H - y * S;

const PAIR_LEGEND = [
  { label: 'Point', color: '#8B5CF6' },
  { label: 'Measuring', color: '#FBBF24' },
  { label: 'Closest pair so far', color: '#34D399' },
  { label: 'Candidate strip', color: '#22D3EE' },
  { label: 'Outside sub-problem', color: '#8B5CF6', dim: true },
];

const HULL_LEGEND = [
  { label: 'Point', color: '#8B5CF6' },
  { label: 'Candidate', color: '#FBBF24' },
  { label: 'Hull chain', color: '#A78BFA' },
  { label: 'Removed edge', color: '#FB7185' },
  { label: 'Hull complete', color: '#34D399' },
];

const dist = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);

function pointFill(i, frame) {
  if (frame.highlight.includes(i)) return '#34D399';
  if (frame.candidate === i) return '#FBBF24';
  if (frame.compare && frame.compare.includes(i)) return '#FBBF24';
  if (frame.best && frame.best.includes(i)) return '#34D399';
  if (frame.hull.includes(i) || frame.hullDone.includes(i)) return '#A78BFA';
  return '#8B5CF6';
}

export default function GeometryCanvas({ frame, points, mode, onAddPoint, interactive }) {
  const svgRef = useRef(null);

  const handleClick = (e) => {
    if (!interactive || !onAddPoint || !svgRef.current) return;
    const ctm = svgRef.current.getScreenCTM();
    if (!ctm) return;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    const x = p.x / S;
    const y = (H - p.y) / S;
    if (x < 4 || x > 96 || y < 4 || y > 58) return;
    onAddPoint({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
  };

  const showLabels = points.length <= 14;
  const dimmed = (i) => frame.activeSet && !frame.activeSet.includes(i);
  const chainToPath = (ids) => ids.map((id) => `${sx(points[id].x)},${sy(points[id].y)}`).join(' ');

  return (
    <div className="flex h-full w-full flex-col">
      <div className="relative min-h-0 flex-1 p-2 sm:p-3">
        {/* Corner status chip */}
        <div className="pointer-events-none absolute left-4 top-4 z-10 flex flex-col items-start gap-1.5">
          {mode === 'pairs' && frame.bestDist !== null && frame.bestDist !== undefined && (
            <span className="rounded-full border border-mint/40 bg-abyss/80 px-2.5 py-1 font-mono text-[11px] font-semibold text-mint backdrop-blur">
              closest so far: {frame.bestDist.toFixed(1)}
            </span>
          )}
          {mode === 'hull' && (frame.hull.length > 0 || frame.hullClosed) && (
            <span className="rounded-full border border-brand/40 bg-abyss/80 px-2.5 py-1 font-mono text-[11px] font-semibold text-brand-bright backdrop-blur">
              {frame.hullClosed ? `hull: ${frame.hull.length} points` : `chain: ${frame.hull.length} points`}
            </span>
          )}
        </div>
        {interactive && (
          <span className="pointer-events-none absolute right-4 top-4 z-10 rounded-full border border-line-bright bg-abyss/80 px-2.5 py-1 text-[11px] font-medium text-muted backdrop-blur">
            Click the canvas to add points
          </span>
        )}
        {points.length === 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <p className="max-w-xs text-center text-sm text-muted">
              No points yet — click anywhere on the canvas or press <span className="text-fg">Randomize</span>.
            </p>
          </div>
        )}

        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className={`h-full w-full rounded-xl border border-line bg-abyss/60 ${interactive ? 'cursor-crosshair' : ''}`}
          onClick={handleClick}
          role="img"
          aria-label={`${points.length} points on a plane. ${frame.message}`}
        >
          <defs>
            <pattern id="gv-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1E2740" strokeWidth="1" opacity="0.55" />
            </pattern>
          </defs>
          <rect width={W} height={H} fill="url(#gv-grid)" />

          {/* Candidate strip (divide & conquer) */}
          {frame.strip && (
            <g>
              <rect
                x={sx(frame.strip[0])}
                y={0}
                width={sx(frame.strip[1]) - sx(frame.strip[0])}
                height={H}
                fill="rgba(34, 211, 238, 0.07)"
              />
              <line x1={sx(frame.strip[0])} y1={0} x2={sx(frame.strip[0])} y2={H} stroke="rgba(34,211,238,0.35)" strokeWidth="1.5" strokeDasharray="5 5" />
              <line x1={sx(frame.strip[1])} y1={0} x2={sx(frame.strip[1])} y2={H} stroke="rgba(34,211,238,0.35)" strokeWidth="1.5" strokeDasharray="5 5" />
            </g>
          )}

          {/* Divide line */}
          {frame.divideX !== null && (
            <line
              x1={sx(frame.divideX)}
              y1={0}
              x2={sx(frame.divideX)}
              y2={H}
              stroke="#94A0B8"
              strokeWidth="1.5"
              strokeDasharray="7 6"
              opacity="0.7"
            />
          )}

          {/* Completed hull chain (kept visible while the other chain builds) */}
          {frame.hullDone.length > 1 && (
            <polyline points={chainToPath(frame.hullDone)} fill="none" stroke="#7C3AED" strokeWidth="2" opacity="0.55" />
          )}

          {/* Active hull chain / final hull */}
          {frame.hull.length > 1 &&
            (frame.hullClosed ? (
              <polygon points={chainToPath(frame.hull)} fill="rgba(139,92,246,0.10)" stroke="#A78BFA" strokeWidth="2.5" strokeLinejoin="round" />
            ) : (
              <polyline points={chainToPath(frame.hull)} fill="none" stroke="#A78BFA" strokeWidth="2.5" strokeLinejoin="round" />
            ))}

          {/* Candidate → chain-end connector */}
          {frame.candidate !== null && frame.hull.length > 0 && (
            <line
              x1={sx(points[frame.hull[frame.hull.length - 1]].x)}
              y1={sy(points[frame.hull[frame.hull.length - 1]].y)}
              x2={sx(points[frame.candidate].x)}
              y2={sy(points[frame.candidate].y)}
              stroke="#FBBF24"
              strokeWidth="1.75"
              strokeDasharray="5 4"
              opacity="0.8"
            />
          )}

          {/* Rejected edge flash */}
          {frame.rejectedEdge && (
            <line
              x1={sx(points[frame.rejectedEdge[0]].x)}
              y1={sy(points[frame.rejectedEdge[0]].y)}
              x2={sx(points[frame.rejectedEdge[1]].x)}
              y2={sy(points[frame.rejectedEdge[1]].y)}
              stroke="#FB7185"
              strokeWidth="2.5"
              strokeDasharray="4 4"
            />
          )}

          {/* Best pair so far — soft glow + solid line */}
          {frame.best && (
            <g>
              <line
                x1={sx(points[frame.best[0]].x)}
                y1={sy(points[frame.best[0]].y)}
                x2={sx(points[frame.best[1]].x)}
                y2={sy(points[frame.best[1]].y)}
                stroke="#34D399"
                strokeWidth="8"
                opacity="0.22"
                strokeLinecap="round"
              />
              <line
                x1={sx(points[frame.best[0]].x)}
                y1={sy(points[frame.best[0]].y)}
                x2={sx(points[frame.best[1]].x)}
                y2={sy(points[frame.best[1]].y)}
                stroke="#34D399"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </g>
          )}

          {/* Pair being measured + distance label */}
          {frame.compare && (
            <g>
              <line
                x1={sx(points[frame.compare[0]].x)}
                y1={sy(points[frame.compare[0]].y)}
                x2={sx(points[frame.compare[1]].x)}
                y2={sy(points[frame.compare[1]].y)}
                stroke="#FBBF24"
                strokeWidth="1.75"
                strokeDasharray="6 4"
              />
              <text
                x={(sx(points[frame.compare[0]].x) + sx(points[frame.compare[1]].x)) / 2}
                y={(sy(points[frame.compare[0]].y) + sy(points[frame.compare[1]].y)) / 2 - 8}
                fill="#FBBF24"
                fontSize="13"
                fontFamily="JetBrains Mono, monospace"
                fontWeight="600"
                textAnchor="middle"
                stroke="#070A12"
                strokeWidth="3.5"
                paintOrder="stroke"
              >
                {dist(points[frame.compare[0]], points[frame.compare[1]]).toFixed(1)}
              </text>
            </g>
          )}

          {/* Points */}
          {points.map((p, i) => {
            const fill = pointFill(i, frame);
            const isCandidate = frame.candidate === i;
            const emphasized = fill !== '#8B5CF6';
            return (
              <g key={i} opacity={dimmed(i) ? 0.22 : 1} style={{ transition: 'opacity 200ms ease' }}>
                {emphasized && <circle cx={sx(p.x)} cy={sy(p.y)} r={isCandidate ? 14 : 12} fill={fill} opacity="0.25" />}
                <circle
                  cx={sx(p.x)}
                  cy={sy(p.y)}
                  r={isCandidate ? 8 : 6.5}
                  fill={fill}
                  stroke="#070A12"
                  strokeWidth="2"
                />
                {showLabels && (
                  <text
                    x={sx(p.x)}
                    y={sy(p.y) + 21}
                    fill="#94A0B8"
                    fontSize="11"
                    fontFamily="JetBrains Mono, monospace"
                    textAnchor="middle"
                    stroke="#070A12"
                    strokeWidth="3"
                    paintOrder="stroke"
                  >
                    P{i}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="border-t border-line/60 py-2">
        <Legend items={mode === 'hull' ? HULL_LEGEND : PAIR_LEGEND} />
      </div>
    </div>
  );
}
