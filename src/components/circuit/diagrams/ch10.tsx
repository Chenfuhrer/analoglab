/** 第 10 章电路图：OCL 乙类、OCL 甲乙类（二极管偏置）、OTL */
import { Terminal, Wire, Dot, Ground } from "../symbols";
import { BJT, Cap, Diode, Fig, Lbl, Rail, Res } from "../parts";
import type { DiagramComponent, DiagramProps } from "./types";

const v = (p: DiagramProps, k: string) => p.labels?.[k];

function NegRail({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={3.4} fill="var(--bg-elev)" stroke="var(--ink)" strokeWidth={1.6} />
      <text x={x + 7} y={y + 16} fontSize={13} fill="var(--ink)" style={{ fontFamily: "var(--font-serif), serif" }}>
        −<tspan fontStyle="italic">V</tspan>
        <tspan fontSize={9.5} dy={3.5}>
          CC
        </tspan>
      </text>
    </g>
  );
}

/** 乙类 OCL：两管基极连在一起接输入 */
export const OCL: DiagramComponent = (p) => (
  <Fig w={420} h={270} label="乙类 OCL 互补对称电路" caption={p.caption}>
    <BJT bx={190} by={90} type="npn" />
    <BJT bx={190} by={180} type="pnp" flip />
    <Wire pts={[[240, 40], [240, 30]]} />
    <Rail x={240} y={26} />
    <Wire pts={[[240, 230], [240, 244]]} />
    <NegRail x={240} y={248} />
    <Wire pts={[[240, 140], [240, 130]]} />
    <Wire pts={[[240, 140], [240, 130]]} />
    <Dot x={240} y={135} />
    <Wire pts={[[240, 130], [240, 140]]} />
    <Wire pts={[[190, 90], [160, 90], [160, 180], [190, 180]]} />
    <Dot x={160} y={135} />
    <Wire pts={[[60, 135], [160, 135]]} />
    <Terminal x={56} y={135} />
    <Lbl x={46} y={123} t="u_i" size={13} />
    <Wire pts={[[240, 135], [330, 135]]} />
    <Dot x={330} y={135} />
    <Res a={[330, 135]} b={[330, 230]} len={34} />
    <Ground x={330} y={230} />
    <Lbl x={342} y={186} t="R_L" value={v(p, "RL")} size={13} />
    <Lbl x={340} y={125} t="u_o" size={13} />
    <Lbl x={250} y={70} t="VT_1" size={11} />
    <Lbl x={250} y={210} t="VT_2" size={11} />
    <Ground x={56} y={160} />
    <Wire pts={[[56, 139], [56, 160]]} />
  </Fig>
);

/** 甲乙类 OCL：两只二极管 + 电阻提供偏置 */
export const OCLAB: DiagramComponent = (p) => (
  <Fig w={440} h={300} label="甲乙类 OCL（二极管偏置）" caption={p.caption}>
    <Rail x={160} y={26} />
    <Res a={[160, 30]} b={[160, 85]} len={28} />
    <Lbl x={148} y={62} t="R_1" size={12} anchor="end" />
    <Dot x={160} y={85} />
    <Diode a={[160, 85]} k={[160, 125]} />
    <Diode a={[160, 125]} k={[160, 165]} />
    <Lbl x={148} y={128} t="VD_1,2" size={11} anchor="end" />
    <Dot x={160} y={165} />
    <Res a={[160, 165]} b={[160, 260]} len={28} />
    <NegRail x={160} y={264} />
    <Lbl x={148} y={220} t="R_2" size={12} anchor="end" />
    <Wire pts={[[160, 85], [210, 85]]} />
    <Wire pts={[[160, 165], [210, 165]]} />
    <BJT bx={210} by={85} type="npn" />
    <BJT bx={210} by={165} type="pnp" flip />
    <Wire pts={[[260, 35], [260, 30]]} />
    <Rail x={260} y={26} />
    <Wire pts={[[260, 215], [260, 260]]} />
    <NegRail x={260} y={264} />
    <Wire pts={[[260, 135], [260, 115]]} />
    <Dot x={260} y={125} />
    <Wire pts={[[260, 125], [350, 125]]} />
    <Dot x={350} y={125} />
    <Res a={[350, 125]} b={[350, 220]} len={34} />
    <Ground x={350} y={220} />
    <Lbl x={362} y={176} t="R_L" value={v(p, "RL")} size={13} />
    <Lbl x={360} y={115} t="u_o" size={13} />
    <Wire pts={[[160, 125], [100, 125], [100, 165]]} />
    <text x={70} y={182} fontSize={11} fill="var(--ink-3)">
      接前级（输入）
    </text>
  </Fig>
);

/** OTL：单电源，输出经大电容接负载 */
export const OTL: DiagramComponent = (p) => (
  <Fig w={440} h={270} label="OTL 互补对称电路" caption={p.caption}>
    <BJT bx={190} by={90} type="npn" />
    <BJT bx={190} by={180} type="pnp" flip />
    <Wire pts={[[240, 40], [240, 30]]} />
    <Rail x={240} y={26} />
    <Wire pts={[[240, 230], [240, 244]]} />
    <Ground x={240} y={244} />
    <Wire pts={[[240, 130], [240, 140]]} />
    <Dot x={240} y={135} />
    <Lbl x={250} y={152} t="A" size={12} />
    <Wire pts={[[190, 90], [160, 90], [160, 180], [190, 180]]} />
    <Dot x={160} y={135} />
    <Wire pts={[[60, 135], [160, 135]]} />
    <Terminal x={56} y={135} />
    <Lbl x={46} y={123} t="u_i" size={13} />
    <Cap a={[240, 135]} b={[330, 135]} polarized />
    <Lbl x={285} y={115} t="C" value={v(p, "C")} size={13} anchor="middle" />
    <Wire pts={[[330, 135], [360, 135]]} />
    <Res a={[360, 135]} b={[360, 244]} len={34} />
    <Ground x={360} y={244} />
    <Lbl x={372} y={192} t="R_L" value={v(p, "RL")} size={13} />
    <text x={250} y={175} fontSize={10.5} fill="var(--ink-3)">
      静态 U_A = V_CC/2
    </text>
  </Fig>
);

export const CH10_DIAGRAMS = {
  ocl: OCL,
  "ocl-ab": OCLAB,
  otl: OTL,
};
