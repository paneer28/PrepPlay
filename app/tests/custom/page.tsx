import type { Metadata } from "next";
import { CustomPracticeBuilder } from "@/components/CustomPracticeBuilder";
import { getQuestionIndex, getTestSummaries } from "@/lib/tests";

export const metadata: Metadata = {
  title: "Custom Practice | PrepPlay",
  description:
    "Build a DECA practice set from every cluster exam, filtered by competition level, year, cluster, instructional area, or performance indicator."
};

type CustomPracticePageProps = {
  // ?area=Economics preselects instructional areas (repeatable), e.g. from the results page.
  searchParams: Promise<{ area?: string | string[] }>;
};

export default async function CustomPracticePage({ searchParams }: CustomPracticePageProps) {
  const { area } = await searchParams;
  const index = getQuestionIndex();
  const knownAreas = new Set(index.map((entry) => entry.instructionalArea));
  const initialAreas = (Array.isArray(area) ? area : area ? [area] : []).filter((value) => knownAreas.has(value));

  return (
    <CustomPracticeBuilder
      key={initialAreas.join("|")}
      index={index}
      tests={getTestSummaries()}
      initialAreas={initialAreas}
    />
  );
}
