import { useDocumentTitle } from '../../lib/hooks';
import { Link } from '../../lib/router';
import { SITE } from '../../config/site';
import { setConsent, getConsent } from '../../lib/analytics';
import { PublicLayout, LegalSection } from './PublicLayout';

const updated = new Date(SITE.legalUpdated).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

function Header({ title }: { title: string }) {
  return (
    <header>
      <h1 className="font-headline text-3xl font-bold">{title}</h1>
      <p className="text-sm text-[var(--color-text-muted)] mt-2">Last updated: <time dateTime={SITE.legalUpdated}>{updated}</time></p>
    </header>
  );
}

export function PrivacyPage() {
  useDocumentTitle('Privacy Policy', 'How Trajectory collects, uses, protects and deletes your data — resumes, code, interview answers and analytics.');
  return (
    <PublicLayout>
      <article>
        <Header title="Privacy Policy" />
        <p className="mt-6 text-[var(--color-text-secondary)]">{SITE.name} is operated by {SITE.company}. This policy explains what we collect when you use the website, desktop app or Android app, and the choices you have.</p>

        <LegalSection title="What we collect">
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Account:</strong> your name, email address and a one-way hash of your password (we never store the password itself).</li>
            <li><strong>Career profile:</strong> target role, experience level, industry, optional links and skills you choose to add.</li>
            <li><strong>Resume:</strong> the text extracted from the file you upload and the analysis we produce. The original file is not stored. Resume text and details are encrypted in our database.</li>
            <li><strong>Practice &amp; interviews:</strong> code you submit, test results, interview answers and the feedback generated for them.</li>
            <li><strong>Job applications</strong> you choose to track.</li>
            <li><strong>Security logs:</strong> sign-in events, IP address and browser type for security monitoring and abuse prevention.</li>
            <li><strong>Analytics (only with consent):</strong> anonymous page visits and campaign tags (utm_*) — without IP addresses or device fingerprints.</li>
          </ul>
        </LegalSection>

        <LegalSection title="How we use it">
          <p>To run the service: grading submissions, tracking your skills, generating recommendations and interview feedback, and analyzing your resume. Learning events are also used, in pseudonymized form, to improve the models that choose practice problems. We do not sell your data or use it for advertising.</p>
          <p>If an AI provider is enabled for interview feedback or resume suggestions, the relevant answer or resume text is sent to that provider solely to produce the feedback.</p>
        </LegalSection>

        <LegalSection title="Cookies and local storage">
          <p>We use one essential, httpOnly cookie to keep you signed in, and local storage for preferences such as theme, drafts and offline practice data. Analytics run only if you click “Accept analytics”.</p>
          <p>Your current choice: <strong>{getConsent() ?? 'not chosen yet'}</strong>.{' '}
            <button type="button" className="underline text-[var(--color-primary)] cursor-pointer" onClick={() => { setConsent('essential'); location.reload(); }}>Use essential only</button>
          </p>
        </LegalSection>

        <LegalSection title="Security">
          <p>Data is transmitted over HTTPS in production, passwords are hashed with bcrypt, sessions use short-lived tokens with rotating refresh tokens, resumes are encrypted at rest, administrative actions are audit-logged, and the database is backed up regularly.</p>
        </LegalSection>

        <LegalSection title="Retention and your rights">
          <p>We keep your data while your account is active. You can ask us to export or delete your account and associated data at any time, or to correct inaccurate information. Backups containing deleted data expire on our retention schedule.</p>
          <p>To make a request, use the <Link to="/contact" className="underline text-[var(--color-primary)]">contact form</Link> (choose “Privacy request”) or email <a className="underline text-[var(--color-primary)]" href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.</p>
        </LegalSection>

        <LegalSection title="Changes">
          <p>We will update the date above when this policy changes and notify signed-in users of material changes.</p>
        </LegalSection>
      </article>
    </PublicLayout>
  );
}

export function TermsPage() {
  useDocumentTitle('Terms & Conditions', 'The terms that govern your use of Trajectory: accounts, acceptable use, content ownership and liability.');
  return (
    <PublicLayout>
      <article>
        <Header title="Terms & Conditions" />
        <LegalSection title="1. Using Trajectory">
          <p>By creating an account you agree to these terms. You must provide accurate information and keep your password confidential. You are responsible for activity on your account.</p>
        </LegalSection>
        <LegalSection title="2. Acceptable use">
          <p>Do not attempt to break, overload or bypass the code sandbox, scrape the question bank, access other users’ data, or use the service to violate any law. We may suspend accounts that do.</p>
        </LegalSection>
        <LegalSection title="3. Your content">
          <p>You keep ownership of the code, answers, resumes and other content you submit. You grant us a limited licence to process it to provide the service (for example grading, feedback and recommendations).</p>
        </LegalSection>
        <LegalSection title="4. Our content">
          <p>The question bank, explanations, software and design are owned by {SITE.company}. You may use them for your personal preparation but may not republish them.</p>
        </LegalSection>
        <LegalSection title="5. No guarantee of outcomes">
          <p>Readiness scores, ETAs, interview scores and recommendations are estimates to guide practice. They are not a guarantee of employment or of any hiring decision.</p>
        </LegalSection>
        <LegalSection title="6. Availability and liability">
          <p>The service is provided “as is”. To the extent permitted by law we are not liable for indirect or consequential losses, and our total liability is limited to the amount you paid us in the 12 months before the claim.</p>
        </LegalSection>
        <LegalSection title="7. Termination">
          <p>You can stop using the service and request deletion at any time. We may terminate accounts that breach these terms.</p>
        </LegalSection>
        <LegalSection title="8. Contact">
          <p>Questions about these terms: <a className="underline text-[var(--color-primary)]" href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.</p>
        </LegalSection>
      </article>
    </PublicLayout>
  );
}
