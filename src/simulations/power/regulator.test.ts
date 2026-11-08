import { describe, expect, it } from "vitest";
import { simulateCapFilter } from "../diode/waveforms";
import { adjustable317, capFilterEstimate, DEFAULT_SR, outputRange, samplingF, seriesRegulator } from "./regulator";

describe("串联型稳压电路", () => {
  it("输出范围与采样系数", () => {
    const r = outputRange(DEFAULT_SR);
    expect(r.min).toBeCloseTo(9, 9);
    expect(r.max).toBeCloseTo(18, 9);
    expect(6 / samplingF({ ...DEFAULT_SR, k: 0 })).toBeCloseTo(9, 9);
    expect(6 / samplingF({ ...DEFAULT_SR, k: 1 })).toBeCloseTo(18, 9);
  });
  it("A 很大时 U_O ≈ U_Z/F，且基本不随输入、负载变化", () => {
    const a = seriesRegulator(20, 100);
    expect(a.UO).toBeCloseTo(a.UOideal, 1);
    const b = seriesRegulator(25, 100);
    expect(Math.abs(b.UO - a.UO)).toBeLessThan(1e-9);
    expect(a.regulating).toBe(true);
    expect(a.Ro).toBeLessThan(0.01);
  });
  it("输入过低时失去稳压", () => {
    const a = seriesRegulator(12, 100);
    expect(a.regulating).toBe(false);
    expect(a.UO).toBeLessThan(a.UOideal);
  });
  it("调整管功耗", () => {
    const a = seriesRegulator(20, 100);
    expect(a.PT).toBeCloseTo((20 - a.UO) * (a.UO / 100), 9);
  });
  it("LM317", () => {
    expect(adjustable317(240, 720, 1.25, 0)).toBeCloseTo(5, 9);
  });
});

describe("电容滤波估算与时域仿真对照", () => {
  it("R_LC 足够大时，估算与仿真同量级", () => {
    const sim = simulateCapFilter({ U2rms: 15, C: 1000e-6, RL: 100, Uon: 0, Rs: 1 });
    const est = capFilterEstimate(15, 100, 1000e-6);
    expect(Math.abs(sim.UOavg - est.UO) / est.UO).toBeLessThan(0.2);
    expect(sim.ripplePP / est.ripple).toBeGreaterThan(0.6);
    expect(sim.ripplePP / est.ripple).toBeLessThan(1.4);
  });
});
