/** 周期信号分析工具（输入应包含整数个周期）。 */

export function mean(x: ArrayLike<number>): number {
  let s = 0;
  for (let i = 0; i < x.length; i++) s += x[i];
  return s / x.length;
}

/** 交流分量有效值（去掉直流平均值后） */
export function acRms(x: ArrayLike<number>): number {
  const m = mean(x);
  let s = 0;
  for (let i = 0; i < x.length; i++) s += (x[i] - m) ** 2;
  return Math.sqrt(s / x.length);
}

export function peaks(x: ArrayLike<number>): { max: number; min: number; pp: number } {
  let max = -Infinity;
  let min = Infinity;
  for (let i = 0; i < x.length; i++) {
    if (x[i] > max) max = x[i];
    if (x[i] < min) min = x[i];
  }
  return { max, min, pp: max - min };
}

/** 第 h 次谐波的幅值与相位（DFT 单点），samplesPerPeriod 为每周期点数 */
export function harmonic(x: ArrayLike<number>, samplesPerPeriod: number, h: number): { amp: number; phase: number } {
  const N = x.length;
  let re = 0;
  let im = 0;
  for (let n = 0; n < N; n++) {
    const w = (2 * Math.PI * h * n) / samplesPerPeriod;
    re += x[n] * Math.cos(w);
    im -= x[n] * Math.sin(w);
  }
  re = (2 * re) / N;
  im = (2 * im) / N;
  return { amp: Math.hypot(re, im), phase: Math.atan2(im, re) };
}

/** 总谐波失真 THD = sqrt(Σ_{h≥2} A_h²) / A_1 */
export function thd(x: ArrayLike<number>, samplesPerPeriod: number, maxHarmonic = 15): number {
  const a1 = harmonic(x, samplesPerPeriod, 1).amp;
  if (a1 === 0) return 0;
  let s = 0;
  for (let h = 2; h <= maxHarmonic; h++) s += harmonic(x, samplesPerPeriod, h).amp ** 2;
  return Math.sqrt(s) / a1;
}

/** y 相对 x 的基波相位差（度，范围 (−180, 180]） */
export function phaseDifferenceDeg(x: ArrayLike<number>, y: ArrayLike<number>, samplesPerPeriod: number): number {
  const px = harmonic(x, samplesPerPeriod, 1).phase;
  const py = harmonic(y, samplesPerPeriod, 1).phase;
  let d = ((py - px) * 180) / Math.PI;
  while (d <= -180) d += 360;
  while (d > 180) d -= 360;
  return d;
}
