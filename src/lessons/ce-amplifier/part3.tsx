import { P, Rich, Tex, r } from "@/components/math/Tex";
import { Derivation } from "@/components/math/Derivation";
import { Callout } from "@/components/ui/primitives";
import { Bullets, Eq, PracticeLink, Question, Section, Stage } from "@/components/lesson/blocks";
import { MiniLab } from "@/components/lesson/widgets/MiniLab";
import { CESchematicStatic } from "@/components/circuit/CESchematicStatic";
import { acSteps, dcSteps } from "@/formulas/ce-steps";
import { analyzeCE } from "@/simulations/bjt/ce";
import { DEFAULT_CE, type CEParams } from "@/simulations/bjt/types";
import { formatSI, sig } from "@/simulations/units";
import { tn, tq } from "@/lib/tex";

const U = "ce-amplifier";

/* ═════════════════════ 8. 图解法、失真与最大不失真输出 ═════════════════════ */
export function SecDistortion() {
  const a = analyzeCE(DEFAULT_CE);
  return (
    <Section unitId={U} id="ce-distortion" n={8} title="图解法、失真与最大不失真输出">
      <Question n={14}>为什么静态工作点不合适会导致失真？</Question>

      <Stage kind="intuition" title="Q 点决定“上下的摆动空间”">
        <P>
          {r`晶体管只有在放大区才满足 $i_C=\beta i_B$。放大区下面是截止区（$i_B\le0$，$i_C\approx0$），左边是饱和区（$u_{CE}\le U_{CES}$）。信号让工作点在 Q 点附近来回移动——只要碰到任何一条边界，输出波形就被“削平”。Q 点离哪条边界近，哪一侧就先失真。`}
        </P>
      </Stage>

      <Stage kind="concept" title="交流负载线">
        <P>
          {r`有信号时，$C_2$ 把 $R_L$ 接到了集电极上（交流），所以集电极交流负载是 $R_L'=R_c\para R_L$ 而不是 $R_c$。工作点的移动轨迹满足 $u_{ce}=-i_cR_L'$，在输出特性上是一条**过 Q 点、斜率为 $-1/R_L'$ 的直线**，称为**交流负载线**。它比直流负载线更陡（$R_L'<R_c$）。`}
        </P>
        <Eq note={r`交流负载线与横轴交于 $U_{CEQ}+I_{CQ}R_L'$。射极有未旁路电阻 $R_e$ 时，斜率变为 $-1/\big(R_L'+\tfrac{1+\beta}{\beta}R_e\big)$。`}>{r`u_{CE}-U_{CEQ}=-(i_C-I_{CQ})\,R_L'`}</Eq>
      </Stage>

      <Stage kind="derivation" title="两种削波与最大不失真输出">
        <Derivation
          title="NPN 共射电路"
          steps={[
            {
              tex: r`i_C\ge0\ \Rightarrow\ u_o=-(i_C-I_{CQ})R_L'\le I_{CQ}R_L'`,
              why: "**截止**：$i_b$ 的负半周使 $i_B$ 降到 0 后，$i_C$ 不能再减小；对应 $u_o$ 的**正半周**被削平",
            },
            {
              tex: r`u_{CE}\ge U_{CES}\ \Rightarrow\ u_o=u_{CE}-U_{CEQ}\ge-(U_{CEQ}-U_{CES})`,
              why: "**饱和**：$i_b$ 的正半周使 $u_{CE}$ 降到 $U_{CES}$ 后，$i_C$ 不再随 $i_B$ 增大；对应 $u_o$ 的**负半周**被削平",
            },
            {
              tex: r`U_{om}=\min\left\{\,U_{CEQ}-U_{CES},\ \ I_{CQ}R_L'\,\right\}`,
              why: "正弦输出要上下都不削波，取两者较小值（射极交流接地时）",
              numeric: r`U_{om}=\min\{${tq(a.dc.UCEQ, "V")}-${tq(DEFAULT_CE.UCES, "V")},\ ${tq(a.dc.ICQ, "A")}\times${tq(a.ac.RLp, "Ω")}\}=${tq(a.ac.Uom, "V")}`,
            },
          ]}
          conclusion={r`当 $U_{CEQ}-U_{CES}=I_{CQ}R_L'$ 时，Q 点位于交流负载线可用部分的中点，$U_{om}$ 最大。本例 $I_{CQ}R_L'<U_{CEQ}-U_{CES}$，截止失真会先出现。`}
        />
        <Callout kind="myth" title="顶部还是底部？">
          <P>{r`**NPN 共射**：截止失真 → $u_o$ **顶部**削平；饱和失真 → $u_o$ **底部**削平。原因是输出与输入反相，而 $i_C$ 的“底”（截止）对应 $u_{CE}$ 的“顶”。PNP 管各电量极性相反，现象也相反。**不要背“顶/底”，要从 $u_{CE}=V_{CC}-i_CR_c$ 推出来。**`}</P>
        </Callout>
      </Stage>

      <Stage kind="visual" title="让 Q 点过低、过高">
        <P>{r`下面的实验初始处于截止失真（$R_b=1.2\,\mathrm{M\Omega}$，Q 点偏低）。观察：$u_o$ 正半周被削平；输出特性图上，动态轨迹（品红）在 $i_C=0$ 处被截断。然后把 $R_b$ 调到约 330 kΩ，再看饱和失真。`}</P>
        <MiniLab
          initial={{ ...DEFAULT_CE, Rb: 1.2e6, Rs: 5100, Usm: 0.1 }}
          keys={["Rb", "Usm", "RL"]}
          panels={["readouts", "scope", "char"]}
          title="截止失真 ↔ 饱和失真"
          footer="为了得到教材中“单边削波”的典型波形，这里串了 R_s = 5.1 kΩ，使基极电流接近正弦（见下方说明）。"
          testId="distortion-lab"
        />
        <Callout kind="assume" title="另一种失真：输入特性的非线性">
          <P>
            {r`教材的图解法假设 $i_b$ 是正弦。若信号源内阻很小、直接驱动 b–e，$u_{be}$ 是正弦而 $i_B\propto e^{u_{BE}/U_T}$ 不是：即使没有削波，输出的正、负半周也不对称（实验室中用 THD 衡量）。当 $|u_{be}|$ 与 $U_T\approx26\,\mathrm{mV}$ 可比时这种失真就很明显。增大 $R_s$ 或加入未旁路的 $R_e$ 都能改善它。`}
          </P>
        </Callout>
      </Stage>

      <Stage kind="analysis" title="如何消除">
        <Bullets
          items={[
            r`截止失真（Q 点偏低）：减小 $R_b$（固定偏置）使 $I_{BQ}$ 增大，Q 点上移。`,
            r`饱和失真（Q 点偏高）：增大 $R_b$ 使 Q 点下移；或减小 $R_c$（直流负载线变陡，$U_{CEQ}$ 增大）。`,
            "两侧同时削波：输入过大，应减小输入或提高 $V_{CC}$。",
          ]}
        />
      </Stage>

      <Stage kind="summary">
        <Bullets
          items={[
            "交流负载线过 Q 点，斜率 $-1/R_L'$；直流负载线斜率 $-1/R_c$。",
            "$U_{om}=\\min\\{U_{CEQ}-U_{CES},\\ I_{CQ}R_L'\\}$。",
            "NPN 共射：截止失真削顶、饱和失真削底。",
          ]}
        />
        <div className="mt-3">
          <PracticeLink topic="ce-distortion" />
        </div>
      </Stage>
    </Section>
  );
}

