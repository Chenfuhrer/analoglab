import type { Formula } from "../library";

const r = String.raw;

export const CH4_FORMULAS: Formula[] = [
  {
    id: "mos-enh",
    chapter: 4,
    title: "增强型 MOS 管恒流区电流",
    tex: r`i_D=I_{DO}\left(\frac{u_{GS}}{U_{GS(th)}}-1\right)^2`,
    vars: [
      { sym: "U_{GS(th)}", name: "开启电压", unit: "V" },
      { sym: "I_{DO}", name: "u_GS = 2U_GS(th) 时的 i_D", unit: "A" },
    ],
    conditions: ["恒流区：u_GS > U_GS(th) 且 u_DS ≥ u_GS − U_GS(th)", "忽略沟道长度调制"],
    ref: "mos-curves#mv-transfer",
  },
  {
    id: "mos-dep",
    chapter: 4,
    title: "耗尽型 MOS / 结型 FET 恒流区电流",
    tex: r`i_D=I_{DSS}\left(1-\frac{u_{GS}}{U_{GS(off)}}\right)^2`,
    vars: [
      { sym: "U_{GS(off)}", name: "夹断电压", unit: "V" },
      { sym: "I_{DSS}", name: "u_GS = 0 时的漏极饱和电流", unit: "A" },
    ],
    conditions: ["恒流区", "结型管 u_GS ≤ 0"],
    ref: "mos-curves#mv-transfer",
  },
  {
    id: "fet-gm",
    chapter: 4,
    title: "场效应管跨导",
    tex: r`g_m=\frac{2}{U_{GS(th)}}\sqrt{I_{DO}I_{DQ}}\quad\text{或}\quad g_m=\frac{2}{|U_{GS(off)}|}\sqrt{I_{DSS}I_{DQ}}`,
    vars: [{ sym: "I_{DQ}", name: "静态漏极电流", unit: "A" }],
    conditions: ["恒流区、小信号"],
    ref: "fet-small-signal#fs-gm",
  },
  {
    id: "cs-au",
    chapter: 4,
    title: "共源放大电路",
    tex: r`\dot A_u=-g_mR_D',\quad R_i=R_{g3}+R_{g1}\para R_{g2},\quad R_o\approx R_d`,
    vars: [{ sym: "R_D'", name: "R_d∥R_L（∥r_ds）", unit: "Ω" }],
    conditions: ["源极电阻被旁路；R_s 不旁路时分母为 1+g_m R_s"],
    ref: "cs-amplifier#csa-dynamic",
  },
  {
    id: "cd-au",
    chapter: 4,
    title: "共漏放大电路（源极跟随器）",
    tex: r`\dot A_u=\frac{g_mR_S'}{1+g_mR_S'},\qquad R_o=R_s\para\frac1{g_m}`,
    vars: [{ sym: "R_S'", name: "R_s∥R_L", unit: "Ω" }],
    conditions: ["恒流区、小信号"],
    ref: "cd-cg-amplifier#cd",
  },
];
