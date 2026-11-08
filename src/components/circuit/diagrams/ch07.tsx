/** 第 7 章电路图：运放比例、加减、积分、微分、比较器 */
import { Terminal, Wire, Dot, Ground } from "../symbols";
import { Cap, Diode, Fig, Lbl, OpAmp, opampPins, Res } from "../parts";
import type { DiagramComponent, DiagramProps } from "./types";

const v = (p: DiagramProps, k: string) => p.labels?.[k];
const OX = 210;
const OY = 130;
const pins = opampPins(OX, OY);
const NY = pins.top[1];
const PY = pins.bot[1];
const OUTX = pins.out[0];

/** 反馈支路：从反相端节点 (nx, NY) 向上到 y，再到输出 */
function feedback(nx: number, y: number, el: "R" | "C", label: string, value?: string) {
  return (
    <g>
      <Wire pts={[[nx, NY], [nx, y]]} />
      {el === "R" ? <Res a={[nx, y]} b={[OUTX + 20, y]} /> : <Cap a={[nx, y]} b={[OUTX + 20, y]} />}
      <Wire pts={[[OUTX + 20, y], [OUTX + 20, OY]]} />
      <Dot x={nx} y={NY} />
      <Dot x={OUTX + 20} y={OY} />
      <Lbl x={(nx + OUTX + 20) / 2} y={y - 14} t={label} value={value} size={13} anchor="middle" />
    </g>
  );
}

function output(label = "u_O") {
  return (
    <g>
      <Wire pts={[pins.out, [OUTX + 70, OY]]} />
      <Terminal x={OUTX + 74} y={OY} />
      <Lbl x={OUTX + 64} y={OY - 12} t={label} size={13} />
    </g>
  );
}

function plusToGround(label = "R'", value?: string) {
  return (
    <g>
      <Wire pts={[pins.bot, [170, PY]]} />
      <Res a={[170, PY]} b={[170, 230]} len={30} />
      <Ground x={170} y={230} />
      <Lbl x={158} y={204} t={label} value={value} size={12} anchor="end" />
    </g>
  );
}

export const InvAmp: DiagramComponent = (p) => (
  <Fig w={400} h={260} label="反相比例运算电路" caption={p.caption}>
    <OpAmp x={OX} y={OY} />
    <Terminal x={40} y={NY} />
    <Lbl x={30} y={NY - 12} t="u_I" size={13} />
    <Res a={[44, NY]} b={[OX, NY]} />
    <Lbl x={110} y={NY - 14} t="R_1" value={v(p, "R1")} size={13} />
    {feedback(180, 50, "R", "R_f", v(p, "Rf"))}
    {plusToGround("R'", v(p, "Rp"))}
    {output()}
  </Fig>
);

export const NonInvAmp: DiagramComponent = (p) => (
  <Fig w={400} h={260} label="同相比例运算电路" caption={p.caption}>
    <OpAmp x={OX} y={OY} />
    <Terminal x={40} y={PY} />
    <Lbl x={30} y={PY - 12} t="u_I" size={13} />
    <Res a={[44, PY]} b={[OX, PY]} />
    <Lbl x={110} y={PY + 26} t="R'" value={v(p, "Rp")} size={12} anchor="middle" />
    {feedback(180, 50, "R", "R_f", v(p, "Rf"))}
    <Wire pts={[[180, NY], [150, NY]]} />
    <Res a={[150, NY]} b={[150, 230]} len={34} />
    <Ground x={150} y={230} />
    <Lbl x={138} y={190} t="R_1" value={v(p, "R1")} size={13} anchor="end" />
    {output()}
  </Fig>
);

