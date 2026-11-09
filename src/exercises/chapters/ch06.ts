/** 第 6 章题库（原创）：差模共模、电流源、差分放大电路 */
import { activeLoadGain, analyzeDiff, decompose, DEFAULT_DIFF, diffLargeSignal, diffOutput, mirror, ratioSource, resistiveLoadGain, sourceOutputResistance, widlarResistor, type DiffParams } from "@/simulations/diff/diffamp";
import { rbeOf } from "@/simulations/bjt/stages";
import { formatSI, sig } from "@/simulations/units";
import { e12 } from "../generators";
import { choice, concept, gen, judge, num, type Rng } from "../helpers";
import type { QuestionTemplate } from "../types";

const V = (x: number) => formatSI(x, "V");
const A = (x: number) => formatSI(x, "A");
const R = (x: number) => formatSI(x, "Ω");

function makeDiff(g: Rng): DiffParams {
  for (let k = 0; k < 60; k++) {
    const p: DiffParams = { ...DEFAULT_DIFF, VCC: g.pick([12, 15]), Rc: e12(g.range(5e3, 15e3)), Rb: g.pick([0, 500, 1e3, 2e3]), Re: e12(g.range(5e3, 20e3)), beta: g.pick([50, 80, 100, 120]), rbb: g.pick([100, 200, 300]), RL: e12(g.range(10e3, 50e3)) };
    p.VEE = p.VCC;
    const r = analyzeDiff(p);
    if (r.UCQ > 2 && r.UCEQ > 3) return p;
  }
  return DEFAULT_DIFF;
}

