/**
 * 电路符号库（IEC / GB/T 4728 风格：矩形电阻、圆形受控源），绝对坐标绘制。
 * 线宽、字体统一在此定义，保证全站电路图风格一致。
 */
import type { ReactNode, SVGProps } from "react";

export const STROKE = 1.6;
export const RES_W = 13;

export function Wire({ pts, className, ...rest }: { pts: Array<[number, number]>; className?: string } & SVGProps<SVGPolylineElement>) {
  return (
    <polyline
      points={pts.map((p) => p.join(",")).join(" ")}
      fill="none"
      stroke="var(--ink)"
      strokeWidth={STROKE}
      strokeLinejoin="round"
      strokeLinecap="round"
      className={className}
      {...rest}
    />
  );
}

export function Dot({ x, y }: { x: number; y: number }) {
  return <circle cx={x} cy={y} r={2.8} fill="var(--ink)" />;
}

/** 符号 + 下标（SVG 原生文本，缩放清晰） */
export function Sym({
  x,
  y,
  main,
  sub,
  anchor = "start",
  size = 14,
  color = "var(--ink)",
  italic = true,
  value,
  valueColor = "var(--ink-3)",
  className,
}: {
  x: number;
  y: number;
  main: string;
  sub?: string;
  anchor?: "start" | "middle" | "end";
  size?: number;
  color?: string;
  italic?: boolean;
  value?: string;
  valueColor?: string;
  className?: string;
}) {
  return (
    <g className={className} style={{ pointerEvents: "none" }}>
      <text
        x={x}
        y={y}
        textAnchor={anchor}
        fontSize={size}
        fill={color}
        style={{ fontFamily: "var(--font-serif), 'Times New Roman', serif" }}
      >
        <tspan fontStyle={italic ? "italic" : "normal"}>{main}</tspan>
        {sub && (
          <tspan fontSize={size * 0.72} dy={size * 0.28} fontStyle="normal">
            {sub}
          </tspan>
        )}
      </text>
      {value && (
        <text
          x={x}
          y={y + size * 1.05 + 2}
          textAnchor={anchor}
          fontSize={size * 0.8}
          fill={valueColor}
          style={{ fontFamily: "var(--font-mono), monospace" }}
        >
          {value}
        </text>
      )}
    </g>
  );
}

/** 竖直电阻：在 (x, y1)–(x, y2) 之间，矩形主体居中 */
export function ResistorV({ x, y1, y2, len = 40, children }: { x: number; y1: number; y2: number; len?: number; children?: ReactNode }) {
  const yc = (y1 + y2) / 2;
  return (
    <g>
      <Wire pts={[[x, y1], [x, yc - len / 2]]} />
      <rect x={x - RES_W / 2} y={yc - len / 2} width={RES_W} height={len} fill="var(--bg-elev)" stroke="var(--ink)" strokeWidth={STROKE} rx={1} />
      <Wire pts={[[x, yc + len / 2], [x, y2]]} />
      {children}
    </g>
  );
}

export function ResistorH({ y, x1, x2, len = 40 }: { y: number; x1: number; x2: number; len?: number }) {
  const xc = (x1 + x2) / 2;
  return (
    <g>
      <Wire pts={[[x1, y], [xc - len / 2, y]]} />
      <rect x={xc - len / 2} y={y - RES_W / 2} width={len} height={RES_W} fill="var(--bg-elev)" stroke="var(--ink)" strokeWidth={STROKE} rx={1} />
      <Wire pts={[[xc + len / 2, y], [x2, y]]} />
    </g>
  );
}

export type CapState = "normal" | "open" | "short";

/**
 * 电容（可变形）：normal 正常；open 直流开路（红色断口标记）；short 交流短路（极板收拢成导线）。
 * orient: "h" 水平（电流左右流动）或 "v" 竖直。
 */
