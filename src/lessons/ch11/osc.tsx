import { P, r } from "@/components/math/Tex";
import { Derivation } from "@/components/math/Derivation";
import { Callout } from "@/components/ui/primitives";
import { Bullets, Eq, PracticeLink, Question, Section, Stage, VarTable } from "@/components/lesson/blocks";
import { CrystalDemo, FilterLab, LCTankDemo, ThreePointDemo, WienNetworkDemo, WienStartup } from "@/components/lesson/widgets/ch11/OscWidgets";
import { ActiveLP, OscBlock, WienBridge } from "@/components/circuit/diagrams/ch11";
import { LessonArticle, LessonHeader } from "@/lessons/shared/LessonHeader";
import { colpittsF0, filterQ, lcTankQ, wienF0 } from "@/simulations/osc/osc";
import { tq, tn } from "@/lib/tex";

/* ════════════════════ 振荡条件 ════════════════════ */
export function OscConditionLesson() {
  const U = "osc-condition";
  return (
    <LessonArticle unitId={U}>
      <LessonHeader unitId={U} path={r`没有输入也有输出 → 正反馈 → 平衡条件 $\dot A\dot F=1$（幅值 + 相位）→ 起振条件 $|\dot A\dot F|>1$ → 四个组成部分 → 起振与稳幅过程。`} />

      <Section unitId={U} id="oc-cond" n={1} title="平衡条件与起振条件">
        <Question n={1}>{r`$AF=1$ 与 $AF>1$ 分别对应什么？`}</Question>
        <Stage kind="derivation" title="自己维持自己">
          <OscBlock caption={r`正弦波振荡电路 = 放大电路 + 正反馈网络，没有外加输入（$\dot X_i=0$）。`} />
          <Derivation
            title="平衡条件"
            steps={[
              { tex: r`\dot X_i'=\dot X_f=\dot F\dot X_o,\qquad \dot X_o=\dot A\dot X_i'`, why: "没有外加输入，净输入全部来自反馈" },
              { tex: r`\dot A\dot F=1`, why: "要求信号绕环路一周后与原来完全相同" },
              { tex: r`|\dot A\dot F|=1\ (\text{幅值平衡}),\qquad \varphi_A+\varphi_F=2n\pi\ (\text{相位平衡})`, why: "复数等式拆成模和辐角" },
            ]}
            conclusion={r`相位条件决定**振荡频率**（只有某一个频率满足），幅值条件决定**振荡幅度**能否维持。起振时信号极小，必须 $|\dot A\dot F|>1$（**起振条件**），幅度才能从噪声中逐渐增长；增长到一定程度后由稳幅环节使 $|\dot A\dot F|$ 回到 1。`}
          />
          <Callout kind="warn">
            <P>{r`与第 8 章负反馈的自激条件 $\dot A\dot F=-1$ 对比：那里“负”号已包含在负反馈的定义中，本质相同——都是环路相移 360°、环路增益 ≥ 1。`}</P>
          </Callout>
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`起振：$|\dot A\dot F|>1$；平衡：$|\dot A\dot F|=1$；相位：$\varphi_A+\varphi_F=2n\pi$。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="oc-parts" n={2} title="振荡电路的组成">
        <Question n={2}>正弦波振荡器由哪几部分组成？</Question>
        <Stage kind="concept" title="四个环节">
          <VarTable
            rows={[
              ["放大电路", "提供能量和增益", "共射、共基电路或集成运放"],
              ["正反馈网络", "把输出送回输入，满足相位条件", "常与选频网络合二为一"],
              ["选频网络", "使只有一个频率满足振荡条件，输出才是正弦波", "RC 网络（低频）、LC 回路（高频）、石英晶体（高稳定）"],
              ["稳幅环节", "使幅度稳定在某一值", "利用放大器的非线性，或热敏电阻、二极管等"],
            ]}
          />
          <P>{r`判断一个电路能否产生正弦波振荡：①是否具备这四部分；②放大电路能否正常放大（Q 点合适）；③是否满足相位条件（瞬时极性法判断正反馈）；④是否满足起振条件。`}</P>
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`按选频网络分：RC 振荡器、LC 振荡器、石英晶体振荡器。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="oc-start" n={3} title="起振与稳幅过程">
        <Question n={3}>振荡幅度为什么不会无限增大？</Question>
        <Stage kind="analysis" title="从噪声中长出来">
          <P>{r`接通电源的瞬间，电路中存在各种频率的微弱扰动（噪声、电源冲击）。选频网络只让 $f_0$ 分量满足相位条件；若 $|\dot A\dot F|>1$，该分量每绕环路一圈就被放大一次，幅度指数增长。幅度大到一定程度后，放大器进入非线性区（或稳幅元件起作用），平均增益下降，直到 $|\dot A\dot F|=1$，幅度稳定下来。`}</P>
        </Stage>
        <Stage kind="visual" title="时域仿真">
          <WienStartup />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`起振靠 $|AF|>1$，稳幅靠非线性使 $|AF|$ 降回 1。`, r`稳幅不好（靠饱和削波）时，输出波形失真。`]} />
          <div className="mt-3">
            <PracticeLink topic={U} label="去做本单元练习" />
          </div>
        </Stage>
      </Section>
    </LessonArticle>
  );
}

