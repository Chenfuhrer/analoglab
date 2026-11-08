/**
 * 共集、共基放大电路与 Q 点温度稳定性（第 3 章其余单元）。
 * 直流分析复用共射的 solveDC（三种组态的直流通路相同：基极偏置 + 射极电阻 + 集电极电阻）。
 * 小信号：h 参数简化模型（忽略 h_re、r_ce），中频。
 */
import { par } from "../units";
import { analyzeCE, solveDC } from "./ce";
import { atTemperature } from "./device";
import { DEFAULT_CE, type CEParams, type DCResult } from "./types";

export interface StageParams {
  topology: "fixed" | "divider";
  VCC: number;
  Rb: number;
  Rb1: number;
  Rb2: number;
  /** 集电极电阻（共集电路可为 0） */
  Rc: number;
  /** 射极电阻 */
  Re: number;
  RL: number;
  Rs: number;
  beta: number;
  UBE: number;
  UCES: number;
  rbb: number;
  UT: number;
}

export const DEFAULT_CC: StageParams = {
  topology: "fixed",
  VCC: 12,
  Rb: 200e3,
  Rb1: 20e3,
  Rb2: 20e3,
  Rc: 0,
  Re: 3e3,
  RL: 3e3,
  Rs: 1e3,
  beta: 100,
  UBE: 0.7,
  UCES: 0.3,
  rbb: 200,
  UT: 0.026,
};

export const DEFAULT_CB: StageParams = {
  topology: "divider",
  VCC: 12,
  Rb: 0,
  Rb1: 10e3,
  Rb2: 33e3,
  Rc: 3e3,
  Re: 1.2e3,
  RL: 3e3,
  Rs: 50,
  beta: 100,
  UBE: 0.7,
  UCES: 0.3,
  rbb: 200,
  UT: 0.026,
};

export function toCE(p: StageParams, emitterBypassed: boolean): CEParams {
  return { ...DEFAULT_CE, topology: p.topology, VCC: p.VCC, Rb: p.Rb, Rb1: p.Rb1, Rb2: p.Rb2, Rc: p.Rc, Re1: emitterBypassed ? 0 : p.Re, Re2: emitterBypassed ? p.Re : 0, hasCe: emitterBypassed, RL: p.RL, Rs: p.Rs, beta: p.beta, UBE: p.UBE, UCES: p.UCES, rbb: p.rbb, UT: p.UT };
}

export interface StageAC {
  rbe: number;
  Au: number;
  Auo: number;
  Aus: number;
  Ri: number;
  Ro: number;
  RLp: number;
  /** 最大不失真输出幅值 */
  Uom: number;
  /** 电流放大倍数（i_o/i_i，对晶体管端口） */
  Ai: number;
}

export interface StageAnalysis {
  dc: DCResult;
  ac: StageAC;
  valid: boolean;
}

const stageRbe = (p: StageParams, dc: DCResult) => p.rbb + ((1 + p.beta) * p.UT) / Math.max(dc.IEQ, 1e-15);

/** 共集电极放大电路（射极跟随器）：b 入、e 出，集电极交流接地 */
export function analyzeCC(p: StageParams): StageAnalysis {
  const dc = solveDC(toCE(p, false));
  const rbe = stageRbe(p, dc);
  const b = p.beta;
  const RLp = par(p.Re, p.RL);
  const Rib = rbe + (1 + b) * RLp;
  const Au = ((1 + b) * RLp) / Rib;
  const Auo = ((1 + b) * p.Re) / (rbe + (1 + b) * p.Re);
  const Ri = par(dc.RB, Rib);
  const Ro = par(p.Re, (rbe + par(p.Rs, dc.RB)) / (1 + b));
  const Aus = (Au * Ri) / (p.Rs + Ri);
  // 正半周受饱和限制：u_CE 减小到 U_CES；负半周受截止限制：i_E 减小到 0
  const Uom = Math.min(Math.max(0, dc.UCEQ - p.UCES), dc.IEQ * RLp);
  return { dc, valid: dc.region === "active", ac: { rbe, Au, Auo, Aus, Ri, Ro, RLp, Uom, Ai: 1 + b } };
}

