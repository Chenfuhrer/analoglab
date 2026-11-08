"use client";

import { r } from "@/components/math/Tex";

import { useMemo, useState } from "react";
import { DEFAULT_SPEC, diodeCurrent, diodeGate, diodeVoltage, dynamicResistance, GE_DIODE, MODEL_LABEL, SI_DIODE, solveSeries, type DiodeModel } from "@/simulations/diode/diode";
import { DEFAULT_ZENER, limitResistorRange, solveZenerRegulator } from "@/simulations/diode/zener";
import { clip, rectify, simulateClamp } from "@/simulations/diode/waveforms";
import { formatSI, sig } from "@/simulations/units";
import { Line, Plot } from "@/components/plot/Plot";
import { ParamSlider, Readout, Segmented, Toggle } from "@/components/ui/primitives";
import { Rich } from "@/components/math/Tex";
import { DiodeGateAnd, DiodeGateOr } from "@/components/circuit/diagrams/ch01";
import { ChipGroup, fmtPow10, intTicks, Legend, PlotTitle, WidgetCard } from "../WidgetCard";

/* ───────────── 伏安特性与温度 ───────────── */
export function DiodeIV() {
  const [T, setT] = useState(300);
  const [mat, setMat] = useState<"Si" | "Ge">("Si");
  const [logScale, setLog] = useState(false);
  const base = mat === "Si" ? SI_DIODE : GE_DIODE;
  const p = { ...base, T };
  const p300 = { ...base, T: 300 };
  const curve = useMemo(() => {
    const pts: Array<[number, number]> = [];
    const ref: Array<[number, number]> = [];
    for (let k = 0; k <= 400; k++) {
      const u = -0.2 + (1.1 * k) / 400;
      const f = (q: typeof p) => (logScale ? Math.log10(Math.max(Math.abs(diodeCurrent(u, q)), 1e-16)) : diodeCurrent(u, q) * 1e3);
      pts.push([u, f(p)]);
      ref.push([u, f(p300)]);
    }
    return { pts, ref };
  }, [T, mat, logScale]); // eslint-disable-line react-hooks/exhaustive-deps
  const u1 = diodeVoltage(1e-3, p);
  const dUdT = (diodeVoltage(1e-3, { ...p, T: T + 1 }) - diodeVoltage(1e-3, { ...p, T: T - 1 })) / 2;
  return (
    <WidgetCard
      title="交互：二极管伏安特性（指数模型）"
      testId="diode-iv"
      controls={
        <>
          <Segmented
            label="材料"
            value={mat}
            onChange={setMat}
            options={[
              { value: "Si", label: "硅管" },
              { value: "Ge", label: "锗管" },
            ]}
          />
          <ParamSlider label="温度 $T$" value={T} onChange={setT} min={250} max={400} step={1} unit="K" testId="iv-T" />
          <Toggle checked={logScale} onChange={setLog} label="电流用对数坐标" testId="iv-log" />
          <div className="grid grid-cols-2 gap-1.5">
            <Readout label="1 mA 时 $u_D$" value={formatSI(u1, "V")} tone="dc" testId="iv-u1" />
            <Readout label="温度系数" value={`${sig(dUdT * 1e3, 3)} mV/K`} tone="warn" />
            <Readout label="$I_S$" value={formatSI(diodeCurrent(-1, p) * -1, "A")} />
            <Readout label="$U_T$" value={formatSI(0.08617e-3 * T, "V")} />
          </div>
        </>
      }
      footer="线性坐标下，电流在某个电压附近“突然”变大——这就是“开启电压”（硅约 0.5 V，锗约 0.1 V）的由来；对数坐标下它是一条直线：电流每增大 10 倍，电压只增加约 60 mV。温度升高，曲线左移。"
    >
      <PlotTitle>{logScale ? String.raw`$\lg|i_D/\mathrm A|$ – $u_D$（灰线：300 K）` : String.raw`$i_D$（mA）– $u_D$（V）（灰线：300 K）`}</PlotTitle>
      <Plot
        height={260}
        ariaLabel="二极管伏安特性"
        x={{ domain: [-0.2, 0.9], label: "u_D / V" }}
        y={logScale ? { domain: [-15, 0], ticks: intTicks(-15, 0, 6), format: fmtPow10 } : { domain: [-1, 20], label: "mA" }}
      >
        {(s) => (
          <g>
            <Line points={curve.ref} s={s} color="var(--ink-3)" width={1.3} dash="4 3" />
            <Line points={curve.pts} s={s} color="var(--dc)" width={2.4} />
            {!logScale && <circle cx={s.sx(u1)} cy={s.sy(1)} r={4} fill="var(--dc)" />}
          </g>
        )}
      </Plot>
    </WidgetCard>
  );
}