/* ════════════════════ RC 桥式振荡器 ════════════════════ */
export function OscRCLesson() {
  const U = "osc-rc";
  const f0 = wienF0(10e3, 15.9e-9);
  return (
    <LessonArticle unitId={U}>
      <LessonHeader unitId={U} path={r`RC 串并联网络：$f_0$ 处 $F=1/3$、相移 0 → 同相放大器 $A\ge3$ → 文氏桥振荡器 → 用热敏电阻或二极管稳幅。`} />

      <Section unitId={U} id="or-wien" n={1} title="RC 串并联选频网络">
        <Question n={1}>{r`为什么在 $f_0$ 处 $F=1/3$ 且相移为零？`}</Question>
        <Stage kind="derivation" title="推导">
          <Derivation
            title="F(jf)"
            steps={[
              { tex: r`Z_1=R+\frac1{j\omega C},\qquad Z_2=R\para\frac1{j\omega C}=\frac{R}{1+j\omega RC}`, why: "串联支路与并联支路" },
              { tex: r`\dot F=\frac{Z_2}{Z_1+Z_2}=\frac{1}{3+j\left(\omega RC-\dfrac{1}{\omega RC}\right)}`, why: "分压，整理" },
              { tex: r`\omega_0RC=1\ \Rightarrow\ f_0=\frac{1}{2\pi RC},\quad \dot F(f_0)=\frac13`, why: "虚部为零时相移为 0，幅值最大" },
            ]}
            conclusion="低于 $f_0$ 时网络相位超前，高于 $f_0$ 时滞后；只有 $f_0$ 处相移为零。"
          />
        </Stage>
        <Stage kind="visual" title="选频特性">
          <WienNetworkDemo />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`$f_0=\dfrac{1}{2\pi RC}$，$F_{\max}=\dfrac13$，$\varphi_F(f_0)=0$。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="or-bridge" n={2} title="文氏桥振荡器">
        <Question n={2}>为什么放大电路的增益要略大于 3？</Question>
        <Stage kind="analysis" title="电路">
          <WienBridge caption="RC 桥式振荡电路：RC 串并联网络构成正反馈（选频），$R_f$、$R_1$ 构成负反馈（决定增益）；四个支路组成电桥，故称文氏桥。" />
          <P>{r`放大电路是同相比例放大器，$\varphi_A=0$；选频网络在 $f_0$ 处 $\varphi_F=0$，满足相位条件。幅值条件 $AF=1$ 要求 $A=3$，即 $1+R_f/R_1=3$、$R_f=2R_1$；为了起振取 $R_f$ 略大于 $2R_1$。例：$R=10$ kΩ、$C=15.9$ nF 时 $f_0\approx${tq(f0, "Hz")}$。`}</P>
          <Callout kind="note">
            <P>{r`RC 振荡器适用于低频（几赫兹到几百千赫兹）。频率太高时 R、C 值太小，运放的带宽、分布电容都会影响 $f_0$。改变频率只需同步调节两个 R（或两个 C）。`}</P>
          </Callout>
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`起振：$R_f>2R_1$；平衡：$R_f=2R_1$。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="or-amp" n={3} title="稳幅措施">
        <Question n={3}>热敏电阻或二极管怎样实现稳幅？</Question>
        <Stage kind="concept" title="让增益随幅度自动下降">
          <Bullets
            items={[
              r`**负温度系数热敏电阻作 $R_f$**：幅度增大 → 流过 $R_f$ 的电流增大 → 温度升高 → $R_f$ 减小 → A 下降，自动维持 $A=3$。（或用正温度系数热敏电阻作 $R_1$。）`,
              r`**二极管稳幅**：在 $R_f$ 的一部分上反向并联两只二极管。幅度小时二极管截止，A 略大于 3（起振）；幅度增大后二极管导通，等效 $R_f$ 减小，A 降到 3。`,
              r`不加稳幅环节时，幅度一直增大到运放饱和，靠削波限幅——输出不再是好的正弦波。`,
            ]}
          />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`稳幅的本质：用非线性元件实现“幅度大 → 增益小”的负反馈。`]} />
          <div className="mt-3">
            <PracticeLink topic={U} label="去做本单元练习" />
          </div>
        </Stage>
      </Section>
    </LessonArticle>
  );
}

