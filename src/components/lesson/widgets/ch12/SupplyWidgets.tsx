"use client";

import { useMemo, useState } from "react";
import { r, Rich } from "@/components/math/Tex";
import { rectifiedAverage, rectifiedAverageNumeric, rectifierStress, rectify, simulateCapFilter } from "@/simulations/diode/waveforms";
import { DEFAULT_ZENER, solveZenerRegulator, zenerRegulationIndex } from "@/simulations/diode/zener";
import { capFilterEstimate, DEFAULT_SR, outputRange, seriesRegulator } from "@/simulations/power/regulator";
import { formatSI, sig } from "@/simulations/units";
import { Line, Plot } from "@/components/plot/Plot";
import { ParamSlider, Readout, Segmented, Toggle } from "@/components/ui/primitives";
import { Legend, PlotTitle, WidgetCard } from "../WidgetCard";

/* ───────────── 整流电路 ───────────── */
export function RectifierLab() {
  const [kind, setKind] = useState<"half" | "bridge">("bridge");
  const [U2, setU2] = useState(10);
  const [RL, setRL] = useState(100);
  const [real, setReal] = useState(false);
  const Uon = real ? 0.7 : 0;
  const avg = rectifiedAverageNumeric(U2, kind, Uon);
  const st = rectifierStress(U2, RL, kind);
  const pts = useMemo(() => {
    const a: Array<[number, number]> = [];
    const b: Array<[number, number]> = [];
    for (let k = 0; k <= 400; k++) {
      const ph = (2 * k) / 400;
      const u = Math.SQRT2 * U2 * Math.sin(2 * Math.PI * ph);
      a.push([ph, u]);
      b.push([ph, rectify(u, kind, Uon)]);
    }
    return { a, b };
  }, [U2, kind, Uon]);
  const lim = Math.SQRT2 * U2 * 1.1;
  return (
    <WidgetCard
      title="交互：半波整流与桥式整流"
      testId="rect-lab"
      wide
      controls={
        <>
          <Segmented
            size="sm"
            label="电路"
            value={kind}
            onChange={setKind}
            testId="rl-kind"
            options={[
              { value: "half", label: "半波" },
              { value: "bridge", label: "桥式" },
            ]}
          />
          <ParamSlider label="$U_2$（有效值）" value={U2} onChange={setU2} min={3} max={50} step={0.5} unit="V" />
          <ParamSlider label="$R_L$" value={RL} onChange={setRL} min={10} max={1e3} log unit="Ω" />
          <Toggle checked={real} onChange={setReal} label="计入二极管压降 0.7 V" />
          <div className="grid grid-cols-2 gap-1.5">
            <Readout label="$U_{O(AV)}$（数值）" value={formatSI(avg, "V")} tone="ac" testId="rl-avg" />
            <Readout label={kind === "half" ? "$0.45U_2$" : "$0.9U_2$"} value={formatSI(rectifiedAverage(U2, kind), "V")} />
            <Readout label="二极管平均电流" value={formatSI(st.ID, "A")} />
            <Readout label="最大反向电压 $U_{RM}$" value={formatSI(st.URM, "V")} tone="warn" />
          </div>
        </>
      }
      footer="电阻负载、理想变压器。二极管电流与反向电压按理想二极管计算。计入导通压降后，低压整流的输出明显降低（桥式每半周有两只二极管压降）。"
    >
      <Plot height={230} ariaLabel="整流波形" x={{ domain: [0, 2], label: "t / T" }} y={{ domain: [-lim, lim], label: "V" }}>
        {(s) => (
          <g>
            <Line points={pts.a} s={s} color="var(--ch1)" width={1.3} dash="4 3" />
            <Line points={pts.b} s={s} color="var(--ch2)" width={2.3} />
            <Line points={[[0, avg], [2, avg]]} s={s} color="var(--dc)" width={1.4} dash="2 3" />
          </g>
        )}
      </Plot>
      <Legend items={[["$u_2$", "var(--ch1)", "4 3"], ["$u_O$", "var(--ch2)"], ["平均值", "var(--dc)", "2 3"]]} />
    </WidgetCard>
  );
}

