-- =============================================================================
-- TRAJECTORY — Reference Data v2.0
-- Skill taxonomy, job roles and role requirements.
-- Questions + test cases are seeded from src/db/data/questions.ts (npm run db:seed)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- SKILL CATEGORIES (top-level)
-- -----------------------------------------------------------------------------
INSERT INTO SKILL_CATEGORIES (CATEGORY_ID, NAME, ICON, DISPLAY_ORDER) VALUES ('cat-dsa',  'Data Structures & Algorithms', 'code',     1);
INSERT INTO SKILL_CATEGORIES (CATEGORY_ID, NAME, ICON, DISPLAY_ORDER) VALUES ('cat-db',   'Databases & SQL',              'database', 2);
INSERT INTO SKILL_CATEGORIES (CATEGORY_ID, NAME, ICON, DISPLAY_ORDER) VALUES ('cat-os',   'Operating Systems',            'server',   3);
INSERT INTO SKILL_CATEGORIES (CATEGORY_ID, NAME, ICON, DISPLAY_ORDER) VALUES ('cat-net',  'Computer Networks',            'wifi',     4);
INSERT INTO SKILL_CATEGORIES (CATEGORY_ID, NAME, ICON, DISPLAY_ORDER) VALUES ('cat-oop',  'Object-Oriented Programming',  'box',      5);
INSERT INTO SKILL_CATEGORIES (CATEGORY_ID, NAME, ICON, DISPLAY_ORDER) VALUES ('cat-lang', 'Programming Languages',        'terminal', 6);
INSERT INTO SKILL_CATEGORIES (CATEGORY_ID, NAME, ICON, DISPLAY_ORDER) VALUES ('cat-sys',  'System Design',                'layers',   7);
INSERT INTO SKILL_CATEGORIES (CATEGORY_ID, NAME, ICON, DISPLAY_ORDER) VALUES ('cat-beh',  'Behavioral & Communication',   'message',  8);

-- DSA sub-categories
INSERT INTO SKILL_CATEGORIES (CATEGORY_ID, NAME, PARENT_ID, DISPLAY_ORDER) VALUES ('cat-arrays',    'Arrays & Strings',         'cat-dsa', 1);
INSERT INTO SKILL_CATEGORIES (CATEGORY_ID, NAME, PARENT_ID, DISPLAY_ORDER) VALUES ('cat-ll',        'Linked Lists',             'cat-dsa', 2);
INSERT INTO SKILL_CATEGORIES (CATEGORY_ID, NAME, PARENT_ID, DISPLAY_ORDER) VALUES ('cat-trees',     'Trees',                    'cat-dsa', 3);
INSERT INTO SKILL_CATEGORIES (CATEGORY_ID, NAME, PARENT_ID, DISPLAY_ORDER) VALUES ('cat-graphs',    'Graphs',                   'cat-dsa', 4);
INSERT INTO SKILL_CATEGORIES (CATEGORY_ID, NAME, PARENT_ID, DISPLAY_ORDER) VALUES ('cat-dp',        'Dynamic Programming',      'cat-dsa', 5);
INSERT INTO SKILL_CATEGORIES (CATEGORY_ID, NAME, PARENT_ID, DISPLAY_ORDER) VALUES ('cat-sorting',   'Sorting & Searching',      'cat-dsa', 6);
INSERT INTO SKILL_CATEGORIES (CATEGORY_ID, NAME, PARENT_ID, DISPLAY_ORDER) VALUES ('cat-greedy',    'Greedy Algorithms',        'cat-dsa', 7);
INSERT INTO SKILL_CATEGORIES (CATEGORY_ID, NAME, PARENT_ID, DISPLAY_ORDER) VALUES ('cat-recursion', 'Recursion & Backtracking', 'cat-dsa', 8);
INSERT INTO SKILL_CATEGORIES (CATEGORY_ID, NAME, PARENT_ID, DISPLAY_ORDER) VALUES ('cat-hashing',   'Hashing',                  'cat-dsa', 9);
INSERT INTO SKILL_CATEGORIES (CATEGORY_ID, NAME, PARENT_ID, DISPLAY_ORDER) VALUES ('cat-stack',     'Stacks & Queues',          'cat-dsa', 10);

