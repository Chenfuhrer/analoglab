/**
 * 频率响应（第 9 章）。
 *  - 一阶 RC 的精确与渐近波特图
 *  - 晶体管混合 π 模型参数：g_m = I_EQ/U_T，r_b'e = (1+β)U_T/I_EQ，C_π = g_m/(2πf_T) − C_μ，f_β = 1/[2πr_b'e(C_π+C_μ)]
 *  - 单管共射放大电路：中频源电压增益、米勒等效电容、上限频率（单极点近似）、下限频率（短路时间常数法，复用 ce.lowFrequency）
 *  - 多级放大电路：各级响应相乘；经验估算 f_L ≈ 1.1√Σf_Lk²，1/f_H ≈ 1.1√Σ(1/f_Hk)²
 * 模型假设：高频只考虑 C_π、C_μ（米勒近似，忽略输出端的 C_μ 支路）；低频把每个电容的转折频率当作一个独立极点。
 */
import { par } from "../units";
import { analyzeCE } from "../bjt/ce";
import type { CEParams } from "../bjt/types";
import { cabs, cargDeg, cmul, highPass, lowPass, type Cplx } from "../signal/rc";

/** 一阶环节的渐近线（dB）：低通在 f_c 以上 −20 dB/dec，高通在 f_c 以下 +20 dB/dec */
export function asymptoteDb(kind: "lp" | "hp", f: number, fc: number): number {
  if (kind === "lp") return f <= fc ? 0 : -20 * Math.log10(f / fc);
  return f >= fc ? 0 : 20 * Math.log10(f / fc);
}

/** 一阶环节相频渐近线（折线：0.1f_c ~ 10f_c 之间按 −45°/dec） */
export function asymptotePhase(kind: "lp" | "hp", f: number, fc: number): number {
  const x = Math.log10(f / fc);
  const base = x <= -1 ? 0 : x >= 1 ? -90 : -45 * (x + 1);
  return kind === "lp" ? base : base + 90;
}

export interface HybridPi {
  gm: number;
  rbpe: number;
  rbb: number;
  Cpi: number;
  Cmu: number;
  fbeta: number;
  fT: number;
}

export function hybridPi(o: { IEQ: number; beta: number; rbb: number; fT: number; Cmu: number; UT?: number }): HybridPi {
  const UT = o.UT ?? 0.026;
  const gm = o.IEQ / UT;
  const rbpe = ((1 + o.beta) * UT) / o.IEQ;
  const Cpi = Math.max(gm / (2 * Math.PI * o.fT) - o.Cmu, 0);
  const fbeta = 1 / (2 * Math.PI * rbpe * (Cpi + o.Cmu));
  return { gm, rbpe, rbb: o.rbb, Cpi, Cmu: o.Cmu, fbeta, fT: o.fT };
}

/** 共射电流放大系数随频率的变化 β(jf) = β₀/(1 + jf/f_β) */
export function betaOfF(beta0: number, fbeta: number, f: number): Cplx {
  return cmul({ re: beta0, im: 0 }, lowPass(f, fbeta));
}

export interface CEFreq {
  Ausm: number;
  fL: number;
  fH: number;
  /** 米勒等效输入电容 C_π' = C_π + (1 + g_mR_L')C_μ */
  CpiMiller: number;
  /** 从 C_π' 两端看进去的电阻 */
  Rpi: number;
  /** 增益带宽积 |A_usm|·f_H */
  GBW: number;
  hp: { fC1: number; fC2: number; fCe: number };
  hpi: HybridPi;
  RLp: number;
  /** 复频率响应 A_us(jf) */
  at: (f: number) => Cplx;
}

