/**
 * Hand-written SVG charts. Rules (see dataviz guidance):
 *  - one y-axis per chart; recessive grid; 2px lines; ≥8px markers; 4px rounded bar ends
 *  - categorical series colors are fixed by entity (validated for CVD on the #191b26 surface)
 *  - ≥2 series → legend + direct end labels; text uses text tokens, never series colors
 *  - every chart has a hover tooltip and a screen-reader table
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

/** Track an element's width without reading refs during render. */
function useWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width || fallback));
    ro.observe(el);
    return () => ro.disconnect();
  }, [fallback]);
  return [ref, width] as const;
}

/** Validated categorical slots (dark): blue, orange, aqua. */
export const SERIES = ['#3987e5', '#d95926', '#199e70'] as const;
const GOLD = 'var(--chart-accent, #ffd371)';
const GRID = 'var(--chart-grid, rgba(255,255,255,0.07))';
const AXIS_TEXT = 'var(--chart-axis, #9c8f79)';
const LABEL_TEXT = 'var(--color-text-secondary, #d3c5ac)';
const STRONG_TEXT = 'var(--color-text-primary, #e1e1f1)';

function SrTable({ caption, headers, rows }: { caption: string; headers: string[]; rows: Array<Array<string | number>> }) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead><tr>{headers.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
    </table>
  );
}

function Tooltip({ x, y, children, containerWidth }: { x: number; y: number; children: ReactNode; containerWidth: number }) {
  const left = Math.min(Math.max(8, x + 12), containerWidth - 168);
  return (
    <div className="pointer-events-none absolute z-10 w-40 rounded-lg border border-white/10 bg-[var(--chart-tooltip-bg,rgba(17,19,29,0.95))] px-2.5 py-2 text-[11px] shadow-xl backdrop-blur" style={{ left, top: Math.max(0, y - 10) }}>
      {children}
    </div>
  );
}

