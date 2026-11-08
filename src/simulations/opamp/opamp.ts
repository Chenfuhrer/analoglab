/**
 * 集成运放及其线性/非线性应用（第 7 章）。
 * 运放模型：开环差模增益 A_od（有限）、输出饱和 ±U_OM；必要时考虑差模输入电阻 r_id。
 * 线性电路的“精确值”按有限 A_od 推导；“理想值”即 A_od → ∞（虚短、虚断）。
 */
import { par } from "../units";

export interface OpAmpModel {
  Aod: number;
  UOM: number;
  rid: number;
}

export const IDEAL_OA: OpAmpModel = { Aod: Infinity, UOM: Infinity, rid: Infinity };
export const TYPICAL_OA: OpAmpModel = { Aod: 1e5, UOM: 13, rid: 2e6 };

export const clipOut = (u: number, UOM: number) => Math.max(-UOM, Math.min(UOM, u));

/** 开环电压传输特性 */
export function openLoop(uP: number, uN: number, m: OpAmpModel): number {
  return clipOut(m.Aod * (uP - uN), m.UOM);
}

/** 闭环增益通式：A_f = A_ideal / (1 + (噪声增益)/A_od)，噪声增益 = 1 + R_f / R_N（R_N 为反相端对地等效电阻） */
function finite(ideal: number, noiseGain: number, Aod: number) {
  return Number.isFinite(Aod) ? ideal / (1 + noiseGain / Aod) : ideal;
}

export interface PropResult {
  ideal: number;
  actual: number;
  /** 相对误差 (actual − ideal)/ideal */
  error: number;
  Ri: number;
  /** 输入为 ui 时反相端的电位（反相放大器的“虚地”偏离 0 的程度） */
  uN: (ui: number) => number;
}

/** 反相比例：A = −R_f/R_1；R_i = R_1 */
export function inverting(R1: number, Rf: number, m: OpAmpModel = IDEAL_OA): PropResult {
  const ideal = -Rf / R1;
  const actual = finite(ideal, 1 + Rf / R1, m.Aod);
  return { ideal, actual, error: (actual - ideal) / ideal, Ri: R1, uN: (ui) => (Number.isFinite(m.Aod) ? -(actual * ui) / m.Aod : 0) };
}

/** 同相比例：A = 1 + R_f/R_1；R_i ≈ r_id(1 + A_od F)（深度负反馈时极大） */
export function nonInverting(R1: number, Rf: number, m: OpAmpModel = IDEAL_OA): PropResult {
  const ideal = Number.isFinite(R1) ? 1 + Rf / R1 : 1;
  const actual = finite(ideal, ideal, m.Aod);
  const F = 1 / ideal;
  const Ri = Number.isFinite(m.Aod) && Number.isFinite(m.rid) ? m.rid * (1 + m.Aod * F) : Infinity;
  return { ideal, actual, error: (actual - ideal) / ideal, Ri, uN: (ui) => actual * ui * F };
}

/** 反相求和：u_O = −R_f Σ u_Ik / R_k */
export function invertingSum(R: number[], Rf: number, u: number[], m: OpAmpModel = IDEAL_OA): number {
  const ideal = -Rf * u.reduce((s, x, k) => s + x / R[k], 0);
  const RN = par(...R);
  return clipOut(finite(ideal, 1 + Rf / RN, m.Aod), m.UOM);
}

export interface SubResult {
  uO: number;
  /** 差模增益（对 u_I2 − u_I1） */
  Ad: number;
  /** 共模增益 */
  Ac: number;
  KCMR: number;
}

/**
 * 差分比例（减法）电路：u_I1 经 R_1 接反相端，R_f 反馈；u_I2 经 R_2 接同相端，R_3 接地。
 * u_O = (1 + R_f/R_1)·R_3/(R_2+R_3)·u_I2 − (R_f/R_1)·u_I1（理想运放）。
 */
export function subtractor(R1: number, Rf: number, R2: number, R3: number, u1: number, u2: number): SubResult {
  const kp = (1 + Rf / R1) * (R3 / (R2 + R3));
  const kn = Rf / R1;
  const uO = kp * u2 - kn * u1;
  // u1 = uc − ud/2，u2 = uc + ud/2
  const Ad = (kp + kn) / 2;
  const Ac = kp - kn;
  return { uO, Ad, Ac, KCMR: Ac === 0 ? Infinity : Math.abs(Ad / Ac) };
}

