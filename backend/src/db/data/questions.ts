/**
 * Trajectory question bank.
 * Each CODE question carries a typed signature (used to generate starter code and to
 * (de)serialize ListNode/TreeNode values) plus reference solutions in JS and Python.
 * Reference solutions are never exposed by the API — they exist so the test suite can
 * prove every test case is correct (tests/unit/question-bank.test.ts).
 */
import type { CodeMeta, SqlMeta } from '../../engine/executor/types';

export interface QuestionTest {
  args?: unknown[];
  expected: unknown;
  hidden?: boolean;
}

export interface QuestionDef {
  id: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  categoryId: string;
  skills: Array<[skillId: string, weight: number]>;
  tags: string[];
  description: string;
  constraints?: string;
  hints: string[];
  timeLimitMs?: number;
  type: 'CODE' | 'SQL';
  code?: CodeMeta;
  sql?: SqlMeta;
  tests: QuestionTest[];
  reference: { javascript?: string; python?: string; sql?: string };
}

const t = (args: unknown[], expected: unknown, hidden = false): QuestionTest => ({ args, expected, hidden });
const s = (expected: unknown[][], hidden = false): QuestionTest => ({ expected, hidden });

export const QUESTIONS: QuestionDef[] = [
  // ───────────────────────────── Arrays & Hashing ─────────────────────────────
  {
    id: 'q-001', title: 'Two Sum', difficulty: 'EASY', categoryId: 'cat-hashing',
    skills: [['sk-hashmap', 1], ['sk-array-traversal', 0.6]], tags: ['arrays', 'hashing'],
    description: 'Given an array of integers `nums` and an integer `target`, return the indices of the two numbers that add up to `target`. Exactly one solution exists and you may not use the same element twice. Return the indices in any order.',
    constraints: '2 <= nums.length <= 10^4',
    hints: ['A hash map from value → index lets you look up the complement in O(1).', 'For each x, check whether target - x was already seen.'],
    type: 'CODE',
    code: { functionName: 'twoSum', params: [{ name: 'nums', type: 'int[]' }, { name: 'target', type: 'int' }], returnType: 'int[]', compare: 'unordered' },
    tests: [t([[2, 7, 11, 15], 9], [0, 1]), t([[3, 2, 4], 6], [1, 2]), t([[3, 3], 6], [0, 1], true), t([[-1, -2, -3, -4, -5], -8], [2, 4], true)],
    reference: {
      javascript: `function twoSum(nums, target) {\n  const seen = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    if (seen.has(target - nums[i])) return [seen.get(target - nums[i]), i];\n    seen.set(nums[i], i);\n  }\n  return [];\n}`,
      python: `def twoSum(nums, target):\n    seen = {}\n    for i, x in enumerate(nums):\n        if target - x in seen:\n            return [seen[target - x], i]\n        seen[x] = i\n    return []`,
    },
  },
  {
    id: 'q-011', title: 'Best Time to Buy and Sell Stock', difficulty: 'EASY', categoryId: 'cat-arrays',
    skills: [['sk-array-traversal', 1], ['sk-greedy', 0.5]], tags: ['arrays', 'greedy'],
    description: 'Given `prices[i]`, the price of a stock on day i, return the maximum profit from one buy followed by one later sell. Return 0 if no profit is possible.',
    hints: ['Track the minimum price seen so far.', 'At each day, the best sale is price - minSoFar.'],
    type: 'CODE',
    code: { functionName: 'maxProfit', params: [{ name: 'prices', type: 'int[]' }], returnType: 'int' },
    tests: [t([[7, 1, 5, 3, 6, 4]], 5), t([[7, 6, 4, 3, 1]], 0), t([[1, 2]], 1, true), t([[2, 4, 1, 7]], 6, true)],
    reference: {
      javascript: `function maxProfit(prices) {\n  let lo = Infinity, best = 0;\n  for (const p of prices) { lo = Math.min(lo, p); best = Math.max(best, p - lo); }\n  return best;\n}`,
      python: `def maxProfit(prices):\n    lo, best = float('inf'), 0\n    for p in prices:\n        lo = min(lo, p)\n        best = max(best, p - lo)\n    return best`,
    },
  },
  {
    id: 'q-012', title: 'Valid Anagram', difficulty: 'EASY', categoryId: 'cat-hashing',
    skills: [['sk-hashmap', 1], ['sk-string-manip', 0.7]], tags: ['strings', 'hashing'],
    description: 'Given two strings `s` and `t`, return true if `t` is an anagram of `s`.',
    hints: ['Count character frequencies.'],
    type: 'CODE',
    code: { functionName: 'isAnagram', params: [{ name: 's', type: 'string' }, { name: 't', type: 'string' }], returnType: 'bool' },
    tests: [t(['anagram', 'nagaram'], true), t(['rat', 'car'], false), t(['a', 'ab'], false, true), t(['', ''], true, true)],
    reference: {
      javascript: `function isAnagram(s, t) {\n  if (s.length !== t.length) return false;\n  const c = {};\n  for (const ch of s) c[ch] = (c[ch] || 0) + 1;\n  for (const ch of t) { if (!c[ch]) return false; c[ch]--; }\n  return true;\n}`,
      python: `def isAnagram(s, t):\n    from collections import Counter\n    return Counter(s) == Counter(t)`,
    },
  },
  {
    id: 'q-013', title: 'Contains Duplicate', difficulty: 'EASY', categoryId: 'cat-hashing',
    skills: [['sk-hashmap', 1]], tags: ['arrays', 'hashing'],
    description: 'Return true if any value appears at least twice in `nums`, otherwise false.',
    hints: ['A set gives O(1) membership checks.'],
    type: 'CODE',
    code: { functionName: 'containsDuplicate', params: [{ name: 'nums', type: 'int[]' }], returnType: 'bool' },
    tests: [t([[1, 2, 3, 1]], true), t([[1, 2, 3, 4]], false), t([[1, 1, 1, 3, 3, 4, 3, 2, 4, 2]], true, true), t([[]], false, true)],
    reference: {
      javascript: `function containsDuplicate(nums) {\n  return new Set(nums).size !== nums.length;\n}`,
      python: `def containsDuplicate(nums):\n    return len(set(nums)) != len(nums)`,
    },
  },
  {
    id: 'q-014', title: 'Group Anagrams', difficulty: 'MEDIUM', categoryId: 'cat-hashing',
    skills: [['sk-hashmap', 1], ['sk-string-manip', 0.6]], tags: ['strings', 'hashing'],
    description: 'Group the strings in `strs` that are anagrams of each other. Return the groups in any order; strings within a group may be in any order.',
    hints: ['Anagrams share the same sorted key.'],
    type: 'CODE',
    code: { functionName: 'groupAnagrams', params: [{ name: 'strs', type: 'string[]' }], returnType: 'string[][]', compare: 'unorderedNested' },
    tests: [
      t([['eat', 'tea', 'tan', 'ate', 'nat', 'bat']], [['bat'], ['nat', 'tan'], ['ate', 'eat', 'tea']]),
      t([['']], [['']]),
      t([['a']], [['a']], true),
      t([['abc', 'bca', 'xyz', 'zyx', 'q']], [['abc', 'bca'], ['xyz', 'zyx'], ['q']], true),
    ],
    reference: {
      javascript: `function groupAnagrams(strs) {\n  const m = new Map();\n  for (const s of strs) { const k = [...s].sort().join(''); if (!m.has(k)) m.set(k, []); m.get(k).push(s); }\n  return [...m.values()];\n}`,
      python: `def groupAnagrams(strs):\n    groups = {}\n    for s in strs:\n        groups.setdefault(''.join(sorted(s)), []).append(s)\n    return list(groups.values())`,
    },
  },
  {
    id: 'q-015', title: 'Product of Array Except Self', difficulty: 'MEDIUM', categoryId: 'cat-arrays',
    skills: [['sk-prefix-sum', 1], ['sk-array-traversal', 0.6]], tags: ['arrays', 'prefix-sum'],
    description: 'Return an array `answer` where `answer[i]` is the product of all elements of `nums` except `nums[i]`, without using division, in O(n).',
    hints: ['Compute prefix products left-to-right, then multiply by suffix products right-to-left.'],
    type: 'CODE',
    code: { functionName: 'productExceptSelf', params: [{ name: 'nums', type: 'int[]' }], returnType: 'int[]' },
    tests: [t([[1, 2, 3, 4]], [24, 12, 8, 6]), t([[-1, 1, 0, -3, 3]], [0, 0, 9, 0, 0]), t([[2, 3]], [3, 2], true), t([[5, 1, 1, 2]], [2, 10, 10, 5], true)],
    reference: {
      javascript: `function productExceptSelf(nums) {\n  const n = nums.length, out = new Array(n).fill(1);\n  let p = 1;\n  for (let i = 0; i < n; i++) { out[i] = p; p *= nums[i]; }\n  p = 1;\n  for (let i = n - 1; i >= 0; i--) { out[i] *= p; p *= nums[i]; }\n  return out.map((x) => x + 0);\n}`,
      python: `def productExceptSelf(nums):\n    n = len(nums)\n    out = [1] * n\n    p = 1\n    for i in range(n):\n        out[i] = p\n        p *= nums[i]\n    p = 1\n    for i in range(n - 1, -1, -1):\n        out[i] *= p\n        p *= nums[i]\n    return out`,
    },
  },
  {
    id: 'q-016', title: 'Longest Substring Without Repeating Characters', difficulty: 'MEDIUM', categoryId: 'cat-arrays',
    skills: [['sk-sliding-window', 1], ['sk-hashmap', 0.5]], tags: ['strings', 'sliding-window'],
    description: 'Given a string `s`, return the length of the longest substring without repeating characters.',
    hints: ['Maintain a window [left, right] with no duplicates.', 'Store the last index of each character to jump left forward.'],
    type: 'CODE',
    code: { functionName: 'lengthOfLongestSubstring', params: [{ name: 's', type: 'string' }], returnType: 'int' },
    tests: [t(['abcabcbb'], 3), t(['bbbbb'], 1), t(['pwwkew'], 3), t([''], 0, true), t(['abba'], 2, true)],
    reference: {
      javascript: `function lengthOfLongestSubstring(s) {\n  const last = new Map();\n  let left = 0, best = 0;\n  for (let r = 0; r < s.length; r++) {\n    if (last.has(s[r]) && last.get(s[r]) >= left) left = last.get(s[r]) + 1;\n    last.set(s[r], r);\n    best = Math.max(best, r - left + 1);\n  }\n  return best;\n}`,
      python: `def lengthOfLongestSubstring(s):\n    last, left, best = {}, 0, 0\n    for r, ch in enumerate(s):\n        if ch in last and last[ch] >= left:\n            left = last[ch] + 1\n        last[ch] = r\n        best = max(best, r - left + 1)\n    return best`,
    },
  },
  {
    id: 'q-017', title: 'Maximum Subarray', difficulty: 'MEDIUM', categoryId: 'cat-dp',
    skills: [['sk-dp-1d', 1], ['sk-array-traversal', 0.5]], tags: ['arrays', 'dynamic-programming', 'kadane'],
    description: 'Find the contiguous non-empty subarray with the largest sum and return its sum.',
    hints: ['Kadane: best ending here = max(x, bestEndingPrev + x).'],
    type: 'CODE',
    code: { functionName: 'maxSubArray', params: [{ name: 'nums', type: 'int[]' }], returnType: 'int' },
    tests: [t([[-2, 1, -3, 4, -1, 2, 1, -5, 4]], 6), t([[1]], 1), t([[5, 4, -1, 7, 8]], 23), t([[-3, -1, -2]], -1, true)],
    reference: {
      javascript: `function maxSubArray(nums) {\n  let cur = nums[0], best = nums[0];\n  for (let i = 1; i < nums.length; i++) { cur = Math.max(nums[i], cur + nums[i]); best = Math.max(best, cur); }\n  return best;\n}`,
      python: `def maxSubArray(nums):\n    cur = best = nums[0]\n    for x in nums[1:]:\n        cur = max(x, cur + x)\n        best = max(best, cur)\n    return best`,
    },
  },
  {
    id: 'q-008', title: 'Sliding Window Maximum', difficulty: 'HARD', categoryId: 'cat-arrays',
    skills: [['sk-sliding-window', 1], ['sk-monotonic', 1], ['sk-queue', 0.6]], tags: ['arrays', 'deque', 'monotonic'],
    description: 'Given `nums` and window size `k`, return the maximum of every contiguous window of size k, left to right.',
    hints: ['Keep a deque of indices whose values are decreasing.', 'Pop from the front when the index leaves the window.'],
    type: 'CODE',
    code: { functionName: 'maxSlidingWindow', params: [{ name: 'nums', type: 'int[]' }, { name: 'k', type: 'int' }], returnType: 'int[]' },
    tests: [t([[1, 3, -1, -3, 5, 3, 6, 7], 3], [3, 3, 5, 5, 6, 7]), t([[1], 1], [1]), t([[9, 8, 7, 6], 2], [9, 8, 7], true), t([[1, 3, 1, 2, 0, 5], 3], [3, 3, 2, 5], true)],
    reference: {
      javascript: `function maxSlidingWindow(nums, k) {\n  const dq = [], out = [];\n  let head = 0;\n  for (let i = 0; i < nums.length; i++) {\n    while (dq.length > head && nums[dq[dq.length - 1]] <= nums[i]) dq.pop();\n    dq.push(i);\n    if (dq[head] <= i - k) head++;\n    if (i >= k - 1) out.push(nums[dq[head]]);\n  }\n  return out;\n}`,
      python: `def maxSlidingWindow(nums, k):\n    from collections import deque\n    dq, out = deque(), []\n    for i, x in enumerate(nums):\n        while dq and nums[dq[-1]] <= x:\n            dq.pop()\n        dq.append(i)\n        if dq[0] <= i - k:\n            dq.popleft()\n        if i >= k - 1:\n            out.append(nums[dq[0]])\n    return out`,
    },
  },
  {
    id: 'q-018', title: 'Subarray Sum Equals K', difficulty: 'MEDIUM', categoryId: 'cat-arrays',
    skills: [['sk-prefix-sum', 1], ['sk-hashmap', 0.8]], tags: ['arrays', 'prefix-sum', 'hashing'],
    description: 'Return the total number of contiguous subarrays whose sum equals `k`.',
    hints: ['Count prefix sums seen so far; a subarray ending at i sums to k when prefix - k was seen.'],
    type: 'CODE',
    code: { functionName: 'subarraySum', params: [{ name: 'nums', type: 'int[]' }, { name: 'k', type: 'int' }], returnType: 'int' },
    tests: [t([[1, 1, 1], 2], 2), t([[1, 2, 3], 3], 2), t([[1, -1, 0], 0], 3, true), t([[3, 4, 7, 2, -3, 1, 4, 2], 7], 4, true)],
    reference: {
      javascript: `function subarraySum(nums, k) {\n  const seen = new Map([[0, 1]]);\n  let sum = 0, count = 0;\n  for (const x of nums) { sum += x; count += seen.get(sum - k) || 0; seen.set(sum, (seen.get(sum) || 0) + 1); }\n  return count;\n}`,
      python: `def subarraySum(nums, k):\n    seen, total, count = {0: 1}, 0, 0\n    for x in nums:\n        total += x\n        count += seen.get(total - k, 0)\n        seen[total] = seen.get(total, 0) + 1\n    return count`,
    },
  },
  {
    id: 'q-019', title: 'Valid Palindrome', difficulty: 'EASY', categoryId: 'cat-arrays',
    skills: [['sk-two-pointer', 1], ['sk-string-manip', 0.8]], tags: ['strings', 'two-pointers'],
    description: 'A phrase is a palindrome if, after lowercasing and removing all non-alphanumeric characters, it reads the same forward and backward. Return true if `s` is a palindrome.',
    hints: ['Use two pointers moving inward, skipping non-alphanumerics.'],
    type: 'CODE',
    code: { functionName: 'isPalindrome', params: [{ name: 's', type: 'string' }], returnType: 'bool' },
    tests: [t(['A man, a plan, a canal: Panama'], true), t(['race a car'], false), t([' '], true, true), t(['0P'], false, true)],
    reference: {
      javascript: `function isPalindrome(s) {\n  const c = s.toLowerCase().replace(/[^a-z0-9]/g, '');\n  return c === [...c].reverse().join('');\n}`,
      python: `def isPalindrome(s):\n    c = [ch.lower() for ch in s if ch.isalnum()]\n    return c == c[::-1]`,
    },
  },
  {
    id: 'q-020', title: 'Container With Most Water', difficulty: 'MEDIUM', categoryId: 'cat-arrays',
    skills: [['sk-two-pointer', 1], ['sk-greedy', 0.5]], tags: ['arrays', 'two-pointers'],
    description: 'Given `height`, choose two lines that, together with the x-axis, form a container holding the most water. Return the maximum area.',
    hints: ['Start with the widest container and move the shorter side inward.'],
    type: 'CODE',
    code: { functionName: 'maxArea', params: [{ name: 'height', type: 'int[]' }], returnType: 'int' },
    tests: [t([[1, 8, 6, 2, 5, 4, 8, 3, 7]], 49), t([[1, 1]], 1), t([[4, 3, 2, 1, 4]], 16, true), t([[1, 2, 1]], 2, true)],
    reference: {
      javascript: `function maxArea(h) {\n  let l = 0, r = h.length - 1, best = 0;\n  while (l < r) { best = Math.max(best, Math.min(h[l], h[r]) * (r - l)); if (h[l] < h[r]) l++; else r--; }\n  return best;\n}`,
      python: `def maxArea(h):\n    l, r, best = 0, len(h) - 1, 0\n    while l < r:\n        best = max(best, min(h[l], h[r]) * (r - l))\n        if h[l] < h[r]:\n            l += 1\n        else:\n            r -= 1\n    return best`,
    },
  },

  // ───────────────────────────── Stacks & Queues ─────────────────────────────
  {
    id: 'q-002', title: 'Valid Parentheses', difficulty: 'EASY', categoryId: 'cat-stack',
    skills: [['sk-stack', 1], ['sk-string-manip', 0.4]], tags: ['stack', 'strings'],
    description: "Given a string containing only '()[]{}', determine whether every bracket is closed by the same type in the correct order.",
    hints: ['Push opening brackets; on a closing bracket the top of the stack must match.'],
    type: 'CODE',
    code: { functionName: 'isValid', params: [{ name: 's', type: 'string' }], returnType: 'bool' },
    tests: [t(['()'], true), t(['()[]{}'], true), t(['(]'], false), t(['([)]'], false, true), t(['{[]}'], true, true), t(['('], false, true)],
    reference: {
      javascript: `function isValid(s) {\n  const st = [], pair = { ')': '(', ']': '[', '}': '{' };\n  for (const c of s) {\n    if (c in pair) { if (st.pop() !== pair[c]) return false; } else st.push(c);\n  }\n  return st.length === 0;\n}`,
      python: `def isValid(s):\n    st, pair = [], {')': '(', ']': '[', '}': '{'}\n    for c in s:\n        if c in pair:\n            if not st or st.pop() != pair[c]:\n                return False\n        else:\n            st.append(c)\n    return not st`,
    },
  },
  {
    id: 'q-021', title: 'Daily Temperatures', difficulty: 'MEDIUM', categoryId: 'cat-stack',
    skills: [['sk-monotonic', 1], ['sk-stack', 0.7]], tags: ['stack', 'monotonic'],
    description: 'For each day, return how many days you must wait for a warmer temperature (0 if never).',
    hints: ['Keep a stack of indices with decreasing temperatures.'],
    type: 'CODE',
    code: { functionName: 'dailyTemperatures', params: [{ name: 'temperatures', type: 'int[]' }], returnType: 'int[]' },
    tests: [t([[73, 74, 75, 71, 69, 72, 76, 73]], [1, 1, 4, 2, 1, 1, 0, 0]), t([[30, 40, 50, 60]], [1, 1, 1, 0]), t([[30, 60, 90]], [1, 1, 0], true), t([[90, 80, 70]], [0, 0, 0], true)],
    reference: {
      javascript: `function dailyTemperatures(t) {\n  const out = new Array(t.length).fill(0), st = [];\n  for (let i = 0; i < t.length; i++) {\n    while (st.length && t[st[st.length - 1]] < t[i]) { const j = st.pop(); out[j] = i - j; }\n    st.push(i);\n  }\n  return out;\n}`,
      python: `def dailyTemperatures(t):\n    out, st = [0] * len(t), []\n    for i, x in enumerate(t):\n        while st and t[st[-1]] < x:\n            j = st.pop()\n            out[j] = i - j\n        st.append(i)\n    return out`,
    },
  },
  {
    id: 'q-022', title: 'Evaluate Reverse Polish Notation', difficulty: 'MEDIUM', categoryId: 'cat-stack',
    skills: [['sk-stack', 1]], tags: ['stack', 'math'],
    description: 'Evaluate an arithmetic expression in Reverse Polish Notation. Operators are + - * /. Division truncates toward zero.',
    hints: ['Push numbers; on an operator pop two operands (mind the order).'],
    type: 'CODE',
    code: { functionName: 'evalRPN', params: [{ name: 'tokens', type: 'string[]' }], returnType: 'int' },
    tests: [t([['2', '1', '+', '3', '*']], 9), t([['4', '13', '5', '/', '+']], 6), t([['10', '6', '9', '3', '+', '-11', '*', '/', '*', '17', '+', '5', '+']], 22, true), t([['7', '-2', '/']], -3, true)],
    reference: {
      javascript: `function evalRPN(tokens) {\n  const st = [];\n  for (const tk of tokens) {\n    if (['+', '-', '*', '/'].includes(tk)) {\n      const b = st.pop(), a = st.pop();\n      st.push(tk === '+' ? a + b : tk === '-' ? a - b : tk === '*' ? a * b : Math.trunc(a / b));\n    } else st.push(Number(tk));\n  }\n  return st[0];\n}`,
      python: `def evalRPN(tokens):\n    st = []\n    for tk in tokens:\n        if tk in '+-*/' and len(tk) == 1:\n            b, a = st.pop(), st.pop()\n            st.append(a + b if tk == '+' else a - b if tk == '-' else a * b if tk == '*' else int(a / b))\n        else:\n            st.append(int(tk))\n    return st[0]`,
    },
  },

  // ───────────────────────────── Linked Lists ─────────────────────────────
  {
    id: 'q-010', title: 'Reverse Linked List', difficulty: 'EASY', categoryId: 'cat-ll',
    skills: [['sk-ll-ops', 1]], tags: ['linked-list'],
    description: 'Given the `head` of a singly linked list (`ListNode` with `val` and `next`), reverse the list and return the new head.',
    hints: ['Walk the list with prev / curr pointers, flipping `next` each step.'],
    type: 'CODE',
    code: { functionName: 'reverseList', params: [{ name: 'head', type: 'ListNode' }], returnType: 'ListNode' },
    tests: [t([[1, 2, 3, 4, 5]], [5, 4, 3, 2, 1]), t([[1, 2]], [2, 1]), t([[]], [], true), t([[7]], [7], true)],
    reference: {
      javascript: `function reverseList(head) {\n  let prev = null;\n  while (head) { const nx = head.next; head.next = prev; prev = head; head = nx; }\n  return prev;\n}`,
      python: `def reverseList(head):\n    prev = None\n    while head:\n        head.next, prev, head = prev, head, head.next\n    return prev`,
    },
  },
  {
    id: 'q-023', title: 'Merge Two Sorted Lists', difficulty: 'EASY', categoryId: 'cat-ll',
    skills: [['sk-ll-ops', 1], ['sk-two-pointer', 0.4]], tags: ['linked-list', 'recursion'],
    description: 'Merge two sorted linked lists `list1` and `list2` into one sorted list and return its head.',
    hints: ['Use a dummy head and splice the smaller node each step.'],
    type: 'CODE',
    code: { functionName: 'mergeTwoLists', params: [{ name: 'list1', type: 'ListNode' }, { name: 'list2', type: 'ListNode' }], returnType: 'ListNode' },
    tests: [t([[1, 2, 4], [1, 3, 4]], [1, 1, 2, 3, 4, 4]), t([[], []], []), t([[], [0]], [0], true), t([[5], [1, 2, 3]], [1, 2, 3, 5], true)],
    reference: {
      javascript: `function mergeTwoLists(a, b) {\n  const dummy = new ListNode(0); let cur = dummy;\n  while (a && b) { if (a.val <= b.val) { cur.next = a; a = a.next; } else { cur.next = b; b = b.next; } cur = cur.next; }\n  cur.next = a || b;\n  return dummy.next;\n}`,
      python: `def mergeTwoLists(a, b):\n    dummy = cur = ListNode(0)\n    while a and b:\n        if a.val <= b.val:\n            cur.next, a = a, a.next\n        else:\n            cur.next, b = b, b.next\n        cur = cur.next\n    cur.next = a or b\n    return dummy.next`,
    },
  },
  {
    id: 'q-024', title: 'Middle of the Linked List', difficulty: 'EASY', categoryId: 'cat-ll',
    skills: [['sk-fast-slow', 1], ['sk-ll-ops', 0.5]], tags: ['linked-list', 'two-pointers'],
    description: 'Return the middle node of the list (the second middle when there are two). The returned node is serialized from that node to the end.',
    hints: ['Move slow one step and fast two steps.'],
    type: 'CODE',
    code: { functionName: 'middleNode', params: [{ name: 'head', type: 'ListNode' }], returnType: 'ListNode' },
    tests: [t([[1, 2, 3, 4, 5]], [3, 4, 5]), t([[1, 2, 3, 4, 5, 6]], [4, 5, 6]), t([[1]], [1], true), t([[1, 2]], [2], true)],
    reference: {
      javascript: `function middleNode(head) {\n  let slow = head, fast = head;\n  while (fast && fast.next) { slow = slow.next; fast = fast.next.next; }\n  return slow;\n}`,
      python: `def middleNode(head):\n    slow = fast = head\n    while fast and fast.next:\n        slow, fast = slow.next, fast.next.next\n    return slow`,
    },
  },

  // ───────────────────────────── Trees ─────────────────────────────
  {
    id: 'q-025', title: 'Maximum Depth of Binary Tree', difficulty: 'EASY', categoryId: 'cat-trees',
    skills: [['sk-tree-traversal', 1], ['sk-recursion', 0.6]], tags: ['trees', 'dfs'],
    description: 'Given the `root` of a binary tree (`TreeNode` with `val`, `left`, `right`), return its maximum depth. Trees are given in level order with null for missing children.',
    hints: ['depth(node) = 1 + max(depth(left), depth(right)).'],
    type: 'CODE',
    code: { functionName: 'maxDepth', params: [{ name: 'root', type: 'TreeNode' }], returnType: 'int' },
    tests: [t([[3, 9, 20, null, null, 15, 7]], 3), t([[1, null, 2]], 2), t([[]], 0, true), t([[1, 2, null, 3, null, 4]], 4, true)],
    reference: {
      javascript: `function maxDepth(root) {\n  return root ? 1 + Math.max(maxDepth(root.left), maxDepth(root.right)) : 0;\n}`,
      python: `def maxDepth(root):\n    return 1 + max(maxDepth(root.left), maxDepth(root.right)) if root else 0`,
    },
  },
  {
    id: 'q-026', title: 'Binary Tree Level Order Traversal', difficulty: 'MEDIUM', categoryId: 'cat-trees',
    skills: [['sk-tree-traversal', 1], ['sk-bfs', 0.8], ['sk-queue', 0.5]], tags: ['trees', 'bfs'],
    description: "Return the level order traversal of the tree's node values (left to right, level by level).",
    hints: ['BFS with a queue; process one level per iteration.'],
    type: 'CODE',
    code: { functionName: 'levelOrder', params: [{ name: 'root', type: 'TreeNode' }], returnType: 'int[][]' },
    tests: [t([[3, 9, 20, null, null, 15, 7]], [[3], [9, 20], [15, 7]]), t([[1]], [[1]]), t([[]], [], true), t([[1, 2, 3, 4, null, null, 5]], [[1], [2, 3], [4, 5]], true)],
    reference: {
      javascript: `function levelOrder(root) {\n  const out = []; let q = root ? [root] : [];\n  while (q.length) { out.push(q.map((n) => n.val)); q = q.flatMap((n) => [n.left, n.right].filter(Boolean)); }\n  return out;\n}`,
      python: `def levelOrder(root):\n    out, q = [], [root] if root else []\n    while q:\n        out.append([n.val for n in q])\n        q = [c for n in q for c in (n.left, n.right) if c]\n    return out`,
    },
  },
  {
    id: 'q-027', title: 'Validate Binary Search Tree', difficulty: 'MEDIUM', categoryId: 'cat-trees',
    skills: [['sk-bst', 1], ['sk-tree-traversal', 0.6]], tags: ['trees', 'bst', 'dfs'],
    description: 'Determine whether the tree is a valid BST: every left subtree has strictly smaller keys and every right subtree strictly larger keys.',
    hints: ['Pass down (low, high) bounds while recursing.'],
    type: 'CODE',
    code: { functionName: 'isValidBST', params: [{ name: 'root', type: 'TreeNode' }], returnType: 'bool' },
    tests: [t([[2, 1, 3]], true), t([[5, 1, 4, null, null, 3, 6]], false), t([[5, 4, 6, null, null, 3, 7]], false, true), t([[1, 1]], false, true), t([[10, 5, 15, 2, 7, 12, 20]], true, true)],
    reference: {
      javascript: `function isValidBST(root, lo = -Infinity, hi = Infinity) {\n  if (!root) return true;\n  if (root.val <= lo || root.val >= hi) return false;\n  return isValidBST(root.left, lo, root.val) && isValidBST(root.right, root.val, hi);\n}`,
      python: `def isValidBST(root, lo=float('-inf'), hi=float('inf')):\n    if not root:\n        return True\n    if not (lo < root.val < hi):\n        return False\n    return isValidBST(root.left, lo, root.val) and isValidBST(root.right, root.val, hi)`,
    },
  },
  {
    id: 'q-006', title: 'Binary Tree Maximum Path Sum', difficulty: 'HARD', categoryId: 'cat-trees',
    skills: [['sk-tree-traversal', 1], ['sk-recursion', 0.8]], tags: ['trees', 'dfs', 'recursion'],
    description: 'A path is any sequence of adjacent nodes, each used at most once (it need not pass through the root). Return the maximum path sum of any non-empty path.',
    hints: ['Each node returns its best downward gain max(0, ...) to its parent.', 'Update a global best with left + node + right.'],
    type: 'CODE',
    code: { functionName: 'maxPathSum', params: [{ name: 'root', type: 'TreeNode' }], returnType: 'int' },
    tests: [t([[1, 2, 3]], 6), t([[-10, 9, 20, null, null, 15, 7]], 42), t([[-3]], -3, true), t([[2, -1]], 2, true), t([[5, 4, 8, 11, null, 13, 4, 7, 2, null, null, null, 1]], 48, true)],
    reference: {
      javascript: `function maxPathSum(root) {\n  let best = -Infinity;\n  const gain = (n) => { if (!n) return 0; const l = Math.max(0, gain(n.left)), r = Math.max(0, gain(n.right)); best = Math.max(best, n.val + l + r); return n.val + Math.max(l, r); };\n  gain(root);\n  return best;\n}`,
      python: `def maxPathSum(root):\n    best = [float('-inf')]\n    def gain(n):\n        if not n:\n            return 0\n        l, r = max(0, gain(n.left)), max(0, gain(n.right))\n        best[0] = max(best[0], n.val + l + r)\n        return n.val + max(l, r)\n    gain(root)\n    return best[0]`,
    },
  },

  // ───────────────────────────── Graphs ─────────────────────────────
  {
    id: 'q-003', title: 'Number of Islands', difficulty: 'MEDIUM', categoryId: 'cat-graphs',
    skills: [['sk-dfs', 0.8], ['sk-bfs', 0.8]], tags: ['graphs', 'matrix', 'dfs', 'bfs'],
    description: "Given an m x n grid of '1' (land) and '0' (water), return the number of islands. Islands connect horizontally or vertically.",
    hints: ['Flood-fill each unvisited land cell and count how many fills you start.'],
    timeLimitMs: 3000,
    type: 'CODE',
    code: { functionName: 'numIslands', params: [{ name: 'grid', type: 'string[][]' }], returnType: 'int' },
    tests: [
      t([[['1', '1', '1', '1', '0'], ['1', '1', '0', '1', '0'], ['1', '1', '0', '0', '0'], ['0', '0', '0', '0', '0']]], 1),
      t([[['1', '1', '0', '0', '0'], ['1', '1', '0', '0', '0'], ['0', '0', '1', '0', '0'], ['0', '0', '0', '1', '1']]], 3),
      t([[['0']]], 0, true),
      t([[['1', '0', '1'], ['0', '1', '0'], ['1', '0', '1']]], 5, true),
    ],
    reference: {
      javascript: `function numIslands(grid) {\n  let n = 0;\n  const fill = (r, c) => { if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length || grid[r][c] !== '1') return; grid[r][c] = '0'; fill(r + 1, c); fill(r - 1, c); fill(r, c + 1); fill(r, c - 1); };\n  for (let r = 0; r < grid.length; r++) for (let c = 0; c < grid[0].length; c++) if (grid[r][c] === '1') { n++; fill(r, c); }\n  return n;\n}`,
      python: `def numIslands(grid):\n    rows, cols, n = len(grid), len(grid[0]), 0\n    def fill(r, c):\n        if 0 <= r < rows and 0 <= c < cols and grid[r][c] == '1':\n            grid[r][c] = '0'\n            fill(r + 1, c); fill(r - 1, c); fill(r, c + 1); fill(r, c - 1)\n    for r in range(rows):\n        for c in range(cols):\n            if grid[r][c] == '1':\n                n += 1\n                fill(r, c)\n    return n`,
    },
  },
  {
    id: 'q-005', title: 'Course Schedule', difficulty: 'MEDIUM', categoryId: 'cat-graphs',
    skills: [['sk-topo-sort', 1], ['sk-dfs', 0.5]], tags: ['graphs', 'topological-sort'],
    description: 'There are `numCourses` courses (0..n-1). `prerequisites[i] = [a, b]` means b must be taken before a. Return true if all courses can be finished.',
    hints: ["Kahn's algorithm: repeatedly take courses with in-degree 0.", 'If some course never reaches in-degree 0 there is a cycle.'],
    timeLimitMs: 3000,
    type: 'CODE',
    code: { functionName: 'canFinish', params: [{ name: 'numCourses', type: 'int' }, { name: 'prerequisites', type: 'int[][]' }], returnType: 'bool' },
    tests: [t([2, [[1, 0]]], true), t([2, [[1, 0], [0, 1]]], false), t([3, []], true, true), t([4, [[1, 0], [2, 1], [3, 2], [1, 3]]], false, true), t([5, [[1, 0], [2, 0], [3, 1], [4, 3]]], true, true)],
    reference: {
      javascript: `function canFinish(n, pre) {\n  const indeg = new Array(n).fill(0), adj = Array.from({ length: n }, () => []);\n  for (const [a, b] of pre) { adj[b].push(a); indeg[a]++; }\n  const q = []; for (let i = 0; i < n; i++) if (!indeg[i]) q.push(i);\n  let done = 0;\n  while (q.length) { const c = q.pop(); done++; for (const nx of adj[c]) if (--indeg[nx] === 0) q.push(nx); }\n  return done === n;\n}`,
      python: `def canFinish(n, pre):\n    indeg, adj = [0] * n, [[] for _ in range(n)]\n    for a, b in pre:\n        adj[b].append(a)\n        indeg[a] += 1\n    q = [i for i in range(n) if indeg[i] == 0]\n    done = 0\n    while q:\n        c = q.pop()\n        done += 1\n        for nx in adj[c]:\n            indeg[nx] -= 1\n            if indeg[nx] == 0:\n                q.append(nx)\n    return done == n`,
    },
  },
  {
    id: 'q-028', title: 'Network Delay Time', difficulty: 'MEDIUM', categoryId: 'cat-graphs',
    skills: [['sk-shortest-path', 1], ['sk-heap', 0.6]], tags: ['graphs', 'dijkstra', 'heap'],
    description: '`times[i] = [u, v, w]` is a directed edge from u to v taking w time. Nodes are labeled 1..n. A signal is sent from node k; return the time for all nodes to receive it, or -1 if impossible.',
    hints: ['Dijkstra from k; the answer is the largest shortest-path distance.'],
    timeLimitMs: 3000,
    type: 'CODE',
    code: { functionName: 'networkDelayTime', params: [{ name: 'times', type: 'int[][]' }, { name: 'n', type: 'int' }, { name: 'k', type: 'int' }], returnType: 'int' },
    tests: [t([[[2, 1, 1], [2, 3, 1], [3, 4, 1]], 4, 2], 2), t([[[1, 2, 1]], 2, 1], 1), t([[[1, 2, 1]], 2, 2], -1, true), t([[[1, 2, 4], [1, 3, 1], [3, 2, 1]], 3, 1], 2, true)],
    reference: {
      javascript: `function networkDelayTime(times, n, k) {\n  const dist = new Array(n + 1).fill(Infinity); dist[k] = 0;\n  const done = new Array(n + 1).fill(false);\n  const adj = Array.from({ length: n + 1 }, () => []);\n  for (const [u, v, w] of times) adj[u].push([v, w]);\n  for (let it = 0; it < n; it++) {\n    let u = -1; for (let i = 1; i <= n; i++) if (!done[i] && (u === -1 || dist[i] < dist[u])) u = i;\n    if (dist[u] === Infinity) break; done[u] = true;\n    for (const [v, w] of adj[u]) dist[v] = Math.min(dist[v], dist[u] + w);\n  }\n  const m = Math.max(...dist.slice(1));\n  return m === Infinity ? -1 : m;\n}`,
      python: `def networkDelayTime(times, n, k):\n    import heapq\n    adj = {}\n    for u, v, w in times:\n        adj.setdefault(u, []).append((v, w))\n    dist, pq = {}, [(0, k)]\n    while pq:\n        d, u = heapq.heappop(pq)\n        if u in dist:\n            continue\n        dist[u] = d\n        for v, w in adj.get(u, []):\n            if v not in dist:\n                heapq.heappush(pq, (d + w, v))\n    return max(dist.values()) if len(dist) == n else -1`,
    },
  },

  // ───────────────────────────── Dynamic Programming ─────────────────────────────
  {
    id: 'q-009', title: 'Climbing Stairs', difficulty: 'EASY', categoryId: 'cat-dp',
    skills: [['sk-dp-1d', 1]], tags: ['dynamic-programming'],
    description: 'You can climb 1 or 2 steps at a time. In how many distinct ways can you reach step `n`?',
    hints: ['ways(n) = ways(n-1) + ways(n-2).'],
    type: 'CODE',
    code: { functionName: 'climbStairs', params: [{ name: 'n', type: 'int' }], returnType: 'int' },
    tests: [t([2], 2), t([3], 3), t([1], 1, true), t([10], 89, true), t([45], 1836311903, true)],
    reference: {
      javascript: `function climbStairs(n) {\n  let a = 1, b = 1;\n  for (let i = 0; i < n; i++) [a, b] = [b, a + b];\n  return a;\n}`,
      python: `def climbStairs(n):\n    a, b = 1, 1\n    for _ in range(n):\n        a, b = b, a + b\n    return a`,
    },
  },
  {
    id: 'q-004', title: 'Longest Common Subsequence', difficulty: 'MEDIUM', categoryId: 'cat-dp',
    skills: [['sk-dp-2d', 1], ['sk-dp-lcs', 1]], tags: ['dynamic-programming', 'strings'],
    description: 'Return the length of the longest common subsequence of `text1` and `text2`.',
    hints: ['dp[i][j] = dp[i-1][j-1] + 1 when chars match, else max(dp[i-1][j], dp[i][j-1]).'],
    timeLimitMs: 3000,
    type: 'CODE',
    code: { functionName: 'longestCommonSubsequence', params: [{ name: 'text1', type: 'string' }, { name: 'text2', type: 'string' }], returnType: 'int' },
    tests: [t(['abcde', 'ace'], 3), t(['abc', 'abc'], 3), t(['abc', 'def'], 0), t(['bsbininm', 'jmjkbkjkv'], 1, true), t(['oxcpqrsvwf', 'shmtulqrypy'], 2, true)],
    reference: {
      javascript: `function longestCommonSubsequence(a, b) {\n  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));\n  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)\n    dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);\n  return dp[a.length][b.length];\n}`,
      python: `def longestCommonSubsequence(a, b):\n    dp = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]\n    for i in range(1, len(a) + 1):\n        for j in range(1, len(b) + 1):\n            dp[i][j] = dp[i-1][j-1] + 1 if a[i-1] == b[j-1] else max(dp[i-1][j], dp[i][j-1])\n    return dp[-1][-1]`,
    },
  },
  {
    id: 'q-029', title: 'Coin Change', difficulty: 'MEDIUM', categoryId: 'cat-dp',
    skills: [['sk-dp-knap', 1], ['sk-dp-1d', 0.6]], tags: ['dynamic-programming', 'knapsack'],
    description: 'Return the fewest coins needed to make up `amount` using unlimited coins of the given denominations, or -1 if impossible.',
    hints: ['dp[x] = min over coins c of dp[x - c] + 1.'],
    type: 'CODE',
    code: { functionName: 'coinChange', params: [{ name: 'coins', type: 'int[]' }, { name: 'amount', type: 'int' }], returnType: 'int' },
    tests: [t([[1, 2, 5], 11], 3), t([[2], 3], -1), t([[1], 0], 0), t([[186, 419, 83, 408], 6249], 20, true), t([[2, 5, 10, 1], 27], 4, true)],
    reference: {
      javascript: `function coinChange(coins, amount) {\n  const dp = new Array(amount + 1).fill(Infinity); dp[0] = 0;\n  for (let x = 1; x <= amount; x++) for (const c of coins) if (c <= x) dp[x] = Math.min(dp[x], dp[x - c] + 1);\n  return dp[amount] === Infinity ? -1 : dp[amount];\n}`,
      python: `def coinChange(coins, amount):\n    dp = [0] + [float('inf')] * amount\n    for x in range(1, amount + 1):\n        for c in coins:\n            if c <= x:\n                dp[x] = min(dp[x], dp[x - c] + 1)\n    return -1 if dp[amount] == float('inf') else dp[amount]`,
    },
  },
  {
    id: 'q-030', title: 'House Robber', difficulty: 'MEDIUM', categoryId: 'cat-dp',
    skills: [['sk-dp-1d', 1]], tags: ['dynamic-programming'],
    description: 'Adjacent houses cannot both be robbed. Given the money in each house, return the maximum amount you can rob.',
    hints: ['best(i) = max(best(i-1), best(i-2) + nums[i]).'],
    type: 'CODE',
    code: { functionName: 'rob', params: [{ name: 'nums', type: 'int[]' }], returnType: 'int' },
    tests: [t([[1, 2, 3, 1]], 4), t([[2, 7, 9, 3, 1]], 12), t([[0]], 0, true), t([[2, 1, 1, 2]], 4, true)],
    reference: {
      javascript: `function rob(nums) {\n  let a = 0, b = 0;\n  for (const x of nums) [a, b] = [b, Math.max(b, a + x)];\n  return b;\n}`,
      python: `def rob(nums):\n    a = b = 0\n    for x in nums:\n        a, b = b, max(b, a + x)\n    return b`,
    },
  },
  {
    id: 'q-031', title: 'Longest Increasing Subsequence', difficulty: 'MEDIUM', categoryId: 'cat-dp',
    skills: [['sk-dp-lcs', 1], ['sk-binary-search', 0.5]], tags: ['dynamic-programming', 'binary-search'],
    description: 'Return the length of the longest strictly increasing subsequence of `nums`.',
    hints: ['O(n log n): maintain tails[] and binary-search the insertion point.'],
    type: 'CODE',
    code: { functionName: 'lengthOfLIS', params: [{ name: 'nums', type: 'int[]' }], returnType: 'int' },
    tests: [t([[10, 9, 2, 5, 3, 7, 101, 18]], 4), t([[0, 1, 0, 3, 2, 3]], 4), t([[7, 7, 7, 7]], 1, true), t([[4, 10, 4, 3, 8, 9]], 3, true)],
    reference: {
      javascript: `function lengthOfLIS(nums) {\n  const tails = [];\n  for (const x of nums) {\n    let lo = 0, hi = tails.length;\n    while (lo < hi) { const m = (lo + hi) >> 1; if (tails[m] < x) lo = m + 1; else hi = m; }\n    tails[lo] = x;\n  }\n  return tails.length;\n}`,
      python: `def lengthOfLIS(nums):\n    import bisect\n    tails = []\n    for x in nums:\n        i = bisect.bisect_left(tails, x)\n        if i == len(tails):\n            tails.append(x)\n        else:\n            tails[i] = x\n    return len(tails)`,
    },
  },

  // ───────────────────────────── Sorting & Searching ─────────────────────────────
  {
    id: 'q-032', title: 'Binary Search', difficulty: 'EASY', categoryId: 'cat-sorting',
    skills: [['sk-binary-search', 1]], tags: ['binary-search'],
    description: 'Given a sorted array `nums` and a `target`, return its index or -1. Your algorithm must run in O(log n).',
    hints: ['Keep the invariant that the answer lies in [lo, hi].'],
    type: 'CODE',
    code: { functionName: 'search', params: [{ name: 'nums', type: 'int[]' }, { name: 'target', type: 'int' }], returnType: 'int' },
    tests: [t([[-1, 0, 3, 5, 9, 12], 9], 4), t([[-1, 0, 3, 5, 9, 12], 2], -1), t([[5], 5], 0, true), t([[1, 3], 3], 1, true)],
    reference: {
      javascript: `function search(nums, target) {\n  let lo = 0, hi = nums.length - 1;\n  while (lo <= hi) { const m = (lo + hi) >> 1; if (nums[m] === target) return m; if (nums[m] < target) lo = m + 1; else hi = m - 1; }\n  return -1;\n}`,
      python: `def search(nums, target):\n    lo, hi = 0, len(nums) - 1\n    while lo <= hi:\n        m = (lo + hi) // 2\n        if nums[m] == target:\n            return m\n        if nums[m] < target:\n            lo = m + 1\n        else:\n            hi = m - 1\n    return -1`,
    },
  },
  {
    id: 'q-033', title: 'Search in Rotated Sorted Array', difficulty: 'MEDIUM', categoryId: 'cat-sorting',
    skills: [['sk-binary-search', 1]], tags: ['binary-search'],
    description: 'A sorted array of distinct integers was rotated at an unknown pivot. Return the index of `target` or -1, in O(log n).',
    hints: ['At each step one half [lo, mid] or [mid, hi] is sorted — check whether target lies inside it.'],
    type: 'CODE',
    code: { functionName: 'searchRotated', params: [{ name: 'nums', type: 'int[]' }, { name: 'target', type: 'int' }], returnType: 'int' },
    tests: [t([[4, 5, 6, 7, 0, 1, 2], 0], 4), t([[4, 5, 6, 7, 0, 1, 2], 3], -1), t([[1], 0], -1, true), t([[3, 1], 1], 1, true), t([[5, 1, 3], 5], 0, true)],
    reference: {
      javascript: `function searchRotated(nums, target) {\n  let lo = 0, hi = nums.length - 1;\n  while (lo <= hi) {\n    const m = (lo + hi) >> 1;\n    if (nums[m] === target) return m;\n    if (nums[lo] <= nums[m]) { if (nums[lo] <= target && target < nums[m]) hi = m - 1; else lo = m + 1; }\n    else { if (nums[m] < target && target <= nums[hi]) lo = m + 1; else hi = m - 1; }\n  }\n  return -1;\n}`,
      python: `def searchRotated(nums, target):\n    lo, hi = 0, len(nums) - 1\n    while lo <= hi:\n        m = (lo + hi) // 2\n        if nums[m] == target:\n            return m\n        if nums[lo] <= nums[m]:\n            if nums[lo] <= target < nums[m]:\n                hi = m - 1\n            else:\n                lo = m + 1\n        else:\n            if nums[m] < target <= nums[hi]:\n                lo = m + 1\n            else:\n                hi = m - 1\n    return -1`,
    },
  },
  {
    id: 'q-034', title: 'Kth Largest Element in an Array', difficulty: 'MEDIUM', categoryId: 'cat-sorting',
    skills: [['sk-heap', 1], ['sk-sorting', 0.6]], tags: ['heap', 'sorting', 'quickselect'],
    description: 'Return the kth largest element in `nums` (in sorted order, not the kth distinct).',
    hints: ['A min-heap of size k keeps the k largest seen so far.'],
    type: 'CODE',
    code: { functionName: 'findKthLargest', params: [{ name: 'nums', type: 'int[]' }, { name: 'k', type: 'int' }], returnType: 'int' },
    tests: [t([[3, 2, 1, 5, 6, 4], 2], 5), t([[3, 2, 3, 1, 2, 4, 5, 5, 6], 4], 4), t([[1], 1], 1, true), t([[-1, -1], 2], -1, true)],
    reference: {
      javascript: `function findKthLargest(nums, k) {\n  return [...nums].sort((a, b) => b - a)[k - 1];\n}`,
      python: `def findKthLargest(nums, k):\n    import heapq\n    return heapq.nlargest(k, nums)[-1]`,
    },
  },

  // ───────────────────────────── Greedy & Intervals ─────────────────────────────
  {
    id: 'q-035', title: 'Merge Intervals', difficulty: 'MEDIUM', categoryId: 'cat-greedy',
    skills: [['sk-intervals', 1], ['sk-sorting', 0.6]], tags: ['intervals', 'sorting'],
    description: 'Merge all overlapping intervals and return the non-overlapping intervals sorted by start.',
    hints: ['Sort by start; extend the last merged interval while the next one overlaps.'],
    type: 'CODE',
    code: { functionName: 'merge', params: [{ name: 'intervals', type: 'int[][]' }], returnType: 'int[][]' },
    tests: [t([[[1, 3], [2, 6], [8, 10], [15, 18]]], [[1, 6], [8, 10], [15, 18]]), t([[[1, 4], [4, 5]]], [[1, 5]]), t([[[1, 4], [0, 4]]], [[0, 4]], true), t([[[1, 4], [2, 3]]], [[1, 4]], true)],
    reference: {
      javascript: `function merge(intervals) {\n  const s = [...intervals].sort((a, b) => a[0] - b[0]), out = [];\n  for (const [a, b] of s) { if (out.length && a <= out[out.length - 1][1]) out[out.length - 1][1] = Math.max(out[out.length - 1][1], b); else out.push([a, b]); }\n  return out;\n}`,
      python: `def merge(intervals):\n    out = []\n    for a, b in sorted(intervals):\n        if out and a <= out[-1][1]:\n            out[-1][1] = max(out[-1][1], b)\n        else:\n            out.append([a, b])\n    return out`,
    },
  },
  {
    id: 'q-036', title: 'Jump Game', difficulty: 'MEDIUM', categoryId: 'cat-greedy',
    skills: [['sk-greedy', 1]], tags: ['greedy', 'arrays'],
    description: '`nums[i]` is your maximum jump length from index i. Starting at index 0, return true if you can reach the last index.',
    hints: ['Track the furthest index reachable so far.'],
    type: 'CODE',
    code: { functionName: 'canJump', params: [{ name: 'nums', type: 'int[]' }], returnType: 'bool' },
    tests: [t([[2, 3, 1, 1, 4]], true), t([[3, 2, 1, 0, 4]], false), t([[0]], true, true), t([[2, 0, 0]], true, true), t([[1, 0, 1, 0]], false, true)],
    reference: {
      javascript: `function canJump(nums) {\n  let reach = 0;\n  for (let i = 0; i < nums.length; i++) { if (i > reach) return false; reach = Math.max(reach, i + nums[i]); }\n  return true;\n}`,
      python: `def canJump(nums):\n    reach = 0\n    for i, x in enumerate(nums):\n        if i > reach:\n            return False\n        reach = max(reach, i + x)\n    return True`,
    },
  },

  // ───────────────────────────── Backtracking ─────────────────────────────
  {
    id: 'q-037', title: 'Subsets', difficulty: 'MEDIUM', categoryId: 'cat-recursion',
    skills: [['sk-backtracking', 1], ['sk-recursion', 0.6]], tags: ['backtracking', 'bit-manipulation'],
    description: 'Given distinct integers `nums`, return all possible subsets (the power set) in any order.',
    hints: ['For each element choose include / exclude.'],
    type: 'CODE',
    code: { functionName: 'subsets', params: [{ name: 'nums', type: 'int[]' }], returnType: 'int[][]', compare: 'unorderedNested' },
    tests: [t([[1, 2, 3]], [[], [1], [2], [1, 2], [3], [1, 3], [2, 3], [1, 2, 3]]), t([[0]], [[], [0]]), t([[]], [[]], true), t([[5, 9]], [[], [5], [9], [5, 9]], true)],
    reference: {
      javascript: `function subsets(nums) {\n  let out = [[]];\n  for (const x of nums) out = out.concat(out.map((s) => [...s, x]));\n  return out;\n}`,
      python: `def subsets(nums):\n    out = [[]]\n    for x in nums:\n        out += [s + [x] for s in out]\n    return out`,
    },
  },
  {
    id: 'q-038', title: 'Permutations', difficulty: 'MEDIUM', categoryId: 'cat-recursion',
    skills: [['sk-backtracking', 1], ['sk-recursion', 0.6]], tags: ['backtracking'],
    description: 'Given distinct integers `nums`, return all possible permutations in any order.',
    hints: ['Swap-based or used[]-based backtracking.'],
    type: 'CODE',
    code: { functionName: 'permute', params: [{ name: 'nums', type: 'int[]' }], returnType: 'int[][]', compare: 'unordered' },
    tests: [t([[1, 2, 3]], [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]]), t([[0, 1]], [[0, 1], [1, 0]]), t([[1]], [[1]], true)],
    reference: {
      javascript: `function permute(nums) {\n  if (nums.length <= 1) return [nums.slice()];\n  return nums.flatMap((x, i) => permute([...nums.slice(0, i), ...nums.slice(i + 1)]).map((p) => [x, ...p]));\n}`,
      python: `def permute(nums):\n    from itertools import permutations\n    return [list(p) for p in permutations(nums)]`,
    },
  },

  // ───────────────────────────── SQL (SQLite dialect) ─────────────────────────────
  {
    id: 'q-007', title: 'Employees Earning More Than Their Managers', difficulty: 'EASY', categoryId: 'cat-db',
    skills: [['sk-sql-joins', 1]], tags: ['sql', 'self-join'],
    description: 'Table `Employee(id, name, salary, managerId)`. Return the `name` of every employee who earns more than their manager, ordered by name. Output column: `Employee`.',
    hints: ['Self-join Employee e with Employee m ON e.managerId = m.id.'],
    type: 'SQL',
    sql: {
      orderMatters: true,
      setup: `CREATE TABLE Employee (id INTEGER PRIMARY KEY, name TEXT, salary INTEGER, managerId INTEGER);
INSERT INTO Employee VALUES (1,'Joe',70000,3),(2,'Henry',80000,4),(3,'Sam',60000,NULL),(4,'Max',90000,NULL),(5,'Ava',95000,4),(6,'Liam',50000,3);`,
    },
    tests: [s([['Ava'], ['Joe']])],
    reference: { sql: `SELECT e.name AS Employee FROM Employee e JOIN Employee m ON e.managerId = m.id WHERE e.salary > m.salary ORDER BY e.name;` },
  },
  {
    id: 'q-040', title: 'Second Highest Salary', difficulty: 'MEDIUM', categoryId: 'cat-db',
    skills: [['sk-sql-subquery', 1], ['sk-sql-agg', 0.5]], tags: ['sql', 'subquery'],
    description: 'Table `Employee(id, salary)`. Return the second highest **distinct** salary as `SecondHighestSalary` (NULL if it does not exist).',
    hints: ['MAX(salary) WHERE salary < (SELECT MAX(salary) ...)'],
    type: 'SQL',
    sql: {
      orderMatters: true,
      setup: `CREATE TABLE Employee (id INTEGER PRIMARY KEY, salary INTEGER);
INSERT INTO Employee VALUES (1,100),(2,300),(3,200),(4,300);`,
    },
    tests: [s([[200]])],
    reference: { sql: `SELECT MAX(salary) AS SecondHighestSalary FROM Employee WHERE salary < (SELECT MAX(salary) FROM Employee);` },
  },
  {
    id: 'q-041', title: 'Top Earner per Department', difficulty: 'HARD', categoryId: 'cat-db',
    skills: [['sk-sql-window', 1], ['sk-sql-joins', 0.6]], tags: ['sql', 'window-functions'],
    description: 'Tables `Employee(id, name, salary, departmentId)` and `Department(id, name)`. For each department return the employee(s) with the highest salary, ties included. Columns: `Department`, `Employee`, `Salary`, ordered by Department then Employee.',
    hints: ['RANK() OVER (PARTITION BY departmentId ORDER BY salary DESC) = 1'],
    type: 'SQL',
    sql: {
      orderMatters: true,
      setup: `CREATE TABLE Department (id INTEGER PRIMARY KEY, name TEXT);
CREATE TABLE Employee (id INTEGER PRIMARY KEY, name TEXT, salary INTEGER, departmentId INTEGER);
INSERT INTO Department VALUES (1,'Engineering'),(2,'Sales');
INSERT INTO Employee VALUES (1,'Joe',70000,1),(2,'Jim',90000,1),(3,'Henry',80000,2),(4,'Sam',60000,2),(5,'Max',90000,1);`,
    },
    tests: [s([['Engineering', 'Jim', 90000], ['Engineering', 'Max', 90000], ['Sales', 'Henry', 80000]])],
    reference: {
      sql: `SELECT d.name AS Department, r.name AS Employee, r.salary AS Salary FROM (
  SELECT e.*, RANK() OVER (PARTITION BY departmentId ORDER BY salary DESC) AS rk FROM Employee e
) r JOIN Department d ON d.id = r.departmentId WHERE r.rk = 1 ORDER BY Department, Employee;`,
    },
  },
  {
    id: 'q-042', title: 'Customers Who Never Order', difficulty: 'EASY', categoryId: 'cat-db',
    skills: [['sk-sql-joins', 1], ['sk-sql-subquery', 0.5]], tags: ['sql', 'left-join'],
    description: 'Tables `Customers(id, name)` and `Orders(id, customerId)`. Return the names of customers who never placed an order, ordered by name. Column: `Customers`.',
    hints: ['LEFT JOIN Orders and keep rows where the order is NULL.'],
    type: 'SQL',
    sql: {
      orderMatters: true,
      setup: `CREATE TABLE Customers (id INTEGER PRIMARY KEY, name TEXT);
CREATE TABLE Orders (id INTEGER PRIMARY KEY, customerId INTEGER);
INSERT INTO Customers VALUES (1,'Joe'),(2,'Henry'),(3,'Sam'),(4,'Max');
INSERT INTO Orders VALUES (1,3),(2,1);`,
    },
    tests: [s([['Henry'], ['Max']])],
    reference: { sql: `SELECT c.name AS Customers FROM Customers c LEFT JOIN Orders o ON o.customerId = c.id WHERE o.id IS NULL ORDER BY c.name;` },
  },
  {
    id: 'q-043', title: 'Monthly Revenue', difficulty: 'MEDIUM', categoryId: 'cat-db',
    skills: [['sk-sql-agg', 1]], tags: ['sql', 'group-by'],
    description: "Table `Sales(id, sold_on TEXT 'YYYY-MM-DD', amount)`. Return each month (`month` as 'YYYY-MM') with its total revenue (`revenue`) and number of sales (`orders`), only for months with revenue above 100, ordered by month.",
    hints: ["substr(sold_on, 1, 7) extracts YYYY-MM in SQLite.", 'Filter aggregated rows with HAVING.'],
    type: 'SQL',
    sql: {
      orderMatters: true,
      setup: `CREATE TABLE Sales (id INTEGER PRIMARY KEY, sold_on TEXT, amount INTEGER);
INSERT INTO Sales VALUES (1,'2026-01-03',50),(2,'2026-01-20',70),(3,'2026-02-11',40),(4,'2026-03-01',200),(5,'2026-03-15',10);`,
    },
    tests: [s([['2026-01', 120, 2], ['2026-03', 210, 2]])],
    reference: { sql: `SELECT substr(sold_on,1,7) AS month, SUM(amount) AS revenue, COUNT(*) AS orders FROM Sales GROUP BY month HAVING SUM(amount) > 100 ORDER BY month;` },
  },
];
