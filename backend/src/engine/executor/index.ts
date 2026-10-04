import { CodeRunner } from './runner';
import type { ExecutionRequest, Language, TestCaseInput } from './types';
import type { QuestionDef } from '../../db/data/questions';

export * from './types';
export { CodeRunner } from './runner';
export { starterCode, SQL_STARTER } from './starter';
export { valuesMatch, rowsMatch } from './compare';

/** Build an execution request from a question definition (used by tests, seed checks and the desktop app). */
export function requestFromDefinition(q: QuestionDef, language: Language, code: string): ExecutionRequest {
  const tests: TestCaseInput[] = q.tests.map((t, i) => ({ id: `${q.id}-${i + 1}`, args: t.args, expected: t.expected, hidden: t.hidden }));
  return {
    language,
    code,
    tests,
    timeLimitMs: q.timeLimitMs ?? 2000,
    code_meta: q.code,
    sql_meta: q.sql,
  };
}

let shared: CodeRunner | null = null;
export function getRunner(opts?: ConstructorParameters<typeof CodeRunner>[0]): CodeRunner {
  if (!shared) shared = new CodeRunner(opts);
  return shared;
}
