/**
 * Level 1 概念题（原创）。考点参考了常见期末题型的分布，题干与选项为本项目自行编写。
 */
import { GENERATORS } from "./generators";
import { CHAPTER_TEMPLATES } from "./chapters";
import type { Level, Question, QuestionTemplate } from "./types";

function choice(
  id: string,
  topic: string,
  title: string,
  prompt: string,
  options: string[],
  answer: number,
  why: string[],
  hints: string[],
  solution: string,
): QuestionTemplate {
  const q: Question = { key: id, id, level: 1, topic, title, prompt, body: { kind: "choice", options, answer, why }, hints, solution };
  return { id, level: 1, topic, title, fixed: q };
}

function judge(id: string, topic: string, title: string, prompt: string, answer: boolean, why: string, hints: string[]): QuestionTemplate {
  const q: Question = { key: id, id, level: 1, topic, title, prompt, body: { kind: "judge", answer, why }, hints, solution: why };
  return { id, level: 1, topic, title, fixed: q };
}

function concept(id: string, topic: string, title: string, prompt: string, keyPoints: string[], reference: string, level: Level = 1): QuestionTemplate {
  const q: Question = { key: id, id, level, topic, title, prompt, body: { kind: "concept", keyPoints, reference }, hints: ["先想清楚涉及哪条物理规律或哪个器件模型。"], solution: reference };
  return { id, level, topic, title, fixed: q };
}

