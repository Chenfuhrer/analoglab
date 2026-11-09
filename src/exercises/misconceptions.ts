/**
 * 错因（常见误区）分类表。
 *
 * 判题器把错误答案归到其中一类：数值题靠每道题登记的“错误公式算出的值”（MistakePattern.tag）
 * 以及几条通用规则（符号、数量级、2π、倒数）；选择题靠选项上登记的 tags。
 * 归类结果用于：答题后的即时诊断、复习链接、“同类错因练习”、进度页的错因画像。
 *
 * 新增错因：在 DEFS 里登记短名、分组、通用解释和复习位置（单元 id + 知识点 id）。
 * 测试会检查：复习位置真实存在、解释能被 KaTeX 渲染、每个错因至少被一道题用到。
 */
const r = String.raw;

export type MisconceptionGroup = "通用" | "半导体与二极管" | "晶体管" | "场效应管" | "差放与运放" | "反馈与频响" | "功放、振荡与电源";

export const GROUP_ORDER: MisconceptionGroup[] = ["通用", "半导体与二极管", "晶体管", "场效应管", "差放与运放", "反馈与频响", "功放、振荡与电源"];

export interface ReviewRef {
  unit: string;
  section: string;
}

export interface MisconceptionDef {
  /** 短名：纯文本，用于标签、统计和 AI 上下文 */
  short: string;
  group: MisconceptionGroup;
  /** 通用解释：正确的规则是什么（可含 $LaTeX$） */
  explain: string;
  /** 复习位置 */
  review: ReviewRef[];
}

