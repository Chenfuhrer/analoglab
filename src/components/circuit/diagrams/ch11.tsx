/** 第 11 章电路图：振荡器框图、文氏桥振荡器、三点式交流通路、一阶/二阶有源低通 */
import { Terminal, Wire, Dot, Ground } from "../symbols";
import { Arrow, BJT, Block, Cap, Fig, Ind, Lbl, OpAmp, opampPins, Res, SumNode } from "../parts";
import type { DiagramComponent, DiagramProps } from "./types";

const v = (p: DiagramProps, k: string) => p.labels?.[k];

export const OscBlock: DiagramComponent = (p) => (
  <Fig w={500} h={200} label="正弦波振荡电路的方框图" caption={p.caption}>
    <SumNode x={90} y={70} />
    <Arrow pts={[[101, 70], [190, 70]]} />
    <Lbl x={120} y={58} t="X_i'" size={13} />
    <Block x={190} y={45} w={110} h={50} text="A" sub="放大电路" />
    <Arrow pts={[[300, 70], [460, 70]]} />
    <Lbl x={440} y={58} t="X_o" size={14} />
    <Dot x={390} y={70} />
    <Wire pts={[[390, 70], [390, 160], [300, 160]]} />
    <Block x={190} y={135} w={110} h={50} text="F" sub="选频 + 正反馈网络" />
    <Arrow pts={[[190, 160], [90, 160], [90, 82]]} />
    <Lbl x={110} y={152} t="X_f" size={13} />
    <text x={70} y={64} fontSize={13} fill="var(--ink)">
      +
    </text>
    <text x={20} y={74} fontSize={11.5} fill="var(--ink-3)">
      X_i = 0
    </text>
  </Fig>
);

/** 文氏桥振荡器 */
export const WienBridge: DiagramComponent = (p) => {
  const OX = 230;
  const OY = 140;
  const pins = opampPins(OX, OY);
  const OUT = pins.out[0] + 20;
  return (
    <Fig w={420} h={300} label="RC 桥式（文氏桥）正弦波振荡电路" caption={p.caption}>
      <OpAmp x={OX} y={OY} />
      <Wire pts={[pins.out, [OUT + 40, OY]]} />
      <Terminal x={OUT + 44} y={OY} />
      <Lbl x={OUT + 34} y={OY - 12} t="u_O" size={13} />
      <Dot x={OUT} y={OY} />
      {/* 负反馈：R_f、R_1 */}
      <Wire pts={[[OUT, OY], [OUT, 50], [300, 50]]} />
      <Res a={[300, 50]} b={[190, 50]} />
      <Lbl x={245} y={36} t="R_f" value={v(p, "Rf")} size={12} anchor="middle" />
      <Wire pts={[[190, 50], [190, pins.top[1]], pins.top]} />
      <Dot x={190} y={pins.top[1]} />
      <Wire pts={[[190, pins.top[1]], [150, pins.top[1]]]} />
      <Res a={[150, pins.top[1]]} b={[150, 270]} len={30} />
      <Ground x={150} y={270} />
      <Lbl x={138} y={200} t="R_1" value={v(p, "R1")} size={12} anchor="end" />
      {/* 正反馈：RC 串并联 */}
      <Wire pts={[[OUT, OY], [OUT, 210]]} />
      <Res a={[OUT, 210]} b={[300, 210]} len={28} />
      <Cap a={[300, 210]} b={[240, 210]} />
      <Lbl x={290} y={196} t="R" size={12} />
      <Lbl x={250} y={196} t="C" size={12} />
      <Wire pts={[[240, 210], [205, 210], [205, pins.bot[1]], pins.bot]} />
      <Dot x={205} y={210} />
      <Wire pts={[[205, 210], [205, 225], [185, 225]]} />
      <Res a={[185, 225]} b={[185, 275]} len={22} />
      <Wire pts={[[205, 225], [225, 225]]} />
      <Cap a={[225, 225]} b={[225, 275]} plate={9} gap={3.5} />
      <Wire pts={[[185, 275], [225, 275]]} />
      <Ground x={205} y={275} />
      <Lbl x={176} y={254} t="R" size={12} anchor="end" />
      <Lbl x={236} y={254} t="C" size={12} />
    </Fig>
  );
};

function Reactance({ a, b, kind }: { a: [number, number]; b: [number, number]; kind: string | undefined }) {
  return kind === "L" ? <Ind a={a} b={b} len={34} /> : <Cap a={a} b={b} />;
}

