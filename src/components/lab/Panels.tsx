"use client";

import { partInfo, type CEMode, type PartId, CE_MODES } from "@/circuits/ce-parts";
import type { CEAnalysis } from "@/simulations/bjt/ce";
import type { CEParams } from "@/simulations/bjt/types";
import { formatSI, sig } from "@/simulations/units";
import { Rich } from "@/components/math/Tex";
import { Badge, ParamSlider, Readout, Segmented, Toggle } from "@/components/ui/primitives";
import { GROUP_LABEL, PARAM_SPECS, type ParamSpec } from "./paramSpecs";
import type { ScopeStats } from "./Scope";
import { useState } from "react";

export function RegionBadge({ region }: { region: "cutoff" | "active" | "saturation" }) {
  const map = {
    active: { tone: "ok" as const, text: "放大区" },
    cutoff: { tone: "warn" as const, text: "截止区" },
    saturation: { tone: "err" as const, text: "饱和区" },
  }[region];
  return (
    <Badge tone={map.tone} data-testid="region-badge">
      ● {map.text}
    </Badge>
  );
}

export function ParamPanel({
  params: p,
  set,
  setParams,
  groups,
  compact = false,
}: {
  params: CEParams;
  set: <K extends keyof CEParams>(k: K, v: CEParams[K]) => void;
  setParams: (p: CEParams) => void;
  groups?: Array<ParamSpec["group"]>;
  compact?: boolean;
}) {
  const [adv, setAdv] = useState(false);
  const gs = groups ?? (["supply", "bias", "load", "device", "signal"] as const);
  const specs = (g: ParamSpec["group"]) => PARAM_SPECS.filter((s) => s.group === g && (!s.topo || s.topo === p.topology));
  const slider = (s: ParamSpec) => (
    <ParamSlider
      key={s.key}
      label={s.label}
      value={p[s.key] as number}
      onChange={(v) => set(s.key, v as never)}
      min={s.min}
      max={s.max}
      log={s.log}
      step={s.step}
      unit={s.unit}
      scale={s.scale}
      hint={compact ? undefined : s.hint}
      testId={`param-${s.key}`}
      disabled={s.key === "RL" && !Number.isFinite(p.RL)}
    />
  );
  return (
    <div className="space-y-4" data-testid="param-panel">
      <div>
        <div className="eyebrow mb-1.5">偏置结构</div>
        <Segmented
          label="偏置结构"
          testId="topology"
          value={p.topology}
          onChange={(t) => setParams({ ...p, topology: t, ...(t === "divider" && p.Re1 + p.Re2 === 0 ? { Re1: 200, Re2: 1000 } : {}) })}
          options={[
            { value: "fixed", label: "固定偏置" },
            { value: "divider", label: "分压偏置" },
          ]}
        />
      </div>
      {gs.map((g) => (
        <fieldset key={g} className="space-y-2.5">
          <legend className="eyebrow mb-1">{GROUP_LABEL[g]}</legend>
          {specs(g).map((s) =>
            s.key === "RL" ? (
              <div key="RL" className="space-y-1">
                <Toggle
                  checked={!Number.isFinite(p.RL)}
                  onChange={(open) => set("RL", open ? Infinity : 3e3)}
                  label="负载开路（空载）"
                  testId="toggle-open-load"
                />
                {Number.isFinite(p.RL) && slider(s)}
              </div>
            ) : (
              slider(s)
            ),
          )}
          {g === "bias" && p.Re2 > 0 && (
            <Toggle checked={p.hasCe} onChange={(v) => set("hasCe", v)} label={<Rich text="接入旁路电容 $C_e$" />} testId="toggle-ce" />
          )}
        </fieldset>
      ))}
      <div>
        <button type="button" className="text-[12.5px] text-accent hover:underline" onClick={() => setAdv((a) => !a)} aria-expanded={adv}>
          {adv ? "收起高级参数" : "展开高级参数（U_CES、r_bb'、电容）"}
        </button>
        {adv && <div className="mt-2 space-y-2.5">{specs("advanced").map(slider)}</div>}
      </div>
    </div>
  );
}

