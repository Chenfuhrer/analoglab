import { P, r, Tex } from "@/components/math/Tex";
import { Derivation } from "@/components/math/Derivation";
import { Callout } from "@/components/ui/primitives";
import { Bullets, Eq, PracticeLink, Question, Section, Stage, VarTable } from "@/components/lesson/blocks";
import { ActiveLoadDemo, DecomposeDemo, DiffLab, DiffTransfer, MirrorDemo } from "@/components/lesson/widgets/ch06/DiffWidgets";
import { DiffCurrentSource, DiffLongTail, Mirror } from "@/components/circuit/diagrams/ch06";
import { LessonArticle, LessonHeader } from "@/lessons/shared/LessonHeader";
import { analyzeDiff, decompose, DEFAULT_DIFF, mirror, widlar, widlarResistor } from "@/simulations/diff/diffamp";
import { tq, tn } from "@/lib/tex";

/* ════════════════════ 差模与共模 ════════════════════ */
export function DiffSignalsLesson() {
  const U = "diff-signals";
  const d = decompose(1.002, 0.998);
  return (
    <LessonArticle unitId={U}>
      <LessonHeader unitId={U} path="两个输入端 → 差模分量（相减）与共模分量（平均）→ 有用信号多为差模，温漂与干扰多为共模 → 理想差分电路只放大差模。" />

      <Section unitId={U} id="ds-decomp" n={1} title="差模与共模分解">
        <Question n={1}>任意两个输入信号怎样分解为差模和共模分量？</Question>
        <Stage kind="concept" title="定义">
          <Eq label="6.1" note="对任意 $u_{I1}$、$u_{I2}$ 都成立，是纯数学恒等式。">{r`u_{Id}=u_{I1}-u_{I2},\qquad u_{Ic}=\frac{u_{I1}+u_{I2}}{2}\qquad\Longleftrightarrow\qquad u_{I1}=u_{Ic}+\frac{u_{Id}}{2},\ \ u_{I2}=u_{Ic}-\frac{u_{Id}}{2}`}</Eq>
          <P>{r`差模分量在两个输入端**大小相等、极性相反**（各为 $\pm u_{Id}/2$）；共模分量在两个输入端**大小相等、极性相同**。例如 $u_{I1}=1.002$ V、$u_{I2}=0.998$ V：$u_{Id}=${tq(d.uId, "V")}$，$u_{Ic}=${tq(d.uIc, "V")}$——真正要放大的 4 mV 叠加在 1 V 的共模电压上。`}</P>
        </Stage>
        <Stage kind="visual" title="看分解">
          <DecomposeDemo />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`$u_{Id}=u_{I1}-u_{I2}$，$u_{Ic}=(u_{I1}+u_{I2})/2$。`, r`线性电路中：$u_O=A_du_{Id}+A_cu_{Ic}$。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="ds-why" n={2} title="放大差模、抑制共模">
        <Question n={2}>温漂和干扰为什么等效为共模信号？</Question>
        <Stage kind="analysis" title="对称性">
          <Bullets
            items={[
              r`**温度漂移**：两只对称晶体管处于同一温度下，$U_{BE}$、$\beta$ 的变化相同——相当于在两个输入端加了相同的信号，即共模信号。`,
              r`**电源波动、电磁干扰**：通过长导线耦合进来的 50 Hz 干扰通常同时出现在两根信号线上，也是共模信号。`,
              r`**有用信号**：传感器电桥的输出、双绞线上的差分信号，体现在两线之差上——差模信号。`,
            ]}
          />
          <Callout kind="key">
            <P>{r`理想的差分放大电路：$A_d$ 大、$A_c=0$。实际电路用**共模抑制比** $K_{CMR}=|A_d/A_c|$ 衡量“放大差模、抑制共模”的能力（下一单元）。`}</P>
          </Callout>
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`共模 = 两端同时、同向的变化（温漂、干扰）；差模 = 两端之差（信号）。`]} />
          <div className="mt-3">
            <PracticeLink topic={U} label="去做本单元练习" />
          </div>
        </Stage>
      </Section>
    </LessonArticle>
  );
}

/* ════════════════════ 电流源电路 ════════════════════ */
export function CurrentSourceLesson() {
  const U = "current-source";
  const m = mirror(12, 11.3e3, 100);
  const w = widlar(1e-3, 3e3);
  return (
    <LessonArticle unitId={U}>
      <LessonHeader unitId={U} path={r`集成电路中用晶体管代替大电阻 → 镜像电流源 $I_{C2}\approx I_R$ → 比例电流源、微电流源 → 电流源的高输出电阻 → 作长尾与有源负载。`} />

      <Section unitId={U} id="isrc-mirror" n={1} title="镜像电流源">
        <Question n={1}>镜像电流源的输出电流为什么近似等于参考电流？</Question>
        <Stage kind="analysis" title="电路">
          <Mirror caption="镜像电流源：VT₁ 集电极与基极相连（相当于二极管），两管 $U_{BE}$ 相同。" />
          <Derivation
            title="I_C2 与 I_R 的关系"
            steps={[
              { tex: r`U_{BE1}=U_{BE2}\ \Rightarrow\ I_{C1}=I_{C2}=I_C`, why: "两管特性相同、发射结电压相同，所以集电极电流相同（“镜像”）" },
              { tex: r`I_R=I_C+2I_B=I_C\left(1+\frac2\beta\right)`, why: "节点 KCL：参考电流分给 VT₁ 的集电极和两管的基极" },
              { tex: r`I_{C2}=\frac{\beta}{\beta+2}I_R\approx I_R=\frac{V_{CC}-U_{BE}}{R}`, why: "β ≫ 2 时", numeric: r`R=11.3\,\mathrm{k\Omega}:\ I_R=${tq(m.IR, "A")},\ I_{C2}=${tq(m.IC2, "A")}` },
            ]}
            conclusion="输出电流由电阻 R 决定，几乎与 β、温度无关（两管同时变化，相互补偿）。"
          />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`$I_{C2}\approx I_R=(V_{CC}-U_{BE})/R$。`, r`要求两管特性对称——集成电路中天然满足。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="isrc-ratio" n={2} title="比例电流源与微电流源">
        <Question n={2}>怎样用小电阻得到微安级电流？</Question>
        <Stage kind="derivation" title="射极接电阻">
          <P>{r`在两管射极分别串入 $R_{e1}$、$R_{e2}$：$U_{BE1}+I_{E1}R_{e1}=U_{BE2}+I_{E2}R_{e2}$。若电阻上的压降远大于 $U_{BE}$ 之差，则 $I_{C2}\approx\dfrac{R_{e1}}{R_{e2}}I_R$——**比例电流源**。`}</P>
          <Derivation
            title="微电流源（R_e1 = 0）"
            steps={[
              { tex: r`U_{BE1}-U_{BE2}=I_{E2}R_{e2}`, why: "VT₁ 射极直接接地" },
              { tex: r`U_{BE1}-U_{BE2}=U_T\ln\frac{I_{E1}}{I_{E2}}\approx U_T\ln\frac{I_R}{I_{C2}}`, why: "由 PN 结电流方程 $i\\approx I_Se^{u/U_T}$" },
              { tex: r`I_{C2}R_{e2}=U_T\ln\frac{I_R}{I_{C2}}`, why: "超越方程，用试算或迭代求解", numeric: r`I_R=1\,\mathrm{mA},\ R_{e2}=3\,\mathrm{k\Omega}:\ I_{C2}\approx${tq(w, "A")}` },
            ]}
            conclusion={r`反过来设计：要 10 µA 只需 $R_{e2}=U_T\ln(I_R/I_{C2})/I_{C2}=${tq(widlarResistor(1e-3, 10e-6), "Ω")}$（$I_R$=1 mA）；若用镜像电流源则 $R$ 要 1.13 MΩ。`}
          />
        </Stage>
        <Stage kind="visual" title="电流源参数">
          <MirrorDemo />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`比例电流源：$I_{C2}\approx(R_{e1}/R_{e2})I_R$。`, r`微电流源：$I_{C2}R_{e2}=U_T\ln(I_R/I_{C2})$，用小电阻得到小电流。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="isrc-load" n={3} title="电流源的输出电阻与有源负载">
        <Question n={3}>为什么电流源适合作差分电路的“长尾”？</Question>
        <Stage kind="concept" title="直流电阻小、交流电阻大">
          <P>{r`电流源只需几伏的管压降就能提供恒定电流（直流电阻 $U_{CE}/I_C$ 只有几千欧），而它对电流变化呈现的交流电阻是输出特性的斜率倒数 $r_{ce}=U_A/I_C$（几十千欧到几兆欧），射极带电阻时更大：$R_o\approx r_{ce}[1+\beta R_e/(r_{be}+R_e)]$。`}</P>
          <Bullets
            items={[
              r`**作差分电路的长尾**：长尾电阻越大，共模抑制比越高；但用真实电阻实现几兆欧需要很高的 $V_{EE}$。电流源同时满足“直流压降小”和“交流电阻大”。`,
              r`**作有源负载**：代替集电极电阻 $R_c$，单级电压增益可达上千倍（集成运放的中间级常这样做）。`,
            ]}
          />
        </Stage>
        <Stage kind="visual" title="有源负载的增益">
          <ActiveLoadDemo />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`电流源 = 理想的大电阻：交流电阻大、直流压降小、易集成。`]} />
          <div className="mt-3">
            <PracticeLink topic={U} label="去做本单元练习" />
          </div>
        </Stage>
      </Section>
    </LessonArticle>
  );
}

/* ════════════════════ 差分放大电路 ════════════════════ */
export function DiffAmplifierLesson() {
  const U = "diff-amplifier";
  const a = analyzeDiff(DEFAULT_DIFF);
  const s = analyzeDiff({ ...DEFAULT_DIFF, output: "single", RL: Infinity });
  const p = DEFAULT_DIFF;
  return (
    <LessonArticle unitId={U}>
      <LessonHeader unitId={U} path="对称电路 + 长尾 → 静态 $I_{EQ}=(V_{EE}-U_{BE})/(2R_e)$ → 差模：射极交流接地 → 共模：每管射极等效 $2R_e$ → 四种输入输出方式 → $K_{CMR}$ 与恒流源 → 大信号限幅。" />

      <Section unitId={U} id="da-basic" n={1} title="长尾式差分放大电路">
        <Question n={1}>差分电路的静态工作点怎样计算？</Question>
        <Stage kind="analysis" title="电路">
          <DiffLongTail caption="长尾式差分放大电路：两管对称，射极共用电阻 $R_e$（“长尾”）接负电源 $-V_{EE}$。" />
          <Derivation
            title="静态（u_I1 = u_I2 = 0）"
            steps={[
              { tex: r`I_{BQ}R_b+U_{BEQ}+2I_{EQ}R_e=V_{EE}`, why: "基极回路 KVL：两管的射极电流都流过 $R_e$" },
              { tex: r`I_{EQ}=\frac{V_{EE}-U_{BEQ}}{\frac{R_b}{1+\beta}+2R_e}\approx\frac{V_{EE}-U_{BEQ}}{2R_e}`, why: "$R_b/(1+\\beta)\\ll2R_e$ 时", numeric: r`=${tq(a.IEQ, "A")}` },
              { tex: r`U_{CQ}=V_{CC}-I_{CQ}R_c=${tq(a.UCQ, "V")},\quad U_{EQ}\approx-U_{BEQ}`, why: `代入 $V_{CC}=V_{EE}$=12 V、$R_c$=10 kΩ、$R_e$=10 kΩ、$R_b$=1 kΩ、β=100` },
            ]}
            conclusion="两个集电极电位相同，双端输出的静态电压为零——这就是“输入为零时输出为零”，零点漂移由此被抵消。"
          />
        </Stage>
        <Stage kind="analysis" title="差模与共模的交流通路">
          <Bullets
            items={[
              r`**差模输入**：一管电流增加多少，另一管就减少多少，流过 $R_e$ 的电流不变 → **射极交流接地**。每管就是一个共射电路：$u_{Od1}=-\frac{\beta R_c}{R_b+r_{be}}\cdot\frac{u_{Id}}{2}$。`,
              r`**共模输入**：两管电流同时增减，$R_e$ 中电流变化为单管的 2 倍 → 对每管而言，射极接了 $2R_e$ 的电阻（强烈的共模负反馈）。`,
            ]}
          />
          <Eq label="6.2" note={r`双端输出，负载 $R_L$ 接在两集电极之间（其中点为交流地，故每管负载 $R_L/2$）。`}>{r`A_d=\frac{u_{Od}}{u_{Id}}=-\frac{\beta\left(R_c\para\frac{R_L}{2}\right)}{R_b+r_{be}},\qquad R_{id}=2(R_b+r_{be}),\qquad R_o=2R_c`}</Eq>
          <P>{r`本例 $r_{be}=${tq(a.rbe, "Ω")}$，$R_L=${tq(p.RL, "Ω")}$：$A_d=${tn(a.Ad)}$，$R_{id}=${tq(a.Rid, "Ω")}$。注意 $A_d$ 与单管共射电路相同——用两只管子换来的是对共模的抑制，而不是更大的增益。`}</P>
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`差模：射极交流接地；共模：每管射极等效 $2R_e$。`, r`双端输出：$A_d$ 等于单管共射增益，理想时 $A_c=0$。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="da-modes" n={2} title="四种输入输出方式">
        <Question n={2}>双端输出与单端输出的差模增益有什么关系？</Question>
        <Stage kind="concept" title="对照">
          <VarTable
            rows={[
              ["双端输出", r`$A_d=-\dfrac{\beta(R_c\para\frac{R_L}2)}{R_b+r_{be}}$`, r`$A_c\approx0$（对称时），$R_o=2R_c$`],
              ["单端输出（从 c₁）", r`$A_d=-\dfrac12\cdot\dfrac{\beta(R_c\para R_L)}{R_b+r_{be}}$`, r`$A_c=-\dfrac{\beta(R_c\para R_L)}{R_b+r_{be}+2(1+\beta)R_e}$，$R_o=R_c$`],
            ]}
          />
          <Bullets
            items={[
              r`**单端输入**（一端接信号、另一端接地）等效于差模 $u_{Id}=u_I$ 加共模 $u_{Ic}=u_I/2$。只要 $R_e$ 足够大，单端输入与双端输入的差模特性相同。`,
              r`单端输出的增益约为双端的一半；从 c₂ 输出与输入 $u_{I1}$ 同相，从 c₁ 输出与之反相——用来实现双端到单端的转换。`,
            ]}
          />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`差模增益只与**输出方式**有关：单端 = 双端 / 2（空载时）。`, r`单端输出依靠 $R_e$ 抑制共模。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="da-cmrr" n={3} title="共模抑制比与恒流源">
        <Question n={3}>{r`为什么增大 $R_e$ 能提高共模抑制比？`}</Question>
        <Stage kind="derivation" title="单端输出的 K_CMR">
          <Derivation
            title="K_CMR"
            steps={[
              { tex: r`K_{CMR}=\left|\frac{A_d}{A_c}\right|,\qquad K_{CMR}(\mathrm{dB})=20\lg K_{CMR}`, why: "定义" },
              { tex: r`K_{CMR}=\frac{R_b+r_{be}+2(1+\beta)R_e}{2(R_b+r_{be})}\approx\frac{\beta R_e}{R_b+r_{be}}`, why: "单端输出，两式相除" },
            ]}
            conclusion={r`本例单端输出（空载）：$A_d=${tn(s.Ad)}$，$A_c=${tn(s.Ac)}$，$K_{CMR}=${tn(s.KCMR)}$（$${tn(s.KCMRdB)}$ dB）。要提高 $K_{CMR}$ 就要增大 $R_e$，但 $R_e$ 增大会使 $I_{EQ}$ 减小（$V_{EE}$ 不变时）——用**恒流源**代替 $R_e$ 可以两全其美：直流上提供固定的 $I_0$，交流上等效电阻高达兆欧级。`}
          />
          <DiffCurrentSource caption="恒流源式差分放大电路：长尾换成电流源 $I_0$，$I_{EQ}=I_0/2$，共模抑制比大大提高。" />
        </Stage>
        <Stage kind="visual" title="差分电路实验">
          <DiffLab />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`$K_{CMR}=|A_d/A_c|$，越大越好；集成运放可达 80–120 dB。`, r`双端输出靠对称抵消共模；单端输出靠大 $R_e$（恒流源）抑制共模。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="da-large" n={4} title="大信号传输特性">
        <Question n={4}>差模输入多大时差分电路进入限幅？</Question>
        <Stage kind="analysis" title="指数特性 + 电流恒定">
          <P>{r`两管射极电流之和被长尾（恒流源）固定为 $I_0$，比值由 $e^{u_{Id}/U_T}$ 决定：`}</P>
          <Tex block>{r`i_{C1}=\frac{I_0}{1+e^{-u_{Id}/U_T}},\qquad i_{C2}=\frac{I_0}{1+e^{u_{Id}/U_T}}`}</Tex>
          <P>{r`$|u_{Id}|$ 只有几十毫伏时就接近饱和：电流全部流向一侧，另一侧截止，输出被限幅。所以差分放大电路的线性输入范围很窄（约 $\pm U_T$），但这也让它天然适合做电压比较器。`}</P>
        </Stage>
        <Stage kind="visual" title="传输特性曲线">
          <DiffTransfer />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`线性区：$|u_{Id}|<U_T$；限幅区：$|u_{Id}|>4U_T$。`, r`射极串小电阻可扩大线性范围（代价是 $A_d$ 下降）。`]} />
          <div className="mt-3">
            <PracticeLink topic={U} label="去做本单元练习" />
          </div>
        </Stage>
      </Section>
    </LessonArticle>
  );
}
