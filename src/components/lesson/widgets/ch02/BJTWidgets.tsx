"use client";

import { r } from "@/components/math/Tex";

import { useMemo, useState } from "react";
import { alphaFromBeta, atTemperature, currentsFromIE, ebersMoll, judgeActivePins, REGION_LABEL, regionFromPotentials, soaCheck } from "@/simulations/bjt/device";
import { outputFamily } from "@/simulations/bjt/characteristics";
import { formatSI, sig } from "@/simulations/units";
import { Line, Plot } from "@/components/plot/Plot";
import { ParamSlider, Readout, Segmented, Toggle } from "@/components/ui/primitives";
import { Rich } from "@/components/math/Tex";
import { fmtPow10, intTicks, Legend, PlotTitle, WidgetCard } from "../WidgetCard";

/* ───────────── 载流子传输与电流分配 ───────────── */
export function CurrentFlow() {
  const [IE, setIE] = useState(2e-3);
  const [beta, setBeta] = useState(100);
  const [ICBO, setICBO] = useState(10e-9);
  const c = currentsFromIE(IE, beta, ICBO);
  const a = alphaFromBeta(beta);
  const recomb = IE * (1 - a);
  const W = 420;
  const sc = (x: number) => Math.max(2, (x / IE) * 120);
  return (
    <WidgetCard
      title="交互：发射区注入的电子去了哪里"
      testId="current-flow"
      controls={
        <>
          <ParamSlider label="发射极电流 $I_E$" value={IE} onChange={setIE} min={0.1e-3} max={10e-3} log unit="mA" scale={1e-3} />
          <ParamSlider label={r`$\bar\beta$（由基区宽度与掺杂决定）`} value={beta} onChange={setBeta} min={10} max={400} log unit="" testId="cf-beta" />
          <ParamSlider label="$I_{CBO}$" value={ICBO} onChange={setICBO} min={1e-9} max={10e-6} log unit="nA" scale={1e-9} />
          <div className="grid grid-cols-2 gap-1.5">
            <Readout label="$I_C$" value={formatSI(c.IC, "A")} tone="ac" testId="cf-ic" />
            <Readout label="$I_B$" value={formatSI(c.IB, "A")} tone="dc" />
            <Readout label={r`$\bar\alpha=\bar\beta/(1+\bar\beta)$`} value={sig(a, 4)} />
            <Readout label={r`$I_{CEO}=(1+\bar\beta)I_{CBO}$`} value={formatSI(c.ICEO, "A")} tone="warn" />
          </div>
        </>
      }
      footer={r`NPN 管：发射区向基区注入电子（形成 $I_E$）；其中一小部分（比例 $1-\bar\alpha$）在基区与空穴复合，由基极补充空穴形成 $I_{BN}$；其余被集电结电场收集形成 $I_{CN}=\bar\alpha I_E$。集电结的少子漂移形成 $I_{CBO}$，方向与 $I_{CN}$ 相同、与 $I_{BN}$ 相反。`}
    >
      <svg viewBox={`0 0 ${W} 210`} className="block h-auto w-full" role="img" aria-label="晶体管内部载流子传输">
        <rect x={20} y={40} width={110} height={130} fill="var(--ac-soft)" stroke="var(--line)" />
        <rect x={130} y={40} width={40} height={130} fill="var(--err-soft)" stroke="var(--line)" />
        <rect x={170} y={40} width={150} height={130} fill="var(--ac-soft)" stroke="var(--line)" />
        <text x={75} y={32} fontSize={12} textAnchor="middle" fill="var(--ink-2)">
          发射区 N⁺
        </text>
        <text x={150} y={32} fontSize={12} textAnchor="middle" fill="var(--ink-2)">
          基区 P
        </text>
        <text x={245} y={32} fontSize={12} textAnchor="middle" fill="var(--ink-2)">
          集电区 N
        </text>
        {/* 注入的电子流 */}
        <rect x={40} y={105 - sc(IE) / 2} width={110} height={sc(IE)} fill="var(--ac)" opacity={0.35} />
        <rect x={150} y={105 - sc(c.IC - ICBO) / 2} width={190} height={sc(c.IC - ICBO)} fill="var(--ac)" opacity={0.35} />
        <path d={`M150 ${105 + sc(IE) / 2 - sc(recomb)}L150 ${105 + sc(IE) / 2}L${150 + sc(recomb) / 2 + 2} 190L${150 - sc(recomb) / 2 - 2} 190Z`} fill="var(--dc)" opacity={0.6} />
        <text x={150} y={204} fontSize={11.5} textAnchor="middle" fill="var(--dc)">
          复合 → I_BN
        </text>
        <text x={360} y={104} fontSize={12} fill="var(--ac)">
          I_CN
        </text>
        <text x={4} y={108} fontSize={12} fill="var(--ac)">
          I_E
        </text>
        <text x={245} y={160} fontSize={11} textAnchor="middle" fill="var(--warn)">
          ← 少子漂移 I_CBO
        </text>
      </svg>
      <p className="text-[13px] text-ink-2">
        <Rich text={`复合的比例只有 $1-\\bar\\alpha=${sig(1 - a, 3)}$：基区越薄、掺杂越轻，复合越少，$\\bar\\beta$ 越大。这就是“放大的内部条件”。`} />
      </p>
    </WidgetCard>
  );
}

