"use client";

import { useMemo, useState } from "react";
import { r, Rich } from "@/components/math/Tex";
import { ceEmitterFeedback, bandwidthWithFeedback, closedLoop, closedLoopComplex, closedLoopStep, feedbackResistances, gainSensitivity, loopGain, loopPhaseDeg, margins, singlePole, softAmp, solveClosedLoop, TOPOLOGY_INFO, TOPOLOGY_LABEL, type Topology } from "@/simulations/feedback/feedback";
import { cabs } from "@/simulations/signal/rc";
import { analyzeCE } from "@/simulations/bjt/ce";
import { DEFAULT_DIVIDER } from "@/simulations/bjt/types";
import { harmonic, thd } from "@/simulations/dsp";
import { formatSI, sig } from "@/simulations/units";
import { Line, Plot } from "@/components/plot/Plot";
import { Button, ParamSlider, Readout, Segmented, Toggle } from "@/components/ui/primitives";
import { InvAmp, NonInvAmp } from "@/components/circuit/diagrams/ch07";
import { CurrentSeriesOA, CurrentShuntOA } from "@/components/circuit/diagrams/ch08";
import { ChipGroup, fmtPow10, intTicks, Legend, PlotTitle, WidgetCard } from "../WidgetCard";

/* ───────────── A_f = A/(1+AF) ───────────── */
export function FBBasics() {
  const [lgA, setLgA] = useState(4);
  const [F, setF] = useState(0.01);
  const A = Math.pow(10, lgA);
  const c = closedLoop(A, F);
  const s = gainSensitivity(A, F, 0.2);
  const curve = useMemo(() => Array.from({ length: 121 }, (_, k) => {
    const la = 0 + (6 * k) / 120;
    return [la, Math.log10(closedLoop(Math.pow(10, la), F).Af)] as [number, number];
  }), [F]);
  return (
    <WidgetCard
      title="交互：闭环增益 $A_f=A/(1+AF)$"
      testId="fb-basics"
      controls={
        <>
          <ParamSlider label={r`开环增益 $\lg A$`} value={lgA} onChange={setLgA} min={0} max={6} step={0.05} unit="" testId="fb-a" />
          <ParamSlider label="反馈系数 $F$" value={F} onChange={setF} min={0.001} max={1} log unit="" testId="fb-f" />
          <div className="grid grid-cols-2 gap-1.5">
            <Readout label="反馈深度 $1+AF$" value={sig(c.depth, 4)} tone={c.depth > 10 ? "ok" : "warn"} testId="fb-depth" />
            <Readout label="$A_f$" value={sig(c.Af, 4)} tone="ac" testId="fb-af" />
            <Readout label="$1/F$" value={sig(1 / F, 4)} />
            <Readout label="$A$ 增大 20% 时 $A_f$ 变化" value={`${sig(s.rel * 100, 3)} %`} tone="ss" />
          </div>
        </>
      }
      footer={r`$1+AF\gg1$（深度负反馈）时 $A_f\approx1/F$：闭环增益几乎只由反馈网络（通常是电阻比）决定，与放大器本身的参数无关。代价是增益下降为原来的 $1/(1+AF)$。`}
    >
      <PlotTitle>{String.raw`$\lg A_f$ – $\lg A$（反馈系数固定）`}</PlotTitle>
      <Plot height={220} ariaLabel="闭环增益与开环增益" x={{ domain: [0, 6], label: "lg A" }} y={{ domain: [0, Math.max(1, Math.log10(1 / F) + 0.5)], label: "lg A_f" }}>
        {(s2) => (
          <g>
            <Line points={[[0, Math.log10(1 / F)], [6, Math.log10(1 / F)]]} s={s2} color="var(--warn)" width={1.2} dash="4 3" />
            <Line points={curve} s={s2} color="var(--ac)" width={2.4} />
            <circle cx={s2.sx(lgA)} cy={s2.sy(Math.log10(c.Af))} r={5} fill="var(--bg-elev)" stroke="var(--ink)" strokeWidth={2} />
          </g>
        )}
      </Plot>
      <Legend items={[["$A_f$", "var(--ac)"], ["$1/F$", "var(--warn)", "4 3"]]} />
    </WidgetCard>
  );
}

