"use client";

import { r } from "@/components/math/Tex";

import { useMemo, useState } from "react";
import { analyzeCE } from "@/simulations/bjt/ce";
import { simulateWaveforms } from "@/simulations/bjt/transient";
import { DEFAULT_CE, type CEParams } from "@/simulations/bjt/types";
import { acRms, harmonic } from "@/simulations/dsp";
import { formatSI, par, sig } from "@/simulations/units";
import { ParamSlider, Readout } from "@/components/ui/primitives";
import { Rich } from "@/components/math/Tex";

/** 能量从哪里来：信号源功率、输出信号功率与直流电源功率对比 */
export function PowerBudget() {
  const [Usm, setUsm] = useState(0.005);
  const p: CEParams = { ...DEFAULT_CE, Usm, Rs: 600 };
  const a = useMemo(() => analyzeCE(p), [Usm]); // eslint-disable-line react-hooks/exhaustive-deps
  const w = useMemo(() => simulateWaveforms(p, { periods: 1, samplesPerPeriod: 256, analysis: a }), [a]); // eslint-disable-line react-hooks/exhaustive-deps
  // 输入功率：信号源送入放大电路输入端的平均功率 = U_i,rms² / R_i（小信号近似）
  const Ui = harmonic(w.ui, w.samplesPerPeriod, 1).amp / Math.SQRT2;
  const Pi = (Ui * Ui) / a.ac.Ri;
  // 输出功率：负载上的交流平均功率 = U_o,rms² / R_L
  const Uo = acRms(w.uo);
  const Po = (Uo * Uo) / p.RL;
  // 直流电源平均功率：V_CC × (集电极电流平均值 + 偏置电流)
  let icAvg = 0;
  for (const v of w.iC) icAvg += v;
  icAvg /= w.iC.length;
  const PV = p.VCC * (icAvg + (p.VCC - a.dc.UBQ) / p.Rb);
  const Gp = Po / Pi;
  const bars: Array<[string, number, string]> = [
    ["$P_i$ 信号源送入", Pi, "var(--ch1)"],
    ["$P_o$ 负载得到", Po, "var(--ch2)"],
    ["$P_V$ 直流电源提供", PV, "var(--dc)"],
  ];
  const maxLog = Math.log10(PV * 3);
  const minLog = Math.log10(Math.max(Pi, 1e-12) / 3);
  return (
    <div className="card my-5 p-4" data-testid="power-budget">
      <div className="eyebrow mb-3">交互：功率预算（对数刻度）</div>
      <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
        <div className="space-y-3">
          <ParamSlider label="信号源峰值 $U_{sm}$" value={Usm} onChange={setUsm} min={0.0005} max={0.03} log unit="mV" scale={1e-3} />
          <div className="grid grid-cols-2 gap-1.5">
            <Readout label="功率增益 $P_o/P_i$" value={sig(Gp, 3)} tone="ok" />
            <Readout label="$P_o/P_V$" value={`${sig((Po / PV) * 100, 2)} %`} />
          </div>
        </div>
        <div className="space-y-3">
          {bars.map(([label, v, color]) => (
            <div key={label}>
              <div className="flex justify-between text-[12.5px]">
                <Rich text={label} />
                <span className="num">{formatSI(v, "W")}</span>
              </div>
              <div className="mt-1 h-3 overflow-hidden rounded bg-sunken">
                <div
                  className="h-full rounded transition-[width] duration-300"
                  style={{ width: `${Math.max(1, ((Math.log10(v) - minLog) / (maxLog - minLog)) * 100)}%`, background: color }}
                />
              </div>
            </div>
          ))}
          <p className="text-[12.5px] text-ink-2">
            <Rich text="功率增益可以达到上千倍，但 $P_o$ 始终远小于 $P_V$：多出来的信号功率全部来自直流电源，晶体管只是按输入信号的形状去“调节”它。" />
          </p>
        </div>
      </div>
    </div>
  );
}

