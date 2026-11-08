/**
 * 场效应管模型（第 4 章），符号与童诗白教材一致：
 *  - 增强型 MOS：恒流区 i_D = I_DO (u_GS/U_GS(th) − 1)²，I_DO 为 u_GS = 2U_GS(th) 时的 i_D
 *  - 耗尽型 MOS / 结型 FET：i_D = I_DSS (1 − u_GS/U_GS(off))²
 * 统一写成平方律 i_D = K (u_GS − U_T0)²（U_T0 为开启或夹断电压，K = I_DO/U_th² 或 I_DSS/U_off²），
 * 可变电阻区 i_D = K[2(u_GS − U_T0)u_DS − u_DS²]，预夹断轨迹 u_DS = u_GS − U_T0。
 * 恒流区可选沟道长度调制 (1 + λu_DS)。P 沟道管：所有电压、电流取反。
 */

export type FETKind = "n-enh" | "n-dep" | "p-enh" | "p-dep" | "n-jfet" | "p-jfet";

export const FET_LABEL: Record<FETKind, string> = {
  "n-enh": "N 沟道增强型 MOS",
  "n-dep": "N 沟道耗尽型 MOS",
  "p-enh": "P 沟道增强型 MOS",
  "p-dep": "P 沟道耗尽型 MOS",
  "n-jfet": "N 沟道结型 FET",
  "p-jfet": "P 沟道结型 FET",
};

export interface FETParams {
  kind: FETKind;
  /** 增强型：开启电压 U_GS(th)；耗尽型/结型：夹断电压 U_GS(off)（N 沟道增强为正，耗尽为负） */
  Vt: number;
  /** 增强型：I_DO；耗尽型/结型：I_DSS */
  Iref: number;
  /** 沟道长度调制系数（1/V），0 表示忽略 */
  lambda: number;
}

export const DEFAULT_NENH: FETParams = { kind: "n-enh", Vt: 2, Iref: 2e-3, lambda: 0 };
export const DEFAULT_NDEP: FETParams = { kind: "n-dep", Vt: -2, Iref: 4e-3, lambda: 0 };
export const DEFAULT_NJFET: FETParams = { kind: "n-jfet", Vt: -3, Iref: 6e-3, lambda: 0 };

export const isEnh = (k: FETKind) => k === "n-enh" || k === "p-enh";
export const isP = (k: FETKind) => k.startsWith("p");

/** 平方律系数 K（A/V²），对 N 沟道而言 */
export function kCoef(p: FETParams): number {
  return p.Iref / (p.Vt * p.Vt);
}

export type FETRegion = "cutoff" | "ohmic" | "saturation";

export const FET_REGION_LABEL: Record<FETRegion, string> = {
  cutoff: "截止区（夹断区）",
  ohmic: "可变电阻区",
  saturation: "恒流区（饱和区）",
};

/** N 沟道等效：P 沟道管把电压取反后按 N 沟道计算 */
function nEquivalent(p: FETParams, uGS: number, uDS: number) {
  const s = isP(p.kind) ? -1 : 1;
  return { vgs: s * uGS, vds: s * uDS, vt: s * p.Vt, s };
}

export function fetRegion(p: FETParams, uGS: number, uDS: number): FETRegion {
  const { vgs, vds, vt } = nEquivalent(p, uGS, uDS);
  // 结型管：栅源 PN 结不允许正偏（N 沟道 u_GS ≤ 0），此处只在计算中按平方律延伸
  if (vgs <= vt) return "cutoff";
  return vds < vgs - vt ? "ohmic" : "saturation";
}

/** 漏极电流（N 沟道为正；P 沟道返回负值，即实际方向从源极流向漏极） */
export function drainCurrent(p: FETParams, uGS: number, uDS: number): number {
  const { vgs, vds, vt, s } = nEquivalent(p, uGS, uDS);
  const K = kCoef(p);
  const ov = vgs - vt;
  if (ov <= 0 || vds <= 0) return 0;
  const i = vds < ov ? K * (2 * ov * vds - vds * vds) : K * ov * ov * (1 + p.lambda * vds);
  return s * i;
}

