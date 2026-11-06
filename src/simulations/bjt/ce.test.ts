import { describe, expect, it } from "vitest";
import { analyzeCE, solveAC, solveDC, lowFrequency } from "./ce";
import { DEFAULT_CE, DEFAULT_DIVIDER, type CEParams } from "./types";

const close = (a: number, b: number, rel = 1e-6) => expect(Math.abs(a - b)).toBeLessThanOrEqual(rel * Math.abs(b) + 1e-15);

/**
 * 用例 A：固定偏置。手工推导：
 *   I_BQ = (12 − 0.7)/565k = 20 µA；I_CQ = 2 mA；I_EQ = 2.02 mA；U_CEQ = 12 − 2m·3k = 6 V
 *   r_be = 100 + 101·26m/2.02m = 1400 Ω；R_L' = 3k∥3k = 1.5 kΩ
 *   A_u = −100·1500/1400 = −107.142857；R_i = 565k∥1.4k = 1396.54 Ω；R_o = 3 kΩ
 *   U_om = min(6 − 0.3, 2m·1.5k) = 3 V（截止先发生）
 */
const fixed: CEParams = { ...DEFAULT_CE };

describe("固定偏置共射：静态工作点", () => {
  const dc = solveDC(fixed);
  it("处于放大区", () => expect(dc.region).toBe("active"));
  it("I_BQ = 20 µA", () => close(dc.IBQ, 20e-6));
  it("I_CQ = 2 mA, I_EQ = 2.02 mA", () => {
    close(dc.ICQ, 2e-3);
    close(dc.IEQ, 2.02e-3);
  });
  it("U_CEQ = 6 V，U_CQ = 6 V，U_BQ = 0.7 V", () => {
    close(dc.UCEQ, 6);
    close(dc.UCQ, 6);
    close(dc.UBQ, 0.7);
  });
});

describe("固定偏置共射：中频动态参数", () => {
  const ac = solveAC(fixed);
  it("r_be = 1400 Ω", () => close(ac.rbe, 1400));
  it("A_u = −107.14", () => close(ac.Au, (-100 * 1500) / 1400));
  it("空载 A_uo = −214.29", () => close(ac.Auo, (-100 * 3000) / 1400));
  it("R_i = R_b ∥ r_be", () => close(ac.Ri, (565e3 * 1400) / (565e3 + 1400)));
  it("R_o = R_c", () => close(ac.Ro, 3000));
  it("R_s = 0 时 A_us = A_u", () => close(ac.Aus, ac.Au));
  it("最大不失真输出 3 V，由截止限制", () => {
    close(ac.UomCut, 3);
    close(ac.UomSat, 5.7);
    close(ac.Uom, 3);
    expect(ac.limitedBy).toBe("cutoff");
  });
  it("A_us 随 R_s 衰减：R_s = R_i 时减半", () => {
    const ac0 = solveAC(fixed);
    const ac1 = solveAC({ ...fixed, Rs: ac0.Ri });
    close(ac1.Aus, ac0.Au / 2);
  });
  it("空载时 R_L' = R_c", () => {
    const acOpen = solveAC({ ...fixed, RL: Infinity });
    close(acOpen.RLp, 3000);
    close(acOpen.Au, acOpen.Auo);
  });
});

/**
 * 用例 B：分压偏置 + 部分旁路射极电阻（教材型综合题参数）。
 *   V_CC=12 V, R_b1=5 kΩ(下), R_b2=25 kΩ(上), R_c=R_L=5 kΩ, R_e1(R_f)=300 Ω, R_e2=1 kΩ(被C_e旁路), β=100, r_bb'=100 Ω
 * 估算法（参考答案的做法）：U_BQ=2 V, I_EQ=1 mA, I_BQ≈9.9 µA, U_CEQ=12−1m·6.3k=5.7 V
 * 戴维南精确解（手算）：R_B=4.1667 kΩ, I_BQ=1.3/(4166.67+101·1300)=9.5965 µA,
 *   I_EQ=0.96925 mA, U_CEQ=12−0.95965m·5k−0.96925m·1.3k=5.9417 V
 *   r_be=100+2.626/0.96925m=2809.3 Ω, A_u=−100·2500/(2809.3+30300)=−7.551, R_i=4166.67∥33109.3=3700.9 Ω
 */