export interface LinearDesign {
  Rf: number;
  /** 反相输入端各输入电阻（对应系数 b） */
  Rneg: number[];
  /** 同相输入端各输入电阻（对应系数 a） */
  Rpos: number[];
  /** 同相端对地电阻（Infinity 表示不接） */
  Rp: number;
  /** 反相端对地电阻（Infinity 表示不接；当 Σa > 1 + Σb 时需要） */
  Rg: number;
}

/**
 * 设计单运放线性组合 u_O = Σ a_i u_Pi − Σ b_j u_Nj（a_i、b_j ≥ 0），并使同相端、反相端对地电阻相等（平衡）。
 * 推导：N = 1 + R_f/R_N（R_N 为反相端所有对地支路并联），u_P = R_P Σ u_i/R_i，u_O = N u_P − Σ (R_f/R_j) u_j。
 */
export function designLinear(a: number[], b: number[], Rf: number): LinearDesign {
  const Rneg = b.map((bj) => Rf / bj);
  const sumA = a.reduce((s, x) => s + x, 0);
  const sumB = b.reduce((s, x) => s + x, 0);
  let N = 1 + sumB;
  let Rg = Infinity;
  if (sumA > N) {
    // 需要额外的反相端对地电阻，使 N = Σa（此时同相端不必再接对地电阻）
    Rg = Rf / (sumA - N);
    N = sumA;
  }
  // 平衡：R_P = R_f ∥ R_neg… ∥ R_g
  const RP = par(Rf, ...Rneg, Rg);
  const Rpos = a.map((ai) => (N * RP) / ai);
  const Gp = 1 / RP - a.reduce((s, ai) => s + ai / (N * RP), 0);
  const Rp = Gp > 1e-15 ? 1 / Gp : Infinity;
  return { Rf, Rneg, Rpos, Rp, Rg };
}

/** 按电阻值计算单运放线性电路的输出（理想运放），用于验证设计 */
export function evalLinear(d: LinearDesign, uPos: number[], uNeg: number[]): number {
  const GP = d.Rpos.reduce((s, r) => s + 1 / r, 0) + (Number.isFinite(d.Rp) ? 1 / d.Rp : 0);
  const uP = d.Rpos.reduce((s, r, k) => s + uPos[k] / r, 0) / (GP || 1);
  const RN = par(...d.Rneg, d.Rg);
  const N = 1 + d.Rf / RN;
  return N * uP - d.Rneg.reduce((s, r, k) => s + (d.Rf / r) * uNeg[k], 0);
}

export interface Wave {
  t: number[];
  ui: number[];
  uo: number[];
}

export type InputShape = "step" | "square" | "sine" | "triangle";

export function inputSignal(shape: InputShape, amp: number, f: number, t: number): number {
  const ph = (t * f) % 1;
  switch (shape) {
    case "step":
      return t >= 0 ? amp : 0;
    case "square":
      return ph < 0.5 ? amp : -amp;
    case "sine":
      return amp * Math.sin(2 * Math.PI * ph);
    case "triangle":
      return ph < 0.5 ? amp * (4 * ph - 1) : amp * (3 - 4 * ph);
  }
}

/**
 * 反相积分电路（理想运放 + 输出饱和）：C du_C/dt = u_I/R − u_O/R_f… 以 u_O 为变量：
 * du_O/dt = −u_I/(RC) − u_O/(R_f C)（R_f 为并联在电容两端的电阻，Infinity 表示理想积分器）。
 * 方波输入时取 u_O(0) = +A·T/(4RC)，使稳态三角波关于零对称（理想积分器无直流反馈，初值决定直流电平）。
 */
