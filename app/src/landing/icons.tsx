/** Hand-drawn SVG icons for the landing page (no icon-library dependency). */
type P = { className?: string };
const base = { width: 24, height: 24, viewBox: '0 0 24 24', 'aria-hidden': true } as const;

export const ArrowUpRight = ({ className }: P) => (
  <svg {...base} className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 17L17 7" /><path d="M7 7h10v10" />
  </svg>
);

export const Play = ({ className }: P) => (
  <svg {...base} className={className} fill="currentColor"><polygon points="6 4 20 12 6 20 6 4" /></svg>
);

export const ClockIcon = ({ className }: P) => (
  <svg {...base} className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
  </svg>
);

export const GlobeIcon = ({ className }: P) => (
  <svg {...base} className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" /><path d="M3 12h18" />
    <path d="M12 3a14 14 0 0 1 0 18" /><path d="M12 3a14 14 0 0 0 0 18" />
  </svg>
);

/** Material-style filled "code" glyph (practice). */
export const CodeIcon = ({ className }: P) => (
  <svg {...base} className={className} fill="currentColor">
    <path d="M9.4 16.6 4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0 4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" />
  </svg>
);

/** Material-style filled microphone (interviews). */
export const MicIcon = ({ className }: P) => (
  <svg {...base} className={className} fill="currentColor">
    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
  </svg>
);

/** Material-style filled lightbulb (insight / trajectory). */
export const LightbulbIcon = ({ className }: P) => (
  <svg {...base} className={className} fill="currentColor">
    <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" />
  </svg>
);
