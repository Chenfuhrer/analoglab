"use client";

import { useMemo, useState } from "react";
import { r, Rich } from "@/components/math/Tex";
import { clipOut, designLinear, evalLinear, inverting, invertingSum, nonInverting, openLoop, schmittThresholds, simulateComparator, simulateDifferentiator, simulateIntegrator, subtractor, type InputShape, type OpAmpModel } from "@/simulations/opamp/opamp";
import { formatSI, sig } from "@/simulations/units";
import { Line, Plot } from "@/components/plot/Plot";
import { ParamSlider, Readout, Segmented, Toggle } from "@/components/ui/primitives";
import { ChipGroup, fmtPow10, intTicks, Legend, PlotTitle, WidgetCard } from "../WidgetCard";

/* ───────────── 开环传输特性 ───────────── */
export function OpenLoopDemo() {
  const [lgA, setLgA] = useState(5);
  const [UOM, setUOM] = useState(13);
  const m: OpAmpModel = { Aod: Math.pow(10, lgA), UOM, rid: 2e6 };
  const span = (2 * UOM) / m.Aod;
  const pts = useMemo(() => Array.from({ length: 241 }, (_, k) => {
    const u = -span + (2 * span * k) / 240;
    return [u * 1e6, openLoop(u, 0, m)] as [number, number];
  }), [lgA, UOM]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <WidgetCard
      title="交互：运放的开环电压传输特性"
      testId="open-loop"
      controls={
        <>
          <ParamSlider label={r`$\lg A_{od}$`} value={lgA} onChange={setLgA} min={3} max={7} step={0.1} unit="" testId="ol-a" />
          <ParamSlider label="$U_{OM}$" value={UOM} onChange={setUOM} min={3} max={15} step={0.5} unit="V" />
          <div className="grid grid-cols-2 gap-1.5">
            <Readout label="$A_{od}$" value={sig(m.Aod, 3)} />
            <Readout label={r`线性区宽度 $\pm U_{OM}/A_{od}$`} value={`±${formatSI(UOM / m.Aod, "V")}`} tone="warn" testId="ol-range" />
          </div>
        </>
      }
      footer={r`横轴为差模输入 $u_+-u_-$（µV）。线性区只有几十到几百微伏：开环使用时，哪怕 1 mV 的输入或噪声都会使输出饱和在 $\pm U_{OM}$。所以运放作线性放大时**必须引入深度负反馈**。`}
    >
      <Plot height={230} ariaLabel="开环传输特性" x={{ domain: [-span * 1e6, span * 1e6], label: "u_+ − u_- / µV" }} y={{ domain: [-UOM * 1.2, UOM * 1.2], label: "u_O / V" }}>
        {(s) => <Line points={pts} s={s} color="var(--ac)" width={2.4} />}
      </Plot>
    </WidgetCard>
  );
}

/* ───────────── 虚短与虚断 ───────────── */
export function VirtualShortDemo() {
  const [lgA, setLgA] = useState(5);
  const [ui, setUi] = useState(0.5);
  const R1 = 10e3;
  const Rf = 100e3;
  const m: OpAmpModel = { Aod: Math.pow(10, lgA), UOM: 13, rid: 2e6 };
  const inv = inverting(R1, Rf, m);
  const uo = clipOut(inv.actual * ui, m.UOM);
  const uN = -uo / m.Aod;
  const i1 = (ui - uN) / R1;
  const iIn = uN / m.rid;
  return (
    <WidgetCard
      title="交互：有限开环增益下的“虚地”"
      testId="virtual-short"
      controls={
        <>
          <ParamSlider label={r`$\lg A_{od}$`} value={lgA} onChange={setLgA} min={2} max={7} step={0.1} unit="" testId="vs-a" />
          <ParamSlider label="$u_I$" value={ui} onChange={setUi} min={-1.5} max={1.5} step={0.01} unit="V" />
        </>
      }
      footer="反相比例电路 $R_1$=10 kΩ、$R_f$=100 kΩ，运放 $r_{id}$=2 MΩ。反相端电位 $u_-=-u_O/A_{od}$，只有微伏级——“虚地”；流入运放的电流 $u_-/r_{id}$ 只有皮安级——“虚断”。$A_{od}$ 越大，二者越接近零。若输出饱和，虚短就不再成立。"
    >
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        <Readout label="$u_O$" value={formatSI(uo, "V")} tone="ac" />
        <Readout label="反相端电位 $u_-$" value={formatSI(uN, "V")} tone="warn" testId="vs-un" />
        <Readout label="流过 $R_1$ 的电流" value={formatSI(i1, "A")} />
        <Readout label="流入运放的电流" value={formatSI(iIn, "A")} tone="ss" />
        <Readout label="闭环增益（精确）" value={sig(inv.actual, 6)} />
        <Readout label="相对误差" value={`${sig(inv.error * 100, 3)} %`} />
      </div>
      {Math.abs(inv.actual * ui) > m.UOM && (
        <p className="text-[13px] text-err">
          <Rich text={r`输出已饱和：$u_O=\pm U_{OM}$ 不再随输入变化，反相端电位明显偏离 0——运放工作在非线性区，虚短不成立。`} />
        </p>
      )}
    </WidgetCard>
  );
}

