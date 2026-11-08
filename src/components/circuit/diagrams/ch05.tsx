/** 第 5 章电路图：二端口级联框图、共射–共集两级电路、直接耦合两级共射 */
import { Terminal, Wire, Dot, Ground } from "../symbols";
import { ACSourceV, BJT, Cap, Fig, Lbl, Rail, Res } from "../parts";
import type { DiagramComponent, DiagramProps } from "./types";

const v = (p: DiagramProps, k: string) => p.labels?.[k];

/** 一级放大电路的二端口模型：输入电阻 R_i，输出端为受控电压源 A_uo·U_i 串 R_o */
function StageBox({ x, n }: { x: number; n: number }) {
  const y1 = 50;
  const y2 = 150;
  return (
    <g>
      <rect x={x} y={30} width={150} height={140} rx={6} fill="none" stroke="var(--ink-3)" strokeDasharray="5 4" />
      <text x={x + 75} y={24} fontSize={12} textAnchor="middle" fill="var(--ink-2)">
        第 {n} 级
      </text>
      <Wire pts={[[x, y1], [x + 25, y1]]} />
      <Wire pts={[[x, y2], [x + 25, y2]]} />
      <Res a={[x + 25, y1]} b={[x + 25, y2]} len={34} />
      <Lbl x={x + 36} y={104} t={`R_i${n}`} size={12} />
      <circle cx={x + 95} cy={100} r={15} fill="var(--bg-elev)" stroke="var(--ink)" strokeWidth={1.6} />
      <text x={x + 95} y={97} fontSize={11} textAnchor="middle" fill="var(--ink)">
        +
      </text>
      <text x={x + 95} y={110} fontSize={11} textAnchor="middle" fill="var(--ink)">
        −
      </text>
      <Lbl x={x + 74} y={136} t={`A_uo${n}U_i${n}`} size={10.5} anchor="middle" />
      <Wire pts={[[x + 95, 85], [x + 95, y1], [x + 105, y1]]} />
      <Res a={[x + 105, y1]} b={[x + 150, y1]} len={26} />
      <Lbl x={x + 116} y={y1 - 10} t={`R_o${n}`} size={12} />
      <Wire pts={[[x + 95, 115], [x + 95, y2], [x + 150, y2]]} />
    </g>
  );
}

export const BlockCascade: DiagramComponent = (p) => (
  <Fig w={600} h={190} label="两级放大电路的二端口模型" caption={p.caption}>
    <ACSourceV x={30} y1={50} y2={150} />
    <Lbl x={6} y={104} t="u_s" size={12} />
    <Res a={[30, 50]} b={[110, 50]} len={30} />
    <Lbl x={60} y={40} t="R_s" size={12} />
    <Wire pts={[[30, 150], [110, 150]]} />
    <StageBox x={110} n={1} />
    <StageBox x={290} n={2} />
    <Wire pts={[[260, 50], [290, 50]]} />
    <Wire pts={[[260, 150], [290, 150]]} />
    <Wire pts={[[440, 50], [540, 50]]} />
    <Wire pts={[[440, 150], [540, 150]]} />
    <Res a={[540, 50]} b={[540, 150]} len={34} />
    <Lbl x={552} y={104} t="R_L" size={12} />
    <text x={275} y={185} fontSize={11.5} textAnchor="middle" fill="var(--accent)">
      ↑ 第 2 级的 R_i2 就是第 1 级的负载
    </text>
  </Fig>
);

