/**
 * 确定性判题器：量纲检查 → 数值比较 → 常见错误匹配。AI 不参与判分。
 */
import { DIM_NAME, formatSI, isParseError, parseQuantity, sig } from "@/simulations/units";
import type { NumericPart } from "./types";

export type GradeCode = "ok" | "ok_note" | "empty" | "parse" | "unknown_unit" | "no_unit" | "wrong_dim" | "sign" | "prefix_scale" | "mistake" | "off";

export interface PartGrade {
  correct: boolean;
  code: GradeCode;
  message: string;
  value?: number;
}

const DEFAULT_TOL = 0.03;

function near(x: number, target: number, tol: number): boolean {
  if (target === 0) return Math.abs(x) <= 1e-12;
  return Math.abs(x - target) <= tol * Math.abs(target);
}

export function gradeNumeric(part: NumericPart, input: string): PartGrade {
  const tol = part.tol ?? DEFAULT_TOL;
  if (!input.trim()) return { correct: false, code: "empty", message: "请填写答案。" };
  const q = parseQuantity(input);
  if (isParseError(q)) {
    if (q.error === "unknown_unit")
      return { correct: false, code: "unknown_unit", message: `无法识别单位“${q.unit}”。可用写法如：${part.unitHint}、kΩ、kohm、mA、µA（或 uA）、V、mV、千欧。` };
    return { correct: false, code: "parse", message: "无法识别为数值，请输入如 “2.02 mA” 的形式。" };
  }
  let note = "";
  if (part.dim === "1") {
    if (q.dim && q.dim !== "1") return { correct: false, code: "wrong_dim", message: `本空是无量纲的比值，不应带单位“${DIM_NAME[q.dim]}”。` };
    if (q.prefixOnly) return { correct: false, code: "wrong_dim", message: "本空是无量纲的比值，不应带单位前缀。" };
  } else {
    if (q.prefixOnly) {
      if (part.dim === "Ω") note = "（建议写全单位，如 kΩ）";
      else return { correct: false, code: "no_unit", message: `缺少单位：请写成如 ${part.unitHint} 的形式。` };
    } else if (!q.dim) {
      return { correct: false, code: "no_unit", message: `缺少单位。物理量必须带单位，本空单位是${DIM_NAME[part.dim]}，例如 ${part.unitHint}。` };
    } else if (q.dim !== part.dim) {
      return { correct: false, code: "wrong_dim", message: `量纲错误：本空应为${DIM_NAME[part.dim]}，你填写的是${DIM_NAME[q.dim]}。` };
    }
  }
  const x = q.value;
  const targets = [part.expected, ...(part.alts ?? [])];
  if (targets.some((t) => near(x, t, tol))) {
    return { correct: true, code: note ? "ok_note" : "ok", message: `正确${note}。`, value: x };
  }
  if (part.expected !== 0 && near(-x, part.expected, tol)) {
    return { correct: false, code: "sign", message: part.signMessage ?? "数值大小正确，但符号错误。", value: x };
  }
  for (const m of part.mistakes ?? []) {
    if (near(x, m.value, m.tol ?? tol) && !near(m.value, part.expected, tol)) {
      return { correct: false, code: "mistake", message: m.message, value: x };
    }
  }
  const ratio = Math.abs(x / part.expected);
  for (const k of [1e3, 1e-3, 1e6, 1e-6]) {
    if (Math.abs(ratio / k - 1) <= tol) {
      return { correct: false, code: "prefix_scale", message: `数量级相差 ${k >= 1 ? k : 1 / k} 倍：检查单位前缀（m/µ、k/M）是否写错。`, value: x };
    }
  }
  const dev = ((x - part.expected) / Math.abs(part.expected)) * 100;
  return {
    correct: false,
    code: "off",
    message: `与正确结果相差 ${sig(Math.abs(dev), 2)}%（${dev > 0 ? "偏大" : "偏小"}）。对照提示检查公式与代入的数值。`,
    value: x,
  };
}

/** 用于“正确答案”显示 */
export function formatAnswer(part: NumericPart): string {
  if (part.dim === "1") return sig(part.expected, 4);
  return formatSI(part.expected, part.dim, 4);
}
