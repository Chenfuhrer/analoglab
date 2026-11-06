import { P, r } from "@/components/math/Tex";
import { Derivation } from "@/components/math/Derivation";
import { Callout } from "@/components/ui/primitives";
import { Bullets, Eq, PracticeLink, Question, Section, Stage, VarTable } from "@/components/lesson/blocks";
import { InputCharDemo } from "@/components/lesson/widgets/InputCharDemo";
import { MiniLab } from "@/components/lesson/widgets/MiniLab";
import { CapReactance, RoMeasure } from "@/components/lesson/widgets/SmallWidgets";
import { SmallSignalStandard } from "@/components/circuit/SmallSignalStandard";
import { analyzeCE } from "@/simulations/bjt/ce";
import { DEFAULT_CE, DEFAULT_DIVIDER } from "@/simulations/bjt/types";
import { tn, tq } from "@/lib/tex";

const U = "ce-amplifier";

/* ═════════════════════ 4. 交流通路 ═════════════════════ */
export function SecAC() {
  return (
    <Section unitId={U} id="ce-ac" n={4} title="交流通路">
      <Question n={7}>为什么中频交流分析时电容可以近似短路？</Question>
      <Question n={8}>为什么直流电源在交流等效电路中接地？</Question>

      <Stage kind="intuition" title="交直流分开算的前提">
        <P>
          {r`电路中同时存在直流和交流。如果电路是**线性**的，就可以用叠加原理：直流电源单独作用求 Q 点，交流信号单独作用求“变化量”，最后相加。晶体管本身是非线性的，但只要信号足够小，它在 Q 点附近的行为可以近似为线性（下一节的微变等效）。所以“交直流分开分析”本身就是一个**小信号近似**。`}
        </P>
      </Stage>

      <Stage kind="concept" title="Q7：电容的容抗随频率变化">
        <Eq note={r`$\omega=2\pi f$。直流 $f=0$ 时 $X_C\to\infty$（开路）；频率越高、电容越大，$X_C$ 越小。`}>{r`X_C=\frac{1}{\omega C}=\frac{1}{2\pi fC}`}</Eq>
        <P>
          {r`耦合电容、旁路电容一般取几 µF 到几百 µF。以 $C_1=10\,\mu\mathrm F$、$f=1\,\mathrm{kHz}$ 为例，$X_{C1}\approx16\,\Omega$，而它所在回路的电阻（$R_s+R_i$）是 kΩ 量级——电容上的交流压降可以忽略，所以**视为短路**。这个结论有两个前提：频率足够高（高于下限截止频率 $f_L$），且容抗远小于与之串联（或并联）的电阻。`}
        </P>
        <CapReactance />
        <Callout kind="note" title="什么是“中频”">
          <P>{r`频率足够高，使耦合、旁路电容可视为短路；又足够低，使晶体管内部结电容（pF 级）的容抗大到可视为开路——这个频段的放大倍数与频率无关，称为**中频区**。低于 $f_L$ 或高于 $f_H$ 的情况属于“频率响应”一章。`}</P>
        </Callout>
      </Stage>

      <Stage kind="concept" title="Q8：直流电源为什么“接地”">
        <P>
          {r`理想直流电压源两端的电压恒为 $V_{CC}$，**不随信号变化**，即它的交流分量为零。叠加原理中“只让交流信号作用”时，直流电压源置零——电压源置零就是**短路**。由于 $V_{CC}$ 的负端本来就接地，短路后它的正端在交流上与地等电位，称为**交流地**。`}
        </P>
        <Eq note={r`$v_{CC}$ 的交流分量 $=\Delta V_{CC}=0$。实际电源有内阻，通常在电源端并联大电容使其交流内阻很小，结论同样成立。`}>{r`V_{CC}\ \text{端的电位}=V_{CC}+0\cdot\sin\omega t\ \Rightarrow\ \text{交流分量为 }0\ \Rightarrow\ \text{交流接地}`}</Eq>
        <Callout kind="myth">
          <P>{r`“交流通路中把电源去掉”是不准确的说法：电源不是被拆掉（拆掉是开路），而是被**短路到地**。所以 $R_b$、$R_c$ 原来接 $V_{CC}$ 的一端，在交流通路中都接到了地。`}</P>
        </Callout>
      </Stage>

      <Stage kind="analysis" title="画出交流通路">
        <Bullets
          items={[
            "耦合电容 $C_1$、$C_2$ 和旁路电容 $C_e$：**短路**（中频）。",
            "直流电压源 $V_{CC}$：**交流接地**（短路）。",
            "结果：$R_b$ 并联在输入端（与晶体管 b–e 并联）；$R_c$ 与 $R_L$ 并联在 c 与地之间，记 $R_L'=R_c\\para R_L$。",
          ]}
        />
        <MiniLab initial={DEFAULT_CE} keys={[]} panels={["schematic"]} mode="ac" modeSwitch title="在完整 / 直流 / 交流之间切换" testId="ac-lab" />
      </Stage>

      <Stage kind="summary">
        <Bullets
          items={[
            "交流通路：中频时耦合、旁路电容短路；直流电压源交流接地。",
            "交直流分开分析依赖于小信号线性化。",
            "$R_b$ 并在输入端，$R_c\\para R_L$ 是交流负载 $R_L'$。",
          ]}
        />
        <div className="mt-3">
          <PracticeLink topic="ce-ac" />
        </div>
      </Stage>
    </Section>
  );
}

