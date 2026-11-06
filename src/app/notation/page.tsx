import type { Metadata } from "next";
import { Workspace } from "@/components/layout/Workspace";
import { PageContext } from "@/components/layout/PageContext";
import { Rich } from "@/components/math/Tex";
import { NOTATION_MAP, NOTATION_NOTES, NOTATION_RULES } from "@/content/notation";

export const metadata: Metadata = { title: "符号约定" };

function Table({ head, rows }: { head: [string, string, string]; rows: Array<[string, string, string]> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[14px]">
        <thead>
          <tr className="border-b border-line text-left text-[12px] text-ink-3">
            {head.map((h) => (
              <th key={h} className="py-2 pr-4 font-normal">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]} className="border-b border-line-2 align-top">
              {r.map((c, i) => (
                <td key={i} className="py-2 pr-4">
                  <Rich text={c} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function NotationPage() {
  return (
    <Workspace railDefaultOpen={false}>
      <PageContext page="符号约定" />
      <div className="max-w-4xl space-y-8">
        <header>
          <h1 className="font-display text-[28px] font-bold">符号约定与教材对照</h1>
          <p className="mt-1 text-[14px] text-ink-2">本站沿用童诗白、华成英《模拟电子技术基础》的符号体系。区分直流量、交流量、瞬时值与有效值，是读懂所有公式的前提。</p>
        </header>
        <section>
          <h2 className="font-display mb-3 text-[19px] font-bold">一、大小写与下标的含义</h2>
          <Table head={["示例", "写法", "含义"]} rows={NOTATION_RULES} />
        </section>
        <section>
          <h2 className="font-display mb-3 text-[19px] font-bold">二、与英文教材的对照</h2>
          <Table head={["本站（童诗白体系）", "英文教材常用", "说明"]} rows={NOTATION_MAP} />
        </section>
        <section>
          <h2 className="font-display mb-3 text-[19px] font-bold">三、需要特别注意</h2>
          <ul className="space-y-2 text-[14px]">
            {NOTATION_NOTES.map((n) => (
              <li key={n} className="rounded-md border border-line bg-elev px-3 py-2">
                <Rich text={n} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Workspace>
  );
}