/* ───────────── 反馈组态判断练习 ───────────── */
const CASES: Array<{ id: Topology; el: React.ReactNode; why: string[] }> = [
  {
    id: "voltage-series",
    el: <NonInvAmp />,
    why: ["设 $u_I$ 瞬时极性为 ⊕ → $u_O$ ⊕ → 反馈电压 $u_F$（$R_1$ 上）⊕ → 净输入 $u_+-u_-=u_I-u_F$ 减小：**负反馈**。", "令 $u_O=0$（输出端短路），反馈消失 → **电压反馈**。", "反馈信号与输入信号接在运放的不同输入端，以电压形式相减 → **串联反馈**。"],
  },
  {
    id: "voltage-shunt",
    el: <InvAmp />,
    why: ["$u_I$ ⊕ → 反相端 ⊕ → $u_O$ ⊖ → 经 $R_f$ 的反馈电流从反相端流走，净输入电流 $i_I-i_F$ 减小：**负反馈**。", "令 $u_O=0$，$R_f$ 下端接地，反馈消失 → **电压反馈**。", "反馈与输入接在同一节点（反相端），以电流形式相减 → **并联反馈**。"],
  },
  {
    id: "current-series",
    el: <CurrentSeriesOA />,
    why: ["$u_I$ ⊕ → $u_O$ ⊕ → $i_O$ 流过 $R$ 产生 $u_F=i_OR$ ⊕ → 净输入 $u_I-u_F$ 减小：**负反馈**。", "令 $u_O=0$（负载短路）但输出电流仍流过 $R$，反馈仍然存在 → **电流反馈**。", "反馈电压加在反相端，输入在同相端，以电压相减 → **串联反馈**。"],
  },
  {
    id: "current-shunt",
    el: <CurrentShuntOA />,
    why: ["$u_I$ ⊕ → 反相端 ⊕ → $u_O$ ⊖ → 节点 X ⊖ → 经 $R_f$ 从反相端分流，净输入电流减小：**负反馈**。", "负载 $R_L$ 短路后，输出电流仍在 $R$ 与 $R_f$ 间分流，反馈存在 → **电流反馈**。", "反馈与输入接在同一节点（反相端） → **并联反馈**。"],
  },
];

export function TopologyTrainer() {
  const [k, setK] = useState(0);
  const [ans, setAns] = useState<{ sign?: string; vi?: string; ss?: string }>({});
  const c = CASES[k];
  const right = { sign: "负反馈", vi: c.id.startsWith("voltage") ? "电压" : "电流", ss: c.id.endsWith("series") ? "串联" : "并联" };
  const q = (key: "sign" | "vi" | "ss", opts: string[], idx: number) => (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-1.5">
        {opts.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => setAns((a) => ({ ...a, [key]: o }))}
            className={`rounded-full border px-2.5 py-0.5 text-[12.5px] ${ans[key] === o ? (o === right[key] ? "border-ok bg-ok-soft text-ok" : "border-err bg-err-soft text-err") : "border-line bg-elev text-ink-2"}`}
          >
            {o}
          </button>
        ))}
      </div>
      {ans[key] && (
        <p className="text-[12.5px] text-ink-2">
          <Rich text={(ans[key] === right[key] ? "✓ " : "✗ ") + c.why[idx]} />
        </p>
      )}
    </div>
  );
  return (
    <WidgetCard
      title="交互：判断反馈的极性与组态"
      testId="topology-trainer"
      controls={
        <>
          <ChipGroup
            label="电路"
            value={String(k)}
            onChange={(v) => {
              setK(Number(v));
              setAns({});
            }}
            options={CASES.map((cc, i) => ({ value: String(i), label: `电路 ${i + 1}` }))}
            testId="tt-case"
          />
          <Button variant="outline" size="sm" onClick={() => setAns(right)}>
            显示答案
          </Button>
          {ans.sign && ans.vi && ans.ss && (
            <p className="text-[13px] font-medium" data-testid="tt-result">
              {TOPOLOGY_LABEL[c.id]}：稳定{TOPOLOGY_INFO[c.id].stable}
            </p>
          )}
        </>
      }
    >
      {c.el}
      <div className="space-y-3 text-[13.5px]">
        <div>
          <div className="mb-1 font-medium">① 瞬时极性法：正反馈还是负反馈？</div>
          {q("sign", ["正反馈", "负反馈"], 0)}
        </div>
        <div>
          <div className="mb-1 font-medium">② 输出端：电压反馈还是电流反馈？（令输出电压为零看反馈是否消失）</div>
          {q("vi", ["电压", "电流"], 1)}
        </div>
        <div>
          <div className="mb-1 font-medium">③ 输入端：串联还是并联？</div>
          {q("ss", ["串联", "并联"], 2)}
        </div>
      </div>
    </WidgetCard>
  );
}

