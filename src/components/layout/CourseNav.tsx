"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CHAPTERS, UNITS, sectionKey, unitsOfChapter } from "@/content/course";
import { useHydrated, useProgress } from "@/lib/store";

function useOverall() {
  const hydrated = useHydrated();
  const done = useProgress((s) => s.sectionsDone);
  let total = 0;
  let finished = 0;
  for (const u of UNITS) {
    if (u.status !== "complete" || !u.sections) continue;
    for (const s of u.sections) {
      total++;
      if (hydrated && done[sectionKey(u.id, s.id)]) finished++;
    }
  }
  return { total, finished, hydrated, done };
}

export function CourseNav() {
  const pathname = usePathname();
  const { total, finished, hydrated, done } = useOverall();
  const activeUnit = UNITS.find((u) => pathname === `/learn/${u.id}`);
  const [open, setOpen] = useState<Record<number, boolean>>(() => ({
    [activeUnit?.chapter ?? 3]: true,
  }));
  const pct = total ? Math.round((finished / total) * 100) : 0;
  const completeCount = UNITS.filter((u) => u.status === "complete").length;

  return (
    <div className="px-3 py-4 text-[13.5px]">
      <div className="mb-4 rounded-lg border border-line bg-elev px-3 py-3">
        <div className="flex items-baseline justify-between">
          <span className="eyebrow">学习进度</span>
          <span className="num text-[12px] text-ink-2" data-testid="nav-progress">
            {hydrated ? `${finished}/${total}` : "—"}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sunken">
          <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-[11.5px] leading-snug text-ink-3">
          已上线 {completeCount} 个完整单元 · 其余单元显示学习目标（规划中）
        </p>
      </div>

      <ol className="space-y-0.5">
        {CHAPTERS.map((ch) => {
          const units = unitsOfChapter(ch.n);
          const isOpen = open[ch.n] ?? false;
          const hasComplete = units.some((u) => u.status === "complete");
          return (
            <li key={ch.n}>
              <button
                type="button"
                onClick={() => setOpen((o) => ({ ...o, [ch.n]: !isOpen }))}
                aria-expanded={isOpen}
                className="group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-sunken"
              >
                <span className="num w-5 shrink-0 text-[11px] text-ink-3">{String(ch.n).padStart(2, "0")}</span>
                <span className={`flex-1 ${hasComplete ? "font-medium text-ink" : "text-ink-2"}`}>{ch.title}</span>
                {hasComplete && <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-label="含已上线单元" />}
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  className={`text-ink-3 transition-transform ${isOpen ? "rotate-90" : ""}`}
                  aria-hidden
                >
                  <path d="M3 1.5 6.5 5 3 8.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
                </svg>
              </button>
              {isOpen && (
                <ul className="mb-2 ml-[26px] border-l border-line pl-2">
                  {units.map((u) => {
                    const active = activeUnit?.id === u.id;
                    if (u.status !== "complete") {
                      return (
                        <li key={u.id}>
                          <Link
                            href={`/learn#${u.id}`}
                            className="flex items-center gap-2 rounded px-2 py-1 text-[13px] text-ink-3 hover:bg-sunken hover:text-ink-2"
                            title="规划中：查看学习目标"
                          >
                            <span className="flex-1 truncate">{u.title}</span>
                            <span className="text-[10px] tracking-wide">规划</span>
                          </Link>
                        </li>
                      );
                    }
                    return (
                      <li key={u.id}>
                        <Link
                          href={`/learn/${u.id}`}
                          aria-current={active ? "page" : undefined}
                          className={`flex items-center gap-2 rounded px-2 py-1 ${
                            active ? "bg-accent-soft font-medium text-ink" : "text-ink hover:bg-sunken"
                          }`}
                        >
                          <span className="flex-1">{u.title}</span>
                        </Link>
                        {u.sections && (
                          <ul className="my-1 ml-1 space-y-px">
                            {u.sections.map((s, i) => {
                              const isDone = hydrated && Boolean(done[sectionKey(u.id, s.id)]);
                              return (
                                <li key={s.id}>
                                  <Link
                                    href={`/learn/${u.id}#${s.id}`}
                                    className="flex items-center gap-2 rounded px-2 py-0.5 text-[12.5px] text-ink-2 hover:bg-sunken hover:text-ink"
                                  >
                                    <span
                                      className={`grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border text-[8px] ${
                                        isDone ? "border-ok bg-ok text-white" : "border-line text-ink-3"
                                      }`}
                                      aria-label={isDone ? "已完成" : "未完成"}
                                    >
                                      {isDone ? "✓" : ""}
                                    </span>
                                    <span className="num w-4 shrink-0 text-[10.5px] text-ink-3">{i + 1}</span>
                                    <span className="truncate">{s.title}</span>
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
