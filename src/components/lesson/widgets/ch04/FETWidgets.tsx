"use client";

import { useMemo, useState } from "react";
import { r, Rich } from "@/components/math/Tex";
import { analyzeCD, analyzeCG, analyzeCS, DEFAULT_CS, DEFAULT_CS_SELF, DEFAULT_NDEP, DEFAULT_NENH, DEFAULT_NJFET, drainCurrent, FET_REGION_LABEL, fetRegion, kCoef, transconductance, transferCurrent, type FETAmpParams, type FETKind, type FETParams } from "@/simulations/fet/mos";
import { formatSI, sig } from "@/simulations/units";
import { Line, Plot } from "@/components/plot/Plot";
import { ParamSlider, Readout, Segmented, Toggle } from "@/components/ui/primitives";
import { ChipGroup, Legend, PlotTitle, WidgetCard } from "../WidgetCard";

/* ───────────── 沟道的形成与预夹断 ───────────── */
export function ChannelDemo() {
  const [ugs, setUgs] = useState(4);
  const [uds, setUds] = useState(1);
  const p = DEFAULT_NENH;
  const reg = fetRegion(p, ugs, uds);
  const id = drainCurrent(p, ugs, uds);
  const ov = Math.max(0, ugs - p.Vt);
  // 沟道厚度：源端 ∝ (u_GS − U_th)，漏端 ∝ (u_GS − U_th − u_DS)，夹断后为 0
  const tS = Math.min(18, ov * 6);
  const tD = Math.max(0, Math.min(18, (ov - uds) * 6));
  const pinch = reg === "saturation";
  const xS = 110;
  const xD = 370;
  const xPinch = pinch ? xD - Math.min(60, (uds - ov) * 8) : xD;
  return (
    <WidgetCard
      title="交互：栅压感应出沟道，漏压让沟道“倾斜”直至预夹断"
      testId="channel-demo"
      controls={
        <>
          <ParamSlider label="$u_{GS}$" value={ugs} onChange={setUgs} min={0} max={6} step={0.05} unit="V" testId="ch-ugs" />
          <ParamSlider label="$u_{DS}$" value={uds} onChange={setUds} min={0} max={8} step={0.05} unit="V" testId="ch-uds" />
          <div className="grid grid-cols-2 gap-1.5">
            <Readout label="$i_D$" value={formatSI(id, "A")} tone="ac" testId="ch-id" />
            <Readout label="工作区" value={FET_REGION_LABEL[reg]} tone={reg === "saturation" ? "ok" : reg === "ohmic" ? "warn" : "err"} testId="ch-region" />
            <Readout label="$u_{GD}=u_{GS}-u_{DS}$" value={formatSI(ugs - uds, "V")} />
            <Readout label="$U_{GS(th)}$" value={formatSI(p.Vt, "V")} />
          </div>
        </>
      }
      footer="N 沟道增强型 MOS（$U_{GS(th)}$=2 V，$I_{DO}$=2 mA）。示意图中沟道厚度正比于该处的“有效栅压” $u_{GS}-U_{GS(th)}$ 减去沟道电位；当 $u_{GD}=U_{GS(th)}$（即 $u_{DS}=u_{GS}-U_{GS(th)}$）时漏端沟道消失——**预夹断**。此后 $u_{DS}$ 增加的部分主要降在夹断区，$i_D$ 基本不变（恒流区）。"
    >
      <svg viewBox="0 0 480 200" className="block h-auto w-full" role="img" aria-label="MOS 管沟道示意">
        <rect x={40} y={70} width={400} height={110} fill="var(--err-soft)" stroke="var(--line)" />
        <text x={240} y={172} fontSize={12} textAnchor="middle" fill="var(--err)">
          P 型衬底
        </text>
        <rect x={60} y={70} width={60} height={34} rx={4} fill="var(--ac-soft)" stroke="var(--ac)" />
        <rect x={360} y={70} width={60} height={34} rx={4} fill="var(--ac-soft)" stroke="var(--ac)" />
        <text x={90} y={92} fontSize={12} textAnchor="middle" fill="var(--ac)">
          N⁺ 源 s
        </text>
        <text x={390} y={92} fontSize={12} textAnchor="middle" fill="var(--ac)">
          N⁺ 漏 d
        </text>
        <rect x={110} y={56} width={260} height={10} fill="var(--bg-elev)" stroke="var(--ink-3)" />
        <rect x={110} y={38} width={260} height={16} fill="var(--ink-3)" />
        <text x={240} y={32} fontSize={12} textAnchor="middle" fill="var(--ink-2)">
          栅极 g（SiO₂ 绝缘层之上）
        </text>
        {ov > 0 && (
          <path
            d={`M${xS} 70L${xPinch} 70L${xPinch} ${70 + tD}L${xS} ${70 + tS}Z`}
            fill="var(--ac)"
            opacity={0.55}
            className="transition-all duration-200"
          />
        )}
        {pinch && (
          <g>
            <rect x={xPinch} y={70} width={xD - xPinch} height={8} fill="var(--warn-soft)" />
            <text x={(xPinch + xD) / 2} y={124} fontSize={11} textAnchor="middle" fill="var(--warn)">
              夹断区
            </text>
          </g>
        )}
        {ov <= 0 && (
          <text x={240} y={124} fontSize={12} textAnchor="middle" fill="var(--ink-2)">
            u_GS &lt; U_GS(th)：没有导电沟道
          </text>
        )}
      </svg>
    </WidgetCard>
  );
}

