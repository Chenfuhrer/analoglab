/** 第 12 章题库（原创）：整流、滤波、稳压管稳压、串联型稳压 */
import { rectifiedAverage, rectifiedRms, rectifierStress, simulateCapFilter } from "@/simulations/diode/waveforms";
import { limitResistorRange, solveZenerRegulator, zenerRegulationIndex } from "@/simulations/diode/zener";
import { adjustable317, capFilterEstimate, DEFAULT_SR, outputRange, seriesRegulator } from "@/simulations/power/regulator";
import { formatSI, sig } from "@/simulations/units";
import { e12 } from "../generators";
import { choice, concept, gen, judge, num } from "../helpers";
import type { QuestionTemplate } from "../types";

const V = (x: number) => formatSI(x, "V");
const A = (x: number) => formatSI(x, "A");
const R = (x: number) => formatSI(x, "Ω");

/* ═════════════ 整流 ═════════════ */
const T1 = "rectifier";
const rectQ: QuestionTemplate[] = [
  choice({
    id: "rf-c-order",
    topic: T1,
    title: "直流电源的组成顺序",
    prompt: "小功率直流稳压电源的正确组成顺序是：",
    options: ["变压 → 滤波 → 整流 → 稳压", "变压 → 整流 → 滤波 → 稳压", "整流 → 变压 → 稳压 → 滤波", "变压 → 稳压 → 整流 → 滤波"],
    answer: 1,
    why: ["先整流才能滤波。", "正确。", "—", "—"],
    hints: ["交流 → 脉动直流 → 平滑直流 → 稳定直流。"],
  }),
  judge({
    id: "rf-j-diode",
    topic: T1,
    title: "桥式整流的二极管电流",
    prompt: "单相桥式整流电路中，流过每只二极管的平均电流等于负载电流的一半。",
    answer: true,
    why: "正确：每只二极管只在半个周期导通。",
    hints: ["每只管子导通多长时间？"],
  }),
  choice({
    id: "rf-c-open",
    topic: T1,
    title: "桥中一只二极管开路",
    prompt: "单相桥式整流电路中若有一只二极管开路，输出：",
    options: ["为零", "变为半波整流，平均值约减半", "不变", "烧毁变压器"],
    answer: 1,
    why: ["另一半周仍能导通。", "正确。", "—", "二极管**短路**才可能造成变压器副边短路。"],
    hints: ["开路的管子所在的那个半周还有电流通路吗？"],
  }),
  gen({ id: "rf-g-avg", level: 2, topic: T1, title: "整流输出与二极管参数" }, (g) => {
    const kind = g.pick(["half", "bridge"] as const);
    const U2 = g.pick([10, 12, 15, 18, 24]);
    const RL = e12(g.range(20, 500));
    const s = rectifierStress(U2, RL, kind);
    const UO = rectifiedAverage(U2, kind);
    return {
      prompt: `单相${kind === "half" ? "半波" : "桥式"}整流（理想二极管、电阻负载），$U_2=${U2}$ V，$R_L=${R(RL)}$。求 $U_{O(AV)}$、每只二极管的平均电流和最大反向电压。`,
      diagram: { id: kind === "half" ? "half-wave" : "bridge" },
      parts: [
        num("u", "$U_{O(AV)}$", UO, "V", "V", {
          mistakes: [
            { value: rectifiedAverage(U2, kind === "half" ? "bridge" : "half"), tag: "rectifier-type", message: kind === "half" ? "半波整流只有半个周期有输出：系数是 0.45，不是 0.9。" : "桥式整流两个半周都有输出：系数是 0.9，不是 0.45。" },
            { value: Math.SQRT2 * U2, tag: "rms-peak-avg", message: "这是峰值；没有滤波电容时，输出平均值远小于峰值。" },
          ],
        }),
        num("i", "$I_{D(AV)}$", s.ID, "A", "mA", {
          mistakes: [
            kind === "half"
              ? { value: UO / RL / 2, tag: "rectifier-type" as const, message: "半波整流只有一只二极管，它的平均电流就等于负载电流。" }
              : { value: UO / RL, tag: "rectifier-type" as const, message: "桥式整流中每只二极管只在半个周期导通：$I_{D(AV)}=I_{O(AV)}/2$。" },
          ],
        }),
        num("ur", "$U_{RM}$", s.URM, "V", "V", {
          mistakes: [
            { value: U2, tag: "rms-peak-avg", message: "最大反向电压是峰值 $\\sqrt2U_2$，不是有效值。" },
            ...(kind === "bridge" ? [{ value: 2 * Math.SQRT2 * U2, tag: "rectifier-type" as const, message: "$2\\sqrt2U_2$ 是全波（中心抽头）整流的二极管反向电压；桥式整流为 $\\sqrt2U_2$。" }] : []),
          ],
        }),
      ],
      hints: ["半波 0.45、桥式 0.9；桥式二极管电流减半；$U_{RM}=\\sqrt2U_2$。"],
      solution: `$U_{O(AV)}=${V(UO)}$，$I_D=${A(s.ID)}$，$U_{RM}=${V(s.URM)}$。`,
    };
  }),
  gen({ id: "rf-g-u2", level: 2, topic: T1, title: "由输出要求求变压器副边电压" }, (g) => {
    const UO = g.pick([9, 12, 18, 24]);
    const kind = g.pick(["half", "bridge"] as const);
    const U2 = UO / rectifiedAverage(1, kind);
    return {
      prompt: `要求${kind === "half" ? "半波" : "桥式"}整流（无滤波）输出平均电压 ${UO} V，变压器副边电压有效值应为多少？`,
      parts: [
        num("u2", "$U_2$", U2, "V", "V", {
          mistakes: [
            { value: UO / rectifiedAverage(1, kind === "half" ? "bridge" : "half"), tag: "rectifier-type", message: kind === "half" ? "半波整流 $U_{O(AV)}\\approx0.45U_2$，所以 $U_2=U_O/0.45$。" : "桥式整流 $U_{O(AV)}\\approx0.9U_2$，所以 $U_2=U_O/0.9$。" },
            { value: UO / 1.2, tag: "rectifier-type", message: `1.2 是**电容滤波**时的估算系数；本题无滤波，系数是 ${kind === "half" ? "0.45" : "0.9"}。` },
            { value: UO / Math.SQRT2, tag: "rms-peak-avg", message: `无滤波时输出平均值不是峰值：$U_{O(AV)}=${kind === "half" ? "0.45" : "0.9"}U_2$。` },
          ],
        }),
      ],
      hints: ["$U_{O(AV)}=0.45U_2$ 或 $0.9U_2$。"],
      solution: `$U_2=${V(U2)}$。`,
    };
  }),
  gen({ id: "rf-g-select", level: 2, topic: T1, title: "整流二极管的选择" }, (g) => {
    const U2 = g.pick([15, 20, 30]);
    const IO = g.pick([0.5, 1, 2]);
    const RL = rectifiedAverage(U2, "bridge") / IO;
    const s = rectifierStress(U2, RL, "bridge");
    return {
      prompt: `桥式整流，$U_2=${U2}$ V，负载电流 ${IO} A。考虑电网电压波动 +10%，二极管的最大整流电流与最高反向工作电压至少应为多少？`,
      parts: [num("i", "$I_F$", 1.1 * s.ID, "A", "A", { alts: [s.ID], tol: 0.05 }), num("u", "$U_R$", 1.1 * s.URM, "V", "V", { alts: [s.URM], tol: 0.05 })],
      hints: ["$I_D=I_O/2$，$U_{RM}=\\sqrt2U_2$，再乘 1.1。"],
      solution: `$I_F\\ge${A(1.1 * s.ID)}$，$U_R\\ge${V(1.1 * s.URM)}$。`,
    };
  }),
  gen({ id: "rf-g-fault", level: 3, topic: T1, title: "故障分析" }, (g) => {
    const U2 = g.pick([10, 20]);
    const fault = g.pick(["open", "normal"] as const);
    const UO = fault === "open" ? rectifiedAverage(U2, "half") : rectifiedAverage(U2, "bridge");
    return {
      prompt: `桥式整流电路 $U_2=${U2}$ V（电阻负载，无滤波）。测得输出平均电压为 ${V(UO)}。电路是否正常？（正常填 1，有一只二极管开路填 0）`,
      parts: [num("ok", "判断", fault === "open" ? 0 : 1, "1", "1", { tol: 0.01 })],
      hints: ["正常值 $0.9U_2$，变为半波时约 $0.45U_2$。"],
      solution: fault === "open" ? `输出只有 $0.45U_2$，有一只二极管开路，成了半波整流。` : `输出 $0.9U_2$，正常。`,
    };
  }),
  gen({ id: "rf-g-ripple", level: 3, topic: T1, title: "整流输出的交流分量" }, (g) => {
    const U2 = g.pick([10, 20]);
    const kind = g.pick(["half", "bridge"] as const);
    const rms = rectifiedRms(U2, kind);
    const avg = rectifiedAverage(U2, kind);
    const ac = Math.sqrt(rms * rms - avg * avg);
    return {
      prompt: `${kind === "half" ? "半波" : "桥式"}整流（理想、无滤波），$U_2=${U2}$ V。输出电压的有效值为 ${V(rms)}，求其中交流分量的有效值与纹波系数 $\\gamma=U_{\\sim}/U_{O(AV)}$。`,
      parts: [num("ac", "$U_{\\sim}$", ac, "V", "V", { tol: 0.02 }), num("g", "$\\gamma$", ac / avg, "1", "0.48", { tol: 0.02 })],
      hints: ["$U^2=U_{O(AV)}^2+U_{\\sim}^2$。"],
      solution: `$U_{\\sim}=${V(ac)}$，$\\gamma=${sig(ac / avg, 3)}$——必须滤波。`,
    };
  }),
  concept({
    id: "rf-k-bridge",
    level: 3,
    topic: T1,
    title: "桥式整流的优点",
    prompt: "与半波整流相比，桥式整流有哪些优点？",
    keyPoints: ["输出平均值加倍（0.9U₂）", "脉动小（纹波频率为 2f）", "变压器副边在两个半周都有电流，利用率高，无直流磁化", "二极管反向电压仍为 √2U₂"],
    reference: "桥式整流两个半周都有输出，平均值为 $0.9U_2$，是半波的两倍；纹波频率为电源频率的 2 倍，脉动小、易滤波；变压器副边正负半周都有电流，利用率高；每只二极管承受的最大反向电压仍为 $\\sqrt2U_2$。",
  }),
];

