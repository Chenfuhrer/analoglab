"use client";

import { useState } from "react";
import { Rich, Tex } from "./Tex";

export interface DerivStep {
  /** 公式（LaTeX，块级） */
  tex: string;
  /** 推导依据：KCL/KVL/器件模型/近似…（可含 $...$） */
  why: string;
  /** 近似或适用条件提示 */
  approx?: string;
  /** 数值代入（LaTeX） */
  numeric?: string;
  /** 单位检查（可含 $...$） */
  units?: string;
}

/**
 * 分步推导：默认只展开第一步，“下一步”逐步揭示，可一键展开全部。
 */
export function Derivation({
  title,
  steps,
  conclusion,
  initiallyOpen = 1,
  testId,
}: {
  title?: string;
  steps: DerivStep[];
  conclusion?: string;
  initiallyOpen?: number;
  testId?: string;
}) {
  const [shown, setShown] = useState(Math.min(initiallyOpen, steps.length));
  const all = shown >= steps.length;
  return (
    <div className="my-5 rounded-lg border border-line bg-elev" data-testid={testId}>
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2">
        <span className="eyebrow">{title ?? "分步推导"}</span>
        <span className="num text-[11.5px] text-ink-3">
          {shown}/{steps.length}
        </span>
      </div>
      <ol className="divide-y divide-line-2">
        {steps.slice(0, shown).map((s, i) => (
          <li key={i} className="grid grid-cols-[28px_1fr] gap-x-2 px-4 py-3 [animation:rise_.45s_ease_both]">
            <span className="num mt-2 grid h-5 w-5 place-items-center rounded-full border border-line text-[10.5px] text-ink-2">
              {i + 1}
            </span>
            <div className="min-w-0">
              <Tex block>{s.tex}</Tex>
              <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink-2">
                <span>
                  <span className="mr-1 text-ink-3">依据</span>
                  <Rich text={s.why} />
                </span>
                {s.approx && (
                  <span className="text-warn">
                    <span className="mr-1">≈ 近似</span>
                    <Rich text={s.approx} />
                  </span>
                )}
              </div>
              {s.numeric && (
                <div className="mt-2 rounded-md bg-sunken/70 px-3">
                  <Tex block>{s.numeric}</Tex>
                </div>
              )}
              {s.units && (
                <div className="mt-1 text-[12.5px] text-ok">
                  <span className="mr-1">单位检查</span>
                  <Rich text={s.units} />
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
      <div className="flex items-center gap-2 border-t border-line px-4 py-2">
        {!all ? (
          <>
            <button
              type="button"
              className="rounded-md bg-accent px-3 py-1 text-[13px] font-medium text-accent-ink hover:opacity-90"
              onClick={() => setShown((n) => n + 1)}
              data-testid={testId ? `${testId}-next` : undefined}
            >
              下一步 →
            </button>
            <button type="button" className="rounded-md px-2 py-1 text-[13px] text-ink-2 hover:bg-sunken" onClick={() => setShown(steps.length)}>
              全部展开
            </button>
          </>
        ) : (
          <>
            {conclusion && (
              <div className="flex-1 text-[13.5px]">
                <span className="mr-2 text-ok">结论</span>
                <Rich text={conclusion} />
              </div>
            )}
            <button type="button" className="ml-auto rounded-md px-2 py-1 text-[12.5px] text-ink-3 hover:bg-sunken" onClick={() => setShown(1)}>
              收起
            </button>
          </>
        )}
      </div>
    </div>
  );
}