export function ceFrequency(p: CEParams, dev: { fT: number; Cmu: number }, opts: { miller?: boolean } = {}): CEFreq {
  const a = analyzeCE(p);
  const hpi = hybridPi({ IEQ: a.dc.IEQ, beta: p.beta, rbb: p.rbb, fT: dev.fT, Cmu: dev.Cmu, UT: p.UT });
  const RLp = a.ac.RLp;
  const ReAC = a.ac.ReAC;
  // 中频：发射极有未旁路电阻时，等效跨导降低为 g_m/(1 + g_m R_e)（近似，β ≫ 1）
  const Ausm = a.ac.Aus;
  const kGain = (hpi.gm * RLp) / (1 + hpi.gm * ReAC);
  const CpiMiller = hpi.Cpi + (opts.miller === false ? 1 : 1 + kGain) * hpi.Cmu;
  const Rsrc = par(p.Rs, a.dc.RB);
  // 有未旁路 R_e 时，从 C_π' 看进去的电阻还要并上射极反馈造成的等效电阻（简化：r_b'e(1+g_mR_e) 的并联支路）
  const Rpi = par(hpi.rbpe * (1 + hpi.gm * ReAC), hpi.rbb + Rsrc + ReAC);
  const fH = 1 / (2 * Math.PI * Rpi * CpiMiller);
  const lf = a.lf;
  const at = (f: number): Cplx => {
    let h: Cplx = { re: Ausm, im: 0 };
    for (const fc of [lf.fC1, lf.fC2, lf.fCe]) if (fc > 0) h = cmul(h, highPass(f, fc));
    return cmul(h, lowPass(f, fH));
  };
  return { Ausm, fL: lf.fL, fH, CpiMiller, Rpi, GBW: Math.abs(Ausm) * fH, hp: { fC1: lf.fC1, fC2: lf.fC2, fCe: lf.fCe }, hpi, RLp, at };
}

/** 找响应的 −3 dB 频率（中频增益取几何中点处的值），对数二分 */
export function bandEdges(at: (f: number) => Cplx, fMid: number, fmin = 1e-3, fmax = 1e12): { fL: number; fH: number; Am: number } {
  const Am = cabs(at(fMid));
  const target = Am / Math.SQRT2;
  const solve = (a: number, b: number, rising: boolean) => {
    let lo = a;
    let hi = b;
    for (let k = 0; k < 200; k++) {
      const mid = Math.sqrt(lo * hi);
      const above = cabs(at(mid)) > target;
      if (above === rising) hi = mid;
      else lo = mid;
    }
    return Math.sqrt(lo * hi);
  };
  return { fL: solve(fmin, fMid, true), fH: solve(fMid, fmax, false), Am };
}

/** 多级放大电路的经验估算 */
export function multistageEstimate(fLs: number[], fHs: number[]): { fL: number; fH: number } {
  const fL = fLs.length > 1 ? 1.1 * Math.sqrt(fLs.reduce((s, x) => s + x * x, 0)) : fLs[0];
  const fH = fHs.length > 1 ? 1 / (1.1 * Math.sqrt(fHs.reduce((s, x) => s + 1 / (x * x), 0))) : fHs[0];
  return { fL, fH };
}

/** n 级相同单极点（高、低各一个）级联的精确 −3 dB 频率：f_H·√(2^{1/n} − 1)，f_L/√(2^{1/n} − 1) */
export function identicalStages(n: number, fL: number, fH: number): { fL: number; fH: number } {
  const k = Math.sqrt(Math.pow(2, 1 / n) - 1);
  return { fL: fL / k, fH: fH * k };
}

/** 由若干一阶高通、低通环节构成的响应 */
export function poleResponse(Am: number, fLs: number[], fHs: number[]) {
  return (f: number): Cplx => {
    let h: Cplx = { re: Am, im: 0 };
    for (const x of fLs) h = cmul(h, highPass(f, x));
    for (const x of fHs) h = cmul(h, lowPass(f, x));
    return h;
  };
}

export { cabs, cargDeg };

/** 米勒等效电容（反相增益 −g_mR_L'）：C_M = (1 + g_mR_L')C_μ */
export function millerCap(gm: number, RLp: number, Cmu: number): number {
  return (1 + gm * RLp) * Cmu;
}