/* ───────────── 比较器 ───────────── */
export function ComparatorDemo() {
  const [hyst, setHyst] = useState(true);
  const [R1, setR1] = useState(10e3);
  const [noise, setNoise] = useState(0.4);
  const UZ = 6;
  const R2 = 30e3;
  const th = schmittThresholds(R1, R2, UZ);
  const data = useMemo(() => {
    const n = 600;
    const ui = Array.from({ length: n }, (_, k) => 4 * Math.sin((2 * Math.PI * k) / n) + noise * Math.sin(k * 2.3) * Math.cos(k * 0.71));
    const uo = simulateComparator(ui, hyst ? { hyst: true, UTp: th.UTp, UTm: th.UTm, UZ } : { hyst: false, UT: 0, UZ });
    return { ui: ui.map((u, k) => [k / n, u] as [number, number]), uo: uo.map((u, k) => [k / n, u] as [number, number]) };
  }, [hyst, R1, noise]); // eslint-disable-line react-hooks/exhaustive-deps
  const flips = data.uo.slice(1).filter((p, k) => p[1] !== data.uo[k][1]).length;
  return (
    <WidgetCard
      title="交互：单限比较器 vs 滞回比较器（反相输入）"
      testId="comparator-demo"
      controls={
        <>
          <Toggle checked={hyst} onChange={setHyst} label="引入正反馈（滞回）" testId="cmp-hyst" />
          {hyst && <ParamSlider label="$R_1$（$R_2$=30 kΩ）" value={R1} onChange={setR1} min={1e3} max={30e3} log unit="kΩ" scale={1e3} />}
          <ParamSlider label="输入噪声幅度" value={noise} onChange={setNoise} min={0} max={1.5} step={0.01} unit="V" />
          <div className="grid grid-cols-2 gap-1.5">
            <Readout label="$U_{T+}$" value={hyst ? formatSI(th.UTp, "V") : "0 V"} />
            <Readout label="$U_{T-}$" value={hyst ? formatSI(th.UTm, "V") : "0 V"} />
            <Readout label={r`回差 $\Delta U_T$`} value={hyst ? formatSI(th.width, "V") : "0"} tone="ss" />
            <Readout label="一周期内翻转次数" value={String(flips)} tone={flips > 2 ? "err" : "ok"} testId="cmp-flips" />
          </div>
        </>
      }
      footer={r`输出限幅 $\pm U_Z$=±6 V。单限比较器的阈值为 0：输入在 0 附近有噪声时，输出会来回跳变；滞回比较器的阈值 $U_{T\pm}=\pm\frac{R_1}{R_1+R_2}U_Z$，只要回差大于噪声峰峰值，就只翻转一次。比较器中运放工作在非线性区，**虚短不成立**（虚断仍成立）。`}
    >
      <Plot height={240} ariaLabel="比较器输入与输出" x={{ domain: [0, 1], label: "t / T" }} y={{ domain: [-7, 7], label: "V" }}>
        {(s) => (
          <g>
            {hyst && (
              <>
                <Line points={[[0, th.UTp], [1, th.UTp]]} s={s} color="var(--warn)" width={1} dash="3 3" />
                <Line points={[[0, th.UTm], [1, th.UTm]]} s={s} color="var(--warn)" width={1} dash="3 3" />
              </>
            )}
            <Line points={data.ui} s={s} color="var(--ch1)" width={1.4} />
            <Line points={data.uo} s={s} color="var(--ch2)" width={2.2} />
          </g>
        )}
      </Plot>
      <Legend items={[["$u_I$（含噪声）", "var(--ch1)"], ["$u_O$", "var(--ch2)"], ["阈值", "var(--warn)", "3 3"]]} />
    </WidgetCard>
  );
}

