"use client";

import { useMemo, useState } from "react";
import { r, Rich } from "@/components/math/Tex";
import { asymptoteDb, asymptotePhase, bandEdges, betaOfF, ceFrequency, hybridPi, identicalStages, multistageEstimate, poleResponse } from "@/simulations/freq/freq";
import { cabs, cargDeg, cornerFrequency, highPass, lowPass } from "@/simulations/signal/rc";
import { DEFAULT_DIVIDER, type CEParams } from "@/simulations/bjt/types";
import { formatSI, sig } from "@/simulations/units";
import { Line, Plot } from "@/components/plot/Plot";
import { ParamSlider, Readout, Segmented, Toggle } from "@/components/ui/primitives";
import { fmtPow10, intTicks, Legend, PlotTitle, WidgetCard } from "../WidgetCard";

function logSweep(lo: number, hi: number, n = 240) {
  return Array.from({ length: n + 1 }, (_, k) => lo + ((hi - lo) * k) / n);
}

/* ───────────── RC 电路的波特图 ───────────── */
export function RCBode() {
  const [kind, setKind] = useState<"lp" | "hp">("lp");
  const [R, setR] = useState(10e3);
  const [C, setC] = useState(10e-9);
  const fc = cornerFrequency(R, C);
  const lc = Math.log10(fc);
  const lo = Math.floor(lc) - 3;
  const hi = Math.floor(lc) + 3;
  const data = useMemo(() => {
    const m: Array<[number, number]> = [];
    const ma: Array<[number, number]> = [];
    const ph: Array<[number, number]> = [];
    const pa: Array<[number, number]> = [];
    for (const lf of logSweep(lo, hi)) {
      const f = Math.pow(10, lf);
      const h = kind === "lp" ? lowPass(f, fc) : highPass(f, fc);
      m.push([lf, 20 * Math.log10(cabs(h))]);
      ma.push([lf, asymptoteDb(kind, f, fc)]);
      ph.push([lf, cargDeg(h)]);
      pa.push([lf, asymptotePhase(kind, f, fc)]);
    }
    return { m, ma, ph, pa };
  }, [kind, fc, lo, hi]);
  return (
    <WidgetCard
      title="交互：一阶 RC 电路的波特图（实线精确、虚线渐近）"
      testId="rc-bode"
      wide
      controls={
        <>
          <Segmented
            size="sm"
            label="电路"
            value={kind}
            onChange={setKind}
            testId="rb-kind"
            options={[
              { value: "lp", label: "低通" },
              { value: "hp", label: "高通" },
            ]}
          />
          <ParamSlider label="$R$" value={R} onChange={setR} min={100} max={1e6} log unit="kΩ" scale={1e3} />
          <ParamSlider label="$C$" value={C} onChange={setC} min={10e-12} max={100e-6} log unit="nF" scale={1e-9} />
          <Readout label={r`转折频率 $f=1/(2\pi RC)$`} value={formatSI(fc, "Hz")} tone="ac" testId="rb-fc" />
        </>
      }
      footer="渐近波特图：幅频以转折频率为界，一段水平、一段斜率 ±20 dB/十倍频；在转折频率处与精确值相差最大，为 3 dB。相频在 0.1$f_c$～10$f_c$ 之间按 −45°/十倍频变化，最大误差约 5.7°。"
    >
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <PlotTitle>{String.raw`$20\lg|\dot A_u|$（dB）`}</PlotTitle>
          <Plot height={200} ariaLabel="RC 幅频特性" x={{ domain: [lo, hi], ticks: intTicks(lo, hi), format: fmtPow10, label: "f / Hz" }} y={{ domain: [-60, 5] }}>
            {(s) => (
              <g>
                <Line points={data.ma} s={s} color="var(--warn)" width={1.4} dash="5 3" />
                <Line points={data.m} s={s} color="var(--ac)" width={2.2} />
              </g>
            )}
          </Plot>
        </div>
        <div>
          <PlotTitle>{String.raw`$\varphi$（°）`}</PlotTitle>
          <Plot height={200} ariaLabel="RC 相频特性" x={{ domain: [lo, hi], ticks: intTicks(lo, hi), format: fmtPow10, label: "f / Hz" }} y={{ domain: kind === "lp" ? [-95, 5] : [-5, 95], ticks: kind === "lp" ? [-90, -45, 0] : [0, 45, 90] }}>
            {(s) => (
              <g>
                <Line points={data.pa} s={s} color="var(--warn)" width={1.4} dash="5 3" />
                <Line points={data.ph} s={s} color="var(--ss)" width={2.2} />
              </g>
            )}
          </Plot>
        </div>
      </div>
    </WidgetCard>
  );
}

