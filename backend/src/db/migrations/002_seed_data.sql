-- =============================================================================
-- TRAJECTORY — Seed Data v1.0
-- Run after 001_create_schema.sql
-- =============================================================================

-- =============================================================================
-- SKILL CATEGORIES (top-level)
-- =============================================================================
INSERT INTO SKILL_CATEGORIES (CATEGORY_ID, NAME, ICON, DISPLAY_ORDER) VALUES
('cat-dsa',   'Data Structures & Algorithms', 'solar:code-square-bold-duotone', 1);
INSERT INTO SKILL_CATEGORIES (CATEGORY_ID, NAME, ICON, DISPLAY_ORDER) VALUES
('cat-db',    'Databases & SQL',              'solar:database-bold-duotone',    2);
INSERT INTO SKILL_CATEGORIES (CATEGORY_ID, NAME, ICON, DISPLAY_ORDER) VALUES
('cat-os',    'Operating Systems',            'solar:server-2-bold-duotone',    3);
INSERT INTO SKILL_CATEGORIES (CATEGORY_ID, NAME, ICON, DISPLAY_ORDER) VALUES
('cat-net',   'Computer Networks',            'solar:wifi-square-bold-duotone', 4);
INSERT INTO SKILL_CATEGORIES (CATEGORY_ID, NAME, ICON, DISPLAY_ORDER) VALUES
('cat-oop',   'Object-Oriented Programming',  'solar:box-bold-duotone',         5);
INSERT INTO SKILL_CATEGORIES (CATEGORY_ID, NAME, ICON, DISPLAY_ORDER) VALUES
('cat-lang',  'Programming Languages',        'solar:code-bold-duotone',        6);
INSERT INTO SKILL_CATEGORIES (CATEGORY_ID, NAME, ICON, DISPLAY_ORDER) VALUES
('cat-sys',   'System Design',                'solar:layers-bold-duotone',      7);

-- DSA Sub-categories
INSERT INTO SKILL_CATEGORIES (CATEGORY_ID, NAME, PARENT_ID, DISPLAY_ORDER) VALUES
('cat-arrays',     'Arrays & Strings',    'cat-dsa', 1);
INSERT INTO SKILL_CATEGORIES (CATEGORY_ID, NAME, PARENT_ID, DISPLAY_ORDER) VALUES
('cat-ll',         'Linked Lists',        'cat-dsa', 2);
INSERT INTO SKILL_CATEGORIES (CATEGORY_ID, NAME, PARENT_ID, DISPLAY_ORDER) VALUES
('cat-trees',      'Trees',               'cat-dsa', 3);
INSERT INTO SKILL_CATEGORIES (CATEGORY_ID, NAME, PARENT_ID, DISPLAY_ORDER) VALUES
('cat-graphs',     'Graphs',              'cat-dsa', 4);
INSERT INTO SKILL_CATEGORIES (CATEGORY_ID, NAME, PARENT_ID, DISPLAY_ORDER) VALUES
('cat-dp',         'Dynamic Programming', 'cat-dsa', 5);
INSERT INTO SKILL_CATEGORIES (CATEGORY_ID, NAME, PARENT_ID, DISPLAY_ORDER) VALUES
('cat-sorting',    'Sorting & Searching', 'cat-dsa', 6);
INSERT INTO SKILL_CATEGORIES (CATEGORY_ID, NAME, PARENT_ID, DISPLAY_ORDER) VALUES
('cat-greedy',     'Greedy Algorithms',   'cat-dsa', 7);
INSERT INTO SKILL_CATEGORIES (CATEGORY_ID, NAME, PARENT_ID, DISPLAY_ORDER) VALUES
('cat-recursion',  'Recursion & Backtracking', 'cat-dsa', 8);
INSERT INTO SKILL_CATEGORIES (CATEGORY_ID, NAME, PARENT_ID, DISPLAY_ORDER) VALUES
('cat-hashing',    'Hashing',             'cat-dsa', 9);
INSERT INTO SKILL_CATEGORIES (CATEGORY_ID, NAME, PARENT_ID, DISPLAY_ORDER) VALUES
('cat-stack',      'Stacks & Queues',     'cat-dsa', 10);

