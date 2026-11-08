import type { UnitHints } from "../shared/offline-types";

export const CH5_HINTS: Record<string, UnitHints> = {
  "multistage-coupling": {
    intuition: "耦合电容像一道“只让变化通过”的门：交流过得去，直流过不去。所以阻容耦合各级 Q 点互不干扰，但也放大不了直流和很慢的信号。",
    derivation: "耦合电容与 $R_{o1}+R_{i2}$ 组成一阶高通：$f_L=1/[2\\pi C(R_{o1}+R_{i2})]$。",
    example: "$C=10\\,\\mu$F、$R_{o1}+R_{i2}=5$ kΩ：$f_L\\approx3.2$ Hz，传感器的缓变信号（如 0.1 Hz）几乎被完全挡掉。",
    keywords: ["耦合", "阻容", "直接耦合", "变压器", "光电", "电平"],
  },
  "multistage-analysis": {
    intuition: "后级就像前级的“负载”：后级输入电阻越小，前级输出电压被“拉”得越低。所以算每级增益时要把后级接上。",
    derivation: "$\\dot U_{o1}=\\dot A_{uo1}\\dot U_{i1}\\frac{R_{i2}}{R_{o1}+R_{i2}}$；总增益 = 各级带载增益之积；$R_i=R_{i1}$，$R_o=R_{on}$。",
    example: "两级共射，第二级 $R_{i2}\\approx1.4$ kΩ、$R_{c1}=3$ kΩ：第一级负载只有约 0.95 kΩ，增益比空载小三分之二。",
    keywords: ["多级", "级联", "负载效应", "输入电阻", "输出电阻", "总增益", "共射共集"],
  },
  "zero-drift": {
    intuition: "直接耦合时，第一级的一点点温度引起的变化，会被后面所有级当成信号放大——输入为零，输出却在慢慢“漂”。",
    derivation: "折合到输入端：$\\Delta u_I=\\Delta u_1+\\Delta u_2/A_1+\\Delta u_3/(A_1A_2)$。",
    example: "$U_{BE}$ 温漂 −2.2 mV/°C，总增益 1000：温度升高 10 °C，输出漂移 22 V——远超电源电压，电路早已饱和。",
    keywords: ["零点漂移", "温漂", "漂移", "折合", "输入端"],
  },
};
