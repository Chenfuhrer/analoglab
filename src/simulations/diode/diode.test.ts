import { describe, expect, it } from "vitest";
import { shockley, shockleyVoltage, diodeCurrent, diodeGate, diodeVoltage, dynamicResistance, SI_DIODE, solveSeries } from "./diode";
import { limitResistorRange, solveZenerRegulator, zenerRegulationIndex, DEFAULT_ZENER } from "./zener";
import { clampSteadyState, clip, rectifiedAverage, rectifiedAverageNumeric, rectifierStress, rectify, simulateCapFilter, simulateClamp } from "./waveforms";

describe("二极管指数模型", () => {
  it("正向电压在 0.6–0.7 V 量级，十倍电流约增加 60 mV", () => {
    const u1 = diodeVoltage(1e-3, SI_DIODE);
    const u10 = diodeVoltage(10e-3, SI_DIODE);
    expect(u1).toBeGreaterThan(0.55);
    expect(u1).toBeLessThan(0.7);
    expect(u10 - u1).toBeCloseTo(0.0595, 3);
  });
  it("反向电流 ≈ −I_S；击穿后反向电流迅速增大", () => {
    expect(diodeCurrent(-5, SI_DIODE)).toBeCloseTo(-1e-13, 20);
    expect(diodeCurrent(-51, SI_DIODE)).toBeLessThan(-0.04);
  });
  it("温度升高：同一电流下正向压降减小约 2 mV/°C", () => {
    const d = (diodeVoltage(1e-3, { ...SI_DIODE, T: 310 }) - diodeVoltage(1e-3, SI_DIODE)) / 10;
    expect(d).toBeLessThan(-1e-3);
    expect(d).toBeGreaterThan(-3e-3);
  });
  it("题目用电流方程及其反函数互逆", () => {
    expect(shockleyVoltage(shockley(0.6, 1e-14), 1e-14)).toBeCloseTo(0.6, 9);
  });
  it("r_d = U_T / I_D", () => expect(dynamicResistance(1e-3)).toBeCloseTo(25.85, 1));
});

describe("串联电路与等效模型", () => {
  it("四种模型的结果相互接近，误差随 V 增大而减小", () => {
    const e = solveSeries(5, 1e3, "exp");
    const c = solveSeries(5, 1e3, "const");
    const i = solveSeries(5, 1e3, "ideal");
    expect(Math.abs(c.ID - e.ID) / e.ID).toBeLessThan(0.03);
    expect(i.ID).toBeCloseTo(5e-3, 9);
    // 指数解满足 KVL
    expect(e.ID * 1e3 + e.UD).toBeCloseTo(5, 9);
    const e2 = solveSeries(1.5, 1e3, "exp");
    expect(Math.abs(solveSeries(1.5, 1e3, "ideal").ID - e2.ID) / e2.ID).toBeGreaterThan(0.5);
  });
  it("反偏截止", () => {
    expect(solveSeries(-3, 1e3, "const").on).toBe(false);
    expect(solveSeries(0.5, 1e3, "const").ID).toBe(0);
  });
  it("二极管门电路（假设—验证）", () => {
    const and = diodeGate("and", [0, 3], 5);
    expect(and.UO).toBeCloseTo(0.7, 9);
    expect(and.on).toEqual([true, false]);
    const and2 = diodeGate("and", [3, 3], 5);
    expect(and2.UO).toBeCloseTo(3.7, 9);
    expect(and2.on).toEqual([true, true]);
    const or = diodeGate("or", [0, 3, 1], 0);
    expect(or.UO).toBeCloseTo(2.3, 9);
    expect(or.on).toEqual([false, true, false]);
    expect(diodeGate("and", [6, 8], 5).on).toEqual([false, false]);
  });
});

