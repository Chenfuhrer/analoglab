/**
 * 物理量的单位解析与格式化。
 * 所有内部计算使用 SI 基本单位（V、A、Ω、W、Hz、F、s）。
 */

export type Dim = "V" | "A" | "Ω" | "W" | "Hz" | "F" | "s" | "1" | "dB";

export const DIM_NAME: Record<Dim, string> = {
  V: "电压 (V)",
  A: "电流 (A)",
  Ω: "电阻 (Ω)",
  W: "功率 (W)",
  Hz: "频率 (Hz)",
  F: "电容 (F)",
  s: "时间 (s)",
  "1": "无量纲",
  dB: "分贝 (dB)",
};

const PREFIX: Record<string, number> = {
  p: 1e-12,
  n: 1e-9,
  u: 1e-6,
  µ: 1e-6,
  μ: 1e-6,
  m: 1e-3,
  "": 1,
  k: 1e3,
  K: 1e3,
  M: 1e6,
  G: 1e9,
};

/** 单位符号（含中文写法）→ 量纲 + 额外倍率 */
const UNIT_ALIASES: Array<[string, Dim, number]> = [
  // 中文（先匹配长的）
  ["千欧姆", "Ω", 1e3],
  ["兆欧姆", "Ω", 1e6],
  ["千欧", "Ω", 1e3],
  ["兆欧", "Ω", 1e6],
  ["欧姆", "Ω", 1],
  ["欧", "Ω", 1],
  ["毫安", "A", 1e-3],
  ["微安", "A", 1e-6],
  ["安培", "A", 1],
  ["安", "A", 1],
  ["毫伏", "V", 1e-3],
  ["微伏", "V", 1e-6],
  ["千伏", "V", 1e3],
  ["伏特", "V", 1],
  ["伏", "V", 1],
  ["毫瓦", "W", 1e-3],
  ["瓦", "W", 1],
  ["千赫兹", "Hz", 1e3],
  ["千赫", "Hz", 1e3],
  ["赫兹", "Hz", 1],
  ["赫", "Hz", 1],
  ["微法", "F", 1e-6],
  ["法", "F", 1],
  ["毫秒", "s", 1e-3],
  ["秒", "s", 1],
  ["分贝", "dB", 1],
  ["倍", "1", 1],
  // 英文/符号
  ["ohms", "Ω", 1],
  ["ohm", "Ω", 1],
  ["Ohm", "Ω", 1],
  ["Ω", "Ω", 1],
  ["Ω", "Ω", 1], // U+2126 OHM SIGN
  ["dB", "dB", 1],
  ["Hz", "Hz", 1],
  ["hz", "Hz", 1],
  ["V", "V", 1],
  ["v", "V", 1],
  ["A", "A", 1],
  ["W", "W", 1],
  ["F", "F", 1],
  ["s", "s", 1],
];

export interface ParsedQuantity {
  /** SI 数值 */
  value: number;
  /** 识别到的量纲；null 表示没有写单位 */
  dim: Dim | null;
  /** 只写了前缀没写单位（如 "3.3k"） */
  prefixOnly: boolean;
  raw: string;
}

export type ParseError = { error: "empty" | "not_a_number" | "unknown_unit"; raw: string; unit?: string };

const NUM_RE = /^[+\-−–]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+\-−]?\d+)?/;

/**
 * 解析 "2.3mA"、"2.3 mA"、"−120"、"5.1kΩ"、"3.3k"、"20 微安"、"1.2e-3 A"、"4k7" 等。
 */