/* ═════════════ 滤波 ═════════════ */
const T2 = "ripple-filter";
const filterQ: QuestionTemplate[] = [
  choice({
    id: "cf-c-open",
    topic: T2,
    title: "电容滤波空载输出",
    prompt: "桥式整流电容滤波电路负载开路时，输出电压约为：",
    options: ["$0.9U_2$", "$1.2U_2$", "$\\sqrt2U_2$", "$0.45U_2$"],
    answer: 2,
    why: ["无电容时。", "带合适负载时。", "正确：电容充到峰值后不放电。", "—"],
    hints: ["空载时电容会放电吗？"],
  }),
  judge({
    id: "cf-j-current",
    topic: T2,
    title: "电容滤波的二极管电流",
    prompt: "加电容滤波后，整流二极管的导通时间变短，峰值电流变大。",
    answer: true,
    why: "正确：二极管只在 $u_2$ 高于电容电压时导通，要在短时间内补足整个周期放掉的电荷。",
    hints: ["二极管什么时候导通？"],
  }),
  choice({
    id: "cf-c-heavy",
    topic: T2,
    title: "大电流负载的滤波",
    prompt: "负载电流很大（几安以上）的整流电路，宜采用：",
    options: ["电容滤波", "电感滤波", "不滤波", "RC 滤波"],
    answer: 1,
    why: ["电流大时电容放电快，纹波大，冲击电流也大。", "正确：负载电流越大，电感滤波效果越好。", "—", "电阻上压降和损耗太大。"],
    hints: ["电感阻碍什么的变化？"],
  }),
  gen({ id: "cf-g-uo", level: 2, topic: T2, title: "电容滤波的输出电压" }, (g) => {
    const U2 = g.pick([10, 12, 15, 18, 20]);
    const RL = g.pick([Infinity, 100, 200]);
    const UO = capFilterEstimate(U2, RL, 1).UO;
    return {
      prompt: `桥式整流电容滤波电路，$U_2=${U2}$ V，${Number.isFinite(RL) ? `负载 $R_L=${R(RL)}$ 且满足 $R_LC\\ge(3\\sim5)T/2$` : "负载开路"}。估算输出电压。`,
      diagram: { id: "cap-filter" },
      parts: [
        num("u", "$U_{O(AV)}$", UO, "V", "V", {
          tol: 0.03,
          mistakes: [
            { value: 0.9 * U2, tag: "rectifier-type", message: "接了滤波电容，输出接近峰值：带载时 $U_O\\approx1.2U_2$，空载时 $U_O=\\sqrt2U_2$；$0.9U_2$ 是无滤波的结果。" },
            Number.isFinite(RL)
              ? { value: Math.SQRT2 * U2, tag: "rectifier-type" as const, message: "带负载时电容会放电，$U_O\\approx1.2U_2$；$\\sqrt2U_2$ 只在空载时成立。" }
              : { value: 1.2 * U2, tag: "rectifier-type" as const, message: "负载开路时电容不放电，$U_O=\\sqrt2U_2$；$1.2U_2$ 是带载时的估算。" },
          ],
        }),
      ],
      hints: ["带载：$\\approx1.2U_2$；空载：$\\sqrt2U_2$。"],
      solution: `$U_{O(AV)}\\approx${V(UO)}$。`,
    };
  }),
  gen({ id: "cf-g-c", level: 2, topic: T2, title: "滤波电容的选择" }, (g) => {
    const RL = g.pick([50, 100, 200, 500]);
    const k = g.pick([3, 4, 5]);
    const C = (k * 0.01) / RL; // R_LC = k·T/2，T = 20 ms
    return {
      prompt: `50 Hz 电网，桥式整流电容滤波，负载 $R_L=${R(RL)}$。按 $R_LC=${k}\\cdot\\frac T2$ 选电容，C 为多少？`,
      parts: [num("c", "$C$", C, "F", "µF", { mistakes: [{ value: 2 * C, tag: "rectifier-type", message: "桥式整流的放电间隔是 $T/2=10$ ms（纹波频率 100 Hz），不是 $T$。" }] })],
      hints: ["$T=20$ ms，$C=\\dfrac{k\\,T/2}{R_L}$。"],
      solution: `$C=${formatSI(C, "F")}$（取标称值，耐压 > $\\sqrt2U_2$）。`,
    };
  }),
  gen({ id: "cf-g-ripple", level: 2, topic: T2, title: "纹波估算" }, (g) => {
    const U2 = g.pick([12, 15, 18]);
    const RL = g.pick([50, 100, 200]);
    const C = g.pick([470, 1000, 2200]) * 1e-6;
    const e = capFilterEstimate(U2, RL, C);
    return {
      prompt: `桥式整流电容滤波，$U_2=${U2}$ V，$R_L=${R(RL)}$，$C=${formatSI(C, "F")}$，电网 50 Hz。用 $U_O\\approx1.2U_2$ 与 $\\Delta U\\approx I_O/(2fC)$ 估算纹波峰峰值。`,
      parts: [num("r", "$\\Delta U$", e.ripple, "V", "V", { tol: 0.03, mistakes: [{ value: e.ripple * 2, tag: "rectifier-type", message: "桥式整流纹波频率是 100 Hz，放电时间约为 10 ms：$\\Delta U\\approx I_O/(2fC)$。" }] })],
      hints: ["$I_O=1.2U_2/R_L$。"],
      solution: `$I_O=${A(e.UO / RL)}$，$\\Delta U\\approx${V(e.ripple)}$。`,
    };
  }),
  gen({ id: "cf-g-sim", level: 3, topic: T2, title: "时域仿真与估算的对照" }, (g) => {
    const U2 = g.pick([12, 15]);
    const C = g.pick([470, 1000, 2200]) * 1e-6;
    const RL = g.pick([50, 100]);
    const sim = simulateCapFilter({ U2rms: U2, C, RL, Uon: 0.7, Rs: 1, periods: 10, steps: 400 });
    return {
      prompt: `桥式整流电容滤波，$U_2=${U2}$ V、$C=${formatSI(C, "F")}$、$R_L=${R(RL)}$，二极管压降 0.7 V、绕组等效内阻 1 Ω。时域仿真得到稳态输出平均值 ${V(sim.UOavg)}。它比 $1.2U_2$ 低了百分之几？（填相对偏差）`,
      parts: [num("d", "$(1.2U_2-U_O)/(1.2U_2)$", (1.2 * U2 - sim.UOavg) / (1.2 * U2), "1", "5%", { tol: 0.05 })],
      hints: ["偏差来自两只二极管 1.4 V 压降、内阻压降和放电。"],
      solution: `偏差约 ${sig(((1.2 * U2 - sim.UOavg) / (1.2 * U2)) * 100, 3)}%。$1.2U_2$ 是理想估算。`,
    };
  }),
  gen({ id: "cf-g-peak", level: 3, topic: T2, title: "二极管导通角" }, (g) => {
    const C = g.pick([220, 1000, 4700]) * 1e-6;
    const sim = simulateCapFilter({ U2rms: 15, C, RL: 100, Uon: 0.7, Rs: 1, periods: 10, steps: 400 });
    return {
      prompt: `桥式整流电容滤波 $U_2=15$ V、$R_L=100\\,\\Omega$、$C=${formatSI(C, "F")}$（仿真条件同上题）。仿真得到整流桥在一个周期内有电流的时间占比为多少？（百分数）`,
      parts: [num("c", "导通时间占比", sim.conduction, "1", "20%", { tol: 0.1 })],
      hints: ["电容越大，纹波越小，二极管导通时间越短。"],
      solution: `约 ${sig(sim.conduction * 100, 3)}%，峰值电流约 ${A(sim.iDpeak)}（平均负载电流约 ${A(sim.UOavg / 100)}）。`,
    };
  }),
  concept({
    id: "cf-k-why",
    level: 3,
    topic: T2,
    title: "1.2U₂ 的由来",
    prompt: "解释桥式整流电容滤波输出约为 $1.2U_2$ 的原因，并说明这一估算的条件。",
    keyPoints: ["电容在峰值附近充到约 √2U₂", "其余时间经 R_L 放电，输出在峰值与谷值之间", "R_LC 远大于半周期时放电少，平均值约 1.2U₂（介于 0.9U₂ 与 1.4U₂ 之间）", "条件：R_LC ≥ (3~5)T/2"],
    reference: "二极管导通时电容被充到接近 $\\sqrt2U_2\\approx1.41U_2$，截止期间经负载放电；若放电时间常数 $R_LC$ 为半个周期的 3～5 倍以上，电压下降不多，平均值约为 $1.2U_2$。$R_L$ 越大（负载越轻）、C 越大，输出越接近 $\\sqrt2U_2$；无电容时为 $0.9U_2$。",
  }),
];

