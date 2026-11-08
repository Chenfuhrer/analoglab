import type { Formula } from "../library";

const r = String.raw;

export const CH2_FORMULAS: Formula[] = [
  {
    id: "alpha-beta",
    chapter: 2,
    title: "α 与 β 的关系",
    tex: r`\bar\alpha=\frac{\bar\beta}{1+\bar\beta},\qquad\bar\beta=\frac{\bar\alpha}{1-\bar\alpha}`,
    vars: [
      { sym: "\\bar\\alpha", name: "共基直流电流放大系数 I_C/I_E", unit: "—" },
      { sym: "\\bar\\beta", name: "共射直流电流放大系数 I_C/I_B", unit: "—" },
    ],
    conditions: ["由 I_E = I_B + I_C 推出（忽略 I_CBO）"],
    ref: "bjt-currents#bc-beta",
  },
  {
    id: "iceo",
    chapter: 2,
    title: "穿透电流",
    tex: r`I_{CEO}=(1+\bar\beta)I_{CBO},\qquad I_C=\bar\beta I_B+I_{CEO}`,
    vars: [
      { sym: "I_{CBO}", name: "发射极开路时集电结反向电流", unit: "A" },
      { sym: "I_{CEO}", name: "基极开路时 c–e 间电流", unit: "A" },
    ],
    conditions: ["放大区", "I_CBO 约每 10 °C 翻倍"],
    ref: "bjt-currents#bc-leak",
  },
  {
    id: "bjt-ibs",
    chapter: 2,
    title: "临界饱和基极电流",
    tex: r`I_{BS}=\frac{V_{CC}-U_{CES}}{\beta R_c}`,
    vars: [
      { sym: "U_{CES}", name: "饱和管压降（硅约 0.3 V）", unit: "V" },
      { sym: "R_c", name: "集电极电阻", unit: "Ω" },
    ],
    conditions: ["发射极接地的简单偏置电路", "I_B > I_BS 时饱和"],
    ref: "bjt-curves#bv-output",
  },
  {
    id: "bjt-soa",
    chapter: 2,
    title: "安全工作区",
    tex: r`u_{CE}i_C\le P_{CM},\quad i_C\le I_{CM},\quad u_{CE}\le U_{(BR)CEO}`,
    vars: [{ sym: "P_{CM}", name: "集电极最大允许耗散功率", unit: "W" }],
    conditions: ["P_CM 与环境温度、散热条件有关"],
    ref: "bjt-params#bp-soa",
  },
];
