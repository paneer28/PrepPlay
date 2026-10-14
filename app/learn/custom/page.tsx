import type { Metadata } from "next";
import { CustomPracticeBuilder } from "@/components/CustomPracticeBuilder";
import { getQuestionIndex, getTestSummaries } from "@/lib/tests";

export const metadata: Metadata = {
  title: "Custom Practice Questions | PrepPlay",
  description: "Build a free practice set from PrepPlay's DECA-style questions, filtered by cluster, instructional area, or performance indicator."
};

type Props = { searchParams: Promise<{ area?: string | string[] }> };

// Custom practice over the original questions only (free, no access code).
export default async function OriginalCustomPracticePage({ searchParams }: Props) {
  const { area } = await searchParams;
  const index = getQuestionIndex("original");
  const knownAreas = new Set(index.map((entry) => entry.instructionalArea));
  const initialAreas = (Array.isArray(area) ? area : area ? [area] : []).filter((value) => knownAreas.has(value));

  return (
    <CustomPracticeBuilder key={initialAreas.join("|")} index={index} tests={getTestSummaries("original")} initialAreas={initialAreas} set="original" />
  );
}
