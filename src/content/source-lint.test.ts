/**
 * 源码层面的内容检查：普通 JS 字符串（"..."）里的单个反斜杠会被当作转义（\b → 退格、\d → d），
 * 导致 LaTeX 渲染错误；含 LaTeX 的字符串必须写成 r`...`（String.raw）或使用双反斜杠。
 * JSX 属性中的反斜杠同理，统一要求用 {r`...`}。
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function files(dir: string): string[] {
  const out: string[] = [];
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) out.push(...files(p));
    else if (/\.(ts|tsx)$/.test(f) && !f.endsWith(".test.ts")) out.push(p);
  }
  return out;
}

const SKIP = [/route\.server\.ts$/, /lib\/tex\.ts$/];
const STR = /(?<![\w`])"((?:[^"\\\n]|\\.)*)"/g;

describe("源码中的 LaTeX 字符串", () => {
  it("普通字符串与 JSX 属性中没有未转义的反斜杠命令", () => {
    const bad: string[] = [];
    for (const p of files("src")) {
      if (SKIP.some((r) => r.test(p))) continue;
      const s = readFileSync(p, "utf8");
      for (const m of s.matchAll(STR)) {
        const body = m[1].replace(/\\\\/g, "");
        if (/\\[a-zA-Z]/.test(body) && !/^(\\n)+$/.test(m[1])) bad.push(`${p}:${s.slice(0, m.index).split("\n").length} ${m[1].slice(0, 60)}`);
      }
    }
    expect(bad).toEqual([]);
  });
});

import { UNITS } from "./course";
describe("课程目录与正文一致", () => {
  it("目录中每个知识点在正文中都有对应的 <Section id>", () => {
    const src = files("src/lessons")
      .map((p) => readFileSync(p, "utf8"))
      .join("\n");
    const missing: string[] = [];
    for (const u of UNITS) for (const s of u.sections ?? []) if (!src.includes(`id="${s.id}"`)) missing.push(`${u.id}#${s.id}`);
    expect(missing).toEqual([]);
  });
});
