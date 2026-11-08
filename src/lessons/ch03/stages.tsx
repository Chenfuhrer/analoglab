import { P, r, Tex } from "@/components/math/Tex";
import { Derivation } from "@/components/math/Derivation";
import { Callout } from "@/components/ui/primitives";
import { Bullets, Eq, PracticeLink, Question, Section, Stage, VarTable } from "@/components/lesson/blocks";
import { MiniLab } from "@/components/lesson/widgets/MiniLab";
import { BufferDemo, CCDemo, ConfigCompare, EstimateError, QDriftCompare } from "@/components/lesson/widgets/ch03/StageWidgets";
import { CBAmp, CCAmp } from "@/components/circuit/diagrams/ch03";
import { LessonArticle, LessonHeader } from "@/lessons/shared/LessonHeader";
import { analyzeCE } from "@/simulations/bjt/ce";
import { analyzeCB, analyzeCC, DEFAULT_CB, DEFAULT_CC } from "@/simulations/bjt/stages";
import { DEFAULT_DIVIDER } from "@/simulations/bjt/types";
import { par } from "@/simulations/units";
import { tq, tn } from "@/lib/tex";

/* ════════════════════ 分压式偏置 ════════════════════ */
export function DividerBiasLesson() {
  const U = "divider-bias";
  const a = analyzeCE(DEFAULT_DIVIDER);
  const p = a.params;
  const est = a.dc.estimate!;
  const noCe = analyzeCE({ ...DEFAULT_DIVIDER, hasCe: false });
  return (
    <LessonArticle unitId={U}>
      <LessonHeader unitId={U} path="温度/β 变化 → 固定偏置 Q 点漂移 → 分压固定 $U_{BQ}$ + $R_e$ 直流负反馈 → 估算法及其条件 → 动态分析（$R_e$ 全旁路 / 部分旁路 / 不旁路）。" lab={{ href: "/lab/ce-amplifier", label: "共射实验室（切换到分压偏置）" }} />

      <Section unitId={U} id="db-drift" n={1} title="Q 点为什么会漂移">
        <Question n={1}>温度变化会怎样影响固定偏置电路的 Q 点？</Question>
        <Stage kind="analysis" title="固定偏置的弱点">
          <P>{r`固定偏置电路中 $I_{BQ}=(V_{CC}-U_{BEQ})/R_b$ 几乎是定值，于是 $I_{CQ}=\beta I_{BQ}$ **与 $\beta$ 成正比**。第 2 章已经知道：温度每升高 1 °C，$\beta$ 约增大 1%，$U_{BE}$ 约减小 2.2 mV，$I_{CBO}$ 约每 10 °C 翻倍——三者都使 $I_{CQ}$ 增大，Q 点沿负载线上移，严重时进入饱和区。更换同型号的管子（$\beta$ 分散性很大）也会造成同样的问题。`}</P>
          <Callout kind="key">
            <P>{r`解决思路：让 $I_{CQ}$ 主要由**电阻值**决定，而不是由 $\beta$、$U_{BE}$ 这些“不靠谱”的器件参数决定。`}</P>
          </Callout>
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`固定偏置：$I_{CQ}\propto\beta$，温度稳定性差。`, r`稳定 Q 点 = 让 $I_{CQ}$ 尽量与 $\beta$ 无关。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="db-stable" n={2} title="分压偏置稳定 Q 点的原理">
        <Question n={2}>{r`$R_e$ 是怎样稳定 Q 点的？`}</Question>
        <Stage kind="analysis" title="两个措施">
          <MiniLab initial={DEFAULT_DIVIDER} keys={[]} panels={["schematic"]} title="分压式偏置共射电路（点击元件查看作用）" modeSwitch testId="divider-schematic" />
          <Bullets
            items={[
              r`**$R_{b1}$、$R_{b2}$ 分压**：只要流过分压电阻的电流 $I_1\gg I_{BQ}$，基极电位 $U_{BQ}\approx\frac{R_{b1}}{R_{b1}+R_{b2}}V_{CC}$ 就基本固定。`,
              r`**射极电阻 $R_e$**：把 $I_{EQ}$ 的变化转换为 $U_{EQ}$ 的变化，反过来调节 $U_{BEQ}=U_{BQ}-U_{EQ}$。`,
            ]}
          />
          <Derivation
            title="温度升高时的自动调节过程"
            steps={[
              { tex: r`T\uparrow\ \Rightarrow\ I_{CQ}\uparrow\,(I_{EQ}\uparrow)`, why: "β 增大、$U_{BE}$ 减小、$I_{CBO}$ 增大" },
              { tex: r`\Rightarrow\ U_{EQ}=I_{EQ}R_e\uparrow`, why: "射极电阻上的压降随之增大" },
              { tex: r`\Rightarrow\ U_{BEQ}=U_{BQ}-U_{EQ}\downarrow`, why: "$U_{BQ}$ 由分压固定" },
              { tex: r`\Rightarrow\ I_{BQ}\downarrow\ \Rightarrow\ I_{CQ}\downarrow`, why: "发射结电压减小，基极电流减小，抵消了最初的增大" },
            ]}
            conclusion={r`这是**直流负反馈**：输出量（$I_{CQ}$）的变化经 $R_e$ 送回输入回路，产生一个反向的调节。$R_e$ 越大，反馈越强，Q 点越稳定（代价是占用更多电源电压）。第 8 章会系统地讨论负反馈。`}
          />
        </Stage>
        <Stage kind="visual" title="同一 Q 点，比一比温度稳定性">
          <QDriftCompare />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`分压固定 $U_{BQ}$，$R_e$ 引入直流负反馈。`, r`$I_{EQ}\approx(U_{BQ}-U_{BEQ})/R_e$ 与 $\beta$ 基本无关。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="db-calc" n={3} title="估算法与精确法">
        <Question n={3}>估算法在什么条件下成立？</Question>
        <Stage kind="derivation" title="两种方法">
          <Derivation
            title="估算法（教材常用）"
            steps={[
              { tex: r`U_{BQ}\approx\frac{R_{b1}}{R_{b1}+R_{b2}}V_{CC}`, why: "忽略 $I_{BQ}$ 对分压的影响", approx: r`条件：$I_1\gg I_{BQ}$，等价于 $(1+\beta)R_e\gg R_{b1}\para R_{b2}$（一般要求 ≥10 倍）` },
              { tex: r`I_{EQ}=\frac{U_{BQ}-U_{BEQ}}{R_e}\approx I_{CQ}`, why: "射极回路 KVL" },
              { tex: r`I_{BQ}=\frac{I_{EQ}}{1+\beta},\quad U_{CEQ}\approx V_{CC}-I_{CQ}(R_c+R_e)`, why: "集电极回路 KVL，$I_E\\approx I_C$" },
            ]}
          />
          <Derivation
            title="精确法（戴维南等效）"
            steps={[
              { tex: r`V_{BB}=\frac{R_{b1}}{R_{b1}+R_{b2}}V_{CC},\quad R_B=R_{b1}\para R_{b2}`, why: "把基极左侧的分压电路等效为电压源 + 内阻" },
              { tex: r`V_{BB}=I_{BQ}R_B+U_{BEQ}+(1+\beta)I_{BQ}R_e`, why: "基极回路 KVL" },
              { tex: r`I_{BQ}=\frac{V_{BB}-U_{BEQ}}{R_B+(1+\beta)R_e}`, why: "解出 $I_{BQ}$，其余同前" },
            ]}
            conclusion={r`当 $(1+\beta)R_e\gg R_B$ 时，精确式的分母 $\approx(1+\beta)R_e$，就回到估算法的结果。`}
          />
        </Stage>
        <Stage kind="example" title="例题 3-1">
          <P>{r`$V_{CC}=${tq(p.VCC, "V")}$，$R_{b1}=${tq(p.Rb1, "Ω")}$，$R_{b2}=${tq(p.Rb2, "Ω")}$，$R_c=${tq(p.Rc, "Ω")}$，$R_e=R_{e1}+R_{e2}=${tq(p.Re1 + p.Re2, "Ω")}$，$\beta=${tn(p.beta)}$。`}</P>
          <Tex block>{r`\text{估算：}U_{BQ}=${tq(est.UBQ, "V")},\ I_{CQ}\approx${tq(est.ICQ, "A")},\ U_{CEQ}\approx${tq(est.UCEQ, "V")};\quad\text{精确：}I_{CQ}=${tq(a.dc.ICQ, "A")},\ U_{CEQ}=${tq(a.dc.UCEQ, "V")}`}</Tex>
          <P>{r`条件比值 $(1+\beta)R_e/R_B=${tn(est.ratio)}$，估算法误差约 $${tn(((est.ICQ - a.dc.ICQ) / a.dc.ICQ) * 100, 2)}\%$。`}</P>
        </Stage>
        <Stage kind="visual" title="条件不满足时会怎样">
          <EstimateError />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`满足 $(1+\beta)R_e\ge10R_B$ 时用估算法；否则用戴维南等效。`, r`考试中若题目未说明，一般用估算法，并注意说明条件。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="db-dynamic" n={4} title="动态分析与旁路电容">
        <Question n={4}>射极电阻全旁路、部分旁路、不旁路有什么区别？</Question>
        <Stage kind="analysis" title="R_e 在交流通路中的去留">
          <VarTable
            rows={[
              [r`$C_e$ 并在整个 $R_e$ 上`, r`交流通路中射极接地`, r`$\dot A_u=-\dfrac{\beta R_L'}{r_{be}}$，$R_i=R_{b1}\para R_{b2}\para r_{be}$`],
              [r`$R_e=R_{e1}+R_{e2}$，只旁路 $R_{e2}$`, r`$R_{e1}$ 留在交流通路`, r`$\dot A_u=-\dfrac{\beta R_L'}{r_{be}+(1+\beta)R_{e1}}$，$R_i=R_{b1}\para R_{b2}\para[r_{be}+(1+\beta)R_{e1}]$`],
              [r`没有 $C_e$`, r`整个 $R_e$ 留在交流通路`, r`$\dot A_u=-\dfrac{\beta R_L'}{r_{be}+(1+\beta)R_e}\approx-\dfrac{R_L'}{R_e}$`],
            ]}
          />
          <P>{r`$R_e$ 对直流起稳定 Q 点的作用；对交流，它同样引入负反馈——使 $|\dot A_u|$ 下降，但增益更稳定（几乎只由电阻比 $R_L'/R_e$ 决定）、输入电阻增大、线性更好。旁路电容让我们“只要直流负反馈，不要交流负反馈”。`}</P>
        </Stage>
        <Stage kind="example" title="例题 3-2：部分旁路 vs 不旁路">
          <P>{r`例题 3-1 电路中 $R_{e1}=${tq(p.Re1, "Ω")}$ 不旁路、$R_{e2}=${tq(p.Re2, "Ω")}$ 被旁路，$R_L=${tq(p.RL, "Ω")}$：$r_{be}=${tq(a.ac.rbe, "Ω")}$，$\dot A_u=${tn(a.ac.Au)}$，$R_i=${tq(a.ac.Ri, "Ω")}$。若 $C_e$ 开路：$\dot A_u=${tn(noCe.ac.Au)}$，$R_i=${tq(noCe.ac.Ri, "Ω")}$——增益下降、输入电阻增大，Q 点不变。`}</P>
        </Stage>
        <Stage kind="visual" title="改 R_e1、R_e2，看增益与输入电阻">
          <MiniLab initial={DEFAULT_DIVIDER} keys={["Re1", "Re2", "RL", "beta"]} panels={["readouts", "ac-derivation"]} title="分压偏置共射电路的动态参数" testId="divider-dyn" />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`被旁路的部分只影响直流；未旁路的部分同时影响直流和交流。`, r`未旁路 $R_e$：$|\dot A_u|\downarrow$、$R_i\uparrow$、增益稳定性与线性↑。`]} />
          <div className="mt-3">
            <PracticeLink topic={U} label="去做本单元练习" />
          </div>
        </Stage>
      </Section>
    </LessonArticle>
  );
}

