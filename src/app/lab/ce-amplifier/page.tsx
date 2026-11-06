import type { Metadata } from "next";
import Link from "next/link";
import { CELab } from "@/components/lab/CELab";
import { Workspace } from "@/components/layout/Workspace";
import { DEFAULT_CE } from "@/simulations/bjt/types";
import { PageContext } from "@/components/layout/PageContext";

export const metadata: Metadata = {
  title: "共射极放大电路实验室",
  description: "调节 V_CC、R_b、R_c、R_e、R_L、β 与输入信号，实时观察 Q 点、负载线、波形与失真。",
};

export default function CELabPage() {
  return (
    <Workspace railDefaultOpen={false}>
      <PageContext page="电路实验室 / 共射极放大电路" />
      <div className="mb-5">
        <nav className="mb-2 text-[12.5px] text-ink-3" aria-label="面包屑">
          <Link href="/lab" className="hover:text-ink">
            实验室
          </Link>{" "}
          / 共射极放大电路
        </nav>
        <h1 className="font-display text-[26px] font-bold leading-tight">共射极放大电路实验室</h1>
        <p className="mt-1.5 max-w-3xl text-[14px] text-ink-2">
          所有数值都由计算核心实时求得：改变任一参数，Q 点、负载线、四种模式的电路图、波形与推导同步更新。配套讲解见{" "}
          <Link href="/learn/ce-amplifier" className="text-accent hover:underline">
            共射极放大电路课程
          </Link>
          。
        </p>
      </div>
      <CELab initial={DEFAULT_CE} />
    </Workspace>
  );
}
