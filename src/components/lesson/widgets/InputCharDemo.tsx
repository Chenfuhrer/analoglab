"use client";

import { useMemo, useState } from "react";
import { inputCurrent } from "@/simulations/bjt/characteristics";
import { formatSI, sig } from "@/simulations/units";
import { Line, Plot } from "@/components/plot/Plot";
import { ParamSlider, Readout, Toggle } from "@/components/ui/primitives";
import { Rich } from "@/components/math/Tex";

/** 示意晶体管：u_BE = 0.7 V 时 i_B = 20 µA（指数模型，U_T = 26 mV） */
const REF = { UBE: 0.7, IB: 20e-6, UT: 0.026 };
const N = 240;

/**
 * 输入特性演示：直流偏置的必要性 + r_b'e 是切线斜率的倒数。
 */
export function InputCharDemo({ showTangentDefault = false, initialBias = 0.7, initialAmp = 0.01 }: { showTangentDefault?: boolean; initialBias?: number; initialAmp?: number }) {
  const [bias, setBias] = useState(initialBias);
  const [amp, setAmp] = useState(initialAmp);
  const [tangent, setTangent] = useState(showTangentDefault);

  const IBQ = inputCurrent(bias, REF);
  const rbpe = REF.UT / IBQ;
  const yMax = 60e-6;

  const curve = useMemo(() => {
    const pts: Array<[number, number]> = [];
    for (let k = 0; k <= 300; k++) {
      const u = (0.85 * k) / 300;
      pts.push([u, inputCurrent(u, REF) * 1e6]);
    }
    return pts;
  }, []);

  const wave = useMemo(() => {
    const exact: Array<[number, number]> = [];
    const lin: Array<[number, number]> = [];
    const inp: Array<[number, number]> = [];
    for (let k = 0; k <= N; k++) {
      const ph = k / N;
      const ube = bias + amp * Math.sin(2 * Math.PI * ph);
      exact.push([ph, inputCurrent(ube, REF) * 1e6]);
      lin.push([ph, (IBQ + (ube - bias) / rbpe) * 1e6]);
      inp.push([ph, ube]);
    }
    return { exact, lin, inp };
  }, [bias, amp, IBQ, rbpe]);

  const ibMax = inputCurrent(bias + amp, REF);
  const ibMin = inputCurrent(bias - amp, REF);
  const asym = ibMax - IBQ > 0 ? (ibMax - IBQ - (IBQ - ibMin)) / (ibMax - ibMin) : 0;
  const cutoff = IBQ < 0.05e-6;

  return (
    <div className="card my-5 overflow-hidden" data-testid="input-char-demo">
      <div className="border-b border-line px-4 py-2">
        <span className="eyebrow">交互：输入特性、直流偏置与 r_b′e</span>
      </div>
      <div className="grid gap-4 p-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="space-y-3">
          <ParamSlider label="直流偏置 $U_{BEQ}$" value={bias} onChange={setBias} min={0} max={0.76} step={0.005} unit="V" scale={1} testId="icd-bias" />
          <ParamSlider label="交流幅值 $U_{bem}$" value={amp} onChange={setAmp} min={0.001} max={0.3} log unit="mV" scale={1e-3} testId="icd-amp" />
          <Toggle checked={tangent} onChange={setTangent} label="显示 Q 点切线" />
          <div className="grid grid-cols-2 gap-1.5">
            <Readout label="$I_{BQ}$" value={formatSI(IBQ, "A")} tone="dc" />
            <Readout label="$r_{b'e}=U_T/I_{BQ}$" value={cutoff ? "→∞" : formatSI(rbpe, "Ω")} tone="ss" />
            <Readout label="$i_B$ 最大" value={formatSI(ibMax, "A")} />
            <Readout label="$i_B$ 最小" value={formatSI(ibMin, "A")} />
          </div>
          <p className="text-[12.5px] leading-snug text-ink-2" data-testid="icd-verdict">
            {cutoff ? (
              <Rich text="没有偏置：发射结远未导通，绝大部分时间 $i_B\approx0$——信号根本“进不去”。" />
            ) : asym > 0.2 ? (
              <Rich text={`幅值已与 $U_T=26\\,\\mathrm{mV}$ 可比：$i_B$ 上下摆动明显不对称（不对称度 ${sig(asym * 100, 2)}%），切线近似失效。`} />
            ) : asym > 0.05 ? (
              <Rich text={`已能看出不对称（不对称度 ${sig(asym * 100, 2)}%）：切线近似仍可用，但误差不可忽略；$|u_{be}|$ 越小于 $U_T$ 越准确。`} />
            ) : (
              <Rich text={`$|u_{be}|\\ll U_T$：$i_B$ 近似正弦（不对称度 ${sig(asym * 100, 2)}%），可以用切线（即 $r_{b'e}$）代替曲线。`} />
            )}
          </p>
        </div>
        <div className="grid min-w-0 gap-3 md:grid-cols-2">
          <div>
            <div className="mb-1 text-[12px] text-ink-3">
              <Rich text={String.raw`输入特性 $i_B$–$u_{BE}$（示意管：0.7 V 时 20 µA）`} />
            </div>
            <Plot height={240} ariaLabel="输入特性曲线" x={{ domain: [0, 0.85], label: "u_BE / V" }} y={{ domain: [0, yMax * 1e6], label: "i_B / µA" }}>
              {(s) => (
                <g>
                  <rect
                    x={s.sx(Math.max(0, bias - amp))}
                    y={s.m.t}
                    width={Math.max(1, s.sx(bias + amp) - s.sx(Math.max(0, bias - amp)))}
                    height={s.ih}
                    fill="var(--ch1)"
                    fillOpacity={0.12}
                  />
                  <Line points={curve} s={s} color="var(--ink)" width={2} />
                  {tangent && !cutoff && (
                    <Line
                      points={[
                        [bias - 0.08, (IBQ - 0.08 / rbpe) * 1e6],
                        [bias + 0.08, (IBQ + 0.08 / rbpe) * 1e6],
                      ]}
                      s={s}
                      color="var(--ss)"
                      width={1.8}
                      dash="5 3"
                    />
                  )}
                  <circle cx={s.sx(bias)} cy={s.sy(Math.min(IBQ * 1e6, yMax * 1e6))} r={5} fill="var(--bg-elev)" stroke="var(--ink)" strokeWidth={2} />
                  <text x={s.sx(bias) - 8} y={s.sy(Math.min(IBQ * 1e6, yMax * 1e6)) - 8} fontSize={12} fontWeight={600} fill="var(--ink)" textAnchor="end">
                    Q
                  </text>
                </g>
              )}
            </Plot>
          </div>
          <div>
            <div className="mb-1 text-[12px] text-ink-3">
              <Rich text={String.raw`一个周期内的 $i_B(t)$：实线为指数模型，虚线为切线（线性）近似`} />
            </div>
            <Plot height={240} ariaLabel="基极电流波形" x={{ domain: [0, 1], label: "t / T" }} y={{ domain: [0, Math.max(yMax * 1e6, ibMax * 1.1e6)], label: "i_B / µA" }}>
              {(s) => (
                <g>
                  <Line points={wave.exact} s={s} color="var(--ch3)" width={2.2} />
                  {!cutoff && <Line points={wave.lin} s={s} color="var(--ss)" width={1.4} dash="5 3" />}
                  <line x1={s.m.l} x2={s.m.l + s.iw} y1={s.sy(IBQ * 1e6)} y2={s.sy(IBQ * 1e6)} stroke="var(--dc)" strokeDasharray="2 4" />
                </g>
              )}
            </Plot>
          </div>
        </div>
      </div>
    </div>
  );
}
