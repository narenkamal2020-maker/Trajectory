import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { prefersReducedMotion } from '../lib/platform';

const FADE_IN_MS = 500;
const FADE_OUT_MS = 550;
const FADE_OUT_LEAD_S = 0.55;

/**
 * Background video that fades in when ready, fades out just before it ends, then loops
 * (single source) or advances to the next source (array). With reduced motion it shows a
 * still first frame instead of playing.
 */
export function FadingVideo({ src, className, style, onError }: {
  src: string | string[];
  className?: string;
  style?: CSSProperties;
  onError?: () => void;
}) {
  const sources = Array.isArray(src) ? src : [src];
  const [index, setIndex] = useState(0);
  const video = useRef<HTMLVideoElement>(null);
  const raf = useRef(0);
  const fadingOut = useRef(false);
  const reduced = prefersReducedMotion();

  const fadeTo = (target: number, ms: number) => {
    const el = video.current;
    if (!el) return;
    cancelAnimationFrame(raf.current);
    const from = Number(el.style.opacity || 0);
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      el.style.opacity = String(from + (target - from) * t);
      if (t < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  };

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  // Native listener (plus an immediate check): the error can fire before React's handler is attached.
  const onErrorRef = useRef(onError);
  useEffect(() => { onErrorRef.current = onError; });
  useEffect(() => {
    const el = video.current;
    if (!el) return;
    const fail = () => onErrorRef.current?.();
    if (el.error) fail();
    el.addEventListener('error', fail);
    return () => el.removeEventListener('error', fail);
  }, [index]);

  return (
    <video
      ref={video}
      key={sources[index]}
      src={sources[index]}
      className={className}
      style={{ ...style, opacity: 0 }}
      autoPlay={!reduced}
      muted
      playsInline
      preload="auto"
      aria-hidden="true"
      tabIndex={-1}
      onLoadedData={() => {
        fadingOut.current = false;
        if (reduced) { if (video.current) video.current.style.opacity = '1'; return; }
        fadeTo(1, FADE_IN_MS);
      }}
      onTimeUpdate={(e) => {
        const el = e.currentTarget;
        if (reduced || fadingOut.current || !Number.isFinite(el.duration)) return;
        if (el.duration - el.currentTime <= FADE_OUT_LEAD_S) {
          fadingOut.current = true;
          fadeTo(0, FADE_OUT_MS);
        }
      }}
      onEnded={(e) => {
        if (sources.length > 1) { setIndex((i) => (i + 1) % sources.length); return; }
        const el = e.currentTarget;
        el.currentTime = 0;
        fadingOut.current = false;
        void el.play().catch(() => undefined);
        fadeTo(1, FADE_IN_MS);
      }}
    />
  );
}