/** 共基极放大电路：e 入、c 出，基极经大电容交流接地（分压偏置） */
export function analyzeCB(p: StageParams): StageAnalysis {
  const dc = solveDC(toCE(p, false));
  const rbe = stageRbe(p, dc);
  const b = p.beta;
  const RLp = par(p.Rc, p.RL);
  const Au = (b * RLp) / rbe;
  const Auo = (b * p.Rc) / rbe;
  const Ri = par(p.Re, rbe / (1 + b));
  const Ro = p.Rc;
  const Aus = (Au * Ri) / (p.Rs + Ri);
  const acLoad = RLp;
  const Uom = Math.min(dc.ICQ * RLp, (Math.max(0, dc.UCEQ - p.UCES) * RLp) / acLoad);
  return { dc, valid: dc.region === "active", ac: { rbe, Au, Auo, Aus, Ri, Ro, RLp, Uom, Ai: b / (1 + b) } };
}

/** 同一偏置下的共射电路（射极电阻被完全旁路），便于三种组态对比 */
export function analyzeCEStage(p: StageParams): StageAnalysis {
  const a = analyzeCE(toCE(p, true));
  return { dc: a.dc, valid: a.dc.region === "active", ac: { rbe: a.ac.rbe, Au: a.ac.Au, Auo: a.ac.Auo, Aus: a.ac.Aus, Ri: a.ac.Ri, Ro: a.ac.Ro, RLp: a.ac.RLp, Uom: a.ac.Uom, Ai: p.beta } };
}

/* ───────── Q 点的温度稳定性 ───────── */

export interface DriftPoint {
  tC: number;
  ICQ: number;
  UCEQ: number;
  region: DCResult["region"];
}

/**
 * 温度对 Q 点的影响：β 与 U_BE 按经验规律变化（device.atTemperature），
 * I_CBO 的影响通过“等效基极电流源”计入：基极回路多出 (1+β)·I_CBO 的集电极电流。
 * 这里采用 I_C = β·I_B + (1+β)·I_CBO，并修正射极电阻上的压降（迭代一次即收敛到 0.1%）。
 */
export function qAtTemperature(p: CEParams, tC: number, ICBO25 = 0): DriftPoint {
  const t = atTemperature({ beta: p.beta, UBE: p.UBE, ICBO: ICBO25 }, tC);
  const q = { ...p, beta: t.beta, UBE: t.UBE };
  const dc = solveDC(q);
  if (t.ICBO === 0 || dc.region !== "active") return { tC, ICQ: dc.ICQ, UCEQ: dc.UCEQ, region: dc.region };
  // 计入 I_CBO：基极回路 KVL：V_BB − R_B(I_B − I_CBO)… 采用戴维南：I_B 由外电路决定，I_C = βI_B + (1+β)I_CBO
  const RE = p.Re1 + p.Re2;
  const b = t.beta;
  // V_BB = I_B·R_B + U_BE + (I_B + I_C)·R_E，I_C = βI_B + (1+β)I_CBO
  const IB = (dc.VBB - t.UBE - (1 + b) * t.ICBO * RE) / (dc.RB + (1 + b) * RE);
  const IC = b * IB + (1 + b) * t.ICBO;
  const UCE = p.VCC - IC * p.Rc - (IB + IC) * RE;
  if (UCE < p.UCES) return { tC, ICQ: (p.VCC - p.UCES) / (p.Rc + RE), UCEQ: p.UCES, region: "saturation" };
  return { tC, ICQ: IC, UCEQ: UCE, region: "active" };
}

/** I_CQ 对 β 的相对灵敏度 S = (ΔI_C/I_C)/(Δβ/β)（数值差分） */
export function betaSensitivity(p: CEParams): number {
  const d = 0.01;
  const a = solveDC({ ...p, beta: p.beta * (1 - d) }).ICQ;
  const b = solveDC({ ...p, beta: p.beta * (1 + d) }).ICQ;
  const m = solveDC(p).ICQ;
  return (b - a) / m / (2 * d);
}

/* ───────── 小工具（题目与对照计算用） ───────── */

/** r_be = r_bb' + (1+β)U_T / I_EQ */
export function rbeOf(IEQ: number, beta: number, rbb = 200, UT = 0.026): number {
  return rbb + ((1 + beta) * UT) / IEQ;
}

/** BJT 跨导 g_m = I_CQ / U_T */
export function bjtGm(ICQ: number, UT = 0.026): number {
  return ICQ / UT;
}

/** 射极跟随器电压放大倍数 (1+β)R_L' / [r_be + (1+β)R_L'] */
export function followerGain(beta: number, rbe: number, RLp: number): number {
  return ((1 + beta) * RLp) / (rbe + (1 + beta) * RLp);
}