/* ───────────── 比例运算实验 ───────────── */
export function ProportionalLab() {
  const [mode, setMode] = useState<"inv" | "noninv" | "follower">("inv");
  const [R1, setR1] = useState(10e3);
  const [Rf, setRf] = useState(50e3);
  const [amp, setAmp] = useState(1);
  const m: OpAmpModel = { Aod: 2e5, UOM: 13, rid: 2e6 };
  const res = mode === "inv" ? inverting(R1, Rf, m) : mode === "noninv" ? nonInverting(R1, Rf, m) : nonInverting(Infinity, 0, m);
  const wave = useMemo(() => {
    const ui: Array<[number, number]> = [];
    const uo: Array<[number, number]> = [];
    for (let k = 0; k <= 200; k++) {
      const t = k / 200;
      const u = amp * Math.sin(2 * Math.PI * 2 * t);
      ui.push([t, u]);
      uo.push([t, clipOut(res.actual * u, m.UOM)]);
    }
    return { ui, uo };
  }, [res.actual, amp]); // eslint-disable-line react-hooks/exhaustive-deps
  const sat = Math.abs(res.actual * amp) > m.UOM;
  return (
    <WidgetCard
      title="交互：反相比例、同相比例与电压跟随器"
      testId="prop-lab"
      wide
      controls={
        <>
          <Segmented
            size="sm"
            label="电路"
            value={mode}
            onChange={setMode}
            testId="pl-mode"
            options={[
              { value: "inv", label: "反相" },
              { value: "noninv", label: "同相" },
              { value: "follower", label: "跟随" },
            ]}
          />
          {mode !== "follower" && (
            <>
              <ParamSlider label="$R_1$" value={R1} onChange={setR1} min={1e3} max={100e3} log unit="kΩ" scale={1e3} />
              <ParamSlider label="$R_f$" value={Rf} onChange={setRf} min={1e3} max={1e6} log unit="kΩ" scale={1e3} testId="pl-rf" />
            </>
          )}
          <ParamSlider label="输入幅值" value={amp} onChange={setAmp} min={0.01} max={5} log unit="V" />
        </>
      }
      footer={r`运放 $A_{od}=2\times10^5$、$r_{id}$=2 MΩ、$U_{OM}$=±13 V。增益理论值按虚短虚断计算；输出超过 ±13 V 时削波。`}
    >
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        <Readout label="理想 $A_u$" value={sig(res.ideal, 4)} tone="ac" testId="pl-au" />
        <Readout label="输入电阻 $R_i$" value={formatSI(res.Ri, "Ω")} />
        <Readout label="相位" value={res.ideal < 0 ? "反相" : "同相"} />
        <Readout label="状态" value={sat ? "输出饱和" : "线性"} tone={sat ? "err" : "ok"} testId="pl-sat" />
      </div>
      <Plot height={220} ariaLabel="比例运算电路输入输出波形" x={{ domain: [0, 1], label: "t" }} y={{ domain: [-15, 15], label: "V" }}>
        {(s) => (
          <g>
            <Line points={[[0, 13], [1, 13]]} s={s} color="var(--err)" width={1} dash="3 3" />
            <Line points={[[0, -13], [1, -13]]} s={s} color="var(--err)" width={1} dash="3 3" />
            <Line points={wave.ui} s={s} color="var(--ch1)" width={1.6} />
            <Line points={wave.uo} s={s} color="var(--ch2)" width={2.4} />
          </g>
        )}
      </Plot>
      <Legend items={[["$u_I$", "var(--ch1)"], ["$u_O$", "var(--ch2)"], ["$\\pm U_{OM}$", "var(--err)", "3 3"]]} />
    </WidgetCard>
  );
}

