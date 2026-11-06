import Link from "next/link";
import { CHAPTERS, UNITS } from "@/content/course";
import { ALL_TEMPLATES } from "@/exercises/bank";
import { analyzeCE } from "@/simulations/bjt/ce";
import { simulateWaveforms } from "@/simulations/bjt/transient";
import { DEFAULT_CE } from "@/simulations/bjt/types";
import { formatSI, sig } from "@/simulations/units";
import { Reveal } from "@/components/ui/primitives";
import { HomeProgress } from "@/components/learn/HomeProgress";

/** 首页示波器：数据由计算核心在构建时计算（默认共射电路，u_s = 10 mV） */
function HeroScope() {
  const p = { ...DEFAULT_CE, Usm: 0.01, Rs: 600 };
  const a = analyzeCE(p);
  const w = simulateWaveforms(p, { periods: 1, samplesPerPeriod: 180, analysis: a });
  const W = 560;
  const H = 220;
  const per = W / 2; // 屏幕显示 2 个周期
  const uoMax = Math.max(...Array.from(w.uo, Math.abs));
  const uiMax = Math.max(...Array.from(w.ui, Math.abs));
  const path = (arr: Float64Array, scale: number) => {
    let d = "";
    for (let k = 0; k <= 4 * arr.length; k++) {
      const x = (k / arr.length) * per;
      const y = H / 2 - (arr[k % arr.length] / scale) * (H * 0.36);
      d += `${k ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return d;
  };
  return (
    <figure className="overflow-hidden rounded-xl border border-[#1f2733] bg-[#0b0f14] shadow-2xl" aria-label="共射放大电路的输入与输出波形">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 font-mono text-[11px] text-white/60">
        <span>AnalogLab · CE amplifier</span>
        <span>
          A<sub>us</sub> = {sig(a.ac.Aus, 3)} · φ = 180°
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label="输入为小幅正弦，输出为反相放大的正弦">
        {Array.from({ length: 11 }, (_, i) => (
          <line key={`v${i}`} x1={(i * W) / 10} x2={(i * W) / 10} y1={0} y2={H} stroke="rgba(160,190,220,.12)" />
        ))}
        {Array.from({ length: 9 }, (_, i) => (
          <line key={`h${i}`} y1={(i * H) / 8} y2={(i * H) / 8} x1={0} x2={W} stroke="rgba(160,190,220,.12)" />
        ))}
        <g className="hero-scroll">
          <path d={path(w.ui, uiMax * 4)} fill="none" stroke="#facc15" strokeWidth={2} />
          <path d={path(w.uo, uoMax)} fill="none" stroke="#22d3ee" strokeWidth={2.4} />
        </g>
      </svg>
      <figcaption className="flex gap-4 border-t border-white/10 px-4 py-2 font-mono text-[11px]">
        <span className="text-[#facc15]">CH1 u_i 峰值 {formatSI(uiMax, "V")}</span>
        <span className="text-[#22d3ee]">CH2 u_o 峰值 {formatSI(uoMax, "V")}（两通道刻度不同）</span>
        <span className="ml-auto text-white/40">由计算核心实时求解，非预设动画</span>
      </figcaption>
    </figure>
  );
}

const FEATURES = [
  { href: "/lab/ce-amplifier", k: "LAB", title: "交互式电路实验室", desc: "完整 / 直流 / 交流 / 微变四种模式一键切换，元件可点击，Q 点、负载线、示波器波形随参数实时更新。" },
  { href: "/learn/ce-amplifier", k: "LEARN", title: "从“为什么”讲起", desc: "物理直觉 → 概念 → 电路分析 → 分步推导 → 可视化验证 → 例题，每个公式写明条件与近似。" },
  { href: "/practice", k: "PRACTICE", title: "会诊断错误的练习", desc: "三级难度、参数化出题；检查单位与量纲，识别“漏了 r_bb′”“忘了负载”等常见错误。" },
  { href: "/graph", k: "MAP", title: "知识图谱与进度", desc: `${CHAPTERS.length} 章、${UNITS.length} 个单元的先修关系一目了然；学习进度与错题本保存在本地。` },
];

export default function Home() {
  const live = UNITS.filter((u) => u.status === "complete");
  return (
    <div className="px-4 pb-20 pt-8 sm:px-8 lg:px-12">
      <section className="grid items-center gap-10 xl:grid-cols-[minmax(0,1fr)_560px]">
        <Reveal>
          <div className="eyebrow">Interactive Analog Electronics</div>
          <h1 className="font-display mt-3 text-[40px] font-bold leading-[1.15] sm:text-[48px]">
            把模拟电路
            <br />
            <span className="text-accent">算明白、看明白</span>
          </h1>
          <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-ink-2">
            AnalogLab 是面向电子信息类本科生的《模拟电子技术基础》交互式学习平台。每一个波形、每一个工作点都由经过测试的电路模型实时计算——你改的每个电阻，都会真实地改变结果。
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/learn/ce-amplifier" className="rounded-lg bg-accent px-5 py-2.5 text-[14.5px] font-medium text-accent-ink hover:opacity-90" data-testid="cta-learn">
              开始学习：共射极放大电路 →
            </Link>
            <Link href="/lab/ce-amplifier" className="rounded-lg border border-line bg-elev px-5 py-2.5 text-[14.5px] font-medium hover:border-ink-3">
              打开实验室
            </Link>
          </div>
          <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-[13px] text-ink-2">
            <div>
              <dt className="eyebrow">课程</dt>
              <dd className="num mt-0.5 text-[20px] text-ink">{CHAPTERS.length} 章</dd>
            </div>
            <div>
              <dt className="eyebrow">完整单元</dt>
              <dd className="num mt-0.5 text-[20px] text-ink">{live.length}</dd>
            </div>
            <div>
              <dt className="eyebrow">题型</dt>
              <dd className="num mt-0.5 text-[20px] text-ink">{ALL_TEMPLATES.length}</dd>
            </div>
          </dl>
        </Reveal>
        <Reveal delay={120}>
          <HeroScope />
        </Reveal>
      </section>

      <HomeProgress />

      <section className="mt-16 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {FEATURES.map((f, i) => (
          <Reveal key={f.href} delay={i * 80}>
            <Link href={f.href} className="card block h-full p-5 transition-colors hover:border-accent">
              <div className="eyebrow">{f.k}</div>
              <h2 className="mt-2 text-[17px] font-semibold">{f.title}</h2>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">{f.desc}</p>
            </Link>
          </Reveal>
        ))}
      </section>

      <section className="mt-16">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-[24px] font-bold">课程地图</h2>
          <Link href="/learn" className="text-[13px] text-accent hover:underline">
            完整目录 →
          </Link>
        </div>
        <ol className="mt-5 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {CHAPTERS.map((ch) => {
            const has = UNITS.some((u) => u.chapter === ch.n && u.status === "complete");
            return (
              <li key={ch.n} className="bg-elev p-4">
                <Link href={`/learn#ch${ch.n}`} className="block">
                  <div className="flex items-center justify-between">
                    <span className="num text-[12px] text-ink-3">CH {String(ch.n).padStart(2, "0")}</span>
                    {has && <span className="rounded-full bg-ok-soft px-2 text-[10.5px] text-ok">已上线</span>}
                  </div>
                  <div className="mt-1 font-semibold">{ch.title}</div>
                  <p className="mt-1 text-[12.5px] leading-snug text-ink-3">{ch.blurb}</p>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      <footer className="mt-16 border-t border-line pt-6 text-[12.5px] text-ink-3">
        <p>AnalogLab · 开源教学项目（MIT）。课程内容与题目为原创；符号体系参照童诗白、华成英《模拟电子技术基础》。数值结果基于文中写明的简化模型，复杂情况请以 SPICE 仿真与实验为准。</p>
      </footer>
    </div>
  );
}
