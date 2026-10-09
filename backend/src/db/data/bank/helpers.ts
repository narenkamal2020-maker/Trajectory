/** Shared helpers for the question bank modules. */
import type { QuestionDef, QuestionTest } from '../questions';

export type { QuestionDef, QuestionTest };

/** CODE test case: function arguments and the expected return value. */
export const t = (args: unknown[], expected: unknown, hidden = false): QuestionTest => ({ args, expected, hidden });
/** SQL test case: the expected result rows. */
export const s = (expected: unknown[][], hidden = false): QuestionTest => ({ expected, hidden });
