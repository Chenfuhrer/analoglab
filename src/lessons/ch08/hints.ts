import type { UnitHints } from "../shared/offline-types";

export const CH8_HINTS: Record<string, UnitHints> = {
  "fb-concept": {
    intuition: "负反馈就像开车时看路：偏左了就往右打一点。把输出的一部分送回输入与输入相减，偏差就会被自动纠正。",
    derivation: "$X_o=AX_i'$，$X_f=FX_o$，$X_i'=X_i-X_f$ → $A_f=A/(1+AF)$。",
    example: "$A=10^4$、$F=0.01$：$1+AF=101$，$A_f\\approx99$，接近 $1/F=100$。",
    keywords: ["反馈", "负反馈", "正反馈", "反馈深度", "环路增益", "闭环"],
  },
  "fb-judge": {
    intuition: "判断组态就问两个问题：①把输出短路，反馈还在不在？（在 → 电流反馈）②反馈和输入接在同一点吗？（是 → 并联反馈）",
    derivation: "瞬时极性法：设输入 ⊕，沿信号方向逐级标出极性，看反馈使净输入增大还是减小。",
    example: "反相比例：输出短路后 $R_f$ 接地，反馈消失（电压）；反馈与输入都接反相端（并联）→ 电压并联负反馈。",
    keywords: ["判断", "组态", "瞬时极性", "电压反馈", "电流反馈", "串联", "并联"],
  },
  "fb-effects": {
    intuition: "负反馈是用增益“买”性能：增益降为 $1/(1+AF)$，换来稳定性、带宽、线性都提高 $(1+AF)$ 倍左右。",
    derivation: "$\\frac{\\mathrm dA_f}{A_f}=\\frac1{1+AF}\\frac{\\mathrm dA}{A}$；单极点 $f_{Hf}=(1+A_mF)f_H$。",
    example: "串联负反馈 $R_{if}=(1+AF)R_i$；电压负反馈 $R_{of}=R_o/(1+AF)$。口诀：串大并小、压小流大。",
    keywords: ["稳定增益", "展宽频带", "失真", "输入电阻", "输出电阻", "带宽"],
  },
  "fb-deep": {
    intuition: "深度负反馈时净输入几乎为零：串联反馈 → 两输入点电压近似相等（虚短）；并联反馈 → 流入放大器的电流近似为零（虚断）。",
    derivation: "$A_f\\approx1/F$，或直接写 $X_f\\approx X_i$ 再解出输出。",
    example: "共射电路未旁路 $R_e$：$u_I\\approx i_eR_e$，$u_O=-i_cR_L'$，所以 $A_{uf}\\approx-R_L'/R_e$。",
    keywords: ["深度负反馈", "估算", "1/F", "虚短", "虚断"],
  },
  "fb-stability": {
    intuition: "每个极点在高频最多带来 −90° 的相移。三个极点能转到 −180°，负反馈就成了正反馈；若这时环路增益还 ≥ 1，就会自己“唱起来”（自激）。",
    derivation: "相位裕度：$|\\dot A\\dot F|=1$ 处 $\\varphi_m=180°+\\varphi_{AF}$；增益裕度：$\\varphi_{AF}=-180°$ 处 $20\\lg|\\dot A\\dot F|$。",
    example: "极点 1 kHz、10 kHz、100 kHz，$AF=100$ 时不稳定；把第一个极点压到 10 Hz（主极点补偿）后相位裕度约 80°。",
    keywords: ["稳定性", "自激", "相位裕度", "增益裕度", "补偿", "波特图"],
  },
};
