import { describe, it, expect } from 'vitest';
import { QUESTIONS } from '../../src/db/data/questions';
import { CodeRunner, requestFromDefinition, valuesMatch, rowsMatch, starterCode } from '../../src/engine/executor';

const runner = new CodeRunner({ pythonBin: process.env.PYTHON_BIN ?? (process.platform === 'win32' ? 'python' : 'python3') });
const q = (id: string) => QUESTIONS.find((x) => x.id === id)!;
const twoSum = q('q-001');
const climb = q('q-009');

describe('comparison', () => {
  it('handles exact / unordered / nested / float modes', () => {
    expect(valuesMatch([1, 2], [1, 2])).toBe(true);
    expect(valuesMatch([2, 1], [1, 2])).toBe(false);
    expect(valuesMatch([2, 1], [1, 2], 'unordered')).toBe(true);
    expect(valuesMatch([['b', 'a'], ['c']], [['c'], ['a', 'b']], 'unorderedNested')).toBe(true);
    expect(valuesMatch(0.1 + 0.2, 0.3, 'float')).toBe(true);
    expect(valuesMatch(null, [], 'unordered')).toBe(false);
  });
  it('compares SQL rows with and without order', () => {
    expect(rowsMatch([[1, 'a'], [2, 'b']], [[1, 'a'], [2, 'b']], true)).toBe(true);
    expect(rowsMatch([[2, 'b'], [1, 'a']], [[1, 'a'], [2, 'b']], true)).toBe(false);
    expect(rowsMatch([[2, 'b'], [1, 'a']], [[1, 'a'], [2, 'b']], false)).toBe(true);
    expect(rowsMatch([[120.0]], [[120]], true)).toBe(true);
  });
});

describe('starter code', () => {
  it('generates runnable-but-empty templates', () => {
    expect(starterCode(twoSum.code!, 'javascript')).toContain('function twoSum(nums, target)');
    expect(starterCode(twoSum.code!, 'python')).toContain('def twoSum(nums: List[int], target: int) -> List[int]:');
    expect(starterCode(q('q-010').code!, 'python')).toContain('ListNode');
  });
});

describe('verdicts', () => {
  it('WRONG when every answer is wrong', async () => {
    const r = await runner.run(requestFromDefinition(twoSum, 'javascript', 'function twoSum(){ return [9,9]; }'));
    expect(r.verdict).toBe('WRONG');
    expect(r.passed).toBe(0);
    const visible = r.cases.find((c) => !c.hidden)!;
    expect(visible.actual).toBe('[9,9]');
    expect(visible.expected).toBeDefined();
  });

  it('hides inputs / outputs of hidden tests', async () => {
    const r = await runner.run(requestFromDefinition(twoSum, 'python', 'def twoSum(n, t):\n    return [0, 1]'));
    expect(r.verdict).toBe('PARTIAL');
    for (const c of r.cases.filter((c) => c.hidden)) {
      expect(c.input).toBeUndefined();
      expect(c.expected).toBeUndefined();
      expect(c.actual).toBeUndefined();
    }
  });

  it('reports JS syntax errors as compile errors', async () => {
    const r = await runner.run(requestFromDefinition(twoSum, 'javascript', 'function twoSum( {'));
    expect(r.verdict).toBe('ERROR');
    expect(r.compileError).toMatch(/SyntaxError/);
  });

  it('reports Python syntax errors with a line number', async () => {
    const r = await runner.run(requestFromDefinition(twoSum, 'python', 'x = 1\ndef twoSum(nums, target)\n    return []'));
    expect(r.verdict).toBe('ERROR');
    expect(r.compileError).toMatch(/SyntaxError.*line 2/);
  });

  it('reports a missing entry function', async () => {
    const r = await runner.run(requestFromDefinition(twoSum, 'javascript', 'function other(){}'));
    expect(r.compileError).toMatch(/twoSum/);
  });

  it('accepts class Solution style', async () => {
    const r = await runner.run(requestFromDefinition(climb, 'python',
      'class Solution:\n    def climbStairs(self, n):\n        a, b = 1, 1\n        for _ in range(n):\n            a, b = b, a + b\n        return a'));
    expect(r.verdict).toBe('ACCEPTED');
  });

  it('captures runtime errors per test case with line numbers', async () => {
    const r = await runner.run(requestFromDefinition(climb, 'javascript', 'function climbStairs(n) {\n  return undefinedThing.x;\n}'));
    expect(r.verdict).toBe('ERROR');
    expect(r.cases[0].error).toMatch(/ReferenceError.*line 2/);
  });

  it('captures console output', async () => {
    const r = await runner.run(requestFromDefinition(climb, 'javascript', 'function climbStairs(n) { console.log("n=", n); return 1; }'));
    expect(r.stdout).toContain('n= 2');
  });

  it('TLE on infinite loops and keeps earlier results', async () => {
    const code = 'function climbStairs(n) { if (n === 2) return 2; while (true) {} }';
    const r = await runner.run({ ...requestFromDefinition(climb, 'javascript', code), timeLimitMs: 300 });
    expect(r.verdict).toBe('TLE');
    expect(r.cases[0].status).toBe('PASS');
    expect(r.cases[1].status).toBe('TLE');
  }, 20000);

  it('TLE on Python infinite loops', async () => {
    const r = await runner.run({ ...requestFromDefinition(climb, 'python', 'def climbStairs(n):\n    while True: pass'), timeLimitMs: 300 });
    expect(r.verdict).toBe('TLE');
  }, 20000);
});

