/** 第 3 章其余单元题库（原创）：分压式偏置、共集、共基 */
import { analyzeCE, solveDC } from "@/simulations/bjt/ce";
import { analyzeCB, analyzeCC, betaSensitivity, DEFAULT_CB, DEFAULT_CC, qAtTemperature, type StageParams } from "@/simulations/bjt/stages";
import { DEFAULT_CE, type CEParams } from "@/simulations/bjt/types";
import { formatSI, par, sig } from "@/simulations/units";
import { e12 } from "../generators";
import { choice, concept, gen, judge, num, type Rng } from "../helpers";
import type { QuestionTemplate } from "../types";

const V = (x: number) => formatSI(x, "V");
const A = (x: number) => formatSI(x, "A");
const R = (x: number) => formatSI(x, "Ω");
type G = Rng;

/** 分压偏置电路：满足估算条件、放大区、U_CEQ 适中 */
function makeDivider(g: G, opts: { bypass: "full" | "partial" | "none" } = { bypass: "full" }) {
  for (let k = 0; k < 120; k++) {
    const VCC = g.pick([12, 15, 18]);
    const beta = g.pick([50, 60, 80, 100, 120]);
    const Rb1 = e12(g.range(5e3, 20e3));
    const Rb2 = e12(Rb1 * g.range(2.2, 4.5));
    const RE = e12(g.range(0.8e3, 2.5e3));
    const Re1 = opts.bypass === "partial" ? g.pick([100, 150, 200, 300]) : opts.bypass === "none" ? RE : 0;
    const Re2 = opts.bypass === "none" ? 0 : Math.max(100, e12(RE - Re1));
    const UBQ = (VCC * Rb1) / (Rb1 + Rb2);
    const IE = (UBQ - 0.7) / (Re1 + Re2);
    if (IE <= 0) continue;
    const Rc = e12((VCC * g.range(0.3, 0.45)) / IE);
    const RL = e12(Rc * g.range(0.8, 2));
    const rbb = g.pick([100, 200, 300]);
    const p: CEParams = { ...DEFAULT_CE, topology: "divider", VCC, beta, Rb1, Rb2, Re1, Re2, hasCe: opts.bypass !== "none", Rc, RL, rbb, Rs: 0 };
    const a = analyzeCE(p);
    if (a.dc.region === "active" && a.dc.estimate && a.dc.estimate.ratio >= 10 && a.dc.UCEQ > 0.2 * VCC && a.dc.UCEQ < 0.75 * VCC) return { p, a };
  }
  const p: CEParams = { ...DEFAULT_CE, topology: "divider", Rb1: 10e3, Rb2: 33e3, Re1: 0, Re2: 1.2e3 };
  return { p, a: analyzeCE(p) };
}

function makeCC(g: G, divider = false): { p: StageParams; a: ReturnType<typeof analyzeCC> } {
  for (let k = 0; k < 120; k++) {
    const VCC = g.pick([9, 12, 15]);
    const beta = g.pick([50, 80, 100, 120]);
    const Re = e12(g.range(1e3, 5e3));
    const RL = e12(g.range(0.5e3, 5e3));
    const Rs = g.pick([0, 500, 1e3, 2e3, 5e3]);
    const rbb = g.pick([100, 200, 300]);
    let p: StageParams;
    if (divider) {
      const Rb1 = e12(g.range(20e3, 100e3));
      const Rb2 = e12(Rb1 * g.range(0.7, 1.5));
      p = { ...DEFAULT_CC, topology: "divider", VCC, beta, Re, RL, Rs, rbb, Rb1, Rb2 };
    } else {
      const IE = g.range(1e-3, 4e-3);
      const Rb = e12(((VCC / 2 - 0.7) * (1 + beta)) / IE);
      p = { ...DEFAULT_CC, topology: "fixed", VCC, beta, Re, RL, Rs, rbb, Rb };
    }
    const a = analyzeCC(p);
    if (a.valid && a.dc.UCEQ > 0.25 * VCC && a.dc.UCEQ < 0.75 * VCC) return { p, a };
  }
  return { p: DEFAULT_CC, a: analyzeCC(DEFAULT_CC) };
}

function makeCB(g: G): { p: StageParams; a: ReturnType<typeof analyzeCB> } {
  for (let k = 0; k < 120; k++) {
    const VCC = g.pick([12, 15]);
    const beta = g.pick([50, 80, 100, 120]);
    const Rb1 = e12(g.range(5e3, 20e3));
    const Rb2 = e12(Rb1 * g.range(2.2, 4));
    const Re = e12(g.range(0.8e3, 3e3));
    const IE = ((VCC * Rb1) / (Rb1 + Rb2) - 0.7) / Re;
    if (IE <= 0) continue;
    const Rc = e12((VCC * g.range(0.3, 0.45)) / IE);
    const RL = e12(Rc * g.range(0.8, 2));
    const p: StageParams = { ...DEFAULT_CB, VCC, beta, Rb1, Rb2, Re, Rc, RL, rbb: g.pick([100, 200, 300]), Rs: g.pick([0, 50, 100, 600]) };
    const a = analyzeCB(p);
    if (a.valid && a.dc.UCEQ > 0.2 * VCC && a.dc.UCEQ < 0.7 * VCC) return { p, a };
  }
  return { p: DEFAULT_CB, a: analyzeCB(DEFAULT_CB) };
}

