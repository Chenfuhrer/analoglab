/**
 * 共射放大电路（NPN）参数与结果类型。
 * 单位：电压 V、电流 A、电阻 Ω、电容 F、频率 Hz。
 *
 * 电路约定（与童诗白《模拟电子技术基础》一致）：
 *  - 固定偏置：R_b 接在 V_CC 与基极之间。
 *  - 分压偏置：R_b2 为上偏置电阻（V_CC→基极），R_b1 为下偏置电阻（基极→地）。
 *  - 射极电阻分两段：R_e1 始终不被旁路（教材中常记作 R_f），R_e2 可被旁路电容 C_e 旁路。
 *  - 信号源 u_s（内阻 R_s）经 C_1 接基极；负载 R_L 经 C_2 接集电极。
 */
export type BiasTopology = "fixed" | "divider";

export interface CEParams {
  topology: BiasTopology;
  VCC: number;
  /** 固定偏置基极电阻 */
  Rb: number;
  /** 分压偏置下偏置电阻（基极→地） */
  Rb1: number;
  /** 分压偏置上偏置电阻（V_CC→基极） */
  Rb2: number;
  Rc: number;
  /** 不被旁路的射极电阻（0 表示无） */
  Re1: number;
  /** 可被 C_e 旁路的射极电阻（0 表示无） */
  Re2: number;
  /** 是否接入旁路电容 C_e（仅当 Re2>0 时有意义） */
  hasCe: boolean;
  /** 负载电阻；Infinity 表示空载 */
  RL: number;
  /** 信号源内阻 */
  Rs: number;
  beta: number;
  /** 发射结导通压降（恒压降模型） */
  UBE: number;
  /** 饱和压降 */
  UCES: number;
  /** 基区体电阻 r_bb' */
  rbb: number;
  /** 温度电压当量 U_T */
  UT: number;
  /** 信号源电压峰值 U_sm */
  Usm: number;
  /** 信号频率 */
  f: number;
  C1: number;
  C2: number;
  Ce: number;
}

export type Region = "cutoff" | "active" | "saturation";

export interface DCResult {
  region: Region;
  /** 基极回路戴维南等效电压 */
  VBB: number;
  /** 基极回路戴维南等效电阻 */
  RB: number;
  /** 射极总电阻（直流） */
  RE: number;
  IBQ: number;
  ICQ: number;
  IEQ: number;
  UCEQ: number;
  /** 基极、集电极、发射极对地电位 */
  UBQ: number;
  UCQ: number;
  UEQ: number;
  /** 饱和时的“强制 β”= I_C/I_B；放大区等于 β */
  betaForced: number;
  /** 集电极回路允许的最大电流（u_CE = U_CES 时，近似 I_E≈I_C） */
  ICmax: number;
  /** 分压偏置的教材估算法（忽略 I_BQ 对分压的影响） */
  estimate?: {
    UBQ: number;
    IEQ: number;
    ICQ: number;
    IBQ: number;
    UCEQ: number;
    /** 估算法成立条件的比值 (1+β)R_E / R_B，教材一般要求 ≥ 10 */
    ratio: number;
  };
}

export interface ACResult {
  /** 仅当 Q 点处于放大区时小信号分析有效 */
  valid: boolean;
  rbe: number;
  /** r_b'e = (1+β)U_T/I_EQ */
  rbpe: number;
  /** 交流通路中未被旁路的射极电阻 */
  ReAC: number;
  /** R_L' = R_c ∥ R_L */
  RLp: number;
  /** 从基极看进去的电阻 r_be + (1+β)R_e,ac */
  Rib: number;
  Ri: number;
  Ro: number;
  Au: number;
  /** 空载电压放大倍数 */
  Auo: number;
  /** 对信号源的电压放大倍数 */
  Aus: number;
  /** 截止限制的输出正峰值 */
  UomCut: number;
  /** 饱和限制的输出负峰值（幅值） */
  UomSat: number;
  /** 最大不失真输出幅值 */
  Uom: number;
  /** 先发生的失真类型 */
  limitedBy: "cutoff" | "saturation";
  /** 不失真时允许的最大信号源峰值 */
  UsmMax: number;
}

export interface LowFreqResult {
  fC1: number;
  fC2: number;
  fCe: number;
  /** 短路时间常数法：f_L ≈ Σ f_i */
  fL: number;
}

export const DEFAULT_CE: CEParams = {
  topology: "fixed",
  VCC: 12,
  Rb: 565e3,
  Rb1: 10e3,
  Rb2: 47e3,
  Rc: 3e3,
  Re1: 0,
  Re2: 0,
  hasCe: true,
  RL: 3e3,
  Rs: 0,
  beta: 100,
  UBE: 0.7,
  UCES: 0.3,
  rbb: 100,
  UT: 0.026,
  Usm: 0.005,
  f: 1000,
  C1: 10e-6,
  C2: 10e-6,
  Ce: 100e-6,
};

/** 分压偏置的推荐默认值：Q 点 I_CQ≈1.62 mA、U_CEQ≈5.17 V（ce.test.ts 中有手算核对） */
export const DEFAULT_DIVIDER: CEParams = {
  ...DEFAULT_CE,
  topology: "divider",
  Rb1: 10e3,
  Rb2: 33e3,
  Rc: 3e3,
  Re1: 200,
  Re2: 1e3,
  hasCe: true,
  RL: 3e3,
  Usm: 0.02,
};
