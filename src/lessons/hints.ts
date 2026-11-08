import type { UnitHints } from "./shared/offline-types";
import { CH1_HINTS } from "./ch01/hints";
import { CH2_HINTS } from "./ch02/hints";
import { CH3_HINTS } from "./ch03/hints";
import { CH4_HINTS } from "./ch04/hints";
import { CH5_HINTS } from "./ch05/hints";
import { CH6_HINTS } from "./ch06/hints";
import { CH7_HINTS } from "./ch07/hints";
import { CH8_HINTS } from "./ch08/hints";
import { CH9_HINTS } from "./ch09/hints";
import { CH10_HINTS } from "./ch10/hints";
import { CH11_HINTS } from "./ch11/hints";
import { CH12_HINTS } from "./ch12/hints";

/** 除共射单元外（共射按知识点细分，见 ce-amplifier/offline-tutor.ts）各单元的离线提示 */
export const UNIT_HINTS: Record<string, UnitHints> = {
  ...CH1_HINTS,
  ...CH2_HINTS,
  ...CH3_HINTS,
  ...CH4_HINTS,
  ...CH5_HINTS,
  ...CH6_HINTS,
  ...CH7_HINTS,
  ...CH8_HINTS,
  ...CH9_HINTS,
  ...CH10_HINTS,
  ...CH11_HINTS,
  ...CH12_HINTS,
};

export function findUnitByKeyword(text: string): string | null {
  const t = text.replace(/\s/g, "").toLowerCase();
  let best: string | null = null;
  let score = 0;
  for (const [id, h] of Object.entries(UNIT_HINTS)) {
    const s = h.keywords.filter((k) => t.includes(k.toLowerCase())).length;
    if (s > score) {
      score = s;
      best = id;
    }
  }
  return best;
}