export function parseQuantity(input: string): ParsedQuantity | ParseError {
  const raw = input;
  let s = input.trim().replace(/，/g, ",").replace(/\s+/g, "");
  if (!s) return { error: "empty", raw };
  s = s.replace(/^[−–]/, "-");
  // 电子工程写法 4k7 = 4.7k
  const rkm = /^(\d+)([kKmMR])(\d+)(.*)$/.exec(s);
  if (rkm) {
    const p = rkm[2] === "R" ? "" : rkm[2];
    s = `${rkm[1]}.${rkm[3]}${p}${rkm[4]}`;
  }
  const m = NUM_RE.exec(s);
  if (!m) return { error: "not_a_number", raw };
  const num = Number(m[0].replace(/[−]/g, "-"));
  if (!Number.isFinite(num)) return { error: "not_a_number", raw };
  let rest = s.slice(m[0].length);
  if (rest === "" || rest === "x" || rest === "×") return { value: num, dim: null, prefixOnly: false, raw };

  // 先尝试整体匹配单位别名（无前缀）
  for (const [alias, dim, mul] of UNIT_ALIASES) {
    if (rest === alias) return { value: num * mul, dim, prefixOnly: false, raw };
  }
  // 再尝试 前缀 + 单位
  const first = rest[0];
  if (first in PREFIX && first !== "") {
    const after = rest.slice(1);
    if (after === "") {
      return { value: num * PREFIX[first], dim: null, prefixOnly: true, raw };
    }
    for (const [alias, dim, mul] of UNIT_ALIASES) {
      if (after === alias) {
        // "m" + "s" 等价 ms；"M"+"Ω"
        return { value: num * PREFIX[first] * mul, dim, prefixOnly: false, raw };
      }
    }
  }
  // "kohm" 已被上面覆盖；处理 "mV" 中 m 与 M 的大小写误用不做猜测
  rest = rest.trim();
  return { error: "unknown_unit", raw, unit: rest };
}

export function isParseError(x: ParsedQuantity | ParseError): x is ParseError {
  return (x as ParseError).error !== undefined;
}

const SI_STEPS: Array<[number, string]> = [
  [1e9, "G"],
  [1e6, "M"],
  [1e3, "k"],
  [1, ""],
  [1e-3, "m"],
  [1e-6, "µ"],
  [1e-9, "n"],
  [1e-12, "p"],
];

/** 有效数字格式化（去掉多余的尾零） */
export function sig(x: number, digits = 3): string {
  if (!Number.isFinite(x)) return x > 0 ? "∞" : x < 0 ? "−∞" : "—";
  if (x === 0) return "0";
  const s = Number(x.toPrecision(digits)).toString();
  return s.replace("-", "−");
}

/**
 * 工程格式：formatSI(0.00235, "A") → "2.35 mA"
 * 电阻在 kΩ 量级时使用 k，不使用 m（毫欧）以下前缀以免误读。
 */
export function formatSI(value: number, unit: string, digits = 3): string {
  if (!Number.isFinite(value)) return value > 0 ? `∞` : "—";
  if (value === 0) return `0 ${unit}`.trim();
  const abs = Math.abs(value);
  let chosen: [number, string] = [1, ""];
  for (const step of SI_STEPS) {
    if (abs >= step[0] * 0.9995) {
      chosen = step;
      break;
    }
    chosen = step;
  }
  if (unit === "Ω" && chosen[0] < 1) chosen = [1, ""];
  // 教材习惯：0.1 V 以上的电压写成 V（如 0.7 V 而不是 700 mV）
  if (unit === "V" && abs >= 0.1 && chosen[0] < 1) chosen = [1, ""];
  const scaled = value / chosen[0];
  return `${sig(scaled, digits)} ${chosen[1]}${unit}`.trim();
}

/** 格式化到指定前缀，例如 formatIn(0.002, 'm', 'A') → "2.00 mA" */
export function formatIn(value: number, prefix: string, unit: string, digits = 3): string {
  const mul = PREFIX[prefix] ?? 1;
  return `${sig(value / mul, digits)} ${prefix}${unit}`;
}

export function prefixMultiplier(prefix: string): number {
  return PREFIX[prefix] ?? 1;
}

/** 并联 */
export function par(...rs: number[]): number {
  let g = 0;
  for (const r of rs) {
    if (r === 0) return 0;
    if (Number.isFinite(r)) g += 1 / r;
  }
  return g === 0 ? Infinity : 1 / g;
}

export const dB = (gain: number) => 20 * Math.log10(Math.abs(gain));
