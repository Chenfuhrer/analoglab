import type { Formula } from "../library";

const r = String.raw;

export const CH7_FORMULAS: Formula[] = [
  {
    id: "virtual-short",
    chapter: 7,
    title: "虚短与虚断",
    tex: r`u_+=u_-,\qquad i_+=i_-=0`,
    vars: [{ sym: "u_+,u_-", name: "同相、反相输入端电位", unit: "V" }],
    conditions: ["虚短：理想运放且工作在线性区（深度负反馈）", "虚断：理想运放（任何工作区）"],
    ref: "opamp-ideal#oi-virtual",
  },
  {
    id: "schmitt",
    chapter: 7,
    title: "反相滞回比较器阈值",
    tex: r`U_{T\pm}=\frac{R_2}{R_1+R_2}U_{REF}\pm\frac{R_1}{R_1+R_2}U_Z`,
    vars: [{ sym: "U_Z", name: "输出限幅电压", unit: "V" }],
    conditions: ["同相端经 R_1 接 U_REF、经 R_2 接输出"],
    ref: "opamp-ideal#oi-comp",
  },
  {
    id: "finite-gain",
    chapter: 7,
    title: "有限开环增益下的闭环增益",
    tex: r`A_f=\frac{A_{f,\text{理想}}}{1+(1+R_f/R_1)/A_{od}}`,
    vars: [{ sym: "A_{od}", name: "开环差模增益", unit: "—" }],
    conditions: ["反相、同相比例电路通用（分母中为噪声增益 1+R_f/R_1）"],
    ref: "opamp-proportional#op-finite",
  },
  {
    id: "summer",
    chapter: 7,
    title: "反相求和",
    tex: r`u_O=-R_f\left(\frac{u_{I1}}{R_1}+\frac{u_{I2}}{R_2}+\cdots\right)`,
    vars: [],
    conditions: ["理想运放、线性区"],
    ref: "opamp-arith#oa-sum",
  },
  {
    id: "subtractor",
    chapter: 7,
    title: "差分比例（减法）",
    tex: r`u_O=\frac{R_f}{R_1}(u_{I2}-u_{I1})\qquad\left(\frac{R_f}{R_1}=\frac{R_3}{R_2}\right)`,
    vars: [],
    conditions: ["电阻比匹配；否则存在共模增益"],
    ref: "opamp-arith#oa-sub",
  },
  {
    id: "integrator",
    chapter: 7,
    title: "积分与微分",
    tex: r`u_O=-\frac{1}{RC}\int u_I\,\mathrm dt,\qquad u_O=-RC\frac{\mathrm du_I}{\mathrm dt}`,
    vars: [{ sym: "RC", name: "时间常数", unit: "s" }],
    conditions: ["理想运放、输出未饱和"],
    ref: "opamp-integrator#ot-int",
  },
];
