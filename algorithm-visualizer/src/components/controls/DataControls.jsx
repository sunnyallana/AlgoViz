import { useEffect, useState } from 'react';
import { Shuffle, Dices, Eraser, Target, CircleSlash, Equal, Info, Eye, Undo2, RotateCcw } from 'lucide-react';
import { SORT_PRESETS, randInt } from '../../lib/data';
import { BLOCH_GATES, validShorBases } from '../../lib/quantum';
import { Btn, Chip, SliderRow, TextInput } from '../ui';

// ─── Sorting ─────────────────────────────────────────────────────────────────

function SortControls({ s }) {
  const [showCustom, setShowCustom] = useState(false);
  const [customText, setCustomText] = useState('');
  const [error, setError] = useState('');

  const submitCustom = (e) => {
    e.preventDefault();
    const parts = customText.split(/[\s,]+/).filter(Boolean);
    if (parts.length < 2 || parts.length > 60) {
      setError('Enter between 2 and 60 numbers.');
      return;
    }
    const nums = parts.map(Number);
    if (nums.some((v) => !Number.isInteger(v) || v < 1 || v > 999)) {
      setError('Whole numbers from 1 to 999 only.');
      return;
    }
    setError('');
    s.applyCustom(nums);
  };

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
        <SliderRow label="Size" value={s.size} min={5} max={60} onChange={s.setSize} />
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Data preset">
          {SORT_PRESETS.map((p) => (
            <Chip key={p.id} active={s.preset === p.id && !showCustom} onClick={() => { setShowCustom(false); s.setPreset(p.id); }}>
              {p.label}
            </Chip>
          ))}
          <Chip active={showCustom} onClick={() => setShowCustom((v) => !v)}>
            Custom…
          </Chip>
        </div>
        <Btn icon={Shuffle} onClick={s.regenerate}>New data</Btn>
      </div>
      {showCustom && (
        <form onSubmit={submitCustom} className="flex flex-wrap items-center gap-2">
          <TextInput
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Your own numbers, e.g. 34, 7, 92, 18"
            className="w-64 max-w-full flex-1"
            aria-label="Custom array values"
          />
          <Btn variant="solid" type="submit" onClick={submitCustom}>Visualize it</Btn>
          {error && <span className="text-xs font-medium text-action" role="alert">{error}</span>}
        </form>
      )}
    </div>
  );
}

// ─── Searching ───────────────────────────────────────────────────────────────

function SearchControls({ s, requiresSorted }) {
  const [text, setText] = useState(String(s.target));

  // Stay in sync when target changes from the buttons
  useEffect(() => setText(String(s.target)), [s.target]);

  const onChange = (e) => {
    const t = e.target.value;
    if (!/^-?\d{0,4}$/.test(t)) return;
    setText(t);
    const v = Number(t);
    if (t !== '' && t !== '-' && Number.isInteger(v)) s.applyTarget(v);
  };

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
      <SliderRow label="Size" value={s.size} min={5} max={30} onChange={s.setSize} />
      <label className="flex items-center gap-2 text-xs font-medium text-muted">
        Target
        <TextInput value={text} onChange={onChange} inputMode="numeric" className="w-16 text-center" aria-label="Search target" />
      </label>
      <div className="flex items-center gap-1.5">
        <Btn icon={Target} onClick={s.pickHit} title="Pick a value that exists in the array">Pick existing</Btn>
        <Btn icon={CircleSlash} onClick={s.pickMiss} title="Pick a value that is not in the array">Pick missing</Btn>
        <Btn icon={Shuffle} onClick={s.regenerate}>New data</Btn>
      </div>
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-faint">
        <Info size={12} aria-hidden="true" />
        {requiresSorted ? 'This algorithm needs sorted data — the array is kept sorted.' : 'Linear search makes no assumptions — the array is unsorted.'}
      </span>
    </div>
  );
}

// ─── Geometry ────────────────────────────────────────────────────────────────

function GeoControls({ g }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
      <SliderRow label="Points" value={g.count} min={3} max={20} onChange={g.setCount} />
      <div className="flex items-center gap-1.5">
        <Btn icon={Dices} onClick={g.regenerate}>Randomize</Btn>
        <Btn icon={Eraser} variant="danger" onClick={g.clear}>Clear</Btn>
      </div>
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-faint">
        <Info size={12} aria-hidden="true" />
        Tip: click anywhere on the canvas to place your own points.
      </span>
    </div>
  );
}

// ─── Math ────────────────────────────────────────────────────────────────────