-- -----------------------------------------------------------------------------
-- SKILLS
-- -----------------------------------------------------------------------------
-- Arrays & Strings
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-array-traversal', 'cat-arrays', 'Array Traversal');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-two-pointer',     'cat-arrays', 'Two Pointers');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-sliding-window',  'cat-arrays', 'Sliding Window');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-prefix-sum',      'cat-arrays', 'Prefix Sum');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-string-manip',    'cat-arrays', 'String Manipulation');
-- Linked lists
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-ll-ops',          'cat-ll', 'Linked List Operations');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-fast-slow',       'cat-ll', 'Fast & Slow Pointers');
-- Trees
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-bst',             'cat-trees', 'Binary Search Tree');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-tree-traversal',  'cat-trees', 'Tree Traversal');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-lca',             'cat-trees', 'LCA');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-segment-tree',    'cat-trees', 'Segment Tree');
-- Graphs
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-bfs',             'cat-graphs', 'BFS');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-dfs',             'cat-graphs', 'DFS');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-shortest-path',   'cat-graphs', 'Shortest Path');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-mst',             'cat-graphs', 'Minimum Spanning Tree');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-topo-sort',       'cat-graphs', 'Topological Sort');
-- Dynamic programming
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-dp-1d',           'cat-dp', '1D DP');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-dp-2d',           'cat-dp', '2D DP');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-dp-knap',         'cat-dp', 'Knapsack Problems');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-dp-lcs',          'cat-dp', 'LCS/LIS');
-- Sorting & searching
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-binary-search',   'cat-sorting', 'Binary Search');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-sorting',         'cat-sorting', 'Sorting Algorithms');
-- Greedy / recursion / hashing
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-greedy',          'cat-greedy',    'Greedy Choice');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-intervals',       'cat-greedy',    'Intervals');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-backtracking',    'cat-recursion', 'Backtracking');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-recursion',       'cat-recursion', 'Recursion');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-hashmap',         'cat-hashing',   'Hash Maps & Sets');
-- Stacks & queues
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-stack',           'cat-stack', 'Stack Operations');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-queue',           'cat-stack', 'Queue / Deque');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-monotonic',       'cat-stack', 'Monotonic Stack');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-heap',            'cat-stack', 'Heaps / Priority Queues');
-- SQL
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-sql-joins',       'cat-db', 'SQL Joins');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-sql-agg',         'cat-db', 'Aggregations');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-sql-window',      'cat-db', 'Window Functions');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-sql-subquery',    'cat-db', 'Subqueries');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-db-index',        'cat-db', 'Indexing');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-db-norm',         'cat-db', 'Normalization');
-- OS
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-os-process',      'cat-os', 'Processes & Threads');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-os-concurrency',  'cat-os', 'Concurrency & Locks');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-os-memory',       'cat-os', 'Memory Management');
-- Networks
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-net-tcp',         'cat-net', 'TCP/IP');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-net-http',        'cat-net', 'HTTP & REST');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-net-dns',         'cat-net', 'DNS & CDNs');
-- OOP
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-oop-encap',       'cat-oop', 'Encapsulation');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-oop-inherit',     'cat-oop', 'Inheritance');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-oop-poly',        'cat-oop', 'Polymorphism');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-oop-design',      'cat-oop', 'Design Patterns');
-- Languages / tooling
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-js',              'cat-lang', 'JavaScript / TypeScript');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-python',          'cat-lang', 'Python');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-java',            'cat-lang', 'Java');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-react',           'cat-lang', 'React');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-node',            'cat-lang', 'Node.js');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-ml-basics',       'cat-lang', 'Machine Learning');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-stats',           'cat-lang', 'Statistics');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-docker',          'cat-lang', 'Docker & Containers');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-cloud',           'cat-lang', 'Cloud Platforms');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-cicd',            'cat-lang', 'CI/CD');
-- System design
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-sd-scaling',      'cat-sys', 'Scalability & Load Balancing');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-sd-caching',      'cat-sys', 'Caching');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-sd-storage',      'cat-sys', 'Data Storage & Sharding');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-sd-messaging',    'cat-sys', 'Queues & Messaging');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-sd-api',          'cat-sys', 'API Design');
-- Behavioral
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-beh-star',        'cat-beh', 'STAR Storytelling');
INSERT INTO SKILLS (SKILL_ID, CATEGORY_ID, NAME) VALUES ('sk-beh-comm',        'cat-beh', 'Technical Communication');

-- -----------------------------------------------------------------------------
-- JOB ROLES
-- -----------------------------------------------------------------------------
INSERT INTO JOB_ROLES (ROLE_ID, TITLE, INDUSTRY, ROLE_LEVEL) VALUES ('role-swe',    'Software Engineer',           'Technology', 'Mid');
INSERT INTO JOB_ROLES (ROLE_ID, TITLE, INDUSTRY, ROLE_LEVEL) VALUES ('role-fe',     'Frontend Developer',          'Technology', 'Mid');
INSERT INTO JOB_ROLES (ROLE_ID, TITLE, INDUSTRY, ROLE_LEVEL) VALUES ('role-be',     'Backend Developer',           'Technology', 'Mid');
INSERT INTO JOB_ROLES (ROLE_ID, TITLE, INDUSTRY, ROLE_LEVEL) VALUES ('role-fs',     'Full Stack Developer',        'Technology', 'Mid');
INSERT INTO JOB_ROLES (ROLE_ID, TITLE, INDUSTRY, ROLE_LEVEL) VALUES ('role-da',     'Data Analyst',                'Technology', 'Junior');
INSERT INTO JOB_ROLES (ROLE_ID, TITLE, INDUSTRY, ROLE_LEVEL) VALUES ('role-ds',     'Data Scientist',              'Technology', 'Senior');
INSERT INTO JOB_ROLES (ROLE_ID, TITLE, INDUSTRY, ROLE_LEVEL) VALUES ('role-ml',     'ML Engineer',                 'Technology', 'Senior');
INSERT INTO JOB_ROLES (ROLE_ID, TITLE, INDUSTRY, ROLE_LEVEL) VALUES ('role-devops', 'DevOps Engineer',             'Technology', 'Mid');
INSERT INTO JOB_ROLES (ROLE_ID, TITLE, INDUSTRY, ROLE_LEVEL) VALUES ('role-intern', 'Software Engineering Intern', 'Technology', 'Intern');

