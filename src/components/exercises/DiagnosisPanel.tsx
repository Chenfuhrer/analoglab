"use client";

import Link from "next/link";
import { Rich } from "@/components/math/Tex";
import { UNIT_BY_ID } from "@/content/course";
import { RESOLVE_AFTER } from "@/exercises/diagnosis";
import { MISCONCEPTIONS, practiceHref, reviewHref, type MisconceptionId, type ReviewRef } from "@/exercises/misconceptions";

function reviewLabel(ref: ReviewRef): string {
  const u = UNIT_BY_ID[ref.unit];
  const s = u?.sections?.find((x) => x.id === ref.section);
  return s ? `${u.title} · ${s.title}` : (u?.title ?? ref.unit);
}

/** 行内错因标签 */
export function MisconceptionChip({ id }: { id: MisconceptionId }) {
  return (
    <span
      className="ml-1 inline-flex items-center rounded border border-warn/40 bg-warn-soft/60 px-1.5 align-middle text-[11.5px] leading-[18px] text-warn"
      data-testid="diag-chip"
      data-tag={id}
    >
      错因 · {MISCONCEPTIONS[id].short}
    </span>
  );
}

/** 错因卡片：解释 + 复习位置 + 同类错因练习 */
export function MisconceptionDetail({ id, showPractice = true, showTitle = true }: { id: MisconceptionId; showPractice?: boolean; showTitle?: boolean }) {
  const m = MISCONCEPTIONS[id];
  return (
    <div data-testid={`diag-${id}`}>
      {showTitle && <div className="text-[13.5px] font-semibold">{m.short}</div>}
      <div className="mt-0.5 text-[13px] leading-relaxed text-ink-2">
        <Rich text={m.explain} />
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px]">
        {m.review.map((rv) => (
          <Link key={`${rv.unit}#${rv.section}`} href={reviewHref(rv)} className="text-accent hover:underline">
            复习：{reviewLabel(rv)} →
          </Link>
        ))}
        {showPractice && (
          <Link href={practiceHref(id)} className="text-accent hover:underline" data-testid="diag-practice">
            同类错因练习 →
          </Link>
        )}
      </div>
    </div>
  );
}

/** 答错后的错因诊断面板 */
export function DiagnosisPanel({ ids }: { ids: MisconceptionId[] }) {
  if (!ids.length) return null;
  return (
    <section className="rounded-md border border-warn/40 bg-warn-soft/25 px-3 py-2.5" data-testid="diagnosis" aria-label="错因诊断">
      <div className="eyebrow mb-1.5">错因诊断</div>
      <ul className="space-y-3">
        {ids.map((id) => (
          <li key={id}>
            <MisconceptionDetail id={id} />
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11.5px] text-ink-3">
        诊断依据：你的答案恰好等于按这种错误思路得到的结果（选择题为所选选项对应的误区）。之后在其他题目上（含换一组参数）做对 {RESOLVE_AFTER} 次涉及它的题，进度页会把它标为“已纠正”。
      </p>
    </section>
  );
}