/* ───────────── 展宽频带 ───────────── */
export function BandwidthDemo() {
  const [F, setF] = useState(0.01);
  const Am = 1e4;
  const fH = 1e3;
  const b = bandwidthWithFeedback(Am, fH, F);
  const curves = useMemo(() => {
    const o: Array<[number, number]> = [];
    const c: Array<[number, number]> = [];
    for (let k = 0; k <= 200; k++) {
      const lf = 1 + (6 * k) / 200;
      const f = Math.pow(10, lf);
      const A = singlePole(Am, fH, f);
      o.push([lf, 20 * Math.log10(cabs(A))]);
      c.push([lf, 20 * Math.log10(cabs(closedLoopComplex(A, F)))]);
    }
    return { o, c };
  }, [F]);
  return (
    <WidgetCard
      title="交互：负反馈展宽频带"
      testId="bw-demo"
      controls={
        <>
          <ParamSlider label="反馈系数 $F$" value={F} onChange={setF} min={0.0001} max={1} log unit="" testId="bw-f" />
          <div className="grid grid-cols-2 gap-1.5">
            <Readout label="闭环中频增益 $A_{mf}$" value={sig(b.Amf, 4)} tone="ac" />
            <Readout label="闭环上限频率 $f_{Hf}$" value={formatSI(b.fHf, "Hz")} tone="ok" testId="bw-fh" />
            <Readout label="增益带宽积" value={formatSI(b.Amf * b.fHf, "Hz")} />
          </div>
        </>
      }
      footer="开环：$A_m=10^4$、$f_H$=1 kHz（单极点）。$f_{Hf}=(1+A_mF)f_H$，$A_{mf}=A_m/(1+A_mF)$，二者之积不变——用增益换带宽。"
    >
      <Plot height={230} ariaLabel="开环与闭环幅频特性" x={{ domain: [1, 7], ticks: intTicks(1, 7), format: fmtPow10, label: "f / Hz" }} y={{ domain: [-10, 85], label: "dB" }}>
        {(s) => (
          <g>
            <Line points={curves.o} s={s} color="var(--ink-3)" width={1.6} dash="5 3" />
            <Line points={curves.c} s={s} color="var(--ac)" width={2.4} />
          </g>
        )}
      </Plot>
      <Legend items={[["开环 $|A|$", "var(--ink-3)", "5 3"], ["闭环 $|A_f|$", "var(--ac)"]]} />
    </WidgetCard>
  );
}

