import { P, r, Tex } from "@/components/math/Tex";
import { Derivation } from "@/components/math/Derivation";
import { Callout } from "@/components/ui/primitives";
import { Bullets, Eq, PracticeLink, Question, Section, Stage, VarTable } from "@/components/lesson/blocks";
import { ChannelDemo, CSLab, FETConfigCompare, GmDemo, MOSOutput, TransferCurves } from "@/components/lesson/widgets/ch04/FETWidgets";
import { CDAmp, CGAmp, CSAmp, FETSymbols } from "@/components/circuit/diagrams/ch04";
import { LessonArticle, LessonHeader } from "@/lessons/shared/LessonHeader";
import { analyzeCD, analyzeCG, analyzeCS, DEFAULT_CS, DEFAULT_CS_SELF, DEFAULT_NENH, gmTextbook, outputResistance, transconductance } from "@/simulations/fet/mos";
import { tq, tn } from "@/lib/tex";
import { par } from "@/simulations/units";

/* ════════════════════ MOSFET 结构 ════════════════════ */
export function MOSStructureLesson() {
  const U = "mos-structure";
  return (
    <LessonArticle unitId={U}>
      <LessonHeader unitId={U} path="金属–氧化物–半导体结构 → 栅压感应出反型层（导电沟道）→ 开启电压 → 增强型/耗尽型、N 沟道/P 沟道、结型 → 与晶体管比较。" />

      <Section unitId={U} id="ms-struct" n={1} title="MOSFET 的结构与沟道形成">
        <Question n={1}>栅极电压是怎样“感应”出导电沟道的？</Question>
        <Stage kind="intuition" title="电容的一块极板是半导体">
          <P>{r`MOS（metal–oxide–semiconductor）场效应管的栅极与衬底之间隔着一层极薄的 SiO₂ 绝缘层，构成一个电容。以 N 沟道增强型为例：衬底是 P 型，源区、漏区是两块高掺杂的 N⁺ 区。栅极加正电压后，电场把衬底表面的空穴推开、把少子电子吸引过来。$u_{GS}$ 足够大时，表面的电子浓度超过空穴，P 型表面“反型”成 N 型薄层——它把源区和漏区连通，形成**导电沟道**。`}</P>
          <P>{r`使沟道刚好形成的栅源电压称为**开启电压** $U_{GS(th)}$。$u_{GS}$ 越大，沟道越厚，导电能力越强——这就是“用电场控制电流”，也是“场效应”名称的由来。栅极与沟道之间是绝缘的，栅极电流几乎为零（输入电阻可达 $10^9\,\Omega$ 以上）。`}</P>
        </Stage>
        <Stage kind="visual" title="感应沟道与预夹断">
          <ChannelDemo />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`$u_{GS}>U_{GS(th)}$ 才有沟道（增强型）。`, r`栅极绝缘，$i_G\approx0$，输入电阻极大。`, r`$u_{DS}$ 使沟道漏端变薄，$u_{GD}=U_{GS(th)}$ 时预夹断。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="ms-types" n={2} title="增强型、耗尽型与结型场效应管">
        <Question n={2}>怎样从符号区分各类场效应管？</Question>
        <Stage kind="concept" title="分类">
          <FETSymbols caption="符号中：沟道画成虚线 = 增强型（$u_{GS}=0$ 时无沟道）；实线 = 耗尽型；衬底箭头指向沟道 = N 沟道。结型管栅极箭头由 P 指向 N。" />
          <VarTable
            rows={[
              ["N 沟道增强型 MOS", r`$U_{GS(th)}>0$`, r`$u_{GS}>U_{GS(th)}$ 才导通`],
              ["N 沟道耗尽型 MOS", r`$U_{GS(off)}<0$`, r`制造时已有沟道；$u_{GS}$ 可正可负，负到 $U_{GS(off)}$ 夹断`],
              ["N 沟道结型（JFET）", r`$U_{GS(off)}<0$`, r`用反偏 PN 结的耗尽层宽度控制沟道；只能 $u_{GS}\le0$`],
              ["P 沟道各型", "电压、电流方向全部相反", r`如 P 沟道增强型 $U_{GS(th)}<0$`],
            ]}
          />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`增强型：开启电压 $U_{GS(th)}$；耗尽型、结型：夹断电压 $U_{GS(off)}$。`, r`自给偏压只能用于耗尽型和结型（需要 $u_{GS}=0$ 时已有电流）。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="ms-compare" n={3} title="场效应管与晶体管的比较">
        <Question n={3}>为什么说 FET 是电压控制器件？</Question>
        <Stage kind="concept" title="对照">
          <VarTable
            rows={[
              ["控制方式", r`BJT：基极**电流**控制集电极电流（$i_C=\beta i_B$）`, r`FET：栅源**电压**控制漏极电流，$i_G\approx0$`],
              ["载流子", "BJT：电子与空穴都参与（双极型）", "FET：只有多子参与导电（单极型）"],
              ["输入电阻", r`BJT：$r_{be}$，千欧级`, r`FET：$10^7\sim10^{12}\,\Omega$`],
              ["温度稳定性", "BJT：少子参与，受温度影响大", "FET：多子导电，温度稳定性好"],
              ["放大能力", r`BJT：$g_m=I_C/U_T$，较大`, r`FET：$g_m\propto\sqrt{I_D}$，同样电流下较小`],
              ["集成", "—", "MOS 工艺简单、功耗低，是大规模集成电路的主体"],
            ]}
          />
          <Callout kind="warn">
            <P>{r`MOS 管栅极绝缘层极薄，感应电荷不易泄放，静电容易击穿栅氧化层。存放时应将三个电极短接，焊接时烙铁要接地。`}</P>
          </Callout>
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`FET：电压控制、输入电阻大、噪声低、温度稳定性好；BJT：跨导大、放大能力强。`]} />
          <div className="mt-3">
            <PracticeLink topic={U} label="去做本单元练习" />
          </div>
        </Stage>
      </Section>
    </LessonArticle>
  );
}

