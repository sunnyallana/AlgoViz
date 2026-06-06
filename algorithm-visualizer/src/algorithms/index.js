import { Atom, BarChart3, ScanSearch, Shapes, Sigma } from 'lucide-react';
import { sortingAlgorithms } from './sorting';
import { searchingAlgorithms } from './searching';
import { geometryAlgorithms } from './geometry';
import { mathAlgorithms } from './maths';
import { quantumAlgorithms } from './quantum';

export const CATEGORIES = [
  {
    id: 'sorting',
    label: 'Sorting',
    icon: BarChart3,
    blurb: 'Watch lists rearrange themselves into order, swap by swap.',
    accent: '#8B5CF6',
  },
  {
    id: 'searching',
    label: 'Searching',
    icon: ScanSearch,
    blurb: 'Find a value fast — and see why sorted data changes everything.',
    accent: '#22D3EE',
  },
  {
    id: 'geometry',
    label: 'Geometry',
    icon: Shapes,
    blurb: 'Points on a plane: closest pairs and rubber-band hulls.',
    accent: '#34D399',
  },
  {
    id: 'maths',
    label: 'Math',
    icon: Sigma,
    blurb: 'Big-number tricks, prime sieves and the oldest algorithm of all.',
    accent: '#FBBF24',
  },
  {
    id: 'quantum',
    label: 'Quantum',
    icon: Atom,
    blurb: 'Qubits, superposition and interference — exactly simulated, honestly explained.',
    accent: '#F472B6',
  },
];

export const ALGORITHMS = [
  ...sortingAlgorithms,
  ...searchingAlgorithms,
  ...geometryAlgorithms,
  ...mathAlgorithms,
  ...quantumAlgorithms,
];

const byId = Object.fromEntries(ALGORITHMS.map((a) => [a.id, a]));

export const getAlgorithm = (id) => byId[id];
export const algorithmsInCategory = (categoryId) =>
  ALGORITHMS.filter((a) => a.category === categoryId);
export const getCategory = (id) => CATEGORIES.find((c) => c.id === id);

export const DEFAULT_ALGORITHM_ID = 'bubble-sort';
