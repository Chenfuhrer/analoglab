/**
 * BJT 特性曲线（用于可视化）。
 *
 * 输出特性：Ebers–Moll 输运模型在给定 i_B 下的闭式解
 *   e = exp(u_CE/U_T),  x = i_C / i_B = (e − 1/α_R) / (1/β_R + e/β_F)
 * 当 u_CE ≫ U_T 时 x → β_F（放大区水平线）；u_CE 很小时 x 迅速下降（饱和区“膝部”）。
 * 可选 Early 效应：i_C ×(1 + u_CE/V_A)。
 */
export interface OutputCurveOptions {
  beta: number;
  betaR?: number;
  UT?: number;
  /** Early 电压，Infinity 表示忽略 */
  VA?: number;
}

export function outputCurrent(uCE: number, iB: number, o: OutputCurveOptions): number {
  const betaR = o.betaR ?? 1;
  const alphaR = betaR / (1 + betaR);
  const UT = o.UT ?? 0.026;
  const VA = o.VA ?? Infinity;
  if (iB <= 0) return 0;
  if (uCE <= 0) return 0;
  const arg = uCE / UT;
  let x: number;
  if (arg > 600) {
    x = o.beta; // 极限
  } else {
    const e = Math.exp(arg);
    x = (e - 1 / alphaR) / (1 / betaR + e / o.beta);
  }
  const early = Number.isFinite(VA) ? 1 + uCE / VA : 1;
  return Math.max(0, x * iB * early);
}

export interface Curve {
  iB: number;
  points: Array<[number, number]>;
}

/** 生成一族输出特性曲线 i_C(u_CE)，横轴 [0, uMax] */
export function outputFamily(iBs: number[], uMax: number, o: OutputCurveOptions, n = 160): Curve[] {
  return iBs.map((iB) => {
    const points: Array<[number, number]> = [];
    for (let k = 0; k <= n; k++) {
      // 在低 u_CE 段加密采样以描出膝部
      const s = k / n;
      const u = uMax * (s < 0.25 ? 0.12 * (s / 0.25) : 0.12 + 0.88 * ((s - 0.25) / 0.75));
      points.push([u, outputCurrent(u, iB, o)]);
    }
    return { iB, points };
  });
}

/** 输入特性（发射结指数模型，在 (U_BEQ, I_BQ) 处校准） */
export function inputCurrent(uBE: number, ref: { UBE: number; IB: number; UT?: number }): number {
  const UT = ref.UT ?? 0.026;
  return ref.IB * Math.exp((uBE - ref.UBE) / UT);
}

/** 选择“好看”的 i_B 阶梯，使 Q 点附近有曲线 */
export function niceBaseCurrentSteps(IBQ: number, count = 6): number[] {
  const target = IBQ > 0 ? IBQ : 10e-6;
  const raw = (target * 1.6) / (count / 2);
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm < 1.5 ? 1 : norm < 3.5 ? 2 : norm < 7.5 ? 5 : 10) * mag;
  return Array.from({ length: count }, (_, i) => (i + 1) * step);
}