-- =============================================================================
-- SKILLS
-- =============================================================================

-- Arrays & Strings
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-array-traversal', 'cat-arrays', 'Array Traversal');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-two-pointer',      'cat-arrays', 'Two Pointers');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-sliding-window',   'cat-arrays', 'Sliding Window');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-prefix-sum',       'cat-arrays', 'Prefix Sum');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-string-manip',     'cat-arrays', 'String Manipulation');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-binary-search',    'cat-arrays', 'Binary Search');

-- Graphs
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-bfs',            'cat-graphs', 'BFS');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-dfs',            'cat-graphs', 'DFS');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-shortest-path',  'cat-graphs', 'Shortest Path');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-mst',            'cat-graphs', 'Minimum Spanning Tree');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-topo-sort',      'cat-graphs', 'Topological Sort');

-- Trees
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-bst',           'cat-trees', 'Binary Search Tree');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-tree-traversal','cat-trees', 'Tree Traversal');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-lca',           'cat-trees', 'LCA');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-segment-tree',  'cat-trees', 'Segment Tree');

-- Dynamic Programming
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-dp-1d',     'cat-dp', '1D DP');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-dp-2d',     'cat-dp', '2D DP');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-dp-knap',   'cat-dp', 'Knapsack Problems');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-dp-lcs',    'cat-dp', 'LCS/LIS');

-- SQL
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-sql-joins',    'cat-db', 'SQL Joins');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-sql-agg',      'cat-db', 'Aggregations');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-sql-window',   'cat-db', 'Window Functions');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-sql-subquery', 'cat-db', 'Subqueries');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-db-index',     'cat-db', 'Indexing');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-db-norm',      'cat-db', 'Normalization');

-- OOP
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-oop-encap',  'cat-oop', 'Encapsulation');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-oop-inherit','cat-oop', 'Inheritance');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-oop-poly',   'cat-oop', 'Polymorphism');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-oop-design', 'cat-oop', 'Design Patterns');

-- Stacks & Queues
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-stack',         'cat-stack', 'Stack Operations');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-queue',         'cat-stack', 'Queue / Deque');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-monotonic',     'cat-stack', 'Monotonic Stack');

-- =============================================================================
-- JOB ROLES
-- =============================================================================
INSERT INTO JOB_ROLES (ROLE_ID, TITLE, INDUSTRY, LEVEL) VALUES
('role-swe',    'Software Engineer',          'Technology',     'Mid');
INSERT INTO JOB_ROLES (ROLE_ID, TITLE, INDUSTRY, LEVEL) VALUES
('role-fe',     'Frontend Developer',         'Technology',     'Mid');
INSERT INTO JOB_ROLES (ROLE_ID, TITLE, INDUSTRY, LEVEL) VALUES
('role-be',     'Backend Developer',          'Technology',     'Mid');
INSERT INTO JOB_ROLES (ROLE_ID, TITLE, INDUSTRY, LEVEL) VALUES
('role-fs',     'Full Stack Developer',       'Technology',     'Mid');
INSERT INTO JOB_ROLES (ROLE_ID, TITLE, INDUSTRY, LEVEL) VALUES
('role-da',     'Data Analyst',               'Technology',     'Junior');
INSERT INTO JOB_ROLES (ROLE_ID, TITLE, INDUSTRY, LEVEL) VALUES
('role-ds',     'Data Scientist',             'Technology',     'Senior');
INSERT INTO JOB_ROLES (ROLE_ID, TITLE, INDUSTRY, LEVEL) VALUES
('role-ml',     'ML Engineer',                'Technology',     'Senior');
INSERT INTO JOB_ROLES (ROLE_ID, TITLE, INDUSTRY, LEVEL) VALUES
('role-devops', 'DevOps Engineer',            'Technology',     'Mid');
INSERT INTO JOB_ROLES (ROLE_ID, TITLE, INDUSTRY, LEVEL) VALUES
('role-intern', 'Software Engineering Intern','Technology',     'Intern');

-- Required skills for Software Engineer
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-swe','sk-array-traversal',70,1.0);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-swe','sk-two-pointer',60,0.9);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-swe','sk-bfs',65,1.0);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-swe','sk-dfs',65,1.0);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-swe','sk-dp-1d',60,0.9);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-swe','sk-sql-joins',55,0.7);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-swe','sk-oop-design',60,0.8);

