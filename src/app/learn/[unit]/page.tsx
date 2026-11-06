import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { completeUnits, UNIT_BY_ID } from "@/content/course";
import { Workspace } from "@/components/layout/Workspace";
import { PageContext } from "@/components/layout/PageContext";
import { LessonRail } from "@/components/lesson/LessonRail";
import { CEAmplifierLesson } from "@/lessons/ce-amplifier";

const CONTENT: Record<string, () => React.ReactElement> = {
  "ce-amplifier": CEAmplifierLesson,
};

export const dynamicParams = false;

export function generateStaticParams() {
  return completeUnits().map((u) => ({ unit: u.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ unit: string }> }): Promise<Metadata> {
  const { unit } = await params;
  const u = UNIT_BY_ID[unit];
  return u ? { title: u.title, description: u.summary } : {};
}

export default async function LessonPage({ params }: { params: Promise<{ unit: string }> }) {
  const { unit } = await params;
  const u = UNIT_BY_ID[unit];
  const Content = CONTENT[unit];
  if (!u || u.status !== "complete" || !Content) notFound();
  return (
    <Workspace rail={<LessonRail unitId={u.id} unitTitle={u.title} sections={u.sections ?? []} />}>
      <PageContext page={`课程 / ${u.title}`} lesson={{ unitId: u.id, unitTitle: u.title }} />
      <Content />
    </Workspace>
  );
}
