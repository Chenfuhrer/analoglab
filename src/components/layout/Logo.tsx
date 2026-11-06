/** 标志：一个 NPN 管 + 被放大的正弦波（小信号 → 大信号） */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className="shrink-0">
      <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="7" fill="var(--ink)" />
      <path
        d="M4 19 q2 -1.6 4 0 t4 0"
        fill="none"
        stroke="var(--ch1)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path d="M13.5 10v12" stroke="var(--bg)" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M13.5 13.5 19 9.5M13.5 18.5 19 22.5" stroke="var(--bg)" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M19 22.5l-2.6-.3 1.2-2.1z" fill="var(--bg)" />
      <path
        d="M19.5 16 q3 -9 6 0 t6 0"
        fill="none"
        stroke="var(--ch2)"
        strokeWidth="1.7"
        strokeLinecap="round"
        transform="translate(-2.2 0) scale(0.95 1)"
      />
    </svg>
  );
}
