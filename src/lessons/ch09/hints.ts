import type { UnitHints } from "../shared/offline-types";

export const CH9_HINTS: Record<string, UnitHints> = {
  "freq-basics": {
    intuition: "电容的容抗随频率变：大电容在低频“拦路”（高通），小电容在高频“短路”（低通）。所以放大电路两头增益都会下降。",
    derivation: "低通 $\\dot A=1/(1+jf/f_H)$，$f_H=1/(2\\pi RC)$；在 $f_H$ 处下降 3 dB、相移 −45°。",
    example: "$R=10$ kΩ、$C=10$ nF：$f_c\\approx1.59$ kHz；10 倍频处衰减约 20 dB。",
    keywords: ["频率响应", "波特图", "截止频率", "RC", "dB", "通频带", "渐近线"],
  },
  "freq-hybrid-pi": {
    intuition: "高频时发射结电容 $C_\\pi$ 把基极电流“分走”，真正控制集电极电流的 $U_{b'e}$ 变小，β 就下降了。",
    derivation: "$g_m=I_{EQ}/U_T$，$r_{b'e}=(1+\\beta_0)U_T/I_{EQ}$，$f_\\beta=1/[2\\pi r_{b'e}(C_\\pi+C_\\mu)]$，$f_T\\approx\\beta_0f_\\beta$。",
    example: "$I_{EQ}=1$ mA、$f_T=300$ MHz：$g_m\\approx38.5$ mS，$C_\\pi\\approx18$ pF（$C_\\mu$=2 pF）。",
    keywords: ["混合π", "混合 π", "fT", "fβ", "特征频率", "结电容", "Cπ", "Cμ", "gm"],
  },
  "freq-single-stage": {
    intuition: "共射电路输入、输出反相，跨在两者之间的 $C_\\mu$ 两端电压被放大了 $(1+g_mR_L')$ 倍，充放电电流也一样大——从输入端看它像一个大得多的电容（米勒效应）。",
    derivation: "$C_\\pi'=C_\\pi+(1+g_mR_L')C_\\mu$，$f_H=1/(2\\pi RC_\\pi')$，$R=r_{b'e}\\para(r_{bb'}+R_s\\para R_B)$；$f_L$ 用短路时间常数法。",
    example: "$g_mR_L'\\approx70$，$C_\\mu=3$ pF → 米勒电容约 213 pF，远大于 $C_\\pi$。",
    keywords: ["米勒", "上限频率", "下限频率", "旁路电容", "增益带宽积", "单管"],
  },
  "freq-multistage": {
    intuition: "每一级在自己的截止频率处已经掉了 3 dB，几级叠起来就掉得更多——整体的 −3 dB 点只能往中频方向退，带宽变窄。",
    derivation: "n 级相同：$f_H=f_{H1}\\sqrt{2^{1/n}-1}$；一般：$1/f_H\\approx1.1\\sqrt{\\sum1/f_{Hk}^2}$。",
    example: "两级相同、单级 $f_H$=1 MHz：总 $f_H\\approx644$ kHz。",
    keywords: ["多级", "带宽", "级联", "估算"],
  },
};
