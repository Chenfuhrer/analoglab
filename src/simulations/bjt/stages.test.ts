import { describe, expect, it } from "vitest";
import { par } from "../units";
import { analyzeCB, analyzeCC, analyzeCEStage, betaSensitivity, DEFAULT_CB, DEFAULT_CC, qAtTemperature } from "./stages";
import { DEFAULT_CE, DEFAULT_DIVIDER } from "./types";

describe("共集电路", () => {
  it("手算核对（固定偏置）", () => {
    const a = analyzeCC(DEFAULT_CC);
    // I_BQ = (12−0.7)/(200k + 101×3k) = 22.47 µA
    expect(a.dc.IBQ).toBeCloseTo(11.3 / 503e3, 9);
    expect(a.dc.UCEQ).toBeCloseTo(12 - 101 * (11.3 / 503e3) * 3e3, 6);
    const rbe = 200 + (101 * 0.026) / a.dc.IEQ;
    expect(a.ac.rbe).toBeCloseTo(rbe, 6);
    const RLp = 1500;
    expect(a.ac.Au).toBeCloseTo((101 * RLp) / (rbe + 101 * RLp), 9);
    expect(a.ac.Au).toBeGreaterThan(0.97);
    expect(a.ac.Au).toBeLessThan(1);
    expect(a.ac.Ri).toBeCloseTo(par(200e3, rbe + 101 * RLp), 6);
    expect(a.ac.Ro).toBeCloseTo(par(3e3, (rbe + par(1e3, 200e3)) / 101), 6);
    expect(a.ac.Ro).toBeLessThan(40);
  });
  it("输出电阻随信号源内阻增大", () => {
    expect(analyzeCC({ ...DEFAULT_CC, Rs: 10e3 }).ac.Ro).toBeGreaterThan(analyzeCC(DEFAULT_CC).ac.Ro * 3);
  });
});

describe("共基电路", () => {
  it("增益与共射同数值但同相；输入电阻很小", () => {
    const b = analyzeCB(DEFAULT_CB);
    const e = analyzeCEStage(DEFAULT_CB);
    expect(b.dc.ICQ).toBeCloseTo(e.dc.ICQ, 12);
    expect(b.ac.Au).toBeCloseTo(-e.ac.Au, 9);
    expect(b.ac.Ri).toBeLessThan(30);
    expect(b.ac.Ri).toBeCloseTo(par(DEFAULT_CB.Re, b.ac.rbe / 101), 9);
    expect(b.ac.Ai).toBeCloseTo(100 / 101, 9);
  });
  it("源电压增益：小 R_i 被信号源内阻严重衰减", () => {
    const b = analyzeCB({ ...DEFAULT_CB, Rs: 1e3 });
    expect(Math.abs(b.ac.Aus)).toBeLessThan(Math.abs(b.ac.Au) * 0.05);
  });
});

describe("Q 点温度稳定性", () => {
  it("分压偏置对 β 的灵敏度远小于固定偏置", () => {
    const sf = betaSensitivity(DEFAULT_CE);
    const sd = betaSensitivity(DEFAULT_DIVIDER);
    expect(sf).toBeCloseTo(1, 3);
    expect(sd).toBeLessThan(0.1);
  });
  it("升温：固定偏置 I_CQ 大幅增大，分压偏置变化小", () => {
    const f0 = qAtTemperature(DEFAULT_CE, 25);
    const f1 = qAtTemperature(DEFAULT_CE, 60);
    const d0 = qAtTemperature(DEFAULT_DIVIDER, 25);
    const d1 = qAtTemperature(DEFAULT_DIVIDER, 60);
    expect(f1.ICQ / f0.ICQ).toBeGreaterThan(1.3);
    expect(d1.ICQ / d0.ICQ).toBeLessThan(1.08);
  });
  it("计入 I_CBO", () => {
    const a = qAtTemperature(DEFAULT_CE, 25, 1e-6);
    expect(a.ICQ).toBeGreaterThan(qAtTemperature(DEFAULT_CE, 25, 0).ICQ);
  });
});
