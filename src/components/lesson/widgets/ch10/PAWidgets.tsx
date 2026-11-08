"use client";

import { useMemo, useState } from "react";
import { r, Rich } from "@/components/math/Tex";
import { conductionClass, DEFAULT_PP, oclMax, oclMaxTubeLoss, oclPower, otlLowCorner, otlMax, pushPullWave } from "@/simulations/power/pa";
import { formatSI, sig } from "@/simulations/units";
import { Line, Plot } from "@/components/plot/Plot";
import { ParamSlider, Readout } from "@/components/ui/primitives";
import { ChipGroup, Legend, PlotTitle, WidgetCard } from "../WidgetCard";

/* ───────────── 甲、乙、甲乙、丙类 ───────────── */
const PRESET: Record<string, number> = { A: 1, AB: 0.15, B: 0, C: -0.3 };

export function ClassDemo() {
  const [cls, setCls] = useState<"A" | "AB" | "B" | "C">("A");
  const [icq, setIcq] = useState(1);
  const c = conductionClass(icq);
  const pts = c.iC.map((y, k) => [k / c.iC.length, y] as [number, number]);
  return (
    <WidgetCard
      title="交互：静态电流决定导通角与效率"
      testId="class-demo"
      controls={
        <>
          <ChipGroup
            label="类型"
            value={cls}
            onChange={(k) => {
              setCls(k);
              setIcq(PRESET[k]);
            }}
            testId="cd-class"
            options={[
              { value: "A", label: "甲类" },
              { value: "AB", label: "甲乙类" },
              { value: "B", label: "乙类" },
              { value: "C", label: "丙类" },
            ]}
          />
          <ParamSlider label="静态电流 $I_{CQ}/I_{cm}$" value={icq} onChange={setIcq} min={-0.6} max={1.2} step={0.01} unit="" testId="cd-icq" />
          <div className="grid grid-cols-2 gap-1.5">
            <Readout label="导通角" value={`${sig(c.theta, 3)}°`} tone="ac" testId="cd-theta" />
            <Readout label="最大效率（理想）" value={`${sig(c.eta * 100, 3)} %`} tone="ok" testId="cd-eta" />
          </div>
        </>
      }
      footer={r`单管集电极电流 $i_C=I_{CQ}+I_{cm}\sin\omega t$，截止时为 0。效率按“集电极电压摆幅达到 $V_{CC}$、负载只取基波功率”的理想情况计算：甲类 50%、乙类 78.5%。导通角越小、静态电流越小，效率越高，但单管输出波形越不完整——乙类、甲乙类必须用两只管子推挽，丙类用于谐振负载（高频）。`}
    >
      <PlotTitle>{String.raw`一个周期内的 $i_C/I_{cm}$`}</PlotTitle>
      <Plot height={210} ariaLabel="集电极电流波形" x={{ domain: [0, 1], label: "t / T" }} y={{ domain: [0, 2.3] }}>
        {(s) => (
          <g>
            <Line points={[[0, Math.max(icq, 0)], [1, Math.max(icq, 0)]]} s={s} color="var(--dc)" width={1.2} dash="4 3" />
            <Line points={pts} s={s} color="var(--ac)" width={2.4} />
          </g>
        )}
      </Plot>
      <Legend items={[["$i_C$", "var(--ac)"], ["$I_{CQ}$", "var(--dc)", "4 3"]]} />
    </WidgetCard>
  );
}

