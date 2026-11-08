/**
 * 负反馈放大电路（第 8 章）。
 *  - 基本方程 A_f = A/(1 + AF)、增益灵敏度、带宽展宽（单极点）
 *  - 非线性失真的减小：对一个带非线性的开环放大器，闭环方程 y = a(x − F·y) 用二分法逐点求解
 *  - 四种组态对输入、输出电阻的影响
 *  - 稳定性：多极点环路增益的波特图、增益裕度与相位裕度、闭环阶跃响应（时域仿真）
 */
import { cabs, cargDeg, cdiv, cmul, type Cplx } from "../signal/rc";

export function closedLoop(A: number, F: number): { Af: number; depth: number } {
  const depth = 1 + A * F;
  return { Af: A / depth, depth };
}

/** 开环增益相对变化 dA/A 引起的闭环增益相对变化（精确，非微分近似） */
export function gainSensitivity(A: number, F: number, relChange: number): { before: number; after: number; rel: number } {
  const before = closedLoop(A, F).Af;
  const after = closedLoop(A * (1 + relChange), F).Af;
  return { before, after, rel: (after - before) / before };
}

/** 单极点放大器 A(jf) = A_m/(1 + j f/f_H)，引入负反馈后 f_Hf = (1 + A_mF)f_H */
export function singlePole(Am: number, fH: number, f: number): Cplx {
  return cdiv({ re: Am, im: 0 }, { re: 1, im: f / fH });
}

export function closedLoopComplex(A: Cplx, F: number): Cplx {
  return cdiv(A, { re: 1 + A.re * F, im: A.im * F });
}

export function bandwidthWithFeedback(Am: number, fH: number, F: number): { Amf: number; fHf: number; GBW: number } {
  const D = 1 + Am * F;
  return { Amf: Am / D, fHf: fH * D, GBW: Am * fH };
}

/** 带非线性的开环放大器：a(x) = A·tanh(x/x_s)·x_s（小信号增益 A，输出在 ±A·x_s 处软限幅） */
export function softAmp(A: number, xs: number): (x: number) => number {
  return (x) => A * xs * Math.tanh(x / xs);
}

/** 闭环：y = a(x − F y)，a 单调递增，二分求解 */
export function solveClosedLoop(a: (x: number) => number, F: number, x: number): number {
  let lo = -1e6;
  let hi = 1e6;
  for (let k = 0; k < 200; k++) {
    const y = (lo + hi) / 2;
    const r = a(x - F * y) - y;
    if (r > 0) lo = y;
    else hi = y;
  }
  return (lo + hi) / 2;
}

export type Topology = "voltage-series" | "voltage-shunt" | "current-series" | "current-shunt";

export const TOPOLOGY_LABEL: Record<Topology, string> = {
  "voltage-series": "电压串联负反馈",
  "voltage-shunt": "电压并联负反馈",
  "current-series": "电流串联负反馈",
  "current-shunt": "电流并联负反馈",
};

/** 稳定的量与增益的量纲 */
export const TOPOLOGY_INFO: Record<Topology, { stable: string; gain: string; Ri: "up" | "down"; Ro: "up" | "down" }> = {
  "voltage-series": { stable: "输出电压", gain: "A_uu（电压增益）", Ri: "up", Ro: "down" },
  "voltage-shunt": { stable: "输出电压", gain: "A_ui（互阻增益，Ω）", Ri: "down", Ro: "down" },
  "current-series": { stable: "输出电流", gain: "A_iu（互导增益，S）", Ri: "up", Ro: "up" },
  "current-shunt": { stable: "输出电流", gain: "A_ii（电流增益）", Ri: "down", Ro: "up" },
};

/** 反馈对输入电阻、输出电阻的影响：串联 ×(1+AF)，并联 ÷(1+AF)；电压反馈 R_o ÷(1+A_oF)，电流反馈 R_o ×(1+A_sF) */
export function feedbackResistances(t: Topology, Ri: number, Ro: number, depth: number): { Rif: number; Rof: number } {
  const series = t.endsWith("series");
  const voltage = t.startsWith("voltage");
  return { Rif: series ? Ri * depth : Ri / depth, Rof: voltage ? Ro / depth : Ro * depth };
}

/* ───────── 稳定性 ───────── */

export interface LoopSpec {
  /** 低频环路增益 A_m·F */
  T0: number;
  /** 极点频率（Hz） */
  poles: number[];
}

export function loopGain(s: LoopSpec, f: number): Cplx {
  let h: Cplx = { re: s.T0, im: 0 };
  for (const p of s.poles) h = cmul(h, cdiv({ re: 1, im: 0 }, { re: 1, im: f / p }));
  return h;
}

export interface Margins {
  /** |T| = 1 处的频率（增益交越频率），无则为 NaN */
  fc: number;
  /** φ_T = −180° 处的频率（相位交越频率），无则为 NaN */
  f180: number;
  /** 相位裕度（度） */
  PM: number;
  /** 增益裕度（dB，正值表示稳定） */
  GM: number;
  stable: boolean;
}

