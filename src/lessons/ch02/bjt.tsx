import { P, r } from "@/components/math/Tex";
import { Derivation } from "@/components/math/Derivation";
import { Callout } from "@/components/ui/primitives";
import { Bullets, Eq, PracticeLink, Question, Section, Stage, VarTable } from "@/components/lesson/blocks";
import { CurrentFlow, InputFamily, OutputRegions, PinJudge, RegionByPotential, SOAWidget, TempCurves } from "@/components/lesson/widgets/ch02/BJTWidgets";
import { BJTConfigs, BJTSymbols, BJTTest } from "@/components/circuit/diagrams/ch02";
import { LessonArticle, LessonHeader } from "@/lessons/shared/LessonHeader";
import { atTemperature, currentsFromIB, judgeActivePins } from "@/simulations/bjt/device";
import { tq, tn } from "@/lib/tex";

/* ════════════════════ 结构与放大条件 ════════════════════ */
export function BJTStructureLesson() {
  const U = "bjt-structure";
  return (
    <LessonArticle unitId={U}>
      <LessonHeader unitId={U} path="三层两结的结构 → NPN/PNP 符号 → 放大的内部条件（制造）与外部条件（偏置）→ 三种组态。" />

      <Section unitId={U} id="bs-struct" n={1} title="结构与符号">
        <Question n={1}>NPN 与 PNP 管在结构和符号上有什么区别？</Question>
        <Stage kind="concept" title="三个区、两个结、三个电极">
          <P>{r`双极型晶体管（bipolar junction transistor，BJT，也称三极管）由三层杂质半导体构成：**发射区**（emitter）、**基区**（base）、**集电区**（collector），相应引出发射极 e、基极 b、集电极 c。两层交界处形成两个 PN 结：发射结（b–e 之间）和集电结（b–c 之间）。“双极型”指导电同时依靠电子和空穴两种载流子。`}</P>
          <BJTSymbols caption="符号中发射极箭头表示**发射结正偏时的电流方向**：NPN 由 b 流向 e（向外），PNP 由 e 流向 b（向里）。" />
          <VarTable
            rows={[
              ["NPN", "N–P–N 三层", r`正常放大时 $U_C>U_B>U_E$；电流从 c、b 流入，从 e 流出`],
              ["PNP", "P–N–P 三层", r`正常放大时 $U_E>U_B>U_C$；电流从 e 流入，从 b、c 流出`],
            ]}
          />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`三区（发射区、基区、集电区）、两结（发射结、集电结）、三极（e、b、c）。`, r`箭头方向 = 发射结正向电流方向，用来区分 NPN 和 PNP。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="bs-cond" n={2} title="放大的内部条件与外部条件">
        <Question n={2}>为什么两个二极管背靠背连接不能当三极管用？</Question>
        <Stage kind="concept" title="内部条件：由制造工艺保证">
          <Bullets
            items={[
              r`**发射区高掺杂**：能向基区注入大量载流子。`,
              r`**基区很薄（微米级）且掺杂浓度低**：注入的载流子穿过基区时很少被复合。`,
              r`**集电结面积大**：便于收集载流子、散热。`,
            ]}
          />
          <Callout kind="myth">
            <P>{r`把两只二极管的阳极接在一起，虽然也是“N–P–N”，但中间的 P 区很厚（毫米级），从一个结注入的电子在到达另一个结之前几乎全部复合掉了，根本到不了集电结，因此**没有电流放大作用**。放大的关键不在于“有两个结”，而在于“两个结靠得足够近”。`}</P>
          </Callout>
        </Stage>
        <Stage kind="concept" title="外部条件：由偏置电路保证">
          <P>{r`**发射结正偏、集电结反偏**。对 NPN：$U_{BE}>U_{on}$（硅约 0.5 V）且 $U_{CE}\ge U_{BE}$（即 $U_C\ge U_B$）。正偏的发射结负责“注入”，反偏的集电结负责“收集”。`}</P>
          <BJTTest caption="最简单的偏置电路：$V_{BB}$ 经 $R_b$ 使发射结正偏，$V_{CC}$ 经 $R_c$ 使集电结反偏。" />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`内部条件：发射区重掺杂、基区薄且轻掺杂、集电结面积大。`, r`外部条件：发射结正偏、集电结反偏。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="bs-config" n={3} title="三种基本组态">
        <Question n={3}>“共射”“共集”“共基”中的“共”指什么？</Question>
        <Stage kind="concept" title="以哪个电极作为输入、输出回路的公共端">
          <BJTConfigs caption="三种组态。“共”指该电极是输入回路与输出回路的公共端（在交流通路中接地）。" />
          <VarTable
            rows={[
              ["共射（CE）", "b 入、c 出，e 公共", "既放大电流又放大电压，最常用"],
              ["共集（CC）", "b 入、e 出，c 公共", "电压跟随，输入电阻大、输出电阻小"],
              ["共基（CB）", "e 入、c 出，b 公共", "电流跟随，高频特性好"],
            ]}
          />
          <Callout kind="warn">
            <P>{r`判断组态看的是**交流通路**中哪个电极接地（或作为公共端），而不是看直流电源接在哪里。例如共集电路的集电极直接接 $V_{CC}$，在交流通路中 $V_{CC}$ 接地，所以集电极是公共端。三种组态的完整分析见第 3 章。`}</P>
          </Callout>
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`信号从哪个极进、从哪个极出，剩下的那个就是“共”的电极。`, r`b 只能作输入端，c 只能作输出端，e 可入可出。`]} />
          <div className="mt-3">
            <PracticeLink topic={U} label="去做本单元练习" />
          </div>
        </Stage>
      </Section>
    </LessonArticle>
  );
}

