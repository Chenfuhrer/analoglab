/** 第 4 章题库（原创）：MOSFET 结构、特性、跨导、共源/共漏/共栅 */
import { analyzeCD, analyzeCG, analyzeCS, DEFAULT_CS, DEFAULT_CS_SELF, drainCurrent, FET_REGION_LABEL, fetRegion, gmTextbook, outputResistance, solveFETQ, transferCurrent, type FETAmpParams, type FETParams, type FETRegion } from "@/simulations/fet/mos";
import { formatSI, par, sig } from "@/simulations/units";
import { bjtGm, followerGain, rbeOf } from "@/simulations/bjt/stages";
import { e12 } from "../generators";
import { choice, concept, gen, judge, num, type Rng } from "../helpers";
import type { QuestionTemplate } from "../types";

const V = (x: number) => formatSI(x, "V");
const A = (x: number) => formatSI(x, "A");
const R = (x: number) => formatSI(x, "Ω");
const mS = (x: number) => `${sig(x * 1e3, 3)}\\,\\mathrm{mS}`;

function enhFet(g: Rng): FETParams {
  return { kind: "n-enh", Vt: g.pick([1, 1.5, 2, 2.5, 3]), Iref: g.pick([1, 2, 3, 4, 5]) * 1e-3, lambda: 0 };
}
function depFet(g: Rng): FETParams {
  return { kind: g.pick(["n-dep", "n-jfet"] as const), Vt: -g.pick([1.5, 2, 3, 4]), Iref: g.pick([2, 4, 6, 8, 10]) * 1e-3, lambda: 0 };
}

function makeCS(g: Rng, kind: "divider" | "self"): FETAmpParams {
  for (let k = 0; k < 150; k++) {
    let a: FETAmpParams;
    if (kind === "divider") {
      const fet = enhFet(g);
      const VDD = g.pick([12, 15, 18, 20]);
      const Rg1 = e12(g.range(50e3, 300e3));
      const Rg2 = e12(Rg1 * g.range(1.5, 4));
      a = { ...DEFAULT_CS, fet, VDD, Rg1, Rg2, Rg3: g.pick([0, 1e6, 2e6]), Rd: e12(g.range(1e3, 10e3)), Rs: e12(g.range(300, 3e3)), RL: e12(g.range(5e3, 50e3)), bypass: true };
    } else {
      const fet = depFet(g);
      a = { ...DEFAULT_CS_SELF, fet, VDD: g.pick([12, 15, 18]), Rg: g.pick([1e6, 2e6]), Rd: e12(g.range(1e3, 6e3)), Rs: e12(g.range(200, 2e3)), RL: e12(g.range(5e3, 50e3)), bypass: true };
    }
    const q = solveFETQ(a);
    if (q.region === "saturation" && q.IDQ > 0.2e-3 && q.UDSQ > 0.2 * a.VDD && q.UDSQ < 0.75 * a.VDD) return a;
  }
  return kind === "divider" ? DEFAULT_CS : DEFAULT_CS_SELF;
}

