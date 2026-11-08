/** 第 1 章电路图：二极管串联、门电路、稳压管、整流、限幅、钳位 */
import { Ground, Terminal, Wire, Dot, CurrentArrow } from "../symbols";
import { ACSourceV, Cap, DCSource, Diode, Fig, Lbl, Rail, Res, Transformer } from "../parts";
import type { DiagramComponent, DiagramProps } from "./types";

const v = (p: DiagramProps, k: string) => p.labels?.[k];

/** 电压源—电阻—二极管串联 */
export const DiodeSeries: DiagramComponent = (p) => (
  <Fig w={320} h={200} label="二极管串联电路" caption={p.caption}>
    <DCSource x={50} y1={50} y2={160} />
    <Lbl x={70} y={100} t="V" value={v(p, "V")} />
    <Wire pts={[[50, 50], [90, 50]]} />
    <Res a={[90, 50]} b={[190, 50]} />
    <Lbl x={125} y={34} t="R" />
    {v(p, "R") && <Lbl x={125} y={80} t="" value={v(p, "R")} />}
    <Wire pts={[[190, 50], [250, 50]]} />
    <Diode a={[250, 50]} k={[250, 160]} />
    <Lbl x={268} y={100} t="VD" value={v(p, "D")} />
    <CurrentArrow x={220} y={50} dir="right" />
    <Lbl x={212} y={40} t="I_D" size={12} />
    <Wire pts={[[250, 160], [50, 160]]} />
    <Ground x={150} y={160} />
  </Fig>
);

/** 二极管与门：阴极接输入，阳极经 R 接 +V */
export const DiodeGateAnd: DiagramComponent = (p) => (
  <Fig w={340} h={220} label="二极管门电路（阴极接输入）" caption={p.caption}>
    <Rail x={210} y={28} main="V" sub={v(p, "Vsub") ?? "CC"} />
    <Res a={[210, 32]} b={[210, 100]} />
    <Lbl x={222} y={70} t="R" value={v(p, "R")} />
    <Wire pts={[[210, 100], [210, 170]]} />
    <Dot x={210} y={100} />
    <Diode a={[210, 100]} k={[80, 100]} />
    <Diode a={[210, 170]} k={[80, 170]} />
    <Lbl x={135} y={88} t="VD_1" size={12} />
    <Lbl x={135} y={158} t="VD_2" size={12} />
    <Terminal x={76} y={100} />
    <Terminal x={76} y={170} />
    <Lbl x={30} y={104} t="U_A" value={v(p, "A")} size={13} />
    <Lbl x={30} y={174} t="U_B" value={v(p, "B")} size={13} />
    <Wire pts={[[210, 100], [290, 100]]} />
    <Terminal x={294} y={100} />
    <Lbl x={282} y={88} t="U_O" size={13} />
  </Fig>
);

/** 二极管或门：阳极接输入，阴极经 R 接地 */
export const DiodeGateOr: DiagramComponent = (p) => (
  <Fig w={340} h={230} label="二极管门电路（阳极接输入）" caption={p.caption}>
    <Terminal x={76} y={60} />
    <Terminal x={76} y={130} />
    <Lbl x={30} y={64} t="U_A" value={v(p, "A")} size={13} />
    <Lbl x={30} y={134} t="U_B" value={v(p, "B")} size={13} />
    <Diode a={[80, 60]} k={[210, 60]} />
    <Diode a={[80, 130]} k={[210, 130]} />
    <Lbl x={135} y={48} t="VD_1" size={12} />
    <Lbl x={135} y={118} t="VD_2" size={12} />
    <Wire pts={[[210, 60], [210, 130]]} />
    <Dot x={210} y={60} />
    <Dot x={210} y={130} />
    <Res a={[210, 130]} b={[210, 195]} />
    <Lbl x={222} y={168} t="R" value={v(p, "R")} />
    <Ground x={210} y={195} />
    <Wire pts={[[210, 60], [290, 60]]} />
    <Terminal x={294} y={60} />
    <Lbl x={282} y={48} t="U_O" size={13} />
  </Fig>
);