/* ───────────── 输入特性（Ebers–Moll） ───────────── */
export function InputFamily() {
  const [uce, setUce] = useState(0.3);
  const curves = useMemo(() => {
    const mk = (u: number) => {
      const pts: Array<[number, number]> = [];
      for (let k = 0; k <= 200; k++) {
        const ube = 0.4 + (0.35 * k) / 200;
        pts.push([ube, ebersMoll(ube, u).iB * 1e6]);
      }
      return pts;
    };
    return { c0: mk(0), c1: mk(1), cu: mk(uce) };
  }, [uce]);
  return (
    <WidgetCard
      title="交互：输入特性 $i_B=f(u_{BE})\,|_{u_{CE}}$"
      testId="input-family"
      controls={
        <>
          <ParamSlider label="$u_{CE}$" value={uce} onChange={setUce} min={0} max={2} step={0.01} unit="V" testId="if-uce" />
          <Readout label="$u_{BE}=0.65$ V 时 $i_B$" value={formatSI(ebersMoll(0.65, uce).iB, "A")} tone="dc" />
          <p className="text-[12.5px] text-ink-2">
            <Rich text="$u_{CE}=0$ 时两个结都正偏、并联导通，同一 $u_{BE}$ 下 $i_B$ 最大；$u_{CE}$ 增大到约 1 V 以后，集电结已反偏，能把基区的电子几乎全部收走，曲线基本重合。" />
          </p>
        </>
      }
      footer={r`模型：Ebers–Moll 输运模型（$I_S$=10 fA，$\beta_F$=100，$\beta_R$=1，$U_T$=26 mV），未计基区宽度调制。`}
    >
      <Plot height={250} ariaLabel="输入特性曲线族" x={{ domain: [0.4, 0.75], label: "u_BE / V" }} y={{ domain: [0, 100], label: "i_B / µA" }}>
        {(s) => (
          <g>
            <Line points={curves.c0} s={s} color="var(--ink-3)" width={1.4} dash="4 3" />
            <Line points={curves.c1} s={s} color="var(--ink-2)" width={1.4} dash="2 3" />
            <Line points={curves.cu} s={s} color="var(--dc)" width={2.4} />
          </g>
        )}
      </Plot>
      <Legend items={[["$u_{CE}=0$", "var(--ink-3)", "4 3"], ["$u_{CE}\\ge1$ V", "var(--ink-2)", "2 3"], [`当前 $u_{CE}=${sig(uce, 3)}$ V`, "var(--dc)"]]} />
    </WidgetCard>
  );
}