/* ═════════════ MOSFET 结构 ═════════════ */
const T1 = "mos-structure";
const structQ: QuestionTemplate[] = [
  choice({
    id: "ms-c-ctrl",
    topic: T1,
    title: "场效应管的控制方式",
    prompt: "场效应管是一种：",
    options: ["电流控制电流的器件", "电压控制电流的器件", "电流控制电压的器件", "双极型器件"],
    answer: 1,
    why: ["那是晶体管（BJT）。", "正确：栅源电压控制漏极电流，栅极几乎不取电流。", "—", "FET 只有多子导电，是单极型器件。"],
    hints: ["栅极电流有多大？"],
  }),
  choice({
    id: "ms-c-symbol",
    topic: T1,
    title: "由符号判断类型",
    prompt: "MOS 管符号中，沟道画成三段虚线、衬底箭头指向沟道，该管是：",
    options: ["N 沟道增强型", "N 沟道耗尽型", "P 沟道增强型", "P 沟道耗尽型"],
    answer: 0,
    why: ["正确：虚线 = 增强型（零栅压无沟道）；箭头指向沟道 = N 沟道（P 衬底→N 沟道，PN 结方向）。", "耗尽型沟道画成实线。", "P 沟道箭头背离沟道。", "两处都不对。"],
    hints: ["虚线/实线区分什么？箭头方向区分什么？"],
    diagram: { id: "fet-symbols" },
  }),
  judge({
    id: "ms-j-self",
    topic: T1,
    title: "自给偏压的适用范围",
    prompt: "N 沟道增强型 MOS 管可以采用自给偏压电路。",
    answer: false,
    why: "错误。自给偏压使 $U_{GS}=-I_DR_s\\le0$，而增强型 N 沟道管需要 $U_{GS}>U_{GS(th)}>0$ 才导通，二者矛盾。",
    hints: ["自给偏压下栅源电压的符号是什么？"],
  }),
  gen({ id: "ms-g-type", level: 2, topic: T1, title: "由开启/夹断电压与电流判断管型" }, (g) => {
    const cases: Array<[string, string, number]> = [
      ["$u_{GS}=0$ 时 $i_D=0$；$u_{GS}=3$ V 时有漏极电流", "N 沟道增强型 MOS", 0],
      ["$u_{GS}=0$ 时 $i_D=4$ mA；$u_{GS}=-2$ V 时 $i_D=0$；$u_{GS}=+1$ V 时 $i_D$ 增大", "N 沟道耗尽型 MOS", 1],
      ["$u_{GS}=0$ 时 $i_D=5$ mA；$u_{GS}=-3$ V 时 $i_D=0$；栅源不允许加正电压", "N 沟道结型 FET", 2],
      ["$u_{GS}=0$ 时 $i_D=0$；$u_{GS}=-4$ V 时 $|i_D|$=2 mA（电流从源极流向漏极）", "P 沟道增强型 MOS", 3],
    ];
    const c = g.pick(cases);
    const opts = ["N 沟道增强型 MOS", "N 沟道耗尽型 MOS", "N 沟道结型 FET", "P 沟道增强型 MOS"];
    return {
      prompt: `某场效应管的测试结果：${c[0]}。它是：`,
      choice: {
        options: opts,
        answer: c[2],
        why: opts.map((o, i) => (i === c[2] ? "正确。" : ["零栅压有电流就不是增强型。", "零栅压无电流就不是耗尽型；耗尽型 MOS 栅极绝缘，可以加正栅压。", "结型管零栅压有电流，且栅源只能反偏。", "电流方向/栅压极性与 N 沟道相反才是 P 沟道。"][i])),
      },
      hints: ["$u_{GS}=0$ 时有没有电流 → 增强型还是耗尽型/结型。", "栅压极性与电流方向 → N 沟道还是 P 沟道。"],
      solution: `${c[1]}。`,
    };
  }),
  gen({ id: "ms-g-ri", level: 2, topic: T1, title: "输入电阻的比较" }, (g) => {
    const IB = g.pick([10, 20, 50]) * 1e-6;
    const beta = 100;
    const rbe = rbeOf((1 + beta) * IB, beta, 200);
    const IG = g.pick([1, 5, 10]) * 1e-12;
    const UGS = g.pick([2, 3, 5]);
    return {
      prompt: `一只 BJT 在 $I_{BQ}=${A(IB)}$ 时 $r_{be}=r_{bb'}+U_T/I_{BQ}$（$r_{bb'}$=200 Ω，$U_T$=26 mV）；一只 MOS 管在 $U_{GS}=${UGS}$ V 时栅极漏电流约 ${formatSI(IG, "A")}。分别求 BJT 的 $r_{be}$ 和 MOS 管的栅源直流电阻 $U_{GS}/I_G$。`,
      parts: [num("rbe", "$r_{be}$", rbe, "Ω", "kΩ"), num("rg", "$U_{GS}/I_G$", UGS / IG, "Ω", "GΩ", { tol: 0.03 })],
      hints: ["$r_{be}=r_{bb'}+(1+\\beta)U_T/I_{EQ}=r_{bb'}+U_T/I_{BQ}$。"],
      solution: `$r_{be}\\approx${R(rbe)}$；MOS 管约 ${R(UGS / IG)}，大 6–9 个数量级。`,
    };
  }),
  gen({ id: "ms-g-region", level: 2, topic: T1, title: "沟道是否形成" }, (g) => {
    const Vt = g.pick([1, 1.5, 2, 3]);
    const ugs = g.pick([0.5, 1, 2, 2.5, 4, 5]);
    const formed = ugs > Vt;
    return {
      prompt: `N 沟道增强型 MOS 管开启电压 $U_{GS(th)}=${Vt}$ V。$u_{GS}=${ugs}$ V、$u_{DS}=5$ V 时：`,
      choice: {
        options: ["已形成导电沟道，有漏极电流", "未形成导电沟道，$i_D\\approx0$"],
        answer: formed ? 0 : 1,
        why: [formed ? "正确：$u_{GS}>U_{GS(th)}$。" : "$u_{GS}$ 未超过开启电压。", formed ? "$u_{GS}$ 已超过开启电压。" : "正确。"],
      },
      hints: ["比较 $u_{GS}$ 与 $U_{GS(th)}$。漏源电压不能产生沟道。"],
      solution: formed ? "沟道已形成。" : "沟道未形成，截止。",
    };
  }),
  concept({
    id: "ms-k-field",
    level: 3,
    topic: T1,
    title: "“场效应”的含义",
    prompt: "以 N 沟道增强型 MOS 管为例，解释栅极电压如何控制漏极电流，并说明为什么栅极电流几乎为零。",
    keyPoints: ["栅极、SiO₂、衬底构成电容", "正栅压吸引电子、排斥空穴，表面反型形成 N 型沟道", "u_GS 越大沟道越厚，导电能力越强", "栅极与沟道间有绝缘层，直流电流为零"],
    reference: "栅极与衬底之间隔着绝缘的 SiO₂，形成电容。正栅压在衬底表面感应出电子，超过开启电压后表面反型，形成连通源、漏的 N 型沟道；栅压越高，沟道越厚，漏极电流越大。由于绝缘层的存在，栅极直流电流几乎为零。",
  }),
  concept({
    id: "ms-k-compare",
    level: 3,
    topic: T1,
    title: "FET 与 BJT 的比较",
    prompt: "从控制方式、载流子、输入电阻、温度稳定性四个方面比较场效应管与晶体管。",
    keyPoints: ["FET 电压控制，BJT 电流控制", "FET 单极型（多子），BJT 双极型", "FET 输入电阻极大，BJT 约为 r_be", "FET 温度稳定性好（多子导电）"],
    reference: "FET 用栅源电压控制漏极电流（栅极几乎不取电流），只有多子导电，输入电阻可达 10⁹ Ω 以上，温度稳定性好；BJT 用基极电流控制集电极电流，两种载流子参与，输入电阻为千欧级，少子受温度影响大。",
  }),
  choice({
    id: "ms-c-esd",
    level: 3,
    topic: T1,
    title: "MOS 管的保存",
    prompt: "MOS 管存放和焊接时要求将各电极短接、烙铁接地，主要原因是：",
    options: ["防止漏极电流过大", "栅极绝缘层很薄，感应电荷不易泄放，静电高压会击穿栅氧化层", "防止沟道长度调制", "防止热击穿"],
    answer: 1,
    why: ["与漏极电流无关。", "正确。", "无关。", "这是静电击穿，不是热击穿。"],
    hints: ["栅极的输入电阻极大意味着什么？"],
  }),
];

