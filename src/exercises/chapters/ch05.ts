/** 第 5 章题库（原创）：耦合方式、多级动态分析、零点漂移 */
import { analyzeCE } from "@/simulations/bjt/ce";
import { DEFAULT_CC, type StageParams } from "@/simulations/bjt/stages";
import { DEFAULT_DIVIDER, type CEParams } from "@/simulations/bjt/types";
import { atTemperature } from "@/simulations/bjt/device";
import { analyzeCECC, analyzeCECE, cascade, directTwoCE, inputReferredDrift } from "@/simulations/multistage/cascade";
import { cornerFrequency, highPassDroop } from "@/simulations/signal/rc";
import { formatSI, sig } from "@/simulations/units";
import { e12 } from "../generators";
import { choice, concept, gen, judge, num, type Rng } from "../helpers";
import type { QuestionTemplate } from "../types";

const V = (x: number) => formatSI(x, "V");
const A = (x: number) => formatSI(x, "A");
const R = (x: number) => formatSI(x, "Ω");

function divCE(g: Rng): CEParams {
  for (let k = 0; k < 100; k++) {
    const Rb1 = e12(g.range(5e3, 20e3));
    const p: CEParams = { ...DEFAULT_DIVIDER, VCC: 12, Rb1, Rb2: e12(Rb1 * g.range(2.5, 4)), Re1: 0, Re2: e12(g.range(1e3, 2.2e3)), hasCe: true, Rc: e12(g.range(2e3, 5e3)), beta: g.pick([60, 80, 100, 120]), rbb: g.pick([100, 200, 300]), Rs: 0 };
    const a = analyzeCE(p);
    if (a.dc.region === "active" && a.dc.UCEQ > 2.5 && a.dc.UCEQ < 8) return p;
  }
  return { ...DEFAULT_DIVIDER, Re1: 0, Re2: 1.2e3 };
}

