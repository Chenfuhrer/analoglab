import { describe, expect, it } from "vitest";
import { analyzeCE } from "../bjt/ce";
import { analyzeCC, DEFAULT_CC } from "../bjt/stages";
import { DEFAULT_DIVIDER, type CEParams } from "../bjt/types";
import { cabs, cargDeg, highPass, highPassDroop, lowPass, squareResponse } from "../signal/rc";
import { analyzeCECC, analyzeCECE, cascade, directTwoCE, inputReferredDrift } from "./cascade";

const ce: CEParams = { ...DEFAULT_DIVIDER, Re1: 0, Re2: 1.2e3, hasCe: true };

describe("RC 网络", () => {
  it("截止频率处 −3 dB、±45°", () => {
    expect(cabs(highPass(100, 100))).toBeCloseTo(Math.SQRT1_2, 9);
    expect(cargDeg(highPass(100, 100))).toBeCloseTo(45, 9);
    expect(cargDeg(lowPass(100, 100))).toBeCloseTo(-45, 9);
  });
  it("方波响应：低通连续、高通在跳变处跳 2 倍幅值", () => {
    const lp = squareResponse("lp", 1e3, 1e3, 1000);
    expect(Math.abs(lp.vout[0] - lp.vout[999])).toBeLessThan(0.02);
    const hp = squareResponse("hp", 10, 1e3, 1000);
    expect(hp.vout[0]).toBeCloseTo(1, 1);
    expect(hp.vout[499]).toBeLessThan(hp.vout[0]);
    // 倾斜量与解析式一致
    const tau = 1 / (2 * Math.PI * 10);
    expect(1 - hp.vout[499] / hp.vout[0]).toBeCloseTo(highPassDroop(tau, (499 / 1000) / 1e3), 6);
  });
});

describe("级联", () => {
  it("二端口级联与负载效应", () => {
    const r = cascade(
      [
        { Auo: -100, Ri: 2e3, Ro: 3e3 },
        { Auo: -100, Ri: 2e3, Ro: 3e3 },
      ],
      0,
      Infinity,
    );
    expect(r.stageGains[0]).toBeCloseTo(-40, 9);
    expect(r.Au).toBeCloseTo(4000, 6);
    expect(r.naive).toBe(10000);
  });
  it("共射–共射：第一级增益受第二级输入电阻影响", () => {
    const t = analyzeCECE(ce, ce, 3e3);
    const second = analyzeCE({ ...ce, RL: 3e3, Rs: ce.Rc });
    expect(t.Ri2).toBeCloseTo(second.ac.Ri, 6);
    expect(Math.abs(t.A1)).toBeLessThan(Math.abs(t.A1open) / 2);
    expect(t.Au).toBeGreaterThan(0);
  });
  it("共射–共集：带重负载时比单级共射好得多", () => {
    const RL = 200;
    const single = analyzeCE({ ...ce, RL });
    const t = analyzeCECC(ce, { ...DEFAULT_CC, topology: "divider", Rb1: 100e3, Rb2: 100e3, Re: 2e3 }, RL);
    expect(Math.abs(t.Au)).toBeGreaterThan(Math.abs(single.ac.Au) * 5);
    expect(t.Ro).toBeLessThan(100);
    expect(t.A2).toBeGreaterThan(0.8);
    const cc = analyzeCC({ ...DEFAULT_CC, topology: "divider", Rb1: 100e3, Rb2: 100e3, Re: 2e3, RL, Rs: ce.Rc });
    expect(t.Ri2).toBeCloseTo(cc.ac.Ri, 6);
  });
});

describe("直接耦合与零点漂移", () => {
  it("第二级射极电阻抬高第一级集电极电位", () => {
    const a = directTwoCE({ VCC: 12, Rb1: 560e3, Rc1: 3e3, Rc2: 3e3, Re2: 0.1, beta: 100 });
    expect(a.UC1).toBeLessThan(1);
    const b = directTwoCE({ VCC: 12, Rb1: 560e3, Rc1: 3e3, Rc2: 3e3, Re2: 2e3, beta: 100 });
    expect(b.UC1).toBeGreaterThan(3);
    expect(b.region1).toBe("active");
    // 节点 KCL
    expect((12 - b.UC1) / 3e3).toBeCloseTo(b.IC1 + b.IB2, 9);
  });
  it("第一级的漂移起决定作用", () => {
    const r = inputReferredDrift([1e-3, 1e-3, 1e-3], [-50, -50, -10]);
    expect(r.input).toBeCloseTo(1e-3 + 1e-3 / -50 + 1e-3 / 2500, 12);
    expect(Math.abs(r.contributions[0])).toBeGreaterThan(Math.abs(r.contributions[1]) * 40);
  });
});
