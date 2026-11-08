/**
 * 公式库：每条公式登记变量（含单位）、适用条件、近似假设与推导出处。
 * 每条公式通过 ref 链接到推导所在的知识点；各章新增公式见 ./chapters/。
 */
export interface FormulaVar {
  sym: string;
  name: string;
  unit: string;
}

export interface Formula {
  id: string;
  chapter: number;
  title: string;
  tex: string;
  vars: FormulaVar[];
  conditions: string[];
  /** 推导所在知识点（unit#section），无则为空 */
  ref?: string;
  tags?: string[];
}

import { CHAPTER_FORMULAS } from "./chapters";

const BASE_FORMULAS: Formula[] = [
  // ── 第 1 章 ──
  {
    id: "pn-current",
    chapter: 1,
    title: "PN 结电流方程",
    tex: String.raw`i=I_S\left(e^{u/U_T}-1\right)`,
    vars: [
      { sym: "I_S", name: "反向饱和电流", unit: "A" },
      { sym: "U_T", name: "温度电压当量 kT/q，300 K 时约 26 mV", unit: "V" },
    ],
    conditions: ["理想 PN 结；未击穿", "u ≫ U_T 时 i ≈ I_S e^{u/U_T}；u 为负且 |u| ≫ U_T 时 i ≈ −I_S"],
    ref: "pn-junction#pn-eq",
  },
  {
    id: "thermal-voltage",
    chapter: 1,
    title: "温度电压当量",
    tex: String.raw`U_T=\frac{kT}{q}\approx 26\,\mathrm{mV}\ (T\approx300\,\mathrm K)`,
    vars: [
      { sym: "k", name: "玻尔兹曼常数 1.38×10⁻²³ J/K", unit: "J/K" },
      { sym: "q", name: "电子电荷 1.6×10⁻¹⁹ C", unit: "C" },
    ],
    conditions: ["随温度线性变化"],
    ref: "semi-carriers#sc-temp",
  },
  // ── 第 2 章 ──
  {
    id: "bjt-currents",
    chapter: 2,
    title: "晶体管电流关系",
    tex: String.raw`i_E=i_B+i_C,\qquad i_C=\beta i_B,\qquad \alpha=\frac{\beta}{1+\beta}`,
    vars: [
      { sym: "\\beta", name: "共射电流放大系数", unit: "—" },
      { sym: "\\alpha", name: "共基电流放大系数", unit: "—" },
    ],
    conditions: ["i_E = i_B + i_C 恒成立（KCL）", "i_C = β i_B 仅在放大区成立"],
    ref: "ce-amplifier#ce-why",
  },
  // ── 第 3 章：共射 ──
  {
    id: "ce-ibq-fixed",
    chapter: 3,
    title: "固定偏置：静态基极电流",
    tex: String.raw`I_{BQ}=\frac{V_{CC}-U_{BEQ}}{R_b}`,
    vars: [
      { sym: "V_{CC}", name: "直流电源电压", unit: "V" },
      { sym: "U_{BEQ}", name: "发射结导通压降（硅 ≈0.7 V）", unit: "V" },
      { sym: "R_b", name: "基极偏置电阻", unit: "Ω" },
    ],
    conditions: ["恒压降模型", "射极直接接地（无 R_e）；有 R_e 时分母加 (1+β)R_e"],
    ref: "ce-amplifier#ce-dc",
    tags: ["Q点"],
  },
  {
    id: "ce-q",
    chapter: 3,
    title: "集电极电流与管压降",
    tex: String.raw`I_{CQ}=\beta I_{BQ},\qquad U_{CEQ}=V_{CC}-I_{CQ}R_c-I_{EQ}R_e`,
    vars: [
      { sym: "R_c", name: "集电极电阻", unit: "Ω" },
      { sym: "R_e", name: "射极直流电阻（无则为 0）", unit: "Ω" },
    ],
    conditions: ["放大区；算完必须验证 U_CEQ > U_CES"],
    ref: "ce-amplifier#ce-dc",
    tags: ["Q点"],
  },
  {
    id: "ce-divider",
    chapter: 3,
    title: "分压偏置估算",
    tex: String.raw`U_{BQ}\approx\frac{R_{b1}}{R_{b1}+R_{b2}}V_{CC},\quad I_{EQ}=\frac{U_{BQ}-U_{BEQ}}{R_e},\quad U_{CEQ}\approx V_{CC}-I_{EQ}(R_c+R_e)`,
    vars: [
      { sym: "R_{b1}", name: "下偏置电阻（基极→地，童诗白约定）", unit: "Ω" },
      { sym: "R_{b2}", name: "上偏置电阻（V_CC→基极）", unit: "Ω" },
    ],
    conditions: ["(1+β)R_e ≫ R_b1∥R_b2（一般 ≥10 倍），即忽略 I_BQ 对分压的影响", "精确解：戴维南等效 V_BB、R_B"],
    ref: "ce-amplifier#ce-dc",
    tags: ["Q点"],
  },
  {
    id: "ce-rbe",
    chapter: 3,
    title: "输入动态电阻 r_be",
    tex: String.raw`r_{be}=r_{bb'}+(1+\beta)\frac{U_T}{I_{EQ}}`,
    vars: [
      { sym: "r_{bb'}", name: "基区体电阻（题目给出，常见 100–300 Ω）", unit: "Ω" },
      { sym: "I_{EQ}", name: "静态发射极电流", unit: "A" },
    ],
    conditions: ["放大区、小信号、低频", "动态电阻：只用于交流分析"],
    ref: "ce-amplifier#ce-hparam",
    tags: ["微变"],
  },
  {
    id: "ce-au",
    chapter: 3,
    title: "共射电压放大倍数",
    tex: String.raw`\dot A_u=-\frac{\beta R_L'}{r_{be}+(1+\beta)R_e},\qquad R_L'=R_c\para R_L`,
    vars: [
      { sym: "R_L'", name: "交流负载", unit: "Ω" },
      { sym: "R_e", name: "交流通路中未被旁路的射极电阻（无则为 0）", unit: "Ω" },
    ],
    conditions: ["中频、小信号、h 参数简化模型（忽略 r_ce、h_re）", "R_e = 0 时为 −βR_L′/r_be"],
    ref: "ce-amplifier#ce-gain",
    tags: ["动态"],
  },
  {
    id: "ce-ri",
    chapter: 3,
    title: "共射输入电阻",
    tex: String.raw`R_i=R_B\para\left[r_{be}+(1+\beta)R_e\right]`,
    vars: [{ sym: "R_B", name: "偏置电阻的并联：R_b 或 R_b1∥R_b2", unit: "Ω" }],
    conditions: ["不含信号源内阻 R_s"],
    ref: "ce-amplifier#ce-rio",
    tags: ["动态"],
  },
  {
    id: "ce-ro",
    chapter: 3,
    title: "共射输出电阻",
    tex: String.raw`R_o\approx R_c`,
    vars: [],
    conditions: ["忽略 r_ce（r_ce ≫ R_c）", "定义时 U_s = 0、R_L 断开"],
    ref: "ce-amplifier#ce-rio",
    tags: ["动态"],
  },
  {
    id: "ce-aus",
    chapter: 3,
    title: "源电压放大倍数",
    tex: String.raw`\dot A_{us}=\frac{R_i}{R_s+R_i}\dot A_u`,
    vars: [{ sym: "R_s", name: "信号源内阻", unit: "Ω" }],
    conditions: ["任何放大电路通用"],
    ref: "ce-amplifier#ce-gain",
  },
  {
    id: "ce-uom",
    chapter: 3,
    title: "最大不失真输出幅值",
    tex: String.raw`U_{om}=\min\{U_{CEQ}-U_{CES},\ I_{CQ}R_L'\}`,
    vars: [{ sym: "U_{CES}", name: "饱和管压降", unit: "V" }],
    conditions: ["射极交流接地；忽略输入特性的非线性"],
    ref: "ce-amplifier#ce-distortion",
    tags: ["失真"],
  },
  {
    id: "ro-measure",
    chapter: 3,
    title: "测量法求输出电阻",
    tex: String.raw`R_o=\left(\frac{U_o'}{U_o}-1\right)R_L`,
    vars: [
      { sym: "U_o'", name: "空载输出电压", unit: "V" },
      { sym: "U_o", name: "接 R_L 后的输出电压", unit: "V" },
    ],
    conditions: ["输入信号不变，两次测量均不失真"],
    ref: "ce-amplifier#ce-rio",
  },
  // ── 其余章节：常用结论 ──
  {
    id: "opamp-inv",
    chapter: 7,
    title: "反相比例运算",
    tex: String.raw`u_O=-\frac{R_f}{R_1}u_I`,
    vars: [],
    conditions: ["理想运放、线性区（虚短、虚断）"],
    ref: "opamp-proportional#op-inv",
  },
  {
    id: "opamp-noninv",
    chapter: 7,
    title: "同相比例运算",
    tex: String.raw`u_O=\left(1+\frac{R_f}{R_1}\right)u_I`,
    vars: [],
    conditions: ["理想运放、线性区"],
    ref: "opamp-proportional#op-noninv",
  },
  {
    id: "fb-general",
    chapter: 8,
    title: "负反馈放大倍数的一般表达式",
    tex: String.raw`\dot A_f=\frac{\dot A}{1+\dot A\dot F}\ \xrightarrow{\ |1+\dot A\dot F|\gg1\ }\ \frac{1}{\dot F}`,
    vars: [
      { sym: "\\dot A", name: "开环放大倍数", unit: "—" },
      { sym: "\\dot F", name: "反馈系数", unit: "—" },
    ],
    conditions: ["负反馈：|1+AF| > 1；深度负反馈 |1+AF| ≫ 1"],
    ref: "fb-concept#fc-block",
  },
  {
    id: "cmrr",
    chapter: 6,
    title: "共模抑制比",
    tex: String.raw`K_{CMR}=\left|\frac{A_d}{A_c}\right|`,
    vars: [],
    conditions: ["常用分贝表示 20lg K_CMR"],
    ref: "diff-amplifier#da-cmrr",
  },
  {
    id: "class-b-eff",
    chapter: 10,
    title: "乙类 OCL 最大效率",
    tex: String.raw`\eta_{\max}=\frac{\pi}{4}\approx78.5\%`,
    vars: [],
    conditions: ["理想情况：忽略饱和压降，U_om = V_CC"],
    ref: "pa-ocl#po-power",
  },
  {
    id: "osc-cond",
    chapter: 11,
    title: "正弦波振荡平衡条件",
    tex: String.raw`\dot A\dot F=1\ \Longleftrightarrow\ |\dot A\dot F|=1,\ \ \varphi_A+\varphi_F=2n\pi`,
    vars: [],
    conditions: ["起振条件 |AF| > 1"],
    ref: "osc-condition#oc-cond",
  },
  {
    id: "rc-osc",
    chapter: 11,
    title: "RC 桥式振荡频率",
    tex: String.raw`f_0=\frac{1}{2\pi RC},\qquad \dot A_u\ge3`,
    vars: [],
    conditions: ["文氏桥选频网络 R、C 对称"],
    ref: "osc-rc#or-bridge",
  },
  {
    id: "rectifier",
    chapter: 12,
    title: "桥式整流与电容滤波",
    tex: String.raw`U_{O(AV)}=0.9U_2\ (\text{无滤波}),\qquad U_{O(AV)}\approx1.2U_2\ (\text{电容滤波})`,
    vars: [{ sym: "U_2", name: "变压器副边电压有效值", unit: "V" }],
    conditions: ["电容滤波的 1.2 倍需 R_L C ≥ (3~5)T/2"],
    ref: "ripple-filter#cf-estimate",
  },
];

export const FORMULAS: Formula[] = [...BASE_FORMULAS, ...CHAPTER_FORMULAS];

export const FORMULA_BY_ID: Record<string, Formula> = Object.fromEntries(FORMULAS.map((f) => [f.id, f]));

export function formulasOfUnit(unitId: string): Formula[] {
  return FORMULAS.filter((f) => f.ref?.startsWith(unitId + "#"));
}
