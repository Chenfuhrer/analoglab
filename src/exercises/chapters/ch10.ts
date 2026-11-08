/** 第 10 章题库（原创）：功放分类、OCL、交越失真与 OTL */
import { conductionClass, oclMax, oclMaxTubeLoss, oclPower, otlLowCorner, otlMax } from "@/simulations/power/pa";
import { formatSI, sig } from "@/simulations/units";
import { choice, concept, gen, judge, num } from "../helpers";
import type { QuestionTemplate } from "../types";

const W = (x: number) => formatSI(x, "W");
const V = (x: number) => formatSI(x, "V");

/* ═════════════ 分类 ═════════════ */
const T1 = "pa-classes";
const classesQ: QuestionTemplate[] = [
  choice({
    id: "pc-c-eta",
    topic: T1,
    title: "效率最高的类型",
    prompt: "在甲类、乙类、甲乙类功放中，理想情况下效率最高的是：",
    options: ["甲类", "乙类", "甲乙类", "三者相同"],
    answer: 1,
    why: ["甲类静态电流大，效率 ≤ 50%。", "正确：静态电流为零，理想效率 78.5%。", "略低于乙类。", "—"],
    hints: ["静态电流越小，效率越高。"],
  }),
  choice({
    id: "pc-c-theta",
    topic: T1,
    title: "乙类功放的导通角",
    prompt: "乙类功放中每只晶体管的导通角为：",
    options: ["360°", "大于 180° 小于 360°", "180°", "小于 180°"],
    answer: 2,
    why: ["甲类。", "甲乙类。", "正确。", "丙类。"],
    hints: ["静态电流为零，管子导通半个周期。"],
  }),
  judge({
    id: "pc-j-small",
    topic: T1,
    title: "小信号微变等效",
    prompt: "功率放大电路的分析可以使用微变等效电路法。",
    answer: false,
    why: "错误。功放工作在大信号状态，晶体管特性的非线性不能忽略，应使用图解法或基于极限摆幅的功率计算。",
    hints: ["微变等效的适用条件是什么？"],
  }),
  gen({ id: "pc-g-theta", level: 2, topic: T1, title: "由静态电流求导通角" }, (g) => {
    const k = g.pick([-0.5, -0.3, 0, 0.3, 0.5, 0.8]);
    const c = conductionClass(k);
    return {
      prompt: `单管集电极电流 $i_C=I_{CQ}+I_{cm}\\sin\\omega t$（截止时为 0），$I_{CQ}/I_{cm}=${k}$。求导通角（度）。`,
      parts: [num("t", "导通角（°）", c.theta, "1", "180", { tol: 0.01 })],
      hints: ["导通条件 $\\sin\\omega t>-I_{CQ}/I_{cm}$。", "$\\theta=2\\arccos(-I_{CQ}/I_{cm})$（|比值|<1）。"],
      solution: `约 ${sig(c.theta, 3)}°。`,
    };
  }),
  gen({ id: "pc-g-classA", level: 2, topic: T1, title: "甲类功放的效率" }, (g) => {
    const VCC = g.pick([12, 15, 24]);
    const ICQ = g.pick([0.5, 1, 2]);
    const k = g.pick([0.5, 0.8, 1]);
    const Po = 0.5 * (k * VCC) * (k * ICQ);
    const PV = VCC * ICQ;
    return {
      prompt: `理想甲类功放（电感/变压器耦合负载）$V_{CC}=${VCC}$ V、$I_{CQ}=${ICQ}$ A。输出电压、电流摆幅都达到最大可能值的 ${k * 100}%（即 $U_{cem}=${sig(k * VCC, 3)}$ V、$I_{cm}=${sig(k * ICQ, 3)}$ A），求 $P_o$、$P_V$ 与效率。`,
      parts: [num("po", "$P_o$", Po, "W", "W"), num("pv", "$P_V$", PV, "W", "W"), num("e", "$\\eta$", Po / PV, "1", "50%", { tol: 0.01 })],
      hints: ["$P_o=\\frac12U_{cem}I_{cm}$，$P_V=V_{CC}I_{CQ}$（与信号无关）。"],
      solution: `$P_o=${W(Po)}$，$P_V=${W(PV)}$，$\\eta=${sig((Po / PV) * 100, 3)}\\%$。`,
    };
  }),
  gen({ id: "pc-g-loss", level: 2, topic: T1, title: "由效率求管耗" }, (g) => {
    const Po = g.pick([5, 10, 20, 50]);
    const eta = g.pick([0.4, 0.5, 0.6, 0.7]);
    const PV = Po / eta;
    return {
      prompt: `某功放输出功率 ${Po} W，效率 ${eta * 100}%。电源提供多少功率？晶体管总管耗是多少？`,
      parts: [num("pv", "$P_V$", PV, "W", "W"), num("pt", "$P_T$", PV - Po, "W", "W", { mistakes: [{ value: Po * (1 - eta), message: "$P_T=P_V-P_o=P_o(1/\\eta-1)$。" }] })],
      hints: ["$P_V=P_o/\\eta$，$P_T=P_V-P_o$。"],
      solution: `$P_V=${W(PV)}$，$P_T=${W(PV - Po)}$。`,
    };
  }),
  gen({ id: "pc-g-compare", level: 3, topic: T1, title: "不同导通角的效率" }, (g) => {
    const k = g.pick([1, 0.3, 0, -0.2]);
    const c = conductionClass(k);
    return {
      prompt: `理想单管功放（谐振/变压器负载，集电极电压摆幅等于 $V_{CC}$，负载只吸收基波功率），$I_{CQ}/I_{cm}=${k}$。求导通角和最大效率。`,
      parts: [num("t", "导通角（°）", c.theta, "1", "180", { tol: 0.01 }), num("e", "$\\eta$", c.eta, "1", "78.5%", { tol: 0.02 })],
      hints: ["$\\eta=\\frac{I_{c1}}{2I_{C0}}$：基波幅值与平均值之比的一半。"],
      solution: `导通角 ${sig(c.theta, 3)}°，效率约 ${sig(c.eta * 100, 3)}%。`,
    };
  }),
  concept({
    id: "pc-k-trade",
    level: 3,
    topic: T1,
    title: "效率与失真的矛盾",
    prompt: "说明功放中效率与失真之间的矛盾，以及甲乙类推挽电路是怎样折中的。",
    keyPoints: ["静态电流大（甲类）→ 失真小但效率低", "静态电流为零（乙类）→ 效率高但单管只放大半周、有交越失真", "推挽：两管各放大半周，合成完整波形", "甲乙类：加很小的静态电流消除交越失真，效率接近乙类"],
    reference: "甲类全周期导通、失真小，但静态功耗大、效率不超过 50%；乙类静态电流为零、效率高，但单管只导通半周，需要两管推挽，且有交越失真。甲乙类在乙类推挽的基础上给两管很小的偏置电流，消除死区，效率仍接近乙类，是实际功放的主流。",
  }),
  choice({
    id: "pc-c-heat",
    level: 3,
    topic: T1,
    title: "无信号时的管耗",
    prompt: "无输入信号时，下列哪种功放的管耗最大？",
    options: ["甲类", "乙类", "甲乙类", "都为零"],
    answer: 0,
    why: ["正确：静态管耗 $U_{CEQ}I_{CQ}$ 最大，且是甲类管耗最大的时刻。", "乙类静态管耗为零。", "很小。", "甲类不为零。"],
    hints: ["静态管耗 = $U_{CEQ}I_{CQ}$。"],
  }),
];

