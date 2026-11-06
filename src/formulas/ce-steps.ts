/**
 * 共射放大电路的分步推导（带数值代入）。由计算核心结果生成，保证讲解与计算一致。
 * 课程、实验室、题目解析共用。
 */
import type { DerivStep } from "@/components/math/Derivation";
import type { CEAnalysis } from "@/simulations/bjt/ce";
import { par } from "@/simulations/units";
import { tn, tq } from "@/lib/tex";

export function dcSteps(a: CEAnalysis): DerivStep[] {
  const p = a.params;
  const { dc } = a;
  const RE = dc.RE;
  const steps: DerivStep[] = [];
  if (p.topology === "divider") {
    steps.push({
      tex: String.raw`V_{BB}=\frac{R_{b1}}{R_{b1}+R_{b2}}V_{CC},\qquad R_B=R_{b1}\para R_{b2}`,
      why: "基极偏置网络的戴维南等效（把分压器连同 $V_{CC}$ 看成一个有内阻的电压源）",
      numeric: String.raw`V_{BB}=\frac{${tq(p.Rb1, "Ω")}}{${tq(p.Rb1, "Ω")}+${tq(p.Rb2, "Ω")}}\times ${tq(p.VCC, "V")}=${tq(dc.VBB, "V")},\quad R_B=${tq(dc.RB, "Ω")}`,
    });
  }
  const vbb = p.topology === "divider" ? "V_{BB}" : "V_{CC}";
  const rb = p.topology === "divider" ? "R_B" : "R_b";
  if (dc.region === "cutoff") {
    steps.push({
      tex: String.raw`${vbb}\le U_{BEQ}\ \Rightarrow\ I_{BQ}=I_{CQ}=0`,
      why: "发射结两端电压达不到导通压降，晶体管截止",
      numeric: String.raw`${tq(dc.VBB, "V")}\le ${tq(p.UBE, "V")},\quad U_{CEQ}=V_{CC}=${tq(p.VCC, "V")}`,
    });
    return steps;
  }
  steps.push({
    tex: RE > 0 ? String.raw`I_{BQ}=\frac{${vbb}-U_{BEQ}}{${rb}+(1+\beta)R_E}` : String.raw`I_{BQ}=\frac{${vbb}-U_{BEQ}}{${rb}}`,
    why: `基极回路 KVL：$${vbb}=I_{BQ}${rb}+U_{BEQ}${RE > 0 ? "+I_{EQ}R_E" : ""}$${RE > 0 ? "，且 $I_{EQ}=(1+\\beta)I_{BQ}$" : ""}`,
    approx: "恒压降模型：$U_{BEQ}$ 取常数；先假设放大区，求出后再验证",
    numeric: RE > 0
      ? String.raw`I_{BQ}=\frac{${tq(dc.VBB, "V")}-${tq(p.UBE, "V")}}{${tq(dc.RB, "Ω")}+${tn(1 + p.beta)}\times ${tq(RE, "Ω")}}=${tq((dc.VBB - p.UBE) / (dc.RB + (1 + p.beta) * RE), "A")}`
      : String.raw`I_{BQ}=\frac{${tq(dc.VBB, "V")}-${tq(p.UBE, "V")}}{${tq(dc.RB, "Ω")}}=${tq((dc.VBB - p.UBE) / dc.RB, "A")}`,
    units: "$\\mathrm{V}/\\Omega=\\mathrm{A}$ ✓",
  });
  const IBa = (dc.VBB - p.UBE) / (dc.RB + (1 + p.beta) * RE);
  const ICa = p.beta * IBa;
  const UCEa = p.VCC - ICa * p.Rc - (1 + p.beta) * IBa * RE;
  steps.push({
    tex: String.raw`I_{CQ}=\beta I_{BQ},\qquad U_{CEQ}=V_{CC}-I_{CQ}R_c${RE > 0 ? "-I_{EQ}R_E" : ""}`,
    why: "放大区电流关系 + 集电极回路 KVL",
    numeric: String.raw`I_{CQ}=${tn(p.beta)}\times ${tq(IBa, "A")}=${tq(ICa, "A")},\quad U_{CEQ}=${tq(UCEa, "V")}`,
    units: "$\\mathrm{V}-\\mathrm{A}\\cdot\\Omega=\\mathrm{V}$ ✓",
  });
  if (dc.region === "saturation") {
    steps.push({
      tex: String.raw`U_{CEQ}<U_{CES}\ \Rightarrow\ \text{饱和：}U_{CE}=U_{CES},\ I_C<\beta I_B`,
      why: "按放大区算出的 $U_{CEQ}$ 小于饱和压降，假设不成立；改按 $U_{CE}=U_{CES}$ 联立两回路 KVL",
      numeric: String.raw`I_{CQ}=${tq(dc.ICQ, "A")},\ I_{BQ}=${tq(dc.IBQ, "A")},\ I_C/I_B=${tn(dc.betaForced)}<\beta=${tn(p.beta)}`,
    });
  } else {
    steps.push({
      tex: String.raw`U_{CEQ}=${tq(dc.UCEQ, "V")}>U_{CES}=${tq(p.UCES, "V")}`,
      why: "验证假设：集电结反偏、发射结正偏 → 放大区成立",
    });
  }
  return steps;
}