/* ───────────── 输出特性与三个工作区 ───────────── */
export function OutputRegions() {
  const [iB, setIB] = useState(30e-6);
  const [uCE, setUCE] = useState(6);
  const beta = 100;
  const fam = useMemo(() => outputFamily([10e-6, 20e-6, 30e-6, 40e-6, 50e-6], 12, { beta, VA: 100 }, 200), []);
  const cur = useMemo(() => outputFamily([iB], 12, { beta, VA: 100 }, 200)[0], [iB]);
  const icHere = cur.points.reduce((best, p) => (Math.abs(p[0] - uCE) < Math.abs(best[0] - uCE) ? p : best), cur.points[0])[1];
  const region = iB <= 0.5e-6 ? "cutoff" : uCE < 0.3 ? "saturation" : "active";
  return (
    <WidgetCard
      title="交互：输出特性 $i_C=f(u_{CE})\,|_{i_B}$ 与三个工作区"
      testId="output-regions"
      controls={
        <>
          <ParamSlider label="$i_B$" value={iB} onChange={setIB} min={0} max={60e-6} step={1e-6} unit="µA" scale={1e-6} testId="or-ib" />
          <ParamSlider label="$u_{CE}$" value={uCE} onChange={setUCE} min={0} max={12} step={0.02} unit="V" testId="or-uce" />
          <div className="grid grid-cols-2 gap-1.5">
            <Readout label="$i_C$" value={formatSI(icHere, "A")} tone="ac" />
            <Readout label="$i_C/i_B$" value={iB > 0 ? sig(icHere / iB, 3) : "—"} />
            <Readout label="工作区" value={REGION_LABEL[region]} tone={region === "active" ? "ok" : "warn"} testId="or-region" />
          </div>
        </>
      }
      footer={r`模型：Ebers–Moll 闭式解 + Early 效应（$V_A$=100 V）。图中阴影：左侧 $u_{CE}<U_{CES}\approx0.3$ V 为饱和区（$i_C<\beta i_B$），底部 $i_B\le0$ 以下为截止区，其余为放大区（曲线近似水平且等间距）。`}
    >
      <Plot height={260} ariaLabel="输出特性曲线族" x={{ domain: [0, 12], label: "u_CE / V" }} y={{ domain: [0, 6.5], label: "i_C / mA" }}>
        {(s) => (
          <g>
            <rect x={s.sx(0)} y={s.m.t} width={s.sx(0.3) - s.sx(0)} height={s.ih} fill="var(--warn-soft)" />
            <rect x={s.m.l} y={s.sy(0.15)} width={s.iw} height={s.sy(0) - s.sy(0.15)} fill="var(--err-soft)" />
            {fam.map((c) => (
              <Line key={c.iB} points={c.points.map(([u, i]) => [u, i * 1e3])} s={s} color="var(--ink-3)" width={1.2} />
            ))}
            <Line points={cur.points.map(([u, i]) => [u, i * 1e3])} s={s} color="var(--ac)" width={2.4} />
            <circle cx={s.sx(uCE)} cy={s.sy(icHere * 1e3)} r={5} fill="var(--bg-elev)" stroke="var(--ink)" strokeWidth={2} />
            <text x={s.sx(0.3) + 4} y={s.m.t + 14} fontSize={11} fill="var(--warn)">
              饱和区
            </text>
            <text x={s.sx(8)} y={s.sy(0.15) - 4} fontSize={11} fill="var(--err)">
              截止区（i_B ≤ 0）
            </text>
            <text x={s.sx(6)} y={s.m.t + 14} fontSize={11} fill="var(--ok)">
              放大区
            </text>
          </g>
        )}
      </Plot>
    </WidgetCard>
  );
}

/* ───────────── 由电位判断 ───────────── */
const PRESETS: Array<{ label: string; v: [number, number, number] }> = [
  { label: "例 1", v: [3.7, 3, 12] },
  { label: "例 2", v: [-6, -0.2, 0] },
  { label: "例 3", v: [9, 8.3, 2] },
  { label: "例 4", v: [2, 2.7, 6] },
];

