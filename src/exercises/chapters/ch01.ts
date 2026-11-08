/**
 * 第 1 章题库（原创）：本征/杂质半导体、PN 结、二极管、稳压管、整流限幅钳位。
 */
import { carriers, builtInPotential, depletionWidth, intrinsicDensity, MATERIAL, temperatureForNi, thermalVoltage } from "@/simulations/semi/carriers";
import { diodeGate, dynamicResistance, shockley, shockleyVoltage, solveSeries } from "@/simulations/diode/diode";
import { limitResistorRange, solveZenerRegulator, type ZenerSpec } from "@/simulations/diode/zener";
import { clampSteadyState, clip, rectifiedAverage, rectifiedAverageNumeric, rectifierStress } from "@/simulations/diode/waveforms";
import { formatSI, sig } from "@/simulations/units";
import { e12 } from "../generators";
import { choice, concept, gen, judge, num } from "../helpers";
import type { QuestionTemplate } from "../types";

const sci = (x: number) => {
  const e = Math.floor(Math.log10(x));
  return `${sig(x / Math.pow(10, e), 3)}\\times10^{${e}}`;
};
const V = (x: number) => formatSI(x, "V");
const A = (x: number) => formatSI(x, "A");
const R = (x: number) => formatSI(x, "Ω");

/* ═════════════ 本征半导体 ═════════════ */
const T1 = "semi-carriers";
const carriersQ: QuestionTemplate[] = [
  choice({
    id: "sc-c-hole",
    topic: T1,
    title: "空穴导电的本质",
    prompt: "关于本征半导体中的空穴，下列说法正确的是：",
    options: ["空穴是带正电的独立粒子，与电子一样在晶格中自由飞行", "空穴导电实质上是价电子依次填补空位的运动，等效为正电荷的移动", "空穴只存在于 P 型半导体中", "空穴的移动方向与价电子的移动方向相同"],
    answer: 1,
    why: ["空穴不是独立粒子，而是“缺一个价电子”的状态。", "正确：价电子向一个方向依次填补空位，空位就向相反方向移动，等效为正电荷移动。", "本征半导体中电子、空穴成对存在；N 型中空穴是少子，也存在。", "方向相反：价电子向左填补，空穴就向右移动。"],
    hints: ["观察“空穴移动”交互：每一步移动的是谁？"],
  }),
  judge({
    id: "sc-j-equal",
    topic: T1,
    title: "本征半导体中两种载流子的浓度",
    prompt: "本征半导体中自由电子浓度与空穴浓度相等，且都随温度升高而增大。",
    answer: true,
    why: "正确。本征激发使电子、空穴成对产生，所以 $n=p=n_i$；$n_i\\propto T^{3/2}e^{-E_g/(2kT)}$ 随温度升高而增大。",
    hints: ["电子与空穴是怎样产生的？"],
  }),
  choice({
    id: "sc-c-temp",
    topic: T1,
    title: "半导体为什么怕热",
    prompt: "半导体的导电能力随温度升高而显著增强，主要原因是：",
    options: ["晶格振动加剧，电子运动更快", "本征激发产生的电子–空穴对数目随温度按指数规律增加", "杂质原子数目增加", "禁带宽度随温度升高而成倍增大"],
    answer: 1,
    why: ["晶格振动加剧反而使迁移率下降（金属电阻随温度升高也是这个原因）。", "正确：载流子数目按 $e^{-E_g/(2kT)}$ 变化，远比迁移率的变化剧烈。", "杂质数目由制造决定，不随温度变化。", "禁带宽度随温度略有减小，且变化很小。"],
    hints: ["导电能力 ∝ 载流子数目 × 迁移率。哪个因素随温度变化更剧烈？"],
  }),
  gen({ id: "sc-g-ratio", level: 2, topic: T1, title: "温度升高后本征载流子浓度的变化" }, (g) => {
    const m = g.pick(["Si", "Ge"] as const);
    const Ta = g.pick([280, 290, 300, 310]);
    const Tb = Ta + g.pick([10, 20, 30, 50]);
    const k = intrinsicDensity(Tb, m) / intrinsicDensity(Ta, m);
    const Eg = MATERIAL[m].Eg;
    return {
      prompt: `${MATERIAL[m].name}的禁带宽度 $E_g=${Eg}$ eV。按 $n_i=BT^{3/2}e^{-E_g/(2kT)}$（$k=8.62\\times10^{-5}$ eV/K，忽略 $E_g$ 随温度的变化），温度从 ${Ta} K 升高到 ${Tb} K 时，$n_i$ 变为原来的多少倍？`,
      parts: [num("k", "$n_i(T_2)/n_i(T_1)$", k, "1", "3.5", { mistakes: [{ value: Math.exp((Eg / (2 * 8.617e-5)) * (1 / Ta - 1 / Tb)), message: "漏掉了 $T^{3/2}$ 因子：两个温度之比的 1.5 次方也要乘上。" }, { value: Math.exp((Eg / 8.617e-5) * (1 / Ta - 1 / Tb)) * Math.pow(Tb / Ta, 1.5), message: "指数里应为 $E_g/(2kT)$，你可能漏掉了因子 2。" }] })],
      hints: ["写出 $n_i(T_2)/n_i(T_1)$，常数 $B$ 消去。", "$\\dfrac{n_i(T_2)}{n_i(T_1)}=\\left(\\dfrac{T_2}{T_1}\\right)^{3/2}\\exp\\!\\left[\\dfrac{E_g}{2k}\\left(\\dfrac1{T_1}-\\dfrac1{T_2}\\right)\\right]$"],
      solution: `约 ${sig(k, 3)} 倍。`,
    };
  }),
  gen({ id: "sc-g-ut", level: 2, topic: T1, title: "温度电压当量" }, (g) => {
    const tc = g.pick([-40, -20, 0, 25, 50, 75, 100, 125]);
    const T = tc + 273.15;
    return {
      prompt: `求温度为 ${tc} °C 时的温度电压当量 $U_T=kT/q$（$k/q=8.62\\times10^{-5}$ V/K）。`,
      parts: [num("UT", "$U_T$", thermalVoltage(T), "V", "mV", { mistakes: [{ value: thermalVoltage(tc), message: "温度要用热力学温度（K）：$T=t+273.15$。" }] })],
      hints: ["$U_T=\\dfrac{k}{q}T$，$T$ 用开尔文。"],
      solution: `$U_T=8.62\\times10^{-5}\\times${sig(T, 5)}\\approx${V(thermalVoltage(T))}$。`,
    };
  }),
  gen({ id: "sc-g-ge-si", level: 2, topic: T1, title: "锗与硅的本征载流子浓度之比" }, (g) => {
    const T = g.pick([250, 275, 300, 325, 350]);
    const k = intrinsicDensity(T, "Ge") / intrinsicDensity(T, "Si");
    return {
      prompt: `已知 300 K 时 $n_{i,\\mathrm{Si}}=1.4\\times10^{10}$ cm⁻³、$n_{i,\\mathrm{Ge}}=2.4\\times10^{13}$ cm⁻³，$E_{g,\\mathrm{Si}}=1.12$ eV、$E_{g,\\mathrm{Ge}}=0.66$ eV。求 ${T} K 时锗与硅的本征载流子浓度之比（用 $n_i\\propto T^{3/2}e^{-E_g/(2kT)}$）。`,
      parts: [num("k", "$n_{i,\\mathrm{Ge}}/n_{i,\\mathrm{Si}}$", k, "1", "1700", { tol: 0.04 })],
      hints: ["比值中 $T^{3/2}$ 相消。", "$\\dfrac{n_{i,\\mathrm{Ge}}(T)}{n_{i,\\mathrm{Si}}(T)}=\\dfrac{2.4\\times10^{13}}{1.4\\times10^{10}}\\exp\\!\\left[\\dfrac{E_{g,\\mathrm{Si}}-E_{g,\\mathrm{Ge}}}{2k}\\left(\\dfrac1T-\\dfrac1{300}\\right)\\right]$"],
      solution: `约 ${sig(k, 3)}。禁带越窄，本征激发越容易，这也是锗管温度稳定性差的原因。`,
    };
  }),
  gen({ id: "sc-g-tni", level: 3, topic: T1, title: "多高温度时 n_i 达到给定值" }, (g) => {
    const m = g.pick(["Si", "Ge"] as const);
    const target = m === "Si" ? g.pick([1e12, 1e13, 1e14, 1e15]) : g.pick([1e14, 1e15, 1e16]);
    const T = temperatureForNi(target, m);
    return {
      prompt: `${MATERIAL[m].name}（300 K 时 $n_i=${sci(MATERIAL[m].ni300)}$ cm⁻³，$E_g=${MATERIAL[m].Eg}$ eV）。温度升高到多少开尔文时，本征载流子浓度达到 $${sci(target)}$ cm⁻³？（用 $n_i\\propto T^{3/2}e^{-E_g/(2kT)}$，答案精确到 1%。）`,
      parts: [num("T", "$T$（填数值，单位 K）", T, "1", "450", { tol: 0.01 })],
      hints: ["先忽略 $T^{3/2}$ 因子，由指数项估算一个初值。", "再代回包含 $T^{3/2}$ 的完整式子迭代一两次即可。"],
      solution: `约 ${sig(T, 4)} K。`,
    };
  }),
  concept({
    id: "sc-k-device",
    level: 3,
    topic: T1,
    title: "为什么不直接用本征半导体做器件",
    prompt: "说明为什么不直接用本征半导体制造二极管、晶体管等器件。",
    keyPoints: ["室温下 $n_i$ 很小，导电能力弱", "载流子浓度随温度指数变化，性能极不稳定", "两种载流子浓度相等，无法人为控制导电类型", "掺杂可以精确控制多子浓度，并形成 PN 结"],
    reference: "本征半导体载流子太少且完全由温度决定，导电能力弱、对温度极敏感，也无法区分导电类型；掺杂后多子浓度由杂质浓度精确控制，并可在同一块晶体中制造 P 区和 N 区形成 PN 结。",
  }),
  gen({ id: "sc-g-frac", level: 3, topic: T1, title: "被激发的原子比例" }, (g) => {
    const T = g.pick([300, 350, 400]);
    const ni = intrinsicDensity(T, "Si");
    const f = ni / MATERIAL.Si.atoms;
    return {
      prompt: `硅原子密度约 $5\\times10^{22}$ cm⁻³，${T} K 时 $n_i=${sci(ni)}$ cm⁻³。平均每多少个硅原子中有一个价电子被激发成自由电子？（答案取 $N/n_i$ 的数量级即可，精确到 5%）`,
      parts: [num("N", "$N/n_i$", 1 / f, "1", "3.6e12", { tol: 0.05, mistakes: [{ value: f, message: "这是比例 $n_i/N$，题目问的是它的倒数。" }] })],
      hints: ["每个原子最多贡献一个电子–空穴对，所以比例就是 $n_i/N$。"],
      solution: `约 $${sci(1 / f)}$ 个原子中才有一个。`,
    };
  }),
];

