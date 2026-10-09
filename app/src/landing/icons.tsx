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

/** Windows logo (four coloured squares). */
export const WindowsIcon = ({ className }: P) => (
  <svg {...base} className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4h-13.051M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-13.051-1.799" />
  </svg>
);

/** Apple logo mark. */
export const AppleIcon = ({ className }: P) => (
  <svg {...base} className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);

/** Tux-free Linux symbol (terminal / kernel). */
export const LinuxIcon = ({ className }: P) => (
  <svg {...base} className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.581 19.049c-.55-.446-.336-1.431-.965-1.877-.287-.206-.678-.289-1.006-.445-.816-.393-1.65-1.048-1.927-1.961-.139-.455-.107-.927.02-1.35-.438-.359-.869-.721-1.289-1.101-.293.428-.642.792-.9 1.197-.763 1.208-1.181 2.675-2.428 3.654-.409.32-.84.588-1.255.88.046.056.092.11.136.17.426.567.774 1.26.62 2.213-.053.333-.116.684.128.973.247.295.772.364 1.104.221.38-.163.434-.63.476-.985.03-.259.041-.519.085-.776.188-1.072.951-2.168 2.085-2.46.253-.066.498-.068.729-.071.463 1.436 1.154 2.811 2.317 3.744 1.071.862 2.474.938 3.77.62.24-.058.471-.169.591-.398.121-.228.056-.527-.144-.716zm-7.454-3.744c.244-.456.501-.907.751-1.361.266.254.541.498.822.736-.517.2-1.052.396-1.573.625zm-2.643-7.663c.185-1.393.929-2.609 1.706-3.714C13.175 2.78 14.281 1.94 15.4 1.11c1.082-.804 2.223-1.656 3.565-1.11 1.195.489 1.664 1.9 1.755 3.118.102 1.376-.232 2.762-.738 4.027-.491 1.229-1.188 2.516-2.365 3.139-.312.163-.643.261-.972.324-.332.064-.672.083-1.007.077-.342-.007-.683-.042-1.014-.113-.32-.068-.631-.175-.912-.348-.63-.389-1.064-1.057-1.208-1.775-.143-.718.002-1.478.199-2.134zm-3.437 4.427c-.265-.18-.513-.384-.752-.596-.263.528-.524 1.056-.779 1.587l.1.078c.48-.36.962-.713 1.431-1.069zm5.059 1.428c.162.105.326.202.489.304.004-.293.046-.579.113-.858-.205.186-.408.37-.602.554zm-1.5-2.15c-.291-.28-.572-.572-.842-.874-.297.426-.586.858-.867 1.295.577-.142 1.148-.282 1.709-.421zm-3.374-2.83c-.086.378-.168.758-.244 1.14.314.281.635.553.962.814.025-.526.07-1.048.134-1.568-.284-.127-.567-.26-.852-.386zm4.924 5.074c.359-.294.724-.582 1.09-.868-.174-.145-.344-.295-.513-.446-.194.438-.39.877-.577 1.314zm-3.083-7.28c.019-.37.064-.737.125-1.101-.195.086-.392.168-.589.249-.065.408-.118.817-.158 1.229.207-.127.415-.252.622-.377zm1.959 7.897c.139.154.28.306.423.455.151-.342.301-.685.454-1.027-.292.19-.585.381-.877.572zm2.458-7.413c-.144-.256-.3-.503-.467-.741-.254.099-.507.197-.762.292.15.286.291.578.424.874.268-.143.537-.285.805-.425zm-2.741-.773c-.126-.08-.253-.157-.381-.232-.227.139-.454.275-.682.41.06.319.111.64.154.963.303-.381.607-.762.909-1.141z" />
  </svg>
);

/** Android robot logo. */
export const AndroidIcon = ({ className }: P) => (
  <svg {...base} className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.523 15.341c-.414 0-.75-.336-.75-.75V8.659c0-.414.336-.75.75-.75s.75.336.75.75v5.932c0 .414-.336.75-.75.75zm-11.046 0c-.414 0-.75-.336-.75-.75V8.659c0-.414.336-.75.75-.75s.75.336.75.75v5.932c0 .414-.336.75-.75.75zm4.773 3.909c-.414 0-.75-.336-.75-.75v-1.5c0-.414.336-.75.75-.75s.75.336.75.75v1.5c0 .414-.336.75-.75.75zm3 0c-.414 0-.75-.336-.75-.75v-1.5c0-.414.336-.75.75-.75s.75.336.75.75v1.5c0 .414-.336.75-.75.75zM8.25 7.5h7.5V6.159a3.75 3.75 0 1 0-7.5 0V7.5zm-1.5 0V6.159a5.25 5.25 0 1 1 10.5 0V7.5h.519A1.981 1.981 0 0 1 19.75 9.48v7.54A1.981 1.981 0 0 1 17.769 19H6.231A1.981 1.981 0 0 1 4.25 17.02V9.48A1.981 1.981 0 0 1 6.231 7.5H6.75z" />
  </svg>
);

export const DownloadIcon = ({ className }: P) => (
  <svg {...base} className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12l7 7 7-7" /><path d="M3 19h18" />
  </svg>
);