/* ════════════════════ 转移特性与输出特性 ════════════════════ */
export function MOSCurvesLesson() {
  const U = "mos-curves";
  return (
    <LessonArticle unitId={U}>
      <LessonHeader unitId={U} path="转移特性（平方律）→ 输出特性（预夹断轨迹分开可变电阻区与恒流区）→ 由 $u_{GS}$、$u_{DS}$ 判断工作区。" />

      <Section unitId={U} id="mv-transfer" n={1} title="转移特性">
        <Question n={1}>{r`$U_{GS(th)}$ 与 $I_{DO}$ 在转移特性上怎样体现？`}</Question>
        <Stage kind="concept" title="平方律">
          <Eq label="4.1" note={r`增强型，恒流区。$I_{DO}$ 是 $u_{GS}=2U_{GS(th)}$ 时的 $i_D$。`}>{r`i_D=I_{DO}\left(\frac{u_{GS}}{U_{GS(th)}}-1\right)^2\qquad(u_{GS}>U_{GS(th)})`}</Eq>
          <Eq label="4.2" note={r`耗尽型 MOS 与结型 FET，恒流区。$I_{DSS}$ 是 $u_{GS}=0$ 时的漏极饱和电流。`}>{r`i_D=I_{DSS}\left(1-\frac{u_{GS}}{U_{GS(off)}}\right)^2\qquad(U_{GS(off)}<u_{GS}\le0\ \text{（结型）})`}</Eq>
          <P>{r`两式都可以写成统一形式 $i_D=K(u_{GS}-U_T)^2$，其中 $U_T$ 为开启或夹断电压，$K=I_{DO}/U_{GS(th)}^2$ 或 $I_{DSS}/U_{GS(off)}^2$。这是一条抛物线：电流与“栅压超出门槛的部分”的平方成正比。`}</P>
        </Stage>
        <Stage kind="visual" title="四种管子的转移特性">
          <TransferCurves />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`转移特性只在恒流区有意义。`, r`平方律是理想模型；短沟道器件会偏离（不在本课程范围）。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="mv-output" n={2} title="输出特性与三个工作区">
        <Question n={2}>FET 的“饱和区”与 BJT 的饱和区有什么不同？</Question>
        <Stage kind="concept" title="三个区">
          <VarTable
            rows={[
              ["截止区（夹断区）", r`$u_{GS}\le U_{GS(th)}$（增强型）`, r`无沟道，$i_D\approx0$`],
              ["可变电阻区", r`$u_{GS}>U_{GS(th)}$，$u_{DS}<u_{GS}-U_{GS(th)}$`, r`$i_D=K[2(u_{GS}-U_{GS(th)})u_{DS}-u_{DS}^2]$；$u_{DS}$ 很小时 d–s 间相当于受 $u_{GS}$ 控制的电阻`],
              ["恒流区（饱和区）", r`$u_{DS}\ge u_{GS}-U_{GS(th)}$`, r`沟道预夹断，$i_D$ 基本只由 $u_{GS}$ 决定——**放大区**`],
            ]}
          />
          <Callout kind="myth">
            <P>{r`FET 的“饱和区”= 电流饱和（不再随 $u_{DS}$ 增大）= 放大区；BJT 的“饱和区”= 两个结都正偏、失去放大作用。二者名字相同、含义相反。本站统一称 FET 的放大区为“恒流区”。`}</P>
          </Callout>
        </Stage>
        <Stage kind="visual" title="输出特性与工作点">
          <MOSOutput />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`预夹断轨迹 $u_{DS}=u_{GS}-U_{GS(th)}$ 是可变电阻区与恒流区的分界。`, r`放大电路的 Q 点必须在恒流区。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="mv-judge" n={3} title="判断工作区">
        <Question n={3}>{r`怎样由 $u_{GS}$、$u_{DS}$ 判断 MOS 管的工作区？`}</Question>
        <Stage kind="derivation" title="两步判断（N 沟道增强型）">
          <Derivation
            title="判断步骤"
            steps={[
              { tex: r`u_{GS}\le U_{GS(th)}\ \Rightarrow\ \text{截止}`, why: "沟道未形成" },
              { tex: r`u_{GS}>U_{GS(th)}:\ u_{DS}\ge u_{GS}-U_{GS(th)}\ \Rightarrow\ \text{恒流区}`, why: "等价于 $u_{GD}\\le U_{GS(th)}$：漏端沟道已夹断" },
              { tex: r`u_{DS}<u_{GS}-U_{GS(th)}\ \Rightarrow\ \text{可变电阻区}`, why: "整条沟道都存在" },
            ]}
            conclusion={r`耗尽型、结型把 $U_{GS(th)}$ 换成 $U_{GS(off)}$；P 沟道管所有不等号反向（或先把电压取反再按 N 沟道判断）。`}
          />
        </Stage>
        <Stage kind="example" title="例题 4-1">
          <P>{r`N 沟道增强型 MOS 管 $U_{GS(th)}=2$ V。(1) $U_{GS}=5$ V、$U_{DS}=6$ V：$5>2$ 且 $6\ge5-2$，恒流区；(2) $U_{GS}=5$ V、$U_{DS}=1$ V：$1<3$，可变电阻区；(3) $U_{GS}=1.5$ V：截止。`}</P>
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`先看栅压是否超过门槛，再比较 $u_{DS}$ 与 $u_{GS}-U_T$。`]} />
          <div className="mt-3">
            <PracticeLink topic={U} label="去做本单元练习" />
          </div>
        </Stage>
      </Section>
    </LessonArticle>
  );
}

