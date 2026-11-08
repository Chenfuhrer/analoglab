/** 第 9 章电路图：RC 低通/高通、混合 π 模型、米勒等效 */
import { Terminal, Wire, Dot, CurrentSourceV } from "../symbols";
import { Cap, Fig, Lbl, Res } from "../parts";
import type { DiagramComponent, DiagramProps } from "./types";

const v = (p: DiagramProps, k: string) => p.labels?.[k];

export const RCLowPass: DiagramComponent = (p) => (
  <Fig w={340} h={180} label="RC 低通电路" caption={p.caption}>
    <Terminal x={40} y={50} />
    <Terminal x={40} y={150} />
    <Lbl x={20} y={104} t="U_i" size={13} />
    <Res a={[44, 50]} b={[200, 50]} />
    <Lbl x={122} y={36} t="R" value={v(p, "R")} size={13} anchor="middle" />
    <Wire pts={[[200, 50], [290, 50]]} />
    <Dot x={220} y={50} />
    <Cap a={[220, 50]} b={[220, 150]} />
    <Lbl x={234} y={104} t="C" value={v(p, "C")} size={13} />
    <Wire pts={[[44, 150], [290, 150]]} />
    <Terminal x={294} y={50} />
    <Terminal x={294} y={150} />
    <Lbl x={306} y={104} t="U_o" size={13} />
  </Fig>
);

export const RCHighPass: DiagramComponent = (p) => (
  <Fig w={340} h={180} label="RC 高通电路" caption={p.caption}>
    <Terminal x={40} y={50} />
    <Terminal x={40} y={150} />
    <Lbl x={20} y={104} t="U_i" size={13} />
    <Cap a={[44, 50]} b={[200, 50]} />
    <Lbl x={122} y={30} t="C" value={v(p, "C")} size={13} anchor="middle" />
    <Wire pts={[[200, 50], [290, 50]]} />
    <Dot x={220} y={50} />
    <Res a={[220, 50]} b={[220, 150]} />
    <Lbl x={234} y={104} t="R" value={v(p, "R")} size={13} />
    <Wire pts={[[44, 150], [290, 150]]} />
    <Terminal x={294} y={50} />
    <Terminal x={294} y={150} />
    <Lbl x={306} y={104} t="U_o" size={13} />
  </Fig>
);

/** 混合 π 等效电路（简化：忽略 r_b'c、r_ce）；labels.miller = "yes" 时画米勒等效 */
export const HybridPiModel: DiagramComponent = (p) => {
  const miller = v(p, "miller") === "yes";
  const T = 50;
  const G = 190;
  return (
    <Fig w={560} h={225} label={miller ? "米勒等效后的混合 π 电路" : "混合 π 等效电路"} caption={p.caption}>
      <Terminal x={30} y={T} />
      <Lbl x={20} y={T - 10} t="b" size={13} />
      <Res a={[34, T]} b={[150, T]} len={34} />
      <Lbl x={92} y={T - 14} t="r_bb'" size={12} anchor="middle" />
      <Dot x={150} y={T} />
      <Lbl x={150} y={T - 12} t="b'" size={12} anchor="middle" />
      <Res a={[150, T]} b={[150, G]} len={34} />
      <Lbl x={138} y={128} t="r_b'e" size={12} anchor="end" />
      <Wire pts={[[150, T], [220, T]]} />
      <Dot x={220} y={T} />
      <Cap a={[220, T]} b={[220, G]} />
      <Lbl x={232} y={128} t={miller ? "C_π'" : "C_π"} size={12} />
      {!miller && (
        <g>
          <Wire pts={[[220, T], [250, T]]} />
          <Cap a={[250, T]} b={[360, T]} />
          <Lbl x={305} y={T - 18} t="C_μ" size={12} anchor="middle" />
        </g>
      )}
      <Wire pts={[[miller ? 380 : 360, T], [460, T]]} />
      <Dot x={400} y={T} />
      <CurrentSourceV x={400} y1={T} y2={G} dir="down" />
      <Lbl x={414} y={128} t="g_mU_b'e" size={12} />
      {miller && (
        <g>
          <Dot x={460} y={T} />
          <Cap a={[460, T]} b={[460, G]} />
          <Lbl x={472} y={128} t="C_μ''" size={12} />
        </g>
      )}
      <Wire pts={[[460, T], [520, T]]} />
      <Terminal x={524} y={T} />
      <Lbl x={514} y={T - 10} t="c" size={13} />
      <Wire pts={[[30, G], [524, G]]} />
      <Terminal x={30} y={G} />
      <Terminal x={524} y={G} />
      <Lbl x={276} y={G + 20} t="e" size={13} anchor="middle" />
    </Fig>
  );
};

export const CH9_DIAGRAMS = {
  "rc-lowpass": RCLowPass,
  "rc-highpass": RCHighPass,
  "hybrid-pi": HybridPiModel,
};
