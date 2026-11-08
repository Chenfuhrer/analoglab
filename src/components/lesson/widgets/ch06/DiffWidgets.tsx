"use client";

import { useMemo, useState } from "react";
import { r, Rich } from "@/components/math/Tex";
import { activeLoadGain, resistiveLoadGain, analyzeDiff, decompose, DEFAULT_DIFF, diffLargeSignal, diffOutput, mirror, sourceOutputResistance, widlar, type DiffParams } from "@/simulations/diff/diffamp";
import { rbeOf } from "@/simulations/bjt/stages";
import { formatSI, sig } from "@/simulations/units";
import { Line, Plot } from "@/components/plot/Plot";
import { ParamSlider, Readout, Segmented, Toggle } from "@/components/ui/primitives";
import { Legend, PlotTitle, WidgetCard } from "../WidgetCard";

/* ───────────── 差模与共模分解 ───────────── */
export function DecomposeDemo() {
  const [Ad, setAd] = useState(0.02);
  const [u0, setU0] = useState(0.5);
  const u1 = useMemo(() => Array.from({ length: 201 }, (_, k) => [k / 200, u0 + (Ad / 2) * Math.sin((2 * Math.PI * k) / 100)] as [number, number]), [u0, Ad]);
  const u2 = useMemo(() => Array.from({ length: 201 }, (_, k) => [k / 200, u0 - (Ad / 2) * Math.sin((2 * Math.PI * k) / 100)] as [number, number]), [u0, Ad]);
  const at = (t: number) => decompose(u0 + (Ad / 2) * Math.sin(2 * Math.PI * t * 2), u0 - (Ad / 2) * Math.sin(2 * Math.PI * t * 2));
  const d = at(0.125);
  return (
    <WidgetCard
      title="交互：两个输入 = 共模分量 + 差模分量"
      testId="decompose-demo"
      controls={
        <>
          <ParamSlider label="共模直流 $u_{Ic}$" value={u0} onChange={setU0} min={-2} max={2} step={0.01} unit="V" />
          <ParamSlider label="差模幅值 $U_{Idm}$" value={Ad} onChange={setAd} min={0.001} max={0.2} log unit="mV" scale={1e-3} />
          <div className="grid grid-cols-2 gap-1.5">
            <Readout label="峰值时 $u_{Id}=u_{I1}-u_{I2}$" value={formatSI(d.uId, "V")} tone="ss" />
            <Readout label="$u_{Ic}=(u_{I1}+u_{I2})/2$" value={formatSI(d.uIc, "V")} tone="dc" />
          </div>
        </>
      }
      footer="$u_{I1}=u_{Ic}+u_{Id}/2$，$u_{I2}=u_{Ic}-u_{Id}/2$。差模分量在两个输入端大小相等、极性相反；共模分量大小相等、极性相同。传感器电桥、话筒线等场合，有用信号往往是很小的差模分量，叠加在很大的共模电压（直流偏置、50 Hz 干扰）之上。"
    >
      <Plot height={220} ariaLabel="两个输入信号" x={{ domain: [0, 1], label: "t" }} y={{ domain: [u0 - Ad * 0.8 - 0.05, u0 + Ad * 0.8 + 0.05], label: "V" }}>
        {(s) => (
          <g>
            <Line points={u1} s={s} color="var(--ch1)" width={2} />
            <Line points={u2} s={s} color="var(--ch2)" width={2} />
            <Line points={[[0, u0], [1, u0]]} s={s} color="var(--dc)" width={1.4} dash="4 3" />
          </g>
        )}
      </Plot>
      <Legend items={[["$u_{I1}$", "var(--ch1)"], ["$u_{I2}$", "var(--ch2)"], ["共模分量 $u_{Ic}$", "var(--dc)", "4 3"]]} />
    </WidgetCard>
  );
}

