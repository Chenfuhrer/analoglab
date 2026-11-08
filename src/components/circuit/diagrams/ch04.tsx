/** 第 4 章电路图：场效应管符号、共源（自给偏压/分压偏置）、共漏、共栅 */
import { Terminal, Wire, Dot } from "../symbols";
import { Cap, Fig, Lbl, MOS, Rail, Res } from "../parts";
import type { DiagramComponent, DiagramProps } from "./types";

const v = (p: DiagramProps, k: string) => p.labels?.[k];

/** 结型场效应管符号：栅极 (gx, gy)，漏极 (gx+30, gy−35)，源极 (gx+30, gy+35) */
function JFET({ gx, gy, type = "n" }: { gx: number; gy: number; type?: "n" | "p" }) {
  const ch = gx + 22;
  const d = gx + 40;
  return (
    <g>
      <line x1={ch} y1={gy - 20} x2={ch} y2={gy + 20} stroke="var(--ink)" strokeWidth={3} />
      <Wire pts={[[ch, gy - 13], [d, gy - 13], [d, gy - 35]]} />
      <Wire pts={[[ch, gy + 13], [d, gy + 13], [d, gy + 35]]} />
      <Wire pts={[[gx, gy + 13], [ch, gy + 13]]} />
      <path
        d={type === "n" ? `M${ch - 1} ${gy + 13}L${ch - 9} ${gy + 9}L${ch - 9} ${gy + 17}Z` : `M${gx + 4} ${gy + 13}L${gx + 12} ${gy + 9}L${gx + 12} ${gy + 17}Z`}
        fill="var(--ink)"
      />
    </g>
  );
}

export const FETSymbols: DiagramComponent = (p) => {
  const items: Array<[number, string, React.ReactNode]> = [
    [20, "N 沟道增强型", <MOS key="a" gx={30} gy={80} type="n" mode="enh" />],
    [140, "N 沟道耗尽型", <MOS key="b" gx={150} gy={80} type="n" mode="dep" />],
    [260, "P 沟道增强型", <MOS key="c" gx={270} gy={80} type="p" mode="enh" />],
    [380, "N 沟道结型", <JFET key="d" gx={390} gy={80} type="n" />],
  ];
  return (
    <Fig w={500} h={160} label="场效应管符号" caption={p.caption}>
      {items.map(([x, t, el]) => (
        <g key={t}>
          {el}
          <text x={x + 40} y={150} fontSize={12} textAnchor="middle" fill="var(--ink-2)">
            {t}
          </text>
          <text x={x + 56} y={44} fontSize={11} fill="var(--ink-3)">
            d
          </text>
          <text x={x + 56} y={124} fontSize={11} fill="var(--ink-3)">
            s
          </text>
          <text x={x + 2} y={84} fontSize={11} fill="var(--ink-3)">
            g
          </text>
        </g>
      ))}
    </Fig>
  );
};