-- Required skills for Data Analyst
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-da','sk-sql-joins',80,1.0);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-da','sk-sql-agg',80,1.0);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-da','sk-sql-window',70,0.9);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-da','sk-sql-subquery',70,0.9);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-da','sk-db-index',60,0.7);

-- =============================================================================
-- SAMPLE QUESTIONS (10 to start with)
-- =============================================================================
INSERT INTO QUESTIONS (QUESTION_ID, TITLE, DESCRIPTION, DIFFICULTY, CATEGORY_ID, TAGS, EXAMPLES, HINTS, TIME_LIMIT_MS)
VALUES ('q-001', 'Two Sum',
  'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
  'EASY', 'cat-arrays', 'arrays,hashing,two-pointers',
  '[{"input":"nums = [2,7,11,15], target = 9","output":"[0,1]","explanation":"Because nums[0] + nums[1] == 9"},{"input":"nums = [3,2,4], target = 6","output":"[1,2]"}]',
  '["Try using a hash map to store complements","For each number x, check if target - x exists in the map"]',
  2000);

INSERT INTO QUESTIONS (QUESTION_ID, TITLE, DESCRIPTION, DIFFICULTY, CATEGORY_ID, TAGS, EXAMPLES, HINTS, TIME_LIMIT_MS)
VALUES ('q-002', 'Valid Parentheses',
  'Given a string s containing just the characters ''('', '')'', ''{'', ''}'', ''['' and '']'', determine if the input string is valid. An input string is valid if: Open brackets are closed by the same type of brackets, and open brackets are closed in the correct order.',
  'EASY', 'cat-stack', 'stack,strings',
  '[{"input":"s = \"()\"","output":"true"},{"input":"s = \"()[]{}\"","output":"true"},{"input":"s = \"(]\"","output":"false"}]',
  '["Use a stack to keep track of opening brackets","When you see a closing bracket, check if the top of the stack matches"]',
  2000);

INSERT INTO QUESTIONS (QUESTION_ID, TITLE, DESCRIPTION, DIFFICULTY, CATEGORY_ID, TAGS, EXAMPLES, HINTS, TIME_LIMIT_MS)
VALUES ('q-003', 'Number of Islands',
  'Given an m x n 2D binary grid grid which represents a map of ''1''s (land) and ''0''s (water), return the number of islands. An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.',
  'MEDIUM', 'cat-graphs', 'graphs,bfs,dfs,matrix',
  '[{"input":"grid = [[\"1\",\"1\",\"1\",\"1\",\"0\"],[\"1\",\"1\",\"0\",\"1\",\"0\"],[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"0\",\"0\",\"0\",\"0\",\"0\"]]","output":"1"},{"input":"grid = [[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"0\",\"0\",\"1\",\"0\",\"0\"],[\"0\",\"0\",\"0\",\"1\",\"1\"]]","output":"3"}]',
  '["Use DFS or BFS to explore each island","Mark visited cells to avoid counting them twice"]',
  3000);

INSERT INTO QUESTIONS (QUESTION_ID, TITLE, DESCRIPTION, DIFFICULTY, CATEGORY_ID, TAGS, EXAMPLES, HINTS, TIME_LIMIT_MS)
VALUES ('q-004', 'Longest Common Subsequence',
  'Given two strings text1 and text2, return the length of their longest common subsequence. A subsequence of a string is a new string generated from the original string with some characters (can be none) deleted without changing the relative order of the remaining characters.',
  'MEDIUM', 'cat-dp', 'dynamic-programming,strings,2d-dp',
  '[{"input":"text1 = \"abcde\", text2 = \"ace\"","output":"3","explanation":"The LCS is \"ace\" of length 3"},{"input":"text1 = \"abc\", text2 = \"abc\"","output":"3"}]',
  '["Build a 2D dp table","dp[i][j] = LCS of text1[0..i] and text2[0..j]","If characters match: dp[i][j] = dp[i-1][j-1] + 1"]',
  3000);

