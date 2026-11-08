"use client";

import { useMemo, useState } from "react";
import { r } from "@/components/math/Tex";
import { solveDC } from "@/simulations/bjt/ce";
import { analyzeCB, analyzeCC, analyzeCEStage, DEFAULT_CB, DEFAULT_CC, qAtTemperature } from "@/simulations/bjt/stages";
import { DEFAULT_CE, DEFAULT_DIVIDER, type CEParams } from "@/simulations/bjt/types";
import { formatSI, par, sig } from "@/simulations/units";
import { Line, Plot } from "@/components/plot/Plot";
import { ParamSlider, Readout, Segmented } from "@/components/ui/primitives";
import { Rich } from "@/components/math/Tex";
import { Legend, PlotTitle, WidgetCard } from "../WidgetCard";

/* ───────────── 固定偏置 vs 分压偏置：温度与 β ───────────── */
export function QDriftCompare() {
  const [t, setT] = useState(25);
  const [beta, setBeta] = useState(100);
  const div: CEParams = { ...DEFAULT_DIVIDER, beta };
  const div100 = solveDC(DEFAULT_DIVIDER);
  // 设计一个 25 °C、β=100 时 I_CQ 相同的固定偏置电路，便于对比
  const fixed: CEParams = { ...DEFAULT_CE, beta, Rb: (100 * (DEFAULT_CE.VCC - 0.7)) / div100.ICQ, Rc: DEFAULT_DIVIDER.Rc };
  const qf = qAtTemperature(fixed, t);
  const qd = qAtTemperature(div, t);
  const qf0 = qAtTemperature({ ...fixed, beta: 100 }, 25);
  const curves = useMemo(() => {
    const f: Array<[number, number]> = [];
    const d: Array<[number, number]> = [];
    for (let x = -20; x <= 90; x += 2) {
      f.push([x, qAtTemperature(fixed, x).ICQ * 1e3]);
      d.push([x, qAtTemperature(div, x).ICQ * 1e3]);
    }
    return { f, d };
  }, [beta]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <WidgetCard
      title="交互：同一 Q 点，两种偏置电路的温度稳定性"
      testId="q-drift"
      controls={
        <>
          <ParamSlider label="温度 $t$" value={t} onChange={setT} min={-20} max={90} step={1} unit="°C" testId="qd-t" />
          <ParamSlider label={r`25 °C 时的 $\beta$（换一只管子）`} value={beta} onChange={setBeta} min={40} max={250} step={1} unit="" testId="qd-beta" />
          <div className="grid grid-cols-2 gap-1.5">
            <Readout label="固定偏置 $I_{CQ}$" value={formatSI(qf.ICQ, "A")} tone="err" testId="qd-fixed" />
            <Readout label="分压偏置 $I_{CQ}$" value={formatSI(qd.ICQ, "A")} tone="ok" testId="qd-div" />
            <Readout label="固定偏置 $U_{CEQ}$" value={formatSI(qf.UCEQ, "V")} sub={qf.region === "saturation" ? "已饱和！" : undefined} />
            <Readout label="分压偏置 $U_{CEQ}$" value={formatSI(qd.UCEQ, "V")} />
          </div>
        </>
      }
      footer={`两个电路 $V_{CC}$=12 V、$R_c$=3 kΩ 相同，25 °C、β=100 时 Q 点相同（$I_{CQ}$≈${formatSI(qf0.ICQ, "A")}）。分压偏置：$R_{b1}$=10 kΩ、$R_{b2}$=33 kΩ、$R_e$=1.2 kΩ；固定偏置：$R_b$=${formatSI(fixed.Rb, "Ω")}。温度模型：β +1%/°C，$U_{BE}$ −2.2 mV/°C（未计 $I_{CBO}$）。`}
    >
      <PlotTitle>{String.raw`$I_{CQ}$（mA）– 温度（°C）`}</PlotTitle>
      <Plot height={240} ariaLabel="I_CQ 随温度变化" x={{ domain: [-20, 90], label: "t / °C" }} y={{ domain: [0, 4], label: "mA" }}>
        {(s) => (
          <g>
            <Line points={curves.f} s={s} color="var(--err)" width={2.2} />
            <Line points={curves.d} s={s} color="var(--ok)" width={2.2} />
            <line x1={s.sx(t)} x2={s.sx(t)} y1={s.m.t} y2={s.m.t + s.ih} stroke="var(--ink-3)" strokeDasharray="3 3" />
          </g>
        )}
      </Plot>
      <Legend items={[["固定偏置", "var(--err)"], ["分压偏置（$R_e$ 直流负反馈）", "var(--ok)"]]} />
    </WidgetCard>
  );
}

