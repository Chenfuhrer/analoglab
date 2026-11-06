/**
 * 参数化题目生成器：同一 seed 必然生成同一道题（错题本可复现）。
 * 所有标准答案由 src/simulations 计算核心给出；常见错误由“错误公式”反算，用于错误原因分析。
 */
import { analyzeCE, type CEAnalysis } from "@/simulations/bjt/ce";
import { DEFAULT_CE, type CEParams } from "@/simulations/bjt/types";
import { formatSI, par, sig } from "@/simulations/units";
import { acSteps, dcSteps } from "@/formulas/ce-steps";
import type { QuestionTemplate } from "./types";

/* ───────── 随机数 ───────── */
export function rng(seed: number) {
  let a = seed >>> 0 || 0x9e3779b9;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    pick<T>(xs: readonly T[]): T {
      return xs[Math.floor(next() * xs.length)];
    },
    range(lo: number, hi: number) {
      return lo + (hi - lo) * next();
    },
  };
}

const E12 = [1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2];

/** 取最接近的 E12 标称值 */
export function e12(x: number): number {
  const dec = Math.pow(10, Math.floor(Math.log10(x)));
  let best = E12[0] * dec;
  for (const m of [...E12.map((v) => v * dec), 10 * dec]) if (Math.abs(Math.log(m / x)) < Math.abs(Math.log(best / x))) best = m;
  return Number(best.toPrecision(2));
}

const R = (v: number) => formatSI(v, "Ω");
const fmtV = (v: number) => formatSI(v, "V");

function base(): CEParams {
  return { ...DEFAULT_CE, Rs: 0, Re1: 0, Re2: 0, hasCe: true, UCES: 0.3, UT: 0.026 };
}

/** 生成一个处于放大区、U_CEQ 适中的固定偏置电路 */
function makeFixed(seed: number, withLoad = true): { p: CEParams; a: CEAnalysis } {
  const g = rng(seed);
  for (let k = 0; k < 60; k++) {
    const VCC = g.pick([6, 9, 12, 15]);
    const beta = g.pick([50, 60, 80, 100, 120, 150]);
    const ICt = g.range(0.8e-3, 3e-3);
    const Rc = e12((VCC * g.range(0.35, 0.6)) / ICt);
    const Rb = e12((beta * (VCC - 0.7)) / ICt);
    const RL = withLoad ? e12(Rc * g.range(0.6, 2.5)) : Infinity;
    const rbb = g.pick([100, 200, 300]);
    const p: CEParams = { ...base(), topology: "fixed", VCC, beta, Rc, Rb, RL, rbb };
    const a = analyzeCE(p);
    if (a.dc.region === "active" && a.dc.UCEQ > 0.2 * VCC && a.dc.UCEQ < 0.8 * VCC) return { p, a };
  }
  const p = { ...base() };
  return { p, a: analyzeCE(p) };
}

/** 分压偏置（R_e1 不旁路 + R_e2 旁路），满足估算条件 */
function makeDivider(seed: number): { p: CEParams; a: CEAnalysis } {
  const g = rng(seed);
  for (let k = 0; k < 80; k++) {
    const VCC = g.pick([12, 15]);
    const beta = g.pick([50, 60, 80, 100, 120]);
    const Rb1 = e12(g.range(4e3, 15e3));
    const Rb2 = e12(Rb1 * g.range(2.5, 5));
    const RE = e12(g.range(0.8e3, 2.5e3));
    const Re1 = g.pick([100, 150, 200, 300, 470]);
    const Re2 = Math.max(100, e12(RE - Re1));
    const UBQ = (VCC * Rb1) / (Rb1 + Rb2);
    const IE = (UBQ - 0.7) / (Re1 + Re2);
    if (IE <= 0) continue;
    const Rc = e12((VCC * g.range(0.3, 0.45)) / IE);
    const RL = e12(Rc * g.range(0.8, 2));
    const rbb = g.pick([100, 200, 300]);
    const p: CEParams = { ...base(), topology: "divider", VCC, beta, Rb1, Rb2, Re1, Re2, hasCe: true, Rc, RL, rbb };
    const a = analyzeCE(p);
    if (a.dc.region === "active" && a.dc.estimate && a.dc.estimate.ratio >= 10 && a.dc.UCEQ > 0.2 * VCC && a.dc.UCEQ < 0.75 * VCC) return { p, a };
  }
  return { p: { ...base(), topology: "divider", Rb1: 10e3, Rb2: 33e3, Re1: 200, Re2: 1e3 }, a: analyzeCE({ ...base(), topology: "divider", Rb1: 10e3, Rb2: 33e3, Re1: 200, Re2: 1e3 }) };
}

const SIGN_MSG = "数值大小正确，但符号错误：共射放大电路的输出与输入反相，$\\dot A_u$ 应为负。";