/* ═════════════ 稳压管稳压 ═════════════ */
const T3 = "zener-regulator";
const zrQ: QuestionTemplate[] = [
  choice({
    id: "zr-c-ro",
    topic: T3,
    title: "稳压管稳压电路的输出电阻",
    prompt: "稳压管稳压电路的输出电阻约等于：",
    options: ["限流电阻 R", "稳压管的动态电阻 $r_z$", "负载电阻", "无穷大"],
    answer: 1,
    why: ["R 与 $r_z$ 并联，$r_z\\ll R$。", "正确。", "—", "—"],
    hints: ["从输出端看进去，$r_z$ 与 R 是什么关系？"],
  }),
  judge({
    id: "zr-j-load",
    topic: T3,
    title: "负载变化时的稳压",
    prompt: "稳压管稳压电路中，负载电流增大时，稳压管电流相应减小，使限流电阻上的电流基本不变。",
    answer: true,
    why: "正确：$I_R=I_Z+I_L$ 基本不变，$R$ 上的压降不变，输出稳定。",
    hints: ["$U_O$ 稍降 → $I_Z$ 怎样变化？"],
  }),
  choice({
    id: "zr-c-limit",
    topic: T3,
    title: "适用场合",
    prompt: "稳压管稳压电路的主要局限是：",
    options: ["不能稳压", "输出电流小、输出电压不可调、稳压效果有限", "效率极高", "需要运放"],
    answer: 1,
    why: ["能稳压。", "正确：负载电流受 $I_{ZM}-I_{Z\\min}$ 限制，$U_O=U_Z$ 固定。", "效率不高。", "不需要。"],
    hints: ["负载电流的变化范围受什么限制？"],
  }),
  gen({ id: "zr-g-range", level: 2, topic: T3, title: "限流电阻范围（含电网波动）" }, (g) => {
    const UZ = g.pick([5, 6, 9, 12]);
    const UI = Math.round(UZ * g.range(1.7, 2.3));
    const ILmax = g.pick([10, 15, 20]) * 1e-3;
    const IZM = g.pick([40, 50, 60]) * 1e-3;
    const r = limitResistorRange(UI * 0.9, UI * 1.1, 0, ILmax, { UZ, IZmin: 5e-3, IZM });
    return {
      prompt: `稳压管稳压电路：整流滤波输出 $U_I=${UI}$ V（电网波动 ±10%），$U_Z=${UZ}$ V，$I_{Z\\min}=5$ mA，$I_{ZM}=${sig(IZM * 1e3, 2)}$ mA，负载电流 0～${sig(ILmax * 1e3, 2)} mA。求 R 的范围。`,
      diagram: { id: "zener-reg" },
      parts: [
        num("a", "$R_{\\min}$", r.Rmin, "Ω", "Ω", { mistakes: [{ value: (UI - UZ) / IZM, tag: "worst-case", message: "求 $R_{\\min}$ 要用最高输入电压 $1.1U_I$（此时稳压管电流最大）。" }] }),
        num("b", "$R_{\\max}$", r.Rmax, "Ω", "Ω", {
          mistakes: [
            { value: (UI * 0.9 - UZ) / ILmax, tag: "kcl-split", message: "还要给稳压管留出 $I_{Z\\min}$：$R_{\\max}=\\dfrac{U_{I\\min}-U_Z}{I_{Z\\min}+I_{L\\max}}$。" },
          ],
        }),
      ],
      hints: ["$U_{I\\max}=1.1U_I$，$U_{I\\min}=0.9U_I$。"],
      solution: `$${sig(r.Rmin, 3)}\\,\\Omega\\le R\\le${sig(r.Rmax, 3)}\\,\\Omega$${r.feasible ? "" : "（无解）"}。`,
    };
  }),
  gen({ id: "zr-g-sr", level: 2, topic: T3, title: "稳压系数" }, (g) => {
    const rz = g.pick([5, 10, 20]);
    const R0 = g.pick([200, 300, 500]);
    const z = { UZ: 6, rz, IZt: 10e-3, IZmin: 1e-3, IZM: 100e-3 };
    const idx = zenerRegulationIndex(15, R0, 1e3, z);
    return {
      prompt: `稳压管 $U_Z=6$ V、$r_z=${rz}\\,\\Omega$，$U_I=15$ V，$R=${R(R0)}$，$R_L=1$ kΩ。求稳压系数 $S_r$ 与输出电阻 $R_o$。`,
      parts: [num("s", "$S_r$", idx.Sr, "1", "0.1", { tol: 0.04 }), num("r", "$R_o$", idx.Ro, "Ω", "Ω", { tol: 0.02 })],
      hints: ["$S_r\\approx\\dfrac{r_z\\para R_L}{R+r_z\\para R_L}\\cdot\\dfrac{U_I}{U_O}$，$R_o\\approx r_z\\para R$。"],
      solution: `$S_r\\approx${sig(idx.Sr, 3)}$，$R_o\\approx${R(idx.Ro)}$。`,
    };
  }),
  gen({ id: "zr-g-dU", level: 2, topic: T3, title: "输入变化引起的输出变化" }, (g) => {
    const rz = g.pick([5, 10, 20]);
    const R0 = g.pick([200, 470]);
    const dUI = g.pick([1, 2, 3]);
    const z = { UZ: 6, rz, IZt: 10e-3, IZmin: 1e-3, IZM: 200e-3 };
    const a = solveZenerRegulator(15, R0, 1e3, z);
    const b = solveZenerRegulator(15 + dUI, R0, 1e3, z);
    return {
      prompt: `稳压管稳压电路 $U_Z=6$ V、$r_z=${rz}\\,\\Omega$，$R=${R(R0)}$，$R_L=1$ kΩ，$U_I$ 由 15 V 升高到 ${15 + dUI} V。输出电压变化多少？`,
      parts: [num("d", "$\\Delta U_O$", b.UO - a.UO, "V", "mV", { tol: 0.03 })],
      hints: ["小信号：$\\Delta U_O=\\Delta U_I\\dfrac{r_z\\para R_L}{R+r_z\\para R_L}$。"],
      solution: `$\\Delta U_O\\approx${formatSI(b.UO - a.UO, "V")}$。`,
    };
  }),
  gen({ id: "zr-g-design", level: 3, topic: T3, title: "设计稳压管稳压电路" }, (g) => {
    const UO = g.pick([5, 6, 9]);
    const IL = g.pick([10, 20]) * 1e-3;
    const UI = Math.round(UO * 2);
    const IZM = g.pick([40, 60]) * 1e-3;
    const r = limitResistorRange(UI * 0.9, UI * 1.1, 0, IL, { UZ: UO, IZmin: 5e-3, IZM });
    const Rm = r.Rmax;
    const P = UO * (UI * 1.1 - UO) / Rm;
    return {
      prompt: `设计 ${UO} V 稳压电源：$U_I=${UI}$ V（±10%），负载电流 0～${sig(IL * 1e3, 2)} mA，选 $U_Z=${UO}$ V、$I_{Z\\min}=5$ mA、$I_{ZM}=${sig(IZM * 1e3, 2)}$ mA 的稳压管。取 R 为允许的最大值，求 R 与空载、输入最高时稳压管的功耗。`,
      parts: [num("r", "$R$", Rm, "Ω", "Ω", { tol: 0.02 }), num("p", "$P_Z$", P, "W", "mW", { tol: 0.03 })],
      hints: ["$R_{\\max}=\\frac{U_{I\\min}-U_Z}{I_{Z\\min}+I_{L\\max}}$。", "空载：$I_Z=(U_{I\\max}-U_Z)/R$，$P_Z=U_ZI_Z$。"],
      solution: `$R=${R(Rm)}$，$P_Z\\approx${formatSI(P, "W")}$${r.feasible ? "" : "（注意：此时 $R_{\\min}>R_{\\max}$，需换更大功率的稳压管）"}。`,
    };
  }),
  gen({ id: "zr-g-maxIL", level: 3, topic: T3, title: "允许的最大负载电流" }, (g) => {
    const UZ = 6;
    const UImin = g.pick([9, 10, 12]);
    const R0 = g.pick([150, 200, 270]);
    const IL = (UImin - UZ) / R0 - 5e-3;
    return {
      prompt: `稳压管稳压电路 $U_Z=6$ V、$I_{Z\\min}=5$ mA，$R=${R(R0)}$，输入最低 ${UImin} V。负载电流最大允许多少？`,
      parts: [num("i", "$I_{L\\max}$", IL, "A", "mA", { mistakes: [{ value: (UImin - UZ) / R0, tag: "kcl-split", message: "还要留出 $I_{Z\\min}$ 给稳压管。" }] })],
      hints: ["$I_{L\\max}=\\frac{U_{I\\min}-U_Z}{R}-I_{Z\\min}$。"],
      solution: `$I_{L\\max}=${A(IL)}$。`,
    };
  }),
  concept({
    id: "zr-k-index",
    level: 3,
    topic: T3,
    title: "两个稳压指标",
    prompt: "说明稳压系数与输出电阻的含义，以及怎样改善稳压管稳压电路的这两个指标。",
    keyPoints: ["S_r：输入相对变化引起的输出相对变化，衡量对电网波动的抑制", "R_o：负载电流变化引起的输出电压变化，衡量带负载能力", "二者都与 r_z 成正比，选 r_z 小的稳压管", "增大 R 可减小 S_r，但受 R_max 限制；更好的办法是串联型稳压"],
    reference: "稳压系数 $S_r=(\\Delta U_O/U_O)/(\\Delta U_I/U_I)$ 反映对输入波动的抑制；输出电阻 $R_o=\\Delta U_O/\\Delta I_O$ 反映带负载能力，约等于 $r_z$。选用动态电阻小的稳压管、在允许范围内增大限流电阻可以改善，但根本办法是加入放大环节构成串联型稳压电路。",
  }),
];

