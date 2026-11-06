"use client";

import { useMemo, useState } from "react";
import type { Waveforms } from "@/simulations/bjt/transient";
import type { CEAnalysis } from "@/simulations/bjt/ce";
import { acRms, harmonic, mean, peaks, phaseDifferenceDeg, thd } from "@/simulations/dsp";
import { formatSI, sig } from "@/simulations/units";
import { useWidth } from "@/components/plot/Plot";
import { Segmented, Toggle } from "@/components/ui/primitives";
import { usePhase, useRunning, type Clock } from "./model";

const DIVX = 10;
const DIVY = 8;
const STEPS = [1, 2, 5];

/** 选择 1-2-5 序列的每格刻度，使峰值约占 3 格 */
function autoScale(peak: number): number {
  const target = Math.max(peak, 1e-12) / 3.2;
  const mag = Math.pow(10, Math.floor(Math.log10(target)));
  for (const s of STEPS) if (s * mag >= target) return s * mag;
  return 10 * mag;
}

function sampleAt(arr: Float64Array, phase: number): number {
  const n = arr.length;
  const x = (((phase % 1) + 1) % 1) * n;
  const i = Math.floor(x) % n;
  const j = (i + 1) % n;
  const f = x - Math.floor(x);
  return arr[i] * (1 - f) + arr[j] * f;
}

export interface ScopeStats {
  uiPk: number;
  uoMax: number;
  uoMin: number;
  uoRms: number;
  uoMean: number;
  gain: number;
  phase: number;
  thd: number;
}

export function useScopeStats(w: Waveforms): ScopeStats {
  return useMemo(() => {
    const spp = w.samplesPerPeriod;
    const ui = peaks(w.ui);
    const uo = peaks(w.uo);
    const a1o = harmonic(w.uo, spp, 1).amp;
    const a1i = harmonic(w.ui, spp, 1).amp;
    return {
      uiPk: Math.max(Math.abs(ui.max), Math.abs(ui.min)),
      uoMax: uo.max,
      uoMin: uo.min,
      uoRms: acRms(w.uo),
      uoMean: mean(w.uo),
      gain: a1i > 0 ? a1o / a1i : 0,
      phase: a1i > 0 && a1o > 0 ? phaseDifferenceDeg(w.ui, w.uo, spp) : 0,
      thd: a1o > 0 ? thd(w.uo, spp) : 0,
    };
  }, [w]);
}