/* ───────────── 转移特性 ───────────── */
const KIND_PARAMS: Record<string, FETParams> = {
  "n-enh": DEFAULT_NENH,
  "n-dep": DEFAULT_NDEP,
  "n-jfet": DEFAULT_NJFET,
  "p-enh": { kind: "p-enh", Vt: -2, Iref: 2e-3, lambda: 0 },
};

export function TransferCurves() {
  const [kind, setKind] = useState<FETKind>("n-enh");
  const [Iref, setIref] = useState(KIND_PARAMS["n-enh"].Iref);
  const base = KIND_PARAMS[kind];
  const p: FETParams = { ...base, Iref };
  const isPch = kind.startsWith("p");
  const enh = kind.endsWith("enh");
  const lo = isPch ? -6 : enh ? 0 : -4;
  const hi = isPch ? 0 : enh ? 6 : kind === "n-jfet" ? 0 : 2;
  const pts = useMemo(() => {
    const out: Array<[number, number]> = [];
    for (let k = 0; k <= 200; k++) {
      const u = lo + ((hi - lo) * k) / 200;
      out.push([u, Math.abs(transferCurrent(p, u)) * 1e3]);
    }
    return out;
  }, [kind, Iref]); // eslint-disable-line react-hooks/exhaustive-deps
  const yMax = Math.max(...pts.map((q) => q[1])) * 1.1 || 1;
  return (
    <WidgetCard
      title="交互：四种场效应管的转移特性 $i_D=f(u_{GS})$"
      testId="transfer-curves"
      controls={
        <>
          <ChipGroup
            label="管型"
            value={kind}
            onChange={(k) => {
              setKind(k);
              setIref(KIND_PARAMS[k].Iref);
            }}
            testId="tc-kind"
            options={[
              { value: "n-enh", label: "N 增强 MOS" },
              { value: "n-dep", label: "N 耗尽 MOS" },
              { value: "n-jfet", label: "N 结型" },
              { value: "p-enh", label: "P 增强 MOS" },
            ]}
          />
          <ParamSlider label={enh ? "$I_{DO}$" : "$I_{DSS}$"} value={Iref} onChange={setIref} min={0.5e-3} max={10e-3} step={0.1e-3} unit="mA" scale={1e-3} />
          <div className="grid grid-cols-2 gap-1.5">
            <Readout label={enh ? "开启电压 $U_{GS(th)}$" : "夹断电压 $U_{GS(off)}$"} value={formatSI(p.Vt, "V")} tone="dc" />
            <Readout label={r`$K=I/U^2$`} value={`${sig(kCoef(p) * 1e3, 3)} mA/V²`} />
          </div>
        </>
      }
      footer={enh ? r`增强型：$u_{GS}$ 超过开启电压才有沟道，$i_D=I_{DO}(u_{GS}/U_{GS(th)}-1)^2$；$I_{DO}$ 是 $u_{GS}=2U_{GS(th)}$ 时的漏极电流。P 沟道管电压、电流方向全部相反（图中画的是 $|i_D|$）。` : r`耗尽型/结型：$u_{GS}=0$ 时已有沟道，电流为 $I_{DSS}$；$u_{GS}$ 负到 $U_{GS(off)}$ 时夹断。$i_D=I_{DSS}(1-u_{GS}/U_{GS(off)})^2$。结型管的栅源 PN 结不能正偏，所以 $u_{GS}\le0$。`}
    >
      <PlotTitle>{String.raw`$|i_D|$（mA）– $u_{GS}$（V），恒流区`}</PlotTitle>
      <Plot height={240} ariaLabel="转移特性" x={{ domain: [lo, hi], label: "u_GS / V" }} y={{ domain: [0, yMax], label: "mA" }}>
        {(s) => (
          <g>
            <Line points={pts} s={s} color="var(--ac)" width={2.4} />
            <line x1={s.sx(p.Vt)} x2={s.sx(p.Vt)} y1={s.m.t} y2={s.m.t + s.ih} stroke="var(--dc)" strokeDasharray="4 3" />
            <circle cx={s.sx(enh ? 2 * p.Vt : 0)} cy={s.sy(Iref * 1e3)} r={4.5} fill="var(--ac)" />
          </g>
        )}
      </Plot>
      <Legend items={[["转移特性", "var(--ac)"], [enh ? "开启电压" : "夹断电压", "var(--dc)", "4 3"]]} />
    </WidgetCard>
  );
}

