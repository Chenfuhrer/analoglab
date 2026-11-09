/** 第 11 章题库（原创）：振荡条件、RC 振荡器、LC/晶体振荡器、有源滤波器 */
import { colpittsF0, crystalFreqs, filterCutoff, filterQ, filterResponse, hartleyF0, lcF0, lcTankQ, simulateWien, threePointRule, wienF0, wienNetwork, type FilterKind } from "@/simulations/osc/osc";
import { cabs, capForCorner } from "@/simulations/signal/rc";
import { formatSI, sig } from "@/simulations/units";
import { e12 } from "../generators";
import { choice, concept, gen, judge, num } from "../helpers";
import type { QuestionTemplate } from "../types";

const Hz = (x: number) => formatSI(x, "Hz");
const R = (x: number) => formatSI(x, "Ω");
const F = (x: number) => formatSI(x, "F");

/* ═════════════ 振荡条件 ═════════════ */
const T1 = "osc-condition";
const condQ: QuestionTemplate[] = [
  choice({
    id: "oc-c-start",
    topic: T1,
    title: "起振条件",
    prompt: "正弦波振荡电路的起振条件是：",
    options: ["$|\\dot A\\dot F|=1$", "$|\\dot A\\dot F|>1$ 且满足相位条件", "$|\\dot A\\dot F|<1$", "$\\dot A\\dot F=-1$"],
    answer: 1,
    why: ["这是平衡条件。", "正确。", "会停振。", "那是负反馈放大电路的自激条件写法。"],
    hints: ["起振时信号要逐渐增大。"],
  }),
  choice({
    id: "oc-c-select",
    topic: T1,
    title: "选频网络的作用",
    prompt: "正弦波振荡电路中选频网络的作用是：",
    options: ["提供能量", "使只有一个频率满足振荡条件，从而输出正弦波", "稳定幅度", "提高增益"],
    answer: 1,
    why: ["能量来自电源，由放大电路转换。", "正确。", "那是稳幅环节的作用。", "—"],
    hints: ["没有选频网络会怎样？"],
  }),
  judge({
    id: "oc-j-input",
    topic: T1,
    title: "振荡器需要输入吗",
    prompt: "正弦波振荡电路需要外加一个很小的正弦信号才能起振。",
    answer: false,
    why: "错误。电路中的噪声和接通电源时的冲击包含各种频率成分，选频网络从中挑出 $f_0$ 分量，只要满足起振条件就会自行增长。",
    hints: ["振荡器的输入端接什么？"],
  }),
  gen({ id: "oc-g-af", level: 2, topic: T1, title: "判断起振、平衡与停振" }, (g) => {
    const A = g.pick([2.5, 2.9, 3, 3.1, 3.5]);
    const af = A / 3;
    const ans = af > 1.0001 ? 0 : af < 0.9999 ? 2 : 1;
    const opts = ["能起振（幅度增大，需稳幅）", "处于平衡（理论上维持，但不能自行起振）", "不能起振（停振）"];
    return {
      prompt: `文氏桥振荡器中选频网络在 $f_0$ 处 $F=1/3$，同相放大电路的电压放大倍数为 ${A}。电路将：`,
      choice: { wrongTag: "osc-condition", options: opts, answer: ans, why: opts.map((_, i) => (i === ans ? `正确：$AF=${sig(af, 3)}$。` : `$AF=${sig(af, 3)}$。`)) },
      hints: ["计算 $AF$ 并与 1 比较。"],
      solution: `$AF=${sig(af, 3)}$，${opts[ans]}。`,
    };
  }),
  gen({ id: "oc-g-minA", level: 2, topic: T1, title: "起振所需的最小增益" }, (g) => {
    const Fm = g.pick([1 / 3, 0.1, 0.05, 0.2]);
    return {
      prompt: `某正弦波振荡电路的反馈网络在振荡频率处 $|\\dot F|=${sig(Fm, 3)}$，且相位条件满足。放大电路的电压放大倍数至少要大于多少才能起振？`,
      parts: [num("a", "$A_{\\min}$", 1 / Fm, "1", "3", { tol: 0.01 })],
      hints: ["$|AF|>1$。"],
      solution: `$A>1/F=${sig(1 / Fm, 3)}$。`,
    };
  }),
  gen({ id: "oc-g-growth", level: 2, topic: T1, title: "起振时幅度的增长" }, (g) => {
    const af = g.pick([1.05, 1.1, 1.2]);
    const n = g.pick([10, 20, 50]);
    return {
      prompt: `起振阶段环路增益 $|AF|=${af}$（忽略非线性）。从初始扰动开始，信号绕环路 ${n} 圈后幅度变为原来的多少倍？`,
      parts: [num("k", "倍数", Math.pow(af, n), "1", "6.7", { tol: 0.01 })],
      hints: ["每绕一圈乘以 $|AF|$。"],
      solution: `$${af}^{${n}}\\approx${sig(Math.pow(af, n), 3)}$ 倍——指数增长，直到稳幅环节起作用。`,
    };
  }),
  gen({ id: "oc-g-sim", level: 3, topic: T1, title: "仿真：增益与稳态" }, (g) => {
    const K = g.pick([3.1, 3.2, 3.3]);
    const s = simulateWien({ R: 10e3, C: 15.9e-9, K, Ulim: 8, periods: 80, stepsPerPeriod: 60 });
    return {
      prompt: `文氏桥振荡器 $R=10$ kΩ、$C=15.9$ nF，放大器小信号增益 ${K}，输出软限幅（大信号时增益自动降低）。电路的振荡频率约为多少？稳态时放大器对基波的等效增益约为多少？`,
      parts: [num("f", "振荡频率", s.freq, "Hz", "Hz", { alts: [wienF0(10e3, 15.9e-9)], tol: 0.03 }), num("a", "等效增益", 3, "1", "3", { tol: 0.02 })],
      hints: ["振荡频率由选频网络决定：$f_0=1/(2\\pi RC)$。", "稳态时 $|AF|=1$，$F=1/3$。"],
      solution: `约 ${Hz(s.freq)}；稳态等效增益为 3。`,
    };
  }),
  concept({
    id: "oc-k-steps",
    level: 3,
    topic: T1,
    title: "判断电路能否振荡",
    prompt: "写出判断一个电路能否产生正弦波振荡的步骤。",
    keyPoints: ["检查是否有放大电路、正反馈网络、选频网络、稳幅环节", "放大电路能否正常工作（静态工作点合适）", "用瞬时极性法判断在 f0 处是否为正反馈（相位条件）", "判断 |AF| 是否大于 1（起振条件）"],
    reference: "①看组成：放大、正反馈、选频、稳幅四部分是否具备；②看放大电路能否正常放大（偏置是否合适、是否被短路）；③在选频频率处用瞬时极性法判断是否满足相位条件；④估算 $|\\dot A\\dot F|$ 是否大于 1。",
  }),
  choice({
    id: "oc-c-amp",
    level: 3,
    topic: T1,
    title: "稳幅环节",
    prompt: "若振荡电路没有专门的稳幅环节，输出幅度最终由什么限制？",
    options: ["选频网络", "放大器进入饱和/截止等非线性区", "负载电阻", "无法限制，会一直增大"],
    answer: 1,
    why: ["选频网络决定频率，不决定幅度。", "正确：此时输出波形会明显失真。", "—", "受电源电压限制。"],
    hints: ["放大器的输出能超过电源电压吗？"],
  }),
];