/* ═════════════ 差模与共模 ═════════════ */
const T1 = "diff-signals";
const signalsQ: QuestionTemplate[] = [
  choice({
    id: "ds-c-def",
    topic: T1,
    title: "差模信号",
    prompt: "差分放大电路两个输入端的差模信号是指：",
    options: ["两个输入端信号的平均值", "两个输入端信号之差", "两个输入端信号之和", "任一输入端的信号"],
    answer: 1,
    why: ["那是共模信号。", "正确：$u_{Id}=u_{I1}-u_{I2}$。", "—", "—"],
    hints: ["“差模”的“差”。"],
  }),
  judge({
    id: "ds-j-drift",
    topic: T1,
    title: "温漂等效为什么信号",
    prompt: "对差分放大电路而言，温度变化引起的零点漂移相当于输入了差模信号。",
    answer: false,
    why: "错误。温度变化对两只对称晶体管的影响相同，相当于共模信号。",
    hints: ["两只管子的温度变化相同还是相反？"],
  }),
  choice({
    id: "ds-c-single",
    topic: T1,
    title: "单端输入的分解",
    prompt: "差分放大电路单端输入：$u_{I1}=u_I$、$u_{I2}=0$。它等效于：",
    options: ["只有差模输入 $u_I$", "差模输入 $u_I$ 加共模输入 $u_I/2$", "只有共模输入 $u_I$", "差模输入 $u_I/2$"],
    answer: 1,
    why: ["还有共模分量。", "正确：$u_{Id}=u_I-0$，$u_{Ic}=(u_I+0)/2$。", "—", "差模是两者之差 $u_I$。"],
    hints: ["代入定义式。"],
  }),
  gen({ id: "ds-g-decomp", level: 2, topic: T1, title: "求差模与共模分量" }, (g) => {
    const u1 = Number((g.range(-3, 3)).toFixed(2));
    const u2 = Number((g.range(-3, 3)).toFixed(2));
    const d = decompose(u1, u2);
    return {
      prompt: `差分放大电路两个输入端的电压分别为 $u_{I1}=${u1}$ V、$u_{I2}=${u2}$ V。求差模输入电压 $u_{Id}$ 和共模输入电压 $u_{Ic}$。`,
      parts: [num("d", "$u_{Id}$", d.uId, "V", "V", { tol: 0.01, mistakes: [{ value: d.uId / 2, tag: "diff-cm", message: "差模电压是两者之差 $u_{I1}-u_{I2}$（每端各 ±$u_{Id}/2$）。" }] }), num("c", "$u_{Ic}$", d.uIc, "V", "V", { tol: 0.01, mistakes: [{ value: u1 + u2, tag: "diff-cm", message: "共模电压是两者的平均值，要除以 2。" }] })],
      hints: ["$u_{Id}=u_{I1}-u_{I2}$，$u_{Ic}=(u_{I1}+u_{I2})/2$。"],
      solution: `$u_{Id}=${V(d.uId)}$，$u_{Ic}=${V(d.uIc)}$。`,
    };
  }),
  gen({ id: "ds-g-output", level: 2, topic: T1, title: "已知 A_d、A_c 求输出" }, (g) => {
    const Ad = -g.pick([20, 50, 100]);
    const Ac = -g.pick([0.1, 0.2, 0.5, 1]);
    // 典型考法：两个输入都在 1 V 左右，差模只有几十毫伏，共模输出不能忽略
    const uIc0 = g.pick([0.5, 1, 2]);
    const uId0 = g.pick([10, 20, 40]) * 1e-3;
    const u1 = uIc0 + uId0 / 2;
    const u2 = uIc0 - uId0 / 2;
    const d = decompose(u1, u2);
    const uo = Ad * d.uId + Ac * d.uIc;
    return {
      prompt: `某差分放大电路（单端输出）$A_d=${Ad}$，$A_c=${Ac}$。输入 $u_{I1}=${sig(u1, 4)}$ V、$u_{I2}=${sig(u2, 4)}$ V，求输出电压的变化量 $u_O$。`,
      parts: [
        num("uo", "$u_O$", uo, "V", "V", {
          mistakes: [
            { value: Ad * d.uId, tag: "diff-cm", message: `还要加上共模分量产生的输出 $A_cu_{Ic}$：这里 $u_{Ic}=${sig(d.uIc, 3)}$ V，比差模输入大得多。` },
            { value: Ad * d.uId + Ac * (u1 + u2), tag: "diff-cm", message: "共模电压是两个输入的**平均值**：$u_{Ic}=(u_{I1}+u_{I2})/2$，不是两者之和。" },
          ],
        }),
      ],
      hints: ["$u_O=A_du_{Id}+A_cu_{Ic}$。"],
      solution: `$u_{Id}=${formatSI(d.uId, "V")}$，$u_{Ic}=${formatSI(d.uIc, "V")}$，$u_O=${formatSI(uo, "V")}$。`,
    };
  }),
  gen({ id: "ds-g-bridge", level: 2, topic: T1, title: "电桥输出的共模电压" }, (g) => {
    const VB = g.pick([5, 10, 12]);
    const dv = g.pick([1, 2, 5, 10]) * 1e-3;
    const u1 = VB / 2 + dv / 2;
    const u2 = VB / 2 - dv / 2;
    const d = decompose(u1, u2);
    return {
      prompt: `电桥由 ${VB} V 电源供电，传感器使两个输出端电压分别为 ${sig(u1, 6)} V 和 ${sig(u2, 6)} V。求差模信号与共模信号，以及共模信号是差模信号的多少倍。`,
      parts: [num("d", "$u_{Id}$", d.uId, "V", "mV", { tol: 0.01 }), num("c", "$u_{Ic}$", d.uIc, "V", "V", { tol: 0.005 }), num("k", "倍数", d.uIc / d.uId, "1", "1000", { tol: 0.02 })],
      hints: ["代入定义。"],
      solution: `$u_{Id}=${formatSI(d.uId, "V")}$，$u_{Ic}=${V(d.uIc)}$，后者是前者的 ${sig(d.uIc / d.uId, 3)} 倍——这就是需要高共模抑制比的原因。`,
    };
  }),
  gen({ id: "ds-g-kcmr", level: 3, topic: T1, title: "共模干扰的残留" }, (g) => {
    const Ad = -g.pick([50, 100, 200]);
    const dB = g.pick([40, 60, 80, 100]);
    const K = Math.pow(10, dB / 20);
    const Ac = Math.abs(Ad) / K;
    const uid = g.pick([1, 2, 5]) * 1e-3;
    const uic = g.pick([0.5, 1, 2]);
    return {
      prompt: `差分放大电路 $|A_d|=${-Ad}$，$K_{CMR}=${dB}$ dB。输入差模信号 ${sig(uid * 1e3, 2)} mV 的同时，存在 ${uic} V 的共模干扰。求输出中的有用信号与干扰成分（取绝对值），以及二者之比。`,
      parts: [num("s", "有用信号", Math.abs(Ad) * uid, "V", "mV"), num("n", "干扰残留", Ac * uic, "V", "mV", { tol: 0.02 }), num("r", "有用/干扰", (Math.abs(Ad) * uid) / (Ac * uic), "1", "10", { tol: 0.02 })],
      hints: ["$K_{CMR}=|A_d/A_c|$，dB 值换算：$K=10^{\\mathrm{dB}/20}$。"],
      solution: `$|A_c|=${sig(Ac, 3)}$；有用 ${formatSI(Math.abs(Ad) * uid, "V")}，干扰 ${formatSI(Ac * uic, "V")}。`,
    };
  }),
  concept({
    id: "ds-k-why",
    level: 3,
    topic: T1,
    title: "为什么要区分差模与共模",
    prompt: "说明差分放大电路中区分差模信号和共模信号的意义，并各举一个实际例子。",
    keyPoints: ["有用信号多以差模形式出现（如电桥输出、双绞线信号）", "温漂、电源波动、共地干扰多为共模", "理想差分电路放大差模、抑制共模", "用 K_CMR 衡量这种能力"],
    reference: "差分电路的目标是放大两个输入之差而抑制二者的公共部分。传感器电桥、平衡传输线上的信号是差模的；温度漂移、50 Hz 工频干扰、电源噪声同时作用于两端，是共模的。把输入分解后可以分别用 $A_d$、$A_c$ 计算输出，并用 $K_{CMR}$ 评价电路。",
  }),
  choice({
    id: "ds-c-sum",
    level: 3,
    topic: T1,
    title: "由分量还原输入",
    prompt: "已知 $u_{Id}=20$ mV、$u_{Ic}=1$ V，则两个输入端电压为：",
    options: ["$u_{I1}=1.02$ V，$u_{I2}=0.98$ V", "$u_{I1}=1.01$ V，$u_{I2}=0.99$ V", "$u_{I1}=1.02$ V，$u_{I2}=1$ V", "$u_{I1}=0.99$ V，$u_{I2}=1.01$ V"],
    answer: 1,
    why: ["这样 $u_{Id}=40$ mV。", "正确：$u_{I1,2}=u_{Ic}\\pm u_{Id}/2$。", "这样 $u_{Ic}=1.01$ V。", "符号反了：这样 $u_{Id}=-20$ mV。"],
    hints: ["$u_{I1}=u_{Ic}+u_{Id}/2$。"],
  }),
];