/* ═════════════ 特性曲线 ═════════════ */
const T2 = "mos-curves";
const REGS: FETRegion[] = ["cutoff", "ohmic", "saturation"];
const curvesQ: QuestionTemplate[] = [
  choice({
    id: "mv-c-sat",
    topic: T2,
    title: "FET 的放大区",
    prompt: "场效应管作放大器件时，应工作在：",
    options: ["可变电阻区", "恒流区（饱和区）", "截止区", "击穿区"],
    answer: 1,
    why: ["该区 $i_D$ 随 $u_{DS}$ 变化，类似电阻。", "正确：$i_D$ 只受 $u_{GS}$ 控制。", "无电流。", "会损坏器件。"],
    hints: ["哪个区域 $i_D$ 几乎只由 $u_{GS}$ 决定？"],
  }),
  judge({
    id: "mv-j-same",
    topic: T2,
    title: "饱和区的含义",
    prompt: "场效应管的饱和区与晶体管的饱和区含义相同，都表示失去放大作用。",
    answer: false,
    why: "错误。FET 的饱和区指电流饱和（恒流），是放大区；BJT 的饱和区指两结正偏、失去放大作用。",
    hints: ["“饱和”在两种器件中分别指什么饱和？"],
  }),
  choice({
    id: "mv-c-pinch",
    topic: T2,
    title: "预夹断条件",
    prompt: "N 沟道增强型 MOS 管发生预夹断的条件是：",
    options: ["$u_{GS}=U_{GS(th)}$", "$u_{GD}=U_{GS(th)}$，即 $u_{DS}=u_{GS}-U_{GS(th)}$", "$u_{DS}=0$", "$u_{GS}=0$"],
    answer: 1,
    why: ["这是沟道刚好形成的条件。", "正确：漏端的栅–沟道电压降到开启电压，漏端沟道消失。", "此时沟道均匀，不夹断。", "增强型此时无沟道。"],
    hints: ["漏端沟道的“有效栅压”是 $u_{GD}$。"],
  }),
  gen({ id: "mv-g-region", level: 2, topic: T2, title: "判断 MOS 管的工作区" }, (g) => {
    const enh = g.next() < 0.6;
    const fet: FETParams = enh ? { kind: "n-enh", Vt: g.pick([1, 2, 3]), Iref: 2e-3, lambda: 0 } : { kind: "n-dep", Vt: -g.pick([2, 3, 4]), Iref: 4e-3, lambda: 0 };
    const ugs = enh ? g.pick([fet.Vt - 0.5, fet.Vt + 1, fet.Vt + 2, fet.Vt + 3]) : g.pick([fet.Vt - 1, -1, 0, 1]);
    const uds = g.pick([0.5, 1, 2, 4, 8]);
    const reg = fetRegion(fet, ugs, uds);
    return {
      prompt: `N 沟道${enh ? "增强型（$U_{GS(th)}=" + fet.Vt + "$ V）" : "耗尽型（$U_{GS(off)}=" + fet.Vt + "$ V）"} MOS 管，$u_{GS}=${sig(ugs, 3)}$ V，$u_{DS}=${uds}$ V。它工作在：`,
      choice: {
        options: REGS.map((x) => FET_REGION_LABEL[x]),
        answer: REGS.indexOf(reg),
        why: REGS.map((x) => (x === reg ? "正确。" : x === "cutoff" ? "栅压已超过门槛电压。" : x === "ohmic" ? `需要 $u_{DS}<u_{GS}-U_T=${sig(ugs - fet.Vt, 3)}$ V。` : `需要 $u_{DS}\\ge u_{GS}-U_T=${sig(ugs - fet.Vt, 3)}$ V。`)),
      },
      hints: ["先比较 $u_{GS}$ 与门槛电压。", "再比较 $u_{DS}$ 与 $u_{GS}-U_T$。"],
      solution: `${FET_REGION_LABEL[reg]}。`,
    };
  }),
  gen({ id: "mv-g-id", level: 2, topic: T2, title: "恒流区的漏极电流" }, (g) => {
    const enh = g.next() < 0.5;
    const fet = enh ? enhFet(g) : depFet(g);
    const ugs = enh ? fet.Vt + g.pick([0.5, 1, 1.5, 2, 3]) : fet.Vt * g.pick([0.2, 0.4, 0.5, 0.7]);
    const id = transferCurrent(fet, ugs);
    return {
      prompt: enh
        ? `增强型 NMOS：$U_{GS(th)}=${fet.Vt}$ V，$I_{DO}=${A(fet.Iref)}$。工作在恒流区，$u_{GS}=${sig(ugs, 3)}$ V 时 $i_D$ 为多少？`
        : `${fet.kind === "n-jfet" ? "N 沟道结型" : "N 沟道耗尽型 MOS"}管：$U_{GS(off)}=${fet.Vt}$ V，$I_{DSS}=${A(fet.Iref)}$。工作在恒流区，$u_{GS}=${sig(ugs, 3)}$ V 时 $i_D$ 为多少？`,
      parts: [num("id", "$i_D$", id, "A", "mA", { mistakes: enh ? [{ value: fet.Iref * (ugs / fet.Vt - 1), message: "别忘了平方：$i_D=I_{DO}(u_{GS}/U_{GS(th)}-1)^2$。" }] : [{ value: fet.Iref * (1 - ugs / fet.Vt), message: "别忘了平方：$i_D=I_{DSS}(1-u_{GS}/U_{GS(off)})^2$。" }] })],
      hints: [enh ? "$i_D=I_{DO}\\left(\\dfrac{u_{GS}}{U_{GS(th)}}-1\\right)^2$。" : "$i_D=I_{DSS}\\left(1-\\dfrac{u_{GS}}{U_{GS(off)}}\\right)^2$。"],
      solution: `$i_D=${A(id)}$。`,
    };
  }),
  gen({ id: "mv-g-ohmic", level: 2, topic: T2, title: "可变电阻区的等效电阻" }, (g) => {
    const fet = enhFet(g);
    const ov = g.pick([1, 2, 3]);
    const ugs = fet.Vt + ov;
    const uds = 0.01;
    const ron = uds / drainCurrent(fet, ugs, uds);
    const K = fet.Iref / (fet.Vt * fet.Vt);
    return {
      prompt: `增强型 NMOS：$U_{GS(th)}=${fet.Vt}$ V，$I_{DO}=${A(fet.Iref)}$（$K=I_{DO}/U_{GS(th)}^2$）。$u_{GS}=${ugs}$ V，$u_{DS}$ 很小（如 10 mV）时，漏源之间的等效电阻约为多少？`,
      parts: [num("ron", "$R_{on}=u_{DS}/i_D$", ron, "Ω", "Ω", { tol: 0.02 })],
      hints: ["可变电阻区 $i_D=K[2(u_{GS}-U_{GS(th)})u_{DS}-u_{DS}^2]$。", "$u_{DS}$ 很小时忽略 $u_{DS}^2$：$R_{on}\\approx\\dfrac1{2K(u_{GS}-U_{GS(th)})}$。"],
      solution: `$R_{on}\\approx1/[2K(u_{GS}-U_{GS(th)})]=${R(1 / (2 * K * ov))}$。$u_{GS}$ 越大电阻越小——压控电阻。`,
    };
  }),
  gen({ id: "mv-g-boundary", level: 3, topic: T2, title: "保持恒流区的最小 u_DS" }, (g) => {
    const fet = enhFet(g);
    const ID = g.pick([0.5, 1, 2, 4]) * 1e-3;
    const ugs = fet.Vt * (1 + Math.sqrt(ID / fet.Iref));
    return {
      prompt: `增强型 NMOS：$U_{GS(th)}=${fet.Vt}$ V，$I_{DO}=${A(fet.Iref)}$。要求恒流区 $i_D=${A(ID)}$，求所需的 $u_{GS}$，以及保证工作在恒流区的最小 $u_{DS}$。`,
      parts: [num("ugs", "$u_{GS}$", ugs, "V", "V"), num("uds", "$u_{DS\\min}$", ugs - fet.Vt, "V", "V", { mistakes: [{ value: ugs, message: "预夹断条件是 $u_{DS}=u_{GS}-U_{GS(th)}$，不是 $u_{GS}$。" }] })],
      hints: ["由平方律反解 $u_{GS}=U_{GS(th)}(1+\\sqrt{i_D/I_{DO}})$。", "恒流区：$u_{DS}\\ge u_{GS}-U_{GS(th)}$。"],
      solution: `$u_{GS}=${V(ugs)}$，$u_{DS}\\ge${V(ugs - fet.Vt)}$。`,
    };
  }),
  gen({ id: "mv-g-pch", level: 3, topic: T2, title: "P 沟道管的判断与电流" }, (g) => {
    const fet: FETParams = { kind: "p-enh", Vt: -g.pick([1, 1.5, 2]), Iref: g.pick([1, 2, 4]) * 1e-3, lambda: 0 };
    const ugs = fet.Vt - g.pick([0.5, 1, 2]);
    const uds = -g.pick([0.3, 1, 3, 6]);
    const reg = fetRegion(fet, ugs, uds);
    const id = Math.abs(drainCurrent(fet, ugs, uds));
    return {
      prompt: `P 沟道增强型 MOS 管 $U_{GS(th)}=${fet.Vt}$ V，$I_{DO}=${A(fet.Iref)}$（$i_D$ 平方律、可变电阻区公式与 N 沟道相同，电压取绝对值）。$u_{GS}=${sig(ugs, 3)}$ V、$u_{DS}=${sig(uds, 3)}$ V 时，判断工作区（截止填 0、可变电阻区填 1、恒流区填 2）并求 $|i_D|$。`,
      parts: [num("r", "工作区", REGS.indexOf(reg), "1", "2", { tol: 0.01 }), num("id", "$|i_D|$", id, "A", "mA", { tol: 0.03 })],
      hints: ["把所有电压取反，按 N 沟道增强型判断。", "恒流区 $|i_D|=I_{DO}(u_{GS}/U_{GS(th)}-1)^2$；可变电阻区用 $K[2|u_{GS}-U_{GS(th)}||u_{DS}|-u_{DS}^2]$。"],
      solution: `${FET_REGION_LABEL[reg]}，$|i_D|=${A(id)}$。`,
    };
  }),
  concept({
    id: "mv-k-pinch",
    level: 3,
    topic: T2,
    title: "预夹断后电流为什么基本不变",
    prompt: "解释：N 沟道 MOS 管预夹断后，$u_{DS}$ 继续增大时 $i_D$ 为什么几乎不再增大？",
    keyPoints: ["预夹断时漏端沟道消失，形成高阻的夹断区", "u_DS 增加的部分几乎全部降在夹断区上", "沟道两端的电压保持约为 u_GS − U_GS(th)", "所以沟道电流基本不变（只因沟道长度调制略有增加）"],
    reference: "预夹断后，漏端出现夹断区。$u_{DS}$ 继续增加的部分主要降在这段高阻的夹断区上，导电沟道两端的电压基本维持在 $u_{GS}-U_{GS(th)}$，所以 $i_D$ 基本不变；夹断区中的强电场把沟道中的电子扫向漏极，电流并不中断。",
  }),
];