export const Follower: DiagramComponent = (p) => (
  <Fig w={400} h={200} label="电压跟随器" caption={p.caption}>
    <OpAmp x={OX} y={OY - 20} />
    <Terminal x={40} y={PY - 20} />
    <Lbl x={30} y={PY - 32} t="u_I" size={13} />
    <Wire pts={[[44, PY - 20], [OX, PY - 20]]} />
    <Wire pts={[[OX, NY - 20], [180, NY - 20], [180, 50], [OUTX + 20, 50], [OUTX + 20, OY - 20]]} />
    <Dot x={OUTX + 20} y={OY - 20} />
    <Wire pts={[[OUTX, OY - 20], [OUTX + 70, OY - 20]]} />
    <Terminal x={OUTX + 74} y={OY - 20} />
    <Lbl x={OUTX + 64} y={OY - 32} t="u_O" size={13} />
  </Fig>
);

export const Summer: DiagramComponent = (p) => (
  <Fig w={420} h={280} label="反相求和运算电路" caption={p.caption}>
    <OpAmp x={OX} y={OY + 20} />
    {[0, 1, 2].map((k) => {
      const y = 70 + k * 40;
      return (
        <g key={k}>
          <Terminal x={30} y={y} />
          <Lbl x={20} y={y - 10} t={`u_I${k + 1}`} size={12} />
          <Res a={[34, y]} b={[150, y]} len={34} />
          <Lbl x={92} y={y - 10} t={`R_${k + 1}`} value={v(p, `R${k + 1}`)} size={12} anchor="middle" />
          <Wire pts={[[150, y], [180, y]]} />
        </g>
      );
    })}
    <Wire pts={[[180, 70], [180, NY + 20], [OX, NY + 20]]} />
    <Dot x={180} y={110} />
    <Dot x={180} y={150} />
    <Wire pts={[[180, 70], [180, 40], [190, 40]]} />
    <Res a={[190, 40]} b={[OUTX + 20, 40]} />
    <Lbl x={(190 + OUTX + 20) / 2} y={26} t="R_f" value={v(p, "Rf")} size={13} anchor="middle" />
    <Wire pts={[[OUTX + 20, 40], [OUTX + 20, OY + 20]]} />
    <Dot x={OUTX + 20} y={OY + 20} />
    <Wire pts={[[OX, PY + 20], [170, PY + 20], [170, 220]]} />
    <Res a={[170, 220]} b={[170, 250]} len={20} />
    <Ground x={170} y={250} />
    <Wire pts={[[OUTX, OY + 20], [OUTX + 70, OY + 20]]} />
    <Terminal x={OUTX + 74} y={OY + 20} />
    <Lbl x={OUTX + 64} y={OY + 8} t="u_O" size={13} />
  </Fig>
);

export const Subtractor: DiagramComponent = (p) => (
  <Fig w={420} h={270} label="减法（差分比例）运算电路" caption={p.caption}>
    <OpAmp x={OX} y={OY} />
    <Terminal x={30} y={NY} />
    <Lbl x={20} y={NY - 12} t="u_I1" size={12} />
    <Res a={[34, NY]} b={[OX, NY]} />
    <Lbl x={110} y={NY - 14} t="R_1" value={v(p, "R1")} size={12} />
    {feedback(180, 50, "R", "R_f", v(p, "Rf"))}
    <Terminal x={30} y={PY} />
    <Lbl x={20} y={PY + 24} t="u_I2" size={12} />
    <Res a={[34, PY]} b={[OX, PY]} />
    <Lbl x={100} y={PY + 24} t="R_2" value={v(p, "R2")} size={12} />
    <Dot x={175} y={PY} />
    <Res a={[175, PY]} b={[175, 240]} len={30} />
    <Ground x={175} y={240} />
    <Lbl x={187} y={216} t="R_3" value={v(p, "R3")} size={12} />
    {output()}
  </Fig>
);

