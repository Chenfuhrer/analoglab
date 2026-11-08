/** 第 2 章题库（原创）：晶体管结构、电流分配、特性曲线、参数与安全工作区 */
import { alphaFromBeta, atTemperature, betaFromAlpha, currentsFromIB, judgeActivePins, REGION_LABEL, regionFromPotentials, soaCheck, solveSimpleBias, type Region } from "@/simulations/bjt/device";
import { formatSI, sig } from "@/simulations/units";
import { e12 } from "../generators";
import { choice, concept, gen, judge, num } from "../helpers";
import type { QuestionTemplate } from "../types";

const V = (x: number) => formatSI(x, "V");
const A = (x: number) => formatSI(x, "A");
const R = (x: number) => formatSI(x, "Ω");
const REGIONS: Region[] = ["active", "saturation", "cutoff"];

/* ═════════════ 结构 ═════════════ */
const T1 = "bjt-structure";
const structQ: QuestionTemplate[] = [
  choice({
    id: "bs-c-internal",
    topic: T1,
    title: "放大的内部条件",
    prompt: "下列哪一项**不是**晶体管具有电流放大作用的内部条件？",
    options: ["发射区掺杂浓度高", "基区很薄且掺杂浓度低", "集电结面积大", "集电区掺杂浓度比发射区高"],
    answer: 3,
    why: ["是内部条件：保证注入足够多的载流子。", "是内部条件：保证复合少。", "是内部条件：便于收集。", "正确：集电区掺杂浓度通常**低于**发射区，所以 e、c 不能互换使用。"],
    hints: ["想想发射区与集电区为什么不能对调。"],
  }),
  choice({
    id: "bs-c-external",
    topic: T1,
    title: "放大的外部条件",
    prompt: "晶体管工作在放大区时，两个 PN 结的偏置状态是：",
    options: ["发射结正偏、集电结正偏", "发射结正偏、集电结反偏", "发射结反偏、集电结正偏", "发射结反偏、集电结反偏"],
    answer: 1,
    why: ["这是饱和区。", "正确。", "这是倒置工作状态，基本不用。", "这是截止区。"],
    hints: ["发射结负责“注入”，集电结负责“收集”。"],
  }),
  judge({
    id: "bs-j-diodes",
    topic: T1,
    title: "两个二极管能否组成三极管",
    prompt: "把两只二极管的阳极连在一起作为基极，就得到一只 NPN 晶体管。",
    answer: false,
    why: "错误。这样得到的“基区”很厚，从一个结注入的电子在到达另一个结之前几乎全部复合，没有电流放大作用。放大要求基区非常薄。",
    hints: ["基区的厚度为什么重要？"],
  }),
  choice({
    id: "bs-c-config",
    topic: T1,
    title: "判断组态",
    prompt: "某放大电路中，信号从晶体管的基极输入、从发射极输出，集电极直接接 $V_{CC}$。该电路是：",
    options: ["共射组态", "共集组态", "共基组态", "无法判断"],
    answer: 1,
    why: ["共射是 c 输出。", "正确：$V_{CC}$ 在交流通路中接地，集电极是公共端。", "共基是 e 输入。", "b 入 e 出，可以判断。"],
    hints: ["交流通路中 $V_{CC}$ 相当于什么？"],
    level: 2,
  }),
  choice({
    id: "bs-c-arrow",
    topic: T1,
    title: "符号中的箭头",
    prompt: "晶体管符号中发射极上的箭头方向表示：",
    options: ["电子运动方向", "发射结正偏时的电流方向", "信号传输方向", "集电极电流方向"],
    answer: 1,
    why: ["电流方向与电子运动方向相反。", "正确：NPN 箭头向外（b→e），PNP 箭头向里（e→b）。", "与信号无关。", "箭头画在发射极上。"],
    hints: ["NPN 和 PNP 的箭头方向为什么不同？"],
    level: 2,
  }),
  choice({
    id: "bs-c-only-b",
    topic: T1,
    title: "各电极能作输入还是输出",
    prompt: "在三种基本组态中，关于各电极的作用，正确的是：",
    options: ["基极只能作输入端，集电极只能作输出端", "三个电极都可以作输入或输出", "发射极只能作输入端", "集电极可以作输入端"],
    answer: 0,
    why: ["正确：b 入（共射、共集）、c 出（共射、共基），e 可入（共基）可出（共集）。", "集电极不能作输入（不能用集电极电流控制别的电流）。", "共集电路从发射极输出。", "集电结反偏，信号从集电极送入无法控制管子。"],
    hints: ["逐一列出三种组态的输入、输出电极。"],
    level: 2,
  }),
  concept({
    id: "bs-k-swap",
    level: 3,
    topic: T1,
    title: "e、c 能否互换",
    prompt: "晶体管的发射极和集电极都是 N 型（NPN），能否互换使用？互换后会怎样？",
    keyPoints: ["发射区掺杂浓度远高于集电区", "集电结面积大于发射结", "互换后注入效率低、收集能力差", "β 大大降低（倒置时 β_R 常小于 1）"],
    reference: "不能。发射区高掺杂而集电区低掺杂、集电结面积大，结构不对称。互换后（倒置工作）注入效率和收集效率都很低，电流放大系数通常小于 1，基本没有放大作用。",
  }),
  concept({
    id: "bs-k-energy",
    level: 3,
    topic: T1,
    title: "基区为什么要薄",
    prompt: "从载流子运动的角度解释：为什么基区必须很薄且轻掺杂？",
    keyPoints: ["注入基区的电子要扩散穿过基区", "基区薄：扩散时间短，复合机会少", "基区轻掺杂：空穴少，复合概率低", "复合少 → I_B 小 → β 大"],
    reference: "发射区注入的电子要以扩散方式穿过基区才能到达集电结。基区越薄，穿越时间越短；基区掺杂越轻，可供复合的空穴越少。二者都使复合电流（基极电流）很小，大部分电子被集电结收集，所以 $\\beta=I_C/I_B$ 很大。",
  }),
  choice({
    id: "bs-c-pnp-pot",
    topic: T1,
    title: "PNP 管放大时的电位",
    prompt: "PNP 晶体管工作在放大区时，三个电极电位的关系是：",
    options: ["$U_C>U_B>U_E$", "$U_E>U_B>U_C$", "$U_B>U_E>U_C$", "$U_B<U_C<U_E$"],
    answer: 1,
    why: ["这是 NPN 放大区。", "正确：发射结正偏（$U_E>U_B$），集电结反偏（$U_B>U_C$）。", "发射结反偏了。", "集电结正偏，是饱和区。"],
    hints: ["PNP 管“正偏”指 P 区（发射区、集电区）电位高于 N 区（基区）。"],
    level: 3,
  }),
];

