export type InterviewType = 'TECHNICAL' | 'DSA' | 'SQL' | 'BEHAVIORAL' | 'SYSTEM_DESIGN' | 'ROLE_SPECIFIC';

export interface Concept { label: string; keywords: string[] }

export interface InterviewQuestion {
  id: string;
  type: InterviewType;
  prompt: string;
  concepts: Concept[];
  followUp: string;
  /** Skills this question exercises (feeds skill tracking after the interview). */
  skillIds: string[];
}

const c = (label: string, ...keywords: string[]): Concept => ({ label, keywords });

export const INTERVIEW_BANK: InterviewQuestion[] = [
  // ── Behavioral ──
  {
    id: 'beh-conflict', type: 'BEHAVIORAL', skillIds: ['sk-beh-star', 'sk-beh-comm'],
    prompt: 'Tell me about a time you disagreed with a teammate on a technical decision. How did you handle it?',
    concepts: [c('context', 'project', 'team', 'situation', 'when'), c('listening', 'listened', 'understand', 'perspective', 'asked'), c('data-driven resolution', 'data', 'benchmark', 'prototype', 'evidence', 'metrics', 'tested'), c('outcome', 'result', 'agreed', 'shipped', 'outcome', 'learned')],
    followUp: 'What was the concrete outcome, and what would you do differently next time?',
  },
  {
    id: 'beh-failure', type: 'BEHAVIORAL', skillIds: ['sk-beh-star'],
    prompt: 'Describe a project that failed or a mistake you made. What did you learn?',
    concepts: [c('ownership', 'i made', 'my mistake', 'i was responsible', 'i owned', 'my fault'), c('impact', 'impact', 'users', 'delay', 'outage', 'cost'), c('fix', 'fixed', 'rolled back', 'mitigated', 'resolved', 'recovered'), c('learning', 'learned', 'now i', 'since then', 'process', 'prevent')],
    followUp: 'What specific change did you make afterwards to prevent it from happening again?',
  },
  {
    id: 'beh-impact', type: 'BEHAVIORAL', skillIds: ['sk-beh-star', 'sk-beh-comm'],
    prompt: 'Walk me through the project you are most proud of. What was your specific contribution?',
    concepts: [c('problem', 'problem', 'goal', 'challenge', 'needed'), c('personal action', 'i built', 'i designed', 'i implemented', 'i led', 'i wrote'), c('technical depth', 'architecture', 'database', 'api', 'algorithm', 'performance'), c('measurable result', '%', 'percent', 'users', 'reduced', 'increased', 'faster', 'saved')],
    followUp: 'How did you measure the impact of that work?',
  },
  {
    id: 'beh-deadline', type: 'BEHAVIORAL', skillIds: ['sk-beh-star'],
    prompt: 'Tell me about a time you had to deliver under a tight deadline. How did you prioritize?',
    concepts: [c('constraint', 'deadline', 'days', 'week', 'time'), c('prioritization', 'prioritize', 'scope', 'mvp', 'must-have', 'cut'), c('communication', 'communicated', 'stakeholder', 'manager', 'updated', 'aligned'), c('result', 'delivered', 'shipped', 'on time', 'launched', 'result')],
    followUp: 'What did you decide to cut or defer, and why?',
  },
  {
    id: 'beh-learn', type: 'BEHAVIORAL', skillIds: ['sk-beh-comm'],
    prompt: 'Describe a time you had to learn a new technology quickly to get something done.',
    concepts: [c('situation', 'project', 'needed', 'required', 'new'), c('learning strategy', 'documentation', 'docs', 'tutorial', 'prototype', 'experiment', 'mentor'), c('application', 'built', 'implemented', 'applied', 'used'), c('result', 'result', 'delivered', 'shipped', 'now')],
    followUp: 'How long did it take you to become productive, and what accelerated that?',
  },

  // ── Technical (CS fundamentals) ──
  {
    id: 'tech-http', type: 'TECHNICAL', skillIds: ['sk-net-http', 'sk-net-dns', 'sk-net-tcp'],
    prompt: 'What happens, step by step, when you type a URL into the browser and press Enter?',
    concepts: [c('DNS resolution', 'dns', 'resolve', 'ip address'), c('TCP/TLS handshake', 'tcp', 'handshake', 'tls', 'ssl', 'https'), c('HTTP request/response', 'http', 'request', 'response', 'get', 'headers', 'status'), c('rendering', 'render', 'html', 'dom', 'css', 'javascript', 'parse'), c('caching', 'cache', 'cdn')],
    followUp: 'Where can caching happen along that path?',
  },
  {
    id: 'tech-process-thread', type: 'TECHNICAL', skillIds: ['sk-os-process', 'sk-os-concurrency'],
    prompt: 'Explain the difference between a process and a thread, and when you would use each.',
    concepts: [c('memory isolation', 'memory', 'address space', 'isolated', 'shared'), c('context switching', 'context switch', 'overhead', 'scheduling', 'lightweight'), c('synchronization', 'lock', 'mutex', 'race condition', 'synchroniz'), c('use cases', 'cpu-bound', 'i/o', 'parallel', 'concurren', 'crash')],
    followUp: 'How would you prevent a race condition on a shared counter?',
  },
  {
    id: 'tech-index', type: 'TECHNICAL', skillIds: ['sk-db-index', 'sk-sql-joins'],
    prompt: 'How does a database index work, and what are the trade-offs of adding one?',
    concepts: [c('data structure', 'b-tree', 'btree', 'b+ tree', 'hash', 'tree'), c('read speedup', 'lookup', 'faster read', 'scan', 'log n', 'o(log'), c('write cost', 'write', 'insert', 'update', 'slower', 'overhead', 'storage'), c('selectivity', 'selectivity', 'cardinality', 'composite', 'covering', 'column order')],
    followUp: 'When would the query planner ignore an index you created?',
  },
  {
    id: 'tech-oop', type: 'TECHNICAL', skillIds: ['sk-oop-poly', 'sk-oop-design', 'sk-oop-encap'],
    prompt: 'Explain polymorphism and give an example of how you have used it to make code easier to extend.',
    concepts: [c('definition', 'same interface', 'different implementation', 'override', 'subtype', 'interface'), c('mechanism', 'virtual', 'dynamic dispatch', 'inheritance', 'abstract', 'duck typing'), c('example', 'example', 'for instance', 'shape', 'payment', 'strategy'), c('benefit', 'open/closed', 'extend', 'without modifying', 'decouple', 'testab')],
    followUp: 'When would you prefer composition over inheritance?',
  },

  // ── DSA (verbal problem solving) ──
  {
    id: 'dsa-two-sum', type: 'DSA', skillIds: ['sk-hashmap', 'sk-array-traversal'],
    prompt: 'Given an array and a target, how would you find two numbers that sum to the target? Walk me through your approach and its complexity.',
    concepts: [c('brute force baseline', 'brute force', 'nested loop', 'o(n^2)', 'o(n²)', 'every pair'), c('hash map', 'hash', 'map', 'dictionary', 'set'), c('complement idea', 'complement', 'target -', 'target minus', 'difference'), c('complexity', 'o(n)', 'linear', 'space')],
    followUp: 'What if the array were sorted — could you avoid the extra space?',
  },
  {
    id: 'dsa-lru', type: 'DSA', skillIds: ['sk-hashmap', 'sk-ll-ops', 'sk-sd-caching'],
    prompt: 'Design an LRU cache with O(1) get and put. What data structures would you use?',
    concepts: [c('hash map', 'hash', 'map', 'dictionary'), c('doubly linked list', 'doubly linked', 'linked list', 'deque'), c('eviction', 'evict', 'least recently', 'tail', 'remove oldest'), c('O(1) reasoning', 'o(1)', 'constant time')],
    followUp: 'How would you make it thread-safe?',
  },
  {
    id: 'dsa-graph', type: 'DSA', skillIds: ['sk-bfs', 'sk-shortest-path'],
    prompt: 'How would you find the shortest path between two people in a social network graph?',
    concepts: [c('BFS', 'bfs', 'breadth'), c('unweighted reasoning', 'unweighted', 'level', 'layer', 'hops'), c('visited set', 'visited', 'seen', 'cycle'), c('scale optimization', 'bidirectional', 'both ends', 'dijkstra', 'heuristic', 'a*')],
    followUp: 'The graph has a billion nodes. What changes?',
  },

  // ── SQL ──
  {
    id: 'sql-joins', type: 'SQL', skillIds: ['sk-sql-joins'],
    prompt: 'Explain the difference between INNER JOIN, LEFT JOIN and a FULL OUTER JOIN, with an example of when each is the right choice.',
    concepts: [c('inner join', 'inner', 'matching rows', 'both tables'), c('left join', 'left', 'all rows from the left', 'null'), c('full outer', 'full outer', 'all rows from both', 'either'), c('example', 'customers', 'orders', 'example', 'employees')],
    followUp: 'How would you find customers who have never placed an order?',
  },
  {
    id: 'sql-window', type: 'SQL', skillIds: ['sk-sql-window', 'sk-sql-agg'],
    prompt: 'What is a window function and how does it differ from GROUP BY? Give an example query.',
    concepts: [c('keeps rows', 'does not collapse', "doesn't collapse", 'every row', 'keeps rows', 'per row'), c('OVER / PARTITION BY', 'over', 'partition by'), c('ranking/running totals', 'rank', 'row_number', 'running total', 'lag', 'lead', 'dense_rank'), c('group by contrast', 'group by', 'aggregate', 'collapse')],
    followUp: 'How would you get the top 3 earners per department?',
  },
  {
    id: 'sql-normalize', type: 'SQL', skillIds: ['sk-db-norm', 'sk-db-index'],
    prompt: 'When would you denormalize a schema, and what risks does that introduce?',
    concepts: [c('normal forms', 'normal form', '3nf', 'normalization', 'redundancy'), c('read performance', 'read', 'join', 'performance', 'reporting', 'analytics'), c('consistency risk', 'inconsisten', 'update anomal', 'duplicate', 'sync'), c('mitigation', 'materialized view', 'trigger', 'batch', 'event')],
    followUp: 'How would you keep the duplicated data consistent?',
  },

  // ── System design ──
  {
    id: 'sd-url', type: 'SYSTEM_DESIGN', skillIds: ['sk-sd-scaling', 'sk-sd-storage', 'sk-sd-caching'],
    prompt: 'Design a URL shortener like bit.ly. Start with requirements and walk me through the architecture.',
    concepts: [c('requirements & scale', 'requirement', 'qps', 'read-heavy', 'million', 'scale'), c('ID generation', 'base62', 'hash', 'counter', 'unique id', 'snowflake'), c('storage', 'database', 'key-value', 'nosql', 'sql', 'shard'), c('caching', 'cache', 'redis', 'cdn'), c('redirect flow', '301', '302', 'redirect')],
    followUp: 'How would you handle custom aliases and collisions?',
  },
  {
    id: 'sd-chat', type: 'SYSTEM_DESIGN', skillIds: ['sk-sd-messaging', 'sk-sd-scaling', 'sk-net-tcp'],
    prompt: 'Design a real-time chat service that supports one-to-one and group messages.',
    concepts: [c('persistent connections', 'websocket', 'long polling', 'persistent connection', 'socket'), c('message routing', 'queue', 'pub/sub', 'kafka', 'broker', 'fan-out'), c('storage & ordering', 'ordering', 'sequence', 'timestamp', 'database', 'cassandra'), c('delivery guarantees', 'offline', 'ack', 'retry', 'at least once', 'read receipt'), c('scaling', 'shard', 'horizontal', 'load balancer', 'partition')],
    followUp: 'How do you deliver messages to a user who is offline?',
  },
  {
    id: 'sd-ratelimit', type: 'SYSTEM_DESIGN', skillIds: ['sk-sd-api', 'sk-sd-caching'],
    prompt: 'Design a rate limiter for a public API.',
    concepts: [c('algorithm', 'token bucket', 'leaky bucket', 'sliding window', 'fixed window'), c('distributed state', 'redis', 'shared', 'distributed', 'central'), c('keying', 'per user', 'api key', 'ip', 'per client'), c('client feedback', '429', 'retry-after', 'headers', 'backoff')],
    followUp: 'How would you avoid the rate limiter itself becoming a bottleneck?',
  },

  // ── Role-specific (generic pool; resume-derived questions are added at runtime) ──
  {
    id: 'role-debug', type: 'ROLE_SPECIFIC', skillIds: ['sk-beh-comm'],
    prompt: 'A production endpoint suddenly became 10x slower. How would you investigate?',
    concepts: [c('observe first', 'metrics', 'logs', 'dashboard', 'trace', 'monitor'), c('isolate change', 'deploy', 'recent change', 'rollback', 'diff'), c('hypotheses', 'database', 'query', 'cache', 'network', 'cpu', 'memory'), c('verify & prevent', 'reproduce', 'fix', 'alert', 'postmortem', 'test')],
    followUp: 'Suppose the database is the culprit. What would you check first?',
  },
  {
    id: 'role-testing', type: 'ROLE_SPECIFIC', skillIds: ['sk-cicd'],
    prompt: 'How do you decide what to test, and at what level (unit, integration, end-to-end)?',
    concepts: [c('test pyramid', 'pyramid', 'unit', 'integration', 'end-to-end', 'e2e'), c('risk-based', 'risk', 'critical path', 'business logic', 'edge case'), c('speed/feedback', 'fast', 'feedback', 'ci', 'flaky'), c('mocking', 'mock', 'stub', 'fake', 'isolation')],
    followUp: 'How do you deal with flaky tests?',
  },
];

export function questionsForType(type: InterviewType): InterviewQuestion[] {
  return INTERVIEW_BANK.filter((q) => q.type === type);
}

export function findInterviewQuestion(id: string): InterviewQuestion | undefined {
  return INTERVIEW_BANK.find((q) => q.id === id);
}
