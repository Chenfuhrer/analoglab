import type { Metadata } from "next";
import { Suspense } from "react";
import { Workspace } from "@/components/layout/Workspace";
import { PageContext } from "@/components/layout/PageContext";
import { ALL_TEMPLATES } from "@/exercises/bank";
import { PracticeClient } from "./PracticeClient";

export const metadata: Metadata = { title: "练习中心" };

export default function PracticePage() {
  const n = ALL_TEMPLATES.length;
  const gen = ALL_TEMPLATES.filter((t) => t.generate).length;
  return (
    <Workspace>
      <PageContext page="练习中心" />
      <header className="mb-6">
        <h1 className="font-display text-[28px] font-bold">练习中心</h1>
        <p className="mt-1 max-w-3xl text-[14px] text-ink-2">
          共 {n} 个题型，其中 {gen} 个为参数化题型（每次“换一组参数”都是新题，答案由计算核心给出）。数值题按量纲与相对误差自动判分，并对常见错误给出原因分析；答错的题自动进入错题本。
        </p>
      </header>
      <Suspense fallback={<div className="text-[13px] text-ink-3">加载题目…</div>}>
        <PracticeClient />
      </Suspense>
    </Workspace>
  );
}
