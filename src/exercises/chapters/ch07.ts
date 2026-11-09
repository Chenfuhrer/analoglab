/** 第 7 章题库（原创）：理想运放、比例、加减、积分微分 */
import { clipOut, designLinear, evalLinear, integratorTimeTo, inverting, invertingSum, nonInverting, schmittThresholds, simulateDifferentiator, simulateIntegrator, subtractor } from "@/simulations/opamp/opamp";
import { formatSI, par, sig } from "@/simulations/units";
import { e12 } from "../generators";
import { choice, concept, gen, judge, num } from "../helpers";
import type { QuestionTemplate } from "../types";

const V = (x: number) => formatSI(x, "V");
const R = (x: number) => formatSI(x, "Ω");

/* ═════════════ 理想运放 ═════════════ */
const T1 = "opamp-ideal";
const idealQ: QuestionTemplate[] = [
  choice({
    id: "oi-c-cond",
    topic: T1,
    title: "虚短的成立条件",
    prompt: "“虚短”（$u_+\\approx u_-$）成立的条件是：",
    options: ["运放工作在线性区（引入负反馈）", "运放开环使用", "运放引入正反馈", "任何情况下都成立"],
    answer: 0,
    why: ["正确。", "开环时运放工作在非线性区，输出饱和。", "正反馈时也工作在非线性区。", "非线性区不成立。"],
    hints: ["$u_+-u_-=u_O/A_{od}$ 何时趋于零？"],
  }),
  judge({
    id: "oi-j-virtualopen",
    topic: T1,
    title: "虚断",
    prompt: "运放工作在非线性区（如电压比较器）时，虚断仍然成立。",
    answer: true,
    why: "正确。虚断由极大的输入电阻决定，与工作区无关；虚短则只在线性区成立。",
    hints: ["虚断依据的是哪个参数？"],
  }),
  choice({
    id: "oi-c-comp",
    topic: T1,
    title: "比较器中的运放",
    prompt: "运放构成的电压比较器中，运放一般处于：",
    options: ["深度负反馈、线性区", "开环或正反馈、非线性区", "线性区，增益为 1", "截止状态"],
    answer: 1,
    why: ["那是运算电路。", "正确：输出只有 $\\pm U_{OM}$（或 $\\pm U_Z$）两种状态。", "—", "运放不存在“截止”说法。"],
    hints: ["比较器的输出有几种状态？"],
  }),
  gen({ id: "oi-g-range", level: 2, topic: T1, title: "开环线性区宽度" }, (g) => {
    const lgA = g.pick([4, 4.5, 5, 5.5, 6]);
    const A = Math.pow(10, lgA);
    const UOM = g.pick([10, 12, 13, 14]);
    return {
      prompt: `某运放开环差模增益为 ${sig(20 * lgA, 3)} dB，输出最大电压 $\\pm${UOM}$ V。开环使用时，差模输入电压在什么范围内运放才工作在线性区？（填正边界）`,
      parts: [num("u", "$|u_+-u_-|_{\\max}$", UOM / A, "V", "µV", { mistakes: [{ value: UOM / (20 * lgA), tag: "unit-convert", message: "要先把 dB 换算为倍数：$A_{od}=10^{\\mathrm{dB}/20}$。" }] })],
      hints: ["$A_{od}=10^{\\mathrm{dB}/20}$。", "线性区：$|u_+-u_-|<U_{OM}/A_{od}$。"],
      solution: `$A_{od}=${sig(A, 3)}$，$|u_+-u_-|<${formatSI(UOM / A, "V")}$。`,
    };
  }),
  gen({ id: "oi-g-schmitt", level: 2, topic: T1, title: "滞回比较器的阈值" }, (g) => {
    const R1 = e12(g.range(5e3, 30e3));
    const R2 = e12(g.range(10e3, 100e3));
    const UZ = g.pick([5, 6, 8]);
    const UREF = g.pick([0, 0, 1, 2]);
    const t = schmittThresholds(R1, R2, UZ, UREF);
    // 两个分压系数对调后的（错误）阈值
    const sw = schmittThresholds(R2, R1, UZ, UREF);
    const SWAP = "同相端电压由 $U_{REF}$（经 $R_1$）和 $u_O$（经 $R_2$）叠加：$u_P=\\dfrac{R_2}{R_1+R_2}U_{REF}+\\dfrac{R_1}{R_1+R_2}u_O$，两个分压系数别对调。";
    return {
      prompt: `反相输入滞回比较器：同相端经 $R_1=${R(R1)}$ 接参考电压 $U_{REF}=${UREF}$ V，经 $R_2=${R(R2)}$ 接输出端；输出由双向稳压管限幅为 $\\pm${UZ}$ V。求上、下阈值电压与回差。`,
      diagram: UREF === 0 ? { id: "schmitt", labels: { R1: R(R1), R2: R(R2) } } : undefined,
      parts: [
        num("p", "$U_{T+}$", t.UTp, "V", "V", { mistakes: [{ value: sw.UTp, tag: "ratio-inverted", message: SWAP }] }),
        num("m", "$U_{T-}$", t.UTm, "V", "V", { mistakes: [{ value: sw.UTm, tag: "ratio-inverted", message: SWAP }] }),
        num("w", "$\\Delta U_T$", t.width, "V", "V", { mistakes: [{ value: sw.width, tag: "ratio-inverted", message: SWAP }] }),
      ],
      hints: ["虚断：$u_+=\\dfrac{R_2U_{REF}+R_1u_O}{R_1+R_2}$。", "$u_O=\\pm U_Z$ 分别代入。"],
      solution: `$U_{T+}=${V(t.UTp)}$，$U_{T-}=${V(t.UTm)}$，$\\Delta U_T=${V(t.width)}$。`,
    };
  }),
  gen({ id: "oi-g-vgnd", level: 2, topic: T1, title: "虚地有多“虚”" }, (g) => {
    const lgA = g.pick([4, 5, 6]);
    const A = Math.pow(10, lgA);
    const k = g.pick([5, 10, 20, 50]);
    const ui = g.pick([0.1, 0.2, 0.5]);
    const r = inverting(10e3, k * 10e3, { Aod: A, UOM: 15, rid: Infinity });
    return {
      prompt: `反相比例电路 $R_1=10$ kΩ、$R_f=${k * 10}$ kΩ，运放开环增益 $A_{od}=10^{${lgA}}$。输入 $u_I=${ui}$ V 时，反相输入端的实际电位是多少？`,
      parts: [num("un", "$u_-$", r.uN(ui), "V", "µV", { tol: 0.03 })],
      hints: ["$u_-=-u_O/A_{od}$。", "$u_O\\approx-\\frac{R_f}{R_1}u_I$。"],
      solution: `$u_O\\approx${V(r.actual * ui)}$，$u_-=${formatSI(r.uN(ui), "V")}$——与 0 相差微伏级。`,
    };
  }),
  gen({ id: "oi-g-cross", level: 3, topic: T1, title: "比较器的输出" }, (g) => {
    const R1 = e12(g.range(5e3, 20e3));
    const R2 = e12(R1 * g.range(1.5, 4));
    const UZ = 6;
    const t = schmittThresholds(R1, R2, UZ);
    const state = g.pick([1, -1]);
    const ui = g.pick([t.UTp * 0.5, t.UTp * 1.5, t.UTm * 0.5, t.UTm * 1.5, 0]);
    let out = state * UZ;
    if (state > 0 && ui > t.UTp) out = -UZ;
    if (state < 0 && ui < t.UTm) out = UZ;
    return {
      prompt: `反相输入滞回比较器 $R_1=${R(R1)}$、$R_2=${R(R2)}$、$\\pm U_Z=\\pm6$ V（$U_{REF}=0$）。当前输出为 ${state > 0 ? "+6" : "−6"} V，输入缓慢变化到 $u_I=${sig(ui, 3)}$ V 时，输出为多少？`,
      parts: [num("uo", "$u_O$", out, "V", "V", { tol: 0.01 })],
      hints: [`阈值 $U_{T\\pm}=\\pm\\frac{R_1}{R_1+R_2}U_Z=\\pm${sig(t.UTp, 3)}$ V。`, "输出为高时，只有 $u_I$ 超过 $U_{T+}$ 才翻转；输出为低时，只有 $u_I$ 低于 $U_{T-}$ 才翻转。"],
      solution: `阈值 ±${sig(t.UTp, 3)} V，$u_O=${out > 0 ? "+" : "−"}6$ V。`,
    };
  }),
  concept({
    id: "oi-k-why",
    level: 3,
    topic: T1,
    title: "为什么运放线性应用必须加负反馈",
    prompt: "解释：为什么集成运放作线性放大时必须引入负反馈？虚短在什么情况下会失效？",
    keyPoints: ["开环增益极大（10⁵ 以上），线性区只有微伏级", "开环时任何微小输入或失调都使输出饱和", "负反馈把输出的一部分送回，使差模输入自动维持在微伏级（虚短）", "输出饱和、开环或正反馈时虚短失效"],
    reference: "运放开环增益极大，线性区仅为 $\\pm U_{OM}/A_{od}$（微伏级），开环时几乎必然饱和。引入负反馈后，输出偏大会使反馈量增大、净输入减小，最终自动稳定在线性区，此时 $u_+\\approx u_-$。若开环、正反馈，或输入过大使输出饱和，虚短不再成立。",
  }),
  choice({
    id: "oi-c-ideal",
    level: 3,
    topic: T1,
    title: "理想运放的条件",
    prompt: "下列哪一项**不是**理想运放的条件？",
    options: ["$A_{od}\\to\\infty$", "$r_{id}\\to\\infty$", "$r_o\\to\\infty$", "$K_{CMR}\\to\\infty$"],
    answer: 2,
    why: ["是。", "是。", "正确：理想运放输出电阻为 0，输出电压不受负载影响。", "是。"],
    hints: ["输出电阻越小，带负载能力越强。"],
  }),
];

