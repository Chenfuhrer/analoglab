import { par } from "../units";
import { analyzeCE, emitterAC } from "./ce";
import type { CEAnalysis } from "./ce";
import type { CEParams, Region } from "./types";

/**
 * 准静态大信号波形求解（中频区）。
 *
 * 模型假设（会在 UI 中逐条展示）：
 *  1. 信号频率处于中频区：C_1、C_2、C_e 两端电压保持静态值不变（视为恒压源）。
 *  2. 发射结：i_B = I_B0 · exp[(u_B'E − U_B'E0)/U_T]，在 Q 点校准（I_B0 = I_BQ），
 *     因而 u_s = 0 时严格回到静态解，线性化后得到 r_b'e = U_T / I_BQ。
 *  3. 放大区 i_C = β i_B；u_CE < U_CES 时进入饱和，按 u_CE = U_CES 约束求解。
 *  4. 忽略 Early 效应（r_ce→∞）、结电容和温度变化。
 */

export interface OperatingSample {
  iB: number;
  iC: number;
  iE: number;
  uB: number;
  uC: number;
  uE: number;
  uCE: number;
  region: Region;
}

/** 截止 Q 点时，指数特性的参考电流（仅影响截止 Q 点下的大信号细节） */
const CUTOFF_REFERENCE_IB = 1e-6;
/** 波形中标记“截止”的阈值：i_B < 1% · I_B0 */
export const CUTOFF_FRACTION = 0.01;

export interface QuasiStaticSolver {
  solve(us: number): OperatingSample;
  analysis: CEAnalysis;
}

export function createSolver(p: CEParams, analysis: CEAnalysis = analyzeCE(p)): QuasiStaticSolver {
  const { dc } = analysis;
  const b = p.beta;
  const IB0 = dc.IBQ > 0 ? dc.IBQ : CUTOFF_REFERENCE_IB;
  // Q 点处的内部发射结电压（端电压 U_BEQ 减去 r_bb' 压降）
  const ujQ = p.UBE - dc.IBQ * p.rbb;
  const ReAC = emitterAC(p);
  // C_e 两端保持的静态电压（R_e2 被旁路时）
  const VE0 = p.hasCe && p.Re2 > 0 ? dc.IEQ * p.Re2 : 0;
  const RLp = par(p.Rc, p.RL);
  // 集电极节点：u_C = A − i_C · R_L'
  const A = Number.isFinite(p.RL) ? (p.VCC / p.Rc + dc.UCQ / p.RL) * RLp : p.VCC;
  const { VBB, RB } = dc;
  // 基极节点戴维南：u_B = Vth(u_s) − i_B · Rth
  const Rth = par(RB, p.Rs);
  const vth = (us: number) =>
    p.Rs === 0 ? dc.UBQ + us : (VBB * p.Rs + (us + dc.UBQ) * RB) / (RB + p.Rs);

  const junction = (uj: number) => IB0 * Math.exp((uj - ujQ) / p.UT);

  /** 在单调递减的 g(i) 上求根（g(0)>0），二分 + 牛顿混合 */
  function rootDecreasing(g: (i: number) => number): number {
    let lo = 0;
    let hi = Math.max(IB0, 1e-9);
    let guard = 0;
    while (g(hi) > 0 && guard++ < 200) hi *= 2;
    for (let k = 0; k < 200; k++) {
      const mid = 0.5 * (lo + hi);
      const gm = g(mid);
      if (gm > 0) lo = mid;
      else hi = mid;
      if (hi - lo <= 1e-15 + 1e-12 * hi) break;
    }
    return 0.5 * (lo + hi);
  }

  function solve(us: number): OperatingSample {
    const Vth = vth(us);
    // —— 放大区假设 ——
    const gActive = (iB: number) => {
      const iE = (1 + b) * iB;
      const uE = iE * ReAC + VE0;
      const uj = Vth - iB * (Rth + p.rbb) - uE;
      return junction(uj) - iB;
    };
    let iB = rootDecreasing(gActive);
    let iC = b * iB;
    let iE = iB + iC;
    let uE = iE * ReAC + VE0;
    let uC = A - iC * RLp;
    let region: Region = "active";

    if (uC - uE < p.UCES) {
      // —— 饱和：u_C − u_E = U_CES ——
      // A − i_C R_L' − (i_B + i_C) R_e,ac − V_E0 = U_CES
      const icOf = (ib: number) => Math.max(0, (A - VE0 - p.UCES - ib * ReAC) / (RLp + ReAC));
      const gSat = (ib: number) => {
        const ic = icOf(ib);
        const ue = (ib + ic) * ReAC + VE0;
        const uj = Vth - ib * (Rth + p.rbb) - ue;
        return junction(uj) - ib;
      };
      iB = rootDecreasing(gSat);
      iC = icOf(iB);
      iE = iB + iC;
      uE = iE * ReAC + VE0;
      uC = uE + p.UCES;
      region = "saturation";
    } else if (iB < CUTOFF_FRACTION * IB0) {
      // 指数模型中截止是渐变的：i_B 低于静态值的 1% 时标记为“截止”
      region = "cutoff";
    }
    const uB = Vth - iB * Rth;
    return { iB, iC, iE, uB, uC, uE, uCE: uC - uE, region };
  }

  return { solve, analysis };
}