/* ───────────── 估算法的误差 ───────────── */
export function EstimateError() {
  const [scale, setScale] = useState(1);
  const [beta, setBeta] = useState(100);
  const p: CEParams = { ...DEFAULT_DIVIDER, Rb1: 10e3 * scale, Rb2: 33e3 * scale, beta };
  const dc = solveDC(p);
  const est = dc.estimate!;
  const err = (est.ICQ - dc.ICQ) / dc.ICQ;
  return (
    <WidgetCard
      title="交互：估算法什么时候够准"
      testId="estimate-error"
      controls={
        <>
          <ParamSlider label={r`偏置电阻整体放大倍数（$R_{b2}/R_{b1}$ 保持 3.3）`} value={scale} onChange={setScale} min={0.2} max={20} log unit="×" testId="ee-scale" />
          <ParamSlider label={r`$\beta$`} value={beta} onChange={setBeta} min={20} max={300} step={1} unit="" />
        </>
      }
      footer={r`估算法假设流过 $R_{b1}$、$R_{b2}$ 的电流远大于 $I_{BQ}$，从而 $U_{BQ}$ 只由分压决定。等价条件：$(1+\beta)R_e\gg R_{b1}\para R_{b2}$。`}
    >
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        <Readout label={r`$R_B=R_{b1}\para R_{b2}$`} value={formatSI(dc.RB, "Ω")} />
        <Readout label={r`$(1+\beta)R_e/R_B$`} value={sig(est.ratio, 3)} tone={est.ratio >= 10 ? "ok" : "warn"} testId="ee-ratio" />
        <Readout label="估算 $I_{CQ}$" value={formatSI(est.ICQ, "A")} />
        <Readout label="精确 $I_{CQ}$" value={formatSI(dc.ICQ, "A")} />
      </div>
      <p className="text-[13.5px]" data-testid="ee-err">
        <Rich text={`估算法误差 ${sig(err * 100, 2)}%。${est.ratio >= 10 ? "满足 ≥10 倍的条件，估算法可用。" : "不满足条件，应改用戴维南等效精确求解。"}`} />
      </p>
    </WidgetCard>
  );
}

/* ───────────── 射极跟随器 ───────────── */
export function CCDemo() {
  const [Re, setRe] = useState(DEFAULT_CC.Re);
  const [RL, setRL] = useState(DEFAULT_CC.RL);
  const [Rs, setRs] = useState(DEFAULT_CC.Rs);
  const [beta, setBeta] = useState(100);
  const a = analyzeCC({ ...DEFAULT_CC, Re, RL, Rs, beta });
  return (
    <WidgetCard
      title="交互：射极跟随器的 $A_u$、$R_i$、$R_o$"
      testId="cc-demo"
      controls={
        <>
          <ParamSlider label="$R_e$" value={Re} onChange={setRe} min={500} max={20e3} log unit="kΩ" scale={1e3} />
          <ParamSlider label="$R_L$" value={RL} onChange={setRL} min={50} max={100e3} log unit="kΩ" scale={1e3} testId="cc-rl" />
          <ParamSlider label="信号源内阻 $R_s$" value={Rs} onChange={setRs} min={0} max={50e3} step={100} unit="kΩ" scale={1e3} testId="cc-rs" />
          <ParamSlider label={r`$\beta$`} value={beta} onChange={setBeta} min={20} max={300} step={1} unit="" />
        </>
      }
      footer="固定偏置：$V_{CC}$=12 V，$R_b$=200 kΩ，$r_{bb'}$=200 Ω。$R_o$ 的计算中信号源置零但保留 $R_s$。"
    >
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        <Readout label="$I_{EQ}$" value={formatSI(a.dc.IEQ, "A")} tone="dc" />
        <Readout label="$r_{be}$" value={formatSI(a.ac.rbe, "Ω")} tone="ss" />
        <Readout label={r`$\dot A_u$`} value={sig(a.ac.Au, 4)} tone="ac" testId="cc-au" />
        <Readout label="$R_i$" value={formatSI(a.ac.Ri, "Ω")} testId="cc-ri" />
        <Readout label="$R_o$" value={formatSI(a.ac.Ro, "Ω")} testId="cc-ro" />
        <Readout label={r`$\dot A_{us}$`} value={sig(a.ac.Aus, 4)} />
      </div>
      <p className="text-[13px] text-ink-2">
        <Rich
          text={`$R_i$ 中 $(1+\\beta)R_L'=${formatSI((1 + beta) * a.ac.RLp, "Ω")}$：射极上的电阻被“放大”$(1+\\beta)$ 倍后反映到基极；$R_o$ 中 $(r_{be}+R_s\\para R_b)/(1+\\beta)=${formatSI((a.ac.rbe + par(Rs, a.dc.RB)) / (1 + beta), "Ω")}$：基极回路的电阻被“缩小”$(1+\\beta)$ 倍后反映到射极。`}
        />
      </p>
    </WidgetCard>
  );
}

