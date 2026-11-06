import { par } from "../units";
import type { ACResult, CEParams, DCResult, LowFreqResult } from "./types";

/** 基极回路的戴维南等效 (V_BB, R_B) */
export function baseThevenin(p: CEParams): { VBB: number; RB: number } {
  if (p.topology === "fixed") return { VBB: p.VCC, RB: p.Rb };
  const VBB = (p.VCC * p.Rb1) / (p.Rb1 + p.Rb2);
  return { VBB, RB: par(p.Rb1, p.Rb2) };
}

/**
 * 静态工作点（恒压降模型 + 放大区 I_C = βI_B）。
 * 求解顺序：截止判断 → 假设放大区 → 若 U_CE < U_CES 则按饱和联立求解。
 */
export function solveDC(p: CEParams): DCResult {
  const { VBB, RB } = baseThevenin(p);
  const RE = p.Re1 + p.Re2;
  const b = p.beta;
  const ICmax = (p.VCC - p.UCES) / (p.Rc + RE);

  let estimate: DCResult["estimate"];
  if (p.topology === "divider" && RE > 0) {
    const UBQ = VBB;
    const IEQ = Math.max(0, (UBQ - p.UBE) / RE);
    const ICQ = IEQ; // 教材估算：I_CQ ≈ I_EQ
    estimate = {
      UBQ,
      IEQ,
      ICQ,
      IBQ: IEQ / (1 + b),
      UCEQ: p.VCC - IEQ * (p.Rc + RE),
      ratio: ((1 + b) * RE) / RB,
    };
  }

  // 1) 截止：基极回路开路电压不足以使发射结导通
  if (VBB <= p.UBE) {
    return {
      region: "cutoff",
      VBB,
      RB,
      RE,
      IBQ: 0,
      ICQ: 0,
      IEQ: 0,
      UCEQ: p.VCC,
      UBQ: VBB,
      UCQ: p.VCC,
      UEQ: 0,
      betaForced: b,
      ICmax,
      estimate,
    };
  }

  // 2) 假设放大区
  const IB = (VBB - p.UBE) / (RB + (1 + b) * RE);
  const IC = b * IB;
  const IE = (1 + b) * IB;
  const UCE = p.VCC - IC * p.Rc - IE * RE;
  if (UCE >= p.UCES) {
    const UEQ = IE * RE;
    return {
      region: "active",
      VBB,
      RB,
      RE,
      IBQ: IB,
      ICQ: IC,
      IEQ: IE,
      UCEQ: UCE,
      UBQ: UEQ + p.UBE,
      UCQ: p.VCC - IC * p.Rc,
      UEQ,
      betaForced: b,
      ICmax,
      estimate,
    };
  }

  // 3) 饱和：U_CE = U_CES，联立
  //   (R_B+R_E) I_B + R_E I_C = V_BB − U_BE
  //   R_E I_B + (R_c+R_E) I_C = V_CC − U_CES
  const a11 = RB + RE;
  const a12 = RE;
  const a21 = RE;
  const a22 = p.Rc + RE;
  const b1 = VBB - p.UBE;
  const b2 = p.VCC - p.UCES;
  const det = a11 * a22 - a12 * a21;
  let IBs = (b1 * a22 - a12 * b2) / det;
  let ICs = (a11 * b2 - a21 * b1) / det;
  if (!(ICs >= 0)) ICs = 0;
  if (!(IBs >= 0)) IBs = 0;
  const IEs = IBs + ICs;
  const UEQ = IEs * RE;
  return {
    region: "saturation",
    VBB,
    RB,
    RE,
    IBQ: IBs,
    ICQ: ICs,
    IEQ: IEs,
    UCEQ: p.UCES,
    UBQ: UEQ + p.UBE,
    UCQ: UEQ + p.UCES,
    UEQ,
    betaForced: IBs > 0 ? ICs / IBs : 0,
    ICmax,
    estimate,
  };
}

/** 交流通路中未被旁路的射极电阻 */
export function emitterAC(p: CEParams): number {
  return p.Re1 + (p.hasCe && p.Re2 > 0 ? 0 : p.Re2);
}

/**
 * 中频小信号分析（h 参数简化模型，忽略 h_re 与 r_ce）。
 */
export function solveAC(p: CEParams, dc: DCResult = solveDC(p)): ACResult {
  const b = p.beta;
  const valid = dc.region === "active" && dc.IEQ > 0;
  const IEQ = Math.max(dc.IEQ, 1e-15);
  const rbpe = ((1 + b) * p.UT) / IEQ;
  const rbe = p.rbb + rbpe;
  const ReAC = emitterAC(p);
  const RLp = par(p.Rc, p.RL);
  const Rib = rbe + (1 + b) * ReAC;
  const Ri = par(dc.RB, Rib);
  const Ro = p.Rc;
  const Au = (-b * RLp) / Rib;
  const Auo = (-b * p.Rc) / Rib;
  const Aus = (Au * Ri) / (p.Rs + Ri);

  // 最大不失真输出（线性模型 + 截止 i_C≥0 + 饱和 u_CE≥U_CES）
  const UomCut = dc.ICQ * RLp;
  const acLoad = RLp + (ReAC * (1 + b)) / b;
  const UomSat = (Math.max(0, dc.UCEQ - p.UCES) * RLp) / acLoad;
  const limitedBy = UomCut <= UomSat ? "cutoff" : "saturation";
  const Uom = Math.min(UomCut, UomSat);
  const UsmMax = Math.abs(Aus) > 0 ? Uom / Math.abs(Aus) : Infinity;

  return { valid, rbe, rbpe, ReAC, RLp, Rib, Ri, Ro, Au, Auo, Aus, UomCut, UomSat, Uom, limitedBy, UsmMax };
}

/**
 * 低频截止频率估算（短路时间常数法）：ω_L ≈ Σ 1/(R_i C_i)，
 * R_i 为其余电容短路时从该电容两端看进去的电阻。
 */
export function lowFrequency(p: CEParams, dc: DCResult = solveDC(p), ac: ACResult = solveAC(p, dc)): LowFreqResult {
  const twoPi = 2 * Math.PI;
  const fC1 = 1 / (twoPi * p.C1 * (p.Rs + ac.Ri));
  const fC2 = Number.isFinite(p.RL) ? 1 / (twoPi * p.C2 * (p.Rc + p.RL)) : 0;
  let fCe = 0;
  if (p.hasCe && p.Re2 > 0) {
    // 从 C_e 看进去：R_e2 ∥ [R_e1 + (r_be + R_s∥R_B)/(1+β)]
    const Rlook = par(p.Re2, p.Re1 + (ac.rbe + par(p.Rs, dc.RB)) / (1 + p.beta));
    fCe = 1 / (twoPi * p.Ce * Rlook);
  }
  return { fC1, fC2, fCe, fL: fC1 + fC2 + fCe };
}

export interface CEAnalysis {
  params: CEParams;
  dc: DCResult;
  ac: ACResult;
  lf: LowFreqResult;
}

export function analyzeCE(p: CEParams): CEAnalysis {
  const dc = solveDC(p);
  const ac = solveAC(p, dc);
  const lf = lowFrequency(p, dc, ac);
  return { params: p, dc, ac, lf };
}
