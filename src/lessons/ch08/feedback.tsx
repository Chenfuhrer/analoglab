import { P, r } from "@/components/math/Tex";
import { Derivation } from "@/components/math/Derivation";
import { Callout } from "@/components/ui/primitives";
import { Bullets, Eq, PracticeLink, Question, Section, Stage, VarTable } from "@/components/lesson/blocks";
import { BandwidthDemo, DeepFBDemo, DistortionFB, FBBasics, RioFBDemo, StabilityDemo, TopologyTrainer } from "@/components/lesson/widgets/ch08/FeedbackWidgets";
import { CollectorBaseFB, CurrentSeriesOA, FBBlock } from "@/components/circuit/diagrams/ch08";
import { InvAmp, NonInvAmp } from "@/components/circuit/diagrams/ch07";
import { LessonArticle, LessonHeader } from "@/lessons/shared/LessonHeader";
import { bandwidthWithFeedback, closedLoop, gainSensitivity, margins } from "@/simulations/feedback/feedback";
import { tq, tn } from "@/lib/tex";

/* ════════════════════ 反馈的基本概念 ════════════════════ */
export function FBConceptLesson() {
  const U = "fb-concept";
  const c = closedLoop(1e4, 0.01);
  return (
    <LessonArticle unitId={U}>
      <LessonHeader unitId={U} path="把输出的一部分送回输入 → 方框图与基本方程 $A_f=A/(1+AF)$ → 反馈深度 → 正反馈与负反馈、直流与交流反馈。" />

      <Section unitId={U} id="fc-block" n={1} title="反馈的框图与基本方程">
        <Question n={1}>{r`闭环增益 $A_f=A/(1+AF)$ 是怎样推出来的？`}</Question>
        <Stage kind="intuition" title="闭眼走直线 vs 睁眼走直线">
          <P>{r`闭着眼走路，偏了自己不知道；睁着眼走，看到偏了就修正——“看”就是反馈。放大电路也一样：把输出量（电压或电流）的一部分取出来，送回输入端与输入量比较，用差值去驱动放大器。若送回的量**削弱**了输入，就能自动纠正输出的偏差，这就是**负反馈**。`}</P>
        </Stage>
        <Stage kind="derivation" title="方框图">
          <FBBlock caption={r`反馈放大电路的方框图：$\dot X_i$ 输入量，$\dot X_f$ 反馈量，$\dot X_i'$ 净输入量，$\dot X_o$ 输出量。`} />
          <Derivation
            title="基本方程"
            steps={[
              { tex: r`\dot X_o=\dot A\dot X_i',\qquad \dot X_f=\dot F\dot X_o,\qquad \dot X_i'=\dot X_i-\dot X_f`, why: "定义：$\\dot A$ 为开环放大倍数，$\\dot F$ 为反馈系数" },
              { tex: r`\dot X_o=\dot A(\dot X_i-\dot F\dot X_o)`, why: "代入" },
              { tex: r`\dot A_f=\frac{\dot X_o}{\dot X_i}=\frac{\dot A}{1+\dot A\dot F}`, why: "整理", numeric: r`A=10^4,\ F=0.01:\ A_f=${tn(c.Af)}` },
            ]}
            conclusion={r`$\dot A\dot F$ 称为**环路增益**（信号绕环路一周的放大倍数）；$1+\dot A\dot F$ 称为**反馈深度**。`}
          />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`$A_f=\dfrac{A}{1+AF}$；$X_i'=X_i-X_f$。`, r`$X$ 可以是电压或电流，$A$、$F$ 的量纲随之不同。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="fc-depth" n={2} title="反馈深度 1+AF">
        <Question n={2}>{r`$|1+AF|$ 大于 1 和小于 1 分别意味着什么？`}</Question>
        <Stage kind="concept" title="三种情况">
          <VarTable
            rows={[
              [r`$|1+\dot A\dot F|>1$`, r`$|\dot A_f|<|\dot A|$`, "负反馈"],
              [r`$|1+\dot A\dot F|\gg1$`, r`$\dot A_f\approx1/\dot F$`, "深度负反馈：增益只取决于反馈网络"],
              [r`$|1+\dot A\dot F|<1$`, r`$|\dot A_f|>|\dot A|$`, "正反馈"],
              [r`$1+\dot A\dot F=0$`, r`$\dot A_f\to\infty$`, "自激振荡：没有输入也有输出（第 8 章第 5 单元、第 11 章）"],
            ]}
          />
        </Stage>
        <Stage kind="visual" title="调 A 与 F">
          <FBBasics />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`反馈深度越大，增益越稳定，但增益下降越多。`, r`深度负反馈：$A_f\approx1/F$。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="fc-kind" n={3} title="正反馈与负反馈、直流与交流反馈">
        <Question n={3}>怎样区分直流反馈与交流反馈？</Question>
        <Stage kind="concept" title="分类">
          <Bullets
            items={[
              r`**正/负反馈**：反馈量使净输入量增大还是减小（用瞬时极性法判断，见下一单元）。`,
              r`**直流/交流反馈**：反馈网络只在直流通路中存在 → 直流反馈（稳定 Q 点，如被旁路的射极电阻）；只在交流通路中存在 → 交流反馈（改善动态性能，如经电容连接的反馈支路）；两者都存在 → 交直流反馈。`,
              r`**本级/级间反馈**：反馈只在一级内部，还是跨越多级（从后级输出送回前级输入）。`,
            ]}
          />
          <Callout kind="key">
            <P>{r`其实你已经见过反馈：分压偏置电路中的 $R_e$（第 3 章）是直流负反馈；未旁路的 $R_e$ 是交流负反馈；运放比例电路的 $R_f$（第 7 章）是交直流负反馈。`}</P>
          </Callout>
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`画出直流通路和交流通路，看反馈支路在哪个通路中存在。`]} />
          <div className="mt-3">
            <PracticeLink topic={U} label="去做本单元练习" />
          </div>
        </Stage>
      </Section>
    </LessonArticle>
  );
}

