/**
 * Idempotent seeder for the question bank (src/db/data/questions.ts).
 *   npm run db:seed            upsert questions, skills links and test cases
 *   npm run db:seed -- --demo  also create a demo account with realistic activity
 */
import oracledb from 'oracledb';
import { initOraclePool, closePool, withTransaction } from '../config/oracle';
import { QUESTIONS, type QuestionDef } from './data/questions';
import { starterCode, SQL_STARTER } from '../engine/executor/starter';

function examplesFor(q: QuestionDef) {
  if (q.type === 'SQL') return [];
  return q.tests
    .filter((t) => !t.hidden)
    .slice(0, 2)
    .map((t) => ({
      input: q.code!.params.map((p, i) => `${p.name} = ${JSON.stringify(t.args![i])}`).join(', '),
      output: JSON.stringify(t.expected),
    }));
}

/** Insert or update one question with its skill links and test cases (inside the caller's transaction). */
export async function upsertQuestion(conn: oracledb.Connection, q: QuestionDef, createdBy: string | null = null): Promise<void> {
  const starter = q.type === 'SQL'
    ? { sql: SQL_STARTER }
    : { javascript: starterCode(q.code!, 'javascript'), python: starterCode(q.code!, 'python') };
  const binds = {
    id: q.id,
    title: q.title,
    description: { val: q.description, type: oracledb.CLOB },
    difficulty: q.difficulty,
    categoryId: q.categoryId,
    tags: q.tags.join(','),
    constraintsTxt: { val: q.constraints ?? null, type: oracledb.CLOB },
    examples: { val: JSON.stringify(examplesFor(q)), type: oracledb.CLOB },
    hints: { val: JSON.stringify(q.hints), type: oracledb.CLOB },
    timeLimit: q.timeLimitMs ?? 2000,
    qtype: q.type,
    fn: q.code?.functionName ?? null,
    starter: { val: JSON.stringify(starter), type: oracledb.CLOB },
    meta: { val: JSON.stringify(q.type === 'SQL' ? q.sql : q.code), type: oracledb.CLOB },
    createdBy,
    refLang: q.reference.sql ? 'sql' : q.reference.python ? 'python' : q.reference.javascript ? 'javascript' : null,
    refCode: { val: q.reference.sql ?? q.reference.python ?? q.reference.javascript ?? null, type: oracledb.CLOB },
  };
  await conn.execute(
    `MERGE INTO QUESTIONS t USING (SELECT :id AS QUESTION_ID FROM DUAL) s ON (t.QUESTION_ID = s.QUESTION_ID)
     WHEN MATCHED THEN UPDATE SET
       TITLE = :title, DESCRIPTION = :description, DIFFICULTY = :difficulty, CATEGORY_ID = :categoryId,
       TAGS = :tags, CONSTRAINTS_TXT = :constraintsTxt, EXAMPLES = :examples, HINTS = :hints,
       TIME_LIMIT_MS = :timeLimit, QUESTION_TYPE = :qtype, FUNCTION_NAME = :fn, STARTER_CODE = :starter,
       HARNESS_META = :meta, REFERENCE_LANG = :refLang, REFERENCE_CODE = :refCode, UPDATED_AT = CURRENT_TIMESTAMP
     WHEN NOT MATCHED THEN INSERT
       (QUESTION_ID, TITLE, DESCRIPTION, DIFFICULTY, CATEGORY_ID, TAGS, CONSTRAINTS_TXT, EXAMPLES, HINTS,
        TIME_LIMIT_MS, QUESTION_TYPE, FUNCTION_NAME, STARTER_CODE, HARNESS_META, CREATED_BY, REFERENCE_LANG, REFERENCE_CODE)
       VALUES (:id, :title, :description, :difficulty, :categoryId, :tags, :constraintsTxt, :examples, :hints,
        :timeLimit, :qtype, :fn, :starter, :meta, :createdBy, :refLang, :refCode)`,
    binds
  );

  await conn.execute(`DELETE FROM QUESTION_SKILLS WHERE QUESTION_ID = :id`, { id: q.id });
  for (const [skillId, weight] of q.skills) {
    await conn.execute(`INSERT INTO QUESTION_SKILLS (QUESTION_ID, SKILL_ID, WEIGHT) VALUES (:id, :skillId, :weight)`, { id: q.id, skillId, weight });
  }

  await conn.execute(`DELETE FROM TEST_CASES WHERE QUESTION_ID = :id`, { id: q.id });
  for (const [i, tc] of q.tests.entries()) {
    await conn.execute(
      `INSERT INTO TEST_CASES (TEST_CASE_ID, QUESTION_ID, INPUT_DATA, EXPECTED_OUT, IS_HIDDEN, DISPLAY_ORDER)
       VALUES (:tcId, :id, :input, :expected, :hidden, :ord)`,
      {
        tcId: `${q.id}-${i + 1}`,
        id: q.id,
        input: { val: JSON.stringify(tc.args ?? null), type: oracledb.CLOB },
        expected: { val: JSON.stringify(tc.expected), type: oracledb.CLOB },
        hidden: tc.hidden ? 1 : 0,
        ord: i + 1,
      }
    );
  }
}

export async function seedQuestions(log = console.log): Promise<number> {
  let skipped = 0;
  await withTransaction(async (conn) => {
    // Never overwrite a shipped question an admin has since edited.
    const edited = await conn.execute<{ QUESTION_ID: string }>(`SELECT QUESTION_ID FROM QUESTIONS WHERE UPDATED_AT IS NOT NULL`, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const editedIds = new Set((edited.rows ?? []).map((r) => r.QUESTION_ID));
    for (const q of QUESTIONS) {
      if (editedIds.has(q.id)) { skipped++; continue; }
      await upsertQuestion(conn, q);
      // upsertQuestion stamps UPDATED_AT for admin edits; the shipped bank stays unstamped.
      await conn.execute(`UPDATE QUESTIONS SET UPDATED_AT = NULL WHERE QUESTION_ID = :id`, { id: q.id });
    }
  });
  log(`Seeded ${QUESTIONS.length - skipped} questions${skipped ? ` (${skipped} admin-edited left untouched)` : ''}`);
  return QUESTIONS.length;
}

if (require.main === module) {
  (async () => {
    try {
      await initOraclePool();
      await seedQuestions();
      if (process.argv.includes('--demo')) {
        const { seedDemoAccount } = await import('./demo');
        await seedDemoAccount();
      }
    } catch (err: any) {
      console.error('Seed failed:', err.message);
      process.exitCode = 1;
    } finally {
      await closePool();
    }
  })();
}