/* ═════════════ 分压式偏置 ═════════════ */
const T1 = "divider-bias";
const dividerQ: QuestionTemplate[] = [
  choice({
    id: "db-c-role",
    topic: T1,
    title: "R_e 的作用",
    prompt: "分压式偏置共射电路中，射极电阻 $R_e$（被 $C_e$ 旁路）的主要作用是：",
    options: ["提高电压放大倍数", "引入直流负反馈，稳定静态工作点", "提高输出电阻", "隔离直流"],
    answer: 1,
    why: ["被旁路的 $R_e$ 不影响交流增益；不旁路时反而降低增益。", "正确。", "输出电阻约为 $R_c$，与 $R_e$ 基本无关。", "隔直是电容的作用。"],
    hints: ["$I_{EQ}$ 增大时，$R_e$ 上的电压怎样变化？它又怎样影响 $U_{BEQ}$？"],
  }),
  judge({
    id: "db-j-ce",
    topic: T1,
    title: "旁路电容与 Q 点",
    prompt: "分压偏置电路中，若旁路电容 $C_e$ 开路，静态工作点将发生变化。",
    answer: false,
    why: "错误。直流通路中电容本来就开路，$C_e$ 是否存在不影响 Q 点；它只影响交流通路（$R_e$ 进入交流通路，$|\\dot A_u|$ 下降、$R_i$ 增大）。",
    hints: ["画直流通路时电容怎么处理？"],
  }),
  choice({
    id: "db-c-cond",
    topic: T1,
    title: "估算法的条件",
    prompt: "分压偏置电路用估算法 $U_{BQ}\\approx\\frac{R_{b1}}{R_{b1}+R_{b2}}V_{CC}$ 的前提是：",
    options: ["$I_{BQ}\\gg I_1$（$I_1$ 为流过分压电阻的电流）", "$I_1\\gg I_{BQ}$，即 $(1+\\beta)R_e\\gg R_{b1}\\para R_{b2}$", "$R_e=0$", "$\\beta$ 很小"],
    answer: 1,
    why: ["反了。", "正确。", "没有 $R_e$ 就失去了稳定作用，且估算公式不成立。", "β 越大越容易满足条件。"],
    hints: ["$I_{BQ}$ 从分压点“抽走”电流，会怎样影响 $U_{BQ}$？"],
  }),
  gen({ id: "db-g-q", level: 2, topic: T1, title: "分压偏置的静态工作点（估算法）" }, (g) => {
    const { p, a } = makeDivider(g);
    const e = a.dc.estimate!;
    return {
      prompt: `分压式偏置共射电路：$V_{CC}=${p.VCC}$ V，$R_{b1}=${R(p.Rb1)}$（下），$R_{b2}=${R(p.Rb2)}$（上），$R_e=${R(p.Re2)}$（被旁路），$R_c=${R(p.Rc)}$，$\\beta=${p.beta}$，$U_{BEQ}=0.7$ V。用估算法求 $U_{BQ}$、$I_{CQ}$、$U_{CEQ}$。`,
      figure: { params: p, mode: "dc" },
      parts: [
        num("UBQ", "$U_{BQ}$", e.UBQ, "V", "V", { mistakes: [{ value: (p.VCC * p.Rb2) / (p.Rb1 + p.Rb2), tag: "divider-swap", message: "分压时 $U_{BQ}$ 取的是**下偏置电阻** $R_{b1}$ 上的电压：$U_{BQ}=V_{CC}R_{b1}/(R_{b1}+R_{b2})$。" }] }),
        num("ICQ", "$I_{CQ}$", e.ICQ, "A", "mA", { alts: [a.dc.ICQ], mistakes: [{ value: e.UBQ / p.Re2, tag: "forget-ube", message: "别忘了减去 $U_{BEQ}$：$I_{EQ}=(U_{BQ}-U_{BEQ})/R_e$。" }] }),
        num("UCEQ", "$U_{CEQ}$", e.UCEQ, "V", "V", { alts: [a.dc.UCEQ], mistakes: [{ value: p.VCC - e.ICQ * p.Rc, tag: "kvl-loop", message: "$R_e$ 上也有压降：$U_{CEQ}\\approx V_{CC}-I_{CQ}(R_c+R_e)$。" }] }),
      ],
      hints: ["估算法：$U_{BQ}\\approx V_{CC}R_{b1}/(R_{b1}+R_{b2})$。", "$I_{CQ}\\approx I_{EQ}=(U_{BQ}-0.7)/R_e$。", "$U_{CEQ}\\approx V_{CC}-I_{CQ}(R_c+R_e)$。"],
      solution: `$U_{BQ}=${V(e.UBQ)}$，$I_{CQ}\\approx${A(e.ICQ)}$，$U_{CEQ}\\approx${V(e.UCEQ)}$（精确解 $I_{CQ}=${A(a.dc.ICQ)}$）。`,
    };
  }),
  gen({ id: "db-g-exact", level: 2, topic: T1, title: "戴维南等效求 Q 点" }, (g) => {
    const { p, a } = makeDivider(g);
    return {
      prompt: `分压偏置电路 $V_{CC}=${p.VCC}$ V，$R_{b1}=${R(p.Rb1)}$，$R_{b2}=${R(p.Rb2)}$，$R_e=${R(p.Re2)}$，$R_c=${R(p.Rc)}$，$\\beta=${p.beta}$，$U_{BEQ}=0.7$ V。用戴维南等效（不忽略 $I_{BQ}$）求 $V_{BB}$、$R_B$ 与 $I_{BQ}$。`,
      parts: [
        num("VBB", "$V_{BB}$", a.dc.VBB, "V", "V"),
        num("RB", "$R_B$", a.dc.RB, "Ω", "kΩ", { mistakes: [{ value: p.Rb1 + p.Rb2, tag: "series-parallel", message: "戴维南等效电阻是两个偏置电阻**并联**。" }] }),
        num("IBQ", "$I_{BQ}$", a.dc.IBQ, "A", "µA", { mistakes: [{ value: (a.dc.VBB - 0.7) / a.dc.RB, tag: "emitter-reflection", message: "基极回路中还有 $(1+\\beta)R_e$：$I_{BQ}=(V_{BB}-U_{BEQ})/[R_B+(1+\\beta)R_e]$。" }] }),
      ],
      hints: ["$V_{BB}=V_{CC}R_{b1}/(R_{b1}+R_{b2})$，$R_B=R_{b1}\\para R_{b2}$。", "基极回路 KVL：$V_{BB}=I_{BQ}R_B+U_{BEQ}+(1+\\beta)I_{BQ}R_e$。"],
      solution: `$V_{BB}=${V(a.dc.VBB)}$，$R_B=${R(a.dc.RB)}$，$I_{BQ}=${A(a.dc.IBQ)}$，$I_{CQ}=${A(a.dc.ICQ)}$。`,
    };
  }),
  gen({ id: "db-g-dyn", level: 2, topic: T1, title: "部分旁路时的动态参数" }, (g) => {
    const { p, a } = makeDivider(g, { bypass: "partial" });
    const Rib0 = a.ac.rbe;
    return {
      prompt: `分压偏置共射电路：$V_{CC}=${p.VCC}$ V，$R_{b1}=${R(p.Rb1)}$，$R_{b2}=${R(p.Rb2)}$，$R_{e1}=${R(p.Re1)}$（不旁路），$R_{e2}=${R(p.Re2)}$（被 $C_e$ 旁路），$R_c=${R(p.Rc)}$，$R_L=${R(p.RL)}$，$\\beta=${p.beta}$，$r_{bb'}=${p.rbb}\\,\\Omega$，$U_T=26$ mV。已求得 $I_{EQ}=${A(a.dc.IEQ)}$。求 $r_{be}$、$\\dot A_u$、$R_i$、$R_o$。`,
      figure: { params: p, mode: "full" },
      parts: [
        num("rbe", "$r_{be}$", a.ac.rbe, "Ω", "kΩ"),
        num("Au", "$\\dot A_u$", a.ac.Au, "1", "−8", { signMessage: "共射电路输出与输入反相，$\\dot A_u$ 为负。", mistakes: [{ value: (-p.beta * a.ac.RLp) / Rib0, tag: "bypass-cap", message: "$R_{e1}$ 没有被旁路，要折算到基极回路：分母为 $r_{be}+(1+\\beta)R_{e1}$。" }, { value: (-p.beta * a.ac.RLp) / (a.ac.rbe + (1 + p.beta) * (p.Re1 + p.Re2)), tag: "bypass-cap", message: "被 $C_e$ 旁路的 $R_{e2}$ 在交流通路中短路，不应计入。" }] }),
        num("Ri", "$R_i$", a.ac.Ri, "Ω", "kΩ", { mistakes: [{ value: par(a.dc.RB, a.ac.rbe), tag: "bypass-cap", message: "$R_{e1}$ 使从基极看进去的电阻增大为 $r_{be}+(1+\\beta)R_{e1}$。" }] }),
        num("Ro", "$R_o$", a.ac.Ro, "Ω", "kΩ"),
      ],
      hints: ["$r_{be}=r_{bb'}+(1+\\beta)U_T/I_{EQ}$。", "交流通路中只剩 $R_{e1}$。", "$\\dot A_u=-\\beta R_L'/[r_{be}+(1+\\beta)R_{e1}]$。"],
      solution: `$r_{be}=${R(a.ac.rbe)}$，$\\dot A_u=${sig(a.ac.Au, 3)}$，$R_i=${R(a.ac.Ri)}$，$R_o\\approx${R(a.ac.Ro)}$。`,
    };
  }),
  gen({ id: "db-g-ce-open", level: 3, topic: T1, title: "旁路电容开路前后" }, (g) => {
    const { p, a } = makeDivider(g, { bypass: "full" });
    const b = analyzeCE({ ...p, hasCe: false });
    return {
      prompt: `分压偏置共射电路：$V_{CC}=${p.VCC}$ V，$R_{b1}=${R(p.Rb1)}$，$R_{b2}=${R(p.Rb2)}$，$R_e=${R(p.Re2)}$，$R_c=${R(p.Rc)}$，$R_L=${R(p.RL)}$，$\\beta=${p.beta}$，$r_{bb'}=${p.rbb}\\,\\Omega$。(1) 正常时（$R_e$ 被 $C_e$ 完全旁路）求 $\\dot A_u$；(2) $C_e$ 开路后求 $\\dot A_u$ 与 $R_i$。`,
      figure: { params: p, mode: "full" },
      parts: [
        num("A1", "(1) $\\dot A_u$", a.ac.Au, "1", "−100", { signMessage: "共射电路反相。" }),
        num("A2", "(2) $\\dot A_u$", b.ac.Au, "1", "−2", { signMessage: "共射电路反相。", mistakes: [{ value: a.ac.Au, tag: "bypass-cap", message: "$C_e$ 开路后 $R_e$ 进入交流通路，增益会大幅下降。" }, { value: -a.ac.RLp / p.Re2, tag: "approx-misuse", message: "$-R_L'/R_e$ 只是近似值，本题要求按完整公式计算（误差约 $r_{be}/[(1+\\beta)R_e]$）。" }] }),
        num("Ri", "(2) $R_i$", b.ac.Ri, "Ω", "kΩ"),
      ],
      hints: ["Q 点不变，$r_{be}$ 不变。", "$C_e$ 开路：$\\dot A_u=-\\beta R_L'/[r_{be}+(1+\\beta)R_e]$，$R_i=R_{b1}\\para R_{b2}\\para[r_{be}+(1+\\beta)R_e]$。"],
      solution: `正常 $\\dot A_u=${sig(a.ac.Au, 3)}$；$C_e$ 开路后 $\\dot A_u=${sig(b.ac.Au, 3)}$（$\\approx-R_L'/R_e=${sig(-a.ac.RLp / p.Re2, 3)}$），$R_i=${R(b.ac.Ri)}$。`,
    };
  }),
  gen({ id: "db-g-temp", level: 3, topic: T1, title: "温度变化时两种偏置的比较" }, (g) => {
    const { p } = makeDivider(g);
    const d25 = qAtTemperature(p, 25);
    const fixed: CEParams = { ...p, topology: "fixed", Rb: (p.beta * (p.VCC - 0.7)) / d25.ICQ, Re1: 0, Re2: 0 };
    const t = g.pick([45, 55, 65]);
    const f25 = qAtTemperature(fixed, 25);
    const ft = qAtTemperature(fixed, t);
    const dt = qAtTemperature(p, t);
    return {
      prompt: `一个分压偏置电路（$V_{CC}=${p.VCC}$ V，$R_{b1}=${R(p.Rb1)}$，$R_{b2}=${R(p.Rb2)}$，$R_e=${R(p.Re2)}$，$\\beta=${p.beta}$）与一个固定偏置电路（$R_b=${R(fixed.Rb)}$，无 $R_e$）在 25 °C 时 $I_{CQ}$ 相同，都约为 ${A(d25.ICQ)}。温度升至 ${t} °C，β 按每度 +1%（复利）、$U_{BE}$ 按每度 −2.2 mV 变化（忽略 $I_{CBO}$），用戴维南等效精确计算两电路的 $I_{CQ}$ 相对变化（百分数）。`,
      parts: [num("f", "固定偏置 $\\Delta I_{CQ}/I_{CQ}$", (ft.ICQ - f25.ICQ) / f25.ICQ, "1", "40%", { tol: 0.04 }), num("d", "分压偏置 $\\Delta I_{CQ}/I_{CQ}$", (dt.ICQ - d25.ICQ) / d25.ICQ, "1", "4%", { tol: 0.1 })],
      hints: ["固定偏置：$I_{CQ}=\\beta(V_{CC}-U_{BE})/R_b$。", "分压偏置：$I_{CQ}=\\beta(V_{BB}-U_{BE})/[R_B+(1+\\beta)R_e]$。"],
      solution: `固定偏置约 +${sig(((ft.ICQ - f25.ICQ) / f25.ICQ) * 100, 3)}%，分压偏置约 +${sig(((dt.ICQ - d25.ICQ) / d25.ICQ) * 100, 3)}%。`,
    };
  }),
  gen({ id: "db-g-sens", level: 3, topic: T1, title: "I_CQ 对 β 的灵敏度" }, (g) => {
    const { p } = makeDivider(g);
    const S = betaSensitivity(p);
    const b2 = p.beta * 2;
    const i1 = solveDC(p).ICQ;
    const i2 = solveDC({ ...p, beta: b2 }).ICQ;
    return {
      prompt: `分压偏置电路 $V_{CC}=${p.VCC}$ V，$R_{b1}=${R(p.Rb1)}$，$R_{b2}=${R(p.Rb2)}$，$R_e=${R(p.Re2)}$。若把 $\\beta=${p.beta}$ 的管子换成 $\\beta=${b2}$ 的同型号管子，$I_{CQ}$ 增大百分之几？（精确计算）对比：固定偏置电路此时 $I_{CQ}$ 增大百分之几？`,
      parts: [num("d", "分压偏置", (i2 - i1) / i1, "1", "3%", { tol: 0.08 }), num("f", "固定偏置", 1, "1", "100%", { tol: 0.01 })],
      hints: ["$I_{CQ}=\\beta\\dfrac{V_{BB}-U_{BEQ}}{R_B+(1+\\beta)R_e}$，β 加倍后重新计算。", "固定偏置 $I_{CQ}\\propto\\beta$。"],
      solution: `分压偏置约 +${sig(((i2 - i1) / i1) * 100, 3)}%（灵敏度 $S\\approx${sig(S, 2)}$），固定偏置 +100%。`,
    };
  }),
  concept({
    id: "db-k-process",
    level: 3,
    topic: T1,
    title: "稳定 Q 点的过程",
    prompt: "用箭头写出分压偏置电路在温度升高时稳定静态工作点的过程，并说明该电路稳定 Q 点的两个必要条件。",
    keyPoints: ["$T\\uparrow\\to I_C\\uparrow\\to U_E\\uparrow\\to U_{BE}\\downarrow\\to I_B\\downarrow\\to I_C\\downarrow$", "条件一：$U_{BQ}$ 基本固定（$I_1\\gg I_{BQ}$）", "条件二：有射极电阻 $R_e$（直流负反馈）", "$R_e$ 被旁路时只有直流负反馈，不影响交流增益"],
    reference: "温度升高 → $I_{CQ}$↑ → $U_{EQ}=I_{EQ}R_e$↑ → $U_{BEQ}=U_{BQ}-U_{EQ}$↓（$U_{BQ}$ 固定）→ $I_{BQ}$↓ → $I_{CQ}$↓。条件：分压电流远大于 $I_{BQ}$ 使 $U_{BQ}$ 固定；射极电阻 $R_e$ 足够大（$U_{EQ}\\gg$ $U_{BE}$ 的变化量）。",
  }),
];