/* ═════════ L2：固定偏置 Q 点 ═════════ */
const fixedQ: QuestionTemplate = {
  id: "gen-fixed-q",
  level: 2,
  topic: "ce-dc",
  title: "固定偏置电路的静态工作点",
  generate(seed) {
    const { p, a } = makeFixed(seed, false);
    const IBwrong = p.VCC / p.Rb;
    return {
      key: `gen-fixed-q:${seed}`,
      id: "gen-fixed-q",
      seed,
      level: 2,
      topic: "ce-dc",
      title: "固定偏置电路的静态工作点",
      prompt: `电路如图（负载开路）。已知 $V_{CC}=${sig(p.VCC, 3)}\\,\\mathrm V$，$R_b=${R(p.Rb)}$，$R_c=${R(p.Rc)}$，$\\beta=${p.beta}$，$U_{BEQ}=0.7\\,\\mathrm V$。求静态工作点 $I_{BQ}$、$I_{CQ}$、$U_{CEQ}$，并判断工作区。`,
      figure: { params: p, mode: "full" },
      body: {
        kind: "numeric",
        parts: [
          { id: "IBQ", label: "$I_{BQ}$", expected: a.dc.IBQ, dim: "A", unitHint: "µA", mistakes: [{ value: IBwrong, message: "看起来忘记减去 $U_{BEQ}$：基极回路 KVL 为 $V_{CC}=I_{BQ}R_b+U_{BEQ}$。" }] },
          { id: "ICQ", label: "$I_{CQ}$", expected: a.dc.ICQ, dim: "A", unitHint: "mA", mistakes: [{ value: p.beta * IBwrong, message: "$I_{BQ}$ 算错了（漏减 $U_{BEQ}$），导致 $I_{CQ}$ 偏大。" }] },
          {
            id: "UCEQ",
            label: "$U_{CEQ}$",
            expected: a.dc.UCEQ,
            dim: "V",
            unitHint: "V",
            mistakes: [
              { value: p.VCC - p.beta * IBwrong * p.Rc, message: "$I_{CQ}$ 偏大（漏减 $U_{BEQ}$）导致 $U_{CEQ}$ 偏小。" },
              { value: a.dc.ICQ * p.Rc, message: "这是 $R_c$ 上的压降 $I_{CQ}R_c$，$U_{CEQ}=V_{CC}-I_{CQ}R_c$。" },
            ],
          },
        ],
      },
      hints: [
        "先画直流通路：$C_1$、$C_2$ 开路，只剩 $V_{CC}$、$R_b$、$R_c$ 与晶体管。",
        "基极回路 KVL：$V_{CC}=I_{BQ}R_b+U_{BEQ}$。",
        "假设放大区：$I_{CQ}=\\beta I_{BQ}$；集电极回路：$U_{CEQ}=V_{CC}-I_{CQ}R_c$。最后验证 $U_{CEQ}>U_{CES}$。",
      ],
      solution: `$U_{CEQ}=${fmtV(a.dc.UCEQ)}>U_{CES}$，管子工作在放大区。`,
      solutionSteps: dcSteps(a),
    };
  },
};

/* ═════════ L2：固定偏置动态参数 ═════════ */
const fixedDyn: QuestionTemplate = {
  id: "gen-fixed-ac",
  level: 2,
  topic: "ce-gain",
  title: "共射电路的 r_be、A_u、R_i、R_o",
  generate(seed) {
    const { p, a } = makeFixed(seed * 7 + 3, true);
    const ac = a.ac;
    const rbpe = ac.rbe - p.rbb;
    const re = p.UT / a.dc.IEQ;
    return {
      key: `gen-fixed-ac:${seed}`,
      id: "gen-fixed-ac",
      seed,
      level: 2,
      topic: "ce-gain",
      title: "共射电路的 r_be、A_u、R_i、R_o",
      prompt: `电路如图，电容对交流信号可视为短路。已知 $V_{CC}=${sig(p.VCC, 3)}\\,\\mathrm V$，$R_b=${R(p.Rb)}$，$R_c=${R(p.Rc)}$，$R_L=${R(p.RL)}$，$\\beta=${p.beta}$，$r_{bb'}=${R(p.rbb)}$，$U_{BEQ}=0.7\\,\\mathrm V$，$U_T=26\\,\\mathrm{mV}$。求 $r_{be}$、$\\dot A_u$、$R_i$、$R_o$。`,
      figure: { params: p, mode: "full" },
      body: {
        kind: "numeric",
        parts: [
          {
            id: "rbe",
            label: "$r_{be}$",
            expected: ac.rbe,
            dim: "Ω",
            unitHint: "kΩ",
            mistakes: [
              { value: rbpe, message: "漏掉了基区体电阻 $r_{bb'}$：$r_{be}=r_{bb'}+(1+\\beta)U_T/I_{EQ}$。" },
              { value: p.rbb + re, message: "$U_T/I_{EQ}$ 是发射极动态电阻，从基极看进去要乘以 $(1+\\beta)$。" },
            ],
          },
          {
            id: "Au",
            label: "$\\dot A_u$",
            expected: ac.Au,
            dim: "1",
            unitHint: "−50",
            signMessage: SIGN_MSG,
            mistakes: [
              { value: (-p.beta * p.Rc) / ac.rbe, message: "这是空载放大倍数：接了负载后交流负载应为 $R_L'=R_c\\para R_L$。" },
              { value: (-p.beta * ac.RLp) / rbpe, message: "$r_{be}$ 漏掉了 $r_{bb'}$。" },
            ],
          },
          { id: "Ri", label: "$R_i$", expected: ac.Ri, dim: "Ω", unitHint: "kΩ", mistakes: [{ value: p.Rb, message: "$R_i$ 是 $R_b$ 与 $r_{be}$ 的**并联**，不是 $R_b$ 本身。" }, { value: p.Rb + ac.rbe, message: "交流通路中 $R_b$ 与 $r_{be}$ 是并联关系（$R_b$ 上端交流接地）。" }] },
          { id: "Ro", label: "$R_o$", expected: ac.Ro, dim: "Ω", unitHint: "kΩ", mistakes: [{ value: ac.RLp, message: "求输出电阻时必须**断开负载** $R_L$：$R_o\\approx R_c$。" }] },
        ],
      },
      hints: [
        "先求 Q 点：$I_{BQ}=(V_{CC}-U_{BEQ})/R_b$，$I_{EQ}=(1+\\beta)I_{BQ}$。",
        "$r_{be}=r_{bb'}+(1+\\beta)\\dfrac{U_T}{I_{EQ}}$。",
        "画微变等效电路：$\\dot A_u=-\\beta R_L'/r_{be}$，$R_i=R_b\\para r_{be}$，$R_o\\approx R_c$。",
      ],
      solution: `$I_{EQ}=${formatSI(a.dc.IEQ, "A")}$，$r_{be}=${R(ac.rbe)}$，$\\dot A_u\\approx${sig(ac.Au, 4)}$，$R_i=${R(ac.Ri)}$，$R_o=${R(ac.Ro)}$。`,
      solutionSteps: [...dcSteps(a), ...acSteps(a)],
    };
  },
};