/* ═════════════ 跨导与小信号模型 ═════════════ */
const T3 = "fet-small-signal";
const ssQ: QuestionTemplate[] = [
  choice({
    id: "fs-c-gm",
    topic: T3,
    title: "跨导的定义",
    prompt: "场效应管的低频跨导 $g_m$ 定义为：",
    options: ["$\\Delta u_{DS}/\\Delta i_D$", "$\\partial i_D/\\partial u_{GS}$（$u_{DS}$ 不变）", "$i_D/u_{GS}$", "$\\partial i_D/\\partial u_{DS}$"],
    answer: 1,
    why: ["这是输出电阻。", "正确。", "这是直流比值，不是动态参数。", "这是输出电导 $1/r_{ds}$。"],
    hints: ["跨导描述输入电压对输出电流的控制能力。"],
  }),
  judge({
    id: "fs-j-gate",
    topic: T3,
    title: "小信号模型中的栅极",
    prompt: "场效应管低频小信号模型中，栅源之间可视为开路。",
    answer: true,
    why: "正确。MOS 管栅极绝缘、结型管栅源 PN 结反偏，栅极电流近似为零。",
    hints: ["栅极电流有多大？"],
  }),
  choice({
    id: "fs-c-dep",
    topic: T3,
    title: "跨导与 Q 点",
    prompt: "同一只增强型 MOS 管，静态电流 $I_{DQ}$ 增大为原来的 4 倍，$g_m$ 变为原来的：",
    options: ["4 倍", "2 倍", "1/2", "不变"],
    answer: 1,
    why: ["$g_m\\propto\\sqrt{I_{DQ}}$，不是正比。", "正确：$g_m=\\frac{2}{U_{GS(th)}}\\sqrt{I_{DO}I_{DQ}}$。", "方向反了。", "$g_m$ 随 Q 点变化。"],
    hints: ["写出 $g_m$ 与 $I_{DQ}$ 的关系。"],
  }),
  gen({ id: "fs-g-gm-enh", level: 2, topic: T3, title: "增强型管的跨导" }, (g) => {
    const fet = enhFet(g);
    const ID = g.pick([0.5, 1, 1.5, 2, 3]) * 1e-3;
    const gm = gmTextbook(fet, ID);
    return {
      prompt: `增强型 NMOS：$U_{GS(th)}=${fet.Vt}$ V，$I_{DO}=${A(fet.Iref)}$，静态电流 $I_{DQ}=${A(ID)}$。求跨导 $g_m$（单位 mS，填写如“1.2 mS”；mS 是 mA/V）。`,
      parts: [num("gm", "$g_m$（填数值，单位 mS）", gm * 1e3, "1", "1.41", { mistakes: [{ value: (gm * 1e3) / 2, message: "$g_m=\\dfrac{2}{U_{GS(th)}}\\sqrt{I_{DO}I_{DQ}}$，别漏了因子 2。" }] })],
      hints: ["$g_m=\\dfrac{2}{U_{GS(th)}}\\sqrt{I_{DO}I_{DQ}}$。"],
      solution: `$g_m=${mS(gm)}$。`,
    };
  }),
  gen({ id: "fs-g-gm-dep", level: 2, topic: T3, title: "耗尽型/结型管的跨导" }, (g) => {
    const fet = depFet(g);
    const ugs = fet.Vt * g.pick([0.25, 0.5, 0.6]);
    const ID = transferCurrent(fet, ugs);
    const gm = gmTextbook(fet, ID);
    return {
      prompt: `${fet.kind === "n-jfet" ? "N 沟道结型" : "N 沟道耗尽型 MOS"}管：$I_{DSS}=${A(fet.Iref)}$，$U_{GS(off)}=${fet.Vt}$ V，静态 $U_{GSQ}=${sig(ugs, 3)}$ V。求 $I_{DQ}$ 与 $g_m$（$g_m$ 填数值，单位 mS）。`,
      parts: [num("id", "$I_{DQ}$", ID, "A", "mA"), num("gm", "$g_m$（mS）", gm * 1e3, "1", "2", { mistakes: [{ value: ((2 * fet.Iref) / Math.abs(fet.Vt)) * 1e3, message: "这是 $U_{GS}=0$ 时的 $g_{m0}$；Q 点处还要乘以 $(1-U_{GSQ}/U_{GS(off)})$。" }] })],
      hints: ["$I_{DQ}=I_{DSS}(1-U_{GSQ}/U_{GS(off)})^2$。", "$g_m=-\\dfrac{2I_{DSS}}{U_{GS(off)}}\\left(1-\\dfrac{U_{GSQ}}{U_{GS(off)}}\\right)$。"],
      solution: `$I_{DQ}=${A(ID)}$，$g_m=${mS(gm)}$。`,
    };
  }),
  gen({ id: "fs-g-rds", level: 2, topic: T3, title: "沟道长度调制与 r_ds" }, (g) => {
    const lam = g.pick([0.005, 0.01, 0.02, 0.05]);
    const ID = g.pick([0.5, 1, 2, 5]) * 1e-3;
    const rds = outputResistance({ kind: "n-enh", Vt: 2, Iref: 2e-3, lambda: lam }, ID);
    return {
      prompt: `MOS 管沟道长度调制系数 $\\lambda=${lam}$ V⁻¹，静态电流 $I_{DQ}=${A(ID)}$。求漏源间小信号电阻 $r_{ds}$。`,
      parts: [num("rds", "$r_{ds}$", rds, "Ω", "kΩ")],
      hints: ["$r_{ds}\\approx\\dfrac1{\\lambda I_{DQ}}$。"],
      solution: `$r_{ds}\\approx${R(rds)}$。`,
    };
  }),
  gen({ id: "fs-g-compare", level: 3, topic: T3, title: "同样电流下 BJT 与 MOS 的跨导" }, (g) => {
    const fet = enhFet(g);
    const I = g.pick([0.5, 1, 2]) * 1e-3;
    const gmF = gmTextbook(fet, I);
    const gmB = bjtGm(I);
    return {
      prompt: `静态电流同为 ${A(I)}：BJT 的跨导 $g_m=I_{CQ}/U_T$（$U_T$=26 mV）；增强型 NMOS（$U_{GS(th)}=${fet.Vt}$ V，$I_{DO}=${A(fet.Iref)}$）的 $g_m=\\frac{2}{U_{GS(th)}}\\sqrt{I_{DO}I_{DQ}}$。分别求二者（单位 mS），以及 BJT 是 MOS 的多少倍。`,
      parts: [num("b", "BJT $g_m$（mS）", gmB * 1e3, "1", "38"), num("f", "MOS $g_m$（mS）", gmF * 1e3, "1", "1.4"), num("k", "倍数", gmB / gmF, "1", "27")],
      hints: ["BJT 的 $g_m=\\beta/r_{b'e}=I_{CQ}/U_T$。"],
      solution: `BJT ${sig(gmB * 1e3, 3)} mS，MOS ${sig(gmF * 1e3, 3)} mS，约 ${sig(gmB / gmF, 3)} 倍。`,
    };
  }),
  gen({ id: "fs-g-ac", level: 3, topic: T3, title: "由小信号模型求交流电流" }, (g) => {
    const fet = enhFet(g);
    const ID = g.pick([1, 2]) * 1e-3;
    const gm = gmTextbook(fet, ID);
    const ugs = g.pick([10, 20, 50]) * 1e-3;
    const exact = transferCurrent(fet, fet.Vt * (1 + Math.sqrt(ID / fet.Iref)) + ugs) - ID;
    return {
      prompt: `增强型 NMOS（$U_{GS(th)}=${fet.Vt}$ V，$I_{DO}=${A(fet.Iref)}$），$I_{DQ}=${A(ID)}$。(1) 用小信号模型估算 $u_{gs}=${sig(ugs * 1e3, 2)}$ mV 时漏极电流的增量；(2) 用平方律精确计算该增量。`,
      parts: [num("lin", "(1) $g_mu_{gs}$", gm * ugs, "A", "µA"), num("ex", "(2) 精确增量", exact, "A", "µA", { tol: 0.01 })],
      hints: ["$\\Delta i_D\\approx g_m\\Delta u_{GS}$。", "精确：先由 $I_{DQ}$ 求 $U_{GSQ}$，再算 $i_D(U_{GSQ}+u_{gs})-I_{DQ}$。"],
      solution: `线性 ${A(gm * ugs)}，精确 ${A(exact)}；差别来自平方项 $K u_{gs}^2$，$u_{gs}$ 越小越可忽略。`,
    };
  }),
  concept({
    id: "fs-k-model",
    level: 3,
    topic: T3,
    title: "FET 与 BJT 小信号模型的对应",
    prompt: "画出（描述）FET 与 BJT 的低频小信号模型，并说明二者的对应关系与差别。",
    keyPoints: ["FET：g–s 开路，d–s 间受控电流源 g_m U_gs（并 r_ds）", "BJT：b–e 间 r_be，c–e 间受控电流源 β I_b", "BJT 的 β I_b 可写成 (β/r_be)U_be，对应 g_m", "差别：FET 输入端开路（r_be → ∞）"],
    reference: "FET 模型：栅源开路，漏源间为电压控制电流源 $g_m\\dot U_{gs}$（必要时并联 $r_{ds}$）。BJT 模型：基射间为 $r_{be}$，集射间为电流控制电流源 $\\beta\\dot I_b=(\\beta/r_{be})\\dot U_{be}$。二者结构相同，只是 FET 的输入电阻为无穷大。",
  }),
];

