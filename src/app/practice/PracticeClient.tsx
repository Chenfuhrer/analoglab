"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { ExerciseCard } from "@/components/exercises/ExerciseCard";
import { ALL_TEMPLATES, instantiate } from "@/exercises/bank";
import { LEVEL_LABEL, TOPIC_LABEL, topicChapter, type Level } from "@/exercises/types";
import { CHAPTERS } from "@/content/course";
import { useHydrated, useProgress } from "@/lib/store";
import { cx } from "@/components/ui/primitives";

export function PracticeClient() {
  const sp = useSearchParams();
  const topicParam = sp.get("topic");
  const initialTopic = topicParam && TOPIC_LABEL[topicParam] ? topicParam : "all";
  const [level, setLevel] = useState<Level | 0>(0);
  const [topic, setTopic] = useState<string>(initialTopic);
  const [chapter, setChapter] = useState<number>(initialTopic === "all" ? 0 : topicChapter(initialTopic));
  const topicsOfChapter = useMemo(() => {
    const seen = new Set<string>();
    for (const t of ALL_TEMPLATES) if (topicChapter(t.topic) === chapter) seen.add(t.topic);
    return Object.keys(TOPIC_LABEL).filter((t) => seen.has(t));
  }, [chapter]);
  const [seeds, setSeeds] = useState<Record<string, number>>({});
  const hydrated = useHydrated();
  const attempts = useProgress((s) => s.attempts);

  const list = useMemo(
    () =>
      ALL_TEMPLATES.filter(
        (t) => (level === 0 || t.level === level) && (chapter === 0 || topicChapter(t.topic) === chapter) && (topic === "all" || t.topic === topic),
      ),
    [level, topic, chapter],
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const current = list.find((t) => t.id === selectedId) ?? list[0];
  const seed = current ? (seeds[current.id] ?? 1) : 1;
  const question = current ? instantiate(current, seed) : null;

  const regenerate = useCallback(() => {
    if (!current?.generate) return;
    setSeeds((s) => ({ ...s, [current.id]: Math.floor(Math.random() * 100000) + 2 }));
  }, [current]);

  const statusOf = (id: string) => {
    if (!hydrated) return null;
    const hits = Object.values(attempts).filter((a) => a.key === id || a.key.startsWith(id + ":"));
    if (!hits.length) return null;
    return hits.some((h) => h.correct) ? "ok" : "tried";
  };

  const idx = current ? list.indexOf(current) : -1;

  return (
    <div className="space-y-5" data-testid="practice">
      <div className="flex flex-wrap items-center gap-2">
        <span className="eyebrow mr-1">难度</span>
        {([0, 1, 2, 3] as const).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => {
              setLevel(l);
              setSelectedId(null);
            }}
            data-testid={`level-${l}`}
            className={cx("rounded-full border px-3 py-0.5 text-[12.5px]", level === l ? "border-accent bg-accent-soft" : "border-line bg-elev text-ink-2")}
          >
            {l === 0 ? "全部" : LEVEL_LABEL[l]}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2" data-testid="chapter-filter">
        <span className="eyebrow mr-1">章节</span>
        {[0, ...CHAPTERS.map((c) => c.n)].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => {
              setChapter(n);
              setTopic("all");
              setSelectedId(null);
            }}
            data-testid={`chapter-${n}`}
            title={n ? CHAPTERS[n - 1].title : "全部章节"}
            className={cx("rounded-full border px-3 py-0.5 text-[12.5px]", chapter === n ? "border-accent bg-accent-soft" : "border-line bg-elev text-ink-2")}
          >
            {n === 0 ? "全部" : `${n} ${CHAPTERS[n - 1].title}`}
          </button>
        ))}
      </div>
      {chapter !== 0 && topicsOfChapter.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="eyebrow mr-1">知识点</span>
          {["all", ...topicsOfChapter].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTopic(t);
                setSelectedId(null);
              }}
              className={cx("rounded-full border px-3 py-0.5 text-[12.5px]", topic === t ? "border-accent bg-accent-soft" : "border-line bg-elev text-ink-2")}
            >
              {t === "all" ? "全部" : TOPIC_LABEL[t]}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <ol className="card thin-scroll h-fit max-h-[70vh] overflow-y-auto p-2 lg:sticky lg:top-[72px]" aria-label="题目列表">
          {list.length === 0 && <li className="p-3 text-[13px] text-ink-3">该筛选条件下暂无题目。</li>}
          {list.map((t, i) => {
            const st = statusOf(t.id);
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(t.id)}
                  data-testid={`q-${t.id}`}
                  className={cx(
                    "flex w-full items-start gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px]",
                    current?.id === t.id ? "bg-accent-soft" : "hover:bg-sunken",
                  )}
                >
                  <span className="num mt-px w-5 shrink-0 text-[11px] text-ink-3">{i + 1}</span>
                  <span className="flex-1">
                    {t.title}
                    <span className="mt-0.5 block text-[11px] text-ink-3">
                      L{t.level} · {TOPIC_LABEL[t.topic]}
                      {t.generate ? " · 参数化" : ""}
                    </span>
                  </span>
                  {st === "ok" && <span className="text-[12px] text-ok">✓</span>}
                  {st === "tried" && <span className="text-[12px] text-warn">•</span>}
                </button>
              </li>
            );
          })}
        </ol>
        <div className="min-w-0 space-y-3">
          {question && <ExerciseCard key={question.key} question={question} onRegenerate={current?.generate ? regenerate : undefined} />}
          {list.length > 1 && idx >= 0 && (
            <div className="flex justify-between">
              <button type="button" className="text-[13px] text-ink-2 hover:text-ink disabled:opacity-40" disabled={idx === 0} onClick={() => setSelectedId(list[idx - 1].id)}>
                ← 上一题
              </button>
              <button
                type="button"
                className="text-[13px] text-ink-2 hover:text-ink disabled:opacity-40"
                disabled={idx === list.length - 1}
                onClick={() => setSelectedId(list[idx + 1].id)}
                data-testid="next-question"
              >
                下一题 →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