export function simulateIntegrator(o: { shape: InputShape; amp: number; f: number; R: number; C: number; Rf?: number; UOM?: number; periods?: number; uo0?: number; n?: number }): Wave {
  const Rf = o.Rf ?? Infinity;
  const UOM = o.UOM ?? 13;
  const periods = o.periods ?? 3;
  const n = o.n ?? 600;
  const T = 1 / o.f;
  const dt = (T * periods) / n;
  const tau = o.R * o.C;
  let uo = o.uo0 ?? (o.shape === "square" && !Number.isFinite(Rf) ? (o.amp * T) / (4 * tau) : o.shape === "sine" && !Number.isFinite(Rf) ? (o.amp * T) / (2 * Math.PI * tau) : 0);
  uo = clipOut(uo, UOM);
  const t: number[] = [];
  const ui: number[] = [];
  const uos: number[] = [];
  for (let k = 0; k <= n; k++) {
    const tt = k * dt;
    const u = inputSignal(o.shape, o.amp, o.f, tt);
    if (k > 0) {
      // 梯形积分（对 u_I）+ 后向欧拉（对 R_f 泄放项）
      const uPrev = inputSignal(o.shape, o.amp, o.f, tt - dt);
      const drive = -((u + uPrev) / 2) * (dt / tau);
      const leak = Number.isFinite(Rf) ? dt / (Rf * o.C) : 0;
      uo = clipOut((uo + drive) / (1 + leak), UOM);
    }
    t.push(tt);
    ui.push(u);
    uos.push(uo);
  }
  return { t, ui, uo: uos };
}

/**
 * 反相微分电路：输入经 R_1（限流，可为 0）和 C 接反相端，反馈电阻 R。
 * 电容电压 du_C/dt = (u_I − u_C)/(R_1 C)，u_O = −R(u_I − u_C)/R_1；R_1 = 0 时 u_O = −RC du_I/dt。
 * 可叠加高频噪声以说明微分电路放大噪声。
 */
export function simulateDifferentiator(o: { shape: InputShape; amp: number; f: number; R: number; C: number; R1?: number; UOM?: number; periods?: number; noise?: { amp: number; f: number }; n?: number }): Wave {
  const UOM = o.UOM ?? 13;
  const periods = o.periods ?? 3;
  const n = o.n ?? 1200;
  const T = 1 / o.f;
  const dt = (T * periods) / n;
  const R1 = o.R1 ?? 0;
  const sig = (tt: number) => inputSignal(o.shape, o.amp, o.f, tt) + (o.noise ? o.noise.amp * Math.sin(2 * Math.PI * o.noise.f * tt) : 0);
  const t: number[] = [];
  const ui: number[] = [];
  const uo: number[] = [];
  let uC = sig(0);
  for (let k = 0; k <= n; k++) {
    const tt = k * dt;
    const u = sig(tt);
    let out: number;
    if (R1 > 0) {
      if (k > 0) uC = (uC + (dt / (R1 * o.C)) * u) / (1 + dt / (R1 * o.C));
      out = (-o.R * (u - uC)) / R1;
    } else {
      const d = (sig(tt + dt / 2) - sig(tt - dt / 2)) / dt;
      out = -o.R * o.C * d;
    }
    t.push(tt);
    ui.push(u);
    uo.push(clipOut(out, UOM));
  }
  return { t, ui, uo };
}

/* ───────── 电压比较器 ───────── */

/** 反相输入滞回比较器（施密特触发器）：同相端经 R_1 接地（或接 U_REF）、R_2 接输出；输出被稳压管限幅为 ±U_Z */
export function schmittThresholds(R1: number, R2: number, UZ: number, UREF = 0): { UTp: number; UTm: number; width: number } {
  const k = R1 / (R1 + R2);
  const base = (R2 / (R1 + R2)) * UREF;
  return { UTp: base + k * UZ, UTm: base - k * UZ, width: 2 * k * UZ };
}

/** 比较器时域响应：hyst=false 为单限比较器（阈值 UT），true 为反相滞回比较器 */
export function simulateComparator(ui: number[], o: { hyst: boolean; UT?: number; UTp?: number; UTm?: number; UZ: number; inverting?: boolean }): number[] {
  const inv = o.inverting ?? true;
  const out: number[] = [];
  let state = o.UZ; // 初始输出为高
  for (const u of ui) {
    if (!o.hyst) {
      const above = u > (o.UT ?? 0);
      state = (above !== inv ? 1 : -1) * o.UZ;
    } else {
      if (state > 0 && u > o.UTp!) state = -o.UZ;
      else if (state < 0 && u < o.UTm!) state = o.UZ;
    }
    out.push(state);
  }
  return out;
}

/** 理想积分器在恒定输入 U_I 下，输出从 0 变化到 |U| 所需的时间 t = |U|·RC/|U_I| */
export function integratorTimeTo(U: number, UI: number, R: number, C: number): number {
  return (Math.abs(U) * R * C) / Math.abs(UI);
}
