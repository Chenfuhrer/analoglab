import type { UnitHints } from "../shared/offline-types";

export const CH3_HINTS: Record<string, UnitHints> = {
  "divider-bias": {
    intuition: "分压电阻把基极电位“钉住”，射极电阻像一个自动调节阀：$I_C$ 想增大，$R_e$ 上的电压就增大，反过来把 $U_{BE}$ 压低，$I_C$ 又被拉回来。",
    derivation: "戴维南等效：$V_{BB}=V_{CC}R_{b1}/(R_{b1}+R_{b2})$，$R_B=R_{b1}\\para R_{b2}$，$I_{BQ}=(V_{BB}-U_{BEQ})/[R_B+(1+\\beta)R_e]$。$(1+\\beta)R_e\\gg R_B$ 时分母约为 $(1+\\beta)R_e$，就得到估算法。",
    example: "$V_{CC}$=12 V、$R_{b1}$=10 kΩ、$R_{b2}$=33 kΩ、$R_e$=1.2 kΩ：$U_{BQ}\\approx2.79$ V，$I_{CQ}\\approx1.74$ mA。β 从 100 换成 200，$I_{CQ}$ 只增加约 3%。",
    keywords: ["分压", "偏置", "稳定", "温度", "漂移", "估算", "戴维南", "旁路", "Re"],
  },
  "cc-amplifier": {
    intuition: "发射极电位永远比基极低约 0.7 V，基极怎么动，发射极就怎么动——所以叫“跟随器”。它不放大电压，但放大电流，用来“隔开”高阻信号源和低阻负载。",
    derivation: "$\\dot U_i=\\dot I_b[r_{be}+(1+\\beta)R_L']$，$\\dot U_o=(1+\\beta)\\dot I_bR_L'$。求 $R_o$ 时记得信号源置零、保留 $R_s$。",
    example: "$r_{be}$=1.4 kΩ、β=100、$R_L'$=1.5 kΩ：$A_u=151.5/152.9\\approx0.991$。",
    keywords: ["共集", "射极跟随", "跟随器", "缓冲", "输出电阻", "Ro", "阻抗变换"],
  },
  "cb-amplifier": {
    intuition: "共基电路把信号加在发射极：发射极电流几乎全部“转交”给集电极（$\\alpha\\approx1$），再流过 $R_L'$ 变成大电压——电流不放大，电压放大。",
    derivation: "基极接地：$\\dot U_i=-\\dot I_br_{be}$，$\\dot U_o=-\\beta\\dot I_bR_L'$，所以 $\\dot A_u=\\beta R_L'/r_{be}$（正）；$R_i=R_e\\para r_{be}/(1+\\beta)$。",
    example: "与同一偏置的共射电路相比，增益数值相同但同相，输入电阻小约 $(1+\\beta)$ 倍。",
    keywords: ["共基", "电流跟随", "高频", "三种组态", "比较"],
  },
};
