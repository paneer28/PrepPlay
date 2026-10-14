import { getViewer } from "@/lib/auth";
import { ORIGINAL_CLUSTERS } from "@/lib/question-sets";
import { getOriginalProgress } from "@/lib/test-results";
import { getTestSummaries } from "@/lib/tests";

// Server helpers for the /learn pages.

export function originalClusters() {
  const sets = getTestSummaries("original");
  return ORIGINAL_CLUSTERS.map((cluster) => ({
    slug: cluster.slug,
    label: cluster.label,
    cluster: cluster.cluster,
    sets: sets
      .filter((set) => set.cluster === cluster.cluster)
      .sort((left, right) => left.title.localeCompare(right.title, undefined, { numeric: true }))
  }));
}

export const originalQuestionCount = () => getTestSummaries("original").reduce((sum, set) => sum + set.questionCount, 0);

// Saved progress for signed-in users, as plain objects for client components.
export async function originalProgressForViewer() {
  if (!(await getViewer())) return null;
  const progress = await getOriginalProgress();
  if (!progress) return null;
  return { sets: Object.fromEntries(progress.sets), sources: Object.fromEntries(progress.sources) };
}