/* ───────────── 缓冲作用：直接驱动 vs 经射极跟随器 ───────────── */
export function BufferDemo() {
  const [Rs, setRs] = useState(20e3);
  const [RL, setRL] = useState(200);
  const Us = 1;
  const direct = (Us * RL) / (Rs + RL);
  const a = analyzeCC({ ...DEFAULT_CC, topology: "divider", Rb1: 100e3, Rb2: 100e3, Re: 1e3, Rs, RL });
  const via = Us * a.ac.Aus;
  return (
    <WidgetCard
      title="交互：高内阻信号源驱动低阻负载"
      testId="buffer-demo"
      controls={
        <>
          <ParamSlider label="信号源内阻 $R_s$" value={Rs} onChange={setRs} min={100} max={100e3} log unit="kΩ" scale={1e3} />
          <ParamSlider label="负载 $R_L$" value={RL} onChange={setRL} min={8} max={10e3} log unit="Ω" />
        </>
      }
      footer="跟随器：分压偏置 $R_{b1}=R_{b2}$=100 kΩ，$R_e$=1 kΩ，β=100。信号源开路电压 1 V（有效值）。"
    >
      <div className="grid grid-cols-2 gap-1.5">
        <Readout label="直接连接：负载电压" value={formatSI(direct, "V")} tone="err" testId="bd-direct" />
        <Readout label="经射极跟随器：负载电压" value={formatSI(via, "V")} tone="ok" testId="bd-via" />
        <Readout label="跟随器 $R_i$" value={formatSI(a.ac.Ri, "Ω")} />
        <Readout label="跟随器 $R_o$" value={formatSI(a.ac.Ro, "Ω")} />
      </div>
      <p className="text-[13px] text-ink-2">
        <Rich text={`电压放大倍数不到 1 的电路，却让负载电压提高了 ${sig(via / direct, 3)} 倍：跟随器的高 $R_i$ 不“拖累”信号源，低 $R_o$ 又能带动重负载——这就是**阻抗变换**（缓冲）。`} />
      </p>
    </WidgetCard>
  );
}

/* ───────────── 三种组态对比 ───────────── */
export function ConfigCompare() {
  const [RL, setRL] = useState(3e3);
  const [Rs, setRs] = useState(1e3);
  const [beta, setBeta] = useState(100);
  const base = { ...DEFAULT_CB, RL, Rs, beta };
  const rows = [
    ["共射 CE", analyzeCEStage(base), "反相", "b 入 c 出"],
    ["共集 CC", analyzeCC(base), "同相", "b 入 e 出"],
    ["共基 CB", analyzeCB(base), "同相", "e 入 c 出"],
  ] as const;
  const [show, setShow] = useState<"Au" | "Aus">("Au");
  return (
    <WidgetCard
      title="交互：同一偏置、同一管子的三种组态"
      testId="config-compare"
      wide
      controls={
        <>
          <ParamSlider label="$R_L$" value={RL} onChange={setRL} min={100} max={100e3} log unit="kΩ" scale={1e3} />
          <ParamSlider label="$R_s$" value={Rs} onChange={setRs} min={0} max={20e3} step={50} unit="kΩ" scale={1e3} testId="cmp-rs" />
          <ParamSlider label={r`$\beta$`} value={beta} onChange={setBeta} min={20} max={300} step={1} unit="" />
          <Segmented
            size="sm"
            label="增益"
            value={show}
            onChange={setShow}
            options={[
              { value: "Au", label: "A_u" },
              { value: "Aus", label: "A_us" },
            ]}
          />
        </>
      }
      footer="分压偏置 $R_{b1}$=10 kΩ、$R_{b2}$=33 kΩ、$R_e$=1.2 kΩ、$R_c$=3 kΩ、$V_{CC}$=12 V；共射时 $R_e$ 被完全旁路，共集时输出取自发射极，共基时基极经大电容接地。"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]" data-testid="cmp-table">
          <thead>
            <tr className="border-b border-line text-left text-[12px] text-ink-3">
              <th className="py-1 font-normal">组态</th>
              <th className="py-1 font-normal">{show === "Au" ? <Rich text={r`$\dot A_u$`} /> : <Rich text={r`$\dot A_{us}$`} />}</th>
              <th className="py-1 font-normal">
                <Rich text="$R_i$" />
              </th>
              <th className="py-1 font-normal">
                <Rich text="$R_o$" />
              </th>
              <th className="py-1 font-normal">电流放大</th>
              <th className="py-1 font-normal">相位</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([name, a, ph, io]) => (
              <tr key={name} className="border-b border-line-2">
                <td className="py-1.5">
                  {name}
                  <span className="block text-[11px] text-ink-3">{io}</span>
                </td>
                <td className="num py-1.5">{sig(show === "Au" ? a.ac.Au : a.ac.Aus, 3)}</td>
                <td className="num py-1.5">{formatSI(a.ac.Ri, "Ω")}</td>
                <td className="num py-1.5">{formatSI(a.ac.Ro, "Ω")}</td>
                <td className="num py-1.5">{sig(a.ac.Ai, 3)}</td>
                <td className="py-1.5">{ph}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[13px] text-ink-2">
        <Rich text={r`把 $R_s$ 调大再看 $\dot A_{us}$：共基电路的 $R_i$ 只有十几欧，信号源内阻稍大就会把大部分信号“吃掉”；共集电路反之。选组态就是在这三列之间做取舍。`} />
      </p>
    </WidgetCard>
  );
}
