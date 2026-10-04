import { spawn } from 'child_process';
import crypto from 'crypto';
import { JS_HARNESS, PY_HARNESS } from './harness';
import { valuesMatch, rowsMatch } from './compare';
import type { CaseResult, ExecutionRequest, ExecutionResult, Verdict } from './types';

export interface RunnerOptions {
  pythonBin?: string;
  nodeBin?: string;
  maxConcurrency?: number;
  /** Hard ceiling on a single run regardless of test count. */
  maxWallMs?: number;
  /** Extra environment for child processes (e.g. ELECTRON_RUN_AS_NODE in the desktop app). */
  extraEnv?: Record<string, string>;
  /** Node sandbox flags; defaults to the Node permission model. */
  jsSandboxFlags?: string[];
}

const MAX_OUTPUT_BYTES = 2 * 1024 * 1024;
const STARTUP_ALLOWANCE_MS = 1500;
const DISPLAY_LIMIT = 500;

const clip = (s: string) => (s.length > DISPLAY_LIMIT ? s.slice(0, DISPLAY_LIMIT) + '…' : s);
const show = (v: unknown) => clip(JSON.stringify(v));

/** Simple counting semaphore so a burst of submissions can't fork-bomb the host. */
class Semaphore {
  private waiters: Array<() => void> = [];
  constructor(private available: number) {}
  async acquire(): Promise<void> {
    if (this.available > 0) { this.available--; return; }
    await new Promise<void>((resolve) => this.waiters.push(resolve));
  }
  release(): void {
    const next = this.waiters.shift();
    if (next) next(); else this.available++;
  }
}

interface RawOutcome {
  cases: Map<string, { ok: boolean; value?: unknown; error?: string; timeMs: number }>;
  compileError?: string;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  wallMs: number;
}

export class CodeRunner {
  private sem: Semaphore;
  constructor(private opts: RunnerOptions = {}) {
    this.sem = new Semaphore(opts.maxConcurrency ?? 4);
  }

  async run(req: ExecutionRequest): Promise<ExecutionResult> {
    if (!req.tests.length) throw new Error('No test cases supplied');
    await this.sem.acquire();
    try {
      const raw = await this.spawnHarness(req);
      return this.grade(req, raw);
    } finally {
      this.sem.release();
    }
  }

