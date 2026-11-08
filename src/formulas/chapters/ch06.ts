import type { Formula } from "../library";

const r = String.raw;

export const CH6_FORMULAS: Formula[] = [
  {
    id: "diff-decomp",
    chapter: 6,
    title: "差模与共模分量",
    tex: r`u_{Id}=u_{I1}-u_{I2},\qquad u_{Ic}=\frac{u_{I1}+u_{I2}}{2}`,
    vars: [
      { sym: "u_{Id}", name: "差模输入电压", unit: "V" },
      { sym: "u_{Ic}", name: "共模输入电压", unit: "V" },
    ],
    conditions: ["恒等式；线性电路中 u_O = A_d u_Id + A_c u_Ic"],
    ref: "diff-signals#ds-decomp",
  },
  {
    id: "mirror-ic",
    chapter: 6,
    title: "镜像电流源",
    tex: r`I_{C2}=\frac{\beta}{\beta+2}I_R\approx I_R=\frac{V_{CC}-U_{BE}}{R}`,
    vars: [{ sym: "I_R", name: "参考电流", unit: "A" }],
    conditions: ["两管特性对称"],
    ref: "current-source#isrc-mirror",
  },
  {
    id: "widlar",
    chapter: 6,
    title: "微电流源",
    tex: r`I_{C2}R_{e2}=U_T\ln\frac{I_R}{I_{C2}}`,
    vars: [{ sym: "R_{e2}", name: "输出管射极电阻", unit: "Ω" }],
    conditions: ["忽略基极电流；超越方程需试算求解"],
    ref: "current-source#isrc-ratio",
  },
  {
    id: "diff-ad",
    chapter: 6,
    title: "长尾差分电路差模增益（双端输出）",
    tex: r`A_d=-\frac{\beta\left(R_c\para\frac{R_L}{2}\right)}{R_b+r_{be}},\qquad R_{id}=2(R_b+r_{be}),\qquad R_o=2R_c`,
    vars: [{ sym: "R_b", name: "基极串联电阻（含信号源内阻）", unit: "Ω" }],
    conditions: ["两管对称；单端输出时 A_d 减半、R_o = R_c"],
    ref: "diff-amplifier#da-basic",
  },
  {
    id: "diff-ac",
    chapter: 6,
    title: "长尾差分电路共模增益（单端输出）",
    tex: r`A_c=-\frac{\beta R_L'}{R_b+r_{be}+2(1+\beta)R_e},\qquad K_{CMR}\approx\frac{\beta R_e}{R_b+r_{be}}`,
    vars: [{ sym: "R_e", name: "长尾电阻（或恒流源输出电阻）", unit: "Ω" }],
    conditions: ["双端输出且完全对称时 A_c = 0"],
    ref: "diff-amplifier#da-cmrr",
  },
];