export function PinJudge() {
  const [v, setV] = useState<[number, number, number]>([3.7, 3, 12]);
  const j = judgeActivePins(v);
  const order = [0, 1, 2].sort((a, b) => v[a] - v[b]);
  const name = (k: "b" | "c" | "e") => ({ b: "基极 b", c: "集电极 c", e: "发射极 e" })[k];
  return (
    <WidgetCard
      title="交互：由三个电极的电位判断管型、材料与电极"
      testId="pin-judge"
      controls={
        <>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button key={p.label} type="button" onClick={() => setV(p.v)} className="rounded-full border border-line bg-elev px-2.5 py-0.5 text-[12.5px] text-ink-2 hover:text-ink">
                {p.label}
              </button>
            ))}
          </div>
          {[0, 1, 2].map((i) => (
            <ParamSlider
              key={i}
              label={`电极 ${"①②③"[i]} 电位`}
              value={v[i]}
              onChange={(x) => setV((old) => old.map((y, k) => (k === i ? x : y)) as [number, number, number])}
              min={-12}
              max={12}
              step={0.1}
              unit="V"
              testId={`pj-${i}`}
            />
          ))}
        </>
      }
      footer="前提：晶体管处于放大区。若算出的工作区不是“放大”，说明这组电位不满足放大条件，判断结果仅供参考。"
    >
      <ol className="space-y-1.5 text-[13.5px]" data-testid="pj-steps">
        <li>
          <Rich text={`① 排序：${order.map((i) => `${"①②③"[i]}（${sig(v[i], 3)} V）`).join(" < ")}。电位居中的 ${"①②③"[order[1]]} 是**基极**。`} />
        </li>
        <li>
          <Rich text={`② 与基极相差 $${sig(Math.abs(j.UBE), 2)}$ V 的是**发射极**：差值约 ${j.material === "Si" ? "0.6–0.8 V → 硅管" : "0.2–0.3 V → 锗管"}。`} />
        </li>
        <li>
          <Rich text={`③ 剩下的是**集电极**；集电极电位${j.type === "NPN" ? "最高 → **NPN**" : "最低 → **PNP**"}。`} />
        </li>
        <li>
          <Rich text={`④ 验证：${REGION_LABEL[j.region]}。`} />
        </li>
      </ol>
      <div className="grid grid-cols-3 gap-1.5">
        {[0, 1, 2].map((i) => (
          <Readout key={i} label={`电极 ${"①②③"[i]}`} value={name(j.pins[i])} tone={j.pins[i] === "b" ? "dc" : j.pins[i] === "c" ? "ac" : "ss"} testId={`pj-pin-${i}`} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        <Readout label="管型" value={j.type} tone="ok" testId="pj-type" />
        <Readout label="材料" value={j.material === "Si" ? "硅" : "锗"} />
        <Readout label="$U_{BE}$" value={formatSI(j.UBE, "V")} />
      </div>
    </WidgetCard>
  );
}

/* ───────────── 已知管型判断工作区（练习用小组件） ───────────── */
export function RegionByPotential() {
  const [type, setType] = useState<"NPN" | "PNP">("NPN");
  const [VB, setVB] = useState(0.7);
  const [VC, setVC] = useState(5);
  const VE = 0;
  const reg = regionFromPotentials(type, VB, VC, VE, 0.5);
  return (
    <WidgetCard
      title="交互：已知管型，由 $U_B$、$U_C$、$U_E$ 判断工作区"
      testId="region-by-potential"
      controls={
        <>
          <Segmented
            label="管型"
            value={type}
            onChange={(t) => {
              setType(t);
              setVB(t === "NPN" ? 0.7 : -0.7);
              setVC(t === "NPN" ? 5 : -5);
            }}
            options={[
              { value: "NPN", label: "NPN" },
              { value: "PNP", label: "PNP" },
            ]}
          />
          <ParamSlider label="$U_B$（$U_E$=0）" value={VB} onChange={setVB} min={-1} max={1} step={0.01} unit="V" testId="rp-vb" />
          <ParamSlider label="$U_C$" value={VC} onChange={setVC} min={-10} max={10} step={0.05} unit="V" />
        </>
      }
    >
      <div className="grid grid-cols-3 gap-1.5">
        <Readout label="发射结 $u_{BE}$" value={formatSI(VB - VE, "V")} />
        <Readout label="集电结 $u_{BC}$" value={formatSI(VB - VC, "V")} />
        <Readout label="工作区" value={REGION_LABEL[reg]} tone={reg === "active" ? "ok" : "warn"} testId="rp-region" />
      </div>
      <p className="text-[13px] text-ink-2">
        <Rich text={type === "NPN" ? "NPN：$U_{BE}>U_{on}$ 且 $U_C\\ge U_B$ → 放大；$U_{BE}>U_{on}$ 且 $U_C<U_B$ → 饱和；$U_{BE}<U_{on}$ → 截止。" : "PNP：所有不等号反向——$U_{EB}>U_{on}$ 且 $U_C\\le U_B$ → 放大；$U_C>U_B$ → 饱和。"} />
      </p>
    </WidgetCard>
  );
}

/* ───────────── 安全工作区 ───────────── */
export function SOAWidget() {
  const [PCM, setPCM] = useState(0.5);
  const [ICM, setICM] = useState(0.2);
  const [UCEO, setUCEO] = useState(30);
  const [U, setU] = useState(10);
  const [I, setI] = useState(0.03);
  const r = soaCheck(U, I, { PCM, ICM, UCEO });
  const hyper = useMemo(() => {
    const pts: Array<[number, number]> = [];
    for (let k = 1; k <= 200; k++) {
      const u = (40 * k) / 200;
      pts.push([u, Math.min((PCM / u) * 1e3, 400)]);
    }
    return pts;
  }, [PCM]);
  const msg = r.safe ? "在安全工作区内。" : r.violations.map((x) => ({ P: "管耗 $u_{CE}i_C$ 超过 $P_{CM}$（过热）", I: "$i_C$ 超过 $I_{CM}$（$\\beta$ 明显下降）", U: "$u_{CE}$ 超过 $U_{(BR)CEO}$（击穿）" })[x]).join("；") + "。";
  return (
    <WidgetCard
      title="交互：极限参数围成的安全工作区"
      testId="soa"
      controls={
        <>
          <ParamSlider label="$P_{CM}$" value={PCM} onChange={setPCM} min={0.1} max={2} step={0.05} unit="W" />
          <ParamSlider label="$I_{CM}$" value={ICM} onChange={setICM} min={0.05} max={0.35} step={0.01} unit="mA" scale={1e-3} />
          <ParamSlider label="$U_{(BR)CEO}$" value={UCEO} onChange={setUCEO} min={10} max={40} step={1} unit="V" />
          <ParamSlider label="工作点 $U_{CE}$" value={U} onChange={setU} min={0.5} max={40} step={0.1} unit="V" testId="soa-u" />
          <ParamSlider label="工作点 $I_C$" value={I} onChange={setI} min={0.001} max={0.4} step={0.001} unit="mA" scale={1e-3} />
          <Readout label="管耗 $P_C$" value={formatSI(U * I, "W")} tone={r.violations.includes("P") ? "err" : "ok"} testId="soa-pc" />
        </>
      }
    >
      <Plot height={260} ariaLabel="安全工作区" x={{ domain: [0, 40], label: "u_CE / V" }} y={{ domain: [0, 400], label: "i_C / mA" }}>
        {(s) => (
          <g>
            <path
              d={`M${s.sx(0)} ${s.sy(0)}L${s.sx(0)} ${s.sy(ICM * 1e3)}${hyper
                .filter(([u, i]) => u <= UCEO && i <= ICM * 1e3)
                .map(([u, i]) => `L${s.sx(u)} ${s.sy(i)}`)
                .join("")}L${s.sx(UCEO)} ${s.sy(Math.min((PCM / UCEO) * 1e3, ICM * 1e3))}L${s.sx(UCEO)} ${s.sy(0)}Z`}
              fill="var(--ok-soft)"
              opacity={0.8}
            />
            <Line points={hyper} s={s} color="var(--err)" width={1.8} dash="5 3" />
            <Line points={[[0, ICM * 1e3], [40, ICM * 1e3]]} s={s} color="var(--warn)" width={1.6} dash="5 3" />
            <Line points={[[UCEO, 0], [UCEO, 400]]} s={s} color="var(--ss)" width={1.6} dash="5 3" />
            <circle cx={s.sx(U)} cy={s.sy(I * 1e3)} r={6} fill={r.safe ? "var(--ok)" : "var(--err)"} stroke="var(--bg-elev)" strokeWidth={2} />
          </g>
        )}
      </Plot>
      <Legend items={[["$P_{CM}$ 双曲线 $u_{CE}i_C=P_{CM}$", "var(--err)", "5 3"], ["$I_{CM}$", "var(--warn)", "5 3"], ["$U_{(BR)CEO}$", "var(--ss)", "5 3"]]} />
      <p className="text-[13px]" data-testid="soa-msg">
        <Rich text={msg} />
      </p>
    </WidgetCard>
  );
}

/* ───────────── 温度对输出特性的影响 ───────────── */
export function TempCurves() {
  const [t, setT] = useState(25);
  const [showLog, setShowLog] = useState(false);
  const p25 = { beta: 80, UBE: 0.7, ICBO: 0.5e-6 };
  const pt = atTemperature(p25, t);
  const iBs = [20e-6, 40e-6, 60e-6];
  const fam = (beta: number, ICEO: number) =>
    outputFamily(iBs, 12, { beta, VA: 120 }, 160).map((c) => ({ ...c, points: c.points.map(([u, i]) => [u, (i + (u > 0.05 ? ICEO : 0)) * 1e3] as [number, number]) }));
  const f25 = useMemo(() => fam(p25.beta, (1 + p25.beta) * p25.ICBO), []); // eslint-disable-line react-hooks/exhaustive-deps
  const ft = useMemo(() => fam(pt.beta, (1 + pt.beta) * pt.ICBO), [t]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <WidgetCard
      title="交互：温度升高，输出特性怎样变化"
      testId="temp-curves"
      controls={
        <>
          <ParamSlider label="温度 $t$" value={t} onChange={setT} min={-20} max={85} step={1} unit="°C" testId="tc-t" />
          <div className="grid grid-cols-2 gap-1.5">
            <Readout label={r`$\bar\beta$`} value={sig(pt.beta, 3)} tone="ac" />
            <Readout label="$U_{BE}$（同一 $I_B$）" value={formatSI(pt.UBE, "V")} tone="dc" />
            <Readout label="$I_{CBO}$" value={formatSI(pt.ICBO, "A")} />
            <Readout label="$I_{CEO}$" value={formatSI((1 + pt.beta) * pt.ICBO, "A")} tone="warn" />
          </div>
          <Toggle checked={showLog} onChange={setShowLog} label="显示 $I_{CBO}$ 随温度曲线" />
        </>
      }
      footer={r`经验模型（25 °C 为基准）：$\bar\beta$ 约 +1%/°C，$U_{BE}$ 约 −2.2 mV/°C，$I_{CBO}$ 约每 10 °C 翻倍；为突出效果，示例管的 $I_{CBO}$ 取得较大（0.5 µA，接近锗管）。三者都使 $I_C$ 增大——这是第 3 章“分压式偏置稳定 Q 点”要解决的问题。`}
    >
      {showLog ? (
        <>
          <PlotTitle>{String.raw`$\lg(I_{CBO}/\mathrm A)$ – $t$`}</PlotTitle>
          <Plot height={240} ariaLabel="ICBO 随温度" x={{ domain: [-20, 85], label: "t / °C" }} y={{ domain: [-8, -4], ticks: intTicks(-8, -4), format: fmtPow10 }}>
            {(s) => (
              <g>
                <Line points={Array.from({ length: 106 }, (_, k) => [k - 20, Math.log10(atTemperature(p25, k - 20).ICBO)] as [number, number])} s={s} color="var(--warn)" width={2.2} />
                <circle cx={s.sx(t)} cy={s.sy(Math.log10(pt.ICBO))} r={5} fill="var(--warn)" />
              </g>
            )}
          </Plot>
        </>
      ) : (
        <>
          <Plot height={250} ariaLabel="不同温度下的输出特性" x={{ domain: [0, 12], label: "u_CE / V" }} y={{ domain: [0, 12], label: "i_C / mA" }}>
            {(s) => (
              <g>
                {f25.map((c) => (
                  <Line key={`a${c.iB}`} points={c.points} s={s} color="var(--ink-3)" width={1.3} dash="4 3" />
                ))}
                {ft.map((c) => (
                  <Line key={`b${c.iB}`} points={c.points} s={s} color="var(--err)" width={2} />
                ))}
              </g>
            )}
          </Plot>
          <Legend items={[["25 °C", "var(--ink-3)", "4 3"], [`${t} °C`, "var(--err)"]]} />
          <p className="text-[12px] text-ink-3">三条曲线依次为 i_B = 20、40、60 µA。</p>
        </>
      )}
    </WidgetCard>
  );
}
