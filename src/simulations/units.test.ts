import { describe, expect, it } from "vitest";
import { formatSI, isParseError, parseQuantity, par, sig } from "./units";

function ok(s: string) {
  const r = parseQuantity(s);
  if (isParseError(r)) throw new Error(`parse failed: ${s}`);
  return r;
}

describe("parseQuantity", () => {
  const cases: Array<[string, number, string | null]> = [
    ["2.3mA", 2.3e-3, "A"],
    ["2.3 mA", 2.3e-3, "A"],
    ["20µA", 20e-6, "A"],
    ["20uA", 20e-6, "A"],
    ["20 微安", 20e-6, "A"],
    ["2毫安", 2e-3, "A"],
    ["5.1kΩ", 5.1e3, "Ω"],
    ["5.1 kohm", 5.1e3, "Ω"],
    ["5.1千欧", 5.1e3, "Ω"],
    ["4k7Ω", 4.7e3, "Ω"],
    ["1MΩ", 1e6, "Ω"],
    ["6V", 6, "V"],
    ["600 mV", 0.6, "V"],
    ["−120", -120, null],
    ["-7.5", -7.5, null],
    ["1.2e-3 A", 1.2e-3, "A"],
    ["10kHz", 1e4, "Hz"],
    ["100uF", 100e-6, "F"],
    ["40 dB", 40, "dB"],
  ];
  for (const [s, v, d] of cases) {
    it(`"${s}" → ${v} ${d ?? "(无单位)"}`, () => {
      const r = ok(s);
      expect(Math.abs(r.value - v)).toBeLessThanOrEqual(Math.abs(v) * 1e-12);
      expect(r.dim).toBe(d);
    });
  }
  it("只写前缀：3.3k → prefixOnly", () => {
    const r = ok("3.3k");
    expect(r.prefixOnly).toBe(true);
    expect(r.value).toBeCloseTo(3300);
  });
  it("非法输入", () => {
    expect(isParseError(parseQuantity(""))).toBe(true);
    expect(isParseError(parseQuantity("abc"))).toBe(true);
    expect(isParseError(parseQuantity("5 bananas"))).toBe(true);
  });
});

describe("format", () => {
  it("formatSI", () => {
    expect(formatSI(0.00235, "A")).toBe("2.35 mA");
    expect(formatSI(565000, "Ω")).toBe("565 kΩ");
    expect(formatSI(20e-6, "A")).toBe("20 µA");
    expect(formatSI(1400, "Ω")).toBe("1.4 kΩ");
    expect(formatSI(0.5, "Ω")).toBe("0.5 Ω");
    expect(formatSI(-6, "V")).toBe("−6 V");
  });
  it("sig", () => {
    expect(sig(-107.142857, 4)).toBe("−107.1");
    expect(sig(Infinity)).toBe("∞");
  });
  it("par", () => {
    expect(par(3e3, 3e3)).toBe(1500);
    expect(par(3e3, Infinity)).toBe(3e3);
    expect(par(0, 5)).toBe(0);
  });
});

describe("电压显示习惯", () => {
  it("0.1 V 以上写 V，以下写 mV", () => {
    expect(formatSI(0.7, "V")).toBe("0.7 V");
    expect(formatSI(0.3, "V")).toBe("0.3 V");
    expect(formatSI(0.026, "V")).toBe("26 mV");
  });
});
