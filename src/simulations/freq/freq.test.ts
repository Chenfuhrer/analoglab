import { describe, expect, it } from "vitest";
import { cabs, highPass, lowPass } from "../signal/rc";
import { DEFAULT_DIVIDER, type CEParams } from "../bjt/types";
import { asymptoteDb, bandEdges, betaOfF, ceFrequency, hybridPi, identicalStages, multistageEstimate, poleResponse } from "./freq";

describe("波特图", () => {
  it("渐近线在转折频率处误差 3 dB", () => {
    const exact = 20 * Math.log10(cabs(lowPass(1e3, 1e3)));
    expect(exact - asymptoteDb("lp", 1e3, 1e3)).toBeCloseTo(-3.01, 2);
    expect(asymptoteDb("lp", 1e4, 1e3)).toBeCloseTo(-20, 9);
    expect(asymptoteDb("hp", 100, 1e3)).toBeCloseTo(-20, 9);
    expect(cabs(highPass(100, 1e3))).toBeCloseTo(0.0995, 3);
  });
});

describe("混合 π 模型", () => {
  it("参数与 f_T ≈ β f_β", () => {
    const h = hybridPi({ IEQ: 1e-3, beta: 100, rbb: 200, fT: 300e6, Cmu: 2e-12 });
    expect(h.gm).toBeCloseTo(1 / 26, 9);
    expect(h.rbpe).toBeCloseTo(2626, 3);
    expect(h.Cpi).toBeCloseTo(1 / 26 / (2 * Math.PI * 300e6) - 2e-12, 18);
    expect((100 * h.fbeta) / 300e6).toBeCloseTo(100 / 101, 3);
    expect(cabs(betaOfF(100, h.fbeta, h.fbeta))).toBeCloseTo(100 / Math.SQRT2, 6);
  });
});

describe("单管共射", () => {
  const p: CEParams = { ...DEFAULT_DIVIDER, Re1: 0, Re2: 1.2e3, hasCe: true, Rs: 600, C1: 10e-6, C2: 10e-6, Ce: 100e-6 };
  it("米勒电容与 f_H", () => {
    const r = ceFrequency(p, { fT: 200e6, Cmu: 3e-12 });
    expect(r.CpiMiller).toBeGreaterThan(r.hpi.Cpi + 50 * 3e-12);
    expect(r.fH).toBeGreaterThan(1e5);
    expect(r.fH).toBeLessThan(1e7);
    const noM = ceFrequency(p, { fT: 200e6, Cmu: 3e-12 }, { miller: false });
    expect(noM.fH).toBeGreaterThan(r.fH * 2);
  });
  it("中频增益与 −3 dB 带宽", () => {
    const r = ceFrequency(p, { fT: 200e6, Cmu: 3e-12 });
    const e = bandEdges(r.at, Math.sqrt(r.fL * r.fH));
    expect(e.Am).toBeCloseTo(Math.abs(r.Ausm), 0);
    expect(e.fH / r.fH).toBeCloseTo(1, 1);
    expect(e.fL).toBeGreaterThan(Math.max(r.hp.fC1, r.hp.fCe) * 0.9);
  });
});

describe("多级", () => {
  it("n 级相同：精确公式与数值一致，估算公式误差在 10% 内", () => {
    const n = 3;
    const resp = poleResponse(1, [100, 100, 100], [1e5, 1e5, 1e5]);
    const e = bandEdges(resp, 3e3);
    const ex = identicalStages(n, 100, 1e5);
    expect(e.fH / ex.fH).toBeCloseTo(1, 1);
    expect(e.fL / ex.fL).toBeCloseTo(1, 1);
    const est = multistageEstimate([100, 100, 100], [1e5, 1e5, 1e5]);
    expect(Math.abs(est.fH / ex.fH - 1)).toBeLessThan(0.1);
    expect(Math.abs(est.fL / ex.fL - 1)).toBeLessThan(0.1);
  });
});