export const STATIC_QUESTIONS: QuestionTemplate[] = [
  choice(
    "c-energy",
    "ce-why",
    "输出功率的来源",
    "共射放大电路中，负载上得到的交流信号功率比信号源送入的功率大得多。多出来的能量主要来自：",
    ["晶体管本身", "直流电源 $V_{CC}$", "耦合电容 $C_1$、$C_2$", "信号源"],
    1,
    ["晶体管是受控元件，本身不产生能量。", "正确：晶体管按输入信号的规律控制直流电源提供的能量。", "电容只储存和交换能量，平均功率为零。", "信号源只提供很小的控制功率。"],
    ["想一想能量守恒：哪一个元件能持续提供平均功率？"],
    "放大的实质是能量的控制与转换，能量来自直流电源。",
  ),
  choice(
    "c-active-cond",
    "ce-why",
    "放大区的外部条件",
    "NPN 晶体管工作在放大区时，三个电极的电位关系是：",
    ["$V_C>V_B>V_E$", "$V_B>V_C>V_E$", "$V_E>V_B>V_C$", "$V_B>V_E$ 且 $V_B>V_C$"],
    0,
    ["正确：发射结正偏（$V_B>V_E$），集电结反偏（$V_C>V_B$）。", "集电结正偏，这是饱和区。", "这是 PNP 管放大区的电位关系。", "两个结都正偏，饱和区。"],
    ["放大区：发射结正偏、集电结反偏。", "NPN 管“正偏”指 P 区（基区）电位高于 N 区。"],
    "放大区外部条件：发射结正偏，集电结反偏。",
  ),
  judge(
    "j-beta-sat",
    "ce-why",
    "i_C = βi_B 的适用范围",
    "只要晶体管导通，关系 $i_C=\\beta i_B$ 就成立。",
    false,
    "错误。$i_C=\\beta i_B$ 只在放大区成立；饱和区 $i_C<\\beta i_B$，此时 $i_C$ 主要由外电路（$V_{CC}$、$R_c$）决定。",
    ["回忆输出特性曲线在饱和区的形状。"],
  ),
  choice(
    "c-bias-why",
    "ce-bias",
    "为什么需要直流偏置",
    "放大电路必须设置合适静态工作点的主要原因是：",
    ["降低电路的功耗", "使交流信号在整个周期内都工作在放大区", "提高输入电阻", "防止电容击穿"],
    1,
    ["设置偏置反而要消耗直流功率。", "正确：没有偏置，发射结在信号的大部分时间不导通，信号无法被线性放大。", "输入电阻主要由偏置电阻和 $r_{be}$ 决定，这不是设置偏置的目的。", "与电容无关。"],
    ["发射结导通需要大约多少伏？毫伏级的信号能跨过去吗？"],
    "偏置把晶体管预先设置在放大区，信号在 Q 点附近变化。",
  ),
  choice(
    "c-phase",
    "ce-bias",
    "共射电路的相位关系",
    "基本共射放大电路中，输出电压 $u_o$ 与输入电压 $u_i$ 的相位差为：",
    ["0°", "90°", "180°", "不确定"],
    2,
    ["共集电路才是同相。", "纯电阻性的中频电路不会产生 90° 相移。", "正确：$u_i\\uparrow\\Rightarrow i_C\\uparrow\\Rightarrow u_{CE}=V_{CC}-i_CR_c\\downarrow$，反相。", "中频区相位关系是确定的。"],
    ["沿着 $u_i\\to i_B\\to i_C\\to u_{CE}$ 推一遍。"],
    "共射电路输出与输入反相。",
  ),
  choice(
    "c-dc-path",
    "ce-dc",
    "直流通路的画法",
    "画放大电路的直流通路时，正确的做法是：",
    ["电容短路，电感开路", "电容开路，电感短路", "电容开路，电感开路", "电容短路，电感短路"],
    1,
    ["反了。", "正确：直流稳态下 $i_C=C\\,\\mathrm du/\\mathrm dt=0$（开路），$u_L=L\\,\\mathrm di/\\mathrm dt=0$（短路）。", "理想电感对直流没有压降。", "电容不能通过直流。"],
    ["写出电容和电感的伏安关系，令所有量不随时间变化。"],
    "直流通路：电容开路、电感短路、交流源置零。",
  ),
  choice(
    "c-rb-move",
    "ce-dc",
    "R_b 对 Q 点的影响",
    "固定偏置共射电路中，其他参数不变，把 $R_b$ 减小，Q 点将：",
    ["沿直流负载线向截止区移动", "沿直流负载线向饱和区移动", "直流负载线平移", "不变"],
    1,
    ["$R_b$ 减小使 $I_{BQ}$ 增大，Q 点应上移。", "正确：$I_{BQ}=(V_{CC}-U_{BEQ})/R_b$ 增大 → $I_{CQ}$ 增大、$U_{CEQ}$ 减小。", "负载线由 $V_{CC}$ 与 $R_c$ 决定，$R_b$ 不改变它。", "Q 点由 $I_{BQ}$ 决定，会变。"],
    ["哪些元件决定直流负载线？哪个量决定 Q 点在负载线上的位置？"],
    "$R_b$ 只改变 $I_{BQ}$，Q 点沿负载线移动。",
  ),
  choice(
    "c-ac-path",
    "ce-ac",
    "交流通路的画法",
    "中频时画放大电路的交流通路，正确的做法是：",
    ["直流电源开路，大电容开路", "直流电源短路，大电容开路", "直流电源短路（交流接地），大电容短路", "直流电源开路，大电容短路"],
    2,
    ["两处都错。", "大电容在中频时容抗很小，应短路。", "正确：理想直流电压源交流分量为零 → 交流接地；中频时容抗远小于电路电阻 → 短路。", "电压源置零是短路，不是开路。"],
    ["电压源“置零”意味着两端电压为零——那是短路还是开路？"],
    "交流通路：直流电压源交流接地，耦合/旁路电容短路。",
  ),
  judge(
    "j-cap-short-always",
    "ce-ac",
    "电容在交流通路中总是短路吗",
    "在任何频率下，耦合电容在交流通路中都可以视为短路。",
    false,
    "错误。只有在中频区、容抗 $1/(\\omega C)$ 远小于与之串联的电阻时才可视为短路；频率接近或低于下限截止频率 $f_L$ 时必须计入容抗。",
    ["$X_C$ 与频率有什么关系？"],
  ),
  choice(
    "c-rbe-meaning",
    "ce-hparam",
    "r_be 的含义",
    "关于 $r_{be}$，下列说法正确的是：",
    ["$r_{be}=U_{BEQ}/I_{BQ}$，是发射结的直流电阻", "$r_{be}$ 是 Q 点处输入特性切线斜率的倒数，只能用于交流小信号分析", "$r_{be}$ 是常数，与静态工作点无关", "$r_{be}$ 可用于计算静态工作点"],
    1,
    ["这是直流电阻，比 $r_{be}$ 大一个数量级以上。", "正确：$r_{be}=r_{bb'}+(1+\\beta)U_T/I_{EQ}$ 是动态电阻。", "$r_{be}$ 随 $I_{EQ}$ 变化。", "动态电阻不能用于直流计算。"],
    ["$r_{be}$ 的表达式中含有哪个静态量？"],
    "$r_{be}$ 是动态电阻，由 Q 点决定，只用于交流分析。",
  ),
  choice(
    "c-hparam-cond",
    "ce-hparam",
    "h 参数模型的适用条件",
    "可以用简化 h 参数微变等效电路分析放大电路的条件是：",
    ["高频大信号", "低频（中频）小信号，且晶体管工作在放大区", "任意信号，只要晶体管导通", "直流信号"],
    1,
    ["高频时结电容不能忽略；大信号时线性化失效。", "正确。", "饱和或截止时模型失效；大信号时线性化失效。", "微变模型只描述变化量。"],
    ["“微变”二字说明了什么？"],
    "低频小信号、放大区。",
  ),
  choice(
    "c-ce-open",
    "ce-gain",
    "旁路电容开路的影响",
    "分压偏置共射电路中，射极电阻原本被 $C_e$ 完全旁路。若 $C_e$ 开路，则：",
    ["$|\\dot A_u|$ 增大，$R_i$ 减小", "$|\\dot A_u|$ 减小，$R_i$ 增大，Q 点不变", "Q 点改变，$|\\dot A_u|$ 不变", "$R_o$ 显著减小"],
    1,
    ["方向反了。", "正确：$R_e$ 进入交流通路，分母变为 $r_{be}+(1+\\beta)R_e$；电容不影响直流，Q 点不变。", "电容开路不影响直流通路。", "$R_o\\approx R_c$ 基本不变。"],
    ["$C_e$ 开路后，交流通路中多了哪个元件？它怎样出现在 $\\dot A_u$ 和 $R_i$ 中？"],
    "$|\\dot A_u|$ 减小、$R_i$ 增大、$R_o$ 与 Q 点基本不变。",
  ),
  choice(
    "c-rl-gain",
    "ce-rio",
    "负载对增益的影响",
    "共射放大电路的负载电阻 $R_L$ 增大时（其他不变），$|\\dot A_u|$ 将：",
    ["增大", "减小", "不变", "先增后减"],
    0,
    ["正确：$R_L'=R_c\\para R_L$ 增大，$|\\dot A_u|=\\beta R_L'/r_{be}$ 增大（上限为空载时的 $\\beta R_c/r_{be}$）。", "方向反了。", "$R_L$ 出现在 $R_L'$ 中。", "单调关系。"],
    ["$\\dot A_u$ 中哪个量含有 $R_L$？"],
    "$R_L$ 越大，$R_L'$ 越大，$|\\dot A_u|$ 越大。",
  ),
  judge("j-ri-rs", "ce-rio", "输入电阻是否包含 R_s", "放大电路的输入电阻 $R_i$ 包含信号源内阻 $R_s$。", false, "错误。$R_i$ 是从放大电路输入端看进去的电阻，与 $R_s$ 无关；$R_s$ 与 $R_i$ 构成分压。", ["$R_i$ 的定义是从哪里“看进去”？"]),
  judge("j-ro-rl", "ce-rio", "输出电阻是否包含 R_L", "求放大电路的输出电阻时，应保留负载 $R_L$。", false, "错误。求 $R_o$ 时要令信号源置零（保留 $R_s$）、**断开** $R_L$，在输出端加测试电压。$R_o$ 与 $R_L$ 无关。", ["$R_o$ 描述的是放大电路自身的什么性质？"]),
  choice(
    "c-cutoff-shape",
    "ce-distortion",
    "截止失真的波形",
    "NPN 管基本共射放大电路出现截止失真时，输出电压 $u_o$ 的波形：",
    ["顶部被削平", "底部被削平", "上下都被削平", "不会削波，只是幅度变小"],
    0,
    ["正确：$i_C$ 不能低于 0，$u_{CE}$ 不能再升高，对应 $u_o$ 的正半周（顶部）被削平。", "这是 NPN 共射的饱和失真。", "这是输入过大引起的双向削波。", "截止会使波形削平。"],
    ["截止时哪个电流不能再减小？由 $u_{CE}=V_{CC}-i_CR_c$ 看 $u_{CE}$ 哪一侧受限。"],
    "NPN 共射：截止削顶、饱和削底。",
  ),
  choice(
    "c-sat-fix",
    "ce-distortion",
    "消除饱和失真",
    "固定偏置 NPN 共射电路输出出现底部削平失真，为消除失真可以：",
    ["减小 $R_b$", "增大 $R_b$", "增大 $R_c$", "增大输入信号"],
    1,
    ["$R_b$ 减小使 Q 点更高，饱和更严重。", "正确：底部削平是饱和失真，Q 点偏高；增大 $R_b$ 使 $I_{BQ}$ 减小，Q 点下移。", "$R_c$ 增大使 $U_{CEQ}$ 减小，更易饱和。", "会使失真更严重。"],
    ["底部削平是哪种失真？Q 点偏高还是偏低？"],
    "饱和失真 → Q 点偏高 → 增大 $R_b$ 使 Q 点下移。",
  ),
  concept(
    "k-cap-dc",
    "ce-dc",
    "解释：为什么直流分析时电容开路",
    "用自己的话解释：为什么求静态工作点时可以把耦合电容看作开路？这个结论在什么情况下不成立？",
    ["电容的伏安关系 $i=C\\,\\mathrm du/\\mathrm dt$", "直流稳态时电压不随时间变化，$\\mathrm du/\\mathrm dt=0$，电流为零", "通电瞬间的暂态（充电过程）中电容不是开路", "电容存在漏电时严格来说不是理想开路（工程上忽略）"],
    "直流稳态下电容两端电压恒定，$i=C\\,\\mathrm du/\\mathrm dt=0$，相当于开路；但在通电后的充电暂态中，电容中有电流流过，不能视为开路。",
  ),
  concept(
    "k-gain-vcc",
    "ce-why",
    "解释：放大电路的能量从哪里来",
    "有人说“三极管能把小信号放大，所以三极管产生了能量”。指出这个说法的错误，并解释放大的本质。",
    ["输出信号的能量来自直流电源 $V_{CC}$", "晶体管是受控元件：小的 $i_B$ 控制大的 $i_C$", "能量守恒：$P_V=P_o+P_{管耗}+P_{R_c}$", "放大的本质是能量的控制与转换"],
    "晶体管不产生能量。它是一个受控元件：用小的基极电流控制由直流电源提供的大的集电极电流，使输出按输入的规律变化。输出的交流功率来自 $V_{CC}$，整体满足能量守恒。",
  ),
  concept(
    "k-re-gain",
    "ce-gain",
    "解释：为什么有 R_e 时不能套用 −βR_L′/r_be",
    "射极接有未被旁路的电阻 $R_e$ 时，为什么不能直接使用 $\\dot A_u=-\\beta R_L'/r_{be}$？应怎样重新推导？",
    ["$-\\beta R_L'/r_{be}$ 的前提是射极交流接地", "$R_e$ 中流过 $\\dot I_e=(1+\\beta)\\dot I_b$", "输入回路：$\\dot U_i=\\dot I_b[r_{be}+(1+\\beta)R_e]$", "结果 $\\dot A_u=-\\beta R_L'/[r_{be}+(1+\\beta)R_e]$，$|\\dot A_u|$ 减小但更稳定"],
    "该公式成立的前提是发射极交流接地，此时 $\\dot U_i=\\dot I_b r_{be}$。有未旁路 $R_e$ 时，$R_e$ 上的电流是 $(1+\\beta)\\dot I_b$，输入回路变为 $\\dot U_i=\\dot I_b[r_{be}+(1+\\beta)R_e]$，所以 $\\dot A_u=-\\beta R_L'/[r_{be}+(1+\\beta)R_e]$。",
    2,
  ),
];

export const ALL_TEMPLATES: QuestionTemplate[] = [...STATIC_QUESTIONS, ...GENERATORS, ...CHAPTER_TEMPLATES];

export const TEMPLATE_BY_ID: Record<string, QuestionTemplate> = Object.fromEntries(ALL_TEMPLATES.map((t) => [t.id, t]));

/** 由实例键还原题目（错题本使用） */
export function questionFromKey(key: string): Question | null {
  const [id, seedStr] = key.split(":");
  const t = TEMPLATE_BY_ID[id];
  if (!t) return null;
  if (t.fixed) return t.fixed;
  if (t.generate) return t.generate(Number(seedStr) || 1);
  return null;
}

export function instantiate(t: QuestionTemplate, seed: number): Question {
  if (t.fixed) return t.fixed;
  return t.generate!(seed);
}