/** 共源放大电路：bias = "self"（耗尽型/结型，自给偏压）或 "divider"（分压偏置，带 R_g3） */
export const CSAmp: DiagramComponent = (p) => {
  const self = v(p, "bias") === "self";
  const G = 240;
  const gx = 230;
  const gy = 125;
  return (
    <Fig w={480} h={270} label={self ? "自给偏压共源放大电路" : "分压式偏置共源放大电路"} caption={p.caption}>
      <MOS gx={gx} gy={gy} type="n" mode={self ? "dep" : "enh"} />
      {/* 漏极 */}
      <Res a={[gx + 40, gy - 40]} b={[gx + 40, 34]} len={34} />
      <Rail x={gx + 40} y={30} main="V" sub="DD" />
      <Lbl x={gx + 52} y={66} t="R_d" value={v(p, "Rd")} size={13} />
      <Dot x={gx + 40} y={gy - 40} />
      <Cap a={[gx + 40, gy - 40]} b={[370, gy - 40]} polarized />
      <Lbl x={330} y={gy - 58} t="C_2" size={12} />
      <Wire pts={[[370, gy - 40], [430, gy - 40]]} />
      <Dot x={400} y={gy - 40} />
      <Res a={[400, gy - 40]} b={[400, G]} />
      <Lbl x={410} y={170} t="R_L" value={v(p, "RL")} size={13} />
      <Terminal x={434} y={gy - 40} />
      <Lbl x={424} y={gy - 54} t="u_o" size={13} />
      {/* 源极 */}
      <Dot x={gx + 40} y={gy + 55} />
      <Wire pts={[[gx + 40, gy + 40], [gx + 40, gy + 55]]} />
      <Res a={[gx + 40, gy + 55]} b={[gx + 40, G]} len={34} />
      <Lbl x={gx + 18} y={200} t="R_s" value={v(p, "Rs")} size={13} anchor="end" />
      {v(p, "bypass") !== "no" && (
        <>
          <Wire pts={[[gx + 40, gy + 55], [gx + 85, gy + 55]]} />
          <Cap a={[gx + 85, gy + 55]} b={[gx + 85, G]} polarized />
          <Lbl x={gx + 98} y={205} t="C_s" size={12} />
        </>
      )}
      {/* 栅极偏置 */}
      <Terminal x={36} y={gy + 10} />
      <Lbl x={26} y={gy - 2} t="u_i" size={13} />
      <Cap a={[40, gy + 10]} b={[110, gy + 10]} polarized />
      <Lbl x={68} y={gy - 8} t="C_1" size={12} />
      {self ? (
        <>
          <Wire pts={[[110, gy + 10], [gx, gy + 10]]} />
          <Dot x={160} y={gy + 10} />
          <Res a={[160, gy + 10]} b={[160, G]} />
          <Lbl x={172} y={200} t="R_g" value={v(p, "Rg")} size={13} />
        </>
      ) : (
        <>
          <Dot x={140} y={gy + 10} />
          <Wire pts={[[110, gy + 10], [140, gy + 10]]} />
          <Res a={[140, gy + 10]} b={[140, 34]} len={34} />
          <Rail x={140} y={30} main="V" sub="DD" />
          <Lbl x={152} y={74} t="R_g2" value={v(p, "Rg2")} size={12} />
          <Res a={[140, gy + 10]} b={[140, G]} len={34} />
          <Lbl x={152} y={196} t="R_g1" value={v(p, "Rg1")} size={12} />
          <Wire pts={[[140, gy + 10], [150, gy + 10]]} />
          <Res a={[150, gy + 10]} b={[gx, gy + 10]} len={30} />
          <Lbl x={176} y={gy - 6} t="R_g3" value={v(p, "Rg3")} size={12} />
        </>
      )}
      <Wire pts={[[36, G], [434, G]]} />
      <Terminal x={36} y={G} />
      <Terminal x={434} y={G} />
    </Fig>
  );
};

/** 共漏放大电路（源极跟随器，分压偏置） */
export const CDAmp: DiagramComponent = (p) => {
  const G = 240;
  const gx = 230;
  const gy = 110;
  return (
    <Fig w={480} h={265} label="共漏放大电路（源极跟随器）" caption={p.caption}>
      <MOS gx={gx} gy={gy} type="n" mode="enh" />
      <Wire pts={[[gx + 40, gy - 40], [gx + 40, 34]]} />
      <Rail x={gx + 40} y={30} main="V" sub="DD" />
      <Dot x={gx + 40} y={gy + 60} />
      <Wire pts={[[gx + 40, gy + 40], [gx + 40, gy + 60]]} />
      <Res a={[gx + 40, gy + 60]} b={[gx + 40, G]} len={34} />
      <Lbl x={gx + 52} y={208} t="R_s" value={v(p, "Rs")} size={13} />
      <Cap a={[gx + 40, gy + 60]} b={[370, gy + 60]} polarized />
      <Lbl x={330} y={gy + 42} t="C_2" size={12} />
      <Wire pts={[[370, gy + 60], [430, gy + 60]]} />
      <Dot x={400} y={gy + 60} />
      <Res a={[400, gy + 60]} b={[400, G]} len={30} />
      <Lbl x={410} y={212} t="R_L" value={v(p, "RL")} size={13} />
      <Terminal x={434} y={gy + 60} />
      <Lbl x={424} y={gy + 46} t="u_o" size={13} />
      <Terminal x={36} y={gy + 10} />
      <Lbl x={26} y={gy - 2} t="u_i" size={13} />
      <Cap a={[40, gy + 10]} b={[110, gy + 10]} polarized />
      <Lbl x={68} y={gy - 8} t="C_1" size={12} />
      <Dot x={140} y={gy + 10} />
      <Wire pts={[[110, gy + 10], [140, gy + 10]]} />
      <Res a={[140, gy + 10]} b={[140, 34]} len={34} />
      <Rail x={140} y={30} main="V" sub="DD" />
      <Lbl x={152} y={70} t="R_g2" value={v(p, "Rg2")} size={12} />
      <Res a={[140, gy + 10]} b={[140, G]} len={34} />
      <Lbl x={152} y={190} t="R_g1" value={v(p, "Rg1")} size={12} />
      <Res a={[140, gy + 10]} b={[gx, gy + 10]} len={30} />
      <Lbl x={176} y={gy - 6} t="R_g3" value={v(p, "Rg3")} size={12} />
      <Wire pts={[[36, G], [434, G]]} />
      <Terminal x={36} y={G} />
      <Terminal x={434} y={G} />
    </Fig>
  );
};

