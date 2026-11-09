/** 第 9 章题库（原创）：RC 频率特性、混合 π 模型、单管与多级频率响应 */
import { bandEdges, ceFrequency, hybridPi, identicalStages, millerCap, multistageEstimate, poleResponse } from "@/simulations/freq/freq";
import { cabs, capForCorner, cargDeg, cornerFrequency, highPass, lowPass } from "@/simulations/signal/rc";
import { DEFAULT_DIVIDER, type CEParams } from "@/simulations/bjt/types";
import { formatSI, sig } from "@/simulations/units";
import { e12 } from "../generators";
import { choice, concept, gen, judge, num, type Rng } from "../helpers";
import type { QuestionTemplate } from "../types";

const R = (x: number) => formatSI(x, "Ω");
const Hz = (x: number) => formatSI(x, "Hz");
const F = (x: number) => formatSI(x, "F");

/* ═════════════ 基本概念 ═════════════ */
const T1 = "freq-basics";
const basicsQ: QuestionTemplate[] = [
  choice({
    id: "frb-c-3db",
    topic: T1,
    title: "截止频率处的增益",
    prompt: "在上限截止频率 $f_H$ 处，放大电路的电压增益下降为中频增益的：",
    options: ["1/2", "$1/\\sqrt2\\approx0.707$", "1/10", "0"],
    answer: 1,
    why: ["那是 −6 dB。", "正确：即下降 3 dB。", "那是 −20 dB。", "—"],
    hints: ["$20\\lg(1/\\sqrt2)=?$"],
  }),
  choice({
    id: "frb-c-cause",
    topic: T1,
    title: "下限截止频率的成因",
    prompt: "阻容耦合放大电路低频段增益下降的主要原因是：",
    options: ["晶体管结电容", "耦合电容和旁路电容的容抗增大", "β 随频率下降", "分布电容"],
    answer: 1,
    why: ["结电容影响高频段。", "正确。", "影响高频段。", "影响高频段。"],
    hints: ["低频时哪种电容的容抗变大到不可忽略？"],
  }),
  judge({
    id: "frb-j-slope",
    topic: T1,
    title: "一阶低通的高频斜率",
    prompt: "一阶 RC 低通电路在远高于截止频率处，幅频特性以 −20 dB/十倍频的斜率下降。",
    answer: true,
    why: "正确：$|\\dot A_u|\\approx f_H/f$，频率每升高 10 倍，增益下降 10 倍（−20 dB）。",
    hints: ["$f\\gg f_H$ 时 $|\\dot A_u|$ 近似为多少？"],
  }),
  gen({ id: "frb-g-fc", level: 2, topic: T1, title: "RC 电路的截止频率" }, (g) => {
    const kind = g.pick(["lp", "hp"] as const);
    const Rr = e12(g.range(1e3, 100e3));
    const C = g.pick([1, 2.2, 4.7, 10, 22, 47]) * Math.pow(10, -g.pick([6, 7, 8, 9]));
    const fc = cornerFrequency(Rr, C);
    return {
      prompt: `RC ${kind === "lp" ? "低通" : "高通"}电路 $R=${R(Rr)}$、$C=${F(C)}$。求${kind === "lp" ? "上限" : "下限"}截止频率。`,
      diagram: { id: kind === "lp" ? "rc-lowpass" : "rc-highpass", labels: { R: R(Rr), C: F(C) } },
      parts: [num("f", "$f_c$", fc, "Hz", "Hz", { mistakes: [{ value: 1 / (Rr * C), tag: "omega-f", message: "这是角频率 $\\omega$；$f=1/(2\\pi RC)$。" }] })],
      hints: ["$f_c=\\dfrac1{2\\pi RC}$。"],
      solution: `$f_c=${Hz(fc)}$。`,
    };
  }),
  gen({ id: "frb-g-mag", level: 2, topic: T1, title: "某频率下的增益与相移" }, (g) => {
    const kind = g.pick(["lp", "hp"] as const);
    const fc = g.pick([100, 1e3, 10e3]);
    const k = g.pick([0.1, 0.5, 2, 5, 10]);
    const f = fc * k;
    const h = kind === "lp" ? lowPass(f, fc) : highPass(f, fc);
    return {
      prompt: `一阶 RC ${kind === "lp" ? "低通" : "高通"}电路截止频率 $f_c=${Hz(fc)}$。在 $f=${Hz(f)}$ 时，求 $20\\lg|\\dot A_u|$（dB）和相移（°）。`,
      parts: [num("db", "增益（dB）", 20 * Math.log10(cabs(h)), "1", "−3", { tol: 0.03, mistakes: [{ value: 10 * Math.log10(cabs(h)), tag: "unit-convert", message: "电压增益的分贝数是 $20\\lg|\\dot A_u|$，不是 $10\\lg$。" }] }), num("ph", "相移（°）", cargDeg(h), "1", "−45", { tol: 0.02 })],
      hints: [kind === "lp" ? "$|\\dot A_u|=1/\\sqrt{1+(f/f_c)^2}$，$\\varphi=-\\arctan(f/f_c)$。" : "$|\\dot A_u|=\\dfrac{f/f_c}{\\sqrt{1+(f/f_c)^2}}$，$\\varphi=90°-\\arctan(f/f_c)$。"],
      solution: `${sig(20 * Math.log10(cabs(h)), 3)} dB，${sig(cargDeg(h), 3)}°。`,
    };
  }),
  gen({ id: "frb-g-bw", level: 2, topic: T1, title: "通频带" }, (g) => {
    const fL = g.pick([10, 20, 50, 100]);
    const fH = g.pick([20e3, 100e3, 500e3, 1e6]);
    const Am = g.pick([50, 100, 200]);
    const resp = poleResponse(Am, [fL], [fH]);
    const e = bandEdges(resp, Math.sqrt(fL * fH));
    return {
      prompt: `某放大电路 $\\dot A_u=\\dfrac{${Am}}{(1-j\\,${fL}/f)(1+j\\,f/${sig(fH, 3)})}$（f 单位 Hz）。求中频增益（dB）、$f_L$、$f_H$ 与通频带。`,
      parts: [num("db", "中频增益（dB）", 20 * Math.log10(Am), "1", "40", { tol: 0.01, mistakes: [{ value: 10 * Math.log10(Am), tag: "unit-convert", message: "电压增益的分贝数是 $20\\lg|\\dot A_u|$，不是 $10\\lg$（$10\\lg$ 用于功率）。" }] }), num("fl", "$f_L$", e.fL, "Hz", "Hz", { tol: 0.02 }), num("fh", "$f_H$", e.fH, "Hz", "kHz", { tol: 0.02 }), num("bw", "$f_{bw}$", e.fH - e.fL, "Hz", "kHz", { tol: 0.02 })],
      hints: ["分母两个因子分别对应下限、上限截止频率。"],
      solution: `中频 ${sig(20 * Math.log10(Am), 3)} dB，$f_L\\approx${Hz(e.fL)}$，$f_H\\approx${Hz(e.fH)}$。`,
    };
  }),
  gen({ id: "frb-g-asym", level: 3, topic: T1, title: "渐近线的误差" }, (g) => {
    const k = g.pick([0.5, 1, 2]);
    const h = lowPass(k * 1e3, 1e3);
    const exact = 20 * Math.log10(cabs(h));
    const asym = k <= 1 ? 0 : -20 * Math.log10(k);
    return {
      prompt: `一阶低通 $f_H=1$ kHz。在 $f=${sig(k * 1e3, 3)}$ Hz 处，精确幅频值与渐近线的差是多少 dB？`,
      parts: [num("d", "精确 − 渐近（dB）", exact - asym, "1", "−3", { tol: 0.03 })],
      hints: ["渐近线：$f\\le f_H$ 为 0 dB，$f>f_H$ 为 $-20\\lg(f/f_H)$。"],
      solution: `精确 ${sig(exact, 3)} dB，渐近 ${sig(asym, 3)} dB，差 ${sig(exact - asym, 3)} dB。`,
    };
  }),
  gen({ id: "frb-g-cmin", level: 3, topic: T1, title: "按下限频率选耦合电容" }, (g) => {
    const Rsum = e12(g.range(2e3, 20e3));
    const fL = g.pick([10, 20, 50]);
    const Cmin = capForCorner(Rsum, fL);
    return {
      prompt: `某耦合电容两端看进去的总电阻为 ${R(Rsum)}，要求它引入的下限频率不高于 ${fL} Hz。电容至少多大？`,
      parts: [num("c", "$C_{\\min}$", Cmin, "F", "µF")],
      hints: ["$C\\ge\\dfrac1{2\\pi f_LR}$。"],
      solution: `$C\\ge${F(Cmin)}$。`,
    };
  }),
  concept({
    id: "frb-k-mid",
    level: 3,
    topic: T1,
    title: "“中频”的含义",
    prompt: "说明放大电路“中频段”的含义，以及前面各章中频分析中的两条近似。",
    keyPoints: ["耦合、旁路电容容抗远小于回路电阻 → 短路", "结电容、分布电容容抗远大于回路阻抗 → 开路", "此时增益与频率无关", "中频段介于 f_L 与 f_H 之间"],
    reference: "中频段是指频率高到所有大电容（耦合、旁路电容）都可视为短路、又低到所有小电容（晶体管结电容、分布电容）都可视为开路的频段。在此频段内电路是纯电阻性的，增益与频率无关，前面各章的微变等效分析均基于这两条近似。",
  }),
];

