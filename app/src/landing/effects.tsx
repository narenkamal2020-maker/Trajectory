import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { useReducedMotion } from 'framer-motion';

/** Aceternity-style mouse-tracking radial spotlight */
export function Spotlight() {
  const [pos, setPos] = useState({ x: '50%', y: '30%' });
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const handler = (e: globalThis.MouseEvent) => {
      setPos({ x: `${e.clientX}px`, y: `${e.clientY}px` });
    };
    window.addEventListener('mousemove', handler, { passive: true });
    return () => window.removeEventListener('mousemove', handler);
  }, [reduced]);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[1]"
      style={{
        background: `radial-gradient(700px circle at ${pos.x} ${pos.y}, rgba(110, 70, 240, 0.1), transparent 60%)`,
        transition: 'background 0.25s ease-out',
      }}
      aria-hidden
    />
  );
}

/** Magic UI-style count-up ticker triggered on scroll into view */
export function NumberTicker({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced) { setCount(value); return; }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const dur = 1600;
        const step = (now: number) => {
          const p = Math.min((now - t0) / dur, 1);
          setCount(Math.round((1 - (1 - p) ** 3) * value));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, reduced]);

  return <span ref={ref}>{count}{suffix}</span>;
}

/** Aceternity-style 3D perspective tilt on hover */
export function Tilt3D({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties>({
    transform: 'perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)',
    transition: 'transform 0.5s ease-out',
  });
  const reduced = useReducedMotion();

  return (
    <div
      ref={ref}
      style={style}
      className={className}
      onMouseMove={(e) => {
        if (reduced || !ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        setStyle({
          transform: `perspective(900px) rotateX(${y * -8}deg) rotateY(${x * 8}deg) scale(1.025)`,
          transition: 'transform 0.1s ease-out',
        });
      }}
      onMouseLeave={() =>
        setStyle({
          transform: 'perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)',
          transition: 'transform 0.5s ease-out',
        })
      }
    >
      {children}
    </div>
  );
}