/* ════════════════════ 跨导与小信号模型 ════════════════════ */
export function FETSmallSignalLesson() {
  const U = "fet-small-signal";
  const ID = 1e-3;
  const gm = transconductance(DEFAULT_NENH, ID);
  const rds = outputResistance({ ...DEFAULT_NENH, lambda: 0.02 }, ID);
  return (
    <LessonArticle unitId={U}>
      <LessonHeader unitId={U} path={r`恒流区线性化 → 跨导 $g_m=\partial i_D/\partial u_{GS}$ → 低频小信号模型（栅极开路 + 受控电流源 $g_m\dot U_{gs}$）→ 沟道长度调制与 $r_{ds}$。`} />

      <Section unitId={U} id="fs-gm" n={1} title="跨导 g_m">
        <Question n={1}>怎样由 Q 点求跨导？</Question>
        <Stage kind="derivation" title="对转移特性求导">
          <Derivation
            title="g_m"
            steps={[
              { tex: r`g_m=\frac{\partial i_D}{\partial u_{GS}}\Big|_Q`, why: "定义：转移特性在 Q 点的切线斜率（与 $r_{be}$ 是输入特性切线斜率的倒数同理）", units: "A/V = S（西门子）" },
              { tex: r`i_D=I_{DO}\left(\frac{u_{GS}}{U_{GS(th)}}-1\right)^2\ \Rightarrow\ g_m=\frac{2I_{DO}}{U_{GS(th)}}\left(\frac{U_{GSQ}}{U_{GS(th)}}-1\right)`, why: "对式 (4.1) 求导" },
              { tex: r`g_m=\frac{2}{U_{GS(th)}}\sqrt{I_{DO}I_{DQ}}`, why: "用 $I_{DQ}$ 消去 $U_{GSQ}$" },
            ]}
            conclusion={r`$U_{GS(th)}=2$ V、$I_{DO}=2$ mA 的管子在 $I_{DQ}=1$ mA 时 $g_m=${tn(gmTextbook(DEFAULT_NENH, ID) * 1e3)}$ mS。耗尽型/结型：$g_m=-\dfrac{2I_{DSS}}{U_{GS(off)}}\left(1-\dfrac{U_{GSQ}}{U_{GS(off)}}\right)=\dfrac{2}{|U_{GS(off)}|}\sqrt{I_{DSS}I_{DQ}}$。`}
          />
        </Stage>
        <Stage kind="visual" title="切线斜率">
          <GmDemo />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`$g_m$ 随 Q 点变化，$\propto\sqrt{I_{DQ}}$。`, r`单位 mS（mA/V）。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="fs-model" n={2} title="低频小信号模型">
        <Question n={2}>为什么栅极可以看作开路？</Question>
        <Stage kind="concept" title="电压控制电流源">
          <Eq label="4.3" note={r`栅极绝缘（MOS）或 PN 结反偏（JFET），$\dot I_g\approx0$，所以 g–s 之间开路；d–s 之间是受 $\dot U_{gs}$ 控制的电流源（VCCS）。`}>{r`\dot I_d=g_m\dot U_{gs}\quad(+\ \dot U_{ds}/r_{ds})`}</Eq>
          <P>{r`对照 BJT 的 h 参数模型：b–e 间有 $r_{be}$，c–e 间是电流控制电流源 $\beta\dot I_b$。BJT 也可以写成 VCCS 形式：$\beta\dot I_b=\frac{\beta}{r_{be}}\dot U_{be}$，即 BJT 的“跨导”约为 $\beta/r_{be}\approx I_{CQ}/U_T$——同样电流下比 MOS 管大得多。`}</P>
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`FET 小信号模型：g–s 开路，d–s 间电流源 $g_m\dot U_{gs}$（并 $r_{ds}$）。`, r`适用条件：恒流区、低频、小信号。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="fs-rds" n={3} title="沟道长度调制与 r_ds">
        <Question n={3}>输出特性为什么不是完全水平的？</Question>
        <Stage kind="concept" title="有效沟道变短">
          <P>{r`预夹断后 $u_{DS}$ 继续增大，夹断点向源极移动，有效沟道长度略微缩短，电流略有增加：$i_D=K(u_{GS}-U_T)^2(1+\lambda u_{DS})$。$\lambda$ 称为沟道长度调制系数。由此得到漏–源间的小信号电阻 $r_{ds}=\dfrac{\partial u_{DS}}{\partial i_D}\approx\dfrac1{\lambda I_{DQ}}$。例如 $\lambda=0.02\,\mathrm V^{-1}$、$I_{DQ}=1$ mA 时 $r_{ds}=${tq(rds, "Ω")}$，一般远大于漏极负载电阻，常可忽略。`}</P>
          <P>{r`本单元的小信号模型 $g_m=${tn(gm * 1e3)}$ mS 将在“共源放大电路”中使用。`}</P>
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`$r_{ds}\approx1/(\lambda I_{DQ})$，与 BJT 的 $r_{ce}$（Early 效应）对应。`, r`$r_{ds}\gg R_d$ 时忽略。`]} />
          <div className="mt-3">
            <PracticeLink topic={U} label="去做本单元练习" />
          </div>
        </Stage>
      </Section>
    </LessonArticle>
  );
}

