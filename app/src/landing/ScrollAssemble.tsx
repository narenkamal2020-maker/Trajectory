/**
 * Scroll-driven "assembly" interlude between the hero and capabilities.
 * Adapted from Skiper31 (CharacterV1 / CharacterV3): letters start scattered and spun out from
 * the centre and converge as the section scrolls through the viewport, while a row of language
 * tiles flies in from the sides. Native scrolling (no Lenis); static under reduced motion.
 */
import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion';

const HEADLINE = 'every skill, measured';
const TILES = [
  { label: 'JS', name: 'JavaScript' },
  { label: 'Py', name: 'Python' },
  { label: 'SQL', name: 'SQL' },
  { label: 'DSA', name: 'Data structures & algorithms' },
  { label: 'SD', name: 'System design' },
  { label: 'Beh', name: 'Behavioral interviews' },
  { label: 'ATS', name: 'Resume scoring' },
];

/** One letter: horizontal spread grows with distance from the centre (CharacterV1). */
function Letter({ char, index, center, progress }: { char: string; index: number; center: number; progress: MotionValue<number> }) {
  const distance = index - center;
  const x = useTransform(progress, [0, 0.5], [distance * 50, 0]);
  const rotateX = useTransform(progress, [0, 0.5], [distance * 50, 0]);
  const opacity = useTransform(progress, [0, 0.35], [0.15, 1]);
  return (
    <motion.span className={`inline-block ${char === ' ' ? 'w-4 md:w-6' : ''}`} style={{ x, rotateX, opacity }}>
      {char}
    </motion.span>
  );
}

/** One tile: flies in from far left/right with spin and drop, settling in place (CharacterV3). */
function Tile({ tile, index, center, progress }: { tile: (typeof TILES)[number]; index: number; center: number; progress: MotionValue<number> }) {
  const distance = index - center;
  const x = useTransform(progress, [0, 0.55], [distance * 90, 0]);
  const y = useTransform(progress, [0, 0.55], [Math.abs(distance) * 40, 0]);
  const rotate = useTransform(progress, [0, 0.55], [distance * 45, 0]);
  const scale = useTransform(progress, [0, 0.55], [0.6, 1]);
  return (
    <motion.li style={{ x, y, rotate, scale }} title={tile.name}
      className="liquid-glass flex h-14 w-14 items-center justify-center rounded-2xl font-heading text-xl italic text-white md:h-20 md:w-20 md:text-2xl">
      <span aria-hidden>{tile.label}</span>
      <span className="sr-only">{tile.name}</span>
    </motion.li>
  );
}

export function ScrollAssemble() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const chars = HEADLINE.split('');
  const charCenter = Math.floor(chars.length / 2);
  const tileCenter = Math.floor(TILES.length / 2);

  if (reduced) {
    return (
      <section aria-label="What Trajectory measures" className="bg-black px-6 py-28 text-center">
        <h2 className="font-heading text-5xl italic tracking-[-2px] text-white md:text-7xl">{HEADLINE}</h2>
        <ul className="mt-10 flex flex-wrap justify-center gap-3">
          {TILES.map((t) => (
            <li key={t.label} title={t.name} className="liquid-glass flex h-14 w-14 items-center justify-center rounded-2xl font-heading text-xl italic text-white">
              <span aria-hidden>{t.label}</span><span className="sr-only">{t.name}</span>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section ref={ref} aria-label="What Trajectory measures" className="relative h-[180vh] bg-black">
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden px-4" style={{ perspective: 500 }}>
        <h2 aria-label={HEADLINE} className="whitespace-nowrap font-heading text-[11vw] italic leading-none tracking-[-2px] text-white md:text-8xl">
          <span aria-hidden>
            {chars.map((c, i) => <Letter key={i} char={c} index={i} center={charCenter} progress={scrollYProgress} />)}
          </span>
        </h2>
        <p className="mt-6 max-w-md text-center font-body text-sm font-light text-white/80">
          Code, interviews and your resume feed one skill map — so every hour of practice moves the needle you care about.
        </p>
        <ul className="mt-12 flex flex-wrap justify-center gap-3 md:gap-4">
          {TILES.map((t, i) => <Tile key={t.label} tile={t} index={i} center={tileCenter} progress={scrollYProgress} />)}
        </ul>
      </div>
    </section>
  );
}
