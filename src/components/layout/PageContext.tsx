"use client";

import { useEffect } from "react";
import { useTutorContext, type LessonCtx } from "@/lib/tutor-context";

/** 向 AI 辅导面板登记当前页面上下文（离开页面时清理） */
export function PageContext({ page, lesson }: { page: string; lesson?: LessonCtx }) {
  const setPage = useTutorContext((s) => s.setPage);
  const setLesson = useTutorContext((s) => s.setLesson);
  const setLab = useTutorContext((s) => s.setLab);
  const setExercise = useTutorContext((s) => s.setExercise);
  const lessonKey = lesson ? `${lesson.unitId}` : "";
  useEffect(() => {
    setPage(page);
    if (lesson) setLesson(lesson);
    return () => {
      setPage("");
      setLesson(null);
      setLab(null);
      setExercise(null);
    };
    // lesson 对象由 lessonKey 代表
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, lessonKey, setPage, setLesson, setLab, setExercise]);
  return null;
}
