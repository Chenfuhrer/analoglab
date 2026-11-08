import { P, r } from "@/components/math/Tex";
import { Derivation } from "@/components/math/Derivation";
import { Callout } from "@/components/ui/primitives";
import { Bullets, Eq, PracticeLink, Question, Section, Stage, VarTable } from "@/components/lesson/blocks";
import { CapFilterLab, RectifierLab, SeriesRegLab, ZenerRegIndex } from "@/components/lesson/widgets/ch12/SupplyWidgets";
import { ZenerDemo } from "@/components/lesson/widgets/ch01/DiodeWidgets";
import { Bridge, HalfWave, ZenerReg } from "@/components/circuit/diagrams/ch01";
import { CapFilter, SeriesReg, SupplyBlock } from "@/components/circuit/diagrams/ch12";
import { LessonArticle, LessonHeader } from "@/lessons/shared/LessonHeader";
import { rectifiedAverage, rectifierStress, simulateCapFilter } from "@/simulations/diode/waveforms";
import { limitResistorRange } from "@/simulations/diode/zener";
import { adjustable317, capFilterEstimate, DEFAULT_SR, outputRange } from "@/simulations/power/regulator";
import { tq, tn } from "@/lib/tex";

/* ════════════════════ 整流电路 ════════════════════ */
export function RectifierLesson() {
  const U = "rectifier";
  const s = rectifierStress(20, 50, "bridge");
  return (
    <LessonArticle unitId={U}>
      <LessonHeader unitId={U} path="直流电源四部分 → 半波整流 $0.45U_2$ → 桥式整流 $0.9U_2$ → 二极管电流与反向电压 → 选管。" />

      <Section unitId={U} id="rf-half" n={1} title="单相半波整流">
        <Question n={1}>{r`半波整流的输出平均值为什么是 $0.45U_2$？`}</Question>
        <Stage kind="concept" title="直流电源的组成">
          <SupplyBlock caption="小功率直流稳压电源：变压 → 整流 → 滤波 → 稳压。" />
        </Stage>
        <Stage kind="derivation" title="半波整流">
          <HalfWave caption={r`半波整流：$u_2=\sqrt2U_2\sin\omega t$。`} />
          <Derivation
            title="输出平均值与二极管参数"
            steps={[
              { tex: r`U_{O(AV)}=\frac{1}{2\pi}\int_0^\pi\sqrt2U_2\sin\omega t\,\mathrm d(\omega t)=\frac{\sqrt2}{\pi}U_2\approx0.45U_2`, why: "只有正半周有输出" },
              { tex: r`I_{D(AV)}=I_{O(AV)}=\frac{0.45U_2}{R_L},\qquad U_{RM}=\sqrt2U_2`, why: "二极管与负载串联；截止时承受 $u_2$ 的负峰值" },
            ]}
            conclusion="半波整流结构最简单，但输出脉动大、变压器利用率低，只用于小电流场合。"
          />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`半波：$U_{O(AV)}\approx0.45U_2$，$I_D=I_O$，$U_{RM}=\sqrt2U_2$。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="rf-bridge" n={2} title="单相桥式整流">
        <Question n={2}>桥式整流中每只二极管导通多长时间？</Question>
        <Stage kind="analysis" title="四只二极管轮流导通">
          <Bridge caption="正半周 VD₁、VD₃ 导通；负半周 VD₂、VD₄ 导通。两个半周电流都从上到下流过 $R_L$。" />
          <Eq label="12.1" note="理想二极管、电阻负载。">{r`U_{O(AV)}=\frac{2\sqrt2}{\pi}U_2\approx0.9U_2,\qquad I_{D(AV)}=\frac12I_{O(AV)},\qquad U_{RM}=\sqrt2U_2`}</Eq>
          <P>{r`每只二极管只导通半个周期，平均电流是负载电流的一半；截止的两只二极管通过导通的两只并联在 $u_2$ 两端，承受的最大反向电压为 $\sqrt2U_2$。`}</P>
        </Stage>
        <Stage kind="visual" title="整流电路实验">
          <RectifierLab />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`桥式：$0.9U_2$，变压器利用率高、脉动比半波小，最常用（有成品“整流桥”）。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="rf-select" n={3} title="整流二极管的选择">
        <Question n={3}>二极管的最大反向电压是多少？</Question>
        <Stage kind="example" title="例题 12-1">
          <P>{r`桥式整流，$U_2=20$ V，$R_L=50\,\Omega$。$U_{O(AV)}=${tq(rectifiedAverage(20, "bridge"), "V")}$，$I_{O(AV)}=${tq(rectifiedAverage(20, "bridge") / 50, "A")}$；每只二极管 $I_D=${tq(s.ID, "A")}$，$U_{RM}=${tq(s.URM, "V")}$。选管时留出余量：最大整流电流 $I_F>1.1I_D$，最高反向工作电压 $U_R>1.1U_{RM}$（电网电压可能升高 10%）。`}</P>
          <Callout kind="warn">
            <P>{r`接入滤波电容后二极管的导通时间变短、峰值电流变大，选管时还要考虑浪涌电流（下一单元）。`}</P>
          </Callout>
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`选管：$I_F\ge1.1I_{D(AV)}$，$U_R\ge1.1U_{RM}$。`]} />
          <div className="mt-3">
            <PracticeLink topic={U} label="去做本单元练习" />
          </div>
        </Stage>
      </Section>
    </LessonArticle>
  );
}