describe("稳压管稳压电路", () => {
  it("正常稳压：I_Z = I_R − I_L", () => {
    const r = solveZenerRegulator(12, 200, 1e3, DEFAULT_ZENER);
    expect(r.status).toBe("ok");
    expect(r.UO).toBe(6);
    expect(r.IR).toBeCloseTo(0.03, 9);
    expect(r.IZ).toBeCloseTo(0.024, 9);
  });
  it("负载过重：稳压管未击穿", () => {
    const r = solveZenerRegulator(12, 1e3, 500, DEFAULT_ZENER);
    expect(r.status).toBe("off");
    expect(r.UO).toBeCloseTo(4, 9);
  });
  it("空载且 R 过小：电流超过 I_ZM", () => {
    expect(solveZenerRegulator(15, 200, Infinity, DEFAULT_ZENER).status).toBe("over");
  });
  it("r_z 不为零时输出随输入略有变化", () => {
    const z = { ...DEFAULT_ZENER, rz: 10 };
    const a = solveZenerRegulator(12, 300, 2e3, z);
    const b = solveZenerRegulator(13, 300, 2e3, z);
    expect(b.UO - a.UO).toBeCloseTo((1 * 10) / 310, 3);
    const { Sr, Ro } = zenerRegulationIndex(12, 300, 2e3, z);
    expect(Sr).toBeGreaterThan(0);
    expect(Sr).toBeLessThan(0.1);
    expect(Ro).toBeCloseTo(3000 / 310, 6);
  });
  it("限流电阻范围", () => {
    const r = limitResistorRange(10, 14, 0, 10e-3, { UZ: 6, IZmin: 5e-3, IZM: 40e-3 });
    expect(r.Rmin).toBeCloseTo(200, 6);
    expect(r.Rmax).toBeCloseTo(4 / 15e-3, 6);
    expect(r.feasible).toBe(true);
    // 用范围内的 R 验证两个极端
    const R = (r.Rmin + r.Rmax) / 2;
    expect(solveZenerRegulator(14, R, Infinity, { ...DEFAULT_ZENER, IZM: 40e-3 }).status).toBe("ok");
    expect(solveZenerRegulator(10, R, 600, { ...DEFAULT_ZENER, IZM: 40e-3 }).status).toBe("ok");
  });
});

describe("整流、限幅、钳位、滤波", () => {
  it("平均值：0.45U₂ 与 0.9U₂", () => {
    expect(rectifiedAverage(10, "half")).toBeCloseTo(4.502, 3);
    expect(rectifiedAverage(10, "bridge")).toBeCloseTo(9.003, 3);
    expect(rectifiedAverageNumeric(10, "bridge", 0)).toBeCloseTo(9.003, 2);
    expect(rectifiedAverageNumeric(10, "bridge", 0.7)).toBeLessThan(rectifiedAverageNumeric(10, "bridge", 0));
  });
  it("瞬时整流值与二极管应力", () => {
    expect(rectify(-5, "half")).toBe(0);
    expect(rectify(-5, "bridge", 0.7)).toBeCloseTo(3.6, 9);
    const s = rectifierStress(20, 100, "bridge");
    expect(s.ID).toBeCloseTo(0.09, 3);
    expect(s.URM).toBeCloseTo(28.28, 2);
  });
  it("限幅", () => {
    expect(clip(5, { upper: 3.7 })).toBe(3.7);
    expect(clip(-5, { upper: 3.7, lower: -2.7 })).toBe(-2.7);
    expect(clip(1, { upper: 3.7, lower: -2.7 })).toBe(1);
  });
  it("钳位：RC ≫ T 时稳态正峰被钳在 E + U_on，波形整体下移约 U_m", () => {
    const r = simulateClamp({ Um: 5, f: 1e3, C: 10e-6, R: 100e3, periods: 10 });
    const last = r.uo.slice(-400);
    expect(Math.max(...last)).toBeLessThan(0.1);
    expect(Math.min(...last)).toBeCloseTo(-10, 0);
    const ss = clampSteadyState(5, 0, 0);
    expect(ss.min).toBe(-10);
    const r2 = simulateClamp({ Um: 5, f: 1e3, C: 10e-6, R: 100e3, E: 1, Uon: 0.7, periods: 10 });
    const l2 = r2.uo.slice(-400);
    const s2 = clampSteadyState(5, 1, 0.7);
    expect(Math.max(...l2)).toBeCloseTo(s2.max, 0);
    expect(Math.min(...l2)).toBeCloseTo(s2.min, 0);
  });
  it("电容滤波：R_LC ≫ T 时 U_O ≈ 1.2U₂ 量级，纹波随 C 增大而减小", () => {
    const a = simulateCapFilter({ U2rms: 10, C: 470e-6, RL: 100 });
    const b = simulateCapFilter({ U2rms: 10, C: 2200e-6, RL: 100 });
    expect(a.UOavg).toBeGreaterThan(10.5);
    expect(a.UOavg).toBeLessThan(14.2);
    expect(b.ripplePP).toBeLessThan(a.ripplePP);
    expect(a.conduction).toBeLessThan(0.5);
    // 空载：U_O → √2 U₂
    const c = simulateCapFilter({ U2rms: 10, C: 470e-6, RL: Infinity });
    expect(c.UOavg).toBeGreaterThan(13.5);
  });
});
