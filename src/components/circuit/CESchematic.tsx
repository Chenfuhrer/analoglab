"use client";

import { createContext, useCallback, useContext, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { CE_MODES, partVisible, type CEMode, type PartId } from "@/circuits/ce-parts";
import type { CEAnalysis } from "@/simulations/bjt/ce";
import type { CEParams } from "@/simulations/bjt/types";
import { formatSI } from "@/simulations/units";
import { Segmented } from "@/components/ui/primitives";
import {
  ACSource,
  Capacitor,
  CurrentArrow,
  CurrentSourceV,
  Dot,
  Ground,
  NPN,
  Polarity,
  ResistorH,
  ResistorV,
  Sym,
  Terminal,
  Wire,
  type CapState,
} from "./symbols";

/* ───────── 版图坐标（单位：SVG 用户坐标） ───────── */
const RAIL = 50;
const GND = 420;
const VCC_X = 625;
const SRC_X = 80;
const SRC_Y = 335;
const IN_X = 180;
const C1_X = 245;
const BX = 310; // 偏置电阻所在列
const BASE_Y = 250;
const QB = 380; // 晶体管基极端点 x
const CX = 430; // 集电极 / 发射极所在列
const C_TOP = 200;
const E_BOT = 300;
const CO_Y = 165; // 集电极输出节点
const C2_X = 505;
const RL_X = 580;
const E_MID = 360; // R_e1 与 R_e2 之间的节点
const CE_X = 510;
const VIEW: [number, number, number, number] = [20, 12, 660, 440];

type Pt = [number, number];

interface Props {
  params: CEParams;
  analysis: CEAnalysis;
  mode: CEMode;
  onModeChange?: (m: CEMode) => void;
  selected?: PartId | null;
  onSelect?: (id: PartId | null) => void;
  /** 显示元件数值 */
  showValues?: boolean;
  /** 显示电流路径与电压标注 */
  showAnnotations?: boolean;
  /** 显示缩放工具栏 */
  zoomable?: boolean;
  className?: string;
  caption?: ReactNode;
  testId?: string;
}

export function CESchematic({
  params: p,
  analysis,
  mode,
  onModeChange,
  selected = null,
  onSelect,
  showValues = true,
  showAnnotations = true,
  zoomable = true,
  className,
  caption,
  testId = "ce-schematic",
}: Props) {
  const { dc, ac } = analysis;
  const [vb, setVb] = useState(VIEW);
  const drag = useRef<{ x: number; y: number; vb: typeof VIEW; moved: boolean } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const zoom = useCallback((factor: number) => {
    setVb(([x, y, w, h]) => {
      const nw = Math.min(VIEW[2] * 1.6, Math.max(VIEW[2] / 4, w * factor));
      const nh = (nw / w) * h;
      return [x + (w - nw) / 2, y + (h - nh) / 2, nw, nh];
    });
  }, []);

  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    if (!zoomable) return;
    drag.current = { x: e.clientX, y: e.clientY, vb, moved: false };
  };
  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    const svg = svgRef.current;
    if (!d || !svg) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 4) return;
    if (!d.moved) svg.setPointerCapture(e.pointerId);
    d.moved = true;
    const rect = svg.getBoundingClientRect();
    const k = d.vb[2] / rect.width;
    setVb([d.vb[0] - dx * k, d.vb[1] - dy * k, d.vb[2], d.vb[3]]);
  };
  const onPointerUp = () => {
    drag.current = null;
  };
  const onWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    if (!zoomable || !(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    zoom(e.deltaY > 0 ? 1.12 : 1 / 1.12);
  };

  const isDC = mode === "dc";
  const isAC = mode === "ac" || mode === "ss";
  const isSS = mode === "ss";
  const capState: CapState = isDC ? "open" : isAC ? "short" : "normal";
  const ceBypass = p.Re2 > 0 && p.hasCe;
  const fadeInput = isDC;
  const fadeOutput = isDC;
  const val = (v: number, u: string) => (showValues ? formatSI(v, u) : undefined);
  const fade = (on: boolean) => ({ opacity: on ? 0.22 : 1 });

  /* ───────── 路径（用于高亮） ───────── */
  const emitterPath: Pt[] = (() => {
    const pts: Pt[] = [[CX, E_BOT]];
    if (isAC && ceBypass) pts.push([CX, E_MID], [CE_X, E_MID], [CE_X, GND]);
    else pts.push([CX, GND]);
    return pts;
  })();
  const dcPaths: Pt[][] = [
    [[VCC_X, RAIL], [BX, RAIL], [BX, BASE_Y], [QB, BASE_Y], [QB + 20, BASE_Y], [CX, BASE_Y + 34], ...emitterPath],
    [[VCC_X, RAIL], [CX, RAIL], [CX, BASE_Y - 34], [QB + 20, BASE_Y - 11], [QB + 20, BASE_Y + 11], [CX, BASE_Y + 34], ...emitterPath],
  ];
  if (p.topology === "divider") dcPaths.push([[BX, BASE_Y], [BX, GND]]);
  const inStart: Pt[] = [[SRC_X, SRC_Y - 17], [SRC_X, BASE_Y], [BX, BASE_Y], [QB, BASE_Y]];
  const acPaths: Pt[][] = isSS
    ? [
        [...inStart, [QB, E_BOT], [CX, E_BOT], ...emitterPath.slice(1)],
        [[CX, BASE_Y - 13], [CX, CO_Y], [RL_X, CO_Y], [RL_X, GND]],
        [[CX, CO_Y], [CX, RAIL]],
      ]
    : [
        [...inStart, [QB + 20, BASE_Y], [CX, BASE_Y + 34], ...emitterPath],
        [[CX, C_TOP], [CX, CO_Y], [RL_X, CO_Y], [RL_X, GND]],
        [[CX, CO_Y], [CX, RAIL]],
      ];
  if (!Number.isFinite(p.RL)) acPaths[1] = [[CX, isSS ? BASE_Y - 13 : C_TOP], [CX, CO_Y]];
  const paths = isDC ? dcPaths : isAC ? acPaths : [];
  const pathColor = isDC ? "var(--dc)" : isSS ? "var(--ss)" : "var(--ac)";

  const rbTop = p.topology === "divider" ? "Rb2" : "Rb";

  const ctx = { selected, onSelect, isDragging: () => Boolean(drag.current?.moved) };

  return (
    <PartCtx.Provider value={ctx}>
    <figure className={`card overflow-hidden ${className ?? ""}`} data-testid={testId} data-mode={mode}>
      {(onModeChange || zoomable) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2">
          {onModeChange ? (
            <Segmented
              label="电路分析模式"
              testId="mode-switch"
              value={mode}
              onChange={onModeChange}
              options={CE_MODES.map((m) => ({ value: m.value, label: m.short, hint: m.hint }))}
            />
          ) : (
            <span className="eyebrow">{CE_MODES.find((m) => m.value === mode)?.label}</span>
          )}
          {zoomable && (
            <div className="flex items-center gap-0.5" aria-label="缩放">
              <ZoomBtn label="放大" onClick={() => zoom(1 / 1.25)} testId="zoom-in">
                +
              </ZoomBtn>
              <ZoomBtn label="缩小" onClick={() => zoom(1.25)} testId="zoom-out">
                −
              </ZoomBtn>
              <ZoomBtn label="重置视图" onClick={() => setVb(VIEW)} testId="zoom-reset">
                ⟲
              </ZoomBtn>
            </div>
          )}
        </div>
      )}
      <div className="grid-paper relative">
        <svg
          ref={svgRef}
          viewBox={vb.join(" ")}
          data-testid={`${testId}-svg`}
          data-viewbox={vb.map((v) => Math.round(v)).join(" ")}
          className={`block h-auto w-full touch-none select-none ${zoomable ? "cursor-grab active:cursor-grabbing" : ""}`}
          role="img"
          aria-label={`共射放大电路（${CE_MODES.find((m) => m.value === mode)?.label}）`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onWheel={onWheel}
          onClick={() => onSelect?.(null)}
        >
          {/* ── 高亮路径（底层） ── */}
          <g aria-hidden>
            {paths.map((pts, i) => (
              <g key={`${mode}-${i}`}>
                <polyline
                  points={pts.map((q) => q.join(",")).join(" ")}
                  fill="none"
                  stroke={pathColor}
                  strokeOpacity={0.18}
                  strokeWidth={9}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {showAnnotations && (
                  <polyline
                    className="flow-path"
                    points={pts.map((q) => q.join(",")).join(" ")}
                    fill="none"
                    stroke={pathColor}
                    strokeWidth={2.6}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    style={{ animationDuration: isDC ? "0.9s" : "1.6s" }}
                  />
                )}
              </g>
            ))}
          </g>

          {/* ── 电源轨 / 地 ── */}
          <Wire pts={[[BX, RAIL], [VCC_X, RAIL]]} />
          <Dot x={CX} y={RAIL} />
          <Part id="VCC" box={[VCC_X - 32, RAIL - 34, 70, 56]} label="直流电源 VCC">
            <g className="sch-part" style={{ opacity: isAC ? 0 : 1 }}>
              <Terminal x={VCC_X} y={RAIL} />
              <Sym x={VCC_X} y={RAIL - 14} main="+V" sub="CC" anchor="middle" value={val(p.VCC, "V")} />
            </g>
            <g className="sch-part" style={{ opacity: isAC ? 1 : 0 }}>
              <Ground x={VCC_X} y={RAIL} color="var(--ac)" />
              <text x={VCC_X} y={RAIL - 10} textAnchor="middle" fontSize={11} fill="var(--ac)">
                交流地
              </text>
            </g>
          </Part>
          <Wire pts={[[SRC_X, GND], [RL_X, GND]]} />
          <Ground x={215} y={GND} />

          {/* ── 偏置电阻 ── */}
          <Part id={rbTop} box={[BX - 14, 92, 76, 116]} label={p.topology === "divider" ? "上偏置电阻 Rb2" : "基极电阻 Rb"}>
            <ResistorV x={BX} y1={RAIL} y2={BASE_Y} len={44} />
            <Sym x={BX + 13} y={146} main="R" sub={p.topology === "divider" ? "b2" : "b"} value={val(p.topology === "divider" ? p.Rb2 : p.Rb, "Ω")} />
          </Part>
          {p.topology === "divider" && (
            <Part id="Rb1" box={[BX - 14, 300, 76, 76]} label="下偏置电阻 Rb1">
              <ResistorV x={BX} y1={BASE_Y} y2={GND} len={44} />
              <Sym x={BX + 13} y={331} main="R" sub="b1" value={val(p.Rb1, "Ω")} />
              <Dot x={BX} y={GND} />
            </Part>
          )}
          <Dot x={BX} y={BASE_Y} />

          {/* ── 输入回路 ── */}
          <g className="sch-part" style={fade(fadeInput)}>
            <Part id="us" box={[SRC_X - 40, SRC_Y - 24, 52, 48]} label="信号源 us">
              <ACSource x={SRC_X} y={SRC_Y} />
              <Sym x={SRC_X - 24} y={SRC_Y + 30} main="u" sub="s" anchor="end" />
            </Part>
            <Wire pts={[[SRC_X, SRC_Y + 17], [SRC_X, GND]]} />
            <Wire pts={[[SRC_X, SRC_Y - 17], [SRC_X, BASE_Y]]} />
            {partVisible("Rs", p) ? (
              <Part id="Rs" box={[104, BASE_Y - 34, 54, 46]} label="信号源内阻 Rs">
                <ResistorH y={BASE_Y} x1={SRC_X} x2={IN_X} len={40} />
                <Sym x={130} y={BASE_Y - 14} main="R" sub="s" anchor="middle" />
              </Part>
            ) : (
              <Wire pts={[[SRC_X, BASE_Y], [IN_X, BASE_Y]]} />
            )}
            <Dot x={IN_X} y={BASE_Y} />
          </g>
          <Part id="C1" box={[C1_X - 18, BASE_Y - 38, 36, 56]} label="输入耦合电容 C1">
            <Capacitor orient="h" c={[C1_X, BASE_Y]} a={IN_X} b={BX} state={capState} polarized />
            <Sym x={C1_X} y={BASE_Y - 18} main="C" sub="1" anchor="middle" />
          </Part>

          {/* ── 晶体管 / 微变模型 ── */}
          <Wire pts={[[BX, BASE_Y], [QB, BASE_Y]]} />
          <Part id="T" box={[QB - 4, C_TOP - 4, 66, 108]} label="NPN 晶体管 T">
            <g className="sch-part" style={{ opacity: isSS ? 0 : 1, transform: isSS ? "scale(0.85)" : "none" }}>
              <NPN bx={QB} by={BASE_Y} />
              <Sym x={QB + 44} y={BASE_Y + 5} main="T" italic={false} size={12} color="var(--ink-3)" />
            </g>
            <g className="sch-part" style={{ opacity: isSS ? 1 : 0, transform: isSS ? "none" : "scale(0.85)" }}>
              <ResistorV x={QB} y1={BASE_Y} y2={E_BOT} len={30} />
              <Wire pts={[[QB, E_BOT], [CX, E_BOT]]} />
              <CurrentSourceV x={CX} y1={C_TOP} y2={E_BOT} />
              <Sym x={QB - 10} y={BASE_Y + 30} main="r" sub="be" anchor="end" color="var(--ss)" value={showValues ? formatSI(ac.rbe, "Ω") : undefined} />
              <Sym x={CX + 18} y={BASE_Y + 5} main="βi" sub="b" color="var(--ss)" />
              <text x={QB - 10} y={E_BOT + 13} fontSize={10} fill="var(--ss)" textAnchor="end">
                e
              </text>
              <text x={QB - 8} y={BASE_Y - 6} fontSize={10} fill="var(--ss)" textAnchor="end">
                b
              </text>
              <text x={CX + 8} y={C_TOP + 8} fontSize={10} fill="var(--ss)">
                c
              </text>
            </g>
          </Part>

          {/* ── 集电极电阻与输出回路 ── */}
          <Part id="Rc" box={[CX - 14, 96, 82, 60]} label="集电极电阻 Rc">
            <ResistorV x={CX} y1={RAIL} y2={C_TOP} len={40} />
            <Sym x={CX + 13} y={121} main="R" sub="c" value={val(p.Rc, "Ω")} />
          </Part>
          <Dot x={CX} y={CO_Y} />
          <Part id="C2" box={[C2_X - 18, CO_Y - 40, 36, 56]} label="输出耦合电容 C2">
            <Capacitor orient="h" c={[C2_X, CO_Y]} a={CX} b={RL_X} state={capState} polarized />
            <Sym x={C2_X} y={CO_Y - 18} main="C" sub="2" anchor="middle" />
          </Part>
          <g className="sch-part" style={fade(fadeOutput)}>
            {partVisible("RL", p) ? (
              <Part id="RL" box={[RL_X - 14, 262, 74, 62]} label="负载电阻 RL">
                <ResistorV x={RL_X} y1={CO_Y} y2={GND} len={44} />
                <Sym x={RL_X + 13} y={288} main="R" sub="L" value={val(p.RL, "Ω")} />
              </Part>
            ) : (
              <g>
                <Wire pts={[[RL_X, CO_Y], [RL_X + 18, CO_Y]]} />
                <Terminal x={RL_X + 22} y={CO_Y} />
                <text x={RL_X + 12} y={CO_Y + 22} fontSize={11} fill="var(--ink-3)">
                  空载
                </text>
              </g>
            )}
          </g>

          {/* ── 射极回路 ── */}
          {partVisible("Re1", p) ? (
            <Part id="Re1" box={[CX - 14, 308, 76, 46]} label="射极电阻 Re1">
              <ResistorV x={CX} y1={E_BOT} y2={E_MID} len={34} />
              <Sym x={CX + 13} y={326} main="R" sub="e1" value={val(p.Re1, "Ω")} />
            </Part>
          ) : (
            <Wire pts={[[CX, E_BOT], [CX, E_MID]]} />
          )}
          {partVisible("Re2", p) ? (
            <Part id="Re2" box={[CX - 14, 368, 64, 46]} label="射极电阻 Re2">
              <g className="sch-part" style={fade(isAC && ceBypass)}>
                <ResistorV x={CX} y1={E_MID} y2={GND} len={34} />
                <Sym x={CX + 13} y={386} main="R" sub="e2" value={val(p.Re2, "Ω")} />
              </g>
            </Part>
          ) : (
            <Wire pts={[[CX, E_MID], [CX, GND]]} />
          )}
          {partVisible("Ce", p) && (
            <Part id="Ce" box={[CE_X - 18, 368, 62, 46]} label="旁路电容 Ce">
              <Wire pts={[[CX, E_MID], [CE_X, E_MID]]} />
              <Capacitor orient="v" c={[CE_X, 390]} a={E_MID} b={GND} state={capState} polarized />
              <Sym x={CE_X + 16} y={395} main="C" sub="e" />
              <Dot x={CX} y={E_MID} />
              <Dot x={CE_X} y={GND} />
            </Part>
          )}
          <Dot x={CX} y={GND} />

          {/* ── 标注 ── */}
          {showAnnotations && isDC && (
            <g data-testid="dc-annotations" style={{ pointerEvents: "none" }}>
              <CurrentArrow x={350} y={BASE_Y} dir="right" color="var(--dc)" />
              <Sym x={346} y={BASE_Y - 10} main="I" sub="BQ" anchor="middle" size={13} color="var(--dc)" />
              <CurrentArrow x={CX} y={150} dir="down" color="var(--dc)" />
              <Sym x={CX - 8} y={156} main="I" sub="CQ" anchor="end" size={13} color="var(--dc)" />
              <CurrentArrow x={CX} y={E_BOT + 4} dir="down" color="var(--dc)" />
              <Sym x={CX - 8} y={E_BOT + 12} main="I" sub="EQ" anchor="end" size={13} color="var(--dc)" />
              {/* U_CEQ 极性 */}
              <line x1={CX + 40} y1={C_TOP + 2} x2={CX + 40} y2={E_BOT - 2} stroke="var(--dc)" strokeWidth={1} strokeDasharray="3 3" />
              <Polarity x={CX + 40} y={C_TOP - 6} sign="+" color="var(--dc)" />
              <Polarity x={CX + 40} y={E_BOT + 8} sign="−" color="var(--dc)" />
              <Sym x={CX + 48} y={BASE_Y + 4} main="U" sub="CEQ" size={13} color="var(--dc)" value={formatSI(dc.UCEQ, "V")} valueColor="var(--dc)" />
              <Sym x={QB - 2} y={BASE_Y + 46} main="U" sub="BEQ" anchor="end" size={12} color="var(--dc)" value={formatSI(p.UBE, "V")} valueColor="var(--dc)" />
              <text x={SRC_X + 50} y={GND - 70} fontSize={11} fill="var(--ink-3)" textAnchor="middle">
                交流源置零
              </text>
              <text x={SRC_X + 50} y={GND - 56} fontSize={11} fill="var(--ink-3)" textAnchor="middle">
                并被 C₁ 隔断
              </text>
            </g>
          )}
          {showAnnotations && isAC && (
            <g data-testid="ac-annotations" style={{ pointerEvents: "none" }}>
              <Polarity x={IN_X + 2} y={BASE_Y + 18} sign="+" color={pathColor} />
              <Sym x={IN_X - 4} y={340} main="u" sub="i" anchor="middle" color={pathColor} />
              <Polarity x={IN_X + 2} y={GND - 14} sign="−" color={pathColor} />
              <Polarity x={RL_X + 50} y={CO_Y + 16} sign="+" color={pathColor} />
              <Sym x={RL_X + 50} y={236} main="u" sub="o" anchor="middle" color={pathColor} />
              <Polarity x={RL_X + 50} y={GND - 14} sign="−" color={pathColor} />
              <CurrentArrow x={350} y={BASE_Y} dir="right" color={pathColor} />
              <Sym x={346} y={BASE_Y - 10} main="i" sub="b" anchor="middle" size={13} color={pathColor} />
              <CurrentArrow x={CX} y={isSS ? C_TOP + 14 : 185} dir="down" color={pathColor} />
              <Sym x={CX - 8} y={isSS ? C_TOP + 18 : 189} main="i" sub="c" anchor="end" size={13} color={pathColor} />
              {/* 输入、输出电阻的“看进去”方向 */}
              <g>
                <line x1={IN_X + 8} y1={BASE_Y + 52} x2={IN_X + 46} y2={BASE_Y + 52} stroke={pathColor} strokeWidth={1} />
                <CurrentArrow x={IN_X + 46} y={BASE_Y + 52} dir="right" color={pathColor} size={6} />
                <Sym x={IN_X + 26} y={BASE_Y + 70} main="R" sub="i" anchor="middle" size={12} color={pathColor} />
              </g>
              {Number.isFinite(p.RL) && (
                <g>
                  <line x1={RL_X - 12} y1={CO_Y + 44} x2={RL_X - 46} y2={CO_Y + 44} stroke={pathColor} strokeWidth={1} />
                  <CurrentArrow x={RL_X - 46} y={CO_Y + 44} dir="left" color={pathColor} size={6} />
                  <Sym x={RL_X - 30} y={CO_Y + 62} main="R" sub="o" anchor="middle" size={12} color={pathColor} />
                </g>
              )}
            </g>
          )}
        </svg>
        {mode !== "full" && showAnnotations && (
          <div className="pointer-events-none absolute bottom-2 left-3 flex items-center gap-1.5 rounded bg-elev/90 px-2 py-0.5 text-[11.5px] text-ink-2 shadow-sm">
            <span className="inline-block h-[3px] w-4 rounded" style={{ background: pathColor }} />
            {isDC ? "直流电流路径（实际方向）" : isSS ? "小信号通路（微变等效）" : "交流信号通路"}
          </div>
        )}
      </div>
      {caption && <figcaption className="border-t border-line px-3 py-2 text-[12.5px] text-ink-2">{caption}</figcaption>}
    </figure>
    </PartCtx.Provider>
  );
}

