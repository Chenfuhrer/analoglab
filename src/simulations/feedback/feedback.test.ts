import { describe, expect, it } from "vitest";
import { harmonic, thd } from "../dsp";
import { bandwidthWithFeedback, closedLoop, closedLoopComplex, closedLoopStep, feedbackResistances, gainSensitivity, loopGain, margins, singlePole, softAmp, solveClosedLoop } from "./feedback";
import { cabs } from "../signal/rc";

describe("基本方程", () => {
  it("A_f = A/(1+AF)，深度负反馈时 ≈ 1/F", () => {
    const r = closedLoop(1e5, 0.01);
    expect(r.Af).toBeCloseTo(1e5 / 1001, 9);
    expect(r.Af).toBeCloseTo(100, -1);
  });
  it("A 变化 10%，A_f 变化约 10%/(1+AF)", () => {
    const s = gainSensitivity(1e4, 0.01, 0.1);
    expect(s.rel).toBeCloseTo(0.1 / (1 + 1.1e4 * 0.01), 4);
  });
  it("带宽展宽，增益带宽积不变", () => {
    const b = bandwidthWithFeedback(1e4, 1e3, 0.01);
    expect(b.fHf).toBeCloseTo(101e3, 6);
    expect(b.Amf * b.fHf).toBeCloseTo(1e7, 3);
    const H = closedLoopComplex(singlePole(1e4, 1e3, b.fHf), 0.01);
    expect(cabs(H) / b.Amf).toBeCloseTo(Math.SQRT1_2, 3);
  });
  it("负反馈减小非线性失真（相同输出幅度下比较）", () => {
    const a = softAmp(1000, 0.01);
    const N = 256;
    const open: number[] = [];
    const closed: number[] = [];
    // 开环：输入 6 mV 峰值（输出约 5.4 V）；闭环 F=0.0099（A_f≈92）：输入调到使输出同幅度
    for (let k = 0; k < N; k++) open.push(a(0.006 * Math.sin((2 * Math.PI * k) / N)));
    const target = harmonic(open, N, 1).amp;
    let lo = 0;
    let hi = 1;
    for (let it = 0; it < 60; it++) {
      const x = (lo + hi) / 2;
      const amp = harmonic(Array.from({ length: N }, (_, k) => solveClosedLoop(a, 0.0099, x * Math.sin((2 * Math.PI * k) / N))), N, 1).amp;
      if (amp < target) lo = x;
      else hi = x;
    }
    for (let k = 0; k < N; k++) closed.push(solveClosedLoop(a, 0.0099, lo * Math.sin((2 * Math.PI * k) / N)));
    expect(thd(closed, N)).toBeLessThan(thd(open, N) / 5);
  });
  it("四种组态对电阻的影响", () => {
    expect(feedbackResistances("voltage-series", 1e3, 100, 11)).toEqual({ Rif: 11e3, Rof: 100 / 11 });
    expect(feedbackResistances("current-shunt", 1e3, 100, 11)).toEqual({ Rif: 1e3 / 11, Rof: 1100 });
  });
});

describe("稳定性", () => {
  it("单极点永远稳定；三极点在环路增益大时不稳定", () => {
    expect(margins({ T0: 1e4, poles: [100] }).stable).toBe(true);
    const unstable = margins({ T0: 1000, poles: [1e3, 1e4, 1e5] });
    expect(unstable.stable).toBe(false);
    const stable = margins({ T0: 3, poles: [1e3, 1e4, 1e5] });
    expect(stable.stable).toBe(true);
    expect(stable.PM).toBeGreaterThan(30);
  });
  it("相位裕度处 |T| = 1", () => {
    const s = { T0: 50, poles: [1e3, 1e5] };
    const m = margins(s);
    expect(cabs(loopGain(s, m.fc))).toBeCloseTo(1, 3);
  });
  it("主极点补偿：把第一个极点压低可恢复稳定", () => {
    expect(margins({ T0: 1000, poles: [1e3, 1e4, 1e5] }).stable).toBe(false);
    expect(margins({ T0: 1000, poles: [1, 1e4, 1e5] }).stable).toBe(true);
  });
  it("阶跃响应：稳定时收敛到 1/F（含静差）", () => {
    const r = closedLoopStep(1e4, [100], 0.1, { tEnd: 0.01, n: 2000 });
    expect(r.y[r.y.length - 1]).toBeCloseTo(1e3 / (1 + 1e3), 3);
  });
});

import { criticalLoopGain } from "./feedback";
describe("临界环路增益", () => {
  it("与裕度判据一致", () => {
    const p = [1e3, 1e4, 1e5];
    const c = criticalLoopGain(p);
    expect(margins({ T0: c.T0 * 0.95, poles: p }).stable).toBe(true);
    expect(margins({ T0: c.T0 * 1.05, poles: p }).stable).toBe(false);
    expect(criticalLoopGain([1e3, 1e4]).T0).toBe(Infinity);
  });
});
