/** Colour key rendered under every canvas so each state is self-explanatory. */
export default function Legend({ items }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 px-2" aria-hidden="true">
      {items.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
            style={{ background: it.color, opacity: it.dim ? 0.35 : 1 }}
          />
          {it.label}
        </span>
      ))}
    </div>
  );
}
