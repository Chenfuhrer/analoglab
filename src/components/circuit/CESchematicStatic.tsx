"use client";

import { useMemo, type ReactNode } from "react";
import type { CEMode } from "@/circuits/ce-parts";
import { analyzeCE } from "@/simulations/bjt/ce";
import type { CEParams } from "@/simulations/bjt/types";
import { CESchematic } from "./CESchematic";

/** 题目、例题用的静态电路图（不可切换模式，元件不可点击） */
export function CESchematicStatic({ params, mode = "full", caption, testId = "static-schematic" }: { params: CEParams; mode?: CEMode; caption?: ReactNode; testId?: string }) {
  const analysis = useMemo(() => analyzeCE(params), [params]);
  return (
    <CESchematic
      params={params}
      analysis={analysis}
      mode={mode}
      zoomable={false}
      showAnnotations={false}
      caption={caption}
      testId={testId}
      className="my-4"
    />
  );
}
