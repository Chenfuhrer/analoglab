import { describe, expect, it } from "vitest";
import { analyzeCE } from "./ce";
import { simulateWaveforms } from "./transient";
import { outputCurrent, outputFamily } from "./characteristics";
import { DEFAULT_CE, DEFAULT_DIVIDER, type CEParams } from "./types";
import { acRms, harmonic, peaks, phaseDifferenceDeg, thd } from "../dsp";

describe("准静态大信号求解：与小信号模型交叉验证", () => {
  it("u_s = 0 时输出恒为 0（回到 Q 点）", () => {
    const w = simulateWaveforms({ ...DEFAULT_CE, Usm: 0 });
    const pk = peaks(w.uo);
    expect(Math.abs(pk.max)).toBeLessThan(1e-9);
    expect(Math.abs(pk.min)).toBeLessThan(1e-9);
    const a = analyzeCE(DEFAULT_CE);
    expect(Math.abs(w.iC[0] - a.dc.ICQ) / a.dc.ICQ).toBeLessThan(1e-9);
  });

  const cases: Array<[string, CEParams]> = [
    ["固定偏置", { ...DEFAULT_CE }],
    ["固定偏置 + R_s", { ...DEFAULT_CE, Rs: 600 }],
    ["分压偏置（部分旁路）", { ...DEFAULT_DIVIDER }],
    ["分压偏置（C_e 开路）", { ...DEFAULT_DIVIDER, hasCe: false }],
    ["分压偏置 空载", { ...DEFAULT_DIVIDER, RL: Infinity }],
  ];
  for (const [name, p] of cases) {
    it(`${name}：0.1 mV 输入时基波增益与 A_us 相差 < 0.5%`, () => {
      const q = { ...p, Usm: 1e-4 };
      const a = analyzeCE(q);
      const w = simulateWaveforms(q, { periods: 1, samplesPerPeriod: 256 });
      const gain = harmonic(w.uo, w.samplesPerPeriod, 1).amp / q.Usm;
      expect(Math.abs(gain - Math.abs(a.ac.Aus)) / Math.abs(a.ac.Aus)).toBeLessThan(0.005);
    });
  }

  it("小信号下输出与输入反相（相位差 ≈ 180°）", () => {
    const w = simulateWaveforms({ ...DEFAULT_CE, Usm: 1e-4 }, { periods: 1 });
    const d = phaseDifferenceDeg(w.us, w.uo, w.samplesPerPeriod);
    expect(Math.abs(Math.abs(d) - 180)).toBeLessThan(0.5);
  });

  it("大输入：输出正峰被截止限制在 I_CQ·R_L' 附近（顶部失真）", () => {
    const p = { ...DEFAULT_CE, Usm: 0.2 };
    const a = analyzeCE(p);
    const w = simulateWaveforms(p, { periods: 1 });
    const pk = peaks(w.uo);
    expect(pk.max).toBeLessThanOrEqual(a.ac.UomCut * (1 + 1e-6));
    expect(pk.max).toBeGreaterThan(0.97 * a.ac.UomCut);
    expect(w.region.includes("cutoff")).toBe(true);
  });

  it("大输入：u_CE 始终 ≥ U_CES，负峰被饱和限制", () => {
    const p = { ...DEFAULT_CE, Rb: 330e3, Usm: 0.2 }; // Q 点偏高 → 先饱和
    const a = analyzeCE(p);
    expect(a.dc.region).toBe("active");
    expect(a.ac.limitedBy).toBe("saturation");
    const w = simulateWaveforms(p, { periods: 1 });
    let minUce = Infinity;
    for (const v of w.uCE) minUce = Math.min(minUce, v);
    expect(minUce).toBeGreaterThanOrEqual(p.UCES - 1e-9);
    expect(peaks(w.uo).min).toBeGreaterThanOrEqual(-a.ac.UomSat * (1 + 1e-6));
    expect(w.region.includes("saturation")).toBe(true);
  });

  it("输入特性的指数非线性：5 mV 输入时 THD 在 1%–10% 之间，且随 R_e 负反馈显著降低", () => {
    const w1 = simulateWaveforms({ ...DEFAULT_CE, Usm: 5e-3 }, { periods: 1 });
    const t1 = thd(w1.uo, w1.samplesPerPeriod);
    expect(t1).toBeGreaterThan(0.01);
    expect(t1).toBeLessThan(0.1);
    // 加 1 kΩ 不旁路射极电阻（调整 R_b 维持相近 Q 点）
    const p2 = { ...DEFAULT_CE, Re1: 1000, Rb: 465e3, Usm: 5e-3 };
    const w2 = simulateWaveforms(p2, { periods: 1 });
    expect(thd(w2.uo, w2.samplesPerPeriod)).toBeLessThan(t1 / 10);
  });

  it("有效值与峰值关系：小信号正弦 U_rms ≈ U_peak/√2", () => {
    const w = simulateWaveforms({ ...DEFAULT_CE, Usm: 1e-4 }, { periods: 2 });
    const pk = peaks(w.uo);
    expect(Math.abs(acRms(w.uo) - pk.max / Math.SQRT2) / acRms(w.uo)).toBeLessThan(0.01);
  });
});

describe("输出特性曲线（Ebers–Moll）", () => {
  const o = { beta: 100 };
  it("u_CE 较大时 i_C → β·i_B", () => {
    expect(Math.abs(outputCurrent(10, 20e-6, o) - 2e-3) / 2e-3).toBeLessThan(1e-6);
  });
  it("u_CE = 0.3 V 时已超过 0.99 β i_B（与 U_CES 判据相容）", () => {
    expect(outputCurrent(0.3, 20e-6, o)).toBeGreaterThan(0.99 * 2e-3);
  });
  it("u_CE = 0.1 V 时明显小于 β i_B（饱和区）", () => {
    expect(outputCurrent(0.1, 20e-6, o)).toBeLessThan(0.5 * 2e-3);
  });
  it("单调不减", () => {
    const [c] = outputFamily([20e-6], 12, o);
    for (let k = 1; k < c.points.length; k++) expect(c.points[k][1]).toBeGreaterThanOrEqual(c.points[k - 1][1] - 1e-15);
  });
});
