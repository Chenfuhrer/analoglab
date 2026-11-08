/** 第 8 章题库（原创）：反馈概念、组态判断、负反馈的影响、深度负反馈估算、稳定性 */
import { bandwidthWithFeedback, ceEmitterFeedback, closedLoop, criticalLoopGain, collectorBaseEstimate, currentSeriesOutput, feedbackForGain, feedbackResistances, gainSensitivity, lowCornerWithFeedback, margins, TOPOLOGY_LABEL, type Topology } from "@/simulations/feedback/feedback";
import { analyzeCE } from "@/simulations/bjt/ce";
import { DEFAULT_DIVIDER } from "@/simulations/bjt/types";
import { nonInverting } from "@/simulations/opamp/opamp";
import { formatSI, sig } from "@/simulations/units";
import { e12 } from "../generators";
import { choice, concept, gen, judge, num } from "../helpers";
import type { QuestionTemplate } from "../types";

const R = (x: number) => formatSI(x, "Ω");
const TOPOS: Topology[] = ["voltage-series", "voltage-shunt", "current-series", "current-shunt"];

/* ═════════════ 基本概念 ═════════════ */
const T1 = "fb-concept";
const conceptQ: QuestionTemplate[] = [
  choice({
    id: "fc-c-neg",
    topic: T1,
    title: "负反馈的定义",
    prompt: "负反馈是指：",
    options: ["反馈信号的相位为负", "反馈信号使净输入量减小", "反馈系数为负数", "输出信号减小"],
    answer: 1,
    why: ["与相位的写法无关。", "正确。", "反馈系数的符号取决于参考方向的约定。", "闭环增益虽减小，但定义看的是净输入。"],
    hints: ["比较 $X_i'$ 与 $X_i$。"],
  }),
  choice({
    id: "fc-c-dc",
    topic: T1,
    title: "直流反馈与交流反馈",
    prompt: "分压偏置共射电路中，被旁路电容 $C_e$ 完全旁路的射极电阻 $R_e$ 引入的是：",
    options: ["交流负反馈", "直流负反馈", "交直流负反馈", "正反馈"],
    answer: 1,
    why: ["交流通路中 $R_e$ 被短路。", "正确：只在直流通路中存在，用于稳定 Q 点。", "交流时不存在。", "是负反馈。"],
    hints: ["画交流通路时 $R_e$ 还在吗？"],
  }),
  judge({
    id: "fc-j-af",
    topic: T1,
    title: "深度负反馈的闭环增益",
    prompt: "深度负反馈时，闭环放大倍数近似等于反馈系数的倒数，与基本放大电路的参数几乎无关。",
    answer: true,
    why: "正确：$1+AF\\gg1$ 时 $A_f\\approx1/F$。",
    hints: ["$A_f=A/(1+AF)$，$AF$ 很大时会怎样？"],
  }),
  gen({ id: "fc-g-af", level: 2, topic: T1, title: "闭环增益与反馈深度" }, (g) => {
    const A = g.pick([1e3, 2e3, 5e3, 1e4, 1e5]);
    const F = g.pick([0.001, 0.005, 0.01, 0.02, 0.1]);
    const c = closedLoop(A, F);
    return {
      prompt: `某负反馈放大电路开环放大倍数 $A=${sig(A, 3)}$，反馈系数 $F=${F}$。求反馈深度 $1+AF$ 与闭环放大倍数 $A_f$。`,
      parts: [num("d", "$1+AF$", c.depth, "1", "101"), num("af", "$A_f$", c.Af, "1", "99", { mistakes: [{ value: 1 / F, message: "这是深度负反馈的近似值 $1/F$；本题要求精确值 $A/(1+AF)$。" }, { value: A / (1 - A * F), message: "负反馈的分母是 $1+AF$。" }] })],
      hints: ["$A_f=\\dfrac{A}{1+AF}$。"],
      solution: `$1+AF=${sig(c.depth, 4)}$，$A_f=${sig(c.Af, 4)}$（$1/F=${sig(1 / F, 4)}$）。`,
    };
  }),
  gen({ id: "fc-g-design", level: 2, topic: T1, title: "由要求的闭环增益求反馈系数" }, (g) => {
    const A = g.pick([1e4, 2e4, 5e4, 1e5]);
    const Af = g.pick([10, 20, 50, 100]);
    const F = feedbackForGain(A, Af);
    return {
      prompt: `基本放大电路 $A=${sig(A, 3)}$，要求闭环放大倍数 $A_f=${Af}$。求反馈系数 $F$。`,
      parts: [num("F", "$F$", F, "1", "0.01", { alts: [1 / Af], tol: 0.01 })],
      hints: ["由 $A_f=A/(1+AF)$ 反解：$F=(A/A_f-1)/A$。"],
      solution: `$F=${sig(F, 4)}$（近似为 $1/A_f=${sig(1 / Af, 4)}$）。`,
    };
  }),
  gen({ id: "fc-g-loop", level: 2, topic: T1, title: "由开环、闭环增益求环路增益" }, (g) => {
    const A = g.pick([200, 500, 1000, 5000]);
    const Af = g.pick([10, 20, 50]);
    return {
      prompt: `某放大电路引入负反馈前增益为 ${A}，引入负反馈后为 ${Af}。求反馈深度与环路增益 $AF$。`,
      parts: [num("d", "$1+AF$", A / Af, "1", "50"), num("t", "$AF$", A / Af - 1, "1", "49")],
      hints: ["$1+AF=A/A_f$。"],
      solution: `$1+AF=${sig(A / Af, 4)}$，$AF=${sig(A / Af - 1, 4)}$。`,
    };
  }),
  gen({ id: "fc-g-pos", level: 3, topic: T1, title: "正反馈的增益" }, (g) => {
    const A = g.pick([10, 20, 50]);
    const F = g.pick([0.2, 0.4, 0.6, 0.8]) / A;
    const Af = closedLoop(A, -F).Af;
    return {
      prompt: `基本放大电路 $A=${A}$，引入**正**反馈，反馈系数 $|F|=${F}$（$AF$ 取为 $-${sig(A * F, 3)}$）。求闭环增益。若 $|F|$ 增大到 ${1 / A}，会发生什么？（只求前者）`,
      parts: [num("af", "$A_f$", Af, "1", "20", { mistakes: [{ value: A / (1 + A * F), message: "正反馈时 $1+AF<1$，这里 $AF=-${sig(A * F, 3)}$。" }] })],
      hints: ["正反馈：$|1+AF|<1$，$A_f>A$。"],
      solution: `$A_f=${A}/(1-${sig(A * F, 3)})=${sig(Af, 4)}$；当 $AF=-1$ 时 $A_f\\to\\infty$，电路自激。`,
    };
  }),
  concept({
    id: "fc-k-why",
    level: 3,
    topic: T1,
    title: "为什么要引入负反馈",
    prompt: "负反馈使放大倍数下降，为什么实际放大电路几乎都要引入负反馈？",
    keyPoints: ["增益稳定性提高（1+AF）倍", "频带展宽、非线性失真减小", "可按需要改变输入、输出电阻", "增益损失可以用多级放大弥补，增益“便宜”而稳定性“昂贵”"],
    reference: "负反馈以降低增益为代价，换来增益稳定、频带展宽、失真减小、输入输出电阻可控等一系列性能改善。晶体管和运放的开环增益很容易做得很大，但很难做得稳定，所以用多余的增益换取精确、稳定的闭环性能是划算的。",
  }),
  choice({
    id: "fc-c-loop",
    level: 3,
    topic: T1,
    title: "环路增益",
    prompt: "反馈放大电路中“环路增益”指的是：",
    options: ["$A_f$", "$AF$", "$1+AF$", "$1/F$"],
    answer: 1,
    why: ["那是闭环增益。", "正确：信号从净输入出发，经放大器和反馈网络回到输入端的总增益。", "那是反馈深度。", "那是深度负反馈时的闭环增益。"],
    hints: ["信号绕环路一周经过了哪些环节？"],
  }),
];

