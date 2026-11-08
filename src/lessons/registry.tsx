import { CEAmplifierLesson } from "./ce-amplifier";
import { CH1_LESSONS } from "./ch01";
import { CH2_LESSONS } from "./ch02";
import { CH3_LESSONS } from "./ch03";
import { CH4_LESSONS } from "./ch04";
import { CH5_LESSONS } from "./ch05";
import { CH6_LESSONS } from "./ch06";
import { CH7_LESSONS } from "./ch07";
import { CH8_LESSONS } from "./ch08";
import { CH9_LESSONS } from "./ch09";
import { CH10_LESSONS } from "./ch10";
import { CH11_LESSONS } from "./ch11";
import { CH12_LESSONS } from "./ch12";
import type { LessonId } from "./lesson-ids";

/** 单元 id → 课程正文组件（只有登记在此的单元才生成页面） */
export const LESSONS: Record<string, () => React.ReactElement> = {
  "ce-amplifier": CEAmplifierLesson,
  ...CH1_LESSONS,
  ...CH2_LESSONS,
  ...CH3_LESSONS,
  ...CH4_LESSONS,
  ...CH5_LESSONS,
  ...CH6_LESSONS,
  ...CH7_LESSONS,
  ...CH8_LESSONS,
  ...CH9_LESSONS,
  ...CH10_LESSONS,
  ...CH11_LESSONS,
  ...CH12_LESSONS,
} satisfies Record<LessonId, () => React.ReactElement>;