export function acSteps(a: CEAnalysis): DerivStep[] {
  const p = a.params;
  const { ac, dc } = a;
  if (dc.region !== "active") return [];
  const hasRe = ac.ReAC > 0;
  const RB = p.topology === "divider" ? String.raw`R_{b1}\para R_{b2}` : "R_b";
  const ReAC = p.Re1 + (p.hasCe && p.Re2 > 0 ? 0 : p.Re2);
  const reName = p.Re1 > 0 && !(p.hasCe && p.Re2 > 0) && p.Re2 > 0 ? "(R_{e1}+R_{e2})" : p.Re1 > 0 ? "R_{e1}" : "R_{e2}";
  const steps: DerivStep[] = [
    {
      tex: String.raw`r_{be}=r_{bb'}+(1+\beta)\frac{U_T}{I_{EQ}}`,
      why: "h 参数模型：发射结动态电阻 $r_{b'e}=U_T/I_{BQ}$ 加上基区体电阻",
      approx: "常温 $U_T\\approx 26\\,\\mathrm{mV}$；只在 Q 点附近的小信号下成立",
      numeric: String.raw`r_{be}=${tq(p.rbb, "Ω")}+${tn(1 + p.beta)}\times\frac{${tn(p.UT * 1e3)}\,\mathrm{mV}}{${tq(dc.IEQ, "A")}}=${tq(ac.rbe, "Ω")}`,
      units: "$\\mathrm{V}/\\mathrm{A}=\\Omega$ ✓",
    },
    {
      tex: hasRe
        ? String.raw`\dot U_i=\dot I_b r_{be}+\dot I_e ${reName}=\dot I_b\left[r_{be}+(1+\beta)${reName}\right]`
        : String.raw`\dot U_i=\dot I_b\, r_{be}`,
      why: hasRe ? "输入回路 KVL；$\\dot I_e=(1+\\beta)\\dot I_b$，射极电阻折算到基极回路要乘 $(1+\\beta)$" : "输入回路：$r_{be}$ 直接接在输入端与交流地之间",
    },
    {
      tex: String.raw`\dot U_o=-\dot I_c R_L'=-\beta\dot I_b\,(R_c\para R_L)`,
      why: "输出回路：受控源电流 $\\beta\\dot I_b$ 流过 $R_c$ 与 $R_L$ 的并联；参考方向使 $\\dot U_o$ 与 $\\dot I_c$ 反向，故有负号",
      numeric: String.raw`R_L'=${Number.isFinite(p.RL) ? `${tq(p.Rc, "Ω")}\\para ${tq(p.RL, "Ω")}=` : "R_c="}${tq(ac.RLp, "Ω")}`,
    },
    {
      tex: hasRe
        ? String.raw`\dot A_u=\frac{\dot U_o}{\dot U_i}=-\frac{\beta R_L'}{r_{be}+(1+\beta)${reName}}`
        : String.raw`\dot A_u=\frac{\dot U_o}{\dot U_i}=-\frac{\beta R_L'}{r_{be}}`,
      why: "两式相除，$\\dot I_b$ 约去",
      numeric: hasRe
        ? String.raw`\dot A_u=-\frac{${tn(p.beta)}\times ${tq(ac.RLp, "Ω")}}{${tq(ac.rbe, "Ω")}+${tn(1 + p.beta)}\times ${tq(ReAC, "Ω")}}\approx ${tn(ac.Au)}`
        : String.raw`\dot A_u=-\frac{${tn(p.beta)}\times ${tq(ac.RLp, "Ω")}}{${tq(ac.rbe, "Ω")}}\approx ${tn(ac.Au)}`,
      units: "$\\Omega/\\Omega$ → 无量纲 ✓；负号表示 $u_o$ 与 $u_i$ 反相",
    },
    {
      tex: String.raw`R_i=${RB}\para\left[r_{be}${hasRe ? "+(1+\\beta)" + reName : ""}\right]`,
      why: "输入电阻 = 从输入端看进去的等效电阻：偏置电阻与晶体管输入支路并联",
      numeric: String.raw`R_i=${tq(dc.RB, "Ω")}\para ${tq(ac.Rib, "Ω")}=${tq(ac.Ri, "Ω")}`,
    },
    {
      tex: String.raw`R_o\approx R_c`,
      why: "令 $\\dot U_s=0$、断开 $R_L$，则 $\\dot I_b=0$ → 受控源 $\\beta\\dot I_b=0$ 相当于开路，只剩 $R_c$",
      approx: "忽略晶体管输出电阻 $r_{ce}$（$r_{ce}\\gg R_c$）",
      numeric: String.raw`R_o=${tq(ac.Ro, "Ω")}`,
    },
  ];
  if (p.Rs > 0) {
    steps.push({
      tex: String.raw`\dot A_{us}=\frac{\dot U_o}{\dot U_s}=\frac{R_i}{R_s+R_i}\dot A_u`,
      why: "信号源内阻与输入电阻分压",
      numeric: String.raw`\dot A_{us}=\frac{${tq(ac.Ri, "Ω")}}{${tq(p.Rs, "Ω")}+${tq(ac.Ri, "Ω")}}\times(${tn(ac.Au)})\approx ${tn(ac.Aus)}`,
    });
  }
  return steps;
}

/** 校验：推导式重新计算的 A_u 与计算核心一致（供测试） */
export function auFromFormula(a: CEAnalysis): number {
  const p = a.params;
  const ReAC = p.Re1 + (p.hasCe && p.Re2 > 0 ? 0 : p.Re2);
  return (-p.beta * par(p.Rc, p.RL)) / (a.ac.rbe + (1 + p.beta) * ReAC);
}
