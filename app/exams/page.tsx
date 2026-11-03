import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TestLibrary } from "@/components/TestLibrary";
import { getViewerEvent } from "@/lib/profile";
import { getTestSummaries } from "@/lib/tests";
import { viewerHasTestsAccess } from "@/lib/tests-access-server";

export const metadata: Metadata = {
  title: "Practice Tests | PrepPlay",
  description: "Full timed DECA cluster exams, then review every question with explanations and performance indicators."
};

// The real DECA exams. PrepPlay's own questions are on the Learn roads.
export default async function TestsPage() {
  const [event, unlocked] = await Promise.all([getViewerEvent(), viewerHasTestsAccess()]);
  if (!unlocked) redirect("/tests-access?next=/exams");

  return <TestLibrary key={event?.id ?? "none"} tests={getTestSummaries("deca")} initialCluster={event?.examCluster} />;
}