/* ═════════════ OCL ═════════════ */
const T2 = "pa-ocl";
const oclQ: QuestionTemplate[] = [
  choice({
    id: "po-c-config",
    topic: T2,
    title: "OCL 中晶体管的组态",
    prompt: "OCL 互补对称电路中，两只晶体管都接成：",
    options: ["共射电路", "共集电路（射极跟随器）", "共基电路", "差分电路"],
    answer: 1,
    why: ["输出取自发射极。", "正确：电压增益约为 1，靠电流放大提供功率增益。", "—", "—"],
    hints: ["负载接在哪个电极上？"],
  }),
  judge({
    id: "po-j-maxloss",
    topic: T2,
    title: "管耗最大的时刻",
    prompt: "乙类 OCL 电路输出功率最大时，晶体管的管耗也最大。",
    answer: false,
    why: "错误。管耗在 $U_{om}=2V_{CC}/\\pi\\approx0.64V_{CC}$ 时最大，约为 $0.2P_{om}$（每管）；满功率时管压降很小，管耗反而较小。",
    hints: ["$P_{T1}$ 是 $U_{om}$ 的二次函数。"],
  }),
  choice({
    id: "po-c-ubr",
    topic: T2,
    title: "管子的耐压",
    prompt: "乙类 OCL（电源 $\\pm V_{CC}$）中，选择晶体管时要求 $|U_{(BR)CEO}|$ 至少为：",
    options: ["$V_{CC}$", "$2V_{CC}$", "$V_{CC}/2$", "$\\sqrt2V_{CC}$"],
    answer: 1,
    why: ["不够：一管饱和时另一管承受约 $2V_{CC}$。", "正确。", "—", "—"],
    hints: ["VT₁ 饱和导通时，输出约为 $+V_{CC}$，VT₂ 的 c–e 间电压是多少？"],
  }),
  gen({ id: "po-g-pom", level: 2, topic: T2, title: "OCL 最大输出功率与效率" }, (g) => {
    const VCC = g.pick([9, 12, 15, 18, 20]);
    const RL = g.pick([4, 8, 16]);
    const UCES = g.pick([0, 1, 2]);
    const m = oclMax(VCC, RL, UCES);
    return {
      prompt: `乙类 OCL 电路 $\\pm V_{CC}=\\pm${VCC}$ V，$R_L=${RL}\\,\\Omega$，管子饱和压降 $U_{CES}=${UCES}$ V。求最大输出功率 $P_{om}$、电源功率 $P_V$ 与效率 $\\eta$。`,
      diagram: { id: "ocl", labels: { RL: `${RL} Ω` } },
      parts: [
        num("po", "$P_{om}$", m.Po, "W", "W", { mistakes: [{ value: (VCC * VCC) / (2 * RL), message: "要扣除饱和压降：$U_{om}=V_{CC}-U_{CES}$。" }] }),
        num("pv", "$P_V$", m.PV, "W", "W"),
        num("e", "$\\eta$", m.eta, "1", "78.5%", { tol: 0.01 }),
      ],
      hints: ["$P_{om}=\\frac{(V_{CC}-U_{CES})^2}{2R_L}$。", "$P_V=\\frac{2V_{CC}U_{om}}{\\pi R_L}$。"],
      solution: `$P_{om}=${W(m.Po)}$，$P_V=${W(m.PV)}$，$\\eta=${sig(m.eta * 100, 3)}\\%$。`,
    };
  }),
  gen({ id: "po-g-partial", level: 2, topic: T2, title: "非满功率时的效率" }, (g) => {
    const VCC = g.pick([12, 15, 20]);
    const RL = g.pick([8, 16]);
    const Uom = Number((VCC * g.pick([0.2, 0.4, 0.6, 0.8])).toFixed(1));
    const o = oclPower(VCC, RL, Uom);
    return {
      prompt: `乙类 OCL $\\pm V_{CC}=\\pm${VCC}$ V、$R_L=${RL}\\,\\Omega$，输出电压幅值 ${Uom} V。求 $P_o$、每管管耗 $P_{T1}$ 与效率。`,
      parts: [num("po", "$P_o$", o.Po, "W", "W"), num("pt", "$P_{T1}$", o.PT1, "W", "W", { mistakes: [{ value: o.PT, message: "这是两管的总管耗，每管为一半。" }] }), num("e", "$\\eta$", o.eta, "1", "40%", { tol: 0.01 })],
      hints: ["$\\eta=\\frac{\\pi U_{om}}{4V_{CC}}$。", "$P_{T1}=\\frac12(P_V-P_o)$。"],
      solution: `$P_o=${W(o.Po)}$，$P_{T1}=${W(o.PT1)}$，$\\eta=${sig(o.eta * 100, 3)}\\%$。`,
    };
  }),
  gen({ id: "po-g-select", level: 2, topic: T2, title: "选管参数" }, (g) => {
    const VCC = g.pick([12, 15, 18, 24]);
    const RL = g.pick([4, 8]);
    const t = oclMaxTubeLoss(VCC, RL);
    return {
      prompt: `乙类 OCL $\\pm V_{CC}=\\pm${VCC}$ V、$R_L=${RL}\\,\\Omega$（理想管）。求每管最大管耗 $P_{T1\\max}$，并给出晶体管 $|U_{(BR)CEO}|$ 与 $I_{CM}$ 的最低要求。`,
      parts: [num("pt", "$P_{T1\\max}$", t.PT1max, "W", "W"), num("u", "$|U_{(BR)CEO}|_{\\min}$", 2 * VCC, "V", "V"), num("i", "$I_{CM\\min}$", VCC / RL, "A", "A")],
      hints: ["$P_{T1\\max}=V_{CC}^2/(\\pi^2R_L)$。", "耐压 $2V_{CC}$，电流 $V_{CC}/R_L$。"],
      solution: `$P_{T1\\max}=${W(t.PT1max)}$，$|U_{(BR)CEO}|\\ge${V(2 * VCC)}$，$I_{CM}\\ge${formatSI(VCC / RL, "A")}$。`,
    };
  }),
  gen({ id: "po-g-design", level: 3, topic: T2, title: "由功率要求选电源电压" }, (g) => {
    const Po = g.pick([5, 10, 20, 25]);
    const RL = g.pick([4, 8]);
    const UCES = g.pick([1, 2]);
    let lo = 0;
    let hi = 100;
    for (let k = 0; k < 100; k++) {
      const mid = (lo + hi) / 2;
      if (oclMax(mid, RL, UCES).Po < Po) lo = mid;
      else hi = mid;
    }
    return {
      prompt: `要求乙类 OCL 在 $R_L=${RL}\\,\\Omega$ 上输出最大功率 ${Po} W，管子饱和压降 ${UCES} V。电源电压 $V_{CC}$ 至少为多少？此时每管最大管耗约为多少？`,
      parts: [num("v", "$V_{CC\\min}$", hi, "V", "V", { tol: 0.02 }), num("pt", "$P_{T1\\max}$", oclMaxTubeLoss(hi, RL).PT1max, "W", "W", { tol: 0.04 })],
      hints: ["$P_{om}=\\frac{(V_{CC}-U_{CES})^2}{2R_L}$，反解 $V_{CC}$。"],
      solution: `$V_{CC}\\ge${V(hi)}$，$P_{T1\\max}\\approx${W(oclMaxTubeLoss(hi, RL).PT1max)}$。`,
    };
  }),
  gen({ id: "po-g-uom", level: 3, topic: T2, title: "管耗最大时的输出幅值" }, (g) => {
    const VCC = g.pick([10, 12, 15, 20]);
    const RL = g.pick([4, 8, 16]);
    const t = oclMaxTubeLoss(VCC, RL);
    const o = oclPower(VCC, RL, t.Uom);
    return {
      prompt: `乙类 OCL $\\pm V_{CC}=\\pm${VCC}$ V、$R_L=${RL}\\,\\Omega$。管耗最大时输出电压幅值是多少？此时输出功率和效率各为多少？`,
      parts: [num("u", "$U_{om}$", t.Uom, "V", "V"), num("p", "$P_o$", o.Po, "W", "W"), num("e", "$\\eta$", o.eta, "1", "50%", { tol: 0.01 })],
      hints: ["对 $P_{T1}(U_{om})$ 求导，得 $U_{om}=2V_{CC}/\\pi$。"],
      solution: `$U_{om}=${V(t.Uom)}$，$P_o=${W(o.Po)}$，$\\eta=50\\%$（恰好 $\\pi/4\\times2/\\pi$）。`,
    };
  }),
  concept({
    id: "po-k-derive",
    level: 3,
    topic: T2,
    title: "推导 OCL 的最大效率",
    prompt: "推导乙类 OCL 电路的电源功率与效率表达式，并说明最大效率 78.5% 的条件。",
    keyPoints: ["P_o = U_om²/(2R_L)", "每个电源半周供电，电流平均值 I_cm/π，P_V = 2V_CC U_om/(πR_L)", "η = πU_om/(4V_CC)", "U_om = V_CC（忽略 U_CES）时 η = π/4 ≈ 78.5%"],
    reference: "$P_o=U_{om}^2/(2R_L)$。正、负电源各在半周内提供电流 $i=\\frac{U_{om}}{R_L}\\sin\\omega t$，平均值 $\\frac{U_{om}}{\\pi R_L}$，故 $P_V=\\frac{2V_{CC}U_{om}}{\\pi R_L}$，$\\eta=\\frac{\\pi U_{om}}{4V_{CC}}$。理想情况下（$U_{CES}=0$，$U_{om}=V_{CC}$）达到最大值 $\\pi/4\\approx78.5\\%$。",
  }),
];

