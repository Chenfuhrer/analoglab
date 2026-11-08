import { P, r } from "@/components/math/Tex";
import { Derivation } from "@/components/math/Derivation";
import { Callout } from "@/components/ui/primitives";
import { Bullets, Eq, PracticeLink, Question, Section, Stage, VarTable } from "@/components/lesson/blocks";
import { CarrierTemp, DopingDemo, HoleHop, PNJunctionDemo } from "@/components/lesson/widgets/ch01/Semiconductor";
import { LessonArticle, LessonHeader } from "@/lessons/shared/LessonHeader";
import { carriers, builtInPotential, depletionWidth, intrinsicDensity } from "@/simulations/semi/carriers";
import { diodeCurrent, SI_DIODE } from "@/simulations/diode/diode";
import { sig } from "@/simulations/units";
import { tn } from "@/lib/tex";

const sciTex = (x: number) => {
  const e = Math.floor(Math.log10(x));
  return `${tn(x / Math.pow(10, e))}\\times10^{${e}}`;
};

/* ════════════════════ 本征半导体与载流子 ════════════════════ */
export function SemiCarriersLesson() {
  const U = "semi-carriers";
  const ni300 = intrinsicDensity(300);
  const ni310 = intrinsicDensity(310);
  return (
    <LessonArticle unitId={U}>
      <LessonHeader unitId={U} path="导体、绝缘体与半导体 → 共价键 → 本征激发产生电子–空穴对 → 两种载流子 → 载流子浓度随温度指数变化。" />

      <Section unitId={U} id="sc-bond" n={1} title="共价键与本征半导体">
        <Question n={1}>为什么纯净的硅几乎不导电？</Question>
        <Stage kind="intuition" title="被“锁住”的电子">
          <P>{r`导电需要**可以自由移动的带电粒子**（载流子）。金属里每个原子都贡献出自由电子，数量巨大；绝缘体里的电子几乎全被束缚。半导体介于两者之间：它的电子大多被束缚在共价键中，但“锁”并不牢，一点热能就能撬开少数几把锁。`}</P>
        </Stage>
        <Stage kind="concept" title="本征半导体">
          <Bullets
            items={[
              r`**本征半导体**（intrinsic semiconductor）：完全纯净、结构完整的半导体晶体。常用材料为硅（Si）和锗（Ge），都是四价元素。`,
              r`每个原子的 4 个价电子分别与相邻 4 个原子的价电子组成**共价键**，形成稳定的晶体结构。`,
              r`热力学温度 0 K 且无外界激发时，所有价电子都被束缚在共价键中，晶体中没有载流子——此时它是绝缘体。`,
            ]}
          />
          <Callout kind="myth">
            <P>{r`“半导体就是导电能力一半的导体”是错误的。半导体的特点不是“电导率居中”，而是**电导率可以被温度、光照和掺杂大幅改变**——这正是能用它制造器件的原因。`}</P>
          </Callout>
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`载流子 = 可以自由移动的带电粒子。`, r`本征半导体中价电子被共价键束缚，室温下只有极少数被激发出来。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="sc-hole" n={2} title="本征激发与空穴导电">
        <Question n={2}>空穴是真实的粒子吗？它怎样“移动”？</Question>
        <Stage kind="concept" title="本征激发与复合">
          <P>{r`价电子获得足够能量（热、光）后挣脱共价键成为**自由电子**，同时在原来的位置留下一个空位，称为**空穴**（hole）。电子与空穴总是成对产生，这个过程叫**本征激发**；自由电子遇到空穴重新填入，称为**复合**。一定温度下两者达到动态平衡，载流子浓度保持不变。`}</P>
          <VarTable
            rows={[
              [r`$n$`, "自由电子浓度", r`cm⁻³（每立方厘米的个数）`],
              [r`$p$`, "空穴浓度", "cm⁻³"],
              [r`$n_i$`, "本征载流子浓度：本征半导体中 $n=p=n_i$", r`硅 300 K 约 $1.4\times10^{10}$ cm⁻³`],
            ]}
          />
        </Stage>
        <Stage kind="visual" title="看空穴怎样“移动”">
          <HoleHop />
        </Stage>
        <Stage kind="analysis" title="两种载流子、两种电流">
          <P>{r`加上外电场后：自由电子逆电场方向运动形成**电子电流**；邻近共价键中的价电子在电场作用下依次填补空穴，等效于空穴顺电场方向运动，形成**空穴电流**。两者方向相同，总电流是二者之和。`}</P>
          <Callout kind="warn" title="空穴是不是粒子？">
            <P>{r`空穴不是一个独立存在的粒子，而是“缺少一个价电子”的状态。但它的运动规律与一个带正电 $+q$ 的粒子完全相同，所以在分析器件时把它当作一种载流子处理。这是**等效模型**，不是说真有正电荷在移动。`}</P>
          </Callout>
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`本征激发产生电子–空穴对，复合使它们成对消失。`, r`半导体中有两种载流子：自由电子（带负电）和空穴（等效带正电），这是半导体与金属导电的重要区别。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="sc-temp" n={3} title="载流子浓度与温度">
        <Question n={3}>为什么半导体的导电能力对温度如此敏感？</Question>
        <Stage kind="intuition" title="热能决定能被撬开的锁有多少">
          <P>{r`把价电子挣脱共价键所需的能量记为禁带宽度 $E_g$（硅约 1.12 eV，锗约 0.66 eV）。室温下原子热运动的平均能量只有 $kT\approx0.026$ eV，远小于 $E_g$——只有极少数“运气好”的电子能获得足够能量，其概率按 $e^{-E_g/(2kT)}$ 变化。指数函数对 $T$ 非常敏感，这就是半导体怕热的根源。`}</P>
        </Stage>
        <Stage kind="derivation" title="本征载流子浓度">
          <Eq label="1.1" note={r`$B$ 为与材料有关的常数，$k$ 为玻尔兹曼常数（$8.62\times10^{-5}$ eV/K），$T$ 为热力学温度。本站计算忽略 $E_g$ 随温度的微小变化。`}>{r`n_i=p_i=B\,T^{3/2}\,e^{-E_g/(2kT)}`}</Eq>
          <Derivation
            title="温度升高 10 K，n_i 变为多少倍"
            steps={[
              { tex: r`\frac{n_i(310)}{n_i(300)}=\left(\frac{310}{300}\right)^{3/2}\exp\!\left[\frac{E_g}{2k}\left(\frac1{300}-\frac1{310}\right)\right]`, why: "式 (1.1) 两个温度相除，常数 $B$ 消去" },
              { tex: r`=1.05\times\exp\!\left(\frac{1.12}{2\times8.62\times10^{-5}}\times1.075\times10^{-4}\right)\approx1.05\times e^{0.70}`, why: "代入硅的 $E_g$=1.12 eV", units: "指数中 eV/(eV/K)·(1/K) 无量纲 ✓" },
              { tex: r`\approx ${tn(ni310 / ni300)}`, why: "计算核心给出的精确值（与手算一致）" },
            ]}
            conclusion={r`硅的 $n_i$ 大约**每升高 10 K 翻一倍**。300 K 时 $n_i\approx${sciTex(ni300)}$ cm⁻³，而硅原子密度约 $5\times10^{22}$ cm⁻³：每 $10^{12}$ 个原子中才有约 1 个被激发。`}
          />
        </Stage>
        <Stage kind="visual" title="调温度看 n_i">
          <CarrierTemp />
        </Stage>
        <Stage kind="summary">
          <Bullets
            items={[
              r`$n_i$ 随温度按指数规律增大；禁带越窄（锗）$n_i$ 越大、越怕热。`,
              r`本征半导体载流子太少，导电能力弱且受温度控制——直接用它做器件既不实用也不稳定，因此需要**掺杂**（下一单元）。`,
            ]}
          />
          <div className="mt-3">
            <PracticeLink topic={U} label="去做本单元练习" />
          </div>
        </Stage>
      </Section>
    </LessonArticle>
  );
}

