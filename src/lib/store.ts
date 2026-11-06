"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface AttemptRecord {
  /** 题目实例键 "<questionId>" 或 "<generatorId>:<seed>" */
  key: string;
  title: string;
  level: 1 | 2 | 3;
  topic: string;
  tries: number;
  correct: boolean;
  firstCorrectOnTry?: number;
  lastAt: number;
}

export interface MistakeEntry {
  key: string;
  title: string;
  level: 1 | 2 | 3;
  topic: string;
  addedAt: number;
  /** auto：答错自动收录；manual：手动收藏 */
  source: "auto" | "manual";
  lastError?: string;
}

export interface ActivityEntry {
  t: number;
  kind: "section" | "exercise";
  id: string;
  ok?: boolean;
}

interface ProgressState {
  sectionsDone: Record<string, number>;
  attempts: Record<string, AttemptRecord>;
  mistakes: Record<string, MistakeEntry>;
  activity: ActivityEntry[];
  setSectionDone: (key: string, done: boolean) => void;
  recordAttempt: (a: Omit<AttemptRecord, "tries" | "lastAt" | "firstCorrectOnTry">, error?: string) => void;
  addMistake: (m: Omit<MistakeEntry, "addedAt">) => void;
  removeMistake: (key: string) => void;
  resetAll: () => void;
}

const MAX_ACTIVITY = 300;

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      sectionsDone: {},
      attempts: {},
      mistakes: {},
      activity: [],
      setSectionDone: (key, done) =>
        set((s) => {
          const sectionsDone = { ...s.sectionsDone };
          if (done) sectionsDone[key] = Date.now();
          else delete sectionsDone[key];
          const activity = done
            ? [{ t: Date.now(), kind: "section" as const, id: key }, ...s.activity].slice(0, MAX_ACTIVITY)
            : s.activity;
          return { sectionsDone, activity };
        }),
      recordAttempt: (a, error) =>
        set((s) => {
          const prev = s.attempts[a.key];
          const tries = (prev?.tries ?? 0) + 1;
          const rec: AttemptRecord = {
            ...a,
            tries,
            correct: a.correct || Boolean(prev?.correct),
            firstCorrectOnTry: prev?.firstCorrectOnTry ?? (a.correct ? tries : undefined),
            lastAt: Date.now(),
          };
          const mistakes = { ...s.mistakes };
          if (!a.correct && !mistakes[a.key]) {
            mistakes[a.key] = {
              key: a.key,
              title: a.title,
              level: a.level,
              topic: a.topic,
              addedAt: Date.now(),
              source: "auto",
              lastError: error,
            };
          } else if (!a.correct && mistakes[a.key]) {
            mistakes[a.key] = { ...mistakes[a.key], lastError: error };
          }
          return {
            attempts: { ...s.attempts, [a.key]: rec },
            mistakes,
            activity: [{ t: Date.now(), kind: "exercise" as const, id: a.key, ok: a.correct }, ...s.activity].slice(
              0,
              MAX_ACTIVITY,
            ),
          };
        }),
      addMistake: (m) =>
        set((s) => ({ mistakes: { ...s.mistakes, [m.key]: { ...m, addedAt: Date.now() } } })),
      removeMistake: (key) =>
        set((s) => {
          const mistakes = { ...s.mistakes };
          delete mistakes[key];
          return { mistakes };
        }),
      resetAll: () => set({ sectionsDone: {}, attempts: {}, mistakes: {}, activity: [] }),
    }),
    {
      name: "analoglab-progress-v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);

let hydrated = false;
let hydrating: Promise<void> | null = null;
const listeners = new Set<() => void>();

function startHydration() {
  if (hydrating || typeof window === "undefined") return;
  hydrating = Promise.resolve(useProgress.persist.rehydrate()).then(() => {
    hydrated = true;
    listeners.forEach((l) => l());
  });
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  startHydration();
  return () => {
    listeners.delete(cb);
  };
}

/** 在客户端挂载后再从 localStorage 恢复，避免 SSR 水合不一致 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => hydrated,
    () => false,
  );
}