export function Legend({ items }: { items: Array<{ label: string; color: string }> }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[var(--color-text-secondary)]">
      {items.map((i) => <li key={i.label} className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded" style={{ background: i.color }} aria-hidden />{i.label}</li>)}
    </ul>
  );
}

// ───────────────────────────── Line chart ─────────────────────────────
/** Round a raw tick step up to 1, 2, 2.5 or 5 × 10^n. */
function niceStep(raw: number): number {
  const p = 10 ** Math.floor(Math.log10(raw));
  const f = raw / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
}
export interface LineSeries { key: string; label: string; color: string; values: Array<number | null> }

export function LineChart({ labels, series, height = 220, yMax, yLabel, caption, formatX = (s) => s.slice(5) }: {
  labels: string[]; series: LineSeries[]; height?: number; yMax?: number; yLabel?: string; caption: string; formatX?: (s: string) => string;
}) {
  const [wrap, width] = useWidth<HTMLElement>(640);
  const [hover, setHover] = useState<number | null>(null);
  const W = 640, H = height, pad = { l: 34, r: series.length > 1 ? 92 : 16, t: 10, b: 24 };
  const all = series.flatMap((s) => s.values.filter((v): v is number => v !== null));
  const rawMax = Math.max(1, ...all) * 1.08;
  const step = yMax ? yMax / 4 : niceStep(rawMax / 4);
  const max = yMax ?? step * 4;
  const x = (i: number) => pad.l + (labels.length <= 1 ? (W - pad.l - pad.r) / 2 : (i / (labels.length - 1)) * (W - pad.l - pad.r));
  const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const ticks = [0, 1, 2, 3, 4].map((i) => Math.round(step * i * 100) / 100);

  const path = (vals: Array<number | null>) => {
    let d = '', pen = false;
    vals.forEach((v, i) => {
      if (v === null) { pen = false; return; }
      d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
      pen = true;
    });
    return d;
  };

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0, dist = Infinity;
    labels.forEach((_, i) => { const d = Math.abs(x(i) - px); if (d < dist) { dist = d; best = i; } });
    setHover(best);
  };

  // End-of-line labels, nudged apart so they never overlap (min 12px vertical spacing).
  const endLabels = series.flatMap((s) => {
    const lastIdx = s.values.map((v, i) => (v === null ? -1 : i)).filter((i) => i >= 0).pop();
    return lastIdx === undefined ? [] : [{ key: s.key, label: s.label, x: x(lastIdx), y: y(s.values[lastIdx]!) }];
  }).sort((a, b) => a.y - b.y);
  for (let i = 1; i < endLabels.length; i++) endLabels[i].y = Math.max(endLabels[i].y, endLabels[i - 1].y + 12);

  if (!labels.length) return <p className="text-xs text-[var(--color-text-muted)] py-8 text-center">Not enough history yet.</p>;
  const scale = width / W;

  return (
    <figure ref={wrap} className="relative">
      {series.length > 1 && <div className="mb-2"><Legend items={series.map((s) => ({ label: s.label, color: s.color }))} /></div>}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={caption} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} style={{ stroke: GRID }} />
            <text x={pad.l - 6} y={y(t) + 3} textAnchor="end" fontSize="10" style={{ fill: AXIS_TEXT }}>{t}</text>
          </g>
        ))}
        {yLabel && <text x={4} y={pad.t + 2} fontSize="10" style={{ fill: AXIS_TEXT }}>{yLabel}</text>}
        {labels.map((l, i) => (labels.length <= 8 || i % Math.ceil(labels.length / 6) === 0 || i === labels.length - 1) && (
          <text key={l + i} x={x(i)} y={H - 6} textAnchor="middle" fontSize="10" style={{ fill: AXIS_TEXT }}>{formatX(l)}</text>
        ))}
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} stroke="rgba(255,255,255,0.25)" strokeDasharray="3 3" />}
        {series.map((s) => (
          <g key={s.key}>
            <path d={path(s.values)} fill="none" style={{ stroke: s.color }} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {s.values.map((v, i) => v !== null && (labels.length <= 12 || i === hover) && (
              <circle key={i} cx={x(i)} cy={y(v)} r={4} style={{ fill: s.color, stroke: "var(--color-surface-container-low, #191b26)" }} strokeWidth={2} />
            ))}
          </g>
        ))}
        {series.length > 1 && endLabels.map((l) => <text key={l.key} x={l.x + 8} y={l.y + 3} fontSize="10" style={{ fill: LABEL_TEXT }}>{l.label}</text>)}
      </svg>
      {hover !== null && (
        <Tooltip x={x(hover) * scale} y={20} containerWidth={width}>
          <div className="text-[var(--color-text-muted)] mb-1">{labels[hover]}</div>
          {series.map((s) => (
            <div key={s.key} className="flex items-center justify-between gap-2 text-[#e1e1f1]">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: s.color }} />{s.label}</span>
              <span className="font-mono">{s.values[hover] ?? '—'}</span>
            </div>
          ))}
        </Tooltip>
      )}
      <SrTable caption={caption} headers={['Date', ...series.map((s) => s.label)]} rows={labels.map((l, i) => [l, ...series.map((s) => s.values[i] ?? '—')])} />
    </figure>
  );
}

// ───────────────────────────── Heatmap ─────────────────────────────
const RAMP = [
  'var(--chart-empty, rgba(255,255,255,0.06))',
  'color-mix(in srgb, var(--chart-accent, #ffd371) 28%, transparent)',
  'color-mix(in srgb, var(--chart-accent, #ffd371) 48%, transparent)',
  'color-mix(in srgb, var(--chart-accent, #ffd371) 72%, transparent)',
  GOLD,
];

