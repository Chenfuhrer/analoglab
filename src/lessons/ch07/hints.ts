import type { UnitHints } from "../shared/offline-types";

export const CH7_HINTS: Record<string, UnitHints> = {
  "opamp-ideal": {
    intuition: "运放像一个“极其敏感的天平”：两端只要差几十微伏，输出就打到头。加上负反馈后，输出会自动调到让两端几乎相等的位置——这就是虚短。",
    derivation: "$u_+-u_-=u_O/A_{od}$，$A_{od}\\to\\infty$ 且 $u_O$ 有限 → $u_+=u_-$（虚短）；$r_{id}\\to\\infty$ → $i_+=i_-=0$（虚断）。",
    example: "$A_{od}=10^5$、$u_O=5$ V：$u_+-u_-=50\\,\\mu$V。",
    keywords: ["运放", "理想运放", "虚短", "虚断", "虚地", "比较器", "滞回", "施密特"],
  },
  "opamp-proportional": {
    intuition: "反相比例：反相端被“钉”在 0 V（虚地），输入电流 $u_I/R_1$ 全部流过 $R_f$，输出就是 $-i R_f$。",
    derivation: "反相：$\\frac{u_I}{R_1}=\\frac{0-u_O}{R_f}$；同相：$u_I=u_-=\\frac{R_1}{R_1+R_f}u_O$。",
    example: "$R_1=10$ kΩ、$R_f=100$ kΩ：反相 $-10$ 倍，同相 11 倍。",
    keywords: ["比例", "反相", "同相", "跟随器", "平衡电阻"],
  },
  "opamp-arith": {
    intuition: "多个输入就用叠加原理：每次只留一个输入，其余接地，分别算出输出再相加。",
    derivation: "减法：$u_{I1}$ 单独作用得 $-\\frac{R_f}{R_1}u_{I1}$；$u_{I2}$ 单独作用得 $(1+\\frac{R_f}{R_1})\\frac{R_3}{R_2+R_3}u_{I2}$。",
    example: "$u_O=2u_{I1}-3u_{I2}$：$R_f=100$ kΩ，$R_N=33.3$ kΩ，$N=4$，再按平衡条件定同相端电阻。",
    keywords: ["求和", "加法", "减法", "差分比例", "叠加", "线性组合", "设计"],
  },
  "opamp-integrator": {
    intuition: "积分电路就是“用恒流给电容充电”：虚地让输入电阻上的电流 $u_I/R$ 恒定，电容电压就线性增长。",
    derivation: "$\\frac{u_I}{R}=-C\\frac{\\mathrm du_O}{\\mathrm dt}$ → $u_O=-\\frac1{RC}\\int u_I\\,\\mathrm dt$。",
    example: "$RC=1$ ms，输入 ±1 V、1 kHz 方波：输出为峰峰值 0.5 V 的三角波？算一算：半周期 0.5 ms，变化 0.5 V——峰峰值 0.5 V。",
    keywords: ["积分", "微分", "三角波", "方波", "斜坡"],
  },
};
