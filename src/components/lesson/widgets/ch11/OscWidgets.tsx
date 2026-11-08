"use client";

import { useMemo, useState } from "react";
import { r, Rich } from "@/components/math/Tex";
import { colpittsF0, crystalFreqs, crystalReactance, filterCutoff, filterQ, filterResponse, hartleyF0, lcTankImpedance, lcTankQ, simulateWien, threePointRule, wienF0, wienNetwork, type FilterKind } from "@/simulations/osc/osc";
import { cabs, cargDeg } from "@/simulations/signal/rc";
import { formatSI, sig } from "@/simulations/units";
import { Line, Plot } from "@/components/plot/Plot";
import { ParamSlider, Readout, Segmented, Toggle } from "@/components/ui/primitives";
import { ThreePoint } from "@/components/circuit/diagrams/ch11";
import { ChipGroup, fmtPow10, intTicks, Legend, PlotTitle, WidgetCard } from "../WidgetCard";

/* ───────────── 文氏网络的频率特性 ───────────── */
export function WienNetworkDemo() {
  const [R, setR] = useState(10e3);
  const [C, setC] = useState(10e-9);
  const f0 = wienF0(R, C);
  const lc = Math.log10(f0);
  const data = useMemo(() => {
    const m: Array<[number, number]> = [];
    const ph: Array<[number, number]> = [];
    for (let k = 0; k <= 200; k++) {
      const lf = lc - 2 + (4 * k) / 200;
      const F = wienNetwork(Math.pow(10, lf), f0);
      m.push([lf, cabs(F)]);
      ph.push([lf, cargDeg(F)]);
    }
    return { m, ph };
  }, [f0, lc]);
  return (
    <WidgetCard
      title="交互：RC 串并联网络的选频特性"
      testId="wien-network"
      wide
      controls={
        <>
          <ParamSlider label="$R$" value={R} onChange={setR} min={1e3} max={100e3} log unit="kΩ" scale={1e3} />
          <ParamSlider label="$C$" value={C} onChange={setC} min={1e-9} max={1e-6} log unit="nF" scale={1e-9} />
          <Readout label={r`$f_0=1/(2\pi RC)$`} value={formatSI(f0, "Hz")} tone="ac" testId="wn-f0" />
        </>
      }
      footer={r`$\dot F=\dfrac{\dot U_f}{\dot U_o}=\dfrac{1}{3+j\left(\dfrac{f}{f_0}-\dfrac{f_0}{f}\right)}$：只有在 $f=f_0$ 时相移为零且 $|\dot F|$ 最大，等于 1/3。`}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Plot height={200} ariaLabel="文氏网络幅频" x={{ domain: [lc - 2, lc + 2], ticks: intTicks(lc - 2, lc + 2), format: fmtPow10, label: "f / Hz" }} y={{ domain: [0, 0.36], ticks: [0, 0.1, 0.2, 1 / 3] , format: (x) => sig(x, 2) }}>
          {(s) => <Line points={data.m} s={s} color="var(--ac)" width={2.2} />}
        </Plot>
        <Plot height={200} ariaLabel="文氏网络相频" x={{ domain: [lc - 2, lc + 2], ticks: intTicks(lc - 2, lc + 2), format: fmtPow10, label: "f / Hz" }} y={{ domain: [-90, 90], ticks: [-90, -45, 0, 45, 90] }}>
          {(s) => <Line points={data.ph} s={s} color="var(--ss)" width={2.2} />}
        </Plot>
      </div>
    </WidgetCard>
  );
}

