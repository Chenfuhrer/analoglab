"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { sectionKey } from "@/content/course";
import { useHydrated, useProgress } from "@/lib/store";
import { Rich, Tex } from "@/components/math/Tex";
import { cx } from "@/components/ui/primitives";

export const STAGES = {
  intuition: { label: "物理直觉", color: "text-dc border-dc/40" },
  concept: { label: "基础概念", color: "text-accent border-accent/40" },
  analysis: { label: "电路分析", color: "text-ac border-ac/40" },
  derivation: { label: "数学推导", color: "text-ss border-ss/40" },
  visual: { label: "可视化验证", color: "text-ch3 border-ch3/40" },
  example: { label: "例题", color: "text-ok border-ok/40" },
  practice: { label: "练习", color: "text-warn border-warn/40" },
  summary: { label: "总结", color: "text-ink-2 border-line" },
} as const;

export type StageKind = keyof typeof STAGES;

export function Section({
  unitId,
  id,
  n,
  title,
  children,
}: {
  unitId: string;
  id: string;
  n: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} data-section={id} className="scroll-mt-20 border-t border-line pt-10 first:border-t-0 first:pt-2" aria-labelledby={`${id}-h`}>
      <div className="mb-1 flex items-baseline gap-3">
        <span className="num text-[13px] text-ink-3">{String(n).padStart(2, "0")}</span>
        <h2 id={`${id}-h`} className="font-display text-[24px] font-bold leading-tight">
          {title}
        </h2>
      </div>
      <div className="prose-lab">{children}</div>
      <SectionDone unitId={unitId} sectionId={id} />
    </section>
  );
}

export function Stage({ kind, title, children }: { kind: StageKind; title?: string; children: ReactNode }) {
  const s = STAGES[kind];
  return (
    <div className="mt-7" data-stage={kind}>
      <div className="mb-2 flex items-center gap-2">
        <span className={cx("rounded border px-1.5 py-[1px] text-[11px] font-medium tracking-wide", s.color)}>{s.label}</span>
        {title && <h3 className="text-[16.5px] font-semibold">{title}</h3>}
      </div>
      {children}
    </div>
  );
}

/** 本知识点要回答的问题（对应课程设计中的 14 个核心问题） */
export function Question({ n, children }: { n: number; children: string }) {
  return (
    <div className="mt-6 flex gap-3 rounded-lg border border-line bg-elev px-4 py-3">
      <span className="num mt-0.5 shrink-0 text-[12px] font-medium text-accent">Q{n}</span>
      <div className="text-[15px] font-semibold">
        <Rich text={children} />
      </div>
    </div>
  );
}

export function Eq({ children, label, note }: { children: string; label?: string; note?: string }) {
  return (
    <div className="my-3 rounded-lg border border-line-2 bg-elev/70 px-4 py-1">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <Tex block>{children}</Tex>
        </div>
        {label && <span className="num shrink-0 text-[12px] text-ink-3">({label})</span>}
      </div>
      {note && (
        <div className="border-t border-line-2 py-1.5 text-[12.5px] text-ink-2">
          <Rich text={note} />
        </div>
      )}
    </div>
  );
}

export function VarTable({ rows }: { rows: Array<[string, string, string]> }) {
  return (
    <div className="my-3 overflow-x-auto">
      <table className="w-full border-collapse text-[13.5px]">
        <thead>
          <tr className="border-b border-line text-left text-[12px] text-ink-3">
            <th className="py-1.5 pr-4 font-normal">符号</th>
            <th className="py-1.5 pr-4 font-normal">含义</th>
            <th className="py-1.5 font-normal">单位 / 备注</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([a, b, c]) => (
            <tr key={a} className="border-b border-line-2">
              <td className="py-1.5 pr-4">
                <Rich text={a} />
              </td>
              <td className="py-1.5 pr-4">
                <Rich text={b} />
              </td>
              <td className="py-1.5 text-ink-2">
                <Rich text={c} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Bullets({ items }: { items: string[] }) {
  return (
    <ul>
      {items.map((t, i) => (
        <li key={i}>
          <Rich text={t} />
        </li>
      ))}
    </ul>
  );
}

export function PracticeLink({ topic, label }: { topic: string; label?: string }) {
  return (
    <Link
      href={`/practice?topic=${topic}`}
      className="inline-flex items-center gap-1.5 rounded-md border border-line bg-elev px-3 py-1.5 text-[13.5px] hover:border-accent"
    >
      <span className="text-warn">✎</span> {label ?? "去做本知识点的练习"} →
    </Link>
  );
}

function SectionDone({ unitId, sectionId }: { unitId: string; sectionId: string }) {
  const hydrated = useHydrated();
  const key = sectionKey(unitId, sectionId);
  const done = useProgress((s) => Boolean(s.sectionsDone[key]));
  const set = useProgress((s) => s.setSectionDone);
  const isDone = hydrated && done;
  return (
    <div className="mt-8 flex items-center gap-3">
      <button
        type="button"
        onClick={() => set(key, !isDone)}
        data-testid={`done-${sectionId}`}
        aria-pressed={isDone}
        className={cx(
          "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-[13px] transition-colors",
          isDone ? "border-ok/50 bg-ok-soft text-ok" : "border-line bg-elev text-ink-2 hover:border-ok/60 hover:text-ok",
        )}
      >
        <span className={cx("grid h-4 w-4 place-items-center rounded-full border text-[10px]", isDone ? "border-ok bg-ok text-white" : "border-current")}>
          {isDone ? "✓" : ""}
        </span>
        {isDone ? "已掌握本知识点" : "标记为已掌握"}
      </button>
    </div>
  );
}