INSERT INTO QUESTIONS (QUESTION_ID, TITLE, DESCRIPTION, DIFFICULTY, CATEGORY_ID, TAGS, EXAMPLES, HINTS, TIME_LIMIT_MS)
VALUES ('q-005', 'Course Schedule',
  'There are numCourses courses labeled from 0 to numCourses-1. You are given an array prerequisites where prerequisites[i] = [ai, bi] indicates that you must take course bi first if you want to take course ai. Return true if you can finish all courses, false otherwise.',
  'MEDIUM', 'cat-graphs', 'graphs,topological-sort,cycle-detection',
  '[{"input":"numCourses = 2, prerequisites = [[1,0]]","output":"true"},{"input":"numCourses = 2, prerequisites = [[1,0],[0,1]]","output":"false","explanation":"Cycle detected"}]',
  '["Use topological sort (Kahn''s algorithm or DFS)","Detect if there is a cycle in the dependency graph"]',
  3000);

INSERT INTO QUESTIONS (QUESTION_ID, TITLE, DESCRIPTION, DIFFICULTY, CATEGORY_ID, TAGS, EXAMPLES, HINTS, TIME_LIMIT_MS)
VALUES ('q-006', 'Binary Tree Maximum Path Sum',
  'A path in a binary tree is a sequence of nodes where each pair of adjacent nodes has an edge connecting them. A node can only appear in the sequence at most once. The path sum is the sum of node values in the path. Given the root of a binary tree, return the maximum path sum of any non-empty path.',
  'HARD', 'cat-trees', 'trees,dfs,recursion',
  '[{"input":"root = [1,2,3]","output":"6","explanation":"The optimal path is 2 -> 1 -> 3 with sum 6"},{"input":"root = [-10,9,20,null,null,15,7]","output":"42"}]',
  '["At each node, consider four options: node alone, node+left, node+right, node+left+right","Track global maximum separately","Return max(left,right)+node for parent contribution"]',
  3000);

INSERT INTO QUESTIONS (QUESTION_ID, TITLE, DESCRIPTION, DIFFICULTY, CATEGORY_ID, TAGS, EXAMPLES, HINTS, TIME_LIMIT_MS)
VALUES ('q-007', 'Find Employees Earning More Than Manager',
  'Write a SQL query to find all employees who earn more than their managers. The Employee table has columns: id, name, salary, managerId.',
  'EASY', 'cat-db', 'sql,joins,self-join',
  '[{"input":"Employee table: {1,Joe,70000,3},{2,Henry,80000,4},{3,Sam,60000,null},{4,Max,90000,null}","output":"Henry","explanation":"Henry earns more than his manager Max (80000 > 90000? No. Joe earns 70000 < Sam 60000? No. Henry 80000 < Max 90000? No. Actually Joe earns 70000 but manager Sam earns 60000, so Joe)"}]',
  '["Use a self JOIN on the Employee table","Join employee with their manager and compare salaries"]',
  5000);

INSERT INTO QUESTIONS (QUESTION_ID, TITLE, DESCRIPTION, DIFFICULTY, CATEGORY_ID, TAGS, EXAMPLES, HINTS, TIME_LIMIT_MS)
VALUES ('q-008', 'Sliding Window Maximum',
  'You are given an array of integers nums and an integer k. Return an array of the max of each sliding window of size k.',
  'HARD', 'cat-arrays', 'arrays,deque,sliding-window,monotonic',
  '[{"input":"nums = [1,3,-1,-3,5,3,6,7], k = 3","output":"[3,3,5,5,6,7]"},{"input":"nums = [1], k = 1","output":"[1]"}]',
  '["Use a monotonic deque to track max elements","Remove elements outside window from front","Remove smaller elements from back (they can never be max)"]',
  2000);

INSERT INTO QUESTIONS (QUESTION_ID, TITLE, DESCRIPTION, DIFFICULTY, CATEGORY_ID, TAGS, EXAMPLES, HINTS, TIME_LIMIT_MS)
VALUES ('q-009', 'Climb Stairs',
  'You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?',
  'EASY', 'cat-dp', 'dynamic-programming,fibonacci',
  '[{"input":"n = 2","output":"2","explanation":"1+1 or 2"},{"input":"n = 3","output":"3","explanation":"1+1+1, 1+2, 2+1"}]',
  '["This is essentially the Fibonacci sequence","dp[i] = dp[i-1] + dp[i-2]","You can optimize to O(1) space with two variables"]',
  2000);

