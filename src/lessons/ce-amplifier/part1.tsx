import { Tex, P, r } from "@/components/math/Tex";
import { Derivation } from "@/components/math/Derivation";
import { Callout } from "@/components/ui/primitives";
import { Bullets, Eq, PracticeLink, Question, Section, Stage, VarTable } from "@/components/lesson/blocks";
import { InputCharDemo } from "@/components/lesson/widgets/InputCharDemo";
import { MiniLab } from "@/components/lesson/widgets/MiniLab";
import { PowerBudget } from "@/components/lesson/widgets/SmallWidgets";
import { analyzeCE } from "@/simulations/bjt/ce";
import { DEFAULT_CE } from "@/simulations/bjt/types";
import { tn, tq } from "@/lib/tex";

const U = "ce-amplifier";

/* ═════════════════════ 1. 三极管为什么能放大 ═════════════════════ */
export function SecWhy() {
  return (
    <Section unitId={U} id="ce-why" n={1} title="三极管为什么能放大">
      <Question n={1}>三极管为什么能够放大信号？</Question>
      <Question n={2}>放大电路的能量来自哪里？</Question>

      <Stage kind="intuition" title="一个阀门，而不是一台发电机">
        <P>
          {r`想象一根接在水塔上的水管，中间有一个阀门。你用很小的力去拧阀门，就能让很大的水流时大时小——水流的变化“跟随”你手的动作，但水的能量来自水塔，而不是你的手。`}
        </P>
        <P>
          {r`晶体管就是这样的“电子阀门”：很小的基极电流 $i_B$ 控制很大的集电极电流 $i_C$，而 $i_C$ 的能量由直流电源 $V_{CC}$ 提供。所谓**放大**，本质是**用一个小功率信号去控制一个大功率能源**，让输出按输入的形状变化。`}
        </P>
        <Callout kind="warn" title="类比的边界">
          <P>
            {r`阀门靠机械遮挡改变流量；晶体管靠的是**载流子输运**：发射区注入基区的电子，只有很少一部分在基区复合（形成 $i_B$），绝大部分扩散到集电结边缘后被反偏集电结的电场“扫”进集电区（形成 $i_C$）。$i_C$ 与 $i_B$ 的比例 $\beta$ 由器件结构决定，而不是由“拧多少”决定。`}
          </P>
        </Callout>
      </Stage>

      <Stage kind="concept" title="放大的条件与受控源">
        <Bullets
          items={[
            r`**内部条件**（制造决定）：发射区重掺杂（多发射载流子）；基区很薄且轻掺杂（少复合）；集电结面积大（易收集）。`,
            r`**外部条件**（电路决定）：发射结正偏、集电结反偏——这就是**放大区**。NPN 管满足 $U_C>U_B>U_E$。`,
            r`在放大区，晶体管可以看成一个**电流控制电流源**（CCCS）：$i_C=\beta i_B$，$i_E=i_B+i_C=(1+\beta)i_B$。`,
          ]}
        />
        <VarTable
          rows={[
            [r`$\beta$`, r`共射电流放大系数 $\beta\approx\Delta i_C/\Delta i_B$`, "无量纲，常见 50–300；本课程区分直流 $\\bar\\beta$ 与交流 $\\beta$ 时，二者在放大区近似相等"],
            [r`$\alpha$`, r`共基电流放大系数 $\alpha=i_C/i_E=\beta/(1+\beta)$`, "略小于 1"],
            [r`$i_E=i_B+i_C$`, "KCL：发射极电流等于另两极电流之和", "**精确关系**，任何工作区都成立"],
            [r`$i_C=\beta i_B$`, "放大区的控制关系", "**仅放大区**成立；饱和区 $i_C<\\beta i_B$"],
          ]}
        />
      </Stage>

      <Stage kind="derivation" title="用能量守恒检查“放大”">
        <P>
          {r`设负载上得到的交流电压峰值为 $U_{om}$，则输出信号功率 $P_o=\dfrac{U_{om}^2}{2R_L}$；信号源送入放大电路的功率 $P_i=\dfrac{U_{im}^2}{2R_i}$。功率增益 $A_p=P_o/P_i$ 可以远大于 1——这并不违反能量守恒，因为还有第三个功率：`}
        </P>
        <Eq note={r`$P_V$ 为直流电源提供的平均功率；$I_{C(AV)}$ 为集电极电流的平均值（小信号时 $\approx I_{CQ}$）。`}>{r`P_V = V_{CC}\,\big(I_{C(AV)}+I_{R_b}\big)\ \ \ge\ \ P_o + P_{\text{管耗}} + P_{R_c}`}</Eq>
        <P>{r`能量账是平的：输出信号功率 $P_o$ 只是 $P_V$ 中的一小部分，剩下的消耗在 $R_c$ 和晶体管上。**放大电路不产生能量，只转换能量。**`}</P>
      </Stage>

      <Stage kind="visual" title="看功率预算">
        <PowerBudget />
      </Stage>

      <Stage kind="summary">
        <Bullets
          items={[
            r`放大 = 小信号控制大能量；能量来自 $V_{CC}$。`,
            r`放大区：发射结正偏、集电结反偏；此时 $i_C=\beta i_B$。`,
            r`$i_E=i_B+i_C$ 永远成立；$i_C=\beta i_B$ 只在放大区成立。`,
          ]}
        />
      </Stage>
    </Section>
  );
}