/* ───────────── 差分放大电路实验 ───────────── */
export function DiffLab() {
  const [tail, setTail] = useState<"resistor" | "source">("resistor");
  const [Re, setRe] = useState(10e3);
  const [output, setOutput] = useState<"double" | "single">("single");
  const [mismatch, setMismatch] = useState(0);
  const [uid, setUid] = useState(0.01);
  const [uic, setUic] = useState(1);
  const base = analyzeDiff({ ...DEFAULT_DIFF });
  const p: DiffParams = { ...DEFAULT_DIFF, tail, Re: tail === "source" ? 2e6 : Re, I0: base.IEQ * 2, output, mismatch, RL: Infinity };
  const res = analyzeDiff(p);
  const wave = useMemo(() => {
    const pts: Array<[number, number]> = [];
    const pc: Array<[number, number]> = [];
    const pd: Array<[number, number]> = [];
    for (let k = 0; k <= 200; k++) {
      const t = k / 200;
      const di = uid * Math.sin(2 * Math.PI * 2 * t);
      const ci = uic * Math.sin(2 * Math.PI * 0.5 * t + 0.3);
      pts.push([t, diffOutput(res, ci + di / 2, ci - di / 2)]);
      pd.push([t, res.Ad * di]);
      pc.push([t, res.Ac * ci]);
    }
    return { pts, pc, pd };
  }, [res, uid, uic]);
  const lim = Math.max(...wave.pts.map((q) => Math.abs(q[1])), 0.01) * 1.2;
  return (
    <WidgetCard
      title="交互：差模增益、共模增益与共模抑制比"
      testId="diff-lab"
      wide
      controls={
        <>
          <Segmented
            size="sm"
            label="长尾"
            value={tail}
            onChange={setTail}
            options={[
              { value: "resistor", label: "电阻 R_e" },
              { value: "source", label: "恒流源" },
            ]}
          />
          {tail === "resistor" && <ParamSlider label="$R_e$" value={Re} onChange={setRe} min={1e3} max={50e3} log unit="kΩ" scale={1e3} testId="dl-re" />}
          <Segmented
            size="sm"
            label="输出方式"
            value={output}
            onChange={setOutput}
            testId="dl-out"
            options={[
              { value: "double", label: "双端输出" },
              { value: "single", label: "单端输出" },
            ]}
          />
          {output === "double" && <ParamSlider label={r`$R_c$ 失配 $\Delta R_c/R_c$`} value={mismatch} onChange={setMismatch} min={0} max={0.1} step={0.001} unit="%" scale={0.01} />}
          <ParamSlider label="差模输入幅值" value={uid} onChange={setUid} min={0.001} max={0.05} log unit="mV" scale={1e-3} />
          <ParamSlider label="共模干扰幅值" value={uic} onChange={setUic} min={0} max={2} step={0.01} unit="V" />
        </>
      }
      footer={`对称长尾电路：$V_{CC}=V_{EE}$=12 V，$R_c$=10 kΩ，$R_b$=1 kΩ，β=100，$r_{bb'}$=200 Ω，空载。恒流源时取等效输出电阻 2 MΩ（$I_0$ 与电阻长尾的静态电流相同）。`}
    >
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        <Readout label="$I_{EQ}$" value={formatSI(res.IEQ, "A")} tone="dc" />
        <Readout label="$A_d$" value={sig(res.Ad, 3)} tone="ac" testId="dl-ad" />
        <Readout label="$A_c$" value={res.Ac === 0 ? "0" : sig(res.Ac, 3)} tone="warn" testId="dl-ac" />
        <Readout label="$K_{CMR}$" value={Number.isFinite(res.KCMR) ? `${sig(res.KCMR, 3)}（${sig(res.KCMRdB, 3)} dB）` : "∞"} tone="ok" testId="dl-kcmr" />
      </div>
      <PlotTitle>{String.raw`输出 $u_O$（实线）= 差模输出 + 共模输出`}</PlotTitle>
      <Plot height={210} ariaLabel="差分电路输出" x={{ domain: [0, 1], label: "t" }} y={{ domain: [-lim, lim], label: "V" }}>
        {(s) => (
          <g>
            <Line points={wave.pd} s={s} color="var(--ss)" width={1.3} dash="4 3" />
            <Line points={wave.pc} s={s} color="var(--warn)" width={1.3} dash="4 3" />
            <Line points={wave.pts} s={s} color="var(--ch2)" width={2.2} />
          </g>
        )}
      </Plot>
      <Legend items={[["$A_du_{Id}$", "var(--ss)", "4 3"], ["$A_cu_{Ic}$（干扰残留）", "var(--warn)", "4 3"], ["$u_O$", "var(--ch2)"]]} />
    </WidgetCard>
  );
}

