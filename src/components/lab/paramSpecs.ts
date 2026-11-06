import type { CEParams } from "@/simulations/bjt/types";
import { DEFAULT_CE, DEFAULT_DIVIDER } from "@/simulations/bjt/types";

export interface ParamSpec {
  key: keyof CEParams;
  label: string;
  min: number;
  max: number;
  unit: string;
  scale: number;
  log?: boolean;
  step?: number;
  digits?: number;
  hint?: string;
  /** 仅在某种偏置结构下显示 */
  topo?: CEParams["topology"];
  group: "supply" | "bias" | "load" | "device" | "signal" | "advanced";
}

export const PARAM_SPECS: ParamSpec[] = [
  { key: "VCC", label: "$V_{CC}$", min: 3, max: 30, unit: "V", scale: 1, step: 0.1, group: "supply" },
  { key: "Rb", label: "$R_b$", min: 20e3, max: 5e6, unit: "kΩ", scale: 1e3, log: true, topo: "fixed", group: "bias", hint: "决定 I_BQ：R_b ↓ → Q 点上移" },
  { key: "Rb2", label: "$R_{b2}$（上偏置）", min: 1e3, max: 500e3, unit: "kΩ", scale: 1e3, log: true, topo: "divider", group: "bias" },
  { key: "Rb1", label: "$R_{b1}$（下偏置）", min: 1e3, max: 200e3, unit: "kΩ", scale: 1e3, log: true, topo: "divider", group: "bias" },
  { key: "Rc", label: "$R_c$", min: 200, max: 50e3, unit: "kΩ", scale: 1e3, log: true, group: "bias" },
  { key: "Re1", label: "$R_{e1}$（不旁路）", min: 0, max: 3000, unit: "Ω", scale: 1, step: 10, group: "bias" },
  { key: "Re2", label: "$R_{e2}$（可旁路）", min: 0, max: 5000, unit: "Ω", scale: 1, step: 10, group: "bias" },
  { key: "RL", label: "$R_L$", min: 200, max: 1e6, unit: "kΩ", scale: 1e3, log: true, group: "load" },
  { key: "Rs", label: "$R_s$", min: 0, max: 10e3, unit: "Ω", scale: 1, step: 10, group: "load" },
  { key: "beta", label: "$\\beta$", min: 20, max: 400, unit: "", scale: 1, step: 1, group: "device" },
  { key: "UBE", label: "$U_{BEQ}$", min: 0.5, max: 0.8, unit: "V", scale: 1, step: 0.01, group: "device", hint: "硅管约 0.6–0.7 V，锗管约 0.2–0.3 V" },
  { key: "Usm", label: "$U_{sm}$（峰值）", min: 1e-4, max: 1, unit: "mV", scale: 1e-3, log: true, group: "signal" },
  { key: "f", label: "$f$", min: 5, max: 200e3, unit: "Hz", scale: 1, log: true, group: "signal", hint: "中频模型：频率只改变时间轴" },
  { key: "UCES", label: "$U_{CES}$", min: 0.1, max: 1, unit: "V", scale: 1, step: 0.05, group: "advanced" },
  { key: "rbb", label: "$r_{bb'}$", min: 0, max: 500, unit: "Ω", scale: 1, step: 10, group: "advanced" },
  { key: "C1", label: "$C_1$", min: 0.1e-6, max: 1000e-6, unit: "µF", scale: 1e-6, log: true, group: "advanced" },
  { key: "C2", label: "$C_2$", min: 0.1e-6, max: 1000e-6, unit: "µF", scale: 1e-6, log: true, group: "advanced" },
  { key: "Ce", label: "$C_e$", min: 1e-6, max: 2000e-6, unit: "µF", scale: 1e-6, log: true, group: "advanced" },
];

export const GROUP_LABEL: Record<ParamSpec["group"], string> = {
  supply: "电源",
  bias: "偏置与集电极",
  load: "负载与信号源",
  device: "晶体管",
  signal: "输入信号",
  advanced: "高级参数",
};

export interface Preset {
  id: string;
  label: string;
  desc: string;
  params: CEParams;
}

export const PRESETS: Preset[] = [
  { id: "normal", label: "正常放大", desc: "固定偏置，Q 点约在负载线中部", params: { ...DEFAULT_CE } },
  {
    id: "cutoff",
    label: "截止失真",
    desc: "R_b 过大 → I_BQ 太小、Q 点偏低；输入稍大即进入截止，u_o 顶部削平（R_s=5.1 kΩ 使 i_b 接近正弦）",
    params: { ...DEFAULT_CE, Rb: 1.2e6, Rs: 5100, Usm: 0.1 },
  },
  {
    id: "saturation",
    label: "饱和失真",
    desc: "R_b 过小 → Q 点偏高、U_CEQ 小；u_o 底部削平（R_s=5.1 kΩ）",
    params: { ...DEFAULT_CE, Rb: 330e3, Rs: 5100, Usm: 0.08 },
  },
  { id: "divider", label: "分压偏置", desc: "R_b1/R_b2 分压 + R_e 直流负反馈，R_e2 被 C_e 旁路", params: { ...DEFAULT_DIVIDER } },
  {
    id: "no-ce",
    label: "C_e 开路",
    desc: "去掉旁路电容：|A_u| 大幅下降、R_i 上升、线性改善",
    params: { ...DEFAULT_DIVIDER, hasCe: false, Usm: 0.5 },
  },
];
