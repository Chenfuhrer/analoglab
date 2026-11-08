/**
 * 信号产生与处理（第 11 章）。
 *  - RC 串并联（文氏）网络 F = 1/[3 + j(f/f₀ − f₀/f)]
 *  - 文氏桥振荡器时域仿真：同相放大器增益 K、输出软限幅（模拟稳幅），RK4 积分，演示起振、稳幅、停振
 *  - LC 并联谐振回路、电容/电感三点式振荡频率、石英晶体电抗特性
 *  - 有源滤波器：一阶低通/高通，二阶压控电压源（Sallen–Key，等值 R、C）低通/高通
 */
import { cdiv, cmul, type Cplx } from "../signal/rc";

export const wienF0 = (R: number, C: number) => 1 / (2 * Math.PI * R * C);

export function wienNetwork(f: number, f0: number): Cplx {
  return cdiv({ re: 1, im: 0 }, { re: 3, im: f / f0 - f0 / f });
}

export interface WienSim {
  t: number[];
  uo: number[];
  /** 稳态（最后 20%）峰值 */
  amp: number;
  /** 稳态测得的频率（过零计数），无振荡时为 0 */
  freq: number;
}

/**
 * 文氏桥振荡器：放大器 u_O = U_lim·tanh(K·u_+/U_lim)（小信号增益 K，大信号逐渐压缩，相当于稳幅环节）。
 * 网络状态：串联支路电容电压 v_s、并联支路电容电压 v（= u_+）。
 *   i = (u_O − v_s − v)/R；C dv_s/dt = i；C dv/dt = i − v/R。
 */