/* ═════════════ 交越失真与 OTL ═════════════ */
const T3 = "pa-crossover";
const crossQ: QuestionTemplate[] = [
  choice({
    id: "px-c-cause",
    topic: T3,
    title: "交越失真的原因",
    prompt: "乙类互补对称功放产生交越失真的原因是：",
    options: ["管子饱和", "发射结存在开启电压，小输入时两管都不导通", "负载太小", "电源电压太低"],
    answer: 1,
    why: ["饱和引起削顶。", "正确。", "—", "—"],
    hints: ["输入接近零时两管的状态？"],
  }),
  choice({
    id: "px-c-fix",
    topic: T3,
    title: "消除交越失真",
    prompt: "消除交越失真的常用方法是：",
    options: ["加大输入信号", "给两管加适当的正向偏置，使其工作在甲乙类", "加大负载电阻", "提高电源电压"],
    answer: 1,
    why: ["大信号时交越失真相对小，但仍存在。", "正确：如用两只二极管或 $U_{BE}$ 倍增电路。", "—", "—"],
    hints: ["让两管静态时“预先导通”。"],
  }),
  judge({
    id: "px-j-otl",
    topic: T3,
    title: "OTL 的等效电源",
    prompt: "单电源 $V_{CC}$ 供电的 OTL 电路，其最大输出功率与 $\\pm V_{CC}/2$ 双电源的 OCL 电路相同。",
    answer: true,
    why: "正确：输出电容上保持 $V_{CC}/2$，相当于一个负电源。",
    hints: ["静态时输出端的电位是多少？"],
  }),
  gen({ id: "px-g-otl", level: 2, topic: T3, title: "OTL 最大输出功率" }, (g) => {
    const VCC = g.pick([12, 18, 24, 30]);
    const RL = g.pick([4, 8]);
    const UCES = g.pick([0, 1]);
    const o = otlMax(VCC, RL, UCES);
    return {
      prompt: `OTL 电路单电源 $V_{CC}=${VCC}$ V，$R_L=${RL}\\,\\Omega$，$U_{CES}=${UCES}$ V。求最大输出功率与静态时输出电容上的电压。`,
      diagram: { id: "otl", labels: { RL: `${RL} Ω` } },
      parts: [num("p", "$P_{om}$", o.Po, "W", "W", { mistakes: [{ value: oclMax(VCC, RL, UCES).Po, message: "OTL 等效于 $\\pm V_{CC}/2$ 的 OCL，公式中用 $V_{CC}/2$。" }] }), num("u", "$U_C$", VCC / 2, "V", "V")],
      hints: ["$P_{om}=\\frac{(V_{CC}/2-U_{CES})^2}{2R_L}$。"],
      solution: `$P_{om}=${W(o.Po)}$，$U_C=${V(VCC / 2)}$。`,
    };
  }),
  gen({ id: "px-g-cap", level: 2, topic: T3, title: "OTL 输出电容的选择" }, (g) => {
    const RL = g.pick([4, 8, 16]);
    const fL = g.pick([20, 30, 50]);
    let lo = 1e-6;
    let hi = 1;
    for (let k = 0; k < 100; k++) {
      const mid = Math.sqrt(lo * hi);
      if (otlLowCorner(RL, mid) > fL) lo = mid;
      else hi = mid;
    }
    return {
      prompt: `OTL 电路负载 $R_L=${RL}\\,\\Omega$，要求输出电容引起的下限频率不高于 ${fL} Hz。电容至少多大？`,
      parts: [num("c", "$C_{\\min}$", hi, "F", "µF", { tol: 0.02 })],
      hints: ["$f_L=\\frac{1}{2\\pi R_LC}$。"],
      solution: `$C\\ge${formatSI(hi, "F")}$。`,
    };
  }),
  gen({ id: "px-g-bias", level: 2, topic: T3, title: "偏置二极管上的电压" }, (g) => {
    const Uon = g.pick([0.6, 0.65, 0.7]);
    const n = 2;
    return {
      prompt: `甲乙类 OCL 用两只硅二极管给两管提供偏置，每只二极管导通压降 ${Uon} V。两管基极之间的静态电压是多少？每管发射结约有多大的正偏电压？`,
      diagram: { id: "ocl-ab" },
      parts: [num("u", "两基极间电压", n * Uon, "V", "V", { tol: 0.01 }), num("b", "每管 $U_{BE}$", Uon, "V", "V", { tol: 0.01 })],
      hints: ["两只二极管串联，电压平分给两个发射结。"],
      solution: `${V(n * Uon)}，每管约 ${V(Uon)}，处于临界导通。`,
    };
  }),
  gen({ id: "px-g-otl-design", level: 3, topic: T3, title: "OTL 电源电压的设计" }, (g) => {
    const Po = g.pick([2, 5, 8, 10]);
    const RL = g.pick([4, 8]);
    let lo = 0;
    let hi = 200;
    for (let k = 0; k < 100; k++) {
      const mid = (lo + hi) / 2;
      if (otlMax(mid, RL, 1).Po < Po) lo = mid;
      else hi = mid;
    }
    return {
      prompt: `用 OTL 电路在 $R_L=${RL}\\,\\Omega$ 上得到 ${Po} W 的最大输出功率（$U_{CES}=1$ V），单电源至少多高？若改用 OCL，正负电源各至少多高？`,
      parts: [num("otl", "OTL $V_{CC}$", hi, "V", "V", { tol: 0.02 }), num("ocl", "OCL $\\pm V_{CC}$", hi / 2, "V", "V", { tol: 0.02 })],
      hints: ["OTL：$(V_{CC}/2-U_{CES})^2/(2R_L)=P_{om}$。"],
      solution: `OTL：$V_{CC}\\ge${V(hi)}$；OCL：$\\pm${V(hi / 2)}$。`,
    };
  }),
  gen({ id: "px-g-uom-limit", level: 3, topic: T3, title: "OTL 的输出幅值" }, (g) => {
    const VCC = g.pick([12, 20, 24]);
    const UCES = g.pick([0.5, 1, 2]);
    const o = otlMax(VCC, 8, UCES);
    return {
      prompt: `OTL 电路 $V_{CC}=${VCC}$ V，$U_{CES}=${UCES}$ V，$R_L=8\\,\\Omega$。负载上最大不失真输出电压的峰值与有效值各是多少？`,
      parts: [num("p", "峰值", o.Uom, "V", "V", { mistakes: [{ value: VCC - UCES, message: "OTL 的摆幅以 $V_{CC}/2$ 为中心，峰值为 $V_{CC}/2-U_{CES}$。" }] }), num("r", "有效值", o.Uom / Math.SQRT2, "V", "V")],
      hints: ["输出端静态电位 $V_{CC}/2$。"],
      solution: `峰值 ${V(o.Uom)}，有效值 ${V(o.Uom / Math.SQRT2)}。`,
    };
  }),
  concept({
    id: "px-k-diode",
    level: 3,
    topic: T3,
    title: "偏置二极管的两个作用",
    prompt: "说明甲乙类 OCL 中偏置二极管的作用，以及为什么用二极管而不用普通电阻。",
    keyPoints: ["提供约 2U_on 的偏置，使两管临界导通，消除交越失真", "二极管动态电阻小，交流信号几乎无损失地同时加到两管基极", "二极管的温度系数与发射结相同，可补偿温度变化，稳定静态电流", "电阻偏置会随温度失配，容易引起静态电流过大（热失控）"],
    reference: "二极管正向压降约等于晶体管发射结的开启电压，两只二极管为两管提供约 $2U_{on}$ 的偏置，使其静态时微导通，消除交越失真；二极管动态电阻小，交流信号几乎不损失；其温度系数与发射结相近，温度升高时偏置电压同步下降，起温度补偿作用，防止静态电流随温度增大。",
  }),
];

export const CH10_QUESTIONS: QuestionTemplate[] = [...classesQ, ...oclQ, ...crossQ];