/* ═════════════ 耦合方式 ═════════════ */
const T1 = "multistage-coupling";
const couplingQ: QuestionTemplate[] = [
  choice({
    id: "mcp-c-ic",
    topic: T1,
    title: "集成电路内部的耦合方式",
    prompt: "集成运算放大器内部各级之间一般采用：",
    options: ["阻容耦合", "直接耦合", "变压器耦合", "光电耦合"],
    answer: 1,
    why: ["大容量电容无法在芯片上制造。", "正确。", "变压器无法集成。", "光电耦合用于隔离，不用于运放内部级间。"],
    hints: ["哪种耦合不需要电容和电感？"],
  }),
  choice({
    id: "mcp-c-adv",
    topic: T1,
    title: "阻容耦合的优点",
    prompt: "阻容耦合多级放大电路的主要优点是：",
    options: ["能放大直流信号", "各级静态工作点互相独立", "便于集成", "低频特性好"],
    answer: 1,
    why: ["电容隔直，不能放大直流。", "正确。", "大电容不能集成。", "低频特性差。"],
    hints: ["电容对直流相当于什么？"],
  }),
  judge({
    id: "mcp-j-drift",
    topic: T1,
    title: "零点漂移与耦合方式",
    prompt: "阻容耦合放大电路中各级的零点漂移会被逐级放大，在输出端造成很大的漂移。",
    answer: false,
    why: "错误。耦合电容隔断了缓慢变化的直流漂移，各级的漂移只影响本级；零点漂移是直接耦合电路的问题。",
    hints: ["缓慢变化的漂移能通过耦合电容吗？"],
  }),
  gen({ id: "mcp-g-fl", level: 2, topic: T1, title: "耦合电容决定的下限频率" }, (g) => {
    const Ro1 = e12(g.range(1e3, 10e3));
    const Ri2 = e12(g.range(1e3, 20e3));
    const C = g.pick([1, 2.2, 4.7, 10, 22]) * 1e-6;
    const fL = cornerFrequency(Ro1 + Ri2, C);
    return {
      prompt: `两级阻容耦合放大电路中，第一级输出电阻 $R_{o1}=${R(Ro1)}$，第二级输入电阻 $R_{i2}=${R(Ri2)}$，级间耦合电容 $C=${formatSI(C, "F")}$。只考虑该电容，求下限截止频率 $f_L$。`,
      parts: [num("fL", "$f_L$", fL, "Hz", "Hz", { mistakes: [{ value: cornerFrequency(Ri2, C), tag: "io-resistance", message: "电容两端看进去的电阻是 $R_{o1}+R_{i2}$（串联），不能漏掉前级输出电阻。" }, { value: 1 / ((Ro1 + Ri2) * C), tag: "omega-f", message: "这是角频率 ω；$f=\\omega/(2\\pi)$。" }] })],
      hints: ["$f_L=\\dfrac{1}{2\\pi C(R_{o1}+R_{i2})}$。"],
      solution: `$f_L=${formatSI(fL, "Hz")}$。`,
    };
  }),
  gen({ id: "mcp-g-cmin", level: 2, topic: T1, title: "耦合电容的最小值" }, (g) => {
    const Rsum = e12(g.range(2e3, 20e3));
    const fL = g.pick([5, 10, 20, 50]);
    const C = 1 / (2 * Math.PI * fL * Rsum);
    return {
      prompt: `要求级间耦合电容引起的下限频率不高于 ${fL} Hz，电容两端看进去的电阻 $R_{o1}+R_{i2}=${R(Rsum)}$。电容至少应为多大？`,
      parts: [num("C", "$C_{\\min}$", C, "F", "µF")],
      hints: ["由 $f_L=1/(2\\pi RC)\\le f$ 得 $C\\ge1/(2\\pi Rf)$。"],
      solution: `$C\\ge${formatSI(C, "F")}$（取标称值再大一些）。`,
    };
  }),
  gen({ id: "mcp-g-direct", level: 2, topic: T1, title: "直接耦合的电平" }, (g) => {
    const Re2 = g.pick([0.5e3, 1e3, 1.5e3, 2e3, 3e3]);
    const o = { VCC: 12, Rb1: 560e3, Rc1: 3e3, Rc2: e12(g.range(2e3, 4e3)), Re2, beta: 100 };
    const d = directTwoCE(o);
    return {
      prompt: `直接耦合两级共射电路：$V_{CC}=12$ V，第一级 $R_{b1}=560$ kΩ（接 $V_{CC}$）、$R_{c1}=3$ kΩ；第二级 $R_{e2}=${R(Re2)}$；两管 $\\beta=100$、$U_{BE}=0.7$ V。第一级集电极直接接第二级基极。求第一级集电极电位 $U_{C1}$（计入第二级基极电流）。`,
      diagram: { id: "direct-2ce", labels: { Rb1: "560 kΩ", Rc1: "3 kΩ", Rc2: R(o.Rc2), Re2: R(Re2) } },
      parts: [num("uc1", "$U_{C1}$", d.UC1, "V", "V", { mistakes: [{ value: 12 - 100 * (11.3 / 560e3) * 3e3, tag: "kcl-split", message: "第二级基极电流也流过 $R_{c1}$：$U_{C1}=V_{CC}-(I_{C1}+I_{B2})R_{c1}$。" }] })],
      hints: ["$I_{C1}=\\beta(V_{CC}-U_{BE})/R_{b1}$。", "$I_{B2}=(U_{C1}-U_{BE})/[(1+\\beta)R_{e2}]$，与 $U_{C1}=V_{CC}-(I_{C1}+I_{B2})R_{c1}$ 联立。"],
      solution: `$U_{C1}=${V(d.UC1)}$，$I_{B2}=${A(d.IB2)}$。`,
    };
  }),
  gen({ id: "mcp-g-choose", level: 3, topic: T1, title: "选择耦合方式" }, (g) => {
    const cases: Array<[string, number]> = [
      ["放大热电偶输出的毫伏级直流电压，并要求能做成集成电路", 1],
      ["话筒（20 Hz–20 kHz）放大，用分立元件，希望各级静态工作点互不影响", 0],
      ["控制电路的地与 220 V 主电路的地必须隔离，只传递开关信号", 3],
      ["早期收音机末级用一个元件把扬声器的 8 Ω 变换为几百欧的最佳负载", 2],
    ];
    const [text, ans] = g.pick(cases);
    const opts = ["阻容耦合", "直接耦合", "变压器耦合", "光电耦合"];
    return {
      prompt: `${text}。最合适的耦合方式是：`,
      choice: { options: opts, answer: ans, why: opts.map((o, i) => (i === ans ? "正确。" : ["阻容耦合不能传直流、不能集成。", "直接耦合无法实现电气隔离或阻抗变换。", "变压器笨重、不能集成，也不能传直流。", "光电耦合主要用于隔离，不用于一般的线性级间耦合。"][i])) },
      hints: ["是否需要传直流？是否需要集成？是否需要隔离？是否需要阻抗变换？"],
      solution: `${opts[ans]}。`,
    };
  }),
  gen({ id: "mcp-g-droop", level: 3, topic: T1, title: "方波通过耦合电容的倾斜" }, (g) => {
    const Rsum = e12(g.range(2e3, 20e3));
    const C = g.pick([1, 4.7, 10, 47]) * 1e-6;
    const f = g.pick([10, 50, 100, 500]);
    const tau = Rsum * C;
    const droop = highPassDroop(tau, 1 / (2 * f));
    return {
      prompt: `频率 ${f} Hz 的方波经耦合电容（$C=${formatSI(C, "F")}$，电容两端看进去的总电阻 ${R(Rsum)}）传到下一级。半个周期内方波顶部下降了多少（相对于跳变后的初值，百分数）？`,
      parts: [num("d", "相对下降量", droop, "1", "5%", { tol: 0.03, mistakes: [{ value: 1 / (2 * f) / tau, tag: "approx-misuse", message: "这是线性近似 $t/\\tau$；本题要求用指数 $1-e^{-t/\\tau}$ 精确计算（近似只在 $t\\ll\\tau$ 时成立）。" }] })],
      hints: ["时间常数 $\\tau=RC$。", "高通网络在半个周期内按 $e^{-t/\\tau}$ 衰减，$t=T/2$。"],
      solution: `$\\tau=${formatSI(tau, "s")}$，下降 $1-e^{-T/(2\\tau)}=${sig(droop * 100, 3)}\\%$。`,
    };
  }),
  concept({
    id: "mcp-k-compare",
    level: 3,
    topic: T1,
    title: "阻容耦合与直接耦合的比较",
    prompt: "比较阻容耦合与直接耦合多级放大电路的优缺点，并说明集成运放为什么采用直接耦合。",
    keyPoints: ["阻容：Q 点独立、设计方便；低频差、不能放大直流", "直接：能放大直流、低频特性好", "直接：Q 点互相牵连、存在零点漂移", "集成工艺无法制造大电容，所以集成电路用直接耦合，并用差分输入级抑制漂移"],
    reference: "阻容耦合：电容隔直，各级 Q 点独立，但低频响应差，不能放大直流，且大电容无法集成。直接耦合：能放大直流和缓变信号、便于集成，但各级 Q 点相互影响，且存在零点漂移。集成电路中无法制造大电容，故采用直接耦合，并以差分放大电路作输入级抑制零点漂移。",
  }),
];

