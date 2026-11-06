/**
 * 课程目录与知识依赖关系（知识图谱由此生成）。
 * status:
 *  - "complete"：正文、交互、练习齐备，生成页面
 *  - "planned"：仅在目录中展示学习目标，不生成空壳页面
 */
export type UnitStatus = "complete" | "planned";

export interface SectionMeta {
  id: string;
  title: string;
  /** 本知识点回答的核心问题 */
  questions?: string[];
}

export interface Unit {
  id: string;
  chapter: number;
  title: string;
  summary: string;
  objectives: string[];
  status: UnitStatus;
  prereqs: string[];
  /** 对应教材章节（童诗白/华成英 第 4–5 版） */
  textbook: string;
  sections?: SectionMeta[];
  /** 预计学习时长（分钟），仅用于规划 */
  minutes?: number;
}

export interface Chapter {
  n: number;
  title: string;
  en: string;
  blurb: string;
}

export const CHAPTERS: Chapter[] = [
  { n: 1, title: "半导体基础", en: "Semiconductor Fundamentals", blurb: "载流子、PN 结与二极管：一切模拟器件的物理起点。" },
  { n: 2, title: "双极型晶体管", en: "Bipolar Junction Transistors", blurb: "用基极电流控制集电极电流——受控源思想的诞生。" },
  { n: 3, title: "基本放大电路", en: "Basic BJT Amplifiers", blurb: "偏置、通路、小信号模型：放大电路分析方法的完整框架。" },
  { n: 4, title: "场效应晶体管", en: "Field-Effect Transistors", blurb: "电压控制电流的器件，以及共源、共漏、共栅放大。" },
  { n: 5, title: "多级放大电路", en: "Multistage Amplifiers", blurb: "耦合方式、级间负载效应与总增益。" },
  { n: 6, title: "差分放大电路", en: "Differential Amplifiers", blurb: "放大差模、抑制共模：集成电路的输入级。" },
  { n: 7, title: "集成运算放大器", en: "Operational Amplifiers", blurb: "虚短与虚断，以及比例、加减、积分、微分运算。" },
  { n: 8, title: "反馈放大电路", en: "Feedback Amplifiers", blurb: "四种负反馈组态如何改变增益、阻抗与稳定性。" },
  { n: 9, title: "频率响应", en: "Frequency Response", blurb: "截止频率、波特图与米勒效应。" },
  { n: 10, title: "功率放大电路", en: "Power Amplifiers", blurb: "效率、交越失真与 OCL/OTL 电路。" },
  { n: 11, title: "信号产生与处理", en: "Oscillators & Active Filters", blurb: "振荡条件、RC/LC 振荡器与有源滤波器。" },
  { n: 12, title: "直流稳压电源", en: "DC Power Supplies", blurb: "整流、滤波、稳压：把市电变成干净的直流。" },
];

const P = (
  id: string,
  chapter: number,
  title: string,
  summary: string,
  objectives: string[],
  prereqs: string[],
  textbook: string,
): Unit => ({ id, chapter, title, summary, objectives, prereqs, textbook, status: "planned" });

export const CE_SECTIONS: SectionMeta[] = [
  {
    id: "ce-why",
    title: "三极管为什么能放大",
    questions: ["三极管为什么能够放大信号？", "放大电路的能量来自哪里？"],
  },
  {
    id: "ce-bias",
    title: "直流偏置与静态工作点",
    questions: ["为什么需要直流偏置？", "什么是静态工作点？", "为什么输入增大，输出反而减小？"],
  },
  {
    id: "ce-dc",
    title: "直流通路与静态分析",
    questions: ["为什么直流分析时电容开路？"],
  },
  {
    id: "ce-ac",
    title: "交流通路",
    questions: ["为什么中频交流分析时电容可以近似短路？", "为什么直流电源在交流等效电路中接地？"],
  },
  {
    id: "ce-hparam",
    title: "微变等效电路",
    questions: ["什么是微变等效模型？", "为什么可以使用 r_be 表示输入端的小信号特性？"],
  },
  {
    id: "ce-gain",
    title: "电压放大倍数",
    questions: ["电压放大倍数如何推导？"],
  },
  {
    id: "ce-rio",
    title: "输入电阻与输出电阻",
    questions: ["输入电阻和输出电阻有什么物理意义？", "为什么负载会影响电压增益？"],
  },
  {
    id: "ce-distortion",
    title: "图解法、失真与最大不失真输出",
    questions: ["为什么静态工作点不合适会导致失真？"],
  },
  { id: "ce-example", title: "综合例题" },
  { id: "ce-summary", title: "总结与易错点" },
];