/* ───────────── 电容滤波（时域仿真） ───────────── */
export function CapFilterLab() {
  const [U2, setU2] = useState(15);
  const [C, setC] = useState(1000e-6);
  const [RL, setRL] = useState(100);
  const sim = useMemo(() => simulateCapFilter({ U2rms: U2, C, RL, Uon: 0.7, Rs: 1, periods: 10, steps: 400 }), [U2, C, RL]);
  const est = capFilterEstimate(U2, RL, C);
  const n = sim.t.length;
  const start = n - 2 * 400 - 1;
  const t0 = sim.t[start];
  const pick = (arr: number[]) => arr.slice(start).map((y, k) => [(sim.t[start + k] - t0) * 50, y] as [number, number]);
  const ipeak = sim.iDpeak;
  return (
    <WidgetCard
      title="交互：桥式整流电容滤波（时域仿真）"
      testId="cap-filter"
      wide
      controls={
        <>
          <ParamSlider label="$U_2$（有效值）" value={U2} onChange={setU2} min={5} max={30} step={0.5} unit="V" />
          <ParamSlider label="滤波电容 $C$" value={C} onChange={setC} min={10e-6} max={4700e-6} log unit="µF" scale={1e-6} testId="cf-c" />
          <ParamSlider label="负载 $R_L$" value={RL} onChange={setRL} min={10} max={2e3} log unit="Ω" testId="cf-rl" />
          <div className="grid grid-cols-2 gap-1.5">
            <Readout label="$U_{O(AV)}$（仿真）" value={formatSI(sim.UOavg, "V")} tone="ac" testId="cf-uo" />
            <Readout label="$1.2U_2$" value={formatSI(est.UO, "V")} />
            <Readout label="纹波峰峰值（仿真）" value={formatSI(sim.ripplePP, "V")} tone="warn" testId="cf-ripple" />
            <Readout label="估算 $I_O/(2fC)$" value={formatSI(est.ripple, "V")} />
            <Readout label="$R_LC/(T/2)$" value={sig(est.tauOverHalfT, 3)} tone={est.tauOverHalfT >= 3 ? "ok" : "err"} />
            <Readout label="二极管峰值电流" value={formatSI(ipeak, "A")} tone="err" />
          </div>
        </>
      }
      footer={r`50 Hz 电网，二极管恒压降 0.7 V（每半周两只），变压器绕组与二极管等效内阻 1 Ω，后向欧拉逐点仿真，显示稳态两个周期。$R_LC\ge(3\sim5)T/2$ 时 $U_{O(AV)}\approx1.2U_2$。电容越大纹波越小，但二极管只在峰值附近很短时间内导通，冲击电流很大。`}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <PlotTitle>{String.raw`$u_O$ 与整流电压（V）`}</PlotTitle>
          <Plot height={210} ariaLabel="电容滤波输出波形" x={{ domain: [0, 2], label: "t / T" }} y={{ domain: [0, Math.SQRT2 * U2 * 1.1], label: "V" }}>
            {(s) => (
              <g>
                <Line points={pick(sim.ur)} s={s} color="var(--ch1)" width={1.2} dash="4 3" />
                <Line points={pick(sim.uo)} s={s} color="var(--ch2)" width={2.3} />
              </g>
            )}
          </Plot>
        </div>
        <div>
          <PlotTitle>{String.raw`整流桥电流 $i_D$（A）`}</PlotTitle>
          <Plot height={210} ariaLabel="二极管电流" x={{ domain: [0, 2], label: "t / T" }} y={{ domain: [0, Math.max(0.1, ipeak * 1.1)], label: "A" }}>
            {(s) => <Line points={pick(sim.iD)} s={s} color="var(--err)" width={2} />}
          </Plot>
        </div>
      </div>
    </WidgetCard>
  );
}

/* ───────────── 稳压管稳压：稳压系数与输出电阻 ───────────── */
export function ZenerRegIndex() {
  const [R, setR] = useState(200);
  const [rz, setRz] = useState(10);
  const z = { ...DEFAULT_ZENER, rz, IZM: 60e-3 };
  const RL = 1e3;
  const idx = zenerRegulationIndex(15, R, RL, z);
  const line = useMemo(() => Array.from({ length: 61 }, (_, k) => {
    const UI = 6 + (18 * k) / 60;
    return [UI, solveZenerRegulator(UI, R, RL, z).UO] as [number, number];
  }), [R, rz]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <WidgetCard
      title="交互：稳压管稳压电路的稳压特性"
      testId="zener-index"
      controls={
        <>
          <ParamSlider label="限流电阻 $R$" value={R} onChange={setR} min={50} max={1e3} log unit="Ω" />
          <ParamSlider label="稳压管动态电阻 $r_z$" value={rz} onChange={setRz} min={0.5} max={50} log unit="Ω" testId="zi-rz" />
          <div className="grid grid-cols-2 gap-1.5">
            <Readout label="稳压系数 $S_r$" value={sig(idx.Sr, 3)} tone="ac" testId="zi-sr" />
            <Readout label={r`输出电阻 $R_o\approx r_z\para R$`} value={formatSI(idx.Ro, "Ω")} />
          </div>
        </>
      }
      footer={r`$U_Z$=6 V（测试电流 10 mA）、$R_L$=1 kΩ，工作点 $U_I$=15 V。$S_r=\dfrac{\Delta U_O/U_O}{\Delta U_I/U_I}$ 越小越好；小信号等效电路中 $\Delta U_O\approx\Delta U_I\dfrac{r_z\para R_L}{R+r_z\para R_L}$，所以 R 越大、$r_z$ 越小，稳压效果越好。`}
    >
      <PlotTitle>{String.raw`$U_O$ – $U_I$（V）`}</PlotTitle>
      <Plot height={220} ariaLabel="稳压特性" x={{ domain: [6, 24], label: "U_I / V" }} y={{ domain: [0, 8], label: "U_O / V" }}>
        {(s) => <Line points={line} s={s} color="var(--ac)" width={2.4} />}
      </Plot>
    </WidgetCard>
  );
}

