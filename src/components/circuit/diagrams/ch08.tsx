/** 第 8 章电路图：反馈框图、电流反馈运放电路、集电极–基极电压并联反馈 */
import { Terminal, Wire, Dot, Ground } from "../symbols";
import { Arrow, BJT, Block, Cap, Fig, Lbl, OpAmp, opampPins, Rail, Res, SumNode } from "../parts";
import type { DiagramComponent, DiagramProps } from "./types";

const v = (p: DiagramProps, k: string) => p.labels?.[k];

export const FBBlock: DiagramComponent = (p) => (
  <Fig w={520} h={200} label="反馈放大电路的方框图" caption={p.caption}>
    <Arrow pts={[[30, 70], [118, 70]]} />
    <Lbl x={40} y={58} t="X_i" size={14} />
    <SumNode x={130} y={70} />
    <text x={116} y={98} fontSize={14} fill="var(--ink)">
      −
    </text>
    <text x={104} y={64} fontSize={14} fill="var(--ink)">
      +
    </text>
    <Arrow pts={[[141, 70], [220, 70]]} />
    <Lbl x={160} y={58} t="X_i'" size={13} />
    <Block x={220} y={45} w={110} h={50} text="A" sub="基本放大电路" />
    <Arrow pts={[[330, 70], [480, 70]]} />
    <Lbl x={460} y={58} t="X_o" size={14} />
    <Dot x={410} y={70} />
    <Wire pts={[[410, 70], [410, 160], [330, 160]]} />
    <Block x={220} y={135} w={110} h={50} text="F" sub="反馈网络" />
    <Arrow pts={[[220, 160], [130, 160], [130, 82]]} />
    <Lbl x={150} y={152} t="X_f" size={13} />
  </Fig>
);

const OX = 210;
const OY = 120;
const pins = opampPins(OX, OY);

/** 电流串联负反馈：同相输入，负载 R_L 接在输出与反相端之间，R 接反相端到地。i_O = u_I/R */
export const CurrentSeriesOA: DiagramComponent = (p) => (
  <Fig w={420} h={240} label="电流串联负反馈（运放）" caption={p.caption}>
    <OpAmp x={OX} y={OY} />
    <Terminal x={40} y={pins.bot[1]} />
    <Lbl x={30} y={pins.bot[1] - 12} t="u_I" size={13} />
    <Wire pts={[[44, pins.bot[1]], pins.bot]} />
    <Wire pts={[pins.top, [180, pins.top[1]], [180, 40], [200, 40]]} />
    <Dot x={180} y={pins.top[1]} />
    <Res a={[200, 40]} b={[320, 40]} />
    <Wire pts={[[320, 40], [330, 40], [330, OY]]} />
    <Lbl x={260} y={26} t="R_L" value={v(p, "RL")} size={13} anchor="middle" />
    <Wire pts={[pins.out, [330, OY]]} />
    <Dot x={330} y={OY} />
    <Res a={[180, pins.top[1]]} b={[180, 215]} len={34} />
    <Ground x={180} y={215} />
    <Lbl x={168} y={180} t="R" value={v(p, "R")} size={13} anchor="end" />
    <text x={262} y={62} fontSize={11.5} fill="var(--accent)" textAnchor="middle">
      ← i_O
    </text>
  </Fig>
);

/** 电流并联负反馈：反相输入，负载接在输出与节点 X 之间，反馈电阻 R_f 从 X 到反相端，R 从 X 到地 */
export const CurrentShuntOA: DiagramComponent = (p) => (
  <Fig w={440} h={250} label="电流并联负反馈（运放）" caption={p.caption}>
    <OpAmp x={OX} y={OY} />
    <Terminal x={40} y={pins.top[1]} />
    <Lbl x={30} y={pins.top[1] - 12} t="u_I" size={13} />
    <Res a={[44, pins.top[1]]} b={[OX, pins.top[1]]} />
    <Lbl x={110} y={pins.top[1] - 14} t="R_1" value={v(p, "R1")} size={12} />
    <Wire pts={[[180, pins.top[1]], [180, 40], [200, 40]]} />
    <Dot x={180} y={pins.top[1]} />
    <Res a={[200, 40]} b={[330, 40]} />
    <Lbl x={265} y={26} t="R_f" value={v(p, "Rf")} size={12} anchor="middle" />
    <Wire pts={[[330, 40], [360, 40], [360, 160]]} />
    <Wire pts={[pins.out, [285, OY]]} />
    <Res a={[285, OY]} b={[360, OY]} len={36} />
    <Lbl x={322} y={OY - 14} t="R_L" value={v(p, "RL")} size={12} anchor="middle" />
    <Dot x={360} y={OY} />
    <Res a={[360, 160]} b={[360, 225]} len={30} />
    <Ground x={360} y={225} />
    <Lbl x={372} y={196} t="R" value={v(p, "R")} size={12} />
    <Wire pts={[pins.bot, [170, pins.bot[1]], [170, 225]]} />
    <Ground x={170} y={225} />
  </Fig>
);

/** 集电极–基极电阻构成的电压并联负反馈（共射） */
export const CollectorBaseFB: DiagramComponent = (p) => {
  const G = 230;
  return (
    <Fig w={420} h={255} label="集电极–基极反馈的共射电路" caption={p.caption}>
      <Terminal x={36} y={140} />
      <Lbl x={26} y={128} t="u_s" size={13} />
      <Res a={[40, 140]} b={[110, 140]} len={28} />
      <Lbl x={75} y={126} t="R_s" value={v(p, "Rs")} size={12} anchor="middle" />
      <Cap a={[110, 140]} b={[160, 140]} />
      <Dot x={175} y={140} />
      <Wire pts={[[160, 140], [200, 140]]} />
      <BJT bx={200} by={140} />
      <Rail x={250} y={30} />
      <Res a={[250, 34]} b={[250, 90]} len={30} />
      <Lbl x={262} y={64} t="R_c" value={v(p, "Rc")} size={12} />
      <Dot x={250} y={90} />
      <Wire pts={[[175, 140], [175, 70], [185, 70]]} />
      <Res a={[185, 70]} b={[235, 70]} len={26} />
      <Wire pts={[[235, 70], [235, 90], [250, 90]]} />
      <Lbl x={210} y={56} t="R_f" value={v(p, "Rf")} size={12} anchor="middle" />
      <Wire pts={[[250, 90], [340, 90]]} />
      <Terminal x={344} y={90} />
      <Lbl x={334} y={78} t="u_o" size={13} />
      <Wire pts={[[250, 190], [250, G]]} />
      <Wire pts={[[36, G], [344, G]]} />
      <Ground x={250} y={G} />
    </Fig>
  );
};

export const CH8_DIAGRAMS = {
  "fb-block": FBBlock,
  "fb-cs-oa": CurrentSeriesOA,
  "fb-csh-oa": CurrentShuntOA,
  "fb-cb": CollectorBaseFB,
};
