"use client";

import { r } from "@/components/math/Tex";

import { useMemo, useState } from "react";
import { carriers, depletionWidth, intrinsicDensity, MATERIAL, thermalVoltage, type Material } from "@/simulations/semi/carriers";
import { diodeCurrent, SI_DIODE } from "@/simulations/diode/diode";
import { formatSI, sig } from "@/simulations/units";
import { Line, Plot } from "@/components/plot/Plot";
import { Button, ParamSlider, Readout, Segmented } from "@/components/ui/primitives";
import { Rich } from "@/components/math/Tex";
import { fmtPow10, intTicks, Legend, PlotTitle, WidgetCard } from "../WidgetCard";

/** 科学计数（cm⁻³） */
export function sci(x: number, d = 2) {
  if (!Number.isFinite(x) || x <= 0) return "—";
  const e = Math.floor(Math.log10(x));
  const m = x / Math.pow(10, e);
  const sup = String(e).replace(/-/g, "⁻").replace(/\d/g, (c) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(c)]);
  return `${sig(m, d)}×10${sup}`;
}

/* ───────────── 空穴的“移动”：价电子依次填补空位 ───────────── */
export function HoleHop() {
  const COLS = 6;
  const [hole, setHole] = useState(COLS - 1); // 空位所在的键位（0..COLS-1，在中间一排）
  const [freeX, setFreeX] = useState(COLS - 1 + 0.4); // 自由电子位置
  const [steps, setSteps] = useState(0);
  const step = () => {
    if (hole <= 1) return;
    setHole((h) => h - 1);
    setFreeX((x) => Math.min(COLS + 0.6, x + 0.35));
    setSteps((s) => s + 1);
  };
  const reset = () => {
    setHole(COLS - 1);
    setFreeX(COLS - 1 + 0.4);
    setSteps(0);
  };
  const X = (i: number) => 50 + i * 70;
  const ROWS = [50, 120, 190];
  return (
    <WidgetCard
      title="交互：空穴是怎样“移动”的"
      testId="hole-hop"
      controls={
        <>
          <p className="text-[13px] text-ink-2">
            <Rich text={r`外电场方向向左（$\vec E\leftarrow$）。点“下一步”：空位左侧相邻共价键中的一个**价电子**跳进空位。观察空位朝哪个方向移动、价电子朝哪个方向移动。`} />
          </p>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={step} disabled={hole <= 1} data-testid="hole-step">
              下一步
            </Button>
            <Button variant="outline" size="sm" onClick={reset}>
              复位
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <Readout label="已跳跃的价电子" value={String(steps)} />
            <Readout label="空穴位置" value={`第 ${hole + 1} 格`} tone="err" testId="hole-pos" />
          </div>
        </>
      }
      footer="每一步都是一个**价电子**（仍被共价键束缚）向右移动一格；累积起来，相当于一个带正电的空位向左移动。空穴电流与自由电子电流方向相同（都沿电场方向形成正电流），二者是两种不同的导电机制。"
    >
      <svg viewBox="0 0 470 240" className="block h-auto w-full" role="img" aria-label="硅晶格中的空穴移动示意">
        {ROWS.map((y) =>
          Array.from({ length: COLS }, (_, i) => (
            <g key={`${y}-${i}`}>
              {i < COLS - 1 && <line x1={X(i) + 16} y1={y} x2={X(i + 1) - 16} y2={y} stroke="var(--line)" strokeWidth={3} />}
              {y !== 190 && <line x1={X(i)} y1={y + 16} x2={X(i)} y2={y + 54} stroke="var(--line)" strokeWidth={3} />}
              <circle cx={X(i)} cy={y} r={15} fill="var(--bg-elev)" stroke="var(--ink-3)" />
              <text x={X(i)} y={y + 4} fontSize={11} textAnchor="middle" fill="var(--ink-2)">
                +4
              </text>
            </g>
          )),
        )}
        {Array.from({ length: COLS }, (_, i) => {
          const cx = i * 70 + 50 - 35;
          if (i === 0) return null;
          const isHole = i === hole;
          return isHole ? (
            <g key={`h${i}`}>
              <circle cx={cx} cy={120} r={7} fill="var(--bg-elev)" stroke="var(--err)" strokeWidth={2} strokeDasharray="3 2" />
              <text x={cx} y={104} fontSize={11} textAnchor="middle" fill="var(--err)">
                空穴
              </text>
            </g>
          ) : (
            <circle key={`e${i}`} cx={cx} cy={120} r={5} fill="var(--ac)" className="transition-all duration-300" />
          );
        })}
        {/* 自由电子 */}
        <circle cx={50 + freeX * 70 - 35} cy={150} r={6} fill="var(--ss)" className="transition-all duration-500" />
        <text x={50 + freeX * 70 - 35} y={172} fontSize={11} textAnchor="middle" fill="var(--ss)">
          自由电子
        </text>
        <line x1={440} y1={18} x2={330} y2={18} stroke="var(--ink-2)" strokeWidth={1.4} markerEnd="url(#arrE)" />
        <defs>
          <marker id="arrE" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0 0L8 4L0 8Z" fill="var(--ink-2)" />
          </marker>
        </defs>
        <text x={445} y={22} fontSize={12} fill="var(--ink-2)">
          E
        </text>
      </svg>
    </WidgetCard>
  );
}

