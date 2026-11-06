"use client";

import Link from "next/link";
import { useState } from "react";
import { Workspace } from "@/components/layout/Workspace";
import { PageContext } from "@/components/layout/PageContext";
import { ExerciseCard } from "@/components/exercises/ExerciseCard";
import { questionFromKey } from "@/exercises/bank";
import { LEVEL_LABEL, TOPIC_LABEL } from "@/exercises/types";
import { useHydrated, useProgress } from "@/lib/store";
import { Badge, Button } from "@/components/ui/primitives";
import { Rich } from "@/components/math/Tex";

export default function MistakesPage() {
  const hydrated = useHydrated();
  const mistakes = useProgress((s) => s.mistakes);
  const attempts = useProgress((s) => s.attempts);
  const remove = useProgress((s) => s.removeMistake);
  const [open, setOpen] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unsolved">("all");

  const list = hydrated
    ? Object.values(mistakes)
        .filter((m) => filter === "all" || !attempts[m.key]?.correct)
        .sort((a, b) => b.addedAt - a.addedAt)
    : [];

  return (
    <Workspace>
      <PageContext page="错题本" />
      <h1 className="font-display text-[28px] font-bold">错题本</h1>
      <p className="mt-1 max-w-2xl text-[14px] text-ink-2">答错的题会自动收录，也可以在题目右上角点 ☆ 手动收藏。参数化题目会以原参数重现，方便对照订正。记录保存在本浏览器的本地存储中。</p>
      <div className="mt-4 flex items-center gap-2">
        {(["all", "unsolved"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-0.5 text-[12.5px] ${filter === f ? "border-accent bg-accent-soft" : "border-line bg-elev text-ink-2"}`}
          >
            {f === "all" ? "全部" : "尚未订正"}
          </button>
        ))}
        <span className="num ml-auto text-[12px] text-ink-3" data-testid="mistake-count">
          {hydrated ? `${list.length} 题` : "—"}
        </span>
      </div>

      <div className="mt-4 space-y-3" data-testid="mistake-list">
        {hydrated && list.length === 0 && (
          <div className="card p-6 text-center text-[14px] text-ink-2">
            还没有错题。去{" "}
            <Link href="/practice" className="text-accent hover:underline">
              练习中心
            </Link>{" "}
            做几道题吧。
          </div>
        )}
        {list.map((m) => {
          const q = questionFromKey(m.key);
          const a = attempts[m.key];
          return (
            <div key={m.key} className="card overflow-hidden" data-testid="mistake-item">
              <div className="flex flex-wrap items-center gap-2 px-4 py-3">
                <Badge tone={m.level === 1 ? "accent" : m.level === 2 ? "warn" : "err"}>{LEVEL_LABEL[m.level]}</Badge>
                <Badge>{TOPIC_LABEL[m.topic] ?? m.topic}</Badge>
                <span className="font-medium">{m.title}</span>
                {a?.correct ? <Badge tone="ok">已订正</Badge> : <Badge tone="err">未订正</Badge>}
                <span className="text-[11.5px] text-ink-3">{m.source === "manual" ? "手动收藏" : "答错收录"} · {new Date(m.addedAt).toLocaleDateString("zh-CN")}</span>
                <span className="ml-auto flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => setOpen(open === m.key ? null : m.key)} data-testid="redo">
                    {open === m.key ? "收起" : "重做"}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => remove(m.key)}>
                    移出
                  </Button>
                </span>
              </div>
              {m.lastError && open !== m.key && (
                <div className="border-t border-line-2 px-4 py-2 text-[12.5px] text-err">
                  上次错误原因：<Rich text={m.lastError} />
                </div>
              )}
              {open === m.key && q && (
                <div className="border-t border-line p-3">
                  <ExerciseCard key={q.key} question={q} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Workspace>
  );
}
