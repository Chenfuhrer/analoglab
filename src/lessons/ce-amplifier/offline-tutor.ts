/**
 * 离线引导模式的分层提示（无 AI API 时使用）。按知识点组织，内容与课程正文一致。
 */
export interface OfflineHints {
  intuition: string;
  derivation: string;
  example: string;
  keywords: string[];
}

export const CE_OFFLINE: Record<string, OfflineHints> = {
  "ce-why": {
    intuition:
      "想象一个水龙头：你用很小的力拧阀门（基极电流 $i_B$），就能控制很大的水流（集电极电流 $i_C$）。水的能量来自水塔（$V_{CC}$），不是来自你的手。**类比的边界**：阀门是机械控制，而三极管是载流子输运——发射区注入基区的电子大部分被集电结电场“收走”，比例由器件结构决定（$\\beta$）。",
    derivation:
      "先想想：如果输出功率 $P_o$ 比输入功率 $P_i$ 大，多出来的能量从哪来？试着写出 $V_{CC}$ 提供的平均功率 $P_V=V_{CC}I_{CQ}$ 与负载得到的交流功率 $P_o=\\tfrac12 I_{cm}^2R_L'$，比较它们的大小。",
    example: "麦克风输出约 10 mV 的信号，扬声器需要几伏电压和几百毫安电流——中间的能量全部由电源提供，放大电路只负责“按信号的形状去开关能量”。",
    keywords: ["能量", "为什么能放大", "放大原理", "能量来源"],
  },
  "ce-bias": {
    intuition:
      "发射结像一道门槛（约 0.7 V）。如果没有直流偏置，正弦信号的负半周以及低于门槛的正半周都过不去，输出只剩“半截”。偏置就是先把晶体管“抬”到门槛之上的某个位置（Q 点），让交流信号在它附近上下摆动。",
    derivation: "问自己：$i_C$ 增大时，$R_c$ 上的压降 $i_CR_c$ 怎么变？集电极电位 $u_C=V_{CC}-i_CR_c$ 又怎么变？由此判断 $u_o$ 与 $u_i$ 的相位关系。",
    example: "固定偏置：$V_{CC}=12$ V、$R_b=565$ kΩ、$\\beta=100$ → $I_{BQ}=20\\,\\mu$A、$I_{CQ}=2$ mA。去实验室把 $R_b$ 调大到 1.2 MΩ，看 Q 点怎样沿负载线下滑。",
    keywords: ["偏置", "静态工作点", "Q点", "反相", "相位"],
  },
  "ce-dc": {
    intuition: "电容是两块被绝缘层隔开的极板。直流稳态时极板上的电荷不再变化，$i=C\\,\\mathrm du/\\mathrm dt=0$，没有电流通过——等效于开路。",
    derivation: "画出直流通路后，沿“$V_{CC}\\to R_b\\to$ b–e 结 $\\to$ 地”列 KVL，你能写出含 $I_{BQ}$ 的方程吗？再沿“$V_{CC}\\to R_c\\to$ c–e $\\to$ 地”列第二个方程。",
    example: "若测得 $U_{CEQ}\\approx V_{CC}$，说明什么？（提示：$I_{CQ}R_c\\approx0$ → 截止，或 $R_c$ 短路……）",
    keywords: ["直流通路", "开路", "静态分析", "估算", "负载线"],
  },
  "ce-ac": {
    intuition:
      "电容的容抗 $X_C=1/(\\omega C)$。10 µF 电容在 1 kHz 时只有约 16 Ω，远小于电路中几 kΩ 的电阻，所以在交流信号看来它几乎是一根导线。直流电源两端电压恒定，交流分量为零，所以在交流通路中它的“+”端与地之间没有交流电压——相当于接地。",
    derivation: "算一算：$C_1=10\\,\\mu$F、$f=1$ kHz 时 $X_{C1}$ 是多少？与 $R_i\\approx1.4$ kΩ 相比能忽略吗？把频率降到 10 Hz 呢？",
    example: "在实验室把频率调到 10 Hz，会出现“中频近似不成立”的提示——这就是低频截止频率附近的情况。",
    keywords: ["交流通路", "短路", "交流接地", "电源接地", "中频"],
  },
  "ce-hparam": {
    intuition:
      "在 Q 点附近，输入特性曲线可以用它的切线代替（就像在地球表面一小块区域里地面可以当作平面）。切线斜率的倒数就是动态电阻 $r_{be}$。曲线弯曲得越厉害、信号越大，这个近似越差。",
    derivation: "从 $i_B=I_S'e^{u_{BE}/U_T}$ 出发，求 $\\mathrm di_B/\\mathrm du_{BE}$ 在 Q 点的值，你会得到 $I_{BQ}/U_T$。它的倒数是什么？再加上基区体电阻 $r_{bb'}$。",
    example: "$I_{EQ}=2$ mA、$\\beta=100$ 时 $r_{b'e}=101\\times26\\text{ mV}/2\\text{ mA}\\approx1.31$ kΩ；$I_{EQ}$ 减半，$r_{be}$ 约翻倍——$r_{be}$ 不是常数，取决于 Q 点。",
    keywords: ["微变", "小信号", "rbe", "r_be", "h参数", "等效电路", "模型"],
  },
  "ce-gain": {
    intuition: "输入电压先在 $r_{be}$ 上“换算”成基极电流 $i_b=u_i/r_{be}$，再被放大 $\\beta$ 倍成为 $i_c$，最后流过 $R_L'$ 变回电压。所以 $|A_u|=\\beta R_L'/r_{be}$：一个电流放大 × 一个“电阻比”。",
    derivation: "按三步写：(1) $\\dot U_i=\\dot I_b r_{be}$；(2) $\\dot I_c=\\beta\\dot I_b$；(3) $\\dot U_o=-\\dot I_c R_L'$。相除即可。如果射极有未旁路的 $R_e$，第 (1) 步要改成什么？",
    example: "$\\beta=100$、$R_L'=1.5$ kΩ、$r_{be}=1.4$ kΩ → $A_u\\approx-107$。加入 200 Ω 不旁路射极电阻后约为 $-6.9$——增益换来了稳定性和线性。",
    keywords: ["放大倍数", "增益", "Au", "A_u", "推导"],
  },
  "ce-rio": {
    intuition:
      "输入电阻是放大电路对信号源“吃多少电流”的度量：$R_i$ 越大，信号源越不费力，电压损失越小。输出电阻是放大电路作为“电源”的内阻：$R_o$ 越小，接上负载后电压掉得越少。",
    derivation: "求 $R_o$ 的标准方法：令 $\\dot U_s=0$（保留 $R_s$）、断开 $R_L$，在输出端加测试电压 $\\dot U$，求 $\\dot I$，$R_o=\\dot U/\\dot I$。想一想此时 $\\dot I_b$ 等于多少？受控源又等于多少？",
    example: "空载输出 4 V，接 3 kΩ 负载后降为 3 V → $R_o=(4/3-1)\\times3\\text{ k}\\Omega=1$ kΩ。",
    keywords: ["输入电阻", "输出电阻", "Ri", "Ro", "负载", "带负载"],
  },
  "ce-distortion": {
    intuition:
      "Q 点在负载线上的位置决定了上下各有多少“摆动空间”。Q 点太低，$i_C$ 向下摆一点就碰到 0（截止）；Q 点太高，$u_{CE}$ 向下摆一点就碰到 $U_{CES}$（饱和）。对 NPN 共射，截止失真削 $u_o$ 的**顶**，饱和失真削 $u_o$ 的**底**。",
    derivation: "最大不失真输出取两者较小：$U_{om}=\\min(U_{CEQ}-U_{CES},\\ I_{CQ}R_L')$。为什么截止那一侧用的是 $R_L'$ 而不是 $R_c$？（提示：交流负载线的斜率。）",
    example: "在实验室点“截止失真”和“饱和失真”两个预设，观察示波器上 $u_o$ 哪一侧被削平，以及输出特性图上动态轨迹撞到了哪条边界。",
    keywords: ["失真", "截止", "饱和", "削顶", "削底", "最大不失真"],
  },
  "ce-example": {
    intuition: "综合题的套路永远是：先直流（画直流通路、求 Q 点、验证放大区），再交流（画交流通路 → 微变等效 → $A_u$、$R_i$、$R_o$）。",
    derivation: "做题前先问自己三个问题：哪些电容？哪些电阻会被短路？射极有没有未旁路的电阻？",
    example: "去练习中心选择 Level 3 题目，每道题都有分步提示。",
    keywords: ["例题", "综合"],
  },
  "ce-summary": {
    intuition: "整章只有一条主线：直流管 Q 点，交流管放大；两者用叠加思想分开处理——前提是电路在 Q 点附近近似线性。",
    derivation: "试着不看书，从空白开始画出：完整电路 → 直流通路 → 交流通路 → 微变等效电路，并写出 $A_u$、$R_i$、$R_o$。",
    example: "打开错题本，重做做错的题。",
    keywords: ["总结", "复习"],
  },
};

export function findSectionByKeyword(text: string): string | null {
  const t = text.replace(/\s/g, "").toLowerCase();
  let best: string | null = null;
  let score = 0;
  for (const [id, h] of Object.entries(CE_OFFLINE)) {
    const s = h.keywords.filter((k) => t.includes(k.toLowerCase())).length;
    if (s > score) {
      score = s;
      best = id;
    }
  }
  return best;
}