/* ───────────── 本征载流子浓度与温度 ───────────── */
export function CarrierTemp() {
  const [T, setT] = useState(300);
  const [m, setM] = useState<Material>("Si");
  const ni = intrinsicDensity(T, m);
  const curves = useMemo(() => {
    const mk = (mat: Material) => {
      const pts: Array<[number, number]> = [];
      for (let t = 200; t <= 500; t += 2) pts.push([t, Math.log10(intrinsicDensity(t, mat))]);
      return pts;
    };
    return { Si: mk("Si"), Ge: mk("Ge") };
  }, []);
  return (
    <WidgetCard
      title="交互：本征载流子浓度 $n_i(T)$"
      testId="carrier-temp"
      controls={
        <>
          <Segmented
            label="材料"
            value={m}
            onChange={setM}
            options={[
              { value: "Si", label: "硅 Si" },
              { value: "Ge", label: "锗 Ge" },
            ]}
          />
          <ParamSlider label="温度 $T$" value={T} onChange={setT} min={200} max={500} step={1} unit="K" testId="ct-T" />
          <div className="grid grid-cols-2 gap-1.5">
            <Readout label="$n_i$ / cm⁻³" value={sci(ni)} tone="ac" testId="ct-ni" />
            <Readout label="相对 300 K" value={`×${sig(ni / intrinsicDensity(300, m), 3)}`} />
            <Readout label="被激发的原子比例" value={sci(ni / MATERIAL[m].atoms)} />
            <Readout label="$U_T=kT/q$" value={formatSI(thermalVoltage(T), "V")} />
          </div>
        </>
      }
      footer={r`模型：$n_i\propto T^{3/2}e^{-E_g/(2kT)}$，以 300 K 的常用取值校准，忽略 $E_g$ 随温度的变化。纵轴为对数刻度：直线上升一格就是十倍。`}
    >
      <PlotTitle>{String.raw`$\lg(n_i/\mathrm{cm^{-3}})$ – $T$（K）`}</PlotTitle>
      <Plot height={250} ariaLabel="本征载流子浓度随温度变化" x={{ domain: [200, 500], label: "T / K" }} y={{ domain: [4, 17], ticks: intTicks(4, 17, 7), format: fmtPow10 }}>
        {(s) => (
          <g>
            <Line points={curves.Si} s={s} color="var(--ch4)" width={m === "Si" ? 2.4 : 1.3} opacity={m === "Si" ? 1 : 0.5} />
            <Line points={curves.Ge} s={s} color="var(--ch1)" width={m === "Ge" ? 2.4 : 1.3} opacity={m === "Ge" ? 1 : 0.5} />
            <circle cx={s.sx(T)} cy={s.sy(Math.log10(ni))} r={5} fill="var(--bg-elev)" stroke="var(--ink)" strokeWidth={2} />
          </g>
        )}
      </Plot>
      <Legend items={[["硅 Si（$E_g$≈1.12 eV）", "var(--ch4)"], ["锗 Ge（$E_g$≈0.66 eV）", "var(--ch1)"]]} />
    </WidgetCard>
  );
}

