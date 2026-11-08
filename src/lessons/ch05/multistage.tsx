import { P, r, Tex } from "@/components/math/Tex";
import { Derivation } from "@/components/math/Derivation";
import { Callout } from "@/components/ui/primitives";
import { Bullets, Eq, PracticeLink, Question, Section, Stage, VarTable } from "@/components/lesson/blocks";
import { CECCDemo, CouplingDemo, DirectLevelDemo, DriftDemo, LoadingDemo } from "@/components/lesson/widgets/ch05/MultistageWidgets";
import { BlockCascade, CECCAmp, Direct2CE } from "@/components/circuit/diagrams/ch05";
import { LessonArticle, LessonHeader } from "@/lessons/shared/LessonHeader";
import { analyzeCE } from "@/simulations/bjt/ce";
import { DEFAULT_CC } from "@/simulations/bjt/stages";
import { DEFAULT_DIVIDER, type CEParams } from "@/simulations/bjt/types";
import { analyzeCECC, analyzeCECE, inputReferredDrift } from "@/simulations/multistage/cascade";
import { tq, tn } from "@/lib/tex";
import { atTemperature } from "@/simulations/bjt/device";

const CE1: CEParams = { ...DEFAULT_DIVIDER, Re1: 0, Re2: 1.2e3, hasCe: true };

/* ════════════════════ 耦合方式 ════════════════════ */
export function CouplingLesson() {
  const U = "multistage-coupling";
  return (
    <LessonArticle unitId={U}>
      <LessonHeader unitId={U} path="单级增益不够 → 多级级联 → 怎样把前级的输出“交给”后级：阻容耦合、直接耦合、变压器耦合、光电耦合，各自的优缺点。" />

      <Section unitId={U} id="mcp-rc" n={1} title="阻容耦合">
        <Question n={1}>阻容耦合为什么不能放大缓慢变化的信号？</Question>
        <Stage kind="concept" title="电容隔直通交">
          <P>{r`前级输出经耦合电容接到后级输入。电容隔断直流：**各级静态工作点相互独立**，可以分别设计，这是阻容耦合最大的优点。但电容对低频信号的容抗很大，频率越低衰减越多；对直流则完全不通。`}</P>
          <Eq note={r`$R_{o1}$：前级输出电阻；$R_{i2}$：后级输入电阻。频率远高于 $f_L$ 时电容可视为短路。`}>{r`f_L=\frac{1}{2\pi C(R_{o1}+R_{i2})}`}</Eq>
          <Bullets items={[r`优点：Q 点独立；体积小、成本低。`, r`缺点：低频特性差，不能放大直流和缓慢变化的信号；大电容无法集成，所以集成电路内部不用阻容耦合。`]} />
        </Stage>
        <Stage kind="visual" title="方波通过耦合电容">
          <CouplingDemo />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`阻容耦合：静态独立、低频差、不能集成。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="mcp-direct" n={2} title="直接耦合与电平配合">
        <Question n={2}>直接耦合时前后级的静态工作点为什么会互相影响？</Question>
        <Stage kind="analysis" title="没有电容，直流也直通">
          <Direct2CE caption="直接耦合两级共射：第一级的集电极电位就是第二级的基极电位。" />
          <P>{r`直接耦合能放大直流和缓慢变化的信号，低频特性好，便于集成。代价有二：(1) **静态工作点相互牵连**，必须一起设计（电平配合）；(2) 前级的任何缓慢变化（温度、电源波动）都会被后级当作信号放大——**零点漂移**（见本章第 3 单元）。`}</P>
        </Stage>
        <Stage kind="visual" title="电平配合">
          <DirectLevelDemo />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`直接耦合：低频特性好、易集成；Q 点互相影响、存在零点漂移。`, r`常用电平移位：射极接稳压管/二极管、NPN 与 PNP 管交替使用。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="mcp-other" n={3} title="变压器耦合与光电耦合">
        <Question n={3}>光电耦合解决了什么问题？</Question>
        <Stage kind="concept" title="对照">
          <VarTable
            rows={[
              ["阻容耦合", "Q 点独立；低频差；不能集成", "分立元件交流放大"],
              ["直接耦合", "可放大直流；易集成；有零点漂移", "集成运放、直流放大"],
              ["变压器耦合", r`Q 点独立；可实现阻抗变换（$R_L'=n^2R_L$）；笨重、低频和高频都差`, "早期功放、高频调谐放大"],
              ["光电耦合", "输入、输出电气隔离（地线不相连）；抗干扰", "强电与弱电之间、数字隔离"],
            ]}
          />
          <P>{r`光电耦合器由发光二极管和光敏三极管组成：电信号 → 光 → 电信号。两侧没有电的联系，可以隔离高压、切断地线环路，常见于工业控制和开关电源反馈回路。`}</P>
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`选择耦合方式要看：要不要放大直流？要不要集成？要不要电气隔离？`]} />
          <div className="mt-3">
            <PracticeLink topic={U} label="去做本单元练习" />
          </div>
        </Stage>
      </Section>
    </LessonArticle>
  );
}

