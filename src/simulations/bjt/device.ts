/**
 * 晶体管器件层面的模型（第 2 章）：
 *  - 电流分配：I_C = β̄ I_B + I_CEO，I_CEO = (1+β̄) I_CBO，α = β/(1+β)
 *  - Ebers–Moll 输运模型（NPN）：用于输入特性随 u_CE 的变化与饱和区
 *  - 由三个电极电位判断管型、材料、电极与工作区
 *  - 温度：β 约 +1%/°C，U_BE 约 −2.2 mV/°C，I_CBO 约每 10 °C 翻倍（教材常用经验值）
 *  - 安全工作区：P_CM、I_CM、U_(BR)CEO
 */

export const alphaFromBeta = (beta: number) => beta / (1 + beta);
export const betaFromAlpha = (alpha: number) => alpha / (1 - alpha);

export interface CurrentSplit {
  IB: number;
  IC: number;
  IE: number;
  ICEO: number;
}

/** 由基极电流求三个电流（放大区，含穿透电流） */
export function currentsFromIB(IB: number, beta: number, ICBO = 0): CurrentSplit {
  const ICEO = (1 + beta) * ICBO;
  const IC = beta * IB + ICEO;
  return { IB, IC, IE: IB + IC, ICEO };
}

/** 由发射极电流求三个电流（共基视角：I_C = α I_E + I_CBO） */
export function currentsFromIE(IE: number, beta: number, ICBO = 0): CurrentSplit {
  const a = alphaFromBeta(beta);
  const IC = a * IE + ICBO;
  return { IB: IE - IC, IC, IE, ICEO: (1 + beta) * ICBO };
}

export interface EMParams {
  /** 输运饱和电流 */
  Is: number;
  betaF: number;
  betaR: number;
  UT: number;
}

export const DEFAULT_EM: EMParams = { Is: 1e-14, betaF: 100, betaR: 1, UT: 0.026 };

const ex = (x: number) => Math.exp(Math.min(x, 80)) - 1;

/** Ebers–Moll（输运形式，NPN）：给定 u_BE 与 u_CE，返回 i_B、i_C */
export function ebersMoll(uBE: number, uCE: number, p: EMParams = DEFAULT_EM): { iB: number; iC: number } {
  const uBC = uBE - uCE;
  const f = ex(uBE / p.UT);
  const r = ex(uBC / p.UT);
  const iC = p.Is * (f - r) - (p.Is / p.betaR) * r;
  const iB = (p.Is / p.betaF) * f + (p.Is / p.betaR) * r;
  return { iB, iC };
}

export type Region = "cutoff" | "active" | "saturation" | "reverse";

export const REGION_LABEL: Record<Region, string> = {
  cutoff: "截止区",
  active: "放大区",
  saturation: "饱和区",
  reverse: "倒置（反向放大）",
};

/**
 * 由结电压判断工作区（NPN；PNP 先取反）。Uon 为发射结导通阈值。
 * 判据（教材常用）：发射结导通且集电结反偏（u_BC ≤ 0，即 u_CE ≥ u_BE）→ 放大；
 * 发射结导通且集电结正偏（u_BC > 0，即 u_CE < u_BE）→ 饱和；发射结未导通 → 截止。
 */
export function regionFromJunctions(uBE: number, uBC: number, Uon = 0.5): Region {
  const be = uBE >= Uon;
  if (be && uBC > 1e-9) return "saturation";
  if (be) return "active";
  if (uBC >= Uon) return "reverse";
  return "cutoff";
}

export interface PinJudgement {
  /** 三个输入电位依次对应的电极 */
  pins: Array<"b" | "c" | "e">;
  type: "NPN" | "PNP";
  material: "Si" | "Ge";
  region: Region;
  UBE: number;
}

/**
 * 已知晶体管工作在放大区时，由三个电极对地电位判断管型、材料与电极。
 * 方法：中间电位为基极；与基极相差 0.2–0.3 V（锗）或 0.6–0.8 V（硅）者为发射极；剩下为集电极。
 * 集电极电位最高 → NPN；最低 → PNP。
 */
export function judgeActivePins(v: [number, number, number]): PinJudgement {
  const idx = [0, 1, 2].sort((a, b) => v[a] - v[b]);
  const b = idx[1];
  const others = idx.filter((i) => i !== b);
  const e = others.reduce((best, i) => (Math.abs(v[i] - v[b]) < Math.abs(v[best] - v[b]) ? i : best), others[0]);
  const c = others.find((i) => i !== e)!;
  const pins: Array<"b" | "c" | "e"> = ["b", "b", "b"];
  pins[b] = "b";
  pins[e] = "e";
  pins[c] = "c";
  const type = v[c] > v[b] ? "NPN" : "PNP";
  const UBE = v[b] - v[e];
  const material = Math.abs(UBE) < 0.45 ? "Ge" : "Si";
  const s = type === "NPN" ? 1 : -1;
  const region = regionFromJunctions(s * (v[b] - v[e]), s * (v[b] - v[c]), material === "Ge" ? 0.15 : 0.5);
  return { pins, type, material, region, UBE };
}

/** 已知管型与电极电位，判断工作区（考试常见题） */
export function regionFromPotentials(type: "NPN" | "PNP", VB: number, VC: number, VE: number, Uon = 0.5): Region {
  const s = type === "NPN" ? 1 : -1;
  return regionFromJunctions(s * (VB - VE), s * (VB - VC), Uon);
}

export interface TempParams {
  beta: number;
  UBE: number;
  ICBO: number;
}

/** 温度对参数的影响（经验模型，参考温度 25 °C） */
export function atTemperature(p25: TempParams, tC: number): TempParams {
  const d = tC - 25;
  return {
    beta: p25.beta * Math.pow(1.01, d),
    UBE: p25.UBE - 0.0022 * d,
    ICBO: p25.ICBO * Math.pow(2, d / 10),
  };
}

export interface SOALimits {
  PCM: number;
  ICM: number;
  UCEO: number;
}

export function soaCheck(UCE: number, IC: number, l: SOALimits): { safe: boolean; violations: Array<"P" | "I" | "U"> } {
  const v: Array<"P" | "I" | "U"> = [];
  if (UCE * IC > l.PCM) v.push("P");
  if (IC > l.ICM) v.push("I");
  if (UCE > l.UCEO) v.push("U");
  return { safe: v.length === 0, violations: v };
}

export interface SimpleBiasResult {
  region: Region;
  IB: number;
  IC: number;
  UCE: number;
  /** 临界饱和基极电流 */
  IBS: number;
}

/**
 * 最简偏置电路（基极由独立电源 V_BB 经 R_b 驱动，发射极接地，集电极经 R_c 接 V_CC）。
 * 恒压降模型；I_B > I_BS 时饱和，U_CE = U_CES。
 */
export function solveSimpleBias(o: { VBB: number; Rb: number; VCC: number; Rc: number; beta: number; UBE?: number; UCES?: number }): SimpleBiasResult {
  const UBE = o.UBE ?? 0.7;
  const UCES = o.UCES ?? 0.3;
  const IBS = (o.VCC - UCES) / (o.beta * o.Rc);
  if (o.VBB <= UBE) return { region: "cutoff", IB: 0, IC: 0, UCE: o.VCC, IBS };
  const IB = (o.VBB - UBE) / o.Rb;
  if (IB > IBS) return { region: "saturation", IB, IC: (o.VCC - UCES) / o.Rc, UCE: UCES, IBS };
  const IC = o.beta * IB;
  return { region: "active", IB, IC, UCE: o.VCC - IC * o.Rc, IBS };
}
