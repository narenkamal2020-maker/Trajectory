# Security & operations

## Secrets
| Variable | Purpose |
|---|---|
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | Sign access tokens / HMAC for pseudonymous ML exports. 32+ random bytes. |
| `DATA_ENCRYPTION_KEY` | AES-256-GCM key for resume text and parsed resume data (**required in production**). Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. **Back it up separately from database backups** — without it, encrypted resumes cannot be read. Run `npm run data:encrypt` once after setting it to encrypt existing rows. |
| `ML_ADMIN_TOKEN` | Enables the ML service's `/admin/reload` endpoint (disabled when unset). |

## Database least privilege
The API should connect as a DML-only user; the schema owner is used only for migrations and grants.

```sql
-- As SYSDBA in the pluggable database
CREATE USER trajectory_app IDENTIFIED BY "<strong password>";
GRANT CREATE SESSION TO trajectory_app;
```
```bash
cd backend
npm run db:migrate                                   # as the owner (ORACLE_USER=trajectory)
npm run db:grant -- --app-user TRAJECTORY_APP        # as the owner, after every migration
```
Then run the API with `ORACLE_USER=TRAJECTORY_APP`, its password and `ORACLE_SCHEMA=TRAJECTORY`. In this mode the API skips boot migrations and cannot create, alter or drop objects (verified: `ORA-01031` for DDL and for writes to `SCHEMA_MIGRATIONS`).

## Backups & restore (Oracle Data Pump)
One-time setup as SYSDBA (the directory must be writable by the database service account):
```sql
CREATE DIRECTORY TRAJECTORY_BACKUP AS '/u01/backups/trajectory';
GRANT READ, WRITE ON DIRECTORY TRAJECTORY_BACKUP TO trajectory;
```
```bash
npm run db:backup                                            # schema export; prunes dumps older than BACKUP_RETENTION_DAYS (14)
npm run db:restore -- --file trajectory-YYYYMMDD-HHMMSS.dmp --yes                      # in-place (replaces tables)
npm run db:restore -- --file trajectory-YYYYMMDD-HHMMSS.dmp --into TRAJECTORY_RESTORE  # side-by-side
```
Side-by-side restores need the target user to exist and the running user to hold `DATAPUMP_IMP_FULL_DATABASE` (grant temporarily). Schedule `db:backup` daily (cron / Task Scheduler) and copy dumps off the database host. **Test a restore regularly** — the procedure above was verified with identical table and row counts.

## Monitoring & audit
- `AUDIT_LOG` records sign-ins, failed logins, password changes, refresh-token reuse, denied admin access and every admin change, with IP and user agent. View it in **Admin → Security & insights**.
- More than 5 failed logins per IP or account in 10 minutes raises an `ALERT`; ALERT/WARN events are also written to the application log as `SECURITY …` lines — point your log shipper or alerting at them.
- `/api/health` exposes liveness only; engine details are at `/api/admin/system` (admins).

## HTTP hardening
CSP (strict for the web app, `default-src 'none'` for the API), `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` (microphone for dictation only), COOP/CORP, HSTS in production. Refresh tokens live in an `httpOnly`, `SameSite=Strict`, `Secure` (production) cookie scoped to `/api/auth`; JWTs are pinned to HS256.

## AI / prompt injection
Untrusted text (interview answers, resumes) is length-capped, stripped of role/delimiter tags and wrapped in tags the system prompt declares as data. LLM output is schema-validated, scores are clamped to ±30 of the deterministic rule engine, and links are removed from suggestions. The LLM has no tools and nothing it returns is executed.

## Supply chain
CI runs `npm audit` (high+ fails the build), `npm audit signatures` and `pip-audit`. Dependabot opens weekly update PRs. Enable branch protection with "Require review from Code Owners" so every change is reviewed.

## Known limitations
- The code sandbox is process-level (Node permission model / Python audit hooks / read-only SQLite), not container isolation. For an untrusted public deployment, also run the API in a locked-down container (read-only FS, no egress, seccomp).
- The mobile app stores its refresh token in the app-sandboxed WebView storage (the desktop app uses the OS keychain).
- Hash-based routes (`#/privacy`) are not individually indexable; the sitemap lists the site root.
