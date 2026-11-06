"use client";

import { useEffect, useState, type ReactNode } from "react";
import { TutorPanel } from "@/components/tutor/TutorPanel";
import { OPEN_RAIL_EVENT } from "@/lib/events";

/**
 * 中栏 + 右栏布局。右栏：知识点索引 / 公式速查（由页面传入）+ AI 辅导面板（始终存在）。
 * 宽屏（xl）为第三栏；较窄屏幕时右栏收进抽屉，由顶栏的“辅助”按钮打开。
 */

export function Workspace({
  children,
  rail,
  railDefaultOpen = true,
}: {
  children: ReactNode;
  rail?: ReactNode;
  railDefaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(railDefaultOpen);
  const [sheet, setSheet] = useState(false);
  useEffect(() => {
    const openSheet = () => setSheet(true);
    window.addEventListener(OPEN_RAIL_EVENT, openSheet);
    return () => window.removeEventListener(OPEN_RAIL_EVENT, openSheet);
  }, []);
  return (
    <div className={`xl:grid ${open ? "xl:grid-cols-[minmax(0,1fr)_330px]" : "xl:grid-cols-[minmax(0,1fr)_44px]"}`}>
      <div className="min-w-0 px-4 pb-16 pt-6 sm:px-6 lg:px-8">{children}</div>

      {/* 宽屏右栏 */}
      <aside className="thin-scroll sticky top-14 hidden h-[calc(100vh-3.5rem)] overflow-y-auto border-l border-line xl:block" aria-label="辅助面板">
        {open ? (
          <div className="space-y-5 p-4">
            <div className="flex justify-end">
              <button type="button" className="text-[12px] text-ink-3 hover:text-ink" onClick={() => setOpen(false)} aria-label="收起辅助面板">
                收起 ⇥
              </button>
            </div>
            {rail}
            <TutorPanel />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-full w-full flex-col items-center gap-3 pt-6 text-[12px] text-ink-2 hover:bg-sunken"
            aria-label="展开辅助面板"
            data-testid="rail-open"
          >
            <span>⇤</span>
            <span style={{ writingMode: "vertical-rl" }}>{rail ? "索引 · 公式 · AI 助手" : "AI 学习助手"}</span>
          </button>
        )}
      </aside>

      {/* 窄屏：由顶栏“辅助”按钮打开的抽屉（不使用浮动按钮，避免遮挡正文） */}
      <div className={`fixed inset-0 z-50 xl:hidden ${sheet ? "" : "pointer-events-none"}`} aria-hidden={!sheet}>
        <div className={`absolute inset-0 bg-black/30 transition-opacity ${sheet ? "opacity-100" : "opacity-0"}`} onClick={() => setSheet(false)} />
        <div
          role="dialog"
          aria-label="辅助面板"
          className={`thin-scroll absolute inset-y-0 right-0 w-[92vw] max-w-[380px] overflow-y-auto border-l border-line bg-bg p-4 shadow-xl transition-transform duration-300 ${
            sheet ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold">辅助面板</span>
            <button type="button" className="grid h-8 w-8 place-items-center rounded-md hover:bg-sunken" onClick={() => setSheet(false)} aria-label="关闭">
              ✕
            </button>
          </div>
          {sheet && (
            <div className="space-y-5">
              {rail}
              <TutorPanel />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