/* ═════════════════════ 5. 微变等效电路 ═════════════════════ */
export function SecHParam() {
  const a = analyzeCE(DEFAULT_CE);
  const IEQ = a.dc.IEQ;
  return (
    <Section unitId={U} id="ce-hparam" n={5} title="微变等效电路">
      <Question n={9}>什么是微变等效模型？</Question>
      <Question n={10}>为什么可以使用 r_be 表示输入端的小信号特性？</Question>

      <Stage kind="intuition" title="弯曲的曲线，局部是直的">
        <P>
          {r`站在地面上看，地球是平的——因为你只看了一小块。晶体管的特性曲线是弯曲的（非线性），但只看 Q 点附近很小的一段，就可以用**切线**代替曲线。用这些“切线关系”搭成的线性电路，就叫**微变等效电路**（小信号模型）。`}
        </P>
      </Stage>

      <Stage kind="concept" title="Q9：h 参数模型及其简化">
        <P>{r`把晶体管看成双口网络，以 $i_b$、$u_{ce}$ 为自变量，对小信号做一阶展开：`}</P>
        <Eq>{r`\begin{cases}u_{be}=h_{ie}\,i_b+h_{re}\,u_{ce}\\ i_c=h_{fe}\,i_b+h_{oe}\,u_{ce}\end{cases}`}</Eq>
        <VarTable
          rows={[
            [r`$h_{ie}=r_{be}$`, r`输出交流短路时的输入电阻 $\partial u_{BE}/\partial i_B$`, "Ω，约 1 kΩ 量级"],
            [r`$h_{fe}=\beta$`, r`输出交流短路时的电流放大系数 $\partial i_C/\partial i_B$`, "无量纲"],
            [r`$h_{re}$`, r`内反馈系数（$u_{ce}$ 对输入的影响）`, r`约 $10^{-3}$ 以下，**忽略**`],
            [r`$h_{oe}=1/r_{ce}$`, r`输出电导（特性曲线的上翘斜率）`, r`$r_{ce}$ 常为几十 kΩ 以上，$r_{ce}\gg R_L'$ 时**忽略**`],
          ]}
        />
        <P>{r`忽略 $h_{re}$ 与 $h_{oe}$ 后得到**简化 h 参数模型**：b–e 之间是电阻 $r_{be}$，c–e 之间是受控电流源 $\beta i_b$。`}</P>
        <Eq>{r`u_{be}=r_{be}\,i_b,\qquad i_c=\beta\,i_b`}</Eq>
        <Callout kind="assume" title="适用条件（缺一不可）">
          <Bullets
            items={[
              "晶体管工作在**放大区**（Q 点合适）；",
              "**小信号**：$|u_{be}|\\ll U_T\\approx26\\,\\mathrm{mV}$，在 Q 点附近线性化误差小；",
              "**低频/中频**：忽略结电容；",
              "只能用来求**交流量**（$A_u$、$R_i$、$R_o$），**不能求 Q 点**。",
            ]}
          />
        </Callout>
      </Stage>

      <Stage kind="derivation" title="Q10：r_be 从哪里来">
        <P>{r`发射结是正偏的 PN 结，在放大区基极电流与发射结电压满足指数关系（$U_T=kT/q\approx26\,\mathrm{mV}$，300 K）：`}</P>
        <Derivation
          title="由输入特性求动态电阻"
          steps={[
            { tex: r`i_B\approx I_{S}'\,e^{u_{B'E}/U_T}`, why: "PN 结正向伏安特性（$u_{B'E}\\gg U_T$ 时忽略 −1 项）；$u_{B'E}$ 为发射结本身的电压" },
            { tex: r`\frac{\mathrm di_B}{\mathrm du_{B'E}}=\frac{I_S'}{U_T}e^{u_{B'E}/U_T}=\frac{i_B}{U_T}`, why: "对指数求导：导数正比于函数本身" },
            { tex: r`r_{b'e}=\left.\frac{\mathrm du_{B'E}}{\mathrm di_B}\right|_Q=\frac{U_T}{I_{BQ}}=(1+\beta)\frac{U_T}{I_{EQ}}`, why: "在 Q 点取切线斜率的倒数；$I_{EQ}=(1+\beta)I_{BQ}$" },
            {
              tex: r`r_{be}=r_{bb'}+(1+\beta)\frac{U_T}{I_{EQ}}`,
              why: "基极引线到发射结之间还有基区体电阻 $r_{bb'}$（几十至几百欧，题目一般给出），两者串联",
              approx: "常温取 $U_T\\approx26\\,\\mathrm{mV}$",
              numeric: r`I_{EQ}=${tq(IEQ, "A")}\ \Rightarrow\ r_{be}=${tq(DEFAULT_CE.rbb, "Ω")}+${tn(1 + DEFAULT_CE.beta)}\times\frac{26\,\mathrm{mV}}{${tq(IEQ, "A")}}=${tq(a.ac.rbe, "Ω")}`,
              units: r`$\mathrm V/\mathrm A=\Omega$ ✓`,
            },
          ]}
          conclusion={r`$r_{be}$ 是 Q 点处输入特性**切线斜率的倒数**，由 $I_{EQ}$ 决定：Q 点越高，$r_{be}$ 越小。`}
        />
        <Callout kind="myth" title="r_be 不是直流电阻">
          <P>{r`静态时 $U_{BEQ}/I_{BQ}=0.7\,\mathrm V/20\,\mu\mathrm A=35\,\mathrm{k\Omega}$，而 $r_{be}\approx${tq(a.ac.rbe, "Ω")}$——两者相差二十多倍。$r_{be}$ 描述的是“电压**变化**一点，电流**变化**多少”，只能用于交流小信号。`}</P>
        </Callout>
      </Stage>

      <Stage kind="visual" title="切线与信号幅度">
        <InputCharDemo showTangentDefault initialBias={0.7} initialAmp={0.002} />
        <P>{r`打开切线，把幅值从 2 mV 增大到 50 mV：曲线（实线）与切线（虚线）的 $i_B$ 波形逐渐分离——这就是“小信号”条件 $|u_{be}|\ll U_T$ 的含义。`}</P>
      </Stage>

      <Stage kind="analysis" title="画出微变等效电路">
        <P>{r`步骤：① 先画交流通路；② 把晶体管的 b、e、c 三个端子标出来；③ b–e 之间换成 $r_{be}$，c–e 之间换成受控电流源 $\beta\dot I_b$（方向由 c 指向 e，与 $\dot I_b$ 流入 b 的参考方向对应）；④ 其余元件照搬。`}</P>
        <MiniLab initial={DEFAULT_CE} keys={[]} panels={["schematic"]} mode="ss" modeSwitch title="交流通路 → 微变等效（晶体管原位替换）" testId="ss-lab" />
        <SmallSignalStandard />
      </Stage>

      <Stage kind="summary">
        <Bullets
          items={[
            "微变等效 = 在 Q 点附近把非线性器件线性化；只用于交流小信号。",
            "简化 h 参数模型：$r_{be}$ + $\\beta\\dot I_b$（忽略 $h_{re}$、$r_{ce}$）。",
            "$r_{be}=r_{bb'}+(1+\\beta)U_T/I_{EQ}$：切线斜率的倒数，随 Q 点变化。",
          ]}
        />
        <div className="mt-3">
          <PracticeLink topic="ce-hparam" />
        </div>
      </Stage>
    </Section>
  );
}

