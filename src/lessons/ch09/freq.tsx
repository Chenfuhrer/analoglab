import { P, r } from "@/components/math/Tex";
import { Derivation } from "@/components/math/Derivation";
import { Callout } from "@/components/ui/primitives";
import { Bullets, Eq, PracticeLink, Question, Section, Stage, VarTable } from "@/components/lesson/blocks";
import { AmpShape, CEFreqLab, HybridPiDemo, MultistageBW, RCBode } from "@/components/lesson/widgets/ch09/FreqWidgets";
import { HybridPiModel, RCHighPass, RCLowPass } from "@/components/circuit/diagrams/ch09";
import { LessonArticle, LessonHeader } from "@/lessons/shared/LessonHeader";
import { ceFrequency, hybridPi, identicalStages, multistageEstimate } from "@/simulations/freq/freq";
import { DEFAULT_DIVIDER, type CEParams } from "@/simulations/bjt/types";
import { tq, tn } from "@/lib/tex";

/* ════════════════════ 频率响应的基本概念 ════════════════════ */
export function FreqBasicsLesson() {
  const U = "freq-basics";
  return (
    <LessonArticle unitId={U}>
      <LessonHeader unitId={U} path="电抗元件使增益随频率变化 → RC 低通/高通 → 截止频率与 −3 dB → 波特图（对数坐标 + 渐近线）→ 放大电路的低频段、中频段、高频段。" />

      <Section unitId={U} id="frb-rc" n={1} title="RC 低通与高通电路">
        <Question n={1}>为什么 RC 电路会有截止频率？</Question>
        <Stage kind="derivation" title="低通">
          <RCLowPass caption="RC 低通：频率越高，电容容抗越小，输出被“短路”得越厉害。" />
          <Derivation
            title="频率特性"
            steps={[
              { tex: r`\dot A_u=\frac{\dot U_o}{\dot U_i}=\frac{1/(j\omega C)}{R+1/(j\omega C)}=\frac{1}{1+j\omega RC}`, why: "分压公式" },
              { tex: r`\dot A_u=\frac{1}{1+j\dfrac{f}{f_H}},\qquad f_H=\frac{1}{2\pi RC}`, why: "令 $\\omega RC=f/f_H$" },
              { tex: r`|\dot A_u|=\frac{1}{\sqrt{1+(f/f_H)^2}},\qquad \varphi=-\arctan\frac{f}{f_H}`, why: "幅频与相频" },
            ]}
            conclusion={r`$f=f_H$ 时 $|\dot A_u|=1/\sqrt2\approx0.707$（−3 dB），$\varphi=-45°$，称为**上限截止频率**。截止频率由**时间常数** $RC$ 决定。`}
          />
          <RCHighPass caption={r`RC 高通：$\dot A_u=\dfrac{j(f/f_L)}{1+j(f/f_L)}$，$f_L=1/(2\pi RC)$ 为下限截止频率，低频时超前相移趋于 +90°。`} />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`截止频率 $f=1/(2\pi RC)$：增益下降到 0.707 倍（−3 dB）。`, r`低通：高频衰减、滞后相移；高通：低频衰减、超前相移。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="frb-bode" n={2} title="波特图">
        <Question n={2}>渐近线波特图怎样画？误差多大？</Question>
        <Stage kind="concept" title="对数坐标">
          <P>{r`横轴用 $\lg f$（每个“十倍频”等距），纵轴用 $20\lg|\dot A_u|$（dB）和 $\varphi$。这样，几个环节相乘的响应在图上变成相加，而一阶环节可以用两段直线近似：`}</P>
          <VarTable
            rows={[
              ["低通幅频", r`$f<f_H$：0 dB；$f>f_H$：−20 dB/十倍频`, "转折点误差 −3 dB"],
              ["低通相频", r`$f<0.1f_H$：0°；$0.1f_H$～$10f_H$：−45°/十倍频；$f>10f_H$：−90°`, "最大误差约 5.7°"],
              ["高通", "与低通关于转折频率对称", "相位从 +90° 降到 0°"],
            ]}
          />
        </Stage>
        <Stage kind="visual" title="精确值与渐近线">
          <RCBode />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`一个极点：−20 dB/十倍频、−90°。`, r`渐近线最大误差：幅频 3 dB、相频 5.7°。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="frb-amp" n={3} title="放大电路频率响应的一般形状">
        <Question n={3}>为什么放大电路有上、下两个截止频率？</Question>
        <Stage kind="analysis" title="两类电容">
          <Bullets
            items={[
              r`**耦合电容、旁路电容**（微法级）：与电路电阻构成**高通**网络——低频时容抗大，增益下降。决定下限截止频率 $f_L$。`,
              r`**晶体管结电容、分布电容**（皮法级）：并联在信号通路上构成**低通**网络——高频时容抗小，增益下降。决定上限截止频率 $f_H$。`,
              r`中频段两类电容的影响都可忽略（大电容短路、小电容开路）：这正是前面各章“中频分析”的前提。`,
            ]}
          />
          <Eq note={r`通频带 $f_{bw}=f_H-f_L\approx f_H$（通常 $f_H\gg f_L$）。`}>{r`\dot A_u\approx\frac{\dot A_{um}}{\left(1-j\dfrac{f_L}{f}\right)\left(1+j\dfrac{f}{f_H}\right)}`}</Eq>
        </Stage>
        <Stage kind="visual" title="三个频段">
          <AmpShape />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`低频看大电容（$f_L$），高频看小电容（$f_H$）。`, r`直接耦合放大电路没有耦合电容，$f_L=0$。`]} />
          <div className="mt-3">
            <PracticeLink topic={U} label="去做本单元练习" />
          </div>
        </Stage>
      </Section>
    </LessonArticle>
  );
}