export function Scope({ waves, analysis, clock, freq }: { waves: Waveforms; analysis: CEAnalysis; clock: Clock; freq: number }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const phase = usePhase(clock);
  const running = useRunning(clock);
  const [periods, setPeriods] = useState<"1" | "2" | "4">("2");
  const [show, setShow] = useState({ ch1: true, ch2: true, ch3: true, lin: true });
  const stats = useScopeStats(waves);
  const { dc } = analysis;

  const ui = waves.ui;
  const uo = waves.uo;
  const iC = waves.iC;
  const pkUi = peaks(ui);
  const pkUo = peaks(uo);
  const pkLin = peaks(waves.uoLinear);
  const s1 = autoScale(Math.max(Math.abs(pkUi.max), Math.abs(pkUi.min)));
  const s2 = autoScale(Math.max(Math.abs(pkUo.max), Math.abs(pkUo.min), show.lin ? Math.max(Math.abs(pkLin.max), Math.abs(pkLin.min)) * 0.6 : 0));
  const dI = Math.max(...Array.from(iC, (v) => Math.abs(v - dc.ICQ)), 1e-9);
  const s3 = autoScale(Math.max(dI, dc.ICQ * 0.25));

  const Tw = Number(periods);
  const W = Math.max(width, 260);
  const H = Math.round(Math.min(340, Math.max(220, W * 0.42)));
  const gx = W / DIVX;
  const gy = H / DIVY;
  const yOf = (v: number, scale: number, offset = 0) => H / 2 - ((v - offset) / scale) * gy;
  const N = Math.min(900, Math.round(W * 1.2));

  const trace = (arr: Float64Array, scale: number, offset = 0) => {
    let d = "";
    for (let k = 0; k <= N; k++) {
      const ph = phase - Tw / 2 + (k / N) * Tw;
      const v = sampleAt(arr, ph);
      const y = Math.max(-40, Math.min(H + 40, yOf(v, scale, offset)));
      d += `${k ? "L" : "M"}${((k / N) * W).toFixed(1)} ${y.toFixed(1)}`;
    }
    return d;
  };

  const cur = {
    ui: sampleAt(ui, phase),
    uo: sampleAt(uo, phase),
    iC: sampleAt(iC, phase),
    region: waves.region[Math.floor((((phase % 1) + 1) % 1) * waves.region.length) % waves.region.length],
  };
  const timePerDiv = (Tw / freq) / DIVX;
  const regionLabel = { active: "放大区", cutoff: "截止", saturation: "饱和" }[cur.region];

  return (
    <div className="card overflow-hidden" data-testid="scope">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
        <span className="eyebrow mr-1">示波器</span>
        <button
          type="button"
          onClick={() => clock.setRunning(!running)}
          className="num rounded-md border border-line bg-elev px-2.5 py-0.5 text-[12.5px] hover:border-ink-3"
          data-testid="scope-run"
          aria-pressed={!running}
        >
          {running ? "❚❚ 暂停" : "▶ 运行"}
        </button>
        <Segmented
          size="sm"
          label="时间范围"
          value={periods}
          onChange={setPeriods}
          options={[
            { value: "1", label: "1T" },
            { value: "2", label: "2T" },
            { value: "4", label: "4T" },
          ]}
        />
        <span className="num ml-auto text-[11.5px] text-ink-3">
          {formatSI(timePerDiv, "s")}/div · 慢放 {clock.speed} 周期/秒
        </span>
      </div>

      <div ref={ref} className="relative bg-[#0b0f14]" style={{ height: H }}>
        {width > 0 && (
          <svg
            width={W}
            height={H}
            className="block"
            role="img"
            aria-label="输入输出波形"
            onPointerMove={(e) => {
              if (running) return;
              const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
              const fx = (e.clientX - r.left) / W;
              clock.setPhase(phase - Tw / 2 + fx * Tw);
            }}
          >
            {/* 网格 */}
            {Array.from({ length: DIVX + 1 }, (_, i) => (
              <line key={`x${i}`} x1={i * gx} x2={i * gx} y1={0} y2={H} stroke="rgba(160,190,220,.13)" strokeWidth={i === DIVX / 2 ? 1 : 0.6} />
            ))}
            {Array.from({ length: DIVY + 1 }, (_, i) => (
              <line key={`y${i}`} y1={i * gy} y2={i * gy} x1={0} x2={W} stroke="rgba(160,190,220,.13)" strokeWidth={i === DIVY / 2 ? 1 : 0.6} />
            ))}
            {/* 光标 */}
            <line x1={W / 2} x2={W / 2} y1={0} y2={H} stroke="rgba(255,255,255,.35)" strokeDasharray="2 4" />
            {/* i_C = 0 参考线 */}
            {show.ch3 && <line x1={0} x2={W} y1={yOf(0, s3, dc.ICQ)} y2={yOf(0, s3, dc.ICQ)} stroke="#e879f9" strokeOpacity={0.35} strokeDasharray="6 4" />}
            {show.lin && show.ch2 && <path d={trace(waves.uoLinear, s2)} fill="none" stroke="#22d3ee" strokeOpacity={0.45} strokeWidth={1.2} strokeDasharray="5 4" />}
            {show.ch3 && <path d={trace(iC, s3, dc.ICQ)} fill="none" stroke="#e879f9" strokeWidth={1.6} data-testid="trace-ic" />}
            {show.ch1 && <path d={trace(ui, s1)} fill="none" stroke="#facc15" strokeWidth={1.8} data-testid="trace-ui" />}
            {show.ch2 && <path d={trace(uo, s2)} fill="none" stroke="#22d3ee" strokeWidth={2} data-testid="trace-uo" />}
          </svg>
        )}
        <div className="num pointer-events-none absolute left-2 top-1.5 flex flex-col gap-0.5 text-[11px]">
          {show.ch1 && <span style={{ color: "#facc15" }}>CH1 u_i {formatSI(s1, "V")}/div</span>}
          {show.ch2 && <span style={{ color: "#22d3ee" }}>CH2 u_o {formatSI(s2, "V")}/div</span>}
          {show.ch3 && <span style={{ color: "#e879f9" }}>CH3 i_C {formatSI(s3, "A")}/div · 中线 = I_CQ</span>}
        </div>
        <div className="num pointer-events-none absolute right-2 top-1.5 rounded bg-black/40 px-1.5 py-0.5 text-right text-[11px] text-white/85" data-testid="scope-cursor">
          <div>u_i {formatSI(cur.ui, "V")}</div>
          <div>u_o {formatSI(cur.uo, "V")}</div>
          <div>i_C {formatSI(cur.iC, "A")}</div>
          <div className={cur.region === "active" ? "text-white/60" : "text-[#f87171]"}>{regionLabel}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1.5 border-t border-line px-3 py-2">
        <Toggle checked={show.ch1} onChange={(v) => setShow((s) => ({ ...s, ch1: v }))} label={<span className="text-ch1">CH1 u_i</span>} />
        <Toggle checked={show.ch2} onChange={(v) => setShow((s) => ({ ...s, ch2: v }))} label={<span className="text-ch2">CH2 u_o</span>} />
        <Toggle checked={show.ch3} onChange={(v) => setShow((s) => ({ ...s, ch3: v }))} label={<span className="text-ch3">CH3 i_C</span>} />
        <Toggle checked={show.lin} onChange={(v) => setShow((s) => ({ ...s, lin: v }))} label={<span>小信号线性预测（虚线）</span>} />
      </div>

      <dl className="grid grid-cols-2 gap-px border-t border-line bg-line text-[12px] sm:grid-cols-4" data-testid="scope-measure">
        <Measure k="u_i 峰值" v={formatSI(stats.uiPk, "V")} />
        <Measure k="u_o 正/负峰" v={`${formatSI(stats.uoMax, "V")} / ${formatSI(stats.uoMin, "V")}`} testId="uo-peaks" />
        <Measure k="u_o 有效值" v={formatSI(stats.uoRms, "V")} />
        <Measure k="u_o 平均值（直流偏移）" v={formatSI(stats.uoMean, "V")} />
        <Measure k="基波增益 |U_o1/U_i1|" v={sig(stats.gain, 4)} />
        <Measure k="相位差 u_o − u_i" v={`${sig(stats.phase, 4)}°`} />
        <Measure k="THD(u_o)" v={`${sig(stats.thd * 100, 3)} %`} testId="thd" />
        <Measure k="小信号预测 |A_u|" v={sig(Math.abs(analysis.ac.Au), 4)} />
      </dl>
    </div>
  );
}

function Measure({ k, v, testId }: { k: string; v: string; testId?: string }) {
  return (
    <div className="bg-elev px-3 py-1.5">
      <dt className="text-[11px] text-ink-3">{k}</dt>
      <dd className="num text-[13px]" data-testid={testId}>
        {v}
      </dd>
    </div>
  );
}
