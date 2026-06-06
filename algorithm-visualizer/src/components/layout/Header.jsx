import { Menu } from 'lucide-react';
import { getCategory } from '../../algorithms';

export function Logo({ onClick }) {
  const inner = (
    <>
      <span className="flex h-8 w-8 items-end justify-center gap-[3px] rounded-lg bg-gradient-to-br from-brand-deep to-brand px-1.5 pb-[7px] pt-2 shadow-glow-sm">
        <span className="w-[3px] rounded-full bg-white/70" style={{ height: 6 }} />
        <span className="w-[3px] rounded-full bg-white/85" style={{ height: 12 }} />
        <span className="w-[3px] rounded-full bg-white/95" style={{ height: 9 }} />
        <span className="w-[3px] rounded-full bg-white" style={{ height: 15 }} />
      </span>
      <span className="font-display text-[17px] font-bold tracking-tight text-fg">AlgoViz</span>
    </>
  );
  if (!onClick) return <span className="inline-flex items-center gap-2.5">{inner}</span>;
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex cursor-pointer items-center gap-2.5 rounded-lg transition-opacity duration-200 hover:opacity-80"
      aria-label="AlgoViz — back to home"
    >
      {inner}
    </button>
  );
}

export default function Header({ algorithm, onMenu, onHome }) {
  const category = getCategory(algorithm.category);

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-line bg-abyss/85 px-3 backdrop-blur-md sm:px-4">
      <button
        type="button"
        onClick={onMenu}
        className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-line bg-raised text-muted transition-colors duration-200 hover:text-fg lg:hidden"
        aria-label="Open algorithm menu"
      >
        <Menu size={19} />
      </button>

      <Logo onClick={onHome} />

      <span className="hidden h-5 w-px shrink-0 bg-line md:block" aria-hidden="true" />

      <div className="hidden min-w-0 flex-1 items-baseline gap-2.5 md:flex">
        <h1 className="shrink-0 font-display text-[15px] font-semibold text-fg">{algorithm.name}</h1>
        <p className="truncate text-xs text-faint">{algorithm.tagline}</p>
      </div>

      <span
        className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold md:ml-0"
        style={{ color: category.accent, borderColor: `${category.accent}55`, background: `${category.accent}14` }}
      >
        <category.icon size={12} aria-hidden="true" />
        {category.label}
      </span>
    </header>
  );
}
