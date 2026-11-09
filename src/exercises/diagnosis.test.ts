import { describe, expect, it } from "vitest";
import { UNITS } from "@/content/course";
import { LESSON_IDS } from "@/lessons/lesson-ids";
import { ALL_TEMPLATES } from "./bank";
import {
  applyDiagnosis,
  diagnoseChoice,
  diagnoseJudge,
  diagnoseNumeric,
  explicitTags,
  isResolved,
  partOpportunities,
  profileRows,
  RESOLVE_AFTER,
  templatesFor,
  templateTags,
  type MisconceptionStats,
} from "./diagnosis";
import { DEFAULT_TOL, gradeNumeric } from "./grader";
import { GROUP_ORDER, MISCONCEPTION_IDS, MISCONCEPTIONS, type MisconceptionId } from "./misconceptions";
import type { NumericPart, Question } from "./types";

/** 把数值写成学生会输入的形式（带基本单位） */
function asInput(p: NumericPart, v: number): string {
  return p.dim === "1" ? String(v) : `${v} ${p.dim === "Ω" ? "ohm" : p.dim}`;
}

const near = (x: number, t: number, tol: number) => (t === 0 ? Math.abs(x) <= 1e-12 : Math.abs(x - t) <= tol * Math.abs(t));

/** 判题器的通用规则能识别的错因 */
const GENERIC: MisconceptionId[] = ["sign", "unit-convert", "omega-f", "ratio-inverted"];