/* ───────────── 减小非线性失真 ───────────── */
export function DistortionFB() {
  const [fb, setFb] = useState(true);
  const [F, setF] = useState(0.01);
  const N = 256;
  const a = useMemo(() => softAmp(1000, 0.01), []);
  const data = useMemo(() => {
    const open: number[] = [];
    for (let k = 0; k < N; k++) open.push(a(0.0065 * Math.sin((2 * Math.PI * k) / N)));
    const target = harmonic(open, N, 1).amp;
    let wave = open;
    if (fb) {
      let lo = 0;
      let hi = 2;
      for (let it = 0; it < 50; it++) {
        const x = (lo + hi) / 2;
        const amp = harmonic(Array.from({ length: N }, (_, k) => solveClosedLoop(a, F, x * Math.sin((2 * Math.PI * k) / N))), N, 1).amp;
        if (amp < target) lo = x;
        else hi = x;
      }
      wave = Array.from({ length: N }, (_, k) => solveClosedLoop(a, F, lo * Math.sin((2 * Math.PI * k) / N)));
    }
    return { wave, thd: thd(wave, N), ideal: Array.from({ length: N }, (_, k) => target * Math.sin((2 * Math.PI * k) / N)) };
  }, [fb, F, a]);
  return (
    <WidgetCard
      title="交互：负反馈减小非线性失真（相同输出幅度下比较）"
      testId="dist-fb"
      controls={
        <>
          <Toggle checked={fb} onChange={setFb} label="引入负反馈" testId="df-toggle" />
          {fb && <ParamSlider label="反馈系数 $F$" value={F} onChange={setF} min={0.0005} max={0.05} log unit="" />}
          <Readout label="THD" value={`${sig(data.thd * 100, 3)} %`} tone={data.thd < 0.01 ? "ok" : "err"} testId="df-thd" />
        </>
      }
      footer="开环放大器：小信号增益 1000，输出在 ±10 V 附近软限幅（tanh 特性）。闭环时提高输入，使输出基波幅度与开环相同再比较。负反馈把输出的失真“送回”输入端，与输入相减后产生一个预失真的净输入，从而部分抵消失真——THD 约减小为原来的 $1/(1+AF)$。注意：负反馈只能减小放大器**内部**产生的失真，对输入信号本身的失真无能为力。"
    >
      <Plot height={220} ariaLabel="输出波形" x={{ domain: [0, 1], label: "t / T" }} y={{ domain: [-11, 11], label: "V" }}>
        {(s) => (
          <g>
            <Line points={data.ideal.map((y, k) => [k / N, y] as [number, number])} s={s} color="var(--ink-3)" width={1.2} dash="4 3" />
            <Line points={data.wave.map((y, k) => [k / N, y] as [number, number])} s={s} color="var(--ch2)" width={2.3} />
          </g>
        )}
      </Plot>
      <Legend items={[["输出", "var(--ch2)"], ["理想正弦（同基波幅度）", "var(--ink-3)", "4 3"]]} />
    </WidgetCard>
  );
}

/* ───────────── 输入、输出电阻 ───────────── */
export function RioFBDemo() {
  const [t, setT] = useState<Topology>("voltage-series");
  const [depth, setDepth] = useState(11);
  const Ri = 10e3;
  const Ro = 1e3;
  const res = feedbackResistances(t, Ri, Ro, depth);
  return (
    <WidgetCard
      title="交互：四种组态对输入电阻、输出电阻的影响"
      testId="rio-fb"
      controls={
        <>
          <ChipGroup
            label="组态"
            value={t}
            onChange={setT}
            testId="rf-topo"
            options={(Object.keys(TOPOLOGY_LABEL) as Topology[]).map((k) => ({ value: k, label: TOPOLOGY_LABEL[k] }))}
          />
          <ParamSlider label="反馈深度 $1+AF$" value={depth} onChange={setDepth} min={1} max={1000} log unit="" />
        </>
      }
      footer="基本放大电路 $R_i$=10 kΩ、$R_o$=1 kΩ。串联反馈 $R_{if}=(1+AF)R_i$；并联反馈 $R_{if}=R_i/(1+AF)$；电压反馈 $R_{of}=R_o/(1+A_oF)$；电流反馈 $R_{of}=(1+A_sF)R_o$（$A_o$、$A_s$ 分别为输出端开路、短路时的增益，这里取同一深度示意）。"
    >
      <div className="grid grid-cols-2 gap-1.5">
        <Readout label="$R_{if}$" value={formatSI(res.Rif, "Ω")} tone={TOPOLOGY_INFO[t].Ri === "up" ? "ok" : "warn"} testId="rf-ri" />
        <Readout label="$R_{of}$" value={formatSI(res.Rof, "Ω")} tone={TOPOLOGY_INFO[t].Ro === "down" ? "ok" : "warn"} testId="rf-ro" />
      </div>
      <p className="text-[13px] text-ink-2">
        <Rich text={`${TOPOLOGY_LABEL[t]}：稳定${TOPOLOGY_INFO[t].stable}，被稳定的增益是 $${TOPOLOGY_INFO[t].gain.replace(/（.*）/, "")}$。${t.startsWith("voltage") ? "电压反馈稳定输出电压，输出端趋于理想电压源，$R_o$ 减小。" : "电流反馈稳定输出电流，输出端趋于理想电流源，$R_o$ 增大。"}${t.endsWith("series") ? "串联反馈使输入端电流减小，$R_i$ 增大。" : "并联反馈从输入端分走电流，$R_i$ 减小。"}`} />
      </p>
    </WidgetCard>
  );
}