/* ═════════════ 杂质半导体 ═════════════ */
const T2 = "semi-doped";
const dopedQ: QuestionTemplate[] = [
  choice({
    id: "sd-c-major",
    topic: T2,
    title: "N 型半导体的多子",
    prompt: "在本征硅中掺入少量五价元素磷，得到的半导体中：",
    options: ["多子是空穴，少子是电子", "多子是电子，少子是空穴", "只有电子，没有空穴", "电子与空穴浓度相等"],
    answer: 1,
    why: ["这是 P 型（掺三价元素）。", "正确：施主杂质提供大量电子；本征激发仍产生少量空穴。", "本征激发仍然存在，空穴作为少子存在。", "那是本征半导体。"],
    hints: ["五价原子与 4 个硅原子组成共价键后，多出了什么？"],
  }),
  judge({
    id: "sd-j-charge",
    topic: T2,
    title: "N 型半导体是否带负电",
    prompt: "N 型半导体的多子是电子，所以 N 型半导体带负电。",
    answer: false,
    why: "错误。每个施主原子贡献一个电子后自身成为正离子，正、负电荷量相等，杂质半导体整体呈电中性。",
    hints: ["施主原子失去电子后变成了什么？"],
  }),
  choice({
    id: "sd-c-minor",
    topic: T2,
    title: "少子浓度由什么决定",
    prompt: "杂质半导体中，少子浓度主要取决于：",
    options: ["掺杂浓度", "温度（本征激发）", "外加电压", "晶体尺寸"],
    answer: 1,
    why: ["掺杂浓度决定多子；少子浓度 $n_i^2/N$ 虽与掺杂有关，但随温度剧烈变化。", "正确：少子由本征激发产生，$\\propto n_i^2$，对温度极敏感。", "热平衡时与外加电压无关。", "与尺寸无关。"],
    hints: ["$p=n_i^2/N_D$ 中哪个量随温度剧烈变化？"],
  }),
  gen({ id: "sd-g-minor", level: 2, topic: T2, title: "N 型硅中的少子浓度" }, (g) => {
    const ND = g.pick([1, 2, 5]) * Math.pow(10, g.pick([14, 15, 16, 17]));
    const c = carriers(ND, 0, 300);
    const isP = g.next() < 0.5;
    const NA = ND;
    const cp = carriers(0, NA, 300);
    return {
      prompt: `300 K 时硅的 $n_i=1.4\\times10^{10}$ cm⁻³。在本征硅中掺入浓度为 $${sci(ND)}$ cm⁻³ 的${isP ? "硼（三价）" : "磷（五价）"}，杂质全部电离。求少子浓度（只填数值，单位 cm⁻³，如 2e4）。`,
      parts: [num("p", "少子浓度", isP ? cp.minority : c.minority, "1", "1.96e4", { mistakes: [{ value: 1.4e10, message: "少子浓度不是 $n_i$：掺杂后 $np=n_i^2$，多子增大，少子相应减小。" }, { value: 1.4e10 / ND, message: "应为 $n_i^2/N$，不是 $n_i/N$。" }] })],
      hints: ["多子浓度 ≈ 掺杂浓度。", "质量作用定律：$np=n_i^2$。"],
      solution: `多子 $\\approx${sci(ND)}$，少子 $=n_i^2/N=${sci(isP ? cp.minority : c.minority)}$ cm⁻³。`,
    };
  }),
  gen({ id: "sd-g-comp", level: 2, topic: T2, title: "补偿掺杂" }, (g) => {
    const NA = g.pick([1, 2, 3]) * 1e15;
    const ND = NA * g.pick([2, 3, 5, 10]);
    const c = carriers(ND, NA, 300);
    return {
      prompt: `硅中同时掺入施主 $N_D=${sci(ND)}$ cm⁻³ 和受主 $N_A=${sci(NA)}$ cm⁻³（300 K，$n_i=1.4\\times10^{10}$ cm⁻³，全部电离）。求电子浓度与空穴浓度（只填数值，单位 cm⁻³）。`,
      parts: [
        num("n", "电子浓度 $n$", c.n, "1", "4e15", { mistakes: [{ value: ND, message: "受主会“抵消”一部分施主：净施主浓度为 $N_D-N_A$。" }] }),
        num("p", "空穴浓度 $p$", c.p, "1", "5e4", { mistakes: [{ value: NA, message: "受主提供的空穴被施主电子复合掉了，空穴是少子：$p=n_i^2/n$。" }] }),
      ],
      hints: ["电中性：$n+N_A=p+N_D$，且 $p\\ll n$。", "$n\\approx N_D-N_A$，$p=n_i^2/n$。"],
      solution: `$n\\approx N_D-N_A=${sci(c.n)}$，$p=${sci(c.p)}$ cm⁻³，仍为 N 型。`,
    };
  }),
  gen({ id: "sd-g-temp", level: 2, topic: T2, title: "少子浓度随温度的变化" }, (g) => {
    const Tb = 300 + g.pick([10, 20, 30, 50]);
    const k = (intrinsicDensity(Tb) / intrinsicDensity(300)) ** 2;
    return {
      prompt: `某 N 型硅的掺杂浓度远大于 $n_i$。温度从 300 K 升高到 ${Tb} K 时，若此温度下硅的 $n_i$ 增大为原来的 ${sig(Math.sqrt(k), 3)} 倍，少子浓度增大为原来的多少倍？多子浓度呢？`,
      parts: [num("p", "少子倍数", k, "1", "4.2", { mistakes: [{ value: Math.sqrt(k), message: "少子 $p=n_i^2/N_D\\propto n_i^2$，倍数要平方。" }] }), num("n", "多子倍数", 1, "1", "1", { tol: 0.01 })],
      hints: ["多子 ≈ $N_D$，与温度基本无关。", "少子 $=n_i^2/N_D$。"],
      solution: `少子增大约 ${sig(k, 3)} 倍，多子基本不变（1 倍）。`,
    };
  }),
  gen({ id: "sd-g-intr", level: 3, topic: T2, title: "杂质半导体何时“退化”为本征" }, (g) => {
    const ND = g.pick([1e13, 1e14, 1e15]);
    const T = temperatureForNi(ND, "Si");
    return {
      prompt: `掺杂浓度 $N_D=${sci(ND)}$ cm⁻³ 的 N 型硅，当本征载流子浓度 $n_i$ 增大到与 $N_D$ 相等时，就已不能当作“杂质半导体”使用。按 $n_i=BT^{3/2}e^{-E_g/(2kT)}$（300 K 时 $1.4\\times10^{10}$ cm⁻³，$E_g=1.12$ eV）估算此温度（填数值，单位 K，精确到 1%）。`,
      parts: [num("T", "$T$", T, "1", "520", { tol: 0.01 })],
      hints: ["令 $n_i(T)=N_D$，与 300 K 的值相除消去 $B$。", "对数方程可用迭代法或试算法求解。"],
      solution: `约 ${sig(T, 4)} K（${sig(T - 273, 3)} °C）。掺杂越轻，能工作的温度越低。`,
    };
  }),
  gen({ id: "sd-g-type", level: 3, topic: T2, title: "判断导电类型并比较多子少子" }, (g) => {
    const a = g.pick([1, 2, 5]) * Math.pow(10, g.pick([15, 16]));
    const b = a * g.pick([0.2, 0.5, 2, 4]);
    const c = carriers(a, b, 300);
    const ans = c.type === "N" ? 0 : c.type === "P" ? 1 : 2;
    return {
      prompt: `硅中掺入施主 $N_D=${sci(a)}$ cm⁻³、受主 $N_A=${sci(b)}$ cm⁻³（300 K）。下列判断正确的是：`,
      choice: {
        options: [`N 型；多子浓度约 $${sci(Math.abs(a - b))}$ cm⁻³`, `P 型；多子浓度约 $${sci(Math.abs(a - b))}$ cm⁻³`, "近似本征", `${a > b ? "P" : "N"} 型；多子浓度约 $${sci(a + b)}$ cm⁻³`],
        answer: ans,
        why: [
          ans === 0 ? "正确：$N_D>N_A$，净施主浓度 $N_D-N_A$ 决定多子（电子）。" : "$N_D<N_A$，应为 P 型。",
          ans === 1 ? "正确：$N_A>N_D$，净受主浓度 $N_A-N_D$ 决定多子（空穴）。" : "$N_D>N_A$，应为 N 型。",
          "两种杂质浓度相差较大，远未完全补偿。",
          "类型判断反了，而且两种杂质是相互“抵消”而不是相加。",
        ],
      },
      hints: ["受主与施主会相互补偿。", "比较 $N_D$ 与 $N_A$ 的大小，多子浓度 ≈ 二者之差。"],
      solution: `${c.type} 型，多子 $\\approx${sci(c.majority)}$、少子 $\\approx${sci(c.minority)}$ cm⁻³。`,
    };
  }),
  concept({
    id: "sd-k-drift",
    level: 3,
    topic: T2,
    title: "少子与温漂",
    prompt: "解释：为什么说“少子是半导体器件温度漂移的根源”？",
    keyPoints: ["少子浓度 $=n_i^2/N$，$\\propto n_i^2$", "$n_i$ 随温度指数增大", "PN 结反向电流、晶体管 $I_{CBO}$ 由少子漂移形成", "这些电流随温度剧增，使器件特性与 Q 点漂移"],
    reference: "多子由掺杂决定、几乎不随温度变化；少子由本征激发产生，浓度 $n_i^2/N$ 随温度指数增长。PN 结反向电流、晶体管的 $I_{CBO}$、$I_{CEO}$ 都由少子形成，所以随温度剧烈变化，导致器件特性和电路静态工作点漂移。",
  }),
];