/* ═════════════════════ 9. 综合例题 ═════════════════════ */
const EX: CEParams = {
  ...DEFAULT_CE,
  topology: "divider",
  VCC: 15,
  Rb1: 10e3,
  Rb2: 40e3,
  Rc: 4.7e3,
  RL: 4.7e3,
  Re1: 200,
  Re2: 1.8e3,
  hasCe: true,
  beta: 80,
  rbb: 200,
  UBE: 0.7,
};

export function SecExample() {
  const a = analyzeCE(EX);
  const open = analyzeCE({ ...EX, hasCe: false });
  const est = a.dc.estimate!;
  return (
    <Section unitId={U} id="ce-example" n={9} title="综合例题">
      <Stage kind="example" title="例题 9-1：分压偏置 + 部分旁路的射极电阻">
        <P>
          {r`电路如图。已知 $V_{CC}=${tn(EX.VCC)}\,\mathrm V$，$R_{b1}=${tq(EX.Rb1, "Ω")}$（下），$R_{b2}=${tq(EX.Rb2, "Ω")}$（上），$R_c=R_L=${tq(EX.Rc, "Ω")}$，$R_{e1}=${tq(EX.Re1, "Ω")}$，$R_{e2}=${tq(EX.Re2, "Ω")}$（被 $C_e$ 旁路），$\beta=${tn(EX.beta)}$，$r_{bb'}=${tq(EX.rbb, "Ω")}$，$U_{BEQ}=0.7\,\mathrm V$，各电容对交流可视为短路。`}
        </P>
        <P>{r`(1) 求 Q 点；(2) 求 $\dot A_u$、$R_i$、$R_o$；(3) 若 $C_e$ 开路，哪些动态参数改变？如何改变？`}</P>
        <CESchematicStatic params={EX} />
      </Stage>

      <Stage kind="analysis" title="解题思路">
        <Bullets
          items={[
            "先直流后交流：画直流通路（电容开路）→ 求 Q 点并验证放大区 → 求 $r_{be}$。",
            "再画交流通路：$C_e$ 短路 → $R_{e2}$ 消失，$R_{e1}$ 保留；$V_{CC}$ 接地 → $R_{b1}\\para R_{b2}$ 并在输入端。",
            "射极有未旁路的 $R_{e1}$，**不能**直接用 $-\\beta R_L'/r_{be}$。",
          ]}
        />
      </Stage>

      <Stage kind="derivation" title="(1) 静态分析">
        <P>{r`**估算法**（考试常用）：$U_{BQ}\approx${tq(est.UBQ, "V")}$，$I_{EQ}\approx\dfrac{U_{BQ}-U_{BEQ}}{R_{e1}+R_{e2}}=${tq(est.IEQ, "A")}$，$U_{CEQ}\approx V_{CC}-I_{EQ}(R_c+R_{e1}+R_{e2})=${tq(est.UCEQ, "V")}$。条件检验：$(1+\beta)R_E/R_B=${sig(est.ratio, 3)}$，满足 ≥10。`}</P>
        <P>{r`**戴维南精确解**（下面的推导由计算核心实时生成）：`}</P>
        <Derivation title="静态（精确）" steps={dcSteps(a)} initiallyOpen={99} />
      </Stage>

      <Stage kind="derivation" title="(2) 动态分析">
        <Derivation title="动态（中频）" steps={acSteps(a)} initiallyOpen={1} />
      </Stage>

      <Stage kind="derivation" title="(3) C_e 开路">
        <P>{r`$C_e$ 开路后，$R_{e2}$ 也出现在交流通路中，射极交流电阻由 $R_{e1}$ 变为 $R_{e1}+R_{e2}$。Q 点不变（电容不影响直流）。`}</P>
        <div className="my-3 overflow-x-auto">
          <table className="w-full border-collapse text-[13.5px]" data-testid="ce-open-table">
            <thead>
              <tr className="border-b border-line text-left text-[12px] text-ink-3">
                <th className="py-1.5 pr-3 font-normal">参数</th>
                <th className="py-1.5 pr-3 font-normal">C_e 接入</th>
                <th className="py-1.5 pr-3 font-normal">C_e 开路</th>
                <th className="py-1.5 font-normal">变化</th>
              </tr>
            </thead>
            <tbody className="num">
              <tr className="border-b border-line-2">
                <td className="py-1.5 pr-3">
                  <Rich text={r`$\dot A_u$`} />
                </td>
                <td className="pr-3">{sig(a.ac.Au, 4)}</td>
                <td className="pr-3">{sig(open.ac.Au, 4)}</td>
                <td className="font-sans">|A_u| 减小（≈ −R_L′/(R_e1+R_e2) = {sig(-a.ac.RLp / (EX.Re1 + EX.Re2), 3)}）</td>
              </tr>
              <tr className="border-b border-line-2">
                <td className="py-1.5 pr-3">
                  <Rich text="$R_i$" />
                </td>
                <td className="pr-3">{formatSI(a.ac.Ri, "Ω")}</td>
                <td className="pr-3">{formatSI(open.ac.Ri, "Ω")}</td>
                <td className="font-sans">增大（趋近 R_b1∥R_b2 = {formatSI(a.dc.RB, "Ω")}）</td>
              </tr>
              <tr className="border-b border-line-2">
                <td className="py-1.5 pr-3">
                  <Rich text="$R_o$" />
                </td>
                <td className="pr-3">{formatSI(a.ac.Ro, "Ω")}</td>
                <td className="pr-3">{formatSI(open.ac.Ro, "Ω")}</td>
                <td className="font-sans">基本不变（≈ R_c）</td>
              </tr>
            </tbody>
          </table>
        </div>
        <Tex block>{r`\dot A_u'=-\frac{\beta R_L'}{r_{be}+(1+\beta)(R_{e1}+R_{e2})}=-\frac{${tn(EX.beta)}\times${tq(a.ac.RLp, "Ω")}}{${tq(a.ac.rbe, "Ω")}+${tn(1 + EX.beta)}\times${tq(EX.Re1 + EX.Re2, "Ω")}}=${tn(open.ac.Au, 4)}`}</Tex>
      </Stage>

      <Stage kind="practice">
        <P>{r`练习中心的 Level 3 题目由同一套生成器随机给出参数，每题都有分步提示和自动判题。`}</P>
        <PracticeLink topic="ce-example" label="做综合题（Level 3）" />
      </Stage>
    </Section>
  );
}

