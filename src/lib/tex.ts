import { formatSI, sig } from "@/simulations/units";

/** 物理量 → LaTeX，例如 tq(0.002,'A') → "2\,\mathrm{mA}" */
export function tq(v: number, unit: string, digits = 3): string {
  if (!Number.isFinite(v)) return "\\infty";
  const s = formatSI(v, unit, digits);
  const i = s.indexOf(" ");
  const num = (i < 0 ? s : s.slice(0, i)).replace("−", "-");
  const u = i < 0 ? "" : s.slice(i + 1);
  if (!u) return num;
  return `${num}\\,\\mathrm{${u.replace("µ", "\\mu ").replace("Ω", "\\Omega")}}`;
}

/** 纯数 → LaTeX */
export function tn(v: number, digits = 3): string {
  return sig(v, digits).replace("−", "-");
}