export function simulateWien(o: { R: number; C: number; K: number; Ulim?: number; periods?: number; v0?: number; stepsPerPeriod?: number }): WienSim {
  const Ulim = o.Ulim ?? 10;
  const f0 = wienF0(o.R, o.C);
  const T = 1 / f0;
  const periods = o.periods ?? 60;
  const spp = o.stepsPerPeriod ?? 80;
  const h = T / spp;
  const N = periods * spp;
  const amp = (x: number) => Ulim * Math.tanh((o.K * x) / Ulim);
  const deriv = (vs: number, v: number) => {
    const i = (amp(v) - vs - v) / o.R;
    return [i / o.C, (i - v / o.R) / o.C];
  };
  let vs = 0;
  let v = o.v0 ?? 1e-3;
  const t: number[] = [];
  const uo: number[] = [];
  for (let k = 0; k <= N; k++) {
    t.push(k * h);
    uo.push(amp(v));
    const k1 = deriv(vs, v);
    const k2 = deriv(vs + (h / 2) * k1[0], v + (h / 2) * k1[1]);
    const k3 = deriv(vs + (h / 2) * k2[0], v + (h / 2) * k2[1]);
    const k4 = deriv(vs + h * k3[0], v + h * k3[1]);
    vs += (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
    v += (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
  }
  const start = Math.floor(uo.length * 0.8);
  const tail = uo.slice(start);
  const peak = Math.max(...tail.map(Math.abs));
  let cross = 0;
  for (let k = start + 1; k < uo.length; k++) if (uo[k - 1] < 0 && uo[k] >= 0) cross++;
  const dur = t[t.length - 1] - t[start];
  return { t, uo, amp: peak, freq: peak > 1e-6 && cross > 1 ? cross / dur : 0 };
}

/* ───────── LC 与石英晶体 ───────── */

export const lcF0 = (L: number, C: number) => 1 / (2 * Math.PI * Math.sqrt(L * C));

/** 并联 LC 回路（电感串联损耗电阻 r）：Z = (r + jωL)·(1/jωC) / (r + jωL + 1/jωC) */
export function lcTankImpedance(f: number, L: number, C: number, r: number): Cplx {
  const w = 2 * Math.PI * f;
  const zl: Cplx = { re: r, im: w * L };
  const zc: Cplx = { re: 0, im: -1 / (w * C) };
  return cdiv(cmul(zl, zc), { re: zl.re + zc.re, im: zl.im + zc.im });
}

/** 品质因数 Q = ω₀L/r，谐振阻抗 Z₀ ≈ L/(rC) = Q²r */
export function lcTankQ(L: number, C: number, r: number): { f0: number; Q: number; Z0: number; bw: number } {
  const f0 = lcF0(L, C);
  const Q = (2 * Math.PI * f0 * L) / r;
  return { f0, Q, Z0: L / (r * C), bw: f0 / Q };
}

/** 电容三点式（考毕兹）：f₀ = 1/(2π√(L·C₁C₂/(C₁+C₂)))；电感三点式（哈特莱）：f₀ = 1/(2π√((L₁+L₂+2M)C)) */
export function colpittsF0(L: number, C1: number, C2: number): number {
  return lcF0(L, (C1 * C2) / (C1 + C2));
}
export function hartleyF0(L1: number, L2: number, M: number, C: number): number {
  return lcF0(L1 + L2 + 2 * M, C);
}

/**
 * 三点式振荡电路相位条件（“射同基反”）：与发射极相连的两个电抗同性质，另一个（b–c 间）异性质。
 * 返回能否满足相位条件，以及若能则是电容三点式还是电感三点式。
 */
export function threePointRule(be: "L" | "C", ce: "L" | "C", bc: "L" | "C"): { ok: boolean; kind?: "电容三点式" | "电感三点式" } {
  if (be === ce && bc !== be) return { ok: true, kind: be === "C" ? "电容三点式" : "电感三点式" };
  return { ok: false };
}

/** 石英晶体等效：L_q、C_q、r_q 串联后与 C₀ 并联；返回电抗（忽略 r_q） */
export function crystalReactance(f: number, Lq: number, Cq: number, C0: number): number {
  const w = 2 * Math.PI * f;
  const xs = w * Lq - 1 / (w * Cq);
  const x0 = -1 / (w * C0);
  return (xs * x0) / (xs + x0);
}

export function crystalFreqs(Lq: number, Cq: number, C0: number): { fs: number; fp: number } {
  const fs = lcF0(Lq, Cq);
  return { fs, fp: fs * Math.sqrt(1 + Cq / C0) };
}

/* ───────── 有源滤波器 ───────── */

export type FilterKind = "lp1" | "hp1" | "lp2" | "hp2";

export interface FilterSpec {
  kind: FilterKind;
  /** 通带增益 A_up = 1 + R_f/R_1 */
  Aup: number;
  f0: number;
}

export function filterQ(Aup: number): number {
  return 1 / (3 - Aup);
}

export function filterResponse(s: FilterSpec, f: number): Cplx {
  const x = f / s.f0;
  switch (s.kind) {
    case "lp1":
      return cdiv({ re: s.Aup, im: 0 }, { re: 1, im: x });
    case "hp1":
      return cdiv({ re: 0, im: s.Aup * x }, { re: 1, im: x });
    case "lp2": {
      const Q = filterQ(s.Aup);
      return cdiv({ re: s.Aup, im: 0 }, { re: 1 - x * x, im: x / Q });
    }
    case "hp2": {
      const Q = filterQ(s.Aup);
      return cdiv({ re: -s.Aup * x * x, im: 0 }, { re: 1 - x * x, im: x / Q });
    }
  }
}

/** 数值求 −3 dB 截止频率（相对通带增益） */
export function filterCutoff(s: FilterSpec): number {
  const pass = s.Aup;
  const target = pass / Math.SQRT2;
  const lp = s.kind.startsWith("lp");
  // 低通：从 f0 往上找第一次低于 target；高通：往下找
  const mag = (f: number) => Math.hypot(filterResponse(s, f).re, filterResponse(s, f).im);
  const lo = s.f0 * 1e-3;
  const hi = s.f0 * 1e3;
  // 先用对数扫描确定最后一次穿越的区间
  const N = 2000;
  let prev = lp ? lo : hi;
  for (let k = 1; k <= N; k++) {
    const f = lp ? lo * Math.pow(hi / lo, k / N) : hi / Math.pow(hi / lo, k / N);
    if ((mag(prev) >= target && mag(f) < target)) {
      let a = prev;
      let b = f;
      for (let i = 0; i < 100; i++) {
        const m = Math.sqrt(a * b);
        if (mag(m) >= target) a = m;
        else b = m;
      }
      return Math.sqrt(a * b);
    }
    prev = f;
  }
  return NaN;
}