const divider: CEParams = {
  ...DEFAULT_CE,
  topology: "divider",
  Rb1: 5e3,
  Rb2: 25e3,
  Rc: 5e3,
  RL: 5e3,
  Re1: 300,
  Re2: 1e3,
  hasCe: true,
  beta: 100,
  rbb: 100,
};

describe("分压偏置：估算法与精确解", () => {
  const dc = solveDC(divider);
  it("估算法与参考答案一致", () => {
    expect(dc.estimate).toBeDefined();
    close(dc.estimate!.UBQ, 2);
    close(dc.estimate!.IEQ, 1e-3);
    close(dc.estimate!.IBQ, 1e-3 / 101);
    close(dc.estimate!.UCEQ, 5.7);
  });
  it("戴维南精确解", () => {
    expect(dc.region).toBe("active");
    close(dc.RB, (5e3 * 25e3) / 30e3);
    close(dc.IBQ, 1.3 / (25e3 / 6 + 101 * 1300), 1e-9);
    close(dc.IEQ, 0.96925e-3, 1e-4);
    close(dc.UCEQ, 5.9417, 1e-4);
  });
  it("估算法误差 < 5%（因为 (1+β)R_E ≫ R_B）", () => {
    expect(dc.estimate!.ratio).toBeGreaterThan(30);
    expect(Math.abs(dc.estimate!.IEQ - dc.IEQ) / dc.IEQ).toBeLessThan(0.05);
  });
});

describe("分压偏置：动态参数与 C_e 的影响", () => {
  const ac = solveAC(divider);
  it("r_be ≈ 2.81 kΩ", () => close(ac.rbe, 2809.3, 1e-4));
  it("A_u ≈ −7.55（参考答案估算 −7.7，差异来自取整与 I_EQ 估算）", () => {
    close(ac.Au, -7.551, 1e-3);
    expect(Math.abs(ac.Au - -7.7) / 7.7).toBeLessThan(0.03);
  });
  it("R_i ≈ 3.70 kΩ，R_o = 5 kΩ", () => {
    close(ac.Ri, 3700.9, 1e-3);
    close(ac.Ro, 5e3);
  });
  it("C_e 开路：|A_u| 减小、R_i 增大，A_u ≈ −R_L'/(R_e1+R_e2)", () => {
    const acOpen = solveAC({ ...divider, hasCe: false });
    expect(Math.abs(acOpen.Au)).toBeLessThan(Math.abs(ac.Au));
    expect(acOpen.Ri).toBeGreaterThan(ac.Ri);
    close(acOpen.Au, -1.8642, 1e-3);
    // 参考答案的近似 −R_L'/(R_f+R_e) = −1.92，精确值偏差 < 4%
    expect(Math.abs(acOpen.Au - -2500 / 1300) / (2500 / 1300)).toBeLessThan(0.04);
    close(acOpen.Ri, 4041.1, 1e-3);
  });
});