/* ═════════════════════ 6. 电压放大倍数 ═════════════════════ */
export function SecGain() {
  const a = analyzeCE(DEFAULT_CE);
  const p = a.params;
  const withRe = analyzeCE({ ...DEFAULT_CE, Re1: 200 });
  return (
    <Section unitId={U} id="ce-gain" n={6} title="电压放大倍数">
      <Question n={11}>电压放大倍数如何推导？</Question>

      <Stage kind="intuition" title="电压 → 电流 → 放大的电流 → 电压">
        <P>{r`输入电压先在 $r_{be}$ 上“换算”成基极电流，再被放大 $\beta$ 倍成为集电极电流，最后流过交流负载 $R_L'$ 变回电压。所以电压放大倍数 = 电流放大 × 两个电阻之比。`}</P>
      </Stage>

      <Stage kind="derivation" title="情形一：射极交流接地">
        <P>{r`适用电路：固定偏置（无 $R_e$），或射极电阻被 $C_e$ 完全旁路。中频、小信号、忽略 $r_{ce}$。`}</P>
        <Derivation
          title="A_u = U_o / U_i"
          steps={[
            { tex: r`\dot U_i=\dot I_b\,r_{be}`, why: "输入回路：输入端到地之间，晶体管支路只有 $r_{be}$（$R_b$ 与之并联，不影响 $\\dot U_i$ 与 $\\dot I_b$ 的关系）" },
            { tex: r`\dot I_c=\beta\dot I_b`, why: "受控源关系（h 参数模型）" },
            { tex: r`\dot U_o=-\dot I_c\,(R_c\para R_L)=-\beta\dot I_b R_L'`, why: "输出回路：$\\beta\\dot I_b$ 从 c 流向 e（地），流过 $R_L'$ 产生的电压与 $\\dot U_o$ 参考方向相反，所以有负号" },
            {
              tex: r`\dot A_u=\frac{\dot U_o}{\dot U_i}=-\frac{\beta R_L'}{r_{be}}`,
              why: "两式相除，$\\dot I_b$ 约去",
              numeric: r`\dot A_u=-\frac{${tn(p.beta)}\times${tq(a.ac.RLp, "Ω")}}{${tq(a.ac.rbe, "Ω")}}=${tn(a.ac.Au, 4)}`,
              units: "$\\Omega/\\Omega$ → 无量纲 ✓",
            },
          ]}
          conclusion={r`负号表示反相；$|A_u|$ 与 $\beta$、$R_L'$ 成正比，与 $r_{be}$ 成反比。`}
        />
      </Stage>

      <Stage kind="derivation" title="情形二：射极有未旁路电阻 R_e（不能直接套用上式）">
        <P>{r`当发射极与地之间串有 $R_e$（未被旁路）时，**必须重新建立等效电路**：$R_e$ 中同时流过 $\dot I_b$ 和 $\beta\dot I_b$。`}</P>
        <SmallSignalStandard initialRe />
        <Derivation
          title="含射极电阻的 A_u"
          steps={[
            { tex: r`\dot I_e=\dot I_b+\beta\dot I_b=(1+\beta)\dot I_b`, why: "发射极节点 KCL" },
            { tex: r`\dot U_i=\dot I_b r_{be}+\dot I_e R_e=\dot I_b\left[r_{be}+(1+\beta)R_e\right]`, why: "输入回路 KVL：$r_{be}$ 与 $R_e$ 串联但电流不同" },
            { tex: r`\dot U_o=-\beta\dot I_b R_L'`, why: "输出回路不变" },
            {
              tex: r`\dot A_u=-\frac{\beta R_L'}{r_{be}+(1+\beta)R_e}\ \approx\ -\frac{R_L'}{R_e}\quad\big((1+\beta)R_e\gg r_{be}\big)`,
              why: "两式相除；当 $(1+\\beta)R_e$ 远大于 $r_{be}$ 时，$\\beta/(1+\\beta)\\approx1$",
              numeric: r`R_e=200\,\Omega\ (R_b\ \text{不变，Q 点略降}):\quad\dot A_u=-\frac{${tn(p.beta)}\times${tq(withRe.ac.RLp, "Ω")}}{${tq(withRe.ac.rbe, "Ω")}+${tn(1 + p.beta)}\times200\,\Omega}=${tn(withRe.ac.Au, 3)}`,
            },
          ]}
          conclusion={r`$|A_u|$ 显著下降，但几乎不再依赖 $\beta$ 和 $r_{be}$（即不依赖 Q 点和温度），线性也更好——这是**交流负反馈**的作用。`}
        />
        <Callout kind="key" title="(1+β) 倍的“折算”">
          <P>{r`从基极看进去，射极电阻 $R_e$ 相当于变成了 $(1+\beta)R_e$——因为同样的 $\dot U$ 只需要 $1/(1+\beta)$ 倍的基极电流。这个结论在求输入电阻、分析共集电路时会反复用到。`}</P>
        </Callout>
      </Stage>

      <Stage kind="concept" title="信号源电压放大倍数">
        <Eq note={r`$R_s$ 与 $R_i$ 分压，$\dot U_i=\dfrac{R_i}{R_s+R_i}\dot U_s$。$R_i$ 越大，信号源的电压损失越小。`}>{r`\dot A_{us}=\frac{\dot U_o}{\dot U_s}=\frac{R_i}{R_s+R_i}\,\dot A_u`}</Eq>
      </Stage>

      <Stage kind="analysis" title="A_u 与 Q 点、β 的关系（易错）">
        <P>{r`当 $r_{bb'}$ 较小时，$r_{be}\approx(1+\beta)U_T/I_{EQ}$，代入得：`}</P>
        <Eq note={r`结论：**在 $I_{CQ}$ 不变的前提下**，换一只 $\beta$ 更大的管子，$|A_u|$ 几乎不变（$r_{be}$ 同比例增大）。但在固定偏置电路中，$\beta$ 增大会使 $I_{CQ}=\beta I_{BQ}$ 增大，$|A_u|$ 因此增大——甚至进入饱和。`}>{r`|\dot A_u|\approx\frac{\beta R_L'}{(1+\beta)U_T/I_{EQ}}\approx\frac{I_{CQ}R_L'}{U_T}`}</Eq>
        <MiniLab initial={DEFAULT_CE} keys={["beta", "Rb", "RL", "Re1"]} panels={["readouts", "ac-derivation"]} title="改变 β、R_b、R_L、R_e1，看推导中的每一个数" testId="gain-lab" />
      </Stage>

      <Stage kind="summary">
        <Bullets
          items={[
            "$\\dot A_u=-\\beta R_L'/r_{be}$ 只适用于射极交流接地的共射电路。",
            "有未旁路 $R_e$ 时：$\\dot A_u=-\\beta R_L'/[r_{be}+(1+\\beta)R_e]$。",
            "$\\dot A_{us}=\\dot A_u\\,R_i/(R_s+R_i)$。",
            "$|A_u|\\approx I_{CQ}R_L'/U_T$：增益由 Q 点决定。",
          ]}
        />
        <div className="mt-3">
          <PracticeLink topic="ce-gain" />
        </div>
      </Stage>
    </Section>
  );
}