function MathControls({ m, algorithm }) {
  const { maxDigits, maxDigitsB, maxB, verb = 'Multiply', symbol = '×', inputKind, minLimit, maxLimit } = algorithm;
  const limB = maxDigitsB ?? maxDigits;
  const [aText, setAText] = useState(m.a);
  const [bText, setBText] = useState(m.b);
  const [error, setError] = useState('');

  useEffect(() => { setAText(m.a); setBText(m.b); }, [m.a, m.b]);

  if (inputKind === 'limit') {
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
        <SliderRow
          label="Find primes up to"
          value={m.limit}
          min={minLimit}
          max={maxLimit}
          onChange={m.setLimit}
          width="w-44 sm:w-64"
        />
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-faint">
          <Info size={12} aria-hidden="true" />
          Drag the slider — the sieve rebuilds instantly.
        </span>
      </div>
    );
  }

  const sanitizeA = (raw) => raw.replace(/\D/g, '').slice(0, maxDigits);
  const sanitizeB = (raw) => raw.replace(/\D/g, '').slice(0, limB);

  const submit = (e) => {
    e.preventDefault();
    if (!/^\d+$/.test(aText) || !/^\d+$/.test(bText)) {
      setError('Both numbers are required (digits only).');
      return;
    }
    if (maxB && Number(bText) > maxB) {
      setError(`Keep the exponent at ${maxB} or below — the numbers get astronomically long.`);
      return;
    }
    setError('');
    m.apply(aText.replace(/^0+(?=\d)/, ''), bText.replace(/^0+(?=\d)/, ''));
  };

  const randomize = () => {
    const digits = (len) => {
      let out = String(randInt(1, 9));
      for (let i = 1; i < len; i++) out += String(randInt(0, 9));
      return out;
    };
    setError('');
    if (maxB) {
      m.apply(digits(randInt(1, maxDigits)), String(randInt(2, maxB)));
    } else {
      m.apply(digits(randInt(3, maxDigits)), digits(randInt(3, maxDigits)));
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-x-3 gap-y-2.5">
      <TextInput
        value={aText}
        onChange={(e) => setAText(sanitizeA(e.target.value))}
        inputMode="numeric"
        className="w-32"
        aria-label="First number"
        placeholder="First number"
      />
      <span className="font-mono text-sm font-semibold text-muted" aria-hidden="true">{symbol}</span>
      <TextInput
        value={bText}
        onChange={(e) => setBText(sanitizeB(e.target.value))}
        inputMode="numeric"
        className={maxB ? 'w-20' : 'w-32'}
        aria-label="Second number"
        placeholder={maxB ? 'Exponent' : 'Second number'}
      />
      <Btn icon={Equal} variant="solid" type="submit" onClick={submit}>{verb}</Btn>
      <Btn icon={Dices} onClick={randomize}>Random</Btn>
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-faint">
        <Info size={12} aria-hidden="true" />
        {maxB ? `Base up to ${maxDigits} digits, exponent up to ${maxB}.` : `Up to ${maxDigits} digits each.`}
      </span>
      {error && <span className="text-xs font-medium text-action" role="alert">{error}</span>}
    </form>
  );
}

// ─── Quantum ─────────────────────────────────────────────────────────────────

const GATE_KEYS = ['X', 'Y', 'Z', 'H', 'S', 'Sdg', 'T', 'Tdg'];
const DEUTSCH_OPTIONS = [
  { id: 'const0', label: 'f(x) = 0' },
  { id: 'const1', label: 'f(x) = 1' },
  { id: 'id', label: 'f(x) = x' },
  { id: 'not', label: 'f(x) = NOT x' },
];

