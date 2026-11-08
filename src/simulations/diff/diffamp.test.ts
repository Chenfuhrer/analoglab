import { describe, expect, it } from "vitest";
import { par } from "../units";
import { activeLoadGain, analyzeDiff, decompose, DEFAULT_DIFF, diffLargeSignal, diffOutput, mirror, ratioSource, sourceOutputResistance, widlar, widlarResistor } from "./diffamp";

describe("差模共模分解", () => {
  it("u1 = uIc + uId/2，u2 = uIc − uId/2", () => {
    const d = decompose(1.01, 0.99);
    expect(d.uId).toBeCloseTo(0.02, 12);
    expect(d.uIc).toBeCloseTo(1, 12);
    expect(d.uIc + d.uId / 2).toBeCloseTo(1.01, 12);
  });
});

describe("长尾差分电路", () => {
  it("静态手算核对", () => {
    const r = analyzeDiff(DEFAULT_DIFF);
    expect(r.IEQ).toBeCloseTo(11.3 / (1e3 / 101 + 20e3), 9);
    expect(r.UCQ).toBeCloseTo(12 - r.ICQ * 10e3, 9);
  });
  it("双端输出：A_d = −β(R_c∥R_L/2)/(R_b+r_be)，A_c = 0", () => {
    const r = analyzeDiff(DEFAULT_DIFF);
    expect(r.Ad).toBeCloseTo((-100 * par(10e3, 10e3)) / (1e3 + r.rbe), 9);
    expect(r.Ac).toBe(0);
    expect(r.KCMR).toBe(Infinity);
    expect(r.Rid).toBeCloseTo(2 * (1e3 + r.rbe), 9);
  });
  it("单端输出：增益减半，K_CMR 随 R_e 增大", () => {
    const s = analyzeDiff({ ...DEFAULT_DIFF, output: "single", RL: Infinity });
    const d = analyzeDiff({ ...DEFAULT_DIFF, RL: Infinity });
    expect(s.Ad).toBeCloseTo(d.Ad / 2, 9);
    expect(s.KCMR).toBeCloseTo((1e3 + s.rbe + 2 * 101 * 10e3) / (2 * (1e3 + s.rbe)), 6);
    const big = analyzeDiff({ ...DEFAULT_DIFF, output: "single", RL: Infinity, tail: "source", I0: s.IEQ * 2, Re: 1e6 });
    expect(big.KCMR).toBeGreaterThan(s.KCMR * 50);
  });
  it("任意输入：u_O = A_d u_Id + A_c u_Ic", () => {
    const s = analyzeDiff({ ...DEFAULT_DIFF, output: "single" });
    expect(diffOutput(s, 0.01, 0)).toBeCloseTo(s.Ad * 0.01 + s.Ac * 0.005, 12);
  });
  it("大信号：u_Id = 0 时平分；|u_Id| = 4U_T 时约 98% 偏向一侧", () => {
    const a = diffLargeSignal(0, 1e-3);
    expect(a.iC1).toBeCloseTo(0.5e-3, 12);
    const b = diffLargeSignal(4 * 0.026, 1e-3);
    expect(b.iC1 / 1e-3).toBeCloseTo(0.982, 3);
    expect(b.iC1 + b.iC2).toBeCloseTo(1e-3, 12);
  });
});

describe("电流源", () => {
  it("镜像电流源", () => {
    const m = mirror(12, 11.3e3, 100);
    expect(m.IR).toBeCloseTo(1e-3, 9);
    expect(m.IC2).toBeCloseTo(1e-3 * 100 / 102, 9);
  });
  it("微电流源与反设计互逆", () => {
    const i = widlar(1e-3, 3e3);
    expect(i).toBeGreaterThan(20e-6);
    expect(i).toBeLessThan(40e-6);
    expect(widlarResistor(1e-3, i)).toBeCloseTo(3e3, 3);
  });
  it("比例电流源近似 I_R·R_e1/R_e2", () => {
    const r = ratioSource(1e-3, 2e3, 1e3);
    expect(r.IC2 / r.approx).toBeGreaterThan(0.95);
    expect(r.IC2 / r.approx).toBeLessThan(1.05);
  });
  it("射极电阻提高输出电阻；有源负载提高增益", () => {
    expect(sourceOutputResistance(1e-3, 100, 1e3, 100, 2.6e3)).toBeGreaterThan(sourceOutputResistance(1e-3, 100, 0, 100, 2.6e3) * 20);
    expect(Math.abs(activeLoadGain(1e-3, 100, 100, 2.8e3, Infinity))).toBeGreaterThan(1000);
  });
});