/* ════════════════════ 滤波电路 ════════════════════ */
export function RippleFilterLesson() {
  const U = "ripple-filter";
  const sim = simulateCapFilter({ U2rms: 15, C: 1000e-6, RL: 100, Uon: 0.7, Rs: 1, periods: 10, steps: 400 });
  const est = capFilterEstimate(15, 100, 1000e-6);
  return (
    <LessonArticle unitId={U}>
      <LessonHeader unitId={U} path={r`脉动直流 → 电容在峰值附近充电、其余时间放电 → $U_{O(AV)}\approx1.2U_2$（条件 $R_LC\ge(3\sim5)T/2$）→ 纹波估算 → 二极管冲击电流 → 电感滤波与 π 型滤波。`} />

      <Section unitId={U} id="cf-cap" n={1} title="电容滤波的工作原理">
        <Question n={1}>电容为什么能“填平”脉动？</Question>
        <Stage kind="analysis" title="充电快、放电慢">
          <CapFilter caption="桥式整流电容滤波：电容 C 与负载并联。" />
          <P>{r`$u_2$ 上升并高于电容电压时，二极管导通，电容经很小的内阻快速充电到接近峰值；$u_2$ 下降后二极管截止，电容只能经 $R_L$ 缓慢放电，直到下一个半周 $u_2$ 再次超过电容电压。只要放电时间常数 $R_LC$ 远大于半个周期，输出电压就保持在峰值附近，只有小小的锯齿形纹波。`}</P>
        </Stage>
        <Stage kind="visual" title="时域仿真">
          <CapFilterLab />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`电容滤波：输出平均值提高、纹波减小；二极管导通角变小。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="cf-estimate" n={2} title="输出电压与纹波的估算">
        <Question n={2}>{r`$U_{O(AV)}\approx1.2U_2$ 的条件是什么？`}</Question>
        <Stage kind="concept" title="工程估算">
          <VarTable
            rows={[
              ["空载（$R_L=\\infty$）", r`$U_O=\sqrt2U_2\approx1.4U_2$`, "电容不放电"],
              [r`$R_LC\ge(3\sim5)\dfrac T2$`, r`$U_{O(AV)}\approx1.2U_2$（桥式）`, "常用设计条件"],
              ["不接电容", r`$U_{O(AV)}=0.9U_2$`, "纯电阻负载"],
              ["纹波峰峰值（桥式）", r`$\Delta U\approx\dfrac{I_O}{2fC}$`, "电容在半周期内以 $I_O$ 放电"],
            ]}
          />
          <P>{r`对照仿真（$U_2=15$ V、$C=1000\,\mu$F、$R_L=100\,\Omega$）：估算 $U_{O(AV)}\approx${tq(est.UO, "V")}$、纹波 $\approx${tq(est.ripple, "V")}$；时域仿真（含两只二极管 1.4 V 压降）得 $${tq(sim.UOavg, "V")}$、$${tq(sim.ripplePP, "V")}$。估算公式粗略但足以指导选型。`}</P>
          <Callout kind="warn" title="冲击电流">
            <P>{r`二极管只在峰值附近很短的时间内导通，却要补充电容在整个周期内放出的电荷，所以峰值电流往往是平均电流的好几倍；开机瞬间电容上无电压，冲击更大。整流管要按峰值和浪涌电流选择，必要时串限流电阻。`}</P>
          </Callout>
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`$R_LC\ge(3\sim5)T/2$ → $U_O\approx1.2U_2$；C 越大纹波越小、冲击电流越大。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="cf-other" n={3} title="电感滤波与复式滤波">
        <Question n={3}>大电流负载为什么用电感滤波？</Question>
        <Stage kind="concept" title="对比">
          <VarTable
            rows={[
              ["电容滤波", "输出电压高（≈1.2U₂），纹波随负载电流增大而增大", "小电流负载"],
              ["电感滤波", "电感串在负载回路中，阻碍电流变化；输出 ≈0.9U₂，负载越大滤波效果越好，二极管导通角大、无冲击", "大电流负载"],
              ["LC、π 型（CLC、CRC）", "多级滤波，纹波更小", "要求较高的场合"],
            ]}
          />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`电容滤波适合小电流；电感滤波适合大电流；复式滤波效果最好。`]} />
          <div className="mt-3">
            <PracticeLink topic={U} label="去做本单元练习" />
          </div>
        </Stage>
      </Section>
    </LessonArticle>
  );
}

