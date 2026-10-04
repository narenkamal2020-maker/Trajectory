import { useEffect, useState } from 'react';
import { Cookie } from 'lucide-react';
import { getConsent, onConsentChange, setConsent, type Consent } from '../lib/analytics';
import { Link } from '../lib/router';

/** Simple, non-blocking consent banner. Essential storage (sign-in, preferences) needs no consent. */
export function CookieBanner() {
  const [consent, setState] = useState<Consent | null>(getConsent);
  useEffect(() => { const off = onConsentChange(setState); return () => { off(); }; }, []);
  if (consent) return null;
  return (
    <div role="region" aria-label="Cookie preferences"
      className="fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-[95] rounded-2xl border border-white/10 bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-2xl p-4 print:hidden">
      <div className="flex gap-3">
        <Cookie className="w-5 h-5 text-[var(--color-primary)] shrink-0 mt-0.5" aria-hidden />
        <div className="text-sm">
          <p className="font-bold">We use essential storage to keep you signed in.</p>
          <p className="text-[var(--color-text-secondary)] mt-1">
            With your permission we also count page visits (no ads, no third parties, no IP addresses).{' '}
            <Link to="/privacy" className="underline text-[var(--color-primary)]">Privacy policy</Link>
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <button type="button" onClick={() => setConsent('all')} className="px-3 py-1.5 rounded-lg text-sm font-bold bg-[var(--color-primary)] text-[var(--color-on-primary)] cursor-pointer">Accept analytics</button>
            <button type="button" onClick={() => setConsent('essential')} className="px-3 py-1.5 rounded-lg text-sm border border-white/15 text-[var(--color-text-primary)] cursor-pointer">Essential only</button>
          </div>
        </div>
      </div>
    </div>
  );
}