/* ════════════════════ 杂质半导体 ════════════════════ */
export function SemiDopedLesson() {
  const U = "semi-doped";
  const c = carriers(1e16, 0);
  const cHot = carriers(1e16, 0, 400);
  return (
    <LessonArticle unitId={U}>
      <LessonHeader unitId={U} path="掺入五价/三价元素 → N 型与 P 型 → 多子由掺杂决定、少子由本征激发决定 → $np=n_i^2$ → 少子对温度敏感。" />

      <Section unitId={U} id="sd-type" n={1} title="N 型与 P 型半导体">
        <Question n={1}>掺入五价或三价元素后发生了什么？</Question>
        <Stage kind="intuition" title="多一个电子，或少一个电子">
          <P>{r`在硅中掺入少量**五价**元素（磷、砷）：杂质原子有 5 个价电子，4 个组成共价键，多出的 1 个只受很弱的束缚，室温下几乎全部成为自由电子。掺入**三价**元素（硼）：只有 3 个价电子，组成共价键时缺 1 个，邻近价电子很容易填进来，于是产生一个空穴。`}</P>
        </Stage>
        <Stage kind="concept" title="施主、受主与两种杂质半导体">
          <VarTable
            rows={[
              ["N 型（电子型）", "掺五价元素（施主杂质，浓度 $N_D$）", "多子：自由电子；少子：空穴。杂质原子失去电子成为**不能移动的正离子**"],
              ["P 型（空穴型）", "掺三价元素（受主杂质，浓度 $N_A$）", "多子：空穴；少子：自由电子。杂质原子得到电子成为**不能移动的负离子**"],
            ]}
          />
          <Callout kind="myth">
            <P>{r`“N 型半导体带负电”是错的。施主原子贡献一个电子后自身变为正离子，正、负电荷总量相等，**杂质半导体整体呈电中性**。`}</P>
          </Callout>
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`N 型：多子是电子；P 型：多子是空穴。`, r`电离的杂质离子固定在晶格中，不参与导电，但会在 PN 结中形成空间电荷。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="sd-mass" n={2} title="多子与少子：质量作用定律">
        <Question n={2}>为什么掺杂后少子反而变少了？</Question>
        <Stage kind="derivation" title="np = n_i²">
          <P>{r`热平衡时，电子–空穴对的产生速率只与温度有关，复合速率正比于“电子与空穴相遇的机会” $np$。产生 = 复合，于是 $np$ 只取决于温度。本征半导体中 $n=p=n_i$，所以对任何非简并的半导体都有：`}</P>
          <Eq label="1.2" note={r`适用条件：热平衡、非简并（掺杂浓度远低于约 $10^{19}$ cm⁻³）。`}>{r`n\,p=n_i^2`}</Eq>
          <Derivation
            title="N 型硅中的少子浓度（N_D = 10¹⁶ cm⁻³，300 K）"
            steps={[
              { tex: r`n\approx N_D=10^{16}\ \mathrm{cm^{-3}}`, why: "室温下施主几乎全部电离，且 $N_D\\gg n_i$", approx: r`忽略本征激发对多子的贡献` },
              { tex: r`p=\frac{n_i^2}{n}=\frac{(1.4\times10^{10})^2}{10^{16}}=${sciTex(c.p)}\ \mathrm{cm^{-3}}`, why: "式 (1.2)" },
              { tex: r`\frac{n}{p}\approx${sciTex(c.n / c.p)}`, why: "多子比少子多 11 个数量级以上" },
            ]}
            conclusion={r`掺杂使多子增加了约 $10^6$ 倍，少子就减少了 $10^6$ 倍：多出来的多子“加速”了少子的复合。`}
          />
        </Stage>
        <Stage kind="visual" title="调掺杂浓度">
          <DopingDemo />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`多子浓度 ≈ 掺杂浓度（与温度基本无关）。`, r`少子浓度 $=n_i^2/$多子浓度。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="sd-temp" n={3} title="少子与温度：温漂的根源">
        <Question n={3}>为什么器件的反向电流对温度极其敏感？</Question>
        <Stage kind="analysis" title="少子 ∝ n_i²">
          <P>{r`少子浓度 $n_i^2/N_D$ 正比于 $n_i^2$，而 $n_i$ 随温度指数增长。同样是 $N_D=10^{16}$ cm⁻³ 的 N 型硅：300 K 时 $p\approx${sciTex(c.p)}$ cm⁻³，400 K 时 $p\approx${sciTex(cHot.p)}$ cm⁻³，增大约 $${tn(cHot.p / c.p)}$ 倍；而多子几乎不变。`}</P>
          <P>{r`后面会看到：PN 结的反向电流、晶体管的 $I_{CBO}$ 都由少子漂移形成，所以它们随温度剧烈变化——这是放大电路**温度漂移**的物理根源。`}</P>
          <Callout kind="key">
            <P>{r`温度足够高时 $n_i$ 会与掺杂浓度相当，杂质半导体“退化”为本征半导体，器件失去作用。硅器件的最高结温一般在 150–200 °C，锗器件更低（约 70–100 °C），原因就是锗的 $n_i$ 大得多。`}</P>
          </Callout>
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`多子由掺杂决定，少子由本征激发决定。`, r`少子对温度敏感 → 反向电流对温度敏感 → 放大电路的温漂。`]} />
          <div className="mt-3">
            <PracticeLink topic={U} label="去做本单元练习" />
          </div>
        </Stage>
      </Section>
    </LessonArticle>
  );
}