/* ════════════════════ 电流分配 ════════════════════ */
export function BJTCurrentsLesson() {
  const U = "bjt-currents";
  const c = currentsFromIB(20e-6, 100, 10e-9);
  return (
    <LessonArticle unitId={U}>
      <LessonHeader unitId={U} path={r`发射区注入 → 基区复合（少）→ 集电结收集（多）→ $I_E=I_B+I_C$ → $\bar\beta$、$\bar\alpha$ → 反向电流 $I_{CBO}$ 与穿透电流 $I_{CEO}$。`} />

      <Section unitId={U} id="bc-transport" n={1} title="载流子的传输过程">
        <Question n={1}>发射区注入的电子去了哪里？</Question>
        <Stage kind="analysis" title="三个过程（以 NPN 为例）">
          <Derivation
            title="载流子的旅程"
            steps={[
              { tex: r`\text{发射：}I_E\approx I_{EN}`, why: "发射结正偏，高掺杂的发射区向基区大量注入电子；基区注入发射区的空穴很少（基区轻掺杂），可忽略" },
              { tex: r`\text{复合：}I_{BN}=(1-\bar\alpha)I_{EN}`, why: "电子在基区扩散时少量与空穴复合，基极电源不断补充空穴，形成基极电流的主要部分" },
              { tex: r`\text{收集：}I_{CN}=\bar\alpha I_{EN}`, why: "基区很薄，绝大部分电子扩散到集电结边缘，被反偏集电结的电场“扫”入集电区" },
              { tex: r`I_C=I_{CN}+I_{CBO},\quad I_B=I_{BN}-I_{CBO}`, why: "集电结反偏时还有少子漂移电流 $I_{CBO}$" },
            ]}
            conclusion={r`复合与收集的比例由**基区的结构**决定，与外电路无关——所以 $I_C$ 与 $I_B$ 之间存在近似固定的比例。`}
          />
        </Stage>
        <Stage kind="visual" title="电流分配可视化">
          <CurrentFlow />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`发射—复合—收集。复合越少，电流放大系数越大。`, r`集电结反偏“收集”的是从发射区来的载流子，而不是集电区自己的载流子。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="bc-beta" n={2} title="β、α 与电流分配">
        <Question n={2}>β 与 α 有什么关系？</Question>
        <Stage kind="concept" title="定义">
          <VarTable
            rows={[
              [r`$\bar\beta=\dfrac{I_{CN}}{I_{BN}}\approx\dfrac{I_C}{I_B}$`, "共射直流电流放大系数", "常见 20–300"],
              [r`$\bar\alpha=\dfrac{I_{CN}}{I_E}\approx\dfrac{I_C}{I_E}$`, "共基直流电流放大系数", "略小于 1（0.95–0.995）"],
              [r`$\beta=\dfrac{\Delta i_C}{\Delta i_B}$`, "共射交流电流放大系数", r`放大区内 $\beta\approx\bar\beta$，一般不加区分`],
            ]}
          />
          <Derivation
            title="β 与 α 的换算"
            steps={[
              { tex: r`I_E=I_B+I_C`, why: "KCL（精确，任何工作区都成立）" },
              { tex: r`\bar\alpha=\frac{I_C}{I_B+I_C}=\frac{I_C/I_B}{1+I_C/I_B}=\frac{\bar\beta}{1+\bar\beta}`, why: "分子分母同除以 $I_B$" },
              { tex: r`\bar\beta=\frac{\bar\alpha}{1-\bar\alpha}`, why: "反解" },
            ]}
            conclusion={r`$\bar\alpha$ 从 0.99 变到 0.995（只变 0.5%），$\bar\beta$ 就从 99 变到 199——$\beta$ 对制造工艺极其敏感，同一型号的分散性很大。`}
          />
        </Stage>
        <Stage kind="example" title="例题 2-1">
          <P>{r`某 NPN 管 $\bar\beta=100$，$I_{CBO}=10$ nA，$I_B=20\,\mu\mathrm A$。则 $I_C=\bar\beta I_B+(1+\bar\beta)I_{CBO}=${tq(c.IC, "A")}$，$I_E=I_B+I_C=${tq(c.IE, "A")}$。穿透电流只有 $${tq(c.ICEO, "A")}$，常温下硅管可忽略。`}</P>
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`$I_E=I_B+I_C$（精确）；$I_C\approx\bar\beta I_B$（放大区）。`, r`$\bar\alpha=\bar\beta/(1+\bar\beta)$，$\bar\beta=\bar\alpha/(1-\bar\alpha)$。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="bc-leak" n={3} title="反向电流 I_CBO 与穿透电流 I_CEO">
        <Question n={3}>{r`为什么 $I_{CEO}$ 是 $I_{CBO}$ 的 $(1+\beta)$ 倍？`}</Question>
        <Stage kind="derivation" title="基极开路时的集电极电流">
          <Derivation
            title="I_CEO"
            steps={[
              { tex: r`I_C=I_{CN}+I_{CBO},\qquad I_{CN}=\bar\beta I_{BN}`, why: "传输过程：被收集的电流与复合电流之比就是 $\\bar\\beta$ 的定义" },
              { tex: r`I_B=0\ \Rightarrow\ I_{BN}=I_{CBO}`, why: "由 $I_B=I_{BN}-I_{CBO}=0$：$I_{CBO}$ 就像一个“内部基极电流”" },
              { tex: r`I_{CEO}=I_{CN}+I_{CBO}=\bar\beta I_{CBO}+I_{CBO}=(1+\bar\beta)I_{CBO}`, why: "这个“内部基极电流”同样被放大 $\\bar\\beta$ 倍" },
              { tex: r`I_C=\bar\beta I_B+I_{CEO}`, why: "一般情况下的完整表达式" },
            ]}
            conclusion={r`$I_{CBO}$ 由少子漂移形成，随温度剧增（约每 10 °C 翻倍）；$I_{CEO}$ 是它的 $(1+\bar\beta)$ 倍，更是温度稳定性的大敌。硅管的 $I_{CBO}$ 比锗管小几个数量级，所以硅管温度稳定性好得多。`}
          />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`$I_{CBO}$：发射极开路时集电结的反向饱和电流。`, r`$I_{CEO}=(1+\bar\beta)I_{CBO}$：基极开路时 c–e 间的穿透电流。`, r`选管时 $I_{CEO}$ 越小越好。`]} />
          <div className="mt-3">
            <PracticeLink topic={U} label="去做本单元练习" />
          </div>
        </Stage>
      </Section>
    </LessonArticle>
  );
}