export function QPointPanel({ analysis }: { analysis: CEAnalysis }) {
  const { dc, ac, params: p } = analysis;
  const est = dc.estimate;
  return (
    <div className="space-y-3" data-testid="qpoint-panel">
      <div className="flex items-center justify-between">
        <span className="eyebrow">静态工作点</span>
        <RegionBadge region={dc.region} />
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <Readout label="$I_{BQ}$" value={formatSI(dc.IBQ, "A")} tone="dc" testId="IBQ" />
        <Readout label="$I_{CQ}$" value={formatSI(dc.ICQ, "A")} tone="dc" testId="ICQ" />
        <Readout label="$I_{EQ}$" value={formatSI(dc.IEQ, "A")} tone="dc" testId="IEQ" />
        <Readout label="$U_{CEQ}$" value={formatSI(dc.UCEQ, "V")} tone="dc" testId="UCEQ" />
      </div>
      {dc.region === "saturation" && (
        <p className="text-[12.5px] text-err">
          <Rich text={`饱和：$I_C/I_B=${sig(dc.betaForced, 3)}<\\beta$，集电极电流不再受基极电流控制。`} />
        </p>
      )}
      {est && dc.region === "active" && (
        <div className="rounded-md border border-line-2 bg-bg/60 px-2.5 py-2 text-[12px] text-ink-2">
          <div className="mb-1 text-ink-3">
            <Rich text="教材估算法（忽略 $I_{BQ}$ 对分压的影响）" />
          </div>
          <Rich
            text={`$U_{BQ}\\approx ${sig(est.UBQ, 3)}\\,\\mathrm V$，$I_{EQ}\\approx ${sig(est.IEQ * 1e3, 3)}\\,\\mathrm{mA}$，与精确解相差 ${sig((Math.abs(est.IEQ - dc.IEQ) / dc.IEQ) * 100, 2)}%。条件 $(1+\\beta)R_E/R_B=${sig(est.ratio, 3)}$ ${est.ratio >= 10 ? "≥ 10，估算可用" : "< 10，估算误差较大"}。`}
          />
        </div>
      )}
      <div className="flex items-center justify-between pt-1">
        <span className="eyebrow">中频动态参数</span>
        {!ac.valid && <Badge tone="warn">Q 点不在放大区，小信号模型无效</Badge>}
      </div>
      <div className={`grid grid-cols-2 gap-1.5 ${ac.valid ? "" : "opacity-40"}`}>
        <Readout label="$r_{be}$" value={formatSI(ac.rbe, "Ω")} tone="ss" testId="rbe" />
        <Readout label="$\dot A_u$" value={sig(ac.Au, 4)} tone="ac" testId="Au" />
        <Readout label="$R_i$" value={formatSI(ac.Ri, "Ω")} tone="ac" testId="Ri" />
        <Readout label="$R_o$" value={formatSI(ac.Ro, "Ω")} tone="ac" testId="Ro" />
        {p.Rs > 0 && <Readout label="$\dot A_{us}$" value={sig(ac.Aus, 4)} tone="ac" />}
        <Readout label="$U_{om}$（最大不失真）" value={formatSI(ac.Uom, "V")} sub={ac.limitedBy === "cutoff" ? "受截止限制" : "受饱和限制"} testId="Uom" />
      </div>
    </div>
  );
}

