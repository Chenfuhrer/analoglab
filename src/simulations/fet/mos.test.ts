import { describe, expect, it } from "vitest";
import { analyzeCD, analyzeCG, analyzeCS, DEFAULT_CS, DEFAULT_CS_SELF, DEFAULT_NDEP, DEFAULT_NENH, drainCurrent, fetRegion, gmTextbook, kCoef, outputResistance, solveFETQ, transconductance, transferCurrent } from "./mos";

describe("平方律模型", () => {
  it("增强型：u_GS = 2U_th 时 i_D = I_DO；u_GS ≤ U_th 截止", () => {
    expect(transferCurrent(DEFAULT_NENH, 4)).toBeCloseTo(2e-3, 12);
    expect(transferCurrent(DEFAULT_NENH, 1.9)).toBe(0);
  });
  it("耗尽型：u_GS = 0 时 i_D = I_DSS；u_GS = U_off 时夹断", () => {
    expect(transferCurrent(DEFAULT_NDEP, 0)).toBeCloseTo(4e-3, 12);
    expect(transferCurrent(DEFAULT_NDEP, -2)).toBe(0);
    expect(transferCurrent(DEFAULT_NDEP, 1)).toBeCloseTo(4e-3 * 2.25, 12);
  });
  it("输出特性在预夹断点连续", () => {
    const ov = 1.5;
    const ugs = DEFAULT_NENH.Vt + ov;
    expect(drainCurrent(DEFAULT_NENH, ugs, ov - 1e-9)).toBeCloseTo(drainCurrent(DEFAULT_NENH, ugs, ov + 1e-9), 9);
    expect(fetRegion(DEFAULT_NENH, ugs, 1)).toBe("ohmic");
    expect(fetRegion(DEFAULT_NENH, ugs, 2)).toBe("saturation");
    expect(fetRegion(DEFAULT_NENH, 1, 5)).toBe("cutoff");
  });
  it("P 沟道：电压取反", () => {
    const p = { ...DEFAULT_NENH, kind: "p-enh" as const, Vt: -2 };
    expect(drainCurrent(p, -4, -5)).toBeCloseTo(-2e-3, 12);
    expect(fetRegion(p, -1, -5)).toBe("cutoff");
  });
  it("g_m 三种写法一致", () => {
    const ID = 1e-3;
    const g1 = transconductance(DEFAULT_NENH, ID);
    expect(g1).toBeCloseTo(gmTextbook(DEFAULT_NENH, ID), 12);
    // 数值求导
    const ugs = DEFAULT_NENH.Vt + Math.sqrt(ID / kCoef(DEFAULT_NENH));
    const d = (transferCurrent(DEFAULT_NENH, ugs + 1e-6) - transferCurrent(DEFAULT_NENH, ugs - 1e-6)) / 2e-6;
    expect(d).toBeCloseTo(g1, 6);
    expect(outputResistance({ ...DEFAULT_NENH, lambda: 0.01 }, 1e-3)).toBeCloseTo(1e5, 6);
  });
});

describe("偏置电路", () => {
  it("分压偏置：满足两个方程", () => {
    const q = solveFETQ(DEFAULT_CS);
    expect(q.UGQ).toBeCloseTo(3.75, 9);
    expect(q.UGSQ).toBeCloseTo(q.UGQ - q.IDQ * 1e3, 9);
    expect(q.IDQ).toBeCloseTo(transferCurrent(DEFAULT_NENH, q.UGSQ), 9);
    expect(q.region).toBe("saturation");
    expect(q.rejected!).toBeLessThan(DEFAULT_NENH.Vt);
  });
  it("自给偏压（耗尽型）：U_GS = −I_D R_s", () => {
    const q = solveFETQ(DEFAULT_CS_SELF);
    expect(q.UGSQ).toBeLessThan(0);
    expect(q.UGSQ).toBeCloseTo(-q.IDQ * 500, 9);
    expect(q.IDQ).toBeCloseTo(transferCurrent(DEFAULT_NDEP, q.UGSQ), 9);
  });
  it("R_d 过大进入可变电阻区，数值解自洽", () => {
    const q = solveFETQ({ ...DEFAULT_CS, Rd: 30e3 });
    expect(q.region).toBe("ohmic");
    expect(drainCurrent(DEFAULT_NENH, q.UGSQ, q.UDSQ)).toBeCloseTo(q.IDQ, 8);
  });
});

describe("三种组态", () => {
  it("共源/共漏/共栅", () => {
    const cs = analyzeCS(DEFAULT_CS);
    const q = cs.q;
    expect(cs.ac.Au).toBeCloseTo(-q.gm * (3e3 * 10e3) / 13e3, 9);
    expect(cs.ac.Ri).toBeCloseTo(1e6 + 75e3, 6);
    const un = analyzeCS({ ...DEFAULT_CS, bypass: false });
    expect(un.ac.Au).toBeCloseTo(cs.ac.Au / (1 + q.gm * 1e3), 9);
    const cd = analyzeCD({ ...DEFAULT_CS, Rd: 0, Rs: 2e3, RL: Infinity });
    expect(cd.ac.Au).toBeGreaterThan(0.5);
    expect(cd.ac.Au).toBeLessThan(1);
    expect(cd.ac.Ro).toBeCloseTo(1 / (1 / 2e3 + cd.q.gm), 9);
    const cg = analyzeCG(DEFAULT_CS);
    expect(cg.ac.Au).toBeCloseTo(-cs.ac.Au, 9);
    expect(cg.ac.Ri).toBeLessThan(1e3);
  });
});
