"use client";

import { create } from "zustand";

/**
 * AI 辅导面板可读取的“当前学习上下文”。
 * 页面在挂载/状态变化时写入；TutorPanel 读取并随请求发送。
 */
export interface LessonCtx {
  unitId: string;
  unitTitle: string;
  sectionId?: string;
  sectionTitle?: string;
}

export interface LabCtx {
  mode: string;
  params: string;
  results: string;
}

export interface ExerciseCtx {
  key: string;
  title: string;
  prompt: string;
  /** 学生已完成的步骤/作答情况 */
  progress: string;
  /** 最近一次判题反馈 */
  lastFeedback?: string;
  /** 离线模式下可直接展示的分层提示 */
  hints: string[];
  /** 生成“同类题”的入口 */
  regenerate?: () => void;
}

interface TutorState {
  page: string;
  lesson: LessonCtx | null;
  lab: LabCtx | null;
  exercise: ExerciseCtx | null;
  setPage: (p: string) => void;
  setLesson: (l: LessonCtx | null) => void;
  setLab: (l: LabCtx | null) => void;
  setExercise: (e: ExerciseCtx | null) => void;
}

export const useTutorContext = create<TutorState>()((set) => ({
  page: "",
  lesson: null,
  lab: null,
  exercise: null,
  setPage: (page) => set({ page }),
  setLesson: (lesson) => set({ lesson }),
  setLab: (lab) => set({ lab }),
  setExercise: (exercise) => set({ exercise }),
}));

export function describeContext(s: Pick<TutorState, "page" | "lesson" | "lab" | "exercise">): string {
  const lines: string[] = [];
  if (s.page) lines.push(`当前页面：${s.page}`);
  if (s.lesson) lines.push(`当前课程：${s.lesson.unitTitle}${s.lesson.sectionTitle ? ` / 知识点：${s.lesson.sectionTitle}` : ""}`);
  if (s.lab) lines.push(`电路实验室（模式 ${s.lab.mode}）参数：${s.lab.params}\n计算结果：${s.lab.results}`);
  if (s.exercise) {
    lines.push(`当前练习题：${s.exercise.title}\n题干：${s.exercise.prompt}\n学生进度：${s.exercise.progress}`);
    if (s.exercise.lastFeedback) lines.push(`最近判题反馈：${s.exercise.lastFeedback}`);
  }
  return lines.join("\n");
}
