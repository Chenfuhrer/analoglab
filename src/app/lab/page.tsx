import type { Metadata } from "next";
import Link from "next/link";
import { Workspace } from "@/components/layout/Workspace";
import { PageContext } from "@/components/layout/PageContext";

export const metadata: Metadata = { title: "电路实验室" };

const LABS = [
  {
    href: "/lab/ce-amplifier",
    title: "共射极放大电路",
    status: "可用",
    desc: "固定偏置 / 分压偏置，四种分析模式，Q 点、负载线、示波器波形、失真与实时推导。",
  },
  { href: null, title: "共集 / 共基放大电路", status: "规划中", desc: "三种组态对比：A_u、R_i、R_o 与相位关系。" },
  { href: null, title: "运算放大器基本运算", status: "规划中", desc: "反相/同相比例、加减、积分、微分。" },
  { href: null, title: "频率响应与波特图", status: "规划中", desc: "耦合电容、旁路电容与结电容决定的 f_L、f_H。" },
];

export default function LabIndex() {
  return (
    <Workspace railDefaultOpen={false}>
      <PageContext page="电路实验室" />
      <h1 className="font-display text-[28px] font-bold">电路实验室</h1>
      <p className="mt-1 max-w-2xl text-[14px] text-ink-2">每个实验都由经过单元测试的计算核心驱动；简化模型的假设写在实验页面上。</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {LABS.map((l) => {
          const inner = (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-[17px] font-semibold">{l.title}</h2>
                <span className={`rounded-full px-2 py-0.5 text-[11.5px] ${l.href ? "bg-ok-soft text-ok" : "bg-sunken text-ink-3"}`}>{l.status}</span>
              </div>
              <p className="mt-2 text-[13.5px] text-ink-2">{l.desc}</p>
            </>
          );
          return l.href ? (
            <Link key={l.title} href={l.href} className="card block p-5 transition-colors hover:border-accent" data-testid="lab-card">
              {inner}
            </Link>
          ) : (
            <div key={l.title} className="card p-5 opacity-70">
              {inner}
            </div>
          );
        })}
      </div>
    </Workspace>
  );
}
