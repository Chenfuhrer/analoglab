import type { UnitHints } from "../shared/offline-types";

export const CH11_HINTS: Record<string, UnitHints> = {
  "osc-condition": {
    intuition: "话筒对着扬声器会“啸叫”：声音被放大、又被话筒拾取、再放大……绕一圈不衰减就自己响个不停。振荡器就是有意设计的“啸叫”，再用选频网络让它只在一个频率上叫。",
    derivation: "$\\dot X_i'=\\dot F\\dot X_o$ 且 $\\dot X_o=\\dot A\\dot X_i'$ → $\\dot A\\dot F=1$；起振要求 $|\\dot A\\dot F|>1$。",
    example: "文氏桥：$F=1/3$，放大倍数 3.2 时 $AF\\approx1.07$，能起振。",
    keywords: ["振荡", "起振", "平衡条件", "相位条件", "稳幅", "正反馈"],
  },
  "osc-rc": {
    intuition: "RC 串并联网络像一个“只认一个频率”的门：只有 $f_0$ 处相移为零、衰减最小（1/3），放大器补回 3 倍就能维持振荡。",
    derivation: "$\\dot F=1/[3+j(f/f_0-f_0/f)]$，$f_0=1/(2\\pi RC)$；$A=1+R_f/R_1\\ge3$。",
    example: "$R=10$ kΩ、$C=15.9$ nF：$f_0\\approx1$ kHz；$R_1=10$ kΩ 时 $R_f$ 取略大于 20 kΩ。",
    keywords: ["文氏桥", "RC振荡", "串并联", "热敏电阻"],
  },
  "osc-lc": {
    intuition: "LC 回路像秋千：能量在电感（磁场）和电容（电场）之间来回交换，固有频率 $1/(2\\pi\\sqrt{LC})$；放大器只需按时“推一把”补充损耗。",
    derivation: "三点式“射同基反”；电容三点式 $C=C_1C_2/(C_1+C_2)$，电感三点式 $L=L_1+L_2+2M$。",
    example: "$L=10\\,\\mu$H、$C_1=C_2=1$ nF：$f_0\\approx2.25$ MHz。",
    keywords: ["LC", "三点式", "考毕兹", "哈特莱", "晶体", "谐振", "Q"],
  },
  "active-filter": {
    intuition: "低通让慢变化通过，高通让快变化通过；二阶滤波器“刹车更急”（−40 dB/十倍频），正反馈的大小决定转折处是平滑还是凸起（Q）。",
    derivation: "一阶 $\\dot A=A_{up}/(1+jf/f_0)$；二阶 $\\dot A=A_{up}/[1-(f/f_0)^2+jf/(Qf_0)]$，$Q=1/(3-A_{up})$。",
    example: "$A_{up}=1.586$ 时 $Q=0.707$，通带最平坦（巴特沃斯）。",
    keywords: ["滤波", "低通", "高通", "带通", "带阻", "巴特沃斯", "Sallen"],
  },
};
