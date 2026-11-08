import type { Formula } from "../library";

const r = String.raw;

export const CH11_FORMULAS: Formula[] = [
  {
    id: "osc-start",
    chapter: 11,
    title: "振荡的起振条件",
    tex: r`|\dot A\dot F|>1,\qquad \varphi_A+\varphi_F=2n\pi`,
    vars: [],
    conditions: ["稳幅后 |AF| 回到 1"],
    ref: "osc-condition#oc-cond",
  },
  {
    id: "wien-F",
    chapter: 11,
    title: "RC 串并联网络",
    tex: r`\dot F=\frac{1}{3+j\left(\dfrac{f}{f_0}-\dfrac{f_0}{f}\right)},\qquad f_0=\frac{1}{2\pi RC}`,
    vars: [],
    conditions: ["两支路 R、C 相同"],
    ref: "osc-rc#or-wien",
  },
  {
    id: "lc-f0",
    chapter: 11,
    title: "LC 振荡频率",
    tex: r`f_0=\frac{1}{2\pi\sqrt{LC}};\quad\text{电容三点式 }C=\frac{C_1C_2}{C_1+C_2},\ \text{电感三点式 }L=L_1+L_2+2M`,
    vars: [{ sym: "M", name: "两段电感之间的互感", unit: "H" }],
    conditions: ["回路 Q 值足够高"],
    ref: "osc-lc#ol-three",
  },
  {
    id: "crystal",
    chapter: 11,
    title: "石英晶体谐振频率",
    tex: r`f_s=\frac{1}{2\pi\sqrt{L_qC_q}},\qquad f_p=f_s\sqrt{1+\frac{C_q}{C_0}}`,
    vars: [{ sym: "C_0", name: "晶片静电电容", unit: "F" }],
    conditions: ["f_s < f < f_p 时呈感性"],
    ref: "osc-lc#ol-crystal",
  },
  {
    id: "sallen-key",
    chapter: 11,
    title: "二阶压控电压源低通",
    tex: r`\dot A_u=\frac{A_{up}}{1-(f/f_0)^2+j\dfrac{f}{Qf_0}},\quad Q=\frac{1}{3-A_{up}},\quad A_{up}=1+\frac{R_f}{R_1}`,
    vars: [],
    conditions: ["等值 R、C；A_up < 3", "A_up = 1.586 时为巴特沃斯"],
    ref: "active-filter#af-second",
  },
];