export const Integrator: DiagramComponent = (p) => (
  <Fig w={400} h={260} label="积分运算电路" caption={p.caption}>
    <OpAmp x={OX} y={OY} />
    <Terminal x={40} y={NY} />
    <Lbl x={30} y={NY - 12} t="u_I" size={13} />
    <Res a={[44, NY]} b={[OX, NY]} />
    <Lbl x={110} y={NY - 14} t="R" value={v(p, "R")} size={13} />
    {feedback(180, 60, "C", "C", v(p, "C"))}
    {v(p, "Rf") && (
      <g>
        <Wire pts={[[180, 60], [180, 28]]} />
        <Res a={[180, 28]} b={[OUTX + 20, 28]} />
        <Wire pts={[[OUTX + 20, 28], [OUTX + 20, 60]]} />
        <Lbl x={(180 + OUTX + 20) / 2} y={18} t="R_f" value={v(p, "Rf")} size={12} anchor="middle" />
      </g>
    )}
    {plusToGround("R'")}
    {output()}
  </Fig>
);

export const Differentiator: DiagramComponent = (p) => (
  <Fig w={400} h={260} label="微分运算电路" caption={p.caption}>
    <OpAmp x={OX} y={OY} />
    <Terminal x={40} y={NY} />
    <Lbl x={30} y={NY - 12} t="u_I" size={13} />
    {v(p, "R1") ? (
      <g>
        <Res a={[44, NY]} b={[110, NY]} len={26} />
        <Lbl x={77} y={NY - 14} t="R_1" value={v(p, "R1")} size={12} anchor="middle" />
        <Cap a={[110, NY]} b={[OX, NY]} />
      </g>
    ) : (
      <Cap a={[44, NY]} b={[OX, NY]} />
    )}
    <Lbl x={130} y={NY - 18} t="C" value={v(p, "C")} size={13} />
    {feedback(180, 50, "R", "R", v(p, "R"))}
    {plusToGround("R'")}
    {output()}
  </Fig>
);

/** 滞回比较器（反相输入），输出端经 R_O 与双向稳压管限幅 */
export const Schmitt: DiagramComponent = (p) => (
  <Fig w={440} h={270} label="反相输入滞回比较器" caption={p.caption}>
    <OpAmp x={OX} y={OY} />
    <Terminal x={40} y={NY} />
    <Lbl x={30} y={NY - 12} t="u_I" size={13} />
    <Res a={[44, NY]} b={[OX, NY]} />
    <Lbl x={110} y={NY - 14} t="R" size={12} />
    {/* 同相端：R1 接地（或 U_REF），R2 接输出 */}
    <Wire pts={[pins.bot, [140, PY]]} />
    <Dot x={175} y={PY} />
    <Res a={[140, PY]} b={[140, 240]} len={30} />
    <Ground x={140} y={240} />
    <Lbl x={128} y={214} t="R_1" value={v(p, "R1")} size={12} anchor="end" />
    <Wire pts={[[175, PY], [175, 200], [300, 200]]} />
    <Res a={[300, 200]} b={[360, 200]} len={30} />
    <Lbl x={330} y={226} t="R_2" value={v(p, "R2")} size={12} anchor="middle" />
    <Res a={[OUTX, OY]} b={[340, OY]} len={26} />
    <Lbl x={310} y={OY - 14} t="R_O" size={11} anchor="middle" />
    <Dot x={360} y={OY} />
    <Wire pts={[[340, OY], [400, OY]]} />
    <Wire pts={[[360, OY], [360, 200]]} />
    <Dot x={360} y={200} />
    <Diode a={[380, OY + 10]} k={[380, OY + 40]} zener />
    <Diode a={[380, OY + 70]} k={[380, OY + 40]} zener />
    <Wire pts={[[380, OY], [380, OY + 10]]} />
    <Wire pts={[[380, OY + 70], [380, 240]]} />
    <Ground x={380} y={240} />
    <Dot x={380} y={OY} />
    <Lbl x={392} y={OY + 46} t="±U_Z" size={11} />
    <Terminal x={404} y={OY} />
    <Lbl x={394} y={OY - 12} t="u_O" size={13} />
  </Fig>
);

export const CH7_DIAGRAMS = {
  "inv-amp": InvAmp,
  "noninv-amp": NonInvAmp,
  follower: Follower,
  summer: Summer,
  subtractor: Subtractor,
  integrator: Integrator,
  differentiator: Differentiator,
  schmitt: Schmitt,
};