/* ═════════════ 电流分配 ═════════════ */
const T2 = "bjt-currents";
const currentsQ: QuestionTemplate[] = [
  choice({
    id: "bc-c-kcl",
    topic: T2,
    title: "三个电流的关系",
    prompt: "晶体管三个电极电流之间的关系中，在任何工作区都成立的是：",
    options: ["$I_C=\\beta I_B$", "$I_E=I_B+I_C$", "$I_C=\\alpha I_E$", "$I_E\\approx I_C$"],
    answer: 1,
    why: ["只在放大区成立。", "正确：KCL，精确关系。", "只在放大区成立（且忽略 $I_{CBO}$）。", "近似关系。"],
    hints: ["哪一个是基尔霍夫电流定律？"],
  }),
  judge({
    id: "bc-j-energy",
    topic: T2,
    title: "电流放大与能量",
    prompt: "晶体管的电流放大作用，是指它能把基极电流的能量放大 $\\beta$ 倍后送到集电极。",
    answer: false,
    why: "错误。晶体管不产生能量。电流放大是“控制”关系：小的 $I_B$ 控制大的 $I_C$，$I_C$ 的能量来自集电极电源。",
    hints: ["$I_C$ 由哪个电源提供？"],
  }),
  choice({
    id: "bc-c-recomb",
    topic: T2,
    title: "基极电流的主要成分",
    prompt: "NPN 管放大时，基极电流 $I_B$ 主要来自：",
    options: ["集电区向基区漂移的电子", "注入基区的电子与空穴复合，基极电源补充空穴", "发射极电源直接流入基极的电流", "集电结的反向电流"],
    answer: 1,
    why: ["方向不对。", "正确。", "发射极电流大部分流向集电极。", "$I_{CBO}$ 方向与 $I_{BN}$ 相反，且很小。"],
    hints: ["载流子传输的三个过程：发射、复合、收集。"],
  }),
  gen({ id: "bc-g-split", level: 2, topic: T2, title: "由 I_B 求 I_C、I_E" }, (g) => {
    const beta = g.pick([40, 50, 60, 80, 100, 120, 150, 200]);
    const IB = g.pick([10, 15, 20, 25, 30, 40, 50]) * 1e-6;
    const c = currentsFromIB(IB, beta, 0);
    return {
      prompt: `某晶体管工作在放大区，$\\bar\\beta=${beta}$，测得 $I_B=${A(IB)}$（忽略 $I_{CEO}$）。求 $I_C$、$I_E$ 及 $\\bar\\alpha$。`,
      parts: [num("IC", "$I_C$", c.IC, "A", "mA"), num("IE", "$I_E$", c.IE, "A", "mA", { mistakes: [{ value: c.IC, message: "$I_E=I_B+I_C$，不能忽略 $I_B$（题目要求精确值）。" }] }), num("a", "$\\bar\\alpha$", alphaFromBeta(beta), "1", "0.99", { tol: 0.002 })],
      hints: ["$I_C=\\bar\\beta I_B$，$I_E=(1+\\bar\\beta)I_B$。", "$\\bar\\alpha=\\bar\\beta/(1+\\bar\\beta)$。"],
      solution: `$I_C=${A(c.IC)}$，$I_E=${A(c.IE)}$，$\\bar\\alpha=${sig(alphaFromBeta(beta), 4)}$。`,
    };
  }),
  gen({ id: "bc-g-alpha", level: 2, topic: T2, title: "α 与 β 的换算" }, (g) => {
    const a = g.pick([0.95, 0.96, 0.98, 0.99, 0.995]);
    const b = betaFromAlpha(a);
    return {
      prompt: `某晶体管共基电流放大系数 $\\bar\\alpha=${a}$。求 $\\bar\\beta$；若 $I_E=2$ mA，求 $I_B$。`,
      parts: [num("b", "$\\bar\\beta$", b, "1", "49"), num("IB", "$I_B$", 2e-3 * (1 - a), "A", "µA", { mistakes: [{ value: 2e-3 / b, message: "已知的是 $I_E$ 不是 $I_C$：$I_B=I_E/(1+\\bar\\beta)=(1-\\bar\\alpha)I_E$。" }] })],
      hints: ["$\\bar\\beta=\\bar\\alpha/(1-\\bar\\alpha)$。", "$I_B=I_E-I_C=(1-\\bar\\alpha)I_E$。"],
      solution: `$\\bar\\beta=${sig(b, 4)}$，$I_B=${A(2e-3 * (1 - a))}$。`,
    };
  }),
  gen({ id: "bc-g-iceo", level: 2, topic: T2, title: "穿透电流" }, (g) => {
    const beta = g.pick([50, 80, 100, 150]);
    const ICBO = g.pick([0.01, 0.1, 1, 5, 10]) * 1e-6;
    const IB = g.pick([20, 40]) * 1e-6;
    const c = currentsFromIB(IB, beta, ICBO);
    return {
      prompt: `晶体管 $\\bar\\beta=${beta}$，$I_{CBO}=${A(ICBO)}$。求穿透电流 $I_{CEO}$，以及 $I_B=${A(IB)}$ 时的 $I_C$（计入 $I_{CEO}$）。`,
      parts: [num("ICEO", "$I_{CEO}$", c.ICEO, "A", "µA", { mistakes: [{ value: beta * ICBO, message: "$I_{CEO}=(1+\\bar\\beta)I_{CBO}$，别漏了“1+”。" }] }), num("IC", "$I_C$", c.IC, "A", "mA", { tol: 0.01 })],
      hints: ["基极开路时 $I_{CBO}$ 相当于“内部基极电流”，被放大。", "$I_C=\\bar\\beta I_B+I_{CEO}$。"],
      solution: `$I_{CEO}=${A(c.ICEO)}$，$I_C=${A(c.IC)}$。`,
    };
  }),
  gen({ id: "bc-g-measure", level: 3, topic: T2, title: "由两组测量值求 β 与 β̄" }, (g) => {
    const beta = g.pick([60, 80, 100, 120]);
    const ICEO = g.pick([0, 2, 5, 10]) * 1e-6;
    const IB1 = g.pick([20, 30]) * 1e-6;
    const IB2 = IB1 + g.pick([10, 20]) * 1e-6;
    const IC1 = beta * IB1 + ICEO;
    const IC2 = beta * IB2 + ICEO;
    return {
      prompt: `在 $u_{CE}$ 不变的条件下测得：$I_B=${A(IB1)}$ 时 $I_C=${A(IC1)}$；$I_B=${A(IB2)}$ 时 $I_C=${A(IC2)}$。求交流电流放大系数 $\\beta$ 和第一组数据的直流电流放大系数 $\\bar\\beta$。`,
      parts: [num("b", "$\\beta=\\Delta I_C/\\Delta I_B$", beta, "1", "100", { tol: 0.01 }), num("bb", "$\\bar\\beta=I_C/I_B$", IC1 / IB1, "1", "100", { tol: 0.01 })],
      hints: ["交流 β 看增量，直流 β̄ 看比值。", "两者的差别来自 $I_{CEO}$。"],
      solution: `$\\beta=${sig(beta, 3)}$，$\\bar\\beta=${sig(IC1 / IB1, 4)}$${ICEO > 0 ? "（含 $I_{CEO}$，故略大于 β）" : "（$I_{CEO}$≈0 时二者相等）"}。`,
    };
  }),
  gen({ id: "bc-g-sens", level: 3, topic: T2, title: "β 对 α 的敏感性" }, (g) => {
    const a1 = g.pick([0.98, 0.99]);
    const da = g.pick([0.002, 0.003, 0.005]);
    const b1 = betaFromAlpha(a1);
    const b2 = betaFromAlpha(a1 + da);
    return {
      prompt: `两只同型号晶体管的 $\\bar\\alpha$ 分别为 ${a1} 和 ${sig(a1 + da, 4)}（只差 ${sig((da / a1) * 100, 2)}%）。它们的 $\\bar\\beta$ 分别是多少？第二只是第一只的多少倍？`,
      parts: [num("b1", "$\\bar\\beta_1$", b1, "1", "49"), num("b2", "$\\bar\\beta_2$", b2, "1", "99"), num("k", "$\\bar\\beta_2/\\bar\\beta_1$", b2 / b1, "1", "2")],
      hints: ["$\\bar\\beta=\\bar\\alpha/(1-\\bar\\alpha)$，分母 $1-\\bar\\alpha$ 很小。"],
      solution: `$\\bar\\beta_1=${sig(b1, 4)}$，$\\bar\\beta_2=${sig(b2, 4)}$，相差 ${sig(b2 / b1, 3)} 倍。β 的分散性很大，电路设计必须不依赖于 β 的精确值。`,
    };
  }),
  concept({
    id: "bc-k-iceo",
    level: 3,
    topic: T2,
    title: "解释 I_CEO 为什么被放大",
    prompt: "解释为什么基极开路时 c–e 间的穿透电流是 $(1+\\bar\\beta)I_{CBO}$，而不是 $I_{CBO}$。",
    keyPoints: ["$I_{CBO}$ 是集电结少子漂移电流，流入基区", "基极开路，这部分电流无处可去", "它的作用与外加基极电流相同，引起发射区注入", "被放大 $\\bar\\beta$ 倍：$I_{CEO}=I_{CBO}+\\bar\\beta I_{CBO}$"],
    reference: "基极开路时，集电结的反向电流 $I_{CBO}$（基区的空穴）只能经发射结流出，相当于给发射结提供了基极电流，于是引起 $\\bar\\beta I_{CBO}$ 的集电极电流，总穿透电流 $I_{CEO}=(1+\\bar\\beta)I_{CBO}$。",
  }),
];

