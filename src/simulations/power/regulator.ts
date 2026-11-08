/**
 * 串联型稳压电路与三端稳压器（第 12 章）。
 * 结构：调整管 VT（射极跟随输出）+ 基准稳压管 U_Z + 比较放大器（增益 A）+ 采样电阻 R₁（上）、R_P（电位器）、R₂（下）。
 * 采样系数 F = (R₂ + (1−k)R_P)/(R₁ + R_P + R₂)，k ∈ [0,1] 为电位器滑动端位置（k=0 在最下端，F 最小）。
 * 放大器：u_B = A(U_Z − F·u_O)，且不能超过 U_I − U_drop（比较放大器/偏置电阻需要压降）。
 * 输出：u_O = u_B − U_BE（射极跟随）⇒ u_O = (A U_Z − U_BE)/(1 + A F)。理想（A→∞）时 u_O = U_Z/F。
 * 输出电阻（小信号）：R_o ≈ [r_be/(1+β)]/(1 + AF)。
 */
export interface SeriesRegSpec {
  UZ: number;
  R1: number;
  RP: number;
  R2: number;
  /** 电位器滑动端位置：0 = 最下端（输出最高），1 = 最上端（输出最低） */
  k: number;
  A: number;
  UBE: number;
  /** 放大器输出与输入电压之间所需的最小压降 */
  Udrop: number;
  beta: number;
  UT: number;
}

export const DEFAULT_SR: SeriesRegSpec = { UZ: 6, R1: 1e3, RP: 1e3, R2: 1e3, k: 0.5, A: 1000, UBE: 0.7, Udrop: 1, beta: 50, UT: 0.026 };

export function samplingF(s: Pick<SeriesRegSpec, "R1" | "RP" | "R2" | "k">): number {
  return (s.R2 + (1 - s.k) * s.RP) / (s.R1 + s.RP + s.R2);
}

/** 理想输出电压范围：U_Omin = U_Z(R₁+R_P+R₂)/(R₂+R_P)，U_Omax = U_Z(R₁+R_P+R₂)/R₂ */
export function outputRange(s: Pick<SeriesRegSpec, "UZ" | "R1" | "RP" | "R2">): { min: number; max: number } {
  const sum = s.R1 + s.RP + s.R2;
  return { min: (s.UZ * sum) / (s.R2 + s.RP), max: (s.UZ * sum) / s.R2 };
}

export interface SeriesRegResult {
  UO: number;
  UOideal: number;
  /** 调整管管压降 */
  UCE: number;
  IL: number;
  /** 调整管功耗 */
  PT: number;
  /** 是否仍在稳压（调整管未饱和、放大器未限幅） */
  regulating: boolean;
  Ro: number;
}

export function seriesRegulator(UI: number, RL: number, s: SeriesRegSpec = DEFAULT_SR): SeriesRegResult {
  const F = samplingF(s);
  const UOideal = s.UZ / F;
  let UO = (s.A * s.UZ - s.UBE) / (1 + s.A * F);
  const UBmax = UI - s.Udrop;
  let regulating = true;
  if (UO + s.UBE > UBmax) {
    UO = UBmax - s.UBE;
    regulating = false;
  }
  UO = Math.max(0, UO);
  const IL = Number.isFinite(RL) ? UO / RL : 0;
  const UCE = UI - UO;
  const IE = Math.max(IL, 1e-4);
  const rbe = 200 + ((1 + s.beta) * s.UT) / IE;
  const Ro = regulating ? rbe / (1 + s.beta) / (1 + s.A * F) : rbe / (1 + s.beta);
  return { UO, UOideal, UCE, IL, PT: UCE * IL, regulating, Ro };
}

/** 可调三端稳压器（如 LM317）：U_O = U_REF(1 + R₂/R₁) + I_ADJ·R₂ */
export function adjustable317(R1: number, R2: number, UREF = 1.25, IADJ = 50e-6): number {
  return UREF * (1 + R2 / R1) + IADJ * R2;
}

/** 电容滤波的工程估算：U_O(AV) ≈ 1.2U₂（桥式，R_LC ≥ (3~5)T/2），纹波峰峰值 ΔU ≈ I_O/(2fC)（桥式） */
export function capFilterEstimate(U2: number, RL: number, C: number, f = 50, kind: "bridge" | "half" = "bridge"): { UO: number; ripple: number; tauOverHalfT: number } {
  const UO = Number.isFinite(RL) ? (kind === "bridge" ? 1.2 : 1.0) * U2 : Math.SQRT2 * U2;
  const fr = kind === "bridge" ? 2 * f : f;
  return { UO, ripple: Number.isFinite(RL) ? UO / RL / (fr * C) : 0, tauOverHalfT: (RL * C) / (1 / (2 * f)) };
}
