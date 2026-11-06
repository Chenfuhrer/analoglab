"use client";

import { UNIT_BY_ID, sectionKey } from "@/content/course";
import { useHydrated, useProgress } from "@/lib/store";

export function UnitProgress({ unitId }: { unitId: string }) {
  const hydrated = useHydrated();
  const done = useProgress((s) => s.sectionsDone);
  const secs = UNIT_BY_ID[unitId]?.sections ?? [];
  const n = hydrated ? secs.filter((s) => done[sectionKey(unitId, s.id)]).length : 0;
  const pct = secs.length ? (n / secs.length) * 100 : 0;
  return (
    <div className="mt-3">
      <div className="flex justify-between text-[11.5px] text-ink-3">
        <span>知识点进度</span>
        <span className="num">
          {hydrated ? n : "—"}/{secs.length}
        </span>
      </div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-sunken">
        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