/* ═════════════════════ 10. 总结 ═════════════════════ */
export function SecSummary() {
  return (
    <Section unitId={U} id="ce-summary" n={10} title="总结与易错点">
      <Stage kind="summary" title="分析放大电路的标准流程">
        <ol className="list-decimal space-y-1 pl-5">
          {[
            "画**直流通路**（电容开路、交流源置零）→ 用 KVL 求 $I_{BQ}$、$I_{CQ}$、$U_{CEQ}$ → **验证放大区**。",
            "求 $r_{be}=r_{bb'}+(1+\\beta)U_T/I_{EQ}$。",
            "画**交流通路**（中频：电容短路、$V_{CC}$ 接地）。",
            "画**微变等效电路**（b–e 换 $r_{be}$，c–e 换 $\\beta\\dot I_b$）。",
            "由等效电路列方程求 $\\dot A_u$、$R_i$、$R_o$（有未旁路 $R_e$ 时重新推导）。",
            "需要时用负载线检查失真与 $U_{om}$。",
          ].map((t, i) => (
            <li key={i}>
              <Rich text={t} />
            </li>
          ))}
        </ol>
      </Stage>
      <Stage kind="summary" title="核心公式（射极交流接地的固定偏置共射电路）">
        <Eq>{r`I_{BQ}=\frac{V_{CC}-U_{BEQ}}{R_b},\quad I_{CQ}=\beta I_{BQ},\quad U_{CEQ}=V_{CC}-I_{CQ}R_c`}</Eq>
        <Eq>{r`r_{be}=r_{bb'}+(1+\beta)\frac{U_T}{I_{EQ}},\quad \dot A_u=-\frac{\beta R_L'}{r_{be}},\quad R_i=R_b\para r_{be},\quad R_o\approx R_c`}</Eq>
        <Eq>{r`U_{om}=\min\{U_{CEQ}-U_{CES},\ I_{CQ}R_L'\},\qquad \dot A_{us}=\frac{R_i}{R_s+R_i}\dot A_u`}</Eq>
      </Stage>
      <Stage kind="summary" title="易错点清单">
        <Bullets
          items={[
            "用 $r_{be}$ 去算 Q 点（错：$r_{be}$ 是动态电阻）。",
            "交流通路里把 $V_{CC}$ “拆掉”而不是接地，导致漏掉 $R_b$、$R_c$ 的并联关系。",
            "有未旁路 $R_e$ 时仍套用 $-\\beta R_L'/r_{be}$。",
            "求 $R_o$ 时把 $R_L$ 也并进去（错：$R_o$ 的定义要求断开负载）。",
            "求 $R_i$ 时把 $R_s$ 算进去（错：$R_i$ 不含信号源内阻）。",
            "$\\dot A_u$ 漏掉负号；或把 $R_L'$ 写成 $R_c$。",
            "NPN 共射失真的“顶/底”记反。",
            "不验证工作区：$U_{CEQ}<U_{CES}$ 时 $I_{CQ}\\ne\\beta I_{BQ}$。",
          ]}
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <PracticeLink topic="ce" label="全部共射练习" />
        </div>
      </Stage>
    </Section>
  );
}