INSERT INTO QUESTIONS (QUESTION_ID, TITLE, DESCRIPTION, DIFFICULTY, CATEGORY_ID, TAGS, EXAMPLES, HINTS, TIME_LIMIT_MS)
VALUES ('q-010', 'Reverse a Linked List',
  'Given the head of a singly linked list, reverse the list, and return the reversed list.',
  'EASY', 'cat-ll', 'linked-list,iteration,recursion',
  '[{"input":"head = [1,2,3,4,5]","output":"[5,4,3,2,1]"},{"input":"head = [1,2]","output":"[2,1]"}]',
  '["Use three pointers: prev, curr, next","Iteratively reverse the next pointer","Recursion is also elegant: reverse(head.next) then point back"]',
  2000);

-- Link questions to skills
INSERT INTO QUESTION_SKILLS (QUESTION_ID, SKILL_ID, WEIGHT) VALUES ('q-001','sk-array-traversal',0.8);
INSERT INTO QUESTION_SKILLS (QUESTION_ID, SKILL_ID, WEIGHT) VALUES ('q-001','sk-two-pointer',0.6);
INSERT INTO QUESTION_SKILLS (QUESTION_ID, SKILL_ID, WEIGHT) VALUES ('q-002','sk-stack',1.0);
INSERT INTO QUESTION_SKILLS (QUESTION_ID, SKILL_ID, WEIGHT) VALUES ('q-003','sk-bfs',0.7);
INSERT INTO QUESTION_SKILLS (QUESTION_ID, SKILL_ID, WEIGHT) VALUES ('q-003','sk-dfs',0.7);
INSERT INTO QUESTION_SKILLS (QUESTION_ID, SKILL_ID, WEIGHT) VALUES ('q-004','sk-dp-2d',1.0);
INSERT INTO QUESTION_SKILLS (QUESTION_ID, SKILL_ID, WEIGHT) VALUES ('q-005','sk-topo-sort',1.0);
INSERT INTO QUESTION_SKILLS (QUESTION_ID, SKILL_ID, WEIGHT) VALUES ('q-005','sk-dfs',0.5);
INSERT INTO QUESTION_SKILLS (QUESTION_ID, SKILL_ID, WEIGHT) VALUES ('q-006','sk-tree-traversal',0.8);
INSERT INTO QUESTION_SKILLS (QUESTION_ID, SKILL_ID, WEIGHT) VALUES ('q-007','sk-sql-joins',1.0);
INSERT INTO QUESTION_SKILLS (QUESTION_ID, SKILL_ID, WEIGHT) VALUES ('q-008','sk-sliding-window',1.0);
INSERT INTO QUESTION_SKILLS (QUESTION_ID, SKILL_ID, WEIGHT) VALUES ('q-008','sk-monotonic',1.0);
INSERT INTO QUESTION_SKILLS (QUESTION_ID, SKILL_ID, WEIGHT) VALUES ('q-009','sk-dp-1d',1.0);
INSERT INTO QUESTION_SKILLS (QUESTION_ID, SKILL_ID, WEIGHT) VALUES ('q-010','sk-array-traversal',0.3);

-- Sample test cases
INSERT INTO TEST_CASES (TEST_CASE_ID, QUESTION_ID, INPUT_DATA, EXPECTED_OUT, IS_HIDDEN, DISPLAY_ORDER) VALUES
('tc-001-1','q-001','[2,7,11,15]\n9','[0,1]',0,1);
INSERT INTO TEST_CASES (TEST_CASE_ID, QUESTION_ID, INPUT_DATA, EXPECTED_OUT, IS_HIDDEN, DISPLAY_ORDER) VALUES
('tc-001-2','q-001','[3,2,4]\n6','[1,2]',0,2);
INSERT INTO TEST_CASES (TEST_CASE_ID, QUESTION_ID, INPUT_DATA, EXPECTED_OUT, IS_HIDDEN, DISPLAY_ORDER) VALUES
('tc-001-3','q-001','[3,3]\n6','[0,1]',1,3);

COMMIT;