/* ═════════ L2：分压偏置估算 ═════════ */
const dividerQ: QuestionTemplate = {
  id: "gen-divider-q",
  level: 2,
  topic: "ce-dc",
  title: "分压式偏置电路的静态估算",
  generate(seed) {
    const { p, a } = makeDivider(seed * 13 + 5);
    const est = a.dc.estimate!;
    const RE = p.Re1 + p.Re2;
    return {
      key: `gen-divider-q:${seed}`,
      id: "gen-divider-q",
      seed,
      level: 2,
      topic: "ce-dc",
      title: "分压式偏置电路的静态估算",
      prompt: `电路如图。$V_{CC}=${sig(p.VCC, 3)}\\,\\mathrm V$，$R_{b1}=${R(p.Rb1)}$（下偏置），$R_{b2}=${R(p.Rb2)}$（上偏置），$R_c=${R(p.Rc)}$，$R_{e1}=${R(p.Re1)}$，$R_{e2}=${R(p.Re2)}$，$\\beta=${p.beta}$，$U_{BEQ}=0.7\\,\\mathrm V$。用估算法求 $U_{BQ}$、$I_{EQ}$、$U_{CEQ}$（精确解同样判对）。`,
      figure: { params: p, mode: "full" },
      body: {
        kind: "numeric",
        parts: [
          { id: "UBQ", label: "$U_{BQ}$", expected: est.UBQ, alts: [a.dc.UBQ], dim: "V", unitHint: "V", mistakes: [{ value: (p.VCC * p.Rb2) / (p.Rb1 + p.Rb2), message: "分压比写反了：$U_{BQ}$ 取下偏置电阻 $R_{b1}$ 上的电压。" }] },
          { id: "IEQ", label: "$I_{EQ}$", expected: est.IEQ, alts: [a.dc.IEQ], dim: "A", unitHint: "mA", mistakes: [{ value: est.UBQ / RE, message: "忘记减去 $U_{BEQ}$：$I_{EQ}=(U_{BQ}-U_{BEQ})/R_e$。" }, { value: (est.UBQ - 0.7) / p.Re2, message: "直流通路中 $C_e$ 开路，$R_{e1}$、$R_{e2}$ 都在发射极回路里。" }] },
          { id: "UCEQ", label: "$U_{CEQ}$", expected: est.UCEQ, alts: [a.dc.UCEQ], dim: "V", unitHint: "V", tol: 0.04, mistakes: [{ value: p.VCC - est.IEQ * p.Rc, message: "漏掉了射极电阻上的压降：$U_{CEQ}\\approx V_{CC}-I_{EQ}(R_c+R_e)$。" }] },
        ],
      },
      hints: [
        "估算法假设分压器电流远大于 $I_{BQ}$：$U_{BQ}\\approx\\dfrac{R_{b1}}{R_{b1}+R_{b2}}V_{CC}$。",
        "$U_{EQ}=U_{BQ}-U_{BEQ}$，直流通路中 $C_e$ 开路，$R_E=R_{e1}+R_{e2}$。",
        "$U_{CEQ}\\approx V_{CC}-I_{EQ}(R_c+R_E)$（用了 $I_C\\approx I_E$）。",
      ],
      solution: `估算法：$U_{BQ}\\approx${fmtV(est.UBQ)}$，$I_{EQ}\\approx${formatSI(est.IEQ, "A")}$，$U_{CEQ}\\approx${fmtV(est.UCEQ)}$。戴维南精确解：$I_{EQ}=${formatSI(a.dc.IEQ, "A")}$，$U_{CEQ}=${fmtV(a.dc.UCEQ)}$（条件 $(1+\\beta)R_E/R_B=${sig(est.ratio, 3)}$）。`,
      solutionSteps: dcSteps(a),
    };
  },
};

