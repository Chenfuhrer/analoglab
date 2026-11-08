import { describe, expect, it } from "vitest";
import { builtInPotential, carriers, depletionWidth, intrinsicDensity, temperatureForNi, thermalVoltage } from "./carriers";

describe("载流子统计", () => {
  it("300 K 参考值与 U_T", () => {
    expect(intrinsicDensity(300, "Si")).toBeCloseTo(1.4e10, -7);
    expect(intrinsicDensity(300, "Ge")).toBeCloseTo(2.4e13, -10);
    expect(thermalVoltage(300)).toBeCloseTo(0.02585, 4);
  });
  it("硅的 n_i 随温度指数增长：每升高约 8–10 K 翻倍", () => {
    const r = intrinsicDensity(310) / intrinsicDensity(300);
    expect(r).toBeGreaterThan(1.8);
    expect(r).toBeLessThan(2.3);
    expect(intrinsicDensity(400) / intrinsicDensity(300)).toBeGreaterThan(200);
  });
  it("反求温度", () => {
    const T = temperatureForNi(1e14);
    expect(intrinsicDensity(T)).toBeCloseTo(1e14, -9);
    expect(T).toBeGreaterThan(450);
  });
  it("锗的 n_i 远大于硅", () => expect(intrinsicDensity(300, "Ge") / intrinsicDensity(300, "Si")).toBeGreaterThan(1e3));
  it("质量作用定律 np = n_i² 与多子近似", () => {
    const c = carriers(1e16, 0);
    expect(c.type).toBe("N");
    expect(c.n).toBeCloseTo(1e16, -10);
    expect((c.n * c.p) / (c.ni * c.ni)).toBeCloseTo(1, 6);
    expect(c.p).toBeCloseTo(1.96e4, -2);
    const pc = carriers(0, 1e17);
    expect(pc.type).toBe("P");
    expect(pc.minority).toBeCloseTo((1.4e10) ** 2 / 1e17, -1);
  });
  it("补偿：N_D = N_A 时接近本征", () => {
    const c = carriers(1e16, 1e16);
    expect(c.type).toBe("intrinsic");
    expect(c.n).toBeCloseTo(c.ni, -5);
  });
  it("高温时掺杂半导体趋于本征", () => {
    const c = carriers(1e14, 0, 600);
    expect(c.p / c.n).toBeGreaterThan(0.1);
  });
  it("接触电位差与耗尽层宽度", () => {
    const Vbi = builtInPotential(1e17, 1e16);
    expect(Vbi).toBeGreaterThan(0.7);
    expect(Vbi).toBeLessThan(0.8);
    const w0 = depletionWidth(0, 1e17, 1e16);
    const wr = depletionWidth(-10, 1e17, 1e16);
    const wf = depletionWidth(0.5, 1e17, 1e16);
    expect(wr.W).toBeGreaterThan(w0.W);
    expect(wf.W).toBeLessThan(w0.W);
    // 轻掺杂一侧更宽
    expect(w0.xn / w0.xp).toBeCloseTo(10, 6);
    // 量级：零偏约 0.3 µm
    expect(w0.W).toBeGreaterThan(0.2e-4);
    expect(w0.W).toBeLessThan(0.5e-4);
  });
});