/* ═════════════ 特性曲线与工作区 ═════════════ */
const T3 = "bjt-curves";
const curvesQ: QuestionTemplate[] = [
  choice({
    id: "bv-c-sat",
    topic: T3,
    title: "饱和区的特点",
    prompt: "晶体管工作在饱和区时：",
    options: ["$i_C=\\beta i_B$，$u_{CE}$ 较大", "$i_C<\\beta i_B$，$u_{CE}\\approx U_{CES}$（很小）", "$i_B=0$，$i_C\\approx0$", "发射结反偏"],
    answer: 1,
    why: ["这是放大区。", "正确：两结都正偏，$i_C$ 由外电路决定。", "这是截止区。", "饱和时发射结正偏。"],
    hints: ["饱和时集电结是什么偏置？"],
  }),
  judge({
    id: "bv-j-input",
    topic: T3,
    title: "输入特性随 u_CE 变化",
    prompt: "$u_{CE}$ 从 0 增大到 1 V 的过程中，晶体管的输入特性曲线向右移动；继续增大 $u_{CE}$，曲线基本不再移动。",
    answer: true,
    why: "正确。$u_{CE}$ 增大使集电结由正偏变为反偏，收集能力增强、基区复合减少，同一 $u_{BE}$ 下 $i_B$ 减小（右移）；$u_{CE}\\ge1$ V 后几乎所有电子都被收集，曲线基本重合。",
    hints: ["$u_{CE}=0$ 时两个结是什么关系？"],
  }),
  choice({
    id: "bv-c-flat",
    topic: T3,
    title: "放大区输出特性的形状",
    prompt: "放大区的输出特性曲线近似水平，说明：",
    options: ["$i_C$ 几乎只由 $i_B$ 决定，与 $u_{CE}$ 基本无关", "$i_C$ 与 $u_{CE}$ 成正比", "晶体管相当于一个电阻", "晶体管处于开关的闭合状态"],
    answer: 0,
    why: ["正确：受控电流源特性。", "那是饱和区起始段（或电阻）的特点。", "水平线代表电流源，不是电阻。", "那是饱和区。"],
    hints: ["一条水平的 $i$–$u$ 曲线代表什么元件？"],
  }),
  gen({ id: "bv-g-region", level: 2, topic: T3, title: "由电位判断工作区" }, (g) => {
    const type = g.pick(["NPN", "PNP"] as const);
    const target = g.pick(REGIONS);
    const s = type === "NPN" ? 1 : -1;
    const E = g.pick([0, 0, 1, 2]) * s;
    let B: number;
    let C: number;
    if (target === "cutoff") {
      B = E + s * g.pick([-1, 0, 0.2]);
      C = E + s * g.pick([5, 8]);
    } else {
      B = E + s * 0.7;
      C = target === "active" ? E + s * g.pick([2, 4, 6]) : E + s * g.pick([0.2, 0.3]);
    }
    const reg = regionFromPotentials(type, B, C, E);
    return {
      prompt: `测得某硅 ${type} 管三个电极的对地电位：$U_B=${sig(B, 3)}$ V，$U_E=${sig(E, 3)}$ V，$U_C=${sig(C, 3)}$ V。该管工作在：`,
      choice: {
        options: REGIONS.map((x) => REGION_LABEL[x]),
        answer: REGIONS.indexOf(reg),
        why: [
          reg === "active" ? `正确：发射结正偏（$|U_{BE}|=${sig(Math.abs(B - E), 2)}$ V），集电结反偏。` : "不满足“发射结正偏、集电结反偏”。",
          reg === "saturation" ? "正确：两个结都正偏（$|U_{CE}|<|U_{BE}|$）。" : "集电结并非正偏，或发射结未导通。",
          reg === "cutoff" ? "正确：发射结电压低于开启电压（或反偏）。" : "发射结已正偏导通。",
        ],
      },
      hints: [type === "NPN" ? "NPN：先看 $U_{BE}=U_B-U_E$ 是否约 0.7 V。" : "PNP：先看 $U_{EB}=U_E-U_B$ 是否约 0.7 V。", "再看集电结：NPN 要求 $U_C\\ge U_B$ 才是放大；PNP 要求 $U_C\\le U_B$。"],
      solution: `${REGION_LABEL[reg]}。`,
    };
  }),
  gen({ id: "bv-g-pins", level: 2, topic: T3, title: "判断管型、材料与电极" }, (g) => {
    const type = g.pick(["NPN", "PNP"] as const);
    const mat = g.pick(["Si", "Ge"] as const);
    const ube = mat === "Si" ? g.pick([0.6, 0.7]) : g.pick([0.2, 0.3]);
    const s = type === "NPN" ? 1 : -1;
    const E = g.pick([0, 1, 2, -3, 5]);
    const B = E + s * ube;
    const C = E + s * g.pick([3, 5, 6, 8]);
    const pots = [B, C, E];
    const order = g.pick([
      [0, 1, 2],
      [1, 0, 2],
      [2, 1, 0],
      [0, 2, 1],
      [1, 2, 0],
      [2, 0, 1],
    ]);
    const v = order.map((i) => Number(pots[i].toFixed(2))) as [number, number, number];
    const j = judgeActivePins(v);
    const name = { b: "基极", c: "集电极", e: "发射极" };
    const opts = [`${j.type}、${j.material === "Si" ? "硅" : "锗"}管；①${name[j.pins[0]]}、②${name[j.pins[1]]}、③${name[j.pins[2]]}`];
    const other = j.type === "NPN" ? "PNP" : "NPN";
    opts.push(`${other}、${j.material === "Si" ? "硅" : "锗"}管；①${name[j.pins[0]]}、②${name[j.pins[1]]}、③${name[j.pins[2]]}`);
    opts.push(`${j.type}、${j.material === "Si" ? "锗" : "硅"}管；①${name[j.pins[0]]}、②${name[j.pins[1]]}、③${name[j.pins[2]]}`);
    const sw = { b: "e", e: "b", c: "c" } as const;
    opts.push(`${j.type}、${j.material === "Si" ? "硅" : "锗"}管；①${name[sw[j.pins[0]]]}、②${name[sw[j.pins[1]]]}、③${name[sw[j.pins[2]]]}`);
    const k = g.pick([0, 1, 2, 3]);
    const perm = [0, 1, 2, 3].map((i) => (i + k) % 4);
    return {
      prompt: `放大电路中测得某晶体管三个电极的对地电位：① ${sig(v[0], 3)} V，② ${sig(v[1], 3)} V，③ ${sig(v[2], 3)} V。判断管型、材料和各电极：`,
      diagram: { id: "bjt-pins", labels: { "1": `${sig(v[0], 3)} V`, "2": `${sig(v[1], 3)} V`, "3": `${sig(v[2], 3)} V` } },
      choice: {
        options: perm.map((i) => opts[i]),
        answer: perm.indexOf(0),
        why: perm.map((i) => ["正确。", "管型反了：集电极电位最高是 NPN，最低是 PNP。", "材料判断错：b–e 间差 0.6–0.8 V 是硅，0.2–0.3 V 是锗。", "基极应是电位居中的那个电极。"][i]),
      },
      hints: ["电位居中者为基极。", "与基极差约 0.7 V 或 0.2 V 的为发射极。", "集电极电位最高 → NPN；最低 → PNP。"],
      solution: opts[0] + "。",
    };
  }),
  gen({ id: "bv-g-qregion", level: 2, topic: T3, title: "偏置电路中的工作区" }, (g) => {
    const VCC = g.pick([6, 9, 12]);
    const beta = g.pick([50, 80, 100]);
    const Rc = e12(g.range(1e3, 5e3));
    const target = g.pick(["active", "saturation", "cutoff"] as const);
    const VBB = target === "cutoff" ? g.pick([0, 0.3]) : g.pick([2, 3, 5]);
    const IBsat = (VCC - 0.3) / Rc / beta;
    const Rb = target === "cutoff" ? e12(g.range(10e3, 100e3)) : target === "active" ? e12((VBB - 0.7) / (IBsat * g.range(0.3, 0.7))) : e12((VBB - 0.7) / (IBsat * g.range(1.8, 4)));
    const res = solveSimpleBias({ VBB, Rb, VCC, Rc, beta });
    const { region, IB, IC } = res;
    return {
      prompt: `图示电路：$V_{BB}=${VBB}$ V，$R_b=${R(Rb)}$，$V_{CC}=${VCC}$ V，$R_c=${R(Rc)}$，$\\beta=${beta}$，$U_{BE(on)}=0.7$ V，$U_{CES}=0.3$ V。判断工作区并求 $I_C$。`,
      diagram: { id: "bjt-test", labels: { VBB: `${VBB} V`, Rb: R(Rb), VCC: `${VCC} V`, Rc: R(Rc) } },
      parts: [num("IC", "$I_C$", IC, "A", "mA", { mistakes: region === "saturation" ? [{ value: beta * IB, message: "按 $\\beta I_B$ 算出的 $I_C$ 会使 $U_{CE}<U_{CES}$——管子已饱和，$I_C\\approx(V_{CC}-U_{CES})/R_c$。" }] : [] }), num("r", "工作区（放大填 1，饱和填 2，截止填 0）", region === "active" ? 1 : region === "saturation" ? 2 : 0, "1", "1", { tol: 0.01 })],
      hints: ["先看 $V_{BB}$ 能否使发射结导通。", "假设放大区：$I_C=\\beta I_B$，再验证 $U_{CE}=V_{CC}-I_CR_c$ 是否大于 $U_{CES}$。", "临界饱和基极电流 $I_{BS}=(V_{CC}-U_{CES})/(\\beta R_c)$，$I_B>I_{BS}$ 即饱和。"],
      solution: `${REGION_LABEL[region]}，$I_C=${A(IC)}$（$I_B=${A(IB)}$，$I_{BS}=${A(res.IBS)}$）。`,
    };
  }),
  gen({ id: "bv-g-ibs", level: 3, topic: T3, title: "临界饱和与 R_b 的取值" }, (g) => {
    const VCC = g.pick([5, 9, 12]);
    const beta = g.pick([40, 50, 80, 100]);
    const Rc = e12(g.range(500, 3e3));
    const VBB = g.pick([3, 5]);
    const IBS = solveSimpleBias({ VBB, Rb: 1e9, VCC, Rc, beta }).IBS;
    const RbMax = (VBB - 0.7) / IBS;
    return {
      prompt: `开关电路：$V_{CC}=${VCC}$ V，$R_c=${R(Rc)}$，$\\beta=${beta}$，$U_{CES}=0.3$ V。输入高电平 $V_{BB}=${VBB}$ V 时要求晶体管饱和导通。求临界饱和基极电流 $I_{BS}$ 及 $R_b$ 的最大允许值。`,
      diagram: { id: "bjt-test", labels: { VBB: `${VBB} V`, VCC: `${VCC} V`, Rc: R(Rc) } },
      parts: [num("IBS", "$I_{BS}$", IBS, "A", "µA", { mistakes: [{ value: VCC / (beta * Rc), message: "临界饱和时 $U_{CE}=U_{CES}$，$I_{CS}=(V_{CC}-U_{CES})/R_c$。" }] }), num("Rb", "$R_{b\\max}$", RbMax, "Ω", "kΩ")],
      hints: ["临界饱和：$I_{CS}=(V_{CC}-U_{CES})/R_c$，$I_{BS}=I_{CS}/\\beta$。", "饱和条件 $I_B\\ge I_{BS}$，即 $(V_{BB}-0.7)/R_b\\ge I_{BS}$。"],
      solution: `$I_{BS}=${A(IBS)}$，$R_b\\le${R(RbMax)}$（实际取更小的值以保证深度饱和）。`,
    };
  }),
  gen({ id: "bv-g-ucec", level: 3, topic: T3, title: "由输出特性读参数" }, (g) => {
    const beta = g.pick([50, 80, 100]);
    const IB = g.pick([20, 30, 40]) * 1e-6;
    const VCC = g.pick([10, 12]);
    const Rc = e12(VCC / (2 * beta * IB));
    const IC = beta * IB;
    const UCE = VCC - IC * Rc;
    return {
      prompt: `在输出特性上，直流负载线经过 $(${VCC}\\,\\mathrm V,0)$ 与 $(0,${A(VCC / Rc)})$，与 $i_B=${A(IB)}$ 的特性曲线相交（该曲线在放大区对应 $i_C=${A(IC)}$）。求 $R_c$、Q 点的 $U_{CEQ}$ 与 $\\bar\\beta$。`,
      parts: [num("Rc", "$R_c$", Rc, "Ω", "kΩ"), num("U", "$U_{CEQ}$", UCE, "V", "V"), num("b", "$\\bar\\beta$", beta, "1", "80", { tol: 0.01 })],
      hints: ["负载线纵截距 $V_{CC}/R_c$。", "$U_{CEQ}=V_{CC}-I_{CQ}R_c$。"],
      solution: `$R_c=${R(Rc)}$，$U_{CEQ}=${V(UCE)}$，$\\bar\\beta=${beta}$。`,
    };
  }),
  concept({
    id: "bv-k-switch",
    level: 3,
    topic: T3,
    title: "晶体管作开关",
    prompt: "说明晶体管作为电子开关时工作在哪两个区，并分别说明 c–e 间的等效状态。",
    keyPoints: ["“断”：截止区，$i_B\\approx0$，$i_C\\approx0$，c–e 间相当于断开", "“通”：饱和区，$u_{CE}=U_{CES}\\approx0.3$ V，c–e 间相当于闭合（有小压降）", "饱和时 $i_C$ 由外电路决定，$i_C<\\beta i_B$", "放大区只在开关转换的过渡过程中经过"],
    reference: "开关“断”对应截止区：两结反偏（或发射结未导通），电流近似为零；开关“通”对应饱和区：两结正偏，$u_{CE}\\approx U_{CES}$，集电极电流由 $V_{CC}$ 与 $R_c$ 决定。",
  }),
];