/* ════════════════════ 共源放大电路 ════════════════════ */
export function CSAmplifierLesson() {
  const U = "cs-amplifier";
  const a = analyzeCS(DEFAULT_CS);
  const s = analyzeCS(DEFAULT_CS_SELF);
  const p = DEFAULT_CS;
  return (
    <LessonArticle unitId={U}>
      <LessonHeader unitId={U} path={r`偏置：自给偏压（耗尽型）/ 分压偏置（任何类型）→ 联立平方律求 Q 点、舍去增根 → 小信号模型 → $A_u=-g_mR_D'$、$R_i\approx R_g$、$R_o\approx R_d$。`} />

      <Section unitId={U} id="csa-bias" n={1} title="偏置电路与静态分析">
        <Question n={1}>自给偏压为什么不能用于增强型 MOS 管？</Question>
        <Stage kind="analysis" title="两种偏置">
          <CSAmp labels={{ bias: "self" }} caption="自给偏压：$U_{GSQ}=U_{GQ}-U_{SQ}=0-I_{DQ}R_s<0$。" />
          <P>{r`栅极经 $R_g$ 接地（$i_G=0$，$U_{GQ}=0$），源极电位 $I_{DQ}R_s>0$，所以 $U_{GSQ}=-I_{DQ}R_s$ **只能为负**。增强型 N 沟道管需要 $U_{GS}>U_{GS(th)}>0$ 才导通——自给偏压无法提供，故只适用于耗尽型和结型管。`}</P>
          <CSAmp labels={{ bias: "divider" }} caption={r`分压偏置：$U_{GQ}=\dfrac{R_{g1}}{R_{g1}+R_{g2}}V_{DD}$，$U_{GSQ}=U_{GQ}-I_{DQ}R_s$，可正可负，适用于所有类型。$R_{g3}$（兆欧级）用于提高输入电阻。`} />
        </Stage>
        <Stage kind="derivation" title="联立求解">
          <Derivation
            title="分压偏置 + 增强型"
            steps={[
              { tex: r`U_{GSQ}=U_{GQ}-I_{DQ}R_s`, why: "栅极回路（$R_{g3}$ 中无电流）" },
              { tex: r`I_{DQ}=I_{DO}\left(\frac{U_{GSQ}}{U_{GS(th)}}-1\right)^2`, why: "假设工作在恒流区" },
              { tex: r`U_{GSQ}=${tq(a.q.UGSQ, "V")}\ (\text{舍去 }${tq(a.q.rejected ?? 0, "V")}),\quad I_{DQ}=${tq(a.q.IDQ, "A")}`, why: `代入 $V_{DD}$=15 V、$R_{g1}$=100 kΩ、$R_{g2}$=300 kΩ、$R_s$=1 kΩ、$U_{GS(th)}$=2 V、$I_{DO}$=2 mA，解一元二次方程。舍去的根小于开启电压，管子应截止，矛盾` },
              { tex: r`U_{DSQ}=V_{DD}-I_{DQ}(R_d+R_s)=${tq(a.q.UDSQ, "V")}>U_{GSQ}-U_{GS(th)}`, why: "验证恒流区假设" },
            ]}
            conclusion="二次方程有两个根，必须用“管子导通”这一物理条件舍去一个——这是 FET 静态分析的特有步骤。"
          />
          <P>{r`自给偏压例（耗尽型 $U_{GS(off)}=-2$ V、$I_{DSS}=4$ mA、$R_s=500\,\Omega$）：$U_{GSQ}=${tq(s.q.UGSQ, "V")}$，$I_{DQ}=${tq(s.q.IDQ, "A")}$。`}</P>
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`自给偏压：$U_{GS}=-I_DR_s$，只用于耗尽型/结型。`, r`分压偏置：$U_{GS}=U_G-I_DR_s$，通用。`, r`解二次方程后舍去使管子截止的根，最后验证恒流区。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="csa-dynamic" n={2} title="动态分析">
        <Question n={2}>{r`共源电路的 $A_u$、$R_i$、$R_o$ 是什么？`}</Question>
        <Stage kind="derivation" title="小信号等效电路">
          <Derivation
            title="共源（R_s 被 C_s 旁路）"
            steps={[
              { tex: r`\dot U_{gs}=\dot U_i`, why: "源极交流接地，栅极电流为零" },
              { tex: r`\dot U_o=-g_m\dot U_{gs}R_D',\quad R_D'=R_d\para R_L`, why: "受控电流源流过 $R_D'$（忽略 $r_{ds}$）" },
              { tex: r`\dot A_u=-g_mR_D'`, why: "相除", numeric: r`=-${tn(a.q.gm * 1e3)}\,\mathrm{mS}\times${tq(par(p.Rd, p.RL), "Ω")}=${tn(a.ac.Au)}` },
              { tex: r`R_i=R_{g3}+R_{g1}\para R_{g2},\quad R_o\approx R_d`, why: "栅极开路；输出端看进去只有 $R_d$" },
            ]}
            conclusion={r`若 $R_s$ 未被旁路：$\dot U_i=\dot U_{gs}+g_m\dot U_{gs}R_s$，$\dot A_u=-\dfrac{g_mR_D'}{1+g_mR_s}$。`}
          />
        </Stage>
        <Stage kind="visual" title="共源电路实验">
          <CSLab />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`$\dot A_u=-g_mR_D'$（反相），$R_i$ 由栅极电阻决定（很大），$R_o\approx R_d$。`, r`FET 的 $g_m$ 小，单级共源增益通常只有十几到几十倍。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="csa-example" n={3} title="综合例题">
        <Question n={3}>怎样完整分析一个共源放大电路？</Question>
        <Stage kind="example" title="例题 4-2">
          <P>{r`分压偏置共源电路：$V_{DD}=15$ V，$R_{g1}=100$ kΩ，$R_{g2}=300$ kΩ，$R_{g3}=1$ MΩ，$R_d=3$ kΩ，$R_s=1$ kΩ（被旁路），$R_L=10$ kΩ；增强型 NMOS，$U_{GS(th)}=2$ V，$I_{DO}=2$ mA。`}</P>
          <Tex block>{r`U_{GQ}=${tq(a.q.UGQ, "V")},\ U_{GSQ}=${tq(a.q.UGSQ, "V")},\ I_{DQ}=${tq(a.q.IDQ, "A")},\ U_{DSQ}=${tq(a.q.UDSQ, "V")}`}</Tex>
          <Tex block>{r`g_m=\frac{2}{U_{GS(th)}}\sqrt{I_{DO}I_{DQ}}=${tn(a.q.gm * 1e3)}\,\mathrm{mS},\quad \dot A_u=${tn(a.ac.Au)},\quad R_i=${tq(a.ac.Ri, "Ω")},\quad R_o=${tq(a.ac.Ro, "Ω")}`}</Tex>
          <P>{r`若 $C_s$ 开路：$\dot A_u=${tn(analyzeCS({ ...p, bypass: false }).ac.Au)}$。`}</P>
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`套路与 BJT 相同：先直流（Q 点、验证恒流区、求 $g_m$），后交流（小信号模型、$A_u$、$R_i$、$R_o$）。`]} />
          <div className="mt-3">
            <PracticeLink topic={U} label="去做本单元练习" />
          </div>
        </Stage>
      </Section>
    </LessonArticle>
  );
}

/* ════════════════════ 共漏与共栅 ════════════════════ */
export function CDCGLesson() {
  const U = "cd-cg-amplifier";
  const cd = analyzeCD({ ...DEFAULT_CS, Rd: 0, bypass: false, RL: Infinity });
  const cg = analyzeCG(DEFAULT_CS);
  return (
    <LessonArticle unitId={U}>
      <LessonHeader unitId={U} path={r`共漏（源极跟随器）：$A_u\lesssim1$、$R_o\approx1/g_m$ → 共栅：$A_u=g_mR_D'$、$R_i\approx1/g_m$ → 与 BJT 三种组态一一对应。`} />

      <Section unitId={U} id="cd" n={1} title="共漏放大电路（源极跟随器）">
        <Question n={1}>{r`源极跟随器的输出电阻为什么约为 $1/g_m$？`}</Question>
        <Stage kind="analysis" title="电路与推导">
          <CDAmp caption="共漏放大电路：栅极输入，源极输出，漏极直接接 $V_{DD}$（交流接地）。" />
          <Derivation
            title="A_u 与 R_o"
            steps={[
              { tex: r`\dot U_o=g_m\dot U_{gs}R_S',\ \ \dot U_i=\dot U_{gs}+\dot U_o,\quad R_S'=R_s\para R_L`, why: "受控源电流流过源极电阻" },
              { tex: r`\dot A_u=\frac{g_mR_S'}{1+g_mR_S'}`, why: "相除；同相且小于 1" },
              { tex: r`R_o=R_s\para\frac1{g_m}`, why: "输入端短路、输出端加 $\\dot U$：$\\dot U_{gs}=-\\dot U$，受控源电流 $-g_m\\dot U$，相当于一个 $1/g_m$ 的电阻" },
            ]}
            conclusion={r`本例（$R_s=1$ kΩ、空载）$\dot A_u=${tn(cd.ac.Au)}$，$R_o=${tq(cd.ac.Ro, "Ω")}$。FET 的 $g_m$ 小，所以源极跟随器的 $\dot A_u$ 比射极跟随器离 1 更远，$R_o$ 也大些；但输入电阻大得多。`}
          />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`共漏 ↔ 共集：电压跟随、$R_i$ 大、$R_o$ 小。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="cg" n={2} title="共栅放大电路">
        <Question n={2}>共栅电路适合用在什么场合？</Question>
        <Stage kind="analysis" title="电路与推导">
          <CGAmp caption="共栅放大电路：信号由源极输入，栅极经 $C_g$ 交流接地。" />
          <P>{r`$\dot U_{gs}=-\dot U_i$，$\dot U_o=-g_m\dot U_{gs}R_D'=g_m\dot U_iR_D'$，所以 $\dot A_u=g_mR_D'$（同相）；从源极看进去 $R_i=R_s\para\dfrac1{g_m}$（很小），$R_o\approx R_d$。本例 $\dot A_u=${tn(cg.ac.Au)}$，$R_i=${tq(cg.ac.Ri, "Ω")}$。与共基电路一样，共栅电路高频特性好，常与共源电路组成 cascode 结构。`}</P>
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`共栅 ↔ 共基：同相电压放大、$R_i$ 小、高频特性好。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="fet-compare" n={3} title="FET 三种组态与 BJT 的对照">
        <Question n={3}>FET 与 BJT 放大电路的分析方法有什么对应关系？</Question>
        <Stage kind="concept" title="对应关系">
          <VarTable
            rows={[
              ["共源 ↔ 共射", r`$-g_mR_D'$ ↔ $-\beta R_L'/r_{be}$`, r`$R_i$：$R_g$ ↔ $R_b\para r_{be}$`],
              ["共漏 ↔ 共集", r`$\dfrac{g_mR_S'}{1+g_mR_S'}$ ↔ $\dfrac{(1+\beta)R_L'}{r_{be}+(1+\beta)R_L'}$`, r`$R_o$：$R_s\para\frac1{g_m}$ ↔ $R_e\para\frac{r_{be}+R_s'}{1+\beta}$`],
              ["共栅 ↔ 共基", r`$g_mR_D'$ ↔ $\beta R_L'/r_{be}$`, r`$R_i$：$R_s\para\frac1{g_m}$ ↔ $R_e\para\frac{r_{be}}{1+\beta}$`],
            ]}
          />
          <Callout kind="key">
            <P>{r`令 BJT 公式中 $\beta\to\infty$、$\beta/r_{be}\to g_m$（栅极电流为零），就得到对应的 FET 公式。`}</P>
          </Callout>
        </Stage>
        <Stage kind="visual" title="三种组态对比">
          <FETConfigCompare />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`FET 电路：输入电阻大、增益较小；BJT 电路：增益大、输入电阻较小。实际常组合使用（如 FET 输入级 + BJT 放大级）。`]} />
          <div className="mt-3">
            <PracticeLink topic={U} label="去做本单元练习" />
          </div>
        </Stage>
      </Section>
    </LessonArticle>
  );
}
