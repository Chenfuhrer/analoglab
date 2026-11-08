import type { Formula } from "../library";

const r = String.raw;

export const CH8_FORMULAS: Formula[] = [
  {
    id: "fb-sensitivity",
    chapter: 8,
    title: "负反馈对增益稳定性的改善",
    tex: r`\frac{\mathrm dA_f}{A_f}=\frac{1}{1+AF}\cdot\frac{\mathrm dA}{A}`,
    vars: [{ sym: "1+AF", name: "反馈深度", unit: "—" }],
    conditions: ["中频、F 为实数"],
    ref: "fb-effects#fe-gain",
  },
  {
    id: "fb-bandwidth",
    chapter: 8,
    title: "负反馈展宽频带",
    tex: r`A_{mf}=\frac{A_m}{1+A_mF},\qquad f_{Hf}=(1+A_mF)f_H,\qquad f_{Lf}=\frac{f_L}{1+A_mF}`,
    vars: [{ sym: "f_H", name: "开环上限截止频率", unit: "Hz" }],
    conditions: ["单极点近似；增益带宽积不变"],
    ref: "fb-effects#fe-bw",
  },
  {
    id: "fb-rio",
    chapter: 8,
    title: "负反馈对输入、输出电阻的影响",
    tex: r`R_{if}=(1+AF)R_i\ (\text{串联}),\ \frac{R_i}{1+AF}\ (\text{并联});\quad R_{of}=\frac{R_o}{1+A_oF}\ (\text{电压}),\ (1+A_sF)R_o\ (\text{电流})`,
    vars: [
      { sym: "A_o", name: "输出端开路时的增益", unit: "—" },
      { sym: "A_s", name: "输出端短路时的增益", unit: "—" },
    ],
    conditions: ["负反馈"],
    ref: "fb-effects#fe-rio",
  },
  {
    id: "fb-deep-est",
    chapter: 8,
    title: "深度负反馈估算",
    tex: r`A_f\approx\frac1F,\qquad X_f\approx X_i`,
    vars: [],
    conditions: ["|1+AF| ≫ 1（一般 ≥ 10）", "串联：u_F ≈ u_I；并联：i_F ≈ i_I"],
    ref: "fb-deep#fd-approx",
  },
  {
    id: "fb-osc-cond",
    chapter: 8,
    title: "负反馈放大电路的自激条件",
    tex: r`\dot A\dot F=-1\iff|\dot A\dot F|=1,\ \varphi_A+\varphi_F=(2n+1)\pi`,
    vars: [],
    conditions: ["工程要求：相位裕度 ≥ 45°，增益裕度 ≤ −10 dB"],
    ref: "fb-stability#fst-cond",
  },
];