/** 共栅放大电路：栅极经 C_g 交流接地，信号由源极输入 */
export const CGAmp: DiagramComponent = (p) => {
  const G = 245;
  const gx = 230;
  const gy = 120;
  return (
    <Fig w={480} h={275} label="共栅放大电路" caption={p.caption}>
      <MOS gx={gx} gy={gy} type="n" mode="enh" />
      <Res a={[gx + 40, gy - 40]} b={[gx + 40, 34]} len={34} />
      <Rail x={gx + 40} y={30} main="V" sub="DD" />
      <Lbl x={gx + 52} y={64} t="R_d" value={v(p, "Rd")} size={13} />
      <Dot x={gx + 40} y={gy - 40} />
      <Cap a={[gx + 40, gy - 40]} b={[370, gy - 40]} polarized />
      <Wire pts={[[370, gy - 40], [430, gy - 40]]} />
      <Dot x={400} y={gy - 40} />
      <Res a={[400, gy - 40]} b={[400, G]} />
      <Lbl x={410} y={170} t="R_L" value={v(p, "RL")} size={13} />
      <Terminal x={434} y={gy - 40} />
      <Lbl x={424} y={gy - 54} t="u_o" size={13} />
      {/* 源极输入 */}
      <Wire pts={[[gx + 40, gy + 40], [gx + 40, gy + 85]]} />
      <Dot x={gx + 40} y={gy + 85} />
      <Res a={[gx + 40, gy + 85]} b={[gx + 40, G]} len={24} />
      <Lbl x={gx + 52} y={232} t="R_s" value={v(p, "Rs")} size={13} />
      <Terminal x={36} y={gy + 85} />
      <Lbl x={26} y={gy + 58} t="u_i" size={13} />
      <Cap a={[40, gy + 85]} b={[120, gy + 85]} polarized />
      <Wire pts={[[120, gy + 85], [gx + 40, gy + 85]]} />
      {/* 栅极偏置 + C_g */}
      <Wire pts={[[gx, gy + 10], [180, gy + 10]]} />
      <Dot x={180} y={gy + 10} />
      <Res a={[180, gy + 10]} b={[180, 34]} len={34} />
      <Rail x={180} y={30} main="V" sub="DD" />
      <Lbl x={160} y={70} t="R_g2" value={v(p, "Rg2")} size={12} anchor="end" />
      <Wire pts={[[180, gy + 10], [130, gy + 10]]} />
      <Dot x={130} y={gy + 10} />
      <Res a={[130, gy + 10]} b={[130, gy + 62]} len={26} />
      <Lbl x={118} y={gy + 40} t="R_g1" value={v(p, "Rg1")} size={12} anchor="end" />
      <Wire pts={[[130, gy + 62], [130, gy + 64]]} />
      <Wire pts={[[180, gy + 10], [180, gy + 30]]} />
      <Cap a={[180, gy + 30]} b={[180, gy + 64]} />
      <Lbl x={192} y={gy + 52} t="C_g" size={12} />
      <Wire pts={[[130, gy + 64], [180, gy + 64]]} />
      <Wire pts={[[155, gy + 64], [155, gy + 66]]} />
      <path d={`M143 ${gy + 66}L167 ${gy + 66}M147 ${gy + 85}L163 ${gy + 85}M151 ${gy + 74}L159 ${gy + 74}`} stroke="var(--ink)" strokeWidth={1.6} />
      <Wire pts={[[36, G], [434, G]]} />
      <Terminal x={36} y={G} />
      <Terminal x={434} y={G} />
    </Fig>
  );
};

export const CH4_DIAGRAMS = {
  "fet-symbols": FETSymbols,
  "cs-amp": CSAmp,
  "cd-amp": CDAmp,
  "cg-amp": CGAmp,
};