/* ═════════════ 串联型稳压 ═════════════ */
const T4 = "series-regulator";
const srQ: QuestionTemplate[] = [
  choice({
    id: "sr-c-fb",
    topic: T4,
    title: "串联型稳压电路的反馈类型",
    prompt: "串联型稳压电路本质上引入了：",
    options: ["电压串联负反馈", "电流并联负反馈", "正反馈", "电压并联负反馈"],
    answer: 0,
    why: ["正确：采样输出电压，与基准在放大器两端比较。", "—", "—", "反馈与基准接在放大器的不同输入端，是串联。"],
    hints: ["采样取自什么？在哪里比较？"],
  }),
  choice({
    id: "sr-c-pass",
    topic: T4,
    title: "调整管的工作区",
    prompt: "串联型稳压电路正常工作时，调整管工作在：",
    options: ["饱和区", "放大区", "截止区", "开关状态"],
    answer: 1,
    why: ["饱和后无法调节。", "正确：靠改变 $U_{CE}$ 稳压。", "—", "那是开关稳压电源。"],
    hints: ["调整管怎样“调整”输出？"],
  }),
  judge({
    id: "sr-j-min",
    topic: T4,
    title: "输出电压能否低于基准",
    prompt: "图示串联型稳压电路（采样电阻分压后与 $U_Z$ 比较），输出电压可以调到低于稳压管电压 $U_Z$。",
    answer: false,
    why: "错误。$U_O=U_Z/F$，而采样系数 $F\\le1$，所以 $U_O\\ge U_Z$。",
    hints: ["写出 $U_O$ 与 $U_Z$、F 的关系。"],
    diagram: { id: "series-reg" },
  }),
  gen({ id: "sr-g-range", level: 2, topic: T4, title: "输出电压调节范围" }, (g) => {
    const UZ = g.pick([4.7, 5.1, 6, 6.2]);
    const R1 = e12(g.range(500, 3e3));
    const RP = e12(g.range(500, 3e3));
    const R2 = e12(g.range(500, 3e3));
    const r = outputRange({ UZ, R1, RP, R2 });
    return {
      prompt: `串联型稳压电路 $U_Z=${UZ}$ V，采样电阻 $R_1=${R(R1)}$（上）、$R_P=${R(RP)}$（电位器）、$R_2=${R(R2)}$（下）。求输出电压的调节范围。`,
      diagram: { id: "series-reg", labels: { R1: R(R1), R2: R(R2) } },
      parts: [num("a", "$U_{O\\min}$", r.min, "V", "V"), num("b", "$U_{O\\max}$", r.max, "V", "V", { mistakes: [{ value: (UZ * (R1 + RP + R2)) / (R2 + RP), tag: "worst-case", message: "滑动端在最下端时 $R_P''=0$，$U_{O\\max}=U_Z(R_1+R_P+R_2)/R_2$。" }] })],
      hints: ["$U_O=\\dfrac{R_1+R_P+R_2}{R_2+R_P''}U_Z$。"],
      solution: `$${sig(r.min, 3)}$ V～$${sig(r.max, 3)}$ V。`,
    };
  }),
  gen({ id: "sr-g-pt", level: 2, topic: T4, title: "调整管功耗" }, (g) => {
    const k = g.pick([0, 0.5, 1]);
    const UI = g.pick([20, 24, 28]);
    const RL = g.pick([20, 50, 100]);
    const res = seriesRegulator(UI, RL, { ...DEFAULT_SR, k });
    return {
      prompt: `串联型稳压电路（$U_Z=6$ V，$R_1=R_P=R_2=1$ kΩ，放大器增益很大），电位器滑动端${k === 0 ? "在最下端" : k === 1 ? "在最上端" : "在中点"}，$U_I=${UI}$ V，$R_L=${R(RL)}$。求 $U_O$、负载电流与调整管功耗。`,
      parts: [num("u", "$U_O$", res.UO, "V", "V", { tol: 0.01 }), num("i", "$I_L$", res.IL, "A", "mA", { tol: 0.01 }), num("p", "$P_C$", res.PT, "W", "W", {
          tol: 0.02,
          mistakes: [
            { value: UI * res.IL, tag: "kvl-loop", message: "调整管上的电压是 $U_{CE}=U_I-U_O$，不是 $U_I$。" },
            { value: res.UO * res.IL, tag: "power-balance", message: "这是负载得到的功率；调整管功耗是 $P_C=(U_I-U_O)I_L$。" },
          ],
        })],
      hints: ["$U_O\\approx U_Z/F$，$P_C=(U_I-U_O)I_L$。"],
      solution: `$U_O=${V(res.UO)}$，$I_L=${A(res.IL)}$，$P_C=${formatSI(res.PT, "W")}$。`,
    };
  }),
  gen({ id: "sr-g-317", level: 2, topic: T4, title: "LM317 输出电压" }, (g) => {
    const R1 = g.pick([120, 240]);
    const R2 = e12(g.range(200, 5e3));
    const UO = adjustable317(R1, R2, 1.25, 0);
    return {
      prompt: `LM317 可调稳压器，输出端与调整端之间 $R_1=${R1}\\,\\Omega$，调整端对地 $R_2=${R(R2)}$，基准 1.25 V，忽略调整端电流。求输出电压。`,
      parts: [
        num("u", "$U_O$", UO, "V", "V", {
          mistakes: [
            { value: 1.25 * (R2 / R1), tag: "opamp-config", message: "$U_O=1.25\\left(1+\\dfrac{R_2}{R_1}\\right)$ V，别漏了“1+”。" },
            { value: 1.25 * (1 + R1 / R2), tag: "ratio-inverted", message: "$R_1$ 接在输出端与调整端之间，流过它的电流是 $1.25\\,\\mathrm V/R_1$，所以是 $R_2/R_1$，别倒过来。" },
          ],
        }),
      ],
      hints: ["$U_O=1.25(1+R_2/R_1)$。"],
      solution: `$U_O=${V(UO)}$。`,
    };
  }),
  gen({ id: "sr-g-dropout", level: 3, topic: T4, title: "最低输入电压" }, (g) => {
    const k = g.pick([0, 0.5]);
    const spec = { ...DEFAULT_SR, k, Udrop: g.pick([1, 2]) };
    const UO = seriesRegulator(30, 100, spec).UOideal;
    // 最低输入：U_O + U_BE + U_drop
    let lo = 0;
    let hi = 60;
    for (let i = 0; i < 100; i++) {
      const mid = (lo + hi) / 2;
      if (seriesRegulator(mid, 100, spec).regulating) hi = mid;
      else lo = mid;
    }
    return {
      prompt: `串联型稳压电路输出 ${V(UO)}，调整管 $U_{BE}=0.7$ V，比较放大器输出至少比 $U_I$ 低 ${spec.Udrop} V。要保持稳压，$U_I$ 最低为多少？`,
      parts: [num("u", "$U_{I\\min}$", hi, "V", "V", { tol: 0.01 })],
      hints: ["放大器输出 $u_B=U_O+U_{BE}$，又要求 $u_B\\le U_I-U_{drop}$。"],
      solution: `$U_{I\\min}\\approx${V(hi)}$。`,
    };
  }),
  gen({ id: "sr-g-select", level: 3, topic: T4, title: "调整管的选择" }, (g) => {
    const UImax = g.pick([24, 28, 32]);
    const range = outputRange(DEFAULT_SR);
    const ILmax = g.pick([0.5, 1]);
    return {
      prompt: `串联型稳压电路输出 ${sig(range.min, 3)}～${sig(range.max, 3)} V 可调，最大负载电流 ${ILmax} A，输入电压最高 ${UImax} V。按“最坏情况”估算调整管的最大功耗。`,
      parts: [num("p", "$P_{C\\max}$", (UImax - range.min) * ILmax, "W", "W", { tol: 0.02, mistakes: [{ value: (UImax - range.max) * ILmax, tag: "worst-case", message: "最坏情况是输出调到**最低**时，调整管压降最大。" }] })],
      hints: ["$P_C=(U_{I\\max}-U_{O\\min})I_{L\\max}$。"],
      solution: `$P_{C\\max}=(${UImax}-${sig(range.min, 3)})\\times${ILmax}=${formatSI((UImax - range.min) * ILmax, "W")}$，需加散热器。`,
    };
  }),
  concept({
    id: "sr-k-process",
    level: 3,
    topic: T4,
    title: "串联型稳压的稳压过程",
    prompt: "以负载电阻增大为例，写出串联型稳压电路的稳压过程，并说明为什么它比稳压管稳压电路好。",
    keyPoints: ["R_L↑ → U_O↑ → 采样电压 FU_O↑", "比较放大器输入 U_Z − FU_O↓ → 输出 u_B↓", "调整管 U_BE↓、U_CE↑ → U_O↓，回到原值", "放大器增益使反馈很深，输出电阻 ≈ (r_be/(1+β))/(1+AF)，远小于 r_z；输出电压可调、电流大"],
    reference: "$R_L\\uparrow\\to U_O\\uparrow\\to FU_O\\uparrow\\to$ 放大器输出 $u_B\\downarrow\\to I_C\\downarrow$、$U_{CE}\\uparrow\\to U_O\\downarrow$。这是深度电压串联负反馈：放大器把微小的误差放大后控制调整管，输出电阻比稳压管电路小几个数量级；负载电流由调整管提供，可以很大；改变采样比即可调节输出电压。",
  }),
];

export const CH12_QUESTIONS: QuestionTemplate[] = [...rectQ, ...filterQ, ...zrQ, ...srQ];