/* ───────────── OCL 功率与效率 ───────────── */
export function OCLPowerDemo() {
  const [VCC, setVCC] = useState(12);
  const [RL, setRL] = useState(8);
  const [Uom, setUom] = useState(8);
  const UCES = 1;
  const m = oclMax(VCC, RL, UCES);
  const u = Math.min(Uom, VCC - UCES);
  const now = oclPower(VCC, RL, u);
  const tube = oclMaxTubeLoss(VCC, RL);
  const curves = useMemo(() => {
    const po: Array<[number, number]> = [];
    const pv: Array<[number, number]> = [];
    const pt: Array<[number, number]> = [];
    for (let k = 0; k <= 100; k++) {
      const x = ((VCC - UCES) * k) / 100;
      const o = oclPower(VCC, RL, x);
      po.push([x, o.Po]);
      pv.push([x, o.PV]);
      pt.push([x, o.PT1]);
    }
    return { po, pv, pt };
  }, [VCC, RL]);
  return (
    <WidgetCard
      title="交互：OCL 的输出功率、电源功率与管耗"
      testId="ocl-power"
      wide
      controls={
        <>
          <ParamSlider label={r`$\pm V_{CC}$`} value={VCC} onChange={setVCC} min={5} max={40} step={0.5} unit="V" />
          <ParamSlider label="$R_L$" value={RL} onChange={setRL} min={2} max={32} step={0.5} unit="Ω" />
          <ParamSlider label="输出幅值 $U_{om}$" value={Uom} onChange={setUom} min={0} max={VCC - UCES} step={0.05} unit="V" testId="op-uom" />
          <div className="grid grid-cols-2 gap-1.5">
            <Readout label="$P_o$" value={formatSI(now.Po, "W")} tone="ac" testId="op-po" />
            <Readout label="$P_V$" value={formatSI(now.PV, "W")} tone="dc" />
            <Readout label="每管管耗 $P_{T1}$" value={formatSI(now.PT1, "W")} tone="err" />
            <Readout label={r`效率 $\eta$`} value={`${sig(now.eta * 100, 3)} %`} tone="ok" testId="op-eta" />
            <Readout label="$P_{om}$（$U_{CES}$=1 V）" value={formatSI(m.Po, "W")} />
            <Readout label={r`$P_{T1\max}$`} value={formatSI(tube.PT1max, "W")} />
          </div>
        </>
      }
      footer={r`乙类、理想互补管、正弦输出。$P_o=\dfrac{U_{om}^2}{2R_L}$，$P_V=\dfrac{2V_{CC}U_{om}}{\pi R_L}$，$\eta=\dfrac{\pi U_{om}}{4V_{CC}}$。管耗不是在输出最大时最大，而是在 $U_{om}=2V_{CC}/\pi\approx0.64V_{CC}$ 时最大。`}
    >
      <Plot height={250} ariaLabel="功率随输出幅值变化" x={{ domain: [0, VCC - UCES], label: "U_om / V" }} y={{ domain: [0, (m.PV || 1) * 1.1], label: "W" }}>
        {(s) => (
          <g>
            <Line points={curves.pv} s={s} color="var(--dc)" width={2} />
            <Line points={curves.po} s={s} color="var(--ac)" width={2} />
            <Line points={curves.pt} s={s} color="var(--err)" width={2} />
            <line x1={s.sx(u)} x2={s.sx(u)} y1={s.m.t} y2={s.m.t + s.ih} stroke="var(--ink-3)" strokeDasharray="3 3" />
            <line x1={s.sx(tube.Uom)} x2={s.sx(tube.Uom)} y1={s.m.t} y2={s.m.t + s.ih} stroke="var(--err)" strokeDasharray="2 4" />
          </g>
        )}
      </Plot>
      <Legend items={[["$P_V$", "var(--dc)"], ["$P_o$", "var(--ac)"], ["$P_{T1}$（每管）", "var(--err)"]]} />
    </WidgetCard>
  );
}