/* ════════════════════ 稳压管稳压电路 ════════════════════ */
export function ZenerRegulatorLesson() {
  const U = "zener-regulator";
  const rg = limitResistorRange(13.5, 16.5, 0, 20e-3, { UZ: 9, IZmin: 5e-3, IZM: 50e-3 });
  return (
    <LessonArticle unitId={U}>
      <LessonHeader unitId={U} path="滤波后的电压仍随电网和负载变化 → 稳压管 + 限流电阻 → 稳压过程 → 限流电阻的取值范围 → 稳压系数 $S_r$ 与输出电阻 $R_o$。" />

      <Section unitId={U} id="zr-circuit" n={1} title="电路与稳压过程">
        <Question n={1}>电网电压或负载变化时输出为什么基本不变？</Question>
        <Stage kind="analysis" title="两种扰动">
          <ZenerReg caption="稳压管稳压电路：$U_I$ 为整流滤波后的电压。" />
          <Bullets
            items={[
              r`**电网电压升高**：$U_I\uparrow\to U_O\uparrow\to I_Z\uparrow\uparrow\to I_R\uparrow\to U_R\uparrow\to U_O$ 基本不变。`,
              r`**负载电流增大**：$I_L\uparrow\to I_R\uparrow\to U_R\uparrow\to U_O\downarrow\to I_Z\downarrow\downarrow\to I_R$ 回落 $\to U_O$ 基本不变。即稳压管电流的减少补偿了负载电流的增加。`,
            ]}
          />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`稳压管调节自身电流，限流电阻吸收电压变化，二者缺一不可。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="zr-design" n={2} title="限流电阻的取值范围">
        <Question n={2}>{r`$R$ 的上限和下限由什么决定？`}</Question>
        <Stage kind="derivation" title="两个极端">
          <Eq label="12.2" note="与第 1 章“稳压二极管”单元相同，这里结合电网波动（常取 ±10%）。">{r`\frac{U_{I\max}-U_Z}{I_{ZM}+I_{L\min}}\le R\le\frac{U_{I\min}-U_Z}{I_{Z\min}+I_{L\max}}`}</Eq>
          <P>{r`例：$U_I=15$ V（±10%），$U_Z=9$ V，$I_{Z\min}=5$ mA，$I_{ZM}=50$ mA，负载电流 0～20 mA：$${tq(rg.Rmin, "Ω")}\le R\le${tq(rg.Rmax, "Ω")}$。`}</P>
        </Stage>
        <Stage kind="visual" title="调参数">
          <ZenerDemo />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`$R$ 下限防烧管（输入最高、负载最轻），上限保稳压（输入最低、负载最重）。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="zr-index" n={3} title="稳压系数与输出电阻">
        <Question n={3}>怎样衡量稳压效果？</Question>
        <Stage kind="concept" title="两个指标">
          <VarTable
            rows={[
              [r`稳压系数 $S_r$`, r`$S_r=\left.\dfrac{\Delta U_O/U_O}{\Delta U_I/U_I}\right|_{R_L}\approx\dfrac{r_z\para R_L}{R+r_z\para R_L}\cdot\dfrac{U_I}{U_O}$`, "衡量对电网波动的抑制，越小越好"],
              [r`输出电阻 $R_o$`, r`$R_o=\left.\dfrac{\Delta U_O}{\Delta I_O}\right|_{U_I}\approx r_z\para R\approx r_z$`, "衡量带负载能力，越小越好"],
            ]}
          />
          <P>{r`稳压管稳压电路的 $R_o$ 等于稳压管的动态电阻（几欧到几十欧），输出电流也受 $I_{ZM}$ 限制，只适用于小电流、要求不高的场合。要提高性能，就要用放大器“放大”稳压管的作用——串联型稳压电路。`}</P>
        </Stage>
        <Stage kind="visual" title="稳压特性">
          <ZenerRegIndex />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`$S_r$、$R_o$ 都与 $r_z$ 成正比：$r_z$ 越小越好。`]} />
          <div className="mt-3">
            <PracticeLink topic={U} label="去做本单元练习" />
          </div>
        </Stage>
      </Section>
    </LessonArticle>
  );
}

