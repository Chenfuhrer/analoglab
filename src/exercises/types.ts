import type { CEMode } from "@/circuits/ce-parts";
import type { DerivStep } from "@/components/math/Derivation";
import type { CEParams } from "@/simulations/bjt/types";
import type { Dim } from "@/simulations/units";
import { CE_SECTIONS, UNITS } from "@/content/course";
import type { MisconceptionId } from "./misconceptions";

/** 通用电路图引用：由 src/components/circuit/diagrams 注册表渲染 */
export interface DiagramRef {
  id: string;
  /** 元件旁的数值标注，如 { R: "1 kΩ" } */
  labels?: Record<string, string>;
  caption?: string;
}

export type Level = 1 | 2 | 3;

export interface ChoiceBody {
  kind: "choice";
  options: string[];
  answer: number;
  /** 每个选项的解释（为什么对/为什么错） */
  why: string[];
  /** 选中某个错误选项时对应的错因（与 options 对齐；null 表示不归类） */
  tags?: (MisconceptionId | null)[];
}

export interface JudgeBody {
  kind: "judge";
  answer: boolean;
  why: string;
  /** 判断错误时对应的错因 */
  wrongTag?: MisconceptionId;
}

/** 常见错误：按错误思路算出的数值 + 本题的具体说明 + 所属错因 */
export interface MistakePattern {
  value: number;
  message: string;
  /** 错因分类（见 misconceptions.ts） */
  tag: MisconceptionId;
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
  diagram?: DiagramRef;
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

const CE_TOPIC_LABEL: Record<string, string> = {
  "ce-why": "放大原理",
  "ce-bias": "偏置与 Q 点",
  "ce-dc": "直流分析",
  "ce-ac": "交流通路",
  "ce-hparam": "微变等效",
  "ce-gain": "电压放大倍数",
  "ce-rio": "输入输出电阻",
  "ce-distortion": "失真与负载线",
  "ce-example": "共射综合分析",
};

/**
 * 练习的“知识点”标签。共射单元按知识点（section）细分；其余单元以单元 id 作为知识点。
 */
export const TOPIC_LABEL: Record<string, string> = {
  ...CE_TOPIC_LABEL,
  ...Object.fromEntries(UNITS.filter((u) => u.id !== "ce-amplifier").map((u) => [u.id, u.title])),
};

const CE_SECTION_IDS = new Set(CE_SECTIONS.map((s) => s.id));

/** 知识点 → 所属单元 id */
export function topicUnit(topic: string): string {
  return CE_SECTION_IDS.has(topic) ? "ce-amplifier" : topic;
}

/** 知识点 → 章号 */
export function topicChapter(topic: string): number {
  return UNITS.find((u) => u.id === topicUnit(topic))?.chapter ?? 0;
}

/** 知识点对应的课程位置（链接） */
export function topicHref(topic: string): string {
  const u = topicUnit(topic);
  return u === "ce-amplifier" ? `/learn/ce-amplifier#${topic}` : `/learn/${u}`;
}

export const LEVEL_LABEL: Record<Level, string> = {
  1: "Level 1 · 概念理解",
  2: "Level 2 · 基础计算",
  3: "Level 3 · 综合分析",
};