/* ═════════ L2：测量法求 R_o ═════════ */
const roMeasure: QuestionTemplate = {
  id: "gen-ro-measure",
  level: 2,
  topic: "ce-rio",
  title: "由空载与带载输出电压求输出电阻",
  generate(seed) {
    const g = rng(seed * 31 + 11);
    const Ro = e12(g.range(1e3, 9e3));
    const RL = e12(g.range(1e3, 9e3));
    const Uo1 = Number(g.range(1.5, 5).toFixed(1));
    const Uo = (Uo1 * RL) / (Ro + RL);
    const UoR = Number(Uo.toPrecision(3));
    const RoTrue = (Uo1 / UoR - 1) * RL;
    return {
      key: `gen-ro-measure:${seed}`,
      id: "gen-ro-measure",
      seed,
      level: 2,
      topic: "ce-rio",
      title: "由空载与带载输出电压求输出电阻",
      prompt: `保持输入信号不变，测得某放大电路空载时输出电压有效值 $U_o'=${Uo1}\\,\\mathrm V$；接入 $R_L=${R(RL)}$ 后输出降为 $U_o=${UoR}\\,\\mathrm V$。求输出电阻 $R_o$。`,
      body: {
        kind: "numeric",
        parts: [
          {
            id: "Ro",
            label: "$R_o$",
            expected: RoTrue,
            dim: "Ω",
            unitHint: "kΩ",
            mistakes: [
              { value: (Uo1 / UoR) * RL, message: "公式少了“−1”：由 $U_o=U_o'\\frac{R_L}{R_o+R_L}$ 得 $R_o=\\left(\\frac{U_o'}{U_o}-1\\right)R_L$。" },
              { value: (UoR / Uo1) * RL, message: "比值倒过来了。" },
            ],
          },
        ],
      },
      hints: ["把放大电路的输出端看成“电压源 $U_o'$ 串联内阻 $R_o$”。", "接上 $R_L$ 后分压：$U_o=U_o'\\dfrac{R_L}{R_o+R_L}$，解出 $R_o$。"],
      solution: `$R_o=\\left(\\frac{U_o'}{U_o}-1\\right)R_L=\\left(\\frac{${Uo1}}{${UoR}}-1\\right)\\times${R(RL)}\\approx${R(RoTrue)}$。`,
    };
  },
};

/* ═════════ L2：最大不失真输出 ═════════ */
const uom: QuestionTemplate = {
  id: "gen-uom",
  level: 2,
  topic: "ce-distortion",
  title: "最大不失真输出电压",
  generate(seed) {
    const { p, a } = makeFixed(seed * 17 + 9, true);
    const { dc, ac } = a;
    const wrongLimit = ac.limitedBy === "cutoff" ? dc.UCEQ - p.UCES : dc.ICQ * ac.RLp;
    return {
      key: `gen-uom:${seed}`,
      id: "gen-uom",
      seed,
      level: 2,
      topic: "ce-distortion",
      title: "最大不失真输出电压",
      prompt: `电路如图。已知 $V_{CC}=${sig(p.VCC, 3)}\\,\\mathrm V$，$R_b=${R(p.Rb)}$，$R_c=${R(p.Rc)}$，$R_L=${R(p.RL)}$，$\\beta=${p.beta}$，$U_{BEQ}=0.7\\,\\mathrm V$，$U_{CES}=0.3\\,\\mathrm V$。求最大不失真输出电压的幅值 $U_{om}$。`,
      figure: { params: p, mode: "full" },
      body: {
        kind: "numeric",
        parts: [
          {
            id: "Uom",
            label: "$U_{om}$",
            expected: ac.Uom,
            dim: "V",
            unitHint: "V",
            mistakes: [
              { value: wrongLimit, message: "两个限制取了较大的那个：$U_{om}$ 取 $U_{CEQ}-U_{CES}$ 与 $I_{CQ}R_L'$ 中的**较小值**。" },
              { value: dc.ICQ * p.Rc, message: "截止限应使用交流负载 $R_L'=R_c\\para R_L$，而不是 $R_c$。" },
              { value: Math.min(dc.UCEQ, dc.ICQ * ac.RLp), message: "饱和一侧要减去 $U_{CES}$。" },
            ],
          },
        ],
      },
      hints: ["先求 Q 点 $I_{CQ}$、$U_{CEQ}$。", "饱和限：$U_{CEQ}-U_{CES}$；截止限：$I_{CQ}R_L'$。", "取两者较小值。"],
      solution: `$I_{CQ}=${formatSI(dc.ICQ, "A")}$，$U_{CEQ}=${fmtV(dc.UCEQ)}$，$R_L'=${R(ac.RLp)}$。饱和限 $${sig(dc.UCEQ - p.UCES, 3)}\\,\\mathrm V$，截止限 $${sig(dc.ICQ * ac.RLp, 3)}\\,\\mathrm V$，故 $U_{om}=${fmtV(ac.Uom)}$（${ac.limitedBy === "cutoff" ? "截止失真先出现" : "饱和失真先出现"}）。`,
      solutionSteps: dcSteps(a),
    };
  },
};