/** 恒流区转移特性（忽略 λ） */
export function transferCurrent(p: FETParams, uGS: number): number {
  const { vgs, vt, s } = nEquivalent(p, uGS, 0);
  const ov = vgs - vt;
  return ov > 0 ? s * kCoef(p) * ov * ov : 0;
}

/** 跨导 g_m = ∂i_D/∂u_GS = 2K(u_GS − U_T0) = 2√(K·I_D)（恒流区，取正值） */
export function transconductance(p: FETParams, ID: number): number {
  return 2 * Math.sqrt(kCoef(p) * Math.abs(ID));
}

/** 教材写法：增强型 g_m = (2/U_GS(th))√(I_DO·I_DQ)；耗尽型 g_m = −(2I_DSS/U_GS(off))(1 − U_GSQ/U_GS(off)) */
export function gmTextbook(p: FETParams, IDQ: number): number {
  return (2 / Math.abs(p.Vt)) * Math.sqrt(p.Iref * Math.abs(IDQ));
}

/** 沟道长度调制引起的输出电阻 r_ds ≈ 1/(λI_D) */
export function outputResistance(p: FETParams, ID: number): number {
  return p.lambda > 0 ? 1 / (p.lambda * Math.abs(ID)) : Infinity;
}

/* ───────── 共源 / 共漏 / 共栅电路（N 沟道） ───────── */

export interface FETAmpParams {
  fet: FETParams;
  bias: "self" | "divider";
  VDD: number;
  /** 分压偏置：R_g1 下（栅极→地）、R_g2 上（V_DD→栅极）；自给偏压：R_g（栅极→地） */
  Rg1: number;
  Rg2: number;
  /** 串在栅极的大电阻（提高输入电阻），0 表示无 */
  Rg3: number;
  Rg: number;
  Rd: number;
  Rs: number;
  /** 源极电阻是否被 C_s 旁路 */
  bypass: boolean;
  RL: number;
}

export const DEFAULT_CS: FETAmpParams = { fet: DEFAULT_NENH, bias: "divider", VDD: 15, Rg1: 100e3, Rg2: 300e3, Rg3: 1e6, Rg: 1e6, Rd: 3e3, Rs: 1e3, bypass: true, RL: 10e3 };
export const DEFAULT_CS_SELF: FETAmpParams = { fet: DEFAULT_NDEP, bias: "self", VDD: 15, Rg1: 0, Rg2: 0, Rg3: 0, Rg: 1e6, Rd: 2e3, Rs: 500, bypass: true, RL: 10e3 };

export interface FETQ {
  UGQ: number;
  UGSQ: number;
  IDQ: number;
  UDSQ: number;
  region: FETRegion;
  gm: number;
  /** 两个代数解中被舍弃的那个 U_GS（教学用） */
  rejected?: number;
}

/**
 * 静态工作点：U_GS = U_G − I_D R_s 与 I_D = K(U_GS − U_T0)² 联立，取 U_GS > U_T0 的根；再验证恒流区。
 */
