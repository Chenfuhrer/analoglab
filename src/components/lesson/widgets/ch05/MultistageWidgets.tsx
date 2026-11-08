"use client";

import { useMemo, useState } from "react";
import { r, Rich } from "@/components/math/Tex";
import { analyzeCE } from "@/simulations/bjt/ce";
import { DEFAULT_CC } from "@/simulations/bjt/stages";
import { atTemperature } from "@/simulations/bjt/device";
import { DEFAULT_DIVIDER, type CEParams } from "@/simulations/bjt/types";
import { analyzeCECC, analyzeCECE, directTwoCE, inputReferredDrift } from "@/simulations/multistage/cascade";
import { cabs, cornerFrequency, highPass, squareResponse } from "@/simulations/signal/rc";
import { formatSI, sig } from "@/simulations/units";
import { Line, Plot } from "@/components/plot/Plot";
import { ParamSlider, Readout, Toggle } from "@/components/ui/primitives";
import { fmtPow10, intTicks, Legend, PlotTitle, WidgetCard } from "../WidgetCard";

const CE1: CEParams = { ...DEFAULT_DIVIDER, Re1: 0, Re2: 1.2e3, hasCe: true };

/* ───────────── 阻容耦合 vs 直接耦合：频率特性与慢信号 ───────────── */
export function CouplingDemo() {
  const [C, setC] = useState(10e-6);
  const [fsig, setFsig] = useState(2);
  const [direct, setDirect] = useState(false);
  const Rsum = 3e3 + 2e3; // 前级 R_o + 后级 R_i
  const fL = cornerFrequency(Rsum, C);
  const bode = useMemo(() => {
    const pts: Array<[number, number]> = [];
    for (let k = 0; k <= 200; k++) {
      const lf = -1 + (6 * k) / 200;
      pts.push([lf, direct ? 0 : 20 * Math.log10(cabs(highPass(Math.pow(10, lf), fL)))]);
    }
    return pts;
  }, [fL, direct]);
  const sq = useMemo(() => {
    if (direct) {
      const t = Array.from({ length: 400 }, (_, k) => k / 400 / fsig);
      const vin = t.map((x) => (x * fsig < 0.5 ? 1 : -1));
      return { t, vin, vout: vin };
    }
    return squareResponse("hp", fL, fsig, 400);
  }, [fL, fsig, direct]);
  return (
    <WidgetCard
      title="交互：耦合电容对缓慢变化信号的影响"
      testId="coupling-demo"
      wide
      controls={
        <>
          <Toggle checked={direct} onChange={setDirect} label="改为直接耦合" testId="cp-direct" />
          <ParamSlider label="耦合电容 $C$" value={C} onChange={setC} min={0.1e-6} max={1000e-6} log unit="µF" scale={1e-6} />
          <ParamSlider label="方波频率" value={fsig} onChange={setFsig} min={0.1} max={1000} log unit="Hz" testId="cp-f" />
          <div className="grid grid-cols-2 gap-1.5">
            <Readout label="下限频率 $f_L$" value={direct ? "0（直流）" : formatSI(fL, "Hz")} tone="ac" testId="cp-fl" />
            <Readout label="$R_{o1}+R_{i2}$" value={formatSI(Rsum, "Ω")} />
          </div>
        </>
      }
      footer={r`耦合电容与“前级输出电阻 + 后级输入电阻”构成一阶高通网络，$f_L=1/[2\pi C(R_{o1}+R_{i2})]$。频率接近或低于 $f_L$ 的信号（包括直流、缓慢变化的温度/压力信号）会被衰减、方波顶部会“倾斜”。直接耦合没有这个问题，但前后级的直流电平互相牵连，并带来零点漂移。`}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <PlotTitle>{String.raw`耦合网络的幅频特性（dB）`}</PlotTitle>
          <Plot height={200} ariaLabel="耦合网络幅频特性" x={{ domain: [-1, 5], ticks: intTicks(-1, 5), format: fmtPow10, label: "f / Hz" }} y={{ domain: [-40, 5], label: "dB" }}>
            {(s) => (
              <g>
                <Line points={bode} s={s} color="var(--ac)" width={2.2} />
                <line x1={s.sx(Math.log10(fsig))} x2={s.sx(Math.log10(fsig))} y1={s.m.t} y2={s.m.t + s.ih} stroke="var(--ch1)" strokeDasharray="3 3" />
              </g>
            )}
          </Plot>
        </div>
        <div>
          <PlotTitle>{String.raw`方波通过耦合网络（一个周期）`}</PlotTitle>
          <Plot height={200} ariaLabel="方波响应" x={{ domain: [0, 1], label: "t / T" }} y={{ domain: [-2.2, 2.2] }}>
            {(s) => (
              <g>
                <Line points={sq.t.map((t, k) => [t * fsig, sq.vin[k]] as [number, number])} s={s} color="var(--ch1)" width={1.4} dash="4 3" />
                <Line points={sq.t.map((t, k) => [t * fsig, sq.vout[k]] as [number, number])} s={s} color="var(--ch2)" width={2.2} />
              </g>
            )}
          </Plot>
          <Legend items={[["输入", "var(--ch1)", "4 3"], ["经耦合电容后", "var(--ch2)"]]} />
        </div>
      </div>
    </WidgetCard>
  );
}

