/**
 * 二极管波形电路（第 1、12 章）：整流、限幅、钳位、电容滤波。
 * 二极管用恒压降模型（导通压降 Uon，可取 0 即理想模型）；电阻负载。
 * 时间单位：一个输入周期 T 归一化到 1 时用 phase；需要真实时间的（滤波、钳位）用秒。
 */

export type RectKind = "half" | "bridge" | "center";

/** 整流输出瞬时值；u2 为变压器副边瞬时电压（全波时为每个半绕组电压） */
export function rectify(u2: number, kind: RectKind, Uon = 0): number {
  if (kind === "half") return u2 > Uon ? u2 - Uon : 0;
  const drops = kind === "bridge" ? 2 * Uon : Uon;
  const a = Math.abs(u2);
  return a > drops ? a - drops : 0;
}

/** 整流输出平均值（理想二极管）：半波 0.45U₂，全波/桥式 0.9U₂ */
export function rectifiedAverage(U2rms: number, kind: RectKind): number {
  const k = kind === "half" ? Math.SQRT2 / Math.PI : (2 * Math.SQRT2) / Math.PI;
  return k * U2rms;
}

/** 数值求平均（含导通压降），用于与公式比较 */
export function rectifiedAverageNumeric(U2rms: number, kind: RectKind, Uon: number, n = 4000): number {
  let s = 0;
  for (let k = 0; k < n; k++) s += rectify(Math.SQRT2 * U2rms * Math.sin((2 * Math.PI * (k + 0.5)) / n), kind, Uon);
  return s / n;
}

export interface RectDiodeStress {
  /** 二极管平均电流 */
  ID: number;
  /** 最大反向电压 */
  URM: number;
}

/** 二极管的电流与反向电压（理想二极管、电阻负载） */
export function rectifierStress(U2rms: number, RL: number, kind: RectKind): RectDiodeStress {
  const UO = rectifiedAverage(U2rms, kind);
  const IO = UO / RL;
  if (kind === "half") return { ID: IO, URM: Math.SQRT2 * U2rms };
  if (kind === "bridge") return { ID: IO / 2, URM: Math.SQRT2 * U2rms };
  return { ID: IO / 2, URM: 2 * Math.SQRT2 * U2rms };
}

export interface ClipSpec {
  /** 上限：二极管导通后输出被钳在 upper（已含导通压降）；undefined 表示无上限 */
  upper?: number;
  lower?: number;
}

/**
 * 并联限幅：二极管 + 参考电压 E 并在输出端（串联电阻在前）。
 * 上限幅：阳极接输出、阴极接 E ⇒ u_o ≤ E + U_on；下限幅：阴极接输出、阳极接 −E' ⇒ u_o ≥ −E' − U_on。
 * 输出端空载、二极管导通电阻为 0 时，未导通部分 u_o = u_i。
 */
export function clip(ui: number, s: ClipSpec): number {
  let u = ui;
  if (s.upper !== undefined && u > s.upper) u = s.upper;
  if (s.lower !== undefined && u < s.lower) u = s.lower;
  return u;
}

export interface ClampResult {
  t: number[];
  ui: number[];
  uo: number[];
  uC: number[];
}

/**
 * 钳位电路时域仿真：u_i —C— 输出节点，节点对地接二极管（阳极在输出、阴极接 E）与负载 R。
 * 二极管：u_o > E + U_on 时导通，导通电阻 Ron。后向欧拉，每步按“截止/导通”两种线性情况求解。
 * 结果：稳态时 u_o 的正峰被钳在 E + U_on 附近，整个波形下移（正峰钳位）。
 */