/* ═════════════ 电流源 ═════════════ */
const T2 = "current-source";
const sourceQ: QuestionTemplate[] = [
  choice({
    id: "isrc-c-why",
    topic: T2,
    title: "集成电路中为什么大量使用电流源",
    prompt: "集成电路中大量使用电流源的主要原因是：",
    options: ["电流源比电阻省电", "集成工艺难以制造大电阻，而电流源能提供稳定的偏置电流和很大的交流电阻", "电流源噪声为零", "电流源可以放大信号"],
    answer: 1,
    why: ["不是主要原因。", "正确。", "电流源也有噪声。", "电流源本身不放大。"],
    hints: ["芯片上做一个 1 MΩ 电阻要占多大面积？"],
  }),
  judge({
    id: "isrc-j-beta",
    topic: T2,
    title: "镜像电流源对 β 的依赖",
    prompt: "镜像电流源的输出电流 $I_{C2}=\\frac{\\beta}{\\beta+2}I_R$，β 越大，$I_{C2}$ 越接近 $I_R$。",
    answer: true,
    why: "正确。误差来自两管基极电流，β 越大，基极电流占比越小。",
    hints: ["$I_R$ 中有多少流进了两管基极？"],
  }),
  choice({
    id: "isrc-c-widlar",
    topic: T2,
    title: "微电流源的特点",
    prompt: "与镜像电流源相比，微电流源（Widlar 电流源）的特点是：",
    options: ["用较小的电阻得到很小的输出电流，且输出电阻更大", "输出电流等于参考电流", "输出电阻更小", "不需要参考电流"],
    answer: 0,
    why: ["正确。", "那是镜像电流源。", "射极电阻使输出电阻增大。", "仍需参考电流。"],
    hints: ["射极电阻 $R_{e2}$ 起什么作用？"],
  }),
  gen({ id: "isrc-g-mirror", level: 2, topic: T2, title: "镜像电流源" }, (g) => {
    const VCC = g.pick([5, 10, 12, 15]);
    const Rr = e12(g.range(2e3, 50e3));
    const beta = g.pick([20, 50, 100]);
    const m = mirror(VCC, Rr, beta);
    return {
      prompt: `镜像电流源：$V_{CC}=${VCC}$ V，参考电阻 $R=${R(Rr)}$，两管 $\\beta=${beta}$、$U_{BE}=0.7$ V。求参考电流 $I_R$ 和输出电流 $I_{C2}$（计入基极电流）。`,
      diagram: { id: "mirror", labels: { R: R(Rr) } },
      parts: [num("IR", "$I_R$", m.IR, "A", "mA", { mistakes: [{ value: VCC / Rr, tag: "forget-ube", message: "参考支路中还有 VT₁ 的 $U_{BE}$：$I_R=(V_{CC}-U_{BE})/R$。" }] }), num("IC2", "$I_{C2}$", m.IC2, "A", "mA", { tol: 0.005 })],
      hints: ["$I_R=(V_{CC}-U_{BE})/R$。", "$I_R=I_C+2I_B=I_C(1+2/\\beta)$。"],
      solution: `$I_R=${A(m.IR)}$，$I_{C2}=${A(m.IC2)}$。`,
    };
  }),
  gen({ id: "isrc-g-widlar", level: 2, topic: T2, title: "微电流源的设计" }, (g) => {
    const IR = g.pick([0.5, 1, 2]) * 1e-3;
    const IC2 = g.pick([5, 10, 20, 50]) * 1e-6;
    const Re2 = widlarResistor(IR, IC2);
    return {
      prompt: `微电流源的参考电流 $I_R=${A(IR)}$，要求输出电流 $I_{C2}=${A(IC2)}$，$U_T=26$ mV。求 $R_{e2}$（忽略基极电流）。`,
      diagram: { id: "mirror", labels: { type: "widlar" } },
      parts: [num("Re2", "$R_{e2}$", Re2, "Ω", "kΩ", { mistakes: [{ value: 0.026 / IC2, tag: "scaling-law", message: "还要乘以 $\\ln(I_R/I_{C2})$。" }] })],
      hints: ["$I_{C2}R_{e2}=U_T\\ln(I_R/I_{C2})$。"],
      solution: `$R_{e2}=\\dfrac{U_T}{I_{C2}}\\ln\\dfrac{I_R}{I_{C2}}=${R(Re2)}$。`,
    };
  }),
  gen({ id: "isrc-g-ratio", level: 2, topic: T2, title: "比例电流源" }, (g) => {
    const IR = g.pick([0.5, 1, 2]) * 1e-3;
    const Re1 = e12(g.range(500, 3e3));
    const k = g.pick([2, 3, 5, 10]);
    const Re2 = e12(Re1 * k);
    const rs = ratioSource(IR, Re1, Re2);
    return {
      prompt: `比例电流源：$I_R=${A(IR)}$，$R_{e1}=${R(Re1)}$，$R_{e2}=${R(Re2)}$。忽略基极电流和两管 $U_{BE}$ 的差别，估算 $I_{C2}$。`,
      parts: [
        num("IC2", "$I_{C2}$", rs.approx, "A", "mA", {
          alts: [rs.IC2],
          tol: 0.04,
          mistakes: [{ value: (IR * Re2) / Re1, tag: "ratio-inverted", message: "两管射极电位近似相等：$I_{C2}R_{e2}\\approx I_RR_{e1}$，所以 $I_{C2}\\approx\\dfrac{R_{e1}}{R_{e2}}I_R$，电阻比别倒过来。" }],
        }),
      ],
      hints: ["$U_{BE1}+I_RR_{e1}\\approx U_{BE2}+I_{C2}R_{e2}$，且 $U_{BE1}\\approx U_{BE2}$。"],
      solution: `$I_{C2}\\approx I_R R_{e1}/R_{e2}=${A(rs.approx)}$（计入 $U_{BE}$ 差的精确解为 ${A(rs.IC2)}）。`,
    };
  }),
  gen({ id: "isrc-g-ro", level: 3, topic: T2, title: "电流源的输出电阻" }, (g) => {
    const IC = g.pick([10, 20, 50, 100]) * 1e-6;
    const VA = g.pick([50, 100, 150]);
    const Re = g.pick([1e3, 2e3, 5e3]);
    const beta = 100;
    const rbe = rbeOf(IC * (1 + 1 / beta), beta);
    const r0 = sourceOutputResistance(IC, VA, 0, beta, rbe);
    const r1 = sourceOutputResistance(IC, VA, Re, beta, rbe);
    return {
      prompt: `某电流源输出管 $I_C=${A(IC)}$，Early 电压 $U_A=${VA}$ V，$\\beta=100$，$r_{be}=${R(rbe)}$。(1) 射极直接接地时（镜像源）输出电阻多大？(2) 射极串 $R_e=${R(Re)}$ 后约多大？（$R_o\\approx r_{ce}[1+\\beta R_e/(r_{be}+R_e)]$）`,
      parts: [num("r0", "(1) $R_o$", r0, "Ω", "MΩ"), num("r1", "(2) $R_o$", r1, "Ω", "MΩ")],
      hints: ["$r_{ce}=U_A/I_C$。"],
      solution: `(1) ${R(r0)}；(2) ${R(r1)}。`,
    };
  }),
  gen({ id: "isrc-g-active", level: 3, topic: T2, title: "有源负载的电压增益" }, (g) => {
    const IC = g.pick([0.1, 0.2, 0.5, 1]) * 1e-3;
    const VA = g.pick([50, 100]);
    const beta = 100;
    const rbe = rbeOf(IC * (1 + 1 / beta), beta);
    const Rc = 5 / IC;
    const ga = activeLoadGain(IC, VA, beta, rbe, Infinity);
    const gr = resistiveLoadGain(IC, VA, beta, rbe, Rc, Infinity);
    return {
      prompt: `共射放大管 $I_{CQ}=${A(IC)}$、$\\beta=100$、$r_{be}=${R(rbe)}$、$U_A=${VA}$ V。(1) 集电极电阻 $R_c=${R(Rc)}$ 时（计入 $r_{ce}$，空载）$A_u$ 为多少？(2) 改用 $U_A$ 相同的 PNP 镜像电流源作有源负载，$A_u$ 为多少？`,
      parts: [num("r", "(1) 电阻负载", gr, "1", "−150", { signMessage: "共射反相。" }), num("a", "(2) 有源负载", ga, "1", "−2000", { signMessage: "共射反相。" })],
      hints: ["(1) 负载 $R_c\\para r_{ce}$；(2) 负载 $r_{ce1}\\para r_{ce2}$，$r_{ce}=U_A/I_C$。"],
      solution: `(1) ${sig(gr, 3)}；(2) ${sig(ga, 3)}。`,
    };
  }),
  concept({
    id: "isrc-k-mirror",
    level: 3,
    topic: T2,
    title: "镜像电流源的原理",
    prompt: "说明镜像电流源中 VT₁ 集电极与基极相连的作用，以及为什么 $I_{C2}$ 几乎不受温度影响。",
    keyPoints: ["VT₁ 接成二极管，其 U_BE 由 I_R 决定", "两管 U_BE 相同，对称管电流相同", "I_R 由 V_CC、R 决定", "温度变化时两管同时变化，相互补偿"],
    reference: "VT₁ 的集电极与基极相连，相当于一只二极管，参考电流 $I_R$ 在其上建立 $U_{BE}$；VT₂ 与 VT₁ 的 $U_{BE}$ 相同，特性对称，故集电极电流相同。$I_R$ 主要由 $V_{CC}$ 与 $R$ 决定；温度变化引起的 $U_{BE}$、β 变化在两管上相同，因此 $I_{C2}$ 基本不变。",
  }),
];

