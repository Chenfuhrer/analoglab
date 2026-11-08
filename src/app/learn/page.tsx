import type { Metadata } from "next";
import Link from "next/link";
import { CHAPTERS, UNITS, UNIT_BY_ID, unitsOfChapter } from "@/content/course";
import { Workspace } from "@/components/layout/Workspace";
import { PageContext } from "@/components/layout/PageContext";
import { UnitProgress } from "@/components/learn/UnitProgress";

export const metadata: Metadata = { title: "课程目录" };

export default function LearnPage() {
  return (
    <Workspace railDefaultOpen={false}>
      <PageContext page="课程目录" />
      <header className="mb-8 max-w-3xl">
        <div className="eyebrow">COURSE MAP</div>
        <h1 className="font-display mt-1 text-[30px] font-bold">课程目录</h1>
        <p className="mt-2 text-[14.5px] text-ink-2">
          按《模拟电子技术基础》（童诗白、华成英）的常见教学顺序组织为 12 章、{UNITS.length} 个单元。每个单元都包含完整讲解（物理直觉 → 概念 → 电路分析 → 推导 → 可视化 → 例题 → 总结）、由计算核心驱动的交互实验和三级练习。
        </p>
      </header>
      <ol className="space-y-8">
        {CHAPTERS.map((ch) => {
          const units = unitsOfChapter(ch.n);
          return (
            <li key={ch.n} id={`ch${ch.n}`} className="scroll-mt-20">
              <div className="mb-3 flex items-baseline gap-3 border-b border-line pb-2">
                <span className="num text-[13px] text-ink-3">CH {String(ch.n).padStart(2, "0")}</span>
                <h2 className="font-display text-[20px] font-bold">{ch.title}</h2>
                <span className="hidden text-[12px] text-ink-3 sm:inline">{ch.en}</span>
              </div>
              <p className="mb-3 text-[13.5px] text-ink-2">{ch.blurb}</p>
              <div className="grid gap-3 md:grid-cols-2">
                {units.map((u) => {
                  const pre = u.prereqs.map((id) => UNIT_BY_ID[id]?.title).filter(Boolean);
                  const body = (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-[15px] font-semibold">{u.title}</h3>
                        {u.status === "complete" ? (
                          <span className="shrink-0 rounded-full bg-ok-soft px-2 py-0.5 text-[11px] text-ok">已上线</span>
                        ) : (
                          <span className="shrink-0 rounded-full bg-sunken px-2 py-0.5 text-[11px] text-ink-3">规划中</span>
                        )}
                      </div>
                      <p className="mt-1 text-[13px] text-ink-2">{u.summary}</p>
                      <ul className="mt-2 space-y-0.5 text-[12.5px] text-ink-2">
                        {u.objectives.slice(0, 3).map((o) => (
                          <li key={o}>· {o}</li>
                        ))}
                      </ul>
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] text-ink-3">
                        <span>教材：{u.textbook}</span>
                        {pre.length > 0 && <span>先修：{pre.join("、")}</span>}
                      </div>
                      {u.status === "complete" && <UnitProgress unitId={u.id} />}
                    </>
                  );
                  return u.status === "complete" ? (
                    <Link key={u.id} id={u.id} href={`/learn/${u.id}`} className="card block scroll-mt-24 p-4 transition-colors hover:border-accent" data-testid={`unit-${u.id}`}>
                      {body}
                    </Link>
                  ) : (
                    <div key={u.id} id={u.id} className="scroll-mt-24 rounded-[10px] border border-dashed border-line p-4">
                      {body}
                    </div>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ol>
    </Workspace>
  );
}
