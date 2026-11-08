/** 第 3 章电路图：共集（射极跟随器）、共基放大电路 */
import { Terminal, Wire, Dot } from "../symbols";
import { BJT, Cap, Fig, Lbl, Rail, Res } from "../parts";
import type { DiagramComponent, DiagramProps } from "./types";

const v = (p: DiagramProps, k: string) => p.labels?.[k];

/** 共集电极放大电路；labels.bias = "divider" 时为分压偏置 */
export const CCAmp: DiagramComponent = (p) => {
  const divider = v(p, "bias") === "divider";
  const G = 235;
  return (
    <Fig w={480} h={265} label="共集电极放大电路（射极跟随器）" caption={p.caption}>
      <Rail x={170} y={34} />
      <Res a={[170, 38]} b={[170, 120]} />
      <Lbl x={182} y={84} t={divider ? "R_b2" : "R_b"} value={v(p, divider ? "Rb2" : "Rb")} size={13} />
      {divider && (
        <>
          <Res a={[170, 120]} b={[170, G]} />
          <Lbl x={182} y={186} t="R_b1" value={v(p, "Rb1")} size={13} />
        </>
      )}
      <Dot x={170} y={120} />
      <Wire pts={[[170, 120], [210, 120]]} />
      <BJT bx={210} by={120} />
      <Rail x={260} y={34} />
      <Wire pts={[[260, 38], [260, 70]]} />
      <Terminal x={40} y={120} />
      <Lbl x={30} y={108} t="u_i" size={13} />
      <Cap a={[44, 120]} b={[170, 120]} polarized />
      <Lbl x={96} y={102} t="C_1" size={12} />
      <Res a={[260, 170]} b={[260, G]} />
      <Lbl x={272} y={210} t="R_e" value={v(p, "Re")} size={13} />
      <Dot x={260} y={178} />
      <Wire pts={[[260, 178], [300, 178]]} />
      <Cap a={[300, 178]} b={[370, 178]} polarized />
      <Lbl x={328} y={160} t="C_2" size={12} />
      <Wire pts={[[370, 178], [400, 178]]} />
      <Dot x={400} y={178} />
      <Res a={[400, 178]} b={[400, G]} len={30} />
      <Lbl x={410} y={214} t="R_L" value={v(p, "RL")} size={13} />
      <Wire pts={[[400, 178], [440, 178]]} />
      <Terminal x={444} y={178} />
      <Lbl x={430} y={166} t="u_o" size={13} />
      <Wire pts={[[40, G], [444, G]]} />
      <Terminal x={40} y={G} />
      <Terminal x={444} y={G} />
    </Fig>
  );
};

/** 共基极放大电路（分压偏置，基极经 C_b 交流接地） */
export const CBAmp: DiagramComponent = (p) => {
  const bx = 240;
  const by = 160;
  const G = 245;
  return (
    <Fig w={500} h={275} label="共基极放大电路" caption={p.caption}>
      <g transform={`rotate(-90 ${bx} ${by})`}>
        <BJT bx={bx} by={by} flip />
      </g>
      {/* 发射极（左上）输入 */}
      <Terminal x={36} y={110} />
      <Lbl x={26} y={98} t="u_i" size={13} />
      <Cap a={[40, 110]} b={[150, 110]} polarized />
      <Lbl x={88} y={92} t="C_1" size={12} />
      <Wire pts={[[150, 110], [190, 110]]} />
      <Dot x={160} y={110} />
      <Res a={[160, 110]} b={[160, G]} />
      <Lbl x={130} y={185} t="R_e" value={v(p, "Re")} size={13} anchor="end" />
      {/* 集电极（右上） */}
      <Wire pts={[[290, 110], [330, 110]]} />
      <Dot x={330} y={110} />
      <Res a={[330, 110]} b={[330, 38]} len={32} />
      <Rail x={330} y={34} />
      <Lbl x={342} y={78} t="R_c" value={v(p, "Rc")} size={13} />
      <Cap a={[330, 110]} b={[420, 110]} polarized />
      <Lbl x={366} y={92} t="C_2" size={12} />
      <Dot x={440} y={110} />
      <Wire pts={[[420, 110], [470, 110]]} />
      <Res a={[440, 110]} b={[440, G]} />
      <Lbl x={450} y={190} t="R_L" value={v(p, "RL")} size={13} />
      <Terminal x={474} y={110} />
      <Lbl x={462} y={98} t="u_o" size={13} />
      {/* 基极偏置 */}
      <Wire pts={[[bx, by], [bx, 185], [370, 185]]} />
      <Dot x={bx} y={185} />
      <Cap a={[bx, 185]} b={[bx, G]} />
      <Lbl x={bx - 12} y={222} t="C_b" size={12} anchor="end" />
      <Dot x={370} y={185} />
      <Res a={[370, 185]} b={[370, 140]} len={26} />
      <Rail x={370} y={136} />
      <Lbl x={382} y={168} t="R_b2" size={12} value={v(p, "Rb2")} />
      <Res a={[370, 185]} b={[370, G]} len={30} />
      <Lbl x={382} y={226} t="R_b1" size={12} value={v(p, "Rb1")} />
      <Wire pts={[[36, G], [474, G]]} />
      <Terminal x={36} y={G} />
      <Terminal x={474} y={G} />
      <Lbl x={bx + 8} y={by + 18} t="b" size={11} />
      <Lbl x={190} y={98} t="e" size={11} />
      <Lbl x={282} y={98} t="c" size={11} />
    </Fig>
  );
};

export const CH3_DIAGRAMS = {
  "cc-amp": CCAmp,
  "cb-amp": CBAmp,
};
