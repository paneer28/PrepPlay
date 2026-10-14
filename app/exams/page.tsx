import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { TestLibrary } from "@/components/TestLibrary";
import { hasTestsAccess, TESTS_ACCESS_COOKIE } from "@/lib/tests-access";
import { getAllTests, getTestSummaries } from "@/lib/tests";

export const metadata: Metadata = {
  title: "Practice Tests | PrepPlay",
  description:
    "Take timed DECA cluster practice exams, then review every question with explanations and performance indicators."
};

// Lists only the real DECA exams. Without the access code they show locked
// (titles only: no questions are sent until the code is entered).
export default async function TestsPage() {
  const tests = getTestSummaries("deca");
  const unlocked = await hasTestsAccess((await cookies()).get(TESTS_ACCESS_COOKIE)?.value);
  // Without the code there's nothing to show here but the code screen.
  if (!unlocked) redirect("/tests-access?next=/exams");
  const freeQuestions = getAllTests("original").reduce((sum, test) => sum + test.questions.length, 0);

  return <TestLibrary tests={tests} locked={!unlocked} freeQuestions={freeQuestions} />;
}