/* ════════════════════ 特性曲线 ════════════════════ */
export function BJTCurvesLesson() {
  const U = "bjt-curves";
  const j = judgeActivePins([3.7, 3, 12]);
  return (
    <LessonArticle unitId={U}>
      <LessonHeader unitId={U} path="输入特性（像二极管，随 $u_{CE}$ 右移）→ 输出特性（一族近似水平的线）→ 截止、放大、饱和三个区 → 由电位判断工作区与管型。" lab={{ href: "/lab/ce-amplifier", label: "共射实验室" }} />

      <Section unitId={U} id="bv-input" n={1} title="输入特性">
        <Question n={1}>{r`为什么 $u_{CE}$ 增大时输入特性右移？`}</Question>
        <Stage kind="concept" title="i_B 与 u_BE 的关系">
          <Eq note={r`以 $u_{CE}$ 为参变量。形状与二极管正向特性相似：存在开启电压（硅约 0.5 V），导通后 $u_{BE}$ 约 0.6–0.8 V。`}>{r`i_B=f(u_{BE})\big|_{u_{CE}=\text{常数}}`}</Eq>
          <P>{r`$u_{CE}=0$ 时，集电极与发射极短接，两个 PN 结并联正偏，曲线就像一只二极管。$u_{CE}$ 增大后集电结逐渐反偏，把基区的电子大量收集走，基区复合减少，同一 $u_{BE}$ 下 $i_B$ 减小——曲线右移。$u_{CE}\ge1$ V 后集电结已能收集几乎全部电子，曲线基本重合，通常只画这一条。`}</P>
        </Stage>
        <Stage kind="visual" title="输入特性曲线族">
          <InputFamily />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`输入特性 ≈ 发射结的二极管特性。`, r`$u_{CE}\ge1$ V 后基本重合，放大区分析只需一条。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="bv-output" n={2} title="输出特性与三个工作区">
        <Question n={2}>截止、放大、饱和各有什么特征？</Question>
        <Stage kind="concept" title="i_C 与 u_CE 的关系">
          <Eq note={r`以 $i_B$ 为参变量，得到一族曲线。`}>{r`i_C=f(u_{CE})\big|_{i_B=\text{常数}}`}</Eq>
          <VarTable
            rows={[
              ["截止区", r`发射结电压 < 开启电压（且集电结反偏）`, r`$i_B\approx0$，$i_C\approx I_{CEO}\approx0$；c–e 间相当于断开`],
              ["放大区", "发射结正偏、集电结反偏", r`$i_C=\beta i_B$，曲线近似水平且等间距——$i_C$ 几乎只由 $i_B$ 决定（受控电流源）`],
              ["饱和区", r`两结都正偏（$u_{CE}<u_{BE}$）`, r`$i_C<\beta i_B$，$i_C$ 主要由外电路决定；$u_{CE}=U_{CES}$（硅约 0.3 V），c–e 间相当于闭合的开关`],
            ]}
          />
          <Callout kind="note" title="临界饱和">
            <P>{r`$u_{CE}=u_{BE}$（集电结零偏）是放大区与饱和区的分界，称为临界饱和。工程上常用 $U_{CES}\approx0.3$ V（硅）作为判据。放大区曲线略向上倾斜（Early 效应），在第 4 章 $r_{ds}$、第 6 章电流源中会用到。`}</P>
          </Callout>
        </Stage>
        <Stage kind="visual" title="拖动工作点">
          <OutputRegions />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`放大区：受控电流源 $i_C=\beta i_B$。`, r`截止、饱和：开关的“断”与“通”——数字电路中晶体管就工作在这两个区。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="bv-judge" n={3} title="由电极电位判断工作区与管型">
        <Question n={3}>怎样由三个电极的电位判断管型、材料和工作区？</Question>
        <Stage kind="analysis" title="两类常见题">
          <Bullets
            items={[
              r`**已知管型，判断工作区**：看两个结的偏置。NPN：$U_{BE}>U_{on}$ 且 $U_C\ge U_B$ → 放大；$U_{BE}>U_{on}$ 且 $U_C<U_B$ → 饱和；$U_{BE}<U_{on}$ → 截止。PNP 不等号全部反向。`,
              r`**已知处于放大区，判断管型与电极**：电位居中者为基极；与基极相差约 0.7 V（硅）或 0.2 V（锗）者为发射极；另一个为集电极。集电极电位最高为 NPN，最低为 PNP。`,
            ]}
          />
        </Stage>
        <Stage kind="example" title="例题 2-2">
          <P>{r`放大电路中测得某晶体管三个电极对地电位为 ① 3.7 V、② 3 V、③ 12 V。电位居中的 ① 是基极；② 与之相差 0.7 V，是发射极，硅管；③ 是集电极，且电位最高，所以是 ${j.type} 管。`}</P>
        </Stage>
        <Stage kind="visual" title="自己试几组">
          <PinJudge />
          <RegionByPotential />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`判工作区：看两个结的正偏/反偏。`, r`判电极：中间是 b，差 0.7/0.2 V 是 e，剩下是 c；c 最高 NPN，c 最低 PNP。`]} />
          <div className="mt-3">
            <PracticeLink topic={U} label="去做本单元练习" />
          </div>
        </Stage>
      </Section>
    </LessonArticle>
  );
}

