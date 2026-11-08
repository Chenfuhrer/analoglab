import { P, r, Tex } from "@/components/math/Tex";
import { Derivation } from "@/components/math/Derivation";
import { Callout } from "@/components/ui/primitives";
import { Bullets, Eq, PracticeLink, Question, Section, Stage, VarTable } from "@/components/lesson/blocks";
import { DiodeGateDemo, DiodeIV, DiodeModelCompare, DiodeSmallSignal, DiodeWaveforms, ZenerDemo } from "@/components/lesson/widgets/ch01/DiodeWidgets";
import { Bridge, Clamp, ClipDouble, ClipShunt, DiodeSeries, HalfWave, ZenerReg } from "@/components/circuit/diagrams/ch01";
import { LessonArticle, LessonHeader } from "@/lessons/shared/LessonHeader";
import { diodeGate, dynamicResistance, solveSeries } from "@/simulations/diode/diode";
import { DEFAULT_ZENER, limitResistorRange, solveZenerRegulator } from "@/simulations/diode/zener";
import { rectifiedAverage, rectifierStress } from "@/simulations/diode/waveforms";
import { tq, tn } from "@/lib/tex";

/* ════════════════════ 二极管 ════════════════════ */
export function DiodeLesson() {
  const U = "diode";
  const e = solveSeries(3, 1e3, "exp");
  const c = solveSeries(3, 1e3, "const");
  const i = solveSeries(3, 1e3, "ideal");
  const g = diodeGate("and", [0, 3], 5);
  const rd = dynamicResistance(2e-3);
  return (
    <LessonArticle unitId={U}>
      <LessonHeader unitId={U} path="PN 结加引线与封装 = 二极管 → 伏安特性（死区、导通、反向、击穿）→ 按精度选模型 → 假设—验证法判断通断 → 小信号动态电阻。" />

      <Section unitId={U} id="di-curve" n={1} title="伏安特性与温度影响">
        <Question n={1}>二极管的“导通电压”是怎么来的？</Question>
        <Stage kind="concept" title="伏安特性的四个区域">
          <VarTable
            rows={[
              ["死区", r`$0<u<U_{on}$（硅约 0.5 V，锗约 0.1 V）`, "正向电流极小（指数曲线的“平坦”起点）"],
              ["正向导通区", r`$u>U_{on}$`, "电流迅速增大；硅管导通后压降约 0.6–0.8 V，锗管约 0.2–0.3 V"],
              ["反向截止区", r`$-U_{BR}<u<0$`, "反向电流很小且基本不变（硅管 < 0.1 µA）"],
              ["反向击穿区", r`$u<-U_{BR}$`, "反向电流急剧增大；普通二极管应避免进入"],
            ]}
          />
          <Callout kind="myth">
            <P>{r`“二极管两端电压低于 0.7 V 就没有电流”是近似说法。由电流方程可知电流随电压**连续**变化，0.6 V 时仍有零点几毫安；“开启电压”是线性坐标下“看起来开始导通”的电压，不是物理上的开关。`}</P>
          </Callout>
        </Stage>
        <Stage kind="visual" title="伏安特性与温度">
          <DiodeIV />
        </Stage>
        <Stage kind="analysis" title="温度的影响">
          <Bullets
            items={[
              r`温度升高，正向特性**左移**：同一电流下正向压降约减小 2–2.5 mV/°C。`,
              r`温度升高，反向电流**增大**：硅管反向电流约每升高 10 °C 增加一倍（锗管更甚）。`,
              r`二者都源于少子浓度 $\propto n_i^2$ 随温度剧增。`,
            ]}
          />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`导通电压是指数特性在常用电流下的结果：硅约 0.7 V、锗约 0.2 V。`, r`温度系数约 −2 mV/°C。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="di-models" n={2} title="四种等效模型">
        <Question n={2}>什么时候用理想模型，什么时候用恒压降模型？</Question>
        <Stage kind="concept" title="由粗到细">
          <VarTable
            rows={[
              ["理想模型", "导通时压降为 0，截止时电流为 0", "电源电压远大于导通压降时使用"],
              ["恒压降模型", r`导通时 $u_D=U_{on}$（硅 0.7 V、锗 0.2 V）`, "最常用；考试中未特别说明时一般采用"],
              ["折线模型", r`导通时 $u_D=U_{th}+i_Dr_D$`, "需要考虑导通压降随电流变化时使用"],
              ["小信号模型", r`在 Q 点附近用 $r_d=U_T/I_D$ 代替`, "只用于叠加在直流上的微小变化量"],
            ]}
          />
          <DiodeSeries labels={{ V: "3 V", R: "1 kΩ" }} caption="例题电路：$V$=3 V、$R$=1 kΩ 与硅二极管串联。" />
        </Stage>
        <Stage kind="example" title="例题 1-2：三种模型的结果">
          <P>{r`图中电路，求 $I_D$。`}</P>
          <Tex block>{r`\text{理想：}I_D=\frac{V}{R}=${tq(i.ID, "A")};\quad \text{恒压降：}I_D=\frac{V-0.7}{R}=${tq(c.ID, "A")};\quad\text{指数模型：}${tq(e.ID, "A")}\ (u_D=${tq(e.UD, "V")})`}</Tex>
          <P>{r`恒压降模型与精确解只差约 $${tn(((c.ID - e.ID) / e.ID) * 100, 2)}\%$，理想模型误差约 $${tn(((i.ID - e.ID) / e.ID) * 100, 2)}\%$。电源电压越低，理想模型越不能用。`}</P>
        </Stage>
        <Stage kind="visual" title="同一电路比较四种模型">
          <DiodeModelCompare />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`模型的选择取决于精度要求，而不是“哪个更正确”。`, r`未说明时用恒压降模型：硅 0.7 V、锗 0.2 V。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="di-state" n={3} title="判断二极管的通断">
        <Question n={3}>电路中有多个二极管时怎样判断哪个导通？</Question>
        <Stage kind="derivation" title="假设—验证法">
          <Derivation
            title="判断步骤"
            steps={[
              { tex: r`\text{① 断开所有二极管}`, why: "把二极管从电路中拿走，只保留两端的连接点" },
              { tex: r`U_{AK}=V_{\text{阳极}}-V_{\text{阴极}}\ (\text{开路电压})`, why: "分别求每只管子阳极、阴极之间的开路电压" },
              { tex: r`U_{AK}>U_{on}\ \Rightarrow\ \text{可能导通};\quad U_{AK}\text{最大者优先导通}`, why: "开路电压最大的管子最先导通，并会改变其他节点的电位" },
              { tex: r`\text{③ 用恒压源 }U_{on}\text{ 代替已导通的管子，重新检查其余各管}`, why: "导通后节点电位被钳住，其余管子可能因此变成反偏" },
            ]}
            conclusion="切忌“每只管子单独判断”：导通的管子会改变电路中其他点的电位。"
          />
        </Stage>
        <Stage kind="example" title="例题 1-3">
          <P>{r`下图中 $V_{CC}=5$ V，$U_A=0$ V，$U_B=3$ V，二极管为硅管。断开两管时，阳极都被拉到 5 V：$U_{AK1}=5$ V，$U_{AK2}=2$ V。VD₁ 的开路电压更大，先导通，$U_O=0+0.7=0.7$ V；此时 VD₂ 两端 $U_{AK2}=0.7-3=-2.3$ V，反偏截止。结果：$U_O=${tq(g.UO, "V")}$，VD₁ ${g.on[0] ? "导通" : "截止"}、VD₂ ${g.on[1] ? "导通" : "截止"}。`}</P>
        </Stage>
        <Stage kind="visual" title="自己改输入试试">
          <DiodeGateDemo />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`先断开、求开路电压；最大者优先导通；再验证其余各管。`, r`阴极接输入、阳极上拉：输出跟随最低输入（“与”）；阳极接输入、阴极下拉：输出跟随最高输入（“或”）。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="di-small" n={4} title="小信号模型 r_d">
        <Question n={4}>为什么二极管的动态电阻与电流成反比？</Question>
        <Stage kind="derivation" title="切线斜率">
          <Derivation
            title="由电流方程求 r_d"
            steps={[
              { tex: r`i_D\approx I_Se^{u_D/U_T}`, why: "正向导通，$u_D\\gg U_T$" },
              { tex: r`\frac{\mathrm di_D}{\mathrm du_D}\Big|_Q=\frac{I_Se^{U_D/U_T}}{U_T}=\frac{I_D}{U_T}`, why: "对 $u_D$ 求导，在 Q 点取值" },
              { tex: r`r_d=\frac{U_T}{I_D}`, why: "动态电阻 = 切线斜率的倒数", units: "V/A = Ω ✓", numeric: r`I_D=2\,\mathrm{mA}:\ r_d\approx${tq(rd, "Ω")}` },
            ]}
            conclusion={r`$r_d$ 只取决于 Q 点电流：电流越大，切线越陡，$r_d$ 越小。它只能用于分析**叠加在直流上的微小变化**（$|u_d|\ll U_T$）。`}
          />
        </Stage>
        <Stage kind="visual" title="线性化的精度">
          <DiodeSmallSignal />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`$r_d=U_T/I_D$：26 mV / 1 mA ≈ 26 Ω。`, r`$r_d$ 是动态电阻，与直流电阻 $U_D/I_D$ 完全不同。这一思想在晶体管 $r_{be}$ 中再次出现。`]} />
          <div className="mt-3">
            <PracticeLink topic={U} label="去做本单元练习" />
          </div>
        </Stage>
      </Section>
    </LessonArticle>
  );
}

/* ════════════════════ 稳压二极管 ════════════════════ */
export function ZenerLesson() {
  const U = "zener";
  const z = DEFAULT_ZENER;
  const z40 = { ...z, IZM: 40e-3 };
  const rg = limitResistorRange(10, 14, 0, 10e-3, z40);
  const hi = solveZenerRegulator(14, 240, Infinity, z40);
  const lo = solveZenerRegulator(10, 240, 6 / 10e-3, z40);
  return (
    <LessonArticle unitId={U}>
      <LessonHeader unitId={U} path={r`反向击穿区：电流大范围变化而电压几乎不变 → 稳压管参数 → 限流电阻保证 $I_{Z\min}\le I_Z\le I_{ZM}$。`} />

      <Section unitId={U} id="zn-principle" n={1} title="反向击穿区的稳压原理">
        <Question n={1}>为什么击穿区可以用来稳压？</Question>
        <Stage kind="intuition" title="很陡的曲线">
          <P>{r`稳压二极管（Zener diode）是专门设计在反向击穿区工作的硅二极管。在击穿区，伏安特性几乎是一条竖直线：电流从几毫安变到几十毫安，电压只变化零点几伏——把它并联在负载两端，负载电压就“稳”在 $U_Z$ 附近。`}</P>
        </Stage>
        <Stage kind="concept" title="工作条件">
          <Bullets
            items={[
              r`稳压管必须**反向**连接（阴极接高电位），并且反向电压足以使其击穿。`,
              r`正向连接时它就是一只普通二极管，压降约 0.7 V。`,
              r`必须串联**限流电阻**，否则击穿后电流不受限制，会因功耗过大而热击穿。`,
            ]}
          />
          <ZenerReg caption="稳压管稳压电路：限流电阻 $R$ 与负载 $R_L$，稳压管与负载并联。$I_R=I_Z+I_L$。" />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`稳压管工作在可逆的反向电击穿区。`, r`反接、击穿、限流——三个条件缺一不可。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="zn-params" n={2} title="稳压管的主要参数">
        <Question n={2}>{r`$I_{Z\min}$ 与 $I_{ZM}$ 分别限制了什么？`}</Question>
        <Stage kind="concept" title="参数表">
          <VarTable
            rows={[
              [r`$U_Z$`, "稳定电压：规定电流下的反向击穿电压", "同型号也有分散性（如 5.8–6.6 V）"],
              [r`$I_Z$（$I_{Z\min}$）`, "稳定电流：低于此值稳压效果变差", "工作在曲线拐弯处，$r_z$ 增大"],
              [r`$I_{ZM}=P_{ZM}/U_Z$`, "最大稳定电流", "超过则功耗过大、热击穿"],
              [r`$r_z=\Delta U_Z/\Delta I_Z$`, "动态电阻：越小稳压效果越好", "一般几欧到几十欧"],
              [r`$\alpha_U$`, "温度系数", "$U_Z<4$ V 为负（齐纳），$>7$ V 为正（雪崩），约 6 V 时最小"],
            ]}
          />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`正常工作：$I_{Z\min}\le I_Z\le I_{ZM}$。`, r`$r_z$ 越小越好；6 V 左右的稳压管温度稳定性最好。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="zn-design" n={3} title="限流电阻的设计">
        <Question n={3}>稳压管为什么必须串联限流电阻？</Question>
        <Stage kind="derivation" title="两个最不利情况">
          <P>{r`理想稳压管时 $U_O=U_Z$，所以 $I_R=(U_I-U_Z)/R$，$I_Z=I_R-I_L$。$U_I$ 与 $I_L$ 都在变化，必须检查两个极端：`}</P>
          <Derivation
            title="R 的取值范围"
            steps={[
              { tex: r`U_I=U_{I\max},\ I_L=I_{L\min}\ \Rightarrow\ I_Z\text{ 最大}\le I_{ZM}`, why: "输入最高、负载最轻时流过稳压管的电流最大" },
              { tex: r`\frac{U_{I\max}-U_Z}{R}-I_{L\min}\le I_{ZM}\ \Rightarrow\ R\ge R_{\min}=\frac{U_{I\max}-U_Z}{I_{ZM}+I_{L\min}}`, why: "KCL：$I_R=I_Z+I_L$" },
              { tex: r`U_I=U_{I\min},\ I_L=I_{L\max}\ \Rightarrow\ I_Z\text{ 最小}\ge I_{Z\min}`, why: "输入最低、负载最重时稳压管电流最小" },
              { tex: r`R\le R_{\max}=\frac{U_{I\min}-U_Z}{I_{Z\min}+I_{L\max}}`, why: "同理" },
            ]}
            conclusion={r`$R_{\min}\le R\le R_{\max}$；若 $R_{\min}>R_{\max}$ 则无解，需换用功率更大的稳压管或减小负载电流变化范围。`}
          />
        </Stage>
        <Stage kind="example" title="例题 1-4">
          <P>{r`$U_Z=6$ V，$I_{Z\min}=5$ mA，$I_{ZM}=40$ mA；$U_I$ 在 10–14 V 之间变化，负载电流 0–10 mA。则 $R_{\min}=(14-6)\,\mathrm V/(40+0)\,\mathrm{mA}=${tq(rg.Rmin, "Ω")}$，$R_{\max}=(10-6)\,\mathrm V/(5+10)\,\mathrm{mA}=${tq(rg.Rmax, "Ω")}$。取 $R=240\,\Omega$ 校验两个极端：$U_I=14$ V 空载时 $I_Z=${tq(hi.IZ, "A")}\le I_{ZM}$；$U_I=10$ V、$I_L=10$ mA 时 $I_Z=${tq(lo.IZ, "A")}\ge I_{Z\min}$。两者都满足。`}</P>
        </Stage>
        <Stage kind="visual" title="调参数看稳压管电流">
          <ZenerDemo />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`$R$ 太小：轻载、高输入时 $I_Z>I_{ZM}$，烧管。`, r`$R$ 太大：重载、低输入时 $I_Z<I_{Z\min}$，不稳压。`, r`第 12 章“稳压管稳压电路”会在此基础上讨论稳压系数与输出电阻。`]} />
          <div className="mt-3">
            <PracticeLink topic={U} label="去做本单元练习" />
          </div>
        </Stage>
      </Section>
    </LessonArticle>
  );
}

/* ════════════════════ 整流与限幅 ════════════════════ */
export function DiodeCircuitsLesson() {
  const U = "diode-circuits";
  const st = rectifierStress(10, 100, "bridge");
  return (
    <LessonArticle unitId={U}>
      <LessonHeader unitId={U} path="二极管的单向导电性 → 整流（交流变脉动直流）→ 限幅（削去超出范围的部分）→ 钳位（平移直流电平）。三类电路都用“分段判断通断”画波形。" />

      <Section unitId={U} id="dc-rect" n={1} title="半波与全波整流">
        <Question n={1}>整流电路的输出为什么是脉动直流？</Question>
        <Stage kind="analysis" title="半波整流">
          <HalfWave caption={r`单相半波整流：变压器副边电压 $u_2=\sqrt2U_2\sin\omega t$。`} />
          <P>{r`正半周 $u_2>0$，二极管导通，$u_O\approx u_2$；负半周二极管反偏截止，$u_O=0$。负载上只剩下正半周——方向不变但大小变化的**脉动直流**。`}</P>
          <Eq label="1.5" note="理想二极管、电阻负载；平均值即直流分量。">{r`U_{O(AV)}=\frac1{2\pi}\int_0^{\pi}\sqrt2U_2\sin\omega t\,\mathrm d(\omega t)=\frac{\sqrt2}{\pi}U_2\approx0.45U_2`}</Eq>
        </Stage>
        <Stage kind="analysis" title="桥式（全波）整流">
          <Bridge caption="单相桥式整流：正半周 VD₁、VD₃ 导通，负半周 VD₂、VD₄ 导通，负载电流方向始终不变。" />
          <P>{r`两个半周都有输出，平均值加倍：$U_{O(AV)}\approx0.9U_2$。每只二极管只在半个周期导通，平均电流为负载电流的一半；截止时承受的最大反向电压为 $\sqrt2U_2$。例如 $U_2=10$ V、$R_L=100\,\Omega$：每管平均电流 $${tq(st.ID, "A")}$，最大反向电压 $${tq(st.URM, "V")}$，输出平均值 $${tq(rectifiedAverage(10, "bridge"), "V")}$。整流电路的完整设计在第 12 章展开。`}</P>
        </Stage>
        <Stage kind="visual" title="整流波形">
          <DiodeWaveforms initial="half" />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`半波 $0.45U_2$，全波/桥式 $0.9U_2$。`, r`计入导通压降时，桥式整流在每个半周都有两只二极管的压降。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="dc-clip" n={2} title="限幅电路">
        <Question n={2}>怎样根据二极管通断画出限幅波形？</Question>
        <Stage kind="analysis" title="单向限幅">
          <ClipShunt caption="上限幅：二极管阳极接输出，阴极接参考电压 $E$。" />
          <Derivation
            title="分段分析"
            steps={[
              { tex: r`u_I<E+U_{on}:\ \text{VD 截止},\ i_R=0\ \Rightarrow\ u_O=u_I`, why: "空载时电阻上没有电流，输出等于输入" },
              { tex: r`u_I>E+U_{on}:\ \text{VD 导通}\ \Rightarrow\ u_O=E+U_{on}`, why: "导通的二极管与 $E$ 把输出钳住，多余电压降在 $R$ 上" },
            ]}
            conclusion={r`输出的上限被限制在 $E+U_{on}$（**限幅电平**），低于此值的部分原样通过。改变 $E$ 可以改变限幅电平；把二极管反接就得到下限幅。`}
          />
          <ClipDouble caption="双向限幅：VD₁ 限制上限 $E_1+U_{on}$，VD₂ 限制下限 $-(E_2+U_{on})$。" />
        </Stage>
        <Stage kind="visual" title="限幅波形">
          <DiodeWaveforms initial="clip1" />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`以 $E+U_{on}$ 为界分段：二极管导通段输出被钳住，截止段输出跟随输入。`, r`限幅电路常用于保护后级电路的输入端。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="dc-clamp" n={3} title="钳位与电平选择">
        <Question n={3}>钳位电路为什么能平移波形的直流电平？</Question>
        <Stage kind="analysis" title="电容上“记住”了一个直流电压">
          <Clamp caption="正峰钳位：二极管阳极接输出、阴极接地。" />
          <P>{r`第一个正半周，$u_I$ 上升，二极管导通给电容快速充电，$u_C$ 几乎跟随到 $U_m-U_{on}$；此后 $u_I$ 下降，二极管截止，电容只能经大电阻 $R$ 缓慢放电。若 $RC\gg T$，电容电压基本保持 $U_m-U_{on}$，于是`}</P>
          <Eq note={r`条件：$RC\gg T$（放电时间常数远大于信号周期）。正峰被钳在 $U_{on}$ 附近，波形形状不变、整体下移。`}>{r`u_O=u_I-u_C\approx u_I-(U_m-U_{on})`}</Eq>
          <P>{r`钳位电路（clamper）改变的是波形的**直流电平**，不改变其形状——这与限幅电路削去一部分波形完全不同。`}</P>
        </Stage>
        <Stage kind="visual" title="时域仿真：钳位的建立过程">
          <DiodeWaveforms initial="clamp" />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`限幅：削去超过限幅电平的部分。钳位：整体平移，形状不变。`, r`钳位需要 $RC\gg T$；$RC$ 太小时电容在每个周期都明显放电，钳位失效。`]} />
          <div className="mt-3">
            <PracticeLink topic={U} label="去做本单元练习" />
          </div>
        </Stage>
      </Section>
    </LessonArticle>
  );
}
