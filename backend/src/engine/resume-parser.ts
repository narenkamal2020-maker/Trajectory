/**
 * Resume parsing + ATS scoring from plain text. Deterministic and explainable: every point in
 * the score maps to a named check in `breakdown`.
 */
import { clamp, round } from '../lib/util';

/** Keyword → platform skill id. Order matters only for display. */
const SKILL_LEXICON: Array<{ skillId: string; label: string; pattern: RegExp }> = [
  { skillId: 'sk-js', label: 'JavaScript/TypeScript', pattern: /\b(javascript|typescript|es6|ecmascript)\b/i },
  { skillId: 'sk-react', label: 'React', pattern: /\b(react(\.js)?|next\.js|redux)\b/i },
  { skillId: 'sk-node', label: 'Node.js', pattern: /\b(node(\.js)?|express(\.js)?|nestjs)\b/i },
  { skillId: 'sk-python', label: 'Python', pattern: /\b(python|django|flask|fastapi)\b/i },
  { skillId: 'sk-java', label: 'Java', pattern: /\b(java|spring( boot)?|kotlin)\b(?!script)/i },
  { skillId: 'sk-sql-joins', label: 'SQL', pattern: /\b(sql|mysql|postgres(ql)?|oracle|sqlite|t-sql|pl\/sql)\b/i },
  { skillId: 'sk-db-index', label: 'Database Optimization', pattern: /\b(index(ing|es)?|query optimi[sz]ation|database tuning)\b/i },
  { skillId: 'sk-sql-window', label: 'Window Functions', pattern: /\b(window functions?|partition by)\b/i },
  { skillId: 'sk-docker', label: 'Docker/Kubernetes', pattern: /\b(docker|kubernetes|k8s|containers?)\b/i },
  { skillId: 'sk-cloud', label: 'Cloud', pattern: /\b(aws|gcp|azure|google cloud|lambda|ec2|s3)\b/i },
  { skillId: 'sk-cicd', label: 'CI/CD', pattern: /\b(ci\/cd|github actions|jenkins|gitlab ci|circleci|continuous integration)\b/i },
  { skillId: 'sk-ml-basics', label: 'Machine Learning', pattern: /\b(machine learning|deep learning|scikit-learn|sklearn|tensorflow|pytorch|keras|xgboost|nlp)\b/i },
  { skillId: 'sk-stats', label: 'Statistics/Data Analysis', pattern: /\b(statistics|statistical|pandas|numpy|a\/b test(ing)?|regression|hypothesis)\b/i },
  { skillId: 'sk-sd-caching', label: 'Caching', pattern: /\b(redis|memcached|caching|cdn)\b/i },
  { skillId: 'sk-sd-messaging', label: 'Messaging', pattern: /\b(kafka|rabbitmq|sqs|pub\/sub|message queues?)\b/i },
  { skillId: 'sk-sd-api', label: 'API Design', pattern: /\b(rest(ful)?|graphql|grpc|api design|apis?)\b/i },
  { skillId: 'sk-sd-scaling', label: 'Scalable Systems', pattern: /\b(microservices?|distributed systems?|load balanc\w*|scalab\w*|high availability)\b/i },
  { skillId: 'sk-sd-storage', label: 'Data Storage', pattern: /\b(mongodb|cassandra|dynamodb|nosql|sharding|data warehouse|bigquery|snowflake)\b/i },
  { skillId: 'sk-array-traversal', label: 'Data Structures & Algorithms', pattern: /\b(data structures?|algorithms?|leetcode|competitive programming|codeforces)\b/i },
  { skillId: 'sk-oop-design', label: 'OOP/Design Patterns', pattern: /\b(oop|object[- ]oriented|design patterns?|solid principles)\b/i },
  { skillId: 'sk-os-concurrency', label: 'Concurrency', pattern: /\b(multithreading|multi-threading|concurren\w+|parallel processing)\b/i },
  { skillId: 'sk-os-process', label: 'Linux/OS', pattern: /\b(linux|unix|operating systems?|bash|shell scripting)\b/i },
  { skillId: 'sk-net-tcp', label: 'Networking', pattern: /\b(tcp\/ip|networking|sockets?|websockets?)\b/i },
  { skillId: 'sk-net-http', label: 'HTTP/Web', pattern: /\b(http|https|web services?|oauth|jwt)\b/i },
  { skillId: 'sk-beh-comm', label: 'Communication/Leadership', pattern: /\b(led|mentored|presented|stakeholders?|cross-functional|leadership)\b/i },
];

