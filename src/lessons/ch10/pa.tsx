import { P, r } from "@/components/math/Tex";
import { Derivation } from "@/components/math/Derivation";
import { Callout } from "@/components/ui/primitives";
import { Bullets, Eq, PracticeLink, Question, Section, Stage, VarTable } from "@/components/lesson/blocks";
import { ClassDemo, CrossoverDemo, OCLPowerDemo, OTLDemo } from "@/components/lesson/widgets/ch10/PAWidgets";
import { OCL, OCLAB, OTL } from "@/components/circuit/diagrams/ch10";
import { LessonArticle, LessonHeader } from "@/lessons/shared/LessonHeader";
import { oclMax, oclMaxTubeLoss, otlMax } from "@/simulations/power/pa";
import { tq, tn } from "@/lib/tex";

/* ════════════════════ 功放的特点与分类 ════════════════════ */
export function PAClassesLesson() {
  const U = "pa-classes";
  return (
    <LessonArticle unitId={U}>
      <LessonHeader unitId={U} path="功放关心功率、效率、失真与散热 → 用导通角分类：甲类、乙类、甲乙类（丙类）→ 静态电流越小效率越高。" />

      <Section unitId={U} id="pc-feature" n={1} title="功率放大电路的特点">
        <Question n={1}>功放与电压放大电路关注的指标有什么不同？</Question>
        <Stage kind="concept" title="大信号工作">
          <Bullets
            items={[
              r`**输出功率大**：要向负载（扬声器、电机）提供足够的功率，晶体管工作在接近极限参数的大信号状态，不能再用微变等效电路，而用图解法或解析的功率公式。`,
              r`**效率要高**：$\eta=P_o/P_V$。效率低意味着大量电能变成热，既浪费又要大散热器。`,
              r`**非线性失真要小**：大信号下失真与效率常常矛盾。`,
              r`**散热与保护**：管耗 $P_T$ 必须小于 $P_{CM}$，并考虑二次击穿等。`,
            ]}
          />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`电压放大关心 $A_u$、$R_i$、$R_o$；功率放大关心 $P_{om}$、$\eta$、$P_T$、失真。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="pc-class" n={2} title="甲类、乙类、甲乙类">
        <Question n={2}>导通角怎样决定功放的类型？</Question>
        <Stage kind="concept" title="按导通角分类">
          <VarTable
            rows={[
              ["甲类（A）", "导通角 360°", "Q 点在负载线中央，失真小；静态电流大，效率低（理想 ≤ 50%）"],
              ["乙类（B）", "导通角 180°", "静态电流为零，效率高（理想 78.5%）；单管只放大半个周期，需两管推挽；有交越失真"],
              ["甲乙类（AB）", "导通角略大于 180°", "加很小的静态电流消除交越失真，效率接近乙类；实际功放多用此类"],
              ["丙类（C）", "导通角 < 180°", "效率更高，用于高频谐振功放（本课程不展开）"],
            ]}
          />
        </Stage>
        <Stage kind="visual" title="静态电流、导通角与效率">
          <ClassDemo />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`静态电流越小 → 导通角越小 → 效率越高，但单管波形越不完整。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="pc-eff" n={3} title="效率与管耗">
        <Question n={3}>为什么甲类功放的效率最高只有 50%？</Question>
        <Stage kind="derivation" title="甲类（变压器或电感耦合负载）">
          <Derivation
            title="理想甲类的最大效率"
            steps={[
              { tex: r`P_V=V_{CC}I_{CQ}`, why: "电源始终提供静态电流（与有无信号无关）" },
              { tex: r`P_{o\max}=\frac12U_{cem}I_{cm}\le\frac12V_{CC}I_{CQ}`, why: "电压摆幅最大为 $V_{CC}$，电流摆幅最大为 $I_{CQ}$（正弦）" },
              { tex: r`\eta_{\max}=\frac{P_{o\max}}{P_V}=50\%`, why: "若负载直接串在集电极（电阻负载），还要扣除静态电流在负载上的损耗，最大效率只有 25%" },
            ]}
            conclusion="甲类的问题在于：没有信号时电源照样提供 $V_{CC}I_{CQ}$ 的功率，全部变成热。要提高效率，就要让静态电流趋于零——这就是乙类。"
          />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`$P_V=P_o+P_T$；效率越低，管耗越大。`, r`甲类 ≤ 50%，乙类 ≤ 78.5%。`]} />
          <div className="mt-3">
            <PracticeLink topic={U} label="去做本单元练习" />
          </div>
        </Stage>
      </Section>
    </LessonArticle>
  );
}

