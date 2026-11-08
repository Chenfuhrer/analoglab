import type { UnitHints } from "../shared/offline-types";

export const CH12_HINTS: Record<string, UnitHints> = {
  rectifier: {
    intuition: "二极管是单向阀门：半波整流只放过正半周；桥式整流用四个阀门把负半周也“翻”上来。",
    derivation: "半波 $\\frac{1}{2\\pi}\\int_0^\\pi\\sqrt2U_2\\sin\\theta\\,\\mathrm d\\theta=0.45U_2$；桥式两倍，$0.9U_2$。",
    example: "$U_2=20$ V、$R_L=50\\,\\Omega$ 桥式：$U_O=18$ V，每管 0.18 A，$U_{RM}=28.3$ V。",
    keywords: ["整流", "半波", "桥式", "二极管选择", "反向电压"],
  },
  "ripple-filter": {
    intuition: "电容像蓄水池：峰值时快速灌满，其余时间慢慢放水给负载，水位（电压）只轻微下降。",
    derivation: "$R_LC\\ge(3\\sim5)T/2$ 时 $U_O\\approx1.2U_2$；纹波 $\\Delta U\\approx I_O/(2fC)$（桥式）。",
    example: "$U_2=15$ V、$R_L=100\\,\\Omega$、$C=1000\\,\\mu$F：$U_O\\approx18$ V，纹波约 1.8 V。",
    keywords: ["滤波", "电容滤波", "纹波", "1.2U2", "电感滤波"],
  },
  "zener-regulator": {
    intuition: "稳压管与负载“抢电流”：负载多拿一点，稳压管就让出一点，限流电阻上的总电流和压降几乎不变。",
    derivation: "$R$ 的范围：$\\frac{U_{I\\max}-U_Z}{I_{ZM}+I_{L\\min}}\\le R\\le\\frac{U_{I\\min}-U_Z}{I_{Z\\min}+I_{L\\max}}$；$R_o\\approx r_z$。",
    example: "$U_I=15$ V±10%、$U_Z=9$ V、负载 0～20 mA：R 约 150～180 Ω。",
    keywords: ["稳压管稳压", "限流电阻", "稳压系数", "输出电阻"],
  },
  "series-regulator": {
    intuition: "调整管像一个自动可变电阻，串在输入和输出之间：放大器盯着输出，偏高就把“电阻”调大，偏低就调小。",
    derivation: "电压串联负反馈：$U_O=\\frac{R_1+R_P+R_2}{R_2+R_P''}U_Z$；LM317：$U_O=1.25(1+R_2/R_1)$。",
    example: "$U_Z=6$ V、$R_1=R_P=R_2=1$ kΩ：输出 9～18 V 可调。",
    keywords: ["串联型稳压", "调整管", "采样", "基准", "三端稳压", "LM317", "7805"],
  },
};
