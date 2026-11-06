import type { CEMode } from "@/circuits/ce-parts";
import type { DerivStep } from "@/components/math/Derivation";
import type { CEParams } from "@/simulations/bjt/types";
import type { Dim } from "@/simulations/units";

export type Level = 1 | 2 | 3;

export interface ChoiceBody {
  kind: "choice";
  options: string[];
  answer: number;
  /** 每个选项的解释（为什么对/为什么错） */
  why: string[];
}

export interface JudgeBody {
  kind: "judge";
  answer: boolean;
  why: string;
}

/** 常见错误：用错误公式反算出的数值 + 诊断信息 */
export interface MistakePattern {
  value: number;
  message: string;
  tol?: number;
}

export interface NumericPart {
  id: string;
  label: string;
  expected: number;
  /** 其他同样接受的答案（如估算法与精确解） */
  alts?: number[];
  dim: Dim;
  /** 相对容差，默认 3% */
  tol?: number;
  unitHint: string;
  mistakes?: MistakePattern[];
  /** 数值正确但符号相反时的提示 */
  signMessage?: string;
}

export interface NumericBody {
  kind: "numeric";
  parts: NumericPart[];
}

export interface ConceptBody {
  kind: "concept";
  keyPoints: string[];
  reference: string;
}

export type QuestionBody = ChoiceBody | JudgeBody | NumericBody | ConceptBody;

export interface Question {
  /** 实例键：静态题为 id，参数化题为 id:seed */
  key: string;
  id: string;
  level: Level;
  topic: string;
  title: string;
  prompt: string;
  figure?: { params: CEParams; mode?: CEMode; caption?: string };
  body: QuestionBody;
  hints: string[];
  solution: string;
  solutionSteps?: DerivStep[];
  seed?: number;
}

export interface QuestionTemplate {
  id: string;
  level: Level;
  topic: string;
  title: string;
  /** 参数化题目 */
  generate?: (seed: number) => Question;
  /** 固定题目 */
  fixed?: Question;
}

export const TOPIC_LABEL: Record<string, string> = {
  "ce-why": "放大原理",
  "ce-bias": "偏置与 Q 点",
  "ce-dc": "直流分析",
  "ce-ac": "交流通路",
  "ce-hparam": "微变等效",
  "ce-gain": "电压放大倍数",
  "ce-rio": "输入输出电阻",
  "ce-distortion": "失真与负载线",
  "ce-example": "综合分析",
};

export const LEVEL_LABEL: Record<Level, string> = {
  1: "Level 1 · 概念理解",
  2: "Level 2 · 基础计算",
  3: "Level 3 · 综合分析",
};