/* ════════════════════ OCL ════════════════════ */
export function PAOCLLesson() {
  const U = "pa-ocl";
  const m = oclMax(12, 8, 0);
  const m1 = oclMax(12, 8, 1);
  const t = oclMaxTubeLoss(12, 8);
  return (
    <LessonArticle unitId={U}>
      <LessonHeader unitId={U} path={r`NPN、PNP 互补管各负责半周 → 射极跟随输出 → $P_{om}$、$P_V$、$\eta$ 推导 → 管耗最大的条件 → 选管三个条件。`} />

      <Section unitId={U} id="po-circuit" n={1} title="OCL 互补对称电路">
        <Question n={1}>两只管子怎样轮流工作？</Question>
        <Stage kind="analysis" title="电路">
          <OCL caption="乙类 OCL（output capacitorless）：正、负双电源，NPN 管 VT₁ 与 PNP 管 VT₂ 特性对称，发射极相连接负载。" />
          <Bullets
            items={[
              r`静态（$u_i=0$）：两管发射结都不导通，$I_{CQ}=0$，输出端电位为 0，负载中无直流电流（不需要输出电容）。`,
              r`正半周：VT₁ 导通、VT₂ 截止，电流 $+V_{CC}\to$ VT₁ $\to R_L\to$ 地；负半周：VT₂ 导通，电流 地 $\to R_L\to$ VT₂ $\to -V_{CC}$。`,
              r`两管都接成**射极跟随器**：$A_u\approx1$，输出电阻小，适合驱动低阻负载；功率增益来自电流放大。`,
            ]}
          />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`互补对称 + 推挽 = 两只管子各放大半个周期，合成完整波形。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="po-power" n={2} title="输出功率与效率">
        <Question n={2}>最大效率 78.5% 是怎样推出来的？</Question>
        <Stage kind="derivation" title="推导">
          <Derivation
            title="设输出 u_o = U_om sinωt"
            steps={[
              { tex: r`P_o=\frac{U_{om}^2}{2R_L}`, why: "正弦有效值功率" },
              { tex: r`P_V=2\times V_{CC}\cdot\frac{1}{2\pi}\int_0^{\pi}\frac{U_{om}}{R_L}\sin\omega t\,\mathrm d(\omega t)=\frac{2V_{CC}U_{om}}{\pi R_L}`, why: "每个电源只在半个周期提供电流，平均值为 $I_{cm}/\\pi$" },
              { tex: r`\eta=\frac{P_o}{P_V}=\frac{\pi}{4}\cdot\frac{U_{om}}{V_{CC}}`, why: "效率与输出幅值成正比" },
              { tex: r`U_{om}=V_{CC}-U_{CES}\approx V_{CC}\ \Rightarrow\ P_{om}=\frac{(V_{CC}-U_{CES})^2}{2R_L},\ \eta_{\max}=\frac\pi4\approx78.5\%`, why: "最大不失真输出（理想时忽略饱和压降）" },
            ]}
            conclusion={r`$\pm V_{CC}=12$ V、$R_L=8\,\Omega$：理想 $P_{om}=${tq(m.Po, "W")}$；计入 $U_{CES}=1$ V 时 $P_{om}=${tq(m1.Po, "W")}$，$\eta=${tn(m1.eta * 100, 3)}\%$。`}
          />
        </Stage>
        <Stage kind="visual" title="功率与输出幅值">
          <OCLPowerDemo />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`$P_{om}=\dfrac{(V_{CC}-U_{CES})^2}{2R_L}$，$\eta=\dfrac{\pi U_{om}}{4V_{CC}}$。`, r`小信号时效率低——乙类功放的效率只在接近满功率时才高。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="po-tube" n={3} title="管耗与选管">
        <Question n={3}>为什么管耗最大时输出并不最大？</Question>
        <Stage kind="derivation" title="管耗">
          <Derivation
            title="每管管耗"
            steps={[
              { tex: r`P_{T1}=\frac12(P_V-P_o)=\frac{1}{R_L}\left(\frac{V_{CC}U_{om}}{\pi}-\frac{U_{om}^2}{4}\right)`, why: "两管对称，各分一半" },
              { tex: r`\frac{\mathrm dP_{T1}}{\mathrm dU_{om}}=0\ \Rightarrow\ U_{om}=\frac{2V_{CC}}{\pi}\approx0.64V_{CC}`, why: "二次函数求极值" },
              { tex: r`P_{T1\max}=\frac{V_{CC}^2}{\pi^2R_L}\approx0.2P_{om}`, why: "代回（$P_{om}$ 取理想值 $V_{CC}^2/(2R_L)$）", numeric: r`=${tq(t.PT1max, "W")}` },
            ]}
            conclusion="输出很小时电流小、管耗小；输出最大时管压降小、管耗也小；中间某处管耗最大。"
          />
          <Callout kind="key" title="选管三条件">
            <P>{r`$P_{CM}\ge0.2P_{om}$；$|U_{(BR)CEO}|\ge2V_{CC}$（一管导通饱和时，另一管承受约 $2V_{CC}$）；$I_{CM}\ge V_{CC}/R_L$。`}</P>
          </Callout>
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`每管最大管耗 ≈ $0.2P_{om}$，出现在 $U_{om}\approx0.64V_{CC}$。`]} />
          <div className="mt-3">
            <PracticeLink topic={U} label="去做本单元练习" />
          </div>
        </Stage>
      </Section>
    </LessonArticle>
  );
}