/** 三点式交流通路：VT 的 e 接地，be、ce、bc 间各一个电抗 */
export const ThreePoint: DiagramComponent = (p) => (
  <Fig w={360} h={260} label="三点式振荡电路的交流通路" caption={p.caption}>
    <BJT bx={160} by={120} />
    <Wire pts={[[210, 170], [210, 215]]} />
    <Ground x={210} y={215} />
    <Dot x={210} y={200} />
    {/* b–e：基极 → 下方 → 发射极 */}
    <Wire pts={[[160, 120], [100, 120]]} />
    <Dot x={100} y={120} />
    <Reactance a={[100, 120]} b={[100, 200]} kind={v(p, "be")} />
    <Wire pts={[[100, 200], [210, 200]]} />
    <Lbl x={86} y={164} t={`X_be`} value={v(p, "be") === "L" ? "电感" : "电容"} size={12} anchor="end" />
    {/* c–e：集电极 → 右侧 → 发射极 */}
    <Wire pts={[[210, 70], [210, 50], [290, 50]]} />
    <Dot x={290} y={50} />
    <Reactance a={[290, 50]} b={[290, 200]} kind={v(p, "ce")} />
    <Wire pts={[[290, 200], [210, 200]]} />
    <Lbl x={302} y={130} t="X_ce" value={v(p, "ce") === "L" ? "电感" : "电容"} size={12} />
    {/* b–c：上方连接 */}
    <Wire pts={[[100, 120], [100, 30], [150, 30]]} />
    <Reactance a={[150, 30]} b={[250, 30]} kind={v(p, "bc")} />
    <Wire pts={[[250, 30], [290, 30], [290, 50]]} />
    <Lbl x={200} y={18} t="X_bc" value={v(p, "bc") === "L" ? "电感" : "电容"} size={12} anchor="middle" />
  </Fig>
);

/** 有源低通：order = "1"（RC + 同相放大）或 "2"（压控电压源二阶） */
export const ActiveLP: DiagramComponent = (p) => {
  const second = v(p, "order") === "2";
  const OX = 260;
  const OY = 130;
  const pins = opampPins(OX, OY);
  return (
    <Fig w={460} h={270} label={second ? "二阶压控电压源低通滤波器" : "一阶有源低通滤波器"} caption={p.caption}>
      <OpAmp x={OX} y={OY} />
      <Terminal x={30} y={pins.bot[1]} />
      <Lbl x={20} y={pins.bot[1] - 12} t="u_I" size={13} />
      {second ? (
        <g>
          <Res a={[34, pins.bot[1]]} b={[120, pins.bot[1]]} len={30} />
          <Dot x={130} y={pins.bot[1]} />
          <Wire pts={[[120, pins.bot[1]], [140, pins.bot[1]]]} />
          <Res a={[140, pins.bot[1]]} b={[220, pins.bot[1]]} len={30} />
          <Lbl x={77} y={pins.bot[1] + 26} t="R" size={12} anchor="middle" />
          <Lbl x={180} y={pins.bot[1] + 26} t="R" size={12} anchor="middle" />
          <Dot x={225} y={pins.bot[1]} />
          <Wire pts={[[220, pins.bot[1]], pins.bot]} />
          <Cap a={[225, pins.bot[1]]} b={[225, 240]} />
          <Ground x={225} y={240} />
          <Lbl x={237} y={215} t="C" size={12} />
          {/* 第一个电容接到输出（正反馈） */}
          <Wire pts={[[130, pins.bot[1]], [130, 70]]} />
          <Cap a={[130, 70]} b={[130, 30]} />
          <Wire pts={[[130, 30], [380, 30], [380, OY]]} />
          <Lbl x={142} y={56} t="C" size={12} />
        </g>
      ) : (
        <g>
          <Res a={[34, pins.bot[1]]} b={[200, pins.bot[1]]} />
          <Lbl x={117} y={pins.bot[1] - 14} t="R" value={v(p, "R")} size={12} anchor="middle" />
          <Dot x={215} y={pins.bot[1]} />
          <Wire pts={[[200, pins.bot[1]], pins.bot]} />
          <Cap a={[215, pins.bot[1]]} b={[215, 240]} />
          <Ground x={215} y={240} />
          <Lbl x={227} y={215} t="C" value={v(p, "C")} size={12} />
        </g>
      )}
      {/* 同相放大：R_1、R_f */}
      <Wire pts={[pins.top, [240, pins.top[1]], [240, 70], [260, 70]]} />
      <Res a={[260, 70]} b={[350, 70]} len={30} />
      <Lbl x={305} y={58} t="R_f" value={v(p, "Rf")} size={12} anchor="middle" />
      <Wire pts={[[350, 70], [360, 70], [360, OY]]} />
      <Dot x={240} y={pins.top[1]} />
      <Wire pts={[[240, pins.top[1]], [240, 150]]} />
      <Wire pts={[[240, 150], [180, 150], [180, 175]]} />
      <Res a={[180, 175]} b={[180, 240]} len={26} />
      <Ground x={180} y={240} />
      <Lbl x={168} y={214} t="R_1" value={v(p, "R1")} size={12} anchor="end" />
      <Wire pts={[pins.out, [420, OY]]} />
      <Dot x={360} y={OY} />
      {second && <Dot x={380} y={OY} />}
      <Terminal x={424} y={OY} />
      <Lbl x={414} y={OY - 12} t="u_O" size={13} />
    </Fig>
  );
};

export const CH11_DIAGRAMS = {
  "osc-block": OscBlock,
  "wien-bridge": WienBridge,
  "three-point": ThreePoint,
  "active-lp": ActiveLP,
};