/* ═════════════════════ 2. 直流偏置与静态工作点 ═════════════════════ */
export function SecBias() {
  return (
    <Section unitId={U} id="ce-bias" n={2} title="直流偏置与静态工作点">
      <Question n={3}>为什么需要直流偏置？</Question>
      <Question n={4}>什么是静态工作点？</Question>
      <Question n={5}>为什么输入增大，输出反而减小？</Question>

      <Stage kind="intuition" title="先把管子“抬”到门槛以上">
        <P>
          {r`发射结是一个 PN 结：$u_{BE}$ 低于约 0.5 V 时几乎没有电流，超过后电流随电压**指数**增长（硅管常取导通压降 0.7 V）。一个几毫伏的正弦信号直接加在 b–e 之间，根本跨不过这道门槛——输出几乎为零。`}
        </P>
        <P>
          {r`所以必须先用直流电源把发射结偏置到导通状态，让晶体管停在一个合适的位置，再让交流信号在这个位置附近“上下摆动”。这个静止时的位置就是**静态工作点**。`}
        </P>
      </Stage>

      <Stage kind="visual" title="把偏置调到 0 试试">
        <InputCharDemo initialBias={0.7} initialAmp={0.01} />
        <P>{r`把直流偏置拖到 0：$i_B$ 恒为零（信号进不去）。偏置合适时，10 mV 的信号让 $i_B$ 在 $I_{BQ}$ 上下近似正弦地变化。`}</P>
      </Stage>

      <Stage kind="concept" title="静态工作点 Q 与符号约定">
        <P>
          {r`**静态**：输入信号 $u_i=0$ 时电路的状态。此时各极的直流电流、电压 $\big(I_{BQ},\ U_{BEQ},\ I_{CQ},\ U_{CEQ}\big)$ 在输入、输出特性曲线上各对应一个点，称为**静态工作点 Q**（quiescent point）。`}
        </P>
        <P>{r`加入信号后，每个电量都是“直流 + 交流”的叠加。必须分清下面四种写法（童诗白教材的约定）：`}</P>
        <VarTable
          rows={[
            [r`$I_{BQ}$、$U_{CEQ}$`, "大写字母 + 大写下标：直流量 / 静态值", "Q 点；不随时间变化"],
            [r`$i_B$、$u_{CE}$`, "小写字母 + 大写下标：总瞬时值", r`$i_B=I_{BQ}+i_b$`],
            [r`$i_b$、$u_{ce}$`, "小写字母 + 小写下标：交流分量瞬时值", r`如 $i_b=I_{bm}\sin\omega t$`],
            [r`$I_b$、$\dot U_o$`, "大写字母 + 小写下标：交流有效值；加点表示相量", r`$I_b=I_{bm}/\sqrt2$`],
          ]}
        />
        <Callout kind="myth">
          <P>{r`“$I_B$ 就是基极电流”不够准确：$I_B$ 只是直流分量。题目问“基极电流的最大值”时，应答 $i_{B\max}=I_{BQ}+I_{bm}$。`}</P>
        </Callout>
      </Stage>

      <Stage kind="analysis" title="基本共射放大电路的组成">
        <P>{r`下面是固定偏置的基本共射放大电路。“共射”指发射极是输入回路与输出回路的公共端（交流接地）。点击元件可以查看它的作用：`}</P>
        <MiniLab initial={DEFAULT_CE} keys={[]} panels={["schematic"]} title="点击元件查看作用（可切换模式）" modeSwitch testId="bias-schematic" />
        <Bullets
          items={[
            r`$V_{CC}$：既为发射结提供正偏、为集电结提供反偏，又是输出信号的能量来源。`,
            r`$R_b$：从 $V_{CC}$ 引入合适的 $I_{BQ}$；阻值大（几百 kΩ），以免把输入信号分流掉。`,
            r`$R_c$：把 $i_C$ 的变化转换为电压的变化。**没有 $R_c$（或 $R_c=0$），集电极电位恒为 $V_{CC}$，得不到电压输出。**`,
            r`$C_1$、$C_2$：耦合电容，“隔直通交”——既传递交流信号，又隔断信号源、负载与偏置电路之间的直流联系。`,
          ]}
        />
      </Stage>

      <Stage kind="derivation" title="反相：一步一步看">
        <P>{r`以输出端空载为例（有负载时结论相同，只是把 $R_c$ 换成 $R_L'$）。集电极回路的 KVL 对**总瞬时值**成立：`}</P>
        <Eq label="2.1">{r`u_{CE}=V_{CC}-i_C R_c`}</Eq>
        <Derivation
          title="u_i 增大时发生了什么"
          steps={[
            { tex: r`u_i\uparrow\ \Rightarrow\ u_{BE}\uparrow`, why: "$C_1$ 对交流短路，输入电压直接叠加在发射结上" },
            { tex: r`u_{BE}\uparrow\ \Rightarrow\ i_B\uparrow`, why: "发射结正向特性：电压升高，电流增大（单调）" },
            { tex: r`i_B\uparrow\ \Rightarrow\ i_C=\beta i_B\uparrow`, why: "放大区的电流控制关系" },
            { tex: r`i_C\uparrow\ \Rightarrow\ u_{CE}=V_{CC}-i_C R_c\ \downarrow`, why: "式 (2.1)：$R_c$ 上的压降增大，集电极电位下降" },
            { tex: r`u_o=u_{ce}\ \downarrow`, why: "$C_2$ 隔直，输出的是 $u_{CE}$ 的交流分量" },
          ]}
          conclusion={r`$u_o$ 与 $u_i$ **反相**（相位差 180°），所以共射电路的电压放大倍数为负。负号不是“$\beta$ 为负”，而是“电流增大、电位下降”。`}
        />
        <MiniLab
          initial={DEFAULT_CE}
          keys={["Usm", "Rb"]}
          panels={["scope"]}
          title="示波器上的反相"
          footer={r`CH1（黄）为 u_i，CH2（青）为 u_o。注意两者峰谷对齐、方向相反；测量栏中的相位差约为 180°。`}
          testId="phase-demo"
        />
      </Stage>

      <Stage kind="summary">
        <Bullets
          items={[
            "没有合适的直流偏置，交流小信号无法通过发射结；偏置决定 Q 点。",
            r`Q 点 = $u_i=0$ 时的 $\big(I_{BQ},U_{BEQ},I_{CQ},U_{CEQ}\big)$。`,
            r`总量 = 直流 + 交流：$i_B=I_{BQ}+i_b$。`,
            r`共射电路输出与输入反相，原因是 $u_{CE}=V_{CC}-i_C R_c$。`,
          ]}
        />
        <div className="mt-3">
          <PracticeLink topic="ce-bias" />
        </div>
      </Stage>
    </Section>
  );
}