/* ═════════ L2：A_us ═════════ */
const aus: QuestionTemplate = {
  id: "gen-aus",
  level: 2,
  topic: "ce-rio",
  title: "考虑信号源内阻的电压放大倍数",
  generate(seed) {
    const { p: p0 } = makeFixed(seed * 19 + 1, true);
    const g = rng(seed * 23 + 2);
    const p = { ...p0, Rs: e12(g.range(300, 3000)) };
    const a = analyzeCE(p);
    return {
      key: `gen-aus:${seed}`,
      id: "gen-aus",
      seed,
      level: 2,
      topic: "ce-rio",
      title: "考虑信号源内阻的电压放大倍数",
      prompt: `电路如图，信号源内阻 $R_s=${R(p.Rs)}$。已知 $V_{CC}=${sig(p.VCC, 3)}\\,\\mathrm V$，$R_b=${R(p.Rb)}$，$R_c=${R(p.Rc)}$，$R_L=${R(p.RL)}$，$\\beta=${p.beta}$，$r_{bb'}=${R(p.rbb)}$，$U_{BEQ}=0.7\\,\\mathrm V$。求 $R_i$ 与 $\\dot A_{us}=\\dot U_o/\\dot U_s$。`,
      figure: { params: p, mode: "full" },
      body: {
        kind: "numeric",
        parts: [
          { id: "Ri", label: "$R_i$", expected: a.ac.Ri, dim: "Ω", unitHint: "kΩ", mistakes: [{ value: a.ac.Ri + p.Rs, message: "$R_i$ 的定义不包含信号源内阻 $R_s$。" }] },
          {
            id: "Aus",
            label: "$\\dot A_{us}$",
            expected: a.ac.Aus,
            dim: "1",
            unitHint: "−30",
            signMessage: SIGN_MSG,
            mistakes: [{ value: a.ac.Au, message: "这是 $\\dot A_u$；$\\dot A_{us}$ 还要乘以分压比 $R_i/(R_s+R_i)$。" }],
          },
        ],
      },
      hints: ["先求 $\\dot A_u$ 与 $R_i$。", "$\\dot U_i=\\dfrac{R_i}{R_s+R_i}\\dot U_s$，所以 $\\dot A_{us}=\\dfrac{R_i}{R_s+R_i}\\dot A_u$。"],
      solution: `$\\dot A_u\\approx${sig(a.ac.Au, 4)}$，$R_i=${R(a.ac.Ri)}$，$\\dot A_{us}=\\frac{R_i}{R_s+R_i}\\dot A_u\\approx${sig(a.ac.Aus, 4)}$。`,
      solutionSteps: [...dcSteps(a), ...acSteps(a)],
    };
  },
};

/* ═════════ L1：由电位判断工作区 ═════════ */
const regionJudge: QuestionTemplate = {
  id: "gen-region",
  level: 1,
  topic: "ce-bias",
  title: "由三个电极的电位判断工作状态",
  generate(seed) {
    const g = rng(seed * 41 + 7);
    const kind = g.pick(["active", "saturation", "cutoff"] as const);
    const VE = Number(g.range(0, 3).toFixed(1));
    let VB: number;
    let VC: number;
    if (kind === "active") {
      VB = Number((VE + 0.7).toFixed(1));
      VC = Number((VB + g.range(1.5, 7)).toFixed(1));
    } else if (kind === "saturation") {
      VB = Number((VE + 0.7).toFixed(1));
      VC = Number((VE + g.pick([0.2, 0.3])).toFixed(1));
    } else {
      VB = Number((VE + g.pick([-1, -0.5, 0, 0.2])).toFixed(1));
      VC = Number((VE + g.range(4, 10)).toFixed(1));
    }
    const answer = { active: 0, saturation: 1, cutoff: 2 }[kind];
    const ube = Number((VB - VE).toFixed(1));
    const ubc = Number((VB - VC).toFixed(1));
    const explain = `$U_{BE}=${ube}\\,\\mathrm V$，$U_{BC}=${ubc}\\,\\mathrm V$：发射结${ube >= 0.6 ? "正偏导通" : "未导通"}，集电结${ubc > 0 ? "正偏" : "反偏"}。`;
    return {
      key: `gen-region:${seed}`,
      id: "gen-region",
      seed,
      level: 1,
      topic: "ce-bias",
      title: "由三个电极的电位判断工作状态",
      prompt: `某 NPN 硅管在电路中测得各极对地电位：$V_B=${VB}\\,\\mathrm V$，$V_E=${VE}\\,\\mathrm V$，$V_C=${VC}\\,\\mathrm V$。该管工作在：`,
      body: {
        kind: "choice",
        options: ["放大区", "饱和区", "截止区"],
        answer,
        why: [
          `放大区要求发射结正偏、集电结反偏。${explain}`,
          `饱和区：两个结都正偏（$U_{CE}<U_{BE}$）。${explain}`,
          `截止区：发射结未导通（硅管 $U_{BE}<0.5\\,\\mathrm V$ 左右）。${explain}`,
        ],
      },
      hints: ["分别计算 $U_{BE}=V_B-V_E$ 和 $U_{BC}=V_B-V_C$。", "发射结导通、集电结反偏 → 放大；两结都正偏 → 饱和；发射结不导通 → 截止。"],
      solution: explain,
    };
  },
};