/* ════════════════════ 共集电极放大电路 ════════════════════ */
export function CCAmplifierLesson() {
  const U = "cc-amplifier";
  const a = analyzeCC(DEFAULT_CC);
  const p = DEFAULT_CC;
  return (
    <LessonArticle unitId={U}>
      <LessonHeader unitId={U} path={r`直流通路与 Q 点 → 微变等效（$R_e$ 同时在输入、输出回路）→ $A_u\approx1$ 且同相 → $R_i$ 大、$R_o$ 小 → 作输入级、输出级与缓冲级。`} />

      <Section unitId={U} id="cc-q" n={1} title="电路组成与静态分析">
        <Question n={1}>共集电路的输出从哪里取出？</Question>
        <Stage kind="analysis" title="电路">
          <CCAmp labels={{ Rb: "200 kΩ", Re: "3 kΩ", RL: "3 kΩ" }} caption="共集电极放大电路：信号从基极输入、从**发射极**输出；集电极直接接 $V_{CC}$，在交流通路中接地，是输入、输出回路的公共端。" />
          <Derivation
            title="静态工作点（固定偏置）"
            steps={[
              { tex: r`V_{CC}=I_{BQ}R_b+U_{BEQ}+(1+\beta)I_{BQ}R_e`, why: "基极回路 KVL，$I_{EQ}=(1+\\beta)I_{BQ}$ 流过 $R_e$" },
              { tex: r`I_{BQ}=\frac{V_{CC}-U_{BEQ}}{R_b+(1+\beta)R_e}=${tq(a.dc.IBQ, "A")}`, why: "代入 $V_{CC}$=12 V、$R_b$=200 kΩ、$R_e$=3 kΩ、$\\beta$=100" },
              { tex: r`U_{CEQ}=V_{CC}-I_{EQ}R_e=${tq(a.dc.UCEQ, "V")}`, why: "集电极回路 KVL（$R_c=0$）" },
            ]}
          />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`射极电阻 $R_e$ 也起直流负反馈作用，Q 点比固定偏置共射电路稳定。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="cc-gain" n={2} title="电压放大倍数：跟随">
        <Question n={2}>{r`为什么 $A_u$ 略小于 1 且同相？`}</Question>
        <Stage kind="derivation" title="由微变等效电路推导">
          <Derivation
            title="A_u"
            steps={[
              { tex: r`\dot U_o=\dot I_e R_L'=(1+\beta)\dot I_bR_L',\quad R_L'=R_e\para R_L`, why: "输出取自发射极，$\\dot I_e$ 流过 $R_e\\para R_L$" },
              { tex: r`\dot U_i=\dot I_br_{be}+\dot U_o=\dot I_b\big[r_{be}+(1+\beta)R_L'\big]`, why: "输入回路 KVL：$\\dot U_i$ 等于 b–e 间电压加上输出电压" },
              { tex: r`\dot A_u=\frac{(1+\beta)R_L'}{r_{be}+(1+\beta)R_L'}`, why: "相除", numeric: r`=${tn(a.ac.Au, 4)}` },
            ]}
            conclusion={r`分母只比分子多一个 $r_{be}$，而一般 $(1+\beta)R_L'\gg r_{be}$，所以 $\dot A_u$ 略小于 1 且为正：输出电压“跟随”输入电压，故称**射极跟随器**（emitter follower）。物理上：发射极电位 = 基极电位 − 约 0.7 V，基极动多少，发射极就跟着动多少。`}
          />
          <Callout kind="myth">
            <P>{r`“共集电路没有放大作用”不准确。它没有**电压**放大，但有**电流**放大（$\dot I_e/\dot I_b=1+\beta$），因此仍有功率放大。`}</P>
          </Callout>
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`$\dot A_u=\dfrac{(1+\beta)R_L'}{r_{be}+(1+\beta)R_L'}\lesssim1$，同相。`, r`电流放大 $1+\beta$，有功率放大。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="cc-rio" n={3} title="高输入电阻、低输出电阻">
        <Question n={3}>为什么输出电阻要考虑信号源内阻？</Question>
        <Stage kind="derivation" title="R_i 与 R_o">
          <Eq label="3.1" note={r`射极电阻 $R_L'$ 折算到基极要乘以 $(1+\beta)$（射极电流是基极电流的 $1+\beta$ 倍）。`}>{r`R_i=R_b\para\big[r_{be}+(1+\beta)R_L'\big]`}</Eq>
          <Derivation
            title="输出电阻（加压求流法）"
            steps={[
              { tex: r`\dot U_s=0\ (\text{保留 }R_s),\ R_L\text{ 断开，在输出端加 }\dot U`, why: "输出电阻的定义" },
              { tex: r`\dot I_b=-\frac{\dot U}{r_{be}+R_s'},\quad R_s'=R_s\para R_b`, why: "此时 $\\dot U$ 经 b–e 结与基极回路的电阻构成回路" },
              { tex: r`\dot I=\frac{\dot U}{R_e}-(1+\beta)\dot I_b=\dot U\left[\frac1{R_e}+\frac{1+\beta}{r_{be}+R_s'}\right]`, why: "KCL：流入射极节点的电流" },
              { tex: r`R_o=R_e\para\frac{r_{be}+R_s'}{1+\beta}`, why: "基极回路的电阻折算到射极要**除以** $(1+\\beta)$", numeric: r`=${tq(a.ac.Ro, "Ω")}\ (R_s=${tq(p.Rs, "Ω")})` },
            ]}
            conclusion={r`共集电路的输入电阻可达几十至几百千欧，输出电阻只有几十欧。二者都与“另一端”接的电阻有关：$R_i$ 与 $R_L$ 有关，$R_o$ 与 $R_s$ 有关——这是共集电路与共射电路在分析上的最大不同。`}
          />
        </Stage>
        <Stage kind="visual" title="调参数看 A_u、R_i、R_o">
          <CCDemo />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`$R_i$ 大（射极电阻 ×$(1+\beta)$）。`, r`$R_o$ 小（基极电阻 ÷$(1+\beta)$）。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="cc-use" n={4} title="射极跟随器的应用">
        <Question n={4}>电压放大倍数不到 1 的电路有什么用？</Question>
        <Stage kind="analysis" title="阻抗变换">
          <Bullets
            items={[
              r`**输入级**：$R_i$ 大，从信号源索取的电流小，适合接高内阻信号源（如传感器）。`,
              r`**输出级**：$R_o$ 小，带负载能力强，负载变化时输出电压基本不变。`,
              r`**中间缓冲级**：隔在两级共射电路之间，前级看到的是一个大电阻（负载效应小），后级看到的是一个小内阻的信号源。`,
            ]}
          />
        </Stage>
        <Stage kind="visual" title="缓冲的效果">
          <BufferDemo />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`共集电路 = 阻抗变换器。多级放大电路（第 5 章）和功放（第 10 章）中大量使用。`]} />
          <div className="mt-3">
            <PracticeLink topic={U} label="去做本单元练习" />
          </div>
        </Stage>
      </Section>
    </LessonArticle>
  );
}

/* ════════════════════ 共基极放大电路 ════════════════════ */
export function CBAmplifierLesson() {
  const U = "cb-amplifier";
  const a = analyzeCB(DEFAULT_CB);
  const p = DEFAULT_CB;
  return (
    <LessonArticle unitId={U}>
      <LessonHeader unitId={U} path="基极经大电容接地 → 静态分析同分压偏置共射 → 微变等效（e 入 c 出）→ $A_u$ 与共射同值同相、$R_i$ 很小 → 三种组态比较。" />

      <Section unitId={U} id="cb-circuit" n={1} title="电路组成与静态分析">
        <Question n={1}>共基电路的输入端在哪里？</Question>
        <Stage kind="analysis" title="电路">
          <CBAmp caption="共基极放大电路：信号经 $C_1$ 加到**发射极**，从集电极输出；基极经大电容 $C_b$ 交流接地，是公共端。" />
          <P>{r`直流通路中所有电容开路，与分压偏置共射电路完全相同：$U_{BQ}\approx\frac{R_{b1}}{R_{b1}+R_{b2}}V_{CC}$，$I_{EQ}\approx(U_{BQ}-U_{BEQ})/R_e$。本例 $R_{b1}=${tq(p.Rb1, "Ω")}$、$R_{b2}=${tq(p.Rb2, "Ω")}$、$R_e=${tq(p.Re, "Ω")}$、$R_c=${tq(p.Rc, "Ω")}$，得 $I_{CQ}=${tq(a.dc.ICQ, "A")}$，$U_{CEQ}=${tq(a.dc.UCEQ, "V")}$。`}</P>
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`判断共基：交流通路中基极接地，e 入 c 出。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="cb-dynamic" n={2} title="动态分析">
        <Question n={2}>为什么共基电路的输入电阻很小？</Question>
        <Stage kind="derivation" title="微变等效电路分析">
          <Derivation
            title="A_u、R_i、R_o"
            steps={[
              { tex: r`\dot U_i=-\dot I_br_{be}`, why: "基极接地，输入电压加在 e–b 之间（$\\dot I_b$ 参考方向流入基极）" },
              { tex: r`\dot U_o=-\beta\dot I_bR_L',\quad R_L'=R_c\para R_L`, why: "受控源电流 $\\beta\\dot I_b$ 流过 $R_L'$" },
              { tex: r`\dot A_u=\frac{\dot U_o}{\dot U_i}=\frac{\beta R_L'}{r_{be}}`, why: "与共射电路数值相同、符号相反（同相）", numeric: r`=${tn(a.ac.Au)}` },
              { tex: r`R_i=R_e\para\frac{r_{be}}{1+\beta}`, why: "从发射极看进去，$r_{be}$ 中的电流是射极电流的 $1/(1+\\beta)$", numeric: r`=${tq(a.ac.Ri, "Ω")}` },
              { tex: r`R_o\approx R_c`, why: "与共射相同（忽略 $r_{ce}$ 时）" },
            ]}
            conclusion={r`输入电阻只有十几到几十欧：信号源若有一定内阻，大部分电压就降在内阻上了（$R_s=${tq(p.Rs, "Ω")}$ 时 $\dot A_{us}=${tn(a.ac.Aus)}$；若 $R_s=1$ kΩ，$\dot A_{us}$ 只有 $${tn(analyzeCB({ ...p, Rs: 1e3 }).ac.Aus)}$）。`}
          />
          <P>{r`共基电路的电流放大倍数 $\dot I_c/\dot I_e=\alpha<1$，是**电流跟随器**。它的优点在于：集电结电容不会像共射电路那样被“米勒效应”放大（第 9 章），所以高频特性好，常用于高频放大和宽带放大，也与共射电路组成“共射–共基”（cascode）电路。`}</P>
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`$\dot A_u=\beta R_L'/r_{be}$（同相），$R_i\approx r_{be}/(1+\beta)$（很小），$R_o\approx R_c$。`, r`电流跟随（$\alpha<1$），高频特性好。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="cb-compare" n={3} title="三种组态的比较">
        <Question n={3}>怎样根据需求选择组态？</Question>
        <Stage kind="concept" title="对照表">
          <VarTable
            rows={[
              ["共射", r`$-\beta R_L'/r_{be}$（大、反相）；电流放大 $\beta$`, r`$R_i$ 中等（$\approx r_{be}$），$R_o\approx R_c$；用于中间级电压放大`],
              ["共集", r`$\lesssim1$（同相）；电流放大 $1+\beta$`, r`$R_i$ 大、$R_o$ 小；用于输入级、输出级、缓冲级`],
              ["共基", r`$\beta R_L'/r_{be}$（大、同相）；电流放大 $\alpha<1$`, r`$R_i$ 很小、$R_o\approx R_c$；用于高频、宽带`],
            ]}
          />
          <Callout kind="key" title="记忆口诀">
            <P>{r`“共射反相、共集跟随、共基同相”；“共集 $R_i$ 大 $R_o$ 小，共基 $R_i$ 最小”。这里的 $r_{be}$ 与 $(1+\beta)$ 的折算规律在第 5 章多级放大电路中会反复使用。`}</P>
          </Callout>
        </Stage>
        <Stage kind="visual" title="同一个管子、同一个 Q 点">
          <ConfigCompare />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`三种组态各有所长，实际电路往往是组合：共射–共集、共射–共基、共集–共集（达林顿）。`, r`同一偏置下输入电阻：共基 $\approx r_{be}/(1+\beta)$ ≪ 共射 $\approx r_{be}$ ≪ 共集 $\approx(1+\beta)(R_e\para R_L)$（本例 $r_{be}=${tq(a.ac.rbe, "Ω")}$，共集的射极负载 $R_e\para R_L=${tq(par(p.Re, p.RL), "Ω")}$）。`]} />
          <div className="mt-3">
            <PracticeLink topic={U} label="去做本单元练习" />
          </div>
        </Stage>
      </Section>
    </LessonArticle>
  );
}