/* ═════════════ PN 结 ═════════════ */
const T3 = "pn-junction";
const pnQ: QuestionTemplate[] = [
  choice({
    id: "pn-c-field",
    topic: T3,
    title: "内电场的方向",
    prompt: "PN 结空间电荷区中内电场的方向是：",
    options: ["由 P 区指向 N 区", "由 N 区指向 P 区", "与外加电压有关，没有固定方向", "空间电荷区中没有电场"],
    answer: 1,
    why: ["方向反了：P 侧是负离子，N 侧是正离子。", "正确：N 侧留下正离子，P 侧留下负离子，电场由正指向负。", "内电场由离子电荷决定；外电压只改变其强弱。", "空间电荷区正是电场所在的区域。"],
    hints: ["扩散后 N 区一侧留下的是什么离子？"],
  }),
  choice({
    id: "pn-c-width",
    topic: T3,
    title: "正偏时的空间电荷区",
    prompt: "PN 结加正向电压时，空间电荷区将：",
    options: ["变宽", "变窄", "不变", "消失"],
    answer: 1,
    why: ["这是反偏的情况。", "正确：外电场削弱内电场，势垒降低，空间电荷区变窄。", "外加电压直接改变势垒高度。", "正向电压一般小于接触电位差，空间电荷区不会消失。"],
    hints: ["外电场与内电场方向相同还是相反？"],
  }),
  judge({
    id: "pn-j-sat",
    topic: T3,
    title: "反向电流与反向电压",
    prompt: "PN 结反偏（未击穿）时，反向电流随反向电压增大而显著增大。",
    answer: false,
    why: "错误。反向电流由少子漂移形成，少子数目由温度决定，只要反向电压超过几倍 $U_T$，反向电流就基本不变（所以叫反向**饱和**电流 $I_S$）。",
    hints: ["反向电流由哪种载流子形成？数目由什么决定？"],
  }),
  choice({
    id: "pn-c-break",
    topic: T3,
    title: "击穿的性质",
    prompt: "下列关于 PN 结反向击穿的说法正确的是：",
    options: ["任何击穿都会永久损坏 PN 结", "齐纳击穿和雪崩击穿都是电击穿，只要限制电流就可逆", "雪崩击穿发生在高掺杂、击穿电压低的 PN 结中", "击穿时反向电流减小"],
    answer: 1,
    why: ["只有热击穿才是不可逆的。", "正确。", "高掺杂、低击穿电压对应齐纳击穿；雪崩击穿对应低掺杂、高击穿电压。", "击穿时反向电流急剧增大。"],
    hints: ["区分“电击穿”和“热击穿”。"],
  }),
  gen({ id: "pn-g-current", level: 2, topic: T3, title: "由电流方程求正向电流" }, (g) => {
    const Is = g.pick([1, 2, 5]) * Math.pow(10, -g.pick([13, 14, 15]));
    const u = g.pick([0.55, 0.6, 0.62, 0.65, 0.68, 0.7]);
    const i = shockley(u, Is, 0.026);
    return {
      prompt: `某硅二极管反向饱和电流 $I_S=${formatSI(Is, "A")}$，取 $U_T=26$ mV。求正向电压 $u=${u}$ V 时的电流。`,
      parts: [num("i", "$i$", i, "A", "mA", { mistakes: [{ value: Is * Math.exp(u / 0.0259), message: "注意按题目给定的 $U_T=26$ mV 计算（指数对 $U_T$ 很敏感）。" }] })],
      hints: ["$i=I_S(e^{u/U_T}-1)\\approx I_Se^{u/U_T}$。"],
      solution: `$i\\approx${formatSI(Is, "A")}\\times e^{${u}/0.026}=${A(i)}$。`,
    };
  }),
  gen({ id: "pn-g-voltage", level: 2, topic: T3, title: "达到给定电流所需的正向电压" }, (g) => {
    const Is = g.pick([1, 3, 10]) * 1e-14;
    const I = g.pick([0.1, 0.5, 1, 2, 5, 10]) * 1e-3;
    const u = shockleyVoltage(I, Is, 0.026);
    return {
      prompt: `二极管 $I_S=${formatSI(Is, "A")}$，$U_T=26$ mV。要使正向电流为 ${A(I)}，需要多大的正向电压？`,
      parts: [num("u", "$u$", u, "V", "V", { tol: 0.01 })],
      hints: ["$u=U_T\\ln(i/I_S+1)$。"],
      solution: `$u=0.026\\ln(${A(I)}/${formatSI(Is, "A")})\\approx${V(u)}$。`,
    };
  }),
  gen({ id: "pn-g-vbi", level: 2, topic: T3, title: "接触电位差" }, (g) => {
    const NA = g.pick([1, 5]) * Math.pow(10, g.pick([16, 17, 18]));
    const ND = g.pick([1, 2, 5]) * Math.pow(10, g.pick([15, 16]));
    const Vbi = builtInPotential(NA, ND, 300);
    return {
      prompt: `硅 PN 结两侧掺杂 $N_A=${sci(NA)}$ cm⁻³、$N_D=${sci(ND)}$ cm⁻³，300 K 时 $n_i=1.4\\times10^{10}$ cm⁻³、$U_T=25.9$ mV。求接触电位差 $U_{ho}$。`,
      parts: [num("Vbi", "$U_{ho}$", Vbi, "V", "V", { tol: 0.02 })],
      hints: ["$U_{ho}=U_T\\ln\\dfrac{N_AN_D}{n_i^2}$。"],
      solution: `$U_{ho}\\approx${V(Vbi)}$。掺杂越重，接触电位差越大。`,
    };
  }),
  gen({ id: "pn-g-ratio", level: 3, topic: T3, title: "电压增量与电流倍数" }, (g) => {
    const dU = g.pick([18, 30, 36, 60, 90, 120]) * 1e-3;
    const k = shockley(0.7 + dU, 1e-14) / shockley(0.7, 1e-14);
    const back = g.pick([2, 5, 10, 100]);
    const dU2 = shockleyVoltage(back * 1e-3, 1e-14) - shockleyVoltage(1e-3, 1e-14);
    return {
      prompt: `取 $U_T=26$ mV，二极管工作在正向导通区（$u\\gg U_T$）。(1) 正向电压增加 ${sig(dU * 1e3, 3)} mV，电流变为原来的多少倍？(2) 要使电流变为原来的 ${back} 倍，电压需增加多少？`,
      parts: [num("k", "(1) 倍数", k, "1", "10"), num("du", "(2) 电压增量", dU2, "V", "mV", { mistakes: [{ value: 0.026 * back, message: "电压增量是 $U_T\\ln k$，不是 $kU_T$。" }] })],
      hints: ["$i_2/i_1=e^{(u_2-u_1)/U_T}$。", "反过来：$\\Delta u=U_T\\ln(i_2/i_1)$。"],
      solution: `(1) $e^{${sig(dU * 1e3, 3)}/26}\\approx${sig(k, 3)}$ 倍；(2) $26\\,\\mathrm{mV}\\times\\ln${back}\\approx${formatSI(dU2, "V")}$。`,
    };
  }),
  gen({ id: "pn-g-width", level: 3, topic: T3, title: "反偏电压与耗尽层宽度" }, (g) => {
    const NA = 1e17;
    const ND = g.pick([1e15, 1e16]);
    const UR = g.pick([1, 3, 5, 10, 20]);
    const w0 = depletionWidth(0, NA, ND);
    const w = depletionWidth(-UR, NA, ND);
    return {
      prompt: `突变结 $W\\propto\\sqrt{U_{ho}-u}$。某硅结 $U_{ho}=${sig(w0.Vbi, 3)}$ V，零偏时耗尽层宽度为 $W_0$。外加反向电压 ${UR} V 时，耗尽层宽度是 $W_0$ 的多少倍？势垒电容约变为零偏时的多少倍？`,
      parts: [num("w", "$W/W_0$", w.W / w0.W, "1", "2.5"), num("c", "$C_b/C_{b0}$", w0.W / w.W, "1", "0.4", { mistakes: [{ value: w.W / w0.W, message: "势垒电容 $\\propto1/W$（平板电容：极板间距越大电容越小）。" }] })],
      hints: ["反偏时 $u=-U_R$，所以 $U_{ho}-u=U_{ho}+U_R$。", "势垒电容类似平板电容，$C_b\\propto1/W$。"],
      solution: `$W/W_0=\\sqrt{(${sig(w0.Vbi, 3)}+${UR})/${sig(w0.Vbi, 3)}}\\approx${sig(w.W / w0.W, 3)}$，$C_b$ 约为原来的 ${sig(w0.W / w.W, 3)} 倍。`,
    };
  }),
  concept({
    id: "pn-k-unilateral",
    level: 3,
    topic: T3,
    title: "用扩散与漂移解释单向导电性",
    prompt: "用“扩散”和“漂移”两种运动，解释 PN 结为什么正偏导通、反偏截止。",
    keyPoints: ["平衡时多子扩散与少子漂移相等，净电流为零", "正偏削弱内电场，势垒降低，多子扩散远大于漂移 → 大的正向电流", "反偏加强内电场，扩散几乎停止，只剩少子漂移 → 很小的反向电流", "少子数目少，所以反向电流极小且基本不随反向电压变化"],
    reference: "零偏时扩散电流与漂移电流平衡。正偏时外电场削弱内电场、势垒降低，多子扩散大大增强，形成随电压指数增长的正向电流；反偏时势垒升高，扩散被抑制，只剩少子漂移形成的微小反向饱和电流。",
  }),
];

