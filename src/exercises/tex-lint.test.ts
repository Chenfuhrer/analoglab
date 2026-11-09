import katex from "katex";
import { describe, expect, it } from "vitest";
import { TEX_MACROS } from "@/components/math/Tex";
import { ALL_TEMPLATES } from "./bank";
import { FORMULAS } from "@/formulas/library";
import { UNITS } from "@/content/course";
import { UNIT_HINTS } from "@/lessons/hints";
import { MISCONCEPTION_IDS, MISCONCEPTIONS } from "./misconceptions";
import type { Question } from "./types";

const TOKEN = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;

function texErrors(text: string): string[] {
  const errs: string[] = [];
  if (/[\u0008\u0009\u000b\u000c\u000d]/.test(text)) errs.push(`控制字符（可能是未转义的反斜杠）：${JSON.stringify(text.slice(0, 80))}`);
  for (const m of text.matchAll(TOKEN)) {
    const src = m[1] ?? m[2];
    try {
      katex.renderToString(src, { throwOnError: true, strict: "ignore", macros: { ...TEX_MACROS }, displayMode: Boolean(m[1]) });
    } catch (e) {
      errs.push(`${src} → ${(e as Error).message.slice(0, 120)}`);
    }
  }
  return errs;
}

function strings(q: Question): string[] {
  const out = [q.title, q.prompt, q.solution, ...q.hints];
  const b = q.body;
  if (b.kind === "choice") out.push(...b.options, ...b.why);
  if (b.kind === "judge") out.push(b.why);
  if (b.kind === "numeric") for (const p of b.parts) out.push(p.label, ...(p.mistakes ?? []).map((m) => m.message), p.signMessage ?? "");
  if (b.kind === "concept") out.push(...b.keyPoints, b.reference);
  for (const s of q.solutionSteps ?? []) out.push(s.why, s.approx ?? "", s.units ?? "");
  return out;
}

describe("题库与内容中的公式都能被 KaTeX 正确渲染", () => {
  it("全部题目（参数化题取 5 个种子）", () => {
    const bad: string[] = [];
    for (const t of ALL_TEMPLATES) {
      const qs = t.fixed ? [t.fixed] : [1, 2, 3, 17, 99].map((s) => t.generate!(s));
      for (const q of qs) for (const s of strings(q)) for (const e of texErrors(s)) bad.push(`${q.key}: ${e}`);
    }
    expect(bad).toEqual([]);
  });
  it("公式库", () => {
    const bad: string[] = [];
    for (const f of FORMULAS) {
      try {
        katex.renderToString(f.tex, { throwOnError: true, strict: "ignore", macros: { ...TEX_MACROS }, displayMode: true });
      } catch (e) {
        bad.push(`${f.id}: ${(e as Error).message.slice(0, 100)}`);
      }
      for (const c of f.conditions) for (const e of texErrors(c)) bad.push(`${f.id}: ${e}`);
    }
    expect(bad).toEqual([]);
  });
  it("错因分类表", () => {
    const bad: string[] = [];
    for (const id of MISCONCEPTION_IDS) for (const e of texErrors(MISCONCEPTIONS[id].explain)) bad.push(`${id}: ${e}`);
    expect(bad).toEqual([]);
  });
  it("课程目录与离线提示", () => {
    const bad: string[] = [];
    for (const u of UNITS) for (const s of [u.summary, ...u.objectives, ...(u.sections ?? []).flatMap((x) => [x.title, ...(x.questions ?? [])])]) for (const e of texErrors(s)) bad.push(`${u.id}: ${e}`);
    for (const [id, h] of Object.entries(UNIT_HINTS)) for (const s of [h.intuition, h.derivation, h.example]) for (const e of texErrors(s)) bad.push(`${id}: ${e}`);
    expect(bad).toEqual([]);
  });
});

import { LESSON_IDS } from "@/lessons/lesson-ids";
import { readFileSync } from "node:fs";
describe("站内链接", () => {
  it("每条公式都链接到存在的单元与知识点", () => {
    const bad: string[] = [];
    for (const f of FORMULAS) {
      if (!f.ref) {
        bad.push(`${f.id}: 无 ref`);
        continue;
      }
      const [u, s] = f.ref.split("#");
      const unit = UNITS.find((x) => x.id === u);
      if (!unit || !LESSON_IDS.has(u) || !unit.sections?.some((x) => x.id === s)) bad.push(`${f.id}: ${f.ref}`);
    }
    expect(bad).toEqual([]);
  });
  it("实验室页面中的课程锚点都存在", () => {
    const src = readFileSync("src/app/lab/page.tsx", "utf8");
    const bad: string[] = [];
    for (const m of src.matchAll(/"\/learn\/([a-z0-9-]+)#([a-z0-9-]+)"/g)) {
      const unit = UNITS.find((x) => x.id === m[1]);
      if (!unit || !unit.sections?.some((x) => x.id === m[2])) bad.push(`${m[1]}#${m[2]}`);
    }
    expect(bad).toEqual([]);
  });
  it("所有已上线单元都有课程正文", () => {
    for (const u of UNITS.filter((x) => x.status === "complete")) expect(LESSON_IDS.has(u.id), u.id).toBe(true);
  });
});