/* ════════════════════ PN 结 ════════════════════ */
export function PNJunctionLesson() {
  const U = "pn-junction";
  const Vbi = builtInPotential(1e17, 1e16);
  const W0 = depletionWidth(0, 1e17, 1e16).W;
  const W10 = depletionWidth(-10, 1e17, 1e16).W;
  const IS = diodeCurrent(-1, SI_DIODE) * -1;
  return (
    <LessonArticle unitId={U}>
      <LessonHeader unitId={U} path="P 区与 N 区接触 → 多子扩散 → 空间电荷区与内电场 → 扩散与漂移平衡 → 正偏导通、反偏截止 → 电流方程 → 击穿与结电容。" />

      <Section unitId={U} id="pn-form" n={1} title="扩散、漂移与空间电荷区">
        <Question n={1}>内电场是怎样建立起来的？</Question>
        <Stage kind="intuition" title="浓度差推动扩散，电场把它拉回来">
          <P>{r`把一滴墨水滴进清水，墨水会从浓处向淡处扩散。P 区空穴多、N 区电子多，两区接触后：空穴向 N 区扩散，电子向 P 区扩散。离开的载流子在交界处留下了**不能移动的杂质离子**——P 侧是负离子，N 侧是正离子，于是形成一个由 N 指向 P 的**内电场**。`}</P>
          <P>{r`内电场阻碍多子继续扩散，却推动少子向对方运动（**漂移**）。扩散越多，内电场越强，漂移也越强，最后两者相等：达到动态平衡。`}</P>
        </Stage>
        <Stage kind="concept" title="空间电荷区（耗尽层）">
          <Bullets
            items={[
              r`交界处只剩下离子、几乎没有载流子的区域称为**空间电荷区**，也叫**耗尽层**或**势垒区**。`,
              r`内电场对应的电位差称为**接触电位差** $U_{ho}$（硅约 0.6–0.8 V，锗约 0.2–0.3 V）。`,
              r`掺杂浓度低的一侧耗尽层**更宽**：两侧离子电荷量必须相等，浓度低就要“占”更大的体积。`,
            ]}
          />
          <Eq label="1.3" note={r`$N_A$、$N_D$ 为两侧掺杂浓度。以 $N_A=10^{17}$、$N_D=10^{16}$ cm⁻³ 的硅结为例，$U_{ho}\approx${tn(Vbi)}$ V，零偏时耗尽层宽度约 $${tn(W0 * 1e4)}\,\mu\mathrm m$。`}>{r`U_{ho}=U_T\ln\frac{N_AN_D}{n_i^2}`}</Eq>
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`扩散（多子、浓度差驱动）与漂移（少子、电场驱动）方向相反，平衡时净电流为零。`, r`空间电荷区由不能移动的离子组成，其中几乎没有载流子。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="pn-bias" n={2} title="正偏与反偏：单向导电性">
        <Question n={2}>为什么正偏导通、反偏截止？</Question>
        <Stage kind="analysis" title="外电场与内电场相加减">
          <Bullets
            items={[
              r`**正向偏置**（P 接高电位，N 接低电位）：外电场与内电场方向相反，势垒从 $U_{ho}$ 降为 $U_{ho}-u$，耗尽层变窄，多子扩散大大增强，形成较大的正向电流。`,
              r`**反向偏置**（P 接低电位）：外电场加强内电场，势垒升高、耗尽层变宽，扩散几乎停止，只剩少子漂移形成的**反向饱和电流** $I_S$（硅管为 nA 甚至 pA 级），近似截止。`,
            ]}
          />
          <Callout kind="warn">
            <P>{r`正偏时必须串联限流电阻：正向电流随电压**指数**增长，电压稍大一点电流就会大到烧毁 PN 结。`}</P>
          </Callout>
        </Stage>
        <Stage kind="visual" title="拖动偏置电压">
          <PNJunctionDemo />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`正偏：势垒降低、耗尽层变窄、导通。反偏：势垒升高、耗尽层变宽、截止。`, r`这就是 PN 结的**单向导电性**。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="pn-eq" n={3} title="PN 结电流方程">
        <Question n={3}>电流方程中每一项的含义是什么？</Question>
        <Stage kind="concept" title="Shockley 方程">
          <Eq label="1.4" note={r`$I_S$：反向饱和电流（与少子浓度成正比，$\propto n_i^2$，随温度剧增）；$U_T=kT/q$：温度电压当量，300 K 时约 26 mV。`}>{r`i=I_S\left(e^{u/U_T}-1\right)`}</Eq>
          <VarTable
            rows={[
              [r`$u\gg U_T$（正偏几百毫伏）`, r`$i\approx I_Se^{u/U_T}$`, "指数增长：电压每增加约 60 mV，电流增大 10 倍"],
              [r`$u<0$ 且 $|u|\gg U_T$`, r`$i\approx-I_S$`, "反向电流几乎不随反向电压变化，故称“饱和”电流"],
              [r`$u=0$`, r`$i=0$`, "扩散与漂移平衡"],
            ]}
          />
          <Derivation
            title="“60 mV 十倍”从哪里来"
            steps={[
              { tex: r`\frac{i_2}{i_1}=e^{(u_2-u_1)/U_T}`, why: "两个正偏工作点相除（$u\\gg U_T$ 时忽略 −1）" },
              { tex: r`u_2-u_1=U_T\ln\frac{i_2}{i_1}=26\,\mathrm{mV}\times\ln10\approx60\,\mathrm{mV}`, why: "取 $i_2/i_1=10$", units: "mV × 无量纲 = mV ✓" },
            ]}
            conclusion={r`电流从 1 mA 变到 10 mA，电压只增加约 60 mV——这就是“导通后两端电压近似恒定”的原因，也是恒压降模型的依据。`}
          />
        </Stage>
        <Stage kind="example" title="例题 1-1">
          <P>{r`某硅 PN 结 $I_S=${sig(IS * 1e12, 2)}$ pA。求 300 K 时正向电流为 1 mA 所需的电压。`}</P>
          <P>{r`$u=U_T\ln(i/I_S+1)\approx0.0259\times\ln(10^{-3}/10^{-13})=0.0259\times23.0\approx0.60$ V。可见“硅管导通电压约 0.6–0.7 V”是电流方程在毫安级电流下的结果，而不是一个固定的门槛。`}</P>
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`$i=I_S(e^{u/U_T}-1)$：正向指数、反向饱和。`, r`$I_S$ 极小但对温度极敏感。`]} />
        </Stage>
      </Section>

      <Section unitId={U} id="pn-break" n={4} title="反向击穿与结电容">
        <Question n={4}>击穿一定会损坏 PN 结吗？</Question>
        <Stage kind="concept" title="两种电击穿">
          <Bullets
            items={[
              r`**齐纳击穿**：高掺杂、耗尽层很窄，不大的反向电压就产生极强电场，直接把价电子从共价键中“拉”出来。击穿电压较低（一般 < 4 V），具有负温度系数。`,
              r`**雪崩击穿**：低掺杂、耗尽层宽，载流子在强电场中加速，撞击晶格产生新的电子–空穴对，连锁倍增。击穿电压较高（一般 > 7 V），具有正温度系数。`,
              r`两种都是**电击穿**，可逆：只要限制电流、使功耗不超过允许值，撤去反向电压后 PN 结恢复正常。若电流过大导致结温过高，就会发生**热击穿**，造成永久损坏。`,
            ]}
          />
          <P>{r`稳压二极管正是利用可逆的电击穿工作的（见“稳压二极管”单元）。`}</P>
        </Stage>
        <Stage kind="concept" title="结电容">
          <Bullets
            items={[
              r`**势垒电容** $C_b$：耗尽层宽度随电压变化，相当于电荷在“极板”上增减。以本例硅结为例，反偏 10 V 时耗尽层宽度由 $${tn(W0 * 1e4)}\,\mu\mathrm m$ 增至 $${tn(W10 * 1e4)}\,\mu\mathrm m$，势垒电容相应减小（变容二极管就是利用这一点）。`,
              r`**扩散电容** $C_d$：正偏时注入对方区域的非平衡少子的积累量随电压变化。正偏时 $C_d$ 为主，反偏时 $C_b$ 为主。`,
              r`结电容很小（pF 级），低频时可忽略；高频时会使单向导电性变差——这在第 9 章“频率响应”中很重要。`,
            ]}
          />
        </Stage>
        <Stage kind="summary">
          <Bullets items={[r`电击穿可逆，热击穿不可逆；限制电流是关键。`, r`PN 结具有势垒电容和扩散电容，高频时不可忽略。`]} />
          <div className="mt-3">
            <PracticeLink topic={U} label="去做本单元练习" />
          </div>
        </Stage>
      </Section>
    </LessonArticle>
  );
}