/* ───────────── 交越失真 ───────────── */
export function CrossoverDemo() {
  const [Vb, setVb] = useState(0);
  const [Ui, setUi] = useState(2);
  const w = useMemo(() => pushPullWave(Ui, { ...DEFAULT_PP, Vbias: Vb }), [Vb, Ui]);
  const n = w.ui.length;
  return (
    <WidgetCard
      title="交互：偏置电压与交越失真"
      testId="crossover"
      controls={
        <>
          <ParamSlider label="两基极间偏置 $U_B$" value={Vb} onChange={setVb} min={0} max={1.4} step={0.01} unit="V" testId="cx-vb" />
          <ParamSlider label="输入幅值 $U_{im}$" value={Ui} onChange={setUi} min={0.2} max={10} log unit="V" />
          <div className="grid grid-cols-2 gap-1.5">
            <Readout label="THD" value={`${sig(w.thd * 100, 3)} %`} tone={w.thd < 0.02 ? "ok" : "err"} testId="cx-thd" />
            <Readout label="静态电流 $I_{CQ}$" value={formatSI(w.IQ, "A")} tone="dc" testId="cx-iq" />
          </div>
        </>
      }
      footer="互补射极跟随器，$R_L$=8 Ω，两管用指数模型（0.6 V 时约 1 mA），电源 ±12 V。$U_B=0$（乙类）时，输入在 ±0.5 V 左右范围内两管都不导通，输出出现“台阶”——交越失真，小信号时尤其严重。给两管加约 $2U_{on}$ 的偏置（甲乙类），失真大大减小，代价是有一定的静态电流。"
    >
      <Plot height={240} ariaLabel="交越失真波形" x={{ domain: [0, 1], label: "t / T" }} y={{ domain: [-Ui * 1.15, Ui * 1.15], label: "V" }}>
        {(s) => (
          <g>
            <Line points={w.ui.map((y, k) => [k / n, y] as [number, number])} s={s} color="var(--ch1)" width={1.4} dash="4 3" />
            <Line points={w.uo.map((y, k) => [k / n, y] as [number, number])} s={s} color="var(--ch2)" width={2.3} />
          </g>
        )}
      </Plot>
      <Legend items={[["$u_I$", "var(--ch1)", "4 3"], ["$u_O$", "var(--ch2)"]]} />
    </WidgetCard>
  );
}

/* ───────────── OTL ───────────── */
export function OTLDemo() {
  const [VCC, setVCC] = useState(24);
  const [RL, setRL] = useState(8);
  const [C, setC] = useState(1000e-6);
  const m = otlMax(VCC, RL, 1);
  const fL = otlLowCorner(RL, C);
  return (
    <WidgetCard
      title="交互：OTL 的最大输出功率与输出电容"
      testId="otl-demo"
      controls={
        <>
          <ParamSlider label="单电源 $V_{CC}$" value={VCC} onChange={setVCC} min={6} max={48} step={0.5} unit="V" />
          <ParamSlider label="$R_L$" value={RL} onChange={setRL} min={2} max={32} step={0.5} unit="Ω" />
          <ParamSlider label="输出电容 $C$" value={C} onChange={setC} min={47e-6} max={4700e-6} log unit="µF" scale={1e-6} testId="otl-c" />
        </>
      }
      footer={r`静态时输出端 A 点电位为 $V_{CC}/2$，电容 $C$ 充电到 $V_{CC}/2$。正半周 VT₁ 导通，$V_{CC}$ 经 VT₁ 给负载供电并给 C 充电；负半周 VT₂ 导通，C 放电，相当于一个 $V_{CC}/2$ 的负电源。所以 OTL 等效于 $\pm V_{CC}/2$ 的 OCL。$C$ 与 $R_L$ 构成高通，决定低频响应。`}
    >
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        <Readout label="等效 ±电源" value={`±${formatSI(VCC / 2, "V")}`} />
        <Readout label="$P_{om}$（$U_{CES}$=1 V）" value={formatSI(m.Po, "W")} tone="ac" testId="otl-pom" />
        <Readout label={r`$\eta_{\max}$`} value={`${sig(m.eta * 100, 3)} %`} tone="ok" />
        <Readout label="下限频率 $f_L$" value={formatSI(fL, "Hz")} tone={fL < 30 ? "ok" : "warn"} testId="otl-fl" />
      </div>
      <p className="text-[13px] text-ink-2">
        <Rich text={r`扬声器负载只有几欧，要让 $f_L$ 低于 20 Hz，电容要上千微法——这是 OTL 的主要缺点；OCL 省去了电容，但需要正负两个电源。`} />
      </p>
    </WidgetCard>
  );
}