/* ═════════════ 动态分析 ═════════════ */
const T2 = "multistage-analysis";
const analysisQ: QuestionTemplate[] = [
  choice({
    id: "ma-c-load",
    topic: T2,
    title: "级间负载",
    prompt: "计算两级放大电路第一级的电压放大倍数时，第一级的负载应取：",
    options: ["$\\infty$（空载）", "最后的负载 $R_L$", "第二级的输入电阻 $R_{i2}$", "第二级的输出电阻 $R_{o2}$"],
    answer: 2,
    why: ["空载增益不能直接用于级联。", "$R_L$ 是第二级的负载。", "正确。", "—"],
    hints: ["第一级的输出端接的是什么？"],
  }),
  choice({
    id: "ma-c-ro",
    topic: T2,
    title: "多级电路的输出电阻",
    prompt: "多级放大电路的输出电阻：",
    options: ["等于各级输出电阻之和", "等于最后一级的输出电阻", "等于第一级的输出电阻", "等于各级输出电阻的并联"],
    answer: 1,
    why: ["输出电阻不相加。", "正确（若末级为共集电路，其 $R_o$ 与前一级的输出电阻有关）。", "第一级决定的是输入电阻。", "—"],
    hints: ["从输出端看进去，首先看到的是哪一级？"],
  }),
  judge({
    id: "ma-j-phase",
    topic: T2,
    title: "两级共射的相位",
    prompt: "两级共射放大电路的输出电压与输入电压同相。",
    answer: true,
    why: "正确。每级共射反相一次，两次反相后同相，总电压放大倍数为正。",
    hints: ["每级共射相移 180°。"],
  }),
  gen({ id: "ma-g-cascade", level: 2, topic: T2, title: "二端口模型级联" }, (g) => {
    const s1 = { Auo: -g.pick([50, 80, 100, 150]), Ri: e12(g.range(1e3, 5e3)), Ro: e12(g.range(2e3, 6e3)) };
    const s2 = { Auo: -g.pick([50, 80, 100]), Ri: e12(g.range(1e3, 5e3)), Ro: e12(g.range(2e3, 6e3)) };
    const RL = e12(g.range(2e3, 10e3));
    const Rs = g.pick([0, 500, 1e3]);
    const c = cascade([s1, s2], Rs, RL);
    return {
      prompt: `两级放大电路，第一级：$A_{uo1}=${s1.Auo}$、$R_{i1}=${R(s1.Ri)}$、$R_{o1}=${R(s1.Ro)}$；第二级：$A_{uo2}=${s2.Auo}$、$R_{i2}=${R(s2.Ri)}$、$R_{o2}=${R(s2.Ro)}$（$A_{uo}$ 为空载增益）。负载 $R_L=${R(RL)}$。求两级的带载增益 $A_{u1}$、$A_{u2}$ 与总增益 $A_u$。`,
      diagram: { id: "block-cascade" },
      parts: [num("a1", "$A_{u1}$", c.stageGains[0], "1", "−30", { mistakes: [{ value: s1.Auo, tag: "load-ignored", message: "第一级接了第二级的输入电阻 $R_{i2}$，要按 $R_{o1}$ 与 $R_{i2}$ 分压。" }] }), num("a2", "$A_{u2}$", c.stageGains[1], "1", "−40"), num("au", "$A_u$", c.Au, "1", "1200", { mistakes: [{ value: c.naive, tag: "load-ignored", message: "不能把空载增益直接相乘。" }] })],
      hints: ["$A_{u1}=A_{uo1}\\dfrac{R_{i2}}{R_{o1}+R_{i2}}$，$A_{u2}=A_{uo2}\\dfrac{R_L}{R_{o2}+R_L}$。"],
      solution: `$A_{u1}=${sig(c.stageGains[0], 3)}$，$A_{u2}=${sig(c.stageGains[1], 3)}$，$A_u=${sig(c.Au, 4)}$（空载增益直接相乘会得到 ${sig(c.naive, 4)}）。`,
    };
  }),
  gen({ id: "ma-g-cece", level: 2, topic: T2, title: "两级共射电路" }, (g) => {
    const p1 = divCE(g);
    const p2 = divCE(g);
    const RL = e12(g.range(2e3, 10e3));
    const t = analyzeCECE(p1, p2, RL);
    const a1 = analyzeCE(p1);
    const a2 = analyzeCE(p2);
    return {
      prompt: `两级阻容耦合共射电路（射极电阻均被旁路）。第一级：$R_c=${R(p1.Rc)}$，$r_{be1}=${R(a1.ac.rbe)}$，$\\beta_1=${p1.beta}$，$R_{b1}\\para R_{b2}=${R(a1.dc.RB)}$；第二级：$R_c=${R(p2.Rc)}$，$r_{be2}=${R(a2.ac.rbe)}$，$\\beta_2=${p2.beta}$，$R_{b1}'\\para R_{b2}'=${R(a2.dc.RB)}$；$R_L=${R(RL)}$。求 $R_{i2}$、$\\dot A_{u1}$、$\\dot A_{u2}$、$\\dot A_u$。`,
      parts: [
        num("ri2", "$R_{i2}$", t.Ri2, "Ω", "kΩ"),
        num("a1", "$\\dot A_{u1}$", t.A1, "1", "−40", { signMessage: "共射反相。", mistakes: [{ value: t.A1open, tag: "load-ignored", message: "第一级的负载是 $R_{c1}\\para R_{i2}$，不能按空载算。" }] }),
        num("a2", "$\\dot A_{u2}$", t.A2, "1", "−80", { signMessage: "共射反相。" }),
        num("au", "$\\dot A_u$", t.Au, "1", "3000", { signMessage: "两级共射，总增益为正。" }),
      ],
      hints: ["$R_{i2}=R_{b1}'\\para R_{b2}'\\para r_{be2}$。", "$\\dot A_{u1}=-\\beta_1(R_{c1}\\para R_{i2})/r_{be1}$，$\\dot A_{u2}=-\\beta_2(R_{c2}\\para R_L)/r_{be2}$。"],
      solution: `$R_{i2}=${R(t.Ri2)}$，$\\dot A_{u1}=${sig(t.A1, 3)}$，$\\dot A_{u2}=${sig(t.A2, 3)}$，$\\dot A_u=${sig(t.Au, 4)}$。`,
    };
  }),
  gen({ id: "ma-g-rio", level: 2, topic: T2, title: "多级电路的输入、输出电阻" }, (g) => {
    const p1 = divCE(g);
    const p2 = divCE(g);
    const t = analyzeCECE(p1, p2, 5e3);
    return {
      prompt: `上一题类型的两级共射电路：第一级 $R_{b1}\\para R_{b2}=${R(analyzeCE(p1).dc.RB)}$、$r_{be1}=${R(analyzeCE(p1).ac.rbe)}$；第二级 $R_{c2}=${R(p2.Rc)}$。求整个电路的输入电阻与输出电阻。`,
      parts: [num("ri", "$R_i$", t.Ri, "Ω", "kΩ"), num("ro", "$R_o$", t.Ro, "Ω", "kΩ", { mistakes: [{ value: p1.Rc, tag: "io-resistance", message: "输出电阻看的是最后一级：$R_o\\approx R_{c2}$。" }] })],
      hints: ["$R_i=R_{i1}$，$R_o=R_{o2}$。"],
      solution: `$R_i=${R(t.Ri)}$，$R_o=${R(t.Ro)}$。`,
    };
  }),
  gen({ id: "ma-g-cecc", level: 3, topic: T2, title: "共射–共集两级电路" }, (g) => {
    const p1 = divCE(g);
    const cc: StageParams = { ...DEFAULT_CC, topology: "divider", Rb1: e12(g.range(50e3, 150e3)), Rb2: e12(g.range(50e3, 150e3)), Re: e12(g.range(1e3, 3e3)), beta: g.pick([80, 100, 120]), rbb: 200 };
    const RL = g.pick([100, 200, 470, 1e3]);
    const t = analyzeCECC(p1, cc, RL);
    const a1 = analyzeCE(p1);
    return {
      prompt: `共射–共集两级电路。第一级（共射，射极全旁路）：$R_{c1}=${R(p1.Rc)}$，$\\beta_1=${p1.beta}$，$r_{be1}=${R(a1.ac.rbe)}$。第二级（射极跟随器）：$R_{b3}=${R(cc.Rb2)}$、$R_{b4}=${R(cc.Rb1)}$，$R_{e2}=${R(cc.Re)}$，$\\beta_2=${cc.beta}$，$r_{bb'}=200\\,\\Omega$，需自行求其 Q 点（$V_{CC}=12$ V，$U_{BE}=0.7$ V，戴维南等效）。$R_L=${R(RL)}$。求 $R_{i2}$、$\\dot A_{u1}$、$\\dot A_{u2}$、$\\dot A_u$ 和 $R_o$。`,
      diagram: { id: "cecc-amp", labels: { Rc1: R(p1.Rc), Rb3: R(cc.Rb2), Rb4: R(cc.Rb1), Re2: R(cc.Re), RL: R(RL) } },
      parts: [
        num("ri2", "$R_{i2}$", t.Ri2, "Ω", "kΩ", { tol: 0.04 }),
        num("a1", "$\\dot A_{u1}$", t.A1, "1", "−80", { tol: 0.04, signMessage: "共射反相。", mistakes: [{ value: t.A1open, tag: "load-ignored", message: "第一级的负载是第二级的输入电阻：$R_{L1}'=R_{c1}\\para R_{i2}$，不能按空载算。" }] }),
        num("a2", "$\\dot A_{u2}$", t.A2, "1", "0.95", { tol: 0.01, mistakes: [{ value: 1, tag: "approx-misuse", message: "$\\dot A_{u2}$ 略小于 1，本题要求按射极跟随器公式计算。" }] }),
        num("au", "$\\dot A_u$", t.Au, "1", "−75", { tol: 0.04, mistakes: [{ value: t.A1open * t.A2, tag: "load-ignored", message: "不能用第一级的空载增益相乘：第一级要带上第二级的输入电阻 $R_{i2}$。" }] }),
        num("ro", "$R_o$", t.Ro, "Ω", "Ω", { tol: 0.06, mistakes: [{ value: p1.Rc, tag: "io-resistance", message: "输出电阻看的是最后一级（射极跟随器）：$R_o=R_{e2}\\para\\dfrac{r_{be2}+R_{c1}\\para R_B}{1+\\beta_2}$。" }] }),
      ],
      hints: ["先求第二级的 Q 点和 $r_{be2}$。", "$R_{i2}=R_{b3}\\para R_{b4}\\para[r_{be2}+(1+\\beta_2)(R_{e2}\\para R_L)]$。", "$R_o=R_{e2}\\para\\dfrac{r_{be2}+R_{c1}\\para R_{b3}\\para R_{b4}}{1+\\beta_2}$。"],
      solution: `$R_{i2}=${R(t.Ri2)}$，$\\dot A_{u1}=${sig(t.A1, 3)}$，$\\dot A_{u2}=${sig(t.A2, 4)}$，$\\dot A_u=${sig(t.Au, 3)}$，$R_o=${R(t.Ro)}$。`,
    };
  }),
  gen({ id: "ma-g-buffer", level: 3, topic: T2, title: "比较：有无共集输出级" }, (g) => {
    const p1 = divCE(g);
    const cc: StageParams = { ...DEFAULT_CC, topology: "divider", Rb1: 100e3, Rb2: 100e3, Re: 2e3 };
    const RL = g.pick([50, 100, 200]);
    const one = analyzeCE({ ...p1, RL });
    const two = analyzeCECC(p1, cc, RL);
    return {
      prompt: `共射电路（$R_c=${R(p1.Rc)}$、$\\beta=${p1.beta}$、$r_{be}=${R(analyzeCE(p1).ac.rbe)}$，射极全旁路）直接驱动 $R_L=${R(RL)}$ 时增益为多少？在中间插入射极跟随器（已算得 $R_{i2}=${R(two.Ri2)}$、$\\dot A_{u2}=${sig(two.A2, 3)}$）后总增益为多少？`,
      parts: [num("one", "直接驱动", one.ac.Au, "1", "−5", { signMessage: "共射反相。" }), num("two", "插入跟随器后", two.Au, "1", "−50", { signMessage: "共射反相，跟随器同相，总体反相。" })],
      hints: ["直接驱动：$-\\beta(R_c\\para R_L)/r_{be}$。", "插入后：$-\\beta(R_c\\para R_{i2})/r_{be}\\times\\dot A_{u2}$。"],
      solution: `${sig(one.ac.Au, 3)} → ${sig(two.Au, 3)}，提高约 ${sig(two.Au / one.ac.Au, 3)} 倍。`,
    };
  }),
  concept({
    id: "ma-k-order",
    level: 3,
    topic: T2,
    title: "多级电路的分析顺序",
    prompt: "说明分析多级放大电路动态参数时的计算顺序，以及共集电路在其中需要特别注意的地方。",
    keyPoints: ["先求各级 Q 点和 r_be", "从后往前求各级输入电阻（后级 R_i 作前级负载）", "从前往后求各级输出电阻（前级 R_o 作后级信号源内阻）", "总增益 = 各级带载增益之积；R_i = R_i1，R_o = R_on", "共集级的 R_i 与其负载有关，R_o 与其信号源内阻有关"],
    reference: "先静态后动态。动态：从最后一级开始向前求输入电阻，把后级 $R_i$ 作为前级负载求各级带载增益；从第一级开始向后求输出电阻，把前级 $R_o$ 作为后级的信号源内阻。总增益为各级带载增益之积。共集电路的输入电阻依赖负载、输出电阻依赖信号源内阻，必须按上述顺序计算。",
  }),
];

