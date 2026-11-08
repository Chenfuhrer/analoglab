import { P, r } from "@/components/math/Tex";
import { Derivation } from "@/components/math/Derivation";
import { Callout } from "@/components/ui/primitives";
import { Bullets, Eq, PracticeLink, Question, Section, Stage, VarTable } from "@/components/lesson/blocks";
import { ComparatorDemo, FiniteGainError, IntDiffDemo, LinearDesigner, OpenLoopDemo, ProportionalLab, SumSubDemo, VirtualShortDemo } from "@/components/lesson/widgets/ch07/OpAmpWidgets";
import { Differentiator, Follower, Integrator, InvAmp, NonInvAmp, Schmitt, Subtractor, Summer } from "@/components/circuit/diagrams/ch07";
import { LessonArticle, LessonHeader } from "@/lessons/shared/LessonHeader";
import { designLinear, inverting, nonInverting, schmittThresholds, TYPICAL_OA } from "@/simulations/opamp/opamp";
import { par } from "@/simulations/units";
import { tq, tn } from "@/lib/tex";

/* ════════════════════ 理想运放 ════════════════════ */
export function OpAmpIdealLesson() {
  const U = "opamp-ideal";
  const th = schmittThresholds(10e3, 30e3, 6);
  return (
    <LessonArticle unitId={U}>
      <LessonHeader unitId={U} path="运放内部：差分输入级 + 中间级 + 输出级 → 开环增益极大、线性区极窄 → 线性应用必须加负反馈 → 虚短、虚断 → 开环或正反馈时工作在非线性区（比较器）。" />

      <Section unitId={U} id="oi-model" n={1} title="运放的模型与电压传输特性">
        <Question n={1}>运放的开环增益有多大？线性区有多窄？</Question>
        <Stage kind="concept" title="从内部结构到端口模型">
          <P>{r`集成运放是一个直接耦合的高增益多级放大器：输入级是差分放大电路（第 6 章，抑制温漂、提供两个输入端），中间级用有源负载提供大部分增益，输出级是互补跟随器（第 10 章，输出电阻小）。从外部看，它只有同相输入端 $u_+$、反相输入端 $u_-$ 和输出端 $u_O$：`}</P>
          <Eq label="7.1" note={r`线性区内成立；超出后输出饱和在 $\pm U_{OM}$（略低于电源电压）。`}>{r`u_O=A_{od}(u_+-u_-)`}</Eq>
          <VarTable
            rows={[
              [r`$A_{od}$`, "开环差模电压增益", r`$10^4\sim10^7$（80–140 dB）；理想运放 $\to\infty$`],
              [r`$r_{id}$`, "差模输入电阻", r`$10^5\,\Omega$（BJT 输入）～$10^{12}\,\Omega$（FET 输入）；理想 $\to\infty$`],
              [r`$r_o$`, "输出电阻", r`几十到几百欧；理想 $\to0$`],
              [r`$K_{CMR}$`, "共模抑制比", "80 dB 以上；理想 → ∞"],
            ]}
          />
        </Stage>
        <Stage kind="visual" title="开环传输特性">
          <OpenLoopDemo />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`开环增益极大，线性区只有 $\pm U_{OM}/A_{od}$（微伏级）。`, r`理想运放：$A_{od}\to\infty$、$r_{id}\to\infty$、$r_o\to0$。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="oi-virtual" n={2} title="虚短与虚断">
        <Question n={2}>虚短、虚断的成立条件是什么？</Question>
        <Stage kind="derivation" title="两个结论">
          <Derivation
            title="线性区 + 理想运放"
            steps={[
              { tex: r`u_+-u_-=\frac{u_O}{A_{od}}\ \xrightarrow{\ A_{od}\to\infty,\ |u_O|<U_{OM}\ }\ 0\ \Rightarrow\ u_+=u_-`, why: "输出是有限值，开环增益无穷大，差模输入只能趋于零——**虚短**（两端电位相等，但并未真正短路）" },
              { tex: r`i_+=i_-=\frac{u_+-u_-}{r_{id}}\to0`, why: "输入电阻无穷大——**虚断**（不取电流，但并未真正断开）" },
            ]}
            conclusion="虚短只在**线性区**成立（必须引入负反馈）；虚断在线性区、非线性区都成立（由输入电阻决定）。若一端接地，另一端就是“虚地”。"
          />
          <Callout kind="myth">
            <P>{r`“运放两个输入端短路”是错误的理解。如果真的把两端短接，$u_O$ 会因失调而饱和。虚短是负反馈把输出“拉”回来的结果：输出稍大，反馈就使 $u_-$ 升高、差模输入减小，最终稳定在 $u_+\approx u_-$。`}</P>
          </Callout>
        </Stage>
        <Stage kind="visual" title="有限 A_od 下的虚地">
          <VirtualShortDemo />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`虚短：$u_+=u_-$（线性区）；虚断：$i_+=i_-=0$（总成立）。`, r`分析运放线性电路的“万能钥匙”：虚短 + 虚断 + KCL。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="oi-comp" n={3} title="非线性应用：电压比较器">
        <Question n={3}>开环或正反馈时运放工作在哪个区？</Question>
        <Stage kind="concept" title="比较器">
          <P>{r`开环（或引入正反馈）时，输入只要偏离几十微伏输出就饱和：$u_+>u_-$ 时 $u_O=+U_{OM}$，$u_+<u_-$ 时 $u_O=-U_{OM}$。运放成为**电压比较器**，输出跳变时对应的输入电压叫**阈值电压** $U_T$。常在输出端接双向稳压管把输出限定为 $\pm U_Z$。`}</P>
          <Schmitt caption="反相输入滞回比较器（施密特触发器）：$R_2$ 把输出电压正反馈到同相端。" />
          <Derivation
            title="滞回比较器的两个阈值"
            steps={[
              { tex: r`u_+=\frac{R_1}{R_1+R_2}u_O`, why: "虚断：同相端由 $R_1$、$R_2$ 对输出分压（$U_{REF}=0$）" },
              { tex: r`U_{T\pm}=\pm\frac{R_1}{R_1+R_2}U_Z`, why: "$u_O=\\pm U_Z$；$u_I$ 升到 $U_{T+}$ 时输出由高变低，降到 $U_{T-}$ 时由低变高" },
            ]}
            conclusion={r`$R_1$=10 kΩ、$R_2$=30 kΩ、$U_Z$=6 V：$U_{T\pm}=\pm${tq(th.UTp, "V")}$，回差 $\Delta U_T=${tq(th.width, "V")}$。回差使比较器抗干扰。`}
          />
        </Stage>
        <Stage kind="visual" title="单限与滞回">
          <ComparatorDemo />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`比较器：运放工作在非线性区，虚短不成立。`, r`滞回比较器：正反馈产生两个阈值，抗干扰能力强。`]} />
          <div className="mt-3">
            <PracticeLink topic={U} label="去做本单元练习" />
          </div>
        </Stage>
      </Section>
    </LessonArticle>
  );
}