/* ═════════════ 共集 ═════════════ */
const T2 = "cc-amplifier";
const ccQ: QuestionTemplate[] = [
  choice({
    id: "cc-c-feature",
    topic: T2,
    title: "射极跟随器的特点",
    prompt: "射极跟随器（共集电路）的特点是：",
    options: ["$|A_u|\\gg1$，输入电阻小，输出电阻大", "$A_u\\approx1$ 且同相，输入电阻大，输出电阻小", "$A_u\\approx1$ 且反相", "$A_u\\approx1$，没有任何放大作用"],
    answer: 1,
    why: ["这不是共集电路。", "正确。", "共集电路输出与输入同相。", "它有电流放大（$1+\\beta$），因此有功率放大。"],
    hints: ["发射极电位与基极电位相差约 0.7 V 且同步变化。"],
  }),
  judge({
    id: "cc-j-ro",
    topic: T2,
    title: "输出电阻与信号源内阻",
    prompt: "射极跟随器的输出电阻与信号源内阻 $R_s$ 无关。",
    answer: false,
    why: "错误。$R_o=R_e\\para\\dfrac{r_{be}+R_s\\para R_b}{1+\\beta}$，与 $R_s$ 有关：$R_s$ 越大，$R_o$ 越大。",
    hints: ["求 $R_o$ 时，信号源置零后其内阻还在电路中吗？"],
  }),
  choice({
    id: "cc-c-config",
    topic: T2,
    title: "公共端",
    prompt: "射极跟随器被称为“共集电极”电路，是因为：",
    options: ["集电极接地（直流）", "集电极接 $V_{CC}$，交流通路中接地，是输入、输出回路的公共端", "输出从集电极取出", "集电极电流最大"],
    answer: 1,
    why: ["集电极接的是 $V_{CC}$，不是直流地。", "正确。", "输出取自发射极。", "与电流大小无关。"],
    hints: ["“共”看的是交流通路。"],
  }),
  gen({ id: "cc-g-q", level: 2, topic: T2, title: "射极跟随器的静态工作点" }, (g) => {
    const { p, a } = makeCC(g);
    return {
      prompt: `共集电路（固定偏置）：$V_{CC}=${p.VCC}$ V，$R_b=${R(p.Rb)}$，$R_e=${R(p.Re)}$，$\\beta=${p.beta}$，$U_{BEQ}=0.7$ V。求 $I_{BQ}$、$I_{EQ}$、$U_{CEQ}$。`,
      diagram: { id: "cc-amp", labels: { Rb: R(p.Rb), Re: R(p.Re), RL: R(p.RL) } },
      parts: [
        num("IB", "$I_{BQ}$", a.dc.IBQ, "A", "µA", { mistakes: [{ value: (p.VCC - 0.7) / p.Rb, tag: "emitter-reflection", message: "基极回路中还有 $R_e$：$V_{CC}=I_{BQ}R_b+U_{BEQ}+(1+\\beta)I_{BQ}R_e$。" }] }),
        num("IE", "$I_{EQ}$", a.dc.IEQ, "A", "mA"),
        num("UCE", "$U_{CEQ}$", a.dc.UCEQ, "V", "V", { mistakes: [{ value: a.dc.IEQ * p.Re, tag: "kvl-loop", message: "这是 $U_{EQ}$；$U_{CEQ}=V_{CC}-U_{EQ}$。" }] }),
      ],
      hints: ["基极回路 KVL：$I_{BQ}=(V_{CC}-U_{BEQ})/[R_b+(1+\\beta)R_e]$。", "$U_{CEQ}=V_{CC}-I_{EQ}R_e$。"],
      solution: `$I_{BQ}=${A(a.dc.IBQ)}$，$I_{EQ}=${A(a.dc.IEQ)}$，$U_{CEQ}=${V(a.dc.UCEQ)}$。`,
    };
  }),
  gen({ id: "cc-g-ac", level: 2, topic: T2, title: "射极跟随器的 A_u、R_i、R_o" }, (g) => {
    const { p, a } = makeCC(g);
    return {
      prompt: `共集电路：$V_{CC}=${p.VCC}$ V，$R_b=${R(p.Rb)}$，$R_e=${R(p.Re)}$，$R_L=${R(p.RL)}$，信号源内阻 $R_s=${R(p.Rs)}$，$\\beta=${p.beta}$，$r_{bb'}=${p.rbb}\\,\\Omega$，$U_T=26$ mV。已知 $I_{EQ}=${A(a.dc.IEQ)}$。求 $\\dot A_u$、$R_i$、$R_o$。`,
      diagram: { id: "cc-amp", labels: { Rb: R(p.Rb), Re: R(p.Re), RL: R(p.RL) } },
      parts: [
        num("Au", "$\\dot A_u$", a.ac.Au, "1", "0.98", { tol: 0.005, mistakes: [{ value: 1, tag: "approx-misuse", message: "$\\dot A_u$ 略小于 1，请按 $(1+\\beta)R_L'/[r_{be}+(1+\\beta)R_L']$ 计算。" }] }),
        num("Ri", "$R_i$", a.ac.Ri, "Ω", "kΩ", { mistakes: [{ value: par(p.Rb, a.ac.rbe + (1 + p.beta) * p.Re), tag: "load-ignored", message: "射极上的交流负载是 $R_e\\para R_L$，不是 $R_e$。" }] }),
        num("Ro", "$R_o$", a.ac.Ro, "Ω", "Ω", { mistakes: [{ value: par(p.Re, a.ac.rbe / (1 + p.beta)), tag: "io-resistance", message: "求 $R_o$ 时信号源置零但保留内阻：分子应为 $r_{be}+R_s\\para R_b$。" }, { value: p.Re, tag: "emitter-reflection", message: "从射极看进去还要并上基极回路折算过来的 $(r_{be}+R_s')/(1+\\beta)$。" }] }),
      ],
      hints: ["$r_{be}=r_{bb'}+(1+\\beta)U_T/I_{EQ}$，$R_L'=R_e\\para R_L$。", "$R_i=R_b\\para[r_{be}+(1+\\beta)R_L']$。", "$R_o=R_e\\para\\dfrac{r_{be}+R_s\\para R_b}{1+\\beta}$。"],
      solution: `$r_{be}=${R(a.ac.rbe)}$，$\\dot A_u=${sig(a.ac.Au, 4)}$，$R_i=${R(a.ac.Ri)}$，$R_o=${R(a.ac.Ro)}$。`,
    };
  }),
  gen({ id: "cc-g-aus", level: 2, topic: T2, title: "跟随器作缓冲级" }, (g) => {
    const Rs = g.pick([10e3, 20e3, 50e3]);
    const RL = g.pick([100, 200, 470, 1e3]);
    const p: StageParams = { ...DEFAULT_CC, topology: "divider", Rb1: 100e3, Rb2: 100e3, Re: g.pick([1e3, 2e3]), Rs, RL, beta: g.pick([80, 100, 150]) };
    const a = analyzeCC(p);
    const direct = RL / (Rs + RL);
    return {
      prompt: `内阻 $R_s=${R(Rs)}$ 的信号源要驱动 $R_L=${R(RL)}$ 的负载。(1) 直接连接时负载电压是信号源开路电压的多少倍？(2) 中间接一级射极跟随器（分压偏置 $R_{b1}=R_{b2}=100$ kΩ，$R_e=${R(p.Re)}$，$\\beta=${p.beta}$，已算得 $R_i=${R(a.ac.Ri)}$、$\\dot A_u=${sig(a.ac.Au, 3)}$）后，负载电压是信号源开路电压的多少倍？`,
      parts: [num("d", "(1) 直接连接", direct, "1", "0.01"), num("v", "(2) 经跟随器 $\\dot A_{us}$", a.ac.Aus, "1", "0.6", { mistakes: [{ value: a.ac.Au, tag: "source-resistance", message: "还要考虑信号源内阻与跟随器输入电阻的分压：$\\dot A_{us}=\\dfrac{R_i}{R_s+R_i}\\dot A_u$。" }] })],
      hints: ["直接连接：$R_L/(R_s+R_L)$。", "$\\dot A_{us}=\\dfrac{R_i}{R_s+R_i}\\dot A_u$。"],
      solution: `直接 ${sig(direct, 3)}，经跟随器 ${sig(a.ac.Aus, 3)}，提高约 ${sig(a.ac.Aus / direct, 3)} 倍。`,
    };
  }),
  gen({ id: "cc-g-div", level: 3, topic: T2, title: "分压偏置射极跟随器的完整分析" }, (g) => {
    const { p, a } = makeCC(g, true);
    const VBB = (p.VCC * p.Rb1) / (p.Rb1 + p.Rb2);
    const VBBs = (p.VCC * p.Rb2) / (p.Rb1 + p.Rb2);
    return {
      prompt: `分压偏置的共集电路：$V_{CC}=${p.VCC}$ V，$R_{b1}=${R(p.Rb1)}$（下），$R_{b2}=${R(p.Rb2)}$（上），$R_e=${R(p.Re)}$，$R_L=${R(p.RL)}$，$R_s=${R(p.Rs)}$，$\\beta=${p.beta}$，$r_{bb'}=${p.rbb}\\,\\Omega$。用戴维南等效求 $I_{EQ}$，再求 $\\dot A_u$、$R_i$、$R_o$、$\\dot A_{us}$。`,
      diagram: { id: "cc-amp", labels: { bias: "divider", Rb1: R(p.Rb1), Rb2: R(p.Rb2), Re: R(p.Re), RL: R(p.RL) } },
      parts: [
        num("IE", "$I_{EQ}$", a.dc.IEQ, "A", "mA", {
          tol: 0.03,
          mistakes: [
            { value: (a.dc.IEQ * VBB) / (VBB - p.UBE), tag: "forget-ube", message: "别忘了减去 $U_{BEQ}$：$I_{EQ}=\\dfrac{V_{BB}-U_{BEQ}}{R_e+R_B/(1+\\beta)}$。" },
            ...(VBBs > p.UBE + 0.1
              ? [{ value: (a.dc.IEQ * (VBBs - p.UBE)) / (VBB - p.UBE), tag: "divider-swap" as const, message: "$V_{BB}$ 是下偏置电阻 $R_{b1}$ 上的分压：$V_{BB}=V_{CC}R_{b1}/(R_{b1}+R_{b2})$。" }]
              : []),
          ],
        }),
        num("Au", "$\\dot A_u$", a.ac.Au, "1", "0.98", {
          tol: 0.005,
          mistakes: [
            { value: 1, tag: "approx-misuse", message: "$\\dot A_u$ 略小于 1，本题要求按 $(1+\\beta)R_L'/[r_{be}+(1+\\beta)R_L']$ 计算。" },
            // 空载增益与 1 太接近时两种错误无法区分，只保留“取 1”
            ...(Math.abs(a.ac.Auo - 1) > 0.012 ? [{ value: a.ac.Auo, tag: "load-ignored" as const, message: "射极上的交流负载是 $R_L'=R_e\\para R_L$，不是 $R_e$。" }] : []),
          ],
        }),
        num("Ri", "$R_i$", a.ac.Ri, "Ω", "kΩ", {
          mistakes: [
            { value: par(a.dc.RB, a.ac.rbe + a.ac.RLp), tag: "emitter-reflection", message: "射极电阻折算到基极回路要乘 $(1+\\beta)$：$R_i=R_B\\para[r_{be}+(1+\\beta)R_L']$。" },
            { value: a.ac.rbe + (1 + p.beta) * a.ac.RLp, tag: "io-resistance", message: "从输入端看进去还要并上偏置电阻 $R_B=R_{b1}\\para R_{b2}$。" },
            { value: par(a.dc.RB, a.ac.rbe + (1 + p.beta) * p.Re), tag: "load-ignored", message: "射极的交流负载是 $R_e\\para R_L$：求 $R_i$ 时负载要接上。" },
          ],
        }),
        num("Ro", "$R_o$", a.ac.Ro, "Ω", "Ω", {
          tol: 0.04,
          mistakes: [
            { value: par(p.Re, a.ac.rbe + par(p.Rs, a.dc.RB)), tag: "emitter-reflection", message: "基极回路的电阻折算到射极要除以 $(1+\\beta)$：$R_o=R_e\\para\\dfrac{r_{be}+R_s\\para R_B}{1+\\beta}$。" },
            { value: par(p.Re, a.ac.rbe / (1 + p.beta)), tag: "io-resistance", message: "求 $R_o$ 时信号源置零但保留内阻：分子是 $r_{be}+R_s\\para R_B$。" },
          ],
        }),
        num("Aus", "$\\dot A_{us}$", a.ac.Aus, "1", "0.9", { tol: 0.01, mistakes: [{ value: a.ac.Au, tag: "source-resistance", message: "这是 $\\dot A_u$；$\\dot A_{us}$ 还要乘 $R_i/(R_s+R_i)$。" }] }),
      ],
      hints: ["$V_{BB}=V_{CC}R_{b1}/(R_{b1}+R_{b2})$，$R_B=R_{b1}\\para R_{b2}$，$I_{BQ}=(V_{BB}-0.7)/[R_B+(1+\\beta)R_e]$。", "$R_o$ 中基极回路电阻为 $r_{be}+R_s\\para R_B$。"],
      solution: `$I_{EQ}=${A(a.dc.IEQ)}$，$\\dot A_u=${sig(a.ac.Au, 4)}$，$R_i=${R(a.ac.Ri)}$，$R_o=${R(a.ac.Ro)}$，$\\dot A_{us}=${sig(a.ac.Aus, 3)}$。`,
    };
  }),
  gen({ id: "cc-g-uom", level: 3, topic: T2, title: "射极跟随器的最大不失真输出" }, (g) => {
    const { p, a } = makeCC(g);
    const cut = a.dc.IEQ * a.ac.RLp;
    const sat = a.dc.UCEQ - p.UCES;
    return {
      prompt: `共集电路 $V_{CC}=${p.VCC}$ V，$R_b=${R(p.Rb)}$，$R_e=${R(p.Re)}$，$R_L=${R(p.RL)}$，$\\beta=${p.beta}$，$U_{CES}=0.3$ V。已求得 $I_{EQ}=${A(a.dc.IEQ)}$、$U_{CEQ}=${V(a.dc.UCEQ)}$。求输出电压正、负方向的最大摆幅，以及最大不失真输出电压幅值 $U_{om}$。`,
      diagram: { id: "cc-amp", labels: { Rb: R(p.Rb), Re: R(p.Re), RL: R(p.RL) } },
      parts: [
        num("up", "正向（受饱和限制）", sat, "V", "V"),
        num("down", "负向（受截止限制）", cut, "V", "V", { mistakes: [{ value: a.dc.IEQ * p.Re, tag: "load-ignored", message: "交流负载是 $R_e\\para R_L$：负半周 $i_E$ 减到 0 时输出下降 $I_{EQ}(R_e\\para R_L)$。" }] }),
        num("Uom", "$U_{om}$", a.ac.Uom, "V", "V"),
      ],
      hints: ["输出正半周 $u_E$ 升高，$u_{CE}$ 减小，直到 $U_{CES}$。", "输出负半周 $i_E$ 减小，直到 0，此时输出下降 $I_{EQ}R_L'$。"],
      solution: `正向 ${V(sat)}，负向 ${V(cut)}，$U_{om}=${V(a.ac.Uom)}$。`,
    };
  }),
  concept({
    id: "cc-k-reflect",
    level: 3,
    topic: T2,
    title: "电阻的折算规律",
    prompt: "总结共集电路中“射极电阻折算到基极”和“基极电阻折算到射极”的规律，并说明原因。",
    keyPoints: ["射极电流是基极电流的 $(1+\\beta)$ 倍", "射极电阻折算到基极：乘以 $(1+\\beta)$（使 $R_i$ 大）", "基极回路电阻折算到射极：除以 $(1+\\beta)$（使 $R_o$ 小）", "两端电压相同、电流相差 $(1+\\beta)$ 倍，所以等效电阻相差 $(1+\\beta)$ 倍"],
    reference: "同一电压下，射极支路电流是基极支路电流的 $(1+\\beta)$ 倍。从基极看射极电阻 $R$：电压 $\\dot I_eR=(1+\\beta)\\dot I_bR$，等效为 $(1+\\beta)R$；从射极看基极电阻 $R$：电压 $\\dot I_bR=\\dot I_eR/(1+\\beta)$，等效为 $R/(1+\\beta)$。",
  }),
];