/* ═════════════ 混合 π ═════════════ */
const T2 = "freq-hybrid-pi";
const hpiQ: QuestionTemplate[] = [
  choice({
    id: "fh-c-ft",
    topic: T2,
    title: "特征频率",
    prompt: "晶体管的特征频率 $f_T$ 是指：",
    options: ["$|\\dot\\beta|$ 下降到 $0.707\\beta_0$ 时的频率", "$|\\dot\\beta|$ 下降到 1 时的频率", "放大电路的上限频率", "$C_\\pi$ 的谐振频率"],
    answer: 1,
    why: ["那是 $f_\\beta$。", "正确。", "与电路有关，不是器件参数。", "—"],
    hints: ["“特征”指晶体管失去电流放大能力的频率。"],
  }),
  judge({
    id: "fh-j-gm",
    topic: T2,
    title: "跨导与管子型号",
    prompt: "同一静态电流下，不同型号 BJT 的跨导 $g_m$ 基本相同。",
    answer: true,
    why: "正确：$g_m=I_{EQ}/U_T$，只与静态电流和温度有关。",
    hints: ["写出 $g_m$ 的表达式。"],
  }),
  choice({
    id: "fh-c-fbeta",
    topic: T2,
    title: "f_β 与 f_T 的关系",
    prompt: "$f_\\beta$、$f_T$、$\\beta_0$ 之间的关系近似为：",
    options: ["$f_T\\approx f_\\beta/\\beta_0$", "$f_T\\approx\\beta_0f_\\beta$", "$f_T\\approx f_\\beta$", "无确定关系"],
    answer: 1,
    why: ["反了。", "正确：增益–带宽积。", "$f_T$ 远大于 $f_\\beta$。", "—"],
    hints: ["$f\\gg f_\\beta$ 时 $|\\dot\\beta|\\approx\\beta_0f_\\beta/f$。"],
  }),
  gen({ id: "fh-g-params", level: 2, topic: T2, title: "由 Q 点求混合 π 参数" }, (g) => {
    const IEQ = g.pick([0.5, 1, 2, 5]) * 1e-3;
    const beta = g.pick([50, 80, 100, 150]);
    const fT = g.pick([100, 200, 300, 500]) * 1e6;
    const Cmu = g.pick([1, 2, 3, 5]) * 1e-12;
    const h = hybridPi({ IEQ, beta, rbb: 200, fT, Cmu });
    return {
      prompt: `晶体管 $I_{EQ}=${formatSI(IEQ, "A")}$，$\\beta_0=${beta}$，$f_T=${Hz(fT)}$，$C_\\mu=${F(Cmu)}$，$U_T=26$ mV。求 $g_m$（mS）、$r_{b'e}$ 和 $C_\\pi$。`,
      parts: [num("gm", "$g_m$（mS）", h.gm * 1e3, "1", "38"), num("r", "$r_{b'e}$", h.rbpe, "Ω", "kΩ"), num("c", "$C_\\pi$", h.Cpi, "F", "pF", { tol: 0.04, mistakes: [{ value: h.gm / (2 * Math.PI * fT), tag: "freq-model", message: "还要减去 $C_\\mu$：$C_\\pi\\approx\\frac{g_m}{2\\pi f_T}-C_\\mu$。" }] })],
      hints: ["$g_m=I_{EQ}/U_T$，$r_{b'e}=(1+\\beta_0)U_T/I_{EQ}$。", "$C_\\pi\\approx g_m/(2\\pi f_T)-C_\\mu$。"],
      solution: `$g_m=${sig(h.gm * 1e3, 3)}$ mS，$r_{b'e}=${R(h.rbpe)}$，$C_\\pi=${F(h.Cpi)}$。`,
    };
  }),
  gen({ id: "fh-g-fbeta", level: 2, topic: T2, title: "共射截止频率" }, (g) => {
    const IEQ = g.pick([1, 2]) * 1e-3;
    const beta = g.pick([60, 100, 200]);
    const fT = g.pick([150, 300]) * 1e6;
    const h = hybridPi({ IEQ, beta, rbb: 200, fT, Cmu: 2e-12 });
    return {
      prompt: `已知 $\\beta_0=${beta}$、$f_T=${Hz(fT)}$（$I_{EQ}=${formatSI(IEQ, "A")}$，$C_\\mu$=2 pF）。求 $f_\\beta$。`,
      parts: [num("f", "$f_\\beta$", h.fbeta, "Hz", "MHz", { alts: [fT / beta], tol: 0.03 })],
      hints: ["$f_\\beta\\approx f_T/\\beta_0$，或 $1/[2\\pi r_{b'e}(C_\\pi+C_\\mu)]$。"],
      solution: `$f_\\beta\\approx${Hz(h.fbeta)}$。`,
    };
  }),
  gen({ id: "fh-g-beta", level: 2, topic: T2, title: "某频率下的 |β|" }, (g) => {
    const beta = g.pick([50, 100, 200]);
    const fb = g.pick([1, 2, 5]) * 1e6;
    const f = fb * g.pick([0.5, 1, 3, 10]);
    const val = cabs(lowPass(f, fb)) * beta;
    return {
      prompt: `$\\beta_0=${beta}$，$f_\\beta=${Hz(fb)}$。求 $f=${Hz(f)}$ 时的 $|\\dot\\beta|$。`,
      parts: [num("b", "$|\\dot\\beta|$", cabs(lowPass(f, fb)) * beta, "1", "70", { tol: 0.02 })],
      hints: ["$|\\dot\\beta|=\\beta_0/\\sqrt{1+(f/f_\\beta)^2}$。"],
      solution: `$|\\dot\\beta|\\approx${sig(val, 3)}$。`,
    };
  }),
  gen({ id: "fh-g-ft-need", level: 3, topic: T2, title: "选管：需要多高的 f_T" }, (g) => {
    const beta = g.pick([50, 100]);
    const f = g.pick([1, 5, 10]) * 1e6;
    const minBeta = g.pick([20, 30, 40]);
    // |β(f)| ≥ minBeta → f_β ≥ f / sqrt((β0/minBeta)² − 1)，f_T ≈ β0 f_β
    let lo = 1;
    let hi = 1e12;
    for (let k = 0; k < 200; k++) {
      const mid = Math.sqrt(lo * hi);
      if (cabs(lowPass(f, mid)) * beta >= minBeta) hi = mid;
      else lo = mid;
    }
    const fT = beta * hi;
    return {
      prompt: `要求晶体管在 ${Hz(f)} 时 $|\\dot\\beta|\\ge${minBeta}$，管子 $\\beta_0=${beta}$。所需 $f_T$ 至少多大（用 $f_T\\approx\\beta_0f_\\beta$）？`,
      parts: [num("ft", "$f_{T\\min}$", fT, "Hz", "MHz", { tol: 0.03 })],
      hints: ["先由 $\\beta_0/\\sqrt{1+(f/f_\\beta)^2}=${minBeta}$ 解出 $f_\\beta$。"],
      solution: `$f_\\beta\\ge${Hz(hi)}$，$f_T\\ge${Hz(fT)}$。`,
    };
  }),
  gen({ id: "fh-g-gmratio", level: 3, topic: T2, title: "跨导随静态电流变化" }, (g) => {
    const I1 = g.pick([0.5, 1]) * 1e-3;
    const k = g.pick([2, 4, 5]);
    const h1 = hybridPi({ IEQ: I1, beta: 100, rbb: 200, fT: 300e6, Cmu: 2e-12 });
    const h2 = hybridPi({ IEQ: I1 * k, beta: 100, rbb: 200, fT: 300e6, Cmu: 2e-12 });
    return {
      prompt: `同一晶体管（$f_T$ 视为不变，300 MHz；$C_\\mu$=2 pF），静态电流由 ${formatSI(I1, "A")} 增大到 ${formatSI(I1 * k, "A")}。$g_m$ 和 $C_\\pi$ 各变为原来的多少倍？`,
      parts: [num("g", "$g_m$ 倍数", h2.gm / h1.gm, "1", "2", { tol: 0.01 }), num("c", "$C_\\pi$ 倍数", h2.Cpi / h1.Cpi, "1", "2", { tol: 0.02 })],
      hints: ["$g_m\\propto I_{EQ}$；$C_\\pi=g_m/(2\\pi f_T)-C_\\mu$。"],
      solution: `$g_m$ 增大 ${sig(h2.gm / h1.gm, 3)} 倍，$C_\\pi$ 增大约 ${sig(h2.Cpi / h1.Cpi, 3)} 倍（扩散电容正比于电流）。`,
    };
  }),
  concept({
    id: "fh-k-why",
    level: 3,
    topic: T2,
    title: "β 为什么随频率下降",
    prompt: "用混合 π 模型解释晶体管电流放大系数 β 为什么随频率升高而下降。",
    keyPoints: ["基极电流分两路：r_b'e 与 C_π（及 C_μ）", "频率升高，电容容抗减小，分走更多基极电流", "U_b'e 随之减小，受控源 g_m U_b'e 减小", "|β| 在 f_β 以上近似与 f 成反比"],
    reference: "输出短路时，基极电流流入 b' 点后分为两路：流过 $r_{b'e}$ 和流过 $C_\\pi+C_\\mu$。频率升高时电容容抗下降，越来越多的电流被电容分走，$\\dot U_{b'e}$ 减小，而集电极电流 $g_m\\dot U_{b'e}$ 随之减小，所以 $|\\dot\\beta|$ 下降，在 $f_\\beta$ 以上近似与频率成反比。",
  }),
];