/* ───────────── 文氏桥振荡器：起振与稳幅 ───────────── */
export function WienStartup() {
  const [K, setK] = useState(3.2);
  const [limit, setLimit] = useState(true);
  const R = 10e3;
  const C = 15.9e-9;
  const sim = useMemo(() => simulateWien({ R, C, K, Ulim: limit ? 8 : 1e4, periods: 60, stepsPerPeriod: 60 }), [K, limit]);
  const f0 = wienF0(R, C);
  const pts = sim.t.map((t, k) => [t * f0, sim.uo[k]] as [number, number]);
  const step = Math.max(1, Math.floor(pts.length / 1200));
  const shown = pts.filter((_, k) => k % step === 0);
  const lim = Math.min(Math.max(1, ...shown.map((p) => Math.abs(p[1]))) * 1.1, 20);
  return (
    <WidgetCard
      title="交互：文氏桥振荡器的起振与稳幅（时域仿真）"
      testId="wien-startup"
      wide
      controls={
        <>
          <ParamSlider label="放大倍数 $A=1+R_f/R_1$" value={K} onChange={setK} min={2.6} max={3.6} step={0.01} unit="" testId="ws-k" />
          <Toggle checked={limit} onChange={setLimit} label="稳幅环节（增益随幅度增大而减小）" testId="ws-limit" />
          <div className="grid grid-cols-2 gap-1.5">
            <Readout label="环路增益 $AF$（$f_0$ 处）" value={sig(K / 3, 4)} tone={K > 3 ? "ok" : "err"} />
            <Readout label="稳态幅值" value={sim.amp < 1e-3 ? "衰减到 0" : formatSI(sim.amp, "V")} tone="ac" testId="ws-amp" />
            <Readout label="振荡频率" value={sim.freq ? formatSI(sim.freq, "Hz") : "—"} />
            <Readout label="$f_0$" value={formatSI(f0, "Hz")} />
          </div>
        </>
      }
      footer={r`$R$=10 kΩ、$C$=15.9 nF（$f_0$≈1 kHz）。仿真模型：理想运放构成同相放大器，输出 $u_O=U_{lim}\tanh(Au_+/U_{lim})$——幅度小时增益为 A，幅度大时增益自动下降（相当于二极管/热敏电阻稳幅）。初始只有 1 mV 的“噪声”。$A<3$：每绕一圈幅度变小，停振；$A>3$：幅度指数增长，直到稳幅环节把等效增益压到 3。关掉稳幅，输出会一直增长（实际电路中受电源限制而严重削波）。`}
    >
      <Plot height={240} ariaLabel="振荡器输出波形" x={{ domain: [0, 60], label: "t / T₀" }} y={{ domain: [-lim, lim], label: "V" }}>
        {(s) => <Line points={shown} s={s} color="var(--ch2)" width={1.2} />}
      </Plot>
    </WidgetCard>
  );
}

/* ───────────── LC 并联谐振 ───────────── */
export function LCTankDemo() {
  const [L, setL] = useState(100e-6);
  const [C, setC] = useState(1e-9);
  const [rr, setR] = useState(10);
  const q = lcTankQ(L, C, rr);
  const lc = Math.log10(q.f0);
  const data = (() => {
    const m: Array<[number, number]> = [];
    const ph: Array<[number, number]> = [];
    for (let k = 0; k <= 300; k++) {
      const lf = lc - 1 + (2 * k) / 300;
      const z = lcTankImpedance(Math.pow(10, lf), L, C, rr);
      m.push([lf, cabs(z) / 1e3]);
      ph.push([lf, cargDeg(z)]);
    }
    return { m, ph };
  })();
  return (
    <WidgetCard
      title="交互：LC 并联谐振回路"
      testId="lc-tank"
      wide
      controls={
        <>
          <ParamSlider label="$L$" value={L} onChange={setL} min={1e-6} max={10e-3} log unit="µH" scale={1e-6} />
          <ParamSlider label="$C$" value={C} onChange={setC} min={10e-12} max={100e-9} log unit="nF" scale={1e-9} />
          <ParamSlider label="损耗电阻 $r$" value={rr} onChange={setR} min={0.5} max={200} log unit="Ω" testId="lc-r" />
          <div className="grid grid-cols-2 gap-1.5">
            <Readout label="$f_0$" value={formatSI(q.f0, "Hz")} tone="ac" />
            <Readout label={r`$Q=\omega_0L/r$`} value={sig(q.Q, 3)} tone="ok" testId="lc-q" />
            <Readout label={r`谐振阻抗 $Z_0\approx L/(rC)$`} value={formatSI(q.Z0, "Ω")} />
            <Readout label="通频带 $f_0/Q$" value={formatSI(q.bw, "Hz")} />
          </div>
        </>
      }
      footer="谐振时回路呈纯电阻且阻抗最大；低于 $f_0$ 呈感性，高于 $f_0$ 呈容性。Q 越高，选频特性越尖锐，振荡频率越稳定。"
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Plot height={200} ariaLabel="LC 回路阻抗" x={{ domain: [lc - 1, lc + 1], ticks: intTicks(lc - 1, lc + 1), format: fmtPow10, label: "f / Hz" }} y={{ domain: [0, (q.Z0 / 1e3) * 1.15], label: "|Z| / kΩ" }}>
          {(s) => <Line points={data.m} s={s} color="var(--ac)" width={2.2} />}
        </Plot>
        <Plot height={200} ariaLabel="LC 回路阻抗相角" x={{ domain: [lc - 1, lc + 1], ticks: intTicks(lc - 1, lc + 1), format: fmtPow10, label: "f / Hz" }} y={{ domain: [-95, 95], ticks: [-90, 0, 90] }}>
          {(s) => <Line points={data.ph} s={s} color="var(--ss)" width={2.2} />}
        </Plot>
      </div>
    </WidgetCard>
  );
}

