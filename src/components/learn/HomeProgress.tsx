"use client";

import Link from "next/link";
import { UNITS, sectionKey } from "@/content/course";
import { useHydrated, useProgress } from "@/lib/store";

/** 首页“继续学习”：只有存在学习记录时显示 */
export function HomeProgress() {
  const hydrated = useHydrated();
  const done = useProgress((s) => s.sectionsDone);
  const attempts = useProgress((s) => s.attempts);
  if (!hydrated) return null;
  const unit = UNITS.find((u) => u.status === "complete")!;
  const secs = unit.sections ?? [];
  const n = secs.filter((s) => done[sectionKey(unit.id, s.id)]).length;
  const next = secs.find((s) => !done[sectionKey(unit.id, s.id)]);
  const tried = Object.keys(attempts).length;
  if (n === 0 && tried === 0) return null;
  return (
    <section className="card mt-12 flex flex-wrap items-center gap-4 p-5" data-testid="home-progress">
      <div className="flex-1">
        <div className="eyebrow">继续学习</div>
        <p className="mt-1 text-[15px]">
          {unit.title}：已掌握 {n}/{secs.length} 个知识点 · 做过 {tried} 道题
        </p>
      </div>
      {next && (
        <Link href={`/learn/${unit.id}#${next.id}`} className="rounded-lg bg-accent px-4 py-2 text-[13.5px] font-medium text-accent-ink">
          下一节：{next.title} →
        </Link>
      )}
    </section>
  );
}
