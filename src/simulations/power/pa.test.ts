import { describe, expect, it } from "vitest";
import { conductionClass, DEFAULT_PP, oclMax, oclMaxTubeLoss, oclPower, otlMax, pushPullOutput, pushPullWave } from "./pa";

describe("导通角与效率", () => {
  it("甲类 360°、50%；乙类 180°、78.5%", () => {
    const a = conductionClass(1);
    expect(a.theta).toBeGreaterThan(359);
    expect(a.eta).toBeCloseTo(0.5, 2);
    const b = conductionClass(0);
    expect(b.theta).toBeCloseTo(180, 0);
    expect(b.eta).toBeCloseTo(Math.PI / 4, 2);
    const ab = conductionClass(0.2);
    expect(ab.theta).toBeGreaterThan(180);
    expect(ab.theta).toBeLessThan(360);
    const c = conductionClass(-0.3);
    expect(c.theta).toBeLessThan(180);
    expect(c.eta).toBeGreaterThan(b.eta);
  });
});

describe("OCL", () => {
  it("最大输出功率与效率", () => {
    const m = oclMax(12, 8, 0);
    expect(m.Po).toBeCloseTo(9, 9);
    expect(m.eta).toBeCloseTo(Math.PI / 4, 9);
    const m2 = oclMax(12, 8, 1);
    expect(m2.Po).toBeCloseTo(121 / 16, 9);
  });
  it("管耗最大时 U_om = 2V_CC/π，P_T1max ≈ 0.2P_om", () => {
    const t = oclMaxTubeLoss(12, 8);
    expect(t.PT1max).toBeCloseTo(144 / (Math.PI ** 2 * 8), 9);
    expect(t.PT1max / oclMax(12, 8).Po).toBeCloseTo(0.2026, 3);
    // 数值确认是最大值
    for (const u of [5, 7, 9, 11]) expect(oclPower(12, 8, u).PT1).toBeLessThanOrEqual(t.PT1max + 1e-12);
  });
  it("OTL 相当于 V_CC/2 的 OCL", () => {
    expect(otlMax(24, 8).Po).toBeCloseTo(oclMax(12, 8).Po, 9);
  });
});

describe("交越失真", () => {
  it("乙类：小输入时几乎没有输出（死区）；甲乙类偏置后跟随", () => {
    const b = pushPullOutput(0.3, DEFAULT_PP);
    expect(Math.abs(b.uo)).toBeLessThan(0.01);
    const ab = pushPullOutput(0.3, { ...DEFAULT_PP, Vbias: 1.2 });
    expect(ab.uo).toBeGreaterThan(0.2);
  });
  it("偏置减小 THD；静态电流随偏置指数增大", () => {
    const b = pushPullWave(2, DEFAULT_PP);
    const ab = pushPullWave(2, { ...DEFAULT_PP, Vbias: 1.2 });
    expect(b.thd).toBeGreaterThan(0.05);
    expect(ab.thd).toBeLessThan(b.thd / 3);
    expect(ab.IQ).toBeGreaterThan(b.IQ * 100);
  });
});