/* ───────────── 四种模型对比 ───────────── */
const MODELS: DiodeModel[] = ["ideal", "const", "pwl", "exp"];
const MODEL_COLOR: Record<DiodeModel, string> = { ideal: "var(--ch3)", const: "var(--ch4)", pwl: "var(--ch1)", exp: "var(--ink)" };

export function DiodeModelCompare() {
  const [V, setV] = useState(2);
  const [R, setR] = useState(1e3);
  const res = MODELS.map((m) => [m, solveSeries(V, R, m)] as const);
  const exact = res[3][1];
  const iMax = Math.max(V / R, 1e-4) * 1.15 * 1e3;
  const iv = useMemo(() => {
    const out: Record<DiodeModel, Array<[number, number]>> = { ideal: [], const: [], pwl: [], exp: [] };
    for (let k = 0; k <= 300; k++) {
      const i = (iMax * k) / 300 / 1e3;
      out.exp.push([diodeVoltage(i, SI_DIODE), i * 1e3]);
      out.pwl.push([DEFAULT_SPEC.Uth + i * DEFAULT_SPEC.rD, i * 1e3]);
    }
    out.ideal = [
      [-0.2, 0],
      [0, 0],
      [0, iMax],
    ];
    out.const = [
      [-0.2, 0],
      [DEFAULT_SPEC.Uon, 0],
      [DEFAULT_SPEC.Uon, iMax],
    ];
    out.pwl = [[-0.2, 0], [DEFAULT_SPEC.Uth, 0], ...out.pwl];
    return out;
  }, [iMax]);
  return (
    <WidgetCard
      title="交互：同一电路，四种二极管模型"
      testId="diode-models"
      wide
      controls={
        <>
          <ParamSlider label="电源 $V$" value={V} onChange={setV} min={0.3} max={20} log unit="V" testId="dm-V" />
          <ParamSlider label="电阻 $R$" value={R} onChange={setR} min={100} max={20e3} log unit="kΩ" scale={1e3} />
          <p className="text-[12.5px] text-ink-2">
            <Rich text="电路：$V$—$R$—二极管串联。负载线 $i_D=(V-u_D)/R$ 与各模型特性的交点就是工作点。" />
          </p>
        </>
      }
      footer="经验：$V$ 远大于导通电压（如 ≥10 倍）时理想模型就够用；$V$ 只有几伏时用恒压降模型；需要精确值或分析小信号时用指数模型/小信号模型。折线模型参数：$U_{th}$=0.5 V，$r_D$=20 Ω（示意）。"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]" data-testid="dm-table">
          <thead>
            <tr className="border-b border-line text-left text-[12px] text-ink-3">
              <th className="py-1 font-normal">模型</th>
              <th className="py-1 font-normal"><Rich text="$I_D$" /></th>
              <th className="py-1 font-normal"><Rich text="$U_D$" /></th>
              <th className="py-1 font-normal">相对指数模型的误差</th>
            </tr>
          </thead>
          <tbody>
            {res.map(([m, r]) => (
              <tr key={m} className="border-b border-line-2">
                <td className="py-1" style={{ color: MODEL_COLOR[m] }}>
                  {MODEL_LABEL[m]}
                </td>
                <td className="num py-1">{formatSI(r.ID, "A")}</td>
                <td className="num py-1">{formatSI(r.UD, "V")}</td>
                <td className="num py-1">{m === "exp" ? "（基准）" : exact.ID > 1e-9 ? `${sig(((r.ID - exact.ID) / exact.ID) * 100, 2)} %` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Plot height={240} ariaLabel="二极管模型与负载线" x={{ domain: [-0.2, Math.max(1, Math.min(V, 1.2))], label: "u_D / V" }} y={{ domain: [0, iMax], label: "mA" }}>
        {(s) => (
          <g>
            {MODELS.map((m) => (
              <Line key={m} points={iv[m]} s={s} color={MODEL_COLOR[m]} width={m === "exp" ? 2.4 : 1.6} dash={m === "exp" ? undefined : "5 3"} />
            ))}
            <Line
              points={[
                [0, (V / R) * 1e3],
                [V, 0],
              ]}
              s={s}
              color="var(--err)"
              width={1.6}
            />
            {res.map(([m, r]) => (
              <circle key={m} cx={s.sx(r.UD)} cy={s.sy(r.ID * 1e3)} r={3.5} fill={MODEL_COLOR[m]} />
            ))}
          </g>
        )}
      </Plot>
      <Legend items={[["理想", MODEL_COLOR.ideal, "5 3"], ["恒压降 0.7 V", MODEL_COLOR.const, "5 3"], ["折线", MODEL_COLOR.pwl, "5 3"], ["指数", MODEL_COLOR.exp], ["负载线", "var(--err)"]]} />
    </WidgetCard>
  );
}

/* ───────────── 判断通断：二极管门电路 ───────────── */
export function DiodeGateDemo() {
  const [kind, setKind] = useState<"and" | "or">("and");
  const [UA, setUA] = useState(0);
  const [UB, setUB] = useState(3);
  const Vref = kind === "and" ? 5 : 0;
  const r = diodeGate(kind, [UA, UB], Vref, 0.7);
  return (
    <WidgetCard
      title="交互：假设—验证法判断二极管通断"
      testId="diode-gate"
      controls={
        <>
          <Segmented
            label="电路"
            value={kind}
            onChange={setKind}
            options={[
              { value: "and", label: "阴极接输入" },
              { value: "or", label: "阳极接输入" },
            ]}
          />
          <ParamSlider label="$U_A$" value={UA} onChange={setUA} min={0} max={5} step={0.1} unit="V" testId="gate-ua" />
          <ParamSlider label="$U_B$" value={UB} onChange={setUB} min={0} max={5} step={0.1} unit="V" />
          <div className="grid grid-cols-3 gap-1.5">
            <Readout label="$U_O$" value={formatSI(r.UO, "V")} tone="dc" testId="gate-uo" />
            <Readout label="VD₁" value={r.on[0] ? "导通" : "截止"} tone={r.on[0] ? "ok" : undefined} testId="gate-d1" />
            <Readout label="VD₂" value={r.on[1] ? "导通" : "截止"} tone={r.on[1] ? "ok" : undefined} />
          </div>
        </>
      }
      footer="恒压降模型（$U_{on}$=0.7 V）。步骤：① 先把所有二极管断开，求各管阳极与阴极之间的开路电压；② 开路电压最大（且超过 $U_{on}$）的那只**优先导通**；③ 把它换成 0.7 V 电压源，再检查其余各管——两只管子的开路电压相等时才会同时导通。"
    >
      {kind === "and" ? <DiodeGateAnd labels={{ A: `${sig(UA, 2)} V`, B: `${sig(UB, 2)} V`, R: "3 kΩ", Vsub: "CC=5 V" }} /> : <DiodeGateOr labels={{ A: `${sig(UA, 2)} V`, B: `${sig(UB, 2)} V`, R: "3 kΩ" }} />}
      <p className="text-[13px] text-ink-2" data-testid="gate-why">
        {kind === "and" ? (
          <Rich
            text={`断开二极管时两只管子的阳极都被 $R$ 拉到 5 V，开路电压分别为 $5-U_A=${sig(5 - UA, 2)}$ V、$5-U_B=${sig(5 - UB, 2)}$ V。输入**较低**的那只开路电压更大，先导通，把 $U_O$ 钳在 $\\min(U_A,U_B)+0.7=${sig(r.UO, 3)}$ V。`}
          />
        ) : (
          <Rich text={`断开二极管时输出被 $R$ 拉到 0 V，开路电压就是 $U_A$、$U_B$。输入**较高**的那只先导通，$U_O=\\max(U_A,U_B)-0.7=${sig(Math.max(r.UO, 0), 3)}$ V（若都不超过 0.7 V，则都截止、$U_O=0$）。`} />
        )}
      </p>
    </WidgetCard>
  );
}

/* ───────────── 小信号模型 r_d ───────────── */
export function DiodeSmallSignal() {
  const [ID, setID] = useState(1e-3);
  const [um, setUm] = useState(0.005);
  const UD = diodeVoltage(ID, SI_DIODE);
  const rd = dynamicResistance(ID);
  const wave = useMemo(() => {
    const ex: Array<[number, number]> = [];
    const lin: Array<[number, number]> = [];
    for (let k = 0; k <= 200; k++) {
      const ph = k / 200;
      const du = um * Math.sin(2 * Math.PI * ph);
      ex.push([ph, (diodeCurrent(UD + du, SI_DIODE) - ID) * 1e3]);
      lin.push([ph, (du / rd) * 1e3]);
    }
    return { ex, lin };
  }, [ID, um, UD, rd]);
  const peak = Math.max(...wave.ex.map((p) => Math.abs(p[1])), 1e-6);
  return (
    <WidgetCard
      title="交互：直流工作点上的小信号——$r_d=U_T/I_D$"
      testId="diode-small"
      controls={
        <>
          <ParamSlider label="直流电流 $I_D$" value={ID} onChange={setID} min={0.05e-3} max={20e-3} log unit="mA" scale={1e-3} testId="ds-id" />
          <ParamSlider label="交流电压幅值 $U_{dm}$" value={um} onChange={setUm} min={0.0005} max={0.05} log unit="mV" scale={1e-3} />
          <div className="grid grid-cols-2 gap-1.5">
            <Readout label="$U_D$" value={formatSI(UD, "V")} tone="dc" />
            <Readout label="$r_d$" value={formatSI(rd, "Ω")} tone="ss" testId="ds-rd" />
            <Readout label="直流电阻 $U_D/I_D$" value={formatSI(UD / ID, "Ω")} />
            <Readout label={r`$I_{dm}\approx U_{dm}/r_d$`} value={formatSI(um / rd, "A")} />
          </div>
        </>
      }
      footer="$r_d$ 是 Q 点处伏安特性切线斜率的倒数，与直流电阻 $U_D/I_D$ 完全不同（相差一个数量级以上）。幅值远小于 $U_T$≈26 mV 时，实线（指数模型）与虚线（$r_d$ 线性模型）几乎重合；幅值接近或超过 $U_T$ 时波形明显不对称。"
    >
      <PlotTitle>{String.raw`交流电流 $i_d(t)$（mA）：实线为指数模型，虚线为 $u_d/r_d$`}</PlotTitle>
      <Plot height={220} ariaLabel="二极管小信号电流" x={{ domain: [0, 1], label: "t / T" }} y={{ domain: [-peak * 1.2, peak * 1.2] }}>
        {(s) => (
          <g>
            <Line points={wave.ex} s={s} color="var(--ch3)" width={2.2} />
            <Line points={wave.lin} s={s} color="var(--ss)" width={1.4} dash="5 3" />
          </g>
        )}
      </Plot>
    </WidgetCard>
  );
}

/* ───────────── 稳压管稳压电路 ───────────── */
export function ZenerDemo() {
  const [UI, setUI] = useState(12);
  const [R, setR] = useState(200);
  const [RL, setRL] = useState(1e3);
  const z = DEFAULT_ZENER;
  const r = solveZenerRegulator(UI, R, RL, z);
  const range = limitResistorRange(UI * 0.9, UI * 1.1, 0, z.UZ / RL, z);
  const txt = {
    off: "稳压管**未击穿**：$R$ 与 $R_L$ 分压得到的电压低于 $U_Z$，输出随负载、输入变化，不能稳压。",
    under: "已击穿但 $I_Z<I_{Z\\min}$：处在击穿特性的“拐弯”处，稳压效果差。应减小 $R$ 或减轻负载。",
    ok: "正常稳压：$I_{Z\\min}\\le I_Z\\le I_{ZM}$，输出约等于 $U_Z$。",
    over: "$I_Z>I_{ZM}$：稳压管功耗超过额定值，会过热损坏。应增大限流电阻 $R$。",
  }[r.status];
  const pct = (x: number) => `${Math.min(100, (x / (z.IZM * 1.4)) * 100)}%`;
  return (
    <WidgetCard
      title="交互：稳压管稳压电路与限流电阻"
      testId="zener-demo"
      controls={
        <>
          <ParamSlider label="输入电压 $U_I$" value={UI} onChange={setUI} min={4} max={20} step={0.1} unit="V" testId="zn-ui" />
          <ParamSlider label="限流电阻 $R$" value={R} onChange={setR} min={20} max={2e3} log unit="Ω" testId="zn-r" />
          <ParamSlider label="负载 $R_L$" value={RL} onChange={setRL} min={100} max={20e3} log unit="kΩ" scale={1e3} />
          <div className="grid grid-cols-2 gap-1.5">
            <Readout label="$U_O$" value={formatSI(r.UO, "V")} tone="dc" testId="zn-uo" />
            <Readout label="$I_Z$" value={formatSI(r.IZ, "A")} tone={r.status === "ok" ? "ok" : "err"} testId="zn-iz" />
            <Readout label="$I_R$" value={formatSI(r.IR, "A")} />
            <Readout label="$I_L$" value={formatSI(r.IL, "A")} />
          </div>
        </>
      }
      footer={`稳压管：$U_Z$=6 V（理想击穿，$r_z$=0），$I_{Z\\min}$=5 mA，$I_{ZM}$=30 mA。若 $U_I$ 在 ±10% 内波动、负载在空载到 $R_L$ 之间变化，限流电阻应满足 $${sig(range.Rmin, 3)}\\,\\Omega\\le R\\le ${range.Rmax > 0 ? sig(range.Rmax, 3) : "—"}\\,\\Omega$${range.feasible ? "" : "（无解：负载电流太大或输入太低）"}。`}
    >
      <p className="text-[13.5px]" data-testid="zn-status">
        <Rich text={txt} />
      </p>
      <div>
        <div className="mb-1 flex justify-between text-[12px] text-ink-3">
          <span>稳压管电流 I_Z</span>
          <span className="num">{formatSI(r.IZ, "A")}</span>
        </div>
        <div className="relative h-5 overflow-hidden rounded bg-sunken">
          <div className="absolute inset-y-0 bg-ok-soft" style={{ left: pct(z.IZmin), width: `calc(${pct(z.IZM)} - ${pct(z.IZmin)})` }} />
          <div className="absolute inset-y-1 left-0 rounded bg-dc transition-[width] duration-200" style={{ width: pct(Math.max(0, r.IZ)) }} />
          <div className="absolute inset-y-0 w-px bg-ok" style={{ left: pct(z.IZmin) }} />
          <div className="absolute inset-y-0 w-px bg-err" style={{ left: pct(z.IZM) }} />
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-ink-3">
          <span>0</span>
          <span>绿色区间：I_Zmin–I_ZM</span>
          <span>{formatSI(z.IZM * 1.4, "A")}</span>
        </div>
      </div>
    </WidgetCard>
  );
}

/* ───────────── 整流、限幅、钳位波形 ───────────── */
type WaveKind = "half" | "bridge" | "clip1" | "clip2" | "clamp";

export function DiodeWaveforms({ initial = "half" as WaveKind }: { initial?: WaveKind }) {
  const [kind, setKind] = useState<WaveKind>(initial);
  const [Um, setUm] = useState(10);
  const [E, setE] = useState(3);
  const [real, setReal] = useState(true);
  const [RCT, setRCT] = useState(20);
  const Uon = real ? 0.7 : 0;
  const data = useMemo(() => {
    const ui: Array<[number, number]> = [];
    const uo: Array<[number, number]> = [];
    if (kind === "clamp") {
      const f = 1000;
      const R = 10e3;
      const C = (RCT / f) / R;
      const sim = simulateClamp({ Um, f, C, R, E: 0, Uon, periods: 6, steps: 200 });
      for (let k = 0; k < sim.t.length; k += 2) {
        ui.push([sim.t[k] * f, sim.ui[k]]);
        uo.push([sim.t[k] * f, sim.uo[k]]);
      }
      return { ui, uo, xmax: 6 };
    }
    for (let k = 0; k <= 400; k++) {
      const ph = (2 * k) / 400;
      const u = Um * Math.sin(2 * Math.PI * ph);
      ui.push([ph, u]);
      const o = kind === "half" ? rectify(u, "half", Uon) : kind === "bridge" ? rectify(u, "bridge", Uon) : kind === "clip1" ? clip(u, { upper: E + Uon }) : clip(u, { upper: E + Uon, lower: -E - Uon });
      uo.push([ph, o]);
    }
    return { ui, uo, xmax: 2 };
  }, [kind, Um, E, Uon, RCT]);
  const desc: Record<WaveKind, string> = {
    half: `半波整流：$u_2>U_{on}$ 时二极管导通，$u_O=u_2-U_{on}$；负半周截止，$u_O=0$。`,
    bridge: `桥式整流：正、负半周各有两只二极管导通（两个管压降），负载上始终是同一方向的电压。`,
    clip1: `上限幅：$u_I>E+U_{on}$ 时二极管导通，输出被钳在 $E+U_{on}=${sig(E + Uon, 3)}$ V；其余时间二极管截止，$u_O=u_I$。`,
    clip2: `双向限幅：两只二极管分别限制正、负方向，输出被限制在 $\\pm${sig(E + Uon, 3)}$ V 之间。`,
    clamp: `钳位：前几个周期二极管在正峰附近导通给 $C$ 充电；稳态后 $C$ 上保持约 $U_m-U_{on}$ 的直流电压，输出波形整体下移，正峰被钳在 $U_{on}$ 附近。$RC$ 越大，放电越慢，钳位越“平”。`,
  };
  const lim = Um * (kind === "clamp" ? 2.2 : 1.15);
  return (
    <WidgetCard
      title="交互：二极管波形电路"
      testId="diode-waves"
      wide
      controls={
        <>
          <ChipGroup
            label="电路"
            value={kind}
            onChange={setKind}
            testId="wave-kind"
            options={[
              { value: "half", label: "半波" },
              { value: "bridge", label: "桥式" },
              { value: "clip1", label: "上限幅" },
              { value: "clip2", label: "双向限幅" },
              { value: "clamp", label: "钳位" },
            ]}
          />
          <ParamSlider label="输入幅值 $U_m$" value={Um} onChange={setUm} min={1} max={20} step={0.1} unit="V" />
          {(kind === "clip1" || kind === "clip2") && <ParamSlider label="参考电压 $E$" value={E} onChange={setE} min={0} max={10} step={0.1} unit="V" />}
          {kind === "clamp" && <ParamSlider label="时间常数 $RC/T$" value={RCT} onChange={setRCT} min={0.2} max={100} log unit="" />}
          <Toggle checked={real} onChange={setReal} label="计入导通压降 0.7 V" />
        </>
      }
      footer={kind === "clamp" ? "钳位曲线来自时域仿真（后向欧拉，二极管导通电阻 10 Ω）；其余为恒压降模型的逐点计算，输出端空载。" : "恒压降模型（或理想模型），输出端空载，串联电阻上的压降在二极管截止时为零。"}
    >
      <Plot height={250} ariaLabel="输入与输出波形" x={{ domain: [0, data.xmax], label: "t / T" }} y={{ domain: [-lim, lim], label: "V" }}>
        {(s) => (
          <g>
            <Line points={data.ui} s={s} color="var(--ch1)" width={1.5} dash="5 3" />
            <Line points={data.uo} s={s} color="var(--ch2)" width={2.4} testId="wave-uo" />
          </g>
        )}
      </Plot>
      <Legend items={[["$u_I$（或 $u_2$）", "var(--ch1)", "5 3"], ["$u_O$", "var(--ch2)"]]} />
      <p className="text-[13px] text-ink-2">
        <Rich text={desc[kind]} />
      </p>
    </WidgetCard>
  );
}
