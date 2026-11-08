/**
 * 题目构造辅助函数：让各章题库写得紧凑、一致。
 * - choice / judge / concept：固定题
 * - gen：参数化题（同一 seed 必然生成同一道题）
 * 所有数值题的标准答案必须由 src/simulations 计算核心给出。
 */
import type { DerivStep } from "@/components/math/Derivation";
import type { Dim } from "@/simulations/units";
import { rng } from "./generators";
import type { DiagramRef, Level, MistakePattern, NumericPart, Question, QuestionTemplate } from "./types";

export type Rng = ReturnType<typeof rng>;

interface Meta {
  id: string;
  topic: string;
  title: string;
  level?: Level;
}

export function choice(
  m: Meta & { prompt: string; options: string[]; answer: number; why: string[]; hints: string[]; solution?: string; diagram?: DiagramRef },
): QuestionTemplate {
  const level = m.level ?? 1;
  const q: Question = {
    key: m.id,
    id: m.id,
    level,
    topic: m.topic,
    title: m.title,
    prompt: m.prompt,
    diagram: m.diagram,
    body: { kind: "choice", options: m.options, answer: m.answer, why: m.why },
    hints: m.hints,
    solution: m.solution ?? m.why[m.answer],
  };
  return { id: m.id, level, topic: m.topic, title: m.title, fixed: q };
}

export function judge(m: Meta & { prompt: string; answer: boolean; why: string; hints: string[]; diagram?: DiagramRef }): QuestionTemplate {
  const level = m.level ?? 1;
  const q: Question = {
    key: m.id,
    id: m.id,
    level,
    topic: m.topic,
    title: m.title,
    prompt: m.prompt,
    diagram: m.diagram,
    body: { kind: "judge", answer: m.answer, why: m.why },
    hints: m.hints,
    solution: m.why,
  };
  return { id: m.id, level, topic: m.topic, title: m.title, fixed: q };
}

export function concept(m: Meta & { prompt: string; keyPoints: string[]; reference: string; hints?: string[]; diagram?: DiagramRef }): QuestionTemplate {
  const level = m.level ?? 1;
  const q: Question = {
    key: m.id,
    id: m.id,
    level,
    topic: m.topic,
    title: m.title,
    prompt: m.prompt,
    diagram: m.diagram,
    body: { kind: "concept", keyPoints: m.keyPoints, reference: m.reference },
    hints: m.hints ?? ["先想清楚涉及哪条物理规律或哪个器件模型。"],
    solution: m.reference,
  };
  return { id: m.id, level, topic: m.topic, title: m.title, fixed: q };
}

/** 数值空 */
export function num(
  id: string,
  label: string,
  expected: number,
  dim: Dim,
  unitHint: string,
  opts: { mistakes?: MistakePattern[]; alts?: number[]; tol?: number; signMessage?: string } = {},
): NumericPart {
  return { id, label, expected, dim, unitHint, ...opts };
}

export interface GenOut {
  prompt: string;
  parts?: NumericPart[];
  /** 生成选择题（如“判断工作区”） */
  choice?: { options: string[]; answer: number; why: string[] };
  hints: string[];
  solution: string;
  solutionSteps?: DerivStep[];
  diagram?: DiagramRef;
  /** 共射类电路图（复用共射原理图） */
  figure?: Question["figure"];
}

/** 参数化题目 */
export function gen(m: Meta & { level: Level }, make: (g: Rng, seed: number) => GenOut): QuestionTemplate {
  return {
    id: m.id,
    level: m.level,
    topic: m.topic,
    title: m.title,
    generate(seed) {
      const o = make(rng(seed * 7919 + m.id.length), seed);
      const body: Question["body"] = o.choice
        ? { kind: "choice", options: o.choice.options, answer: o.choice.answer, why: o.choice.why }
        : { kind: "numeric", parts: o.parts ?? [] };
      return {
        key: `${m.id}:${seed}`,
        id: m.id,
        seed,
        level: m.level,
        topic: m.topic,
        title: m.title,
        prompt: o.prompt,
        diagram: o.diagram,
        figure: o.figure,
        body,
        hints: o.hints,
        solution: o.solution,
        solutionSteps: o.solutionSteps,
      };
    },
  };
}

/** 题干中的物理量（LaTeX 友好） */
export { formatSI as fq } from "@/simulations/units";
