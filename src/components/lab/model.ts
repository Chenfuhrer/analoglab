"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { analyzeCE } from "@/simulations/bjt/ce";
import { simulateWaveforms } from "@/simulations/bjt/transient";
import type { CEParams } from "@/simulations/bjt/types";

export function useCEModel(initial: CEParams) {
  const [params, setParams] = useState<CEParams>(initial);
  const analysis = useMemo(() => analyzeCE(params), [params]);
  const waves = useMemo(() => simulateWaveforms(params, { periods: 1, samplesPerPeriod: 360, analysis }), [params, analysis]);
  const set = useCallback(<K extends keyof CEParams>(k: K, v: CEParams[K]) => setParams((p) => ({ ...p, [k]: v })), []);
  return { params, setParams, set, analysis, waves };
}

export type CEModel = ReturnType<typeof useCEModel>;

/* ───────── 慢放时钟：示波器滚动与动态工作点共享同一相位 ───────── */
export interface Clock {
  subscribe: (cb: () => void) => () => void;
  get: () => number;
  isRunning: () => boolean;
  setRunning: (r: boolean) => void;
  setPhase: (p: number) => void;
  /** 每秒经过的信号周期数（慢放） */
  speed: number;
}

export function createClock(speed = 0.4): Clock {
  let phase = 0;
  let running = true;
  let raf = 0;
  let last = 0;
  const ls = new Set<() => void>();
  const emit = () => ls.forEach((l) => l());
  const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (reduced) running = false;
  const tick = (t: number) => {
    if (last) phase = (phase + ((t - last) / 1000) * clock.speed) % 1;
    last = t;
    emit();
    raf = requestAnimationFrame(tick);
  };
  const start = () => {
    if (!raf && running && ls.size) {
      last = 0;
      raf = requestAnimationFrame(tick);
    }
  };
  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };
  const clock: Clock = {
    speed,
    subscribe(cb) {
      ls.add(cb);
      start();
      return () => {
        ls.delete(cb);
        if (!ls.size) stop();
      };
    },
    get: () => phase,
    isRunning: () => running,
    setRunning(r) {
      running = r;
      if (r) start();
      else stop();
      emit();
    },
    setPhase(p) {
      phase = ((p % 1) + 1) % 1;
      emit();
    },
  };
  return clock;
}

export function usePhase(clock: Clock): number {
  return useSyncExternalStore(clock.subscribe, clock.get, () => 0);
}

export function useRunning(clock: Clock): boolean {
  return useSyncExternalStore(clock.subscribe, clock.isRunning, () => true);
}