/** 共射–共集两级阻容耦合放大电路 */
export const CECCAmp: DiagramComponent = (p) => {
  const G = 250;
  return (
    <Fig w={640} h={280} label="共射–共集两级放大电路" caption={p.caption}>
      {/* 第一级：分压偏置共射 */}
      <Terminal x={30} y={140} />
      <Lbl x={20} y={128} t="u_i" size={13} />
      <Cap a={[34, 140]} b={[100, 140]} polarized />
      <Dot x={110} y={140} />
      <Wire pts={[[100, 140], [150, 140]]} />
      <Rail x={110} y={30} />
      <Res a={[110, 34]} b={[110, 140]} />
      <Lbl x={122} y={84} t="R_b2" value={v(p, "Rb2")} size={11} />
      <Res a={[110, 140]} b={[110, G]} />
      <Lbl x={122} y={204} t="R_b1" value={v(p, "Rb1")} size={11} />
      <BJT bx={150} by={140} />
      <Res a={[200, 90]} b={[200, 34]} len={30} />
      <Rail x={200} y={30} />
      <Lbl x={212} y={64} t="R_c1" value={v(p, "Rc1")} size={11} />
      <Dot x={200} y={190} />
      <Res a={[200, 190]} b={[200, G]} len={28} />
      <Lbl x={176} y={226} t="R_e1" value={v(p, "Re1")} size={11} anchor="end" />
      <Wire pts={[[200, 190], [240, 190]]} />
      <Cap a={[240, 190]} b={[240, G]} polarized />
      <Lbl x={252} y={230} t="C_e" size={11} />
      {/* 级间耦合 */}
      <Dot x={200} y={100} />
      <Wire pts={[[200, 90], [200, 100]]} />
      <Cap a={[200, 100]} b={[320, 100]} polarized />
      <Lbl x={252} y={84} t="C_2" size={11} />
      {/* 第二级：射极跟随器 */}
      <Dot x={340} y={100} />
      <Wire pts={[[320, 100], [400, 100]]} />
      <Rail x={340} y={30} />
      <Res a={[340, 34]} b={[340, 100]} len={30} />
      <Lbl x={352} y={60} t="R_b3" value={v(p, "Rb3")} size={11} />
      <Res a={[340, 100]} b={[340, G]} />
      <Lbl x={352} y={186} t="R_b4" value={v(p, "Rb4")} size={11} />
      <BJT bx={400} by={100} />
      <Wire pts={[[450, 50], [450, 34]]} />
      <Rail x={450} y={30} />
      <Dot x={450} y={170} />
      <Wire pts={[[450, 150], [450, 170]]} />
      <Res a={[450, 170]} b={[450, G]} len={30} />
      <Lbl x={462} y={222} t="R_e2" value={v(p, "Re2")} size={11} />
      <Cap a={[450, 170]} b={[540, 170]} polarized />
      <Lbl x={490} y={154} t="C_3" size={11} />
      <Dot x={570} y={170} />
      <Wire pts={[[540, 170], [610, 170]]} />
      <Res a={[570, 170]} b={[570, G]} len={30} />
      <Lbl x={580} y={222} t="R_L" value={v(p, "RL")} size={11} />
      <Terminal x={614} y={170} />
      <Lbl x={604} y={158} t="u_o" size={13} />
      <Wire pts={[[30, G], [614, G]]} />
      <Terminal x={30} y={G} />
      <Terminal x={614} y={G} />
      <text x={150} y={274} fontSize={11.5} textAnchor="middle" fill="var(--ink-2)">
        第 1 级：共射
      </text>
      <text x={430} y={274} fontSize={11.5} textAnchor="middle" fill="var(--ink-2)">
        第 2 级：共集
      </text>
    </Fig>
  );
};

/** 直接耦合两级共射 */
export const Direct2CE: DiagramComponent = (p) => {
  const G = 240;
  return (
    <Fig w={520} h={270} label="直接耦合两级共射放大电路" caption={p.caption}>
      <Terminal x={40} y={150} />
      <Lbl x={30} y={138} t="u_i" size={13} />
      <Wire pts={[[40, 150], [150, 150]]} />
      <Dot x={110} y={150} />
      <Res a={[110, 150]} b={[110, 34]} />
      <Rail x={110} y={30} />
      <Lbl x={122} y={92} t="R_b1" value={v(p, "Rb1")} size={11} />
      <BJT bx={150} by={150} />
      <Wire pts={[[200, 200], [200, G]]} />
      <Res a={[200, 100]} b={[200, 34]} len={34} />
      <Rail x={200} y={30} />
      <Lbl x={212} y={62} t="R_c1" value={v(p, "Rc1")} size={11} />
      <Dot x={200} y={110} />
      <Wire pts={[[200, 100], [200, 110], [300, 110]]} />
      <BJT bx={300} by={110} />
      <Res a={[350, 60]} b={[350, 34]} len={20} />
      <Rail x={350} y={30} />
      <Lbl x={362} y={48} t="R_c2" value={v(p, "Rc2")} size={11} />
      <Res a={[350, 160]} b={[350, G]} />
      <Lbl x={362} y={206} t="R_e2" value={v(p, "Re2")} size={11} />
      <Dot x={350} y={60} />
      <Wire pts={[[350, 60], [450, 60]]} />
      <Terminal x={454} y={60} />
      <Lbl x={444} y={48} t="u_o" size={13} />
      <Wire pts={[[40, G], [454, G]]} />
      <Terminal x={40} y={G} />
      <Terminal x={454} y={G} />
      <Ground x={250} y={G} />
      <text x={250} y={100} fontSize={11} fill="var(--warn)" textAnchor="middle">
        U_C1 = U_B2
      </text>
    </Fig>
  );
};

export const CH5_DIAGRAMS = {
  "block-cascade": BlockCascade,
  "cecc-amp": CECCAmp,
  "direct-2ce": Direct2CE,
};