/* ════════════════════ 多级放大电路的动态分析 ════════════════════ */
export function MultistageAnalysisLesson() {
  const U = "multistage-analysis";
  const t = analyzeCECE(CE1, CE1, 3e3);
  const cc = { ...DEFAULT_CC, topology: "divider" as const, Rb1: 100e3, Rb2: 100e3, Re: 2e3 };
  const two = analyzeCECC(CE1, cc, 200);
  const one = analyzeCE({ ...CE1, RL: 200 });
  return (
    <LessonArticle unitId={U}>
      <LessonHeader unitId={U} path={r`每级用 $(A_{uo},R_i,R_o)$ 描述 → 后级 $R_i$ 是前级负载、前级 $R_o$ 是后级信号源内阻 → $A_u=\prod A_{uk}$（带载）→ $R_i=R_{i1}$、$R_o=R_{on}$ → 共射–共集例题。`} />

      <Section unitId={U} id="ma-load" n={1} title="级间负载效应">
        <Question n={1}>为什么不能把各级单独算出的增益直接相乘？</Question>
        <Stage kind="concept" title="二端口模型">
          <BlockCascade caption={r`每一级放大电路都可以等效为：输入端一个电阻 $R_i$，输出端一个受控电压源 $A_{uo}\dot U_i$ 串联 $R_o$（戴维南等效）。`} />
          <Derivation
            title="两级级联"
            steps={[
              { tex: r`\dot U_{o1}=\dot A_{uo1}\dot U_{i1}\frac{R_{i2}}{R_{o1}+R_{i2}}=\dot A_{u1}\dot U_{i1}`, why: "第一级的输出电压被 $R_{o1}$ 与 $R_{i2}$ 分压：$R_{i2}$ 就是第一级的负载" },
              { tex: r`\dot U_{i2}=\dot U_{o1}`, why: "前级输出即后级输入" },
              { tex: r`\dot A_u=\frac{\dot U_o}{\dot U_i}=\dot A_{u1}\dot A_{u2}`, why: "各级**带载**增益相乘" },
            ]}
            conclusion={r`空载增益 $\dot A_{uo1}$ 只有在 $R_{i2}\gg R_{o1}$ 时才近似等于带载增益。两级共射电路中 $R_{i2}$ 与 $R_{o1}=R_c$ 同数量级，第一级增益通常下降一半以上。`}
          />
        </Stage>
        <Stage kind="visual" title="负载效应有多大">
          <LoadingDemo />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`算第 $k$ 级增益时，负载取 $R_{ck}\para R_{i(k+1)}$。`, r`算第 $k$ 级输出电阻时（如共集级），信号源内阻取 $R_{o(k-1)}$。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="ma-gain" n={2} title="总增益与输入输出电阻">
        <Question n={2}>{r`多级电路的 $R_i$、$R_o$ 由哪一级决定？`}</Question>
        <Stage kind="concept" title="三条结论">
          <Eq label="5.1" note={r`$\dot A_{uk}$ 是第 $k$ 级接上后级（或负载）后的电压放大倍数。`}>{r`\dot A_u=\dot A_{u1}\dot A_{u2}\cdots\dot A_{un},\qquad R_i=R_{i1},\qquad R_o=R_{on}`}</Eq>
          <Callout kind="warn">
            <P>{r`$R_i=R_{i1}$ 时要注意：若第一级是共集电路，它的 $R_{i1}$ 与其负载（即第二级的 $R_{i2}$）有关；$R_o=R_{on}$ 时，若末级是共集电路，它的 $R_{on}$ 与前一级的输出电阻有关。`}</P>
          </Callout>
        </Stage>
        <Stage kind="example" title="例题 5-1：两级分压偏置共射">
          <P>{r`两级完全相同（$V_{CC}$=12 V，$R_{b1}$=10 kΩ，$R_{b2}$=33 kΩ，$R_c$=3 kΩ，$R_e$=1.2 kΩ 全旁路，β=100），$R_L$=3 kΩ。`}</P>
          <Tex block>{r`R_{i2}=${tq(t.Ri2, "Ω")},\quad \dot A_{u1}=${tn(t.A1)}\ (\text{空载为 }${tn(t.A1open)}),\quad \dot A_{u2}=${tn(t.A2)},\quad \dot A_u=${tn(t.Au)}`}</Tex>
          <P>{r`两级共射的总增益为正（反相两次），$R_i=${tq(t.Ri, "Ω")}$，$R_o\approx R_{c2}=${tq(t.Ro, "Ω")}$。`}</P>
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`总增益 = 各级带载增益之积；相位：每级共射反相一次。`, r`$R_i$ 看第一级，$R_o$ 看末级。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="ma-example" n={3} title="例题：共射–共集两级放大">
        <Question n={3}>加一级射极跟随器为什么能提高带载能力？</Question>
        <Stage kind="analysis" title="电路">
          <CECCAmp caption="共射–共集两级放大电路：共射级提供电压增益，共集级降低输出电阻。" />
          <Derivation
            title="分析顺序：从后往前求输入电阻，从前往后求输出电阻"
            steps={[
              { tex: r`R_{i2}=R_{b3}\para R_{b4}\para[r_{be2}+(1+\beta)(R_{e2}\para R_L)]`, why: "第二级（共集）的输入电阻，含负载 $R_L$" },
              { tex: r`\dot A_{u1}=-\frac{\beta(R_{c1}\para R_{i2})}{r_{be1}}`, why: "第一级的负载是 $R_{c1}\\para R_{i2}$" },
              { tex: r`R_o=R_{e2}\para\frac{r_{be2}+R_{c1}\para R_{b3}\para R_{b4}}{1+\beta}`, why: "第二级的信号源内阻是第一级的输出电阻 $R_{c1}$" },
            ]}
            conclusion={r`$R_L=200\,\Omega$ 时：单级共射 $\dot A_u=${tn(one.ac.Au)}$；共射–共集 $\dot A_u=${tn(two.Au)}$（$\dot A_{u1}=${tn(two.A1)}$、$\dot A_{u2}=${tn(two.A2)}$），$R_o=${tq(two.Ro, "Ω")}$。`}
          />
        </Stage>
        <Stage kind="visual" title="改变负载试试">
          <CECCDemo />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`共集级的作用：用高 $R_i$ 减轻前级负担，用低 $R_o$ 驱动重负载。`, r`常见组合：共射–共集（输出级）、共集–共射（高输入电阻）、共射–共基（宽带）。`]} />
          <div className="mt-3">
            <PracticeLink topic={U} label="去做本单元练习" />
          </div>
        </Stage>
      </Section>
    </LessonArticle>
  );
}

