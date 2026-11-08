/**
 * 二极管模型（第 1 章）。
 *  - 指数模型（Shockley）：i = I_S (e^{u/(nU_T)} − 1)
 *  - 反向击穿：u < −U_BR 时按 r_BR 的折线增加反向电流（只用于画图）
 *  - 温度：理想 PN 结 I_S ∝ n_i²（扩散电流），由此得到同一电流下 u_D 约 −2 mV/°C；U_T = kT/q。
 *    （教材所说“反向电流约每升高 10 °C 翻一倍”指硅管实测反向电流，它以耗尽区产生电流为主，∝ n_i。）
 *  - 等效模型：理想、恒压降、折线（U_th + r_D）、指数
 */
import { intrinsicDensity, thermalVoltage, type Material } from "@/simulations/semi/carriers";

export interface DiodeParams {
  /** 300 K 时的反向饱和电流 */
  Is: number;
  /** 发射系数 */
  n: number;
  /** 温度 K */
  T: number;
  /** 反向击穿电压（正数），Infinity 表示不考虑 */
  UBR: number;
  /** 击穿区等效电阻 */
  rBR: number;
  material: Material;
}

/** 示意硅二极管：1 mA 时约 0.6 V，10 mA 时约 0.66 V */
export const SI_DIODE: DiodeParams = { Is: 1e-13, n: 1, T: 300, UBR: 50, rBR: 20, material: "Si" };
export const GE_DIODE: DiodeParams = { Is: 2e-7, n: 1, T: 300, UBR: 30, rBR: 50, material: "Ge" };

export function saturationCurrent(p: DiodeParams): number {
  const r = intrinsicDensity(p.T, p.material) / intrinsicDensity(300, p.material);
  return p.Is * r * r;
}

export function diodeCurrent(u: number, p: DiodeParams): number {
  const Is = saturationCurrent(p);
  const nUT = p.n * thermalVoltage(p.T);
  if (u < -p.UBR) return -Is - (-u - p.UBR) / p.rBR;
  const x = Math.min(u / nUT, 80);
  return Is * (Math.exp(x) - 1);
}

/** 达到电流 I 所需的正向电压（指数模型反函数） */
export function diodeVoltage(I: number, p: DiodeParams): number {
  const Is = saturationCurrent(p);
  return p.n * thermalVoltage(p.T) * Math.log(I / Is + 1);
}

/** 小信号动态电阻 r_d = nU_T / I_D */
export function dynamicResistance(ID: number, p: Pick<DiodeParams, "n" | "T"> = SI_DIODE): number {
  return (p.n * thermalVoltage(p.T)) / ID;
}

export type DiodeModel = "ideal" | "const" | "pwl" | "exp";

export const MODEL_LABEL: Record<DiodeModel, string> = {
  ideal: "理想模型",
  const: "恒压降模型",
  pwl: "折线模型",
  exp: "指数模型",
};

export interface ModelSpec {
  /** 恒压降模型导通电压 */
  Uon: number;
  /** 折线模型：门槛电压与导通电阻 */
  Uth: number;
  rD: number;
  diode: DiodeParams;
}

export const DEFAULT_SPEC: ModelSpec = { Uon: 0.7, Uth: 0.5, rD: 20, diode: SI_DIODE };

export interface SeriesResult {
  ID: number;
  UD: number;
  on: boolean;
}

/**
 * 串联电路：电压源 V（正端接阳极方向）→ 电阻 R → 二极管 → 地。
 * 指数模型用二分法求解 V = I R + u_D(I)（单调，必收敛）。
 */
export function solveSeries(V: number, R: number, model: DiodeModel, spec: ModelSpec = DEFAULT_SPEC): SeriesResult {
  switch (model) {
    case "ideal":
      return V > 0 ? { ID: V / R, UD: 0, on: true } : { ID: 0, UD: V, on: false };
    case "const":
      return V > spec.Uon ? { ID: (V - spec.Uon) / R, UD: spec.Uon, on: true } : { ID: 0, UD: V, on: false };
    case "pwl": {
      if (V <= spec.Uth) return { ID: 0, UD: V, on: false };
      const ID = (V - spec.Uth) / (R + spec.rD);
      return { ID, UD: spec.Uth + ID * spec.rD, on: true };
    }
    case "exp": {
      if (V <= 0) {
        const ID = diodeCurrent(V, spec.diode); // 反向：≈ −I_S
        return { ID, UD: V - ID * R, on: false };
      }
      let lo = 0;
      let hi = V;
      for (let k = 0; k < 200; k++) {
        const mid = (lo + hi) / 2;
        const f = (V - mid) / R - diodeCurrent(mid, spec.diode);
        if (f > 0) lo = mid;
        else hi = mid;
      }
      const UD = (lo + hi) / 2;
      return { ID: (V - UD) / R, UD, on: true };
    }
  }
}

export interface GateResult {
  /** 输出电压 */
  UO: number;
  /** 各二极管是否导通 */
  on: boolean[];
}

/**
 * 二极管“门”电路（恒压降模型，假设—验证法的标准例子）。
 *  - kind="and"：各二极管阴极接输入 U_k，阳极并联到输出，经 R 接 +V_ref。
 *    阳极电位最低的那只（输入最低）优先导通，把输出钳在 min(U_k)+U_on。
 *  - kind="or"：各二极管阳极接输入，阴极并联到输出，经 R 接 V_ref（常为地或负电源）。
 *    输入最高者导通，输出为 max(U_k)−U_on。
 * 输出端开路（不接负载）。
 */
export function diodeGate(kind: "and" | "or", inputs: number[], Vref: number, Uon = 0.7): GateResult {
  if (kind === "and") {
    const m = Math.min(...inputs);
    if (m + Uon >= Vref) return { UO: Vref, on: inputs.map(() => false) };
    const UO = m + Uon;
    return { UO, on: inputs.map((u) => UO - u >= Uon - 1e-12) };
  }
  const M = Math.max(...inputs);
  if (M - Uon <= Vref) return { UO: Vref, on: inputs.map(() => false) };
  const UO = M - Uon;
  return { UO, on: inputs.map((u) => u - UO >= Uon - 1e-12) };
}

/** 题目用：给定 I_S 与 U_T（如 26 mV）的 PN 结电流方程 */
export function shockley(u: number, Is: number, UT = 0.026): number {
  return Is * (Math.exp(u / UT) - 1);
}

/** 题目用：电流方程的反函数 */
export function shockleyVoltage(i: number, Is: number, UT = 0.026): number {
  return UT * Math.log(i / Is + 1);
}