/* ───────── 可点击元件（定义在组件外，保证 CSS 过渡不因重挂载丢失） ───────── */
const PartCtx = createContext<{
  selected: PartId | null;
  onSelect?: (id: PartId | null) => void;
  isDragging: () => boolean;
}>({ selected: null, isDragging: () => false });

function Part({ id, box, children, label }: { id: PartId; box: [number, number, number, number]; children: ReactNode; label: string }) {
  const { selected, onSelect, isDragging } = useContext(PartCtx);
  const sel = selected === id;
  const click = () => onSelect?.(sel ? null : id);
  return (
    <g
      data-part={id}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-label={onSelect ? `${label}（点击查看说明）` : undefined}
      aria-pressed={onSelect ? sel : undefined}
      onClick={(e) => {
        e.stopPropagation();
        if (!isDragging()) click();
      }}
      onKeyDown={(e: KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          click();
        }
      }}
      className={onSelect ? "cursor-pointer outline-none [&:focus-visible>rect.hit]:stroke-[var(--accent)]" : undefined}
    >
      <rect
        className="hit"
        x={box[0]}
        y={box[1]}
        width={box[2]}
        height={box[3]}
        rx={6}
        fill={sel ? "var(--accent-soft)" : "transparent"}
        fillOpacity={sel ? 0.7 : 0}
        stroke={sel ? "var(--accent)" : "transparent"}
        strokeDasharray={sel ? "4 3" : undefined}
        strokeWidth={1.2}
      />
      {children}
    </g>
  );
}

function ZoomBtn({ children, onClick, label, testId }: { children: ReactNode; onClick: () => void; label: string; testId: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      data-testid={testId}
      className="num grid h-7 w-7 place-items-center rounded-md text-[15px] text-ink-2 hover:bg-sunken hover:text-ink"
    >
      {children}
    </button>
  );
}