/* ═════════════ 差分放大电路 ═════════════ */
const T3 = "diff-amplifier";
const diffQ: QuestionTemplate[] = [
  choice({
    id: "da-c-re",
    topic: T3,
    title: "长尾电阻的作用",
    prompt: "长尾式差分放大电路中，射极公共电阻 $R_e$ 对差模信号和共模信号的作用是：",
    options: ["对两者都没有影响", "对差模信号相当于短路（不影响），对共模信号产生强烈负反馈", "对差模信号产生负反馈，对共模信号相当于短路", "使差模增益加倍"],
    answer: 1,
    why: ["—", "正确：差模时两管电流一增一减，$R_e$ 中电流不变；共模时 $R_e$ 中电流变化为单管的 2 倍。", "反了。", "—"],
    hints: ["差模输入时流过 $R_e$ 的电流怎样变化？"],
  }),
  choice({
    id: "da-c-single",
    topic: T3,
    title: "单端输出的差模增益",
    prompt: "其他条件相同（空载），单端输出时的差模电压放大倍数是双端输出时的：",
    options: ["2 倍", "1/2", "相同", "1/4"],
    answer: 1,
    why: ["反了。", "正确：只取一个集电极对地的电压变化。", "—", "—"],
    hints: ["双端输出电压是两个集电极电压变化之差。"],
  }),
  judge({
    id: "da-j-gain",
    topic: T3,
    title: "差分电路的增益",
    prompt: "双端输出差分放大电路用了两只晶体管，所以其差模电压放大倍数是单管共射电路的两倍。",
    answer: false,
    why: "错误。双端输出的 $A_d$ 与单管共射电路相同：两管各得 $u_{Id}/2$，输出是两管输出之差，正好抵消因子 1/2。用两只管子换来的是抑制共模的能力。",
    hints: ["每只管子的输入是多少？"],
  }),
  gen({ id: "da-g-q", level: 2, topic: T3, title: "长尾电路的静态工作点" }, (g) => {
    const p = makeDiff(g);
    const r = analyzeDiff(p);
    return {
      prompt: `长尾式差分放大电路：$V_{CC}=V_{EE}=${p.VCC}$ V，$R_c=${R(p.Rc)}$，$R_e=${R(p.Re)}$，$R_b=${R(p.Rb)}$，$\\beta=${p.beta}$，$U_{BE}=0.7$ V。求 $I_{EQ}$、$U_{CQ}$ 和 $U_{CEQ}$（$u_{I1}=u_{I2}=0$）。`,
      diagram: { id: "diff-longtail", labels: { Re: R(p.Re) } },
      parts: [
        num("IE", "$I_{EQ}$", r.IEQ, "A", "mA", { alts: [(p.VEE - 0.7) / (2 * p.Re)], mistakes: [{ value: (p.VEE - 0.7) / p.Re, tag: "half-circuit", message: "两管的射极电流都流过 $R_e$：$2I_{EQ}R_e\\approx V_{EE}-U_{BE}$。" }] }),
        num("UC", "$U_{CQ}$", r.UCQ, "V", "V", { tol: 0.02 }),
        num("UCE", "$U_{CEQ}$", r.UCEQ, "V", "V", { tol: 0.02, mistakes: [{ value: r.UCQ, tag: "kvl-loop", message: "发射极电位约为 −0.7 V，不是 0：$U_{CEQ}=U_{CQ}-U_{EQ}$。" }] }),
      ],
      hints: ["基极回路：$I_{BQ}R_b+U_{BE}+2I_{EQ}R_e=V_{EE}$。", "$U_{EQ}\\approx-U_{BE}$（$R_b$ 上压降很小）。"],
      solution: `$I_{EQ}=${A(r.IEQ)}$，$U_{CQ}=${V(r.UCQ)}$，$U_{EQ}=${V(r.UEQ)}$，$U_{CEQ}=${V(r.UCEQ)}$。`,
    };
  }),
  gen({ id: "da-g-ad", level: 2, topic: T3, title: "双端输出的差模参数" }, (g) => {
    const p = makeDiff(g);
    const r = analyzeDiff(p);
    return {
      prompt: `长尾式差分放大电路（双端输出）：$R_c=${R(p.Rc)}$，$R_b=${R(p.Rb)}$，$R_L=${R(p.RL)}$（接在两集电极之间），$\\beta=${p.beta}$，已求得 $r_{be}=${R(r.rbe)}$。求 $A_d$、$R_{id}$、$R_o$。`,
      diagram: { id: "diff-longtail" },
      parts: [
        num("Ad", "$A_d$", r.Ad, "1", "−50", { signMessage: "以 $u_{I1}-u_{I2}$ 为输入、$u_{C1}-u_{C2}$ 为输出时 $A_d$ 为负。", mistakes: [{ value: (-p.beta * ((p.Rc * p.RL) / (p.Rc + p.RL))) / (p.Rb + r.rbe), tag: "half-circuit", message: "负载接在两集电极之间，中点为交流地，每管负载是 $R_L/2$。" }] }),
        num("Rid", "$R_{id}$", r.Rid, "Ω", "kΩ", { mistakes: [{ value: r.Rid / 2, tag: "half-circuit", message: "差模输入电阻跨在两个输入端之间，包含两只管子：$2(R_b+r_{be})$。" }] }),
        num("Ro", "$R_o$", r.Ro, "Ω", "kΩ"),
      ],
      hints: ["差模时射极交流接地，每管负载 $R_c\\para R_L/2$。", "$A_d=-\\beta(R_c\\para\\frac{R_L}2)/(R_b+r_{be})$。"],
      solution: `$A_d=${sig(r.Ad, 3)}$，$R_{id}=${R(r.Rid)}$，$R_o=${R(r.Ro)}$。`,
    };
  }),
  gen({ id: "da-g-cmrr", level: 2, topic: T3, title: "单端输出的共模抑制比" }, (g) => {
    const p = { ...makeDiff(g), output: "single" as const, RL: Infinity };
    const r = analyzeDiff(p);
    return {
      prompt: `长尾式差分放大电路从 VT₁ 集电极单端输出（空载）：$R_c=${R(p.Rc)}$，$R_e=${R(p.Re)}$，$R_b=${R(p.Rb)}$，$\\beta=${p.beta}$，$r_{be}=${R(r.rbe)}$。求 $A_d$、$A_c$ 与 $K_{CMR}$。`,
      diagram: { id: "diff-longtail", labels: { Re: R(p.Re) } },
      parts: [
        num("Ad", "$A_d$", r.Ad, "1", "−50", { mistakes: [{ value: r.Ad * 2, tag: "half-circuit", message: "单端输出只取一个集电极，差模增益是双端的一半。" }] }),
        num("Ac", "$A_c$", r.Ac, "1", "−0.5", { mistakes: [{ value: (-p.beta * p.Rc) / (p.Rb + r.rbe + (1 + p.beta) * p.Re), tag: "half-circuit", message: "共模时每管射极等效电阻是 $2R_e$。" }] }),
        num("K", "$K_{CMR}$", r.KCMR, "1", "100"),
      ],
      hints: ["$A_d=-\\frac12\\beta R_c/(R_b+r_{be})$。", "$A_c=-\\beta R_c/[R_b+r_{be}+2(1+\\beta)R_e]$。"],
      solution: `$A_d=${sig(r.Ad, 3)}$，$A_c=${sig(r.Ac, 3)}$，$K_{CMR}=${sig(r.KCMR, 3)}$（${sig(r.KCMRdB, 3)} dB）。`,
    };
  }),
  gen({ id: "da-g-out", level: 3, topic: T3, title: "单端输出的总输出电压" }, (g) => {
    const p = { ...makeDiff(g), output: "single" as const, RL: Infinity };
    const r = analyzeDiff(p);
    const u1 = g.pick([20, 30, 50]) * 1e-3;
    const u2 = g.pick([10, 0, -10]) * 1e-3;
    const uo = diffOutput(r, u1, u2);
    return {
      prompt: `上题类型电路（单端输出、空载），已求得 $A_d=${sig(r.Ad, 4)}$、$A_c=${sig(r.Ac, 4)}$，静态 $U_{CQ}=${V(r.UCQ)}$。输入 $u_{I1}=${sig(u1 * 1e3, 3)}$ mV、$u_{I2}=${sig(u2 * 1e3, 3)}$ mV，求输出电压的变化量与 VT₁ 集电极的总电位。`,
      parts: [
        num("du", "$\\Delta u_O$", uo, "V", "V"),
        num("uc", "$u_{C1}$", r.UCQ + uo, "V", "V", { tol: 0.01, mistakes: [{ value: uo, tag: "static-vs-dynamic", message: "集电极的总电压 = 静态值 + 变化量：$u_{C1}=U_{CQ}+\\Delta u_O$。" }] }),
      ],
      hints: ["先分解为差模和共模。", "$\\Delta u_O=A_du_{Id}+A_cu_{Ic}$；$u_{C1}=U_{CQ}+\\Delta u_O$。"],
      solution: `$\\Delta u_O=${formatSI(uo, "V")}$，$u_{C1}=${V(r.UCQ + uo)}$。`,
    };
  }),
  gen({ id: "da-g-source", level: 3, topic: T3, title: "恒流源提高共模抑制比" }, (g) => {
    const p = { ...makeDiff(g), output: "single" as const, RL: Infinity };
    const a = analyzeDiff(p);
    const Ro = g.pick([0.5e6, 1e6, 2e6]);
    const b = analyzeDiff({ ...p, tail: "source", I0: 2 * a.IEQ, Re: Ro });
    return {
      prompt: `上题类型电路（单端输出，$R_e=${R(p.Re)}$，$K_{CMR}=${sig(a.KCMR, 3)}$）。把 $R_e$ 换成输出电流相同、输出电阻为 ${R(Ro)} 的恒流源，求新的 $A_c$ 与 $K_{CMR}$（dB）。`,
      diagram: { id: "diff-source" },
      parts: [num("Ac", "$A_c$", b.Ac, "1", "−0.005", { tol: 0.03 }), num("K", "$K_{CMR}$（dB）", b.KCMRdB, "1", "80", { tol: 0.01 })],
      hints: ["静态电流不变，$r_{be}$、$A_d$ 不变。", "把 $A_c$ 公式中的 $R_e$ 换成恒流源的输出电阻。"],
      solution: `$A_c=${sig(b.Ac, 3)}$，$K_{CMR}=${sig(b.KCMRdB, 3)}$ dB（原来 ${sig(a.KCMRdB, 3)} dB）。`,
    };
  }),
  gen({ id: "da-g-large", level: 3, topic: T3, title: "大信号：电流分配" }, (g) => {
    const I0 = g.pick([0.5, 1, 2]) * 1e-3;
    const k = g.pick([1, 2, 3, 4]);
    const uid = k * 0.026;
    const x = diffLargeSignal(uid, I0);
    return {
      prompt: `理想差分对管（无射极电阻）尾电流 $I_0=${A(I0)}$，$U_T=26$ mV。差模输入电压 $u_{Id}=${sig(uid * 1e3, 3)}$ mV 时，两管集电极电流各为多少？（忽略基极电流）`,
      parts: [num("i1", "$i_{C1}$", x.iC1, "A", "mA", { mistakes: [{ value: I0 / 2 + (I0 / 2) * (uid / 0.052), tag: "approx-misuse", message: "大信号时不能用线性近似；电流分配按 $1/(1+e^{-u_{Id}/U_T})$。" }] }), num("i2", "$i_{C2}$", x.iC2, "A", "mA")],
      hints: ["$i_{C1}/i_{C2}=e^{u_{Id}/U_T}$，且 $i_{C1}+i_{C2}=I_0$。"],
      solution: `$i_{C1}=${A(x.iC1)}$，$i_{C2}=${A(x.iC2)}$。`,
    };
  }),
  concept({
    id: "da-k-cm",
    level: 3,
    topic: T3,
    title: "差分电路怎样抑制零点漂移",
    prompt: "分别说明双端输出和单端输出的差分放大电路是怎样抑制零点漂移的。",
    keyPoints: ["温漂对两管相同，相当于共模信号", "双端输出：两集电极电位同向变化，相减抵消（依赖对称性）", "单端输出：R_e 对共模信号产生 2(1+β)R_e 的强负反馈，A_c 很小", "用恒流源代替 R_e 效果更好"],
    reference: "温度变化引起两管相同的变化，属于共模信号。双端输出时，两个集电极电位同时同向变化，输出取两者之差而相互抵消，效果取决于电路的对称程度；单端输出时依靠长尾电阻 $R_e$ 的共模负反馈，使 $A_c$ 远小于 $A_d$；用恒流源代替 $R_e$ 可大大提高 $K_{CMR}$。",
  }),
];

export const CH6_QUESTIONS: QuestionTemplate[] = [...signalsQ, ...sourceQ, ...diffQ];
