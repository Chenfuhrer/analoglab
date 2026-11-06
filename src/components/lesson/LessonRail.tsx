"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { sectionKey, type SectionMeta } from "@/content/course";
import { formulasOfUnit } from "@/formulas/library";
import { useHydrated, useProgress } from "@/lib/store";
import { useTutorContext } from "@/lib/tutor-context";
import { Rich, Tex } from "@/components/math/Tex";

/** 右栏：知识点索引（滚动跟随 + 完成状态）与本单元公式速查 */
export function LessonRail({ unitId, unitTitle, sections }: { unitId: string; unitTitle: string; sections: SectionMeta[] }) {
  const [active, setActive] = useState(sections[0]?.id);
  const hydrated = useHydrated();
  const done = useProgress((s) => s.sectionsDone);
  const setLesson = useTutorContext((s) => s.setLesson);

  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    // 记录当前与“阅读带”相交的所有知识点，取文档顺序中的第一个
    const inBand = new Set<string>();
    const order = sections.map((s) => s.id);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) inBand.add(e.target.id);
          else inBand.delete(e.target.id);
        }
        const first = order.find((id) => inBand.has(id));
        if (first) setActive(first);
      },
      { rootMargin: "-80px 0px -60% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections]);

  useEffect(() => {
    const s = sections.find((x) => x.id === active);
    setLesson({ unitId, unitTitle, sectionId: s?.id, sectionTitle: s?.title });
  }, [active, sections, unitId, unitTitle, setLesson]);

  const formulas = formulasOfUnit(unitId);
  const count = sections.filter((s) => hydrated && done[sectionKey(unitId, s.id)]).length;

  return (
    <div className="space-y-5">
      <nav aria-label="知识点索引">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="eyebrow">知识点索引</span>
          <span className="num text-[11.5px] text-ink-3">
            {hydrated ? count : "—"}/{sections.length}
          </span>
        </div>
        <ol className="space-y-px border-l border-line">
          {sections.map((s, i) => {
            const isActive = s.id === active;
            const isDone = hydrated && Boolean(done[sectionKey(unitId, s.id)]);
            return (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className={`-ml-px flex items-center gap-2 border-l-2 py-1 pl-3 pr-1 text-[13px] ${
                    isActive ? "border-accent font-medium text-ink" : "border-transparent text-ink-2 hover:text-ink"
                  }`}
                >
                  <span className="num w-4 text-[10.5px] text-ink-3">{i + 1}</span>
                  <span className="flex-1">{s.title}</span>
                  {isDone && <span className="text-[11px] text-ok">✓</span>}
                </a>
                {isActive && s.questions && (
                  <ul className="mb-1 ml-9 space-y-0.5">
                    {s.questions.map((q) => (
                      <li key={q} className="text-[11.5px] leading-snug text-ink-3">
                        · {q}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      {formulas.length > 0 && (
        <section aria-label="公式速查">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="eyebrow">公式速查</span>
            <Link href="/formulas" className="text-[11.5px] text-accent hover:underline">
              全部 →
            </Link>
          </div>
          <div className="space-y-2">
            {formulas.map((f) => (
              <a key={f.id} href={`#${f.ref?.split("#")[1]}`} className="block rounded-md border border-line-2 bg-elev px-2.5 py-1.5 hover:border-accent">
                <div className="text-[11.5px] text-ink-3">{f.title}</div>
                <div className="thin-scroll overflow-x-auto whitespace-nowrap text-[13px]">
                  <Tex>{f.tex}</Tex>
                </div>
                {f.conditions[0] && (
                  <div className="text-[11px] text-ink-3">
                    <Rich text={`条件：${f.conditions[0]}`} />
                  </div>
                )}
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
