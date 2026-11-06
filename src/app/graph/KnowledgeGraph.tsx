"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CHAPTERS, UNITS, UNIT_BY_ID, sectionKey, type Unit } from "@/content/course";
import { useHydrated, useProgress } from "@/lib/store";

const COL_W = 196;
const NODE_W = 168;
const NODE_H = 40;
const ROW_H = 50;
const PAD = 24;

/** 最长先修链分层（DAG），同层按章节排序 */
function layout(units: Unit[]) {
  const depth: Record<string, number> = {};
  const d = (id: string, seen = new Set<string>()): number => {
    if (depth[id] !== undefined) return depth[id];
    if (seen.has(id)) return 0;
    seen.add(id);
    const u = UNIT_BY_ID[id];
    const v = u && u.prereqs.length ? 1 + Math.max(...u.prereqs.map((p) => d(p, seen))) : 0;
    depth[id] = v;
    return v;
  };
  units.forEach((u) => d(u.id));
  const layers: Unit[][] = [];
  for (const u of units) (layers[depth[u.id]] ??= []).push(u);
  layers.forEach((l) => l.sort((a, b) => a.chapter - b.chapter));
  const pos: Record<string, { x: number; y: number }> = {};
  layers.forEach((l, i) => l.forEach((u, j) => (pos[u.id] = { x: PAD + i * COL_W, y: PAD + j * ROW_H })));
  const w = PAD * 2 + (layers.length - 1) * COL_W + NODE_W;
  const h = PAD * 2 + Math.max(...layers.map((l) => l.length)) * ROW_H;
  return { pos, w, h };
}

function related(id: string, dir: "up" | "down"): Set<string> {
  const out = new Set<string>();
  const stack = [id];
  while (stack.length) {
    const cur = stack.pop()!;
    const next = dir === "up" ? (UNIT_BY_ID[cur]?.prereqs ?? []) : UNITS.filter((u) => u.prereqs.includes(cur)).map((u) => u.id);
    for (const n of next) {
      if (out.has(n)) continue;
      out.add(n);
      stack.push(n);
    }
  }
  return out;
}

const HUES = ["#b45309", "#0e7490", "#2341c4", "#6d28d9", "#a21caf", "#15803d", "#b91c1c", "#0369a1", "#7c2d12", "#4d7c0f", "#9d174d", "#334155"];