/* ════════════════════ 反馈类型判断 ════════════════════ */
export function FBJudgeLesson() {
  const U = "fb-judge";
  return (
    <LessonArticle unitId={U}>
      <LessonHeader unitId={U} path="找反馈网络 → 瞬时极性法判正负 → 输出端：令 $u_O=0$ 判电压/电流 → 输入端：看反馈与输入是否接在同一节点判串联/并联 → 四种组态。" />

      <Section unitId={U} id="fj-exist" n={1} title="有无反馈的判断">
        <Question n={1}>怎样找到反馈网络？</Question>
        <Stage kind="concept" title="找“回路”">
          <P>{r`看输出回路与输入回路之间是否有元件把它们连接起来（除了放大器本身）。运放电路中，从输出端连到反相端（或同相端）的电阻、电容就是反馈网络；分立电路中，射极电阻（同时在输入、输出回路中）、跨接在集电极与基极之间的电阻都构成反馈。`}</P>
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`有连接输出与输入的支路，或者有同时属于输入、输出回路的元件，就有反馈。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="fj-polarity" n={2} title="瞬时极性法判断正负反馈">
        <Question n={2}>瞬时极性法的步骤是什么？</Question>
        <Stage kind="derivation" title="步骤">
          <Derivation
            title="瞬时极性法"
            steps={[
              { tex: r`\text{设输入信号某瞬时极性为}\ \oplus`, why: "对地而言，表示该点电位正在升高" },
              { tex: r`\text{沿信号传输方向逐级标出各点的瞬时极性}`, why: "运放：同相端到输出同相、反相端到输出反相；共射 b→c 反相，共集 b→e 同相，共基 e→c 同相" },
              { tex: r`\text{得到反馈量的极性，看净输入量增大还是减小}`, why: "减小 → 负反馈；增大 → 正反馈" },
            ]}
            conclusion="串联反馈比较的是电压：反馈电压与输入电压极性相同（同为 ⊕）→ 净输入电压减小 → 负反馈。并联反馈比较的是电流：反馈支路把电流从输入节点“拉走” → 负反馈。"
          />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`一定要沿着“信号传输方向”走，不能逆着走。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="fj-type" n={3} title="电压/电流、串联/并联">
        <Question n={3}>怎样判断反馈组态？</Question>
        <Stage kind="concept" title="两个判断">
          <VarTable
            rows={[
              ["电压反馈", r`令 $u_O=0$（输出端短路），反馈量消失`, "反馈量取自输出电压，稳定输出电压"],
              ["电流反馈", r`令 $u_O=0$，反馈量仍存在`, "反馈量取自输出电流，稳定输出电流"],
              ["串联反馈", "反馈量与输入量接在放大电路的**不同**输入端（以电压形式相加减）", r`如运放同相输入 + 反馈到反相端；分立电路输入加在基极、反馈加在射极`],
              ["并联反馈", "反馈量与输入量接在**同一**节点（以电流形式相加减）", r`如运放反相输入 + 反馈到反相端；分立电路输入、反馈都接基极`],
            ]}
          />
          <P>{r`组合起来有四种：电压串联、电压并联、电流串联、电流并联。`}</P>
          <NonInvAmp caption="电压串联负反馈：同相比例电路。" />
          <InvAmp caption="电压并联负反馈：反相比例电路。" />
          <CurrentSeriesOA caption="电流串联负反馈：负载接在反馈回路中，$i_O=u_I/R$（与 $R_L$ 无关），可作压控电流源。" />
        </Stage>
        <Stage kind="visual" title="自己判断">
          <TopologyTrainer />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`输出端看取样（短路输出看反馈在不在），输入端看比较（同点并联、异点串联）。`]} />
          <div className="mt-3">
            <PracticeLink topic={U} label="去做本单元练习" />
          </div>
        </Stage>
      </Section>
    </LessonArticle>
  );
}