/* ───────────── 三点式判断与频率 ───────────── */
export function ThreePointDemo() {
  const [be, setBe] = useState<"L" | "C">("C");
  const [ce, setCe] = useState<"L" | "C">("C");
  const [bc, setBc] = useState<"L" | "C">("L");
  const res = threePointRule(be, ce, bc);
  const f = res.ok ? (res.kind === "电容三点式" ? colpittsF0(10e-6, 1e-9, 1e-9) : hartleyF0(5e-6, 5e-6, 0, 1e-9)) : NaN;
  const sel = (label: string, val: "L" | "C", set: (v: "L" | "C") => void) => (
    <Segmented
      size="sm"
      label={label}
      value={val}
      onChange={set}
      options={[
        { value: "C", label: `${label}：电容` },
        { value: "L", label: `${label}：电感` },
      ]}
    />
  );
  return (
    <WidgetCard
      title="交互：三点式振荡电路的相位条件"
      testId="three-point"
      controls={
        <>
          {sel("be", be, setBe)}
          {sel("ce", ce, setCe)}
          {sel("bc", bc, setBc)}
          <Readout label="结论" value={res.ok ? `可能振荡（${res.kind}）` : "不满足相位条件"} tone={res.ok ? "ok" : "err"} testId="tp-verdict" />
          {res.ok && <Readout label="示例频率" value={formatSI(f, "Hz")} />}
        </>
      }
      footer="判断口诀“射同基反”：与发射极相连的两个电抗（$X_{be}$、$X_{ce}$）必须同性质，与基极–集电极之间的 $X_{bc}$ 异性质。示例频率取 L=10 µH、$C_1=C_2$=1 nF（电容三点式）或 $L_1=L_2$=5 µH、C=1 nF（电感三点式）。"
    >
      <ThreePoint labels={{ be, ce, bc }} />
      <p className="text-[13px] text-ink-2">
        <Rich text={r`原因：共射放大本身反相 180°；$X_{be}$ 与 $X_{ce}$ 同性质时，反馈电压 $\dot U_f$（$X_{be}$ 上）与 $\dot U_o$（$X_{ce}$ 上）相对于发射极又反相 180°，合计 360°，满足正反馈。`} />
      </p>
    </WidgetCard>
  );
}

/* ───────────── 石英晶体 ───────────── */
export function CrystalDemo() {
  const Lq = 0.1;
  const Cq = 0.025e-12;
  const C0 = 5e-12;
  const { fs, fp } = crystalFreqs(Lq, Cq, C0);
  const data = useMemo(() => {
    const pts: Array<[number, number]> = [];
    for (let k = 0; k <= 600; k++) {
      const f = fs * (0.995 + (0.015 * k) / 600);
      const x = crystalReactance(f, Lq, Cq, C0);
      pts.push([(f / fs - 1) * 1e3, Math.max(-50, Math.min(50, x / 1e3))]);
    }
    return pts;
  }, [fs]);
  return (
    <WidgetCard
      title="交互：石英晶体的电抗–频率特性"
      testId="crystal"
      controls={
        <div className="grid grid-cols-1 gap-1.5">
          <Readout label="串联谐振 $f_s$" value={formatSI(fs, "Hz")} tone="ac" />
          <Readout label="并联谐振 $f_p$" value={formatSI(fp, "Hz")} tone="ss" />
          <Readout label="$(f_p-f_s)/f_s$" value={`${sig(((fp - fs) / fs) * 1e3, 3)} ‰`} />
        </div>
      }
      footer="等效电路：$L_q$=0.1 H、$C_q$=0.025 pF、$C_0$=5 pF。$f_s$ 与 $f_p$ 只相差千分之几，二者之间晶体呈感性——并联型晶体振荡器就让晶体工作在这一窄区间当作电感；串联型让它工作在 $f_s$（阻抗最小）。晶体的 Q 值高达 $10^4$～$10^6$，频率稳定度远高于 LC 回路。"
    >
      <PlotTitle>{String.raw`电抗 $X$（kΩ，截断在 ±50 kΩ）– 相对频偏 $(f/f_s-1)$（‰）`}</PlotTitle>
      <Plot height={220} ariaLabel="晶体电抗特性" x={{ domain: [-5, 10], label: "‰" }} y={{ domain: [-50, 50], label: "kΩ" }}>
        {(s) => (
          <g>
            <rect x={s.sx(0)} y={s.m.t} width={s.sx(((fp - fs) / fs) * 1e3) - s.sx(0)} height={s.ih} fill="var(--ok-soft)" opacity={0.7} />
            <Line points={data} s={s} color="var(--ac)" width={2} />
          </g>
        )}
      </Plot>
      <Legend items={[["感性区 $f_s<f<f_p$", "var(--ok)"]]} />
    </WidgetCard>
  );
}