export interface Waveforms {
  /** 时间轴 (s) */
  t: Float64Array;
  /** 信号源 u_s */
  us: Float64Array;
  /** 放大电路输入端交流电压 u_i = u_B − U_BQ */
  ui: Float64Array;
  /** 输出交流电压 u_o = u_C − U_CQ（经 C_2 后加在 R_L 上） */
  uo: Float64Array;
  /** 线性小信号预测 u_o,lin = A_us · u_s */
  uoLinear: Float64Array;
  /** 集电极总电流 i_C */
  iC: Float64Array;
  /** 基极总电流 i_B */
  iB: Float64Array;
  /** 管压降 u_CE */
  uCE: Float64Array;
  region: Region[];
  /** 每个周期的采样点数 */
  samplesPerPeriod: number;
  periods: number;
}

export function simulateWaveforms(
  p: CEParams,
  opts: { periods?: number; samplesPerPeriod?: number; analysis?: CEAnalysis } = {},
): Waveforms {
  const periods = opts.periods ?? 2;
  const spp = opts.samplesPerPeriod ?? 256;
  const solver = createSolver(p, opts.analysis);
  const { ac, dc } = solver.analysis;
  const N = periods * spp;
  const T = 1 / p.f;
  const t = new Float64Array(N);
  const us = new Float64Array(N);
  const ui = new Float64Array(N);
  const uo = new Float64Array(N);
  const uoLinear = new Float64Array(N);
  const iC = new Float64Array(N);
  const iB = new Float64Array(N);
  const uCE = new Float64Array(N);
  const region: Region[] = new Array(N);
  // 一个周期内的解可以复用（周期信号、准静态）
  const one: OperatingSample[] = [];
  for (let k = 0; k < spp; k++) {
    const s = p.Usm * Math.sin((2 * Math.PI * k) / spp);
    one.push(solver.solve(s));
  }
  for (let n = 0; n < N; n++) {
    const k = n % spp;
    const s = one[k];
    t[n] = (n / spp) * T;
    us[n] = p.Usm * Math.sin((2 * Math.PI * k) / spp);
    ui[n] = s.uB - dc.UBQ;
    uo[n] = s.uC - dc.UCQ;
    uoLinear[n] = ac.Aus * us[n];
    iC[n] = s.iC;
    iB[n] = s.iB;
    uCE[n] = s.uCE;
    region[n] = s.region;
  }
  return { t, us, ui, uo, uoLinear, iC, iB, uCE, region, samplesPerPeriod: spp, periods };
}
