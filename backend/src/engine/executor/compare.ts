import type { CompareMode } from './types';

const canon = (v: unknown): string => JSON.stringify(v);

function sortByCanon(arr: unknown[]): unknown[] {
  return [...arr].sort((a, b) => (canon(a) < canon(b) ? -1 : canon(a) > canon(b) ? 1 : 0));
}

function approxEqual(a: unknown, b: unknown): boolean {
  if (typeof a === 'number' && typeof b === 'number') {
    return Math.abs(a - b) <= 1e-5 * Math.max(1, Math.abs(a), Math.abs(b));
  }
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, i) => approxEqual(x, b[i]));
  return canon(a) === canon(b);
}

/** Compare a program's output with the expected value under the question's comparison mode. */
export function valuesMatch(actual: unknown, expected: unknown, mode: CompareMode = 'exact'): boolean {
  switch (mode) {
    case 'float':
      return approxEqual(actual, expected);
    case 'unordered':
      return Array.isArray(actual) && Array.isArray(expected) && canon(sortByCanon(actual)) === canon(sortByCanon(expected));
    case 'unorderedNested': {
      if (!Array.isArray(actual) || !Array.isArray(expected)) return false;
      const norm = (outer: unknown[]) => sortByCanon(outer.map((inner) => (Array.isArray(inner) ? sortByCanon(inner) : inner)));
      return canon(norm(actual)) === canon(norm(expected));
    }
    default:
      return canon(actual) === canon(expected);
  }
}

/** SQL result rows: numbers are rounded so 120 and 120.0 compare equal. */
export function rowsMatch(actual: unknown, expected: unknown[][], orderMatters: boolean): boolean {
  if (!Array.isArray(actual)) return false;
  const norm = (rows: unknown[]) =>
    rows.map((r) => (Array.isArray(r) ? r.map((v) => (typeof v === 'number' ? Math.round(v * 10000) / 10000 : v)) : r));
  const a = norm(actual), e = norm(expected);
  return orderMatters ? canon(a) === canon(e) : canon(sortByCanon(a)) === canon(sortByCanon(e));
}