/* ═════════ L2/L3：先出现哪种失真 ═════════ */
const firstDistortion: QuestionTemplate = {
  id: "gen-first-distortion",
  level: 2,
  topic: "ce-distortion",
  title: "输入增大时先出现哪种失真",
  generate(seed) {
    const g = rng(seed * 53 + 17);
    // 有意生成 Q 点偏高或偏低的电路
    const VCC = g.pick([9, 12, 15]);
    const beta = g.pick([60, 80, 100]);
    const Rc = e12(g.range(1.5e3, 5e3));
    const high = g.next() < 0.5;
    const UCEt = high ? VCC * g.range(0.15, 0.3) : VCC * g.range(0.7, 0.85);
    const IC = (VCC - UCEt) / Rc;
    const p: CEParams = { ...base(), topology: "fixed", VCC, beta, Rc, Rb: e12((beta * (VCC - 0.7)) / IC), RL: e12(Rc * g.range(0.8, 2)), rbb: 200 };
    const a = analyzeCE(p);
    const cutoff = a.ac.limitedBy === "cutoff";
    return {
      key: `gen-first-distortion:${seed}`,
      id: "gen-first-distortion",
      seed,
      level: 2,
      topic: "ce-distortion",
      title: "输入增大时先出现哪种失真",
      prompt: `NPN 共射电路如图：$V_{CC}=${VCC}\\,\\mathrm V$，$R_b=${R(p.Rb)}$，$R_c=${R(p.Rc)}$，$R_L=${R(p.RL)}$，$\\beta=${beta}$，$U_{CES}=0.3\\,\\mathrm V$。逐渐增大正弦输入，输出波形首先出现：`,
      figure: { params: p, mode: "full" },
      body: {
        kind: "choice",
        options: ["截止失真，$u_o$ 顶部被削平", "截止失真，$u_o$ 底部被削平", "饱和失真，$u_o$ 底部被削平", "饱和失真，$u_o$ 顶部被削平"],
        answer: cutoff ? 0 : 2,
        why: [
          cutoff ? "正确：$I_{CQ}R_L'<U_{CEQ}-U_{CES}$，截止先发生；NPN 共射截止时 $u_o$ 正半周被削平。" : "截止限 $I_{CQ}R_L'$ 比饱和限大，截止不会先发生。",
          "NPN 共射截止时 $i_C$ 不能再减小，对应 $u_{CE}$ 不能再增大——削的是 $u_o$ 的**顶部**。",
          cutoff ? "饱和限 $U_{CEQ}-U_{CES}$ 比截止限大，饱和不会先发生。" : "正确：$U_{CEQ}-U_{CES}<I_{CQ}R_L'$，Q 点偏高，饱和先发生；$u_{CE}$ 降不下去，$u_o$ 底部被削平。",
          "饱和时 $u_{CE}$ 不能再减小，削的是 $u_o$ 的**底部**。",
        ],
      },
      hints: ["先求 $I_{CQ}$、$U_{CEQ}$ 和 $R_L'$。", "比较 $U_{CEQ}-U_{CES}$（饱和限）与 $I_{CQ}R_L'$（截止限），小的先发生。", "NPN 共射：截止削顶、饱和削底。"],
      solution: `$I_{CQ}=${formatSI(a.dc.ICQ, "A")}$，$U_{CEQ}=${fmtV(a.dc.UCEQ)}$，$R_L'=${R(a.ac.RLp)}$：饱和限 $${sig(a.ac.UomSat, 3)}\\,\\mathrm V$，截止限 $${sig(a.ac.UomCut, 3)}\\,\\mathrm V$ → ${cutoff ? "截止失真先出现（顶部削平）" : "饱和失真先出现（底部削平）"}。`,
      solutionSteps: dcSteps(a),
    };
  },
};

