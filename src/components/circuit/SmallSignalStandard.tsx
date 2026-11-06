"use client";

import { useState } from "react";
import { CurrentArrow, CurrentSourceV, Dot, Ground, Polarity, ResistorV, Sym, Terminal, Wire } from "./symbols";
import { Segmented } from "@/components/ui/primitives";

/**
 * 教材标准画法的共射微变等效电路（h 参数简化模型）。
 * 可切换：射极是否有未旁路电阻、偏置方式。
 */
export function SmallSignalStandard({ initialRe = false }: { initialRe?: boolean }) {
  const [re, setRe] = useState<"no" | "yes">(initialRe ? "yes" : "no");
  const [bias, setBias] = useState<"fixed" | "divider">("fixed");
  const hasRe = re === "yes";
  const TOP = 60;
  const GND = hasRe ? 280 : 230;
  const E = hasRe ? 210 : GND; // 发射极节点
  const xIn = 50;
  const xRb = 130;
  const xRbe = 230;
  const xCs = 330;
  const xRc = 420;
  const xRL = 500;
  const xOut = 560;
  return (
    <figure className="card my-5 overflow-hidden" data-testid="small-signal-standard">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-2">
        <span className="eyebrow mr-auto">教材标准画法：微变等效电路</span>
        <Segmented
          size="sm"
          label="偏置"
          value={bias}
          onChange={setBias}
          options={[
            { value: "fixed", label: "R_b" },
            { value: "divider", label: "R_b1∥R_b2" },
          ]}
        />
        <Segmented
          size="sm"
          label="射极电阻"
          value={re}
          onChange={setRe}
          options={[
            { value: "no", label: "射极交流接地" },
            { value: "yes", label: "有未旁路 R_e" },
          ]}
        />
      </div>
      <div className="grid-paper">
        <svg viewBox={`0 0 620 ${GND + 40}`} className="block h-auto w-full" role="img" aria-label="共射放大电路的微变等效电路">
          {/* 上方信号线：输入端 → b；c → 输出端 */}
          <Wire pts={[[xIn, TOP], [xRbe, TOP]]} />
          <Wire pts={[[xCs, TOP], [xOut, TOP]]} />
          <Wire pts={[[xIn, GND], [xOut, GND]]} />
          <Terminal x={xIn} y={TOP} />
          <Terminal x={xIn} y={GND} />
          <Terminal x={xOut} y={TOP} />
          <Terminal x={xOut} y={GND} />
          <Ground x={(xRbe + xCs) / 2} y={GND} />

          {/* 偏置电阻 */}
          <ResistorV x={xRb} y1={TOP} y2={GND} len={44} />
          {bias === "fixed" ? (
            <Sym x={xRb + 12} y={(TOP + GND) / 2 + 4} main="R" sub="b" />
          ) : (
            <text x={xRb + 12} y={(TOP + GND) / 2 + 4} fontSize={14} fill="var(--ink)" style={{ fontFamily: "var(--font-serif), serif" }}>
              <tspan fontStyle="italic">R</tspan>
              <tspan fontSize={10} dy={4}>
                b1
              </tspan>
              <tspan dy={-4}>∥</tspan>
              <tspan fontStyle="italic">R</tspan>
              <tspan fontSize={10} dy={4}>
                b2
              </tspan>
            </text>
          )}
          <Dot x={xRb} y={TOP} />
          <Dot x={xRb} y={GND} />

          {/* r_be */}
          <ResistorV x={xRbe} y1={TOP} y2={E} len={44} />
          <Sym x={xRbe + 12} y={(TOP + E) / 2 + 4} main="r" sub="be" color="var(--ss)" />
          <text x={xRbe - 8} y={TOP - 8} fontSize={12} fill="var(--ink-2)">
            b
          </text>
          <CurrentArrow x={xRbe - 30} y={TOP} dir="right" color="var(--ss)" />
          <Sym x={xRbe - 32} y={TOP - 10} main="İ" sub="b" anchor="middle" size={13} color="var(--ss)" />

          {/* 受控源 */}
          <CurrentSourceV x={xCs} y1={TOP} y2={E} />
          <Sym x={xCs + 18} y={(TOP + E) / 2 + 4} main="βİ" sub="b" color="var(--ss)" />
          <text x={xCs + 6} y={TOP - 8} fontSize={12} fill="var(--ink-2)">
            c
          </text>

          {/* 发射极 */}
          {hasRe ? (
            <g>
              <Wire pts={[[xRbe, E], [xCs, E]]} />
              <Dot x={xRbe} y={E} />
              <Dot x={xCs} y={E} />
              <ResistorV x={(xRbe + xCs) / 2} y1={E} y2={GND} len={34} />
              <Dot x={(xRbe + xCs) / 2} y={E} />
              <Sym x={(xRbe + xCs) / 2 + 12} y={(E + GND) / 2 + 4} main="R" sub="e" />
              <text x={(xRbe + xCs) / 2 - 6} y={E - 8} fontSize={12} fill="var(--ink-2)">
                e
              </text>
              <CurrentArrow x={(xRbe + xCs) / 2} y={E + 10} dir="down" color="var(--ss)" size={7} />
              <Sym x={(xRbe + xCs) / 2 - 10} y={E + 16} main="İ" sub="e" anchor="end" size={12} color="var(--ss)" />
            </g>
          ) : (
            <text x={(xRbe + xCs) / 2 - 4} y={GND - 8} fontSize={12} fill="var(--ink-2)">
              e
            </text>
          )}

          {/* R_c, R_L */}
          <ResistorV x={xRc} y1={TOP} y2={GND} len={44} />
          <Sym x={xRc + 12} y={(TOP + GND) / 2 + 4} main="R" sub="c" />
          <Dot x={xRc} y={TOP} />
          <Dot x={xRc} y={GND} />
          <ResistorV x={xRL} y1={TOP} y2={GND} len={44} />
          <Sym x={xRL + 12} y={(TOP + GND) / 2 + 4} main="R" sub="L" />
          <Dot x={xRL} y={TOP} />
          <Dot x={xRL} y={GND} />

          {/* 端口电压与“看进去”的电阻 */}
          <Polarity x={xIn - 14} y={TOP + 14} sign="+" />
          <Sym x={xIn - 22} y={(TOP + GND) / 2 + 4} main="U̇" sub="i" anchor="middle" />
          <Polarity x={xIn - 14} y={GND - 12} sign="−" />
          <Polarity x={xOut + 14} y={TOP + 14} sign="+" />
          <Sym x={xOut + 22} y={(TOP + GND) / 2 + 4} main="U̇" sub="o" anchor="middle" />
          <Polarity x={xOut + 14} y={GND - 12} sign="−" />
          <g stroke="var(--ac)" fill="var(--ac)">
            <line x1={xIn + 12} y1={GND + 22} x2={xIn + 52} y2={GND + 22} strokeWidth={1} />
            <CurrentArrow x={xIn + 52} y={GND + 22} dir="right" color="var(--ac)" size={6} />
          </g>
          <Sym x={xIn + 62} y={GND + 27} main="R" sub="i" size={12} color="var(--ac)" />
          <g>
            <line x1={xRL - 14} y1={GND + 22} x2={xRc + 14} y2={GND + 22} stroke="var(--ac)" strokeWidth={1} />
            <CurrentArrow x={xRc + 14} y={GND + 22} dir="left" color="var(--ac)" size={6} />
          </g>
          <Sym x={xRc - 10} y={GND + 27} main="R" sub="o" anchor="end" size={12} color="var(--ac)" />
        </svg>
      </div>
      <figcaption className="border-t border-line px-4 py-2 text-[12.5px] text-ink-2">
        {hasRe
          ? "射极电阻同时流过 İ_b 与 βİ_b，即 İ_e = (1+β)İ_b，所以从基极看进去它“变大”了 (1+β) 倍。"
          : "射极交流接地时，输入回路只有 r_be，输出回路只有受控源与 R_c∥R_L：输入、输出只通过受控源 βİ_b 联系。"}
      </figcaption>
    </figure>
  );
}