/* ───────────── 深度负反馈估算 vs 精确 ───────────── */
export function DeepFBDemo() {
  const [Re1, setRe1] = useState(500);
  const [beta, setBeta] = useState(100);
  const p = { ...DEFAULT_DIVIDER, Re1, Re2: Math.max(100, 1200 - Re1), beta, RL: 3e3 };
  const a = analyzeCE(p);
  const fe = ceEmitterFeedback(beta, a.ac.rbe, Re1, a.ac.RLp);
  const est = fe.estimate;
  return (
    <WidgetCard
      title={r`交互：深度负反馈估算 $A_{uf}\approx-R_L'/R_e$ 有多准`}
      testId="deep-fb"
      controls={
        <>
          <ParamSlider label="未旁路射极电阻 $R_{e1}$" value={Re1} onChange={setRe1} min={20} max={1100} log unit="Ω" testId="dfb-re" />
          <ParamSlider label={r`$\beta$`} value={beta} onChange={setBeta} min={20} max={300} step={1} unit="" />
        </>
      }
      footer={r`分压偏置共射电路（$R_{e1}+R_{e2}$ 约 1.2 kΩ 保持 Q 点基本不变，$R_c$=3 kΩ，$R_L$=3 kΩ）。未旁路的 $R_{e1}$ 引入电流串联负反馈，反馈系数 $F\approx R_{e1}$（互阻），深度负反馈时 $\dot A_{uf}\approx-R_L'/R_{e1}$。`}
    >
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        <Readout label={r`精确 $\dot A_u$`} value={sig(a.ac.Au, 4)} tone="ac" />
        <Readout label="估算 $-R_L'/R_{e1}$" value={sig(est, 4)} tone="dc" testId="dfb-est" />
        <Readout label="估算误差" value={`${sig(((est - a.ac.Au) / a.ac.Au) * 100, 3)} %`} />
        <Readout label={r`反馈深度 ≈ $1+\frac{(1+\beta)R_{e1}}{r_{be}}$`} value={sig(fe.depth, 3)} tone="ss" />
      </div>
    </WidgetCard>
  );
}

