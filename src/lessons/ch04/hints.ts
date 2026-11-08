import type { UnitHints } from "../shared/offline-types";

export const CH4_HINTS: Record<string, UnitHints> = {
  "mos-structure": {
    intuition: "栅极、绝缘层、衬底就是一个电容：栅极加正电压，衬底表面就“吸”来电子，形成连接源漏的 N 型沟道。电压越高沟道越厚——用电场控制电流。",
    derivation: "判断类型：零栅压有没有沟道（增强/耗尽）；衬底箭头方向（N/P 沟道）。",
    example: "N 沟道增强型 MOS 管 $U_{GS(th)}=2$ V：$u_{GS}=1.5$ V 时无沟道，$u_{GS}=4$ V 时导通。",
    keywords: ["MOS", "场效应", "沟道", "增强型", "耗尽型", "结型", "JFET", "开启电压"],
  },
  "mos-curves": {
    intuition: "转移特性是抛物线：电流与“栅压超出门槛部分”的平方成正比。输出特性中，预夹断轨迹把可变电阻区（像电阻）和恒流区（像电流源）分开。",
    derivation: "恒流区条件：$u_{GS}>U_{GS(th)}$ 且 $u_{DS}\\ge u_{GS}-U_{GS(th)}$。",
    example: "$U_{GS(th)}=2$ V、$I_{DO}=2$ mA：$u_{GS}=3$ V 时 $i_D=2\\times(1.5-1)^2=0.5$ mA。",
    keywords: ["转移特性", "输出特性", "恒流区", "可变电阻区", "预夹断", "夹断", "平方律"],
  },
  "fet-small-signal": {
    intuition: "跨导就是转移特性在 Q 点的斜率：栅压变化 1 V，漏极电流变化多少毫安。",
    derivation: "对 $i_D=I_{DO}(u_{GS}/U_{GS(th)}-1)^2$ 求导，再用 $I_{DQ}$ 消去 $U_{GSQ}$，得 $g_m=\\frac{2}{U_{GS(th)}}\\sqrt{I_{DO}I_{DQ}}$。",
    example: "$U_{GS(th)}=2$ V、$I_{DO}=2$ mA、$I_{DQ}=1$ mA：$g_m\\approx1.41$ mS。同样 1 mA 的 BJT：$g_m\\approx38$ mS。",
    keywords: ["跨导", "gm", "g_m", "小信号", "rds", "沟道长度调制"],
  },
  "cs-amplifier": {
    intuition: "共源电路就是“FET 版的共射电路”：栅压变化 → 漏极电流变化 → 漏极电阻上的电压变化，输出反相。",
    derivation: "静态：$U_{GS}=U_G-I_DR_s$ 与平方律联立，解二次方程后舍去使管子截止的根。动态：$\\dot A_u=-g_mR_D'$。",
    example: "$V_{DD}$=15 V、$R_{g1}$=100 kΩ、$R_{g2}$=300 kΩ、$R_s$=1 kΩ、$U_{GS(th)}$=2 V、$I_{DO}$=2 mA：先求 $U_{GQ}=3.75$ V，再解方程。",
    keywords: ["共源", "自给偏压", "分压偏置", "舍根", "二次方程"],
  },
  "cd-cg-amplifier": {
    intuition: "共漏（源极跟随器）对应射极跟随器，共栅对应共基电路。把 BJT 公式中的 $\\beta/r_{be}$ 换成 $g_m$、令栅极电流为零即可。",
    derivation: "源极跟随器：$\\dot U_i=\\dot U_{gs}+g_m\\dot U_{gs}R_S'$，所以 $\\dot A_u=g_mR_S'/(1+g_mR_S')$；输出电阻 $R_s\\para1/g_m$。",
    example: "$g_m=2$ mS、$R_S'=5$ kΩ：$\\dot A_u=10/11\\approx0.91$。",
    keywords: ["共漏", "源极跟随器", "共栅", "组态"],
  },
};