describe('sandbox', () => {
  it('blocks filesystem writes and process spawning in JavaScript', async () => {
    const code = `function climbStairs(n) {
      const out = [];
      try { require('fs').writeFileSync('pwned.txt', 'x'); out.push('write-ok'); } catch (e) { out.push('write-blocked'); }
      try { require('child_process').execSync('echo hi'); out.push('spawn-ok'); } catch (e) { out.push('spawn-blocked'); }
      throw new Error(out.join(','));
    }`;
    const r = await runner.run(requestFromDefinition(climb, 'javascript', code));
    expect(r.cases[0].error).toContain('write-blocked');
    expect(r.cases[0].error).toContain('spawn-blocked');
  });

  it('does not leak API secrets through the environment', async () => {
    process.env.SUPER_SECRET_TEST = 'leak-me';
    const r = await runner.run(requestFromDefinition(climb, 'javascript', 'function climbStairs(){ throw new Error(String(process.env.SUPER_SECRET_TEST)); }'));
    expect(r.cases[0].error).toContain('undefined');
    delete process.env.SUPER_SECRET_TEST;
  });

  it('blocks writes, subprocesses and sockets in Python', async () => {
    const code = [
      'def climbStairs(n):',
      '    out = []',
      '    for name, fn in [("write", lambda: open("pwned.txt", "w")),',
      '                     ("spawn", lambda: __import__("subprocess").run(["echo", "hi"])),',
      '                     ("system", lambda: __import__("os").system("echo hi")),',
      '                     ("socket", lambda: __import__("socket").create_connection(("example.com", 80), 1))]:',
      '        try:',
      '            fn(); out.append(name + "-ok")',
      '        except Exception:',
      '            out.append(name + "-blocked")',
      '    raise RuntimeError(",".join(out))',
    ].join('\n');
    const r = await runner.run(requestFromDefinition(climb, 'python', code));
    const err = r.cases[0].error!;
    expect(err).toContain('write-blocked');
    expect(err).toContain('spawn-blocked');
    expect(err).toContain('system-blocked');
    expect(err).toContain('socket-blocked');
  });

  it('only allows read-only SQL', async () => {
    const r = await runner.run(requestFromDefinition(q('q-042'), 'sql', 'DELETE FROM Customers'));
    expect(r.verdict).not.toBe('ACCEPTED');
    expect(r.cases[0].error).toMatch(/not authorized|authoriz/i);
  });

  it('rejects multiple SQL statements', async () => {
    const r = await runner.run(requestFromDefinition(q('q-042'), 'sql', 'SELECT 1; SELECT 2'));
    expect(r.verdict).not.toBe('ACCEPTED');
  });
});
