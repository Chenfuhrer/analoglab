"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export interface Axis {
  domain: [number, number];
  label?: string;
  ticks?: number[];
  format?: (v: number) => string;
}

export interface Scales {
  sx: (v: number) => number;
  sy: (v: number) => number;
  /** 像素 → 数据 */
  ix: (px: number) => number;
  iy: (py: number) => number;
  iw: number;
  ih: number;
  m: { l: number; r: number; t: number; b: number };
  clipId: string;
}

export function niceTicks(lo: number, hi: number, count = 5): number[] {
  if (!(hi > lo)) return [lo];
  const span = hi - lo;
  const raw = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / mag;
  const step = (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
  const start = Math.ceil(lo / step - 1e-9) * step;
  const out: number[] = [];
  for (let v = start; v <= hi + step * 1e-6; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : v);
  return out;
}

export function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((es) => {
      for (const e of es) setW(Math.round(e.contentRect.width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

export function Plot({
  height = 240,
  x,
  y,
  children,
  onHover,
  margin,
  testId,
  ariaLabel,
}: {
  height?: number;
  x: Axis;
  y: Axis;
  children: (s: Scales) => ReactNode;
  onHover?: (xValue: number | null, yValue: number | null) => void;
  margin?: Partial<Scales["m"]>;
  testId?: string;
  ariaLabel: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const uid = useId().replace(/:/g, "");
  const m = { l: 52, r: 14, t: 12, b: 36, ...margin };
  const W = Math.max(width, 200);
  const iw = W - m.l - m.r;
  const ih = height - m.t - m.b;
  const [x0, x1] = x.domain;
  const [y0, y1] = y.domain;
  const sx = (v: number) => m.l + ((v - x0) / (x1 - x0)) * iw;
  const sy = (v: number) => m.t + ih - ((v - y0) / (y1 - y0)) * ih;
  const ix = (px: number) => x0 + ((px - m.l) / iw) * (x1 - x0);
  const iy = (py: number) => y0 + ((m.t + ih - py) / ih) * (y1 - y0);
  const xt = x.ticks ?? niceTicks(x0, x1, Math.max(3, Math.round(iw / 90)));
  const yt = y.ticks ?? niceTicks(y0, y1, Math.max(3, Math.round(ih / 45)));
  const fx = x.format ?? ((v: number) => String(Number(v.toPrecision(3))));
  const fy = y.format ?? ((v: number) => String(Number(v.toPrecision(3))));
  const clipId = `clip-${uid}`;
  const scales: Scales = { sx, sy, ix, iy, iw, ih, m, clipId };

  return (
    <div ref={ref} className="relative w-full" data-testid={testId}>
      {width > 0 && (
        <svg
          width={W}
          height={height}
          role="img"
          aria-label={ariaLabel}
          className="block select-none"
          onPointerMove={(e) => {
            if (!onHover) return;
            const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
            const px = e.clientX - r.left;
            const py = e.clientY - r.top;
            if (px < m.l || px > m.l + iw || py < m.t || py > m.t + ih) onHover(null, null);
            else onHover(ix(px), iy(py));
          }}
          onPointerLeave={() => onHover?.(null, null)}
        >
          <defs>
            <clipPath id={clipId}>
              <rect x={m.l} y={m.t} width={iw} height={ih} />
            </clipPath>
          </defs>
          <rect x={m.l} y={m.t} width={iw} height={ih} fill="var(--bg-elev)" stroke="var(--line)" />
          {/* 网格 */}
          {xt.map((v) => (
            <line key={`gx${v}`} x1={sx(v)} x2={sx(v)} y1={m.t} y2={m.t + ih} stroke="var(--grid-strong)" />
          ))}
          {yt.map((v) => (
            <line key={`gy${v}`} y1={sy(v)} y2={sy(v)} x1={m.l} x2={m.l + iw} stroke={v === 0 ? "var(--ink-3)" : "var(--grid-strong)"} strokeOpacity={v === 0 ? 0.5 : 1} />
          ))}
          {/* 刻度 */}
          <g fontSize={10.5} fill="var(--ink-3)" style={{ fontFamily: "var(--font-mono)" }}>
            {xt.map((v) => (
              <text key={`tx${v}`} x={sx(v)} y={m.t + ih + 14} textAnchor="middle">
                {fx(v)}
              </text>
            ))}
            {yt.map((v) => (
              <text key={`ty${v}`} x={m.l - 6} y={sy(v) + 3.5} textAnchor="end">
                {fy(v)}
              </text>
            ))}
          </g>
          {x.label && (
            <text x={m.l + iw} y={height - 4} textAnchor="end" fontSize={11.5} fill="var(--ink-2)">
              {x.label}
            </text>
          )}
          {y.label && (
            <text x={m.l - 6} y={m.t - 2} textAnchor="end" fontSize={11.5} fill="var(--ink-2)" transform={`rotate(0)`}>
              {y.label}
            </text>
          )}
          {children(scales)}
        </svg>
      )}
      {width === 0 && <div style={{ height }} />}
    </div>
  );
}

/** 折线（自动裁剪到绘图区） */
export function Line({
  points,
  s,
  color,
  width = 1.8,
  dash,
  opacity = 1,
  testId,
}: {
  points: Array<[number, number]>;
  s: Scales;
  color: string;
  width?: number;
  dash?: string;
  opacity?: number;
  testId?: string;
}) {
  let d = "";
  for (let i = 0; i < points.length; i++) {
    const [a, b] = points[i];
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
    d += `${d ? "L" : "M"}${s.sx(a).toFixed(2)} ${s.sy(b).toFixed(2)}`;
  }
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeDasharray={dash}
      strokeOpacity={opacity}
      strokeLinejoin="round"
      clipPath={`url(#${s.clipId})`}
      data-testid={testId}
    />
  );
}