-- -----------------------------------------------------------------------------
-- ROLE REQUIREMENTS (MIN_PROF = proficiency needed, IMPORTANCE = weight 0..1)
-- -----------------------------------------------------------------------------
-- Software Engineer
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-swe', 'sk-array-traversal', 70, 1.0);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-swe', 'sk-two-pointer',     60, 0.9);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-swe', 'sk-hashmap',         70, 1.0);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-swe', 'sk-bfs',             65, 1.0);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-swe', 'sk-dfs',             65, 1.0);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-swe', 'sk-tree-traversal',  65, 0.9);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-swe', 'sk-dp-1d',           60, 0.9);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-swe', 'sk-binary-search',   60, 0.8);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-swe', 'sk-sql-joins',       55, 0.7);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-swe', 'sk-oop-design',      60, 0.8);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-swe', 'sk-sd-scaling',      50, 0.6);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-swe', 'sk-beh-star',        60, 0.7);
-- Frontend Developer
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-fe', 'sk-js',               80, 1.0);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-fe', 'sk-react',            75, 1.0);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-fe', 'sk-net-http',         60, 0.8);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-fe', 'sk-array-traversal',  60, 0.7);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-fe', 'sk-string-manip',     60, 0.6);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-fe', 'sk-hashmap',          55, 0.6);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-fe', 'sk-tree-traversal',   50, 0.5);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-fe', 'sk-beh-comm',         60, 0.7);
-- Backend Developer
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-be', 'sk-node',             70, 0.9);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-be', 'sk-sql-joins',        75, 1.0);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-be', 'sk-db-index',         65, 0.9);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-be', 'sk-net-http',         70, 0.9);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-be', 'sk-sd-caching',       60, 0.8);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-be', 'sk-sd-api',           65, 0.9);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-be', 'sk-os-concurrency',   55, 0.7);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-be', 'sk-hashmap',          65, 0.8);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-be', 'sk-bfs',              55, 0.6);
-- Full Stack Developer
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-fs', 'sk-js',               75, 1.0);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-fs', 'sk-react',            70, 0.9);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-fs', 'sk-node',             70, 0.9);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-fs', 'sk-sql-joins',        65, 0.8);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-fs', 'sk-net-http',         65, 0.8);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-fs', 'sk-sd-api',           55, 0.7);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-fs', 'sk-hashmap',          60, 0.7);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-fs', 'sk-array-traversal',  60, 0.7);
-- Data Analyst
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-da', 'sk-sql-joins',        80, 1.0);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-da', 'sk-sql-agg',          80, 1.0);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-da', 'sk-sql-window',       70, 0.9);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-da', 'sk-sql-subquery',     70, 0.9);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-da', 'sk-db-index',         60, 0.7);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-da', 'sk-python',           60, 0.8);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-da', 'sk-stats',            65, 0.9);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-da', 'sk-beh-comm',         65, 0.8);
-- Data Scientist
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-ds', 'sk-python',           80, 1.0);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-ds', 'sk-stats',            80, 1.0);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-ds', 'sk-ml-basics',        75, 1.0);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-ds', 'sk-sql-agg',          70, 0.8);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-ds', 'sk-sql-window',       60, 0.7);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-ds', 'sk-array-traversal',  55, 0.5);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-ds', 'sk-beh-comm',         65, 0.7);
-- ML Engineer
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-ml', 'sk-python',           85, 1.0);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-ml', 'sk-ml-basics',        80, 1.0);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-ml', 'sk-stats',            70, 0.8);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-ml', 'sk-docker',           60, 0.7);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-ml', 'sk-sd-storage',       55, 0.6);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-ml', 'sk-hashmap',          60, 0.6);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-ml', 'sk-dp-1d',            55, 0.5);
-- DevOps Engineer
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-devops', 'sk-docker',       80, 1.0);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-devops', 'sk-cloud',        75, 1.0);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-devops', 'sk-cicd',         75, 1.0);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-devops', 'sk-net-tcp',      65, 0.8);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-devops', 'sk-net-dns',      65, 0.8);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-devops', 'sk-os-process',   65, 0.8);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-devops', 'sk-sd-scaling',   60, 0.7);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-devops', 'sk-python',       55, 0.6);
-- Software Engineering Intern
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-intern', 'sk-array-traversal', 55, 1.0);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-intern', 'sk-string-manip',    50, 0.9);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-intern', 'sk-hashmap',         50, 0.9);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-intern', 'sk-stack',           45, 0.7);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-intern', 'sk-ll-ops',          45, 0.7);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-intern', 'sk-oop-encap',       45, 0.6);
INSERT INTO JOB_ROLE_SKILLS (ROLE_ID, SKILL_ID, MIN_PROF, IMPORTANCE) VALUES ('role-intern', 'sk-beh-star',        50, 0.7)
