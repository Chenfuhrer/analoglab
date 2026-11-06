"use client";

import { useSyncExternalStore } from "react";

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => obs.disconnect();
}

export function useIsDark(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => document.documentElement.classList.contains("dark"),
    () => false,
  );
}

export function ThemeToggle() {
  const dark = useIsDark();
  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("analoglab-theme", next ? "dark" : "light");
    } catch {}
  };
  return (
    <button
      type="button"
      onClick={toggle}
      data-testid="theme-toggle"
      aria-label={dark ? "切换到浅色模式" : "切换到深色模式"}
      title={dark ? "浅色模式" : "深色模式（示波器屏幕）"}
      className="grid h-9 w-9 place-items-center rounded-md text-ink-2 hover:bg-sunken hover:text-ink"
    >
      {dark ? (
        <svg width="17" height="17" viewBox="0 0 20 20" aria-hidden>
          <circle cx="10" cy="10" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <line
              key={a}
              x1="10"
              y1="2"
              x2="10"
              y2="4.2"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              transform={`rotate(${a} 10 10)`}
            />
          ))}
        </svg>
      ) : (
        <svg width="17" height="17" viewBox="0 0 20 20" aria-hidden>
          <path d="M15.5 12.6A6.5 6.5 0 0 1 7.4 4.5a6.5 6.5 0 1 0 8.1 8.1Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}