/* ═════════ L3：分压偏置综合题 ═════════ */
const dividerFull: QuestionTemplate = {
  id: "gen-divider-full",
  level: 3,
  topic: "ce-example",
  title: "分压偏置 + 部分旁路：动态参数与 C_e 开路",
  generate(seed) {
    const { p, a } = makeDivider(seed * 29 + 3);
    const est = a.dc.estimate!;
    const open = analyzeCE({ ...p, hasCe: false });
    const rbeEst = p.rbb + ((1 + p.beta) * p.UT) / est.IEQ;
    const AuEst = (-p.beta * a.ac.RLp) / (rbeEst + (1 + p.beta) * p.Re1);
    const RiEst = par(a.dc.RB, rbeEst + (1 + p.beta) * p.Re1);
    const AuOpenEst = (-p.beta * a.ac.RLp) / (rbeEst + (1 + p.beta) * (p.Re1 + p.Re2));
    const tol = 0.04;
    return {
      key: `gen-divider-full:${seed}`,
      id: "gen-divider-full",
      seed,
      level: 3,
      topic: "ce-example",
      title: "分压偏置 + 部分旁路：动态参数与 C_e 开路",
      prompt: `电路如图。$V_{CC}=${sig(p.VCC, 3)}\\,\\mathrm V$，$R_{b1}=${R(p.Rb1)}$（下），$R_{b2}=${R(p.Rb2)}$（上），$R_c=${R(p.Rc)}$，$R_L=${R(p.RL)}$，$R_{e1}=${R(p.Re1)}$（不旁路），$R_{e2}=${R(p.Re2)}$（被 $C_e$ 旁路），$\\beta=${p.beta}$，$r_{bb'}=${R(p.rbb)}$，$U_{BEQ}=0.7\\,\\mathrm V$。(1) 求 $r_{be}$、$\\dot A_u$、$R_i$、$R_o$；(2) 若 $C_e$ 开路，求 $\\dot A_u'$ 与 $R_i'$。（用估算法或精确解均可）`,
      figure: { params: p, mode: "full" },
      body: {
        kind: "numeric",
        parts: [
          { id: "rbe", label: "$r_{be}$", expected: a.ac.rbe, alts: [rbeEst], dim: "Ω", unitHint: "kΩ", tol, mistakes: [{ value: ((1 + p.beta) * p.UT) / a.dc.IEQ, message: "漏掉了 $r_{bb'}$。" }] },
          {
            id: "Au",
            label: "$\\dot A_u$",
            expected: a.ac.Au,
            alts: [AuEst],
            dim: "1",
            unitHint: "−8",
            tol,
            signMessage: SIGN_MSG,
            mistakes: [
              { value: (-p.beta * a.ac.RLp) / a.ac.rbe, message: "$R_{e1}$ 没有被旁路，仍在交流通路中：分母应为 $r_{be}+(1+\\beta)R_{e1}$。" },
              { value: open.ac.Au, message: "$C_e$ 把 $R_{e2}$ 交流短路了，只有 $R_{e1}$ 留在交流通路中。" },
              { value: (-p.beta * p.Rc) / (a.ac.rbe + (1 + p.beta) * p.Re1), message: "忽略了负载：应使用 $R_L'=R_c\\para R_L$。" },
            ],
          },
          { id: "Ri", label: "$R_i$", expected: a.ac.Ri, alts: [RiEst], dim: "Ω", unitHint: "kΩ", tol, mistakes: [{ value: par(a.dc.RB, a.ac.rbe), message: "从基极看进去的电阻应为 $r_{be}+(1+\\beta)R_{e1}$。" }] },
          { id: "Ro", label: "$R_o$", expected: a.ac.Ro, dim: "Ω", unitHint: "kΩ", mistakes: [{ value: a.ac.RLp, message: "求 $R_o$ 时要断开 $R_L$。" }] },
          { id: "Au2", label: "$C_e$ 开路：$\\dot A_u'$", expected: open.ac.Au, alts: [AuOpenEst], dim: "1", unitHint: "−1.5", tol, signMessage: SIGN_MSG, mistakes: [{ value: -a.ac.RLp / (p.Re1 + p.Re2), message: "这是近似式 $-R_L'/R_e$ 的结果，精度不够（与精确值相差超过 4%）；请用完整公式。", tol: 0.01 }] },
          { id: "Ri2", label: "$C_e$ 开路：$R_i'$", expected: open.ac.Ri, alts: [par(a.dc.RB, rbeEst + (1 + p.beta) * (p.Re1 + p.Re2))], dim: "Ω", unitHint: "kΩ", tol },
        ],
      },
      hints: [
        "直流：估算 $U_{BQ}\\approx\\frac{R_{b1}}{R_{b1}+R_{b2}}V_{CC}$，$I_{EQ}=\\frac{U_{BQ}-U_{BEQ}}{R_{e1}+R_{e2}}$；再求 $r_{be}$。",
        "交流：$C_e$ 短路 → 只有 $R_{e1}$ 留在交流通路，从基极看进去为 $r_{be}+(1+\\beta)R_{e1}$。",
        "$\\dot A_u=-\\dfrac{\\beta R_L'}{r_{be}+(1+\\beta)R_{e1}}$，$R_i=R_{b1}\\para R_{b2}\\para[r_{be}+(1+\\beta)R_{e1}]$，$R_o\\approx R_c$。",
        "$C_e$ 开路时把 $R_{e1}$ 换成 $R_{e1}+R_{e2}$；Q 点与 $R_o$ 不变。",
      ],
      solution: `精确解：$r_{be}=${R(a.ac.rbe)}$，$\\dot A_u\\approx${sig(a.ac.Au, 4)}$，$R_i=${R(a.ac.Ri)}$，$R_o=${R(a.ac.Ro)}$；$C_e$ 开路后 $\\dot A_u'\\approx${sig(open.ac.Au, 4)}$，$R_i'=${R(open.ac.Ri)}$。（估算法：$r_{be}\\approx${R(rbeEst)}$，$\\dot A_u\\approx${sig(AuEst, 4)}$）`,
      solutionSteps: [...dcSteps(a), ...acSteps(a)],
    };
  },
};