  private spawnHarness(req: ExecutionRequest): Promise<RawOutcome> {
    const nonce = `\u0001${crypto.randomBytes(8).toString('hex')}:`;
    const isSql = req.language === 'sql';
    const payload = isSql
      ? { nonce, mode: 'sql', code: req.code, setup: req.sql_meta!.setup, tests: req.tests.map((t) => ({ id: t.id })) }
      : {
          nonce,
          code: req.code,
          fn: req.code_meta!.functionName,
          params: req.code_meta!.params.map((p) => p.type),
          returnType: req.code_meta!.returnType,
          tests: req.tests.map((t) => ({ id: t.id, args: t.args ?? [] })),
        };

    const [cmd, args] =
      req.language === 'javascript'
        ? [this.opts.nodeBin ?? process.execPath, [...(this.opts.jsSandboxFlags ?? ['--permission']), '--max-old-space-size=256', '--stack-size=4000', '-e', JS_HARNESS]]
        : [this.opts.pythonBin ?? 'python', ['-I', '-S', '-X', 'utf8', '-c', PY_HARNESS]];

    const budget = Math.min(
      this.opts.maxWallMs ?? 20000,
      STARTUP_ALLOWANCE_MS + req.timeLimitMs * Math.max(1, req.tests.length)
    );

    return new Promise((resolve) => {
      const started = Date.now();
      // Minimal environment: no secrets from the API process leak into user code.
      const env: NodeJS.ProcessEnv = { PATH: process.env.PATH, PYTHONIOENCODING: 'utf-8', ...this.opts.extraEnv };
      if (process.platform === 'win32') env.SYSTEMROOT = process.env.SYSTEMROOT;

      const child = spawn(cmd, args, { env, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
      let stdout = '', stderr = '', bytes = 0, timedOut = false, settled = false;

      const finish = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(this.parse(stdout, stderr, nonce, timedOut, Date.now() - started));
      };

      const timer = setTimeout(() => { timedOut = true; child.kill('SIGKILL'); }, budget);

      child.stdout.on('data', (d: Buffer) => {
        bytes += d.length;
        if (bytes > MAX_OUTPUT_BYTES) { child.kill('SIGKILL'); return; }
        stdout += d.toString('utf8');
      });
      child.stderr.on('data', (d: Buffer) => { if (stderr.length < 8192) stderr += d.toString('utf8'); });
      child.on('error', (err) => { stderr += `\nFailed to start ${cmd}: ${err.message}`; finish(); });
      child.on('close', finish);
      child.stdin.on('error', () => { /* child exited before reading stdin */ });
      child.stdin.end(JSON.stringify(payload));
    });
  }

  private parse(stdout: string, stderr: string, nonce: string, timedOut: boolean, wallMs: number): RawOutcome {
    const out: RawOutcome = { cases: new Map(), stdout: '', stderr, timedOut, wallMs };
    for (const line of stdout.split('\n')) {
      if (!line.startsWith(nonce)) continue;
      const rest = line.slice(nonce.length);
      const sp = rest.indexOf(' ');
      const kind = rest.slice(0, sp);
      let body: any;
      try { body = JSON.parse(rest.slice(sp + 1)); } catch { continue; }
      if (kind === 'CASE') out.cases.set(String(body.id), body);
      else if (kind === 'COMPILE') out.compileError = String(body.error);
      else if (kind === 'DONE') out.stdout = String(body.stdout ?? '');
    }
    return out;
  }

  private grade(req: ExecutionRequest, raw: RawOutcome): ExecutionResult {
    const base = { total: req.tests.length, executionTimeMs: Math.round(raw.wallMs), stdout: raw.stdout };

    if (raw.compileError) {
      return { ...base, verdict: 'ERROR', passed: 0, compileError: raw.compileError, cases: [] };
    }

    const cases: CaseResult[] = [];
    for (const tc of req.tests) {
      const r = raw.cases.get(tc.id);
      const hidden = !!tc.hidden;
      const visible = hidden ? {} : {
        input: tc.args ? clip(tc.args.map((a) => JSON.stringify(a)).join(', ')) : undefined,
        expected: show(tc.expected),
      };
      if (!r) {
        // No result: the process was killed (timeout) or crashed before reaching this case.
        const status = raw.timedOut ? 'TLE' : 'ERROR';
        cases.push({
          caseId: tc.id, status, timeMs: 0, hidden, ...visible,
          error: status === 'TLE' ? `Time limit exceeded (${req.timeLimitMs} ms per test)` : clip(cleanStderr(raw.stderr) || 'Process exited unexpectedly'),
        });
        continue;
      }
      const timeMs = Math.round(r.timeMs * 100) / 100;
      if (!r.ok) {
        cases.push({ caseId: tc.id, status: 'ERROR', timeMs, hidden, ...visible, error: clip(r.error ?? 'Runtime error') });
        continue;
      }
      const ok =
        req.language === 'sql'
          ? rowsMatch(r.value, tc.expected as unknown[][], req.sql_meta!.orderMatters)
          : valuesMatch(r.value, tc.expected, req.code_meta!.compare);
      const tle = timeMs > req.timeLimitMs;
      cases.push({
        caseId: tc.id,
        status: tle ? 'TLE' : ok ? 'PASS' : 'FAIL',
        timeMs, hidden, ...visible,
        actual: hidden ? undefined : show(r.value),
      });
    }

    const passed = cases.filter((c) => c.status === 'PASS').length;
    let verdict: Verdict;
    if (passed === cases.length) verdict = 'ACCEPTED';
    else if (cases.some((c) => c.status === 'TLE')) verdict = 'TLE';
    else if (passed === 0 && cases.every((c) => c.status === 'ERROR')) verdict = 'ERROR';
    else if (passed > 0) verdict = 'PARTIAL';
    else verdict = 'WRONG';

    return { ...base, verdict, passed, cases };
  }
}

function cleanStderr(s: string): string {
  return s.split('\n').filter((l) => l.trim() && !l.includes('node:internal')).slice(-3).join('\n');
}
