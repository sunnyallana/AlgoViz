// ─── Tiny shared UI primitives ───────────────────────────────────────────────
import { fillStyle } from '../lib/style';

const BTN_VARIANTS = {
  solid: 'border-transparent bg-brand text-white shadow-glow-sm hover:bg-brand-bright',
  soft: 'border-line bg-raised text-muted hover:border-line-bright hover:bg-overlay hover:text-fg',
  danger: 'border-line bg-raised text-muted hover:border-action/40 hover:bg-action/10 hover:text-action',
};

export function Btn({ icon: Icon, children, variant = 'soft', className = '', ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${BTN_VARIANTS[variant]} ${className}`}
      {...props}
    >
      {Icon && <Icon size={14} aria-hidden="true" />}
      {children}
    </button>
  );
}

export function Chip({ active, children, className = '', ...props }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`h-9 cursor-pointer rounded-full border px-3 text-xs font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? 'border-brand bg-brand-ghost text-brand-bright'
          : 'border-line text-muted hover:border-line-bright hover:text-fg'
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function TextInput({ className = '', ...props }) {
  return (
    <input
      className={`h-10 rounded-lg border border-line bg-raised px-2.5 font-mono text-sm text-fg placeholder:font-sans placeholder:text-faint focus:border-brand focus:outline-none ${className}`}
      {...props}
    />
  );
}

export function SliderRow({ label, value, min, max, onChange, display, width = 'w-32 sm:w-36' }) {
  return (
    <label className="flex items-center gap-2.5 text-xs font-medium text-muted">
      <span className="shrink-0">{label}</span>
      <input
        type="range"
        className={`slider ${width}`}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.valueAsNumber)}
        style={fillStyle(value, min, max)}
        aria-label={label}
      />
      <span className="tnum w-7 shrink-0 text-right font-mono text-sm text-fg">{display ?? value}</span>
    </label>
  );
}
