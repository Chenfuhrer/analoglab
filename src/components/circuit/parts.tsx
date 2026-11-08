/**
 * 通用电路元件（任意方向）：在两个端点 a、b 之间沿直线绘制。
 * 与 symbols.tsx 共用线宽与配色，用于第 1、2、4–12 章的静态电路图。
 */
import type { ReactNode } from "react";
import { Rich } from "@/components/math/Tex";
import { STROKE, Wire } from "./symbols";

export type Pt = [number, number];

function frame(a: Pt, b: Pt) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const L = Math.hypot(dx, dy) || 1;
  const ux = dx / L;
  const uy = dy / L;
  // 法向（左手）
  const nx = -uy;
  const ny = ux;
  const at = (t: number, n = 0): Pt => [a[0] + ux * t + nx * n, a[1] + uy * t + ny * n];
  return { L, at, ux, uy, nx, ny };
}

const P = (p: Pt) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`;

/** 电阻（矩形） */
export function Res({ a, b, len = 36, color = "var(--ink)" }: { a: Pt; b: Pt; len?: number; color?: string }) {
  const f = frame(a, b);
  const s = (f.L - len) / 2;
  const w = 6.5;
  const c = [f.at(s, -w), f.at(s + len, -w), f.at(s + len, w), f.at(s, w)];
  return (
    <g>
      <Wire pts={[a, f.at(s)]} stroke={color} />
      <path d={`M${P(c[0])}L${P(c[1])}L${P(c[2])}L${P(c[3])}Z`} fill="var(--bg-elev)" stroke={color} strokeWidth={STROKE} />
      <Wire pts={[f.at(s + len), b]} stroke={color} />
    </g>
  );
}

/** 电位器：电阻 + 指向中点的滑动端箭头（箭头从法向 side 一侧指入） */
export function Pot({ a, b, len = 36, side = 1 }: { a: Pt; b: Pt; len?: number; side?: 1 | -1 }) {
  const f = frame(a, b);
  const tip = f.at(f.L / 2, 7 * side);
  const tail = f.at(f.L / 2, 24 * side);
  const ang = Math.atan2(tip[1] - tail[1], tip[0] - tail[0]);
  const h1: Pt = [tip[0] - 7 * Math.cos(ang - 0.4), tip[1] - 7 * Math.sin(ang - 0.4)];
  const h2: Pt = [tip[0] - 7 * Math.cos(ang + 0.4), tip[1] - 7 * Math.sin(ang + 0.4)];
  return (
    <g>
      <Res a={a} b={b} len={len} />
      <Wire pts={[tail, tip]} />
      <path d={`M${P(tip)}L${P(h1)}L${P(h2)}Z`} fill="var(--ink)" />
    </g>
  );
}

/** 电容（可选极性 +，标在 a 端） */
export function Cap({ a, b, polarized = false, gap = 4.5, plate = 11 }: { a: Pt; b: Pt; polarized?: boolean; gap?: number; plate?: number }) {
  const f = frame(a, b);
  const m = f.L / 2;
  return (
    <g>
      <Wire pts={[a, f.at(m - gap)]} />
      <Wire pts={[f.at(m + gap), b]} />
      <line x1={f.at(m - gap, -plate)[0]} y1={f.at(m - gap, -plate)[1]} x2={f.at(m - gap, plate)[0]} y2={f.at(m - gap, plate)[1]} stroke="var(--ink)" strokeWidth={2.2} />
      <line x1={f.at(m + gap, -plate)[0]} y1={f.at(m + gap, -plate)[1]} x2={f.at(m + gap, plate)[0]} y2={f.at(m + gap, plate)[1]} stroke="var(--ink)" strokeWidth={2.2} />
      {polarized && (
        <text x={f.at(m - gap - 7, plate - 2)[0]} y={f.at(m - gap - 7, plate - 2)[1] + 3} fontSize={10} fill="var(--ink-2)" textAnchor="middle">
          +
        </text>
      )}
    </g>
  );
}

/** 电感（4 个半圆） */
export function Ind({ a, b, len = 40, turns = 4 }: { a: Pt; b: Pt; len?: number; turns?: number }) {
  const f = frame(a, b);
  const s = (f.L - len) / 2;
  const step = len / turns;
  let d = `M${P(f.at(s))}`;
  for (let i = 0; i < turns; i++) {
    const e = f.at(s + step * (i + 1));
    d += ` A${step / 2} ${step / 2} 0 0 1 ${P(e)}`;
  }
  return (
    <g>
      <Wire pts={[a, f.at(s)]} />
      <path d={d} fill="none" stroke="var(--ink)" strokeWidth={STROKE} />
      <Wire pts={[f.at(s + len), b]} />
    </g>
  );
}

/** 二极管：a 为阳极，k 为阴极。zener 时阴极短杠两端带折边 */
export function Diode({ a, k, zener = false, led = false, color = "var(--ink)", fill }: { a: Pt; k: Pt; zener?: boolean; led?: boolean; color?: string; fill?: string }) {
  const f = frame(a, k);
  const body = 16;
  const h = 9;
  const s = (f.L - body) / 2;
  const t1 = f.at(s, -h);
  const t2 = f.at(s, h);
  const tip = f.at(s + body);
  const b1 = f.at(s + body, -h);
  const b2 = f.at(s + body, h);
  return (
    <g>
      <Wire pts={[a, f.at(s)]} stroke={color} />
      <path d={`M${P(t1)}L${P(tip)}L${P(t2)}Z`} fill={fill ?? "var(--bg-elev)"} stroke={color} strokeWidth={STROKE} strokeLinejoin="round" />
      <line x1={b1[0]} y1={b1[1]} x2={b2[0]} y2={b2[1]} stroke={color} strokeWidth={2.2} />
      {zener && (
        <path
          d={`M${P(b1)}L${P(f.at(s + body - 4, -h - 4))}M${P(b2)}L${P(f.at(s + body + 4, h + 4))}`}
          stroke={color}
          strokeWidth={STROKE}
          fill="none"
        />
      )}
      {led && (
        <g stroke={color} strokeWidth={1.2}>
          <line x1={f.at(s + 6, -h - 3)[0]} y1={f.at(s + 6, -h - 3)[1]} x2={f.at(s + 12, -h - 12)[0]} y2={f.at(s + 12, -h - 12)[1]} />
          <line x1={f.at(s + 12, -h - 3)[0]} y1={f.at(s + 12, -h - 3)[1]} x2={f.at(s + 18, -h - 12)[0]} y2={f.at(s + 18, -h - 12)[1]} />
        </g>
      )}
      <Wire pts={[f.at(s + body), k]} stroke={color} />
    </g>
  );
}

/** 直流电压源（圆 + 正负号），竖直放置：top 为正极 */
export function DCSource({ x, y1, y2, r = 15, label, neg = false }: { x: number; y1: number; y2: number; r?: number; label?: ReactNode; neg?: boolean }) {
  const yc = (y1 + y2) / 2;
  const [top, bot] = neg ? ["−", "+"] : ["+", "−"];
  return (
    <g>
      <Wire pts={[[x, y1], [x, yc - r]]} />
      <circle cx={x} cy={yc} r={r} fill="var(--bg-elev)" stroke="var(--ink)" strokeWidth={STROKE} />
      <text x={x} y={yc - 3} fontSize={12} textAnchor="middle" fill="var(--ink)">
        {top}
      </text>
      <text x={x} y={yc + 10} fontSize={12} textAnchor="middle" fill="var(--ink)">
        {bot}
      </text>
      <Wire pts={[[x, yc + r], [x, y2]]} />
      {label}
    </g>
  );
}

/** 交流电压源（竖直），+ 在上 */
export function ACSourceV({ x, y1, y2, r = 15 }: { x: number; y1: number; y2: number; r?: number }) {
  const yc = (y1 + y2) / 2;
  return (
    <g>
      <Wire pts={[[x, y1], [x, yc - r]]} />
      <circle cx={x} cy={yc} r={r} fill="var(--bg-elev)" stroke="var(--ink)" strokeWidth={STROKE} />
      <path d={`M${x - r * 0.55} ${yc} q${r * 0.275} ${-r * 0.55} ${r * 0.55} 0 t${r * 0.55} 0`} fill="none" stroke="var(--ink)" strokeWidth={STROKE} />
      <text x={x - r - 6} y={yc - r + 6} fontSize={11} fill="var(--ink-2)" textAnchor="middle">
        +
      </text>
      <Wire pts={[[x, yc + r], [x, y2]]} />
    </g>
  );
}

/** 电源端子：竖线顶端的小圆 + 标注（如 +V_CC） */
export function Rail({ x, y, main = "V", sub = "CC", sign = "+", below = false }: { x: number; y: number; main?: string; sub?: string; sign?: string; below?: boolean }) {
  return (
    <g>
      <circle cx={x} cy={y} r={3.4} fill="var(--bg-elev)" stroke="var(--ink)" strokeWidth={STROKE} />
      <text x={x + 7} y={below ? y + 16 : y - 6} fontSize={13} fill="var(--ink)" style={{ fontFamily: "var(--font-serif), serif" }}>
        {sign}
        <tspan fontStyle="italic">{main}</tspan>
        <tspan fontSize={9.5} dy={3.5}>
          {sub}
        </tspan>
      </text>
    </g>
  );
}

/**
 * 双极型晶体管。基极端点 (bx, by)；mirror=false 时集电极 (bx+50, by−50)、发射极 (bx+50, by+50)；
 * mirror=true 时基极在右，c/e 在 bx−50。flip=true 时发射极在上（用于 PNP 习惯画法）。
 */
export function BJT({ bx, by, type = "npn", mirror = false, flip = false, circle = true }: { bx: number; by: number; type?: "npn" | "pnp"; mirror?: boolean; flip?: boolean; circle?: boolean }) {
  const s = mirror ? -1 : 1;
  const v = flip ? -1 : 1;
  const barX = bx + 20 * s;
  const cx = bx + 50 * s;
  const cTop: Pt = [cx, by - 50 * v];
  const eBot: Pt = [cx, by + 50 * v];
  const eA: Pt = [barX, by + 11 * v];
  const eB: Pt = [cx, by + 34 * v];
  // NPN 箭头离开基区（指向发射极端），PNP 箭头指向基区
  const head = type === "npn" ? arrowHead(eA, eB, 0.78) : arrowHead(eB, eA, 0.62);
  return (
    <g>
      {circle && <circle cx={bx + 32 * s} cy={by} r={27} fill="none" stroke="var(--ink-3)" strokeWidth={1} />}
      <Wire pts={[[bx, by], [barX, by]]} />
      <line x1={barX} y1={by - 22} x2={barX} y2={by + 22} stroke="var(--ink)" strokeWidth={3.2} strokeLinecap="round" />
      <Wire pts={[[barX, by - 11 * v], [cx, by - 34 * v], cTop]} />
      <Wire pts={[eA, eB, eBot]} />
      <path d={head} fill="var(--ink)" />
    </g>
  );
}

function arrowHead(p1: Pt, p2: Pt, t: number, size = 8) {
  const x = p1[0] + (p2[0] - p1[0]) * t;
  const y = p1[1] + (p2[1] - p1[1]) * t;
  const ang = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
  const a1 = ang + Math.PI - 0.42;
  const a2 = ang + Math.PI + 0.42;
  return `M${x} ${y}L${x + size * Math.cos(a1)} ${y + size * Math.sin(a1)}L${x + size * Math.cos(a2)} ${y + size * Math.sin(a2)}Z`;
}

/**
 * MOSFET（衬底与源极相连的四端画法）。栅极端点 (gx, gy)；漏极 (gx+40, gy−40)，源极 (gx+40, gy+40)。
 * mode: enh 增强型（沟道虚线），dep 耗尽型（沟道实线）。N 沟道衬底箭头指向沟道。
 */
export function MOS({ gx, gy, type = "n", mode = "enh", mirror = false }: { gx: number; gy: number; type?: "n" | "p"; mode?: "enh" | "dep"; mirror?: boolean }) {
  const s = mirror ? -1 : 1;
  const gPlate = gx + 16 * s;
  const ch = gx + 23 * s;
  const tx = gx + 40 * s;
  const segs = mode === "enh" ? [[-17, -9], [-4, 4], [9, 17]] : [[-17, 17]];
  const ay = gy;
  const arrow =
    type === "n"
      ? arrowHead([tx, ay], [ch, ay], 0.72, 7)
      : arrowHead([ch, ay], [tx, ay], 0.72, 7);
  return (
    <g>
      <Wire pts={[[gx, gy + 10], [gPlate, gy + 10], [gPlate, gy - 16]]} />
      {segs.map(([a, b], i) => (
        <line key={i} x1={ch} y1={gy + a} x2={ch} y2={gy + b} stroke="var(--ink)" strokeWidth={3} strokeLinecap="butt" />
      ))}
      {/* 漏、源、衬底引线 */}
      <Wire pts={[[ch, gy - 13], [tx, gy - 13], [tx, gy - 40]]} />
      <Wire pts={[[ch, gy + 13], [tx, gy + 13], [tx, gy + 40]]} />
      <Wire pts={[[ch, ay], [tx, ay], [tx, gy + 13]]} />
      <path d={arrow} fill="var(--ink)" />
    </g>
  );
}

/**
 * 运算放大器（三角形）。左上输入在 (x, y−dy)，左下输入在 (x, y+dy)，输出在 (x+w, y)。
 * invTop=true：“−”在上（默认，反相端在上）。
 */
export function OpAmp({ x, y, w = 70, invTop = true, label }: { x: number; y: number; w?: number; invTop?: boolean; label?: string }) {
  const h = w * 0.86;
  const dy = h * 0.27;
  return (
    <g>
      <path d={`M${x + 8} ${y - h / 2}L${x + w} ${y}L${x + 8} ${y + h / 2}Z`} fill="var(--bg-elev)" stroke="var(--ink)" strokeWidth={STROKE} strokeLinejoin="round" />
      <Wire pts={[[x, y - dy], [x + 8, y - dy]]} />
      <Wire pts={[[x, y + dy], [x + 8, y + dy]]} />
      <text x={x + 15} y={y - dy + 4.5} fontSize={15} fill="var(--ink)">
        {invTop ? "−" : "+"}
      </text>
      <text x={x + 15} y={y + dy + 4.5} fontSize={15} fill="var(--ink)">
        {invTop ? "+" : "−"}
      </text>
      {label && (
        <text x={x + w * 0.42} y={y + 4} fontSize={10.5} fill="var(--ink-3)" textAnchor="middle">
          {label}
        </text>
      )}
    </g>
  );
}

export function opampPins(x: number, y: number, w = 70) {
  const dy = w * 0.86 * 0.27;
  return { top: [x, y - dy] as Pt, bot: [x, y + dy] as Pt, out: [x + w, y] as Pt };
}

/** 变压器：初级线圈在 x−gap，次级在 x+gap，竖直方向 y1→y2 */
export function Transformer({ x, y1, y2, gap = 9 }: { x: number; y1: number; y2: number; gap?: number }) {
  const len = y2 - y1;
  const turns = 4;
  const step = len / turns;
  let p = `M${x - gap - 0} ${y1}`;
  let q = `M${x + gap} ${y1}`;
  for (let i = 0; i < turns; i++) {
    p += ` A${step / 2} ${step / 2} 0 0 0 ${x - gap} ${y1 + step * (i + 1)}`;
    q += ` A${step / 2} ${step / 2} 0 0 1 ${x + gap} ${y1 + step * (i + 1)}`;
  }
  return (
    <g>
      <path d={p} fill="none" stroke="var(--ink)" strokeWidth={STROKE} />
      <path d={q} fill="none" stroke="var(--ink)" strokeWidth={STROKE} />
      <line x1={x - 2} y1={y1} x2={x - 2} y2={y2} stroke="var(--ink)" strokeWidth={1.2} />
      <line x1={x + 2} y1={y1} x2={x + 2} y2={y2} stroke="var(--ink)" strokeWidth={1.2} />
    </g>
  );
}

/** 方框（用于反馈框图等） */
export function Block({ x, y, w, h, text, sub, tone }: { x: number; y: number; w: number; h: number; text: string; sub?: string; tone?: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={4} fill="var(--bg-elev)" stroke={tone ?? "var(--ink)"} strokeWidth={STROKE} />
      <text x={x + w / 2} y={y + h / 2 + (sub ? -2 : 5)} fontSize={15} textAnchor="middle" fill="var(--ink)" style={{ fontFamily: "var(--font-serif), serif" }} fontStyle="italic">
        {text}
      </text>
      {sub && (
        <text x={x + w / 2} y={y + h / 2 + 14} fontSize={10.5} textAnchor="middle" fill="var(--ink-3)">
          {sub}
        </text>
      )}
    </g>
  );
}

/** 箭头线 */
export function Arrow({ pts, color = "var(--ink)", width = STROKE }: { pts: Pt[]; color?: string; width?: number }) {
  const n = pts.length;
  const [x1, y1] = pts[n - 2];
  const [x2, y2] = pts[n - 1];
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const s = 8;
  const h1: Pt = [x2 - s * Math.cos(ang - 0.38), y2 - s * Math.sin(ang - 0.38)];
  const h2: Pt = [x2 - s * Math.cos(ang + 0.38), y2 - s * Math.sin(ang + 0.38)];
  return (
    <g>
      <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke={color} strokeWidth={width} strokeLinejoin="round" />
      <path d={`M${P([x2, y2])}L${P(h1)}L${P(h2)}Z`} fill={color} />
    </g>
  );
}

/** 求和点（圆 + ×/Σ） */
export function SumNode({ x, y, r = 11 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="var(--bg-elev)" stroke="var(--ink)" strokeWidth={STROKE} />
      <path d={`M${x - r * 0.7} ${y - r * 0.7}L${x + r * 0.7} ${y + r * 0.7}M${x + r * 0.7} ${y - r * 0.7}L${x - r * 0.7} ${y + r * 0.7}`} stroke="var(--ink)" strokeWidth={1.2} />
    </g>
  );
}

/** 文本标注：支持 "R_L"、"u_O" 这种下标写法；value 显示在下一行 */
export function Lbl({ x, y, t, value, anchor = "start", size = 14, color = "var(--ink)" }: { x: number; y: number; t: string; value?: string; anchor?: "start" | "middle" | "end"; size?: number; color?: string }) {
  const m = /^([^_]+)(?:_\{?([^}]*)\}?)?$/.exec(t);
  const main = m?.[1] ?? t;
  const sub = m?.[2];
  const italic = /^[A-Za-zα-ωΑ-Ω]/.test(main) && !/^(VT|VD|VZ|LED|D|Z)\d*$/.test(main);
  return (
    <g style={{ pointerEvents: "none" }}>
      <text x={x} y={y} textAnchor={anchor} fontSize={size} fill={color} style={{ fontFamily: "var(--font-serif), 'Times New Roman', serif" }}>
        <tspan fontStyle={italic ? "italic" : "normal"}>{main}</tspan>
        {sub && (
          <tspan fontSize={size * 0.72} dy={size * 0.28} fontStyle="normal">
            {sub}
          </tspan>
        )}
      </text>
      {value && (
        <text x={x} y={y + size + 2} textAnchor={anchor} fontSize={size * 0.78} fill="var(--ink-3)" style={{ fontFamily: "var(--font-mono), monospace" }}>
          {value}
        </text>
      )}
    </g>
  );
}

/** 电路图外框 */
export function Fig({
  w,
  h,
  label,
  caption,
  children,
  testId,
  maxW,
}: {
  w: number;
  h: number;
  label: string;
  caption?: string;
  children: ReactNode;
  testId?: string;
  maxW?: number;
}) {
  return (
    <figure className="card my-4 overflow-hidden" data-testid={testId ?? "diagram"}>
      <div className="grid-paper px-2 py-1">
        <svg viewBox={`0 0 ${w} ${h}`} className="mx-auto block h-auto w-full" style={{ maxWidth: maxW ?? Math.round(w * 1.1) }} role="img" aria-label={label}>
          {children}
        </svg>
      </div>
      {caption && (
        <figcaption className="border-t border-line px-4 py-2 text-[12.5px] text-ink-2">
          <Rich text={caption} />
        </figcaption>
      )}
    </figure>
  );
}