/* ═════════════ 比例运算 ═════════════ */
const T2 = "opamp-proportional";
const propQ: QuestionTemplate[] = [
  choice({
    id: "op-c-ri",
    topic: T2,
    title: "反相比例的输入电阻",
    prompt: "理想运放构成的反相比例运算电路，输入电阻为：",
    options: ["无穷大", "$R_1$", "$R_f$", "$R_1+R_f$"],
    answer: 1,
    why: ["那是同相比例。", "正确：反相端为虚地，从输入端看进去只有 $R_1$。", "—", "—"],
    hints: ["反相端电位是多少？"],
  }),
  choice({
    id: "op-c-cm",
    topic: T2,
    title: "共模输入电压",
    prompt: "比较反相比例与同相比例电路，运放输入端存在较大共模电压的是：",
    options: ["反相比例", "同相比例", "两者都没有", "两者都有"],
    answer: 1,
    why: ["反相比例两输入端都约为 0。", "正确：两输入端都约为 $u_I$，要求运放共模抑制比高、共模输入范围大。", "—", "—"],
    hints: ["两种电路中 $u_+$ 分别是多少？"],
  }),
  judge({
    id: "op-j-follower",
    topic: T2,
    title: "电压跟随器有什么用",
    prompt: "电压跟随器的电压放大倍数为 1，没有实际用途。",
    answer: false,
    why: "错误。电压跟随器输入电阻极大、输出电阻极小，用作缓冲隔离：既不从信号源取电流，又能驱动负载。",
    hints: ["对比共集电路（射极跟随器）的作用。"],
  }),
  gen({ id: "op-g-inv", level: 2, topic: T2, title: "反相比例运算" }, (g) => {
    const R1 = e12(g.range(1e3, 20e3));
    const Rf = e12(R1 * g.range(2, 20));
    const ui = Number(g.range(-1, 1).toFixed(2)) || 0.3;
    const r = inverting(R1, Rf);
    const uo = clipOut(r.ideal * ui, 13);
    return {
      prompt: `反相比例运算电路 $R_1=${R(R1)}$，$R_f=${R(Rf)}$，运放理想，$\\pm U_{OM}=\\pm13$ V。$u_I=${ui}$ V 时求 $u_O$；并求平衡电阻 $R'$。`,
      diagram: { id: "inv-amp", labels: { R1: R(R1), Rf: R(Rf) } },
      parts: [num("uo", "$u_O$", uo, "V", "V", { mistakes: [{ value: -uo, tag: "sign", message: "反相比例：输出与输入反相。" }, { value: (1 + Rf / R1) * ui, tag: "opamp-config", message: "这是同相比例的公式。" }] }), num("rp", "$R'$", par(R1, Rf), "Ω", "kΩ")],
      hints: ["$u_O=-\\frac{R_f}{R_1}u_I$（注意饱和）。", "$R'=R_1\\para R_f$。"],
      solution: `$u_O=${V(uo)}$${Math.abs(r.ideal * ui) > 13 ? "（已饱和）" : ""}，$R'=${R(par(R1, Rf))}$。`,
    };
  }),
  gen({ id: "op-g-noninv", level: 2, topic: T2, title: "同相比例运算" }, (g) => {
    const R1 = e12(g.range(1e3, 20e3));
    const Rf = e12(R1 * g.range(1, 15));
    const ui = Number(g.range(-2, 2).toFixed(2)) || 0.5;
    const r = nonInverting(R1, Rf);
    const uo = clipOut(r.ideal * ui, 13);
    return {
      prompt: `同相比例运算电路 $R_1=${R(R1)}$（反相端对地），$R_f=${R(Rf)}$，运放理想，$\\pm U_{OM}=\\pm13$ V。$u_I=${ui}$ V 时求 $u_O$。`,
      diagram: { id: "noninv-amp", labels: { R1: R(R1), Rf: R(Rf) } },
      parts: [num("uo", "$u_O$", uo, "V", "V", { mistakes: [{ value: (Rf / R1) * ui, tag: "opamp-config", message: "同相比例的系数是 $1+R_f/R_1$。" }, { value: -(Rf / R1) * ui, tag: "opamp-config", message: "这是反相比例的公式。" }] })],
      hints: ["$u_O=(1+\\frac{R_f}{R_1})u_I$。"],
      solution: `$u_O=${V(uo)}$${Math.abs(r.ideal * ui) > 13 ? "（已饱和）" : ""}。`,
    };
  }),
  gen({ id: "op-g-design", level: 2, topic: T2, title: "设计比例电路" }, (g) => {
    const k = g.pick([-5, -10, -20, 5, 11, 21]);
    const R1 = g.pick([5e3, 10e3, 20e3]);
    const Rf = k < 0 ? -k * R1 : (k - 1) * R1;
    return {
      prompt: `要求 $u_O=${k}u_I$，且${k < 0 ? `输入电阻为 ${R(R1)}` : `取 $R_1=${R(R1)}$`}。应采用${k < 0 ? "反相" : "同相"}比例电路，求反馈电阻 $R_f$。`,
      parts: [num("rf", "$R_f$", Rf, "Ω", "kΩ", { mistakes: k > 0 ? [{ value: k * R1, tag: "opamp-config", message: "同相比例系数为 $1+R_f/R_1$，所以 $R_f=(k-1)R_1$。" }] : [] })],
      hints: [k < 0 ? "反相比例：$R_i=R_1$，$R_f=|k|R_1$。" : "同相比例：$1+R_f/R_1=k$。"],
      solution: `$R_f=${R(Rf)}$。`,
    };
  }),
  gen({ id: "op-g-finite", level: 3, topic: T2, title: "有限开环增益的误差" }, (g) => {
    const lgA = g.pick([3, 3.5, 4, 5]);
    const A = Math.pow(10, lgA);
    const k = g.pick([10, 50, 100, 200]);
    const r = nonInverting(1e3, (k - 1) * 1e3, { Aod: A, UOM: Infinity, rid: Infinity });
    return {
      prompt: `同相比例电路设计的闭环增益为 ${k}，所用运放开环增益 $A_{od}=${sig(A, 3)}$。实际闭环增益是多少？相对误差是多少？`,
      parts: [num("af", "实际 $A_f$", r.actual, "1", "99", { tol: 0.002 }), num("e", "相对误差", r.error, "1", "−1%", { tol: 0.03 })],
      hints: ["$A_f=\\dfrac{1+R_f/R_1}{1+(1+R_f/R_1)/A_{od}}$。"],
      solution: `$A_f=${sig(r.actual, 5)}$，误差 ${sig(r.error * 100, 3)}%。`,
    };
  }),
  gen({ id: "op-g-cascade", level: 3, topic: T2, title: "两级运放电路" }, (g) => {
    const k1 = g.pick([-2, -5, -10]);
    const k2 = g.pick([2, 3, 5, 11]);
    const ui = g.pick([0.05, 0.1, 0.2, -0.1]);
    const uo1 = k1 * ui;
    const uo = clipOut(k2 * uo1, 13);
    return {
      prompt: `第一级为反相比例电路（$R_f/R_1=${-k1}$），第二级为同相比例电路（$1+R_f/R_1=${k2}$），运放理想，$\\pm U_{OM}=\\pm13$ V。输入 $u_I=${ui}$ V，求 $u_{O1}$ 和 $u_O$。`,
      parts: [
        num("u1", "$u_{O1}$", uo1, "V", "V"),
        num("uo", "$u_O$", uo, "V", "V", {
          mistakes:
            Math.abs(k2 * uo1) > 13
              ? [{ value: k2 * uo1, tag: "device-state", message: `运放输出不可能超过 $\\pm U_{OM}=\\pm13$ V：第二级已经饱和，$u_O=${uo > 0 ? "" : "-"}13$ V。` }]
              : [],
        }),
      ],
      hints: ["运放输出电阻为 0，后级不影响前级：直接相乘。"],
      solution: `$u_{O1}=${V(uo1)}$，$u_O=${V(uo)}$。`,
    };
  }),
  concept({
    id: "op-k-compare",
    level: 3,
    topic: T2,
    title: "反相比例与同相比例的比较",
    prompt: "从比例系数、输入电阻、共模输入电压三个方面比较反相比例与同相比例运算电路。",
    keyPoints: ["反相：$-R_f/R_1$，可小于 1；同相：$1+R_f/R_1\\ge1$", "反相：$R_i=R_1$（较小）；同相：$R_i$ 极大", "反相：两输入端为虚地，共模电压为 0", "同相：两输入端共模电压为 $u_I$，对运放要求高"],
    reference: "反相比例：$u_O=-(R_f/R_1)u_I$，比例系数可任意（含小于 1），输入电阻为 $R_1$，输入端虚地、无共模电压。同相比例：$u_O=(1+R_f/R_1)u_I$，系数不小于 1，输入电阻极大，但两输入端有共模电压 $u_I$，要求运放共模抑制比高。",
  }),
];

