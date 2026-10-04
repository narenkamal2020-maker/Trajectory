import { describe, it, expect } from 'vitest';
import { QUESTIONS } from '../../src/db/data/questions';
import { CodeRunner, requestFromDefinition } from '../../src/engine/executor';

const runner = new CodeRunner({ pythonBin: process.env.PYTHON_BIN ?? (process.platform === 'win32' ? 'python' : 'python3'), maxConcurrency: 6 });

describe('question bank integrity', () => {
  it('has unique ids and sane metadata', () => {
    const ids = QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const q of QUESTIONS) {
      expect(q.tests.length).toBeGreaterThan(0);
      expect(q.skills.length).toBeGreaterThan(0);
      if (q.type === 'CODE') {
        expect(q.code, q.id).toBeDefined();
        expect(q.reference.javascript, q.id).toBeTruthy();
        expect(q.reference.python, q.id).toBeTruthy();
        for (const t of q.tests) expect(t.args?.length, q.id).toBe(q.code!.params.length);
      } else {
        expect(q.sql, q.id).toBeDefined();
        expect(q.reference.sql, q.id).toBeTruthy();
      }
    }
  });

  const code = QUESTIONS.filter((q) => q.type === 'CODE');
  const sql = QUESTIONS.filter((q) => q.type === 'SQL');

  it.each(code.map((q) => [q.id, q.title, q] as const))('%s %s — JS reference passes', async (_id, _t, q) => {
    const res = await runner.run(requestFromDefinition(q, 'javascript', q.reference.javascript!));
    expect(res.compileError).toBeUndefined();
    expect(res.cases.filter((c) => c.status !== 'PASS')).toEqual([]);
    expect(res.verdict).toBe('ACCEPTED');
  });

  it.each(code.map((q) => [q.id, q.title, q] as const))('%s %s — Python reference passes', async (_id, _t, q) => {
    const res = await runner.run(requestFromDefinition(q, 'python', q.reference.python!));
    expect(res.compileError).toBeUndefined();
    expect(res.cases.filter((c) => c.status !== 'PASS')).toEqual([]);
    expect(res.verdict).toBe('ACCEPTED');
  });

  it.each(sql.map((q) => [q.id, q.title, q] as const))('%s %s — SQL reference passes', async (_id, _t, q) => {
    const res = await runner.run(requestFromDefinition(q, 'sql', q.reference.sql!));
    expect(res.cases.filter((c) => c.status !== 'PASS')).toEqual([]);
    expect(res.verdict).toBe('ACCEPTED');
  });
});