describe("错因分类表", () => {
  it("每个错因都有短名、分组、解释和有效的复习位置", () => {
    const bad: string[] = [];
    for (const id of MISCONCEPTION_IDS) {
      const m = MISCONCEPTIONS[id];
      if (!m.short || m.short.length > 16) bad.push(`${id}: 短名为空或过长`);
      if (/[$\\]/.test(m.short)) bad.push(`${id}: 短名应为纯文本`);
      if (!GROUP_ORDER.includes(m.group)) bad.push(`${id}: 未知分组 ${m.group}`);
      if (m.explain.length < 20) bad.push(`${id}: 解释过短`);
      if (!m.review.length) bad.push(`${id}: 没有复习位置`);
      for (const r of m.review) {
        const u = UNITS.find((x) => x.id === r.unit);
        if (!u || u.status !== "complete" || !LESSON_IDS.has(r.unit) || !u.sections?.some((s) => s.id === r.section)) bad.push(`${id}: ${r.unit}#${r.section}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it("每个错因至少被一道题用到（通用规则除外）", () => {
    const used = new Set<MisconceptionId>(GENERIC);
    for (const t of ALL_TEMPLATES) for (const id of explicitTags(t)) used.add(id);
    expect(MISCONCEPTION_IDS.filter((id) => !used.has(id))).toEqual([]);
  });
});

describe("判题器的通用错因规则", () => {
  const f: NumericPart = { id: "f", label: "f", expected: 1000, dim: "Hz", unitHint: "Hz" };
  it("具体的错误思路优先于符号规则", () => {
    const p: NumericPart = { id: "a", label: "a", expected: -10, dim: "1", unitHint: "-10", mistakes: [{ value: 10, message: "反相", tag: "opamp-config" }] };
    const g = gradeNumeric(p, "10");
    expect(g.code).toBe("mistake");
    expect(g.tag).toBe("opamp-config");
  });
  it("符号相反 → sign", () => {
    const g = gradeNumeric({ id: "a", label: "a", expected: -10, dim: "1", unitHint: "-10" }, "10");
    expect([g.code, g.tag]).toEqual(["sign", "sign"]);
  });
  it("频率差 2π 倍 → omega-f（只对 Hz）", () => {
    const g = gradeNumeric(f, `${1000 * 2 * Math.PI} Hz`);
    expect([g.code, g.tag]).toEqual(["omega_f", "omega-f"]);
    const v: NumericPart = { ...f, dim: "V", unitHint: "V" };
    expect(gradeNumeric(v, `${1000 * 2 * Math.PI} V`).code).toBe("off");
  });
  it("数量级 → unit-convert", () => {
    const g = gradeNumeric(f, "1 Hz");
    expect([g.code, g.tag]).toEqual(["prefix_scale", "unit-convert"]);
  });
  it("无量纲比值取倒数 → ratio-inverted（期望值接近 1 时不判）", () => {
    const a: NumericPart = { id: "a", label: "a", expected: 50, dim: "1", unitHint: "50" };
    expect(gradeNumeric(a, "0.02").tag).toBe("ratio-inverted");
    const b: NumericPart = { id: "b", label: "b", expected: 1.1, dim: "1", unitHint: "1" };
    expect(gradeNumeric(b, String(1 / 1.1)).code).toBe("off");
  });
  it("期望值为 0 时不出现无穷大的偏差", () => {
    const g = gradeNumeric({ id: "z", label: "z", expected: 0, dim: "V", unitHint: "V" }, "1 V");
    expect(g.code).toBe("off");
    expect(g.message).not.toMatch(/∞|Infinity|NaN/);
  });
});

describe("题库中的错误思路：数值有效、与正确答案可区分、诊断结果唯一", () => {
  const SEEDS = 60;
  interface Agg {
    n: number;
    shadowed: number;
    misread: number;
    sample: string;
  }
  const agg = new Map<string, Agg>();
  const nonFinite: string[] = [];
  const notDetected: string[] = [];

  for (const t of ALL_TEMPLATES) {
    const qs: Question[] = t.fixed ? [t.fixed] : Array.from({ length: SEEDS }, (_, i) => t.generate!(i + 1));
    for (const q of qs) {
      if (q.body.kind !== "numeric") continue;
      for (const p of q.body.parts) {
        const tol = p.tol ?? DEFAULT_TOL;
        const targets = [p.expected, ...(p.alts ?? [])];
        (p.mistakes ?? []).forEach((m, i) => {
          const k = `${t.id}/${p.id}/${i}:${m.tag}`;
          const a = agg.get(k) ?? { n: 0, shadowed: 0, misread: 0, sample: q.key };
          a.n++;
          if (!Number.isFinite(m.value)) {
            nonFinite.push(`${q.key} ${p.id} #${i}`);
          } else if (targets.some((x) => near(m.value, x, tol))) {
            // 错误值落在正确答案的容差内：按这种思路作答会被判对，本条诊断在这组参数下不起作用
            a.shadowed++;
          } else {
            const g = gradeNumeric(p, asInput(p, m.value));
            if (g.correct || !g.tag) notDetected.push(`${q.key} ${p.id} #${i} → ${g.code}`);
            else if (g.tag !== m.tag) {
              a.misread++;
              a.sample = `${q.key}（判为 ${g.tag}）`;
            }
          }
          agg.set(k, a);
        });
      }
    }
  }

  it("错误值都是有限数", () => expect(nonFinite).toEqual([]));
  it("错误值都能被判为“错误 + 有错因”", () => expect(notDetected).toEqual([]));
  it("错误思路在大多数参数下都能与正确答案区分（只在少数参数下才生效的条目要么调参数、要么删掉）", () => {
    // 有些错误本来就只在特定参数下才有区别（如“两个限制取较小值”），允许部分重合
    const bad = [...agg.entries()].filter(([, a]) => a.shadowed / a.n > 0.9).map(([k, a]) => `${k} 重合 ${a.shadowed}/${a.n}`);
    expect(bad).toEqual([]);
  });
  it("不同错因的错误值很少撞在一起（撞上时诊断会归到别的错因）", () => {
    const bad = [...agg.entries()].filter(([, a]) => a.misread / a.n > 0.1).map(([k, a]) => `${k} 误判 ${a.misread}/${a.n}，例 ${a.sample}`);
    expect(bad).toEqual([]);
  });
});

