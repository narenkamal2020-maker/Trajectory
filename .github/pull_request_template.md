## What & why

## How it was tested
- [ ] `backend`: `npm test` (unit + integration against Oracle)
- [ ] `app`: `npm test && npm run lint && npm run build`
- [ ] Manually checked in the browser (desktop + mobile width)

## Security checklist
- [ ] New endpoints are authenticated and scoped to the requesting user (or explicitly public and rate-limited)
- [ ] Input is validated with zod; no string-built SQL with user input (bind variables only)
- [ ] No secrets, tokens or personal data in logs, responses or the client bundle
- [ ] Admin actions write an audit log entry
- [ ] Untrusted text sent to an LLM is wrapped with `sanitizeForPrompt` and its output validated
- [ ] New dependencies are well-known, maintained, and `npm audit` is clean
- [ ] DB migrations are additive / reversible and tested with `npm run db:migrate`
