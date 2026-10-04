/**
 * Local (offline) code execution against a question's sample tests.
 *  - Desktop app: delegates to the Electron main process (same sandboxed executor as the server,
 *    JavaScript + Python + SQL).
 *  - Browser: JavaScript only, inside a Web Worker that is terminated on timeout.
 */
import type { ExecutionResult, Language, OfflineQuestion } from './types';

const WORKER_SRC = `
class ListNode { constructor(val = 0, next = null) { this.val = val; this.next = next; } }
class TreeNode { constructor(val = 0, left = null, right = null) { this.val = val; this.left = left; this.right = right; } }
const toList = (a) => { let h = null; for (let i = a.length - 1; i >= 0; i--) h = new ListNode(a[i], h); return h; };
const fromList = (n) => { const r = []; let g = 0; while (n && g++ < 100000) { r.push(n.val); n = n.next; } return r; };
const toTree = (a) => { if (!a.length || a[0] === null) return null; const root = new TreeNode(a[0]); const q = [root]; let i = 1, h = 0;
  while (h < q.length && i < a.length) { const n = q[h++];
    if (i < a.length && a[i] !== null) { n.left = new TreeNode(a[i]); q.push(n.left); } i++;
    if (i < a.length && a[i] !== null) { n.right = new TreeNode(a[i]); q.push(n.right); } i++; }
  return root; };
const fromTree = (root) => { const r = []; const q = [root]; let h = 0;
  while (h < q.length) { const n = q[h++]; if (n) { r.push(n.val); q.push(n.left, n.right); } else r.push(null); }
  while (r.length && r[r.length - 1] === null) r.pop(); return r; };
const dec = (v, t) => t === 'ListNode' ? toList(v) : t === 'TreeNode' ? toTree(v) : v;
const enc = (v, t) => t === 'ListNode' ? fromList(v) : t === 'TreeNode' ? fromTree(v) : v === undefined ? null : v;
self.onmessage = (e) => {
  const { code, fn, params, returnType, tests } = e.data;
  const logs = [];
  const console = { log: (...a) => logs.push(a.map((x) => typeof x === 'string' ? x : JSON.stringify(x)).join(' ')) };
  let entry;
  try {
    entry = new Function('ListNode', 'TreeNode', 'console', code + '\\n;return typeof ' + fn + " === 'function' ? " + fn + " : (typeof Solution === 'function' ? (...a) => new Solution()." + fn + "(...a) : undefined);")(ListNode, TreeNode, console);
  } catch (err) { self.postMessage({ compileError: String(err) }); return; }
  if (typeof entry !== 'function') { self.postMessage({ compileError: 'Function "' + fn + '" is not defined' }); return; }
  for (const tc of tests) {
    const t0 = performance.now();
    try {
      const value = enc(entry(...tc.args.map((a, i) => dec(JSON.parse(JSON.stringify(a)), params[i]))), returnType);
      self.postMessage({ case: { id: tc.id, ok: true, value, timeMs: performance.now() - t0 } });
    } catch (err) {
      self.postMessage({ case: { id: tc.id, ok: false, error: String(err), timeMs: performance.now() - t0 } });
    }
  }
  self.postMessage({ done: true, stdout: logs.join('\\n').slice(0, 16384) });
};
`;

const canon = (v: unknown) => JSON.stringify(v);
const sortCanon = (a: unknown[]) => [...a].sort((x, y) => (canon(x) < canon(y) ? -1 : canon(x) > canon(y) ? 1 : 0));

export function valuesMatch(actual: unknown, expected: unknown, mode = 'exact'): boolean {
  if (mode === 'unordered') return Array.isArray(actual) && Array.isArray(expected) && canon(sortCanon(actual)) === canon(sortCanon(expected));
  if (mode === 'unorderedNested') {
    if (!Array.isArray(actual) || !Array.isArray(expected)) return false;
    const norm = (o: unknown[]) => sortCanon(o.map((i) => (Array.isArray(i) ? sortCanon(i) : i)));
    return canon(norm(actual)) === canon(norm(expected));
  }
  if (mode === 'float' && typeof actual === 'number' && typeof expected === 'number') return Math.abs(actual - expected) < 1e-5 * Math.max(1, Math.abs(expected));
  return canon(actual) === canon(expected);
}

