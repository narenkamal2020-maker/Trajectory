import { Fragment } from 'react';

/** Renders `code` and **bold** spans safely (no HTML injection). */
export function RichText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return (
    <p className={className}>
      {parts.map((p, i) => {
        if (p.startsWith('`') && p.endsWith('`')) return <code key={i} className="px-1 py-0.5 rounded bg-white/10 text-[var(--color-primary)] text-[0.9em]">{p.slice(1, -1)}</code>;
        if (p.startsWith('**') && p.endsWith('**')) return <strong key={i} className="text-white">{p.slice(2, -2)}</strong>;
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </p>
  );
}
