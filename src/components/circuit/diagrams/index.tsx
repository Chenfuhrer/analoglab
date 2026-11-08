import type { DiagramRef } from "@/exercises/types";
import type { DiagramComponent } from "./types";
import type { DiagramId } from "./ids";
import { CH1_DIAGRAMS } from "./ch01";
import { CH2_DIAGRAMS } from "./ch02";
import { CH3_DIAGRAMS } from "./ch03";
import { CH4_DIAGRAMS } from "./ch04";
import { CH5_DIAGRAMS } from "./ch05";
import { CH6_DIAGRAMS } from "./ch06";
import { CH7_DIAGRAMS } from "./ch07";
import { CH8_DIAGRAMS } from "./ch08";
import { CH9_DIAGRAMS } from "./ch09";
import { CH10_DIAGRAMS } from "./ch10";
import { CH11_DIAGRAMS } from "./ch11";
import { CH12_DIAGRAMS } from "./ch12";

/** 全部静态电路图（题目配图与课程正文共用） */
export const DIAGRAMS: Record<string, DiagramComponent> = {
  ...CH1_DIAGRAMS,
  ...CH2_DIAGRAMS,
  ...CH3_DIAGRAMS,
  ...CH4_DIAGRAMS,
  ...CH5_DIAGRAMS,
  ...CH6_DIAGRAMS,
  ...CH7_DIAGRAMS,
  ...CH8_DIAGRAMS,
  ...CH9_DIAGRAMS,
  ...CH10_DIAGRAMS,
  ...CH11_DIAGRAMS,
  ...CH12_DIAGRAMS,
} satisfies Record<DiagramId, DiagramComponent>;

export function Diagram({ id, labels, caption }: DiagramRef) {
  const C = DIAGRAMS[id];
  if (!C) return null;
  return <C labels={labels} caption={caption} />;
}
