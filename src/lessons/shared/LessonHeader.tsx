import Link from "next/link";
import { P } from "@/components/math/Tex";
import { Rich } from "@/components/math/Tex";
import { Callout } from "@/components/ui/primitives";
import { CHAPTERS, UNIT_BY_ID } from "@/content/course";

/** 通用单元页头：章节、标题、学习目标、学习路径、先修单元 */
export function LessonHeader({ unitId, path, note, lab }: { unitId: string; path: string; note?: string; lab?: { href: string; label: string } }) {
  const u = UNIT_BY_ID[unitId];
  const ch = CHAPTERS.find((c) => c.n === u.chapter)!;
  const pre = u.prereqs.map((id) => UNIT_BY_ID[id]).filter(Boolean);
  return (
    <header className="mb-8">
      <div className="eyebrow">
        第 {u.chapter} 章 · {ch.title} · 对应教材 {u.textbook}
      </div>
      <h1 className="font-display mt-2 text-[34px] font-bold leading-tight">{u.title}</h1>
      <p className="mt-3 text-[15.5px] leading-relaxed text-ink-2">
        <Rich text={u.summary} />
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-line bg-elev p-4">
          <div className="eyebrow mb-2">学完你应该能够</div>
          <ul className="space-y-1 text-[13.5px]">
            {u.objectives.map((o) => (
              <li key={o} className="flex gap-2">
                <span className="text-ok">✓</span>
                <Rich text={o} />
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-line bg-elev p-4 text-[13.5px]">
          <div className="eyebrow mb-2">学习路径</div>
          <p className="text-ink-2">
            <Rich text={path} />
          </p>
          <p className="mt-2 text-ink-2">
            先修：
            {pre.length === 0 && <span className="text-ink-3">无（高中物理与电路基础即可）</span>}
            {pre.map((p, i) => (
              <span key={p.id}>
                {i > 0 && "、"}
                <Link className="text-accent hover:underline" href={`/learn/${p.id}`}>
                  {p.title}
                </Link>
              </span>
            ))}
            。
            {lab && (
              <>
                {" "}配合{" "}
                <Link className="text-accent hover:underline" href={lab.href}>
                  {lab.label}
                </Link>{" "}
                边学边调。
              </>
            )}
          </p>
        </div>
      </div>
      {note && (
        <Callout kind="note" title="阅读提示">
          <P>{note}</P>
        </Callout>
      )}
    </header>
  );
}

/** 单元正文外壳 */
export function LessonArticle({ unitId, children }: { unitId: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-[860px]" data-testid={`lesson-${unitId}`}>
      {children}
    </article>
  );
}