/* ───────────── 大信号传输特性 ───────────── */
export function DiffTransfer() {
  const [I0, setI0] = useState(1e-3);
  const pts = useMemo(() => {
    const a: Array<[number, number]> = [];
    const b: Array<[number, number]> = [];
    for (let k = 0; k <= 240; k++) {
      const u = -0.25 + (0.5 * k) / 240;
      const x = diffLargeSignal(u, I0);
      a.push([u * 1e3, x.iC1 * 1e3]);
      b.push([u * 1e3, x.iC2 * 1e3]);
    }
    return { a, b };
  }, [I0]);
  return (
    <WidgetCard
      title="交互：差分对的大信号传输特性"
      testId="diff-transfer"
      controls={
        <>
          <ParamSlider label="尾电流 $I_0$" value={I0} onChange={setI0} min={0.1e-3} max={4e-3} log unit="mA" scale={1e-3} />
          <p className="text-[12.5px] text-ink-2">
            <Rich text={r`$i_{C1}+i_{C2}=I_0$ 恒定。$|u_{Id}|<U_T$（约 26 mV）时近似线性；$|u_{Id}|>4U_T$（约 100 mV）后电流几乎全部流向一侧，输出限幅。`} />
          </p>
        </>
      }
      footer={r`理想对管、无射极电阻：$i_{C1}=\dfrac{I_0}{1+e^{-u_{Id}/U_T}}$，$i_{C2}=\dfrac{I_0}{1+e^{u_{Id}/U_T}}$（忽略基极电流）。差分对的线性范围很窄，常在射极串小电阻扩大线性范围；这一限幅特性也用于比较器与模拟乘法器。`}
    >
      <Plot height={240} ariaLabel="差分对大信号传输特性" x={{ domain: [-250, 250], label: "u_Id / mV" }} y={{ domain: [0, I0 * 1.1e3], label: "mA" }}>
        {(s) => (
          <g>
            <rect x={s.sx(-26)} y={s.m.t} width={s.sx(26) - s.sx(-26)} height={s.ih} fill="var(--ok-soft)" opacity={0.7} />
            <Line points={pts.a} s={s} color="var(--ch1)" width={2.2} />
            <Line points={pts.b} s={s} color="var(--ch2)" width={2.2} />
          </g>
        )}
      </Plot>
      <Legend items={[["$i_{C1}$", "var(--ch1)"], ["$i_{C2}$", "var(--ch2)"], ["近似线性区 $|u_{Id}|<U_T$", "var(--ok)"]]} />
    </WidgetCard>
  );
}