/** 稳压管稳压电路 */
export const ZenerReg: DiagramComponent = (p) => (
  <Fig w={380} h={210} label="稳压管稳压电路" caption={p.caption}>
    <DCSource x={40} y1={50} y2={170} />
    <Lbl x={58} y={115} t="U_I" value={v(p, "UI")} size={13} />
    <Res a={[40, 50]} b={[160, 50]} />
    <Lbl x={92} y={35} t="R" />
    {v(p, "R") && <Lbl x={92} y={78} t="" value={v(p, "R")} />}
    <CurrentArrow x={150} y={50} dir="right" />
    <Lbl x={140} y={40} t="I_R" size={11} />
    <Wire pts={[[160, 50], [320, 50]]} />
    <Dot x={200} y={50} />
    <Dot x={270} y={50} />
    <Diode a={[200, 170]} k={[200, 50]} zener />
    <Lbl x={214} y={110} t="VD_Z" value={v(p, "Z")} size={12} />
    <Res a={[270, 50]} b={[270, 170]} />
    <Lbl x={282} y={115} t="R_L" value={v(p, "RL")} size={13} />
    <Wire pts={[[40, 170], [320, 170]]} />
    <Terminal x={324} y={50} />
    <Terminal x={324} y={170} />
    <Lbl x={334} y={115} t="U_O" size={13} />
    <Ground x={130} y={170} />
  </Fig>
);

/** 单相半波整流 */
export const HalfWave: DiagramComponent = (p) => (
  <Fig w={380} h={200} label="单相半波整流电路" caption={p.caption}>
    <ACSourceV x={40} y1={50} y2={160} />
    <Lbl x={6} y={115} t="u_1" size={12} />
    <Wire pts={[[40, 50], [90, 50], [90, 60]]} />
    <Wire pts={[[40, 160], [90, 160], [90, 150]]} />
    <Transformer x={100} y1={60} y2={150} />
    <Wire pts={[[110, 60], [110, 50], [140, 50]]} />
    <Wire pts={[[110, 150], [110, 160], [290, 160]]} />
    <Lbl x={120} y={110} t="u_2" value={v(p, "U2")} size={13} />
    <Diode a={[140, 50]} k={[240, 50]} />
    <Lbl x={180} y={36} t="VD" size={12} />
    <Wire pts={[[240, 50], [290, 50]]} />
    <Res a={[290, 50]} b={[290, 160]} />
    <Lbl x={302} y={110} t="R_L" value={v(p, "RL")} size={13} />
    <Lbl x={340} y={80} t="u_O" size={13} />
    <text x={334} y={60} fontSize={12} fill="var(--ink-2)">+</text>
    <text x={334} y={158} fontSize={12} fill="var(--ink-2)">−</text>
  </Fig>
);

/** 单相桥式整流 */
export const Bridge: DiagramComponent = (p) => {
  const cx = 200;
  const cy = 120;
  const d = 55;
  const T: [number, number] = [cx, cy - d];
  const B: [number, number] = [cx, cy + d];
  const L: [number, number] = [cx - d, cy];
  const R: [number, number] = [cx + d, cy];
  return (
    <Fig w={420} h={240} label="单相桥式整流电路" caption={p.caption}>
      <ACSourceV x={34} y1={70} y2={170} />
      <Wire pts={[[34, 70], [70, 70], [70, 75]]} />
      <Wire pts={[[34, 170], [70, 170], [70, 165]]} />
      <Transformer x={80} y1={75} y2={165} />
      <Lbl x={117} y={160} t="u_2" value={v(p, "U2")} size={13} />
      <Wire pts={[[90, 75], [90, 30], [L[0] - 30, 30], [L[0] - 30, cy], L]} />
      <Wire pts={[[90, 165], [90, 215], [R[0] + 20, 215], [R[0] + 20, cy], R]} />
      <Diode a={L} k={T} />
      <Diode a={R} k={T} />
      <Diode a={B} k={L} />
      <Diode a={B} k={R} />
      <Lbl x={cx - 40} y={cy - 40} t="VD_1" size={11} anchor="end" />
      <Lbl x={cx + 40} y={cy - 40} t="VD_2" size={11} />
      <Lbl x={cx - 40} y={cy + 50} t="VD_4" size={11} anchor="end" />
      <Lbl x={cx + 40} y={cy + 50} t="VD_3" size={11} />
      <Dot x={T[0]} y={T[1]} />
      <Dot x={B[0]} y={B[1]} />
      <Wire pts={[T, [T[0], 40], [340, 40], [340, 80]]} />
      <Res a={[340, 80]} b={[340, 170]} />
      <Wire pts={[[340, 170], [340, 200], [B[0], 200], B]} />
      <Lbl x={352} y={130} t="R_L" value={v(p, "RL")} size={13} />
      <Lbl x={380} y={95} t="u_O" size={13} />
      <text x={366} y={70} fontSize={12} fill="var(--ink-2)">+</text>
      <text x={366} y={192} fontSize={12} fill="var(--ink-2)">−</text>
    </Fig>
  );
};