/* ═════════════ 共源 ═════════════ */
const T4 = "cs-amplifier";
const csQ: QuestionTemplate[] = [
  choice({
    id: "csa-c-phase",
    topic: T4,
    title: "共源电路的相位",
    prompt: "共源放大电路的输出电压与输入电压：",
    options: ["同相", "反相", "相差 90°", "不确定"],
    answer: 1,
    why: ["共漏、共栅同相。", "正确：$\\dot A_u=-g_mR_D'$。", "中频时纯电阻性，无 90° 相移。", "—"],
    hints: ["$u_{GS}\\uparrow\\Rightarrow i_D\\uparrow\\Rightarrow u_D=V_{DD}-i_DR_d$？"],
  }),
  choice({
    id: "csa-c-rg3",
    topic: T4,
    title: "R_g3 的作用",
    prompt: "分压偏置共源电路中，在分压点与栅极之间串入兆欧级电阻 $R_{g3}$，主要作用是：",
    options: ["改变静态工作点", "提高输入电阻", "提高电压放大倍数", "稳定输出电压"],
    answer: 1,
    why: ["$R_{g3}$ 中无直流电流，不影响 $U_{GQ}$。", "正确：$R_i=R_{g3}+R_{g1}\\para R_{g2}$。", "与增益无关。", "无关。"],
    hints: ["栅极电流为零，$R_{g3}$ 上有压降吗？"],
  }),
  judge({
    id: "csa-j-root",
    topic: T4,
    title: "二次方程的两个根",
    prompt: "求共源电路 Q 点时联立得到的一元二次方程有两个实根，二者都是可能的工作点。",
    answer: false,
    why: "错误。其中一个根使 $U_{GS}$ 越过开启/夹断电压（管子应截止），与“管子导通有电流”的假设矛盾，必须舍去。",
    hints: ["把两个根分别代回，看管子是否导通。"],
  }),
  gen({ id: "csa-g-self", level: 2, topic: T4, title: "自给偏压电路的 Q 点" }, (g) => {
    const a = makeCS(g, "self");
    const q = solveFETQ(a);
    return {
      prompt: `自给偏压共源电路：$V_{DD}=${a.VDD}$ V，$R_g=${R(a.Rg)}$，$R_s=${R(a.Rs)}$，$R_d=${R(a.Rd)}$；${a.fet.kind === "n-jfet" ? "N 沟道结型" : "N 沟道耗尽型 MOS"}管 $I_{DSS}=${A(a.fet.Iref)}$，$U_{GS(off)}=${a.fet.Vt}$ V。求 $U_{GSQ}$、$I_{DQ}$、$U_{DSQ}$。`,
      diagram: { id: "cs-amp", labels: { bias: "self", Rg: R(a.Rg), Rs: R(a.Rs), Rd: R(a.Rd) } },
      parts: [
        num("ugs", "$U_{GSQ}$", q.UGSQ, "V", "V", { mistakes: q.rejected !== undefined ? [{ value: q.rejected, message: "这个根比夹断电压还负，管子应截止，舍去。" }] : [] }),
        num("id", "$I_{DQ}$", q.IDQ, "A", "mA"),
        num("uds", "$U_{DSQ}$", q.UDSQ, "V", "V"),
      ],
      hints: ["$U_{GSQ}=-I_{DQ}R_s$。", "$I_{DQ}=I_{DSS}(1-U_{GSQ}/U_{GS(off)})^2$，联立解二次方程，舍去 $U_{GS}<U_{GS(off)}$ 的根。", "$U_{DSQ}=V_{DD}-I_{DQ}(R_d+R_s)$。"],
      solution: `$U_{GSQ}=${V(q.UGSQ)}$，$I_{DQ}=${A(q.IDQ)}$，$U_{DSQ}=${V(q.UDSQ)}$。`,
    };
  }),
  gen({ id: "csa-g-div", level: 2, topic: T4, title: "分压偏置共源电路的 Q 点" }, (g) => {
    const a = makeCS(g, "divider");
    const q = solveFETQ(a);
    return {
      prompt: `分压偏置共源电路：$V_{DD}=${a.VDD}$ V，$R_{g1}=${R(a.Rg1)}$（下），$R_{g2}=${R(a.Rg2)}$（上），$R_s=${R(a.Rs)}$，$R_d=${R(a.Rd)}$；增强型 NMOS $U_{GS(th)}=${a.fet.Vt}$ V，$I_{DO}=${A(a.fet.Iref)}$。求 $U_{GQ}$、$U_{GSQ}$、$I_{DQ}$。`,
      diagram: { id: "cs-amp", labels: { Rg1: R(a.Rg1), Rg2: R(a.Rg2), Rs: R(a.Rs), Rd: R(a.Rd) } },
      parts: [
        num("ug", "$U_{GQ}$", q.UGQ, "V", "V", { mistakes: [{ value: (a.VDD * a.Rg2) / (a.Rg1 + a.Rg2), message: "栅极电位是下电阻 $R_{g1}$ 上的分压。" }] }),
        num("ugs", "$U_{GSQ}$", q.UGSQ, "V", "V", { mistakes: q.rejected !== undefined ? [{ value: q.rejected, message: "这个根小于开启电压，管子应截止，舍去。" }] : [] }),
        num("id", "$I_{DQ}$", q.IDQ, "A", "mA"),
      ],
      hints: ["$U_{GQ}=V_{DD}R_{g1}/(R_{g1}+R_{g2})$，$U_{GSQ}=U_{GQ}-I_{DQ}R_s$。", "与平方律联立，舍去 $U_{GS}<U_{GS(th)}$ 的根。"],
      solution: `$U_{GQ}=${V(q.UGQ)}$，$U_{GSQ}=${V(q.UGSQ)}$，$I_{DQ}=${A(q.IDQ)}$，$U_{DSQ}=${V(q.UDSQ)}$。`,
    };
  }),
  gen({ id: "csa-g-ac", level: 2, topic: T4, title: "共源电路的动态参数" }, (g) => {
    const a = makeCS(g, "divider");
    const { q, ac } = analyzeCS(a);
    return {
      prompt: `分压偏置共源电路（$R_s$ 被 $C_s$ 旁路）：$R_{g1}=${R(a.Rg1)}$，$R_{g2}=${R(a.Rg2)}$，$R_{g3}=${R(a.Rg3)}$，$R_d=${R(a.Rd)}$，$R_L=${R(a.RL)}$。已知 Q 点处 $g_m=${mS(q.gm)}$，忽略 $r_{ds}$。求 $\\dot A_u$、$R_i$、$R_o$。`,
      diagram: { id: "cs-amp", labels: { Rg1: R(a.Rg1), Rg2: R(a.Rg2), Rg3: a.Rg3 ? R(a.Rg3) : "0", Rd: R(a.Rd), RL: R(a.RL) } },
      parts: [
        num("Au", "$\\dot A_u$", ac.Au, "1", "−5", { signMessage: "共源电路反相，$\\dot A_u$ 为负。", mistakes: [{ value: -q.gm * a.Rd, message: "负载 $R_L$ 与 $R_d$ 并联：$R_D'=R_d\\para R_L$。" }] }),
        num("Ri", "$R_i$", ac.Ri, "Ω", "MΩ", { mistakes: [{ value: par(a.Rg1, a.Rg2), message: "$R_{g3}$ 串在栅极上，$R_i=R_{g3}+R_{g1}\\para R_{g2}$。" }] }),
        num("Ro", "$R_o$", ac.Ro, "Ω", "kΩ"),
      ],
      hints: ["$\\dot A_u=-g_mR_D'$。", "$R_i=R_{g3}+R_{g1}\\para R_{g2}$，$R_o\\approx R_d$。"],
      solution: `$\\dot A_u=${sig(ac.Au, 3)}$，$R_i=${R(ac.Ri)}$，$R_o=${R(ac.Ro)}$。`,
    };
  }),
  gen({ id: "csa-g-full", level: 3, topic: T4, title: "共源电路综合分析" }, (g) => {
    const a = makeCS(g, "divider");
    const { q, ac } = analyzeCS(a);
    return {
      prompt: `分压偏置共源电路：$V_{DD}=${a.VDD}$ V，$R_{g1}=${R(a.Rg1)}$，$R_{g2}=${R(a.Rg2)}$，$R_s=${R(a.Rs)}$（被旁路），$R_d=${R(a.Rd)}$，$R_L=${R(a.RL)}$；增强型 NMOS $U_{GS(th)}=${a.fet.Vt}$ V，$I_{DO}=${A(a.fet.Iref)}$。求 $I_{DQ}$、$g_m$（mS）与 $\\dot A_u$。`,
      diagram: { id: "cs-amp", labels: { Rg1: R(a.Rg1), Rg2: R(a.Rg2), Rs: R(a.Rs), Rd: R(a.Rd), RL: R(a.RL) } },
      parts: [num("id", "$I_{DQ}$", q.IDQ, "A", "mA"), num("gm", "$g_m$（mS）", q.gm * 1e3, "1", "1.5"), num("Au", "$\\dot A_u$", ac.Au, "1", "−5", { signMessage: "共源反相。" })],
      hints: ["先求 Q 点（解二次方程、舍根、验证恒流区）。", "$g_m=\\frac{2}{U_{GS(th)}}\\sqrt{I_{DO}I_{DQ}}$，$\\dot A_u=-g_mR_D'$。"],
      solution: `$I_{DQ}=${A(q.IDQ)}$，$g_m=${mS(q.gm)}$，$\\dot A_u=${sig(ac.Au, 3)}$。`,
    };
  }),
  gen({ id: "csa-g-unbyp", level: 3, topic: T4, title: "源极电阻不旁路" }, (g) => {
    const a = makeCS(g, "divider");
    const by = analyzeCS(a);
    const un = analyzeCS({ ...a, bypass: false });
    return {
      prompt: `某共源电路 Q 点处 $g_m=${mS(by.q.gm)}$，$R_d=${R(a.Rd)}$，$R_L=${R(a.RL)}$，$R_s=${R(a.Rs)}$。求 $C_s$ 正常时和 $C_s$ 开路时的 $\\dot A_u$。`,
      parts: [num("a1", "$C_s$ 正常", by.ac.Au, "1", "−5", { signMessage: "反相。" }), num("a2", "$C_s$ 开路", un.ac.Au, "1", "−2", { signMessage: "反相。", mistakes: [{ value: by.ac.Au, message: "$C_s$ 开路后 $R_s$ 进入交流通路，产生交流负反馈。" }] })],
      hints: ["$C_s$ 开路：$\\dot U_i=\\dot U_{gs}(1+g_mR_s)$，$\\dot A_u=-g_mR_D'/(1+g_mR_s)$。"],
      solution: `${sig(by.ac.Au, 3)} → ${sig(un.ac.Au, 3)}。`,
    };
  }),
  concept({
    id: "csa-k-steps",
    level: 3,
    topic: T4,
    title: "共源电路的分析步骤",
    prompt: "写出分析分压偏置共源放大电路的完整步骤，并指出与 BJT 共射电路分析的不同之处。",
    keyPoints: ["直流：U_G 分压；U_GS = U_G − I_D R_s 与平方律联立", "解二次方程，舍去使管子截止的根，验证恒流区", "求 g_m（与 Q 点有关）", "交流：A_u = −g_m R_D'，R_i 由栅极电阻决定，R_o ≈ R_d", "不同：非线性方程需舍根；栅极无电流，R_i 很大"],
    reference: "先直流后交流。直流：$U_{GQ}$ 由分压决定，$U_{GSQ}=U_{GQ}-I_{DQ}R_s$ 与平方律联立，解二次方程并舍去不合理的根，验证 $U_{DS}\\ge U_{GS}-U_{GS(th)}$；再求 $g_m$。交流：小信号模型，$\\dot A_u=-g_mR_D'$，$R_i=R_{g3}+R_{g1}\\para R_{g2}$，$R_o\\approx R_d$。与 BJT 相比，静态方程是二次的，且输入电阻不含器件参数。",
  }),
];