export function KnowledgeGraph() {
  const router = useRouter();
  const { pos, w, h } = useMemo(() => layout(UNITS), []);
  const [hover, setHover] = useState<string | null>(null);
  const [sel, setSel] = useState<string | null>("ce-amplifier");
  const hydrated = useHydrated();
  const done = useProgress((s) => s.sectionsDone);
  const focus = hover ?? sel;
  const up = useMemo(() => (focus ? related(focus, "up") : new Set<string>()), [focus]);
  const down = useMemo(() => (focus ? related(focus, "down") : new Set<string>()), [focus]);
  const selected = sel ? UNIT_BY_ID[sel] : null;

  const progressOf = (u: Unit) => {
    if (!u.sections || !hydrated) return 0;
    return u.sections.filter((s) => done[sectionKey(u.id, s.id)]).length / u.sections.length;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 text-[12px] text-ink-2">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-5 rounded-sm border-2 border-accent bg-accent-soft" /> 已上线
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-5 rounded-sm border border-dashed border-ink-3" /> 规划中
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-5 bg-dc" /> 先修链
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-5 bg-ac" /> 后续单元
        </span>
        <span className="text-ink-3">悬停查看依赖；点击查看详情，已上线单元可进入学习。</span>
      </div>
      <div className="card thin-scroll overflow-auto" data-testid="knowledge-graph">
        <svg width={w} height={h} role="img" aria-label="课程知识图谱" className="block">
          {UNITS.flatMap((u) =>
            u.prereqs.map((p) => {
              const a = pos[p];
              const b = pos[u.id];
              if (!a || !b) return null;
              const x1 = a.x + NODE_W;
              const y1 = a.y + NODE_H / 2;
              const x2 = b.x;
              const y2 = b.y + NODE_H / 2;
              const mx = (x1 + x2) / 2;
              const onUp = focus && (u.id === focus || up.has(u.id)) && (up.has(p) || p === focus);
              const onDown = focus && (p === focus || down.has(p)) && down.has(u.id);
              const color = onUp ? "var(--dc)" : onDown ? "var(--ac)" : "var(--line)";
              return (
                <path
                  key={`${p}-${u.id}`}
                  d={`M${x1} ${y1} C${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                  fill="none"
                  stroke={color}
                  strokeWidth={onUp || onDown ? 2 : 1.2}
                  opacity={focus && !onUp && !onDown ? 0.5 : 1}
                />
              );
            }),
          )}
          {UNITS.map((u) => {
            const p = pos[u.id];
            const live = u.status === "complete";
            const dim = focus && u.id !== focus && !up.has(u.id) && !down.has(u.id);
            const prog = progressOf(u);
            return (
              <g
                key={u.id}
                transform={`translate(${p.x},${p.y})`}
                onMouseEnter={() => setHover(u.id)}
                onMouseLeave={() => setHover(null)}
                onClick={() => (sel === u.id && live ? router.push(`/learn/${u.id}`) : setSel(u.id))}
                className="cursor-pointer"
                opacity={dim ? 0.35 : 1}
                data-testid={`node-${u.id}`}
                role="button"
                aria-label={`${u.title}（${live ? "已上线" : "规划中"}）`}
              >
                <rect
                  width={NODE_W}
                  height={NODE_H}
                  rx={7}
                  fill={live ? "var(--accent-soft)" : "var(--bg-elev)"}
                  stroke={u.id === sel ? "var(--ink)" : live ? "var(--accent)" : "var(--ink-3)"}
                  strokeWidth={u.id === sel ? 2 : live ? 1.8 : 1}
                  strokeDasharray={live ? undefined : "4 3"}
                />
                <rect width={4} height={NODE_H} rx={2} fill={HUES[(u.chapter - 1) % HUES.length]} />
                <text x={12} y={17} fontSize={12} fill="var(--ink)" fontWeight={live ? 600 : 400}>
                  {u.title.length > 12 ? u.title.slice(0, 12) + "…" : u.title}
                </text>
                <text x={12} y={31} fontSize={10} fill="var(--ink-3)">
                  CH{u.chapter} · {CHAPTERS[u.chapter - 1].title}
                </text>
                {live && prog > 0 && <rect x={8} y={NODE_H - 4} width={(NODE_W - 16) * prog} height={2} fill="var(--ok)" />}
              </g>
            );
          })}
        </svg>
      </div>
      {selected && (
        <div className="card p-4" data-testid="graph-detail">
          <div className="flex flex-wrap items-baseline gap-2">
            <h3 className="text-[16px] font-semibold">{selected.title}</h3>
            <span className="text-[12px] text-ink-3">
              第 {selected.chapter} 章 · {selected.textbook} · {selected.status === "complete" ? "已上线" : "规划中"}
            </span>
          </div>
          <p className="mt-1 text-[13.5px] text-ink-2">{selected.summary}</p>
          <div className="mt-2 grid gap-2 text-[12.5px] sm:grid-cols-2">
            <div>
              <span className="text-ink-3">先修：</span>
              {selected.prereqs.length ? selected.prereqs.map((id) => UNIT_BY_ID[id]?.title).join("、") : "无"}
            </div>
            <div>
              <span className="text-ink-3">后续：</span>
              {UNITS.filter((u) => u.prereqs.includes(selected.id))
                .map((u) => u.title)
                .join("、") || "无"}
            </div>
          </div>
          {selected.status === "complete" && (
            <button type="button" onClick={() => router.push(`/learn/${selected.id}`)} className="mt-3 rounded-md bg-accent px-3 py-1 text-[13px] font-medium text-accent-ink">
              进入学习 →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
