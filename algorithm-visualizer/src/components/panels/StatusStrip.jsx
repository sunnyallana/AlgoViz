/** Narration strip: what is happening right now, plus live operation counters. */
export default function StatusStrip({ frame }) {
  const stats = Object.entries(frame.stats ?? {});

  return (
    <div className="card flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
      <p className="min-h-[2.4rem] flex-1 text-[13px] leading-snug text-fg/90" aria-live="polite">
        {frame.message}
      </p>
      {stats.length > 0 && (
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          {stats.map(([label, value]) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 rounded-md border border-line bg-raised px-2 py-1 text-[11px] font-medium text-muted"
            >
              {label}
              <span className="tnum font-mono text-xs font-bold text-fg">{value}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