/* ════════════════════ 负反馈的影响 ════════════════════ */
export function FBEffectsLesson() {
  const U = "fb-effects";
  const s = gainSensitivity(1e4, 0.01, 0.2);
  const b = bandwidthWithFeedback(1e4, 1e3, 0.01);
  return (
    <LessonArticle unitId={U}>
      <LessonHeader unitId={U} path="负反馈以降低增益为代价：增益稳定性提高 $(1+AF)$ 倍、频带展宽 $(1+AF)$ 倍、非线性失真减小、输入输出电阻按组态改变。" />

      <Section unitId={U} id="fe-gain" n={1} title="稳定放大倍数">
        <Question n={1}>{r`为什么负反馈使增益的相对变化减小为 $1/(1+AF)$？`}</Question>
        <Stage kind="derivation" title="微分">
          <Derivation
            title="增益灵敏度"
            steps={[
              { tex: r`\frac{\mathrm dA_f}{\mathrm dA}=\frac{(1+AF)-AF}{(1+AF)^2}=\frac{1}{(1+AF)^2}`, why: "对 $A_f=A/(1+AF)$ 求导" },
              { tex: r`\frac{\mathrm dA_f}{A_f}=\frac{1}{1+AF}\cdot\frac{\mathrm dA}{A}`, why: "两边除以 $A_f$" },
            ]}
            conclusion={r`例：$A=10^4$、$F=0.01$，$A$ 增大 20% 时 $A_f$ 只变化 $${tn(s.rel * 100, 3)}\%$。晶体管参数随温度、器件更换而变化，负反馈让整机增益几乎不受影响。`}
          />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`稳定性提高 $(1+AF)$ 倍。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="fe-bw" n={2} title="展宽频带与减小非线性失真">
        <Question n={2}>负反馈怎样“拉宽”频带？</Question>
        <Stage kind="derivation" title="单极点放大器">
          <Eq label="8.1" note={r`开环 $\dot A=A_m/(1+jf/f_H)$。高频时开环增益下降，反馈量随之减小，净输入增大，部分补偿了增益的下降。`}>{r`\dot A_f=\frac{A_m/(1+A_mF)}{1+j\dfrac{f}{(1+A_mF)f_H}}\ \Rightarrow\ A_{mf}=\frac{A_m}{1+A_mF},\quad f_{Hf}=(1+A_mF)f_H`}</Eq>
          <P>{r`增益带宽积 $A_{mf}f_{Hf}=A_mf_H$ 不变（本例 $${tq(b.GBW, "Hz")}$）。同理，下限频率 $f_{Lf}=f_L/(1+A_mF)$。`}</P>
        </Stage>
        <Stage kind="visual" title="频带">
          <BandwidthDemo />
        </Stage>
        <Stage kind="visual" title="非线性失真">
          <DistortionFB />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`频带展宽 $(1+AF)$ 倍，增益带宽积不变。`, r`非线性失真约减小为 $1/(1+AF)$（同样输出幅度下）；对输入信号自带的失真无效。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="fe-rio" n={3} title="对输入、输出电阻的影响">
        <Question n={3}>串联负反馈为什么增大输入电阻？</Question>
        <Stage kind="concept" title="规律">
          <VarTable
            rows={[
              ["串联负反馈", r`$R_{if}=(1+AF)R_i$`, "反馈电压抵消了部分输入电压，输入电流减小 → 输入电阻增大"],
              ["并联负反馈", r`$R_{if}=R_i/(1+AF)$`, "反馈支路从输入节点分流 → 输入电阻减小"],
              ["电压负反馈", r`$R_{of}=R_o/(1+A_oF)$`, "稳定输出电压 → 像电压源，输出电阻减小"],
              ["电流负反馈", r`$R_{of}=(1+A_sF)R_o$`, "稳定输出电流 → 像电流源，输出电阻增大"],
            ]}
          />
          <Callout kind="key" title="选用原则">
            <P>{r`信号源是电压源（内阻小）→ 用串联反馈（$R_i$ 大）；信号源是电流源（内阻大）→ 用并联反馈。负载需要稳定电压 → 用电压反馈；需要稳定电流 → 用电流反馈。`}</P>
          </Callout>
        </Stage>
        <Stage kind="visual" title="四种组态">
          <RioFBDemo />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`串大并小（输入电阻），压小流大（输出电阻）。`]} />
          <div className="mt-3">
            <PracticeLink topic={U} label="去做本单元练习" />
          </div>
        </Stage>
      </Section>
    </LessonArticle>
  );
}

