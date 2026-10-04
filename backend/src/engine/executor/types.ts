export type Language = 'javascript' | 'python' | 'sql';

/** Value types the harness knows how to (de)serialize. Everything else is passed as plain JSON. */
export type ValueType =
  | 'int' | 'float' | 'bool' | 'string'
  | 'int[]' | 'string[]' | 'int[][]' | 'string[][]'
  | 'ListNode' | 'TreeNode';

export type CompareMode = 'exact' | 'unordered' | 'unorderedNested' | 'float';

export interface CodeMeta {
  functionName: string;
  params: Array<{ name: string; type: ValueType }>;
  returnType: ValueType;
  compare?: CompareMode;
}

export interface SqlMeta {
  setup: string;          // CREATE TABLE + INSERT statements (SQLite dialect)
  orderMatters: boolean;
}

export interface TestCaseInput {
  id: string;
  args?: unknown[];       // CODE questions
  expected: unknown;      // CODE: return value; SQL: array of row arrays
  hidden?: boolean;
}

export type CaseStatus = 'PASS' | 'FAIL' | 'ERROR' | 'TLE';

export interface CaseResult {
  caseId: string;
  status: CaseStatus;
  timeMs: number;
  hidden: boolean;
  input?: string;
  expected?: string;
  actual?: string;
  error?: string;
}

export type Verdict = 'ACCEPTED' | 'WRONG' | 'PARTIAL' | 'TLE' | 'ERROR';

export interface ExecutionResult {
  verdict: Verdict;
  passed: number;
  total: number;
  executionTimeMs: number;
  cases: CaseResult[];
  stdout: string;
  compileError?: string;
}

export interface ExecutionRequest {
  language: Language;
  code: string;
  tests: TestCaseInput[];
  timeLimitMs: number;
  code_meta?: CodeMeta;
  sql_meta?: SqlMeta;
}