/* ════════════════════ LC 振荡器 ════════════════════ */
export function OscLCLesson() {
  const U = "osc-lc";
  const q = lcTankQ(100e-6, 1e-9, 10);
  const fc = colpittsF0(10e-6, 1e-9, 1e-9);
  return (
    <LessonArticle unitId={U}>
      <LessonHeader unitId={U} path="LC 并联回路：谐振时阻抗最大、纯阻 → 变压器反馈式 → 三点式（射同基反）→ 电容三点式与电感三点式 → 石英晶体：极高 Q、极稳定。" />

      <Section unitId={U} id="ol-tank" n={1} title="LC 并联谐振回路">
        <Question n={1}>谐振时回路阻抗为什么最大？</Question>
        <Stage kind="concept" title="谐振">
          <Eq label="11.1" note={r`$r$ 为电感的损耗电阻，$Q=\omega_0L/r$ 为品质因数（几十到几百）。`}>{r`f_0=\frac{1}{2\pi\sqrt{LC}},\qquad Z_0\approx\frac{L}{rC}=Q^2r`}</Eq>
          <P>{r`谐振时电感支路与电容支路的电流大小相等、方向相反（相差 180°），在回路内部来回“环流”，外部电流只需补充电阻损耗，所以从外部看阻抗最大且为纯电阻。例：L=100 µH、C=1 nF、r=10 Ω：$f_0=${tq(q.f0, "Hz")}$，$Q=${tn(q.Q)}$。LC 回路作共射放大器的集电极负载时，只有 $f_0$ 附近的信号能得到大的增益——这就是选频放大器。`}</P>
        </Stage>
        <Stage kind="visual" title="谐振曲线">
          <LCTankDemo />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`$f_0=1/(2\pi\sqrt{LC})$；Q 越高选频越好。`, r`LC 振荡器用于高频（几十千赫兹以上）。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="ol-three" n={2} title="三点式振荡电路">
        <Question n={2}>“射同基反”是什么意思？</Question>
        <Stage kind="concept" title="三个电抗接晶体管三个电极">
          <P>{r`LC 回路的三个端点分别接晶体管的 e、b、c（交流通路中），称为三点式振荡电路。相位条件可归纳为：**与发射极相连的两个电抗性质相同，另一个（接在 b、c 之间）性质相反**——“射同基反”。`}</P>
          <VarTable
            rows={[
              ["电容三点式（考毕兹）", r`$X_{be}$、$X_{ce}$ 为电容 $C_1$、$C_2$，$X_{bc}$ 为电感 L`, r`$f_0=\dfrac{1}{2\pi\sqrt{L\frac{C_1C_2}{C_1+C_2}}}$；波形好（电容对谐波阻抗小），频率高`],
              ["电感三点式（哈特莱）", r`$X_{be}$、$X_{ce}$ 为电感 $L_1$、$L_2$，$X_{bc}$ 为电容 C`, r`$f_0=\dfrac{1}{2\pi\sqrt{(L_1+L_2+2M)C}}$；易起振、调频方便，但谐波多`],
            ]}
          />
          <P>{r`例：L=10 µH、$C_1=C_2=1$ nF 的电容三点式，$f_0=${tq(fc, "Hz")}$。`}</P>
        </Stage>
        <Stage kind="visual" title="判断相位条件">
          <ThreePointDemo />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`判断步骤：画交流通路 → 找出 e、b、c 间的电抗 → 射同基反。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="ol-crystal" n={3} title="石英晶体振荡器">
        <Question n={3}>石英晶体为什么频率稳定度很高？</Question>
        <Stage kind="concept" title="压电效应与等效电路">
          <P>{r`石英晶片在电场作用下产生机械形变，形变又产生电场（压电效应）；外加交流电压的频率等于晶片的固有机械频率时发生压电谐振。其等效电路是 $L_q$、$C_q$、$r_q$ 串联后与 $C_0$ 并联：$L_q$ 很大、$C_q$ 很小、$r_q$ 很小，Q 值高达 $10^4$～$10^6$，且固有频率几乎不随温度变化。`}</P>
          <Bullets
            items={[
              r`串联谐振 $f_s=\dfrac{1}{2\pi\sqrt{L_qC_q}}$：阻抗最小（纯阻）——**串联型**晶体振荡器让晶体工作在 $f_s$。`,
              r`并联谐振 $f_p=f_s\sqrt{1+C_q/C_0}$：$f_s<f<f_p$ 的窄区间内晶体呈感性——**并联型**晶体振荡器把晶体当作电感用在三点式电路中。`,
            ]}
          />
        </Stage>
        <Stage kind="visual" title="电抗特性">
          <CrystalDemo />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`晶体振荡器频率稳定度可达 $10^{-6}$～$10^{-10}$，用于时钟、通信。`]} />
          <div className="mt-3">
            <PracticeLink topic={U} label="去做本单元练习" />
          </div>
        </Stage>
      </Section>
    </LessonArticle>
  );
}

