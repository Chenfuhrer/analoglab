import type { UnitHints } from "../shared/offline-types";

export const CH1_HINTS: Record<string, UnitHints> = {
  "semi-carriers": {
    intuition: "价电子被共价键“锁”住，只有获得约 $E_g$ 的能量才能挣脱。室温下热运动能量 $kT\\approx0.026$ eV 远小于 $E_g$（硅 1.12 eV），所以只有极少数电子被激发，且数量随温度指数变化。",
    derivation: "用 $n_i\\propto T^{3/2}e^{-E_g/(2kT)}$ 算一算：300 K 和 310 K 的比值是多少？提示：先写出比值，常数 $B$ 会消掉。",
    example: "300 K 时硅的 $n_i\\approx1.4\\times10^{10}$ cm⁻³，硅原子密度约 $5\\times10^{22}$ cm⁻³——大约每 $10^{12}$ 个原子才有一个被激发。",
    keywords: ["本征", "空穴", "共价键", "载流子", "激发", "复合"],
  },
  "semi-doped": {
    intuition: "掺五价元素，每个杂质原子多出一个几乎自由的电子（N 型）；掺三价元素，每个杂质原子“缺”一个电子，形成空穴（P 型）。多子由掺杂决定，少子由本征激发决定。",
    derivation: "热平衡时 $np=n_i^2$。若 $N_D=10^{16}$ cm⁻³，少子浓度 $p$ 是多少？温度升高后 $p$ 怎样变化？",
    example: "N 型硅 $N_D=10^{16}$ cm⁻³：$n\\approx10^{16}$、$p\\approx2\\times10^4$ cm⁻³，多子比少子多 11 个数量级以上。",
    keywords: ["掺杂", "N型", "P型", "多子", "少子", "施主", "受主", "质量作用"],
  },
  "pn-junction": {
    intuition: "浓度差让多子扩散，留下的离子形成内电场；内电场又推动少子漂移。正偏削弱内电场（导通），反偏加强内电场（截止）。",
    derivation: "从 $i=I_S(e^{u/U_T}-1)$ 出发：电流增大 10 倍，电压增加多少？（$U_T\\ln10\\approx60$ mV）",
    example: "硅结 $I_S=0.1$ pA，1 mA 电流需要的正向电压约 $0.026\\ln(10^{10})\\approx0.6$ V。",
    keywords: ["PN结", "扩散", "漂移", "耗尽层", "空间电荷", "内电场", "击穿", "结电容", "单向导电"],
  },
  diode: {
    intuition: "二极管导通后电压几乎不变（指数特性），所以可以用“理想开关 + 0.7 V 电池”来近似；判断多管通断时，先断开所有管子求开路电压，最大的那只先导通。",
    derivation: "小信号动态电阻：对 $i_D=I_Se^{u_D/U_T}$ 求导得 $\\mathrm di_D/\\mathrm du_D=I_D/U_T$，所以 $r_d=U_T/I_D$。",
    example: "$V=3$ V、$R=1$ kΩ：理想模型 3 mA，恒压降模型 2.3 mA，精确解约 2.36 mA。",
    keywords: ["二极管", "伏安特性", "模型", "恒压降", "导通", "截止", "rd", "动态电阻", "通断"],
  },
  zener: {
    intuition: "击穿区的伏安特性几乎是竖直线：电流变化很大而电压几乎不变。把稳压管并在负载上，多余的电流由稳压管“吸收”。",
    derivation: "写出 $I_Z=(U_I-U_Z)/R-I_L$，分别代入“输入最高、负载最轻”和“输入最低、负载最重”两种情况。",
    example: "$U_Z=6$ V、$I_{Z\\min}=5$ mA、$I_{ZM}=40$ mA、$U_I$=10–14 V、$I_L$=0–10 mA：$R_{\\min}=8\\,\\mathrm V/40\\,\\mathrm{mA}=200\\,\\Omega$，$R_{\\max}=4\\,\\mathrm V/15\\,\\mathrm{mA}\\approx267\\,\\Omega$。",
    keywords: ["稳压管", "齐纳", "限流电阻", "IZ", "稳压"],
  },
  "diode-circuits": {
    intuition: "画波形的唯一方法：以使二极管恰好导通的输入电压为分界，分段判断二极管通断，再写出每一段的输出表达式。",
    derivation: "半波整流平均值：$\\frac1{2\\pi}\\int_0^\\pi\\sqrt2U_2\\sin\\theta\\,\\mathrm d\\theta=\\sqrt2U_2/\\pi\\approx0.45U_2$。",
    example: "上限幅 $E=3$ V（硅管）：$u_I>3.7$ V 时输出被钳在 3.7 V，其余时间 $u_O=u_I$。",
    keywords: ["整流", "限幅", "钳位", "波形", "半波", "桥式", "全波"],
  },
};