export function ActivityHeatmap({ days, caption }: { days: Array<{ date: string; submissions: number; accepted: number }>; caption: string }) {
  const [hover, setHover] = useState<{ d: (typeof days)[number]; x: number; y: number } | null>(null);
  const [wrap, width] = useWidth<HTMLElement>(600);
  const max = Math.max(1, ...days.map((d) => d.submissions));
  const level = (n: number) => (n === 0 ? 0 : Math.min(4, Math.ceil((n / max) * 4)));
  // Columns are weeks (Mon-first); first column padded so weekdays line up.
  const firstDow = (new Date(days[0]?.date + 'T00:00:00Z').getUTCDay() + 6) % 7;
  const cell = 12, gap = 3;
  const cols = Math.ceil((days.length + firstDow) / 7);
  return (
    <figure ref={wrap} className="relative">
      <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${cols * (cell + gap) + 24} ${7 * (cell + gap)}`} width={(cols * (cell + gap) + 24) * 1.6} height={7 * (cell + gap) * 1.6} className="max-w-none" role="img" aria-label={caption} onMouseLeave={() => setHover(null)}>
        {['Mon', 'Wed', 'Fri'].map((l, i) => <text key={l} x={0} y={(i * 2) * (cell + gap) + 10} fontSize="8" style={{ fill: AXIS_TEXT }}>{l}</text>)}
        {days.map((d, i) => {
          const idx = i + firstDow, cx = 24 + Math.floor(idx / 7) * (cell + gap), cy = (idx % 7) * (cell + gap);
          return (
            <rect key={d.date} x={cx} y={cy} width={cell} height={cell} rx={2} style={{ fill: RAMP[level(d.submissions)] }}
              onMouseEnter={(e) => {
                const r = wrap.current!.getBoundingClientRect(), t = (e.target as SVGRectElement).getBoundingClientRect();
                setHover({ d, x: t.left - r.left, y: t.top - r.top - 40 });
              }} />
          );
        })}
      </svg>
      </div>
      <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-[var(--color-text-muted)]">
        Less {RAMP.map((c) => <span key={c} className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} />)} More
      </div>
      {hover && (
        <Tooltip x={hover.x} y={hover.y} containerWidth={width}>
          <div className="text-[var(--color-text-muted)]">{hover.d.date}</div>
          <div className="text-[#e1e1f1]">{hover.d.submissions} submissions · {hover.d.accepted} accepted</div>
        </Tooltip>
      )}
      <SrTable caption={caption} headers={['Date', 'Submissions', 'Accepted']} rows={days.filter((d) => d.submissions).map((d) => [d.date, d.submissions, d.accepted])} />
    </figure>
  );
}

// ───────────────────────────── Horizontal bars ─────────────────────────────
export interface BarRow { label: string; value: number; max?: number; marker?: number; note?: string }

/** Single-measure horizontal bars on a shared 0..max scale, optional "available" track and target marker. */
export function BarList({ rows, max, caption, unit = '' }: { rows: BarRow[]; max?: number; caption: string; unit?: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const scaleMax = max ?? Math.max(1, ...rows.map((r) => Math.max(r.value, r.max ?? 0, r.marker ?? 0)));
  return (
    <figure>
      <ul className="space-y-2.5" aria-hidden>
        {rows.map((r, i) => (
          <li key={r.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} className="group">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#e1e1f1] truncate">{r.label}</span>
              <span className="font-mono text-[var(--color-text-secondary)]">{Math.round(r.value)}{unit}{r.max !== undefined ? ` / ${r.max}` : ''}{hover === i && r.note ? ` · ${r.note}` : ''}</span>
            </div>
            <div className="relative h-2.5 rounded bg-white/[0.05]">
              {r.max !== undefined && <div className="absolute inset-y-0 left-0 rounded bg-white/[0.08]" style={{ width: `${(r.max / scaleMax) * 100}%` }} />}
              <div className="absolute inset-y-0 left-0 rounded transition-[width] duration-700" style={{ width: `${(r.value / scaleMax) * 100}%`, background: GOLD, opacity: hover === null || hover === i ? 1 : 0.55 }} />
              {r.marker !== undefined && <div className="absolute -top-1 w-0.5 h-[18px] bg-white/70 rounded" style={{ left: `${(r.marker / scaleMax) * 100}%` }} />}
            </div>
          </li>
        ))}
      </ul>
      <SrTable caption={caption} headers={['Item', 'Value', 'Total / target']} rows={rows.map((r) => [r.label, Math.round(r.value), r.max ?? r.marker ?? '—'])} />
    </figure>
  );
}

// ───────────────────────────── Radial constellation ─────────────────────────────
export interface ConstellationPoint { id: string; label: string; group: string; value: number; target: number | null; status: string }

/** Skills placed on a radar-style dial: angle = skill (grouped by category), radius = proficiency; target ring dots. */
export function Constellation({ points, onSelect, selected, caption }: { points: ConstellationPoint[]; onSelect: (id: string) => void; selected: string | null; caption: string }) {
  const S = 420, c = S / 2, R = 170;
  const sorted = useMemo(() => [...points].sort((a, b) => a.group.localeCompare(b.group) || a.label.localeCompare(b.label)), [points]);
  const [hover, setHover] = useState<string | null>(null);
  const pos = (i: number, v: number) => {
    const a = (i / Math.max(1, sorted.length)) * Math.PI * 2 - Math.PI / 2;
    const r = 18 + (v / 100) * (R - 18);
    return [c + Math.cos(a) * r, c + Math.sin(a) * r] as const;
  };
  const color = (p: ConstellationPoint) =>
    p.status === 'locked' ? 'rgba(255,255,255,0.3)' : p.target === null ? '#9c8f79' : p.value >= p.target ? GOLD : '#d95926';
  return (
    <figure>
      <svg viewBox={`0 0 ${S} ${S}`} className="w-full h-auto max-w-[520px] mx-auto" role="img" aria-label={caption}>
        {[25, 50, 75, 100].map((v) => <circle key={v} cx={c} cy={c} r={18 + (v / 100) * (R - 18)} fill="none" style={{ stroke: GRID }} />)}
        {[25, 50, 75, 100].map((v) => <text key={v} x={c + 3} y={c - (18 + (v / 100) * (R - 18)) + 10} fontSize="9" style={{ fill: AXIS_TEXT }}>{v}</text>)}
        {sorted.map((p, i) => {
          const [ex, ey] = pos(i, 100);
          const [px, py] = pos(i, p.value);
          const t = p.target !== null ? pos(i, p.target) : null;
          const active = selected === p.id || hover === p.id;
          return (
            <g key={p.id} className="cursor-pointer" onClick={() => onSelect(p.id)} onMouseEnter={() => setHover(p.id)} onMouseLeave={() => setHover(null)}
              tabIndex={0} role="button" aria-label={`${p.label}: ${Math.round(p.value)}${p.target !== null ? ` of ${p.target} target` : ''}`}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(p.id); } }}>
              <line x1={c} y1={c} x2={ex} y2={ey} style={{ stroke: active ? 'rgba(255,211,113,0.4)' : GRID }} />
              <line x1={c} y1={c} x2={px} y2={py} style={{ stroke: color(p) }} strokeWidth={2} strokeLinecap="round" />
              {t && <circle cx={t[0]} cy={t[1]} r={3} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={1.5} />}
              <circle cx={px} cy={py} r={active ? 7 : 5} style={{ fill: color(p), stroke: "var(--color-surface-container-low, #191b26)" }} strokeWidth={2} />
              <circle cx={ex} cy={ey} r={12} fill="transparent" />
              {active && <text x={px} y={py - 11} textAnchor="middle" fontSize="11" style={{ fill: STRONG_TEXT }} fontWeight="bold">{p.label}</text>}
            </g>
          );
        })}
        <circle cx={c} cy={c} r={14} style={{ fill: "var(--color-surface-container-low, #191b26)", stroke: GOLD }} strokeWidth={1.5} />
      </svg>
      <div className="flex flex-wrap justify-center gap-4 text-[11px] text-[var(--color-text-secondary)] mt-2">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: GOLD }} />at / above target</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: '#d95926' }} />below target</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: '#9c8f79' }} />practiced, not required</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-white/30" />not started</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full border border-white/70" />target</span>
      </div>
      <SrTable caption={caption} headers={['Skill', 'Category', 'Proficiency', 'Target']} rows={sorted.map((p) => [p.label, p.group, Math.round(p.value), p.target ?? '—'])} />
    </figure>
  );
}
