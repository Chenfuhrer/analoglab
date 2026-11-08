/** 第 2 章电路图：晶体管符号、三种组态、特性测试电路、电极电位 */
import { Ground, Terminal, Wire, Dot } from "../symbols";
import { BJT, DCSource, Fig, Lbl, Res } from "../parts";
import type { DiagramComponent, DiagramProps } from "./types";

const v = (p: DiagramProps, k: string) => p.labels?.[k];

export const BJTSymbols: DiagramComponent = (p) => (
  <Fig w={420} h={180} label="NPN 与 PNP 晶体管符号" caption={p.caption}>
    <BJT bx={70} by={90} type="npn" />
    <Lbl x={60} y={84} t="b" anchor="end" />
    <Lbl x={128} y={46} t="c" />
    <Lbl x={128} y={142} t="e" />
    <text x={100} y={172} fontSize={13} textAnchor="middle" fill="var(--ink-2)">
      NPN（箭头向外）
    </text>
    <BJT bx={280} by={90} type="pnp" />
    <Lbl x={270} y={84} t="b" anchor="end" />
    <Lbl x={338} y={46} t="c" />
    <Lbl x={338} y={142} t="e" />
    <text x={310} y={172} fontSize={13} textAnchor="middle" fill="var(--ink-2)">
      PNP（箭头向里）
    </text>
  </Fig>
);

/** 三种组态（交流信号的输入、输出端口） */
export const BJTConfigs: DiagramComponent = (p) => {
  const panel = (ox: number, title: string, kind: "ce" | "cc" | "cb") => {
    const bx = ox + 50;
    const by = 90;
    const c: [number, number] = [bx + 50, by - 50];
    const e: [number, number] = [bx + 50, by + 50];
    const gnd = 170;
    return (
      <g key={kind}>
        <BJT bx={bx} by={by} type="npn" circle={false} />
        {kind === "ce" && (
          <>
            <Wire pts={[[ox + 10, by], [bx, by]]} />
            <Terminal x={ox + 10} y={by} />
            <Wire pts={[c, [ox + 150, c[1]]]} />
            <Terminal x={ox + 150} y={c[1]} />
            <Wire pts={[e, [e[0], gnd], [ox + 10, gnd]]} />
            <Wire pts={[[e[0], gnd], [ox + 150, gnd]]} />
            <Lbl x={ox + 14} y={by - 8} t="入" size={12} />
            <Lbl x={ox + 130} y={c[1] - 8} t="出" size={12} />
          </>
        )}
        {kind === "cc" && (
          <>
            <Wire pts={[[ox + 10, by], [bx, by]]} />
            <Terminal x={ox + 10} y={by} />
            <Wire pts={[e, [ox + 150, e[1]]]} />
            <Terminal x={ox + 150} y={e[1]} />
            <Wire pts={[c, [c[0], c[1] - 15], [ox + 155, c[1] - 15], [ox + 155, gnd]]} />
            <Wire pts={[[ox + 10, gnd], [ox + 155, gnd]]} />
            <Lbl x={ox + 14} y={by - 8} t="入" size={12} />
            <Lbl x={ox + 128} y={e[1] - 8} t="出" size={12} />
          </>
        )}
        {kind === "cb" && (
          <>
            <Wire pts={[e, [e[0], e[1] + 8], [ox + 10, e[1] + 8]]} />
            <Terminal x={ox + 10} y={e[1] + 8} />
            <Wire pts={[c, [ox + 150, c[1]]]} />
            <Terminal x={ox + 150} y={c[1]} />
            <Wire pts={[[bx, by], [bx - 10, by], [bx - 10, gnd]]} />
            <Wire pts={[[ox + 10, gnd], [ox + 150, gnd]]} />
            <Lbl x={ox + 14} y={e[1] - 2} t="入" size={12} />
            <Lbl x={ox + 130} y={c[1] - 8} t="出" size={12} />
          </>
        )}
        <Terminal x={ox + 10} y={gnd} />
        <Terminal x={ox + (kind === "cc" ? 155 : 150)} y={gnd} />
        <text x={ox + 80} y={gnd + 26} fontSize={13} textAnchor="middle" fill="var(--accent)" fontWeight={600}>
          {title}
        </text>
      </g>
    );
  };
  return (
    <Fig w={520} h={210} label="晶体管的三种组态" caption={p.caption}>
      {panel(0, "共射：b 入 c 出", "ce")}
      {panel(175, "共集：b 入 e 出", "cc")}
      {panel(350, "共基：e 入 c 出", "cb")}
    </Fig>
  );
};

/** 特性测试 / 偏置电路：V_BB—R_b—b，V_CC—R_c—c，e 接地 */
export const BJTTest: DiagramComponent = (p) => (
  <Fig w={380} h={230} label="晶体管偏置电路" caption={p.caption}>
    <DCSource x={40} y1={110} y2={200} />
    <Lbl x={62} y={165} t="V_BB" value={v(p, "VBB")} size={12} />
    <Res a={[40, 110]} b={[150, 110]} />
    <Lbl x={82} y={95} t="R_b" value={v(p, "Rb")} size={13} />
    <BJT bx={150} by={110} />
    <Res a={[200, 60]} b={[200, 20]} len={30} />
    <Lbl x={212} y={44} t="R_c" value={v(p, "Rc")} size={13} />
    <Wire pts={[[200, 20], [320, 20], [320, 70]]} />
    <DCSource x={320} y1={70} y2={200} />
    <Lbl x={340} y={130} t="V_CC" value={v(p, "VCC")} size={12} />
    <Wire pts={[[200, 160], [200, 200]]} />
    <Wire pts={[[40, 200], [320, 200]]} />
    <Dot x={200} y={200} />
    <Ground x={200} y={200} />
    <Lbl x={210} y={80} t="c" size={12} />
    <Lbl x={210} y={150} t="e" size={12} />
    <Lbl x={140} y={102} t="b" size={12} anchor="end" />
  </Fig>
);

/** 三个电极电位（判断管型与电极） */
export const BJTPins: DiagramComponent = (p) => (
  <Fig w={300} h={180} label="三个电极的对地电位" caption={p.caption}>
    <rect x={110} y={50} width={80} height={60} rx={8} fill="var(--bg-elev)" stroke="var(--ink)" strokeWidth={1.6} />
    <text x={150} y={86} fontSize={14} textAnchor="middle" fill="var(--ink-2)">
      VT
    </text>
    {[
      [125, "①", "1"],
      [150, "②", "2"],
      [175, "③", "3"],
    ].map(([x, n, k]) => (
      <g key={String(k)}>
        <Wire pts={[[Number(x), 110], [Number(x), 140]]} />
        <Dot x={Number(x)} y={140} />
        <text x={Number(x)} y={160} fontSize={13} textAnchor="middle" fill="var(--ink)">
          {String(n)}
        </text>
        <text x={Number(x)} y={176} fontSize={11.5} textAnchor="middle" fill="var(--ink-3)" style={{ fontFamily: "var(--font-mono)" }}>
          {v(p, String(k)) ?? ""}
        </text>
      </g>
    ))}
  </Fig>
);

export const CH2_DIAGRAMS = {
  "bjt-symbols": BJTSymbols,
  "bjt-configs": BJTConfigs,
  "bjt-test": BJTTest,
  "bjt-pins": BJTPins,
};