/* ═════════════ 组态判断 ═════════════ */
const T2 = "fb-judge";
const judgeQ: QuestionTemplate[] = [
  choice({
    id: "fj-c-voltage",
    topic: T2,
    title: "电压反馈的判断方法",
    prompt: "判断电压反馈还是电流反馈的方法是：",
    options: ["看反馈接在输入端哪一点", "令输出电压为零（输出端短路），看反馈量是否消失", "看输出与输入的相位", "看是否有电容"],
    answer: 1,
    why: ["那是判断串联/并联的方法。", "正确：消失为电压反馈，仍存在为电流反馈。", "那是判断正负反馈的依据之一。", "无关。"],
    hints: ["反馈量取自输出电压还是输出电流？"],
  }),
  choice({
    id: "fj-c-series",
    topic: T2,
    title: "串联反馈的特征",
    prompt: "运放电路中，输入信号接同相端、反馈信号接反相端，该反馈在输入端是：",
    options: ["串联反馈", "并联反馈", "无法判断", "既是串联又是并联"],
    answer: 0,
    why: ["正确：反馈与输入接在不同端，以电压形式比较。", "并联反馈要求接在同一节点。", "可以判断。", "—"],
    hints: ["反馈与输入是否接在同一节点？"],
  }),
  judge({
    id: "fj-j-inv",
    topic: T2,
    title: "反相比例电路的反馈组态",
    prompt: "反相比例运算电路中 $R_f$ 引入的是电压并联负反馈。",
    answer: true,
    why: "正确：输出短路后反馈消失（电压），反馈与输入都接反相端（并联）。",
    hints: ["按两个判断方法逐一检查。"],
    diagram: { id: "inv-amp" },
  }),
  gen({ id: "fj-g-oa", level: 2, topic: T2, title: "判断运放电路的反馈组态" }, (g) => {
    const t = g.pick(TOPOS);
    const id = { "voltage-series": "noninv-amp", "voltage-shunt": "inv-amp", "current-series": "fb-cs-oa", "current-shunt": "fb-csh-oa" }[t];
    return {
      prompt: "判断图示电路中反馈的组态（均为负反馈）：",
      diagram: { id },
      choice: {
        options: TOPOS.map((x) => TOPOLOGY_LABEL[x]),
        answer: TOPOS.indexOf(t),
        why: TOPOS.map((x) => (x === t ? "正确。" : x.startsWith("voltage") !== t.startsWith("voltage") ? "输出端判断错：令 $u_O=0$ 看反馈是否消失。" : "输入端判断错：看反馈与输入是否接在同一节点。")),
      },
      hints: ["令输出电压为零，反馈还在吗？", "反馈信号与输入信号接在同一输入端吗？"],
      solution: `${TOPOLOGY_LABEL[t]}。`,
    };
  }),
  gen({ id: "fj-g-stable", level: 2, topic: T2, title: "各组态稳定什么" }, (g) => {
    const t = g.pick(TOPOS);
    const opts = ["稳定输出电压，输入电阻增大", "稳定输出电压，输入电阻减小", "稳定输出电流，输入电阻增大", "稳定输出电流，输入电阻减小"];
    return {
      prompt: `${TOPOLOGY_LABEL[t]}的作用是：`,
      choice: { options: opts, answer: TOPOS.indexOf(t), why: opts.map((_, i) => (i === TOPOS.indexOf(t) ? "正确。" : "电压反馈稳定输出电压、电流反馈稳定输出电流；串联反馈增大输入电阻、并联反馈减小输入电阻。")) },
      hints: ["输出端的取样方式决定稳定什么；输入端的比较方式决定输入电阻。"],
      solution: opts[TOPOS.indexOf(t)] + "。",
    };
  }),
  gen({ id: "fj-g-discrete", level: 2, topic: T2, title: "判断分立电路的反馈" }, (g) => {
    const k = g.pick([0, 1]);
    if (k === 0) {
      return {
        prompt: "图示共射电路中，跨接在集电极与基极之间的电阻 $R_f$ 引入的是：",
        diagram: { id: "fb-cb" },
        choice: {
          options: TOPOS.map((x) => TOPOLOGY_LABEL[x]),
          answer: 1,
          why: ["输入端：反馈与输入都接基极，是并联。", "正确：输出短路（集电极交流接地）后反馈消失；反馈与输入都接基极。", "输出端：令 $u_o=0$ 后 $R_f$ 下端接地，反馈消失，是电压反馈。", "是电压反馈。"],
        },
        hints: ["瞬时极性：基极 ⊕ → 集电极 ⊖ → 经 $R_f$ 从基极拉走电流。"],
        solution: "电压并联负反馈。",
      };
    }
    return {
      prompt: "分压偏置共射电路中，射极电阻 $R_{e1}$ 未被旁路。它对交流信号引入的是：",
      figure: { params: { ...DEFAULT_DIVIDER, Re1: 300, Re2: 900 }, mode: "full" },
      choice: {
        options: TOPOS.map((x) => TOPOLOGY_LABEL[x]),
        answer: 2,
        why: ["输出端：令 $u_o=0$（集电极交流接地）后 $i_e$ 仍流过 $R_{e1}$，反馈存在，是电流反馈。", "—", "正确：反馈电压 $i_eR_{e1}$ 与输入电压分别作用于基极与射极（串联），取样于输出电流。", "输入加在基极、反馈加在射极，是串联。"],
      },
      hints: ["输出短路后，射极电流还在吗？"],
      solution: "电流串联负反馈。",
    };
  }),
  gen({ id: "fj-g-polarity", level: 3, topic: T2, title: "瞬时极性判断正负反馈" }, (g) => {
    const cases: Array<[string, boolean, string]> = [
      ["运放同相端接输入、反相端经 $R_1$ 接地，输出经 $R_f$ 接到**反相端**", false, "输出 ⊕ 经 $R_f$ 使反相端 ⊕，净输入 $u_+-u_-$ 减小：负反馈。"],
      ["运放反相端接输入（经 $R_1$），输出经 $R_2$ 接到**同相端**，同相端经 $R_3$ 接地", true, "反相端 ⊕ → 输出 ⊖ → 同相端 ⊖ → $u_+-u_-$ 更负，净输入增大：正反馈（滞回比较器）。"],
      ["两级共射放大电路，第二级集电极经电阻接回第一级**基极**", true, "第一级基极 ⊕ → 第一级集电极 ⊖ → 第二级集电极 ⊕ → 反馈到第一级基极 ⊕，增强输入：正反馈。"],
      ["两级共射放大电路，第二级集电极经电阻接回第一级**射极**", false, "第二级集电极 ⊕ → 第一级射极 ⊕，$u_{be1}$ 减小：负反馈。"],
    ];
    const [text, pos, why] = g.pick(cases);
    return {
      prompt: `${text}。该反馈是：`,
      choice: { options: ["正反馈", "负反馈"], answer: pos ? 0 : 1, why: pos ? ["正确：" + why, "按瞬时极性逐级推：" + why] : ["按瞬时极性逐级推：" + why, "正确：" + why] },
      hints: ["设输入 ⊕，沿信号传输方向逐级标极性。", "共射反相、共集同相；运放从同相端到输出同相、从反相端到输出反相。"],
      solution: pos ? "正反馈。" : "负反馈。",
    };
  }),
  gen({ id: "fj-g-dcac", level: 3, topic: T2, title: "直流反馈与交流反馈" }, (g) => {
    const cases: Array<[string, number, string]> = [
      ["反馈支路由一个电阻和一个串联的大电容组成，从输出端接回反相端", 1, "电容隔直：直流通路中反馈支路断开，只有交流反馈。"],
      ["射极电阻两端并联了大电容", 0, "交流时电阻被短路，只有直流反馈。"],
      ["反馈支路是一个纯电阻，从输出直接接回反相端", 2, "直流、交流通路中都存在。"],
      ["射极电阻 $R_{e1}$、$R_{e2}$ 串联，只有 $R_{e2}$ 两端并联大电容", 2, "$R_{e1}$ 交直流都在，$R_{e2}$ 只在直流中——整体既有直流反馈也有交流反馈。"],
    ];
    const [text, ans, why] = g.pick(cases);
    const opts = ["只有直流反馈", "只有交流反馈", "交、直流反馈都有"];
    return {
      prompt: `${text}。该支路引入：`,
      choice: { options: opts, answer: ans, why: opts.map((_, i) => (i === ans ? "正确：" + why : why)) },
      hints: ["分别画直流通路（电容开路）和交流通路（大电容短路）。"],
      solution: opts[ans] + "。",
    };
  }),
  concept({
    id: "fj-k-steps",
    level: 3,
    topic: T2,
    title: "判断反馈组态的步骤",
    prompt: "写出判断一个放大电路中反馈类型的完整步骤。",
    keyPoints: ["找出反馈网络（连接输出回路与输入回路的元件）", "判断直流/交流反馈（看直流、交流通路）", "瞬时极性法判断正/负反馈", "令输出电压为零判断电压/电流反馈", "看反馈与输入是否接在同一节点判断串联/并联"],
    reference: "①找反馈网络；②画直流、交流通路判断直流/交流反馈；③用瞬时极性法判断正/负反馈；④输出端：令 $u_O=0$，反馈消失为电压反馈，否则为电流反馈；⑤输入端：反馈与输入接于同一节点为并联反馈，否则为串联反馈。",
  }),
];