/* ═════════════ RC 振荡 ═════════════ */
const T2 = "osc-rc";
const rcQ: QuestionTemplate[] = [
  choice({
    id: "or-c-F",
    topic: T2,
    title: "RC 串并联网络在 f₀ 处",
    prompt: "RC 串并联选频网络在 $f_0=1/(2\\pi RC)$ 时：",
    options: ["$F=1$，相移 0°", "$F=1/3$，相移 0°", "$F=1/3$，相移 180°", "$F=3$，相移 0°"],
    answer: 1,
    why: ["—", "正确。", "相移为 0。", "无源网络的 F 不会大于 1。"],
    hints: ["$\\dot F=1/[3+j(f/f_0-f_0/f)]$。"],
  }),
  judge({
    id: "or-j-rf",
    topic: T2,
    title: "文氏桥振荡器的电阻",
    prompt: "文氏桥振荡器中，若同相放大器的 $R_f=2R_1$ 恰好成立，电路就能可靠地起振。",
    answer: false,
    why: "错误。$R_f=2R_1$ 时 $A=3$、$AF=1$，只满足平衡条件，不能从噪声中起振；应使 $R_f$ 略大于 $2R_1$，再靠稳幅环节回到平衡。",
    hints: ["起振条件与平衡条件有什么区别？"],
  }),
  choice({
    id: "or-c-ntc",
    topic: T2,
    title: "热敏电阻稳幅",
    prompt: "文氏桥振荡器中用热敏电阻稳幅，应把负温度系数热敏电阻用作：",
    options: ["$R_f$（反馈电阻）", "$R_1$（接地电阻）", "选频网络中的 R", "负载"],
    answer: 0,
    why: ["正确：幅度增大 → 电流增大、发热 → $R_f$ 减小 → 增益下降。", "若作 $R_1$，幅度增大时 $R_1$ 减小，增益反而增大。", "会改变频率。", "—"],
    hints: ["幅度增大时需要增益减小。"],
  }),
  gen({ id: "or-g-f0", level: 2, topic: T2, title: "文氏桥振荡频率" }, (g) => {
    const Rr = e12(g.range(1e3, 100e3));
    const C = g.pick([1, 2.2, 4.7, 10, 22, 47]) * 1e-9;
    const f0 = wienF0(Rr, C);
    return {
      prompt: `文氏桥振荡器 $R=${R(Rr)}$，$C=${F(C)}$。求振荡频率。`,
      diagram: { id: "wien-bridge" },
      parts: [num("f", "$f_0$", f0, "Hz", "Hz", { mistakes: [{ value: 1 / (Rr * C), tag: "omega-f", message: "这是角频率，$f_0=1/(2\\pi RC)$。" }] })],
      hints: ["$f_0=\\dfrac{1}{2\\pi RC}$。"],
      solution: `$f_0=${Hz(f0)}$。`,
    };
  }),
  gen({ id: "or-g-rf", level: 2, topic: T2, title: "起振所需的反馈电阻" }, (g) => {
    const R1 = e12(g.range(2e3, 20e3));
    return {
      prompt: `文氏桥振荡器同相放大器的 $R_1=${R(R1)}$。为满足平衡条件，$R_f$ 应为多少？为保证起振，$R_f$ 应满足什么条件（填临界值）？`,
      diagram: { id: "wien-bridge", labels: { R1: R(R1) } },
      parts: [num("rf", "$R_f$（平衡）", 2 * R1, "Ω", "kΩ", { mistakes: [{ value: 3 * R1, tag: "opamp-config", message: "$A=1+R_f/R_1=3$，所以 $R_f=2R_1$。" }] })],
      hints: ["$1+R_f/R_1=3$。"],
      solution: `$R_f=2R_1=${R(2 * R1)}$；起振要求 $R_f$ 略大于 ${R(2 * R1)}。`,
    };
  }),
  gen({ id: "or-g-F", level: 2, topic: T2, title: "偏离 f₀ 时的反馈系数" }, (g) => {
    const k = g.pick([0.5, 0.8, 1.25, 2]);
    const Fv = wienNetwork(k * 1e3, 1e3);
    return {
      prompt: `RC 串并联网络 $f_0=1$ kHz。在 $f=${sig(k * 1e3, 3)}$ Hz 时，$|\\dot F|$ 是多少？`,
      parts: [num("F", "$|\\dot F|$", cabs(Fv), "1", "0.3", { tol: 0.01 })],
      hints: ["$|\\dot F|=1/\\sqrt{9+(f/f_0-f_0/f)^2}$。"],
      solution: `$|\\dot F|=${sig(cabs(Fv), 4)}$（小于 1/3）。`,
    };
  }),
  gen({ id: "or-g-design", level: 3, topic: T2, title: "设计文氏桥振荡器" }, (g) => {
    const f = g.pick([100, 500, 1e3, 2e3, 10e3]);
    const C = g.pick([10, 22, 47]) * 1e-9;
    const Rr = capForCorner(C, f); // R = 1/(2πfC)，与 C 对称
    return {
      prompt: `要设计一个振荡频率为 ${Hz(f)} 的文氏桥振荡器，选频网络电容取 $C=${F(C)}$。电阻 R 应为多少？`,
      parts: [num("r", "$R$", Rr, "Ω", "kΩ", { tol: 0.02 })],
      hints: ["$R=\\dfrac{1}{2\\pi f_0C}$。"],
      solution: `$R=${R(Rr)}$（取最接近的标称值并可微调）。验证：$f_0=${Hz(wienF0(Rr, C))}$。`,
    };
  }),
  gen({ id: "or-g-diode", level: 3, topic: T2, title: "二极管稳幅的增益" }, (g) => {
    const R1 = 10e3;
    const Rf1 = g.pick([15e3, 18e3]);
    const Rf2 = g.pick([4.7e3, 6.8e3, 10e3]);
    const small = 1 + (Rf1 + Rf2) / R1;
    return {
      prompt: `文氏桥振荡器 $R_1=10$ kΩ，$R_f$ 由 $R_{f1}=${R(Rf1)}$ 与 $R_{f2}=${R(Rf2)}$ 串联，$R_{f2}$ 两端反向并联两只二极管。小信号（二极管截止）时放大倍数是多少？大信号时二极管导通近似把 $R_{f2}$ 短路，放大倍数变为多少？`,
      parts: [num("s", "小信号 $A$", small, "1", "3.3", { tol: 0.01 }), num("l", "二极管导通后 $A$", 1 + Rf1 / R1, "1", "2.8", { tol: 0.01 })],
      hints: ["$A=1+R_f/R_1$。"],
      solution: `小信号 $A=${sig(small, 3)}$（>3，可起振）；导通后 $A=${sig(1 + Rf1 / R1, 3)}$（<3），稳态幅度停在二者之间使平均 $A=3$。`,
    };
  }),
  concept({
    id: "or-k-why-rc",
    level: 3,
    topic: T2,
    title: "RC 振荡器为什么用于低频",
    prompt: "说明 RC 桥式振荡器的适用频率范围及原因。",
    keyPoints: ["f0 = 1/(2πRC)，频率高时 R、C 值很小", "小电容与分布电容、运放输入电容可比，频率不准", "运放带宽有限，高频时放大器附加相移和增益下降", "低频时 LC 振荡器需要很大的 L、C，而 RC 容易实现"],
    reference: "RC 振荡器频率 $f_0=1/(2\\pi RC)$，频率较高时所需电阻、电容都很小，分布参数和运放的有限带宽会严重影响相位和增益，因此一般用于 1 MHz 以下的低频；而在低频段，LC 振荡器需要体积很大的电感和电容，RC 振荡器更适合。",
  }),
];