/* ═════════════ 单管 ═════════════ */
const T3 = "freq-single-stage";
function makeP(g: Rng): CEParams {
  return { ...DEFAULT_DIVIDER, Re1: 0, Re2: 1.2e3, hasCe: true, Rs: g.pick([50, 300, 600, 1e3, 2e3]), RL: e12(g.range(1e3, 10e3)), C1: g.pick([1, 4.7, 10]) * 1e-6, C2: 10e-6, Ce: g.pick([22, 47, 100]) * 1e-6 };
}
const singleQ: QuestionTemplate[] = [
  choice({
    id: "f1-c-miller",
    topic: T3,
    title: "米勒效应",
    prompt: "共射放大电路中，集电结电容 $C_\\mu$ 对上限频率影响很大的原因是：",
    options: ["$C_\\mu$ 本身很大", "米勒效应使其折合到输入端放大约 $(1+g_mR_L')$ 倍", "$C_\\mu$ 与 $R_L$ 谐振", "$C_\\mu$ 使 β 增大"],
    answer: 1,
    why: ["$C_\\mu$ 只有几皮法。", "正确。", "—", "—"],
    hints: ["$C_\\mu$ 跨接在反相放大器的输入、输出之间。"],
  }),
  choice({
    id: "f1-c-ce",
    topic: T3,
    title: "旁路电容对下限频率的影响",
    prompt: "分压偏置共射电路中，射极旁路电容 $C_e$ 通常取得比耦合电容大得多，因为：",
    options: ["$C_e$ 两端电压大", "从 $C_e$ 两端看进去的电阻很小（约几十欧）", "$C_e$ 影响上限频率", "$C_e$ 要隔直"],
    answer: 1,
    why: ["无关。", "正确：时间常数 $RC_e$ 中 R 小，C 必须大。", "它影响下限频率。", "隔直是耦合电容的作用。"],
    hints: ["从射极看进去的电阻约为 $(r_{be}+R_s')/(1+\\beta)$。"],
  }),
  judge({
    id: "f1-j-gbw",
    topic: T3,
    title: "增益与带宽",
    prompt: "对同一只晶体管组成的共射电路，增大集电极负载电阻可以同时提高中频增益和上限截止频率。",
    answer: false,
    why: "错误。$R_L'$ 增大使 $g_mR_L'$ 增大，增益上升，但米勒电容 $(1+g_mR_L')C_\\mu$ 也增大，$f_H$ 下降——增益带宽积近似不变。",
    hints: ["米勒电容中含有什么？"],
  }),
  gen({ id: "f1-g-miller", level: 2, topic: T3, title: "米勒等效电容" }, (g) => {
    const gm = g.pick([20, 38.5, 50, 77]) * 1e-3;
    const RLp = e12(g.range(1e3, 5e3));
    const Cmu = g.pick([1, 2, 3, 5]) * 1e-12;
    const Cpi = g.pick([20, 50, 100]) * 1e-12;
    const CM = millerCap(gm, RLp, Cmu);
    return {
      prompt: `共射电路 $g_m=${sig(gm * 1e3, 3)}$ mS，$R_L'=${R(RLp)}$，$C_\\mu=${F(Cmu)}$，$C_\\pi=${F(Cpi)}$。求米勒等效电容 $(1+g_mR_L')C_\\mu$ 与 $C_\\pi'$。`,
      parts: [num("m", "$C_M$", CM, "F", "pF", { mistakes: [{ value: Cmu, tag: "freq-model", message: "跨接在 b′–c 间的 $C_\\mu$ 等效到输入端要放大 $(1+g_mR_L')$ 倍（密勒效应），不能直接用 $C_\\mu$。" }] }), num("t", "$C_\\pi'$", Cpi + CM, "F", "pF", { mistakes: [{ value: Cpi + Cmu, tag: "freq-model", message: "并到 $C_\\pi$ 上的是密勒等效电容 $(1+g_mR_L')C_\\mu$，不是 $C_\\mu$ 本身。" }] })],
      hints: ["$C_\\pi'=C_\\pi+(1+g_mR_L')C_\\mu$。"],
      solution: `$C_M=${F(CM)}$，$C_\\pi'=${F(Cpi + CM)}$。`,
    };
  }),
  gen({ id: "f1-g-fh", level: 2, topic: T3, title: "上限截止频率" }, (g) => {
    const p = makeP(g);
    const r = ceFrequency(p, { fT: g.pick([150, 200, 300]) * 1e6, Cmu: g.pick([2, 3, 4]) * 1e-12 });
    return {
      prompt: `共射电路高频等效：$C_\\pi'=${F(r.CpiMiller)}$，从 $C_\\pi'$ 两端看进去的电阻 $R=r_{b'e}\\para(r_{bb'}+R_s\\para R_B)=${R(r.Rpi)}$。求上限截止频率 $f_H$。`,
      parts: [num("f", "$f_H$", r.fH, "Hz", "kHz", { mistakes: [{ value: 1 / (r.Rpi * r.CpiMiller), tag: "omega-f", message: "$f_H=1/(2\\pi RC_\\pi')$，别漏 2π。" }] })],
      hints: ["$f_H=\\dfrac1{2\\pi RC_\\pi'}$。"],
      solution: `$f_H=${Hz(r.fH)}$。`,
    };
  }),
  gen({ id: "f1-g-fl", level: 2, topic: T3, title: "下限截止频率" }, (g) => {
    const p = makeP(g);
    const r = ceFrequency(p, { fT: 200e6, Cmu: 3e-12 });
    return {
      prompt: `共射电路三个电容各自的转折频率为：$f_{C1}=${Hz(r.hp.fC1)}$、$f_{C2}=${Hz(r.hp.fC2)}$、$f_{Ce}=${Hz(r.hp.fCe)}$。用短路时间常数法估算下限截止频率，并指出起主要作用的电容（$C_1$ 填 1，$C_2$ 填 2，$C_e$ 填 3）。`,
      parts: [num("fl", "$f_L$", r.fL, "Hz", "Hz", {
          tol: 0.02,
          mistakes: [{ value: Math.max(r.hp.fC1, r.hp.fC2, r.hp.fCe), tag: "approx-misuse", message: "只取最大的转折频率是“主导电容”近似；短路时间常数法要把各转折频率相加：$f_L\\approx f_{C1}+f_{C2}+f_{Ce}$。" }],
        }), num("k", "主导电容", [r.hp.fC1, r.hp.fC2, r.hp.fCe].indexOf(Math.max(r.hp.fC1, r.hp.fC2, r.hp.fCe)) + 1, "1", "3", { tol: 0.01 })],
      hints: ["$f_L\\approx\\sum f_{Ck}$。"],
      solution: `$f_L\\approx${Hz(r.fL)}$。`,
    };
  }),
  gen({ id: "f1-g-full", level: 3, topic: T3, title: "完整分析：中频增益与上限频率" }, (g) => {
    const p = makeP(g);
    const fT = g.pick([150, 250]) * 1e6;
    const Cmu = g.pick([2, 3]) * 1e-12;
    const r = ceFrequency(p, { fT, Cmu });
    return {
      prompt: `分压偏置共射电路（$V_{CC}$=12 V，$R_{b1}$=10 kΩ，$R_{b2}$=33 kΩ，$R_e$=1.2 kΩ 全旁路，$R_c$=3 kΩ，β=100，$r_{bb'}$=100 Ω），$R_s=${R(p.Rs)}$，$R_L=${R(p.RL)}$，晶体管 $f_T=${Hz(fT)}$，$C_\\mu=${F(Cmu)}$。求中频源电压增益 $\\dot A_{usm}$、$C_\\pi'$ 与 $f_H$。`,
      parts: [num("a", "$\\dot A_{usm}$", r.Ausm, "1", "−50", { tol: 0.04, signMessage: "共射反相。" }), num("c", "$C_\\pi'$", r.CpiMiller, "F", "pF", { tol: 0.05 }), num("f", "$f_H$", r.fH, "Hz", "MHz", { tol: 0.06 })],
      hints: ["先求 Q 点、$r_{b'e}$、$g_m$、$C_\\pi$。", "$C_\\pi'=C_\\pi+(1+g_mR_L')C_\\mu$，$R=r_{b'e}\\para(r_{bb'}+R_s\\para R_B)$。"],
      solution: `$\\dot A_{usm}=${sig(r.Ausm, 3)}$，$C_\\pi'=${F(r.CpiMiller)}$，$f_H=${Hz(r.fH)}$，增益带宽积 ${Hz(r.GBW)}。`,
    };
  }),
  gen({ id: "f1-g-rs", level: 3, topic: T3, title: "信号源内阻对 f_H 的影响" }, (g) => {
    const base = makeP(g);
    const a = ceFrequency({ ...base, Rs: 100 }, { fT: 200e6, Cmu: 3e-12 });
    const b = ceFrequency({ ...base, Rs: 5e3 }, { fT: 200e6, Cmu: 3e-12 });
    return {
      prompt: `同一共射电路（$R_L=${R(base.RL)}$，$f_T$=200 MHz，$C_\\mu$=3 pF），信号源内阻分别为 100 Ω 和 5 kΩ 时，上限截止频率各为多少？`,
      parts: [num("a", "$R_s$=100 Ω", a.fH, "Hz", "MHz", { tol: 0.04 }), num("b", "$R_s$=5 kΩ", b.fH, "Hz", "kHz", { tol: 0.04 })],
      hints: ["$C_\\pi'$ 不变，看进去的电阻 $R=r_{b'e}\\para(r_{bb'}+R_s\\para R_B)$ 变了。"],
      solution: `${Hz(a.fH)} → ${Hz(b.fH)}。`,
    };
  }),
  concept({
    id: "f1-k-miller",
    level: 3,
    topic: T3,
    title: "米勒定理",
    prompt: "推导米勒定理，并说明为什么共基电路没有明显的米勒效应。",
    keyPoints: ["跨接阻抗 Z 两端电压 U_1、U_2 = K U_1", "输入端电流 (U_1 − KU_1)/Z → 等效 Z/(1−K)", "电容：C_M = (1−K)C；反相放大 K 为负值，C 被放大", "共基电路 C_μ 接在 c 与接地的 b 之间，不跨接输入输出"],
    reference: "跨接在两节点间的阻抗 $Z$，若 $\\dot U_2=\\dot K\\dot U_1$，则从节点 1 流出的电流为 $\\dot U_1(1-\\dot K)/Z$，等效于对地阻抗 $Z/(1-\\dot K)$；对电容即 $C_M=(1-\\dot K)C$。共射电路 $\\dot K=-g_mR_L'$，所以 $C_\\mu$ 被放大。共基电路中 $C_\\mu$ 接在集电极与交流接地的基极之间，不跨接输入、输出，没有米勒倍增。",
  }),
];