/* ───────────── 掺杂：多子与少子 ───────────── */
export function DopingDemo() {
  const [lgND, setLgND] = useState(16);
  const [lgNA, setLgNA] = useState(0);
  const [T, setT] = useState(300);
  const ND = lgND <= 0 ? 0 : Math.pow(10, lgND);
  const NA = lgNA <= 0 ? 0 : Math.pow(10, lgNA);
  const c = carriers(ND, NA, T);
  const bars: Array<[string, number, string]> = [
    ["电子浓度 $n$", c.n, "var(--ac)"],
    ["空穴浓度 $p$", c.p, "var(--err)"],
    ["本征 $n_i$", c.ni, "var(--ink-3)"],
  ];
  const lo = 0;
  const hi = 20;
  return (
    <WidgetCard
      title="交互：掺杂浓度与多子、少子"
      testId="doping-demo"
      controls={
        <>
          <ParamSlider label={r`施主（五价）$\lg N_D$`} value={lgND} onChange={setLgND} min={0} max={19} step={0.1} unit="" hint="0 表示不掺施主" testId="dd-nd" />
          <ParamSlider label={r`受主（三价）$\lg N_A$`} value={lgNA} onChange={setLgNA} min={0} max={19} step={0.1} unit="" hint="0 表示不掺受主" />
          <ParamSlider label="温度 $T$" value={T} onChange={setT} min={250} max={650} step={1} unit="K" />
          <div className="grid grid-cols-2 gap-1.5">
            <Readout label="类型" value={c.type === "N" ? "N 型" : c.type === "P" ? "P 型" : "近似本征"} tone="ac" testId="dd-type" />
            <Readout label="多子 / 少子" value={sci(c.majority / c.minority)} />
            <Readout label="$np/n_i^2$" value={sig((c.n * c.p) / (c.ni * c.ni), 4)} />
          </div>
        </>
      }
      footer="无论怎样掺杂，$np=n_i^2$ 都成立（热平衡、非简并）：多子增加多少倍，少子就减少多少倍。少子浓度 $n_i^2/N$ 正比于 $n_i^2$，所以对温度极其敏感。把温度调到 600 K 以上，轻掺杂的样品会重新变得“近似本征”。"
    >
      <div className="space-y-3">
        {bars.map(([label, val, color]) => (
          <div key={label}>
            <div className="flex justify-between text-[12.5px]">
              <Rich text={label} />
              <span className="num">{sci(val)} cm⁻³</span>
            </div>
            <div className="mt-1 h-3 overflow-hidden rounded bg-sunken">
              <div className="h-full rounded transition-[width] duration-300" style={{ width: `${Math.max(0.5, ((Math.log10(Math.max(val, 1)) - lo) / (hi - lo)) * 100)}%`, background: color }} />
            </div>
          </div>
        ))}
        <p className="text-[12px] text-ink-3">条形长度为对数刻度（10⁰–10²⁰ cm⁻³）。硅原子密度约 5×10²² cm⁻³，所以即使 10¹⁶ cm⁻³ 的掺杂也只是“每五百万个硅原子中有一个杂质原子”。</p>
      </div>
    </WidgetCard>
  );
}

