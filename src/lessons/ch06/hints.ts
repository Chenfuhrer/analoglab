import type { UnitHints } from "../shared/offline-types";

export const CH6_HINTS: Record<string, UnitHints> = {
  "diff-signals": {
    intuition: "两个人一起抬东西：两端同时升高是“共模”（整体抬起），一端升一端降是“差模”（倾斜）。差分电路只关心倾斜，不关心整体高度。",
    derivation: "$u_{Id}=u_{I1}-u_{I2}$，$u_{Ic}=(u_{I1}+u_{I2})/2$；反过来 $u_{I1}=u_{Ic}+u_{Id}/2$。",
    example: "$u_{I1}=1.002$ V、$u_{I2}=0.998$ V：差模 4 mV，共模 1 V。",
    keywords: ["差模", "共模", "分解"],
  },
  "current-source": {
    intuition: "镜像电流源像“复印机”：VT₁ 接成二极管，把参考电流 $I_R$ 转换成一个 $U_{BE}$；VT₂ 用同样的 $U_{BE}$，就“复印”出同样的电流。",
    derivation: "镜像：$I_R=I_C+2I_B$ → $I_{C2}=I_R\\beta/(\\beta+2)$。微电流源：$U_{BE1}-U_{BE2}=U_T\\ln(I_R/I_{C2})=I_{C2}R_{e2}$。",
    example: "$I_R=1$ mA，要 10 µA：微电流源 $R_{e2}=26\\,\\mathrm{mV}\\times\\ln100/10\\,\\mu\\mathrm A\\approx12$ kΩ。",
    keywords: ["电流源", "镜像", "微电流源", "Widlar", "有源负载", "比例电流源"],
  },
  "diff-amplifier": {
    intuition: "差模输入时一管电流增、一管电流减，长尾电阻中的电流不变——相当于射极接地；共模输入时两管电流同增同减，长尾电阻上的变化加倍——强烈的负反馈把共模压下去。",
    derivation: "差模（双端）：$A_d=-\\beta(R_c\\para\\frac{R_L}2)/(R_b+r_{be})$；共模（单端）：$A_c=-\\beta R_L'/[R_b+r_{be}+2(1+\\beta)R_e]$；$K_{CMR}=|A_d/A_c|$。",
    example: "$R_c=R_e=10$ kΩ、$R_b=1$ kΩ、β=100、$r_{be}\\approx5.6$ kΩ：单端 $A_d\\approx-76$，$A_c\\approx-0.49$，$K_{CMR}\\approx155$（约 44 dB）。",
    keywords: ["差分", "长尾", "共模抑制比", "KCMR", "CMRR", "单端", "双端", "恒流源"],
  },
};