/* ════════════════════ 零点漂移 ════════════════════ */
export function ZeroDriftLesson() {
  const U = "zero-drift";
  const dU = atTemperature({ beta: 100, UBE: 0.7, ICBO: 0 }, 35).UBE - 0.7;
  const d = inputReferredDrift([dU, dU, dU], [-50, -50, 10]);
  return (
    <LessonArticle unitId={U}>
      <LessonHeader unitId={U} path="直接耦合 → 输入为零而输出缓慢变化 → 来源：温度（温漂）、电源、器件老化 → 折合到输入端 → 第一级最关键 → 用差分放大电路抑制。" />

      <Section unitId={U} id="zd-what" n={1} title="什么是零点漂移">
        <Question n={1}>输入为零时输出为什么会缓慢变化？</Question>
        <Stage kind="concept" title="现象">
          <P>{r`把直接耦合放大电路的输入端短路（$u_I=0$），用直流电压表测输出，会看到输出电压偏离静态值并缓慢地“漂”来“漂”去。这种现象称为**零点漂移**（zero drift）。其主要原因是温度变化引起的晶体管参数变化（$U_{BE}$、$\beta$、$I_{CBO}$），所以也叫**温度漂移**。`}</P>
          <P>{r`阻容耦合电路中，各级 Q 点的缓慢变化被耦合电容隔断，只影响本级；直接耦合电路中，第一级 Q 点的微小变化会和信号一样被逐级放大，在输出端可能达到几伏，淹没真正的信号。`}</P>
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`零点漂移 = 输入为零时输出的缓慢变化；主要来源是温度。`, r`只有直接耦合电路才有严重的零点漂移问题。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="zd-cause" n={2} title="温漂的来源与折合到输入端">
        <Question n={2}>为什么第一级的漂移最要紧？</Question>
        <Stage kind="derivation" title="折合到输入端">
          <Derivation
            title="三级电路"
            steps={[
              { tex: r`\Delta u_O=\Delta u_1A_1A_2A_3+\Delta u_2A_2A_3+\Delta u_3A_3`, why: "第 $k$ 级在自身输入端等效的漂移电压为 $\\Delta u_k$，被后面各级放大" },
              { tex: r`\Delta u_{I(\text{等效})}=\frac{\Delta u_O}{A_1A_2A_3}=\Delta u_1+\frac{\Delta u_2}{A_1}+\frac{\Delta u_3}{A_1A_2}`, why: "除以总增益，折合到输入端" },
            ]}
            conclusion={r`后级的漂移被前级增益“除掉”了，**第一级的漂移几乎决定一切**。衡量放大电路的温漂，应看折合到输入端的值（如 µV/°C），而不是输出端的值（总增益不同就无法比较）。例：三级各漂 −22 mV（温度升高 10 °C），增益 −50、−50、10 时，输出漂移 ${tq(d.output, "V")}，折合到输入端 ${tq(d.input, "V")}。`}
          />
        </Stage>
        <Stage kind="visual" title="每一级各贡献多少">
          <DriftDemo />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`温漂指标看折合到输入端的值。`, r`抑制温漂的重点在输入级。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="zd-fix" n={3} title="抑制零点漂移的方法">
        <Question n={3}>为什么差分放大电路能抑制温漂？</Question>
        <Stage kind="concept" title="三类措施">
          <Bullets
            items={[
              r`**引入直流负反馈**：如射极电阻 $R_e$（第 3 章），稳定每一级的 Q 点。`,
              r`**温度补偿**：用热敏元件（二极管、热敏电阻）产生相反的温度变化来抵消。`,
              r`**差分放大电路**：用两只特性相同的管子组成对称电路，取两管输出之差。温度变化对两管的影响相同（**共模**），相减后相互抵消，而有用信号使两管反向变化（**差模**），相减后加倍。这是集成运放输入级的标准结构（第 6 章）。`,
            ]}
          />
          <Callout kind="key">
            <P>{r`“对称 + 相减”是差分电路的核心思想：凡是同时、同向作用于两管的变化（温度、电源波动、外界干扰）都会被抵消。`}</P>
          </Callout>
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`单级：负反馈、温度补偿；输入级：差分放大电路。`]} />
          <div className="mt-3">
            <PracticeLink topic={U} label="去做本单元练习" />
          </div>
        </Stage>
      </Section>
    </LessonArticle>
  );
}