export function Capacitor({
  orient,
  c,
  a,
  b,
  state,
  polarized = false,
}: {
  orient: "h" | "v";
  /** 中心坐标 */
  c: [number, number];
  /** 两端端点（沿导线方向的坐标） */
  a: number;
  b: number;
  state: CapState;
  polarized?: boolean;
}) {
  const gap = 4.5;
  const plate = 11;
  const [cx, cy] = c;
  const isShort = state === "short";
  const isOpen = state === "open";
  if (orient === "h") {
    return (
      <g>
        <Wire pts={[[a, cy], [cx - gap, cy]]} />
        <Wire pts={[[cx + gap, cy], [b, cy]]} />
        <g className="sch-part" style={{ transform: isShort ? "scaleY(0.05)" : "none", opacity: isShort ? 0 : 1 }}>
          <line x1={cx - gap} y1={cy - plate} x2={cx - gap} y2={cy + plate} stroke="var(--ink)" strokeWidth={2.2} />
          <line x1={cx + gap} y1={cy - plate} x2={cx + gap} y2={cy + plate} stroke="var(--ink)" strokeWidth={2.2} />
          {polarized && (
            <text x={cx - gap - 7} y={cy - 6} fontSize={10} fill="var(--ink-2)" textAnchor="middle">
              +
            </text>
          )}
        </g>
        <line
          className="sch-part"
          x1={cx - gap}
          y1={cy}
          x2={cx + gap}
          y2={cy}
          stroke="var(--ac)"
          strokeWidth={STROKE + 0.6}
          style={{ opacity: isShort ? 1 : 0 }}
        />
        <OpenMark x={cx} y={cy} show={isOpen} />
      </g>
    );
  }
  return (
    <g>
      <Wire pts={[[cx, a], [cx, cy - gap]]} />
      <Wire pts={[[cx, cy + gap], [cx, b]]} />
      <g className="sch-part" style={{ transform: isShort ? "scaleX(0.05)" : "none", opacity: isShort ? 0 : 1 }}>
        <line x1={cx - plate} y1={cy - gap} x2={cx + plate} y2={cy - gap} stroke="var(--ink)" strokeWidth={2.2} />
        <line x1={cx - plate} y1={cy + gap} x2={cx + plate} y2={cy + gap} stroke="var(--ink)" strokeWidth={2.2} />
        {polarized && (
          <text x={cx - plate - 5} y={cy - gap - 2} fontSize={10} fill="var(--ink-2)" textAnchor="middle">
            +
          </text>
        )}
      </g>
      <line
        className="sch-part"
        x1={cx}
        y1={cy - gap}
        x2={cx}
        y2={cy + gap}
        stroke="var(--ac)"
        strokeWidth={STROKE + 0.6}
        style={{ opacity: isShort ? 1 : 0 }}
      />
      <OpenMark x={cx} y={cy} show={isOpen} />
    </g>
  );
}

function OpenMark({ x, y, show }: { x: number; y: number; show: boolean }) {
  return (
    <g className="sch-part" style={{ opacity: show ? 1 : 0, transform: show ? "scale(1)" : "scale(0.4)" }}>
      <circle cx={x} cy={y} r={9} fill="var(--err-soft)" stroke="var(--err)" strokeWidth={1.2} />
      <path d={`M${x - 4} ${y - 4}L${x + 4} ${y + 4}M${x + 4} ${y - 4}L${x - 4} ${y + 4}`} stroke="var(--err)" strokeWidth={1.6} strokeLinecap="round" />
    </g>
  );
}

/**
 * NPN 晶体管。基极端点 (bx, by)；集电极端点 (bx+50, by-50)；发射极端点 (bx+50, by+50)。
 */
export function NPN({ bx, by, circle = true }: { bx: number; by: number; circle?: boolean }) {
  const barX = bx + 20;
  const cx = bx + 50;
  return (
    <g>
      {circle && <circle cx={bx + 32} cy={by} r={27} fill="none" stroke="var(--ink-3)" strokeWidth={1} />}
      <Wire pts={[[bx, by], [barX, by]]} />
      <line x1={barX} y1={by - 22} x2={barX} y2={by + 22} stroke="var(--ink)" strokeWidth={3.2} strokeLinecap="round" />
      <Wire pts={[[barX, by - 11], [cx, by - 34], [cx, by - 50]]} />
      <Wire pts={[[barX, by + 11], [cx, by + 34], [cx, by + 50]]} />
      {/* 发射极箭头（NPN 向外） */}
      <path d={arrowHead(barX, by + 11, cx, by + 34, 0.78)} fill="var(--ink)" />
    </g>
  );
}