export function simulateClamp(opts: { Um: number; f: number; C: number; R: number; E?: number; Uon?: number; Ron?: number; periods?: number; steps?: number }): ClampResult {
  const { Um, f, C, R } = opts;
  const E = opts.E ?? 0;
  const Uon = opts.Uon ?? 0;
  const Ron = opts.Ron ?? 10;
  const periods = opts.periods ?? 6;
  const steps = opts.steps ?? 400;
  const dt = 1 / f / steps;
  const k = dt / C;
  const Uk = E + Uon;
  let uC = 0;
  const t: number[] = [];
  const ui: number[] = [];
  const uo: number[] = [];
  const uCs: number[] = [];
  for (let n = 0; n <= periods * steps; n++) {
    const tt = n * dt;
    const u = Um * Math.sin(2 * Math.PI * f * tt);
    if (n > 0) {
      // 截止：C dUc/dt = (u − Uc)/R
      let next = (uC + (k * u) / R) / (1 + k / R);
      if (u - next > Uk) {
        const G = 1 / R + 1 / Ron;
        next = (uC + k * G * u - (k * Uk) / Ron) / (1 + k * G);
      }
      uC = next;
    }
    t.push(tt);
    ui.push(u);
    uo.push(u - uC);
    uCs.push(uC);
  }
  return { t, ui, uo, uC: uCs };
}

export interface FilterResult {
  t: number[];
  /** 整流后（未滤波）电压 */
  ur: number[];
  uo: number[];
  /** 二极管（或整流桥）电流 */
  iD: number[];
  UOavg: number;
  ripplePP: number;
  /** 稳态周期内二极管导通的时间比例 */
  conduction: number;
  /** 稳态二极管电流峰值 */
  iDpeak: number;
}

/**
 * 电容滤波时域仿真（第 12 章）：整流桥（或半波）→ 并联 C 与 R_L。
 * 源内阻 Rs（变压器绕组 + 二极管导通电阻）不可为 0，否则充电电流为冲激。
 * 后向欧拉：导通时 C du/dt = (u_r − u)/Rs − u/R_L；截止时 C du/dt = −u/R_L。
 */
export function simulateCapFilter(opts: { U2rms: number; f?: number; C: number; RL: number; kind?: RectKind; Uon?: number; Rs?: number; periods?: number; steps?: number }): FilterResult {
  const f = opts.f ?? 50;
  const kind = opts.kind ?? "bridge";
  const Uon = opts.Uon ?? 0;
  const Rs = opts.Rs ?? 2;
  const periods = opts.periods ?? 12;
  const steps = opts.steps ?? 600;
  const dt = 1 / f / steps;
  const { C, RL } = opts;
  const U2m = Math.SQRT2 * opts.U2rms;
  let u = 0;
  const t: number[] = [];
  const ur: number[] = [];
  const uo: number[] = [];
  const iD: number[] = [];
  for (let n = 0; n <= periods * steps; n++) {
    const tt = n * dt;
    const r = rectify(U2m * Math.sin(2 * Math.PI * f * tt), kind, Uon);
    let i = 0;
    if (n > 0) {
      const gL = Number.isFinite(RL) ? 1 / RL : 0;
      // 先试导通
      const on = (u * C / dt + r / Rs) / (C / dt + 1 / Rs + gL);
      if (r > on) {
        u = on;
        i = (r - u) / Rs;
      } else {
        u = (u * C) / dt / (C / dt + gL);
      }
    }
    t.push(tt);
    ur.push(r);
    uo.push(u);
    iD.push(i);
  }
  // 稳态：取最后两个周期
  const start = (periods - 2) * steps;
  let s = 0;
  let mx = -Infinity;
  let mn = Infinity;
  let cond = 0;
  let ip = 0;
  for (let n = start; n < uo.length; n++) {
    s += uo[n];
    mx = Math.max(mx, uo[n]);
    mn = Math.min(mn, uo[n]);
    if (iD[n] > 0) cond++;
    ip = Math.max(ip, iD[n]);
  }
  const cnt = uo.length - start;
  return { t, ur, uo, iD, UOavg: s / cnt, ripplePP: mx - mn, conduction: cond / cnt, iDpeak: ip };
}

/** 正峰钳位的理想稳态（RC ≫ T）：u_O = u_I − u_C，u_C = U_m − (E + U_on) */
export function clampSteadyState(Um: number, E = 0, Uon = 0): { uC: number; max: number; min: number } {
  const uC = Um - (E + Uon);
  return { uC, max: Um - uC, min: -Um - uC };
}

/** 整流输出电压有效值（理想二极管）：半波 U₂ₘ/2，全波/桥式 U₂ₘ/√2 = U₂ */
export function rectifiedRms(U2rms: number, kind: RectKind): number {
  const Um = Math.SQRT2 * U2rms;
  return kind === "half" ? Um / 2 : Um / Math.SQRT2;
}