/* ───────────── 输出特性 ───────────── */
export function MOSOutput() {
  const [ugs, setUgs] = useState(4);
  const [uds, setUds] = useState(6);
  const [lam, setLam] = useState(false);
  const p: FETParams = { ...DEFAULT_NENH, lambda: lam ? 0.02 : 0 };
  const fam = useMemo(() => {
    return [3, 3.5, 4, 4.5, 5].map((v) => ({
      v,
      pts: Array.from({ length: 161 }, (_, k) => {
        const u = (12 * k) / 160;
        return [u, drainCurrent(p, v, u) * 1e3] as [number, number];
      }),
    }));
  }, [lam]); // eslint-disable-line react-hooks/exhaustive-deps
  const boundary = Array.from({ length: 60 }, (_, k) => {
    const ov = (3.2 * k) / 59;
    return [ov, kCoef(p) * ov * ov * 1e3] as [number, number];
  });
  const reg = fetRegion(p, ugs, uds);
  const id = drainCurrent(p, ugs, uds);
  return (
    <WidgetCard
      title="交互：输出特性 $i_D=f(u_{DS})\,|_{u_{GS}}$ 与三个区"
      testId="mos-output"
      controls={
        <>
          <ParamSlider label="$u_{GS}$" value={ugs} onChange={setUgs} min={0} max={5.5} step={0.05} unit="V" testId="mo-ugs" />
          <ParamSlider label="$u_{DS}$" value={uds} onChange={setUds} min={0} max={12} step={0.05} unit="V" testId="mo-uds" />
          <Toggle checked={lam} onChange={setLam} label={r`沟道长度调制（$\lambda$=0.02 V⁻¹）`} />
          <div className="grid grid-cols-2 gap-1.5">
            <Readout label="$i_D$" value={formatSI(id, "A")} tone="ac" />
            <Readout label="工作区" value={FET_REGION_LABEL[reg]} tone={reg === "saturation" ? "ok" : "warn"} testId="mo-region" />
          </div>
        </>
      }
      footer="虚线为预夹断轨迹 $u_{DS}=u_{GS}-U_{GS(th)}$：左侧为可变电阻区（$i_D$ 随 $u_{DS}$ 近似线性增大，相当于受 $u_{GS}$ 控制的电阻），右侧为恒流区（放大区）。注意：场效应管的“饱和区”指的是**电流饱和**，对应晶体管的放大区，与晶体管的饱和区含义相反。"
    >
      <Plot height={260} ariaLabel="MOS 输出特性" x={{ domain: [0, 12], label: "u_DS / V" }} y={{ domain: [0, 10], label: "i_D / mA" }}>
        {(s) => (
          <g>
            {fam.map((c) => (
              <g key={c.v}>
                <Line points={c.pts} s={s} color="var(--ink-3)" width={1.3} />
                <text x={s.sx(12) - 4} y={s.sy(c.pts[160][1]) - 4} fontSize={10.5} textAnchor="end" fill="var(--ink-3)">
                  {c.v} V
                </text>
              </g>
            ))}
            <Line points={boundary} s={s} color="var(--warn)" width={1.6} dash="5 3" />
            <circle cx={s.sx(uds)} cy={s.sy(id * 1e3)} r={5} fill="var(--bg-elev)" stroke="var(--ink)" strokeWidth={2} />
          </g>
        )}
      </Plot>
    </WidgetCard>
  );
}