/* ═════════════ 二极管 ═════════════ */
const T4 = "diode";
const diodeQ: QuestionTemplate[] = [
  choice({
    id: "di-c-uon",
    topic: T4,
    title: "导通压降",
    prompt: "硅二极管与锗二极管正向导通时的管压降约为：",
    options: ["硅 0.2 V，锗 0.7 V", "硅 0.7 V，锗 0.2 V", "都约为 0.7 V", "都约为 0"],
    answer: 1,
    why: ["反了。", "正确：硅约 0.6–0.8 V，锗约 0.2–0.3 V。", "锗的禁带更窄，导通压降更低。", "那是理想模型的近似。"],
    hints: ["锗的禁带宽度比硅大还是小？"],
  }),
  choice({
    id: "di-c-temp",
    topic: T4,
    title: "温度对伏安特性的影响",
    prompt: "温度升高时，二极管的伏安特性：",
    options: ["正向特性右移，反向电流减小", "正向特性左移，反向电流增大", "正向特性左移，反向电流减小", "不变"],
    answer: 1,
    why: ["两者方向都反了。", "正确：同一电流下压降约减小 2 mV/°C；反向电流约每 10 °C 翻倍。", "反向电流随温度增大。", "温度对半导体影响很大。"],
    hints: ["少子浓度随温度怎样变化？"],
  }),
  judge({
    id: "di-j-rd",
    topic: T4,
    title: "动态电阻与直流电阻",
    prompt: "二极管的动态电阻 $r_d$ 等于其工作点电压与电流之比 $U_D/I_D$。",
    answer: false,
    why: "错误。$U_D/I_D$ 是直流电阻；动态电阻 $r_d=\\mathrm du_D/\\mathrm di_D=U_T/I_D$，是 Q 点处切线斜率的倒数，二者相差很大（1 mA 时约 600 Ω 对 26 Ω）。",
    hints: ["动态电阻描述的是“变化量之比”。"],
  }),
  choice({
    id: "di-c-model",
    topic: T4,
    title: "模型的选择",
    prompt: "电源电压 50 V、限流电阻 10 kΩ 与硅二极管串联，估算电流时最合理的做法是：",
    options: ["必须用指数模型精确计算", "用理想模型即可：误差约 1.4%", "用小信号模型", "无法估算"],
    answer: 1,
    why: ["精度要求不高时没有必要。", "正确：50 V ≫ 0.7 V，忽略导通压降引起的误差只有 0.7/50 ≈ 1.4%。", "小信号模型只用于叠加在直流上的微小变化。", "可以估算。"],
    hints: ["0.7 V 与 50 V 相比有多大？"],
  }),
  gen({ id: "di-g-series", level: 2, topic: T4, title: "串联电路的二极管电流" }, (g) => {
    const Vs = g.pick([1.5, 2, 3, 5, 6, 9, 12]);
    const Rr = e12(g.range(200, 5000));
    const c = solveSeries(Vs, Rr, "const");
    return {
      prompt: `直流电压源 $V=${Vs}$ V、电阻 $R=${R(Rr)}$ 与硅二极管串联（二极管正偏）。用恒压降模型（$U_{on}=0.7$ V）求二极管电流 $I_D$ 和电阻两端电压 $U_R$。`,
      diagram: { id: "diode-series", labels: { V: `${Vs} V`, R: R(Rr) } },
      parts: [num("ID", "$I_D$", c.ID, "A", "mA", { mistakes: [{ value: Vs / Rr, message: "这是理想模型的结果；题目要求恒压降模型，应先减去 0.7 V。" }] }), num("UR", "$U_R$", Vs - 0.7, "V", "V", { mistakes: [{ value: Vs, message: "电阻上的电压是 $V-U_{on}$。" }] })],
      hints: ["二极管导通时用 0.7 V 的电压源代替。", "KVL：$V=I_DR+0.7$。"],
      solution: `$I_D=(${Vs}-0.7)/${R(Rr)}=${A(c.ID)}$，$U_R=${V(Vs - 0.7)}$。`,
    };
  }),
  gen({ id: "di-g-rd", level: 2, topic: T4, title: "二极管的动态电阻" }, (g) => {
    const I = g.pick([0.2, 0.5, 1, 2, 2.6, 5, 10]) * 1e-3;
    const rd = dynamicResistance(I, { n: 1, T: 300 });
    return {
      prompt: `二极管静态电流 $I_D=${A(I)}$，室温下 $U_T\\approx26$ mV。求其小信号动态电阻 $r_d$。`,
      parts: [num("rd", "$r_d$", rd, "Ω", "Ω", { alts: [0.026 / I], mistakes: [{ value: 0.7 / I, message: "这是直流电阻 $U_D/I_D$；动态电阻为 $U_T/I_D$。" }] })],
      hints: ["$r_d=U_T/I_D$。"],
      solution: `$r_d=26\\,\\mathrm{mV}/${A(I)}\\approx${R(0.026 / I)}$。`,
    };
  }),
  gen({ id: "di-g-gate", level: 2, topic: T4, title: "二极管门电路的输出" }, (g) => {
    const kind = g.pick(["and", "or"] as const);
    const vals = [0, 0.3, 1, 2, 3, 3.6, 5];
    const a = g.pick(vals);
    let b = g.pick(vals);
    if (b === a) b = a === 0 ? 3 : 0;
    const Vref = kind === "and" ? g.pick([5, 6, 10]) : 0;
    const r = diodeGate(kind, [a, b], Vref, 0.7);
    return {
      prompt:
        kind === "and"
          ? `图示电路中 $V_{CC}=${Vref}$ V，$U_A=${a}$ V，$U_B=${b}$ V，二极管为硅管（恒压降 0.7 V）。求输出电压 $U_O$。`
          : `图示电路中 $U_A=${a}$ V，$U_B=${b}$ V，电阻下端接地，二极管为硅管（恒压降 0.7 V）。求输出电压 $U_O$（输出端开路）。`,
      diagram: { id: kind === "and" ? "diode-gate" : "diode-two", labels: { A: `${a} V`, B: `${b} V`, Vsub: `CC=${Vref} V` } },
      parts: [
        num("UO", "$U_O$", r.UO, "V", "V", {
          tol: 0.02,
          mistakes: kind === "and" ? [{ value: Math.max(a, b) + 0.7, message: "两只管子不会都导通：输入较低的那只开路电压更大，优先导通并把输出钳住。" }] : [{ value: Math.min(a, b) - 0.7, message: "输入较高的那只优先导通。" }],
        }),
      ],
      hints: ["先断开两只二极管，求各自阳极–阴极开路电压。", "开路电压最大的管子优先导通；导通后再检查另一只。"],
      solution: `$U_O=${V(r.UO)}$；VD₁ ${r.on[0] ? "导通" : "截止"}，VD₂ ${r.on[1] ? "导通" : "截止"}。`,
    };
  }),
  gen({ id: "di-g-gate3", level: 3, topic: T4, title: "三输入二极管电路" }, (g) => {
    const vals = [-3, -1, 0, 1, 2, 3, 4];
    const ins = [g.pick(vals), g.pick(vals), g.pick(vals)];
    const Vref = g.pick([-6, -5, -10]);
    const r = diodeGate("or", ins, Vref, 0.7);
    const nOn = r.on.filter(Boolean).length;
    return {
      prompt: `三只硅二极管的阳极分别接 $U_1=${ins[0]}$ V、$U_2=${ins[1]}$ V、$U_3=${ins[2]}$ V，阴极连在一起作为输出端，经电阻接到 $${Vref}$ V 电源。二极管用恒压降模型（0.7 V），输出端开路。求 $U_O$ 以及导通的二极管只数。`,
      parts: [num("UO", "$U_O$", r.UO, "V", "V", { tol: 0.02, mistakes: [{ value: Math.max(...ins), message: "导通的二极管有 0.7 V 压降：$U_O=U_{\\max}-0.7$。" }] }), num("n", "导通只数", nOn, "1", "1", { tol: 0.01 })],
      hints: ["阴极公共端被电阻拉向负电源。断开所有二极管时，每只的开路电压 = 输入 − 负电源电压。", "阳极电位最高的管子优先导通，$U_O=U_{\\max}-0.7$；其余输入较低的管子反偏（若有输入相等则同时导通）。"],
      solution: `$U_O=${V(r.UO)}$，导通 ${nOn} 只。`,
    };
  }),
  gen({ id: "di-g-ac", level: 3, topic: T4, title: "直流偏置下的交流小信号" }, (g) => {
    const Vdc = g.pick([3, 5, 6, 10]);
    const Rr = e12(g.range(1e3, 5e3));
    const um = g.pick([5, 10, 20]) * 1e-3;
    const c = solveSeries(Vdc, Rr, "const");
    const rd = dynamicResistance(c.ID, { n: 1, T: 300 });
    const ud = (um * rd) / (Rr + rd);
    return {
      prompt: `直流电压源 $V=${Vdc}$ V 与一个幅值 ${sig(um * 1e3, 2)} mV 的正弦信号源串联，经电阻 $R=${R(Rr)}$ 加在硅二极管上（正偏）。(1) 用恒压降模型求静态电流 $I_D$；(2) 用小信号模型（$U_T$≈26 mV）求二极管两端交流电压的幅值。`,
      parts: [num("ID", "(1) $I_D$", c.ID, "A", "mA"), num("ud", "(2) $U_{dm}$", ud, "V", "mV", { tol: 0.04, mistakes: [{ value: um, message: "交流信号按 $r_d$ 与 $R$ 分压，二极管只分到很小一部分。" }] })],
      hints: ["先直流：$I_D=(V-0.7)/R$。", "再交流：直流源置零，二极管换成 $r_d=U_T/I_D$，与 $R$ 分压。"],
      solution: `$I_D=${A(c.ID)}$，$r_d\\approx${R(rd)}$，$U_{dm}=${sig(um * 1e3, 2)}\\,\\mathrm{mV}\\times\\dfrac{r_d}{R+r_d}\\approx${formatSI(ud, "V")}$。`,
    };
  }),
  gen({ id: "di-g-models", level: 3, topic: T4, title: "模型误差比较" }, (g) => {
    const Vs = g.pick([1.2, 1.5, 2, 3, 5, 10]);
    const Rr = e12(g.range(500, 2e3));
    const e = solveSeries(Vs, Rr, "exp");
    const i = solveSeries(Vs, Rr, "ideal");
    const c = solveSeries(Vs, Rr, "const");
    return {
      prompt: `$V=${Vs}$ V、$R=${R(Rr)}$ 与一只硅二极管串联，用指数模型精确计算得 $I_D=${A(e.ID)}$。分别求理想模型与恒压降模型（0.7 V）计算结果相对精确值的误差（百分数，如 25%）。`,
      parts: [num("ei", "理想模型误差", (i.ID - e.ID) / e.ID, "1", "40%", { tol: 0.05 }), num("ec", "恒压降模型误差", (c.ID - e.ID) / e.ID, "1", "−3%", { tol: 0.15 })],
      hints: ["相对误差 $=(I_{\\text{模型}}-I_{\\text{精确}})/I_{\\text{精确}}$，可正可负。"],
      solution: `理想：${sig(((i.ID - e.ID) / e.ID) * 100, 3)}%；恒压降：${sig(((c.ID - e.ID) / e.ID) * 100, 3)}%。电源电压越低，理想模型的误差越大。`,
    };
  }),
];