export function PartInfoPanel({ id, mode, params, onClose }: { id: PartId; mode: CEMode; params: CEParams; onClose: () => void }) {
  const info = partInfo(id, params);
  return (
    <div className="card p-4" data-testid="part-info" data-part={id}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[15px] font-semibold">
          <Rich text={info.name} />
        </h3>
        <button type="button" onClick={onClose} className="text-ink-3 hover:text-ink" aria-label="关闭元件说明">
          ✕
        </button>
      </div>
      <p className="mt-1.5 text-[13.5px] text-ink-2">
        <Rich text={info.role} />
      </p>
      <div className="mt-3 space-y-1.5">
        {CE_MODES.map((m) => (
          <div
            key={m.value}
            className={`rounded-md px-2.5 py-1.5 text-[13px] ${m.value === mode ? "bg-accent-soft text-ink" : "text-ink-2"}`}
          >
            <span className="mr-2 text-[11.5px] font-medium text-ink-3">{m.label}</span>
            <Rich text={info.byMode[m.value]} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DistortionPanel({ analysis, stats }: { analysis: CEAnalysis; stats: ScopeStats }) {
  const { dc, ac, params: p } = analysis;
  const items: Array<{ tone: "ok" | "warn" | "err"; title: string; body: string }> = [];
  if (dc.region === "cutoff") {
    items.push({
      tone: "err",
      title: "静态即截止",
      body: "$V_{BB}\\le U_{BEQ}$，发射结没有正偏，$I_{BQ}=0$。小信号的负半周根本无法通过，正半周也只有超过导通电压的部分才有输出——这不是放大电路。",
    });
  } else if (dc.region === "saturation") {
    items.push({
      tone: "err",
      title: "静态即饱和",
      body: `$U_{CEQ}=U_{CES}$，集电结已正偏，$i_C$ 不再随 $i_B$ 变化。应增大 ${p.topology === "fixed" ? "$R_b$" : "$R_{b2}$ 或 $R_E$"} 使 $I_{BQ}$ 减小。`,
    });
  } else {
    const linPeak = Math.abs(ac.Aus) * p.Usm;
    const overCut = linPeak > ac.UomCut;
    const overSat = linPeak > ac.UomSat;
    if (overCut && overSat) {
      items.push({
        tone: "err",
        title: "双向削波（截止 + 饱和）",
        body: `线性预测峰值 ${formatSI(linPeak, "V")} 同时超过截止限 ${formatSI(ac.UomCut, "V")} 与饱和限 ${formatSI(ac.UomSat, "V")}：输入太大。`,
      });
    } else if (overCut) {
      items.push({
        tone: "err",
        title: "截止失真（NPN：$u_o$ 顶部削平）",
        body: `$i_b$ 负半周使 $i_B$ 降到 0，$i_C$ 无法再减小，$u_o$ 正半周被削平在 $I_{CQ}R_L'\\approx${sig(ac.UomCut, 3)}\\,\\mathrm V$。原因：Q 点偏低（$I_{CQ}$ 太小）。改进：${p.topology === "fixed" ? "减小 $R_b$" : "减小 $R_{b2}$ 或增大 $R_{b1}$"} 使 Q 点上移，或减小输入。`,
      });
    } else if (overSat) {
      items.push({
        tone: "err",
        title: "饱和失真（NPN：$u_o$ 底部削平）",
        body: `$i_b$ 正半周使 $u_{CE}$ 降到 $U_{CES}$，$i_C$ 不再增大，$u_o$ 负半周被削平在约 $-${sig(ac.UomSat, 3)}\\,\\mathrm V$。原因：Q 点偏高（$U_{CEQ}$ 太小）。改进：${p.topology === "fixed" ? "增大 $R_b$" : "增大 $R_{b2}$"} 使 Q 点下移，或减小 $R_c$、减小输入。`,
      });
    } else {
      items.push({
        tone: "ok",
        title: "未削波",
        body: `输出峰值约 ${formatSI(linPeak, "V")}，小于最大不失真输出 $U_{om}=${sig(ac.Uom, 3)}\\,\\mathrm V$（${ac.limitedBy === "cutoff" ? "截止" : "饱和"}先发生）。允许的最大信号源峰值 ≈ ${formatSI(ac.UsmMax, "V")}。`,
      });
    }
    if (stats.thd > 0.05 && !overCut && !overSat) {
      items.push({
        tone: "warn",
        title: "输入特性的非线性失真",
        body: `虽然没有削波，THD 已达 ${sig(stats.thd * 100, 2)}%。发射结 $i_B\\propto e^{u_{BE}/U_T}$，当 $u_{be}$ 峰值不满足 $\\ll U_T\\approx26\\,\\mathrm{mV}$ 时，正、负半周放大倍数不同。接入不旁路的射极电阻或增大 $R_s$ 都能改善。`,
      });
    }
    if (Math.abs(stats.uoMean) > 0.02 * Math.max(Math.abs(stats.uoMax), Math.abs(stats.uoMin), 1e-9)) {
      items.push({
        tone: "warn",
        title: "输出出现直流偏移",
        body: `$u_o$ 平均值 ${formatSI(stats.uoMean, "V")} ≠ 0：波形上下不对称会产生偶次谐波与直流分量（实际电路中该分量会被 $C_2$ 隔断并缓慢改变电容电压，本模型按准静态处理）。`,
      });
    }
  }
  const lf = analysis.lf;
  if (p.f < 5 * lf.fL) {
    items.push({
      tone: "warn",
      title: "中频近似不成立",
      body: `信号频率 ${formatSI(p.f, "Hz")} 接近低频截止频率 $f_L\\approx${sig(lf.fL, 3)}\\,\\mathrm{Hz}$（短路时间常数法）。实际增益会下降、相位会偏离 180°，而本实验室的波形模型**未包含**电容的低频效应。`,
    });
  }
  if (p.f > 100e3) {
    items.push({ tone: "warn", title: "高频效应未建模", body: "频率较高时晶体管结电容（米勒效应）会使增益下降，本模型未包含。" });
  }
  const color = { ok: "border-ok/40 bg-ok-soft/50", warn: "border-warn/40 bg-warn-soft/50", err: "border-err/40 bg-err-soft/50" };
  return (
    <div className="space-y-2" data-testid="distortion-panel">
      {items.map((it, i) => (
        <div key={i} className={`rounded-lg border px-3 py-2 ${color[it.tone]}`} data-tone={it.tone}>
          <div className="text-[13.5px] font-semibold">
            <Rich text={it.title} />
          </div>
          <div className="mt-0.5 text-[13px] leading-relaxed text-ink-2">
            <Rich text={it.body} />
          </div>
        </div>
      ))}
    </div>
  );
}