/* ═════════════ 参数与安全工作区 ═════════════ */
const T4 = "bjt-params";
const paramsQ: QuestionTemplate[] = [
  choice({
    id: "bp-c-temp",
    topic: T4,
    title: "温度对参数的影响",
    prompt: "温度升高时，晶体管的 $\\beta$、$I_{CBO}$ 和 $U_{BE}$（同一 $I_B$ 下）将分别：",
    options: ["增大、增大、减小", "减小、增大、增大", "增大、减小、减小", "不变、增大、减小"],
    answer: 0,
    why: ["正确。", "β 随温度增大，U_BE 随温度减小。", "I_CBO 随温度剧增。", "β 也随温度增大。"],
    hints: ["三者都会使 $I_C$ 增大。"],
  }),
  choice({
    id: "bp-c-icm",
    topic: T4,
    title: "I_CM 的含义",
    prompt: "集电极电流超过 $I_{CM}$ 时，最直接的后果是：",
    options: ["晶体管立即烧毁", "$\\beta$ 明显下降", "集电结击穿", "晶体管进入截止区"],
    answer: 1,
    why: ["不一定立即损坏，是否损坏取决于功耗。", "正确：$I_{CM}$ 通常定义为 β 下降到规定值时的电流。", "击穿由电压决定。", "电流大反而更靠近饱和。"],
    hints: ["$I_{CM}$ 是怎么定义的？"],
  }),
  judge({
    id: "bp-j-ebo",
    topic: T4,
    title: "发射结反向电压",
    prompt: "晶体管发射结的反向击穿电压 $U_{(BR)EBO}$ 通常与集电结一样高，可达几十伏。",
    answer: false,
    why: "错误。发射区高掺杂，发射结耗尽层窄，$U_{(BR)EBO}$ 一般只有几伏（如 5 V），远低于 $U_{(BR)CBO}$。",
    hints: ["高掺杂对击穿电压有什么影响？"],
  }),
  gen({ id: "bp-g-soa", level: 2, topic: T4, title: "工作点是否安全" }, (g) => {
    const PCM = g.pick([0.3, 0.5, 1]);
    const ICM = g.pick([0.1, 0.2, 0.3]);
    const UCEO = g.pick([20, 30, 45]);
    const U = g.pick([5, 8, 10, 15, 25, 50]);
    const I = g.pick([0.01, 0.02, 0.04, 0.08, 0.15, 0.35]);
    const r = soaCheck(U, I, { PCM, ICM, UCEO });
    return {
      prompt: `某晶体管 $P_{CM}=${PCM}$ W，$I_{CM}=${sig(ICM * 1e3, 3)}$ mA，$U_{(BR)CEO}=${UCEO}$ V。若工作点为 $U_{CE}=${U}$ V、$I_C=${A(I)}$，求管耗；判断是否安全（安全填 1，不安全填 0）。`,
      parts: [num("P", "管耗 $P_C$", U * I, "W", "W"), num("ok", "是否安全", r.safe ? 1 : 0, "1", "1", { tol: 0.01 })],
      hints: ["$P_C=U_{CE}I_C$。", "三个条件都要检查：功耗、电流、电压。"],
      solution: `$P_C=${formatSI(U * I, "W")}$；${r.safe ? "安全" : "不安全：" + r.violations.map((x) => ({ P: "超过 $P_{CM}$", I: "超过 $I_{CM}$", U: "超过 $U_{(BR)CEO}$" })[x]).join("、")}。`,
    };
  }),
  gen({ id: "bp-g-pmax", level: 2, topic: T4, title: "给定电压下允许的最大电流" }, (g) => {
    const PCM = g.pick([0.2, 0.5, 1, 2]);
    const ICM = g.pick([0.05, 0.1, 0.5, 1]);
    const U = g.pick([2, 5, 10, 20]);
    const Imax = Math.min(PCM / U, ICM);
    return {
      prompt: `晶体管 $P_{CM}=${PCM}$ W，$I_{CM}=${sig(ICM * 1e3, 3)}$ mA。$U_{CE}=${U}$ V 时集电极电流最大允许多少？`,
      parts: [num("I", "$I_{C\\max}$", Imax, "A", "mA", { mistakes: [{ value: PCM / U, message: "还要与 $I_{CM}$ 比较，取二者中较小的。" }, { value: ICM, message: "还要检查功耗：$I_C\\le P_{CM}/U_{CE}$。" }] })],
      hints: ["$I_C\\le P_{CM}/U_{CE}$ 且 $I_C\\le I_{CM}$。"],
      solution: `$\\min(${PCM}/${U},\\ ${sig(ICM, 3)})=${A(Imax)}$。`,
    };
  }),
  gen({ id: "bp-g-temp", level: 2, topic: T4, title: "温度升高后的参数" }, (g) => {
    const b25 = g.pick([50, 80, 100]);
    const t = g.pick([45, 55, 65, 75]);
    const ICBO = g.pick([1, 5, 10]) * 1e-9;
    const p = atTemperature({ beta: b25, UBE: 0.7, ICBO }, t);
    return {
      prompt: `25 °C 时某硅管 $\\bar\\beta=${b25}$、$U_{BE}=0.7$ V、$I_{CBO}=${A(ICBO)}$。按经验规律（β 每升高 1 °C 增大 1%、$U_{BE}$ 每升高 1 °C 减小 2.2 mV、$I_{CBO}$ 每升高 10 °C 增大一倍，β 按复利计算），求 ${t} °C 时的三个参数。`,
      parts: [num("b", "$\\bar\\beta$", p.beta, "1", "100", { tol: 0.02 }), num("u", "$U_{BE}$", p.UBE, "V", "V", { tol: 0.01 }), num("i", "$I_{CBO}$", p.ICBO, "A", "nA", { tol: 0.02 })],
      hints: ["$\\bar\\beta=\\bar\\beta_{25}\\times1.01^{\\Delta t}$。", "$I_{CBO}=I_{CBO,25}\\times2^{\\Delta t/10}$。"],
      solution: `$\\bar\\beta\\approx${sig(p.beta, 3)}$，$U_{BE}\\approx${V(p.UBE)}$，$I_{CBO}\\approx${A(p.ICBO)}$。`,
    };
  }),
  gen({ id: "bp-g-loadline", level: 3, topic: T4, title: "负载线与 P_CM 双曲线" }, (g) => {
    const VCC = g.pick([12, 20, 24]);
    const Rc = e12(g.range(50, 500));
    const PCM = g.pick([0.3, 0.5, 1]);
    // 负载线上管耗最大点：u_CE = V_CC/2，P = V_CC²/(4R_c)
    const Pmax = (VCC * VCC) / (4 * Rc);
    return {
      prompt: `电路 $V_{CC}=${VCC}$ V、$R_c=${R(Rc)}$（发射极接地）。在直流负载线上移动 Q 点时，晶体管管耗的最大值是多少？若 $P_{CM}=${PCM}$ W，Q 点能否放在负载线的任意位置（能填 1，不能填 0）？`,
      parts: [num("P", "最大管耗", Pmax, "W", "W", { mistakes: [{ value: (VCC * VCC) / Rc, message: "管耗 $u_{CE}i_C=u_{CE}(V_{CC}-u_{CE})/R_c$，在 $u_{CE}=V_{CC}/2$ 处取最大值 $V_{CC}^2/(4R_c)$。" }] }), num("ok", "能否任意放置", Pmax <= PCM ? 1 : 0, "1", "1", { tol: 0.01 })],
      hints: ["负载线上 $i_C=(V_{CC}-u_{CE})/R_c$。", "$P=u_{CE}(V_{CC}-u_{CE})/R_c$ 是关于 $u_{CE}$ 的二次函数。"],
      solution: `$P_{\\max}=V_{CC}^2/(4R_c)=${formatSI(Pmax, "W")}$，${Pmax <= PCM ? "小于" : "大于"} $P_{CM}$。`,
    };
  }),
  gen({ id: "bp-g-drift", level: 3, topic: T4, title: "温度引起的 I_C 变化（固定偏置）" }, (g) => {
    const b25 = g.pick([60, 80, 100]);
    const VCC = 12;
    const Rb = e12(g.range(300e3, 600e3));
    const t = g.pick([50, 60, 70]);
    const p = atTemperature({ beta: b25, UBE: 0.7, ICBO: 0 }, t);
    const IC25 = (b25 * (VCC - 0.7)) / Rb;
    const ICt = (p.beta * (VCC - p.UBE)) / Rb;
    return {
      prompt: `固定偏置电路 $V_{CC}=12$ V，$R_b=${R(Rb)}$。25 °C 时 $\\bar\\beta=${b25}$、$U_{BE}=0.7$ V；${t} °C 时 $\\bar\\beta=${sig(p.beta, 3)}$、$U_{BE}=${sig(p.UBE, 3)}$ V（忽略 $I_{CEO}$）。求两种温度下的 $I_C$ 及其相对变化。`,
      parts: [num("a", "25 °C 时 $I_C$", IC25, "A", "mA"), num("b", `${t} °C 时 $I_C$`, ICt, "A", "mA"), num("k", "相对变化", (ICt - IC25) / IC25, "1", "40%", { tol: 0.03 })],
      hints: ["$I_C=\\bar\\beta(V_{CC}-U_{BE})/R_b$。", "β 的变化是主要因素；$U_{BE}$ 的变化相对 12 V 很小。"],
      solution: `$I_C$ 从 ${A(IC25)} 增大到 ${A(ICt)}，增加约 ${sig(((ICt - IC25) / IC25) * 100, 3)}%。固定偏置的 Q 点几乎随 β 成比例漂移。`,
    };
  }),
  concept({
    id: "bp-k-select",
    level: 3,
    topic: T4,
    title: "选管时关注哪些参数",
    prompt: "设计一个放大电路时，从参数手册中选择晶体管，至少应检查哪些参数？各自的作用是什么？",
    keyPoints: ["β：决定电流放大能力，宜选适中（过大温度稳定性差）", "$I_{CEO}$（或 $I_{CBO}$）：越小温度稳定性越好", "极限参数 $P_{CM}$、$I_{CM}$、$U_{(BR)CEO}$：保证工作在安全区并留余量", "$f_T$：保证所需的频率范围"],
    reference: "应检查：电流放大系数（是否满足增益要求）；反向电流 $I_{CBO}$/$I_{CEO}$（温度稳定性）；极限参数 $P_{CM}$、$I_{CM}$、$U_{(BR)CEO}$（安全工作区，并留一定余量）；特征频率 $f_T$（频率响应）。",
  }),
];

export const CH2_QUESTIONS: QuestionTemplate[] = [...structQ, ...currentsQ, ...curvesQ, ...paramsQ];
