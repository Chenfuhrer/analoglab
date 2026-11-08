"use client";

import { useEffect, useState } from "react";
import { CESchematicStatic } from "@/components/circuit/CESchematicStatic";
import { Diagram } from "@/components/circuit/diagrams";
import { Derivation } from "@/components/math/Derivation";
import { Rich } from "@/components/math/Tex";
import { Badge, Button, cx } from "@/components/ui/primitives";
import { formatAnswer, gradeNumeric, type PartGrade } from "@/exercises/grader";
import { LEVEL_LABEL, TOPIC_LABEL, type Question } from "@/exercises/types";
import { useHydrated, useProgress } from "@/lib/store";
import { useTutorContext } from "@/lib/tutor-context";

interface Props {
  question: Question;
  onRegenerate?: () => void;
  compact?: boolean;
}

/**
 * 一道题：作答 → 自动判题（含单位、错误原因）→ 分步提示 → 解析；自动记录进度、错题。
 * 父组件应以 key={question.key} 渲染，以便换题时重置内部状态。
 */
export function ExerciseCard({ question: q, onRegenerate, compact }: Props) {
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [choice, setChoice] = useState<number | null>(null);
  const [judge, setJudge] = useState<boolean | null>(null);
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [grades, setGrades] = useState<Record<string, PartGrade> | null>(null);
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [tries, setTries] = useState(0);
  const [hintsShown, setHintsShown] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [conceptRevealed, setConceptRevealed] = useState(false);
  const hydrated = useHydrated();
  const recordAttempt = useProgress((s) => s.recordAttempt);
  const addMistake = useProgress((s) => s.addMistake);
  const removeMistake = useProgress((s) => s.removeMistake);
  const starred = useProgress((s) => Boolean(s.mistakes[q.key]));
  const prev = useProgress((s) => s.attempts[q.key]);
  const setExercise = useTutorContext((s) => s.setExercise);

  const feedbackText = (() => {
    if (!result) return undefined;
    if (q.body.kind === "numeric" && grades)
      return q.body.parts.map((p) => `${p.label.replace(/\$/g, "")}: ${grades[p.id]?.message ?? "未作答"}`).join("；");
    if (q.body.kind === "choice" && choice !== null) return q.body.why[choice];
    if (q.body.kind === "judge") return q.body.why;
    return undefined;
  })();

  useEffect(() => {
    setExercise({
      key: q.key,
      title: q.title,
      prompt: q.prompt,
      progress: `已提交 ${tries} 次${result ? `，最近一次${result === "correct" ? "正确" : "错误"}` : ""}；已查看提示 ${hintsShown} 条`,
      lastFeedback: feedbackText,
      hints: q.hints,
      regenerate: onRegenerate,
    });
  }, [q, tries, result, hintsShown, feedbackText, onRegenerate, setExercise]);

  useEffect(() => () => setExercise(null), [setExercise]);

  const submit = () => {
    let ok = false;
    let err: string | undefined;
    if (q.body.kind === "numeric") {
      const g: Record<string, PartGrade> = {};
      for (const p of q.body.parts) g[p.id] = gradeNumeric(p, inputs[p.id] ?? "");
      setGrades(g);
      ok = q.body.parts.every((p) => g[p.id].correct);
      err = q.body.parts
        .filter((p) => !g[p.id].correct)
        .map((p) => g[p.id].message)
        .join(" ");
    } else if (q.body.kind === "choice") {
      if (choice === null) return;
      ok = choice === q.body.answer;
      if (!ok) err = q.body.why[choice];
    } else if (q.body.kind === "judge") {
      if (judge === null) return;
      ok = judge === q.body.answer;
      if (!ok) err = q.body.why;
    } else {
      // 概念题：自评，要点全部勾选视为完成
      ok = q.body.keyPoints.every((_, i) => checked[i]);
      setConceptRevealed(true);
    }
    setTries((t) => t + 1);
    setResult(ok ? "correct" : "wrong");
    recordAttempt({ key: q.key, title: q.title, level: q.level, topic: q.topic, correct: ok }, err);
  };

  const canSubmit =
    q.body.kind === "numeric" ? q.body.parts.some((p) => (inputs[p.id] ?? "").trim()) : q.body.kind === "choice" ? choice !== null : q.body.kind === "judge" ? judge !== null : true;

  return (
    <article className="card overflow-hidden" data-testid="exercise" data-key={q.key} data-result={result ?? ""}>
      <header className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2.5">
        <Badge tone={q.level === 1 ? "accent" : q.level === 2 ? "warn" : "err"}>{LEVEL_LABEL[q.level]}</Badge>
        <Badge>{TOPIC_LABEL[q.topic] ?? q.topic}</Badge>
        {q.seed !== undefined && <span className="num text-[11px] text-ink-3">参数组 #{q.seed}</span>}
        <span className="ml-auto flex items-center gap-1">
          {hydrated && prev && (
            <span className={cx("text-[11.5px]", prev.correct ? "text-ok" : "text-ink-3")}>
              {prev.correct ? `已做对（第 ${prev.firstCorrectOnTry} 次）` : `已尝试 ${prev.tries} 次`}
            </span>
          )}
          <button
            type="button"
            onClick={() =>
              starred ? removeMistake(q.key) : addMistake({ key: q.key, title: q.title, level: q.level, topic: q.topic, source: "manual" })
            }
            className={cx("rounded px-1.5 text-[16px] leading-none", hydrated && starred ? "text-warn" : "text-ink-3 hover:text-warn")}
            aria-label={starred ? "从错题本移除" : "收藏到错题本"}
            aria-pressed={hydrated && starred}
            data-testid="star"
            title={starred ? "已在错题本中（点击移除）" : "收藏到错题本"}
          >
            {hydrated && starred ? "★" : "☆"}
          </button>
        </span>
      </header>

      <div className="space-y-4 px-4 py-4">
        <h3 className="text-[15.5px] font-semibold">{q.title}</h3>
        <div className="text-[14.5px] leading-relaxed">
          <Rich text={q.prompt} />
        </div>
        {q.figure && !compact && <CESchematicStatic params={q.figure.params} mode={q.figure.mode} caption={q.figure.caption} />}
        {q.diagram && !compact && <Diagram {...q.diagram} />}

        {/* 作答区 */}
        {q.body.kind === "numeric" && (
          <div className="space-y-2.5">
            {q.body.parts.map((p) => {
              const g = grades?.[p.id];
              return (
                <div key={p.id} className="grid gap-1 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-start">
                  <label htmlFor={`${q.key}-${p.id}`} className="pt-1.5 text-[14px]">
                    <Rich text={`${p.label} =`} />
                  </label>
                  <div>
                    <input
                      id={`${q.key}-${p.id}`}
                      data-testid={`answer-${p.id}`}
                      value={inputs[p.id] ?? ""}
                      onChange={(e) => setInputs((s) => ({ ...s, [p.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && canSubmit && submit()}
                      placeholder={p.dim === "1" ? `如 ${p.unitHint}` : `数值 + 单位，如 1.5 ${p.unitHint}`}
                      autoComplete="off"
                      className={cx(
                        "num w-full max-w-[260px] rounded-md border bg-bg px-2.5 py-1.5 text-[14px] focus:outline-none",
                        g ? (g.correct ? "border-ok" : "border-err") : "border-line focus:border-accent",
                      )}
                    />
                    {g && (
                      <p className={cx("mt-1 text-[12.5px]", g.correct ? "text-ok" : "text-err")} data-testid={`feedback-${p.id}`} data-code={g.code}>
                        {g.correct ? "✓ " : "✗ "}
                        <Rich text={g.message} />
                      </p>
                    )}
                    {showSolution && (
                      <p className="mt-0.5 text-[12px] text-ink-2">
                        参考答案：<span className="num">{formatAnswer(p)}</span>
                        {p.alts && p.alts.length > 0 && <span className="text-ink-3">（亦接受 {p.alts.map((v) => formatAnswer({ ...p, expected: v })).join("、")}）</span>}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            <p className="text-[11.5px] text-ink-3">数值题按相对误差判定（一般 ±3%），必须带单位；支持 kΩ / kohm / 千欧、mA / µA / uA / 毫安 等写法。</p>
          </div>
        )}

        {q.body.kind === "choice" && (
          <div className="space-y-1.5" role="radiogroup" aria-label="选项">
            {q.body.options.map((o, i) => {
              const sel = choice === i;
              const isAns = result && i === (q.body as { answer: number }).answer;
              return (
                <button
                  key={i}
                  type="button"
                  role="radio"
                  aria-checked={sel}
                  data-testid={`option-${i}`}
                  onClick={() => setChoice(i)}
                  className={cx(
                    "flex w-full items-start gap-2.5 rounded-md border px-3 py-2 text-left text-[14px] transition-colors",
                    sel ? "border-accent bg-accent-soft" : "border-line hover:border-ink-3",
                    result && isAns && "border-ok bg-ok-soft",
                    result === "wrong" && sel && "border-err bg-err-soft",
                  )}
                >
                  <span className="num mt-px text-[12px] text-ink-3">{"ABCD"[i]}.</span>
                  <Rich text={o} />
                </button>
              );
            })}
            {result && choice !== null && (
              <p className={cx("text-[13px]", result === "correct" ? "text-ok" : "text-err")} data-testid="choice-feedback">
                <Rich text={q.body.why[choice]} />
              </p>
            )}
          </div>
        )}

        {q.body.kind === "judge" && (
          <div className="flex gap-2">
            {[true, false].map((v) => (
              <button
                key={String(v)}
                type="button"
                data-testid={`judge-${v}`}
                onClick={() => setJudge(v)}
                aria-pressed={judge === v}
                className={cx("rounded-md border px-4 py-1.5 text-[14px]", judge === v ? "border-accent bg-accent-soft" : "border-line hover:border-ink-3")}
              >
                {v ? "✓ 正确" : "✗ 错误"}
              </button>
            ))}
          </div>
        )}
        {q.body.kind === "judge" && result && (
          <p className={cx("text-[13px]", result === "correct" ? "text-ok" : "text-err")}>
            {result === "correct" ? "判断正确。" : "判断有误。"}
            <Rich text={q.body.why} />
          </p>
        )}

        {q.body.kind === "concept" && (
          <div className="space-y-2">
            <textarea
              rows={4}
              placeholder="先用自己的话写下你的解释（不计分，仅用于自查）……"
              className="w-full rounded-md border border-line bg-bg px-3 py-2 text-[14px] focus:border-accent focus:outline-none"
              aria-label="你的解释"
            />
            <div className="rounded-md border border-line-2 bg-bg/60 p-3">
              <div className="eyebrow mb-1.5">要点自查（勾选你的解释中已覆盖的要点）</div>
              {q.body.keyPoints.map((k, i) => (
                <label key={i} className="flex cursor-pointer items-start gap-2 py-0.5 text-[13.5px]">
                  <input type="checkbox" checked={Boolean(checked[i])} onChange={(e) => setChecked((c) => ({ ...c, [i]: e.target.checked }))} className="mt-1" />
                  <Rich text={k} />
                </label>
              ))}
            </div>
            {conceptRevealed && (
              <div className="rounded-md bg-ok-soft/60 p-3 text-[13.5px]">
                <div className="eyebrow mb-1">参考解释</div>
                <Rich text={q.body.reference} />
              </div>
            )}
            <p className="text-[11.5px] text-ink-3">概念解释题无法自动判分：所有要点都覆盖即记为完成。配置 AI 后可以让助手点评你的解释。</p>
          </div>
        )}

        {/* 结果 */}
        {result && q.body.kind !== "concept" && (
          <div
            className={cx("rounded-md px-3 py-2 text-[13.5px] font-medium", result === "correct" ? "bg-ok-soft text-ok" : "bg-err-soft text-err")}
            data-testid="result-banner"
          >
            {result === "correct" ? "✓ 回答正确" : `✗ 还有错误（第 ${tries} 次提交）。已自动加入错题本，可以看提示后再试。`}
          </div>
        )}

        {/* 提示 */}
        {hintsShown > 0 && (
          <ol className="space-y-1.5" data-testid="hints">
            {q.hints.slice(0, hintsShown).map((h, i) => (
              <li key={i} className="flex gap-2 rounded-md border border-warn/30 bg-warn-soft/40 px-3 py-1.5 text-[13.5px]">
                <span className="num text-[12px] text-warn">提示 {i + 1}</span>
                <Rich text={h} />
              </li>
            ))}
          </ol>
        )}

        {showSolution && (
          <div className="space-y-2" data-testid="solution">
            <div className="rounded-md border border-line bg-bg/60 px-3 py-2 text-[13.5px]">
              <span className="eyebrow mr-2">解析</span>
              <Rich text={q.solution} />
            </div>
            {q.solutionSteps && q.solutionSteps.length > 0 && <Derivation title="完整推导（数值由计算核心生成）" steps={q.solutionSteps} initiallyOpen={1} />}
          </div>
        )}
      </div>

      <footer className="flex flex-wrap items-center gap-2 border-t border-line px-4 py-2.5">
        <Button variant="primary" onClick={submit} disabled={!canSubmit} data-testid="submit">
          {q.body.kind === "concept" ? "完成自查" : "提交"}
        </Button>
        <Button
          variant="outline"
          onClick={() => setHintsShown((n) => Math.min(q.hints.length, n + 1))}
          disabled={hintsShown >= q.hints.length}
          data-testid="hint"
        >
          {hintsShown >= q.hints.length ? "提示已全部显示" : `提示 ${hintsShown + 1}/${q.hints.length}`}
        </Button>
        <Button variant="ghost" onClick={() => setShowSolution((s) => !s)} disabled={!result && tries < 1} data-testid="show-solution" title={!result ? "至少提交一次后可查看解析" : undefined}>
          {showSolution ? "收起解析" : "查看解析"}
        </Button>
        {onRegenerate && (
          <Button variant="ghost" onClick={onRegenerate} className="ml-auto" data-testid="regenerate">
            ↻ 换一组参数
          </Button>
        )}
      </footer>
    </article>
  );
}