function QuantumControls({ q, algorithm }) {
  const id = algorithm.id;

  if (id === 'bloch-sphere') {
    const seq = q.ops
      .map((op) => (op.type === 'gate' ? BLOCH_GATES[op.g].label : `M→${op.outcome}`))
      .join(' · ');
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5">
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Quantum gates">
          {GATE_KEYS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => q.addGate(g)}
              title={`Apply ${BLOCH_GATES[g].label}`}
              className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-line bg-raised font-mono text-sm font-bold text-muted transition-colors duration-150 hover:border-brand hover:text-brand-bright"
            >
              {BLOCH_GATES[g].label}
            </button>
          ))}
        </div>
        <Btn icon={Eye} variant="solid" onClick={q.measure}>Measure</Btn>
        <Btn icon={Undo2} onClick={q.undo} disabled={q.ops.length === 0}>Undo</Btn>
        <Btn icon={RotateCcw} variant="danger" onClick={q.resetOps} disabled={q.ops.length === 0}>Reset</Btn>
        {seq && (
          <span className="tnum max-w-full truncate rounded-lg border border-line bg-raised px-2.5 py-1.5 font-mono text-[11px] text-muted" title={seq}>
            {seq}
          </span>
        )}
      </div>
    );
  }

  if (id === 'deutsch') {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5">
        <span className="text-xs font-medium text-muted">Mystery function:</span>
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Oracle function">
          {DEUTSCH_OPTIONS.map((o) => (
            <Chip key={o.id} active={q.deutschF === o.id} onClick={() => q.setDeutschF(o.id)} className="font-mono">
              {o.label}
            </Chip>
          ))}
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-faint">
          <Info size={12} aria-hidden="true" />
          The algorithm sees only the oracle — never the formula.
        </span>
      </div>
    );
  }

  if (id === 'deutsch-jozsa') {
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
        <SliderRow label="Qubits" value={q.dj.n} min={2} max={4} onChange={q.setDjN} width="w-24" />
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Oracle type">
          <Chip active={q.dj.oracle === 'const0'} onClick={() => q.setDjOracle('const0')}>Constant 0</Chip>
          <Chip active={q.dj.oracle === 'const1'} onClick={() => q.setDjOracle('const1')}>Constant 1</Chip>
          <Chip active={q.dj.oracle === 'balanced'} onClick={() => q.setDjOracle('balanced')}>Balanced</Chip>
        </div>
        {q.dj.oracle === 'balanced' && (
          <Btn icon={Dices} onClick={q.rerollDj}>New balanced f</Btn>
        )}
      </div>
    );
  }

  if (id === 'grover') {
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
        <SliderRow label="Qubits" value={q.grover.n} min={2} max={4} onChange={q.setGroverN} width="w-24" />
        <span className="inline-flex items-center gap-2 text-xs font-medium text-muted">
          Marked item
          <span className="tnum rounded-lg border border-compare/40 bg-compare/10 px-2.5 py-1.5 font-mono text-xs font-bold text-compare">
            |{q.grover.marked.toString(2).padStart(q.grover.n, '0')}⟩
          </span>
        </span>
        <Btn icon={Dices} onClick={q.randomGrover}>Hide it elsewhere</Btn>
      </div>
    );
  }

  if (id === 'simon') {
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
        <div className="flex items-center gap-1.5" role="group" aria-label="Register size">
          <span className="text-xs font-medium text-muted">Bits:</span>
          <Chip active={q.simon.n === 2} onClick={() => q.setSimonN(2)}>n = 2</Chip>
          <Chip active={q.simon.n === 3} onClick={() => q.setSimonN(3)}>n = 3</Chip>
        </div>
        <span className="inline-flex items-center gap-2 text-xs font-medium text-muted">
          Secret s
          <span className="tnum rounded-lg border border-brand/40 bg-brand-ghost px-2.5 py-1.5 font-mono text-xs font-bold text-brand-bright">
            {q.simon.secret.toString(2).padStart(q.simon.n, '0')}
          </span>
        </span>
        <Btn icon={Dices} onClick={q.rerollSimon}>New secret</Btn>
      </div>
    );
  }

  // shor-period
  const bases = validShorBases(q.shor.N);
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
      <div className="flex items-center gap-1.5" role="group" aria-label="Number to factor">
        <span className="text-xs font-medium text-muted">Factor N:</span>
        {[15, 21, 35].map((N) => (
          <Chip key={N} active={q.shor.N === N} onClick={() => q.setShorN(N)} className="font-mono">{N}</Chip>
        ))}
      </div>
      <label className="flex items-center gap-2 text-xs font-medium text-muted">
        Base a
        <select
          value={q.shor.a}
          onChange={(e) => q.setShorA(Number(e.target.value))}
          className="h-10 cursor-pointer rounded-lg border border-line bg-raised px-2 font-mono text-sm text-fg focus:border-brand focus:outline-none"
          aria-label="Base a"
        >
          {bases.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </label>
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-faint">
        <Info size={12} aria-hidden="true" />
        Only bases whose period leads to factors are listed — unlucky ones just mean &ldquo;rerun&rdquo;.
      </span>
    </div>
  );
}

// ─── Switchboard ─────────────────────────────────────────────────────────────

export default function DataControls({ algorithm, sort, search, geo, math, quantum }) {
  return (
    <div className="card px-3 py-3 sm:px-4">
      {algorithm.category === 'sorting' && <SortControls s={sort} />}
      {algorithm.category === 'searching' && <SearchControls s={search} requiresSorted={algorithm.requiresSorted} />}
      {algorithm.category === 'geometry' && <GeoControls g={geo} />}
      {algorithm.category === 'maths' && <MathControls m={math} algorithm={algorithm} />}
      {algorithm.category === 'quantum' && <QuantumControls q={quantum} algorithm={algorithm} />}
    </div>
  );
}
