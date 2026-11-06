"use client";

import Link from "next/link";
import { Workspace } from "@/components/layout/Workspace";
import { PageContext } from "@/components/layout/PageContext";
import { CHAPTERS, UNITS, UNIT_BY_ID, sectionKey } from "@/content/course";
import { ALL_TEMPLATES } from "@/exercises/bank";
import { LEVEL_LABEL, TOPIC_LABEL, type Level } from "@/exercises/types";
import { useHydrated, useProgress } from "@/lib/store";
import { Button } from "@/components/ui/primitives";

export default function ProgressPage() {
  const hydrated = useHydrated();
  const { sectionsDone, attempts, mistakes, activity, resetAll } = useProgress();
  const complete = UNITS.filter((u) => u.status === "complete");
  const totalSections = complete.reduce((n, u) => n + (u.sections?.length ?? 0), 0);
  const doneSections = hydrated ? complete.reduce((n, u) => n + (u.sections ?? []).filter((s) => sectionsDone[sectionKey(u.id, s.id)]).length, 0) : 0;
  const att = hydrated ? Object.values(attempts) : [];
  const correct = att.filter((a) => a.correct).length;
  const firstTry = att.filter((a) => a.firstCorrectOnTry === 1).length;
  const byLevel = ([1, 2, 3] as Level[]).map((l) => {
    const xs = att.filter((a) => a.level === l);
    return { l, n: xs.length, ok: xs.filter((a) => a.correct).length, templates: ALL_TEMPLATES.filter((t) => t.level === l).length };
  });
  const byTopic = Object.keys(TOPIC_LABEL).map((t) => {
    const xs = att.filter((a) => a.topic === t);
    return { t, n: xs.length, ok: xs.filter((a) => a.correct).length };
  });
  const days = new Set(hydrated ? activity.map((a) => new Date(a.t).toDateString()) : []);

  return (
    <Workspace>
      <PageContext page="学习进度" />
      <h1 className="font-display text-[28px] font-bold">学习进度</h1>
      <p className="mt-1 text-[14px] text-ink-2">数据保存在本浏览器（localStorage），不会上传。</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-testid="progress-stats">
        <Stat label="已掌握知识点" value={hydrated ? `${doneSections}/${totalSections}` : "—"} sub="标记为“已掌握”的知识点" />
        <Stat label="做过的题目" value={hydrated ? String(att.length) : "—"} sub={`其中做对 ${correct}，一次做对 ${firstTry}`} />
        <Stat label="错题本" value={hydrated ? String(Object.keys(mistakes).length) : "—"} sub="含自动收录与手动收藏" />
        <Stat label="学习天数" value={hydrated ? String(days.size) : "—"} sub="有学习记录的天数" />
      </div>

      <section className="mt-8">
        <h2 className="font-display mb-3 text-[19px] font-bold">课程进度</h2>
        <div className="space-y-2">
          {CHAPTERS.map((ch) => {
            const us = UNITS.filter((u) => u.chapter === ch.n);
            const live = us.filter((u) => u.status === "complete");
            return (
              <div key={ch.n} className="flex items-center gap-3 text-[13.5px]">
                <span className="num w-10 text-ink-3">CH{String(ch.n).padStart(2, "0")}</span>
                <span className="w-32 shrink-0">{ch.title}</span>
                <div className="flex flex-1 gap-1">
                  {us.map((u) => {
                    const secs = u.sections ?? [];
                    const d = hydrated ? secs.filter((s) => sectionsDone[sectionKey(u.id, s.id)]).length : 0;
                    const pct = secs.length ? d / secs.length : 0;
                    return (
                      <Link
                        key={u.id}
                        href={u.status === "complete" ? `/learn/${u.id}` : `/learn#${u.id}`}
                        title={`${u.title}${u.status === "complete" ? `：${d}/${secs.length}` : "（规划中）"}`}
                        className={`h-3 flex-1 overflow-hidden rounded-sm ${u.status === "complete" ? "bg-sunken ring-1 ring-accent/40" : "bg-line-2"}`}
                      >
                        {u.status === "complete" && <span className="block h-full bg-accent" style={{ width: `${pct * 100}%` }} />}
                      </Link>
                    );
                  })}
                </div>
                <span className="w-16 text-right text-[11.5px] text-ink-3">{live.length ? `${live.length} 单元上线` : "规划中"}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="font-display mb-3 text-[19px] font-bold">按难度</h2>
          <table className="w-full text-[13.5px]">
            <tbody>
              {byLevel.map(({ l, n, ok, templates }) => (
                <tr key={l} className="border-b border-line-2">
                  <td className="py-1.5">{LEVEL_LABEL[l]}</td>
                  <td className="num text-right">{n} 题</td>
                  <td className="num text-right">{n ? `${Math.round((ok / n) * 100)}% 正确` : "—"}</td>
                  <td className="num text-right text-ink-3">{templates} 个题型</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h2 className="font-display mb-3 text-[19px] font-bold">按知识点</h2>
          <div className="space-y-1.5">
            {byTopic.map(({ t, n, ok }) => (
              <div key={t} className="flex items-center gap-3 text-[13px]">
                <Link href={`/practice?topic=${t}`} className="w-28 shrink-0 hover:text-accent">
                  {TOPIC_LABEL[t]}
                </Link>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-sunken">
                  <div className="h-full rounded-full bg-ok" style={{ width: `${n ? (ok / n) * 100 : 0}%` }} />
                </div>
                <span className="num w-16 text-right text-[11.5px] text-ink-3">{n ? `${ok}/${n}` : "未练习"}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display mb-3 text-[19px] font-bold">最近活动</h2>
        {hydrated && activity.length === 0 && <p className="text-[13.5px] text-ink-3">暂无记录。</p>}
        <ul className="space-y-1 text-[13px]" data-testid="activity">
          {(hydrated ? activity.slice(0, 15) : []).map((a, i) => {
            const label =
              a.kind === "section"
                ? `掌握知识点：${UNIT_BY_ID[a.id.split("#")[0]]?.sections?.find((s) => s.id === a.id.split("#")[1])?.title ?? a.id}`
                : `${a.ok ? "做对" : "做错"}：${attempts[a.id]?.title ?? a.id}`;
            return (
              <li key={i} className="flex gap-3">
                <span className="num w-36 shrink-0 text-ink-3">{new Date(a.t).toLocaleString("zh-CN", { hour12: false })}</span>
                <span className={a.kind === "exercise" ? (a.ok ? "text-ok" : "text-err") : ""}>{label}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="mt-10">
        <Button
          variant="danger"
          size="sm"
          onClick={() => {
            if (window.confirm("确定清空本浏览器中的全部学习记录（知识点进度、做题记录、错题本）？此操作不可撤销。")) resetAll();
          }}
        >
          清空学习记录
        </Button>
      </div>
    </Workspace>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="card p-4">
      <div className="text-[12px] text-ink-3">{label}</div>
      <div className="num mt-1 text-[26px] font-medium">{value}</div>
      <div className="text-[11.5px] text-ink-3">{sub}</div>
    </div>
  );
}