/* ═════════════ 负反馈的影响 ═════════════ */
const T3 = "fb-effects";
const effectsQ: QuestionTemplate[] = [
  choice({
    id: "fe-c-ri",
    topic: T3,
    title: "增大输入电阻",
    prompt: "要提高放大电路的输入电阻并稳定输出电流，应引入：",
    options: ["电压串联负反馈", "电压并联负反馈", "电流串联负反馈", "电流并联负反馈"],
    answer: 2,
    why: ["稳定的是输出电压。", "两项都不对。", "正确：串联 → 输入电阻增大；电流 → 稳定输出电流。", "并联减小输入电阻。"],
    hints: ["“串大并小，压稳压、流稳流”。"],
  }),
  judge({
    id: "fe-j-dist",
    topic: T3,
    title: "负反馈与输入信号的失真",
    prompt: "负反馈能够减小输入信号本身所含的非线性失真。",
    answer: false,
    why: "错误。负反馈只能减小反馈环**内部**（放大器）产生的失真；输入信号本身的失真会被当作“信号”忠实地放大。",
    hints: ["负反馈怎么知道输入信号“本来应该”是什么样？"],
  }),
  choice({
    id: "fe-c-gbw",
    topic: T3,
    title: "增益带宽积",
    prompt: "单极点放大电路引入负反馈后：",
    options: ["增益和带宽都增大", "增益下降、带宽展宽，二者乘积基本不变", "增益不变、带宽展宽", "增益下降、带宽变窄"],
    answer: 1,
    why: ["—", "正确：$A_{mf}=A_m/(1+A_mF)$，$f_{Hf}=(1+A_mF)f_H$。", "增益下降。", "带宽展宽。"],
    hints: ["写出 $A_{mf}$ 与 $f_{Hf}$。"],
  }),
  gen({ id: "fe-g-sens", level: 2, topic: T3, title: "增益稳定性" }, (g) => {
    const A = g.pick([1e3, 5e3, 1e4]);
    const F = g.pick([0.01, 0.02, 0.05]);
    const d = g.pick([0.1, 0.2, -0.2, 0.3]);
    const s = gainSensitivity(A, F, d);
    return {
      prompt: `负反馈放大电路 $A=${sig(A, 3)}$、$F=${F}$。若由于温度变化 $A$ 变化了 ${d > 0 ? "+" : ""}${d * 100}%，闭环增益变化了多少（百分数，精确计算）？`,
      parts: [num("r", "$\\Delta A_f/A_f$", s.rel, "1", "0.2%", { tol: 0.03, mistakes: [{ value: d, message: "闭环增益的变化被缩小为原来的 $1/(1+AF)$。" }] })],
      hints: ["分别算出变化前后的 $A_f$。", "近似：$\\frac{\\mathrm dA_f}{A_f}=\\frac{1}{1+AF}\\cdot\\frac{\\mathrm dA}{A}$。"],
      solution: `$A_f$ 从 ${sig(s.before, 5)} 变为 ${sig(s.after, 5)}，变化 ${sig(s.rel * 100, 3)}%。`,
    };
  }),
  gen({ id: "fe-g-bw", level: 2, topic: T3, title: "带宽展宽" }, (g) => {
    const Am = g.pick([1e3, 1e4, 1e5]);
    const fH = g.pick([10, 100, 1e3, 1e4]);
    const F = g.pick([0.001, 0.01, 0.1]);
    const b = bandwidthWithFeedback(Am, fH, F);
    return {
      prompt: `单极点放大电路中频增益 $A_m=${sig(Am, 3)}$，上限截止频率 $f_H=${formatSI(fH, "Hz")}$。引入 $F=${F}$ 的负反馈后，求中频增益与上限截止频率。`,
      parts: [num("a", "$A_{mf}$", b.Amf, "1", "99"), num("f", "$f_{Hf}$", b.fHf, "Hz", "kHz")],
      hints: ["$A_{mf}=\\frac{A_m}{1+A_mF}$，$f_{Hf}=(1+A_mF)f_H$。"],
      solution: `$A_{mf}=${sig(b.Amf, 4)}$，$f_{Hf}=${formatSI(b.fHf, "Hz")}$。`,
    };
  }),
  gen({ id: "fe-g-rio", level: 2, topic: T3, title: "反馈后的输入、输出电阻" }, (g) => {
    const t = g.pick(TOPOS);
    const Ri = e12(g.range(1e3, 50e3));
    const Ro = e12(g.range(100, 5e3));
    const depth = g.pick([11, 21, 51, 101]);
    const r = feedbackResistances(t, Ri, Ro, depth);
    return {
      prompt: `基本放大电路 $R_i=${R(Ri)}$、$R_o=${R(Ro)}$，引入${TOPOLOGY_LABEL[t]}，反馈深度为 ${depth}（输出电阻计算时取同一深度）。求 $R_{if}$ 与 $R_{of}$。`,
      parts: [num("ri", "$R_{if}$", r.Rif, "Ω", "kΩ"), num("ro", "$R_{of}$", r.Rof, "Ω", "Ω")],
      hints: ["串联 ×(1+AF)，并联 ÷(1+AF)；电压反馈 $R_o$ ÷(1+AF)，电流反馈 ×(1+AF)。"],
      solution: `$R_{if}=${R(r.Rif)}$，$R_{of}=${R(r.Rof)}$。`,
    };
  }),
  gen({ id: "fe-g-need", level: 3, topic: T3, title: "按要求选择反馈" }, (g) => {
    const cases: Array<[string, number]> = [
      ["信号源是内阻很小的电压源，希望负载变化时输出电压稳定", 0],
      ["信号源是光电二极管（相当于电流源），希望输出电压稳定（电流–电压转换）", 1],
      ["用电压信号控制流过负载的电流（压控电流源），负载电阻会变化", 2],
      ["信号源为电流源，要求输出电流稳定（电流放大）", 3],
    ];
    const [text, ans] = g.pick(cases);
    return {
      prompt: `${text}。应引入哪种负反馈？`,
      choice: { options: TOPOS.map((x) => TOPOLOGY_LABEL[x]), answer: ans, why: TOPOS.map((x, i) => (i === ans ? "正确。" : "电压源信号用串联、电流源信号用并联；稳电压用电压反馈、稳电流用电流反馈。")) },
      hints: ["输入端看信号源类型，输出端看要稳定的量。"],
      solution: TOPOLOGY_LABEL[TOPOS[ans]] + "。",
    };
  }),
  gen({ id: "fe-g-fl", level: 3, topic: T3, title: "下限截止频率的变化" }, (g) => {
    const Am = g.pick([100, 500, 1000]);
    const fL = g.pick([20, 50, 100]);
    const F = g.pick([0.01, 0.05, 0.1]);
    const d = closedLoop(Am, F).depth;
    const fLf = lowCornerWithFeedback(Am, fL, F);
    return {
      prompt: `放大电路中频增益 ${Am}，下限截止频率 ${fL} Hz（单极点高通）。引入反馈系数 ${F} 的负反馈后，下限截止频率变为多少？`,
      parts: [num("f", "$f_{Lf}$", fLf, "Hz", "Hz", { mistakes: [{ value: fL * d, message: "负反馈使下限频率**降低**：$f_{Lf}=f_L/(1+A_mF)$。" }] })],
      hints: ["低频段同样有增益下降被反馈补偿的效果。"],
      solution: `$f_{Lf}=${fL}/${sig(d, 3)}=${formatSI(fLf, "Hz")}$。`,
    };
  }),
  concept({
    id: "fe-k-dist",
    level: 3,
    topic: T3,
    title: "负反馈为什么能减小失真",
    prompt: "用“预失真”的思想解释负反馈减小非线性失真的原理，并说明它的局限。",
    keyPoints: ["放大器使输出波形失真（如正半周偏大）", "反馈信号也带有同样的失真", "净输入 = 输入 − 反馈，变成反向的“预失真”波形", "预失真经放大器后与其失真部分抵消", "只对环内产生的失真有效，且需要放大器仍未饱和"],
    reference: "失真的输出经反馈网络送回输入端，与输入信号相减后，净输入信号含有与失真方向相反的成分（预失真），经过放大器的非线性后两者部分抵消，输出更接近正弦。失真约减小为原来的 $1/(1+AF)$。它不能改善输入信号本身的失真，也无法挽救放大器已进入饱和（削波）的情况。",
  }),
];