/* ═════════════════════ 7. 输入电阻与输出电阻 ═════════════════════ */
export function SecRio() {
  const a = analyzeCE(DEFAULT_CE);
  const d = analyzeCE(DEFAULT_DIVIDER);
  return (
    <Section unitId={U} id="ce-rio" n={7} title="输入电阻与输出电阻">
      <Question n={12}>输入电阻和输出电阻有什么物理意义？</Question>
      <Question n={13}>为什么负载会影响电压增益？</Question>

      <Stage kind="intuition" title="放大电路的两张“面孔”">
        <P>
          {r`对**信号源**来说，放大电路是一个负载——它“吃”多少电流由**输入电阻** $R_i$ 描述；对**负载**来说，放大电路是一个带内阻的信号源——它的“内阻”就是**输出电阻** $R_o$。`}
        </P>
        <Eq note={r`输入端：$R_i$ 越大，从信号源取的电流越小，$\dot U_i$ 越接近 $\dot U_s$。输出端：戴维南等效，$R_o$ 越小，接负载后电压下降越少（带负载能力越强）。`}>{r`\dot U_i=\frac{R_i}{R_s+R_i}\dot U_s,\qquad \dot U_o=\frac{R_L}{R_o+R_L}\dot U_o'`}</Eq>
      </Stage>

      <Stage kind="concept" title="定义">
        <VarTable
          rows={[
            [r`$R_i=\dfrac{\dot U_i}{\dot I_i}$`, "从输入端看进去的等效电阻（负载接着）", "与 $R_s$ 无关"],
            [r`$R_o=\dfrac{\dot U}{\dot I}\Big|_{\dot U_s=0,\ R_L=\infty}$`, "信号源置零（保留 $R_s$）、断开 $R_L$，在输出端加测试电压求得", "与 $R_L$ 无关"],
            [r`$\dot U_o'$`, "负载开路时的输出电压", r`$\dot U_o'=\dot A_{uo}\dot U_i$`],
          ]}
        />
      </Stage>

      <Stage kind="derivation" title="共射电路的 R_i 与 R_o">
        <Derivation
          title="输入电阻"
          steps={[
            { tex: r`\dot I_i=\dot I_{R_b}+\dot I_b=\frac{\dot U_i}{R_b}+\frac{\dot U_i}{r_{be}}`, why: "输入端 KCL：$R_b$ 支路与晶体管支路并联" },
            {
              tex: r`R_i=\frac{\dot U_i}{\dot I_i}=R_b\para r_{be}\ \approx\ r_{be}\quad(R_b\gg r_{be})`,
              why: "两电阻并联",
              numeric: r`R_i=${tq(DEFAULT_CE.Rb, "Ω")}\para${tq(a.ac.rbe, "Ω")}=${tq(a.ac.Ri, "Ω")}`,
            },
            { tex: r`R_i=R_B\para\left[r_{be}+(1+\beta)R_e\right]`, why: "射极有未旁路 $R_e$ 时，晶体管支路的电阻变为 $\\dot U_i/\\dot I_b$；分压偏置时 $R_B=R_{b1}\\para R_{b2}$", numeric: r`\text{默认分压偏置电路：}R_i=${tq(d.dc.RB, "Ω")}\para${tq(d.ac.Rib, "Ω")}=${tq(d.ac.Ri, "Ω")}` },
          ]}
        />
        <Derivation
          title="输出电阻"
          steps={[
            { tex: r`\dot U_s=0\ \Rightarrow\ \dot I_b=0`, why: "信号源置零后，输入回路中没有激励（输出端的测试电压通过 $\\beta\\dot I_b$ 受控源无法反向影响输入——h 参数简化模型中 $h_{re}=0$）" },
            { tex: r`\beta\dot I_b=0\ \Rightarrow\ \text{受控电流源开路}`, why: "电流为零的电流源相当于开路" },
            { tex: r`R_o=R_c\quad(\text{计入 }r_{ce}\text{ 时 }R_o=R_c\para r_{ce}\approx R_c)`, why: "从输出端看进去只剩 $R_c$", numeric: r`R_o=${tq(a.ac.Ro, "Ω")}` },
          ]}
        />
      </Stage>

      <Stage kind="derivation" title="Q13：负载为什么影响增益">
        <P>{r`两种角度，结论相同：`}</P>
        <Eq>{r`\dot A_u=-\frac{\beta(R_c\para R_L)}{r_{be}}=\underbrace{\left(-\frac{\beta R_c}{r_{be}}\right)}_{\dot A_{uo}\ \text{空载}}\cdot\underbrace{\frac{R_L}{R_c+R_L}}_{\text{输出分压}}=\dot A_{uo}\frac{R_L}{R_o+R_L}`}</Eq>
        <P>{r`① 从电路看：$R_L$ 与 $R_c$ 并联，交流负载 $R_L'$ 变小，同样的 $\dot I_c$ 产生的电压变小；② 从戴维南等效看：放大电路输出端是“$\dot U_o'$ 串联 $R_o$”，接上 $R_L$ 后分压。$R_L$ 越接近或小于 $R_o$，增益下降越多。`}</P>
        <RoMeasure />
        <Callout kind="key">
          <P>{r`共射电路 $R_o\approx R_c$ 是 kΩ 量级，带负载能力较弱——这就是需要共集电路（射极跟随器，$R_o$ 很小）作为输出级的原因。`}</P>
        </Callout>
      </Stage>

      <Stage kind="summary">
        <Bullets
          items={[
            "$R_i$ 衡量对信号源的影响（越大越好，对电压信号源而言）；$R_o$ 衡量带负载能力（越小越好）。",
            "共射：$R_i=R_B\\para[r_{be}+(1+\\beta)R_e]$，$R_o\\approx R_c$。",
            "负载影响增益：$\\dot A_u=\\dot A_{uo}\\,R_L/(R_o+R_L)$。",
            `求 $R_o$ 时 $R_L$ 必须断开、$\\dot U_s$ 置零；测量法 $R_o=(U_o'/U_o-1)R_L$。`,
          ]}
        />
        <div className="mt-3">
          <PracticeLink topic="ce-rio" />
        </div>
      </Stage>
    </Section>
  );
}