/* ───────────── 串联型稳压电路 ───────────── */
export function SeriesRegLab() {
  const [k, setK] = useState(0.5);
  const [UI, setUI] = useState(20);
  const [RL, setRL] = useState(100);
  const [A, setA] = useState(1000);
  const spec = { ...DEFAULT_SR, k, A };
  const res = seriesRegulator(UI, RL, spec);
  const range = outputRange(spec);
  const curve = useMemo(() => Array.from({ length: 81 }, (_, i) => {
    const u = 5 + (25 * i) / 80;
    return [u, seriesRegulator(u, RL, spec).UO] as [number, number];
  }), [k, RL, A]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <WidgetCard
      title="交互：串联型稳压电路"
      testId="series-reg"
      wide
      controls={
        <>
          <ParamSlider label="电位器滑动端位置（0=下端）" value={k} onChange={setK} min={0} max={1} step={0.01} unit="" testId="sr-k" />
          <ParamSlider label="输入 $U_I$" value={UI} onChange={setUI} min={5} max={30} step={0.1} unit="V" testId="sr-ui" />
          <ParamSlider label="负载 $R_L$" value={RL} onChange={setRL} min={10} max={1e3} log unit="Ω" />
          <ParamSlider label="比较放大器增益 $A$" value={A} onChange={setA} min={10} max={1e5} log unit="" />
          <div className="grid grid-cols-2 gap-1.5">
            <Readout label="$U_O$" value={formatSI(res.UO, "V")} tone="ac" testId="sr-uo" />
            <Readout label="理想 $U_Z/F$" value={formatSI(res.UOideal, "V")} />
            <Readout label="调整管 $U_{CE}$" value={formatSI(res.UCE, "V")} />
            <Readout label="调整管功耗" value={formatSI(res.PT, "W")} tone="err" />
            <Readout label="状态" value={res.regulating ? "稳压" : "调整管饱和，失去稳压"} tone={res.regulating ? "ok" : "err"} testId="sr-state" />
            <Readout label="调节范围" value={`${sig(range.min, 3)}–${sig(range.max, 3)} V`} />
          </div>
        </>
      }
      footer={r`$U_Z$=6 V，$R_1=R_P=R_2$=1 kΩ，调整管 β=50，放大器输出至少比 $U_I$ 低 1 V。$U_O=\dfrac{AU_Z-U_{BE}}{1+AF}\approx\dfrac{U_Z}{F}$。曲线左侧斜率为 1 的部分：输入太低，调整管饱和，输出跟着输入变（稳压电源的“压差”要求）。`}
    >
      <PlotTitle>{String.raw`$U_O$ – $U_I$（V）`}</PlotTitle>
      <Plot height={230} ariaLabel="串联稳压电路的输入输出特性" x={{ domain: [5, 30], label: "U_I / V" }} y={{ domain: [0, 20], label: "U_O / V" }}>
        {(s) => (
          <g>
            <Line points={curve} s={s} color="var(--ac)" width={2.4} />
            <circle cx={s.sx(UI)} cy={s.sy(res.UO)} r={5} fill="var(--bg-elev)" stroke="var(--ink)" strokeWidth={2} />
          </g>
        )}
      </Plot>
      <p className="text-[13px] text-ink-2">
        <Rich text={r`稳压过程：$U_I\uparrow$（或 $R_L\uparrow$）→ $U_O\uparrow$ → 采样电压 $FU_O\uparrow$ → 放大器输出 $u_B\downarrow$ → 调整管 $U_{CE}\uparrow$ → $U_O$ 拉回。`} />
      </p>
    </WidgetCard>
  );
}
