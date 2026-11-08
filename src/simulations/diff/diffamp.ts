/**
 * 差分放大电路与电流源（第 6 章）。NPN 管、双电源（+V_CC、−V_EE）长尾电路。
 * 静态：恒压降模型；动态：h 参数简化模型（中频、小信号），两管完全对称（可选 R_c 失配）。
 * 大信号：理想对管（无射极电阻）i_C1,2 = αI/(1 + e^{∓u_Id/U_T})。
 */
import { par } from "../units";

/** 任意两个输入分解为差模、共模分量 */
export function decompose(u1: number, u2: number): { uId: number; uIc: number } {
  return { uId: u1 - u2, uIc: (u1 + u2) / 2 };
}

export interface DiffParams {
  VCC: number;
  VEE: number;
  Rc: number;
  /** 基极串联电阻（信号源内阻 + 基极电阻） */
  Rb: number;
  /** 长尾电阻（tail = "resistor"）或恒流源输出电阻（tail = "source"） */
  Re: number;
  tail: "resistor" | "source";
  /** 恒流源电流 I_0（tail = "source"） */
  I0: number;
  /** 负载：双端输出时接在两集电极之间；单端输出时接在 c1 与地之间 */
  RL: number;
  output: "double" | "single";
  beta: number;
  rbb: number;
  UBE: number;
  UT: number;
  /** 集电极电阻相对失配 ΔR_c/R_c（双端输出时产生共模增益） */
  mismatch: number;
}

export const DEFAULT_DIFF: DiffParams = { VCC: 12, VEE: 12, Rc: 10e3, Rb: 1e3, Re: 10e3, tail: "resistor", I0: 1e-3, RL: 20e3, output: "double", beta: 100, rbb: 200, UBE: 0.7, UT: 0.026, mismatch: 0 };

export interface DiffResult {
  IEQ: number;
  ICQ: number;
  IBQ: number;
  UCQ: number;
  UEQ: number;
  UCEQ: number;
  rbe: number;
  Ad: number;
  Ac: number;
  KCMR: number;
  KCMRdB: number;
  Rid: number;
  Ro: number;
  /** 尾部电阻（恒流源时为其输出电阻） */
  Rtail: number;
}

export function analyzeDiff(p: DiffParams): DiffResult {
  const b = p.beta;
  let IEQ: number;
  if (p.tail === "source") IEQ = p.I0 / 2;
  else IEQ = (p.VEE - p.UBE) / (p.Rb / (1 + b) + 2 * p.Re);
  const IBQ = IEQ / (1 + b);
  const ICQ = b * IBQ;
  const UEQ = -IBQ * p.Rb - p.UBE;
  const UCQ = p.VCC - ICQ * p.Rc;
  const rbe = p.rbb + ((1 + b) * p.UT) / IEQ;
  const Rtail = p.Re;
  const denomD = p.Rb + rbe;
  const denomC = p.Rb + rbe + 2 * (1 + b) * Rtail;
  let Ad: number;
  let Ac: number;
  let Ro: number;
  if (p.output === "double") {
    const RLh = Number.isFinite(p.RL) ? p.RL / 2 : Infinity;
    Ad = (-b * par(p.Rc, RLh)) / denomD;
    // 失配：R_c1 = R_c(1+δ/2)，R_c2 = R_c(1−δ/2)，共模输出 = 两管共模输出之差（负载忽略）
    Ac = p.mismatch === 0 ? 0 : (-b * (p.Rc * p.mismatch)) / denomC;
    Ro = 2 * p.Rc;
  } else {
    Ad = (-0.5 * b * par(p.Rc, p.RL)) / denomD;
    Ac = (-b * par(p.Rc, p.RL)) / denomC;
    Ro = p.Rc;
  }
  const KCMR = Ac === 0 ? Infinity : Math.abs(Ad / Ac);
  return { IEQ, ICQ, IBQ, UCQ, UEQ, UCEQ: UCQ - UEQ, rbe, Ad, Ac, KCMR, KCMRdB: 20 * Math.log10(KCMR), Rid: 2 * denomD, Ro, Rtail };
}

