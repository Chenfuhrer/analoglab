import type { Metadata } from "next";
import Link from "next/link";
import { Workspace } from "@/components/layout/Workspace";
import { PageContext } from "@/components/layout/PageContext";

export const metadata: Metadata = { title: "电路实验室" };

const LABS: Array<{ href: string; title: string; status: string; desc: string }> = [
  {
    href: "/lab/ce-amplifier",
    title: "共射极放大电路（完整实验室）",
    status: "独立实验室",
    desc: "固定偏置 / 分压偏置，四种分析模式，Q 点、负载线、示波器波形、失真与实时推导。",
  },
  { href: "/learn/diode-circuits#dc-clip", title: "二极管整流、限幅与钳位", status: "嵌入课程", desc: "恒压降模型逐点计算；钳位电路为时域仿真，可看到建立过程。" },
  { href: "/learn/bjt-curves#bv-output", title: "晶体管特性曲线与工作区", status: "嵌入课程", desc: "Ebers–Moll 模型的输入、输出特性，拖动工作点判断截止、放大、饱和。" },
  { href: "/learn/cb-amplifier#cb-compare", title: "三种基本组态对比", status: "嵌入课程", desc: "同一偏置、同一管子的共射、共集、共基：A_u、R_i、R_o、相位。" },
  { href: "/learn/cs-amplifier#csa-dynamic", title: "共源放大电路", status: "嵌入课程", desc: "自给偏压 / 分压偏置，二次方程求 Q 点（含舍根），g_m 与动态参数。" },
  { href: "/learn/diff-amplifier#da-cmrr", title: "差分放大电路与共模抑制比", status: "嵌入课程", desc: "长尾电阻 / 恒流源，单端 / 双端输出，差模信号叠加共模干扰的输出波形。" },
  { href: "/learn/opamp-integrator#ot-wave", title: "运放积分与微分", status: "嵌入课程", desc: "阶跃、方波、三角波、正弦输入下的时域仿真，含输出饱和与噪声。" },
  { href: "/learn/fb-stability#fst-margin", title: "负反馈稳定性", status: "嵌入课程", desc: "三极点环路增益波特图、相位裕度、主极点补偿与闭环阶跃响应。" },
  { href: "/learn/freq-single-stage#f1-full", title: "共射电路频率响应", status: "嵌入课程", desc: "耦合 / 旁路电容决定 f_L，米勒效应决定 f_H，完整波特图。" },
  { href: "/learn/pa-crossover#px-ab", title: "功放交越失真", status: "嵌入课程", desc: "互补射极跟随器指数模型，偏置电压从乙类调到甲乙类，THD 实时计算。" },
  { href: "/learn/osc-condition#oc-start", title: "文氏桥振荡器起振与稳幅", status: "嵌入课程", desc: "RK4 时域仿真：A < 3 停振、A > 3 起振，稳幅环节使幅度稳定。" },
  { href: "/learn/active-filter#af-second", title: "有源滤波器", status: "嵌入课程", desc: "一阶 / 二阶低通、高通，Q 与通带增益的关系，A_up ≥ 3 时自激。" },
  { href: "/learn/ripple-filter#cf-cap", title: "整流电容滤波", status: "嵌入课程", desc: "桥式整流 + 电容滤波的时域仿真：输出电压、纹波、二极管冲击电流。" },
  { href: "/learn/series-regulator#sr-range", title: "串联型稳压电路", status: "嵌入课程", desc: "采样电位器、输入电压、负载变化下的输出，调整管功耗与失去稳压的条件。" },
];

export default function LabIndex() {
  return (
    <Workspace railDefaultOpen={false}>
      <PageContext page="电路实验室" />
      <h1 className="font-display text-[28px] font-bold">电路实验室</h1>
      <p className="mt-1 max-w-2xl text-[14px] text-ink-2">每个实验都由经过单元测试的计算核心驱动；简化模型的假设写在实验旁边。除共射实验室外，其余实验嵌入在对应的课程知识点中，点击直接跳转。</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {LABS.map((l) => {
          const inner = (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-[17px] font-semibold">{l.title}</h2>
                <span className="rounded-full bg-ok-soft px-2 py-0.5 text-[11.5px] text-ok">{l.status}</span>
              </div>
              <p className="mt-2 text-[13.5px] text-ink-2">{l.desc}</p>
            </>
          );
          return (
            <Link key={l.title} href={l.href} className="card block p-5 transition-colors hover:border-accent" data-testid="lab-card">
              {inner}
            </Link>
          );
        })}
      </div>
    </Workspace>
  );
}
