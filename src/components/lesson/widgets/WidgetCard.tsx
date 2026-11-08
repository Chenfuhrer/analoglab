import type { ReactNode } from "react";
import { Rich } from "@/components/math/Tex";

/** 交互组件外框：左侧参数、右侧图表 */
export function WidgetCard({ title, testId, controls, children, footer, wide = false }: { title: string; testId: string; controls?: ReactNode; children: ReactNode; footer?: string; wide?: boolean }) {
  return (
    <div className="card my-5 overflow-hidden" data-testid={testId}>
      <div className="border-b border-line px-4 py-2">
        <span className="eyebrow">
          <Rich text={title} />
        </span>
      </div>
      <div className={controls ? `grid gap-4 p-4 ${wide ? "lg:grid-cols-[240px_minmax(0,1fr)]" : "md:grid-cols-[230px_minmax(0,1fr)]"}` : "p-4"}>
        {controls && <div className="space-y-3">{controls}</div>}
        <div className="min-w-0 space-y-3">{children}</div>
      </div>
      {footer && (
        <div className="border-t border-line px-4 py-2 text-[12.5px] text-ink-3">
          <Rich text={footer} />
        </div>
      )}
    </div>
  );
}

export function PlotTitle({ children }: { children: string }) {
  return (
    <div className="mb-1 text-[12px] text-ink-3">
      <Rich text={children} />
    </div>
  );
}

export function Legend({ items }: { items: Array<[string, string, string?]> }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-2">
      {items.map(([label, color, dash], i) => (
        <span key={`${i}-${label}`} className="inline-flex items-center gap-1.5">
          <svg width="18" height="6" aria-hidden>
            <line x1="0" y1="3" x2="18" y2="3" stroke={color} strokeWidth="2.2" strokeDasharray={dash} />
          </svg>
          <Rich text={label} />
        </span>
      ))}
    </div>
  );
}

/** 对数坐标刻度格式：10^k */
export const fmtPow10 = (v: number) => {
  const k = Math.round(v);
  const sup = String(k).replace(/-/g, "⁻").replace(/\d/g, (d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(d)]);
  return `10${sup}`;
};

/** 0..1 的整数刻度（对数坐标用） */
export function intTicks(lo: number, hi: number, maxCount = 7): number[] {
  const a = Math.ceil(lo);
  const b = Math.floor(hi);
  const step = Math.max(1, Math.ceil((b - a + 1) / maxCount));
  const out: number[] = [];
  for (let k = a; k <= b; k += step) out.push(k);
  return out;
}

/** 可换行的单选标签组（选项较多时代替 Segmented） */
export function ChipGroup<T extends string>({ value, onChange, options, label, testId }: { value: T; onChange: (v: T) => void; options: Array<{ value: T; label: string }>; label: string; testId?: string }) {
  return (
    <div role="radiogroup" aria-label={label} data-testid={testId} className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            data-value={o.value}
            onClick={() => onChange(o.value)}
            className={`rounded-full border px-2.5 py-0.5 text-[12.5px] transition-colors ${active ? "border-accent bg-accent-soft font-medium text-ink" : "border-line bg-elev text-ink-2 hover:text-ink"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
