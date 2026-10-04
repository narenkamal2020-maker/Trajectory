# Trajectory (LaunchLane)

Career-acceleration platform for software engineers: sandboxed coding practice, adaptive skill
tracking, mock interviews, resume scoring, a measurable path to a target role, and analytics.
It runs on the web, as a desktop app (with offline practice) and as an Android app.

```
app/        React 19 + Vite + Tailwind web app (also the UI for desktop & mobile)
  android/  Capacitor Android project
backend/    Express + TypeScript API on Oracle Database
desktop/    Electron shell with a local code executor (offline mode)
ml/         scikit-learn models + a dependency-free inference server
```

## Quick start (local development)

Prerequisites: Node 22, Python 3.10+, Oracle Database (XE 21c works) or Docker.

```bash
# 1. Database user (once, as SYSDBA, in the XEPDB1 pluggable database)
#    CREATE USER trajectory IDENTIFIED BY "<password>" QUOTA UNLIMITED ON USERS;
#    GRANT CREATE SESSION, CREATE TABLE, CREATE SEQUENCE, CREATE VIEW, CREATE PROCEDURE, CREATE TRIGGER TO trajectory;

# 2. API
cd backend
cp .env.example .env          # fill in ORACLE_PASSWORD and JWT secrets
npm install
npm run db:migrate            # schema + reference data (also runs automatically on boot)
npm run db:seed -- --demo     # 42 questions + demo@trajectory.dev / Trajectory123
npm run dev                   # http://localhost:3001

# 3. Web app
cd ../app && npm install && npm run dev     # http://localhost:5173 (proxies /api)

# 4. Optional: ML service (recommendations fall back to rules when it is down)
cd ../ml && pip install -r requirements.txt && python train.py && python serve.py
```

## How it works

| Area | Implementation |
|---|---|
| Auth | bcrypt, 15-min JWT access tokens, rotating refresh tokens (hash stored; reuse revokes all sessions). Web uses an httpOnly cookie; desktop/mobile get the token in the body (desktop stores it via OS keychain). |
| Question bank | `backend/src/db/data/questions.ts` — 37 coding (JS + Python) and 5 SQL problems with hidden tests. Every test is verified against reference solutions in `tests/unit/question-bank.test.ts`. |
| Code execution | Child process per run, code + tests on stdin. JavaScript uses Node's permission model (no fs/child processes), Python runs isolated with an audit hook blocking writes/subprocesses/sockets, SQL runs read-only in in-memory SQLite. Time limits, output caps, minimal env, concurrency semaphore. |
| Skill tracking | Elo-style proficiency per skill (`engine/skills.ts`), weighted by question difficulty, skill weight, hints and repeats; interview scores blend in as a moving average. |
| Recommendations | Rule engine (`engine/recommendations.ts`): target-role gaps → right-difficulty problems, interview types for non-coding skills, spaced review, resume and career nudges. With the ML service up, problems are chosen nearest a 65% predicted solve rate. |
| Mock interviews | Six types, question bank with concept rubrics, follow-ups on weak answers; rule-based evaluator, or an LLM (OpenAI / Ollama) when `LLM_PROVIDER` is set, with rules as fallback. |
| Resume | PDF/DOCX/TXT parsing, skill detection mapped to the taxonomy, experience from date ranges, explainable 100-point ATS breakdown, role keyword gaps, generated interview questions. |
| Career & analytics | Importance-weighted readiness, waypoints, ETA from 30-day gap velocity, adjacent roles; daily snapshots, heatmap, trends, funnel. |
| ML | `ml/train.py` trains a calibrated gradient-boosting solve-probability model and a TF-IDF role classifier. `npm run ml:export` exports logged training events (pseudonymized). |
| Offline | Web: service-worker app shell + IndexedDB question bundle; JavaScript runs in a Web Worker. Desktop: JavaScript, Python and SQL run locally through the same executor. Offline submissions queue and are re-graded server-side (incl. hidden tests) on reconnect, deduplicated by client id. |

