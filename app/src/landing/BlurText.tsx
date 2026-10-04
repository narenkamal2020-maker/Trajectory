import { useEffect, useRef, useState, type ElementType } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/** Word-by-word blur-in, triggered when the text scrolls into view. */
export function BlurText({ text, className, as: Tag = 'p', delay = 100 }: {
  text: string;
  className?: string;
  as?: ElementType;
  /** Stagger between words, in ms. */
  delay?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const words = text.split(' ');
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); io.disconnect(); }
    }, { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag ref={ref} aria-label={text} className={className}
      style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', rowGap: '0.1em' }}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          aria-hidden="true"
          style={{ display: 'inline-block', marginRight: '0.28em' }}
          initial={reduced ? false : { filter: 'blur(10px)', opacity: 0, y: 50 }}
          animate={inView ? { filter: 'blur(0px)', opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.7, delay: (i * delay) / 1000, ease: 'easeOut' }}
        >
          {word}
        </motion.span>
      ))}
    </Tag>
  );
}