/* ═════════════ 深度负反馈估算 ═════════════ */
const T4 = "fb-deep";
const deepQ: QuestionTemplate[] = [
  choice({
    id: "fd-c-cond",
    topic: T4,
    title: "深度负反馈的条件",
    prompt: "“深度负反馈”是指：",
    options: ["$AF\\ll1$", "$|1+AF|\\gg1$", "$F=1$", "$A\\to0$"],
    answer: 1,
    why: ["那时反馈几乎不起作用。", "正确。", "电压跟随器是 F=1，但深度取决于 AF。", "—"],
    hints: ["反馈深度是哪个量？"],
  }),
  judge({
    id: "fd-j-shunt",
    topic: T4,
    title: "并联反馈与信号源内阻",
    prompt: "电压并联负反馈电路接理想电压源（内阻为零）时，反馈仍能起作用。",
    answer: false,
    why: "错误。并联反馈靠反馈电流在信号源内阻上产生压降来改变净输入；信号源内阻为零时输入端电压被固定，反馈不起作用。所以并联反馈适合电流源（高内阻）信号源，估算时用源电压增益。",
    hints: ["净输入电流 = 信号源电流 − 反馈电流，信号源电流由什么决定？"],
  }),
  choice({
    id: "fd-c-est",
    topic: T4,
    title: "深度负反馈下的估算依据",
    prompt: "深度电压串联负反馈电路估算电压增益的依据是：",
    options: ["$i_F\\approx i_I$", "$u_F\\approx u_I$", "$u_O\\approx u_I$", "$i_O\\approx i_I$"],
    answer: 1,
    why: ["那是并联反馈的依据。", "正确：净输入电压近似为零。", "只有 F=1 时才成立。", "—"],
    hints: ["串联反馈比较的是电压还是电流？"],
  }),
  gen({ id: "fd-g-noninv", level: 2, topic: T4, title: "电压串联负反馈的估算" }, (g) => {
    const R1 = e12(g.range(1e3, 10e3));
    const Rf = e12(R1 * g.range(5, 50));
    const r = nonInverting(R1, Rf);
    return {
      prompt: `运放构成的电压串联负反馈电路（同相比例），$R_1=${R(R1)}$、$R_f=${R(Rf)}$。求反馈系数 $F_{uu}$ 与深度负反馈下的 $A_{uf}$。`,
      diagram: { id: "noninv-amp", labels: { R1: R(R1), Rf: R(Rf) } },
      parts: [num("F", "$F_{uu}$", 1 / r.ideal, "1", "0.1"), num("A", "$A_{uf}$", r.ideal, "1", "10")],
      hints: ["$F_{uu}=u_F/u_O=R_1/(R_1+R_f)$。", "$A_{uf}\\approx1/F_{uu}$。"],
      solution: `$F_{uu}=${sig(1 / r.ideal, 4)}$，$A_{uf}=${sig(r.ideal, 4)}$。`,
    };
  }),
  gen({ id: "fd-g-ce", level: 2, topic: T4, title: "射极电阻反馈的估算" }, (g) => {
    const Re1 = g.pick([200, 300, 470, 680, 1000]);
    const p = { ...DEFAULT_DIVIDER, Re1, Re2: Math.max(100, 1200 - Re1), beta: g.pick([60, 100, 150]), RL: e12(g.range(2e3, 10e3)) };
    const a = analyzeCE(p);
    const fe = ceEmitterFeedback(p.beta, a.ac.rbe, Re1, a.ac.RLp);
    return {
      prompt: `共射电路未旁路射极电阻 $R_{e1}=${R(Re1)}$，$R_c=${R(p.Rc)}$，$R_L=${R(p.RL)}$。按深度负反馈估算 $\\dot A_{uf}$；已知精确值为 ${sig(a.ac.Au, 4)}，估算误差多大？`,
      parts: [num("est", "估算 $\\dot A_{uf}$", fe.estimate, "1", "−5", { signMessage: "共射反相。" }), num("err", "相对误差", (fe.estimate - a.ac.Au) / a.ac.Au, "1", "5%", { tol: 0.05 })],
      hints: ["$u_I\\approx u_F=i_eR_{e1}$，$u_O=-i_cR_L'$，$i_c\\approx i_e$。"],
      solution: `$\\dot A_{uf}\\approx-R_L'/R_{e1}=${sig(fe.estimate, 4)}$，误差 ${sig(((fe.estimate - a.ac.Au) / a.ac.Au) * 100, 3)}%（反馈深度约 ${sig(fe.depth, 3)}）。`,
    };
  }),
  gen({ id: "fd-g-cb", level: 2, topic: T4, title: "电压并联负反馈的估算" }, (g) => {
    const Rs = e12(g.range(1e3, 10e3));
    const Rf = e12(Rs * g.range(5, 50));
    const est = collectorBaseEstimate(Rf, Rs);
    return {
      prompt: `图示集电极–基极反馈电路，$R_s=${R(Rs)}$、$R_f=${R(Rf)}$，满足深度负反馈条件。估算源电压放大倍数 $\\dot A_{usf}=\\dot U_o/\\dot U_s$。`,
      diagram: { id: "fb-cb", labels: { Rs: R(Rs), Rf: R(Rf) } },
      parts: [num("a", "$\\dot A_{usf}$", est, "1", "−10", { signMessage: "输入加在基极、从集电极输出，反相。" })],
      hints: ["净输入电流 $i_B\\approx0$，基极交流电位约为 0（虚地）。", "$\\frac{u_s}{R_s}\\approx\\frac{0-u_o}{R_f}$。"],
      solution: `$\\dot A_{usf}\\approx-R_f/R_s=${sig(est, 4)}$。`,
    };
  }),
  gen({ id: "fd-g-cs", level: 3, topic: T4, title: "电流串联负反馈：压控电流源" }, (g) => {
    const Rr = e12(g.range(100, 2e3));
    const ui = g.pick([0.1, 0.5, 1, 2]);
    const RL = e12(g.range(500, 5e3));
    return {
      prompt: `图示电流串联负反馈电路（运放理想）中，$R=${R(Rr)}$，负载 $R_L=${R(RL)}$。输入 $u_I=${ui}$ V，求负载电流 $i_O$；若 $R_L$ 换成 ${R(RL * 2)}（运放不饱和），$i_O$ 变为多少？`,
      diagram: { id: "fb-cs-oa", labels: { R: R(Rr), RL: R(RL) } },
      parts: [num("i1", "$i_O$", currentSeriesOutput(ui, Rr), "A", "mA"), num("i2", "换负载后 $i_O$", currentSeriesOutput(ui, Rr), "A", "mA", { mistakes: [{ value: currentSeriesOutput(ui, Rr) / 2, message: "电流反馈稳定输出电流：$i_O=u_I/R$ 与 $R_L$ 无关。" }] })],
      hints: ["虚短：反相端电压 = $u_I$；虚断：$R_L$ 中的电流全部流过 $R$。"],
      solution: `$i_O=u_I/R=${formatSI(currentSeriesOutput(ui, Rr), "A")}$，与负载无关。`,
    };
  }),
  gen({ id: "fd-g-depth", level: 3, topic: T4, title: "估算误差与反馈深度" }, (g) => {
    const AF = g.pick([5, 10, 20, 100]);
    const A = g.pick([1e3, 1e4]);
    const F = AF / A;
    const exact = closedLoop(A, F).Af;
    return {
      prompt: `负反馈放大电路环路增益 $AF=${AF}$，$F=${sig(F, 3)}$。用 $A_f\\approx1/F$ 估算的相对误差是多少？`,
      parts: [num("e", "相对误差", 1 / F / exact - 1, "1", "10%", { tol: 0.02 })],
      hints: ["精确：$A_f=\\frac{A}{1+AF}$；估算/精确 $=\\frac{1+AF}{AF}$。"],
      solution: `估算偏大 $1/(AF)=${sig((1 / AF) * 100, 3)}\\%$。`,
    };
  }),
  concept({
    id: "fd-k-unify",
    level: 3,
    topic: T4,
    title: "深度负反馈与虚短虚断",
    prompt: "说明深度负反馈的“$X_f\\approx X_i$”与理想运放的“虚短、虚断”之间的关系。",
    keyPoints: ["深度负反馈：净输入 X_i' ≈ 0", "串联反馈净输入为电压 → 虚短", "并联反馈净输入为电流 → 虚断（净输入电流 ≈ 0）", "理想运放线性应用正是深度负反馈的特例；该方法也适用于分立元件电路"],
    reference: "深度负反馈时净输入量 $X_i'=X_i/(1+AF)\\approx0$。串联反馈中净输入是电压，所以输入端两点间电压近似为零（虚短）；并联反馈中净输入是电流，所以流入放大电路的电流近似为零（虚断）。理想运放电路的分析方法是它的特例，同样可推广到分立元件反馈电路的估算。",
  }),
];