/* ════════════════════ 串联型稳压电路 ════════════════════ */
export function SeriesRegulatorLesson() {
  const U = "series-regulator";
  const rg = outputRange(DEFAULT_SR);
  return (
    <LessonArticle unitId={U}>
      <LessonHeader unitId={U} path="调整管 + 基准电压 + 比较放大 + 采样电路 → 电压串联负反馈 → $U_O=U_Z/F$ → 输出电压调节范围 → 调整管的管耗与选择 → 三端集成稳压器。" />

      <Section unitId={U} id="sr-structure" n={1} title="串联型稳压电路的组成">
        <Question n={1}>为什么说它是一个电压串联负反馈系统？</Question>
        <Stage kind="analysis" title="四个部分">
          <SeriesReg caption="串联型稳压电路：调整管 VT 串联在输入与输出之间（故称“串联型”）。" />
          <VarTable
            rows={[
              ["基准电压", "稳压管 $U_Z$（经 R 供电）", "提供稳定的参考"],
              ["采样电路", "$R_1$、$R_P$、$R_2$ 分压，取出 $FU_O$", "反馈网络"],
              ["比较放大", "运放（或晶体管）放大 $U_Z-FU_O$", "基本放大电路"],
              ["调整管", "射极跟随器，管压降随控制信号变化", "执行环节，输出大电流"],
            ]}
          />
          <P>{r`采样取自输出电压（电压反馈），反馈电压与基准在放大器两个输入端比较（串联反馈），所以这是**电压串联负反馈**：输出电压被稳定。深度负反馈时 $U_O\approx U_Z/F$——放大器的“虚短”使采样电压等于基准电压。`}</P>
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`$U_I$ 或 $R_L$ 变化 → $U_O$ 变化 → 采样 → 比较放大 → 调整管 $U_{CE}$ 反向变化 → $U_O$ 稳定。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="sr-range" n={2} title="输出电压的调节范围">
        <Question n={2}>采样电阻怎样决定输出电压？</Question>
        <Stage kind="derivation" title="虚短">
          <Derivation
            title="U_O 的范围"
            steps={[
              { tex: r`U_Z=U_-=\frac{R_2+R_P''}{R_1+R_P+R_2}U_O`, why: "深度负反馈（虚短）；$R_P''$ 为电位器滑动端以下的部分" },
              { tex: r`U_O=\frac{R_1+R_P+R_2}{R_2+R_P''}U_Z`, why: "整理" },
              { tex: r`U_{O\min}=\frac{R_1+R_P+R_2}{R_2+R_P}U_Z,\qquad U_{O\max}=\frac{R_1+R_P+R_2}{R_2}U_Z`, why: "滑动端在最上端（$R_P''=R_P$）、最下端（$R_P''=0$）" },
            ]}
            conclusion={r`$U_Z=6$ V、$R_1=R_P=R_2=1$ kΩ 时，输出可在 $${tq(rg.min, "V")}$～$${tq(rg.max, "V")}$ 之间调节。注意 $U_O$ 不可能低于 $U_Z$。`}
          />
        </Stage>
        <Stage kind="visual" title="串联稳压电路实验">
          <SeriesRegLab />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`$U_O=\dfrac{R_1+R_P+R_2}{R_2+R_P''}U_Z$。`, r`输入至少要比输出高出调整管的饱和压降（再加放大器所需余量）。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="sr-ic" n={3} title="调整管的选择与三端集成稳压器">
        <Question n={3}>调整管为什么必须工作在放大区？</Question>
        <Stage kind="concept" title="调整管">
          <Bullets
            items={[
              r`调整管靠改变自身管压降 $U_{CE}=U_I-U_O$ 来稳压，必须工作在放大区；$U_I$ 太低时调整管饱和，失去调节能力。`,
              r`调整管承担全部负载电流，管耗 $P_C=(U_I-U_O)I_O$，在 $U_I$ 最高、$U_O$ 最低、负载最重时最大。选管：$I_{CM}>I_{L\max}$，$U_{(BR)CEO}>U_{I\max}-U_{O\min}$（考虑输出短路时为 $U_{I\max}$），$P_{CM}>(U_{I\max}-U_{O\min})I_{L\max}$。`,
              r`线性稳压电源效率不高（$\eta\approx U_O/U_I$），大功率场合改用开关稳压电源。`,
            ]}
          />
        </Stage>
        <Stage kind="concept" title="三端集成稳压器">
          <P>{r`把基准、比较放大、调整管、采样和过流/过热保护集成在一块芯片上，只有输入、输出、公共端（或调整端）三个引脚：78xx（固定正电压，如 7805 输出 +5 V）、79xx（固定负电压）、LM317（可调）。LM317 输出与调整端之间维持 1.25 V 基准：`}</P>
          <Eq note={r`$I_{ADJ}$ 约 50 µA，一般可忽略。例：$R_1=240\,\Omega$、$R_2=720\,\Omega$ 时 $U_O\approx${tq(adjustable317(240, 720), "V")}$（忽略 $I_{ADJ}$ 为 ${tn(adjustable317(240, 720, 1.25, 0))} V）。`}>{r`U_O=1.25\,\mathrm V\left(1+\frac{R_2}{R_1}\right)+I_{ADJ}R_2`}</Eq>
          <Callout kind="note">
            <P>{r`三端稳压器同样要求输入比输出高约 2～3 V（压差），输入、输出端通常各接一个电容防止自激、改善瞬态响应。`}</P>
          </Callout>
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`串联型稳压 = 负反馈的典型应用；集成化后即三端稳压器。`, r`至此，从 PN 结到直流电源，模拟电子技术的主线全部完成。`]} />
          <div className="mt-3">
            <PracticeLink topic={U} label="去做本单元练习" />
          </div>
        </Stage>
      </Section>
    </LessonArticle>
  );
}
