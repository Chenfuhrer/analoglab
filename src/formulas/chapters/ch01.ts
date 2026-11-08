import type { Formula } from "../library";

const r = String.raw;

export const CH1_FORMULAS: Formula[] = [
  {
    id: "ni-temp",
    chapter: 1,
    title: "本征载流子浓度",
    tex: r`n_i=p_i=BT^{3/2}e^{-E_g/(2kT)}`,
    vars: [
      { sym: "E_g", name: "禁带宽度（Si 1.12 eV，Ge 0.66 eV）", unit: "eV" },
      { sym: "T", name: "热力学温度", unit: "K" },
      { sym: "B", name: "材料常数", unit: "cm⁻³·K^{-3/2}" },
    ],
    conditions: ["热平衡", "忽略 E_g 随温度的变化（近似）"],
    ref: "semi-carriers#sc-temp",
  },
  {
    id: "mass-action",
    chapter: 1,
    title: "质量作用定律",
    tex: r`np=n_i^2`,
    vars: [
      { sym: "n", name: "自由电子浓度", unit: "cm⁻³" },
      { sym: "p", name: "空穴浓度", unit: "cm⁻³" },
    ],
    conditions: ["热平衡、非简并（掺杂 ≲ 10¹⁹ cm⁻³）", "N 型：n ≈ N_D，p = n_i²/N_D"],
    ref: "semi-doped#sd-mass",
  },
  {
    id: "contact-potential",
    chapter: 1,
    title: "PN 结接触电位差",
    tex: r`U_{ho}=U_T\ln\frac{N_AN_D}{n_i^2}`,
    vars: [
      { sym: "N_A", name: "P 区受主浓度", unit: "cm⁻³" },
      { sym: "N_D", name: "N 区施主浓度", unit: "cm⁻³" },
    ],
    conditions: ["突变结、杂质全部电离"],
    ref: "pn-junction#pn-form",
  },
  {
    id: "diode-rd",
    chapter: 1,
    title: "二极管动态电阻",
    tex: r`r_d=\frac{U_T}{I_D}`,
    vars: [
      { sym: "I_D", name: "静态（直流）电流", unit: "A" },
      { sym: "U_T", name: "温度电压当量（≈26 mV）", unit: "V" },
    ],
    conditions: ["正向导通（I_D ≫ I_S）", "小信号：|u_d| ≪ U_T"],
    ref: "diode#di-small",
  },
  {
    id: "zener-r-range",
    chapter: 1,
    title: "稳压管限流电阻的范围",
    tex: r`\frac{U_{I\max}-U_Z}{I_{ZM}+I_{L\min}}\le R\le\frac{U_{I\min}-U_Z}{I_{Z\min}+I_{L\max}}`,
    vars: [
      { sym: "I_{ZM}", name: "最大稳定电流 P_ZM/U_Z", unit: "A" },
      { sym: "I_{Z\\min}", name: "最小稳定电流", unit: "A" },
      { sym: "I_L", name: "负载电流", unit: "A" },
    ],
    conditions: ["稳压时 U_O ≈ U_Z（忽略 r_z）"],
    ref: "zener#zn-design",
  },
  {
    id: "rect-avg",
    chapter: 1,
    title: "整流输出平均值",
    tex: r`U_{O(AV)}=\frac{\sqrt2}{\pi}U_2\approx0.45U_2\ (\text{半波}),\qquad U_{O(AV)}\approx0.9U_2\ (\text{桥式})`,
    vars: [{ sym: "U_2", name: "变压器副边电压有效值", unit: "V" }],
    conditions: ["理想二极管、电阻负载、无滤波"],
    ref: "diode-circuits#dc-rect",
  },
];