/* ───────────── 有限开环增益的误差 ───────────── */
export function FiniteGainError() {
  const [gain, setGain] = useState(100);
  const curve = useMemo(() => Array.from({ length: 121 }, (_, k) => {
    const lgA = 2 + (5 * k) / 120;
    const res = nonInverting(1e3, (gain - 1) * 1e3, { Aod: Math.pow(10, lgA), UOM: Infinity, rid: Infinity });
    return [lgA, Math.log10(Math.abs(res.error) * 100)] as [number, number];
  }), [gain]);
  const at = nonInverting(1e3, (gain - 1) * 1e3, { Aod: 1e5, UOM: Infinity, rid: Infinity });
  return (
    <WidgetCard
      title="交互：开环增益有限时闭环增益的相对误差"
      testId="finite-gain"
      controls={
        <>
          <ParamSlider label="理想闭环增益 $1+R_f/R_1$" value={gain} onChange={setGain} min={1} max={10000} log unit="" testId="fg-gain" />
          <Readout label="$A_{od}=10^5$ 时误差" value={`${sig(at.error * 100, 3)} %`} tone="warn" testId="fg-err" />
        </>
      }
      footer={r`同相比例 $A_f=\dfrac{1+R_f/R_1}{1+(1+R_f/R_1)/A_{od}}$，相对误差约为 $-(1+R_f/R_1)/A_{od}$：闭环增益越大、开环增益越小，误差越大。这正是“深度负反馈”中“深度”二字的含义（第 8 章）。`}
    >
      <PlotTitle>{String.raw`相对误差 $|\delta|$（%，对数坐标）– $\lg A_{od}$`}</PlotTitle>
      <Plot height={220} ariaLabel="闭环增益误差" x={{ domain: [2, 7], label: "lg A_od" }} y={{ domain: [-4, 2], ticks: intTicks(-4, 2), format: fmtPow10, label: "%" }}>
        {(s) => <Line points={curve} s={s} color="var(--warn)" width={2.4} />}
      </Plot>
    </WidgetCard>
  );
}

/* ───────────── 求和、减法 ───────────── */
export function SumSubDemo() {
  const [mode, setMode] = useState<"sum" | "sub">("sum");
  const [u1, setU1] = useState(0.5);
  const [u2, setU2] = useState(-0.3);
  const [u3, setU3] = useState(0.2);
  const [mis, setMis] = useState(0);
  const sum = invertingSum([10e3, 20e3, 50e3], 100e3, [u1, u2, u3]);
  const sub = subtractor(10e3, 50e3, 10e3, 50e3 * (1 + mis), u1, u2);
  return (
    <WidgetCard
      title="交互：求和与减法运算"
      testId="sumsub"
      controls={
        <>
          <Segmented
            size="sm"
            label="电路"
            value={mode}
            onChange={setMode}
            options={[
              { value: "sum", label: "反相求和" },
              { value: "sub", label: "减法" },
            ]}
          />
          <ParamSlider label="$u_{I1}$" value={u1} onChange={setU1} min={-2} max={2} step={0.01} unit="V" testId="ss-u1" />
          <ParamSlider label="$u_{I2}$" value={u2} onChange={setU2} min={-2} max={2} step={0.01} unit="V" />
          {mode === "sum" ? <ParamSlider label="$u_{I3}$" value={u3} onChange={setU3} min={-2} max={2} step={0.01} unit="V" /> : <ParamSlider label={r`$R_3$ 相对误差`} value={mis} onChange={setMis} min={-0.05} max={0.05} step={0.001} unit="%" scale={0.01} />}
        </>
      }
      footer={mode === "sum" ? "反相求和：$R_1$=10 kΩ、$R_2$=20 kΩ、$R_3$=50 kΩ、$R_f$=100 kΩ，$u_O=-(10u_{I1}+5u_{I2}+2u_{I3})$。反相端是虚地，各输入电流互不影响，可以分别调节各路的系数。" : "减法：$R_1=R_2$=10 kΩ、$R_f=R_3$=50 kΩ，匹配时 $u_O=5(u_{I2}-u_{I1})$。电阻失配会产生共模增益，降低共模抑制比——仪表放大器用精密匹配电阻或三运放结构解决这个问题。"}
    >
      {mode === "sum" ? (
        <div className="grid grid-cols-2 gap-1.5">
          <Readout label="$u_O$" value={formatSI(sum, "V")} tone="ac" testId="ss-uo" />
          <Readout label="各路贡献" value={`${sig(-10 * u1, 3)} / ${sig(-5 * u2, 3)} / ${sig(-2 * u3, 3)}`} />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          <Readout label="$u_O$" value={formatSI(sub.uO, "V")} tone="ac" testId="ss-uo" />
          <Readout label="差模增益" value={sig(sub.Ad, 4)} />
          <Readout label="共模增益" value={sig(sub.Ac, 3)} tone="warn" />
          <Readout label="$K_{CMR}$" value={Number.isFinite(sub.KCMR) ? `${sig(20 * Math.log10(sub.KCMR), 3)} dB` : "∞"} tone="ok" />
        </div>
      )}
    </WidgetCard>
  );
}