const SECTION_PATTERNS: Record<string, RegExp> = {
  summary: /^(summary|professional summary|objective|profile|about me)\b/i,
  experience: /^(experience|work experience|professional experience|employment( history)?|internships?)\b/i,
  education: /^(education|academic background|academics)\b/i,
  projects: /^(projects|personal projects|academic projects|key projects)\b/i,
  skills: /^(skills|technical skills|core competencies|technologies|tech stack)\b/i,
  certifications: /^(certifications?|licenses|courses)\b/i,
  achievements: /^(achievements|awards|honors|accomplishments)\b/i,
  leadership: /^(leadership|activities|extracurricular|volunteer(ing)?)\b/i,
};

const STRONG_VERBS = ['built', 'designed', 'developed', 'implemented', 'led', 'launched', 'created', 'architected', 'optimized', 'reduced', 'increased', 'improved', 'automated', 'delivered', 'engineered', 'migrated', 'scaled', 'shipped', 'spearheaded', 'mentored', 'owned', 'refactored', 'deployed', 'analyzed', 'established', 'streamlined', 'achieved', 'drove', 'won', 'published', 'integrated', 'accelerated', 'cut', 'boosted', 'resolved'];
const WEAK_PHRASES = ['responsible for', 'worked on', 'helped with', 'assisted in', 'duties included', 'involved in', 'tasked with'];

const MONTHS: Record<string, number> = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11 };

export interface ParsedResume {
  contact: { email: string | null; phone: string | null; links: string[] };
  sections: string[];
  skills: Array<{ skillId: string; label: string }>;
  experienceMonths: number;
  education: { degree: string | null; gpa: string | null };
  bullets: { total: number; quantified: number; strongVerb: number; weakPhrases: number; avgWords: number };
  wordCount: number;
}

export interface ResumeAnalysis {
  parsed: ParsedResume;
  atsScore: number;
  breakdown: Array<{ check: string; score: number; max: number; detail: string }>;
  gaps: string[];
  suggestions: string[];
  interviewQuestions: string[];
}

function monthIndex(token: string, now: Date): number | null {
  const t = token.toLowerCase().trim();
  if (/present|current|now|ongoing|till date/.test(t)) return now.getUTCFullYear() * 12 + now.getUTCMonth();
  let m = /([a-z]{3,9})\.?\s*'?(\d{2,4})/.exec(t);
  if (m) {
    const mon = MONTHS[m[1].slice(0, 4)] ?? MONTHS[m[1].slice(0, 3)];
    if (mon === undefined) return null;
    let y = Number(m[2]);
    if (y < 100) y += 2000;
    return y * 12 + mon;
  }
  m = /(\d{1,2})\/(\d{4})/.exec(t);
  if (m) return Number(m[2]) * 12 + Number(m[1]) - 1;
  m = /(\d{4})/.exec(t);
  if (m) return Number(m[1]) * 12;
  return null;
}

/** Sum of months covered by date ranges, merging overlaps (concurrent jobs count once). */
export function extractExperienceMonths(text: string, now = new Date()): number {
  const DATE = String.raw`(?:[A-Za-z]{3,9}\.?\s*'?\d{2,4}|\d{1,2}\/\d{4}|\d{4}|present|current|now)`;
  const re = new RegExp(`(${DATE})\\s*(?:-|–|—|to|until)\\s*(${DATE})`, 'gi');
  const ranges: Array<[number, number]> = [];
  for (const m of text.matchAll(re)) {
    const a = monthIndex(m[1], now), b = monthIndex(m[2], now);
    if (a === null || b === null || b < a || b - a > 12 * 40) continue;
    ranges.push([a, b + 1]);
  }
  ranges.sort((x, y) => x[0] - y[0]);
  let total = 0, curStart = -1, curEnd = -1;
  for (const [s, e] of ranges) {
    if (s > curEnd) { if (curEnd > curStart) total += curEnd - curStart; curStart = s; curEnd = e; }
    else curEnd = Math.max(curEnd, e);
  }
  if (curEnd > curStart) total += curEnd - curStart;
  return total;
}