/* ════════════════════ 比例运算 ════════════════════ */
export function OpAmpProportionalLesson() {
  const U = "opamp-proportional";
  const inv = inverting(10e3, 100e3, TYPICAL_OA);
  const ni = nonInverting(10e3, 90e3, TYPICAL_OA);
  return (
    <LessonArticle unitId={U}>
      <LessonHeader unitId={U} path={r`反相比例：虚地 → $u_O=-\frac{R_f}{R_1}u_I$ → 同相比例：$u_O=(1+\frac{R_f}{R_1})u_I$、输入电阻极大 → 电压跟随器 → 开环增益有限时的误差。`} />

      <Section unitId={U} id="op-inv" n={1} title="反相比例运算电路">
        <Question n={1}>反相输入端为什么是“虚地”？</Question>
        <Stage kind="derivation" title="虚短 + 虚断 + KCL">
          <InvAmp caption={r`反相比例运算电路；$R'=R_1\para R_f$ 为平衡电阻（使两输入端对地电阻相等，减小偏置电流的影响，不影响理想运算关系）。`} />
          <Derivation
            title="u_O 与 u_I 的关系"
            steps={[
              { tex: r`u_+=0\ (\text{虚断，}R'\text{ 中无电流})\ \Rightarrow\ u_-=u_+=0`, why: "虚短：反相端电位为零，但并未接地——**虚地**" },
              { tex: r`i_1=\frac{u_I-0}{R_1},\quad i_f=\frac{0-u_O}{R_f}`, why: "欧姆定律" },
              { tex: r`i_1=i_f\ \Rightarrow\ u_O=-\frac{R_f}{R_1}u_I`, why: "虚断：反相端不取电流，KCL" },
            ]}
            conclusion={r`比例系数只由电阻比决定，与运放参数无关。输入电阻 $R_i=R_1$（虚地使从输入端看进去只有 $R_1$）；输出电阻 ≈ 0。共模输入电压为零，对运放的共模抑制比要求低。`}
          />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`$u_O=-\frac{R_f}{R_1}u_I$，$R_i=R_1$。`, r`$R_f=R_1$ 时为反相器（$u_O=-u_I$）。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="op-noninv" n={2} title="同相比例运算与电压跟随器">
        <Question n={2}>同相比例电路的输入电阻为什么很大？</Question>
        <Stage kind="derivation" title="推导">
          <NonInvAmp caption="同相比例运算电路：信号加在同相端，$R_1$、$R_f$ 构成反馈网络。" />
          <Derivation
            title="u_O 与 u_I 的关系"
            steps={[
              { tex: r`u_-=u_+=u_I`, why: "虚短（$R'$ 中无电流）" },
              { tex: r`u_-=\frac{R_1}{R_1+R_f}u_O`, why: "虚断：$R_1$、$R_f$ 对 $u_O$ 分压" },
              { tex: r`u_O=\left(1+\frac{R_f}{R_1}\right)u_I`, why: "联立" },
            ]}
            conclusion={r`同相比例电路的输入端就是运放的同相端，输入电阻极大（引入串联负反馈后可达 $10^{9}\,\Omega$ 以上，本例约 $${tq(ni.Ri, "Ω")}$）。缺点是两输入端都有共模电压 $u_I$，要求运放共模抑制比高。`}
          />
          <Follower caption={r`电压跟随器：$R_f=0$（或 $R_1=\infty$），$u_O=u_I$，输入电阻极大、输出电阻极小，是理想的缓冲器。`} />
        </Stage>
        <Stage kind="visual" title="三种比例电路">
          <ProportionalLab />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`$u_O=(1+\frac{R_f}{R_1})u_I$，比例系数 ≥ 1，同相。`, r`电压跟随器：$u_O=u_I$，用于隔离与缓冲。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="op-finite" n={3} title="有限开环增益引起的误差">
        <Question n={3}>开环增益有限时闭环增益的误差有多大？</Question>
        <Stage kind="derivation" title="不用虚短，精确推导">
          <Derivation
            title="反相比例（A_od 有限、r_id 无穷大）"
            steps={[
              { tex: r`u_O=-A_{od}u_-,\qquad \frac{u_I-u_-}{R_1}=\frac{u_--u_O}{R_f}`, why: "运放模型 + KCL（虚断仍成立）" },
              { tex: r`A_f=\frac{u_O}{u_I}=-\frac{R_f}{R_1}\cdot\frac{1}{1+\dfrac{1+R_f/R_1}{A_{od}}}`, why: "消去 $u_-$" },
            ]}
            conclusion={r`相对误差约为 $-(1+R_f/R_1)/A_{od}$。$R_f/R_1=10$、$A_{od}=10^5$ 时：$A_f=${tn(inv.actual, 6)}$，误差 $${tn(inv.error * 100, 3)}\%$——可以忽略。所以用虚短、虚断分析的结果非常准确。`}
          />
        </Stage>
        <Stage kind="visual" title="误差与 A_od 的关系">
          <FiniteGainError />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`误差 ≈ 闭环增益 / 开环增益。闭环增益设计得越大，越需要高 $A_{od}$ 的运放。`]} />
          <div className="mt-3">
            <PracticeLink topic={U} label="去做本单元练习" />
          </div>
        </Stage>
      </Section>
    </LessonArticle>
  );
}

