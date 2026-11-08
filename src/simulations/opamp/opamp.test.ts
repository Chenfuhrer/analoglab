import { describe, expect, it } from "vitest";
import { designLinear, evalLinear, inverting, invertingSum, nonInverting, openLoop, schmittThresholds, simulateComparator, simulateDifferentiator, simulateIntegrator, subtractor, TYPICAL_OA } from "./opamp";

describe("比例运算", () => {
  it("理想与有限 A_od", () => {
    const inv = inverting(10e3, 100e3, TYPICAL_OA);
    expect(inv.ideal).toBe(-10);
    expect(inv.actual).toBeCloseTo(-10 / (1 + 11 / 1e5), 9);
    expect(inv.error).toBeCloseTo(-11e-5 / (1 + 11e-5), 10);
    expect(inv.uN(0.1)).toBeCloseTo(1e-5, 8);
    const ni = nonInverting(10e3, 90e3, TYPICAL_OA);
    expect(ni.ideal).toBe(10);
    expect(ni.Ri).toBeGreaterThan(1e9);
    const fol = nonInverting(Infinity, 0, TYPICAL_OA);
    expect(fol.ideal).toBe(1);
    expect(fol.actual).toBeCloseTo(1 / (1 + 1e-5), 12);
  });
  it("开环：输入只要几百微伏就饱和", () => {
    expect(openLoop(200e-6, 0, TYPICAL_OA)).toBe(13);
    expect(openLoop(50e-6, 0, TYPICAL_OA)).toBeCloseTo(5, 9);
  });
});

describe("加减运算与设计", () => {
  it("反相求和", () => {
    expect(invertingSum([10e3, 20e3], 20e3, [1, 1])).toBeCloseTo(-3, 12);
  });
  it("减法：电阻匹配时 A_c = 0，失配时 K_CMR 有限", () => {
    const m = subtractor(10e3, 50e3, 10e3, 50e3, 1, 1.1);
    expect(m.uO).toBeCloseTo(0.5, 12);
    expect(m.Ac).toBeCloseTo(0, 12);
    const mm = subtractor(10e3, 50e3, 10e3, 50e3 * 1.01, 0, 0);
    expect(mm.KCMR).toBeGreaterThan(100);
    expect(mm.KCMR).toBeLessThan(10000);
  });
  it("设计任意线性组合并验证", () => {
    for (const [a, b] of [
      [[2], [3]],
      [[1, 1], [1]],
      [[5], [1]],
      [[0.5, 1.5], [2, 1]],
    ] as Array<[number[], number[]]>) {
      const d = designLinear(a, b, 100e3);
      const up = a.map((_, k) => 0.3 + 0.1 * k);
      const un = b.map((_, k) => -0.2 + 0.15 * k);
      const want = a.reduce((s, x, k) => s + x * up[k], 0) - b.reduce((s, x, k) => s + x * un[k], 0);
      expect(evalLinear(d, up, un)).toBeCloseTo(want, 9);
    }
  });
});

describe("积分与微分", () => {
  it("恒定输入：输出线性下降 −U_I t/(RC)，并在 −U_OM 饱和", () => {
    const w = simulateIntegrator({ shape: "step", amp: 1, f: 100, R: 10e3, C: 1e-6, periods: 1, uo0: 0, n: 1000 });
    // t = 5 ms：−1·5e-3/1e-2 = −0.5 V
    expect(w.uo[500]).toBeCloseTo(-0.5, 3);
    const s = simulateIntegrator({ shape: "step", amp: 1, f: 1, R: 10e3, C: 1e-6, periods: 1, uo0: 0 });
    expect(Math.min(...s.uo)).toBe(-13);
  });
  it("方波 → 对称三角波，峰值 A·T/(4RC)", () => {
    const w = simulateIntegrator({ shape: "square", amp: 1, f: 1000, R: 10e3, C: 0.1e-6, periods: 2, n: 2000 });
    expect(Math.max(...w.uo)).toBeCloseTo(0.25, 2);
    expect(Math.min(...w.uo)).toBeCloseTo(-0.25, 2);
  });
  it("正弦 → 余弦（相位超前 90°），幅值 A/(ωRC)", () => {
    const w = simulateIntegrator({ shape: "sine", amp: 1, f: 100, R: 10e3, C: 1e-6, periods: 2, n: 4000 });
    expect(Math.max(...w.uo)).toBeCloseTo(1 / (2 * Math.PI * 100 * 1e-2), 2);
  });
  it("微分：三角波 → 方波，幅值 RC·斜率", () => {
    const w = simulateDifferentiator({ shape: "triangle", amp: 1, f: 100, R: 10e3, C: 0.1e-6, periods: 1, n: 2000 });
    // 斜率 4A f = 400 V/s，RC = 1e-3 → 0.4 V
    expect(Math.abs(w.uo[300])).toBeCloseTo(0.4, 2);
  });
  it("微分放大高频噪声", () => {
    const clean = simulateDifferentiator({ shape: "sine", amp: 1, f: 100, R: 10e3, C: 0.1e-6 });
    const noisy = simulateDifferentiator({ shape: "sine", amp: 1, f: 100, R: 10e3, C: 0.1e-6, noise: { amp: 0.01, f: 20e3 } });
    const pp = (x: number[]) => Math.max(...x) - Math.min(...x);
    expect(pp(noisy.uo)).toBeGreaterThan(pp(clean.uo) * 1.5);
  });
});

describe("比较器", () => {
  it("滞回比较器阈值", () => {
    const t = schmittThresholds(10e3, 20e3, 6);
    expect(t.UTp).toBeCloseTo(2, 12);
    expect(t.UTm).toBeCloseTo(-2, 12);
    const t2 = schmittThresholds(10e3, 20e3, 6, 3);
    expect(t2.UTp).toBeCloseTo(4, 12);
  });
  it("单限比较器在阈值附近因噪声来回翻转，滞回比较器不会", () => {
    const ui = Array.from({ length: 400 }, (_, k) => (k - 200) / 200 + 0.05 * Math.sin(k * 1.7));
    const single = simulateComparator(ui, { hyst: false, UT: 0, UZ: 6 });
    const hyst = simulateComparator(ui, { hyst: true, UTp: 0.2, UTm: -0.2, UZ: 6 });
    const flips = (x: number[]) => x.slice(1).filter((v, k) => v !== x[k]).length;
    expect(flips(single)).toBeGreaterThan(2);
    expect(flips(hyst)).toBe(1);
  });
});
