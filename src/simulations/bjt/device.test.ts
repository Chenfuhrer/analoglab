import { describe, expect, it } from "vitest";
import { alphaFromBeta, atTemperature, betaFromAlpha, currentsFromIB, currentsFromIE, ebersMoll, judgeActivePins, regionFromPotentials, soaCheck } from "./device";

describe("电流分配", () => {
  it("α 与 β 互逆", () => {
    expect(alphaFromBeta(99)).toBeCloseTo(0.99, 12);
    expect(betaFromAlpha(0.98)).toBeCloseTo(49, 9);
  });
  it("I_E = I_B + I_C；I_CEO = (1+β) I_CBO", () => {
    const c = currentsFromIB(20e-6, 100, 10e-9);
    expect(c.IE).toBeCloseTo(c.IB + c.IC, 15);
    expect(c.ICEO).toBeCloseTo(1.01e-6, 12);
    expect(c.IC).toBeCloseTo(2e-3 + 1.01e-6, 12);
    const d = currentsFromIE(1.01e-3, 100, 0);
    expect(d.IC).toBeCloseTo(1e-3, 12);
    expect(d.IB).toBeCloseTo(10e-6, 12);
  });
});

describe("Ebers–Moll", () => {
  it("放大区 i_C ≈ β_F i_B", () => {
    const r = ebersMoll(0.65, 5);
    expect(r.iC / r.iB).toBeCloseTo(100, 3);
  });
  it("u_CE = 0 时同一 u_BE 下 i_B 更大（输入特性左移）", () => {
    expect(ebersMoll(0.6, 0).iB).toBeGreaterThan(ebersMoll(0.6, 1).iB * 10);
    expect(ebersMoll(0.6, 0).iC).toBeLessThanOrEqual(0);
  });
  it("u_CE ≥ 1 V 后输入特性几乎重合", () => {
    expect(ebersMoll(0.65, 1).iB / ebersMoll(0.65, 10).iB).toBeCloseTo(1, 6);
  });
  it("饱和区 i_C < β i_B", () => {
    const r = ebersMoll(0.7, 0.1);
    expect(r.iC / r.iB).toBeLessThan(50);
  });
});

describe("由电位判断", () => {
  it("NPN 硅管放大", () => {
    const j = judgeActivePins([3.7, 3, 12]);
    expect(j.pins).toEqual(["b", "e", "c"]);
    expect(j.type).toBe("NPN");
    expect(j.material).toBe("Si");
    expect(j.region).toBe("active");
  });
  it("PNP 锗管放大", () => {
    const j = judgeActivePins([-6, -0.2, 0]);
    expect(j.pins).toEqual(["c", "b", "e"]);
    expect(j.type).toBe("PNP");
    expect(j.material).toBe("Ge");
  });
  it("PNP 硅管（电源为正）", () => {
    const j = judgeActivePins([9, 8.3, 2]);
    expect(j.pins).toEqual(["e", "b", "c"]);
    expect(j.type).toBe("PNP");
    expect(j.region).toBe("active");
  });
  it("已知管型判工作区", () => {
    expect(regionFromPotentials("NPN", 0.7, 0.3, 0)).toBe("saturation");
    expect(regionFromPotentials("NPN", 0.7, 5, 0)).toBe("active");
    expect(regionFromPotentials("NPN", 0, 5, 0)).toBe("cutoff");
    expect(regionFromPotentials("PNP", -0.7, -5, 0)).toBe("active");
    expect(regionFromPotentials("PNP", 2.3, 2.7, 3)).toBe("saturation");
  });
});

describe("温度与安全工作区", () => {
  it("温度升高：β↑、U_BE↓、I_CBO 每 10 °C 翻倍", () => {
    const t = atTemperature({ beta: 100, UBE: 0.7, ICBO: 1e-9 }, 45);
    expect(t.beta).toBeCloseTo(122, 0);
    expect(t.UBE).toBeCloseTo(0.656, 6);
    expect(t.ICBO).toBeCloseTo(4e-9, 15);
  });
  it("SOA", () => {
    const l = { PCM: 0.3, ICM: 0.1, UCEO: 30 };
    expect(soaCheck(10, 0.02, l).safe).toBe(true);
    expect(soaCheck(10, 0.05, l).violations).toEqual(["P"]);
    expect(soaCheck(35, 0.001, l).violations).toEqual(["U"]);
  });
});

import { solveSimpleBias } from "./device";
describe("最简偏置电路", () => {
  it("三个工作区", () => {
    expect(solveSimpleBias({ VBB: 0.3, Rb: 10e3, VCC: 12, Rc: 2e3, beta: 100 }).region).toBe("cutoff");
    const a = solveSimpleBias({ VBB: 3, Rb: 230e3, VCC: 12, Rc: 2e3, beta: 100 });
    expect(a.region).toBe("active");
    expect(a.IC).toBeCloseTo(1e-3, 9);
    expect(a.UCE).toBeCloseTo(10, 6);
    const s = solveSimpleBias({ VBB: 5, Rb: 10e3, VCC: 12, Rc: 2e3, beta: 100 });
    expect(s.region).toBe("saturation");
    expect(s.UCE).toBe(0.3);
  });
});