/* ───────────── 稳定性 ───────────── */
export function StabilityDemo() {
  const [T0, setT0] = useState(100);
  const [comp, setComp] = useState(false);
  const [view, setView] = useState<"bode" | "step">("bode");
  const poles = comp ? [10, 1e4, 1e5] : [1e3, 1e4, 1e5];
  const spec = { T0, poles };
  const m = margins(spec);
  const bode = useMemo(() => {
    const mag: Array<[number, number]> = [];
    const ph: Array<[number, number]> = [];
    for (let k = 0; k <= 240; k++) {
      const lf = 0 + (7 * k) / 240;
      const f = Math.pow(10, lf);
      mag.push([lf, 20 * Math.log10(cabs(loopGain(spec, f)))]);
      ph.push([lf, loopPhaseDeg(spec, f)]);
    }
    return { mag, ph };
  }, [T0, comp]); // eslint-disable-line react-hooks/exhaustive-deps
  const step = useMemo(() => {
    const F = 0.01;
    const Am = T0 / F;
    const r = closedLoopStep(Am, poles, F, { tEnd: comp ? 2e-3 : 1e-3, n: 3000 });
    return r.t.map((t, k) => [t * 1e3, r.y[k]] as [number, number]);
  }, [T0, comp]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <WidgetCard
      title="交互：三极点放大电路加负反馈后的稳定性"
      testId="stability-demo"
      wide
      controls={
        <>
          <ParamSlider label="环路增益 $A_mF$" value={T0} onChange={setT0} min={0.5} max={10000} log unit="" testId="st-t0" />
          <Toggle checked={comp} onChange={setComp} label="主极点补偿（第一个极点 1 kHz → 10 Hz）" testId="st-comp" />
          <Segmented
            size="sm"
            label="视图"
            value={view}
            onChange={setView}
            options={[
              { value: "bode", label: "环路增益波特图" },
              { value: "step", label: "闭环阶跃响应" },
            ]}
          />
          <div className="grid grid-cols-2 gap-1.5">
            <Readout label="相位裕度" value={Number.isNaN(m.fc) ? "—" : `${sig(m.PM, 3)}°`} tone={m.PM > 45 ? "ok" : m.PM > 0 ? "warn" : "err"} testId="st-pm" />
            <Readout label="增益裕度" value={Number.isFinite(m.GM) ? `${sig(m.GM, 3)} dB` : "∞"} tone={m.GM > 10 ? "ok" : m.GM > 0 ? "warn" : "err"} />
            <Readout label="结论" value={m.stable ? "稳定" : "自激振荡"} tone={m.stable ? "ok" : "err"} testId="st-verdict" />
          </div>
        </>
      }
      footer={r`环路增益 $\dot A\dot F=\dfrac{A_mF}{(1+jf/f_1)(1+jf/f_2)(1+jf/f_3)}$，未补偿时 $f_1,f_2,f_3$=1 kHz、10 kHz、100 kHz。判据：$|\dot A\dot F|=1$ 时相位仍未到 −180°（相位裕度 > 0）则稳定；一般要求相位裕度 ≥ 45°。阶跃响应为时域仿真（$F$=0.01，输出按 $1/F$ 归一化，不稳定时受输出限幅约束）。`}
    >
      {view === "bode" ? (
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <PlotTitle>{String.raw`$20\lg|\dot A\dot F|$（dB）`}</PlotTitle>
            <Plot height={200} ariaLabel="环路增益幅频" x={{ domain: [0, 7], ticks: intTicks(0, 7), format: fmtPow10, label: "f / Hz" }} y={{ domain: [-80, 90] }}>
              {(s) => (
                <g>
                  <Line points={[[0, 0], [7, 0]]} s={s} color="var(--ink-3)" width={1} dash="3 3" />
                  <Line points={bode.mag} s={s} color="var(--ac)" width={2.2} />
                  {!Number.isNaN(m.fc) && <line x1={s.sx(Math.log10(m.fc))} x2={s.sx(Math.log10(m.fc))} y1={s.m.t} y2={s.m.t + s.ih} stroke="var(--ok)" strokeDasharray="3 3" />}
                </g>
              )}
            </Plot>
          </div>
          <div>
            <PlotTitle>{String.raw`相位 $\varphi_{AF}$（°）`}</PlotTitle>
            <Plot height={200} ariaLabel="环路增益相频" x={{ domain: [0, 7], ticks: intTicks(0, 7), format: fmtPow10, label: "f / Hz" }} y={{ domain: [-270, 0], ticks: [-270, -180, -90, 0] }}>
              {(s) => (
                <g>
                  <Line points={[[0, -180], [7, -180]]} s={s} color="var(--err)" width={1} dash="3 3" />
                  <Line points={bode.ph} s={s} color="var(--ss)" width={2.2} />
                  {!Number.isNaN(m.fc) && <line x1={s.sx(Math.log10(m.fc))} x2={s.sx(Math.log10(m.fc))} y1={s.m.t} y2={s.m.t + s.ih} stroke="var(--ok)" strokeDasharray="3 3" />}
                </g>
              )}
            </Plot>
          </div>
        </div>
      ) : (
        <Plot height={240} ariaLabel="闭环阶跃响应" x={{ domain: [0, step[step.length - 1][0]], label: "t / ms" }} y={{ domain: [-0.5, 2.5], label: "y·F" }}>
          {(s) => (
            <g>
              <Line points={[[0, 1], [step[step.length - 1][0], 1]]} s={s} color="var(--ink-3)" width={1} dash="3 3" />
              <Line points={step} s={s} color="var(--ch2)" width={2.2} />
            </g>
          )}
        </Plot>
      )}
    </WidgetCard>
  );
}