/** 并联单向限幅 */
export const ClipShunt: DiagramComponent = (p) => (
  <Fig w={360} h={210} label="二极管限幅电路" caption={p.caption}>
    <Terminal x={30} y={50} />
    <Terminal x={30} y={180} />
    <Lbl x={8} y={120} t="u_I" size={13} />
    <Res a={[30, 50]} b={[150, 50]} />
    <Lbl x={82} y={36} t="R" value={v(p, "R")} size={13} />
    <Wire pts={[[150, 50], [300, 50]]} />
    <Dot x={190} y={50} />
    <Diode a={[190, 50]} k={[190, 105]} />
    <Lbl x={204} y={84} t="VD" size={12} />
    <DCSource x={190} y1={105} y2={180} r={13} />
    <Lbl x={210} y={148} t="E" value={v(p, "E")} size={13} />
    <Wire pts={[[30, 180], [300, 180]]} />
    <Terminal x={304} y={50} />
    <Terminal x={304} y={180} />
    <Lbl x={316} y={120} t="u_O" size={13} />
  </Fig>
);

/** 双向限幅 */
export const ClipDouble: DiagramComponent = (p) => (
  <Fig w={400} h={220} label="双向限幅电路" caption={p.caption}>
    <Terminal x={30} y={50} />
    <Terminal x={30} y={185} />
    <Lbl x={8} y={124} t="u_I" size={13} />
    <Res a={[30, 50]} b={[140, 50]} />
    <Lbl x={76} y={36} t="R" value={v(p, "R")} size={13} />
    <Wire pts={[[140, 50], [340, 50]]} />
    <Dot x={180} y={50} />
    <Dot x={260} y={50} />
    <Diode a={[180, 50]} k={[180, 105]} />
    <Lbl x={150} y={84} t="VD_1" size={11} anchor="end" />
    <DCSource x={180} y1={105} y2={185} r={13} />
    <Lbl x={150} y={150} t="E_1" value={v(p, "E1")} size={13} anchor="end" />
    <Diode a={[260, 105]} k={[260, 50]} />
    <Lbl x={274} y={84} t="VD_2" size={11} />
    <DCSource x={260} y1={105} y2={185} r={13} neg />
    <Lbl x={280} y={150} t="E_2" value={v(p, "E2")} size={13} />
    <Wire pts={[[30, 185], [340, 185]]} />
    <Terminal x={344} y={50} />
    <Terminal x={344} y={185} />
    <Lbl x={354} y={124} t="u_O" size={13} />
  </Fig>
);

/** 钳位电路（正峰钳位） */
export const Clamp: DiagramComponent = (p) => (
  <Fig w={360} h={200} label="二极管钳位电路" caption={p.caption}>
    <Terminal x={30} y={50} />
    <Terminal x={30} y={170} />
    <Lbl x={8} y={115} t="u_I" size={13} />
    <Cap a={[30, 50]} b={[130, 50]} />
    <Lbl x={72} y={30} t="C" value={v(p, "C")} size={13} />
    <Wire pts={[[130, 50], [300, 50]]} />
    <Dot x={170} y={50} />
    <Dot x={240} y={50} />
    <Diode a={[170, 50]} k={[170, 170]} />
    <Lbl x={184} y={115} t="VD" size={12} />
    <Res a={[240, 50]} b={[240, 170]} />
    <Lbl x={252} y={115} t="R" value={v(p, "R")} size={13} />
    <Wire pts={[[30, 170], [300, 170]]} />
    <Terminal x={304} y={50} />
    <Terminal x={304} y={170} />
    <Lbl x={314} y={115} t="u_O" size={13} />
  </Fig>
);

export const CH1_DIAGRAMS = {
  "diode-series": DiodeSeries,
  "diode-gate": DiodeGateAnd,
  "diode-two": DiodeGateOr,
  "zener-reg": ZenerReg,
  "half-wave": HalfWave,
  bridge: Bridge,
  "clip-shunt": ClipShunt,
  "clip-double": ClipDouble,
  clamp: Clamp,
};

