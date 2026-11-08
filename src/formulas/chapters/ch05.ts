import type { Formula } from "../library";

const r = String.raw;

export const CH5_FORMULAS: Formula[] = [
  {
    id: "coupling-fl",
    chapter: 5,
    title: "耦合电容决定的下限频率",
    tex: r`f_L=\frac{1}{2\pi C(R_{o1}+R_{i2})}`,
    vars: [
      { sym: "C", name: "级间耦合电容", unit: "F" },
      { sym: "R_{o1}", name: "前级输出电阻", unit: "Ω" },
      { sym: "R_{i2}", name: "后级输入电阻", unit: "Ω" },
    ],
    conditions: ["只考虑该电容（其余电容视为短路）"],
    ref: "multistage-coupling#mcp-rc",
  },
  {
    id: "multistage-gain",
    chapter: 5,
    title: "多级放大电路",
    tex: r`\dot A_u=\prod_k\dot A_{uk},\qquad R_i=R_{i1},\qquad R_o=R_{on}`,
    vars: [{ sym: "\\dot A_{uk}", name: "第 k 级带载（以后级 R_i 为负载）电压放大倍数", unit: "—" }],
    conditions: ["共集级的 R_i 与其负载有关、R_o 与其信号源内阻有关"],
    ref: "multistage-analysis#ma-gain",
  },
  {
    id: "drift-input",
    chapter: 5,
    title: "零点漂移折合到输入端",
    tex: r`\Delta u_I=\Delta u_1+\frac{\Delta u_2}{A_1}+\frac{\Delta u_3}{A_1A_2}+\cdots`,
    vars: [{ sym: "\\Delta u_k", name: "第 k 级折合到其输入端的漂移", unit: "V" }],
    conditions: ["直接耦合多级放大电路"],
    ref: "zero-drift#zd-cause",
  },
];
