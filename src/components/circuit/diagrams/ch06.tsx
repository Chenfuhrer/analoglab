/** 第 6 章电路图：长尾式差分放大电路、恒流源差分电路、镜像电流源、微电流源 */
import { Terminal, Wire, Dot, Ground, CurrentSourceV } from "../symbols";
import { BJT, Fig, Lbl, Rail, Res } from "../parts";
import type { DiagramComponent, DiagramProps } from "./types";

const v = (p: DiagramProps, k: string) => p.labels?.[k];

/** 差分对（共用部分） */
function Pair({ tail }: { tail: "resistor" | "source" }) {
  // 左管基极 (150,150)，c (200,100)，e (200,200)；右管镜像：基极 (370,150)，c (320,100)，e (320,200)
  return (
    <g>
      <BJT bx={150} by={150} />
      <BJT bx={370} by={150} mirror />
      <Res a={[200, 100]} b={[200, 34]} len={32} />
      <Res a={[320, 100]} b={[320, 34]} len={32} />
      <Wire pts={[[200, 34], [320, 34]]} />
      <Rail x={260} y={30} />
      <Dot x={260} y={34} />
      <Wire pts={[[200, 200], [200, 215], [320, 215], [320, 200]]} />
      <Dot x={260} y={215} />
      {tail === "resistor" ? <Res a={[260, 215]} b={[260, 285]} len={32} /> : <CurrentSourceV x={260} y1={215} y2={285} dir="down" />}
      <circle cx={260} cy={289} r={3.4} fill="var(--bg-elev)" stroke="var(--ink)" strokeWidth={1.6} />
      <text x={268} y={304} fontSize={13} fill="var(--ink)" style={{ fontFamily: "var(--font-serif), serif" }}>
        −<tspan fontStyle="italic">V</tspan>
        <tspan fontSize={9.5} dy={3.5}>
          EE
        </tspan>
      </text>
      {/* 基极电阻与输入 */}
      <Res a={[150, 150]} b={[70, 150]} len={28} />
      <Res a={[370, 150]} b={[450, 150]} len={28} />
      <Terminal x={66} y={150} />
      <Terminal x={454} y={150} />
      <Lbl x={56} y={138} t="u_I1" size={13} anchor="end" />
      <Lbl x={464} y={138} t="u_I2" size={13} />
      <Lbl x={110} y={138} t="R_b" size={12} anchor="middle" />
      <Lbl x={410} y={138} t="R_b" size={12} anchor="middle" />
      {/* 输出端 */}
      <Dot x={200} y={100} />
      <Dot x={320} y={100} />
      <Wire pts={[[200, 100], [225, 100]]} />
      <Wire pts={[[320, 100], [295, 100]]} />
      <Terminal x={229} y={100} />
      <Terminal x={291} y={100} />
      <Lbl x={260} y={92} t="u_O" size={13} anchor="middle" />
      <text x={238} y={118} fontSize={12} fill="var(--ink-2)">
        +
      </text>
      <text x={276} y={118} fontSize={12} fill="var(--ink-2)">
        −
      </text>
      <Lbl x={174} y={66} t="R_c" size={12} anchor="end" />
      <Lbl x={346} y={66} t="R_c" size={12} />
      <Lbl x={140} y={190} t="VT_1" size={11} anchor="end" />
      <Lbl x={380} y={190} t="VT_2" size={11} />
    </g>
  );
}

export const DiffLongTail: DiagramComponent = (p) => (
  <Fig w={520} h={315} label="长尾式差分放大电路" caption={p.caption}>
    <Pair tail="resistor" />
    <Lbl x={272} y={254} t="R_e" value={v(p, "Re")} size={13} />
  </Fig>
);

export const DiffCurrentSource: DiagramComponent = (p) => (
  <Fig w={520} h={315} label="恒流源式差分放大电路" caption={p.caption}>
    <Pair tail="source" />
    <Lbl x={278} y={254} t="I_0" value={v(p, "I0")} size={13} />
  </Fig>
);

/** 镜像电流源；labels.re = "yes" 时为比例/微电流源（VT2 射极接 R_e2） */
export const Mirror: DiagramComponent = (p) => {
  const widlar = v(p, "type") === "widlar";
  const G = 240;
  return (
    <Fig w={420} h={265} label={widlar ? "微电流源" : "镜像电流源"} caption={p.caption}>
      <Rail x={130} y={30} />
      <Res a={[130, 34]} b={[130, 100]} len={34} />
      <Lbl x={142} y={70} t="R" value={v(p, "R")} size={13} />
      <Dot x={130} y={100} />
      {/* VT1：镜像放置（基极在右） */}
      <BJT bx={180} by={150} mirror />
      <Wire pts={[[130, 100], [130, 112]]} />
      <BJT bx={240} by={150} />
      <Wire pts={[[180, 150], [240, 150]]} />
      <Dot x={210} y={150} />
      <Wire pts={[[210, 150], [210, 110], [130, 110]]} />
      <Dot x={130} y={110} />
      <Wire pts={[[130, 200], [130, G]]} />
      {widlar ? (
        <>
          <Res a={[290, 200]} b={[290, G]} len={24} />
          <Lbl x={302} y={226} t="R_e2" value={v(p, "Re2")} size={12} />
        </>
      ) : (
        <Wire pts={[[290, 200], [290, G]]} />
      )}
      <Wire pts={[[130, G], [290, G]]} />
      <Ground x={210} y={G} />
      <Wire pts={[[290, 100], [290, 60]]} />
      <Terminal x={290} y={56} />
      <Lbl x={302} y={66} t="I_C2" size={13} />
      <text x={300} y={46} fontSize={11} fill="var(--ink-3)">
        接负载（另一端接电源）
      </text>
      <Lbl x={110} y={90} t="I_R" size={12} anchor="end" />
      <Lbl x={92} y={182} t="VT_1" size={11} anchor="end" />
      <Lbl x={300} y={182} t="VT_2" size={11} />
    </Fig>
  );
};

export const CH6_DIAGRAMS = {
  "diff-longtail": DiffLongTail,
  "diff-source": DiffCurrentSource,
  mirror: Mirror,
};