/* ════════════════════ 混合 π 模型 ════════════════════ */
export function HybridPiLesson() {
  const U = "freq-hybrid-pi";
  const h = hybridPi({ IEQ: 1e-3, beta: 100, rbb: 200, fT: 300e6, Cmu: 2e-12 });
  return (
    <LessonArticle unitId={U}>
      <LessonHeader unitId={U} path={r`h 参数模型忽略了结电容 → 高频时加入 $C_\pi$（b'–e）、$C_\mu$（b'–c）→ 用跨导 $g_m$ 表示受控源 → 参数可由 Q 点和手册中的 $f_T$、$C_{ob}$ 求出 → $f_\beta$ 与 $f_T$。`} />

      <Section unitId={U} id="fh-model" n={1} title="混合 π 等效模型">
        <Question n={1}>高频时为什么要考虑结电容？</Question>
        <Stage kind="concept" title="模型">
          <HybridPiModel caption="混合 π 等效电路（忽略很大的 $r_{b'c}$ 和 $r_{ce}$）。b' 为基区内部的等效点，$r_{bb'}$ 为基区体电阻。" />
          <VarTable
            rows={[
              [r`$r_{b'e}$`, "发射结动态电阻（折合到基极）", r`$(1+\beta_0)U_T/I_{EQ}$`],
              [r`$C_\pi$`, "发射结电容（扩散电容为主）", "几十到几百皮法"],
              [r`$C_\mu$`, "集电结电容（势垒电容）", r`几皮法，手册中的 $C_{ob}$`],
              [r`$g_m$`, "跨导：$\\dot I_c=g_m\\dot U_{b'e}$", r`$I_{EQ}/U_T$，1 mA 时约 38 mS`],
            ]}
          />
          <P>{r`低频时 $C_\pi$、$C_\mu$ 开路，混合 π 模型就退化为熟悉的 h 参数模型：$r_{be}=r_{bb'}+r_{b'e}$，$\beta\dot I_b=g_m\dot U_{b'e}$。频率升高后，$C_\pi$ 分流了基极电流，使 $\dot U_{b'e}$ 和 $\dot I_c$ 下降——这就是晶体管 β 随频率下降的原因。`}</P>
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`高频模型 = h 参数模型 + $C_\pi$ + $C_\mu$；受控源写成 $g_m\dot U_{b'e}$。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="fh-params" n={2} title="混合 π 参数与 h 参数的关系">
        <Question n={2}>{r`$g_m$ 与 $\beta$、$r_{b'e}$ 是什么关系？`}</Question>
        <Stage kind="derivation" title="由 Q 点求参数">
          <Derivation
            title="参数换算"
            steps={[
              { tex: r`r_{b'e}=(1+\beta_0)\frac{U_T}{I_{EQ}}`, why: "与第 3 章 $r_{be}$ 中的第二项相同" },
              { tex: r`g_m=\frac{\beta_0}{r_{b'e}}\approx\frac{I_{EQ}}{U_T}`, why: "低频时 $\\beta_0\\dot I_b=g_m\\dot I_br_{b'e}$" },
              { tex: r`C_\pi\approx\frac{g_m}{2\pi f_T}-C_\mu`, why: "由手册给出的特征频率 $f_T$ 反推（见下一节）" },
            ]}
            conclusion={r`例：$I_{EQ}=1$ mA、$\beta_0=100$、$f_T=300$ MHz、$C_\mu=2$ pF：$g_m=${tn(h.gm * 1e3)}$ mS，$r_{b'e}=${tq(h.rbpe, "Ω")}$，$C_\pi=${tq(h.Cpi, "F")}$。`}
          />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`$g_m=I_{EQ}/U_T$ 只与 Q 点有关，与管子型号无关（同一电流下所有 BJT 的 $g_m$ 相同）。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="fh-fbeta" n={3} title="特征频率 f_β 与 f_T">
        <Question n={3}>{r`$f_T$ 为什么约等于 $\beta f_\beta$？`}</Question>
        <Stage kind="derivation" title="β 的频率特性">
          <Derivation
            title="输出端短路时的电流增益"
            steps={[
              { tex: r`\dot\beta=\frac{\dot I_c}{\dot I_b}=\frac{g_m}{\dfrac1{r_{b'e}}+j\omega(C_\pi+C_\mu)}=\frac{\beta_0}{1+j\dfrac{f}{f_\beta}}`, why: "c–e 短路，$C_\\mu$ 与 $C_\\pi$ 并联；忽略流过 $C_\\mu$ 的前馈电流" },
              { tex: r`f_\beta=\frac{1}{2\pi r_{b'e}(C_\pi+C_\mu)}`, why: "共射截止频率：$|\\dot\\beta|$ 下降到 $0.707\\beta_0$" },
              { tex: r`|\dot\beta(f_T)|=1\ \Rightarrow\ f_T\approx\beta_0f_\beta\approx\frac{g_m}{2\pi(C_\pi+C_\mu)}`, why: "$f\\gg f_\\beta$ 时 $|\\dot\\beta|\\approx\\beta_0f_\\beta/f$" },
            ]}
            conclusion={r`本例 $f_\beta=${tq(h.fbeta, "Hz")}$。$f_T$ 是“电流增益–带宽积”，是选管时衡量高频性能的主要参数；还有共基截止频率 $f_\alpha\approx f_T$，所以共基电路高频特性好。`}
          />
        </Stage>
        <Stage kind="visual" title="调参数看 β(f)">
          <HybridPiDemo />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`$f_\beta\ll f_T\approx\beta_0f_\beta$。`, r`手册给 $f_T$ 与 $C_{ob}$（$\approx C_\mu$），据此求 $C_\pi$。`]} />
          <div className="mt-3">
            <PracticeLink topic={U} label="去做本单元练习" />
          </div>
        </Stage>
      </Section>
    </LessonArticle>
  );
}

