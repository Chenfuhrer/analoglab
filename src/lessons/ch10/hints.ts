import type { UnitHints } from "../shared/offline-types";

export const CH10_HINTS: Record<string, UnitHints> = {
  "pa-classes": {
    intuition: "甲类像一直开着的水龙头：没人用水也在流（静态电流），浪费大；乙类平时关着，用的时候才开，省水但开关瞬间有“迟滞”（交越失真）。",
    derivation: "导通角 $\\theta=2\\arccos(-I_{CQ}/I_{cm})$；理想效率：甲类 50%，乙类 $\\pi/4$。",
    example: "甲类功放 $V_{CC}=12$ V、$I_{CQ}=1$ A：无论有无信号，电源都提供 12 W。",
    keywords: ["功放", "甲类", "乙类", "甲乙类", "导通角", "效率"],
  },
  "pa-ocl": {
    intuition: "NPN 管管“推”（正半周），PNP 管管“挽”（负半周），两只射极跟随器轮流向负载送电流。",
    derivation: "$P_o=\\frac{U_{om}^2}{2R_L}$，$P_V=\\frac{2V_{CC}U_{om}}{\\pi R_L}$，$\\eta=\\frac{\\pi U_{om}}{4V_{CC}}$；管耗在 $U_{om}=2V_{CC}/\\pi$ 时最大。",
    example: "±12 V、8 Ω、理想管：$P_{om}=9$ W，$\\eta=78.5\\%$，每管最大管耗约 1.8 W。",
    keywords: ["OCL", "互补", "推挽", "最大输出功率", "管耗", "78.5"],
  },
  "pa-crossover": {
    intuition: "发射结有约 0.5 V 的门槛，乙类电路在输入过零附近两管都“没醒”，输出就出现台阶。用二极管预先把两管“叫醒”一点（甲乙类）就好了。",
    derivation: "OTL：电容上保持 $V_{CC}/2$，$P_{om}=\\frac{(V_{CC}/2-U_{CES})^2}{2R_L}$，$f_L=\\frac{1}{2\\pi R_LC}$。",
    example: "24 V 单电源、8 Ω、$U_{CES}$=1 V 的 OTL：$P_{om}\\approx7.6$ W。",
    keywords: ["交越失真", "甲乙类", "偏置二极管", "OTL", "输出电容"],
  },
};