/* ═════════════ 稳压管 ═════════════ */
const T5 = "zener";
const zSpec = (UZ: number, IZmin: number, IZM: number): ZenerSpec => ({ UZ, rz: 0, IZt: IZmin, IZmin, IZM });
const zenerQ: QuestionTemplate[] = [
  choice({
    id: "zn-c-region",
    topic: T5,
    title: "稳压管的工作区",
    prompt: "稳压二极管正常稳压时工作在：",
    options: ["正向导通区", "反向截止区", "反向击穿区", "死区"],
    answer: 2,
    why: ["正向导通时它只是普通二极管（约 0.7 V）。", "截止区电流几乎为零，电压随外电路变化，不能稳压。", "正确：击穿区电流大范围变化而电压几乎不变。", "死区电压不稳定。"],
    hints: ["哪个区域的伏安特性几乎是竖直线？"],
  }),
  judge({
    id: "zn-j-resistor",
    topic: T5,
    title: "限流电阻",
    prompt: "稳压管稳压电路中，限流电阻既限制稳压管电流，又通过其上压降的变化来调节输出，二者缺一不可。",
    answer: true,
    why: "正确。$U_I$ 或负载变化时，$I_Z$ 随之变化，$R$ 上的压降 $I_RR$ 吸收了输入的变化，输出才得以稳定；没有 $R$，稳压管会因电流过大而损坏。",
    hints: ["$U_I$ 升高时，多出来的电压降在哪里？"],
  }),
  choice({
    id: "zn-c-tc",
    topic: T5,
    title: "温度系数",
    prompt: "稳定电压约为多少伏的稳压管，温度系数最小？",
    options: ["约 2 V", "约 6 V", "约 15 V", "与电压无关"],
    answer: 1,
    why: ["低压稳压管以齐纳击穿为主，温度系数为负。", "正确：约 6 V 时齐纳击穿（负温度系数）与雪崩击穿（正温度系数）相互抵消。", "高压稳压管以雪崩击穿为主，温度系数为正。", "与击穿机理有关。"],
    hints: ["两种击穿机理的温度系数符号相反。"],
  }),
  gen({ id: "zn-g-iz", level: 2, topic: T5, title: "稳压管电流" }, (g) => {
    for (let k = 0; k < 50; k++) {
      const UZ = g.pick([5.1, 6, 6.2, 9.1]);
      const UI = Math.round(UZ * g.range(1.6, 2.5));
      const Rr = e12(g.range(100, 600));
      const RL = e12(g.range(500, 5000));
      const z = zSpec(UZ, 5e-3, 50e-3);
      const r = solveZenerRegulator(UI, Rr, RL, z);
      if (r.status !== "ok") continue;
      return {
        prompt: `稳压管稳压电路中 $U_I=${UI}$ V，$R=${R(Rr)}$，$R_L=${R(RL)}$，稳压管 $U_Z=${UZ}$ V（理想击穿特性），$I_{Z\\min}=5$ mA，$I_{ZM}=50$ mA。求 $I_R$、$I_L$ 和 $I_Z$。`,
        diagram: { id: "zener-reg", labels: { UI: `${UI} V`, R: R(Rr), RL: R(RL), Z: `${UZ} V` } },
        parts: [num("IR", "$I_R$", r.IR, "A", "mA"), num("IL", "$I_L$", r.IL, "A", "mA"), num("IZ", "$I_Z$", r.IZ, "A", "mA", { mistakes: [{ value: r.IR, message: "$I_R$ 中有一部分流向负载：$I_Z=I_R-I_L$。" }] })],
        hints: ["先假设稳压管已击穿：$U_O=U_Z$。", "$I_R=(U_I-U_Z)/R$，$I_L=U_Z/R_L$，$I_Z=I_R-I_L$。最后检查 $I_{Z\\min}\\le I_Z\\le I_{ZM}$。"],
        solution: `$I_R=${A(r.IR)}$，$I_L=${A(r.IL)}$，$I_Z=${A(r.IZ)}$，在允许范围内，能正常稳压。`,
      };
    }
    throw new Error("unreachable");
  }),
  gen({ id: "zn-g-range", level: 2, topic: T5, title: "限流电阻的取值范围" }, (g) => {
    for (let k = 0; k < 80; k++) {
      const UZ = g.pick([5, 6, 9, 12]);
      const UIn = Math.round(UZ * g.range(1.6, 2.2));
      const d = g.pick([0.1, 0.15, 0.2]);
      const ILmax = g.pick([5, 10, 15, 20]) * 1e-3;
      const IZM = g.pick([30, 40, 50, 60]) * 1e-3;
      const z = { UZ, IZmin: 5e-3, IZM };
      const r = limitResistorRange(UIn * (1 - d), UIn * (1 + d), 0, ILmax, z);
      if (!r.feasible || r.Rmax / r.Rmin < 1.15) continue;
      return {
        prompt: `稳压管 $U_Z=${UZ}$ V，$I_{Z\\min}=5$ mA，$I_{ZM}=${sig(IZM * 1e3, 2)}$ mA。输入电压 $U_I=${UIn}$ V 且有 ±${d * 100}% 的波动，负载电流在 0–${sig(ILmax * 1e3, 2)} mA 之间变化。求限流电阻的最小值和最大值。`,
        parts: [
          num("Rmin", "$R_{\\min}$", r.Rmin, "Ω", "Ω", { mistakes: [{ value: (UIn * (1 + d) - UZ) / (IZM + ILmax), message: "求 $R_{\\min}$ 的最不利情况是**空载**（$I_L=0$），此时稳压管电流最大。" }] }),
          num("Rmax", "$R_{\\max}$", r.Rmax, "Ω", "Ω", { mistakes: [{ value: (UIn * (1 - d) - UZ) / 5e-3, message: "求 $R_{\\max}$ 时负载取最重（$I_{L\\max}$），分母为 $I_{Z\\min}+I_{L\\max}$。" }] }),
        ],
        hints: ["$R_{\\min}$：$U_I$ 最大、$I_L$ 最小时 $I_Z\\le I_{ZM}$。", "$R_{\\max}$：$U_I$ 最小、$I_L$ 最大时 $I_Z\\ge I_{Z\\min}$。"],
        solution: `$${sig(r.Rmin, 3)}\\,\\Omega\\le R\\le${sig(r.Rmax, 3)}\\,\\Omega$。`,
      };
    }
    throw new Error("unreachable");
  }),
  gen({ id: "zn-g-off", level: 2, topic: T5, title: "稳压管是否击穿" }, (g) => {
    const UZ = g.pick([6, 8, 10]);
    const UI = g.pick([12, 15, 18]);
    const Rr = e12(g.range(300, 1500));
    const RL = e12(g.range(200, 3000));
    const r = solveZenerRegulator(UI, Rr, RL, zSpec(UZ, 2e-3, 40e-3));
    return {
      prompt: `$U_I=${UI}$ V，$R=${R(Rr)}$，$R_L=${R(RL)}$，稳压管 $U_Z=${UZ}$ V（理想击穿特性）。求输出电压 $U_O$。`,
      diagram: { id: "zener-reg", labels: { UI: `${UI} V`, R: R(Rr), RL: R(RL), Z: `${UZ} V` } },
      parts: [num("UO", "$U_O$", r.UO, "V", "V", { mistakes: r.status === "off" ? [{ value: UZ, message: "先判断稳压管是否击穿：断开稳压管时 $R_L$ 上的电压只有 $U_IR_L/(R+R_L)$，低于 $U_Z$，稳压管未击穿。" }] : [{ value: (UI * RL) / (Rr + RL), message: "断开稳压管时的分压值超过 $U_Z$，稳压管已击穿，输出被稳定在 $U_Z$。" }] })],
      hints: ["先断开稳压管，求 $R_L$ 上的开路电压。", "开路电压 > $U_Z$ 才击穿；否则输出就是分压值。"],
      solution: r.status === "off" ? `开路电压 $${sig((UI * RL) / (Rr + RL), 3)}$ V $<U_Z$，稳压管未击穿，$U_O=${V(r.UO)}$。` : `开路电压超过 $U_Z$，稳压管击穿，$U_O=${V(r.UO)}$。`,
    };
  }),
  gen({ id: "zn-g-ilmax", level: 3, topic: T5, title: "最大允许负载电流" }, (g) => {
    const UZ = g.pick([5, 6, 9]);
    const UI = Math.round(UZ * g.range(1.8, 2.4));
    const Rr = e12(g.range(150, 500));
    const IZmin = g.pick([3, 5, 8]) * 1e-3;
    const IL = (UI - UZ) / Rr - IZmin;
    return {
      prompt: `稳压管 $U_Z=${UZ}$ V，$I_{Z\\min}=${sig(IZmin * 1e3, 2)}$ mA，$U_I=${UI}$ V，$R=${R(Rr)}$。为保证稳压，负载电流最大不能超过多少？对应的最小负载电阻是多少？`,
      parts: [num("IL", "$I_{L\\max}$", IL, "A", "mA"), num("RL", "$R_{L\\min}$", UZ / IL, "Ω", "Ω", { mistakes: [{ value: (UI - UZ) / IL, message: "$R_L$ 上的电压是 $U_Z$，不是 $U_I-U_Z$。" }] })],
      hints: ["$I_Z=I_R-I_L\\ge I_{Z\\min}$，$I_R=(U_I-U_Z)/R$ 与负载无关（稳压时）。"],
      solution: `$I_{L\\max}=${A(IL)}$，$R_{L\\min}=${R(UZ / IL)}$。`,
    };
  }),
  gen({ id: "zn-g-power", level: 3, topic: T5, title: "稳压管的最大功耗" }, (g) => {
    const UZ = g.pick([5.1, 6.2, 9.1, 12]);
    const UImax = Math.round(UZ * g.range(1.8, 2.5));
    const Rr = e12(g.range(100, 400));
    const r = solveZenerRegulator(UImax, Rr, Infinity, zSpec(UZ, 1e-3, 1));
    return {
      prompt: `稳压管 $U_Z=${UZ}$ V，限流电阻 $R=${R(Rr)}$，输入电压最高可达 ${UImax} V。负载可能开路时，稳压管的最大功耗是多少？若选用 $P_{ZM}=0.5$ W 的稳压管是否安全（安全填 1，不安全填 0）？`,
      parts: [num("P", "$P_{Z\\max}$", r.PZ, "W", "mW"), num("ok", "是否安全", r.PZ <= 0.5 ? 1 : 0, "1", "1", { tol: 0.01 })],
      hints: ["最不利：输入最高且负载开路，此时 $I_Z=I_R$。", "$P_Z=U_ZI_Z$。"],
      solution: `$I_{Z\\max}=(${UImax}-${UZ})/${R(Rr)}=${A(r.IZ)}$，$P_Z=${formatSI(r.PZ, "W")}$，${r.PZ <= 0.5 ? "小于" : "超过"} 0.5 W。`,
    };
  }),
  concept({
    id: "zn-k-process",
    level: 3,
    topic: T5,
    title: "稳压过程",
    prompt: "用“$U_I\\uparrow\\to\\cdots\\to U_O$ 基本不变”的形式，说明稳压管稳压电路在电网电压升高时的稳压过程。",
    keyPoints: ["$U_I\\uparrow\\Rightarrow U_O$ 有升高趋势", "稳压管击穿特性很陡：$U_O$ 稍升高，$I_Z$ 显著增大", "$I_R=I_Z+I_L$ 增大，$R$ 上压降 $I_RR$ 增大", "$U_O=U_I-I_RR$ 基本不变"],
    reference: "$U_I\\uparrow\\to U_O\\uparrow$（趋势）$\\to I_Z\\uparrow\\uparrow\\to I_R\\uparrow\\to U_R\\uparrow\\to U_O=U_I-U_R$ 基本不变。输入的增量几乎全部降在限流电阻上。",
  }),
];