/* ───────────── 有源滤波器 ───────────── */
export function FilterLab() {
  const [kind, setKind] = useState<FilterKind>("lp2");
  const [Aup, setAup] = useState(1.586);
  const [f0, setF0] = useState(1e3);
  const s = { kind, Aup, f0 };
  const unstable = kind.endsWith("2") && Aup >= 3;
  const fc = unstable ? NaN : filterCutoff(s);
  const data = useMemo(() => {
    if (unstable) return [];
    const pts: Array<[number, number]> = [];
    for (let k = 0; k <= 300; k++) {
      const lf = 1 + (4 * k) / 300;
      pts.push([lf, 20 * Math.log10(cabs(filterResponse(s, Math.pow(10, lf))))]);
    }
    return pts;
  }, [kind, Aup, f0, unstable]); // eslint-disable-line react-hooks/exhaustive-deps
  const pass = 20 * Math.log10(Aup);
  return (
    <WidgetCard
      title="交互：一阶与二阶有源滤波器"
      testId="filter-lab"
      wide
      controls={
        <>
          <ChipGroup
            label="类型"
            value={kind}
            onChange={setKind}
            testId="fl-kind"
            options={[
              { value: "lp1", label: "一阶低通" },
              { value: "hp1", label: "一阶高通" },
              { value: "lp2", label: "二阶低通" },
              { value: "hp2", label: "二阶高通" },
            ]}
          />
          <ParamSlider label="通带增益 $A_{up}=1+R_f/R_1$" value={Aup} onChange={setAup} min={1} max={3.2} step={0.001} unit="" testId="fl-aup" />
          <ParamSlider label={r`特征频率 $f_0=1/(2\pi RC)$`} value={f0} onChange={setF0} min={100} max={10e3} log unit="Hz" />
          <div className="grid grid-cols-2 gap-1.5">
            {kind.endsWith("2") && <Readout label="$Q=1/(3-A_{up})$" value={unstable ? "∞（不稳定）" : sig(filterQ(Aup), 3)} tone={unstable ? "err" : "ss"} testId="fl-q" />}
            <Readout label="−3 dB 截止频率" value={Number.isFinite(fc) ? formatSI(fc, "Hz") : "—"} tone="ok" testId="fl-fc" />
          </div>
        </>
      }
      footer={r`一阶：$\dot A_u=\dfrac{A_{up}}{1+jf/f_0}$，阻带斜率 −20 dB/十倍频。二阶压控电压源（等值 R、C）：$\dot A_u=\dfrac{A_{up}}{1-(f/f_0)^2+j\dfrac{f}{Qf_0}}$，阻带 −40 dB/十倍频；$A_{up}=1.586$（Q=0.707）时通带最平坦（巴特沃斯）；Q 越大 $f_0$ 附近越凸起；$A_{up}\ge3$ 时电路自激。`}
    >
      {unstable ? (
        <p className="text-[13.5px] text-err">
          <Rich text={r`$A_{up}\ge3$：$Q\to\infty$ 或为负，二阶电路的正反馈过强，产生自激振荡，不再是滤波器。`} />
        </p>
      ) : (
        <Plot height={240} ariaLabel="滤波器幅频特性" x={{ domain: [1, 5], ticks: intTicks(1, 5), format: fmtPow10, label: "f / Hz" }} y={{ domain: [pass - 50, pass + 15], label: "dB" }}>
          {(s2) => (
            <g>
              <Line points={[[1, pass - 3], [5, pass - 3]]} s={s2} color="var(--ink-3)" width={1} dash="3 3" />
              <Line points={data} s={s2} color="var(--ac)" width={2.4} />
            </g>
          )}
        </Plot>
      )}
    </WidgetCard>
  );
}