/* ════════════════════ 加减运算 ════════════════════ */
export function OpAmpArithLesson() {
  const U = "opamp-arith";
  const d = designLinear([2], [3], 100e3);
  return (
    <LessonArticle unitId={U}>
      <LessonHeader unitId={U} path="反相求和（虚地使各路互不影响）→ 同相求和 → 差分比例（减法）与电阻匹配 → 用叠加原理设计任意线性组合。" />

      <Section unitId={U} id="oa-sum" n={1} title="求和运算电路">
        <Question n={1}>反相求和电路中各输入之间为什么互不影响？</Question>
        <Stage kind="derivation" title="反相求和">
          <Summer caption="反相求和电路：多路输入经各自电阻接到反相端（虚地）。" />
          <Derivation
            title="推导"
            steps={[
              { tex: r`u_-=0\ \Rightarrow\ i_k=\frac{u_{Ik}}{R_k}`, why: "虚地：每一路电流只由本路输入和电阻决定" },
              { tex: r`i_f=i_1+i_2+i_3=-\frac{u_O}{R_f}`, why: "虚断 + KCL" },
              { tex: r`u_O=-R_f\left(\frac{u_{I1}}{R_1}+\frac{u_{I2}}{R_2}+\frac{u_{I3}}{R_3}\right)`, why: "各路系数 $R_f/R_k$ 可独立调节" },
            ]}
          />
          <P>{r`同相求和电路把多路信号接到同相端，各路之间通过同相端节点相互影响（同相端不是虚地），系数需要整体计算，调整也不方便。工程上多用反相求和。`}</P>
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`反相求和：$u_O=-R_f\sum u_{Ik}/R_k$；虚地隔离了各路输入。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="oa-sub" n={2} title="减法运算电路">
        <Question n={2}>差分比例电路的电阻为什么要匹配？</Question>
        <Stage kind="derivation" title="叠加原理">
          <Subtractor caption="差分比例（减法）运算电路。" />
          <Derivation
            title="推导"
            steps={[
              { tex: r`u_{O}'=-\frac{R_f}{R_1}u_{I1}\quad(u_{I2}=0)`, why: "只有 $u_{I1}$ 作用：反相比例（同相端经 $R_2\\para R_3$ 接地，无电流）" },
              { tex: r`u_{O}''=\left(1+\frac{R_f}{R_1}\right)\frac{R_3}{R_2+R_3}u_{I2}\quad(u_{I1}=0)`, why: "只有 $u_{I2}$ 作用：同相比例，同相端电压为分压值" },
              { tex: r`R_f/R_1=R_3/R_2\ \Rightarrow\ u_O=u_O'+u_O''=\frac{R_f}{R_1}(u_{I2}-u_{I1})`, why: "叠加；电阻比匹配时" },
            ]}
            conclusion={r`电阻比不匹配时，共模输入也会产生输出（共模增益 ≠ 0），共模抑制比下降；1% 的电阻误差就可能使 $K_{CMR}$ 降到 40 dB 左右。`}
          />
        </Stage>
        <Stage kind="visual" title="求和与减法">
          <SumSubDemo />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`减法：$u_O=\frac{R_f}{R_1}(u_{I2}-u_{I1})$，要求 $R_f/R_1=R_3/R_2$。`, r`多个输入的线性电路一律用叠加原理分析。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="oa-design" n={3} title="设计任意线性组合">
        <Question n={3}>{r`怎样设计实现 $u_O=2u_{I1}-3u_{I2}$ 的电路？`}</Question>
        <Stage kind="derivation" title="单运放设计法">
          <Derivation
            title="以 u_O = 2u_I1 − 3u_I2 为例"
            steps={[
              { tex: r`R_f=100\,\mathrm{k\Omega},\quad R_{N}=\frac{R_f}{3}=${tq(d.Rneg[0], "Ω")}`, why: "负系数的输入接反相端：$R_f/R_N=3$" },
              { tex: r`N=1+\frac{R_f}{R_N}=4`, why: "同相端信号的放大倍数（噪声增益）" },
              { tex: r`R_P=R_N\para R_f=${tq(par(d.Rneg[0], 100e3), "Ω")}`, why: "平衡：同相端对地电阻等于反相端对地电阻" },
              { tex: r`a_1=N\frac{R_P}{R_{P1}}=2\ \Rightarrow\ R_{P1}=${tq(d.Rpos[0], "Ω")},\quad R_p=${tq(d.Rp, "Ω")}`, why: "同相端：$u_+=R_P\\sum u_i/R_{Pi}$；再由 $1/R_P=1/R_{P1}+1/R_p$ 求同相端对地电阻" },
            ]}
            conclusion="正系数接同相端、负系数接反相端，先定反相端，再用“平衡”条件定同相端。若正系数之和大于 N，还需在反相端加一个对地电阻提高 N。"
          />
        </Stage>
        <Stage kind="visual" title="自动设计器">
          <LinearDesigner />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`单运放可以实现任意（系数为实数的）线性组合；系数为负的走反相端。`, r`设计结果一定要代回验证。`]} />
          <div className="mt-3">
            <PracticeLink topic={U} label="去做本单元练习" />
          </div>
        </Stage>
      </Section>
    </LessonArticle>
  );
}

/* ════════════════════ 积分与微分 ════════════════════ */
export function OpAmpIntegratorLesson() {
  const U = "opamp-integrator";
  return (
    <LessonArticle unitId={U}>
      <LessonHeader unitId={U} path={r`电容 $i=C\,\mathrm du/\mathrm dt$ + 虚地 → 积分 $u_O=-\frac1{RC}\int u_I\,\mathrm dt$ → 微分 $u_O=-RC\frac{\mathrm du_I}{\mathrm dt}$ → 方波、三角波、正弦输入下的波形。`} />

      <Section unitId={U} id="ot-int" n={1} title="积分运算电路">
        <Question n={1}>积分电路的输出为什么是斜坡？</Question>
        <Stage kind="derivation" title="推导">
          <Integrator caption="积分运算电路：反馈元件为电容。" />
          <Derivation
            title="u_O 与 u_I 的关系"
            steps={[
              { tex: r`i_R=\frac{u_I}{R}`, why: "虚地" },
              { tex: r`i_C=-C\frac{\mathrm du_O}{\mathrm dt}`, why: "电容一端接虚地，电容电压 $u_C=0-u_O$" },
              { tex: r`u_O(t)=-\frac{1}{RC}\int_{t_0}^{t}u_I\,\mathrm dt+u_O(t_0)`, why: "虚断：$i_R=i_C$，两边积分" },
            ]}
            conclusion={r`输入为恒定电压 $U_I$ 时，输出以斜率 $-U_I/(RC)$ 线性变化（恒流给电容充电），直到运放饱和。正弦输入 $U_m\sin\omega t$ 时输出为 $\frac{U_m}{\omega RC}\cos\omega t$——相位超前 90°，幅值与频率成反比（低通特性）。`}
          />
          <Callout kind="warn">
            <P>{r`理想积分器对直流的增益无穷大：运放的失调电压、偏置电流也会被积分，使输出慢慢“漂”到饱和。实用电路在电容两端并联一个大电阻 $R_f$（把直流增益限制为 $-R_f/R$），代价是低频处积分不准。`}</P>
          </Callout>
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`$u_O=-\frac1{RC}\int u_I\,\mathrm dt$；$\tau=RC$ 越大，输出变化越慢。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="ot-diff" n={2} title="微分运算电路">
        <Question n={2}>微分电路为什么容易受高频噪声影响？</Question>
        <Stage kind="derivation" title="推导">
          <Differentiator caption="微分运算电路：把积分电路的 R 与 C 位置对调。" />
          <Eq label="7.2" note={r`推导：$i_C=C\,\mathrm du_I/\mathrm dt$（虚地），$u_O=-i_RR=-i_CR$。`}>{r`u_O=-RC\frac{\mathrm du_I}{\mathrm dt}`}</Eq>
          <P>{r`对正弦信号，微分电路的增益 $|A|=\omega RC$ 随频率正比增大：频率越高放大越多。信号中哪怕很小的高频噪声或干扰，都会在输出端被放大成很大的尖刺；而且电容对高频相当于短路，还容易引起自激振荡。实用电路在输入端串一个小电阻 $R_1$、在 $R$ 两端并一个小电容来限制高频增益。`}</P>
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`$u_O=-RC\,\mathrm du_I/\mathrm dt$；高通特性，对噪声敏感。`, r`积分电路比微分电路常用得多（波形产生、PID 控制、模数转换）。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="ot-wave" n={3} title="输入方波时的输出波形">
        <Question n={3}>积分电路输入方波时输出是什么形状？</Question>
        <Stage kind="example" title="例题 7-1">
          <P>{r`积分电路 $R=10$ kΩ、$C=0.1\,\mu$F（$\tau=1$ ms），输入频率 1 kHz、幅值 ±1 V 的方波。每半个周期（0.5 ms）内输入恒定，输出线性变化 $\Delta u_O=-\frac{1\,\mathrm V\times0.5\,\mathrm{ms}}{1\,\mathrm{ms}}=-0.5$ V；下半周期反向变化 +0.5 V。所以输出是峰峰值 1 V 的**三角波**（若初始值合适，关于零对称，峰值 ±0.25 V）。`}</P>
          <P>{r`同理：微分电路输入三角波时，每段斜率恒定，输出为**方波**，幅值 $RC\times$斜率；输入方波时，只在跳变沿产生尖脉冲。`}</P>
        </Stage>
        <Stage kind="visual" title="积分与微分的波形">
          <IntDiffDemo initial="int" />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`积分：方波 → 三角波；阶跃 → 斜坡；正弦 → 余弦。`, r`微分：三角波 → 方波；方波 → 尖脉冲。`, r`画波形时注意：输出不能超过 $\pm U_{OM}$。`]} />
          <div className="mt-3">
            <PracticeLink topic={U} label="去做本单元练习" />
          </div>
        </Stage>
      </Section>
    </LessonArticle>
  );
}

