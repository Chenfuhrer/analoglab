import Link from "next/link";
import { P, r } from "@/components/math/Tex";
import { Callout } from "@/components/ui/primitives";
import { UNIT_BY_ID } from "@/content/course";
import { SecBias, SecDC, SecWhy } from "./part1";
import { SecAC, SecGain, SecHParam, SecRio } from "./part2";
import { SecDistortion, SecExample, SecSummary } from "./part3";

export function CEAmplifierLesson() {
  const unit = UNIT_BY_ID["ce-amplifier"];
  return (
    <article className="mx-auto max-w-[860px]" data-testid="lesson-ce">
      <header className="mb-8">
        <div className="eyebrow">第 3 章 · 基本放大电路 · 对应教材 {unit.textbook}</div>
        <h1 className="font-display mt-2 text-[34px] font-bold leading-tight">共射极放大电路</h1>
        <p className="mt-3 text-[15.5px] leading-relaxed text-ink-2">{unit.summary}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-line bg-elev p-4">
            <div className="eyebrow mb-2">学完你应该能够</div>
            <ul className="space-y-1 text-[13.5px]">
              {unit.objectives.map((o) => (
                <li key={o} className="flex gap-2">
                  <span className="text-ok">✓</span>
                  {o}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-line bg-elev p-4 text-[13.5px]">
            <div className="eyebrow mb-2">学习路径</div>
            <p className="text-ink-2">
              三极管放大原理 → 静态工作点 → 直流通路 → 交流通路 → 微变等效电路 → 电压增益 → 输入输出电阻 → 失真分析。
            </p>
            <p className="mt-2 text-ink-2">
              先修：
              <Link className="text-accent hover:underline" href="/learn/bjt-curves">
                晶体管特性曲线与三个工作区
              </Link>
              （第 2 章）。建议配合{" "}
              <Link className="text-accent hover:underline" href="/lab/ce-amplifier">
                共射实验室
              </Link>{" "}
              边学边调。
            </p>
          </div>
        </div>
        <Callout kind="note" title="阅读提示">
          <P>{r`每个知识点按“物理直觉 → 概念 → 电路分析 → 推导 → 可视化 → 例题 → 练习 → 总结”组织；文中所有数值例题都由与实验室相同的计算核心实时生成。符号约定见顶部导航的“符号约定”页：$I_{BQ}$ 直流、$i_B$ 总瞬时、$i_b$ 交流瞬时、$I_b$ 交流有效值。`}</P>
        </Callout>
      </header>
      <SecWhy />
      <SecBias />
      <SecDC />
      <SecAC />
      <SecHParam />
      <SecGain />
      <SecRio />
      <SecDistortion />
      <SecExample />
      <SecSummary />
    </article>
  );
}