describe("工作区判断与边界", () => {
  it("R_b 过小 → 饱和：U_CE = U_CES，I_C = (V_CC−U_CES)/R_c，强制 β < β", () => {
    const dc = solveDC({ ...fixed, Rb: 200e3 });
    expect(dc.region).toBe("saturation");
    close(dc.UCEQ, 0.3);
    close(dc.IBQ, 11.3 / 200e3);
    close(dc.ICQ, 11.7 / 3e3);
    expect(dc.betaForced).toBeLessThan(100);
  });
  it("饱和解满足两个回路 KVL（含射极电阻）", () => {
    const p: CEParams = { ...fixed, Rb: 100e3, Re1: 500, Re2: 0 };
    const dc = solveDC(p);
    expect(dc.region).toBe("saturation");
    close(dc.VBB, dc.IBQ * dc.RB + p.UBE + dc.IEQ * dc.RE, 1e-9);
    close(p.VCC, dc.ICQ * p.Rc + p.UCES + dc.IEQ * dc.RE, 1e-9);
  });
  it("V_BB ≤ U_BEQ → 截止：电流为 0，U_CE = V_CC", () => {
    const dc = solveDC({ ...DEFAULT_DIVIDER, Rb1: 1e3, Rb2: 33e3 });
    expect(dc.region).toBe("cutoff");
    expect(dc.ICQ).toBe(0);
    close(dc.UCEQ, 12);
  });
  it("临界饱和附近 I_C 连续（放大区一侧与饱和区一侧相差 < 1%）", () => {
    // 临界：U_CE = U_CES → I_C = 11.7/3k = 3.9 mA → I_B = 39 µA → R_b = 11.3/39µ
    const RbCrit = 11.3 / 39e-6;
    const a = solveDC({ ...fixed, Rb: RbCrit * 1.001 });
    const s = solveDC({ ...fixed, Rb: RbCrit * 0.999 });
    expect(a.region).toBe("active");
    expect(s.region).toBe("saturation");
    expect(Math.abs(a.ICQ - s.ICQ) / a.ICQ).toBeLessThan(0.01);
  });
  it("β 增大时固定偏置 Q 点漂移，分压偏置几乎不变（稳定 Q 点）", () => {
    const f1 = solveDC({ ...fixed, beta: 100 }).ICQ;
    const f2 = solveDC({ ...fixed, beta: 150 }).ICQ;
    const d1 = solveDC({ ...DEFAULT_DIVIDER, beta: 100 }).ICQ;
    const d2 = solveDC({ ...DEFAULT_DIVIDER, beta: 150 }).ICQ;
    expect((f2 - f1) / f1).toBeGreaterThan(0.45);
    expect(Math.abs(d2 - d1) / d1).toBeLessThan(0.05);
  });
});

describe("默认分压偏置参数（手算核对）", () => {
  // V_BB = 12·10/43 = 2.7907 V；R_B = 10k∥33k = 7.6744 kΩ；R_E = 1.2 kΩ
  // I_BQ = 2.090698/(7674.42 + 101·1200) = 2.090698/128874.42 = 16.2228 µA
  // → I_CQ = 1.62228 mA，I_EQ = 1.63850 mA，U_CEQ = 12 − 1.62228m·3k − 1.63850m·1.2k = 5.16696 V
  const dc = solveDC(DEFAULT_DIVIDER);
  it("Q 点", () => {
    close(dc.IBQ, 16.2228e-6, 1e-4);
    close(dc.ICQ, 1.62228e-3, 1e-4);
    close(dc.UCEQ, 5.16696, 1e-4);
  });
});

describe("低频截止估算", () => {
  it("各电容极点为正，f_L 为三者之和", () => {
    const a = analyzeCE(DEFAULT_DIVIDER);
    const lf = lowFrequency(DEFAULT_DIVIDER, a.dc, a.ac);
    expect(lf.fC1).toBeGreaterThan(0);
    expect(lf.fC2).toBeGreaterThan(0);
    expect(lf.fCe).toBeGreaterThan(lf.fC1); // 旁路电容通常决定 f_L
    close(lf.fL, lf.fC1 + lf.fC2 + lf.fCe);
  });
  it("C_1 极点：1/(2π C_1 (R_s+R_i))", () => {
    const a = analyzeCE(fixed);
    close(a.lf.fC1, 1 / (2 * Math.PI * 10e-6 * a.ac.Ri));
  });
});