/* ───────────── 线性组合设计器 ───────────── */
export function LinearDesigner() {
  const [a1, setA1] = useState(2);
  const [a2, setA2] = useState(0);
  const [b1, setB1] = useState(3);
  const [b2, setB2] = useState(0);
  const a = [a1, a2].filter((x) => x > 0);
  const b = [b1, b2].filter((x) => x > 0);
  const d = designLinear(a.length ? a : [0.0001], b, 100e3);
  const test = evalLinear(d, a.map(() => 1), b.map(() => 0));
  const fmt = (x: number) => (Number.isFinite(x) ? formatSI(x, "Ω") : "不接");
  return (
    <WidgetCard
      title="交互：设计 $u_O=a_1u_{P1}+a_2u_{P2}-b_1u_{N1}-b_2u_{N2}$"
      testId="linear-designer"
      controls={
        <>
          <ParamSlider label="$a_1$（同相端）" value={a1} onChange={setA1} min={0} max={10} step={0.1} unit="" testId="ld-a1" />
          <ParamSlider label="$a_2$（同相端）" value={a2} onChange={setA2} min={0} max={10} step={0.1} unit="" />
          <ParamSlider label="$b_1$（反相端）" value={b1} onChange={setB1} min={0} max={10} step={0.1} unit="" />
          <ParamSlider label="$b_2$（反相端）" value={b2} onChange={setB2} min={0} max={10} step={0.1} unit="" />
        </>
      }
      footer={r`设计方法：取 $R_f$=100 kΩ，反相端各电阻 $R_{Nj}=R_f/b_j$；同相端满足 $a_i=N\dfrac{R_P}{R_{Pi}}$，其中 $N=1+R_f/R_N$，并令同相端、反相端对地电阻相等（$R_P=R_N\para R_f$，减小偏置电流的影响）。$\sum a_i>N$ 时需在反相端另接对地电阻 $R_g$。`}
    >
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        <Readout label="$R_f$" value={fmt(d.Rf)} />
        {d.Rneg.map((x, k) => (
          <Readout key={`n${k}`} label={`反相端 $R_{N${k + 1}}$`} value={fmt(x)} tone="ac" />
        ))}
        {a.length > 0 &&
          d.Rpos.map((x, k) => (
            <Readout key={`p${k}`} label={`同相端 $R_{P${k + 1}}$`} value={fmt(x)} tone="dc" testId={k === 0 ? "ld-rp1" : undefined} />
          ))}
        <Readout label="同相端对地 $R_p$" value={fmt(d.Rp)} />
        <Readout label="反相端对地 $R_g$" value={fmt(d.Rg)} />
      </div>
      <p className="text-[13px] text-ink-2">
        <Rich text={`验证：令所有同相输入为 1 V、反相输入为 0，按所设计的电阻计算得 $u_O=${sig(test, 4)}$ V，应等于 $\\sum a_i=${sig(a.reduce((s, x) => s + x, 0), 4)}$。`} />
      </p>
    </WidgetCard>
  );
}

