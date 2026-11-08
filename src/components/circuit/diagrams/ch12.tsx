/** 第 12 章电路图：直流电源方框图、桥式整流电容滤波、串联型稳压电路 */
import { Terminal, Wire, Dot, Ground } from "../symbols";
import { Arrow, BJT, Block, Cap, Diode, Fig, Lbl, OpAmp, opampPins, Res, Pot } from "../parts";
import type { DiagramComponent, DiagramProps } from "./types";

const v = (p: DiagramProps, k: string) => p.labels?.[k];

export const SupplyBlock: DiagramComponent = (p) => (
  <Fig w={620} h={140} label="直流稳压电源的组成" caption={p.caption}>
    <text x={20} y={74} fontSize={12} fill="var(--ink-2)">
      220 V
    </text>
    <Arrow pts={[[62, 70], [80, 70]]} />
    <Block x={80} y={45} w={100} h={50} text="变压" sub="降压" />
    <Arrow pts={[[180, 70], [210, 70]]} />
    <Block x={210} y={45} w={100} h={50} text="整流" sub="交流→脉动直流" />
    <Arrow pts={[[310, 70], [340, 70]]} />
    <Block x={340} y={45} w={100} h={50} text="滤波" sub="减小纹波" />
    <Arrow pts={[[440, 70], [470, 70]]} />
    <Block x={470} y={45} w={100} h={50} text="稳压" sub="稳定输出" />
    <Arrow pts={[[570, 70], [605, 70]]} />
    <text x={585} y={60} fontSize={12} fill="var(--ink-2)">
      U_O
    </text>
  </Fig>
);

/** 桥式整流 + 电容滤波（简化：u₂ 直接作为桥的输入） */
export const CapFilter: DiagramComponent = (p) => {
  const cx = 170;
  const cy = 120;
  const d = 50;
  const T: [number, number] = [cx, cy - d];
  const B: [number, number] = [cx, cy + d];
  const L: [number, number] = [cx - d, cy];
  const R: [number, number] = [cx + d, cy];
  return (
    <Fig w={460} h={240} label="桥式整流电容滤波电路" caption={p.caption}>
      <Terminal x={40} y={cy} />
      <Lbl x={30} y={cy - 12} t="u_2" value={v(p, "U2")} size={13} />
      <Wire pts={[[44, cy], L]} />
      <Wire pts={[R, [R[0] + 20, cy], [R[0] + 20, 220], [40, 220]]} />
      <Terminal x={40} y={220} />
      <Diode a={L} k={T} />
      <Diode a={R} k={T} />
      <Diode a={B} k={L} />
      <Diode a={B} k={R} />
      <Wire pts={[T, [T[0], 40], [380, 40]]} />
      <Wire pts={[B, [B[0], 190], [380, 190]]} />
      <Dot x={300} y={40} />
      <Dot x={300} y={190} />
      <Cap a={[300, 40]} b={[300, 190]} polarized />
      <Lbl x={312} y={120} t="C" value={v(p, "C")} size={13} />
      <Res a={[380, 40]} b={[380, 190]} />
      <Lbl x={392} y={120} t="R_L" value={v(p, "RL")} size={13} />
      <text x={420} y={60} fontSize={12} fill="var(--ink-2)">
        +
      </text>
      <text x={420} y={186} fontSize={12} fill="var(--ink-2)">
        −
      </text>
      <Lbl x={418} y={98} t="u_O" size={13} />
    </Fig>
  );
};

/** 串联型稳压电路 */
export const SeriesReg: DiagramComponent = (p) => {
  const OX = 180;
  const OY = 150;
  const pins = opampPins(OX, OY);
  const G = 270;
  return (
    <Fig w={520} h={300} label="串联型稳压电路" caption={p.caption}>
      <Terminal x={30} y={40} />
      <Terminal x={30} y={G} />
      <Lbl x={20} y={150} t="U_I" value={v(p, "UI")} size={13} />
      <Wire pts={[[34, 40], [230, 40]]} />
      {/* 调整管：集电极接 U_I，基极由放大器驱动，发射极输出 */}
      <BJT bx={280} by={90} />
      <Wire pts={[[230, 40], [330, 40]]} />
      <Lbl x={342} y={84} t="VT" size={12} />
      <Wire pts={[[330, 140], [330, 150], [470, 150]]} />
      <Dot x={400} y={150} />
      <Dot x={440} y={150} />
      <Terminal x={474} y={150} />
      <Lbl x={480} y={176} t="U_O" size={13} />
      <OpAmp x={OX} y={OY} />
      {/* 放大器输出 → 调整管基极 */}
      <Wire pts={[pins.out, [OX + 85, OY], [OX + 85, 90], [280, 90]]} />
      {/* 基准：R → 稳压管 → 同相端 */}
      <Wire pts={[[70, 40], [70, 60]]} />
      <Dot x={70} y={40} />
      <Res a={[70, 60]} b={[70, 150]} len={30} />
      <Lbl x={58} y={108} t="R" size={12} anchor="end" />
      <Dot x={70} y={165} />
      <Wire pts={[[70, 150], [70, 165], [140, 165], [140, pins.bot[1]], pins.bot]} />
      <Diode a={[70, G]} k={[70, 165]} zener />
      <Lbl x={58} y={222} t="U_Z" size={12} anchor="end" />
      {/* 采样电阻 */}
      <Res a={[400, 150]} b={[400, 185]} len={22} />
      <Lbl x={412} y={172} t="R_1" value={v(p, "R1")} size={11} />
      <Pot a={[400, 185]} b={[400, 225]} len={24} side={1} />
      <Lbl x={412} y={210} t="R_P" size={11} />
      <Res a={[400, 225]} b={[400, G]} len={22} />
      <Lbl x={412} y={252} t="R_2" value={v(p, "R2")} size={11} />
      <Wire pts={[[376, 205], [150, 205], [150, pins.top[1]], pins.top]} />
      <Res a={[440, 150]} b={[440, G]} len={34} />
      <Lbl x={452} y={216} t="R_L" value={v(p, "RL")} size={12} />
      <Wire pts={[[34, G], [474, G]]} />
      <Ground x={250} y={G} />
      <text x={150} y={110} fontSize={11} fill="var(--ink-3)">
        比较放大
      </text>
    </Fig>
  );
};

export const CH12_DIAGRAMS = {
  "supply-block": SupplyBlock,
  "cap-filter": CapFilter,
  "series-reg": SeriesReg,
};
