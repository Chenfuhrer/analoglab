"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { CourseNav } from "./CourseNav";
import { ThemeToggle } from "./ThemeToggle";
import { Logo } from "./Logo";
import { OPEN_RAIL_EVENT } from "@/lib/events";

export const NAV = [
  { href: "/learn", label: "课程" },
  { href: "/lab", label: "实验室" },
  { href: "/practice", label: "练习" },
  { href: "/mistakes", label: "错题本" },
  { href: "/progress", label: "进度" },
  { href: "/formulas", label: "公式" },
  { href: "/graph", label: "图谱" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  // 路由变化时关闭抽屉（渲染期间同步，避免 effect 中 setState）
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setDrawer(false);
  }

  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer]);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded focus:bg-accent focus:px-3 focus:py-1 focus:text-accent-ink"
      >
        跳到正文
      </a>
      <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1680px] items-center gap-3 px-3 sm:px-5">
          <button
            type="button"
            className="-ml-1 grid h-9 w-9 place-items-center rounded-md text-ink-2 hover:bg-sunken lg:hidden"
            aria-label="打开课程导航"
            aria-expanded={drawer}
            onClick={() => setDrawer(true)}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
              <path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
          <Link href="/" className="flex items-center gap-2.5" aria-label="AnalogLab 首页">
            <Logo />
            <span className="text-[15px] font-semibold tracking-tight">
              Analog<span className="text-accent">Lab</span>
            </span>
          </Link>
          <nav className="ml-4 hidden items-center gap-0.5 md:flex" aria-label="主导航">
            {NAV.map((n) => {
              const active = pathname === n.href || pathname.startsWith(n.href + "/");
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-md px-2.5 py-1.5 text-[13.5px] transition-colors ${
                    active ? "bg-sunken font-medium text-ink" : "text-ink-2 hover:bg-sunken hover:text-ink"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <Link
              href="/notation"
              className="hidden rounded-md px-2.5 py-1.5 text-[13px] text-ink-2 hover:bg-sunken hover:text-ink sm:block"
            >
              符号约定
            </Link>
            {pathname !== "/" && (
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event(OPEN_RAIL_EVENT))}
                className="flex h-9 items-center gap-1 rounded-md px-2 text-[13px] text-ink-2 hover:bg-sunken hover:text-ink xl:hidden"
                aria-label="打开辅助面板（知识点索引、公式、AI 助手）"
                data-testid="rail-fab"
              >
                <span aria-hidden>◐</span>
                <span>辅助</span>
              </button>
            )}
            <ThemeToggle />
          </div>
        </div>
        <nav
          className="thin-scroll flex gap-1 overflow-x-auto border-t border-line-2 px-3 py-1.5 md:hidden"
          aria-label="主导航（移动端）"
        >
          {NAV.map((n) => {
            const active = pathname === n.href || pathname.startsWith(n.href + "/");
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`shrink-0 rounded-md px-2.5 py-1 text-[13px] ${active ? "bg-sunken font-medium" : "text-ink-2"}`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <div className="mx-auto flex max-w-[1680px]">
        <aside
          className="thin-scroll sticky top-14 hidden h-[calc(100vh-3.5rem)] w-[272px] shrink-0 overflow-y-auto border-r border-line lg:block"
          aria-label="课程导航"
        >
          <CourseNav />
        </aside>
        <div id="main" className="min-w-0 flex-1">
          {children}
        </div>
      </div>

      {/* 移动端抽屉 */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${drawer ? "" : "pointer-events-none"}`}
        aria-hidden={!drawer}
      >
        <div
          className={`absolute inset-0 bg-black/30 transition-opacity ${drawer ? "opacity-100" : "opacity-0"}`}
          onClick={() => setDrawer(false)}
        />
        <div
          role="dialog"
          aria-label="课程导航"
          className={`thin-scroll absolute inset-y-0 left-0 w-[86vw] max-w-[320px] overflow-y-auto border-r border-line bg-bg shadow-xl transition-transform duration-300 ${
            drawer ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-14 items-center justify-between border-b border-line px-4">
            <span className="text-sm font-semibold">课程导航</span>
            <button
              type="button"
              className="grid h-8 w-8 place-items-center rounded-md hover:bg-sunken"
              onClick={() => setDrawer(false)}
              aria-label="关闭"
            >
              ✕
            </button>
          </div>
          {drawer && <CourseNav />}
        </div>
      </div>
    </>
  );
}
