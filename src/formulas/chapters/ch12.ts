import type { Formula } from "../library";

const r = String.raw;

export const CH12_FORMULAS: Formula[] = [
  {
    id: "bridge-stress",
    chapter: 12,
    title: "桥式整流的二极管参数",
    tex: r`I_{D(AV)}=\frac12I_{O(AV)},\qquad U_{RM}=\sqrt2U_2`,
    vars: [],
    conditions: ["理想二极管、电阻负载；选管留 10% 余量"],
    ref: "rectifier#rf-bridge",
  },
  {
    id: "cap-ripple",
    chapter: 12,
    title: "电容滤波纹波估算",
    tex: r`\Delta U_{pp}\approx\frac{I_O}{2fC}\ (\text{桥式}),\qquad R_LC\ge(3\sim5)\frac T2`,
    vars: [{ sym: "f", name: "电网频率", unit: "Hz" }],
    conditions: ["纹波远小于输出电压"],
    ref: "ripple-filter#cf-estimate",
  },
  {
    id: "zener-index",
    chapter: 12,
    title: "稳压系数与输出电阻",
    tex: r`S_r=\frac{\Delta U_O/U_O}{\Delta U_I/U_I}\Big|_{R_L},\qquad R_o=\frac{\Delta U_O}{\Delta I_O}\Big|_{U_I}\approx r_z`,
    vars: [{ sym: "r_z", name: "稳压管动态电阻", unit: "Ω" }],
    conditions: ["小信号"],
    ref: "zener-regulator#zr-index",
  },
  {
    id: "series-reg",
    chapter: 12,
    title: "串联型稳压电路输出电压",
    tex: r`U_O=\frac{R_1+R_P+R_2}{R_2+R_P''}U_Z,\quad U_{O\min}=\frac{R_1+R_P+R_2}{R_2+R_P}U_Z,\ U_{O\max}=\frac{R_1+R_P+R_2}{R_2}U_Z`,
    vars: [{ sym: "R_P''", name: "电位器滑动端以下的部分", unit: "Ω" }],
    conditions: ["比较放大器增益足够大（深度负反馈）；调整管工作在放大区"],
    ref: "series-regulator#sr-range",
  },
  {
    id: "lm317",
    chapter: 12,
    title: "LM317 输出电压",
    tex: r`U_O=1.25\,\mathrm V\left(1+\frac{R_2}{R_1}\right)+I_{ADJ}R_2`,
    vars: [{ sym: "I_{ADJ}", name: "调整端电流（约 50 µA）", unit: "A" }],
    conditions: ["输入比输出高 2～3 V 以上"],
    ref: "series-regulator#sr-ic",
  },
];
