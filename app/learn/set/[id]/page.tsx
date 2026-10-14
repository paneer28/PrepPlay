import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PracticeTestLoader } from "@/components/PracticeTestLoader";
import { fullTestStorageKey } from "@/lib/test-progress";
import { originalClusterFor, originalClusterHref, originalSetLabel } from "@/lib/question-sets";
import { getAllTests, getTestById, isOriginal } from "@/lib/tests";

type SetPageProps = { params: Promise<{ id: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllTests("original").map((test) => ({ id: test.id }));
}

export async function generateMetadata({ params }: SetPageProps): Promise<Metadata> {
  const { id } = await params;
  const test = getTestById(id);
  return { title: test && isOriginal(test) ? `${originalSetLabel(test)} | PrepPlay` : "Practice set | PrepPlay" };
}

// A full original set on the same timed test screen as the real exams. Free:
// no sign-in or access code.
export default async function OriginalSetPage({ params }: SetPageProps) {
  const { id } = await params;
  const test = getTestById(id);
  if (!test || !isOriginal(test)) notFound();

  const label = originalSetLabel(test);

  return (
    <PracticeTestLoader
      test={{ ...test, title: label }}
      context={{
        storageKey: fullTestStorageKey(test.id),
        subtitle: `PrepPlay practice set · ${test.questions.length} questions · ${test.timeLimitMinutes} min`,
        backHref: originalClusterHref(test.cluster),
        backLabel: `${originalClusterFor(test.cluster)?.label ?? "Practice"} sets`,
        upload: { mode: "full", testId: test.id },
        set: "original",
        resume: { label, href: `/learn/set/${test.id}` }
      }}
    />
  );
}
