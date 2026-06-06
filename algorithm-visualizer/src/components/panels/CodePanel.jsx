import { useEffect, useRef } from 'react';

/** Pseudocode listing with the currently-executing line highlighted in sync. */
export default function CodePanel({ pseudocode, activeLine }) {
  const activeRef = useRef(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' });
  }, [activeLine]);

  return (
    <ol className="py-2 font-mono text-[12px] sm:text-[12.5px]" aria-label="Pseudocode">
      {pseudocode.map((line, i) => {
        const active = activeLine === i;
        return (
          <li
            key={i}
            ref={active ? activeRef : undefined}
            className={`flex gap-3 whitespace-pre-wrap border-l-2 px-3 py-[5px] leading-relaxed transition-colors duration-150 ${
              active ? 'border-brand bg-brand-ghost text-fg' : 'border-transparent text-muted'
            }`}
          >
            <span className={`tnum w-4 shrink-0 select-none text-right ${active ? 'text-brand-bright' : 'text-faint'}`}>
              {i + 1}
            </span>
            <span>{line}</span>
          </li>
        );
      })}
    </ol>
  );
}