/* ═════════════════════ 3. 直流通路与静态分析 ═════════════════════ */
export function SecDC() {
  const a = analyzeCE(DEFAULT_CE);
  const p = a.params;
  return (
    <Section unitId={U} id="ce-dc" n={3} title="直流通路与静态分析">
      <Question n={6}>为什么直流分析时电容开路？</Question>

      <Stage kind="intuition" title="充满电的电容不再过电流">
        <P>
          {r`电容的两块极板被绝缘介质隔开，电流只能通过“充放电”流过。接通电源后经过一段时间，电容两端电压稳定下来，充放电停止——**直流稳态**下电容中没有电流，相当于断开。`}
        </P>
      </Stage>

      <Stage kind="concept" title="直流通路的画法">
        <Eq note={r`直流稳态：所有电压、电流不随时间变化，故 $\mathrm du_C/\mathrm dt=0$。注意：通电瞬间的暂态过程中电容并不开路。`}>{r`i_C = C\,\frac{\mathrm du_C}{\mathrm dt}\ \xrightarrow{\ \text{直流稳态}\ }\ 0\quad\Longrightarrow\quad \text{电容开路}`}</Eq>
        <Bullets
          items={[
            "电容视为**开路**；电感视为**短路**（$u_L=L\\,\\mathrm di/\\mathrm dt=0$）。",
            "交流信号源**置零**：电压源短路、电流源开路，但保留其内阻。（在本电路中信号源本来就被 $C_1$ 隔断。）",
            "其余元件保留。由此得到的电路叫**直流通路**，用于求 Q 点。",
          ]}
        />
      </Stage>

      <Stage kind="analysis" title="画出直流通路">
        <P>{r`切换到“直流”模式：$C_1$、$C_2$ 开路后，信号源、$R_s$ 与负载 $R_L$ 都与偏置电路断开；剩下两条电流路径——基极回路 $V_{CC}\to R_b\to$ b–e 结 $\to$ 地，以及集电极回路 $V_{CC}\to R_c\to$ c–e $\to$ 地。`}</P>
        <MiniLab initial={DEFAULT_CE} keys={["Rb", "Rc", "beta"]} panels={["schematic", "readouts"]} mode="dc" modeSwitch title="直流通路与 Q 点" testId="dc-lab" />
      </Stage>

      <Stage kind="derivation" title="估算法求 Q 点（固定偏置）">
        <Derivation
          title="静态工作点"
          steps={[
            {
              tex: r`V_{CC}=I_{BQ}R_b+U_{BEQ}\ \Rightarrow\ I_{BQ}=\frac{V_{CC}-U_{BEQ}}{R_b}`,
              why: "基极回路 KVL",
              approx: r`恒压降模型：硅管 $U_{BEQ}\approx0.6\text{–}0.8\,\mathrm V$（常取 0.7 V），锗管约 0.2–0.3 V`,
              units: r`$\mathrm V/\Omega=\mathrm A$ ✓`,
            },
            { tex: r`I_{CQ}=\beta I_{BQ},\qquad I_{EQ}=(1+\beta)I_{BQ}`, why: "**假设**工作在放大区" },
            { tex: r`U_{CEQ}=V_{CC}-I_{CQ}R_c`, why: "集电极回路 KVL", units: r`$\mathrm V-\mathrm A\cdot\Omega=\mathrm V$ ✓` },
            {
              tex: r`U_{CEQ}>U_{CES}\ \ \text{且}\ \ I_{BQ}>0\ \Rightarrow\ \text{假设成立（放大区）}`,
              why: "验证假设。若算出 $U_{CEQ}<U_{CES}$，说明已饱和，此时 $I_{CQ}\\ne\\beta I_{BQ}$，应改用 $U_{CE}=U_{CES}$ 求 $I_{CQ}\\approx(V_{CC}-U_{CES})/R_c$",
            },
          ]}
          conclusion="先假设、后验证：这是分析非线性器件的通用套路。"
        />
      </Stage>

      <Stage kind="example" title="例题 3-1">
        <P>{r`固定偏置电路：$V_{CC}=${tq(p.VCC, "V")}$，$R_b=${tq(p.Rb, "Ω")}$，$R_c=${tq(p.Rc, "Ω")}$，$\beta=${tn(p.beta)}$，$U_{BEQ}=${tq(p.UBE, "V")}$。求 Q 点。`}</P>
        <Tex block>{r`I_{BQ}=\frac{${tn(p.VCC)}-${tn(p.UBE)}}{${tn(p.Rb / 1e3)}\,\mathrm{k\Omega}}=${tq(a.dc.IBQ, "A")},\quad I_{CQ}=${tn(p.beta)}\times${tq(a.dc.IBQ, "A")}=${tq(a.dc.ICQ, "A")}`}</Tex>
        <Tex block>{r`U_{CEQ}=${tn(p.VCC)}-${tq(a.dc.ICQ, "A")}\times${tq(p.Rc, "Ω")}=${tq(a.dc.UCEQ, "V")}>U_{CES}\ \Rightarrow\ \text{放大区}`}</Tex>
        <P>{r`**反过来设计**：若要求 $I_{BQ}=20\,\mu\mathrm A$、$U_{CEQ}=6\,\mathrm V$，则 $R_b=(V_{CC}-U_{BEQ})/I_{BQ}=565\,\mathrm{k\Omega}$，$R_c=(V_{CC}-U_{CEQ})/I_{CQ}=3\,\mathrm{k\Omega}$——这类“由 Q 点反求电阻”的题在考试中很常见。`}</P>
      </Stage>

      <Stage kind="analysis" title="图解法：直流负载线">
        <P>
          {r`式 $u_{CE}=V_{CC}-i_CR_c$ 由**外电路**决定，在输出特性坐标系中是一条直线：横截距 $(V_{CC},0)$，纵截距 $(0,V_{CC}/R_c)$，斜率 $-1/R_c$，称为**直流负载线**。晶体管自身又要求 $(u_{CE},i_C)$ 落在 $i_B=I_{BQ}$ 那条输出特性曲线上——两者的交点就是 Q 点。`}
        </P>
        <MiniLab initial={DEFAULT_CE} keys={["Rb", "Rc", "VCC"]} panels={["char"]} title="改变 R_b、R_c、V_CC，看 Q 点与负载线" testId="loadline-lab" />
        <Bullets
          items={[
            r`改变 $R_b$：负载线不动，Q 点沿负载线移动（$R_b\downarrow\Rightarrow I_{BQ}\uparrow\Rightarrow$ Q 点上移，靠近饱和区）。`,
            r`改变 $R_c$：负载线绕横截距 $(V_{CC},0)$ 转动（$R_c\uparrow$ 斜率变缓，Q 点左移）。`,
            r`改变 $V_{CC}$：负载线平行移动。`,
          ]}
        />
      </Stage>

      <Stage kind="analysis" title="补充：分压式偏置的静态估算">
        <P>
          {r`固定偏置的 $I_{CQ}=\beta(V_{CC}-U_{BEQ})/R_b$ 直接正比于 $\beta$，而 $\beta$ 随温度、个体差异变化很大。工程上常用**分压式偏置**：$R_{b1}$（下）、$R_{b2}$（上）分压固定基极电位，射极电阻 $R_e$ 引入直流负反馈。当流过分压器的电流远大于 $I_{BQ}$ 时：`}
        </P>
        <Eq note={r`估算法条件：$(1+\beta)R_e\gg R_{b1}\para R_{b2}$（一般 ≥10 倍）。精确解用戴维南等效：$V_{BB}=\frac{R_{b1}}{R_{b1}+R_{b2}}V_{CC}$，$R_B=R_{b1}\para R_{b2}$，$I_{BQ}=\frac{V_{BB}-U_{BEQ}}{R_B+(1+\beta)R_e}$。实验室中可同时看到两种结果及其误差。`}>
          {r`U_{BQ}\approx\frac{R_{b1}}{R_{b1}+R_{b2}}V_{CC},\quad I_{EQ}=\frac{U_{BQ}-U_{BEQ}}{R_e},\quad U_{CEQ}\approx V_{CC}-I_{EQ}(R_c+R_e)`}
        </Eq>
        <P>{r`此时 $I_{EQ}$ 与 $\beta$ 基本无关——这就是“稳定 Q 点”。它的完整讨论在后续单元“分压式偏置与 Q 点稳定”中展开。`}</P>
      </Stage>

      <Stage kind="summary">
        <Bullets
          items={[
            "直流通路：电容开路、电感短路、交流源置零。",
            "求 Q 点：基极回路 KVL → $I_{BQ}$；放大区假设 → $I_{CQ}$；集电极回路 KVL → $U_{CEQ}$；最后验证工作区。",
            "直流负载线 $u_{CE}=V_{CC}-i_CR_c$ 与 $i_B=I_{BQ}$ 的特性曲线交点为 Q 点。",
          ]}
        />
        <div className="mt-3">
          <PracticeLink topic="ce-dc" />
        </div>
      </Stage>
    </Section>
  );
}
