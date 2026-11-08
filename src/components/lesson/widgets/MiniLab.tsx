"use client";

import { r } from "@/components/math/Tex";

import { useState, type ReactNode } from "react";
import type { CEMode, PartId } from "@/circuits/ce-parts";
import { CESchematic } from "@/components/circuit/CESchematic";
import { Derivation } from "@/components/math/Derivation";
import { acSteps, dcSteps } from "@/formulas/ce-steps";
import type { CEParams } from "@/simulations/bjt/types";
import { formatSI, sig } from "@/simulations/units";
import { createClock, useCEModel } from "@/components/lab/model";
import { PARAM_SPECS } from "@/components/lab/paramSpecs";
import { Scope } from "@/components/lab/Scope";
import { OutputCharacteristics } from "@/components/lab/OutputCharacteristics";
import { PartInfoPanel, RegionBadge } from "@/components/lab/Panels";
import { ParamSlider, Readout } from "@/components/ui/primitives";

type Panel = "schematic" | "scope" | "char" | "readouts" | "dc-derivation" | "ac-derivation";

/**
 * 课程内嵌的小型实验：只暴露少数参数，展示指定面板。数值来自同一计算核心。
 */
export function MiniLab({
  initial,
  keys,
  panels,
  mode: initialMode = "full",
  modeSwitch = false,
  title,
  footer,
  testId,
}: {
  initial: CEParams;
  keys: Array<keyof CEParams>;
  panels: Panel[];
  mode?: CEMode;
  modeSwitch?: boolean;
  title: string;
  footer?: ReactNode;
  testId?: string;
}) {
  const { params, set, analysis, waves } = useCEModel(initial);
  const [mode, setMode] = useState<CEMode>(initialMode);
  const [selected, setSelected] = useState<PartId | null>(null);
  const hasSide = specs0(keys).length > 0 || panels.includes("readouts");
  const [clock] = useState(() => createClock(0.4));
  const specs = specs0(keys);
  const { dc, ac } = analysis;
  return (
    <div className="card my-5 overflow-hidden" data-testid={testId}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2">
        <span className="eyebrow">交互：{title}</span>
        <RegionBadge region={dc.region} />
      </div>
      <div className={`grid gap-4 p-4 ${hasSide ? "lg:grid-cols-[210px_minmax(0,1fr)]" : ""}`}>
        <div className={hasSide ? "space-y-3" : "hidden"}>
          {specs.map((s) => (
            <ParamSlider
              key={s.key}
              label={s.label}
              value={params[s.key] as number}
              onChange={(v) => set(s.key, v as never)}
              min={s.min}
              max={s.max}
              log={s.log}
              step={s.step}
              unit={s.unit}
              scale={s.scale}
              testId={testId ? `${testId}-${s.key}` : undefined}
            />
          ))}
          {panels.includes("readouts") && (
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <Readout label="$I_{CQ}$" value={formatSI(dc.ICQ, "A")} tone="dc" testId={testId ? `${testId}-ICQ` : undefined} />
              <Readout label="$U_{CEQ}$" value={formatSI(dc.UCEQ, "V")} tone="dc" />
              <Readout label="$r_{be}$" value={ac.valid ? formatSI(ac.rbe, "Ω") : "—"} tone="ss" />
              <Readout label={r`$\dot A_u$`} value={ac.valid ? sig(ac.Au, 4) : "—"} tone="ac" testId={testId ? `${testId}-Au` : undefined} />
              <Readout label="$R_i$" value={ac.valid ? formatSI(ac.Ri, "Ω") : "—"} tone="ac" />
              <Readout label="$R_o$" value={formatSI(ac.Ro, "Ω")} tone="ac" />
            </div>
          )}
        </div>
        <div className="min-w-0 space-y-4">
          {panels.includes("schematic") && (
            <CESchematic
              params={params}
              analysis={analysis}
              mode={mode}
              onModeChange={modeSwitch ? setMode : undefined}
              zoomable={false}
              selected={selected}
              onSelect={setSelected}
              testId={testId ? `${testId}-schematic` : "mini-schematic"}
            />
          )}
          {panels.includes("schematic") && selected && <PartInfoPanel id={selected} mode={mode} params={params} onClose={() => setSelected(null)} />}
          {panels.includes("scope") && <Scope waves={waves} analysis={analysis} clock={clock} freq={params.f} />}
          {panels.includes("char") && <OutputCharacteristics params={params} analysis={analysis} waves={waves} clock={clock} height={260} />}
          {panels.includes("dc-derivation") && (
            <Derivation key={`dc-${dc.region}`} title="静态分析（数值随参数更新）" steps={dcSteps(analysis)} initiallyOpen={99} />
          )}
          {panels.includes("ac-derivation") && dc.region === "active" && (
            <Derivation key={`ac-${params.Rs > 0}`} title="动态分析（数值随参数更新）" steps={acSteps(analysis)} initiallyOpen={99} />
          )}
        </div>
      </div>
      {footer && <div className="border-t border-line px-4 py-2 text-[12.5px] text-ink-2">{footer}</div>}
    </div>
  );
}

function specs0(keys: Array<keyof CEParams>) {
  return keys.map((k) => PARAM_SPECS.find((s) => s.key === k)).filter(Boolean) as typeof PARAM_SPECS;
}
