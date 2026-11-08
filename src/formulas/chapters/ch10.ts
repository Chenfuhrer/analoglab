import type { Formula } from "../library";

const r = String.raw;

export const CH10_FORMULAS: Formula[] = [
  {
    id: "ocl-power",
    chapter: 10,
    title: "乙类 OCL 的功率与效率",
    tex: r`P_o=\frac{U_{om}^2}{2R_L},\quad P_V=\frac{2V_{CC}U_{om}}{\pi R_L},\quad\eta=\frac{\pi U_{om}}{4V_{CC}}`,
    vars: [{ sym: "U_{om}", name: "输出电压幅值", unit: "V" }],
    conditions: ["理想互补管、正弦输出", "U_om 最大为 V_CC − U_CES"],
    ref: "pa-ocl#po-power",
  },
  {
    id: "ocl-pom",
    chapter: 10,
    title: "OCL 最大输出功率",
    tex: r`P_{om}=\frac{(V_{CC}-U_{CES})^2}{2R_L}`,
    vars: [{ sym: "U_{CES}", name: "饱和管压降", unit: "V" }],
    conditions: ["±V_CC 双电源"],
    ref: "pa-ocl#po-power",
  },
  {
    id: "ocl-pt",
    chapter: 10,
    title: "每管最大管耗",
    tex: r`P_{T1\max}=\frac{V_{CC}^2}{\pi^2R_L}\approx0.2P_{om}\quad\left(U_{om}=\frac{2V_{CC}}{\pi}\right)`,
    vars: [],
    conditions: ["选管：P_CM ≥ 0.2P_om，|U_(BR)CEO| ≥ 2V_CC，I_CM ≥ V_CC/R_L"],
    ref: "pa-ocl#po-tube",
  },
  {
    id: "otl-pom",
    chapter: 10,
    title: "OTL 最大输出功率",
    tex: r`P_{om}=\frac{(V_{CC}/2-U_{CES})^2}{2R_L},\qquad f_L=\frac{1}{2\pi R_LC}`,
    vars: [{ sym: "C", name: "输出耦合电容", unit: "F" }],
    conditions: ["单电源；电容上静态电压 V_CC/2"],
    ref: "pa-crossover#px-otl",
  },
];
