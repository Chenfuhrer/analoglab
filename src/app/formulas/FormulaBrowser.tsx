"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CHAPTERS } from "@/content/course";
import { FORMULAS } from "@/formulas/library";
import { Rich, Tex } from "@/components/math/Tex";

export function FormulaBrowser() {
  const [q, setQ] = useState("");
  const [ch, setCh] = useState<number | 0>(0);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return FORMULAS.filter(
      (f) =>
        (ch === 0 || f.chapter === ch) &&
        (!s || f.title.toLowerCase().includes(s) || f.tex.toLowerCase().includes(s) || f.vars.some((v) => v.name.includes(s) || v.sym.toLowerCase().includes(s)) || (f.tags ?? []).some((t) => t.toLowerCase().includes(s))),
    );
  }, [q, ch]);
  const chapters = CHAPTERS.filter((c) => FORMULAS.some((f) => f.chapter === c.n));
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索：如 r_be、输入电阻、Q点…"
          aria-label="搜索公式"
          data-testid="formula-search"
          className="w-64 rounded-md border border-line bg-elev px-3 py-1.5 text-[13.5px] focus:border-accent focus:outline-none"
        />
        <button type="button" onClick={() => setCh(0)} className={`rounded-full border px-3 py-0.5 text-[12.5px] ${ch === 0 ? "border-accent bg-accent-soft" : "border-line bg-elev text-ink-2"}`}>
          全部
        </button>
        {chapters.map((c) => (
          <button
            key={c.n}
            type="button"
            onClick={() => setCh(c.n)}
            className={`rounded-full border px-3 py-0.5 text-[12.5px] ${ch === c.n ? "border-accent bg-accent-soft" : "border-line bg-elev text-ink-2"}`}
          >
            第 {c.n} 章
          </button>
        ))}
        <span className="num ml-auto text-[12px] text-ink-3">{list.length} 条</span>
      </div>
      <div className="grid gap-4 lg:grid-cols-2" data-testid="formula-list">
        {list.map((f) => (
          <article key={f.id} className="card p-4" data-testid="formula-card">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-[15px] font-semibold">{f.title}</h3>
              <span className="text-[11.5px] text-ink-3">第 {f.chapter} 章</span>
            </div>
            <div className="mt-1 overflow-x-auto">
              <Tex block>{f.tex}</Tex>
            </div>
            {f.vars.length > 0 && (
              <dl className="mt-1 grid grid-cols-[auto_1fr_auto] gap-x-3 gap-y-0.5 text-[12.5px]">
                {f.vars.map((v) => (
                  <div key={v.sym} className="contents">
                    <dt>
                      <Tex>{v.sym}</Tex>
                    </dt>
                    <dd className="text-ink-2">{v.name}</dd>
                    <dd className="num text-ink-3">{v.unit}</dd>
                  </div>
                ))}
              </dl>
            )}
            <ul className="mt-2 space-y-0.5 text-[12.5px] text-ink-2">
              {f.conditions.map((c) => (
                <li key={c}>
                  <span className="mr-1 text-warn">条件</span>
                  <Rich text={c} />
                </li>
              ))}
            </ul>
            {f.ref ? (
              <Link href={`/learn/${f.ref.replace("#", "#")}`} className="mt-2 inline-block text-[12.5px] text-accent hover:underline">
                查看推导 →
              </Link>
            ) : (
              <p className="mt-2 text-[11.5px] text-ink-3">推导所在单元规划中</p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