/* ═════════════ LC 振荡 ═════════════ */
const T3 = "osc-lc";
const lcQ: QuestionTemplate[] = [
  choice({
    id: "ol-c-z",
    topic: T3,
    title: "LC 并联谐振",
    prompt: "LC 并联回路谐振时：",
    options: ["阻抗最小，呈感性", "阻抗最大，呈纯阻性", "阻抗最大，呈容性", "阻抗为零"],
    answer: 1,
    why: ["那是串联谐振（且串联谐振时也是纯阻）。", "正确。", "谐振时为纯阻。", "—"],
    hints: ["两支路电流相互抵消。"],
  }),
  judge({
    id: "ol-j-freq",
    topic: T3,
    title: "LC 振荡器的频率范围",
    prompt: "LC 振荡器适合产生几十千赫兹以上的高频正弦波，RC 振荡器适合产生较低频率的正弦波。",
    answer: true,
    why: "正确：低频时 LC 回路需要很大的电感、电容；高频时 RC 网络的元件值太小，受分布参数和放大器带宽影响大。",
    hints: ["比较两种选频网络在低频和高频时所需元件的大小。"],
  }),
  choice({
    id: "ol-c-crystal",
    topic: T3,
    title: "石英晶体振荡器的优点",
    prompt: "石英晶体振荡器最突出的优点是：",
    options: ["输出功率大", "频率稳定度高", "频率可大范围连续调节", "不需要放大电路"],
    answer: 1,
    why: ["输出功率一般很小。", "正确：晶体 Q 值极高、温度系数极小。", "晶体频率基本固定，只能微调。", "仍需放大电路补充能量。"],
    hints: ["晶体的 Q 值有多大？"],
  }),
  gen({ id: "ol-g-rule", level: 2, topic: T3, title: "三点式电路能否振荡" }, (g) => {
    const opts: Array<["L" | "C", "L" | "C", "L" | "C"]> = [
      ["C", "C", "L"],
      ["L", "L", "C"],
      ["L", "C", "C"],
      ["C", "L", "L"],
      ["C", "C", "C"],
    ];
    const [be, ce, bc] = g.pick(opts);
    const res = threePointRule(be, ce, bc);
    const name = (x: string) => (x === "L" ? "电感" : "电容");
    const choices = ["能振荡（电容三点式）", "能振荡（电感三点式）", "不满足相位条件，不能振荡"];
    const ans = !res.ok ? 2 : res.kind === "电容三点式" ? 0 : 1;
    return {
      prompt: `三点式振荡电路的交流通路中，b–e 间为${name(be)}、c–e 间为${name(ce)}、b–c 间为${name(bc)}。判断：`,
      diagram: { id: "three-point", labels: { be, ce, bc } },
      choice: { wrongTag: "osc-condition", options: choices, answer: ans, why: choices.map((_, i) => (i === ans ? "正确：射同基反。" : "按“射同基反”检查：与发射极相连的两个电抗同性质，b–c 间异性质。")) },
      hints: ["射同基反。"],
      solution: choices[ans] + "。",
    };
  }),
  gen({ id: "ol-g-f0", level: 2, topic: T3, title: "LC 回路的谐振频率与 Q" }, (g) => {
    const L = g.pick([10, 47, 100, 470]) * 1e-6;
    const C = g.pick([100, 330, 1000, 2200]) * 1e-12;
    const rr = g.pick([2, 5, 10, 20]);
    const q = lcTankQ(L, C, rr);
    return {
      prompt: `LC 并联回路 $L=${formatSI(L, "H")}$、$C=${F(C)}$，电感损耗电阻 $r=${rr}\\,\\Omega$。求谐振频率和品质因数。`,
      parts: [num("f", "$f_0$", q.f0, "Hz", "MHz"), num("q", "$Q$", q.Q, "1", "50")],
      hints: ["$f_0=1/(2\\pi\\sqrt{LC})$，$Q=\\omega_0L/r$。"],
      solution: `$f_0=${Hz(q.f0)}$，$Q=${sig(q.Q, 3)}$。`,
    };
  }),
  gen({ id: "ol-g-colpitts", level: 2, topic: T3, title: "电容三点式的振荡频率" }, (g) => {
    const L = g.pick([10, 22, 47, 100]) * 1e-6;
    const C1 = g.pick([100, 220, 470, 1000]) * 1e-12;
    const C2 = g.pick([100, 220, 470, 1000]) * 1e-12;
    const f = colpittsF0(L, C1, C2);
    return {
      prompt: `电容三点式振荡电路 $L=${formatSI(L, "H")}$，$C_1=${F(C1)}$，$C_2=${F(C2)}$。求振荡频率。`,
      parts: [num("f", "$f_0$", f, "Hz", "MHz", { mistakes: [{ value: lcF0(L, C1 + C2), tag: "series-parallel", message: "回路中 $C_1$、$C_2$ 是串联的：$C=\\frac{C_1C_2}{C_1+C_2}$。" }] })],
      hints: ["$C=\\frac{C_1C_2}{C_1+C_2}$。"],
      solution: `$f_0=${Hz(f)}$。`,
    };
  }),
  gen({ id: "ol-g-hartley", level: 3, topic: T3, title: "电感三点式的振荡频率" }, (g) => {
    const L1 = g.pick([10, 22, 47]) * 1e-6;
    const L2 = g.pick([5, 10, 22]) * 1e-6;
    const M = g.pick([0, 2, 5]) * 1e-6;
    const C = g.pick([100, 470, 1000]) * 1e-12;
    const f = hartleyF0(L1, L2, M, C);
    return {
      prompt: `电感三点式振荡电路 $L_1=${formatSI(L1, "H")}$，$L_2=${formatSI(L2, "H")}$，互感 $M=${formatSI(M, "H")}$，$C=${F(C)}$。求振荡频率。`,
      parts: [num("f", "$f_0$", f, "Hz", "MHz", { mistakes: [{ value: lcF0(L1 + L2, C), tag: "series-parallel", message: "还要计入互感：$L=L_1+L_2+2M$。" }] })],
      hints: ["$L=L_1+L_2+2M$。"],
      solution: `$f_0=${Hz(f)}$。`,
    };
  }),
  gen({ id: "ol-g-crystal", level: 3, topic: T3, title: "石英晶体的两个谐振频率" }, (g) => {
    const Lq = g.pick([0.05, 0.1, 0.2]);
    const Cq = g.pick([0.01, 0.02, 0.05]) * 1e-12;
    const C0 = g.pick([3, 5, 8]) * 1e-12;
    const c = crystalFreqs(Lq, Cq, C0);
    return {
      prompt: `石英晶体等效参数 $L_q=${Lq}$ H、$C_q=${formatSI(Cq, "F")}$、$C_0=${F(C0)}$。求串联谐振频率 $f_s$ 与 $f_p-f_s$。`,
      parts: [num("fs", "$f_s$", c.fs, "Hz", "MHz", { tol: 0.01 }), num("d", "$f_p-f_s$", c.fp - c.fs, "Hz", "kHz", { tol: 0.03 })],
      hints: ["$f_s=1/(2\\pi\\sqrt{L_qC_q})$，$f_p=f_s\\sqrt{1+C_q/C_0}\\approx f_s(1+\\frac{C_q}{2C_0})$。"],
      solution: `$f_s=${Hz(c.fs)}$，$f_p-f_s\\approx${Hz(c.fp - c.fs)}$。`,
    };
  }),
  concept({
    id: "ol-k-rule",
    level: 3,
    topic: T3,
    title: "“射同基反”的道理",
    prompt: "以电容三点式为例，解释“射同基反”为什么能保证相位条件。",
    keyPoints: ["共射放大：集电极电压与基极电压反相 180°", "回路电流 I 流过三个电抗，X_be 与 X_ce 同性质时其电压对发射极反相", "反馈电压（X_be 上）与输出电压（X_ce 上）再反相 180°", "合计 360°，满足正反馈"],
    reference: "回路谐振时环流 $\\dot I$ 依次流过三个电抗。若 $X_{be}$、$X_{ce}$ 同为电容，则以发射极为参考，$\\dot U_{ce}$ 与 $\\dot U_{be}$（反馈电压）方向相反，相差 180°；共射放大又使 $\\dot U_{ce}$ 与 $\\dot U_{be}$ 反相 180°，二者相加为 360°，满足正反馈。b–c 间电抗必须异性质，才能与另两个构成谐振回路。",
  }),
  judge({
    id: "ol-j-crystal",
    level: 3,
    topic: T3,
    title: "并联型晶体振荡器",
    prompt: "并联型晶体振荡器中，晶体工作在 $f_s$ 与 $f_p$ 之间，相当于一个电感。",
    answer: true,
    why: "正确：该窄频段内晶体呈感性，与外接电容构成三点式电路，频率被晶体牢牢“锁”在 $f_s$～$f_p$ 之间。",
    hints: ["看晶体的电抗–频率特性。"],
  }),
];

