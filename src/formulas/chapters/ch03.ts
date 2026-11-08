import type { Formula } from "../library";

const r = String.raw;

export const CH3_FORMULAS: Formula[] = [
  {
    id: "divider-exact",
    chapter: 3,
    title: "分压偏置：戴维南等效求 I_BQ",
    tex: r`I_{BQ}=\frac{V_{BB}-U_{BEQ}}{R_B+(1+\beta)R_e},\quad V_{BB}=\frac{R_{b1}V_{CC}}{R_{b1}+R_{b2}},\ R_B=R_{b1}\para R_{b2}`,
    vars: [
      { sym: "R_{b1}", name: "下偏置电阻（基极→地）", unit: "Ω" },
      { sym: "R_{b2}", name: "上偏置电阻（V_CC→基极）", unit: "Ω" },
      { sym: "R_e", name: "射极直流电阻", unit: "Ω" },
    ],
    conditions: ["恒压降模型、放大区", "(1+β)R_e ≫ R_B 时退化为估算法"],
    ref: "divider-bias#db-calc",
  },
  {
    id: "cc-au",
    chapter: 3,
    title: "共集电路：电压放大倍数与输入电阻",
    tex: r`\dot A_u=\frac{(1+\beta)R_L'}{r_{be}+(1+\beta)R_L'},\qquad R_i=R_b\para[r_{be}+(1+\beta)R_L'],\quad R_L'=R_e\para R_L`,
    vars: [{ sym: "R_L'", name: "射极交流负载 R_e∥R_L", unit: "Ω" }],
    conditions: ["中频小信号，h 参数简化模型"],
    ref: "cc-amplifier#cc-gain",
  },
  {
    id: "cc-ro",
    chapter: 3,
    title: "共集电路：输出电阻",
    tex: r`R_o=R_e\para\frac{r_{be}+R_s\para R_b}{1+\beta}`,
    vars: [{ sym: "R_s", name: "信号源内阻", unit: "Ω" }],
    conditions: ["信号源置零但保留 R_s；R_L 断开"],
    ref: "cc-amplifier#cc-rio",
  },
  {
    id: "cb-au",
    chapter: 3,
    title: "共基电路",
    tex: r`\dot A_u=\frac{\beta R_L'}{r_{be}},\qquad R_i=R_e\para\frac{r_{be}}{1+\beta},\qquad R_o\approx R_c`,
    vars: [{ sym: "R_L'", name: "R_c∥R_L", unit: "Ω" }],
    conditions: ["基极交流接地；中频小信号"],
    ref: "cb-amplifier#cb-dynamic",
  },
];
