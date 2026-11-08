/**
 * 功率放大电路（第 10 章）。
 *  - 导通角与各类功放：集电极电流 i_C = I_CQ + I_cm sinωt（截止处削为 0），数值求平均功率与效率
 *  - 乙类 OCL：P_om、P_V、η、管耗的解析式
 *  - 互补射极跟随器的交越失真：两管均用指数模型 i_E = I_S e^{u_BE/U_T}，输出节点 KCL 二分求解；
 *    偏置电压 U_B（两基极之间）使电路工作在甲乙类
 *  - OTL：单电源 + 输出电容
 */
import { harmonic, thd } from "../dsp";

export type PAClass = "A" | "AB" | "B" | "C";

export interface ClassResult {
  /** 导通角（度），一个周期内导通的角度 */
  theta: number;
  /** 一个周期内归一化的 i_C 波形（I_cm = 1） */
  iC: number[];
  /** 最大输出（集电极电压摆幅 = V_CC）时的效率（单管、理想、谐振/变压器负载取基波） */
  eta: number;
}

/**
 * 单管集电极电流导通角：静态电流 I_CQ（相对 I_cm），θ = 2·arccos(−I_CQ/I_cm)（I_CQ ≥ I_cm 时 360°）。
 * 效率按“集电极电压摆幅等于 V_CC、负载只吸收基波功率”计算：η = ½·I_c1·V_CC / (V_CC·I_C0) = I_c1/(2I_C0)。
 */
export function conductionClass(IcqRel: number, n = 720): ClassResult {
  const iC: number[] = [];
  let on = 0;
  for (let k = 0; k < n; k++) {
    const v = IcqRel + Math.sin((2 * Math.PI * k) / n);
    iC.push(Math.max(0, v));
    if (v > 0) on++;
  }
  const avg = iC.reduce((s, x) => s + x, 0) / n;
  const I1 = harmonic(iC, n, 1).amp;
  return { theta: (360 * on) / n, iC, eta: avg > 0 ? I1 / (2 * avg) : 0 };
}

export interface OCLResult {
  Po: number;
  PV: number;
  PT: number;
  /** 每管管耗 */
  PT1: number;
  eta: number;
}

/** 乙类 OCL（理想互补管，正弦输出幅值 U_om） */
export function oclPower(VCC: number, RL: number, Uom: number): OCLResult {
  const Po = (Uom * Uom) / (2 * RL);
  const PV = (2 * VCC * Uom) / (Math.PI * RL);
  const PT = PV - Po;
  return { Po, PV, PT, PT1: PT / 2, eta: PV > 0 ? Po / PV : 0 };
}

export function oclMax(VCC: number, RL: number, UCES = 0): OCLResult & { Uom: number } {
  const Uom = VCC - UCES;
  return { ...oclPower(VCC, RL, Uom), Uom };
}

/** 每管最大管耗：U_om = 2V_CC/π 时 P_T1max = V_CC²/(π²R_L) ≈ 0.2 P_om（理想） */
export function oclMaxTubeLoss(VCC: number, RL: number): { Uom: number; PT1max: number } {
  const Uom = (2 * VCC) / Math.PI;
  return { Uom, PT1max: oclPower(VCC, RL, Uom).PT1 };
}

/** OTL：单电源 V_CC，输出电容上静态电压 V_CC/2，等效于 ±V_CC/2 的 OCL */
export function otlMax(VCC: number, RL: number, UCES = 0): OCLResult & { Uom: number } {
  return oclMax(VCC / 2, RL, UCES);
}

export interface PushPullSpec {
  /** 两管基极之间的偏置电压（0 为乙类；约 2U_on 为甲乙类） */
  Vbias: number;
  RL: number;
  /** 发射结饱和电流（示意管：0.6 V 时约 1 mA） */
  Is: number;
  UT: number;
  VCC: number;
  UCES: number;
}

export const DEFAULT_PP: PushPullSpec = { Vbias: 0, RL: 8, Is: 1e-3 * Math.exp(-0.6 / 0.026), UT: 0.026, VCC: 12, UCES: 1 };

/**
 * 互补射极跟随器：NPN 基极 u_I + U_B/2，PNP 基极 u_I − U_B/2，输出 u_O。
 * KCL：u_O/R_L = I_S e^{(u_I + U_B/2 − u_O)/U_T} − I_S e^{(u_O − u_I + U_B/2)/U_T}，单调，二分。
 * 输出被限制在 ±(V_CC − U_CES)。
 */
export function pushPullOutput(ui: number, p: PushPullSpec): { uo: number; iN: number; iP: number } {
  const ex = (x: number) => Math.exp(Math.min(x, 60));
  const f = (uo: number) => p.Is * ex((ui + p.Vbias / 2 - uo) / p.UT) - p.Is * ex((uo - ui + p.Vbias / 2) / p.UT) - uo / p.RL;
  let lo = -p.VCC;
  let hi = p.VCC;
  for (let k = 0; k < 120; k++) {
    const mid = (lo + hi) / 2;
    if (f(mid) > 0) lo = mid;
    else hi = mid;
  }
  let uo = (lo + hi) / 2;
  const lim = p.VCC - p.UCES;
  uo = Math.max(-lim, Math.min(lim, uo));
  return { uo, iN: p.Is * ex((ui + p.Vbias / 2 - uo) / p.UT), iP: p.Is * ex((uo - ui + p.Vbias / 2) / p.UT) };
}

export function pushPullWave(Ui: number, p: PushPullSpec, n = 256): { ui: number[]; uo: number[]; thd: number; IQ: number } {
  const ui: number[] = [];
  const uo: number[] = [];
  for (let k = 0; k < n; k++) {
    const u = Ui * Math.sin((2 * Math.PI * k) / n);
    ui.push(u);
    uo.push(pushPullOutput(u, p).uo);
  }
  return { ui, uo, thd: thd(uo, n), IQ: pushPullOutput(0, p).iN };
}

/** OTL 输出电容与负载构成高通：f_L = 1/(2πR_LC) */
export function otlLowCorner(RL: number, C: number): number {
  return 1 / (2 * Math.PI * RL * C);
}