/* ═════════════ 共基 ═════════════ */
const T3 = "cb-amplifier";
const cbQ: QuestionTemplate[] = [
  choice({
    id: "cb-c-ri",
    topic: T3,
    title: "共基电路的输入电阻",
    prompt: "三种基本组态中，输入电阻最小的是：",
    options: ["共射", "共集", "共基", "三者相同"],
    answer: 2,
    why: ["共射约为 $r_{be}$（千欧级）。", "共集最大。", "正确：约 $r_{be}/(1+\\beta)$，十几欧到几十欧。", "差别很大。"],
    hints: ["从发射极看进去，电流是基极电流的多少倍？"],
  }),
  choice({
    id: "cb-c-phase",
    topic: T3,
    title: "共基电路的相位",
    prompt: "共基放大电路的输出电压与输入电压：",
    options: ["反相，$|A_u|$ 较大", "同相，$|A_u|$ 较大", "同相，$A_u\\approx1$", "反相，$A_u\\approx1$"],
    answer: 1,
    why: ["共射才反相。", "正确：$\\dot A_u=\\beta R_L'/r_{be}$。", "那是共集。", "—"],
    hints: ["$u_i$ 加在发射极上，$u_i\\uparrow$ 时 $u_{BE}$ 怎样变化？"],
  }),
  judge({
    id: "cb-j-hf",
    topic: T3,
    title: "共基电路的频率特性",
    prompt: "共基放大电路的电流放大倍数小于 1，但高频特性比共射电路好。",
    answer: true,
    why: "正确。电流放大倍数为 $\\alpha<1$；由于基极接地，集电结电容不会因米勒效应被放大，所以上限截止频率高。",
    hints: ["米勒效应在哪种组态中最严重？"],
  }),
  gen({ id: "cb-g-ac", level: 2, topic: T3, title: "共基电路的动态参数" }, (g) => {
    const { p, a } = makeCB(g);
    return {
      prompt: `共基放大电路：$V_{CC}=${p.VCC}$ V，$R_{b1}=${R(p.Rb1)}$，$R_{b2}=${R(p.Rb2)}$，$R_e=${R(p.Re)}$，$R_c=${R(p.Rc)}$，$R_L=${R(p.RL)}$，$\\beta=${p.beta}$，$r_{bb'}=${p.rbb}\\,\\Omega$。已求得 $I_{EQ}=${A(a.dc.IEQ)}$（$U_T$ 取 26 mV）。求 $r_{be}$、$\\dot A_u$、$R_i$、$R_o$。`,
      diagram: { id: "cb-amp", labels: { Rb1: R(p.Rb1), Rb2: R(p.Rb2), Re: R(p.Re), Rc: R(p.Rc), RL: R(p.RL) } },
      parts: [
        num("rbe", "$r_{be}$", a.ac.rbe, "Ω", "kΩ"),
        num("Au", "$\\dot A_u$", a.ac.Au, "1", "100", { signMessage: "共基电路输出与输入**同相**，$\\dot A_u$ 为正。" }),
        num("Ri", "$R_i$", a.ac.Ri, "Ω", "Ω", { mistakes: [{ value: a.ac.rbe, tag: "emitter-reflection", message: "从发射极看进去，$r_{be}$ 要除以 $(1+\\beta)$。" }] }),
        num("Ro", "$R_o$", a.ac.Ro, "Ω", "kΩ"),
      ],
      hints: ["$\\dot A_u=\\beta R_L'/r_{be}$，$R_L'=R_c\\para R_L$。", "$R_i=R_e\\para\\dfrac{r_{be}}{1+\\beta}$。"],
      solution: `$r_{be}=${R(a.ac.rbe)}$，$\\dot A_u=${sig(a.ac.Au, 3)}$，$R_i=${R(a.ac.Ri)}$，$R_o\\approx${R(a.ac.Ro)}$。`,
    };
  }),
  gen({ id: "cb-g-aus", level: 2, topic: T3, title: "信号源内阻对共基电路的影响" }, (g) => {
    const { p } = makeCB(g);
    const Rs = g.pick([50, 100, 300, 1e3]);
    const a = analyzeCB({ ...p, Rs });
    return {
      prompt: `某共基放大电路 $\\dot A_u=${sig(a.ac.Au, 3)}$，$R_i=${R(a.ac.Ri)}$。接内阻 $R_s=${R(Rs)}$ 的信号源时，源电压放大倍数 $\\dot A_{us}$ 是多少？`,
      parts: [num("Aus", "$\\dot A_{us}$", a.ac.Aus, "1", "20", { mistakes: [{ value: a.ac.Au, tag: "source-resistance", message: "要考虑 $R_s$ 与 $R_i$ 的分压。" }] })],
      hints: ["$\\dot A_{us}=\\dfrac{R_i}{R_s+R_i}\\dot A_u$。"],
      solution: `$\\dot A_{us}=${sig(a.ac.Aus, 3)}$。共基电路适合由低内阻信号源（或前级的低输出电阻）驱动。`,
    };
  }),
  gen({ id: "cb-g-compare", level: 2, topic: T3, title: "共射与共基的增益" }, (g) => {
    const { p, a } = makeCB(g);
    const ce = analyzeCE({ ...DEFAULT_CE, topology: "divider", VCC: p.VCC, Rb1: p.Rb1, Rb2: p.Rb2, Re1: 0, Re2: p.Re, hasCe: true, Rc: p.Rc, RL: p.RL, beta: p.beta, rbb: p.rbb, Rs: 0 });
    return {
      prompt: `同一个分压偏置电路（$V_{CC}=${p.VCC}$ V，$R_{b1}=${R(p.Rb1)}$，$R_{b2}=${R(p.Rb2)}$，$R_e=${R(p.Re)}$，$R_c=${R(p.Rc)}$，$R_L=${R(p.RL)}$，$\\beta=${p.beta}$，$r_{bb'}=${p.rbb}\\,\\Omega$）分别接成共射（$R_e$ 全旁路）和共基形式。分别求两者的 $\\dot A_u$ 和输入电阻 $R_i$。`,
      parts: [
        num("Ace", "共射 $\\dot A_u$", ce.ac.Au, "1", "−100", { signMessage: "共射反相。" }),
        num("Rce", "共射 $R_i$", ce.ac.Ri, "Ω", "kΩ"),
        num("Acb", "共基 $\\dot A_u$", a.ac.Au, "1", "100", { signMessage: "共基同相。" }),
        num("Rcb", "共基 $R_i$", a.ac.Ri, "Ω", "Ω"),
      ],
      hints: ["两者 Q 点相同，$r_{be}$ 相同。", "增益数值相同、符号相反；输入电阻相差约 $(1+\\beta)$ 倍。"],
      solution: `共射：$${sig(ce.ac.Au, 3)}$，$R_i=${R(ce.ac.Ri)}$；共基：$${sig(a.ac.Au, 3)}$，$R_i=${R(a.ac.Ri)}$。`,
    };
  }),
  gen({ id: "cb-g-full", level: 3, topic: T3, title: "共基电路完整分析" }, (g) => {
    const { p, a } = makeCB(g);
    const est = a.dc;
    const VBB = (p.VCC * p.Rb1) / (p.Rb1 + p.Rb2);
    const ICe = est.estimate?.ICQ ?? est.ICQ;
    return {
      prompt: `共基放大电路：$V_{CC}=${p.VCC}$ V，$R_{b1}=${R(p.Rb1)}$，$R_{b2}=${R(p.Rb2)}$，$R_e=${R(p.Re)}$，$R_c=${R(p.Rc)}$，$R_L=${R(p.RL)}$，$R_s=${R(p.Rs)}$，$\\beta=${p.beta}$，$r_{bb'}=${p.rbb}\\,\\Omega$，$U_{BEQ}=0.7$ V。(1) 用戴维南等效求 $I_{CQ}$ 与 $U_{CEQ}$；(2) 求 $\\dot A_u$ 与 $\\dot A_{us}$。`,
      diagram: { id: "cb-amp", labels: { Rb1: R(p.Rb1), Rb2: R(p.Rb2), Re: R(p.Re), Rc: R(p.Rc), RL: R(p.RL) } },
      parts: [
        num("IC", "$I_{CQ}$", est.ICQ, "A", "mA", { alts: [ICe], mistakes: [{ value: (ICe * VBB) / (VBB - p.UBE), tag: "forget-ube", message: "别忘了减去 $U_{BEQ}$：$I_{EQ}\\approx(U_{BQ}-U_{BEQ})/R_e$。" }] }),
        num("UCE", "$U_{CEQ}$", est.UCEQ, "V", "V", { alts: [est.estimate?.UCEQ ?? est.UCEQ], mistakes: [{ value: p.VCC - est.ICQ * p.Rc, tag: "kvl-loop", message: "$R_e$ 上也有压降：$U_{CEQ}\\approx V_{CC}-I_{CQ}(R_c+R_e)$。" }] }),
        num("Au", "$\\dot A_u$", a.ac.Au, "1", "100", { mistakes: [{ value: a.ac.Auo, tag: "load-ignored", message: "接负载后交流负载为 $R_L'=R_c\\para R_L$。" }] }),
        num("Aus", "$\\dot A_{us}$", a.ac.Aus, "1", "50", {
          mistakes: [{ value: a.ac.Au, tag: "source-resistance", message: "共基电路的输入电阻很小（约 $r_{be}/(1+\\beta)$），信号源内阻要分走大部分电压：$\\dot A_{us}=\\dot A_u\\dfrac{R_i}{R_s+R_i}$，远小于 $\\dot A_u$。" }],
        }),
      ],
      hints: ["直流通路与分压偏置共射电路相同。", "$\\dot A_u=\\beta R_L'/r_{be}$，$R_i=R_e\\para r_{be}/(1+\\beta)$，$\\dot A_{us}=\\dfrac{R_i}{R_s+R_i}\\dot A_u$。"],
      solution: `$I_{CQ}=${A(est.ICQ)}$，$U_{CEQ}=${V(est.UCEQ)}$；$\\dot A_u=${sig(a.ac.Au, 3)}$，$\\dot A_{us}=${sig(a.ac.Aus, 3)}$。`,
    };
  }),
  gen({ id: "cb-g-choose", level: 3, topic: T3, title: "按需求选组态" }, (g) => {
    const need = g.pick(["hiRi", "loRo", "hf", "volt"] as const);
    const opts = ["共射", "共集", "共基"];
    const ans = { hiRi: 1, loRo: 1, hf: 2, volt: 0 }[need];
    const text = { hiRi: "放大电路的输入级，要求从内阻很大的传感器取信号、尽量不衰减", loRo: "放大电路的输出级，要求带负载能力强（输出电阻小）", hf: "高频宽带放大，要求上限截止频率高、输入端由低内阻源驱动", volt: "中间级，要求有较大的电压放大倍数且对输入、输出电阻没有特殊要求" }[need];
    return {
      prompt: `${text}。应优先选用哪种组态？`,
      choice: {
        wrongTag: "config-compare",
        options: opts,
        answer: ans,
        why: [ans === 0 ? "正确：电压、电流都能放大，最常用于中间级。" : "共射的 $R_i$ 中等、$R_o\\approx R_c$ 较大，不是最佳选择。", ans === 1 ? "正确：共集电路 $R_i$ 大、$R_o$ 小。" : "共集电路没有电压放大作用。", ans === 2 ? "正确：共基电路高频特性好，且其小输入电阻适合低内阻源。" : "共基电路输入电阻很小。"],
      },
      hints: ["回忆三种组态的对照表：$A_u$、$R_i$、$R_o$、频率特性。"],
      solution: `${opts[ans]}。`,
    };
  }),
  concept({
    id: "cb-k-compare",
    level: 3,
    topic: T3,
    title: "三种组态的比较",
    prompt: "从电压放大倍数、电流放大倍数、输入电阻、输出电阻、相位关系五个方面比较三种基本组态。",
    keyPoints: ["共射：$|A_u|$ 大、反相；电流放大 β；$R_i\\approx r_{be}$；$R_o\\approx R_c$", "共集：$A_u\\lesssim1$、同相；电流放大 1+β；$R_i$ 大；$R_o$ 小", "共基：$|A_u|$ 大、同相；电流放大 α<1；$R_i\\approx r_{be}/(1+\\beta)$ 很小；$R_o\\approx R_c$", "共基高频特性最好"],
    reference: "共射：电压、电流都放大，反相，$R_i$、$R_o$ 适中；共集：电压跟随、电流放大，同相，$R_i$ 大、$R_o$ 小；共基：电压放大、电流跟随，同相，$R_i$ 很小、$R_o\\approx R_c$，高频特性好。",
  }),
];

export const CH3_QUESTIONS: QuestionTemplate[] = [...dividerQ, ...ccQ, ...cbQ];