## Administration

Admins get an **Admin** section in the app (users, topics & skills, questions):

```bash
cd backend && npm run admin:create -- --email admin@example.com   # prints a generated password once
# or set ADMIN_EMAIL / ADMIN_PASSWORD in the environment to ensure the account exists at startup
```

- **Users** — search/filter all accounts with activity stats, view details, grant/revoke admin,
  deactivate/reactivate (deactivation revokes the user's sessions). Admins can't demote themselves.
- **Topics & skills** — create topics and sub-topics, add skills, rename; only empty/unused ones can be deleted.
- **Questions** — author coding (JS/Python) or SQL questions with a signature, visible + hidden tests
  and a reference solution. Saving runs the reference against every test and refuses if any fail.
  Bulk upload accepts a JSON array (download the template from the Questions page); each item is
  validated separately. Questions can be hidden/published without deleting learner history.
- The admin role is re-checked against the database on every admin request, so revocation is immediate.

## Desktop & mobile

```bash
cd desktop && npm install && npm start        # Electron app (needs the API for sign-in)
npm run selftest                               # headless check of the local executor
npm run dist                                   # installers via electron-builder

cd app && CAP_DEV=1 npm run cap:sync           # Android; CAP_DEV allows a plain-http dev API
cd android && ./gradlew assembleDebug          # needs JDK 17+ (Android Studio's jbr works)
```

### Offering the apps for download

Settings → **Get the apps** lists whatever installers the API finds in `backend/downloads`
(`DOWNLOADS_DIR`), highlighting the right one for the visitor's device. After building:

```bash
cd backend && npm run downloads:publish   # copies the APK + desktop installers with versioned names
```

Downloads are public (`GET /api/downloads`, `GET /api/downloads/:file`) and only files with installer
extensions (.apk, .exe/.msi, .dmg, .AppImage/.deb) are served.

The mobile app defaults to `http://10.0.2.2:3001/api` (the host machine from the Android emulator);
the server URL can be changed on the sign-in screen and in Settings.

## Tests

```bash
cd backend && npm test        # unit (executor sandbox, question bank, engines) + integration (real Oracle)
cd app && npm test            # offline queue, comparison, routing
cd ml && python -m unittest discover -s tests
```

## Deployment

`docker compose up --build` runs Oracle XE, the API (serving the web app) and the ML service — copy
`.env.example` to `.env` first. The root `Dockerfile` produces a single API+web image; set
`STATIC_DIR` to serve the web build from the API in other environments. CI is in
`.github/workflows/ci.yml` (typecheck, all test suites against an Oracle service container, image builds).

## Security & operations

See [docs/security.md](docs/security.md) for secrets (including `DATA_ENCRYPTION_KEY`), the least-privilege database user,
backups/restore (`npm run db:backup` / `db:restore`), audit logging and monitoring, HTTP hardening and AI safeguards.
Public site details (contact email, address, company) live in `app/src/config/site.ts`; set `VITE_SITE_URL` at build
time for absolute share-image URLs, `robots.txt` and `sitemap.xml`.

## Known limitations

- **ML models start from synthetic data.** Until real usage accumulates, metrics in
  `ml/models/metrics.json` describe performance on simulated learners, not real users. Retrain
  periodically with `npm run ml:export` and `python ml/train.py` (real events are weighted 20×).
- **Code sandbox is process-level.** It blocks filesystem writes, process spawning and network
  access, but it is not container isolation. For an untrusted public deployment, run the API in a
  locked-down container (read-only FS, no network egress, seccomp) or move execution to dedicated workers.
- **Single-node job queue and cache** (in-process). Horizontal scaling needs a shared queue/cache (e.g. Redis).
- **Interview evaluation without an LLM** is keyword/structure based — useful for practice feedback, not a hiring signal.