/* ═════════════ 加减运算 ═════════════ */
const T3 = "opamp-arith";
const arithQ: QuestionTemplate[] = [
  choice({
    id: "oa-c-sum",
    topic: T3,
    title: "反相求和电路的优点",
    prompt: "反相求和电路比同相求和电路应用更广，主要因为：",
    options: ["增益更大", "反相端为虚地，各路输入互不影响，系数易于独立调整", "输入电阻更大", "不需要反馈电阻"],
    answer: 1,
    why: ["不是主要原因。", "正确。", "反相求和的输入电阻反而较小。", "需要。"],
    hints: ["各路输入电流由什么决定？"],
  }),
  judge({
    id: "oa-j-match",
    topic: T3,
    title: "减法电路的电阻匹配",
    prompt: "单运放减法电路中，只要 $R_f/R_1=R_3/R_2$，输出就只与两输入之差有关，与共模电压无关。",
    answer: true,
    why: "正确。此时共模增益为零，$u_O=\\frac{R_f}{R_1}(u_{I2}-u_{I1})$。",
    hints: ["写出共模增益的表达式。"],
  }),
  choice({
    id: "oa-c-super",
    topic: T3,
    title: "分析多输入运放电路的方法",
    prompt: "分析有多个输入信号的运放线性电路时，最常用的方法是：",
    options: ["戴维南定理", "叠加原理", "等效电源法", "图解法"],
    answer: 1,
    why: ["可以辅助，但不是最常用的。", "正确：线性电路中，让各输入单独作用再相加。", "—", "图解法用于非线性电路。"],
    hints: ["运放线性电路是线性电路吗？"],
  }),
  gen({ id: "oa-g-sum", level: 2, topic: T3, title: "反相求和" }, (g) => {
    const Rf = g.pick([50e3, 100e3, 200e3]);
    const Rs = [e12(g.range(10e3, 100e3)), e12(g.range(10e3, 100e3)), e12(g.range(10e3, 100e3))];
    const u = [g.pick([0.1, 0.2, -0.3, 0.5]), g.pick([0.2, -0.1, 0.4]), g.pick([-0.2, 0.3, 0.1])];
    const uo = invertingSum(Rs, Rf, u);
    return {
      prompt: `反相求和电路 $R_f=${R(Rf)}$，$R_1=${R(Rs[0])}$、$R_2=${R(Rs[1])}$、$R_3=${R(Rs[2])}$，输入 $u_{I1}=${u[0]}$ V、$u_{I2}=${u[1]}$ V、$u_{I3}=${u[2]}$ V。求 $u_O$（运放理想）。`,
      diagram: { id: "summer", labels: { R1: R(Rs[0]), R2: R(Rs[1]), R3: R(Rs[2]), Rf: R(Rf) } },
      parts: [num("uo", "$u_O$", uo, "V", "V", { mistakes: [{ value: -uo, tag: "sign", message: "反相求和，输出前有负号。" }] })],
      hints: ["$u_O=-R_f\\sum u_{Ik}/R_k$。"],
      solution: `$u_O=${V(uo)}$。`,
    };
  }),
  gen({ id: "oa-g-sub", level: 2, topic: T3, title: "减法运算" }, (g) => {
    const R1 = e12(g.range(5e3, 20e3));
    const k = g.pick([1, 2, 5, 10]);
    const Rf = R1 * k;
    const R2 = R1;
    const R3 = Rf;
    const u1 = g.pick([0.5, 1, 1.2, -0.5]);
    const u2 = g.pick([0.8, 1.1, 1.5, 0]);
    const s = subtractor(R1, Rf, R2, R3, u1, u2);
    return {
      prompt: `减法电路 $R_1=R_2=${R(R1)}$，$R_f=R_3=${R(Rf)}$（$u_{I1}$ 接反相端、$u_{I2}$ 接同相端），运放理想。$u_{I1}=${u1}$ V、$u_{I2}=${u2}$ V 时求 $u_O$。`,
      diagram: { id: "subtractor", labels: { R1: R(R1), R2: R(R2), R3: R(R3), Rf: R(Rf) } },
      parts: [num("uo", "$u_O$", s.uO, "V", "V", { mistakes: [{ value: -s.uO, tag: "sign", message: "$u_O=\\frac{R_f}{R_1}(u_{I2}-u_{I1})$：同相端的输入取正号。" }] })],
      hints: ["用叠加原理，或直接用匹配条件下的结论。"],
      solution: `$u_O=${k}\\times(${u2}-${u1})=${V(s.uO)}$。`,
    };
  }),
  gen({ id: "oa-g-mismatch", level: 2, topic: T3, title: "电阻失配与共模增益" }, (g) => {
    const k = g.pick([1, 2, 5, 10]);
    const d = g.pick([0.01, 0.02, 0.05]);
    const s = subtractor(10e3, k * 10e3, 10e3, k * 10e3 * (1 + d), 0, 0);
    return {
      prompt: `减法电路 $R_1=R_2=10$ kΩ，$R_f=${k * 10}$ kΩ，$R_3$ 比 $R_f$ 大 ${d * 100}%。求共模增益 $A_c$ 和共模抑制比 $K_{CMR}$（dB）。`,
      parts: [num("ac", "$A_c$", s.Ac, "1", "0.01", { tol: 0.03 }), num("k", "$K_{CMR}$（dB）", 20 * Math.log10(s.KCMR), "1", "50", { tol: 0.02 })],
      hints: ["令 $u_{I1}=u_{I2}=u_{Ic}$，用 $u_O=(1+\\frac{R_f}{R_1})\\frac{R_3}{R_2+R_3}u_{I2}-\\frac{R_f}{R_1}u_{I1}$。", "差模增益约为 $R_f/R_1$。"],
      solution: `$A_c=${sig(s.Ac, 3)}$，$A_d\\approx${sig(s.Ad, 4)}$，$K_{CMR}\\approx${sig(20 * Math.log10(s.KCMR), 3)}$ dB。`,
    };
  }),
  gen({ id: "oa-g-design", level: 3, topic: T3, title: "设计线性组合电路" }, (g) => {
    const a = g.pick([1, 2, 3, 4]);
    const b = g.pick([1, 2, 5]);
    const Rf = 100e3;
    const d = designLinear([a], [b], Rf);
    const check = evalLinear(d, [1], [0]);
    return {
      prompt: `用一个运放实现 $u_O=${a}u_{I1}-${b}u_{I2}$，取 $R_f=100$ kΩ，要求两输入端对地电阻平衡（同相端对地 $R_P$ 等于 $R_f\\para R_N$）。求反相端输入电阻 $R_N$、同相端输入电阻 $R_{P1}$${d.Rp !== Infinity ? "与同相端对地电阻 $R_p$" : ""}${d.Rg !== Infinity ? "与反相端对地电阻 $R_g$" : ""}。`,
      parts: [
        num("rn", "$R_N$", d.Rneg[0], "Ω", "kΩ"),
        num("rp1", "$R_{P1}$", d.Rpos[0], "Ω", "kΩ", { tol: 0.03 }),
        ...(d.Rp !== Infinity ? [num("rp", "$R_p$", d.Rp, "Ω", "kΩ", { tol: 0.03 })] : []),
        ...(d.Rg !== Infinity ? [num("rg", "$R_g$", d.Rg, "Ω", "kΩ", { tol: 0.03 })] : []),
      ],
      hints: ["$R_N=R_f/b$；同相端信号放大 $N=1+R_f/R_N$ 倍（必要时加 $R_g$）。", "同相端：$u_+=R_P\\,u_{I1}/R_{P1}$，要求 $N R_P/R_{P1}=a$。"],
      solution: `$R_N=${R(d.Rneg[0])}$，$R_{P1}=${R(d.Rpos[0])}$${d.Rp !== Infinity ? `，$R_p=${R(d.Rp)}$` : ""}${d.Rg !== Infinity ? `，$R_g=${R(d.Rg)}$` : ""}；验证：$u_{I1}=1$ V、$u_{I2}=0$ 时 $u_O=${sig(check, 4)}$ V。`,
    };
  }),
  gen({ id: "oa-g-super", level: 3, topic: T3, title: "叠加原理求输出" }, (g) => {
    const R1 = e12(g.range(5e3, 20e3));
    const Rf = e12(g.range(20e3, 100e3));
    const R2 = e12(g.range(5e3, 20e3));
    const R3 = e12(g.range(5e3, 50e3));
    const u1 = g.pick([0.2, 0.5, -0.3]);
    const u2 = g.pick([0.4, 1, -0.2]);
    const s = subtractor(R1, Rf, R2, R3, u1, u2);
    return {
      prompt: `电路同减法电路，但电阻不匹配：$R_1=${R(R1)}$、$R_f=${R(Rf)}$、$R_2=${R(R2)}$、$R_3=${R(R3)}$，$u_{I1}=${u1}$ V（反相端）、$u_{I2}=${u2}$ V（同相端）。用叠加原理求 $u_O$。`,
      diagram: { id: "subtractor", labels: { R1: R(R1), R2: R(R2), R3: R(R3), Rf: R(Rf) } },
      parts: [
        num("uo", "$u_O$", s.uO, "V", "V", {
          mistakes: [
            { value: (Rf / R1) * (u2 - u1), tag: "approx-misuse", message: "电阻不匹配时不能套用 $u_O=\\frac{R_f}{R_1}(u_{I2}-u_{I1})$：要按叠加原理分别算两路输入。" },
            { value: (1 + Rf / R1) * u2 - (Rf / R1) * u1, tag: "kvl-loop", message: "同相端电位是 $u_{I2}$ 经 $R_2$、$R_3$ 分压后的值：$u_P=\\frac{R_3}{R_2+R_3}u_{I2}$，不是 $u_{I2}$ 本身。" },
          ],
        }),
      ],
      hints: ["$u_{I1}$ 单独作用：$-\\frac{R_f}{R_1}u_{I1}$。", "$u_{I2}$ 单独作用：$(1+\\frac{R_f}{R_1})\\frac{R_3}{R_2+R_3}u_{I2}$。"],
      solution: `$u_O=${V(s.uO)}$。`,
    };
  }),
  concept({
    id: "oa-k-balance",
    level: 3,
    topic: T3,
    title: "平衡电阻的作用",
    prompt: "运放电路中为什么常使同相端与反相端的对地等效电阻相等？它会不会影响理想运算关系？",
    keyPoints: ["实际运放输入端有偏置电流 I_B", "偏置电流在两端对地电阻上产生压降", "两端电阻相等时压降相同，作为共模信号被抑制", "理想运放（I_B = 0）下平衡电阻不影响运算关系"],
    reference: "实际运放两输入端都有偏置电流，流过各自的对地等效电阻会产生电压。使两端对地电阻相等，则两端电压近似相同，相当于共模信号，不会引起输出误差。理想运放没有偏置电流，平衡电阻中无电流，因此不影响理想运算关系。",
  }),
];