/** 对数扫频求裕度（相位按连续展开，避免 ±180° 跳变） */
export function margins(s: LoopSpec, fmin = 0.01, fmax = 1e10): Margins {
  const N = 4000;
  let fc = NaN;
  let f180 = NaN;
  let prevMag = Infinity;
  let prevPh = 0;
  let prevF = fmin;
  const phaseAt = (f: number) => -s.poles.reduce((acc, p) => acc + (Math.atan(f / p) * 180) / Math.PI, 0);
  for (let k = 0; k <= N; k++) {
    const f = fmin * Math.pow(fmax / fmin, k / N);
    const mag = cabs(loopGain(s, f));
    const ph = phaseAt(f);
    if (k > 0) {
      if (Number.isNaN(fc) && prevMag >= 1 && mag < 1) fc = prevF * Math.pow(f / prevF, Math.log(prevMag) / Math.log(prevMag / mag));
      if (Number.isNaN(f180) && prevPh > -180 && ph <= -180) f180 = prevF + ((-180 - prevPh) / (ph - prevPh)) * (f - prevF);
    }
    prevMag = mag;
    prevPh = ph;
    prevF = f;
  }
  const PM = Number.isNaN(fc) ? 180 : 180 + phaseAt(fc);
  const GM = Number.isNaN(f180) ? Infinity : -20 * Math.log10(cabs(loopGain(s, f180)));
  return { fc, f180, PM, GM, stable: PM > 0 && GM > 0 };
}

export function loopPhaseDeg(s: LoopSpec, f: number): number {
  return -s.poles.reduce((acc, p) => acc + (Math.atan(f / p) * 180) / Math.PI, 0);
}

export { cabs, cargDeg };

/**
 * 闭环阶跃响应（时域）：放大器 A(s) = A_m/∏(1+s/ω_k)，反馈系数 F，参考输入为单位阶跃。
 * 状态方程：dy_1/dt = ω_1(A_m e − y_1)，dy_k/dt = ω_k(y_{k−1} − y_k)，e = 1 − F y_n。
 * 输出限幅 ±limit（模拟运放饱和，避免不稳定时数值溢出）。返回归一化到理想值 1/F 的输出。
 */
export function closedLoopStep(Am: number, poles: number[], F: number, opts: { tEnd?: number; n?: number; limit?: number } = {}): { t: number[]; y: number[] } {
  const w = poles.map((p) => 2 * Math.PI * p);
  const T0 = Am * F;
  const fc = Math.max(...poles) * 4;
  const tEnd = opts.tEnd ?? 40 / (2 * Math.PI * Math.min(fc, poles[0] * Math.max(1, T0)));
  const n = opts.n ?? 6000;
  const dt = tEnd / n;
  const limit = opts.limit ?? (3 * Am) / Math.max(T0, 1);
  const y = new Array(w.length).fill(0);
  const ts: number[] = [];
  const ys: number[] = [];
  const sub = 20;
  const h = dt / sub;
  for (let k = 0; k <= n; k++) {
    ts.push(k * dt);
    ys.push((y[y.length - 1] * F));
    for (let s = 0; s < sub; s++) {
      const e = 1 - F * y[y.length - 1];
      for (let i = 0; i < w.length; i++) {
        const inp = i === 0 ? Am * e : y[i - 1];
        // 一阶环节的精确离散化（指数积分），保证刚性情况下稳定
        const a = Math.exp(-w[i] * h);
        y[i] = a * y[i] + (1 - a) * inp;
        if (y[i] > limit) y[i] = limit;
        if (y[i] < -limit) y[i] = -limit;
      }
    }
  }
  return { t: ts, y: ys };
}

/** 共射电路未旁路射极电阻 R_e（电流串联负反馈）：反馈深度 1 + AF ≈ 1 + (1+β)R_e/r_be，深度负反馈估算 A_uf ≈ −R_L'/R_e */
export function ceEmitterFeedback(beta: number, rbe: number, Re: number, RLp: number): { depth: number; estimate: number } {
  return { depth: 1 + ((1 + beta) * Re) / rbe, estimate: -RLp / Re };
}

/** 集电极–基极电阻 R_f 构成的电压并联负反馈，深度负反馈时源电压增益 A_usf ≈ −R_f/R_s */
export function collectorBaseEstimate(Rf: number, Rs: number): number {
  return -Rf / Rs;
}

/** 由开环增益 A 与要求的闭环增益 A_f 反求反馈系数：F = (A/A_f − 1)/A */
export function feedbackForGain(A: number, Af: number): number {
  return (A / Af - 1) / A;
}

/** 单极点高通放大器引入负反馈后的下限频率 f_Lf = f_L/(1 + A_mF) */
export function lowCornerWithFeedback(Am: number, fL: number, F: number): number {
  return fL / closedLoop(Am, F).depth;
}

/** 运放电流串联负反馈（负载在反馈回路中，R 接反相端到地）：i_O = u_I / R（深度负反馈，与 R_L 无关） */
export function currentSeriesOutput(uI: number, R: number): number {
  return uI / R;
}

/** 临界环路增益：相位达到 −180° 的频率 f_180 处 |AF| = 1 所对应的低频环路增益 T0 = ∏√(1+(f_180/f_k)²) */
export function criticalLoopGain(poles: number[]): { T0: number; f180: number } {
  const phase = (f: number) => poles.reduce((s, p) => s + Math.atan(f / p), 0);
  if (phase(1e15) <= Math.PI) return { T0: Infinity, f180: NaN };
  let lo = 1e-6;
  let hi = 1e15;
  for (let k = 0; k < 200; k++) {
    const mid = Math.sqrt(lo * hi);
    if (phase(mid) < Math.PI) lo = mid;
    else hi = mid;
  }
  const f180 = Math.sqrt(lo * hi);
  return { T0: poles.reduce((s, p) => s * Math.sqrt(1 + (f180 / p) ** 2), 1), f180 };
}