/* ───────────── 跨导 ───────────── */
export function GmDemo() {
  const [ugsq, setUgsq] = useState(3.5);
  const p = DEFAULT_NENH;
  const ID = transferCurrent(p, ugsq);
  const gm = transconductance(p, ID);
  const curve = useMemo(() => Array.from({ length: 161 }, (_, k) => [(6 * k) / 160, transferCurrent(p, (6 * k) / 160) * 1e3] as [number, number]), []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <WidgetCard
      title="交互：跨导 $g_m$ 是转移特性在 Q 点的切线斜率"
      testId="gm-demo"
      controls={
        <>
          <ParamSlider label="$U_{GSQ}$" value={ugsq} onChange={setUgsq} min={2.05} max={5.5} step={0.01} unit="V" testId="gm-ugs" />
          <div className="grid grid-cols-2 gap-1.5">
            <Readout label="$I_{DQ}$" value={formatSI(ID, "A")} tone="dc" />
            <Readout label="$g_m$" value={`${sig(gm * 1e3, 3)} mS`} tone="ss" testId="gm-value" />
          </div>
          <p className="text-[12.5px] text-ink-2">
            <Rich text={r`$g_m=\dfrac{2}{U_{GS(th)}}\sqrt{I_{DO}I_{DQ}}$：电流越大，$g_m$ 越大，但只按 $\sqrt{I_D}$ 增长；晶体管的 $g_m=I_{CQ}/U_T$ 正比于电流，同样 1 mA 时约 38 mS，比 MOS 管大得多。`} />
          </p>
        </>
      }
    >
      <Plot height={240} ariaLabel="转移特性与切线" x={{ domain: [0, 6], label: "u_GS / V" }} y={{ domain: [0, 10], label: "i_D / mA" }}>
        {(s) => (
          <g>
            <Line points={curve} s={s} color="var(--ac)" width={2.4} />
            <Line
              points={[
                [ugsq - 1, (ID - gm) * 1e3],
                [ugsq + 1, (ID + gm) * 1e3],
              ]}
              s={s}
              color="var(--ss)"
              width={1.8}
              dash="5 3"
            />
            <circle cx={s.sx(ugsq)} cy={s.sy(ID * 1e3)} r={5} fill="var(--bg-elev)" stroke="var(--ink)" strokeWidth={2} />
          </g>
        )}
      </Plot>
    </WidgetCard>
  );
}

/* ───────────── 共源放大电路实验 ───────────── */
export function CSLab() {
  const [bias, setBias] = useState<"divider" | "self">("divider");
  const [Rd, setRd] = useState(3e3);
  const [Rs, setRs] = useState(1e3);
  const [bypass, setBypass] = useState(true);
  const [RL, setRL] = useState(10e3);
  const [Rg1, setRg1] = useState(100e3);
  const base: FETAmpParams = bias === "divider" ? DEFAULT_CS : DEFAULT_CS_SELF;
  const a = { ...base, Rd, Rs, bypass, RL, Rg1: bias === "divider" ? Rg1 : 0 };
  const { q, ac } = analyzeCS(a);
  return (
    <WidgetCard
      title="交互：共源放大电路的静态与动态分析"
      testId="cs-lab"
      controls={
        <>
          <Segmented
            label="偏置"
            value={bias}
            onChange={(b) => {
              setBias(b);
              setRs(b === "divider" ? 1e3 : 500);
              setRd(b === "divider" ? 3e3 : 2e3);
            }}
            options={[
              { value: "divider", label: "分压偏置（增强型）" },
              { value: "self", label: "自给偏压（耗尽型）" },
            ]}
          />
          {bias === "divider" && <ParamSlider label="$R_{g1}$（下）" value={Rg1} onChange={setRg1} min={20e3} max={500e3} log unit="kΩ" scale={1e3} />}
          <ParamSlider label="$R_s$" value={Rs} onChange={setRs} min={100} max={5e3} log unit="kΩ" scale={1e3} testId="cs-rs" />
          <ParamSlider label="$R_d$" value={Rd} onChange={setRd} min={500} max={20e3} log unit="kΩ" scale={1e3} testId="cs-rd" />
          <ParamSlider label="$R_L$" value={RL} onChange={setRL} min={1e3} max={1e6} log unit="kΩ" scale={1e3} />
          <Toggle checked={bypass} onChange={setBypass} label="源极电容 $C_s$ 旁路" />
        </>
      }
      footer={bias === "divider" ? "增强型 NMOS：$U_{GS(th)}$=2 V，$I_{DO}$=2 mA；$V_{DD}$=15 V，$R_{g2}$=300 kΩ，$R_{g3}$=1 MΩ。" : "耗尽型 NMOS：$U_{GS(off)}$=−2 V，$I_{DSS}$=4 mA；$V_{DD}$=15 V，$R_g$=1 MΩ。自给偏压靠 $R_s$ 上的压降使 $U_{GS}<0$，只适用于耗尽型和结型管。"}
    >
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        <Readout label="$U_{GQ}$" value={formatSI(q.UGQ, "V")} />
        <Readout label="$U_{GSQ}$" value={formatSI(q.UGSQ, "V")} tone="dc" />
        <Readout label="$I_{DQ}$" value={formatSI(q.IDQ, "A")} tone="dc" testId="cs-id" />
        <Readout label="$U_{DSQ}$" value={formatSI(q.UDSQ, "V")} tone="dc" />
        <Readout label="工作区" value={FET_REGION_LABEL[q.region]} tone={q.region === "saturation" ? "ok" : "err"} testId="cs-region" />
        <Readout label="$g_m$" value={`${sig(q.gm * 1e3, 3)} mS`} tone="ss" />
        <Readout label={r`$\dot A_u$`} value={q.region === "saturation" ? sig(ac.Au, 3) : "—"} tone="ac" testId="cs-au" />
        <Readout label="$R_i$" value={formatSI(ac.Ri, "Ω")} />
      </div>
      {q.rejected !== undefined && (
        <p className="text-[12.5px] text-ink-3">
          <Rich text={`联立方程得到两个 $U_{GS}$ 解：${sig(q.UGSQ, 4)} V 与 ${sig(q.rejected, 4)} V。后者${bias === "divider" ? "低于开启电压" : "低于夹断电压"}，管子应截止，与“有电流”的假设矛盾，舍去。`} />
        </p>
      )}
      {q.region !== "saturation" && (
        <p className="text-[13px] text-err">
          <Rich text="Q 点不在恒流区：$U_{DSQ}<U_{GSQ}-U_{T}$，管子进入可变电阻区，不能线性放大。减小 $R_d$ 或调整偏置。" />
        </p>
      )}
    </WidgetCard>
  );
}