/* ═════════════ 积分与微分 ═════════════ */
const T4 = "opamp-integrator";
const intQ: QuestionTemplate[] = [
  choice({
    id: "ot-c-sq",
    topic: T4,
    title: "方波输入的积分",
    prompt: "积分运算电路输入对称方波（且不饱和）时，输出波形为：",
    options: ["方波", "三角波", "正弦波", "尖脉冲"],
    answer: 1,
    why: ["—", "正确：每半个周期输入恒定，输出线性变化。", "正弦输入才输出余弦（正弦）。", "那是微分电路输入方波的结果。"],
    hints: ["恒定输入的积分是什么形状？"],
  }),
  choice({
    id: "ot-c-noise",
    topic: T4,
    title: "微分电路的缺点",
    prompt: "微分运算电路的主要缺点是：",
    options: ["对低频信号增益太大", "对高频噪声和干扰非常敏感", "输出电阻大", "只能输入方波"],
    answer: 1,
    why: ["反了。", "正确：增益 $\\omega RC$ 随频率增大。", "运放输出电阻很小。", "—"],
    hints: ["微分电路的增益与频率是什么关系？"],
  }),
  judge({
    id: "ot-j-drift",
    topic: T4,
    title: "理想积分器的漂移",
    prompt: "理想积分电路的输入为零时，输出也一定保持为零。",
    answer: false,
    why: "错误。实际运放存在失调电压和偏置电流，它们会被不断积分，使输出逐渐漂移到饱和；所以实用积分电路常在电容两端并联大电阻。",
    hints: ["积分器对直流的增益是多少？"],
  }),
  gen({ id: "ot-g-ramp", level: 2, topic: T4, title: "恒定输入下的积分" }, (g) => {
    const Rr = e12(g.range(5e3, 100e3));
    const C = g.pick([0.01, 0.1, 1]) * 1e-6;
    const UI = g.pick([-1, -0.5, 0.5, 1, 2]);
    const t = g.pick([0.5, 1, 2, 5]) * 1e-3;
    const w = simulateIntegrator({ shape: "step", amp: UI, f: 1 / (2 * t), R: Rr, C, UOM: 12, periods: 0.5, uo0: 0, n: 2000 });
    const uo = w.uo[w.uo.length - 1];
    return {
      prompt: `积分电路 $R=${R(Rr)}$，$C=${formatSI(C, "F")}$，运放理想，$\\pm U_{OM}=\\pm12$ V，电容初始电压为零。$t=0$ 时加入 $U_I=${UI}$ V 的恒定电压，求 $t=${formatSI(t, "s")}$ 时的 $u_O$。`,
      diagram: { id: "integrator", labels: { R: R(Rr), C: formatSI(C, "F") } },
      parts: [num("uo", "$u_O$", uo, "V", "V", { tol: 0.02, mistakes: [{ value: -uo, tag: "sign", message: "反相积分：$u_O=-\\frac{U_I}{RC}t$。" }] })],
      hints: ["$u_O=-\\dfrac{U_I}{RC}t$，注意是否超过 $\\pm U_{OM}$。"],
      solution: `$u_O=-\\dfrac{${UI}\\times${formatSI(t, "s")}}{${formatSI(Rr * C, "s")}}${Math.abs((UI * t) / (Rr * C)) > 12 ? "\\to" : "="}${V(uo)}$${Math.abs((UI * t) / (Rr * C)) > 12 ? "（已饱和）" : ""}。`,
    };
  }),
  gen({ id: "ot-g-tri", level: 2, topic: T4, title: "方波积分得到的三角波" }, (g) => {
    const Rr = e12(g.range(5e3, 50e3));
    const C = g.pick([0.01, 0.022, 0.047, 0.1]) * 1e-6;
    const f = g.pick([500, 1000, 2000]);
    const A = g.pick([1, 2, 5]);
    const w = simulateIntegrator({ shape: "square", amp: A, f, R: Rr, C, UOM: 13, periods: 2, n: 4000 });
    const pp = Math.max(...w.uo) - Math.min(...w.uo);
    return {
      prompt: `积分电路 $R=${R(Rr)}$，$C=${formatSI(C, "F")}$，输入为幅值 ±${A} V、频率 ${f} Hz 的对称方波（输出不饱和，直流分量为零）。求输出三角波的峰峰值。`,
      parts: [num("pp", "$U_{opp}$", pp, "V", "V", { tol: 0.02, mistakes: [{ value: pp / 2, tag: "rms-peak-avg", message: "这是峰值；峰峰值是半个周期内输出的总变化量 $A\\cdot\\frac{T}{2}/(RC)$。" }] })],
      hints: ["半个周期内输入恒定为 $\\pm A$，输出变化 $A\\cdot\\frac{T/2}{RC}$。"],
      solution: `峰峰值 $=\\dfrac{${A}\\times${formatSI(1 / (2 * f), "s")}}{${formatSI(Rr * C, "s")}}=${V(pp)}$。`,
    };
  }),
  gen({ id: "ot-g-diff", level: 2, topic: T4, title: "三角波微分得到方波" }, (g) => {
    const Rr = e12(g.range(5e3, 50e3));
    const C = g.pick([0.01, 0.1]) * 1e-6;
    const f = g.pick([100, 500, 1000]);
    const A = g.pick([1, 2]);
    const slope = 4 * A * f;
    const w = simulateDifferentiator({ shape: "triangle", amp: A, f, R: Rr, C, UOM: 1e3, periods: 1, n: 2000 });
    const uo = Math.abs(w.uo[300]);
    return {
      prompt: `微分电路 $R=${R(Rr)}$（反馈）、$C=${formatSI(C, "F")}$，输入为峰值 ±${A} V、频率 ${f} Hz 的对称三角波。求输出方波的幅值（取绝对值）。`,
      diagram: { id: "differentiator", labels: { R: R(Rr), C: formatSI(C, "F") } },
      parts: [num("uo", "$|u_O|$", Math.min(uo, 13), "V", "V", { tol: 0.02 })],
      hints: ["三角波每段斜率为 $\\pm4Af$。", "$u_O=-RC\\,\\mathrm du_I/\\mathrm dt$。"],
      solution: `斜率 $4Af=${formatSI(slope, "V")}$/s，$|u_O|=RC\\times4Af=${V(uo)}$${uo > 13 ? "（超过 ±13 V，实际饱和）" : ""}。`,
    };
  }),
  gen({ id: "ot-g-sine", level: 3, topic: T4, title: "正弦输入的积分" }, (g) => {
    const Rr = e12(g.range(5e3, 50e3));
    const C = g.pick([0.1, 0.22, 0.47, 1]) * 1e-6;
    const f = g.pick([50, 100, 200, 500]);
    const A = g.pick([1, 2]);
    const w = simulateIntegrator({ shape: "sine", amp: A, f, R: Rr, C, UOM: 50, periods: 2, n: 8000 });
    const amp = Math.max(...w.uo);
    return {
      prompt: `积分电路 $R=${R(Rr)}$、$C=${formatSI(C, "F")}$，输入 $u_I=${A}\\sin(2\\pi\\cdot${f}t)$ V（不饱和、输出无直流分量）。求输出电压的幅值，以及它相对输入的相位差（度，超前为正）。`,
      parts: [num("a", "幅值", amp, "V", "V", { tol: 0.02 }), num("ph", "相位差（°）", 90, "1", "90", { tol: 0.01, mistakes: [{ value: -90, tag: "waveform", message: "反相积分：$-\\int\\sin=\\cos$，余弦超前正弦 90°。" }] })],
      hints: ["$-\\dfrac{1}{RC}\\int A\\sin\\omega t\\,\\mathrm dt=\\dfrac{A}{\\omega RC}\\cos\\omega t$。"],
      solution: `幅值 $A/(\\omega RC)=${V(amp)}$，输出超前 90°。`,
    };
  }),
  gen({ id: "ot-g-sat", level: 3, topic: T4, title: "积分到饱和需要多长时间" }, (g) => {
    const Rr = e12(g.range(10e3, 100e3));
    const C = g.pick([0.1, 1, 10]) * 1e-6;
    const UI = g.pick([0.1, 0.5, 1]);
    const UOM = g.pick([10, 12, 13]);
    const T = integratorTimeTo(UOM, UI, Rr, C);
    return {
      prompt: `积分电路 $R=${R(Rr)}$、$C=${formatSI(C, "F")}$、$\\pm U_{OM}=\\pm${UOM}$ V，电容初始电压为零。输入恒定 $U_I=${UI}$ V，经过多长时间输出饱和？`,
      parts: [num("t", "$t$", T, "s", "s")],
      hints: ["$|u_O|=\\dfrac{U_I}{RC}t=U_{OM}$。"],
      solution: `$t=U_{OM}RC/U_I=${formatSI(T, "s")}$。`,
    };
  }),
  concept({
    id: "ot-k-integ",
    level: 3,
    topic: T4,
    title: "积分电路的推导",
    prompt: "用虚短、虚断推导反相积分电路的输入输出关系，并说明为什么输出是“斜坡”。",
    keyPoints: ["虚地：$i_R=u_I/R$", "虚断：$i_R=i_C$", "电容：$i_C=-C\\,\\mathrm du_O/\\mathrm dt$", "恒定输入时电容恒流充电，电压线性变化（斜坡）"],
    reference: "反相端虚地，$i_R=u_I/R$；虚断使 $i_R$ 全部流过电容，$i_C=C\\,\\mathrm d(0-u_O)/\\mathrm dt$，所以 $u_O=-\\frac1{RC}\\int u_I\\,\\mathrm dt$。输入恒定时电容以恒定电流充电，其电压（即 $-u_O$）随时间线性增长，输出为斜坡，直到运放饱和。",
  }),
];

export const CH7_QUESTIONS: QuestionTemplate[] = [...idealQ, ...propQ, ...arithQ, ...intQ];