/* ════════════════════ 单管放大电路 ════════════════════ */
export function SingleStageFreqLesson() {
  const U = "freq-single-stage";
  const p: CEParams = { ...DEFAULT_DIVIDER, Re1: 0, Re2: 1.2e3, hasCe: true, Rs: 600, C1: 10e-6, C2: 10e-6, Ce: 100e-6 };
  const res = ceFrequency(p, { fT: 200e6, Cmu: 3e-12 });
  const noM = ceFrequency(p, { fT: 200e6, Cmu: 3e-12 }, { miller: false });
  return (
    <LessonArticle unitId={U}>
      <LessonHeader unitId={U} path={r`中频：大电容短路、小电容开路 → 低频：短路时间常数法求 $f_L$（旁路电容常起决定作用）→ 高频：米勒效应把 $C_\mu$ 放大 → $f_H$ → 增益带宽积。`} lab={{ href: "/lab/ce-amplifier", label: "共射实验室" }} />

      <Section unitId={U} id="f1-low" n={1} title="低频响应：耦合与旁路电容">
        <Question n={1}>哪个电容决定下限截止频率？</Question>
        <Stage kind="derivation" title="短路时间常数法">
          <Eq note={r`$R_k$ 为其余电容短路时从电容 $C_k$ 两端看进去的电阻。各转折频率相差较远时，$f_L$ 约等于其中最大者。`}>{r`f_L\approx\sum_k\frac{1}{2\pi R_kC_k}`}</Eq>
          <Bullets
            items={[
              r`输入耦合电容 $C_1$：$R=R_s+R_i$。`,
              r`输出耦合电容 $C_2$：$R=R_c+R_L$。`,
              r`射极旁路电容 $C_e$：$R=R_e\para\dfrac{r_{be}+R_s\para R_B}{1+\beta}$——从射极看进去的电阻只有十几到几十欧，所以 $C_e$ 必须取得很大（几十到几百微法），否则它会决定 $f_L$。`,
            ]}
          />
          <P>{r`本例（$C_1=C_2=10\,\mu$F，$C_e=100\,\mu$F，$R_s=600\,\Omega$）：$f_{C1}=${tq(res.hp.fC1, "Hz")}$，$f_{C2}=${tq(res.hp.fC2, "Hz")}$，$f_{Ce}=${tq(res.hp.fCe, "Hz")}$，$f_L\approx${tq(res.fL, "Hz")}$。`}</P>
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`$f_L$ 由“小 R × C”最小（时间常数最短）的那个电容主导，常常是旁路电容。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="f1-high" n={2} title="高频响应与米勒效应">
        <Question n={2}>{r`为什么 $C_\mu$ 很小却对高频影响很大？`}</Question>
        <Stage kind="derivation" title="米勒定理">
          <Derivation
            title="跨接在输入、输出之间的电容"
            steps={[
              { tex: r`\dot I_{C_\mu}=j\omega C_\mu(\dot U_{b'e}-\dot U_{ce})=j\omega C_\mu\dot U_{b'e}(1-\dot K)`, why: "$\\dot K=\\dot U_{ce}/\\dot U_{b'e}=-g_mR_L'$ 为 b' 到 c 的电压增益" },
              { tex: r`C_M=(1-\dot K)C_\mu=(1+g_mR_L')C_\mu`, why: "从输入端看，$C_\\mu$ 等效为一个对地电容，放大了 $(1+g_mR_L')$ 倍" },
              { tex: r`C_\pi'=C_\pi+(1+g_mR_L')C_\mu`, why: "与 $C_\\pi$ 并联" },
              { tex: r`f_H=\frac{1}{2\pi RC_\pi'},\quad R=r_{b'e}\para(r_{bb'}+R_s\para R_B)`, why: "输入回路为单极点 RC 低通（输出侧的 $C_\\mu''\\approx C_\\mu$ 一般可忽略）" },
            ]}
            conclusion={r`本例 $g_mR_L'\approx${tn(res.hpi.gm * res.RLp)}$，3 pF 的 $C_\mu$ 等效为约 $${tq((1 + res.hpi.gm * res.RLp) * 3e-12, "F")}$，$C_\pi'=${tq(res.CpiMiller, "F")}$，$f_H\approx${tq(res.fH, "Hz")}$；若忽略米勒效应会得到 $${tq(noM.fH, "Hz")}$——高估了好几倍。`}
          />
          <HybridPiModel labels={{ miller: "yes" }} caption={r`米勒等效：$C_\mu$ 被拆成输入侧的 $(1+g_mR_L')C_\mu$ 与输出侧的 $C_\mu''\approx C_\mu$。`} />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`米勒效应：反相放大器输入、输出间的电容在输入端被放大 $(1+|K|)$ 倍。`, r`共基、共集电路没有（或很弱的）米勒效应，所以高频特性好。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="f1-full" n={3} title="完整频率特性与增益带宽积">
        <Question n={3}>为什么提高增益往往会降低带宽？</Question>
        <Stage kind="analysis" title="增益带宽积">
          <P>{r`中频源电压增益 $|\dot A_{usm}|\propto g_mR_L'$，而 $C_\pi'$ 中的米勒项也 $\propto g_mR_L'$，二者此消彼长：增大 $R_L'$ 增益上去了，$f_H$ 就下来了。对一只确定的晶体管，$|\dot A_{usm}|f_H$ 近似为常数（**增益带宽积**），它由 $f_T$、$C_\mu$、$r_{bb'}$ 和 $R_s$ 决定。本例增益带宽积约 $${tq(res.GBW, "Hz")}$。要同时获得高增益和宽频带，就要选 $f_T$ 高、$C_\mu$ 和 $r_{bb'}$ 小的管子，并减小信号源内阻。`}</P>
          <Callout kind="note">
            <P>{r`运放的增益带宽积（如 741 约 1 MHz）是同一思想：闭环增益 × 闭环带宽 ≈ 常数（第 8 章“展宽频带”）。`}</P>
          </Callout>
        </Stage>
        <Stage kind="visual" title="共射电路的完整波特图">
          <CEFreqLab />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`$\dot A_{us}\approx\dfrac{\dot A_{usm}}{(1-jf_L/f)(1+jf/f_H)}$。`, r`增益与带宽此消彼长；改善带宽的根本在于器件和信号源内阻。`]} />
          <div className="mt-3">
            <PracticeLink topic={U} label="去做本单元练习" />
          </div>
        </Stage>
      </Section>
    </LessonArticle>
  );
}

/* ════════════════════ 多级放大电路 ════════════════════ */
export function MultistageFreqLesson() {
  const U = "freq-multistage";
  const ex = identicalStages(2, 100, 1e6);
  const est = multistageEstimate([100, 100], [1e6, 1e6]);
  return (
    <LessonArticle unitId={U}>
      <LessonHeader unitId={U} path="总频率特性 = 各级频率特性之积（dB 相加）→ 级数越多带宽越窄 → $f_L$、$f_H$ 的估算公式。" />

      <Section unitId={U} id="fm-band" n={1} title="多级放大电路的通频带">
        <Question n={1}>级联后通频带为什么变窄？</Question>
        <Stage kind="derivation" title="各级相乘">
          <Eq label="9.1" note="对数坐标下，幅频相加、相频相加。">{r`\dot A_u=\prod_k\dot A_{uk},\qquad 20\lg|\dot A_u|=\sum_k20\lg|\dot A_{uk}|,\qquad \varphi=\sum_k\varphi_k`}</Eq>
          <P>{r`在单级的上限频率 $f_{H1}$ 处，每一级都下降 3 dB，n 级共下降 3n dB——早已低于 −3 dB 的标准。所以多级电路的 $f_H$ 低于任何一级的 $f_{Hk}$，$f_L$ 高于任何一级的 $f_{Lk}$。n 级相同（各一个高、低频极点）时：`}</P>
          <Eq note={r`例：两级相同，单级 $f_H$=1 MHz、$f_L$=100 Hz → 总 $f_H\approx${tq(ex.fH, "Hz")}$、$f_L\approx${tq(ex.fL, "Hz")}$。`}>{r`f_H=f_{H1}\sqrt{2^{1/n}-1},\qquad f_L=\frac{f_{L1}}{\sqrt{2^{1/n}-1}}`}</Eq>
        </Stage>
        <Stage kind="visual" title="级数与带宽">
          <MultistageBW />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`级数越多，增益越高，但通频带越窄。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="fm-estimate" n={2} title="上、下限截止频率的估算">
        <Question n={2}>{r`$f_H\approx1/(1.1\sqrt{\sum 1/f_{Hk}^2})$ 怎样使用？`}</Question>
        <Stage kind="concept" title="经验公式">
          <Eq label="9.2" note={r`适用于各级都可近似为单极点的情况；若某一级的截止频率比其他级低（或高）得多，总的截止频率就近似等于该级的值。`}>{r`\frac1{f_H}\approx1.1\sqrt{\sum_k\frac1{f_{Hk}^2}},\qquad f_L\approx1.1\sqrt{\sum_kf_{Lk}^2}`}</Eq>
          <P>{r`两级相同（同上例）：估算 $f_H\approx${tq(est.fH, "Hz")}$、$f_L\approx${tq(est.fL, "Hz")}$，与精确值相差几个百分点。`}</P>
          <Callout kind="key">
            <P>{r`设计多级宽带放大器时，各级带宽要比总要求宽得多；而提高总带宽的最有效办法，是改善最窄的那一级（“木桶效应”）。`}</P>
          </Callout>
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`$f_H$ 由最低的 $f_{Hk}$ 主导，$f_L$ 由最高的 $f_{Lk}$ 主导。`]} />
          <div className="mt-3">
            <PracticeLink topic={U} label="去做本单元练习" />
          </div>
        </Stage>
      </Section>
    </LessonArticle>
  );
}