/* ───────────── 直接耦合：电平配合 ───────────── */
export function DirectLevelDemo() {
  const [Re2, setRe2] = useState(2e3);
  const [Rc1, setRc1] = useState(3e3);
  const d = directTwoCE({ VCC: 12, Rb1: 560e3, Rc1, Rc2: 3e3, Re2, beta: 100 });
  return (
    <WidgetCard
      title="交互：直接耦合时前后级的静态工作点互相牵连"
      testId="direct-level"
      controls={
        <>
          <ParamSlider label="第二级射极电阻 $R_{e2}$" value={Re2} onChange={setRe2} min={10} max={4e3} log unit="kΩ" scale={1e3} testId="dl-re2" />
          <ParamSlider label="第一级集电极电阻 $R_{c1}$" value={Rc1} onChange={setRc1} min={1e3} max={10e3} log unit="kΩ" scale={1e3} />
        </>
      }
      footer="电路：$V_{CC}$=12 V，第一级固定偏置 $R_{b1}$=560 kΩ（$I_{C1}$≈2 mA），$R_{c2}$=3 kΩ，β=100。第一级集电极直接接第二级基极，所以 $U_{CE1}=U_{C1}=U_{B2}=U_{BE2}+I_{E2}R_{e2}$。"
    >
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        <Readout label="$U_{C1}=U_{B2}$" value={formatSI(d.UC1, "V")} tone="dc" testId="dl-uc1" />
        <Readout label="第一级" value={d.region1 === "active" ? "放大区" : "饱和！"} tone={d.region1 === "active" ? "ok" : "err"} testId="dl-r1" />
        <Readout label="$I_{C2}$" value={formatSI(d.IC2, "A")} />
        <Readout label="$U_{CE2}$" value={formatSI(d.UCE2, "V")} />
        <Readout label="第二级" value={d.region2 === "active" ? "放大区" : d.region2 === "saturation" ? "饱和！" : "截止"} tone={d.region2 === "active" ? "ok" : "err"} />
      </div>
      <p className="text-[13px] text-ink-2">
        <Rich text={r`把 $R_{e2}$ 调到几十欧：第二级发射结把第一级集电极“钳”在约 0.7 V，第一级 $U_{CE1}$ 太小而接近饱和。加大 $R_{e2}$ 能抬高 $U_{C1}$，但 $R_{e2}$ 又会降低第二级增益——这就是直接耦合的“电平配合”问题。常用的解决办法：射极加稳压管或二极管、后级改用 PNP 管（电平移位）。`} />
      </p>
    </WidgetCard>
  );
}

/* ───────────── 级间负载效应 ───────────── */
export function LoadingDemo() {
  const [RL, setRL] = useState(3e3);
  const [Rb1, setRb1] = useState(10e3);
  const p2: CEParams = { ...CE1, Rb1, Rb2: Rb1 * 3.3 };
  const t = analyzeCECE(CE1, p2, RL);
  const second = analyzeCE({ ...p2, RL, Rs: CE1.Rc });
  return (
    <WidgetCard
      title="交互：两级共射——后级输入电阻是前级的负载"
      testId="loading-demo"
      controls={
        <>
          <ParamSlider label="第二级偏置 $R_{b1}'$（$R_{b2}'=3.3R_{b1}'$）" value={Rb1} onChange={setRb1} min={2e3} max={100e3} log unit="kΩ" scale={1e3} testId="ld-rb" />
          <ParamSlider label="负载 $R_L$" value={RL} onChange={setRL} min={300} max={100e3} log unit="kΩ" scale={1e3} />
        </>
      }
      footer="两级都是分压偏置共射电路（$R_c$=3 kΩ，β=100，射极电阻全旁路）。改变第二级偏置电阻只改变 $R_{i2}$（Q 点几乎不变）。"
    >
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        <Readout label={r`第一级空载 $\dot A_{uo1}$`} value={sig(t.A1open, 3)} />
        <Readout label="$R_{i2}$" value={formatSI(t.Ri2, "Ω")} tone="ss" testId="ld-ri2" />
        <Readout label={r`第一级带载 $\dot A_{u1}$`} value={sig(t.A1, 3)} tone="ac" />
        <Readout label={r`第二级 $\dot A_{u2}$`} value={sig(second.ac.Au, 3)} />
        <Readout label={r`正确：$\dot A_u=\dot A_{u1}\dot A_{u2}$`} value={sig(t.Au, 4)} tone="ok" testId="ld-au" />
        <Readout label={r`错误：$\dot A_{uo1}\dot A_{u2}$`} value={sig(t.A1open * second.ac.Au, 4)} tone="err" />
      </div>
      <p className="text-[13px] text-ink-2">
        <Rich text={r`第一级的负载是 $R_{c1}\para R_{i2}$，而 $R_{i2}$ 只有千欧级——第一级增益被“拉低”了一大截。把各级单独（空载）算出的增益直接相乘，会严重高估总增益。`} />
      </p>
    </WidgetCard>
  );
}

