"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Rich } from "@/components/math/Tex";

export function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export function Button({
  children,
  onClick,
  variant = "ghost",
  size = "md",
  type = "button",
  disabled,
  className,
  ...rest
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md";
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
  "data-testid"?: string;
  "aria-label"?: string;
  "aria-pressed"?: boolean;
  title?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45",
        size === "sm" ? "h-7 px-2.5 text-[12.5px]" : "h-9 px-3.5 text-[13.5px]",
        variant === "primary" && "bg-accent text-accent-ink hover:opacity-90",
        variant === "ghost" && "text-ink-2 hover:bg-sunken hover:text-ink",
        variant === "outline" && "border border-line bg-elev text-ink hover:border-ink-3",
        variant === "danger" && "border border-err/40 text-err hover:bg-err-soft",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Badge({
  children,
  tone = "neutral",
  className,
  ...rest
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "dc" | "ac" | "ss" | "ok" | "warn" | "err";
  className?: string;
  "data-testid"?: string;
}) {
  const map = {
    neutral: "bg-sunken text-ink-2 border-line",
    accent: "bg-accent-soft text-accent border-accent/30",
    dc: "bg-dc-soft text-dc border-dc/30",
    ac: "bg-ac-soft text-ac border-ac/30",
    ss: "bg-ss-soft text-ss border-ss/30",
    ok: "bg-ok-soft text-ok border-ok/30",
    warn: "bg-warn-soft text-warn border-warn/30",
    err: "bg-err-soft text-err border-err/30",
  } as const;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full border px-2 py-[1px] text-[11.5px] font-medium leading-5",
        map[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}

export function Callout({
  kind = "note",
  title,
  children,
}: {
  kind?: "note" | "key" | "warn" | "myth" | "assume";
  title?: string;
  children: ReactNode;
}) {
  const conf = {
    note: { bar: "bg-accent", label: "说明", bg: "bg-elev" },
    key: { bar: "bg-ok", label: "要点", bg: "bg-ok-soft/50" },
    warn: { bar: "bg-warn", label: "注意", bg: "bg-warn-soft/50" },
    myth: { bar: "bg-err", label: "常见误区", bg: "bg-err-soft/40" },
    assume: { bar: "bg-ss", label: "模型假设", bg: "bg-ss-soft/40" },
  }[kind];
  return (
    <aside className={cx("relative my-4 overflow-hidden rounded-lg border border-line py-3 pl-5 pr-4", conf.bg)}>
      <span className={cx("absolute inset-y-0 left-0 w-[3px]", conf.bar)} aria-hidden />
      <div className="eyebrow mb-1">{title ?? conf.label}</div>
      <div className="text-[14.5px] leading-relaxed [&>p]:my-1.5">{children}</div>
    </aside>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  size = "md",
  label,
  testId,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: ReactNode; hint?: string }>;
  size?: "sm" | "md";
  label: string;
  testId?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      data-testid={testId}
      className="inline-flex rounded-lg border border-line bg-sunken p-0.5"
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={o.hint}
            data-value={o.value}
            onClick={() => onChange(o.value)}
            className={cx(
              "rounded-md transition-all",
              size === "sm" ? "px-2 py-0.5 text-[12px]" : "px-3 py-1 text-[13px]",
              active ? "bg-elev font-medium text-ink shadow-sm" : "text-ink-2 hover:text-ink",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** 对数/线性滑块 + 可直接输入的数值框（工程单位） */
export function ParamSlider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  log = false,
  unit,
  scale = 1,
  digits = 3,
  hint,
  testId,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  log?: boolean;
  /** 显示单位，如 "kΩ" */
  unit: string;
  /** 显示值 = 内部值 / scale */
  scale?: number;
  digits?: number;
  hint?: string;
  testId?: string;
  disabled?: boolean;
}) {
  const id = useId();
  const toPos = (v: number) => (log ? (Math.log(v) - Math.log(min)) / (Math.log(max) - Math.log(min)) : (v - min) / (max - min));
  const fromPos = (p: number) => (log ? Math.exp(Math.log(min) + p * (Math.log(max) - Math.log(min))) : min + p * (max - min));
  const pos = Math.min(1, Math.max(0, toPos(value)));
  const display = Number((value / scale).toPrecision(digits));
  const [text, setText] = useState(String(display));
  const [editing, setEditing] = useState(false);
  const shown = editing ? text : String(display);

  const commit = (raw: string) => {
    const v = Number(raw.replace("−", "-"));
    if (Number.isFinite(v)) {
      const clamped = Math.min(max, Math.max(min, v * scale));
      onChange(clamped);
    }
    setEditing(false);
  };

  const snap = (v: number) => {
    if (step) return Math.round(v / step) * step;
    // 对数滑块：保留 3 位有效数字
    return Number(v.toPrecision(3));
  };

  return (
    <div className={cx("group", disabled && "opacity-45")} data-testid={testId}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-[13px] text-ink-2">
          <Rich text={label} />
        </label>
        <div className="flex items-baseline gap-1">
          <input
            aria-label={`${label.replace(/\$/g, "")} 数值`}
            className="num w-[68px] rounded border border-transparent bg-transparent px-1 text-right text-[13px] text-ink hover:border-line focus:border-accent focus:bg-elev focus:outline-none"
            value={shown}
            disabled={disabled}
            onFocus={() => {
              setText(String(display));
              setEditing(true);
            }}
            onChange={(e) => setText(e.target.value)}
            onBlur={(e) => commit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
          />
          <span className="num w-8 text-[12px] text-ink-3">{unit}</span>
        </div>
      </div>
      <input
        id={id}
        type="range"
        className="slider"
        min={0}
        max={1000}
        step={1}
        value={Math.round(pos * 1000)}
        disabled={disabled}
        style={{ ["--fill" as string]: `${pos * 100}%` }}
        onChange={(e) => onChange(snap(fromPos(Number(e.target.value) / 1000)))}
      />
      {hint && <p className="-mt-0.5 text-[11.5px] leading-snug text-ink-3">{hint}</p>}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  testId,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: ReactNode;
  testId?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 text-[13px] text-ink-2" data-testid={testId}>
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cx(
          "relative h-[18px] w-8 shrink-0 rounded-full transition-colors",
          checked ? "bg-accent" : "bg-line",
        )}
      >
        <span
          className="absolute left-0 top-[2px] h-[14px] w-[14px] rounded-full bg-white shadow transition-transform duration-150"
          style={{ transform: `translateX(${checked ? 16 : 2}px)` }}
          data-knob={checked ? "on" : "off"}
        />
      </button>
    </label>
  );
}

/** 读数：仪表风格 */
export function Readout({
  label,
  value,
  tone,
  sub,
  testId,
}: {
  label: string;
  value: ReactNode;
  tone?: "dc" | "ac" | "ss" | "ok" | "err" | "warn";
  sub?: ReactNode;
  testId?: string;
}) {
  const color = tone
    ? { dc: "text-dc", ac: "text-ac", ss: "text-ss", ok: "text-ok", err: "text-err", warn: "text-warn" }[tone]
    : "text-ink";
  return (
    <div className="min-w-0 rounded-md border border-line-2 bg-bg/60 px-2.5 py-1.5">
      <div className="truncate text-[11.5px] text-ink-3">
        <Rich text={label} />
      </div>
      <div className={cx("num truncate text-[15px] font-medium", color)} data-testid={testId}>
        {value}
      </div>
      {sub && <div className="truncate text-[11px] text-ink-3">{sub}</div>}
    </div>
  );
}

/** 进入视口时添加 .is-visible（CSS keyframes 入场，不使用 motion 库） */
export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            el.classList.add("is-visible");
            io.disconnect();
          }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={cx("reveal", className)} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}
