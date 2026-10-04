import type { CodeMeta, Language, ValueType } from './types';

const PY_TYPES: Record<ValueType, string> = {
  int: 'int', float: 'float', bool: 'bool', string: 'str',
  'int[]': 'List[int]', 'string[]': 'List[str]', 'int[][]': 'List[List[int]]', 'string[][]': 'List[List[str]]',
  ListNode: 'Optional[ListNode]', TreeNode: 'Optional[TreeNode]',
};

const JS_TYPES: Record<ValueType, string> = {
  int: 'number', float: 'number', bool: 'boolean', string: 'string',
  'int[]': 'number[]', 'string[]': 'string[]', 'int[][]': 'number[][]', 'string[][]': 'string[][]',
  ListNode: 'ListNode | null', TreeNode: 'TreeNode | null',
};

const usesNodes = (m: CodeMeta) => [...m.params.map((p) => p.type), m.returnType].some((t) => t === 'ListNode' || t === 'TreeNode');

/** Generate the editor starter template for a question. */
export function starterCode(meta: CodeMeta, language: Exclude<Language, 'sql'>): string {
  const names = meta.params.map((p) => p.name).join(', ');
  if (language === 'python') {
    const sig = meta.params.map((p) => `${p.name}: ${PY_TYPES[p.type]}`).join(', ');
    const nodeNote = usesNodes(meta)
      ? '# ListNode(val, next) and TreeNode(val, left, right) are predefined.\n'
      : '';
    return `from typing import List, Optional\n${nodeNote}\ndef ${meta.functionName}(${sig}) -> ${PY_TYPES[meta.returnType]}:\n    # Write your solution here\n    pass\n`;
  }
  const jsdoc = meta.params.map((p) => ` * @param {${JS_TYPES[p.type]}} ${p.name}`).join('\n');
  const nodeNote = usesNodes(meta) ? '// ListNode(val, next) and TreeNode(val, left, right) are predefined.\n' : '';
  return `${nodeNote}/**\n${jsdoc}\n * @return {${JS_TYPES[meta.returnType]}}\n */\nfunction ${meta.functionName}(${names}) {\n  // Write your solution here\n}\n`;
}

export const SQL_STARTER = `-- SQLite dialect. Write a single SELECT statement.\nSELECT\n`;