/* ───────────── 共射–共集 ───────────── */
export function CECCDemo() {
  const [RL, setRL] = useState(200);
  const [useCC, setUseCC] = useState(true);
  const cc = { ...DEFAULT_CC, topology: "divider" as const, Rb1: 100e3, Rb2: 100e3, Re: 2e3 };
  const two = analyzeCECC(CE1, cc, RL);
  const one = analyzeCE({ ...CE1, RL });
  return (
    <WidgetCard
      title="交互：加一级射极跟随器带重负载"
      testId="cecc-demo"
      controls={
        <>
          <ParamSlider label="负载 $R_L$" value={RL} onChange={setRL} min={8} max={20e3} log unit="Ω" testId="cc2-rl" />
          <Toggle checked={useCC} onChange={setUseCC} label="插入共集级" testId="cc2-toggle" />
        </>
      }
      footer="第一级：分压偏置共射（$R_c$=3 kΩ）。第二级：分压偏置射极跟随器（$R_{b1}=R_{b2}$=100 kΩ，$R_e$=2 kΩ，β=100），它的信号源内阻就是第一级输出电阻 $R_{c1}$。"
    >
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        <Readout label={r`总 $\dot A_u$`} value={sig(useCC ? two.Au : one.ac.Au, 4)} tone="ac" testId="cc2-au" />
        <Readout label="输出电阻 $R_o$" value={formatSI(useCC ? two.Ro : one.ac.Ro, "Ω")} />
        <Readout label="输入电阻 $R_i$" value={formatSI(useCC ? two.Ri : one.ac.Ri, "Ω")} />
        {useCC && <Readout label="$R_{i2}$（第一级负载）" value={formatSI(two.Ri2, "Ω")} tone="ss" />}
      </div>
      <p className="text-[13px] text-ink-2">
        <Rich text={`$R_L$=${formatSI(RL, "Ω")} 时：单级共射 $|\\dot A_u|=${sig(Math.abs(one.ac.Au), 3)}$；共射–共集 $|\\dot A_u|=${sig(Math.abs(two.Au), 3)}$。跟随器把 ${formatSI(RL, "Ω")} 的负载“放大”成 ${formatSI(two.Ri2, "Ω")} 交给第一级，自己又用 ${formatSI(two.Ro, "Ω")} 的低输出电阻驱动负载。`} />
      </p>
    </WidgetCard>
  );
}

/* ───────────── 零点漂移 ───────────── */
export function DriftDemo() {
  const [dT, setDT] = useState(20);
  const [A1, setA1] = useState(50);
  const [A2, setA2] = useState(50);
  const [A3, setA3] = useState(10);
  const d = atTemperature({ beta: 100, UBE: 0.7, ICBO: 0 }, 25 + dT).UBE - 0.7; // 每级 U_BE 的变化折合到该级输入
  const res = inputReferredDrift([d, d, d], [-A1, -A2, A3]);
  const total = A1 * A2 * A3;
  return (
    <WidgetCard
      title="交互：三级直接耦合放大电路的温漂"
      testId="drift-demo"
      controls={
        <>
          <ParamSlider label={r`温度变化 $\Delta T$`} value={dT} onChange={setDT} min={1} max={60} step={1} unit="°C" />
          <ParamSlider label="$|A_1|$" value={A1} onChange={setA1} min={1} max={200} log unit="" testId="dd-a1" />
          <ParamSlider label="$|A_2|$" value={A2} onChange={setA2} min={1} max={200} log unit="" />
          <ParamSlider label="$|A_3|$" value={A3} onChange={setA3} min={1} max={50} log unit="" />
        </>
      }
      footer="每级发射结电压随温度变化约 −2.2 mV/°C，折合为该级输入端的漂移电压。前两级为共射（反相），第三级同相。"
    >
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        <Readout label="总增益" value={sig(total, 3)} />
        <Readout label="输出端漂移" value={formatSI(res.output, "V")} tone="err" testId="dd-out" />
        <Readout label="折合到输入端" value={formatSI(res.input, "V")} tone="warn" testId="dd-in" />
      </div>
      <div className="space-y-2">
        {res.contributions.map((c, k) => {
          const frac = Math.abs(c) / res.contributions.reduce((a, b) => a + Math.abs(b), 0);
          return (
            <div key={k}>
              <div className="flex justify-between text-[12.5px]">
                <span>第 {k + 1} 级引起的输出漂移</span>
                <span className="num">
                  {formatSI(c, "V")}（{sig(frac * 100, 3)}%）
                </span>
              </div>
              <div className="mt-1 h-2.5 overflow-hidden rounded bg-sunken">
                <div className="h-full rounded bg-err" style={{ width: `${frac * 100}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[13px] text-ink-2">
        <Rich text={r`第一级的漂移被后面所有级放大，几乎决定了全部输出漂移；“折合到输入端的漂移”≈ 第一级自身的漂移。所以抑制温漂的关键在**输入级**——这正是差分放大电路的用武之地。`} />
      </p>
    </WidgetCard>
  );
}
