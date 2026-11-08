/**
 * 半导体载流子统计（第 1 章）。
 * 模型：非简并、完全电离；本征载流子浓度 n_i = B·T^{3/2}·exp(−E_g / 2kT)，
 * B 由 300 K 时的参考值校准（Si 1.4×10¹⁰ cm⁻³，Ge 2.4×10¹³ cm⁻³，与常用教材取值一致）；
 * 忽略禁带宽度随温度的变化（在 200–500 K 范围内引起的误差在一个数量级以内，页面上注明）。
 * 浓度单位统一用 cm⁻³。
 */
export const K_B_EV = 8.617e-5; // eV/K
export const Q = 1.602e-19;
export const EPS0 = 8.854e-14; // F/cm

export type Material = "Si" | "Ge";

export const MATERIAL: Record<Material, { Eg: number; ni300: number; atoms: number; epsR: number; name: string }> = {
  Si: { Eg: 1.12, ni300: 1.4e10, atoms: 5e22, epsR: 11.7, name: "硅" },
  Ge: { Eg: 0.66, ni300: 2.4e13, atoms: 4.4e22, epsR: 16, name: "锗" },
};

/** 温度电压当量 U_T = kT/q（V） */
export function thermalVoltage(T: number): number {
  return K_B_EV * T;
}

/** 本征载流子浓度 n_i(T)，cm⁻³ */
export function intrinsicDensity(T: number, m: Material = "Si"): number {
  const { Eg, ni300 } = MATERIAL[m];
  const f = (t: number) => Math.pow(t, 1.5) * Math.exp(-Eg / (2 * K_B_EV * t));
  return (ni300 * f(T)) / f(300);
}

export interface Carriers {
  n: number;
  p: number;
  ni: number;
  type: "N" | "P" | "intrinsic";
  majority: number;
  minority: number;
}

/**
 * 杂质半导体中的电子、空穴浓度（电中性 + 质量作用定律 np = n_i² 的精确解）。
 * ND：施主（五价）浓度；NA：受主（三价）浓度。
 */
export function carriers(ND: number, NA: number, T = 300, m: Material = "Si"): Carriers {
  const ni = intrinsicDensity(T, m);
  const d = (ND - NA) / 2;
  let n: number;
  let p: number;
  if (d >= 0) {
    n = d + Math.sqrt(d * d + ni * ni);
    p = (ni * ni) / n;
  } else {
    p = -d + Math.sqrt(d * d + ni * ni);
    n = (ni * ni) / p;
  }
  const type = n > 10 * p ? "N" : p > 10 * n ? "P" : "intrinsic";
  return { n, p, ni, type, majority: Math.max(n, p), minority: Math.min(n, p) };
}

/** 突变结的接触电位差 U_ho = U_T ln(N_A N_D / n_i²)（V） */
export function builtInPotential(NA: number, ND: number, T = 300, m: Material = "Si"): number {
  const ni = intrinsicDensity(T, m);
  return thermalVoltage(T) * Math.log((NA * ND) / (ni * ni));
}

/**
 * 突变结空间电荷区宽度（cm）：W = sqrt( 2ε(U_ho − u)/q · (N_A+N_D)/(N_A N_D) )。
 * u 为外加正向电压（反偏取负）；u 接近 U_ho 时模型失效（大注入），这里把 W 下限截到 U_ho−u = 0.02 V。
 */
export function depletionWidth(u: number, NA: number, ND: number, T = 300, m: Material = "Si"): { W: number; xp: number; xn: number; Vbi: number } {
  const Vbi = builtInPotential(NA, ND, T, m);
  const eps = MATERIAL[m].epsR * EPS0;
  const v = Math.max(Vbi - u, 0.02);
  const W = Math.sqrt(((2 * eps * v) / Q) * ((NA + ND) / (NA * ND)));
  return { W, xp: (W * ND) / (NA + ND), xn: (W * NA) / (NA + ND), Vbi };
}

/** n_i 达到 target 时的温度（K），二分法；用于“多高温度时杂质半导体趋于本征” */
export function temperatureForNi(target: number, m: Material = "Si"): number {
  let lo = 100;
  let hi = 2000;
  for (let k = 0; k < 100; k++) {
    const mid = (lo + hi) / 2;
    if (intrinsicDensity(mid, m) < target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
