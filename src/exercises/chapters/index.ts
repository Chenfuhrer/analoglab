import type { QuestionTemplate } from "../types";
import { CH1_QUESTIONS } from "./ch01";
import { CH2_QUESTIONS } from "./ch02";
import { CH3_QUESTIONS } from "./ch03";
import { CH4_QUESTIONS } from "./ch04";
import { CH5_QUESTIONS } from "./ch05";
import { CH6_QUESTIONS } from "./ch06";
import { CH7_QUESTIONS } from "./ch07";
import { CH8_QUESTIONS } from "./ch08";
import { CH9_QUESTIONS } from "./ch09";
import { CH10_QUESTIONS } from "./ch10";
import { CH11_QUESTIONS } from "./ch11";
import { CH12_QUESTIONS } from "./ch12";

/** 第 1、2、4–12 章及第 3 章其余单元的题库 */
export const CHAPTER_TEMPLATES: QuestionTemplate[] = [...CH1_QUESTIONS, ...CH2_QUESTIONS, ...CH3_QUESTIONS, ...CH4_QUESTIONS, ...CH5_QUESTIONS, ...CH6_QUESTIONS, ...CH7_QUESTIONS, ...CH8_QUESTIONS, ...CH9_QUESTIONS, ...CH10_QUESTIONS, ...CH11_QUESTIONS, ...CH12_QUESTIONS];