/* ═════════════ 共漏与共栅 ═════════════ */
const T5 = "cd-cg-amplifier";
const cdcgQ: QuestionTemplate[] = [
  choice({
    id: "cd-c-ro",
    topic: T5,
    title: "源极跟随器的输出电阻",
    prompt: "源极跟随器的输出电阻约为：",
    options: ["$R_d$", "$R_s\\para\\dfrac1{g_m}$", "$R_g$", "$r_{ds}$"],
    answer: 1,
    why: ["共漏电路通常没有 $R_d$。", "正确。", "那是输入端的电阻。", "—"],
    hints: ["输入短路后，从源极看进去受控源等效为什么？"],
  }),
  choice({
    id: "cg-c-ri",
    topic: T5,
    title: "共栅电路的输入电阻",
    prompt: "共栅放大电路的输入电阻：",
    options: ["很大，约为 $R_g$", "很小，约为 $R_s\\para\\dfrac1{g_m}$", "约为 $R_d$", "无穷大"],
    answer: 1,
    why: ["信号从源极输入，不是栅极。", "正确。", "那是输出电阻。", "—"],
    hints: ["信号从哪个电极输入？"],
  }),
  judge({
    id: "cd-j-gain",
    topic: T5,
    title: "源极跟随器的增益",
    prompt: "源极跟随器的电压放大倍数一定大于射极跟随器的电压放大倍数。",
    answer: false,
    why: "错误。$\\dot A_u=g_mR_S'/(1+g_mR_S')$，FET 的 $g_m$ 较小，$g_mR_S'$ 往往只有几到十几，所以源极跟随器的增益通常比射极跟随器更低（离 1 更远）。",
    hints: ["比较 $g_mR_S'$ 与 $(1+\\beta)R_L'/r_{be}$ 的大小。"],
  }),
  gen({ id: "cd-g-ac", level: 2, topic: T5, title: "源极跟随器的 A_u 与 R_o" }, (g) => {
    let b: FETAmpParams = { ...DEFAULT_CS, Rd: 0, bypass: false, Rs: 2e3, RL: Infinity };
    let res = analyzeCD(b);
    for (let k = 0; k < 60; k++) {
      const cand: FETAmpParams = { ...makeCS(g, "divider"), Rd: 0, bypass: false, Rs: e12(g.range(1e3, 10e3)), RL: g.pick([Infinity, 5e3, 10e3, 20e3]) };
      const r = analyzeCD(cand);
      if (r.q.region === "saturation" && r.q.IDQ > 0.2e-3) {
        b = cand;
        res = r;
        break;
      }
    }
    const { q, ac } = res;
    const { Rs, RL } = b;
    return {
      prompt: `源极跟随器：Q 点处 $g_m=${mS(q.gm)}$，$R_s=${R(Rs)}$，${Number.isFinite(RL) ? `$R_L=${R(RL)}$` : "空载"}，$R_{g3}+R_{g1}\\para R_{g2}=${R(ac.Ri)}$。求 $\\dot A_u$、$R_o$。`,
      diagram: { id: "cd-amp", labels: { Rs: R(Rs), RL: Number.isFinite(RL) ? R(RL) : "∞" } },
      parts: [num("Au", "$\\dot A_u$", ac.Au, "1", "0.8"), num("Ro", "$R_o$", ac.Ro, "Ω", "Ω", { mistakes: [{ value: 1 / q.gm, message: "还要与 $R_s$ 并联。" }, { value: Rs, message: "从源极看进去，受控源相当于 $1/g_m$ 的电阻，与 $R_s$ 并联。" }] })],
      hints: ["$\\dot A_u=\\dfrac{g_mR_S'}{1+g_mR_S'}$，$R_S'=R_s\\para R_L$。", "$R_o=R_s\\para\\dfrac1{g_m}$。"],
      solution: `$\\dot A_u=${sig(ac.Au, 3)}$，$R_o=${R(ac.Ro)}$。`,
    };
  }),
  gen({ id: "cg-g-ac", level: 2, topic: T5, title: "共栅电路的动态参数" }, (g) => {
    const a = makeCS(g, "divider");
    const { q, ac } = analyzeCG(a);
    return {
      prompt: `共栅放大电路：Q 点处 $g_m=${mS(q.gm)}$，$R_s=${R(a.Rs)}$，$R_d=${R(a.Rd)}$，$R_L=${R(a.RL)}$。求 $\\dot A_u$、$R_i$、$R_o$。`,
      diagram: { id: "cg-amp", labels: { Rs: R(a.Rs), Rd: R(a.Rd), RL: R(a.RL) } },
      parts: [num("Au", "$\\dot A_u$", ac.Au, "1", "5", { signMessage: "共栅电路同相，$\\dot A_u$ 为正。" }), num("Ri", "$R_i$", ac.Ri, "Ω", "Ω"), num("Ro", "$R_o$", ac.Ro, "Ω", "kΩ")],
      hints: ["$\\dot A_u=g_mR_D'$。", "$R_i=R_s\\para\\dfrac1{g_m}$，$R_o\\approx R_d$。"],
      solution: `$\\dot A_u=${sig(ac.Au, 3)}$，$R_i=${R(ac.Ri)}$，$R_o=${R(ac.Ro)}$。`,
    };
  }),
  gen({ id: "cdcg-g-aus", level: 2, topic: T5, title: "信号源内阻的影响" }, (g) => {
    const a = makeCS(g, "divider");
    const Rsrc = g.pick([600, 1e3, 10e3, 100e3]);
    const cs = analyzeCS(a);
    const cg = analyzeCG(a);
    const aus = (x: { ac: { Au: number; Ri: number } }) => (x.ac.Au * x.ac.Ri) / (Rsrc + x.ac.Ri);
    return {
      prompt: `同一偏置下，共源电路 $\\dot A_u=${sig(cs.ac.Au, 3)}$、$R_i=${R(cs.ac.Ri)}$；共栅电路 $\\dot A_u=${sig(cg.ac.Au, 3)}$、$R_i=${R(cg.ac.Ri)}$。信号源内阻 $R_{\\mathrm{sig}}=${R(Rsrc)}$，分别求两者的源电压放大倍数。`,
      parts: [num("cs", "共源 $\\dot A_{us}$", aus(cs), "1", "−5", { signMessage: "共源反相。" }), num("cg", "共栅 $\\dot A_{us}$", aus(cg), "1", "0.5", { signMessage: "共栅同相。" })],
      hints: ["$\\dot A_{us}=\\dfrac{R_i}{R_{\\mathrm{sig}}+R_i}\\dot A_u$。"],
      solution: `共源 ${sig(aus(cs), 3)}，共栅 ${sig(aus(cg), 3)}。共栅电路的小输入电阻使它不适合直接接高内阻信号源。`,
    };
  }),
  gen({ id: "cd-g-compare", level: 3, topic: T5, title: "源极跟随器与射极跟随器" }, (g) => {
    const gm = g.pick([1, 2, 3, 5]) * 1e-3;
    const RSp = g.pick([2e3, 5e3, 10e3]);
    const Auf = (gm * RSp) / (1 + gm * RSp);
    const IC = g.pick([1, 2]) * 1e-3;
    const beta = 100;
    const rbe = rbeOf((IC * (1 + beta)) / beta, beta, 200);
    const Aub = followerGain(beta, rbe, RSp);
    return {
      prompt: `源极跟随器 $g_m=${mS(gm)}$；射极跟随器 $I_{CQ}=${A(IC)}$、$\\beta=100$、$r_{bb'}=200\\,\\Omega$。两者的输出端交流负载都是 ${R(RSp)}。分别求二者的 $\\dot A_u$。`,
      parts: [num("f", "源极跟随器", Auf, "1", "0.9", { tol: 0.005 }), num("b", "射极跟随器", Aub, "1", "0.99", { tol: 0.003 })],
      hints: ["源极：$g_mR_S'/(1+g_mR_S')$。", "射极：$(1+\\beta)R_L'/[r_{be}+(1+\\beta)R_L']$，$r_{be}=r_{bb'}+(1+\\beta)U_T/I_{EQ}$。"],
      solution: `源极跟随器 ${sig(Auf, 4)}，射极跟随器 ${sig(Aub, 4)}。`,
    };
  }),
  gen({ id: "cdcg-g-choose", level: 3, topic: T5, title: "选择 FET 组态" }, (g) => {
    const need = g.pick(["hiZ", "buffer", "hf"] as const);
    const opts = ["共源", "共漏", "共栅"];
    const ans = { hiZ: 0, buffer: 1, hf: 2 }[need];
    const text = { hiZ: "需要电压放大（约 10 倍、反相），且输入端接内阻约 1 MΩ 的压电传感器", buffer: "需要把内阻约 1 MΩ 的信号源的电压不衰减地送到 2 kΩ 的负载上", hf: "前级输出电阻很小，需要同相电压放大且高频特性好" }[need];
    return {
      prompt: `${text}。最合适的 FET 组态是：`,
      choice: { options: opts, answer: ans, why: [ans === 0 ? "正确：共源既有电压放大又有极高输入电阻。" : "共源反相放大，输出电阻约为 $R_d$。", ans === 1 ? "正确：共漏输入电阻极大、输出电阻小、增益接近 1。" : "共漏没有电压放大作用。", ans === 2 ? "正确：共栅同相放大、高频特性好，输入电阻小但前级输出电阻也小。" : "共栅输入电阻很小，会严重衰减高内阻信号源。"] },
      hints: ["对照三种组态的 $A_u$、$R_i$、$R_o$。"],
      solution: `${opts[ans]}。`,
    };
  }),
  concept({
    id: "cdcg-k-map",
    level: 3,
    topic: T5,
    title: "由 BJT 公式得到 FET 公式",
    prompt: "说明怎样由共集、共基电路的公式直接得到共漏、共栅电路的公式。",
    keyPoints: ["FET 栅极不取电流，相当于 r_be → ∞ 且 β → ∞", "保持 β/r_be → g_m", "共集 A_u 分子分母同除以 r_be 得 g_m R_L'/(1+g_m R_L')", "共基 R_i 中 r_be/(1+β) → 1/g_m"],
    reference: "令 BJT 公式中 $\\beta\\to\\infty$、$r_{be}\\to\\infty$，同时 $\\beta/r_{be}\\to g_m$。例如共集 $\\dot A_u=\\frac{(1+\\beta)R_L'}{r_{be}+(1+\\beta)R_L'}\\to\\frac{g_mR_L'}{1+g_mR_L'}$；共基 $R_i\\approx r_{be}/(1+\\beta)\\to1/g_m$。",
  }),
];

export const CH4_QUESTIONS: QuestionTemplate[] = [...structQ, ...curvesQ, ...ssQ, ...csQ, ...cdcgQ];
