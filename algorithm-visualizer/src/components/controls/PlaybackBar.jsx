import { Pause, Play, SkipBack, SkipForward, StepBack, StepForward, Gauge } from 'lucide-react';
import { intervalFromSpeed } from '../../hooks/usePlayback';
import { fillStyle } from '../../lib/style';

const transportBtn =
  'inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-line bg-raised text-muted transition-colors duration-200 hover:border-line-bright hover:bg-overlay hover:text-fg disabled:cursor-not-allowed disabled:opacity-35';

export default function PlaybackBar({ pb }) {
  const { index, total, isPlaying, toggle, next, prev, reset, toEnd, seek, speed, setSpeed } = pb;
  const last = Math.max(total - 1, 0);
  const stepsPerSec = 1000 / intervalFromSpeed(speed);

  return (
    <div className="card space-y-2.5 px-3 py-3 sm:px-4">
      {/* Timeline scrubber */}
      <input
        type="range"
        className="slider w-full"
        min={0}
        max={last}
        value={index}
        onChange={(e) => seek(e.target.valueAsNumber)}
        style={fillStyle(index, 0, last)}
        aria-label={`Timeline — step ${index} of ${last}`}
        disabled={total <= 1}
      />

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:grid sm:grid-cols-[1fr_auto_1fr]">
        <span className="tnum order-2 font-mono text-xs text-muted sm:order-1 sm:justify-self-start">
          Step <span className="text-fg">{index}</span> / {last}
        </span>

        <div className="order-1 flex w-full items-center justify-center gap-1.5 sm:order-2 sm:w-auto">
          <button className={transportBtn} onClick={reset} disabled={index === 0} aria-label="Back to start" title="Back to start (R)">
            <SkipBack size={17} />
          </button>
          <button className={transportBtn} onClick={prev} disabled={index === 0} aria-label="Previous step" title="Previous step (←)">
            <StepBack size={17} />
          </button>
          <button
            className="inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-brand text-white shadow-glow-sm transition-all duration-200 hover:bg-brand-bright hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-35"
            onClick={toggle}
            disabled={total <= 1}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
          </button>
          <button className={transportBtn} onClick={next} disabled={index >= last} aria-label="Next step" title="Next step (→)">
            <StepForward size={17} />
          </button>
          <button className={transportBtn} onClick={toEnd} disabled={index >= last} aria-label="Skip to result" title="Skip to result">
            <SkipForward size={17} />
          </button>
        </div>

        <div className="order-3 flex items-center gap-2 sm:justify-self-end">
          <Gauge size={14} className="text-muted" aria-hidden="true" />
          <input
            type="range"
            className="slider w-24 sm:w-28"
            min={0}
            max={100}
            value={Math.round(speed * 100)}
            onChange={(e) => setSpeed(e.target.valueAsNumber / 100)}
            style={fillStyle(speed * 100, 0, 100)}
            aria-label="Playback speed"
          />
          <span className="tnum w-14 font-mono text-[11px] text-muted">{stepsPerSec.toFixed(1)}/s</span>
        </div>
      </div>

      <p className="hidden text-center text-[10px] font-medium tracking-wide text-faint md:block">
        Space — play / pause&ensp;·&ensp;← → — step&ensp;·&ensp;R — reset
      </p>
    </div>
  );
}
