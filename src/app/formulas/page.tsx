import type { Metadata } from "next";
import { Workspace } from "@/components/layout/Workspace";
import { PageContext } from "@/components/layout/PageContext";
import { FormulaBrowser } from "./FormulaBrowser";

export const metadata: Metadata = { title: "公式速查" };

export default function FormulasPage() {
  return (
    <Workspace railDefaultOpen={false}>
      <PageContext page="公式速查" />
      <h1 className="font-display text-[28px] font-bold">公式速查</h1>
      <p className="mb-5 mt-1 max-w-3xl text-[14px] text-ink-2">
        每条公式都列出变量、单位与适用条件。共射单元的公式与计算核心一一对应，可跳转到推导；其余章节为常用结论，推导页随单元上线补充。
      </p>
      <FormulaBrowser />
    </Workspace>
  );
}