export function solveFETQ(a: FETAmpParams): FETQ {
  const { fet } = a;
  const K = kCoef(fet);
  const UG = a.bias === "divider" ? (a.VDD * a.Rg1) / (a.Rg1 + a.Rg2) : 0;
  const vt = fet.Vt;
  let UGS: number;
  let rejected: number | undefined;
  if (a.Rs === 0) {
    UGS = UG;
  } else {
    // I_D = (U_G − U_GS)/R_s = K(U_GS − vt)²  →  K R_s x² + x − (U_G − vt) = 0，x = U_GS − vt
    const A = K * a.Rs;
    const C = -(UG - vt);
    const disc = 1 - 4 * A * C;
    if (disc < 0) UGS = vt;
    else {
      const x1 = (-1 + Math.sqrt(disc)) / (2 * A);
      const x2 = (-1 - Math.sqrt(disc)) / (2 * A);
      UGS = vt + Math.max(x1, 0);
      rejected = vt + x2;
    }
  }
  const ov = UGS - vt;
  if (ov <= 0) return { UGQ: UG, UGSQ: UGS, IDQ: 0, UDSQ: a.VDD, region: "cutoff", gm: 0, rejected };
  let ID = K * ov * ov;
  let UDS = a.VDD - ID * (a.Rd + a.Rs);
  let region: FETRegion = "saturation";
  if (UDS < ov) {
    region = "ohmic";
    // 可变电阻区：数值求解 I_D = K[2(U_GS−vt)U_DS − U_DS²]，U_GS = U_G − I_D R_s，U_DS = V_DD − I_D(R_d+R_s)
    let lo = 0;
    let hi = a.VDD / (a.Rd + a.Rs);
    for (let k = 0; k < 200; k++) {
      const I = (lo + hi) / 2;
      const ugs = UG - I * a.Rs;
      const uds = a.VDD - I * (a.Rd + a.Rs);
      const f = drainCurrent(fet, ugs, uds) - I;
      if (f > 0) lo = I;
      else hi = I;
    }
    ID = (lo + hi) / 2;
    UGS = UG - ID * a.Rs;
    UDS = a.VDD - ID * (a.Rd + a.Rs);
  }
  return { UGQ: UG, UGSQ: UGS, IDQ: ID, UDSQ: UDS, region, gm: region === "saturation" ? transconductance(fet, ID) : 0, rejected };
}

const par = (...rs: number[]) => {
  let g = 0;
  for (const r of rs) {
    if (r === 0) return 0;
    if (Number.isFinite(r)) g += 1 / r;
  }
  return g === 0 ? Infinity : 1 / g;
};

export interface FETAC {
  gm: number;
  rds: number;
  Au: number;
  Ri: number;
  Ro: number;
}

function gateRi(a: FETAmpParams) {
  return a.bias === "divider" ? a.Rg3 + par(a.Rg1, a.Rg2) : a.Rg;
}

/** 共源：A_u = −g_m R_D'（源极电阻全旁路）或 −g_m R_D'/(1 + g_m R_s) */
export function analyzeCS(a: FETAmpParams): { q: FETQ; ac: FETAC } {
  const q = solveFETQ(a);
  const rds = outputResistance(a.fet, q.IDQ);
  const RDp = par(a.Rd, a.RL, rds);
  const Au = a.bypass ? -q.gm * RDp : (-q.gm * RDp) / (1 + q.gm * a.Rs);
  return { q, ac: { gm: q.gm, rds, Au, Ri: gateRi(a), Ro: par(a.Rd, rds) } };
}

/** 共漏（源极跟随器）：输出取自源极，R_d 通常为 0 */
export function analyzeCD(a: FETAmpParams): { q: FETQ; ac: FETAC } {
  const q = solveFETQ(a);
  const RSp = par(a.Rs, a.RL);
  const Au = (q.gm * RSp) / (1 + q.gm * RSp);
  return { q, ac: { gm: q.gm, rds: Infinity, Au, Ri: gateRi(a), Ro: q.gm > 0 ? par(a.Rs, 1 / q.gm) : a.Rs } };
}

/** 共栅：信号由源极输入，栅极交流接地 */
export function analyzeCG(a: FETAmpParams): { q: FETQ; ac: FETAC } {
  const q = solveFETQ(a);
  const RDp = par(a.Rd, a.RL);
  return { q, ac: { gm: q.gm, rds: Infinity, Au: q.gm * RDp, Ri: q.gm > 0 ? par(a.Rs, 1 / q.gm) : a.Rs, Ro: a.Rd } };
}