/* ════════════════════ 交越失真与 OTL ════════════════════ */
export function PACrossoverLesson() {
  const U = "pa-crossover";
  const o = otlMax(24, 8, 1);
  return (
    <LessonArticle unitId={U}>
      <LessonHeader unitId={U} path="乙类互补电路的死区 → 交越失真 → 用二极管（或 $U_{BE}$ 倍增电路）给两管加偏置 → 甲乙类 → 单电源 OTL 与输出电容。" />

      <Section unitId={U} id="px-cross" n={1} title="交越失真">
        <Question n={1}>交越失真是怎样产生的？</Question>
        <Stage kind="analysis" title="发射结的门槛">
          <P>{r`乙类 OCL 中两管静态时都截止。输入电压的绝对值小于发射结开启电压（硅管约 0.5 V）时，两只管子都不导通，输出为零。于是输出波形在过零点附近出现一段“死区”——**交越失真**（crossover distortion）。它与信号幅度无关，所以对小信号的影响尤其大，听起来是刺耳的“沙沙”声。`}</P>
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`交越失真发生在两管交替导通的过零点附近，原因是发射结死区。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="px-ab" n={2} title="甲乙类偏置消除交越失真">
        <Question n={2}>偏置二极管为什么能消除交越失真？</Question>
        <Stage kind="analysis" title="预先垫高">
          <OCLAB caption="甲乙类 OCL：$R_1$、$R_2$ 与两只二极管串联，二极管上约 1.4 V 的压降加在两管基极之间，使两管静态时都处于微导通状态。" />
          <P>{r`静态时 VD₁、VD₂ 的压降 $\approx2U_{on}$ 恰好使 VT₁、VT₂ 的发射结都处于临界导通，有很小的静态电流。信号一来，至少有一只管子处于导通状态，死区消失。二极管与晶体管发射结的温度特性相近，还能起温度补偿作用，防止静态电流随温度升高而增大。实用电路常用“$U_{BE}$ 倍增电路”代替二极管，以便精确调节偏置。`}</P>
        </Stage>
        <Stage kind="visual" title="偏置电压与失真">
          <CrossoverDemo />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`甲乙类：给两管加约 $2U_{on}$ 的偏置，牺牲一点效率换取消除交越失真。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="px-otl" n={3} title="OTL 单电源电路">
        <Question n={3}>OTL 电路中大电容起什么作用？</Question>
        <Stage kind="analysis" title="电容充当负电源">
          <OTL caption="OTL（output transformerless）：单电源供电，输出端经大电容 C 接负载。" />
          <P>{r`静态时两管中点 A 的电位为 $V_{CC}/2$，电容 C 被充电到 $V_{CC}/2$。正半周 VT₁ 导通，电源经 VT₁ 向负载供电并给 C 补充电荷；负半周 VT₂ 导通，C 经 VT₂ 向负载放电——C 相当于一个 $V_{CC}/2$ 的负电源。因此 OTL 的计算只需把 OCL 公式中的 $V_{CC}$ 换成 $V_{CC}/2$：`}</P>
          <Eq note={r`例：$V_{CC}=24$ V、$R_L=8\,\Omega$、$U_{CES}=1$ V：$P_{om}=${tq(o.Po, "W")}$。`}>{r`P_{om}=\frac{(V_{CC}/2-U_{CES})^2}{2R_L}`}</Eq>
          <Callout kind="warn">
            <P>{r`C 必须足够大，使其在信号最低频率下的容抗远小于 $R_L$（$f_L=1/(2\pi R_LC)$），否则低音衰减；同时要求 $RC$ 时间常数远大于信号周期，否则负半周 C 上电压下降、波形失真。`}</P>
          </Callout>
        </Stage>
        <Stage kind="visual" title="OTL 参数">
          <OTLDemo />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`OTL = 单电源 + 大电容，等效于 $\pm V_{CC}/2$ 的 OCL。`, r`集成功放（如 LM386、TDA2030）内部就是这些电路加上保护。`]} />
          <div className="mt-3">
            <PracticeLink topic={U} label="去做本单元练习" />
          </div>
        </Stage>
      </Section>
    </LessonArticle>
  );
}