/* ═════════════ 稳定性 ═════════════ */
const T5 = "fb-stability";
const stabQ: QuestionTemplate[] = [
  choice({
    id: "fst-c-cond",
    topic: T5,
    title: "自激振荡的条件",
    prompt: "负反馈放大电路产生自激振荡的条件是：",
    options: ["$\\dot A\\dot F=1$", "$\\dot A\\dot F=-1$", "$|\\dot A\\dot F|<1$", "$\\dot A=0$"],
    answer: 1,
    why: ["这是正弦波振荡器（正反馈）的平衡条件写法。", "正确：$1+\\dot A\\dot F=0$。", "此时稳定。", "—"],
    hints: ["$\\dot A_f=\\dot A/(1+\\dot A\\dot F)$ 何时趋于无穷？"],
  }),
  judge({
    id: "fst-j-poles",
    topic: T5,
    title: "两极点放大器",
    prompt: "只有两个极点的放大电路，无论反馈多深都不会自激振荡。",
    answer: true,
    why: "正确（理想情况）。两个极点的最大附加相移只趋近 −180°，不会在有限频率达到 −180°；但相位裕度可能很小，响应会严重振铃。",
    hints: ["每个极点最多产生多少附加相移？"],
  }),
  choice({
    id: "fst-c-comp",
    topic: T5,
    title: "主极点补偿",
    prompt: "主极点（滞后）补偿消除自激的代价是：",
    options: ["增益下降", "带宽变窄", "输入电阻下降", "功耗增大"],
    answer: 1,
    why: ["中频增益不变。", "正确：把最低极点频率压得更低。", "无关。", "无关。"],
    hints: ["补偿把哪个极点移到了哪里？"],
  }),
  gen({ id: "fst-g-pm", level: 2, topic: T5, title: "求相位裕度" }, (g) => {
    const T0 = g.pick([2, 5, 10, 20]);
    const poles = [g.pick([1e3, 1e4]), g.pick([1e5, 3e5]), g.pick([1e6, 3e6])];
    const m = margins({ T0, poles });
    return {
      prompt: `负反馈放大电路的环路增益 $\\dot A\\dot F=\\dfrac{${T0}}{(1+jf/f_1)(1+jf/f_2)(1+jf/f_3)}$，$f_1=${formatSI(poles[0], "Hz")}$、$f_2=${formatSI(poles[1], "Hz")}$、$f_3=${formatSI(poles[2], "Hz")}$。求增益交越频率与相位裕度。`,
      parts: [num("fc", "交越频率 $f_c$", m.fc, "Hz", "kHz", { tol: 0.05 }), num("pm", "相位裕度（°）", m.PM, "1", "60", { tol: 0.04 })],
      hints: ["先求 $|\\dot A\\dot F|=1$ 的频率（可只考虑第一个极点估算再修正）。", "$\\varphi_m=180°-\\sum\\arctan(f_c/f_k)$。"],
      solution: `$f_c\\approx${formatSI(m.fc, "Hz")}$，相位裕度 ≈ ${sig(m.PM, 3)}°，${m.stable ? "稳定" : "不稳定"}。`,
    };
  }),
  gen({ id: "fst-g-judge", level: 2, topic: T5, title: "判断是否自激" }, (g) => {
    const T0 = g.pick([1, 3, 10, 30, 100, 1000]);
    const poles = [1e3, 1e4, 1e5];
    const m = margins({ T0, poles });
    return {
      prompt: `放大器的三个极点为 1 kHz、10 kHz、100 kHz，引入负反馈后低频环路增益 $AF=${T0}$。该电路是否稳定？`,
      choice: { options: ["稳定", "会自激振荡"], answer: m.stable ? 0 : 1, why: m.stable ? ["正确：相位裕度约 " + sig(m.PM, 3) + "°。", "$|AF|$ 降到 1 时相位尚未到 −180°。"] : ["相位到 −180° 时 $|AF|$ 仍大于 1。", "正确：相位裕度为负（约 " + sig(m.PM, 3) + "°）。"] },
      hints: ["相位为 −180° 的频率约为 $\\sqrt{f_2f_3}$ 附近；比较该处的 $|AF|$ 与 1。"],
      solution: m.stable ? `稳定，相位裕度约 ${sig(m.PM, 3)}°。` : `不稳定，相位裕度约 ${sig(m.PM, 3)}°。`,
    };
  }),
  gen({ id: "fst-g-gm", level: 2, topic: T5, title: "求增益裕度" }, (g) => {
    const T0 = g.pick([1, 2, 5, 10]);
    const poles = [1e3, g.pick([1e4, 2e4]), g.pick([1e5, 2e5])];
    const m = margins({ T0, poles });
    const c = criticalLoopGain(poles);
    return {
      prompt: `环路增益 $\\dot A\\dot F=\\dfrac{${T0}}{(1+jf/f_1)(1+jf/f_2)(1+jf/f_3)}$，$f_1=1$ kHz、$f_2=${formatSI(poles[1], "Hz")}$、$f_3=${formatSI(poles[2], "Hz")}$。求相位为 −180° 的频率 $f_{180}$ 与增益裕度（dB，用正数表示距 0 dB 的余量）。`,
      parts: [num("f", "$f_{180}$", c.f180, "Hz", "kHz", { tol: 0.03 }), num("gm", "增益裕度（dB）", m.GM, "1", "20", { tol: 0.04 })],
      hints: ["解 $\\sum\\arctan(f/f_k)=180°$。", "增益裕度 $=-20\\lg|\\dot A\\dot F(f_{180})|$。"],
      solution: `$f_{180}\\approx${formatSI(c.f180, "Hz")}$，增益裕度约 ${sig(m.GM, 3)} dB。`,
    };
  }),
  gen({ id: "fst-g-maxF", level: 3, topic: T5, title: "保证稳定的最大环路增益" }, (g) => {
    const p = [g.pick([1e3, 2e3]), g.pick([1e4, 2e4]), g.pick([1e5, 2e5])];
    const lo = criticalLoopGain(p).T0;
    return {
      prompt: `三极点放大器（$f_1=${formatSI(p[0], "Hz")}$、$f_2=${formatSI(p[1], "Hz")}$、$f_3=${formatSI(p[2], "Hz")}$）引入频率无关的电阻反馈。低频环路增益 $AF$ 最大为多少时电路仍不自激（临界值，精确到 5%）？`,
      parts: [num("t", "$AF_{\\max}$", lo, "1", "120", { tol: 0.05 })],
      hints: ["先求相位为 −180° 的频率 $f_{180}$。", "临界条件：$|AF(f_{180})|=1$，即 $AF_{\\max}=\\prod\\sqrt{1+(f_{180}/f_k)^2}$。"],
      solution: `$AF_{\\max}\\approx${sig(lo, 3)}$。`,
    };
  }),
  gen({ id: "fst-g-comp", level: 3, topic: T5, title: "主极点补偿后的相位裕度" }, (g) => {
    const T0 = g.pick([100, 1000]);
    const f1 = g.pick([1, 5, 10]);
    const m = margins({ T0, poles: [f1, 1e5, 1e6] });
    return {
      prompt: `把三极点放大器（原极点 10 kHz、100 kHz、1 MHz）的第一个极点补偿到 ${f1} Hz（其余不变），低频环路增益 $AF=${T0}$。求补偿后的交越频率与相位裕度。`,
      parts: [num("fc", "$f_c$", m.fc, "Hz", "kHz", { tol: 0.05 }), num("pm", "相位裕度（°）", m.PM, "1", "80", { tol: 0.04 })],
      hints: ["交越频率约为 $AF\\cdot f_1$（主极点之后以 −20 dB/十倍频下降）。", "相位 ≈ $-90°-\\arctan(f_c/f_2)-\\arctan(f_c/f_3)$。"],
      solution: `$f_c\\approx${formatSI(m.fc, "Hz")}$，相位裕度 ≈ ${sig(m.PM, 3)}°。`,
    };
  }),
  concept({
    id: "fst-k-why",
    level: 3,
    topic: T5,
    title: "为什么负反馈会变成正反馈",
    prompt: "解释负反馈放大电路在高频时为什么可能变成正反馈并产生自激，并说明工程上的稳定性要求。",
    keyPoints: ["每个极点产生最多 −90° 的附加相移", "三个以上极点时附加相移可达 −180°", "此时反馈信号与输入同相，负反馈变为正反馈", "若此频率下 |AF| ≥ 1 则自激", "要求相位裕度 ≥ 45°、增益裕度 ≤ −10 dB"],
    reference: "放大电路的耦合电容和结电容在高频（或低频）会产生附加相移，多级放大器的附加相移可超过 180°。在附加相移等于 −180° 的频率上，原来的负反馈变成正反馈，若此时环路增益幅值仍不小于 1，就满足 $\\dot A\\dot F=-1$，产生自激。工程上一般要求相位裕度不小于 45°，增益裕度不大于 −10 dB。",
  }),
];

export const CH8_QUESTIONS: QuestionTemplate[] = [...conceptQ, ...judgeQ, ...effectsQ, ...deepQ, ...stabQ];
