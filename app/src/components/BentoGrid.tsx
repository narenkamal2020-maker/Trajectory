import type { ReactNode } from 'react';
import { cx } from './ui';
import { Link } from '../lib/router';
import { ArrowUpRight } from '../landing/icons';

export interface BentoCardProps {
  Icon: (p: { className?: string }) => ReactNode;
  name: string;
  description: string;
  to: string;
  cta: string;
  background?: ReactNode;
  className?: string;
}

export function BentoGrid({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cx('grid auto-rows-[22rem] grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3', className ?? '')}>
      {children}
    </div>
  );
}

export function BentoCard({ Icon, name, description, to, cta, background, className }: BentoCardProps) {
  return (
    <div className={cx(
      'group relative col-span-1 flex flex-col justify-between overflow-hidden',
      'rounded-[1.25rem] border border-white/10 bg-white/[0.02]',
      'transition-all duration-300 hover:border-white/20 hover:bg-white/[0.04]',
      className ?? '',
    )}>
      {/* Decorative background element */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-60" aria-hidden>
        {background}
      </div>

      {/* Top gradient fade */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-32"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)' }}
        aria-hidden
      />

      {/* Bottom gradient */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-40"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)' }}
        aria-hidden
      />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Content — slides up on hover */}
      <div className="relative z-10 flex flex-col gap-1 p-6 transition-transform duration-300 ease-out group-hover:-translate-y-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 transition-colors group-hover:text-white">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="mt-3 font-heading text-xl italic text-white">{name}</h3>
        <p className="mt-1 font-body text-sm font-light leading-relaxed text-white/55">{description}</p>
      </div>

      {/* CTA — fades in on hover */}
      <Link
        to={to}
        className={cx(
          'absolute inset-x-6 bottom-4 z-20',
          'flex items-center gap-1.5 font-body text-sm text-white/60',
          'translate-y-3 opacity-0 transition-all duration-300 ease-out',
          'pointer-events-none group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100',
        )}
      >
        {cta} <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