/* ═════════════ 整流与限幅 ═════════════ */
const T6 = "diode-circuits";
const dcQ: QuestionTemplate[] = [
  choice({
    id: "dc-c-avg",
    topic: T6,
    title: "半波整流的输出平均值",
    prompt: "单相半波整流电路（理想二极管、电阻负载），变压器副边电压有效值为 $U_2$，输出电压平均值为：",
    options: ["$0.45U_2$", "$0.9U_2$", "$\\sqrt2U_2$", "$U_2$"],
    answer: 0,
    why: ["正确：$\\sqrt2U_2/\\pi\\approx0.45U_2$。", "这是桥式（全波）整流。", "这是峰值，也是电容滤波空载时的输出。", "有效值不等于整流平均值。"],
    hints: ["对半个正弦波求一个周期内的平均值。"],
  }),
  choice({
    id: "dc-c-bridge",
    topic: T6,
    title: "桥式整流中二极管的导通",
    prompt: "单相桥式整流电路中，每只二极管在一个周期内导通：",
    options: ["整个周期", "半个周期", "四分之一周期", "不导通"],
    answer: 1,
    why: ["每个半周只有一对二极管导通。", "正确：正半周一对、负半周另一对。因此每管平均电流为负载电流的一半。", "电阻负载时导通半个周期；电容滤波时导通角才会变小。", "—"],
    hints: ["正半周、负半周各是哪两只二极管导通？"],
  }),
  judge({
    id: "dc-j-clamp",
    topic: T6,
    title: "钳位与限幅",
    prompt: "钳位电路与限幅电路一样，都会削去输入波形的一部分。",
    answer: false,
    why: "错误。限幅削去超过限幅电平的部分；钳位（$RC\\gg T$ 时）只是把整个波形平移一个直流电平，波形形状不变。",
    hints: ["钳位电路中的电容起什么作用？"],
  }),
  gen({ id: "dc-g-avg", level: 2, topic: T6, title: "整流输出平均值" }, (g) => {
    const kind = g.pick(["half", "bridge"] as const);
    const U2 = g.pick([6, 9, 10, 12, 15, 18, 20, 24]);
    const RL = e12(g.range(50, 1000));
    const UO = rectifiedAverage(U2, kind);
    return {
      prompt: `单相${kind === "half" ? "半波" : "桥式"}整流电路，变压器副边电压有效值 $U_2=${U2}$ V，负载 $R_L=${R(RL)}$，二极管为理想二极管。求输出电压平均值 $U_{O(AV)}$ 与负载电流平均值 $I_{O(AV)}$。`,
      diagram: { id: kind === "half" ? "half-wave" : "bridge", labels: { U2: `${U2} V`, RL: R(RL) } },
      parts: [num("UO", "$U_{O(AV)}$", UO, "V", "V", { mistakes: [{ value: rectifiedAverage(U2, kind === "half" ? "bridge" : "half"), message: kind === "half" ? "半波整流只有半个周期有输出：系数是 0.45，不是 0.9。" : "桥式整流两个半周都有输出：系数是 0.9。" }, { value: Math.SQRT2 * U2, message: "这是峰值；没有滤波电容时输出平均值远小于峰值。" }] }), num("IO", "$I_{O(AV)}$", UO / RL, "A", "mA")],
      hints: ["半波 $0.45U_2$，桥式 $0.9U_2$。"],
      solution: `$U_{O(AV)}=${V(UO)}$，$I_{O(AV)}=${A(UO / RL)}$。`,
    };
  }),
  gen({ id: "dc-g-stress", level: 2, topic: T6, title: "整流二极管的电流与反向电压" }, (g) => {
    const U2 = g.pick([10, 12, 15, 20, 24, 30]);
    const RL = e12(g.range(20, 300));
    const s = rectifierStress(U2, RL, "bridge");
    return {
      prompt: `单相桥式整流电路，$U_2=${U2}$ V（有效值），$R_L=${R(RL)}$，理想二极管。求每只二极管的平均电流 $I_D$ 与最大反向电压 $U_{RM}$。`,
      diagram: { id: "bridge", labels: { U2: `${U2} V`, RL: R(RL) } },
      parts: [num("ID", "$I_D$", s.ID, "A", "mA", { mistakes: [{ value: s.ID * 2, message: "每只二极管只在半个周期导通：平均电流是负载电流的一半。" }] }), num("URM", "$U_{RM}$", s.URM, "V", "V", { mistakes: [{ value: U2, message: "反向电压的最大值是峰值 $\\sqrt2U_2$，不是有效值。" }, { value: 2 * s.URM, message: "那是全波（中心抽头）整流的二极管反向电压；桥式整流为 $\\sqrt2U_2$。" }] })],
      hints: ["$I_{O(AV)}=0.9U_2/R_L$，$I_D=I_{O(AV)}/2$。", "截止的二极管两端承受副边电压的峰值。"],
      solution: `$I_D=${A(s.ID)}$，$U_{RM}=\\sqrt2\\times${U2}=${V(s.URM)}$。`,
    };
  }),
  gen({ id: "dc-g-clip", level: 2, topic: T6, title: "单向限幅的输出" }, (g) => {
    const E = g.pick([1, 2, 3, 4, 5]);
    const Um = g.pick([6, 8, 10]);
    const ui = g.pick([-Um, -2, 0.5 * Um, Um, E + 0.3]);
    const real = g.next() < 0.6;
    const Uon = real ? 0.7 : 0;
    const out = clip(ui, { upper: E + Uon });
    return {
      prompt: `图示上限幅电路中 $E=${E}$ V，二极管${real ? "为硅管（恒压降 0.7 V）" : "为理想二极管"}，输出端空载。输入 $u_I=${Um}\\sin\\omega t$ V。求 (1) 输出电压的最大值；(2) 当 $u_I=${sig(ui, 3)}$ V 时的输出电压。`,
      diagram: { id: "clip-shunt", labels: { E: `${E} V` } },
      parts: [num("max", "(1) $u_{O\\max}$", E + Uon, "V", "V", { mistakes: real ? [{ value: E, message: "导通的二极管上还有 0.7 V 压降：限幅电平为 $E+U_{on}$。" }] : [] }), num("uo", "(2) $u_O$", out, "V", "V", { tol: 0.02 })],
      hints: ["$u_I>E+U_{on}$ 时二极管导通，输出被钳住；否则二极管截止，$u_O=u_I$。"],
      solution: `限幅电平 $E+U_{on}=${V(E + Uon)}$；$u_I=${sig(ui, 3)}$ V 时 $u_O=${V(out)}$。`,
    };
  }),
  gen({ id: "dc-g-double", level: 3, topic: T6, title: "双向限幅" }, (g) => {
    const E1 = g.pick([2, 3, 4, 5]);
    const E2 = g.pick([1, 2, 3, 4]);
    const Um = g.pick([8, 10, 12]);
    const ua = g.pick([Um, Um * 0.5, 1]);
    const ub = -g.pick([Um, Um * 0.3, 0.5]);
    const s = { upper: E1 + 0.7, lower: -E2 - 0.7 };
    return {
      prompt: `双向限幅电路：VD₁ 串 $E_1=${E1}$ V 限制上限，VD₂ 串 $E_2=${E2}$ V 限制下限（硅管，恒压降 0.7 V），输出空载。输入 $u_I=${Um}\\sin\\omega t$ V。求 $u_I=${sig(ua, 3)}$ V 和 $u_I=${sig(ub, 3)}$ V 时的输出，以及输出的峰峰值。`,
      diagram: { id: "clip-double", labels: { E1: `${E1} V`, E2: `${E2} V` } },
      parts: [num("a", `$u_I=${sig(ua, 3)}$ V 时`, clip(ua, s), "V", "V", { tol: 0.02 }), num("b", `$u_I=${sig(ub, 3)}$ V 时`, clip(ub, s), "V", "V", { tol: 0.02 }), num("pp", "峰峰值", s.upper - s.lower, "V", "V", { tol: 0.02 })],
      hints: ["上限 $E_1+0.7$，下限 $-(E_2+0.7)$。", "在两个限幅电平之间时两只二极管都截止，$u_O=u_I$。"],
      solution: `限幅范围 $${sig(s.lower, 3)}$ V 到 $${sig(s.upper, 3)}$ V，峰峰值 ${V(s.upper - s.lower)}。`,
    };
  }),
  gen({ id: "dc-g-clamp", level: 3, topic: T6, title: "钳位电路的稳态输出" }, (g) => {
    const Um = g.pick([3, 5, 6, 8, 10]);
    const E = g.pick([0, 0, 1, 2]);
    const Uon = g.pick([0, 0.7]);
    const s = clampSteadyState(Um, E, Uon);
    return {
      prompt: `正峰钳位电路：输入 $u_I=${Um}\\sin\\omega t$ V 经电容 $C$ 接到输出端，输出端对地接二极管（阳极在输出端）${E ? `，二极管阴极经 ${E} V 电源（正极朝上）接地` : "，阴极接地"}，负载 $R$ 满足 $RC\\gg T$。二极管${Uon ? "为硅管（恒压降 0.7 V）" : "为理想二极管"}。求稳态时电容上的电压、输出电压的最大值与最小值。`,
      diagram: E === 0 ? { id: "clamp" } : undefined,
      parts: [num("uC", "$u_C$", s.uC, "V", "V", { tol: 0.02 }), num("max", "$u_{O\\max}$", s.max, "V", "V", { tol: 0.02 }), num("min", "$u_{O\\min}$", s.min, "V", "V", { tol: 0.02, mistakes: [{ value: -Um, message: "整个波形下移了 $u_C$，负峰也一起下移：$u_{O\\min}=-U_m-u_C$。" }] })],
      hints: ["稳态时二极管只在正峰附近短暂导通，把正峰钳在 $E+U_{on}$。", "$u_C=U_m-(E+U_{on})$，$u_O=u_I-u_C$。"],
      solution: `$u_C=${V(s.uC)}$，$u_O$ 在 ${V(s.min)} 到 ${V(s.max)} 之间，峰峰值仍为 ${V(2 * Um)}。`,
    };
  }),
  gen({ id: "dc-g-drop", level: 3, topic: T6, title: "计入导通压降的整流平均值" }, (g) => {
    const U2 = g.pick([3, 5, 6, 9, 12]);
    const kind = g.pick(["half", "bridge"] as const);
    const ex = rectifiedAverageNumeric(U2, kind, 0.7);
    return {
      prompt: `低压整流时二极管压降不可忽略。单相${kind === "half" ? "半波" : "桥式"}整流，$U_2=${U2}$ V（有效值），二极管用恒压降模型（0.7 V），电阻负载。求输出电压平均值（精确到 3%）。`,
      parts: [num("UO", "$U_{O(AV)}$", ex, "V", "V", { mistakes: [{ value: rectifiedAverage(U2, kind), message: "这是理想二极管的结果；本题要计入导通压降。" }, { value: rectifiedAverage(U2, kind) - (kind === "half" ? 0.7 : 1.4), message: "不能直接从平均值中减去管压降：二极管只在 $u_2$ 超过压降时导通，导通角小于 180°，要按截短的正弦波重新积分。" }] })],
      hints: [`${kind === "half" ? "只有 $u_2>0.7$ V 时导通" : "每个半周有两只管子导通，$|u_2|>1.4$ V 时才有输出"}。`, "设导通区间为 $\\theta_1<\\omega t<\\pi-\\theta_1$，其中 $\\sin\\theta_1=U_D/(\\sqrt2U_2)$，对 $(\\sqrt2U_2\\sin\\theta-U_D)$ 积分后除以周期。"],
      solution: `约 ${V(ex)}（理想二极管时为 ${V(rectifiedAverage(U2, kind))}）。`,
    };
  }),
];

export const CH1_QUESTIONS: QuestionTemplate[] = [...carriersQ, ...dopedQ, ...pnQ, ...diodeQ, ...zenerQ, ...dcQ];