interface CodeMeta { functionName: string; params: Array<{ type: string }>; returnType: string; compare?: string }

export function canRunLocally(language: Language): boolean {
  if (window.trajectoryDesktop) return true;
  return language === 'javascript' && typeof Worker !== 'undefined';
}

export async function runLocally(q: OfflineQuestion, language: Language, code: string): Promise<ExecutionResult> {
  const tests = q.sampleTests.map((t) => ({ ...t, hidden: false }));
  if (window.trajectoryDesktop) {
    return (await window.trajectoryDesktop.runCode({
      language, code, tests, timeLimitMs: q.timeLimitMs,
      code_meta: q.type === 'CODE' ? q.meta : undefined, sql_meta: q.type === 'SQL' ? q.meta : undefined,
    })) as ExecutionResult;
  }
  if (language !== 'javascript') throw new Error('Offline Python/SQL execution needs the Trajectory desktop app.');
  const meta = q.meta as CodeMeta;
  const started = performance.now();
  const blob = new Blob([WORKER_SRC], { type: 'text/javascript' });
  const url = URL.createObjectURL(blob);
  const worker = new Worker(url);
  const results = new Map<string, { ok: boolean; value?: unknown; error?: string; timeMs: number }>();
  let compileError: string | undefined, stdout = '', timedOut = false;

  await new Promise<void>((resolve) => {
    const timer = setTimeout(() => { timedOut = true; worker.terminate(); resolve(); }, 1000 + q.timeLimitMs * tests.length);
    worker.onmessage = (e: MessageEvent) => {
      const m = e.data;
      if (m.compileError) { compileError = m.compileError; clearTimeout(timer); worker.terminate(); resolve(); }
      else if (m.case) results.set(m.case.id, m.case);
      else if (m.done) { stdout = m.stdout; clearTimeout(timer); worker.terminate(); resolve(); }
    };
    worker.postMessage({ code, fn: meta.functionName, params: meta.params.map((p) => p.type), returnType: meta.returnType, tests });
  });
  URL.revokeObjectURL(url);

  const base = { total: tests.length, executionTimeMs: Math.round(performance.now() - started), stdout };
  if (compileError) return { ...base, verdict: 'ERROR', passed: 0, cases: [], compileError };
  const cases = tests.map((t) => {
    const r = results.get(t.id);
    const shown = { input: (t.args ?? []).map((a) => JSON.stringify(a)).join(', '), expected: JSON.stringify(t.expected) };
    if (!r) return { caseId: t.id, status: (timedOut ? 'TLE' : 'ERROR') as 'TLE' | 'ERROR', timeMs: 0, hidden: false, ...shown, error: timedOut ? 'Time limit exceeded' : 'Not run' };
    if (!r.ok) return { caseId: t.id, status: 'ERROR' as const, timeMs: r.timeMs, hidden: false, ...shown, error: r.error };
    const ok = valuesMatch(r.value, t.expected, meta.compare);
    return { caseId: t.id, status: (ok ? 'PASS' : 'FAIL') as 'PASS' | 'FAIL', timeMs: Math.round(r.timeMs * 100) / 100, hidden: false, ...shown, actual: JSON.stringify(r.value) };
  });
  const passed = cases.filter((c) => c.status === 'PASS').length;
  const verdict = passed === cases.length ? 'ACCEPTED' : cases.some((c) => c.status === 'TLE') ? 'TLE' : passed ? 'PARTIAL' : cases.every((c) => c.status === 'ERROR') ? 'ERROR' : 'WRONG';
  return { ...base, verdict, passed, cases };
}
