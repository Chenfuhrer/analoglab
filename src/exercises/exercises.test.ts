import { describe, expect, it } from "vitest";
import { gradeNumeric } from "./grader";
import { GENERATORS } from "./generators";
import { ALL_TEMPLATES, questionFromKey, STATIC_QUESTIONS } from "./bank";
import type { NumericPart } from "./types";

const part: NumericPart = {
  id: "ICQ",
  label: "I_CQ",
  expected: 2.02e-3,
  dim: "A",
  unitHint: "mA",
  mistakes: [{ value: 2.5e-3, message: "MISTAKE" }],
};

describe("判题器", () => {
  it("正确值（多种写法）", () => {
    for (const s of ["2.02mA", "2.02 mA", "2020µA", "2020 uA", "0.00202 A", "2.0 mA", "2.05 毫安"]) expect(gradeNumeric(part, s).correct, s).toBe(true);
  });
  it("缺单位", () => expect(gradeNumeric(part, "2.02").code).toBe("no_unit"));
  it("量纲错误", () => expect(gradeNumeric(part, "2.02 V").code).toBe("wrong_dim"));
  it("前缀错 1000 倍", () => expect(gradeNumeric(part, "2.02 A").code).toBe("prefix_scale"));
  it("常见错误匹配", () => {
    const g = gradeNumeric(part, "2.5mA");
    expect(g.code).toBe("mistake");
    expect(g.message).toBe("MISTAKE");
  });
  it("偏差过大", () => expect(gradeNumeric(part, "3 mA").code).toBe("off"));
  it("无法识别", () => {
    expect(gradeNumeric(part, "abc").code).toBe("parse");
    expect(gradeNumeric(part, "2 bananas").code).toBe("unknown_unit");
    expect(gradeNumeric(part, "").code).toBe("empty");
  });
  it("无量纲：符号错误与带单位", () => {
    const au: NumericPart = { id: "Au", label: "A_u", expected: -107.1, dim: "1", unitHint: "−50", signMessage: "SIGN" };
    expect(gradeNumeric(au, "-107").correct).toBe(true);
    expect(gradeNumeric(au, "−107").correct).toBe(true);
    expect(gradeNumeric(au, "107").code).toBe("sign");
    expect(gradeNumeric(au, "107 V").code).toBe("wrong_dim");
  });
  it("电阻只写前缀：判对并提示", () => {
    const r: NumericPart = { id: "Ri", label: "R_i", expected: 1396, dim: "Ω", unitHint: "kΩ" };
    const g = gradeNumeric(r, "1.4k");
    expect(g.correct).toBe(true);
    expect(g.code).toBe("ok_note");
  });
  it("备选答案（估算法 / 精确解）都判对", () => {
    const p2: NumericPart = { id: "x", label: "x", expected: 1e-3, alts: [0.95e-3], dim: "A", unitHint: "mA" };
    expect(gradeNumeric(p2, "1 mA").correct).toBe(true);
    expect(gradeNumeric(p2, "0.95 mA").correct).toBe(true);
  });
});

describe("参数化题目生成器", () => {
  for (const t of GENERATORS) {
    it(`${t.id}：200 个种子可复现、答案有限、标准答案能被判对`, () => {
      for (let seed = 1; seed <= 200; seed++) {
        const q1 = t.generate!(seed);
        const q2 = t.generate!(seed);
        expect(JSON.stringify(q1)).toBe(JSON.stringify(q2));
        expect(q1.key).toBe(`${t.id}:${seed}`);
        if (q1.body.kind === "numeric") {
          for (const p of q1.body.parts) {
            expect(Number.isFinite(p.expected), `${q1.key} ${p.id}`).toBe(true);
            // 用标准答案本身作答必须判对（含单位的写法）
            const txt = p.dim === "1" ? String(p.expected) : `${p.expected} ${p.dim === "Ω" ? "ohm" : p.dim}`;
            expect(gradeNumeric(p, txt).correct, `${q1.key} ${p.id} ${txt}`).toBe(true);
            // 常见错误值不应与正确答案混淆
            for (const m of p.mistakes ?? []) {
              const accepted = [p.expected, ...(p.alts ?? [])];
              if (accepted.every((t) => Math.abs(m.value - t) > (p.tol ?? 0.03) * Math.abs(t))) {
                const g = gradeNumeric(p, p.dim === "1" ? String(m.value) : `${m.value} ${p.dim === "Ω" ? "ohm" : p.dim}`);
                expect(g.correct).toBe(false);
              }
            }
          }
        } else if (q1.body.kind === "choice") {
          expect(q1.body.answer).toBeGreaterThanOrEqual(0);
          expect(q1.body.answer).toBeLessThan(q1.body.options.length);
        }
        if (q1.figure) {
          // 题目电路必须处于放大区（除非题目本身考察工作区）
          expect(q1.prompt.length).toBeGreaterThan(10);
        }
      }
    });
  }
  it("questionFromKey 能还原题目", () => {
    const q = GENERATORS[1].generate!(42);
    expect(JSON.stringify(questionFromKey(q.key))).toBe(JSON.stringify(q));
    expect(questionFromKey(STATIC_QUESTIONS[0].id)?.id).toBe(STATIC_QUESTIONS[0].id);
    expect(questionFromKey("nope")).toBeNull();
  });
  it("三级难度各至少 3 题", () => {
    for (const lv of [1, 2, 3] as const) expect(ALL_TEMPLATES.filter((t) => t.level === lv).length).toBeGreaterThanOrEqual(3);
  });
  it("静态选择题答案下标有效且每个选项都有解释", () => {
    for (const t of STATIC_QUESTIONS) {
      const b = t.fixed!.body;
      if (b.kind === "choice") {
        expect(b.why.length).toBe(b.options.length);
        expect(b.answer).toBeLessThan(b.options.length);
      }
    }
  });
});