const DEFS = {
  // ───────── 通用 ─────────
  sign: {
    short: "正负号或相位弄反",
    group: "通用",
    explain: r`共射、共源、反相比例、反相积分等电路的输出与输入反相，放大倍数或输出表达式带负号；电流、电压也要按参考方向写正负。`,
    review: [
      { unit: "ce-amplifier", section: "ce-gain" },
      { unit: "opamp-proportional", section: "op-inv" },
    ],
  },
  "unit-convert": {
    short: "单位或数量级换算错",
    group: "通用",
    explain: r`先把各量换成基本单位再代入：注意 m/µ、k/M 前缀；物理公式里的温度用热力学温度 $T=t+273.15$；电压、电流的分贝换算用 $20\lg$。`,
    review: [
      { unit: "freq-basics", section: "frb-bode" },
      { unit: "semi-carriers", section: "sc-temp" },
    ],
  },
  "omega-f": {
    short: "角频率与频率混淆",
    group: "通用",
    explain: r`$RC$ 电路的特征角频率 $\omega=1/(RC)$，对应的频率 $f=\omega/(2\pi)=1/(2\pi RC)$。题目问以 Hz 为单位的频率时，别漏了 $2\pi$。`,
    review: [{ unit: "freq-basics", section: "frb-rc" }],
  },
  "rms-peak-avg": {
    short: "有效值、峰值、平均值混淆",
    group: "通用",
    explain: r`正弦量的峰值是有效值的 $\sqrt2$ 倍，峰峰值是峰值的 2 倍；整流输出看平均值（如桥式 $U_{O(AV)}\approx0.9U_2$），功率按有效值算（$P_o=U_{om}^2/(2R_L)$）。`,
    review: [
      { unit: "rectifier", section: "rf-half" },
      { unit: "pa-ocl", section: "po-power" },
    ],
  },
  "ratio-inverted": {
    short: "比值写反",
    group: "通用",
    explain: r`写比值前先确认“谁比谁”：放大倍数是输出量比输入量，分压比是所求电阻占串联总电阻的比例。`,
    review: [{ unit: "ce-amplifier", section: "ce-gain" }],
  },
  "scaling-law": {
    short: "幂次或指数关系用错",
    group: "通用",
    explain: r`许多关系不是线性的：$n_i$ 随温度按指数变化；PN 结电流随电压按 $e^{u/U_T}$ 变化，电流变为 $k$ 倍只需增加 $U_T\ln k$；势垒电容反比于耗尽层宽度；微电流源里的对数关系也不能丢。`,
    review: [
      { unit: "semi-carriers", section: "sc-temp" },
      { unit: "diode", section: "di-curve" },
    ],
  },
  "approx-misuse": {
    short: "近似式用错场合",
    group: "通用",
    explain: r`每个近似式都有成立条件（如 $1+AF\gg1$、$(1+\beta)R_e\gg r_{be}$、$t\ll\tau$、小信号）。题目要求精确值或条件不满足时，必须用完整公式。`,
    review: [
      { unit: "fb-deep", section: "fd-approx" },
      { unit: "divider-bias", section: "db-dynamic" },
    ],
  },
  "series-parallel": {
    short: "串联、并联关系弄错",
    group: "通用",
    explain: r`先画出对应的通路再判断连接关系：交流通路中 $V_{CC}$ 接地，$R_b$ 与 $r_{be}$ 并联；电容串联总容量变小，有耦合的电感串联要计入互感。`,
    review: [
      { unit: "ce-amplifier", section: "ce-ac" },
      { unit: "osc-lc", section: "ol-three" },
    ],
  },
  "kvl-loop": {
    short: "回路压降或电位漏算",
    group: "通用",
    explain: r`列 KVL 时回路上每个元件的压降都要写上（$R_c$、$R_e$、$U_{BE}$ 等）；极间电压是两个电位之差，如 $U_{CE}=U_C-U_E$，不要把某一点的电位或某个电阻的压降当成所求电压。`,
    review: [
      { unit: "ce-amplifier", section: "ce-dc" },
      { unit: "divider-bias", section: "db-calc" },
    ],
  },
  "kcl-split": {
    short: "电流分配漏了支路",
    group: "通用",
    explain: r`节点电流守恒：$I_E=I_B+I_C$，稳压电路中 $I_R=I_Z+I_L$；后级的基极电流、稳压管的最小工作电流都要从前面的支路里留出来。`,
    review: [
      { unit: "bjt-currents", section: "bc-transport" },
      { unit: "zener", section: "zn-design" },
    ],
  },
  "worst-case": {
    short: "极限条件取错",
    group: "通用",
    explain: r`设计和校核要找最不利的情况：多个限制取较小值（如最大不失真输出取饱和限与截止限中的较小者）；负载最轻与最重、输入最高与最低分别对应不同的极限；管耗、调整管压降也各有极值点。`,
    review: [
      { unit: "zener", section: "zn-design" },
      { unit: "bjt-params", section: "bp-soa" },
    ],
  },
  "device-state": {
    short: "没先判断工作状态",
    group: "通用",
    explain: r`套公式前先判断器件状态：二极管导通还是截止、稳压管是否击穿、晶体管处于放大、饱和还是截止、场效应管是否形成沟道；解二次方程时舍去物理上不成立的根。`,
    review: [
      { unit: "diode", section: "di-state" },
      { unit: "bjt-curves", section: "bv-judge" },
    ],
  },
  "static-vs-dynamic": {
    short: "静态量与动态量混淆",
    group: "通用",
    explain: r`直流电阻 $U/I$ 与动态电阻 $\mathrm du/\mathrm di$ 不同（二极管 $r_d\approx U_T/I_D$）；小信号分析只处理叠加在 Q 点上的变化量，交流信号按动态电阻分压。`,
    review: [
      { unit: "diode", section: "di-small" },
      { unit: "ce-amplifier", section: "ce-hparam" },
    ],
  },
  waveform: {
    short: "波形平移或相移判断错",
    group: "通用",
    explain: r`钳位电路让整个波形平移、峰峰值不变，正峰和负峰一起移动；积分电路使正弦信号相移 90°，反相积分的输出超前输入 90°。`,
    review: [
      { unit: "diode-circuits", section: "dc-clamp" },
      { unit: "opamp-integrator", section: "ot-wave" },
    ],
  },

  // ───────── 半导体与二极管 ─────────
  "mass-action": {
    short: "载流子浓度关系用错",
    group: "半导体与二极管",
    explain: r`热平衡时 $np=n_i^2$：掺杂使多子增多，少子按 $n_i^2/N$ 减少；同时掺施主和受主时先相互补偿，类型和多子浓度由净掺杂 $|N_D-N_A|$ 决定。`,
    review: [{ unit: "semi-doped", section: "sd-mass" }],
  },
  "diode-drop": {
    short: "漏了二极管导通压降",
    group: "半导体与二极管",
    explain: r`恒压降模型中，导通的二极管两端保持 $U_{on}$（硅管约 0.7 V）：输出电压、限幅电平和电阻上的电压都要计入它。只有题目说明“理想二极管”时才忽略。`,
    review: [
      { unit: "diode", section: "di-models" },
      { unit: "diode-circuits", section: "dc-clip" },
    ],
  },
  "rectifier-type": {
    short: "整流电路参数混淆",
    group: "半导体与二极管",
    explain: r`半波整流 $U_{O(AV)}\approx0.45U_2$，全波和桥式 $\approx0.9U_2$；桥式中每只二极管的平均电流为 $I_O/2$、最大反向电压为 $\sqrt2U_2$（全波中心抽头为 $2\sqrt2U_2$）；全波整流的纹波频率是电网频率的 2 倍。`,
    review: [
      { unit: "rectifier", section: "rf-bridge" },
      { unit: "ripple-filter", section: "cf-estimate" },
    ],
  },

  // ───────── 晶体管 ─────────
  "bjt-currents": {
    short: "三个极电流关系用错",
    group: "晶体管",
    explain: r`$I_E=I_B+I_C=(1+\bar\beta)I_B$，$I_{CEO}=(1+\bar\beta)I_{CBO}$；已知 $I_E$ 求 $I_B$ 要除以 $(1+\bar\beta)$，不能把 $I_E$ 当成 $I_C$。`,
    review: [{ unit: "bjt-currents", section: "bc-beta" }],
  },
  "forget-ube": {
    short: "漏减发射结压降",
    group: "晶体管",
    explain: r`基极回路中发射结有约 0.7 V（硅管）的压降：$I_{BQ}=(V_{CC}-U_{BEQ})/R_b$，$I_{EQ}=(U_{BQ}-U_{BEQ})/R_e$。漏减会使电流偏大、$U_{CEQ}$ 偏小。`,
    review: [
      { unit: "ce-amplifier", section: "ce-dc" },
      { unit: "divider-bias", section: "db-calc" },
    ],
  },
  "forget-uces": {
    short: "漏扣饱和压降",
    group: "晶体管",
    explain: r`晶体管饱和时 $u_{CE}$ 降不到 0，最低约为 $U_{CES}$：临界饱和电流、最大不失真输出、功放的最大输出幅度都要扣掉它，如 OCL 中 $U_{om}=V_{CC}-U_{CES}$。`,
    review: [
      { unit: "ce-amplifier", section: "ce-distortion" },
      { unit: "pa-ocl", section: "po-power" },
    ],
  },
  "divider-swap": {
    short: "分压电阻上下搞反",
    group: "晶体管",
    explain: r`本站约定 $R_{b1}$ 为下偏置电阻（基极→地）、$R_{b2}$ 为上偏置电阻：$U_{BQ}\approx V_{CC}R_{b1}/(R_{b1}+R_{b2})$。场效应管的栅极分压同理，取下电阻上的电压。`,
    review: [{ unit: "divider-bias", section: "db-calc" }],
  },
  "emitter-reflection": {
    short: "射极电阻折算漏了 (1+β)",
    group: "晶体管",
    explain: r`射极电流是基极电流的 $(1+\beta)$ 倍：射极电阻折算到基极回路要乘 $(1+\beta)$（如 $r_{be}+(1+\beta)R_e$）；基极回路的电阻折算到射极要除以 $(1+\beta)$（如射极输出器的 $R_o$）。`,
    review: [
      { unit: "divider-bias", section: "db-dynamic" },
      { unit: "cc-amplifier", section: "cc-rio" },
    ],
  },
  "rbe-formula": {
    short: "rbe 公式用错",
    group: "晶体管",
    explain: r`$r_{be}=r_{bb'}+(1+\beta)\dfrac{U_T}{I_{EQ}}$：不要漏掉基区体电阻 $r_{bb'}$，也不要漏乘 $(1+\beta)$——$U_T/I_{EQ}$ 是发射极的动态电阻，从基极看进去要放大 $1+\beta$ 倍。`,
    review: [{ unit: "ce-amplifier", section: "ce-hparam" }],
  },
  "bypass-cap": {
    short: "电容在直流、交流通路中处理错",
    group: "晶体管",
    explain: r`直流通路中电容开路，交流通路中大电容短路：被 $C_e$ 旁路的电阻只出现在直流通路里，未旁路的部分在两种通路中都有；旁路电容断开后，射极电阻进入交流通路，增益明显下降。`,
    review: [
      { unit: "ce-amplifier", section: "ce-ac" },
      { unit: "divider-bias", section: "db-dynamic" },
    ],
  },
  "load-ignored": {
    short: "忽略负载效应",
    group: "晶体管",
    explain: r`接负载后交流负载是 $R_L'=R_c\para R_L$（漏极、射极同理）；多级放大中后级的输入电阻就是前级的负载，空载增益不能直接相乘。`,
    review: [
      { unit: "ce-amplifier", section: "ce-gain" },
      { unit: "multistage-analysis", section: "ma-load" },
    ],
  },
  "io-resistance": {
    short: "等效电阻求法错",
    group: "晶体管",
    explain: r`输入电阻从输入端看进去（含偏置电阻，不含 $R_s$）；输出电阻要断开负载、信号源置零但保留内阻；求时间常数时找电容两端看进去的电阻。`,
    review: [
      { unit: "ce-amplifier", section: "ce-rio" },
      { unit: "freq-single-stage", section: "f1-low" },
    ],
  },
  "source-resistance": {
    short: "忽略信号源内阻",
    group: "晶体管",
    explain: r`信号源内阻与输入电阻先分压：$\dot A_{us}=\dfrac{R_i}{R_s+R_i}\dot A_u$。求信号源需要提供的电压时，也要把 $R_s$ 上的压降算进去。`,
    review: [
      { unit: "ce-amplifier", section: "ce-rio" },
      { unit: "cc-amplifier", section: "cc-use" },
    ],
  },
  "config-compare": {
    short: "组态特点记混",
    group: "晶体管",
    explain: r`共射（共源）电压、电流都能放大，输出反相；共集（共漏）$A_u\approx1$、输入电阻大、输出电阻小，常作输入级和输出级；共基（共栅）输入电阻小、高频特性好。`,
    review: [
      { unit: "cb-amplifier", section: "cb-compare" },
      { unit: "cd-cg-amplifier", section: "fet-compare" },
    ],
  },

  // ───────── 场效应管 ─────────
  "fet-model": {
    short: "场效应管模型或类型用错",
    group: "场效应管",
    explain: r`增强型 $i_D=I_{DO}\left(\dfrac{u_{GS}}{U_{GS(th)}}-1\right)^2$，耗尽型和结型 $i_D=I_{DSS}\left(1-\dfrac{u_{GS}}{U_{GS(off)}}\right)^2$；$g_m$ 是 Q 点处转移特性的斜率；预夹断条件是 $u_{DS}=u_{GS}-U_{GS(th)}$。$u_{GS}=0$ 时有无电流可区分增强型与耗尽型。`,
    review: [
      { unit: "mos-curves", section: "mv-transfer" },
      { unit: "fet-small-signal", section: "fs-gm" },
    ],
  },

  // ───────── 差放与运放 ─────────
  "diff-cm": {
    short: "差模、共模分解错",
    group: "差放与运放",
    explain: r`$u_{Id}=u_{I1}-u_{I2}$，$u_{Ic}=\dfrac{u_{I1}+u_{I2}}{2}$，两个输入端分别相当于 $u_{Ic}\pm u_{Id}/2$；输出 $u_O=A_du_{Id}+A_cu_{Ic}$，两部分都要算。`,
    review: [{ unit: "diff-signals", section: "ds-decomp" }],
  },
  "half-circuit": {
    short: "差放半边电路等效错",
    group: "差放与运放",
    explain: r`差模时公共射极交流接地，接在两集电极间的负载中点也是交流地，每管负载为 $R_L/2$；共模时每管射极等效电阻为 $2R_e$；单端输出的差模增益是双端输出的一半；静态时两管的射极电流都流过 $R_e$。`,
    review: [{ unit: "diff-amplifier", section: "da-modes" }],
  },
  "opamp-config": {
    short: "比例电路公式混用",
    group: "差放与运放",
    explain: r`反相比例 $A_{uf}=-R_f/R_1$，同相比例 $A_{uf}=1+R_f/R_1$。同相电路别漏了“1+”：要求增益为 $k$ 时 $R_f=(k-1)R_1$；文氏桥振荡器维持振荡需 $A_u=3$，即 $R_f=2R_1$。`,
    review: [{ unit: "opamp-proportional", section: "op-noninv" }],
  },

  // ───────── 反馈与频响 ─────────
  "feedback-type": {
    short: "反馈组态判断错",
    group: "反馈与频响",
    explain: r`输出端令 $u_O=0$：反馈消失是电压反馈，仍存在是电流反馈。输入端看反馈与输入是否接在同一节点：同一节点（电流相加）为并联反馈，不同节点（电压相加）为串联反馈。`,
    review: [{ unit: "fb-judge", section: "fj-type" }],
  },
  "feedback-sign": {
    short: "反馈极性或 1+AF 用错",
    group: "反馈与频响",
    explain: r`用瞬时极性法判断正、负反馈；负反馈 $A_f=\dfrac{A}{1+AF}$，分母大于 1，增益减小；若 $|1+AF|<1$ 则为正反馈，增益反而增大。`,
    review: [
      { unit: "fb-judge", section: "fj-polarity" },
      { unit: "fb-concept", section: "fc-depth" },
    ],
  },
  "feedback-effect": {
    short: "负反馈的作用记错",
    group: "反馈与频响",
    explain: r`负反馈使增益的相对变化缩小为原来的 $1/(1+AF)$，带宽展宽（$f_H$ 升高、$f_L$ 降低）；电压反馈稳定输出电压，电流反馈稳定输出电流；串联反馈增大输入电阻，并联反馈减小输入电阻。`,
    review: [
      { unit: "fb-effects", section: "fe-gain" },
      { unit: "fb-effects", section: "fe-bw" },
    ],
  },
  "freq-model": {
    short: "高频模型参数用错",
    group: "反馈与频响",
    explain: r`密勒等效电容 $C'=(1+g_mR_L')C_\mu$；由特征频率求 $C_\pi\approx\dfrac{g_m}{2\pi f_T}-C_\mu$；$n$ 级相同的单级串联后 $f_H=f_{H1}\sqrt{2^{1/n}-1}$，不是简单除以 $n$。`,
    review: [
      { unit: "freq-hybrid-pi", section: "fh-params" },
      { unit: "freq-multistage", section: "fm-band" },
    ],
  },

  // ───────── 功放、振荡与电源 ─────────
  "power-balance": {
    short: "功率关系用错",
    group: "功放、振荡与电源",
    explain: r`电源提供的功率 $P_V=P_o+P_T$，效率 $\eta=P_o/P_V$；互补电路的管耗 $P_T$ 是两只管子之和，每管各占一半。`,
    review: [
      { unit: "pa-ocl", section: "po-power" },
      { unit: "pa-ocl", section: "po-tube" },
    ],
  },
  "otl-supply": {
    short: "OTL 电源电压没折半",
    group: "功放、振荡与电源",
    explain: r`单电源 OTL 的输出端静态电位为 $V_{CC}/2$，相当于 $\pm V_{CC}/2$ 供电的 OCL：最大输出幅度约为 $V_{CC}/2-U_{CES}$，功率公式中用 $V_{CC}/2$ 代替 $V_{CC}$。`,
    review: [{ unit: "pa-crossover", section: "px-otl" }],
  },
  "osc-condition": {
    short: "振荡条件判断错",
    group: "功放、振荡与电源",
    explain: r`正弦振荡的平衡条件是 $\dot A\dot F=1$，起振条件是 $|\dot A\dot F|>1$ 且相位满足正反馈；文氏桥在 $f_0$ 处 $F=1/3$，需要 $A_u>3$ 才能起振；三点式电路按“射同基反”判断能否振荡。`,
    review: [
      { unit: "osc-condition", section: "oc-start" },
      { unit: "osc-lc", section: "ol-three" },
    ],
  },
} satisfies Record<string, MisconceptionDef>;

export type MisconceptionId = keyof typeof DEFS;

export const MISCONCEPTIONS: Record<MisconceptionId, MisconceptionDef> = DEFS;

export const MISCONCEPTION_IDS = Object.keys(DEFS) as MisconceptionId[];

export function isMisconceptionId(x: string | null | undefined): x is MisconceptionId {
  return typeof x === "string" && Object.prototype.hasOwnProperty.call(DEFS, x);
}

export function reviewHref(ref: ReviewRef): string {
  return `/learn/${ref.unit}#${ref.section}`;
}

/** “同类错因练习”入口 */
export function practiceHref(id: MisconceptionId): string {
  return `/practice?mc=${id}`;
}