export const UNITS: Unit[] = [
  // ── 第 1 章 ──
  P("semi-carriers", 1, "本征半导体与载流子", "共价键、自由电子与空穴，本征激发与复合。", ["解释空穴是如何“移动”的", "理解本征载流子浓度随温度指数变化"], [], "第 1 章 1.1"),
  P("semi-doped", 1, "杂质半导体", "N 型与 P 型半导体，多子与少子。", ["区分多子/少子的来源", "理解少子浓度为何对温度敏感"], ["semi-carriers"], "第 1 章 1.1"),
  P("pn-junction", 1, "PN 结与单向导电性", "扩散与漂移、空间电荷区、正偏与反偏。", ["从扩散/漂移平衡解释内电场", "写出 PN 结电流方程并说明各项含义"], ["semi-doped"], "第 1 章 1.1"),
  P("diode", 1, "二极管伏安特性与模型", "理想、恒压降、折线与小信号模型。", ["根据精度要求选择二极管模型", "判断电路中二极管的通断"], ["pn-junction"], "第 1 章 1.2"),
  P("zener", 1, "稳压二极管", "反向击穿区的稳压原理与限流电阻设计。", ["说明稳压管为何必须串限流电阻", "计算稳压电路的电流范围"], ["diode"], "第 1 章 1.2"),
  P("diode-circuits", 1, "整流与限幅电路", "半波/全波整流、限幅与钳位。", ["画出整流与限幅电路的输出波形"], ["diode"], "第 1 章 1.2"),
  // ── 第 2 章 ──
  P("bjt-structure", 2, "晶体管结构与放大的内部条件", "NPN/PNP 结构，发射区高掺杂、基区薄而轻掺杂。", ["说明放大的内部条件与外部条件", "识别 NPN/PNP 符号与电极"], ["pn-junction"], "第 1 章 1.3"),
  P("bjt-currents", 2, "电流分配与 β、α", "载流子传输过程与 I_E = I_B + I_C。", ["推导 β 与 α 的关系", "解释 I_CEO 与温度的关系"], ["bjt-structure"], "第 1 章 1.3"),
  P("bjt-curves", 2, "特性曲线与三个工作区", "输入/输出特性曲线，截止、放大、饱和。", ["由电极电位判断工作区与管型", "在输出特性上标出三个区域"], ["bjt-currents"], "第 1 章 1.3"),
  P("bjt-params", 2, "主要参数与安全工作区", "β、I_CBO、I_CEO、P_CM、I_CM、U_(BR)CEO。", ["根据极限参数确定安全工作区"], ["bjt-curves"], "第 1 章 1.3"),
  // ── 第 3 章 ──
  {
    id: "ce-amplifier",
    chapter: 3,
    title: "共射极放大电路",
    summary:
      "从“小信号控制大能量”出发，完整建立 Q 点 → 直流通路 → 交流通路 → 微变等效 → A_u、R_i、R_o → 失真分析的方法链。",
    objectives: [
      "解释放大的能量来源与直流偏置的必要性",
      "画出直流通路、交流通路与微变等效电路",
      "估算 Q 点并判断工作区",
      "推导并计算 A_u、R_i、R_o（含射极电阻、负载与信号源内阻）",
      "用负载线判断截止/饱和失真并求最大不失真输出",
    ],
    status: "complete",
    prereqs: ["bjt-curves"],
    textbook: "第 2 章 2.1–2.4",
    sections: CE_SECTIONS,
    minutes: 180,
  },
  P("divider-bias", 3, "分压式偏置与 Q 点稳定", "温度/β 变化如何使 Q 点漂移，R_e 直流负反馈如何稳定 Q 点。", ["解释分压偏置稳定 Q 点的反馈过程", "判断估算法的适用条件"], ["ce-amplifier"], "第 2 章 2.4"),
  P("cc-amplifier", 3, "共集电极放大电路（射极跟随器）", "A_u≈1、高输入电阻、低输出电阻。", ["推导共集电路的 A_u、R_i、R_o", "说明其作为缓冲级的作用"], ["ce-amplifier"], "第 2 章 2.5"),
  P("cb-amplifier", 3, "共基极放大电路", "电流跟随、低输入电阻、良好的高频特性。", ["推导共基电路的 A_u、R_i、R_o", "比较三种组态"], ["ce-amplifier"], "第 2 章 2.5"),
  // ── 第 4 章 ──
  P("mos-structure", 4, "MOSFET 结构与工作原理", "沟道形成、增强型与耗尽型。", ["说明 U_GS(th) 的物理意义"], ["pn-junction"], "第 1 章 1.4"),
  P("mos-curves", 4, "转移特性与输出特性", "截止区、可变电阻区、恒流区（饱和区）。", ["写出恒流区平方律方程", "区分 FET 的“饱和区”与 BJT 的饱和区"], ["mos-structure"], "第 1 章 1.4"),
  P("fet-small-signal", 4, "跨导与小信号模型", "g_m 的定义与求法。", ["由 Q 点求 g_m"], ["mos-curves", "ce-amplifier"], "第 2 章 2.6"),
  P("cs-amplifier", 4, "共源放大电路", "自给偏压与分压偏置，A_u = −g_m R_D'。", ["完成共源电路的静态与动态分析"], ["fet-small-signal"], "第 2 章 2.6"),
  P("cd-cg-amplifier", 4, "共漏与共栅放大电路", "源极跟随器与共栅电路。", ["比较 FET 三种组态"], ["cs-amplifier"], "第 2 章 2.6"),
  // ── 第 5 章 ──
  P("multistage-coupling", 5, "耦合方式", "阻容耦合、直接耦合、变压器耦合与光电耦合。", ["说明各耦合方式的优缺点"], ["ce-amplifier", "cc-amplifier"], "第 3 章 3.1"),
  P("multistage-analysis", 5, "多级放大电路的动态分析", "级间负载效应：后级输入电阻是前级负载。", ["计算多级电路的总增益与输入输出电阻"], ["multistage-coupling"], "第 3 章 3.2"),
  P("zero-drift", 5, "直接耦合与零点漂移", "温漂的来源与抑制方法。", ["解释为什么直接耦合需要差分输入级"], ["multistage-coupling"], "第 3 章 3.3"),
  // ── 第 6 章 ──
  P("diff-signals", 6, "差模信号与共模信号", "任意两输入的差模/共模分解。", ["把任意输入分解为差模与共模分量"], ["zero-drift"], "第 3 章 3.3"),
  P("current-source", 6, "电流源电路", "镜像电流源、比例电流源、微电流源。", ["分析镜像电流源的输出电流"], ["divider-bias"], "第 4 章 4.2"),
  P("diff-amplifier", 6, "差分放大电路与 CMRR", "长尾电路、恒流源差放，四种输入输出方式。", ["计算 A_d、A_c 与 K_CMR"], ["diff-signals", "current-source"], "第 3 章 3.3"),
  // ── 第 7 章 ──
  P("opamp-ideal", 7, "理想运放与虚短虚断", "开环增益、线性区与非线性区。", ["说明虚短、虚断的成立条件"], ["diff-amplifier"], "第 4 章 / 第 7 章"),
  P("opamp-proportional", 7, "比例运算电路", "反相比例、同相比例、电压跟随器。", ["推导反相/同相比例运算关系"], ["opamp-ideal"], "第 7 章 7.1"),
  P("opamp-arith", 7, "加法与减法运算", "求和电路与差分比例电路。", ["用叠加原理分析加减运算电路"], ["opamp-proportional"], "第 7 章 7.1"),
  P("opamp-integrator", 7, "积分与微分运算", "电容的 i = C du/dt 与运放结合。", ["画出积分电路的输出波形"], ["opamp-proportional"], "第 7 章 7.1"),
  // ── 第 8 章 ──
  P("fb-concept", 8, "反馈的基本概念", "开环、闭环、反馈系数与净输入量。", ["写出 A_f = A/(1+AF) 并解释 1+AF"], ["ce-amplifier", "opamp-proportional"], "第 6 章 6.1"),
  P("fb-judge", 8, "反馈类型判断", "瞬时极性法、电压/电流、串联/并联。", ["判断任意电路的反馈组态"], ["fb-concept"], "第 6 章 6.2"),
  P("fb-effects", 8, "负反馈对放大电路的影响", "稳定增益、展宽频带、改变输入输出电阻。", ["说明四种组态对 R_i、R_o 的影响"], ["fb-judge"], "第 6 章 6.4–6.5"),
  P("fb-deep", 8, "深度负反馈下的估算", "A_f ≈ 1/F 与虚短虚断的统一。", ["估算深度负反馈电路的电压放大倍数"], ["fb-effects"], "第 6 章 6.3"),
  P("fb-stability", 8, "负反馈放大电路的稳定性", "自激振荡条件、增益裕度与相位裕度。", ["用波特图判断稳定性"], ["fb-effects", "freq-multistage"], "第 6 章 6.6"),
  // ── 第 9 章 ──
  P("freq-basics", 9, "频率响应的基本概念", "RC 高通/低通、截止频率与波特图。", ["画出一阶 RC 电路的波特图"], ["ce-amplifier"], "第 5 章 5.1"),
  P("freq-hybrid-pi", 9, "晶体管的高频等效模型", "混合 π 模型、f_β 与 f_T。", ["由 h 参数推出混合 π 参数"], ["freq-basics"], "第 5 章 5.2"),
  P("freq-single-stage", 9, "单管放大电路的频率响应", "低频由耦合/旁路电容决定，高频由结电容与米勒效应决定。", ["计算共射电路的 f_L、f_H", "解释米勒效应"], ["freq-hybrid-pi"], "第 5 章 5.3"),
  P("freq-multistage", 9, "多级放大电路的频率响应", "多级级联后带宽变窄。", ["估算多级电路的上下限频率"], ["freq-single-stage", "multistage-analysis"], "第 5 章 5.4"),
  // ── 第 10 章 ──
  P("pa-classes", 10, "功放的特点与甲、乙、甲乙类", "导通角与效率。", ["比较各类功放的效率与失真"], ["cc-amplifier"], "第 9 章 9.1"),
  P("pa-ocl", 10, "OCL 互补对称功放", "最大输出功率与效率 78.5% 的推导。", ["计算 P_om、P_V、η 与管耗"], ["pa-classes"], "第 9 章 9.2"),
  P("pa-crossover", 10, "交越失真与 OTL 电路", "偏置二极管消除交越失真；单电源 OTL。", ["说明交越失真的成因与消除方法"], ["pa-ocl"], "第 9 章 9.2"),
  // ── 第 11 章 ──
  P("osc-condition", 11, "正弦波振荡的条件", "AF = 1：幅值平衡与相位平衡，起振条件。", ["区分起振条件与平衡条件"], ["fb-effects"], "第 8 章 8.1"),
  P("osc-rc", 11, "RC 桥式正弦波振荡器", "文氏桥选频网络，f_0 = 1/(2πRC)。", ["计算振荡频率与起振所需增益"], ["osc-condition", "opamp-proportional"], "第 8 章 8.1"),
  P("osc-lc", 11, "LC 正弦波振荡器", "变压器反馈式、电感/电容三点式。", ["判断三点式电路能否振荡"], ["osc-condition"], "第 8 章 8.1"),
  P("active-filter", 11, "有源滤波器", "一阶/二阶低通、高通、带通。", ["推导一阶有源低通的传递函数"], ["opamp-proportional", "freq-basics"], "第 7 章 7.3"),
  // ── 第 12 章 ──
  P("rectifier", 12, "整流电路", "单相半波与桥式整流，U_O(AV) = 0.9U_2。", ["计算整流输出平均值与二极管参数"], ["diode-circuits"], "第 10 章 10.2"),
  P("ripple-filter", 12, "滤波电路", "电容滤波，U_O(AV) ≈ 1.2U_2 的条件。", ["估算电容滤波的输出电压与纹波"], ["rectifier"], "第 10 章 10.3"),
  P("zener-regulator", 12, "稳压管稳压电路", "限流电阻的取值范围。", ["设计稳压管稳压电路"], ["zener", "ripple-filter"], "第 10 章 10.4"),
  P("series-regulator", 12, "串联型稳压电路", "调整管 + 基准 + 比较放大 + 采样：一个电压串联负反馈系统。", ["推导输出电压调节范围"], ["zener-regulator", "fb-deep"], "第 10 章 10.5"),
];

export const UNIT_BY_ID: Record<string, Unit> = Object.fromEntries(UNITS.map((u) => [u.id, u]));

export function unitsOfChapter(n: number): Unit[] {
  return UNITS.filter((u) => u.chapter === n);
}

export function completeUnits(): Unit[] {
  return UNITS.filter((u) => u.status === "complete");
}

export function sectionKey(unitId: string, sectionId: string) {
  return `${unitId}#${sectionId}`;
}