/** 容抗与电路电阻的比较：电容何时可视为短路/开路 */
export function CapReactance() {
  const [C, setC] = useState(10e-6);
  const [f, setF] = useState(1000);
  const R = 1400; // 典型的 R_i 量级
  const Xc = 1 / (2 * Math.PI * f * C);
  const ratio = Xc / R;
  const verdict =
    ratio < 0.1 ? "可视为短路（容抗不到回路电阻的 1/10）" : ratio > 10 ? "接近开路（容抗远大于回路电阻）" : "既不能当短路也不能当开路：处于低频转折区，需要按频率响应分析";
  return (
    <div className="card my-5 p-4" data-testid="cap-reactance">
      <div className="eyebrow mb-3">
        <Rich text={String.raw`交互：容抗 $X_C=1/(2\pi fC)$ 与回路电阻比较`} />
      </div>
      <div className="grid gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
        <div className="space-y-3">
          <ParamSlider label="电容 $C$" value={C} onChange={setC} min={0.1e-6} max={1000e-6} log unit="µF" scale={1e-6} />
          <ParamSlider label="信号频率 $f$" value={f} onChange={setF} min={0.1} max={100e3} log unit="Hz" scale={1} />
        </div>
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-1.5">
            <Readout label="$X_C$" value={formatSI(Xc, "Ω")} tone="ac" />
            <Readout label="回路电阻（如 $R_i$）" value={formatSI(R, "Ω")} />
            <Readout label="$X_C/R$" value={sig(ratio, 3)} tone={ratio < 0.1 ? "ok" : ratio > 10 ? "err" : "warn"} />
          </div>
          <p className="text-[13.5px]" data-testid="cap-verdict">
            {verdict}
          </p>
          <p className="text-[12.5px] text-ink-3">
            <Rich text={r`直流 $f=0$ 时 $X_C\to\infty$：任何电容都开路。“中频”指的是频率高到所有耦合、旁路电容都可视为短路，又低到晶体管结电容的影响可以忽略的频段。`} />
          </p>
        </div>
      </div>
    </div>
  );
}

/** 测量法求输出电阻：空载输出 U_o' 与带载输出 U_o */
export function RoMeasure() {
  const [RL, setRL] = useState(3e3);
  const [Rc, setRc] = useState(3e3);
  // 随 R_c 调整 R_b，使 U_CEQ 保持约 6 V（管子始终在放大区）：I_CQ = 6 V / R_c，R_b = (V_CC − U_BEQ)·β / I_CQ
  const p: CEParams = { ...DEFAULT_CE, RL, Rc, Rb: ((12 - 0.7) * 100 * Rc) / 6 };
  const a = analyzeCE(p);
  const aOpen = analyzeCE({ ...p, RL: Infinity });
  const Ui = 0.005 / Math.SQRT2; // 5 mV 峰值的有效值
  const UoOpen = Math.abs(aOpen.ac.Au) * Ui;
  const UoLoad = Math.abs(a.ac.Au) * Ui;
  const RoMeas = (UoOpen / UoLoad - 1) * RL;
  return (
    <div className="card my-5 p-4" data-testid="ro-measure">
      <div className="eyebrow mb-3">
        <Rich text="交互：用“空载/带载”两次测量求 $R_o$" />
      </div>
      <div className="grid gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
        <div className="space-y-3">
          <ParamSlider label="$R_c$" value={Rc} onChange={setRc} min={500} max={20e3} log unit="kΩ" scale={1e3} />
          <ParamSlider label="负载 $R_L$" value={RL} onChange={setRL} min={300} max={100e3} log unit="kΩ" scale={1e3} />
        </div>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            <Readout label="空载 $U_o'$" value={formatSI(UoOpen, "V")} />
            <Readout label="带载 $U_o$" value={formatSI(UoLoad, "V")} />
            <Readout label="测得 $R_o$" value={formatSI(RoMeas, "Ω")} tone="ac" testId="ro-measured" />
            <Readout label={r`理论 $R_o\approx R_c$`} value={formatSI(Rc, "Ω")} />
          </div>
          <Rich
            text={String.raw`$$U_o=U_o'\frac{R_L}{R_o+R_L}\ \Rightarrow\ R_o=\left(\frac{U_o'}{U_o}-1\right)R_L=\left(\frac{${sig(UoOpen * 1e3, 4)}}{${sig(UoLoad * 1e3, 4)}}-1\right)\times ${sig(RL / 1e3, 3)}\,\mathrm{k\Omega}=${sig(RoMeas / 1e3, 4)}\,\mathrm{k\Omega}$$`}
          />
          <p className="text-[12.5px] text-ink-3">
            <Rich text={`放大电路的输出端可以等效为“电压源 $U_o'$ 串联内阻 $R_o$”（戴维南等效）。$R_L$ 越接近 $R_o$，带载后电压损失越大：此时 $R_L'=R_c\\para R_L=${formatSI(par(Rc, RL), "Ω")}$。`} />
          </p>
        </div>
      </div>
    </div>
  );
}
