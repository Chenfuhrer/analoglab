/**
 * 一阶 RC 网络（第 5、9、11 章共用）：频率特性与方波响应。
 * 高通：H = j(f/f_L)/(1 + j f/f_L)；低通：H = 1/(1 + j f/f_H)。
 */
export interface Cplx {
  re: number;
  im: number;
}

export const cmul = (a: Cplx, b: Cplx): Cplx => ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re });
export const cdiv = (a: Cplx, b: Cplx): Cplx => {
  const d = b.re * b.re + b.im * b.im;
  return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d };
};
export const cabs = (a: Cplx) => Math.hypot(a.re, a.im);
export const cargDeg = (a: Cplx) => (Math.atan2(a.im, a.re) * 180) / Math.PI;

export function highPass(f: number, fL: number): Cplx {
  const x = f / fL;
  return cdiv({ re: 0, im: x }, { re: 1, im: x });
}

export function lowPass(f: number, fH: number): Cplx {
  return cdiv({ re: 1, im: 0 }, { re: 1, im: f / fH });
}

/** 截止频率 f = 1/(2πRC) */
export const cornerFrequency = (R: number, C: number) => 1 / (2 * Math.PI * R * C);

/**
 * 一阶网络的方波响应（稳态，解析解）。方波 ±1、频率 f；返回一个周期内 n 个采样点。
 * 高通：每个半周内按 e^{−t/τ} 衰减（“倾斜”）；低通：按 1 − e^{−t/τ} 上升（“圆角”）。
 */
export function squareResponse(kind: "hp" | "lp", fc: number, f: number, n = 400): { t: number[]; vin: number[]; vout: number[] } {
  const tau = 1 / (2 * Math.PI * fc);
  const half = 1 / (2 * f);
  const a = Math.exp(-half / tau);
  const t: number[] = [];
  const vin: number[] = [];
  const vout: number[] = [];
  if (kind === "lp") {
    // 稳态：半周开始时输出 = −V0，结束时 = +V0，V0 = (1 − a)/(1 + a)
    const V0 = (1 - a) / (1 + a);
    for (let k = 0; k < n; k++) {
      const tt = (k / n) / f;
      const inFirst = tt < half;
      const ts = inFirst ? tt : tt - half;
      const s = inFirst ? 1 : -1;
      t.push(tt);
      vin.push(s);
      vout.push(s * (1 - (1 + V0) * Math.exp(-ts / tau)));
    }
  } else {
    // 高通：输入跳变 2 时输出跳变 2，然后指数衰减。稳态半周起始值 P = 2/(1 + a)
    const P = 2 / (1 + a);
    for (let k = 0; k < n; k++) {
      const tt = (k / n) / f;
      const inFirst = tt < half;
      const ts = inFirst ? tt : tt - half;
      const s = inFirst ? 1 : -1;
      t.push(tt);
      vin.push(s);
      vout.push(s * P * Math.exp(-ts / tau));
    }
  }
  return { t, vin, vout };
}

/** 高通网络在阶跃后经过时间 t 的相对下降量（顶部倾斜）：1 − e^{−t/τ} */
export function highPassDroop(tau: number, t: number): number {
  return 1 - Math.exp(-t / tau);
}

/** 给定电阻与截止频率，所需电容 C = 1/(2πRf) */
export function capForCorner(R: number, f: number): number {
  return 1 / (2 * Math.PI * R * f);
}
