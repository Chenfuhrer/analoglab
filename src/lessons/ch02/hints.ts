import type { UnitHints } from "../shared/offline-types";

export const CH2_HINTS: Record<string, UnitHints> = {
  "bjt-structure": {
    intuition: "晶体管 = 两个靠得非常近的 PN 结。发射结正偏负责“注入”，集电结反偏负责“收集”；基区薄到注入的电子来不及复合就被收走。",
    derivation: "判断组态：画交流通路，看哪个电极接地（公共端）。b 只能入、c 只能出、e 可入可出。",
    example: "共集电路的集电极直接接 $V_{CC}$，交流通路中 $V_{CC}$ 接地，所以集电极是公共端。",
    keywords: ["结构", "NPN", "PNP", "组态", "共射", "共集", "共基", "内部条件", "外部条件"],
  },
  "bjt-currents": {
    intuition: "发射区注入 100 个电子，大约只有 1 个在基区复合（形成基极电流），99 个被集电结收走（形成集电极电流）——比例由基区结构决定，所以 $I_C/I_B$ 近似为常数 $\\beta$。",
    derivation: "从 $I_E=I_B+I_C$ 出发，两边同除以 $I_E$ 或 $I_B$，就能得到 $\\bar\\alpha=\\bar\\beta/(1+\\bar\\beta)$。",
    example: "$\\bar\\beta=100$、$I_B=20\\,\\mu$A：$I_C=2$ mA，$I_E=2.02$ mA，$\\bar\\alpha\\approx0.990$。",
    keywords: ["电流分配", "β", "beta", "α", "alpha", "ICBO", "ICEO", "穿透电流", "复合"],
  },
  "bjt-curves": {
    intuition: "输出特性的放大区是一族近似水平的线——每条线对应一个 $i_B$，水平说明 $i_C$ 几乎不受 $u_{CE}$ 影响，晶体管就是一个受 $i_B$ 控制的电流源。",
    derivation: "判断工作区：先看发射结是否导通，再看集电结：NPN 中 $U_C\\ge U_B$ 为放大，$U_C<U_B$ 为饱和。",
    example: "三个电位 3.7 V、3 V、12 V：居中的 3.7 V 是 b，3 V 是 e（差 0.7 V，硅管），12 V 是 c 且最高 → NPN。",
    keywords: ["特性曲线", "输入特性", "输出特性", "工作区", "截止", "饱和", "放大区", "判断", "电位", "管型"],
  },
  "bjt-params": {
    intuition: "极限参数就像晶体管的“限速、限重、限高”：功耗不超过 $P_{CM}$、电流不超过 $I_{CM}$、电压不超过 $U_{(BR)CEO}$，三者围成安全工作区。",
    derivation: "负载线上的管耗 $P=u_{CE}(V_{CC}-u_{CE})/R_c$，对 $u_{CE}$ 求导可得最大值在 $u_{CE}=V_{CC}/2$。",
    example: "温度从 25 °C 升到 55 °C：β 约增大 35%，$U_{BE}$ 约减小 66 mV，$I_{CBO}$ 增大 8 倍。",
    keywords: ["参数", "安全工作区", "PCM", "ICM", "击穿", "温度", "极限"],
  },
};