/* ════════════════════ 深度负反馈估算 ════════════════════ */
export function FBDeepLesson() {
  const U = "fb-deep";
  return (
    <LessonArticle unitId={U}>
      <LessonHeader unitId={U} path={r`$1+AF\gg1$ → $A_f\approx1/F$ → $X_i\approx X_f$（净输入近似为零）→ 串联反馈：虚短；并联反馈：虚断（净输入电流为零）→ 估算各类电路。`} />

      <Section unitId={U} id="fd-approx" n={1} title="深度负反馈的近似">
        <Question n={1}>{r`为什么深度负反馈时 $A_f\approx1/F$？`}</Question>
        <Stage kind="derivation" title="净输入近似为零">
          <Derivation
            title="两种等价说法"
            steps={[
              { tex: r`A_f=\frac{A}{1+AF}\ \xrightarrow{\ AF\gg1\ }\ \frac1F`, why: "分母中的 1 可以忽略" },
              { tex: r`X_i'=\frac{X_o}{A}=\frac{X_i}{1+AF}\approx0\ \Rightarrow\ X_f\approx X_i`, why: "净输入远小于输入：反馈量几乎等于输入量" },
            ]}
            conclusion="串联负反馈中净输入是电压 → 两输入端之间电压近似为零（虚短）；并联负反馈中净输入是电流 → 流入放大器的电流近似为零（虚断）。这与理想运放的虚短虚断是同一件事，只是推广到了分立元件电路。"
          />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`深度负反馈：$X_f\approx X_i$，$A_f\approx1/F$。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="fd-four" n={2} title="四种组态的估算方法">
        <Question n={2}>怎样用“虚短虚断”估算深度负反馈电路？</Question>
        <Stage kind="concept" title="对照">
          <VarTable
            rows={[
              ["电压串联", r`$u_F\approx u_I$`, r`$A_{uf}=1/F_{uu}$，如同相比例 $1+R_f/R_1$`],
              ["电压并联", r`$i_F\approx i_I$`, r`源电压增益 $A_{usf}\approx-R_f/R_s$，如反相比例`],
              ["电流串联", r`$u_F\approx u_I$`, r`$i_O\approx u_I/R_F$；带负载时 $A_{uf}\approx\pm R_L/R_F$`],
              ["电流并联", r`$i_F\approx i_I$`, r`$i_O\approx\left(1+\dfrac{R_f}{R}\right)i_I$`],
            ]}
          />
          <Callout kind="warn">
            <P>{r`并联负反馈电路的电压增益通常要按**源电压增益**估算：信号源内阻 $R_s$ 就是把电压转换为输入电流的元件，$R_s=0$ 时并联反馈不起作用。`}</P>
          </Callout>
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`先判组态，再写出 $X_f\approx X_i$ 的具体形式，最后解出电压增益。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="fd-example" n={3} title="例题">
        <Question n={3}>怎样估算分立元件反馈电路的电压放大倍数？</Question>
        <Stage kind="example" title="例题 8-1：射极电阻（电流串联负反馈）">
          <P>{r`共射电路射极接未旁路电阻 $R_e$：输入回路中 $u_F=i_eR_e\approx i_cR_e$，深度负反馈时 $u_I\approx u_F$，所以 $i_c\approx u_I/R_e$，$u_O=-i_cR_L'$，$\dot A_{uf}\approx-R_L'/R_e$。与第 3 章精确式 $-\beta R_L'/[r_{be}+(1+\beta)R_e]$ 对照：当 $(1+\beta)R_e\gg r_{be}$ 时二者相同。`}</P>
        </Stage>
        <Stage kind="visual" title="估算有多准">
          <DeepFBDemo />
        </Stage>
        <Stage kind="example" title="例题 8-2：集电极–基极电阻（电压并联负反馈）">
          <CollectorBaseFB caption="$R_f$ 跨接在集电极与基极之间。" />
          <P>{r`净输入电流 $i_B\approx0$，所以 $i_S\approx i_F$：$\frac{u_S-u_B}{R_s}\approx\frac{u_B-u_O}{R_f}$；基极电位 $u_B\approx0$（交流），得 $\dot A_{usf}=u_O/u_S\approx-R_f/R_s$。`}</P>
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`深度负反馈估算的精度取决于反馈深度；$1+AF\ge10$ 时误差一般在 10% 以内。`]} />
          <div className="mt-3">
            <PracticeLink topic={U} label="去做本单元练习" />
          </div>
        </Stage>
      </Section>
    </LessonArticle>
  );
}