/* ───────────── 放大电路频率响应的一般形状 ───────────── */
export function AmpShape() {
  const [fL, setFL] = useState(50);
  const [fH, setFH] = useState(200e3);
  const [Am, setAm] = useState(100);
  const resp = poleResponse(-Am, [fL], [fH]);
  const data = useMemo(() => logSweep(0, 8).map((lf) => [lf, 20 * Math.log10(cabs(resp(Math.pow(10, lf))))] as [number, number]), [fL, fH, Am]); // eslint-disable-line react-hooks/exhaustive-deps
  const ph = useMemo(() => logSweep(0, 8).map((lf) => [lf, cargDeg(resp(Math.pow(10, lf)))] as [number, number]), [fL, fH, Am]); // eslint-disable-line react-hooks/exhaustive-deps
  const top = 20 * Math.log10(Am);
  return (
    <WidgetCard
      title="交互：低频段、中频段、高频段"
      testId="amp-shape"
      wide
      controls={
        <>
          <ParamSlider label="中频增益 $|A_{um}|$" value={Am} onChange={setAm} min={1} max={1000} log unit="" />
          <ParamSlider label="下限频率 $f_L$" value={fL} onChange={setFL} min={1} max={10e3} log unit="Hz" />
          <ParamSlider label="上限频率 $f_H$" value={fH} onChange={setFH} min={10e3} max={10e6} log unit="kHz" scale={1e3} />
          <Readout label="通频带 $f_{bw}=f_H-f_L$" value={formatSI(fH - fL, "Hz")} tone="ok" />
        </>
      }
      footer="反相放大电路（中频相位 −180°）。低频段：耦合、旁路电容的容抗增大，增益下降并产生超前相移；高频段：晶体管结电容（及分布电容）的容抗减小，增益下降并产生滞后相移；中频段二者都可忽略，增益与频率无关。"
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Plot height={200} ariaLabel="放大电路幅频特性" x={{ domain: [0, 8], ticks: intTicks(0, 8), format: fmtPow10, label: "f / Hz" }} y={{ domain: [top - 45, top + 5], label: "dB" }}>
          {(s) => (
            <g>
              <rect x={s.sx(Math.log10(fL))} y={s.m.t} width={Math.max(0, s.sx(Math.log10(fH)) - s.sx(Math.log10(fL)))} height={s.ih} fill="var(--ok-soft)" opacity={0.6} />
              <Line points={[[0, top - 3], [8, top - 3]]} s={s} color="var(--ink-3)" width={1} dash="3 3" />
              <Line points={data} s={s} color="var(--ac)" width={2.2} />
            </g>
          )}
        </Plot>
        <Plot height={200} ariaLabel="放大电路相频特性" x={{ domain: [0, 8], ticks: intTicks(0, 8), format: fmtPow10, label: "f / Hz" }} y={{ domain: [-275, -85], ticks: [-270, -225, -180, -135, -90], label: "°" }}>
          {(s) => <Line points={ph.map(([x, y]) => [x, y > 0 ? y - 360 : y] as [number, number])} s={s} color="var(--ss)" width={2.2} />}
        </Plot>
      </div>
    </WidgetCard>
  );
}