describe("诊断与统计", () => {
  const part: NumericPart = {
    id: "IBQ",
    label: "I_BQ",
    expected: 40e-6,
    dim: "A",
    unitHint: "µA",
    mistakes: [{ value: 42e-6 * 1.1, message: "漏减 U_BE", tag: "forget-ube" }],
  };
  const gain: NumericPart = { id: "Au", label: "A_u", expected: -80, dim: "1", unitHint: "-80" };

  it("可识别的错因：登记的 + 通用规则", () => {
    expect(partOpportunities(part).sort()).toEqual(["forget-ube", "unit-convert"]);
    expect(partOpportunities(gain).sort()).toEqual(["ratio-inverted", "sign"]);
  });

  it("一次提交：答错的部分记为 hits，答对的部分记为 avoided", () => {
    const g = { IBQ: gradeNumeric(part, `${42e-6 * 1.1} A`), Au: gradeNumeric(gain, "-80") };
    const d = diagnoseNumeric([part, gain], g);
    expect(d.hits).toEqual(["forget-ube"]);
    expect(d.avoided.sort()).toEqual(["ratio-inverted", "sign"]);
    const d2 = diagnoseNumeric([part, gain], { IBQ: gradeNumeric(part, "40 uA"), Au: gradeNumeric(gain, "80") });
    expect(d2.hits).toEqual(["sign"]);
    expect(d2.avoided).not.toContain("sign");
  });

  it("选择题与判断题", () => {
    const body = { kind: "choice" as const, options: ["a", "b", "c"], answer: 0, why: ["", "", ""], tags: [null, "feedback-type", "feedback-sign"] as (MisconceptionId | null)[] };
    expect(diagnoseChoice(body, 2).hits).toEqual(["feedback-sign"]);
    expect(diagnoseChoice(body, 0).avoided.sort()).toEqual(["feedback-sign", "feedback-type"]);
    const j = { kind: "judge" as const, answer: false, why: "", wrongTag: "device-state" as const };
    expect(diagnoseJudge(j, true).hits).toEqual(["device-state"]);
    expect(diagnoseJudge(j, false).avoided).toEqual(["device-state"]);
  });

  it("统计：同一题上改对不算纠正；换题避开 2 次算已纠正；再犯重新计数", () => {
    let s: MisconceptionStats = {};
    s = applyDiagnosis(s, { hits: ["forget-ube"], avoided: [] }, "gen-fixed-q:1", 1);
    expect(s["forget-ube"]).toMatchObject({ hits: 1, clean: 0 });
    s = applyDiagnosis(s, { hits: [], avoided: ["forget-ube"] }, "gen-fixed-q:1", 2);
    expect(s["forget-ube"]!.clean).toBe(0);
    s = applyDiagnosis(s, { hits: [], avoided: ["forget-ube", "sign"] }, "gen-fixed-q:7", 3);
    expect(s.sign).toBeUndefined(); // 没犯过的错因不建档
    expect(isResolved(s["forget-ube"]!)).toBe(false);
    s = applyDiagnosis(s, { hits: [], avoided: ["forget-ube"] }, "gen-divider-full:3", 4);
    expect(s["forget-ube"]!.clean).toBe(RESOLVE_AFTER);
    expect(isResolved(s["forget-ube"]!)).toBe(true);
    s = applyDiagnosis(s, { hits: ["forget-ube"], avoided: [] }, "gen-divider-full:9", 5);
    expect(s["forget-ube"]).toMatchObject({ hits: 2, clean: 0, lastHit: 5 });
  });

  it("错因画像：待巩固在前，其次按次数", () => {
    const s: MisconceptionStats = {
      sign: { hits: 5, lastHit: 1, clean: 3, lastKey: "a" },
      "forget-ube": { hits: 1, lastHit: 2, clean: 0, lastKey: "b" },
      "load-ignored": { hits: 3, lastHit: 3, clean: 1, lastKey: "c" },
    };
    expect(profileRows(s).map((r) => r.id)).toEqual(["load-ignored", "forget-ube", "sign"]);
  });

  it("针对练习：每个错因都有题，且专门针对它的题型排在前面", () => {
    for (const id of MISCONCEPTION_IDS) {
      const list = templatesFor(id, ALL_TEMPLATES);
      expect(list.length, id).toBeGreaterThan(0);
      const firstGeneric = list.findIndex((t) => !explicitTags(t).has(id));
      if (firstGeneric >= 0) expect(list.slice(firstGeneric).every((t) => !explicitTags(t).has(id)), id).toBe(true);
      for (const t of list) expect(templateTags(t).has(id)).toBe(true);
    }
  });
});