/* ════════════════════ 稳定性 ════════════════════ */
export function FBStabilityLesson() {
  const U = "fb-stability";
  const a = margins({ T0: 100, poles: [1e3, 1e4, 1e5] });
  const b = margins({ T0: 100, poles: [10, 1e4, 1e5] });
  return (
    <LessonArticle unitId={U}>
      <LessonHeader unitId={U} path={r`高频附加相移使负反馈变成正反馈 → 自激条件 $\dot A\dot F=-1$ → 用环路增益波特图判断：增益裕度、相位裕度 → 主极点补偿。`} />

      <Section unitId={U} id="fst-cond" n={1} title="自激振荡的条件">
        <Question n={1}>负反馈放大电路为什么会自激？</Question>
        <Stage kind="analysis" title="附加相移">
          <P>{r`中频时负反馈的环路增益相位为 0（已经包含了“负”号）。但放大器内部每个极点在高频都会产生最多 −90° 的**附加相移**。三个极点可以产生接近 −270° 的相移：在某个频率附加相移达到 −180°，原来的负反馈就变成了正反馈。如果此时环路增益的幅值还 ≥ 1，信号绕环路一周不衰减，电路就会在该频率**自激振荡**——没有输入也有输出。`}</P>
          <Eq label="8.2" note="自激条件（与第 11 章振荡器的平衡条件相同，只是这里是“不想要”的振荡）。">{r`1+\dot A\dot F=0\iff\ |\dot A\dot F|=1,\ \ \varphi_A+\varphi_F=(2n+1)\pi`}</Eq>
          <P>{r`单极点、两极点的放大器附加相移不超过 −180°，引入负反馈后不会自激；三极点及以上则有可能。反馈越深（$F$ 越大），越容易自激。`}</P>
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`自激 = 高频附加相移 −180° 处环路增益仍 ≥ 1。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="fst-margin" n={2} title="增益裕度与相位裕度">
        <Question n={2}>怎样用波特图判断稳定性？</Question>
        <Stage kind="concept" title="两个裕度">
          <VarTable
            rows={[
              ["相位裕度 $\\varphi_m$", r`在 $|\dot A\dot F|=1$（0 dB）处，相位距 −180° 还差多少`, r`$\varphi_m>0$ 稳定；工程上要求 $\ge45°$`],
              ["增益裕度 $G_m$", r`在 $\varphi=-180°$ 处，$20\lg|\dot A\dot F|$ 距 0 dB 还差多少`, r`$G_m<0$ dB（即幅值小于 1）稳定；工程上要求 $\le-10$ dB`],
            ]}
          />
          <P>{r`例：三个极点 1 kHz、10 kHz、100 kHz，环路增益 100（40 dB）时，相位裕度 $${tn(a.PM, 3)}°$——${a.stable ? "稳定" : "不稳定，会自激"}。`}</P>
        </Stage>
        <Stage kind="visual" title="环路增益波特图与阶跃响应">
          <StabilityDemo />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`看 0 dB 交越处的相位，或 −180° 处的幅值。`, r`相位裕度小时，即使稳定，阶跃响应也会有明显过冲和振铃。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="fst-comp" n={3} title="频率补偿">
        <Question n={3}>主极点补偿的原理是什么？</Question>
        <Stage kind="concept" title="让幅值先降到 1">
          <P>{r`既然问题在于“相位到 −180° 时幅值还大于 1”，那就让幅值在相位还没转过去之前就降到 1 以下。**主极点补偿**（滞后补偿）：在放大器某一级加一个电容，把最低的极点频率进一步压低，使环路增益在第二个极点之前就以 −20 dB/十倍频下降到 0 dB，这时相移只有约 −90°～−135°。上例把第一个极点从 1 kHz 压到 10 Hz，相位裕度变为 $${tn(b.PM, 3)}°$。`}</P>
          <P>{r`代价是开环带宽变窄。通用运放（如 741）内部已做了补偿，开环增益只有一个主极点（约 10 Hz），保证接成任何比例（包括电压跟随器）都不自激——这也是运放增益带宽积有限的原因。利用米勒效应，一个几十皮法的电容就能产生很低的主极点。`}</P>
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`主极点补偿：牺牲带宽换稳定。`, r`电压跟随器（$F=1$）是最容易自激的接法，要求运放“单位增益稳定”。`]} />
          <div className="mt-3">
            <PracticeLink topic={U} label="去做本单元练习" />
          </div>
        </Stage>
      </Section>
    </LessonArticle>
  );
}