/* ───────────── 混合 π 参数与 β(f) ───────────── */
export function HybridPiDemo() {
  const [IEQ, setIEQ] = useState(1e-3);
  const [beta, setBeta] = useState(100);
  const [fT, setFT] = useState(300e6);
  const [Cmu, setCmu] = useState(2e-12);
  const h = hybridPi({ IEQ, beta, rbb: 200, fT, Cmu });
  const data = useMemo(() => logSweep(3, 10).map((lf) => [lf, 20 * Math.log10(cabs(betaOfF(beta, h.fbeta, Math.pow(10, lf))))] as [number, number]), [beta, h.fbeta]);
  return (
    <WidgetCard
      title={r`交互：混合 π 参数与 $|\dot\beta(f)|$`}
      testId="hybrid-pi"
      controls={
        <>
          <ParamSlider label="$I_{EQ}$" value={IEQ} onChange={setIEQ} min={0.1e-3} max={10e-3} log unit="mA" scale={1e-3} />
          <ParamSlider label={r`$\beta_0$`} value={beta} onChange={setBeta} min={20} max={400} log unit="" />
          <ParamSlider label="特征频率 $f_T$" value={fT} onChange={setFT} min={10e6} max={2e9} log unit="MHz" scale={1e6} />
          <ParamSlider label={r`$C_\mu$`} value={Cmu} onChange={setCmu} min={0.5e-12} max={10e-12} log unit="pF" scale={1e-12} />
        </>
      }
      footer={r`$g_m=I_{EQ}/U_T$，$r_{b'e}=(1+\beta_0)U_T/I_{EQ}$，$C_\pi\approx\dfrac{g_m}{2\pi f_T}-C_\mu$，$f_\beta=\dfrac1{2\pi r_{b'e}(C_\pi+C_\mu)}$。图中 $|\dot\beta|$ 在 $f_\beta$ 处下降 3 dB，此后以 −20 dB/十倍频下降，在 $f_T$ 处降到 1（0 dB）。`}
    >
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        <Readout label="$g_m$" value={`${sig(h.gm * 1e3, 3)} mS`} tone="ss" />
        <Readout label="$r_{b'e}$" value={formatSI(h.rbpe, "Ω")} />
        <Readout label={r`$C_\pi$`} value={formatSI(h.Cpi, "F")} tone="ac" testId="hp-cpi" />
        <Readout label={r`$f_\beta$`} value={formatSI(h.fbeta, "Hz")} tone="warn" testId="hp-fbeta" />
      </div>
      <Plot height={200} ariaLabel="β 的频率特性" x={{ domain: [3, 10], ticks: intTicks(3, 10), format: fmtPow10, label: "f / Hz" }} y={{ domain: [-20, 55], label: "dB" }}>
        {(s) => (
          <g>
            <Line points={[[3, 0], [10, 0]]} s={s} color="var(--ink-3)" width={1} dash="3 3" />
            <Line points={data} s={s} color="var(--ac)" width={2.2} />
            <line x1={s.sx(Math.log10(h.fbeta))} x2={s.sx(Math.log10(h.fbeta))} y1={s.m.t} y2={s.m.t + s.ih} stroke="var(--warn)" strokeDasharray="3 3" />
            <line x1={s.sx(Math.log10(fT))} x2={s.sx(Math.log10(fT))} y1={s.m.t} y2={s.m.t + s.ih} stroke="var(--ok)" strokeDasharray="3 3" />
          </g>
        )}
      </Plot>
      <Legend items={[["$20\\lg|\\dot\\beta|$", "var(--ac)"], ["$f_\\beta$", "var(--warn)", "3 3"], ["$f_T$", "var(--ok)", "3 3"]]} />
    </WidgetCard>
  );
}