function arrowHead(x1: number, y1: number, x2: number, y2: number, t: number, size = 8) {
  const x = x1 + (x2 - x1) * t;
  const y = y1 + (y2 - y1) * t;
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const a1 = ang + Math.PI - 0.42;
  const a2 = ang + Math.PI + 0.42;
  return `M${x} ${y}L${x + size * Math.cos(a1)} ${y + size * Math.sin(a1)}L${x + size * Math.cos(a2)} ${y + size * Math.sin(a2)}Z`;
}

/** 电流方向箭头（沿导线放置的实心三角） */
export function CurrentArrow({
  x,
  y,
  dir,
  color = "var(--ink)",
  size = 8,
}: {
  x: number;
  y: number;
  dir: "up" | "down" | "left" | "right";
  color?: string;
  size?: number;
}) {
  const d = {
    right: `M${x + size / 2} ${y}L${x - size / 2} ${y - size / 2.2}L${x - size / 2} ${y + size / 2.2}Z`,
    left: `M${x - size / 2} ${y}L${x + size / 2} ${y - size / 2.2}L${x + size / 2} ${y + size / 2.2}Z`,
    down: `M${x} ${y + size / 2}L${x - size / 2.2} ${y - size / 2}L${x + size / 2.2} ${y - size / 2}Z`,
    up: `M${x} ${y - size / 2}L${x - size / 2.2} ${y + size / 2}L${x + size / 2.2} ${y + size / 2}Z`,
  }[dir];
  return <path d={d} fill={color} />;
}

export function ACSource({ x, y, r = 17 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="var(--bg-elev)" stroke="var(--ink)" strokeWidth={STROKE} />
      <path
        d={`M${x - r * 0.55} ${y} q${r * 0.275} ${-r * 0.55} ${r * 0.55} 0 t${r * 0.55} 0`}
        fill="none"
        stroke="var(--ink)"
        strokeWidth={STROKE}
      />
      <text x={x - r - 8} y={y - r + 4} fontSize={12} fill="var(--ink-2)" textAnchor="middle">
        +
      </text>
    </g>
  );
}

/** 受控电流源（圆形 + 箭头），箭头方向为电流参考方向 */
export function CurrentSourceV({ x, y1, y2, r = 13, dir = "down" }: { x: number; y1: number; y2: number; r?: number; dir?: "down" | "up" }) {
  const yc = (y1 + y2) / 2;
  const ay1 = dir === "down" ? yc - r * 0.6 : yc + r * 0.6;
  const ay2 = dir === "down" ? yc + r * 0.6 : yc - r * 0.6;
  return (
    <g>
      <Wire pts={[[x, y1], [x, yc - r]]} />
      <circle cx={x} cy={yc} r={r} fill="var(--bg-elev)" stroke="var(--ink)" strokeWidth={STROKE} />
      <line x1={x} y1={ay1} x2={x} y2={ay2 - (dir === "down" ? 4 : -4)} stroke="var(--ink)" strokeWidth={STROKE} />
      <CurrentArrow x={x} y={ay2 - (dir === "down" ? 2 : -2)} dir={dir} size={7} />
      <Wire pts={[[x, yc + r], [x, y2]]} />
    </g>
  );
}

export function Ground({ x, y, color = "var(--ink)" }: { x: number; y: number; color?: string }) {
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={y + 7} stroke={color} strokeWidth={STROKE} />
      <line x1={x - 11} y1={y + 7} x2={x + 11} y2={y + 7} stroke={color} strokeWidth={STROKE} />
      <line x1={x - 7} y1={y + 11} x2={x + 7} y2={y + 11} stroke={color} strokeWidth={STROKE} />
      <line x1={x - 3} y1={y + 15} x2={x + 3} y2={y + 15} stroke={color} strokeWidth={STROKE} />
    </g>
  );
}

export function Terminal({ x, y }: { x: number; y: number }) {
  return <circle cx={x} cy={y} r={3.6} fill="var(--bg-elev)" stroke="var(--ink)" strokeWidth={STROKE} />;
}

/** 极性标记 + / − */
export function Polarity({ x, y, sign, color = "var(--ink-2)" }: { x: number; y: number; sign: "+" | "−"; color?: string }) {
  return (
    <text x={x} y={y} fontSize={14} fontWeight={600} fill={color} textAnchor="middle" dominantBaseline="middle" style={{ pointerEvents: "none" }}>
      {sign}
    </text>
  );
}
