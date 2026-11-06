import type { Metadata } from "next";
import { Workspace } from "@/components/layout/Workspace";
import { PageContext } from "@/components/layout/PageContext";
import { UNITS } from "@/content/course";
import { KnowledgeGraph } from "./KnowledgeGraph";

export const metadata: Metadata = { title: "知识图谱" };

export default function GraphPage() {
  const edges = UNITS.reduce((n, u) => n + u.prereqs.length, 0);
  return (
    <Workspace railDefaultOpen={false}>
      <PageContext page="知识图谱" />
      <h1 className="font-display text-[28px] font-bold">知识图谱</h1>
      <p className="mb-5 mt-1 max-w-3xl text-[14px] text-ink-2">
        {UNITS.length} 个单元、{edges} 条先修关系，按“最长先修链”从左到右分层：越靠右的单元依赖越多前置知识。左侧色条表示所属章节。
      </p>
      <KnowledgeGraph />
    </Workspace>
  );
}
