import type { Formula } from "../library";

const r = String.raw;

export const CH9_FORMULAS: Formula[] = [
  {
    id: "rc-corner",
    chapter: 9,
    title: "一阶 RC 电路",
    tex: r`\dot A_u=\frac{1}{1+jf/f_H}\ (\text{低通}),\quad \dot A_u=\frac{jf/f_L}{1+jf/f_L}\ (\text{高通}),\quad f=\frac{1}{2\pi RC}`,
    vars: [{ sym: "RC", name: "时间常数", unit: "s" }],
    conditions: ["截止频率处 −3 dB、±45°"],
    ref: "freq-basics#frb-rc",
  },
  {
    id: "hybrid-pi",
    chapter: 9,
    title: "混合 π 参数",
    tex: r`g_m=\frac{I_{EQ}}{U_T},\quad r_{b'e}=(1+\beta_0)\frac{U_T}{I_{EQ}},\quad C_\pi\approx\frac{g_m}{2\pi f_T}-C_\mu`,
    vars: [
      { sym: "f_T", name: "特征频率", unit: "Hz" },
      { sym: "C_\\mu", name: "集电结电容（≈C_ob）", unit: "F" },
    ],
    conditions: ["放大区、小信号"],
    ref: "freq-hybrid-pi#fh-params",
  },
  {
    id: "f-beta",
    chapter: 9,
    title: "共射截止频率与特征频率",
    tex: r`f_\beta=\frac{1}{2\pi r_{b'e}(C_\pi+C_\mu)},\qquad f_T\approx\beta_0f_\beta`,
    vars: [],
    conditions: ["输出端交流短路"],
    ref: "freq-hybrid-pi#fh-fbeta",
  },
  {
    id: "miller",
    chapter: 9,
    title: "米勒效应与上限频率",
    tex: r`C_\pi'=C_\pi+(1+g_mR_L')C_\mu,\qquad f_H=\frac{1}{2\pi\,[r_{b'e}\para(r_{bb'}+R_s\para R_B)]\,C_\pi'}`,
    vars: [{ sym: "R_L'", name: "R_c∥R_L", unit: "Ω" }],
    conditions: ["共射、射极交流接地；单极点近似"],
    ref: "freq-single-stage#f1-high",
  },
  {
    id: "multistage-bw",
    chapter: 9,
    title: "多级放大电路的截止频率",
    tex: r`\frac{1}{f_H}\approx1.1\sqrt{\sum_k\frac1{f_{Hk}^2}},\qquad f_L\approx1.1\sqrt{\sum_kf_{Lk}^2}`,
    vars: [],
    conditions: ["各级近似单极点；n 级相同时精确值 f_H = f_H1√(2^{1/n}−1)"],
    ref: "freq-multistage#fm-estimate",
  },
];
