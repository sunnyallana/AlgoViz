import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { CATEGORIES, algorithmsInCategory } from '../../algorithms';
import { Logo } from './Header';

const DIFFICULTY_DOT = {
  Beginner: '#34D399',
  Intermediate: '#FBBF24',
  Advanced: '#FB7185',
};

function NavContent({ selectedId, onSelect }) {
  return (
    <nav className="space-y-6 p-4" aria-label="Algorithms">
      {CATEGORIES.map((cat) => (
        <div key={cat.id}>
          <div className="flex items-center gap-2 px-2 text-[11px] font-semibold uppercase tracking-widest text-faint">
            <cat.icon size={13} style={{ color: cat.accent }} aria-hidden="true" />
            {cat.label}
          </div>
          <ul className="mt-2 space-y-0.5">
            {algorithmsInCategory(cat.id).map((a) => {
              const active = selectedId === a.id;
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(a.id)}
                    aria-current={active ? 'page' : undefined}
                    className={`flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition-colors duration-150 ${
                      active ? 'bg-brand-ghost text-brand-bright' : 'text-muted hover:bg-raised hover:text-fg'
                    }`}
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: DIFFICULTY_DOT[a.difficulty] }}
                      title={a.difficulty}
                    />
                    {a.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <div className="px-2 pb-2 text-[10px] leading-relaxed text-faint">
        <span className="mr-2 inline-flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full" style={{ background: DIFFICULTY_DOT.Beginner }} />Beginner</span>
        <span className="mr-2 inline-flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full" style={{ background: DIFFICULTY_DOT.Intermediate }} />Intermediate</span>
        <span className="inline-flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full" style={{ background: DIFFICULTY_DOT.Advanced }} />Advanced</span>
      </div>
    </nav>
  );
}

export default function Sidebar({ selectedId, onSelect, mobileOpen, onClose }) {
  return (
    <>
      {/* Desktop rail */}
      <aside className="hidden w-60 shrink-0 overflow-y-auto border-r border-line bg-panel lg:block lg:min-h-0">
        <NavContent selectedId={selectedId} onSelect={onSelect} />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              aria-hidden="true"
            />
            <motion.aside
              className="fixed bottom-0 left-0 top-0 z-50 w-72 overflow-y-auto border-r border-line bg-panel lg:hidden"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
              role="dialog"
              aria-modal="true"
              aria-label="Algorithm menu"
            >
              <div className="flex h-14 items-center justify-between border-b border-line px-4">
                <Logo />
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors duration-200 hover:bg-raised hover:text-fg"
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>
              <NavContent
                selectedId={selectedId}
                onSelect={(id) => {
                  onSelect(id);
                  onClose();
                }}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
