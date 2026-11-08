import { describe, expect, it } from "vitest";
import { cabs, cargDeg } from "../signal/rc";
import { colpittsF0, crystalFreqs, crystalReactance, filterCutoff, filterQ, filterResponse, hartleyF0, lcTankImpedance, lcTankQ, simulateWien, threePointRule, wienF0, wienNetwork } from "./osc";

describe("文氏电桥", () => {
  it("f₀ 处 F = 1/3、相位 0", () => {
    const F = wienNetwork(1e3, 1e3);
    expect(cabs(F)).toBeCloseTo(1 / 3, 12);
    expect(cargDeg(F)).toBeCloseTo(0, 9);
    expect(cargDeg(wienNetwork(500, 1e3))).toBeGreaterThan(0);
  });
  it("K > 3 起振并稳幅，K < 3 衰减，振荡频率 ≈ f₀", () => {
    const R = 10e3;
    const C = 15.9e-9;
    const up = simulateWien({ R, C, K: 3.3, periods: 80 });
    expect(up.amp).toBeGreaterThan(1);
    expect(up.freq / wienF0(R, C)).toBeCloseTo(1, 1);
    const down = simulateWien({ R, C, K: 2.7, periods: 40 });
    expect(down.amp).toBeLessThan(1e-4);
  });
});

describe("LC 与晶体", () => {
  it("谐振频率与 Q", () => {
    const q = lcTankQ(100e-6, 1e-9, 10);
    expect(q.f0).toBeCloseTo(503292, -1);
    expect(q.Q).toBeCloseTo(31.6, 1);
    const z0 = cabs(lcTankImpedance(q.f0, 100e-6, 1e-9, 10));
    expect(z0 / q.Z0).toBeCloseTo(1, 2);
  });
  it("三点式", () => {
    expect(colpittsF0(10e-6, 1e-9, 1e-9)).toBeCloseTo(1 / (2 * Math.PI * Math.sqrt(10e-6 * 0.5e-9)), 3);
    expect(hartleyF0(5e-6, 5e-6, 0, 1e-9)).toBeCloseTo(1 / (2 * Math.PI * Math.sqrt(10e-6 * 1e-9)), 3);
    expect(threePointRule("C", "C", "L")).toEqual({ ok: true, kind: "电容三点式" });
    expect(threePointRule("L", "C", "C").ok).toBe(false);
  });
  it("晶体：f_s < f < f_p 之间呈感性", () => {
    const { fs, fp } = crystalFreqs(0.1, 0.02e-12, 5e-12);
    expect(fp).toBeGreaterThan(fs);
    expect((fp - fs) / fs).toBeLessThan(0.01);
    expect(crystalReactance((fs + fp) / 2, 0.1, 0.02e-12, 5e-12)).toBeGreaterThan(0);
    expect(crystalReactance(fs * 0.99, 0.1, 0.02e-12, 5e-12)).toBeLessThan(0);
  });
});

describe("有源滤波器", () => {
  it("一阶：f₀ 处 −3 dB", () => {
    const s = { kind: "lp1" as const, Aup: 2, f0: 1e3 };
    expect(cabs(filterResponse(s, 1e3)) / 2).toBeCloseTo(Math.SQRT1_2, 9);
    expect(filterCutoff(s)).toBeCloseTo(1e3, 0);
  });
  it("二阶：Q = 1/(3 − A_up)，f₀ 处增益 = Q·A_up；A_up=1.586 时为巴特沃斯（截止 = f₀）", () => {
    const s = { kind: "lp2" as const, Aup: 2, f0: 1e3 };
    expect(filterQ(2)).toBe(1);
    expect(cabs(filterResponse(s, 1e3))).toBeCloseTo(2, 9);
    const bw = { kind: "lp2" as const, Aup: 3 - Math.SQRT2, f0: 1e3 };
    expect(filterCutoff(bw)).toBeCloseTo(1e3, 0);
    // 二阶低通高频斜率 −40 dB/dec
    const a = cabs(filterResponse(bw, 1e5));
    const b = cabs(filterResponse(bw, 1e6));
    expect(20 * Math.log10(a / b)).toBeCloseTo(40, 0);
    const hp = { kind: "hp2" as const, Aup: 3 - Math.SQRT2, f0: 1e3 };
    expect(filterCutoff(hp)).toBeCloseTo(1e3, 0);
  });
});