/* ───────────── FET 三种组态对比 ───────────── */
export function FETConfigCompare() {
  const [RL, setRL] = useState(10e3);
  const base: FETAmpParams = { ...DEFAULT_CS, RL };
  const cs = analyzeCS(base);
  const cd = analyzeCD({ ...base, Rd: 0, bypass: false });
  const cg = analyzeCG(base);
  const rows = [
    ["共源 CS", cs, "反相", "≈ R_g（很大）", "g 入 d 出"],
    ["共漏 CD", cd, "同相", "≈ R_g（很大）", "g 入 s 出"],
    ["共栅 CG", cg, "同相", "R_s∥1/g_m（小）", "s 入 d 出"],
  ] as const;
  return (
    <WidgetCard
      title="交互：FET 三种组态对比"
      testId="fet-compare"
      controls={<ParamSlider label="$R_L$" value={RL} onChange={setRL} min={500} max={1e6} log unit="kΩ" scale={1e3} />}
      footer="同一分压偏置（$U_{GS(th)}$=2 V、$I_{DO}$=2 mA、$V_{DD}$=15 V、$R_d$=3 kΩ、$R_s$=1 kΩ）。共漏电路去掉 $R_d$，输出取自源极。"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]" data-testid="fet-cmp-table">
          <thead>
            <tr className="border-b border-line text-left text-[12px] text-ink-3">
              <th className="py-1 font-normal">组态</th>
              <th className="py-1 font-normal">
                <Rich text={r`$\dot A_u$`} />
              </th>
              <th className="py-1 font-normal">
                <Rich text="$R_i$" />
              </th>
              <th className="py-1 font-normal">
                <Rich text="$R_o$" />
              </th>
              <th className="py-1 font-normal">相位</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([n, a, ph, , io]) => (
              <tr key={n} className="border-b border-line-2">
                <td className="py-1.5">
                  {n}
                  <span className="block text-[11px] text-ink-3">{io}</span>
                </td>
                <td className="num py-1.5">{sig(a.ac.Au, 3)}</td>
                <td className="num py-1.5">{formatSI(a.ac.Ri, "Ω")}</td>
                <td className="num py-1.5">{formatSI(a.ac.Ro, "Ω")}</td>
                <td className="py-1.5">{ph}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[13px] text-ink-2">
        <Rich text={`同一 Q 点 $g_m=${sig(cs.q.gm * 1e3, 3)}$ mS。与晶体管电路对照：共源↔共射、共漏↔共集、共栅↔共基；把 $\\beta/r_{be}$ 换成 $g_m$、把 $r_{be}$ 换成 ∞（栅极不取电流）即可。`} />
      </p>
    </WidgetCard>
  );
}
