"use client";

import { useMemo } from "react";
import type { CEAnalysis } from "@/simulations/bjt/ce";
import { niceBaseCurrentSteps, outputFamily } from "@/simulations/bjt/characteristics";
import type { Waveforms } from "@/simulations/bjt/transient";
import type { CEParams } from "@/simulations/bjt/types";
import { formatSI } from "@/simulations/units";
import { Line, Plot } from "@/components/plot/Plot";
import { usePhase, type Clock } from "./model";
import { Rich } from "@/components/math/Tex";

/**
 * 输出特性曲线 + 直流/交流负载线 + Q 点 + 动态工作点轨迹。
 * 曲线族：Ebers–Moll（β_R = 1）；负载线：近似 I_E ≈ I_C。
 */
export function OutputCharacteristics({
  params: p,
  analysis,
  waves,
  clock,
  height = 300,
}: {
  params: CEParams;
  analysis: CEAnalysis;
  waves?: Waveforms;
  clock?: Clock;
  height?: number;
}) {
  const { dc, ac } = analysis;
  const RE = dc.RE;
  const uMax = p.VCC * 1.06;
  const icDC0 = p.VCC / (p.Rc + RE); // 直流负载线纵截距
  let icTraceMax = 0;
  if (waves) for (const v of waves.iC) icTraceMax = Math.max(icTraceMax, v);
  const yMax = Math.max(icDC0, dc.ICQ * 1.6, icTraceMax) * 1.12;

  const steps = useMemo(() => niceBaseCurrentSteps(dc.IBQ, 6), [dc.IBQ]);
  const family = useMemo(() => outputFamily(steps, uMax, { beta: p.beta, UT: p.UT }), [steps, uMax, p.beta, p.UT]);
  const qCurve = useMemo(
    () => (dc.IBQ > 0 ? outputFamily([dc.IBQ], uMax, { beta: p.beta, UT: p.UT })[0] : null),
    [dc.IBQ, uMax, p.beta, p.UT],
  );

  // 交流负载线：过 Q，斜率 −1/(R_L' + R_e,ac(1+β)/β)
  const acR = ac.RLp + (ac.ReAC * (1 + p.beta)) / p.beta;
  const acXInt = dc.UCEQ + dc.ICQ * acR; // i_C = 0 时的 u_CE
  const acYInt = dc.ICQ + dc.UCEQ / acR; // u_CE = 0 时的 i_C

  const traj: Array<[number, number]> = waves ? Array.from(waves.uCE, (u, i) => [u, waves.iC[i] * 1e3]) : [];

  return (
    <div className="card overflow-hidden" data-testid="output-char">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2">
        <span className="eyebrow">输出特性 · 负载线 · Q 点</span>
        <div className="flex flex-wrap gap-3 text-[11.5px] text-ink-2">
          <Legend color="var(--dc)" label="直流负载线" />
          <Legend color="var(--ac)" label="交流负载线" />
          {waves && <Legend color="var(--ch3)" label="动态轨迹" />}
        </div>
      </div>
      <div className="px-1 pb-1 pt-2">
        <Plot
          height={height}
          ariaLabel="晶体管输出特性曲线与负载线"
          x={{ domain: [0, uMax], label: "u_CE / V" }}
          y={{ domain: [0, yMax * 1e3], label: "i_C / mA" }}
        >
          {(s) => (
            <g>
              {/* 区域 */}
              <rect x={s.sx(0)} y={s.sy(yMax * 1e3)} width={s.sx(p.UCES) - s.sx(0)} height={s.ih} fill="var(--err)" fillOpacity={0.08} />
              <rect x={s.sx(0)} y={s.sy(yMax * 1e3 * 0.025)} width={s.iw} height={s.sy(0) - s.sy(yMax * 1e3 * 0.025)} fill="var(--ink-3)" fillOpacity={0.12} />
              <line x1={s.sx(p.UCES)} x2={s.sx(p.UCES)} y1={s.m.t} y2={s.m.t + s.ih} stroke="var(--err)" strokeOpacity={0.6} strokeDasharray="3 3" />
              <text x={s.sx(p.UCES) + 3} y={s.m.t + 12} fontSize={10.5} fill="var(--err)">
                饱和区 u_CE&lt;U_CES
              </text>
              <text x={s.sx(uMax) - 4} y={s.sy(yMax * 1e3 * 0.025) - 3} fontSize={10.5} fill="var(--ink-3)" textAnchor="end">
                截止区 i_B≤0
              </text>
              <text x={s.sx(uMax * 0.72)} y={s.m.t + 12} fontSize={10.5} fill="var(--ink-3)">
                放大区
              </text>
              {/* 曲线族 */}
              {family.map((c) => {
                const pts = c.points.map(([u, i]) => [u, i * 1e3] as [number, number]);
                const last = pts[pts.length - 1];
                return (
                  <g key={c.iB}>
                    <Line points={pts} s={s} color="var(--ink-3)" width={1.1} opacity={0.75} />
                    {last[1] < yMax * 1e3 && (
                      <text x={s.sx(uMax) - 3} y={s.sy(last[1]) - 3} textAnchor="end" fontSize={10} fill="var(--ink-3)" style={{ fontFamily: "var(--font-mono)" }}>
                        {formatSI(c.iB, "A", 2)}
                      </text>
                    )}
                  </g>
                );
              })}
              {qCurve && <Line points={qCurve.points.map(([u, i]) => [u, i * 1e3])} s={s} color="var(--accent)" width={1.4} dash="5 3" />}
              {/* 负载线 */}
              <Line points={[[0, icDC0 * 1e3], [p.VCC, 0]]} s={s} color="var(--dc)" width={2} testId="dc-loadline" />
              {dc.region === "active" && <Line points={[[0, acYInt * 1e3], [acXInt, 0]]} s={s} color="var(--ac)" width={2} testId="ac-loadline" />}
              {/* 动态轨迹 */}
              {traj.length > 0 && <Line points={traj} s={s} color="var(--ch3)" width={4} opacity={0.55} />}
              {/* Q 点 */}
              <line x1={s.sx(dc.UCEQ)} x2={s.sx(dc.UCEQ)} y1={s.sy(dc.ICQ * 1e3)} y2={s.sy(0)} stroke="var(--ink-2)" strokeDasharray="2 3" />
              <line x1={s.sx(0)} x2={s.sx(dc.UCEQ)} y1={s.sy(dc.ICQ * 1e3)} y2={s.sy(dc.ICQ * 1e3)} stroke="var(--ink-2)" strokeDasharray="2 3" />
              <circle cx={s.sx(dc.UCEQ)} cy={s.sy(dc.ICQ * 1e3)} r={5.5} fill="var(--bg-elev)" stroke="var(--ink)" strokeWidth={2} data-testid="q-point" />
              <text x={s.sx(dc.UCEQ) + 8} y={s.sy(dc.ICQ * 1e3) - 8} fontSize={12} fontWeight={600} fill="var(--ink)">
                Q
              </text>
              {clock && waves && <MovingPoint clock={clock} waves={waves} s={s} />}
            </g>
          )}
        </Plot>
      </div>
      <p className="border-t border-line px-3 py-2 text-[11.5px] leading-relaxed text-ink-3">
        <Rich
          text={
            String.raw`曲线族由 Ebers–Moll 模型绘制（显示真实的饱和区“膝部”）；静态计算采用 $U_{CES}$ 判据（红色虚线）。负载线采用近似 $I_E\approx I_C$；交流负载线过 Q 点、斜率 $-1/R_L'$` +
            (ac.ReAC > 0 ? "（含未旁路射极电阻的修正）。" : "。")
          }
        />
      </p>
    </div>
  );
}

function MovingPoint({ clock, waves, s }: { clock: Clock; waves: Waveforms; s: Parameters<Parameters<typeof Plot>[0]["children"]>[0] }) {
  const phase = usePhase(clock);
  const n = waves.uCE.length;
  const i = Math.floor((((phase % 1) + 1) % 1) * n) % n;
  return <circle cx={s.sx(waves.uCE[i])} cy={s.sy(waves.iC[i] * 1e3)} r={4.5} fill="var(--ch3)" stroke="var(--bg-elev)" strokeWidth={1.5} data-testid="moving-point" />;
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block h-[3px] w-4 rounded" style={{ background: color }} />
      {label}
    </span>
  );
}