/* ───────────── 镜像电流源与微电流源 ───────────── */
export function MirrorDemo() {
  const [R, setR] = useState(11.3e3);
  const [beta, setBeta] = useState(100);
  const [Re2, setRe2] = useState(3e3);
  const [VA, setVA] = useState(100);
  const m = mirror(12, R, beta);
  const iw = widlar(m.IR, Re2);
  const rbe = rbeOf(iw, beta);
  const roM = sourceOutputResistance(m.IC2, VA, 0, beta, rbe);
  const roW = sourceOutputResistance(iw, VA, Re2, beta, rbe);
  return (
    <WidgetCard
      title="交互：镜像电流源与微电流源"
      testId="mirror-demo"
      controls={
        <>
          <ParamSlider label="参考电阻 $R$" value={R} onChange={setR} min={1e3} max={200e3} log unit="kΩ" scale={1e3} testId="md-r" />
          <ParamSlider label={r`$\beta$`} value={beta} onChange={setBeta} min={10} max={300} step={1} unit="" />
          <ParamSlider label="微电流源 $R_{e2}$" value={Re2} onChange={setRe2} min={100} max={20e3} log unit="kΩ" scale={1e3} testId="md-re2" />
          <ParamSlider label="Early 电压 $U_A$" value={VA} onChange={setVA} min={20} max={200} step={1} unit="V" />
        </>
      }
      footer={r`$V_{CC}$=12 V，$U_{BE}$=0.7 V，$U_T$=26 mV。微电流源方程 $I_{C2}R_{e2}=U_T\ln(I_R/I_{C2})$ 由二分法数值求解。输出电阻：镜像源 $R_o\approx r_{ce}=U_A/I_C$；带射极电阻时 $R_o\approx r_{ce}[1+\beta R_e/(r_{be}+R_e)]$。`}
    >
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        <Readout label="$I_R=(V_{CC}-U_{BE})/R$" value={formatSI(m.IR, "A")} tone="dc" />
        <Readout label={r`镜像 $I_{C2}=I_R\beta/(\beta+2)$`} value={formatSI(m.IC2, "A")} tone="ac" testId="md-ic2" />
        <Readout label="相对误差" value={`${sig((1 - m.IC2 / m.IR) * 100, 3)} %`} />
        <Readout label="微电流源 $I_{C2}$" value={formatSI(iw, "A")} tone="ss" testId="md-widlar" />
        <Readout label="镜像源 $R_o$" value={formatSI(roM, "Ω")} />
        <Readout label="微电流源 $R_o$" value={formatSI(roW, "Ω")} tone="ok" />
      </div>
      <p className="text-[13px] text-ink-2">
        <Rich text={`想用镜像电流源得到 ${formatSI(iw, "A")} 的电流，参考电阻要 ${formatSI((12 - 0.7) / iw, "Ω")}——集成电路中做不了这么大的电阻；微电流源只用 ${formatSI(R, "Ω")} + ${formatSI(Re2, "Ω")} 就做到了，而且输出电阻还更大。`} />
      </p>
    </WidgetCard>
  );
}

/* ───────────── 有源负载 ───────────── */
export function ActiveLoadDemo() {
  const [IC, setIC] = useState(0.5e-3);
  const [RL, setRL] = useState(100e3);
  const [active, setActive] = useState(true);
  const beta = 100;
  const VA = 100;
  const rbe = rbeOf(IC * (1 + 1 / beta), beta);
  const Rc = 5 / IC; // 电阻负载：为保持 U_CEQ 合理，R_c 上压降取 5 V
  const gainR = resistiveLoadGain(IC, VA, beta, rbe, Rc, RL);
  const gainA = activeLoadGain(IC, VA, beta, rbe, RL);
  return (
    <WidgetCard
      title="交互：用电流源代替集电极电阻（有源负载）"
      testId="active-load"
      controls={
        <>
          <ParamSlider label="$I_{CQ}$" value={IC} onChange={setIC} min={0.05e-3} max={2e-3} log unit="mA" scale={1e-3} />
          <ParamSlider label="负载 $R_L$" value={RL} onChange={setRL} min={1e3} max={10e6} log unit="kΩ" scale={1e3} />
          <Toggle checked={active} onChange={setActive} label="有源负载" />
        </>
      }
      footer="比较：电阻负载时 $R_c$ 取 5 V/$I_{CQ}$（保证管压降不变）；有源负载为同型号 PNP 镜像电流源，其输出电阻 $r_{ce}=U_A/I_C$（$U_A$=100 V）。两种情况都计入放大管自身的 $r_{ce}$。"
    >
      <div className="grid grid-cols-2 gap-1.5">
        <Readout label="电阻负载 $A_u$" value={sig(gainR, 3)} tone={active ? undefined : "ac"} />
        <Readout label="有源负载 $A_u$" value={sig(gainA, 3)} tone={active ? "ac" : undefined} testId="al-gain" />
      </div>
      <p className="text-[13px] text-ink-2">
        <Rich text={r`电流源“直流电阻小、交流电阻大”：它只需要一两伏的管压降，却能提供几十到几百千欧的交流电阻，单级增益可达上千倍——前提是负载电阻也要足够大（通常后接共集级或运放内部的高输入电阻级）。`} />
      </p>
    </WidgetCard>
  );
}
