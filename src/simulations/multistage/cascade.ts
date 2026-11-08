/**
 * 多级放大电路（第 5 章）。
 *  - 二端口级联：每级用“空载电压增益 A_uo + 输入电阻 R_i + 输出电阻 R_o”描述，后级输入电阻是前级的负载。
 *  - 共射–共射、共射–共集两级阻容耦合：调用各单级计算核心，按“后级 R_i 作前级负载、前级 R_o 作后级信号源内阻”求解。
 *  - 直接耦合两级共射：前后级静态工作点相互影响。
 *  - 零点漂移折合到输入端。
 */
import { par } from "../units";
import { analyzeCE } from "../bjt/ce";
import { analyzeCC, type StageParams } from "../bjt/stages";
import type { CEParams } from "../bjt/types";

export interface TwoPort {
  Auo: number;
  Ri: number;
  Ro: number;
}

export interface CascadeResult {
  /** 各级带载电压增益 */
  stageGains: number[];
  Au: number;
  Aus: number;
  Ri: number;
  Ro: number;
  /** 错误做法：直接把各级空载增益相乘 */
  naive: number;
}

export function cascade(stages: TwoPort[], Rs: number, RL: number): CascadeResult {
  const gains = stages.map((s, k) => {
    const load = k + 1 < stages.length ? stages[k + 1].Ri : RL;
    return Number.isFinite(load) ? (s.Auo * load) / (s.Ro + load) : s.Auo;
  });
  const Au = gains.reduce((a, b) => a * b, 1);
  const Ri = stages[0].Ri;
  return { stageGains: gains, Au, Aus: (Au * Ri) / (Rs + Ri), Ri, Ro: stages[stages.length - 1].Ro, naive: stages.reduce((a, s) => a * s.Auo, 1) };
}

export interface TwoStageBJT {
  A1: number;
  A2: number;
  Au: number;
  Aus: number;
  Ri: number;
  Ro: number;
  /** 第二级的输入电阻（第一级的负载） */
  Ri2: number;
  /** 第一级空载增益 */
  A1open: number;
}

/** 共射–共射阻容耦合：第一级负载 = R_c1 ∥ R_i2 */
export function analyzeCECE(p1: CEParams, p2: CEParams, RL: number, Rs = 0): TwoStageBJT {
  const a2 = analyzeCE({ ...p2, RL, Rs: p1.Rc });
  const a1 = analyzeCE({ ...p1, RL: a2.ac.Ri, Rs });
  const a1o = analyzeCE({ ...p1, RL: Infinity, Rs });
  const Au = a1.ac.Au * a2.ac.Au;
  return { A1: a1.ac.Au, A2: a2.ac.Au, Au, Aus: (Au * a1.ac.Ri) / (Rs + a1.ac.Ri), Ri: a1.ac.Ri, Ro: a2.ac.Ro, Ri2: a2.ac.Ri, A1open: a1o.ac.Au };
}

/** 共射–共集：第二级（射极跟随器）的信号源内阻 = 第一级输出电阻 R_c1 */
export function analyzeCECC(p1: CEParams, p2: StageParams, RL: number, Rs = 0): TwoStageBJT {
  const a2 = analyzeCC({ ...p2, RL, Rs: p1.Rc });
  const a1 = analyzeCE({ ...p1, RL: a2.ac.Ri, Rs });
  const a1o = analyzeCE({ ...p1, RL: Infinity, Rs });
  const Au = a1.ac.Au * a2.ac.Au;
  return { A1: a1.ac.Au, A2: a2.ac.Au, Au, Aus: (Au * a1.ac.Ri) / (Rs + a1.ac.Ri), Ri: a1.ac.Ri, Ro: a2.ac.Ro, Ri2: a2.ac.Ri, A1open: a1o.ac.Au };
}

export interface DirectTwoCE {
  IC1: number;
  UC1: number;
  UCE1: number;
  IB2: number;
  IC2: number;
  UCE2: number;
  region1: "active" | "saturation";
  region2: "active" | "saturation" | "cutoff";
}

/**
 * 直接耦合两级共射：第一级固定偏置（R_b1 接 V_CC），集电极直接接第二级基极；第二级射极接 R_e2。
 * 节点方程：U_C1 = V_CC − (I_C1 + I_B2)R_c1，I_B2 = (U_C1 − U_BE)/[(1+β)R_e2]。
 */
export function directTwoCE(o: { VCC: number; Rb1: number; Rc1: number; Rc2: number; Re2: number; beta: number; UBE?: number; UCES?: number }): DirectTwoCE {
  const UBE = o.UBE ?? 0.7;
  const UCES = o.UCES ?? 0.3;
  const b = o.beta;
  const IB1 = (o.VCC - UBE) / o.Rb1;
  let IC1 = b * IB1;
  const k = o.Rc1 / ((1 + b) * o.Re2);
  let UC1 = (o.VCC - IC1 * o.Rc1 + UBE * k) / (1 + k);
  let region1: DirectTwoCE["region1"] = "active";
  if (UC1 < UCES) {
    region1 = "saturation";
    UC1 = UCES;
    IC1 = (o.VCC - UC1) / o.Rc1 - Math.max(0, (UC1 - UBE) / ((1 + b) * o.Re2));
  }
  const IB2 = Math.max(0, (UC1 - UBE) / ((1 + b) * o.Re2));
  let IC2 = b * IB2;
  let UCE2 = o.VCC - IC2 * o.Rc2 - (1 + b) * IB2 * o.Re2;
  let region2: DirectTwoCE["region2"] = IB2 <= 0 ? "cutoff" : "active";
  if (UCE2 < UCES && IB2 > 0) {
    region2 = "saturation";
    UCE2 = UCES;
    IC2 = (o.VCC - UCES - IB2 * o.Re2) / (o.Rc2 + o.Re2);
  }
  return { IC1, UC1, UCE1: UC1, IB2, IC2, UCE2, region1, region2 };
}

/**
 * 零点漂移：第 k 级折合到其自身输入端的漂移电压为 d_k，各级（带载）增益为 A_k。
 * 输出总漂移 = Σ d_k·A_k·A_{k+1}…A_n；折合到输入端 = 输出漂移 / (A_1…A_n) = Σ d_k / (A_1…A_{k−1})。
 */
export function inputReferredDrift(d: number[], A: number[]): { output: number; input: number; contributions: number[] } {
  const n = d.length;
  const total = A.reduce((a, b) => a * b, 1);
  const contributions: number[] = [];
  let out = 0;
  for (let k = 0; k < n; k++) {
    let g = 1;
    for (let j = k; j < n; j++) g *= A[j];
    contributions.push(d[k] * g);
    out += d[k] * g;
  }
  return { output: out, input: out / total, contributions };
}

export { par };
