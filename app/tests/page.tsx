import type { Metadata } from "next";
import { TestLibrary } from "@/components/TestLibrary";
import { getTestSummaries } from "@/lib/tests";

export const metadata: Metadata = {
  title: "Practice Tests | PrepPlay",
  description:
    "Take timed DECA cluster practice exams, then review every question with explanations and performance indicators."
};

export default function TestsPage() {
  const tests = getTestSummaries();

  return <TestLibrary tests={tests} />;
}