/* ───────────── 单管共射的完整频率响应 ───────────── */
export function CEFreqLab() {
  const [Rs, setRs] = useState(600);
  const [RL, setRL] = useState(3e3);
  const [C1, setC1] = useState(10e-6);
  const [Ce, setCe] = useState(100e-6);
  const [Cmu, setCmu] = useState(3e-12);
  const [miller, setMiller] = useState(true);
  const p: CEParams = { ...DEFAULT_DIVIDER, Re1: 0, Re2: 1.2e3, hasCe: true, Rs, RL, C1, C2: 10e-6, Ce };
  const res = ceFrequency(p, { fT: 200e6, Cmu }, { miller });
  const edges = bandEdges(res.at, Math.sqrt(Math.max(res.fL, 1) * res.fH));
  const data = (() => {
    const m: Array<[number, number]> = [];
    const ph: Array<[number, number]> = [];
    for (const lf of logSweep(0, 9)) {
      const h = res.at(Math.pow(10, lf));
      m.push([lf, 20 * Math.log10(cabs(h))]);
      const a = cargDeg(h);
      ph.push([lf, a > 0 ? a - 360 : a]);
    }
    return { m, ph };
  })();
  const top = 20 * Math.log10(Math.abs(res.Ausm));
  return (
    <WidgetCard
      title="交互：分压偏置共射电路的完整频率响应"
      testId="ce-freq"
      wide
      controls={
        <>
          <ParamSlider label="$R_s$" value={Rs} onChange={setRs} min={50} max={20e3} log unit="kΩ" scale={1e3} testId="cf-rs" />
          <ParamSlider label="$R_L$" value={RL} onChange={setRL} min={300} max={100e3} log unit="kΩ" scale={1e3} />
          <ParamSlider label="耦合电容 $C_1$" value={C1} onChange={setC1} min={0.1e-6} max={100e-6} log unit="µF" scale={1e-6} />
          <ParamSlider label="旁路电容 $C_e$" value={Ce} onChange={setCe} min={1e-6} max={1000e-6} log unit="µF" scale={1e-6} />
          <ParamSlider label={r`$C_\mu$`} value={Cmu} onChange={setCmu} min={0.5e-12} max={10e-12} log unit="pF" scale={1e-12} />
          <Toggle checked={miller} onChange={setMiller} label="计入米勒效应" testId="cf-miller" />
        </>
      }
      footer={r`Q 点同分压偏置默认电路，$f_T$=200 MHz。下限频率用短路时间常数法（每个电容视为一个独立极点），上限频率用米勒近似的单极点 $f_H=1/(2\pi R C_\pi')$，$R=r_{b'e}\para(r_{bb'}+R_s\para R_B)$。关掉米勒效应开关，可以看到 $C_\mu$ 被放大 $(1+g_mR_L')$ 倍的影响有多大。`}
    >
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        <Readout label={r`$|\dot A_{usm}|$`} value={sig(Math.abs(res.Ausm), 3)} tone="ac" />
        <Readout label={r`$C_\pi'$`} value={formatSI(res.CpiMiller, "F")} tone="warn" testId="cf-cm" />
        <Readout label="$f_L$（数值 −3 dB）" value={formatSI(edges.fL, "Hz")} />
        <Readout label="$f_H$（数值 −3 dB）" value={formatSI(edges.fH, "Hz")} tone="ok" testId="cf-fh" />
        <Readout label="$f_{C1}$ / $f_{Ce}$" value={`${formatSI(res.hp.fC1, "Hz")} / ${formatSI(res.hp.fCe, "Hz")}`} />
        <Readout label="增益带宽积" value={formatSI(res.GBW, "Hz")} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Plot height={200} ariaLabel="共射电路幅频特性" x={{ domain: [0, 9], ticks: intTicks(0, 9), format: fmtPow10, label: "f / Hz" }} y={{ domain: [top - 50, top + 5], label: "dB" }}>
          {(s) => (
            <g>
              <Line points={[[0, top - 3], [9, top - 3]]} s={s} color="var(--ink-3)" width={1} dash="3 3" />
              <Line points={data.m} s={s} color="var(--ac)" width={2.2} />
            </g>
          )}
        </Plot>
        <Plot height={200} ariaLabel="共射电路相频特性" x={{ domain: [0, 9], ticks: intTicks(0, 9), format: fmtPow10, label: "f / Hz" }} y={{ domain: [-300, -60], ticks: [-270, -180, -90], label: "°" }}>
          {(s) => <Line points={data.ph} s={s} color="var(--ss)" width={2.2} />}
        </Plot>
      </div>
      <p className="text-[13px] text-ink-2">
        <Rich text={r`把 $R_s$ 调大：$f_H$ 明显下降——米勒电容要通过信号源内阻充放电。把 $C_e$ 调小：$f_L$ 升高——从 $C_e$ 看进去的电阻只有十几欧（射极输出电阻），它往往决定下限频率。`} />
      </p>
    </WidgetCard>
  );
}