/* ───────────── 积分与微分 ───────────── */
export function IntDiffDemo({ initial = "int" as "int" | "diff" }) {
  const [kind, setKind] = useState<"int" | "diff">(initial);
  const [shape, setShape] = useState<InputShape>(initial === "int" ? "square" : "triangle");
  const [tauRatio, setTau] = useState(1);
  const [leak, setLeak] = useState(false);
  const [noise, setNoise] = useState(false);
  const [r1, setR1] = useState(false);
  const f = 1000;
  const T = 1 / f;
  const R = 10e3;
  const C = (tauRatio * T) / R;
  const w = useMemo(
    () =>
      kind === "int"
        ? simulateIntegrator({ shape, amp: 1, f, R, C, Rf: leak ? 10 * R : Infinity, UOM: 13, periods: 3, uo0: shape === "step" ? 0 : undefined })
        : simulateDifferentiator({ shape, amp: 1, f, R, C, R1: r1 ? R / 20 : 0, UOM: 13, periods: 3, noise: noise ? { amp: 0.02, f: 40e3 } : undefined }),
    [kind, shape, C, leak, noise, r1],
  );
  const lim = Math.min(14, Math.max(1.2, ...w.uo.map((x) => Math.abs(x))) * 1.15);
  return (
    <WidgetCard
      title={kind === "int" ? "交互：积分运算电路的波形" : "交互：微分运算电路的波形"}
      testId="intdiff"
      wide
      controls={
        <>
          <Segmented
            size="sm"
            label="电路"
            value={kind}
            onChange={(k) => {
              setKind(k);
              setShape(k === "int" ? "square" : "triangle");
            }}
            options={[
              { value: "int", label: "积分" },
              { value: "diff", label: "微分" },
            ]}
          />
          <ChipGroup
            label="输入波形"
            value={shape}
            onChange={setShape}
            testId="id-shape"
            options={[
              { value: "step", label: "阶跃" },
              { value: "square", label: "方波" },
              { value: "triangle", label: "三角波" },
              { value: "sine", label: "正弦" },
            ]}
          />
          <ParamSlider label={r`时间常数 $\tau=RC$（以 $T$ 为单位）`} value={tauRatio} onChange={setTau} min={0.02} max={5} log unit="T" testId="id-tau" />
          {kind === "int" ? (
            <Toggle checked={leak} onChange={setLeak} label="电容并联 $R_f=10R$（防饱和）" />
          ) : (
            <>
              <Toggle checked={noise} onChange={setNoise} label="叠加 40 kHz 小噪声" testId="id-noise" />
              <Toggle checked={r1} onChange={setR1} label="输入串 $R_1=R/20$" />
            </>
          )}
        </>
      }
      footer={
        kind === "int"
          ? "理想运放 + 输出饱和 ±13 V，输入幅值 1 V、频率 1 kHz。$u_O=-\\dfrac1{RC}\\int u_I\\,\\mathrm dt$。阶跃输入时输出线性变化直至饱和；理想积分器对直流（含失调）的增益无穷大，实际常在电容两端并联 $R_f$ 限制低频增益。"
          : "理想运放 + 输出饱和 ±13 V。$u_O=-RC\\,\\dfrac{\\mathrm du_I}{\\mathrm dt}$。微分电路对高频的增益随频率正比增大，很小的高频噪声也会被大幅放大；输入串入小电阻 $R_1$ 可限制高频增益（代价是边沿变缓）。"
      }
    >
      <Plot height={250} ariaLabel="输入输出波形" x={{ domain: [0, 3], label: "t / T" }} y={{ domain: [-lim, lim], label: "V" }}>
        {(s) => (
          <g>
            <Line points={w.t.map((t, k) => [t * f, w.ui[k]] as [number, number])} s={s} color="var(--ch1)" width={1.5} />
            <Line points={w.t.map((t, k) => [t * f, w.uo[k]] as [number, number])} s={s} color="var(--ch2)" width={2.3} testId="id-uo" />
          </g>
        )}
      </Plot>
      <Legend items={[["$u_I$", "var(--ch1)"], ["$u_O$", "var(--ch2)"]]} />
    </WidgetCard>
  );
}