/* ═════════ L3：由 Q 点要求设计 R_b ═════════ */
const designRb: QuestionTemplate = {
  id: "gen-design-rb",
  level: 3,
  topic: "ce-dc",
  title: "按 Q 点要求设计偏置电阻",
  generate(seed) {
    const g = rng(seed * 61 + 19);
    const VCC = g.pick([9, 12, 15]);
    const beta = g.pick([50, 80, 100, 120]);
    const Rc = e12(g.range(1e3, 5e3));
    const UCE = Number((VCC * g.range(0.4, 0.6)).toFixed(1));
    const IC = (VCC - UCE) / Rc;
    const IB = IC / beta;
    const Rb = (VCC - 0.7) / IB;
    const p: CEParams = { ...base(), topology: "fixed", VCC, beta, Rc, Rb, RL: Infinity, rbb: 200 };
    return {
      key: `gen-design-rb:${seed}`,
      id: "gen-design-rb",
      seed,
      level: 3,
      topic: "ce-dc",
      title: "按 Q 点要求设计偏置电阻",
      prompt: `固定偏置共射电路，$V_{CC}=${VCC}\\,\\mathrm V$，$R_c=${R(Rc)}$，$\\beta=${beta}$，$U_{BEQ}=0.7\\,\\mathrm V$。要求静态管压降 $U_{CEQ}=${UCE}\\,\\mathrm V$，求所需的 $I_{CQ}$ 与 $R_b$。`,
      figure: { params: p, mode: "dc", caption: "直流通路" },
      body: {
        kind: "numeric",
        parts: [
          { id: "ICQ", label: "$I_{CQ}$", expected: IC, dim: "A", unitHint: "mA", mistakes: [{ value: UCE / Rc, message: "$R_c$ 上的电压是 $V_{CC}-U_{CEQ}$，不是 $U_{CEQ}$。" }] },
          {
            id: "Rb",
            label: "$R_b$",
            expected: Rb,
            dim: "Ω",
            unitHint: "kΩ",
            mistakes: [
              { value: VCC / IB, message: "忘记减去 $U_{BEQ}$：$R_b=(V_{CC}-U_{BEQ})/I_{BQ}$。" },
            ],
          },
        ],
      },
      hints: ["集电极回路：$I_{CQ}=(V_{CC}-U_{CEQ})/R_c$。", "$I_{BQ}=I_{CQ}/\\beta$。", "基极回路：$R_b=(V_{CC}-U_{BEQ})/I_{BQ}$。"],
      solution: `$I_{CQ}=\\frac{${VCC}-${UCE}}{${R(Rc)}}=${formatSI(IC, "A")}$，$I_{BQ}=${formatSI(IB, "A")}$，$R_b=\\frac{${VCC}-0.7}{I_{BQ}}\\approx${R(Rb)}$。`,
    };
  },
};


/* ═════════ L3：最大不失真输入 ═════════ */
const maxInput: QuestionTemplate = {
  id: "gen-max-input",
  level: 3,
  topic: "ce-distortion",
  title: "信号源允许的最大不失真幅值",
  generate(seed) {
    const { p: p0 } = makeFixed(seed * 67 + 23, true);
    const g = rng(seed * 71 + 5);
    const p = { ...p0, Rs: e12(g.range(300, 2000)) };
    const a = analyzeCE(p);
    const { dc, ac } = a;
    return {
      key: `gen-max-input:${seed}`,
      id: "gen-max-input",
      seed,
      level: 3,
      topic: "ce-distortion",
      title: "信号源允许的最大不失真幅值",
      prompt: `电路如图。$V_{CC}=${sig(p.VCC, 3)}\\,\\mathrm V$，$R_b=${R(p.Rb)}$，$R_c=${R(p.Rc)}$，$R_L=${R(p.RL)}$，$R_s=${R(p.Rs)}$，$\\beta=${p.beta}$，$r_{bb'}=${R(p.rbb)}$，$U_{BEQ}=0.7\\,\\mathrm V$，$U_{CES}=0.3\\,\\mathrm V$。(1) 求最大不失真输出幅值 $U_{om}$；(2) 求 $|\\dot A_{us}|$；(3) 信号源电压幅值 $U_{sm}$ 最大为多少时输出不失真？`,
      figure: { params: p, mode: "full" },
      body: {
        kind: "numeric",
        parts: [
          { id: "Uom", label: "$U_{om}$", expected: ac.Uom, dim: "V", unitHint: "V", mistakes: [{ value: Math.max(ac.UomCut, ac.UomSat), message: "应取饱和限与截止限中的**较小值**。" }, { value: dc.ICQ * p.Rc, message: "截止限用交流负载 $R_L'$，不是 $R_c$。" }] },
          { id: "Aus", label: "$|\\dot A_{us}|$", expected: Math.abs(ac.Aus), dim: "1", unitHint: "30", mistakes: [{ value: Math.abs(ac.Au), message: "这是 $|\\dot A_u|$，还要乘 $R_i/(R_s+R_i)$。" }] },
          { id: "Usm", label: "$U_{sm,\\max}$", expected: ac.UsmMax, dim: "V", unitHint: "mV", mistakes: [{ value: ac.Uom / Math.abs(ac.Au), message: "这是 $u_i$ 的最大幅值；信号源还要多承担 $R_s$ 上的压降，应除以 $|\\dot A_{us}|$。" }] },
        ],
      },
      hints: [
        "先求 Q 点与 $r_{be}$。",
        "$U_{om}=\\min\\{U_{CEQ}-U_{CES},\\ I_{CQ}R_L'\\}$。",
        "$|\\dot A_{us}|=\\frac{R_i}{R_s+R_i}\\cdot\\frac{\\beta R_L'}{r_{be}}$，$U_{sm,\\max}=U_{om}/|\\dot A_{us}|$。",
      ],
      solution: `$U_{om}=${fmtV(ac.Uom)}$（${ac.limitedBy === "cutoff" ? "截止限" : "饱和限"}），$|\\dot A_{us}|\\approx${sig(Math.abs(ac.Aus), 4)}$，$U_{sm,\\max}=U_{om}/|\\dot A_{us}|\\approx${formatSI(ac.UsmMax, "V")}$。注意：这是线性模型下的结果；输入特性的指数非线性在接近该幅值时已会造成可见的不对称。`,
      solutionSteps: [...dcSteps(a), ...acSteps(a)],
    };
  },
};

export const GENERATORS: QuestionTemplate[] = [regionJudge, fixedQ, dividerQ, fixedDyn, aus, roMeasure, uom, firstDistortion, dividerFull, designRb, maxInput];