/* ───────────── 多级放大电路的带宽 ───────────── */
export function MultistageBW() {
  const [n, setN] = useState(2);
  const [fL, setFL] = useState(100);
  const [fH, setFH] = useState(1e6);
  const fLs = Array(n).fill(fL);
  const fHs = Array(n).fill(fH);
  const resp = poleResponse(1, fLs, fHs);
  const e = bandEdges(resp, Math.sqrt(fL * fH));
  const est = multistageEstimate(fLs, fHs);
  const ex = identicalStages(n, fL, fH);
  const data = useMemo(() => logSweep(0, 8).map((lf) => [lf, 20 * Math.log10(cabs(resp(Math.pow(10, lf))))] as [number, number]), [n, fL, fH]); // eslint-disable-line react-hooks/exhaustive-deps
  const one = useMemo(() => logSweep(0, 8).map((lf) => [lf, 20 * Math.log10(cabs(poleResponse(1, [fL], [fH])(Math.pow(10, lf))))] as [number, number]), [fL, fH]);
  return (
    <WidgetCard
      title="交互：n 级相同放大电路级联后的通频带"
      testId="multi-bw"
      controls={
        <>
          <ParamSlider label="级数 $n$" value={n} onChange={(x) => setN(Math.round(x))} min={1} max={5} step={1} unit="" testId="mb-n" />
          <ParamSlider label="单级 $f_L$" value={fL} onChange={setFL} min={1} max={1e3} log unit="Hz" />
          <ParamSlider label="单级 $f_H$" value={fH} onChange={setFH} min={10e3} max={10e6} log unit="kHz" scale={1e3} />
          <div className="grid grid-cols-2 gap-1.5">
            <Readout label="总 $f_L$（数值）" value={formatSI(e.fL, "Hz")} />
            <Readout label="总 $f_H$（数值）" value={formatSI(e.fH, "Hz")} tone="ok" testId="mb-fh" />
            <Readout label="估算 $f_H$" value={formatSI(est.fH, "Hz")} />
            <Readout label={r`公式 $f_H\sqrt{2^{1/n}-1}$`} value={formatSI(ex.fH, "Hz")} />
          </div>
        </>
      }
      footer="各级中频增益归一化为 1（0 dB）。每级在 $f_H$ 处只下降 3 dB，但 n 级叠加后在 $f_H$ 处下降 3n dB，所以总的上限频率低于单级、下限频率高于单级：级数越多，通频带越窄。"
    >
      <Plot height={220} ariaLabel="多级放大电路幅频特性" x={{ domain: [0, 8], ticks: intTicks(0, 8), format: fmtPow10, label: "f / Hz" }} y={{ domain: [-30, 3], label: "dB" }}>
        {(s) => (
          <g>
            <Line points={[[0, -3], [8, -3]]} s={s} color="var(--ink-3)" width={1} dash="3 3" />
            <Line points={one} s={s} color="var(--ink-3)" width={1.4} dash="5 3" />
            <Line points={data} s={s} color="var(--ac)" width={2.4} />
          </g>
        )}
      </Plot>
      <Legend items={[["单级", "var(--ink-3)", "5 3"], [`${n} 级级联`, "var(--ac)"]]} />
    </WidgetCard>
  );
}