/* ───────────── PN 结：偏置、耗尽层与电流 ───────────── */
export function PNJunctionDemo() {
  const [u, setU] = useState(0);
  const [ratio, setRatio] = useState(10);
  const ND = 1e16;
  const NA = ND * ratio;
  const d = depletionWidth(u, NA, ND);
  const d0 = depletionWidth(0, NA, ND);
  const i = diodeCurrent(u, SI_DIODE);
  const scale = 160 / depletionWidth(-10, NA, ND).W; // 像素/cm
  const mid = 240;
  const xl = mid - d.xp * scale;
  const xr = mid + d.xn * scale;
  return (
    <WidgetCard
      title="交互：PN 结在正偏、零偏、反偏下"
      testId="pn-demo"
      controls={
        <>
          <ParamSlider label="外加电压 $u$（P 接正为正）" value={u} onChange={setU} min={-10} max={0.7} step={0.01} unit="V" testId="pn-u" />
          <ParamSlider label="掺杂比 $N_A/N_D$" value={ratio} onChange={setRatio} min={1} max={100} log unit="" />
          <div className="grid grid-cols-2 gap-1.5">
            <Readout label="接触电位差 $U_{ho}$" value={formatSI(d.Vbi, "V")} />
            <Readout label="势垒高度 $U_{ho}-u$" value={formatSI(Math.max(d.Vbi - u, 0), "V")} tone="dc" />
            <Readout label="耗尽层宽度 $W$" value={formatSI(d.W / 100, "m")} tone="ss" testId="pn-w" />
            <Readout label="相对零偏" value={`×${sig(d.W / d0.W, 3)}`} />
            <Readout label="电流 $i$" value={formatSI(i, "A")} tone={u > 0.4 ? "ok" : undefined} testId="pn-i" />
          </div>
        </>
      }
      footer={r`模型：突变结，$W\propto\sqrt{U_{ho}-u}$；电流按 PN 结方程 $i=I_S(e^{u/U_T}-1)$（$I_S$=0.1 pA 的示意硅结）。正偏接近 $U_{ho}$ 时耗尽层近似失效（大注入），图中只画到 0.7 V。`}
    >
      <svg viewBox="0 0 480 170" className="block h-auto w-full" role="img" aria-label="PN 结示意">
        <rect x={20} y={40} width={220} height={80} fill="var(--err-soft)" stroke="var(--line)" />
        <rect x={240} y={40} width={220} height={80} fill="var(--ac-soft)" stroke="var(--line)" />
        <rect x={xl} y={40} width={xr - xl} height={80} fill="var(--bg-elev)" stroke="var(--ss)" strokeDasharray="4 3" className="transition-all duration-200" />
        {Array.from({ length: 12 }, (_, k) => {
          const x = xl + ((k + 0.5) / 12) * (xr - xl);
          const neg = x < mid;
          return (
            <text key={k} x={x} y={k % 2 ? 72 : 98} fontSize={13} textAnchor="middle" fill={neg ? "var(--err)" : "var(--ac)"}>
              {neg ? "⊖" : "⊕"}
            </text>
          );
        })}
        <text x={60} y={30} fontSize={13} fill="var(--err)">
          P 区（多子：空穴）
        </text>
        <text x={300} y={30} fontSize={13} fill="var(--ac)">
          N 区（多子：电子）
        </text>
        <text x={mid} y={142} fontSize={12} textAnchor="middle" fill="var(--ss)">
          空间电荷区（耗尽层）
        </text>
        <line x1={xr - 4} y1={155} x2={xl + 4} y2={155} stroke="var(--ink-2)" strokeWidth={1.4} markerEnd="url(#arrIn)" />
        <defs>
          <marker id="arrIn" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0 0L8 4L0 8Z" fill="var(--ink-2)" />
          </marker>
        </defs>
        <text x={xr + 6} y={159} fontSize={11} fill="var(--ink-2)">
          内电场（N→P）
        </text>
      </svg>
      <p className="text-[13px] text-ink-2" data-testid="pn-verdict">
        {u > 0.45 ? (
          <Rich text="正偏：外电场削弱内电场，势垒降低、耗尽层变窄，多子扩散大大超过漂移，电流随电压**指数**增长。" />
        ) : u < -0.1 ? (
          <Rich text={r`反偏：外电场加强内电场，势垒升高、耗尽层变宽，扩散几乎停止，只剩少子漂移形成的极小反向电流 $\approx -I_S$。`} />
        ) : (
          <Rich text="零偏（或很小的偏压）：扩散与漂移动态平衡，净电流近似为零。" />
        )}
      </p>
    </WidgetCard>
  );
}
