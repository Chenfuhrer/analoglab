/**
 * 稳压管稳压电路：U_I —R— 输出节点（稳压管反接到地，并联负载 R_L）。
 * 稳压管模型：击穿区折线 u = U_Z + r_z·(i_Z − I_Zt)，未击穿时视为开路（忽略反向漏电）。
 * 若给出 rz = 0，则击穿区为理想恒压源。
 */
export interface ZenerSpec {
  /** 稳定电压（在测试电流 I_Zt 下） */
  UZ: number;
  rz: number;
  IZt: number;
  /** 最小稳定电流 */
  IZmin: number;
  /** 最大稳定电流（由 P_ZM/U_Z 决定） */
  IZM: number;
}

export const DEFAULT_ZENER: ZenerSpec = { UZ: 6, rz: 0, IZt: 10e-3, IZmin: 5e-3, IZM: 30e-3 };

export type ZenerStatus = "off" | "under" | "ok" | "over";

export interface ZenerResult {
  UO: number;
  IR: number;
  IZ: number;
  IL: number;
  status: ZenerStatus;
  /** 稳压管功耗 */
  PZ: number;
}

export function solveZenerRegulator(UI: number, R: number, RL: number, z: ZenerSpec = DEFAULT_ZENER): ZenerResult {
  const Uopen = Number.isFinite(RL) ? (UI * RL) / (R + RL) : UI;
  const UZ0 = z.UZ - z.rz * z.IZt; // 折线外推到 i_Z = 0 的电压
  if (Uopen <= UZ0) {
    const IR = (UI - Uopen) / R;
    return { UO: Uopen, IR, IZ: 0, IL: IR, status: "off", PZ: 0 };
  }
  let UO: number;
  if (z.rz === 0) UO = UZ0;
  else {
    const gL = Number.isFinite(RL) ? 1 / RL : 0;
    UO = (UI / R + UZ0 / z.rz) / (1 / R + gL + 1 / z.rz);
  }
  const IR = (UI - UO) / R;
  const IL = Number.isFinite(RL) ? UO / RL : 0;
  const IZ = IR - IL;
  const status: ZenerStatus = IZ < z.IZmin ? "under" : IZ > z.IZM ? "over" : "ok";
  return { UO, IR, IZ, IL, status, PZ: UO * IZ };
}

export interface RRange {
  Rmin: number;
  Rmax: number;
  feasible: boolean;
}

/**
 * 限流电阻取值范围（理想稳压管 U_O ≈ U_Z）：
 *  最不利 1：U_I 最大、I_L 最小 → I_Z 最大，须 ≤ I_ZM ⇒ R ≥ (U_Imax − U_Z)/(I_ZM + I_Lmin)
 *  最不利 2：U_I 最小、I_L 最大 → I_Z 最小，须 ≥ I_Zmin ⇒ R ≤ (U_Imin − U_Z)/(I_Zmin + I_Lmax)
 */
export function limitResistorRange(UImin: number, UImax: number, ILmin: number, ILmax: number, z: Pick<ZenerSpec, "UZ" | "IZmin" | "IZM">): RRange {
  const Rmin = (UImax - z.UZ) / (z.IZM + ILmin);
  const Rmax = (UImin - z.UZ) / (z.IZmin + ILmax);
  return { Rmin, Rmax, feasible: Rmin <= Rmax && Rmax > 0 };
}

/** 稳压系数 S_r = (ΔU_O/U_O)/(ΔU_I/U_I) 与输出电阻 R_o（小信号：R_o = r_z ∥ R） */
export function zenerRegulationIndex(UI: number, R: number, RL: number, z: ZenerSpec): { Sr: number; Ro: number } {
  const d = UI * 1e-3;
  const a = solveZenerRegulator(UI - d, R, RL, z);
  const b = solveZenerRegulator(UI + d, R, RL, z);
  const Sr = (b.UO - a.UO) / ((a.UO + b.UO) / 2) / ((2 * d) / UI);
  const Ro = z.rz === 0 ? 0 : (z.rz * R) / (z.rz + R);
  return { Sr, Ro };
}
