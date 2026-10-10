/** Isometric 3D sliding-cube loader. CSS lives in index.css (.bl-* classes). */
export function BoxLoader() {
  return (
    <div className="flex flex-col items-center justify-center gap-10" style={{ perspective: '800px' }}>
      <div className="bl-boxes" aria-hidden>
        {([1, 2, 3, 4] as const).map((n) => (
          <div key={n} className="bl-box">
            <div className="bl-face bl-front" />
            <div className="bl-face bl-right" />
            <div className="bl-face bl-top" />
            <div className="bl-face bl-back" />
          </div>
        ))}
      </div>
      <p className="font-mono text-xs tracking-widest text-white/30 uppercase">Loading</p>
    </div>
  );
}

export default BoxLoader;