/** 任意输入下的输出（小信号）：u_O = A_d u_Id + A_c u_Ic */
export function diffOutput(r: DiffResult, u1: number, u2: number): number {
  const { uId, uIc } = decompose(u1, u2);
  return r.Ad * uId + r.Ac * uIc;
}

/** 理想对管的大信号传输特性（无射极电阻），返回两管集电极电流 */
export function diffLargeSignal(uId: number, Itail: number, UT = 0.026, alpha = 1): { iC1: number; iC2: number } {
  const x = Math.max(-80, Math.min(80, uId / UT));
  return { iC1: (alpha * Itail) / (1 + Math.exp(-x)), iC2: (alpha * Itail) / (1 + Math.exp(x)) };
}

/* ───────── 电流源 ───────── */

/** 镜像电流源：I_C2 = I_R·β/(β+2)，I_R = (V − U_BE)/R */
export function mirror(V: number, R: number, beta: number, UBE = 0.7): { IR: number; IC2: number } {
  const IR = (V - UBE) / R;
  return { IR, IC2: (IR * beta) / (beta + 2) };
}

/**
 * 比例电流源：两管射极分别接 R_e1、R_e2。U_BE1 + I_E1R_e1 = U_BE2 + I_E2R_e2，
 * U_BE1 − U_BE2 = U_T ln(I_E1/I_E2)。忽略基极电流时精确解由迭代求得；R_e 上压降远大于 U_T 时 I_C2 ≈ I_R·R_e1/R_e2。
 */
export function ratioSource(IR: number, Re1: number, Re2: number, UT = 0.026): { IC2: number; approx: number } {
  // 解 U_T ln(IR/I2) + IR·Re1 = I2·Re2
  let lo = 1e-15;
  let hi = (IR * Re1 + UT * 40) / Re2;
  for (let k = 0; k < 200; k++) {
    const mid = Math.sqrt(lo * hi);
    const f = UT * Math.log(IR / mid) + IR * Re1 - mid * Re2;
    if (f > 0) lo = mid;
    else hi = mid;
  }
  return { IC2: Math.sqrt(lo * hi), approx: (IR * Re1) / Re2 };
}

/** 微电流源（Widlar）：I_C2·R_e2 = U_T ln(I_R/I_C2) */
export function widlar(IR: number, Re2: number, UT = 0.026): number {
  return ratioSource(IR, 0, Re2, UT).IC2;
}

/** 由要求的 I_C2 反求微电流源的 R_e2 */
export function widlarResistor(IR: number, IC2: number, UT = 0.026): number {
  return (UT * Math.log(IR / IC2)) / IC2;
}

/**
 * 电流源（晶体管）输出电阻：射极接 R_e 时 R_o ≈ r_ce[1 + βR_e/(r_be + R_e)]，r_ce = U_A / I_C。
 * R_e = 0 时即 r_ce（镜像电流源）。
 */
export function sourceOutputResistance(IC: number, VA: number, Re: number, beta: number, rbe: number): number {
  const rce = VA / IC;
  return rce * (1 + (beta * Re) / (rbe + Re));
}

/** 有源负载共射级：A_u = −β(r_ce1 ∥ r_ce2 ∥ R_L)/r_be */
export function activeLoadGain(IC: number, VA: number, beta: number, rbe: number, RL: number): number {
  const rce = VA / IC;
  return (-beta * par(rce, rce, RL)) / rbe;
}

/** 共射级（计入放大管 r_ce）：A_u = −β(R_c ∥ r_ce ∥ R_L)/r_be */
export function resistiveLoadGain(IC: number, VA: number, beta: number, rbe: number, Rc: number, RL: number): number {
  return (-beta * par(Rc, VA / IC, RL)) / rbe;
}