export function parseResume(text: string, now = new Date()): ParsedResume {
  const clean = text.replace(/\r/g, '').replace(/[ \t]+/g, ' ');
  const lines = clean.split('\n').map((l) => l.trim()).filter(Boolean);

  const email = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.exec(clean)?.[0] ?? null;
  const phone = /(\+?\d{1,3}[\s.-]?)?\(?\d{3,5}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/.exec(clean)?.[0]?.trim() ?? null;
  const links = [...new Set((clean.match(/\b(?:https?:\/\/)?(?:www\.)?(?:github\.com|linkedin\.com|gitlab\.com|leetcode\.com|[a-z0-9-]+\.(?:dev|io|me))\/?[^\s,)]*/gi) ?? []).map((l) => l.replace(/[.,;]$/, '')))];

  const sections = Object.entries(SECTION_PATTERNS)
    .filter(([, re]) => lines.some((l) => l.length < 40 && re.test(l.replace(/[:|•\-–]/g, '').trim())))
    .map(([name]) => name);

  const seen = new Set<string>();
  const skills = SKILL_LEXICON.filter((s) => s.pattern.test(clean) && !seen.has(s.skillId) && seen.add(s.skillId))
    .map(({ skillId, label }) => ({ skillId, label }));

  const bulletLines = lines.filter((l) => /^[•\-*▪●◦‣·]\s*/.test(l) || (l.split(' ').length >= 6 && STRONG_VERBS.some((v) => l.toLowerCase().startsWith(v))));
  const stripped = bulletLines.map((l) => l.replace(/^[•\-*▪●◦‣·]\s*/, ''));
  const quantified = stripped.filter((l) => /\d/.test(l) && /(%|\d+\s*(x|k|m|ms|users|customers|requests|hours|days|\+)|\$\d|\d{2,})/i.test(l)).length;
  const strongVerb = stripped.filter((l) => STRONG_VERBS.some((v) => l.toLowerCase().startsWith(v))).length;
  const lower = clean.toLowerCase();
  const weakPhrases = WEAK_PHRASES.reduce((n, p) => n + (lower.split(p).length - 1), 0);
  const avgWords = stripped.length ? stripped.reduce((n, l) => n + l.split(' ').length, 0) / stripped.length : 0;

  const degree = /\b(ph\.?d|doctorate|m\.?\s?tech|m\.?s\.?|master'?s?|mba|m\.?sc|b\.?\s?tech|b\.?e\.?|b\.?s\.?|b\.?sc|bachelor'?s?|associate'?s?)\b/i.exec(clean)?.[0] ?? null;
  const gpa = /\b(?:c?gpa|cpi)\s*[:\-]?\s*(\d(?:\.\d{1,2})?\s*(?:\/\s*\d{1,2}(?:\.\d)?)?)/i.exec(clean)?.[1] ?? null;

  return {
    contact: { email, phone, links },
    sections,
    skills,
    experienceMonths: extractExperienceMonths(clean, now),
    education: { degree, gpa },
    bullets: { total: stripped.length, quantified, strongVerb, weakPhrases, avgWords: round(avgWords) },
    wordCount: clean.split(/\s+/).filter(Boolean).length,
  };
}

export function analyzeResume(
  text: string,
  opts: { targetRole?: string | null; roleSkills?: Array<{ skillId: string; skillName: string; importance: number }>; now?: Date } = {}
): ResumeAnalysis {
  const parsed = parseResume(text, opts.now);
  const breakdown: ResumeAnalysis['breakdown'] = [];
  const add = (check: string, score: number, max: number, detail: string) => breakdown.push({ check, score: round(clamp(score, 0, max)), max, detail });

  const c = parsed.contact;
  add('Contact info', (c.email ? 5 : 0) + (c.phone ? 3 : 0) + (c.links.length ? 2 : 0), 10,
    [c.email ? 'email ✓' : 'no email', c.phone ? 'phone ✓' : 'no phone', c.links.length ? `${c.links.length} link(s) ✓` : 'no GitHub/LinkedIn'].join(', '));

  const s = new Set(parsed.sections);
  add('Section structure',
    (s.has('experience') || s.has('projects') ? 8 : 0) + (s.has('education') ? 5 : 0) + (s.has('skills') ? 5 : 0) + (s.has('summary') ? 2 : 0), 20,
    `Detected: ${parsed.sections.join(', ') || 'none'}`);

  const detected = new Set(parsed.skills.map((x) => x.skillId));
  let gaps: string[] = [];
  if (opts.roleSkills?.length) {
    const total = opts.roleSkills.reduce((n, r) => n + r.importance, 0);
    const hit = opts.roleSkills.filter((r) => detected.has(r.skillId));
    gaps = opts.roleSkills.filter((r) => !detected.has(r.skillId)).sort((a, b) => b.importance - a.importance).map((r) => r.skillName);
    add('Role keyword match', (hit.reduce((n, r) => n + r.importance, 0) / total) * 25, 25,
      `${hit.length}/${opts.roleSkills.length} ${opts.targetRole ?? 'role'} skills found`);
  } else {
    add('Skill keywords', Math.min(1, parsed.skills.length / 8) * 25, 25, `${parsed.skills.length} recognized skills`);
  }

  const b = parsed.bullets;
  const qRatio = b.total ? b.quantified / b.total : 0;
  add('Quantified impact', Math.min(1, qRatio / 0.4) * 15, 15, `${b.quantified}/${b.total} bullets include numbers`);
  const vRatio = b.total ? b.strongVerb / b.total : 0;
  add('Action verbs', Math.min(1, vRatio / 0.6) * 10 - Math.min(5, b.weakPhrases * 1.5), 10,
    `${b.strongVerb}/${b.total} bullets start with a strong verb${b.weakPhrases ? `, ${b.weakPhrases} weak phrase(s)` : ''}`);

  const w = parsed.wordCount;
  add('Length', w < 150 ? (w / 150) * 4 : w <= 1000 ? 10 : Math.max(4, 10 - (w - 1000) / 150), 10, `${w} words (ideal 300–900)`);

  add('Bullet readability', b.total === 0 ? 0 : b.avgWords >= 8 && b.avgWords <= 30 ? 10 : b.avgWords < 8 ? 5 : 6, 10,
    b.total ? `avg ${b.avgWords} words per bullet` : 'no bullet points detected');

  const atsScore = round(breakdown.reduce((n, x) => n + x.score, 0));

  const suggestions: string[] = [];
  if (!c.email) suggestions.push('Add a professional email address at the top.');
  if (!c.links.length) suggestions.push('Link your GitHub and LinkedIn profiles.');
  if (!s.has('skills')) suggestions.push('Add a dedicated "Skills" section so ATS parsers can find your keywords.');
  if (!s.has('experience') && !s.has('projects')) suggestions.push('Add an "Experience" or "Projects" section with 3–5 bullets each.');
  if (!s.has('education')) suggestions.push('Add an "Education" section.');
  if (gaps.length) suggestions.push(`Mention ${gaps.slice(0, 4).join(', ')} if you have real experience with them — they are expected for ${opts.targetRole ?? 'this role'}.`);
  if (qRatio < 0.4) suggestions.push('Quantify outcomes: "Reduced API latency 40%" beats "Improved performance".');
  if (vRatio < 0.6) suggestions.push('Start each bullet with a strong action verb (Built, Led, Optimized, Shipped).');
  if (b.weakPhrases) suggestions.push('Replace "responsible for" / "worked on" with what you actually did and achieved.');
  if (w > 1000) suggestions.push('Trim to one page (≈600–900 words) for early-career roles.');
  if (w < 250) suggestions.push('Your resume is thin — add projects, coursework or measurable outcomes.');

  const interviewQuestions: string[] = [];
  for (const sk of parsed.skills.slice(0, 4)) {
    interviewQuestions.push(`You list ${sk.label}. Describe a project where you used it and the hardest problem you solved with it.`);
  }
  const bulletLines = text.split('\n').map((l) => l.trim()).filter((l) => /^[•\-*▪●]/.test(l) && /\d/.test(l));
  for (const bl of bulletLines.slice(0, 2)) {
    interviewQuestions.push(`Walk me through this result: "${bl.replace(/^[•\-*▪●]\s*/, '').slice(0, 140)}". How did you measure it?`);
  }
  if (gaps[0]) interviewQuestions.push(`${opts.targetRole ?? 'This role'} relies on ${gaps[0]}. How would you get up to speed on it?`);
  if (interviewQuestions.length < 3) interviewQuestions.push('Tell me about yourself and why you are targeting this role.');

  return { parsed, atsScore, breakdown, gaps, suggestions, interviewQuestions };
}