/* ═════════════ 多级 ═════════════ */
const T4 = "freq-multistage";
const multiQ: QuestionTemplate[] = [
  choice({
    id: "fm-c-narrow",
    topic: T4,
    title: "级联后的带宽",
    prompt: "两级完全相同的放大电路级联后，与单级相比：",
    options: ["$f_H$ 升高、$f_L$ 降低", "$f_H$ 降低、$f_L$ 升高", "都不变", "$f_H$、$f_L$ 都升高"],
    answer: 1,
    why: ["反了。", "正确：通频带变窄。", "—", "—"],
    hints: ["在单级 $f_H$ 处两级共下降多少 dB？"],
  }),
  judge({
    id: "fm-j-db",
    topic: T4,
    title: "dB 相加",
    prompt: "多级放大电路的总增益（dB）等于各级增益（dB）之和。",
    answer: true,
    why: "正确：增益相乘，取对数后相加。",
    hints: ["$20\\lg(A_1A_2)=?$"],
  }),
  choice({
    id: "fm-c-dom",
    topic: T4,
    title: "主导级",
    prompt: "两级放大电路 $f_{H1}=1$ MHz、$f_{H2}=50$ kHz，总的上限频率约为：",
    options: ["1 MHz", "略低于 50 kHz", "525 kHz", "1.05 MHz"],
    answer: 1,
    why: ["由较低的一级主导。", "正确：约为 $f_{H2}$，略低一点。", "不是平均值。", "—"],
    hints: ["一级远低于另一级时，总带宽由谁决定？"],
  }),
  gen({ id: "fm-g-ident", level: 2, topic: T4, title: "n 级相同电路的上限频率" }, (g) => {
    const n = g.pick([2, 3, 4]);
    const fH = g.pick([100e3, 500e3, 1e6, 2e6]);
    const ex = identicalStages(n, 10, fH);
    return {
      prompt: `${n} 级完全相同的放大电路级联，单级上限截止频率 ${Hz(fH)}（单极点）。求总的上限截止频率。`,
      parts: [num("f", "$f_H$", ex.fH, "Hz", "kHz", { tol: 0.02, mistakes: [{ value: fH / n, tag: "freq-model", message: "不是简单除以 n：$f_H=f_{H1}\\sqrt{2^{1/n}-1}$。" }] })],
      hints: ["$|A|^n$ 在 $f_H$ 处等于 $1/\\sqrt2$。"],
      solution: `$f_H=${Hz(fH)}\\times\\sqrt{2^{1/${n}}-1}=${Hz(ex.fH)}$。`,
    };
  }),
  gen({ id: "fm-g-est", level: 2, topic: T4, title: "估算公式" }, (g) => {
    const fHs = [g.pick([200e3, 500e3]), g.pick([300e3, 1e6]), g.pick([400e3, 2e6])];
    const fLs = [g.pick([10, 20]), g.pick([30, 50]), g.pick([5, 10])];
    const e = multistageEstimate(fLs, fHs);
    return {
      prompt: `三级放大电路各级 $f_{Hk}$ 为 ${fHs.map(Hz).join("、")}，$f_{Lk}$ 为 ${fLs.map(Hz).join("、")}。用估算公式求总的 $f_H$ 与 $f_L$。`,
      parts: [num("h", "$f_H$", e.fH, "Hz", "kHz", { tol: 0.02 }), num("l", "$f_L$", e.fL, "Hz", "Hz", { tol: 0.02 })],
      hints: ["$1/f_H\\approx1.1\\sqrt{\\sum1/f_{Hk}^2}$，$f_L\\approx1.1\\sqrt{\\sum f_{Lk}^2}$。"],
      solution: `$f_H\\approx${Hz(e.fH)}$，$f_L\\approx${Hz(e.fL)}$。`,
    };
  }),
  gen({ id: "fm-g-db", level: 2, topic: T4, title: "总增益（dB）" }, (g) => {
    const A = [g.pick([10, 20, 50]), g.pick([10, 30, 100]), g.pick([2, 5])];
    const db = A.reduce((s, x) => s + 20 * Math.log10(x), 0);
    return {
      prompt: `三级放大电路中频增益分别为 ${A.join("、")} 倍。总增益为多少 dB？`,
      parts: [
        num("d", "总增益（dB）", db, "1", "80", {
          tol: 0.01,
          mistakes: [
            { value: 20 * Math.log10(A[0] + A[1] + A[2]), tag: "unit-convert", message: "多级放大的总增益是各级倍数**相乘**（分贝数相加），不是倍数相加。" },
            { value: A.reduce((s, x) => s + 10 * Math.log10(x), 0), tag: "unit-convert", message: "电压增益的分贝数是 $20\\lg A$，不是 $10\\lg A$。" },
          ],
        }),
      ],
      hints: ["各级 dB 相加。"],
      solution: `${sig(db, 4)} dB。`,
    };
  }),
  gen({ id: "fm-g-exact", level: 3, topic: T4, title: "数值求两级的 f_H" }, (g) => {
    const f1 = g.pick([100e3, 200e3]);
    const f2 = g.pick([300e3, 500e3, 1e6]);
    const e = bandEdges(poleResponse(1, [], [f1, f2]), 100);
    const est = multistageEstimate([1], [f1, f2]);
    return {
      prompt: `两级放大电路（各一个高频极点）$f_{H1}=${Hz(f1)}$、$f_{H2}=${Hz(f2)}$。精确求总的上限频率（$|A|$ 降为中频的 $1/\\sqrt2$），并与估算公式比较。`,
      parts: [num("x", "精确 $f_H$", e.fH, "Hz", "kHz", { tol: 0.02 }), num("y", "估算 $f_H$", est.fH, "Hz", "kHz", { tol: 0.02 })],
      hints: ["解 $\\left[1+(f/f_{H1})^2\\right]\\left[1+(f/f_{H2})^2\\right]=2$（关于 $f^2$ 的二次方程）。"],
      solution: `精确 ${Hz(e.fH)}，估算 ${Hz(est.fH)}。`,
    };
  }),
  gen({ id: "fm-g-design", level: 3, topic: T4, title: "多级电路每级需要多宽的带宽" }, (g) => {
    const n = g.pick([2, 3, 4]);
    const target = g.pick([100e3, 1e6]);
    const k = identicalStages(n, 1, 1).fH;
    return {
      prompt: `用 ${n} 级相同的单极点放大电路级联，要求总上限截止频率不低于 ${Hz(target)}，每级的上限截止频率至少多高？`,
      parts: [num("f", "单级 $f_{H1}$", target / k, "Hz", "kHz", { tol: 0.02 })],
      hints: ["由 $f_H=f_{H1}\\sqrt{2^{1/n}-1}$ 反解。"],
      solution: `$f_{H1}\\ge${Hz(target / k)}$。`,
    };
  }),
  concept({
    id: "fm-k-why",
    level: 3,
    topic: T4,
    title: "级联为何带宽变窄",
    prompt: "解释多级放大电路通频带比单级窄的原因，并说明提高总带宽的思路。",
    keyPoints: ["总增益是各级相乘，dB 相加", "单级在 f_H 处已下降 3 dB，n 级共下降 3n dB", "所以总的 −3 dB 点向中频方向移动", "提高最窄一级的带宽最有效"],
    reference: "多级电路的频率特性是各级之积。在单级的截止频率处，每一级都已下降 3 dB，n 级叠加下降 3n dB，因此整体的 −3 dB 频率向中频方向移动，$f_H$ 降低、$f_L$ 升高。总带宽主要受最窄的一级限制，改善该级（选高频管、减小米勒效应、减小前级输出电阻等）最有效。",
  }),
];

export const CH9_QUESTIONS: QuestionTemplate[] = [...basicsQ, ...hpiQ, ...singleQ, ...multiQ];
