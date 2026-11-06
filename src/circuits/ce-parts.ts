/**
 * 共射放大电路：元件说明 + 四种分析模式下的处理规则（纯数据，不含计算）。
 */
import type { CEParams } from "@/simulations/bjt/types";

export type CEMode = "full" | "dc" | "ac" | "ss";

export const CE_MODES: Array<{ value: CEMode; label: string; short: string; hint: string }> = [
  { value: "full", label: "完整电路", short: "完整", hint: "所有电源、电阻、电容、晶体管与负载" },
  { value: "dc", label: "直流通路", short: "直流", hint: "电容开路、交流源置零：求静态工作点" },
  { value: "ac", label: "交流通路", short: "交流", hint: "中频：耦合/旁路电容短路，V_CC 交流接地" },
  { value: "ss", label: "微变等效", short: "微变", hint: "晶体管替换为 r_be 与受控电流源 βi_b" },
];

export type PartId = "VCC" | "Rb" | "Rb1" | "Rb2" | "Rc" | "Re1" | "Re2" | "Ce" | "C1" | "C2" | "RL" | "Rs" | "us" | "T";

export interface PartInfo {
  name: string;
  role: string;
  byMode: Record<CEMode, string>;
  param?: keyof CEParams;
}

export function partInfo(id: PartId, p: CEParams): PartInfo {
  const ceShort = p.hasCe && p.Re2 > 0;
  const table: Record<PartId, PartInfo> = {
    VCC: {
      name: "直流电源 $V_{CC}$",
      role: "为晶体管建立偏置，并提供输出信号的全部能量——放大电路输出的交流功率最终来自直流电源。",
      param: "VCC",
      byMode: {
        full: "提供直流偏置与能量。",
        dc: "直流通路中保留，是所有静态电流的来源。",
        ac: "理想直流电压源两端电压恒定，其**交流分量为 0**，所以交流通路中该节点与地之间没有交流电压 → **交流接地**。",
        ss: "同交流通路：交流接地。$R_b$、$R_c$ 的上端都接到了交流地。",
      },
    },
    Rb: {
      name: "基极偏置电阻 $R_b$",
      role: "从 $V_{CC}$ 引入合适的基极电流 $I_{BQ}$，设定静态工作点；阻值很大，避免把输入信号分流到地。",
      param: "Rb",
      byMode: {
        full: "设定 $I_{BQ}$。",
        dc: "基极回路 KVL：$V_{CC}=I_{BQ}R_b+U_{BEQ}+I_{EQ}R_E$，由此确定 $I_{BQ}$。",
        ac: "上端接交流地，与晶体管输入端**并联**：$R_i=R_b\\para[r_{be}+(1+\\beta)R_{e,ac}]$。",
        ss: "与 $r_{be}$ 支路并联在输入端，是 $R_i$ 的一部分。",
      },
    },
    Rb2: {
      name: "上偏置电阻 $R_{b2}$",
      role: "与 $R_{b1}$ 组成分压器，把基极电位钉在 $U_{BQ}\\approx\\frac{R_{b1}}{R_{b1}+R_{b2}}V_{CC}$。",
      param: "Rb2",
      byMode: {
        full: "分压偏置的上臂。",
        dc: "当流过分压器的电流远大于 $I_{BQ}$ 时，$U_{BQ}$ 几乎不受 $\\beta$ 影响。",
        ac: "上端接交流地，与 $R_{b1}$ **并联**后再与晶体管输入端并联。",
        ss: "$R_{b1}\\para R_{b2}$ 出现在输入端。",
      },
    },
    Rb1: {
      name: "下偏置电阻 $R_{b1}$",
      role: "分压器下臂（基极→地）。注意：童诗白教材记下偏置电阻为 $R_{b1}$，部分教材相反。",
      param: "Rb1",
      byMode: {
        full: "分压偏置的下臂。",
        dc: "与 $R_{b2}$ 分压确定 $U_{BQ}$。",
        ac: "一端接地，与 $R_{b2}$ 并联。",
        ss: "$R_{b1}\\para R_{b2}$ 出现在输入端。",
      },
    },
    Rc: {
      name: "集电极电阻 $R_c$",
      role: "把集电极电流的变化转换为电压的变化：$\\Delta u_C=-\\Delta i_C R_c$。没有它就得不到电压放大。",
      param: "Rc",
      byMode: {
        full: "电流→电压的转换元件。",
        dc: "集电极回路 KVL：$U_{CEQ}=V_{CC}-I_{CQ}R_c-I_{EQ}R_E$。",
        ac: "上端接交流地，与 $R_L$ **并联**为交流负载 $R_L'=R_c\\para R_L$。",
        ss: "从输出端看进去（$u_s=0$ 时受控源 $\\beta i_b=0$ 开路）只剩 $R_c$：$R_o\\approx R_c$。",
      },
    },
    Re1: {
      name: "射极电阻 $R_{e1}$（不被旁路）",
      role: "直流与交流都存在的负反馈电阻（部分教材记为 $R_f$）。",
      param: "Re1",
      byMode: {
        full: "直流、交流都起负反馈作用。",
        dc: "直流负反馈：$I_{EQ}$↑ → $U_{EQ}$↑ → $U_{BEQ}$↓ → $I_{BQ}$↓，稳定 Q 点。",
        ac: "保留在交流通路中，在基极回路中等效为 $(1+\\beta)R_{e1}$：$|A_u|$ 降低、$R_i$ 提高、线性改善。",
        ss: "$\\dot U_i=\\dot I_b r_{be}+(1+\\beta)\\dot I_b R_{e1}$。",
      },
    },
    Re2: {
      name: "射极电阻 $R_{e2}$",
      role: "直流负反馈稳定 Q 点；交流是否起作用取决于是否接旁路电容 $C_e$。",
      param: "Re2",
      byMode: {
        full: ceShort ? "直流起作用，交流被 $C_e$ 旁路。" : "未接 $C_e$：直流、交流都起负反馈作用。",
        dc: "直流负反馈，稳定 Q 点（$C_e$ 开路，电流全部流过 $R_{e2}$）。",
        ac: ceShort ? "被 $C_e$ **交流短路**，不出现在交流通路中——既稳定了 Q 点，又不牺牲增益。" : "没有 $C_e$，$R_{e2}$ 保留在交流通路中。",
        ss: ceShort ? "被短路，不出现。" : "与 $R_{e1}$ 串联，一起以 $(1+\\beta)$ 倍折算到基极回路。",
      },
    },
    Ce: {
      name: "射极旁路电容 $C_e$",
      role: "直流开路（不影响 Q 点），交流短路（把 $R_{e2}$ 旁路掉以提高增益）。",
      param: "Ce",
      byMode: {
        full: "旁路电容。",
        dc: "**开路**：直流稳态下电容电流 $i=C\\,du/dt=0$。",
        ac: "中频时容抗 $1/(\\omega C_e)$ 远小于与之并联的等效电阻 → 视为**短路**。频率过低时不成立（见低频截止频率）。",
        ss: "短路。",
      },
    },
    C1: {
      name: "输入耦合电容 $C_1$",
      role: "“隔直通交”：让交流信号进入基极，又不让信号源破坏基极的直流电位。",
      param: "C1",
      byMode: {
        full: "隔直通交。",
        dc: "**开路**：信号源与偏置电路在直流上被隔开，Q 点与信号源无关。",
        ac: "中频时 $1/(\\omega C_1)\\ll R_s+R_i$ → 视为**短路**。",
        ss: "短路。",
      },
    },
    C2: {
      name: "输出耦合电容 $C_2$",
      role: "把集电极的交流电压传给负载，同时隔断直流，使负载上没有直流分量。",
      param: "C2",
      byMode: {
        full: "隔直通交。",
        dc: "**开路**：$R_L$ 不影响 Q 点。",
        ac: "**短路**：$R_L$ 直接并联在集电极与地之间。",
        ss: "短路。",
      },
    },
    RL: {
      name: "负载电阻 $R_L$",
      role: "代表后级电路或实际负载。",
      param: "RL",
      byMode: {
        full: "负载。",
        dc: "被 $C_2$ 隔开，**不影响 Q 点**。",
        ac: "与 $R_c$ 并联：$R_L'=R_c\\para R_L$。$R_L$ 越小，$R_L'$ 越小，电压增益越低。",
        ss: "$\\dot U_o=-\\beta\\dot I_b R_L'$。",
      },
    },
    Rs: {
      name: "信号源内阻 $R_s$",
      role: "实际信号源都有内阻；它与放大电路输入电阻分压。",
      param: "Rs",
      byMode: {
        full: "信号源内阻。",
        dc: "被 $C_1$ 隔开。",
        ac: "$u_i=u_s\\dfrac{R_i}{R_s+R_i}$：$R_i$ 越大，信号源电压损失越小。",
        ss: "$A_{us}=A_u\\dfrac{R_i}{R_s+R_i}$。",
      },
    },
    us: {
      name: "信号源 $u_s$",
      role: "待放大的正弦小信号。",
      param: "Usm",
      byMode: {
        full: "输入信号。",
        dc: "求静态时**交流源置零**（短路），且它本来就被 $C_1$ 隔断。",
        ac: "交流通路的激励。",
        ss: "小信号激励，要求 $|u_{be}|\\ll U_T\\approx 26\\,\\mathrm{mV}$ 时线性模型才准确。",
      },
    },
    T: {
      name: "NPN 晶体管 T",
      role: "用小的基极电流控制大的集电极电流（电流控制电流源）。",
      param: "beta",
      byMode: {
        full: "放大区：发射结正偏、集电结反偏。",
        dc: "恒压降模型：$U_{BEQ}$ 取常数；放大区 $I_{CQ}=\\beta I_{BQ}$。",
        ac: "仍是非线性器件；交流分析只关心 Q 点附近的**微小变化**。",
        ss: "替换为 h 参数简化模型：b–e 之间 $r_{be}$，c–e 之间受控电流源 $\\beta\\dot I_b$。",
      },
    },
  };
  return table[id];
}

export function partVisible(id: PartId, p: CEParams): boolean {
  switch (id) {
    case "Rb":
      return p.topology === "fixed";
    case "Rb1":
    case "Rb2":
      return p.topology === "divider";
    case "Re1":
      return p.Re1 > 0;
    case "Re2":
      return p.Re2 > 0;
    case "Ce":
      return p.Re2 > 0 && p.hasCe;
    case "RL":
      return Number.isFinite(p.RL);
    case "Rs":
      return p.Rs > 0;
    default:
      return true;
  }
}