/* ═════════════ 有源滤波器 ═════════════ */
const T4 = "active-filter";
const filterQs: QuestionTemplate[] = [
  choice({
    id: "af-c-type",
    topic: T4,
    title: "去除 50 Hz 干扰",
    prompt: "要从信号中滤除 50 Hz 的工频干扰，应选用：",
    options: ["低通滤波器", "高通滤波器", "带通滤波器", "带阻滤波器"],
    answer: 3,
    why: ["会把高于截止频率的有用信号也滤掉。", "会滤掉低于截止频率的有用信号。", "只保留某一频段。", "正确：只抑制 50 Hz 附近。"],
    hints: ["只想去掉一个频率附近的成分。"],
  }),
  judge({
    id: "af-j-slope",
    topic: T4,
    title: "二阶滤波器的阻带斜率",
    prompt: "二阶低通滤波器在阻带的衰减斜率为 −40 dB/十倍频，比一阶滤波器的过渡带更陡。",
    answer: true,
    why: "正确：一阶 −20 dB/十倍频，二阶 −40 dB/十倍频。",
    hints: ["高频时分母中 $(f/f_0)^2$ 起主要作用。"],
  }),
  choice({
    id: "af-c-q",
    topic: T4,
    title: "压控电压源滤波器的稳定性",
    prompt: "等值 R、C 的二阶压控电压源低通滤波器中，通带增益 $A_{up}$ 必须：",
    options: ["大于 3", "小于 3", "等于 1", "任意"],
    answer: 1,
    why: ["会自激。", "正确：$Q=1/(3-A_{up})$，$A_{up}\\to3$ 时 $Q\\to\\infty$。", "可以大于 1。", "—"],
    hints: ["写出 Q 的表达式。"],
  }),
  gen({ id: "af-g-first", level: 2, topic: T4, title: "一阶有源低通" }, (g) => {
    const Rr = e12(g.range(1e3, 100e3));
    const C = g.pick([1, 4.7, 10, 47, 100]) * 1e-9;
    const R1 = 10e3;
    const Rf = g.pick([0, 10e3, 22e3, 47e3]);
    const s = { kind: "lp1" as FilterKind, Aup: 1 + Rf / R1, f0: wienF0(Rr, C) };
    return {
      prompt: `一阶有源低通 $R=${R(Rr)}$、$C=${F(C)}$，同相放大器 $R_1=10$ kΩ、$R_f=${R(Rf)}$。求通带增益与截止频率。`,
      diagram: { id: "active-lp", labels: { order: "1", R: R(Rr), C: F(C), R1: "10 kΩ", Rf: R(Rf) } },
      parts: [num("a", "$A_{up}$", s.Aup, "1", "2", { tol: 0.01 }), num("f", "$f_p$", filterCutoff(s), "Hz", "Hz", { tol: 0.02 })],
      hints: ["$A_{up}=1+R_f/R_1$，$f_p=f_0=1/(2\\pi RC)$。"],
      solution: `$A_{up}=${sig(s.Aup, 3)}$，$f_p=${Hz(filterCutoff(s))}$。`,
    };
  }),
  gen({ id: "af-g-q", level: 2, topic: T4, title: "二阶滤波器的 Q 与 f₀ 处增益" }, (g) => {
    const Aup = g.pick([1, 1.586, 2, 2.5]);
    const Q = filterQ(Aup);
    const at = cabs(filterResponse({ kind: "lp2", Aup, f0: 1e3 }, 1e3));
    return {
      prompt: `等值 R、C 的二阶压控电压源低通滤波器，通带增益 $A_{up}=${Aup}$。求品质因数 Q 与 $f=f_0$ 处的增益。`,
      parts: [num("q", "$Q$", Q, "1", "0.707", { tol: 0.01 }), num("a", "$|\\dot A_u(f_0)|$", at, "1", "1.6", { tol: 0.01 })],
      hints: ["$Q=1/(3-A_{up})$，$|\\dot A_u(f_0)|=QA_{up}$。"],
      solution: `$Q=${sig(Q, 3)}$，$|\\dot A_u(f_0)|=${sig(at, 3)}$。`,
    };
  }),
  gen({ id: "af-g-atten", level: 2, topic: T4, title: "阻带衰减" }, (g) => {
    const order = g.pick([1, 2]);
    const k = g.pick([10, 20, 100]);
    const s = { kind: (order === 1 ? "lp1" : "lp2") as FilterKind, Aup: order === 1 ? 1 : 3 - Math.SQRT2, f0: 1e3 };
    const att = 20 * Math.log10(cabs(filterResponse(s, k * 1e3)) / s.Aup);
    return {
      prompt: `${order === 1 ? "一阶" : "二阶巴特沃斯（$A_{up}=1.586$）"}有源低通，$f_0=1$ kHz。在 ${Hz(k * 1e3)} 处增益比通带下降多少 dB？`,
      parts: [num("d", "衰减（dB，负值）", att, "1", "−20", { tol: 0.02 })],
      hints: [order === 1 ? "−20 dB/十倍频。" : "−40 dB/十倍频（远高于 $f_0$ 时）。"],
      solution: `约 ${sig(att, 3)} dB。`,
    };
  }),
  gen({ id: "af-g-design", level: 3, topic: T4, title: "设计二阶巴特沃斯低通" }, (g) => {
    const fc = g.pick([100, 500, 1e3, 2e3]);
    const C = g.pick([10, 22, 47]) * 1e-9;
    const Rr = capForCorner(C, fc);
    const R1 = 10e3;
    const Rf = (3 - Math.SQRT2 - 1) * R1;
    const check = filterCutoff({ kind: "lp2", Aup: 1 + Rf / R1, f0: wienF0(Rr, C) });
    return {
      prompt: `用等值 R、C 的二阶压控电压源电路设计截止频率 ${Hz(fc)} 的巴特沃斯低通，取 $C=${F(C)}$、$R_1=10$ kΩ。求 R 与 $R_f$。`,
      diagram: { id: "active-lp", labels: { order: "2" } },
      parts: [num("r", "$R$", Rr, "Ω", "kΩ", { tol: 0.02 }), num("rf", "$R_f$", Rf, "Ω", "kΩ", { tol: 0.02 })],
      hints: ["巴特沃斯：$Q=0.707$，$A_{up}=3-\\sqrt2\\approx1.586$，截止频率 = $f_0$。", "$R=1/(2\\pi f_0C)$，$R_f=(A_{up}-1)R_1$。"],
      solution: `$R=${R(Rr)}$，$R_f=${R(Rf)}$；验证截止频率 ${Hz(check)}。`,
    };
  }),
  gen({ id: "af-g-hp", level: 3, topic: T4, title: "二阶高通的截止频率" }, (g) => {
    const Aup = g.pick([1, 1.586, 2]);
    const f0 = g.pick([100, 1e3]);
    const fc = filterCutoff({ kind: "hp2", Aup, f0 });
    return {
      prompt: `等值 R、C 的二阶压控电压源高通滤波器，$f_0=${Hz(f0)}$，$A_{up}=${Aup}$。数值求 −3 dB 截止频率。`,
      parts: [num("f", "$f_p$", fc, "Hz", "Hz", { tol: 0.02 })],
      hints: ["$|\\dot A_u|=\\dfrac{A_{up}(f/f_0)^2}{\\sqrt{[1-(f/f_0)^2]^2+(f/(Qf_0))^2}}$，令其等于 $A_{up}/\\sqrt2$。"],
      solution: `$f_p\\approx${Hz(fc)}$（Q=${sig(filterQ(Aup), 3)}）。`,
    };
  }),
  concept({
    id: "af-k-active",
    level: 3,
    topic: T4,
    title: "有源滤波器的优点",
    prompt: "与无源 RC 滤波器相比，有源滤波器有哪些优点？又有什么局限？",
    keyPoints: ["可提供通带增益", "运放输入电阻大、输出电阻小，负载不影响滤波特性，便于级联", "不用电感即可实现高 Q（压控电压源正反馈）", "局限：受运放带宽限制，不适合高频；需要电源；不能处理大功率"],
    reference: "有源滤波器利用运放提供增益，输入电阻大、输出电阻小，滤波特性不受负载影响，多级级联方便；借助正反馈不用电感也能获得较高的 Q。但运放带宽有限，一般只用于几百千赫兹以下；需要电源，也不能用于大电流、大功率场合（如整流滤波）。",
  }),
];

export const CH11_QUESTIONS: QuestionTemplate[] = [...condQ, ...rcQ, ...lcQ, ...filterQs];