/* ═════════════ 零点漂移 ═════════════ */
const T3 = "zero-drift";
const driftQ: QuestionTemplate[] = [
  choice({
    id: "zd-c-what",
    topic: T3,
    title: "零点漂移的含义",
    prompt: "直接耦合放大电路的零点漂移是指：",
    options: ["输入信号频率漂移", "输入为零时，输出电压偏离原值并缓慢变化", "增益随频率变化", "输出波形失真"],
    answer: 1,
    why: ["与频率无关。", "正确。", "那是频率响应。", "那是非线性失真。"],
    hints: ["“零点”指什么？"],
  }),
  choice({
    id: "zd-c-main",
    topic: T3,
    title: "零点漂移的主要原因",
    prompt: "引起零点漂移的最主要原因是：",
    options: ["电源电压波动", "温度变化引起晶体管参数变化", "电阻老化", "输入信号太大"],
    answer: 1,
    why: ["也会引起漂移，但用稳压电源可大大减小。", "正确：所以零点漂移也叫温度漂移。", "影响较小。", "与漂移无关。"],
    hints: ["$U_{BE}$、$\\beta$、$I_{CBO}$ 都与什么有关？"],
  }),
  judge({
    id: "zd-j-first",
    topic: T3,
    title: "哪一级的漂移影响最大",
    prompt: "多级直接耦合放大电路中，最后一级的零点漂移对输出影响最大。",
    answer: false,
    why: "错误。第一级的漂移被后面所有级放大，影响最大；折合到输入端的漂移约等于第一级的漂移。",
    hints: ["第一级的漂移要经过几级放大？"],
  }),
  gen({ id: "zd-g-refer", level: 2, topic: T3, title: "折合到输入端的漂移" }, (g) => {
    const Au = g.pick([200, 500, 1000, 2000, 5000]);
    const dOut = g.pick([0.1, 0.2, 0.5, 1, 2]);
    return {
      prompt: `某直接耦合放大电路电压放大倍数为 ${Au}，输入端短路时，温度升高 10 °C 后输出电压漂移了 ${dOut} V。折合到输入端的温漂是多少（每摄氏度）？`,
      parts: [num("d", "温漂", dOut / Au / 10, "V", "µV", { mistakes: [{ value: dOut / Au, tag: "unit-convert", message: "还要除以温度变化量 10 °C，得到每摄氏度的漂移。" }] })],
      hints: ["折合到输入端 = 输出漂移 / 总增益。", "再除以温度变化量。"],
      solution: `${formatSI(dOut / Au / 10, "V")}/°C。`,
    };
  }),
  gen({ id: "zd-g-compare", level: 2, topic: T3, title: "比较两个放大电路的温漂" }, (g) => {
    const A1 = g.pick([100, 200]);
    const A2 = g.pick([1000, 2000]);
    const d1 = g.pick([20, 40, 60]) * 1e-3;
    const d2 = g.pick([100, 200, 400]) * 1e-3;
    const r1 = d1 / A1;
    const r2 = d2 / A2;
    return {
      prompt: `放大电路甲：增益 ${A1}，某温度变化下输出漂移 ${formatSI(d1, "V")}；放大电路乙：增益 ${A2}，同样温度变化下输出漂移 ${formatSI(d2, "V")}。分别求折合到输入端的漂移，并判断哪个电路温度稳定性更好（甲填 1，乙填 2）。`,
      parts: [num("a", "甲", r1, "V", "µV"), num("b", "乙", r2, "V", "µV"), num("w", "更好", r1 < r2 ? 1 : 2, "1", "1", { tol: 0.01 })],
      hints: ["比较的是折合到输入端的漂移，不是输出漂移。"],
      solution: `甲 ${formatSI(r1, "V")}，乙 ${formatSI(r2, "V")}；${r1 < r2 ? "甲" : "乙"}更好。`,
    };
  }),
  gen({ id: "zd-g-stages", level: 2, topic: T3, title: "三级电路的输出漂移" }, (g) => {
    const A = [-g.pick([20, 30, 50]), -g.pick([20, 30, 50]), g.pick([5, 10])];
    const dd = g.pick([1, 2, 3]) * 1e-3;
    const r = inputReferredDrift([dd, dd, dd], A);
    return {
      prompt: `三级直接耦合放大电路各级（带载）增益为 ${A[0]}、${A[1]}、${A[2]}。温度变化后，每一级在其自身输入端等效产生 ${formatSI(dd, "V")} 的漂移。求输出端总漂移电压以及第一级贡献的比例。`,
      parts: [num("o", "输出漂移", r.output, "V", "V", { tol: 0.02 }), num("k", "第一级占比", r.contributions[0] / r.output, "1", "95%", { tol: 0.01 })],
      hints: ["第 k 级的漂移被第 k 级及其后各级放大。", "$\\Delta u_O=\\Delta u_1A_1A_2A_3+\\Delta u_2A_2A_3+\\Delta u_3A_3$。"],
      solution: `输出漂移 ${V(r.output)}，第一级占 ${sig((r.contributions[0] / r.output) * 100, 3)}%。`,
    };
  }),
  gen({ id: "zd-g-ube", level: 3, topic: T3, title: "U_BE 温漂引起的输出漂移" }, (g) => {
    const dT = g.pick([10, 20, 30]);
    const A = g.pick([100, 500, 1000]);
    const dU = atTemperature({ beta: 100, UBE: 0.7, ICBO: 0 }, 25 + dT).UBE - 0.7;
    const out = inputReferredDrift([dU], [A]).output;
    return {
      prompt: `直接耦合放大电路输入级晶体管的 $U_{BE}$ 温度系数约为 −2.2 mV/°C，该变化相当于在输入端加了一个漂移电压。电路总增益为 ${A}（同相），温度升高 ${dT} °C，输出端将漂移多少？若要求输出漂移不超过 0.1 V，折合到输入端的温漂应小于多少（每摄氏度）？`,
      parts: [num("o", "输出漂移", out, "V", "V"), num("lim", "允许的输入端温漂", 0.1 / A / dT, "V", "µV")],
      hints: ["$\\Delta u_O=A\\cdot\\Delta U_{BE}$。", "允许值 = 0.1 V /(增益 × ΔT)。"],
      solution: `输出漂移 ${V(out)}；要求输入端温漂 < ${formatSI(0.1 / A / dT, "V")}/°C——单管电路做不到，需要差分输入级。`,
    };
  }),
  gen({ id: "zd-g-diff", level: 3, topic: T3, title: "对称结构抵消漂移" }, (g) => {
    const dT = g.pick([10, 20, 40]);
    const mismatch = g.pick([0.01, 0.02, 0.05]);
    const dU1 = atTemperature({ beta: 100, UBE: 0.7, ICBO: 0 }, 25 + dT).UBE - 0.7;
    const dU2 = dU1 * (1 + mismatch);
    return {
      prompt: `差分输入级的两只晶体管 $U_{BE}$ 温度系数分别约为 −2.2 mV/°C 和 −2.2×(1+${mismatch}) mV/°C。温度升高 ${dT} °C，单管的 $U_{BE}$ 漂移为多少？两管 $U_{BE}$ 之差的漂移（等效差模输入漂移）为多少？`,
      parts: [num("s", "单管漂移", dU1, "V", "mV"), num("d", "差值漂移", Math.abs(dU2 - dU1), "V", "µV")],
      hints: ["差分电路只放大两管之差，相同的变化相互抵消。"],
      solution: `单管 ${formatSI(dU1, "V")}，差值只有 ${formatSI(Math.abs(dU2 - dU1), "V")}，小了约 ${sig(1 / mismatch, 3)} 倍。两管越对称，抵消越彻底。`,
    };
  }),
  concept({
    id: "zd-k-why-first",
    level: 3,
    topic: T3,
    title: "为什么要折合到输入端",
    prompt: "为什么衡量放大电路的零点漂移要把输出漂移折合到输入端？为什么说抑制漂移的关键在第一级？",
    keyPoints: ["输出漂移与增益有关，不同电路无法直接比较", "折合到输入端后可与输入信号直接比较，决定能分辨的最小信号", "折合到输入端的漂移 = Δu1 + Δu2/A1 + …", "后级漂移被前级增益削弱，第一级起决定作用"],
    reference: "增益越大输出漂移越大，用输出漂移无法比较不同电路；折合到输入端后，可直接与有用信号比较——输入信号必须明显大于它才能被分辨。由 $\\Delta u_I=\\Delta u_1+\\Delta u_2/A_1+\\cdots$ 可见，后级的漂移被前级增益除掉，第一级的漂移起决定作用。",
  }),
];

export const CH5_QUESTIONS: QuestionTemplate[] = [...couplingQ, ...analysisQ, ...driftQ];
