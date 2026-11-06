"use client";

import { useEffect, useState } from "react";
import type { CEMode, PartId } from "@/circuits/ce-parts";
import { CESchematic } from "@/components/circuit/CESchematic";
import { Derivation } from "@/components/math/Derivation";
import { acSteps, dcSteps } from "@/formulas/ce-steps";
import type { CEParams } from "@/simulations/bjt/types";
import { formatSI, sig } from "@/simulations/units";
import { useTutorContext } from "@/lib/tutor-context";
import { Callout } from "@/components/ui/primitives";
import { Rich } from "@/components/math/Tex";
import { createClock, useCEModel } from "./model";
import { OutputCharacteristics } from "./OutputCharacteristics";
import { DistortionPanel, ParamPanel, PartInfoPanel, QPointPanel } from "./Panels";
import { PRESETS } from "./paramSpecs";
import { Scope, useScopeStats } from "./Scope";

export function CELab({ initial }: { initial: CEParams }) {
  const model = useCEModel(initial);
  const { params, setParams, set, analysis, waves } = model;
  const [mode, setMode] = useState<CEMode>("full");
  const [selected, setSelected] = useState<PartId | null>(null);
  const [clock] = useState(() => createClock(0.4));
  const stats = useScopeStats(waves);
  const [preset, setPreset] = useState<string | null>("normal");
  const setTutor = useTutorContext((s) => s.setLab);

  useEffect(() => {
    const { dc, ac } = analysis;
    setTutor({
      mode,
      params: `拓扑=${params.topology === "fixed" ? "固定偏置" : "分压偏置"}, V_CC=${params.VCC} V, ${
        params.topology === "fixed" ? `R_b=${formatSI(params.Rb, "Ω")}` : `R_b1=${formatSI(params.Rb1, "Ω")}, R_b2=${formatSI(params.Rb2, "Ω")}`
      }, R_c=${formatSI(params.Rc, "Ω")}, R_e1=${formatSI(params.Re1, "Ω")}, R_e2=${formatSI(params.Re2, "Ω")}, C_e=${params.hasCe ? "接入" : "开路"}, R_L=${
        Number.isFinite(params.RL) ? formatSI(params.RL, "Ω") : "开路"
      }, R_s=${formatSI(params.Rs, "Ω")}, β=${params.beta}, U_BEQ=${params.UBE} V, U_sm=${formatSI(params.Usm, "V")}`,
      results: `工作区=${dc.region}, I_BQ=${formatSI(dc.IBQ, "A")}, I_CQ=${formatSI(dc.ICQ, "A")}, U_CEQ=${formatSI(dc.UCEQ, "V")}, r_be=${formatSI(
        ac.rbe,
        "Ω",
      )}, A_u=${sig(ac.Au, 4)}, R_i=${formatSI(ac.Ri, "Ω")}, R_o=${formatSI(ac.Ro, "Ω")}, U_om=${formatSI(ac.Uom, "V")}, THD=${sig(stats.thd * 100, 3)}%`,
    });
  }, [analysis, params, mode, stats.thd, setTutor]);

  return (
    <div className="space-y-5" data-testid="ce-lab">
      <div className="flex flex-wrap items-center gap-2">
        <span className="eyebrow mr-1">预设</span>
        {PRESETS.map((pr) => (
          <button
            key={pr.id}
            type="button"
            title={pr.desc}
            data-testid={`preset-${pr.id}`}
            onClick={() => {
              setParams(pr.params);
              setPreset(pr.id);
            }}
            className={`rounded-full border px-3 py-1 text-[12.5px] transition-colors ${
              preset === pr.id ? "border-accent bg-accent-soft text-ink" : "border-line bg-elev text-ink-2 hover:border-ink-3"
            }`}
          >
            <Rich text={pr.label.replace("C_e", "$C_e$")} />
          </button>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[290px_minmax(0,1fr)]">
        <aside className="card thin-scroll h-fit p-4 xl:sticky xl:top-[72px] xl:max-h-[calc(100vh-90px)] xl:overflow-y-auto">
          <ParamPanel
            params={params}
            set={(k, v) => {
              set(k, v);
              setPreset(null);
            }}
            setParams={(p) => {
              setParams(p);
              setPreset(null);
            }}
          />
        </aside>

        <div className="min-w-0 space-y-5">
          <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-3">
              <CESchematic
                params={params}
                analysis={analysis}
                mode={mode}
                onModeChange={setMode}
                selected={selected}
                onSelect={setSelected}
                caption={<Rich text={modeCaption(mode)} />}
              />
              {selected ? (
                <PartInfoPanel id={selected} mode={mode} params={params} onClose={() => setSelected(null)} />
              ) : (
                <p className="text-[12.5px] text-ink-3">提示：点击电路图中的任一元件，查看它的作用以及在四种分析模式下的处理方法。Ctrl/⌘ + 滚轮缩放，拖动平移。</p>
              )}
            </div>
            <div className="card h-fit p-4">
              <QPointPanel analysis={analysis} />
            </div>
          </div>

          <div className="grid gap-5 2xl:grid-cols-2">
            <Scope waves={waves} analysis={analysis} clock={clock} freq={params.f} />
            <OutputCharacteristics params={params} analysis={analysis} waves={waves} clock={clock} />
          </div>

          <section aria-labelledby="dist-h" className="grid gap-5 lg:grid-cols-2">
            <div>
              <h3 id="dist-h" className="font-display mb-2 text-[17px] font-semibold">
                失真分析
              </h3>
              <DistortionPanel analysis={analysis} stats={stats} />
              <Callout kind="assume" title="本实验室的模型假设">
                <ul className="list-disc space-y-0.5 pl-4 text-[13px]">
                  <li>
                    <Rich text={String.raw`静态：恒压降模型（$U_{BEQ}$ 为常数）+ 放大区 $I_C=\beta I_B$ + 饱和判据 $U_{CE}=U_{CES}$。`} />
                  </li>
                  <li>
                    <Rich text={String.raw`动态：中频 h 参数简化模型，忽略 $r_{ce}$ 与结电容。`} />
                  </li>
                  <li>波形：准静态大信号求解——电容电压保持静态值，发射结为指数特性（在 Q 点校准），每个采样点求解非线性方程。</li>
                </ul>
              </Callout>
            </div>
            <div>
              <h3 className="font-display mb-2 text-[17px] font-semibold">实时推导（随参数更新）</h3>
              <Derivation key={`dc-${analysis.dc.region}-${params.topology}`} title="静态分析" steps={dcSteps(analysis)} initiallyOpen={99} testId="live-dc" />
              {analysis.dc.region === "active" && (
                <Derivation key={`ac-${params.Rs > 0}`} title="动态分析（中频）" steps={acSteps(analysis)} initiallyOpen={99} testId="live-ac" />
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function modeCaption(mode: CEMode): string {
  switch (mode) {
    case "full":
      return "完整电路：直流电源建立偏置，交流信号经 $C_1$ 输入、经 $C_2$ 输出。";
    case "dc":
      return "直流通路：所有电容开路（直流稳态下 $i_C=C\\,du/dt=0$），交流源置零。用于求 Q 点。";
    case "ac":
      return "交流通路（中频）：耦合、旁路电容短路；$V_{CC}$ 的交流分量为 0 → 交流接地。";
    case "ss":
      return "微变等效电路：晶体管用 $r_{be}$ 与受控电流源 $\\beta i_b$ 替代，只在 Q 点附近的小信号下成立。";
  }
}