/* ════════════════════ 参数与安全工作区 ════════════════════ */
export function BJTParamsLesson() {
  const U = "bjt-params";
  const t = atTemperature({ beta: 80, UBE: 0.7, ICBO: 0.01e-6 }, 55);
  return (
    <LessonArticle unitId={U}>
      <LessonHeader unitId={U} path={r`电流放大系数与反向电流 → 极限参数 $P_{CM}$、$I_{CM}$、$U_{(BR)CEO}$ 围成安全工作区 → 温度使 $\beta$、$I_{CBO}$ 增大、$U_{BE}$ 减小。`} />

      <Section unitId={U} id="bp-params" n={1} title="电流放大系数与极间反向电流">
        <Question n={1}>直流 β 与交流 β 有什么区别？</Question>
        <Stage kind="concept" title="参数一览">
          <VarTable
            rows={[
              [r`$\bar\beta=I_C/I_B$`, "直流电流放大系数（静态）", "用于求 Q 点"],
              [r`$\beta=\Delta i_C/\Delta i_B$`, "交流电流放大系数（动态）", r`用于微变等效电路；输出特性等间距时 $\beta\approx\bar\beta$`],
              [r`$I_{CBO}$`, "发射极开路时 c–b 间反向电流", "硅管 nA 级，锗管 µA 级"],
              [r`$I_{CEO}=(1+\bar\beta)I_{CBO}$`, "基极开路时 c–e 间穿透电流", "越小越好"],
              [r`$f_T$`, "特征频率：$|\\beta|$ 下降到 1 时的频率", "见第 9 章"],
            ]}
          />
          <P>{r`$\beta$ 并不是常数：$i_C$ 很小或很大时 $\beta$ 都会下降，温度升高 $\beta$ 增大。这也是为什么放大电路设计要尽量让性能不依赖于 $\beta$（第 3 章分压偏置、第 8 章负反馈）。`}</P>
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`$\beta\approx\bar\beta$，一般不区分。`, r`$I_{CBO}$、$I_{CEO}$ 越小，温度稳定性越好。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="bp-soa" n={2} title="极限参数与安全工作区">
        <Question n={2}>{r`$P_{CM}$、$I_{CM}$、$U_{(BR)CEO}$ 怎样围出安全工作区？`}</Question>
        <Stage kind="concept" title="三个极限">
          <VarTable
            rows={[
              [r`$P_{CM}$`, "集电极最大允许耗散功率", r`管耗 $P_C=u_{CE}i_C$ 主要消耗在集电结；$u_{CE}i_C=P_{CM}$ 是输出特性上的一条双曲线`],
              [r`$I_{CM}$`, "集电极最大允许电流", r`超过后 $\beta$ 明显下降（不一定立即损坏）`],
              [r`$U_{(BR)CEO}$`, "基极开路时 c–e 间击穿电压", r`另有 $U_{(BR)CBO}>U_{(BR)CEO}$、$U_{(BR)EBO}$（只有几伏）`],
            ]}
          />
          <P>{r`三条边界在输出特性上围成的区域称为**安全工作区**（safe operating area, SOA）。放大电路的 Q 点及整个动态范围都必须落在其中；功率放大电路（第 10 章）选管时尤其要检查。`}</P>
        </Stage>
        <Stage kind="visual" title="调极限参数与工作点">
          <SOAWidget />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`$u_{CE}i_C\le P_{CM}$，$i_C\le I_{CM}$，$u_{CE}\le U_{(BR)CEO}$。`, r`发射结反向击穿电压 $U_{(BR)EBO}$ 只有几伏，发射结不能加过大的反向电压。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="bp-temp" n={3} title="温度对晶体管参数的影响">
        <Question n={3}>温度升高时 Q 点会怎样移动？</Question>
        <Stage kind="concept" title="三个效应同方向">
          <Bullets
            items={[
              r`$U_{BE}$：约 $-2\sim-2.5$ mV/°C（与二极管相同）。基极回路电压不变时 $I_B$ 增大。`,
              r`$\beta$：约 $+0.5\%\sim+1\%$/°C。`,
              r`$I_{CBO}$：约每升高 10 °C 增大一倍，$I_{CEO}$ 随之增大。`,
            ]}
          />
          <P>{r`三者都使 $I_C$ 增大，输出特性曲线整体上移、间距变大。例如 25 °C 时 $\bar\beta=80$、$U_{BE}=0.7$ V 的硅管，到 55 °C 约变为 $\bar\beta\approx${tn(t.beta)}$、$U_{BE}\approx${tq(t.UBE, "V")}$，$I_{CBO}$ 增大到 8 倍。固定偏置电路的 Q 点会向饱和区移动——这正是第 3 章“分压式偏置”要解决的问题。`}</P>
        </Stage>
        <Stage kind="visual" title="温度与输出特性">
          <TempCurves />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`温度↑ → $U_{BE}$↓、$\beta$↑、$I_{CBO}$↑ → $I_C$↑。`, r`稳定 Q 点的思路：引入直流负反馈（$R_e$），使 $I_C$ 尽量不依赖于这些参数。`]} />
          <div className="mt-3">
            <PracticeLink topic={U} label="去做本单元练习" />
          </div>
        </Stage>
      </Section>
    </LessonArticle>
  );
}