/* ════════════════════ 有源滤波器 ════════════════════ */
export function ActiveFilterLesson() {
  const U = "active-filter";
  return (
    <LessonArticle unitId={U}>
      <LessonHeader unitId={U} path="按通带分：低通、高通、带通、带阻 → 无源 RC 滤波器带负载能力差 → 一阶有源滤波器 → 二阶压控电压源滤波器、品质因数 Q。" />

      <Section unitId={U} id="af-types" n={1} title="滤波器的分类与主要指标">
        <Question n={1}>低通、高通、带通、带阻怎样区分？</Question>
        <Stage kind="concept" title="分类与指标">
          <VarTable
            rows={[
              ["低通（LPF）", r`$0\sim f_p$ 通过`, "整流滤波、去除高频噪声"],
              ["高通（HPF）", r`$f>f_p$ 通过`, "隔直、去除低频漂移"],
              ["带通（BPF）", r`$f_{p1}\sim f_{p2}$ 通过`, "选出某一频段"],
              ["带阻（BEF）", r`$f_{p1}\sim f_{p2}$ 被抑制`, "去除 50 Hz 工频干扰"],
            ]}
          />
          <P>{r`主要指标：通带增益 $A_{up}$、通带截止频率 $f_p$（−3 dB）、阻带衰减斜率（一阶 20 dB/十倍频，二阶 40 dB/十倍频）、品质因数 Q。无源 RC 滤波器接负载后特性会改变；加入运放构成**有源滤波器**，可提供增益、隔离负载（输入电阻大、输出电阻小）。`}</P>
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`有源滤波器 = RC 网络 + 运放（工作在线性区）。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="af-first" n={2} title="一阶有源滤波器">
        <Question n={2}>一阶有源低通的传递函数是什么？</Question>
        <Stage kind="derivation" title="RC + 同相放大">
          <ActiveLP labels={{ order: "1" }} caption="一阶有源低通：RC 低通网络后接同相比例放大器。" />
          <Derivation
            title="传递函数"
            steps={[
              { tex: r`\dot U_+=\frac{1}{1+j\omega RC}\dot U_i`, why: "RC 分压（运放输入端虚断，不影响网络）" },
              { tex: r`\dot A_u=\frac{\dot U_o}{\dot U_i}=\frac{A_{up}}{1+j\dfrac{f}{f_0}},\quad A_{up}=1+\frac{R_f}{R_1},\ f_0=\frac{1}{2\pi RC}`, why: "同相比例" },
            ]}
            conclusion={r`截止频率 $f_p=f_0$；阻带只有 −20 dB/十倍频，过渡带较宽。把 R、C 位置对调就得到一阶高通。`}
          />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`一阶：$\dot A_u=\dfrac{A_{up}}{1+jf/f_0}$。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="af-second" n={3} title="二阶有源低通滤波器">
        <Question n={3}>品质因数 Q 怎样影响频率特性？</Question>
        <Stage kind="derivation" title="压控电压源（Sallen–Key）">
          <ActiveLP labels={{ order: "2" }} caption="二阶压控电压源低通：两节 RC，第一个电容接到输出端引入正反馈，提升 $f_0$ 附近的增益。" />
          <Eq label="11.2" note={r`等值 R、C 时。$A_{up}<3$ 才能稳定工作。`}>{r`\dot A_u=\frac{A_{up}}{1-\left(\dfrac{f}{f_0}\right)^2+j\dfrac{1}{Q}\dfrac{f}{f_0}},\qquad Q=\frac{1}{3-A_{up}},\qquad f_0=\frac{1}{2\pi RC}`}</Eq>
          <P>{r`$f=f_0$ 时 $|\dot A_u|=QA_{up}$。$Q=0.707$（$A_{up}=1.586$）时通带最平坦，截止频率恰为 $f_0$——巴特沃斯（Butterworth）特性；Q 更大时 $f_0$ 附近出现峰；$A_{up}\to3$ 时 $Q\to\infty$，电路自激。本例 $A_{up}=2$ 时 $Q=${tn(filterQ(2))}$。`}</P>
        </Stage>
        <Stage kind="visual" title="滤波器实验">
          <FilterLab />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`二阶：阻带 −40 dB/十倍频；$Q=1/(3-A_{up})$。`, r`高通：R、C 对调；带通 = 低通与高通串联（截止频率交叠）；带阻 = 二者并联相加。`]} />
          <div className="mt-3">
            <PracticeLink topic={U} label="去做本单元练习" />
          </div>
        </Stage>
      </Section>
    </LessonArticle>
  );
}
