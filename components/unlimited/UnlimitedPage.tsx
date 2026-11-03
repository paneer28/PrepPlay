import { SourceSwitch } from "@/components/roads/SourceSwitch";
import { UnlimitedPracticeLoader } from "@/components/unlimited/UnlimitedPracticeLoader";
import { getViewer } from "@/lib/auth";
import { DECA_CLUSTERS } from "@/lib/deca-events";
import { getViewerEvent } from "@/lib/profile";
import { originalClusterFor, SET_ROUTES, type QuestionSet } from "@/lib/question-sets";
import type { ReviewEvent } from "@/lib/review";
import { getAnswerHistory } from "@/lib/test-results";
import { getQuestionIndex } from "@/lib/tests";

export type UnlimitedCluster = { cluster: string; label: string; count: number; href: string };

function clusterLabel(set: QuestionSet, cluster: string) {
  if (set === "original") return originalClusterFor(cluster)?.label ?? cluster;
  return DECA_CLUSTERS.find((item) => item.examCluster === cluster)?.label ?? cluster;
}

// Unlimited mode for one question set (/exams/unlimited, /learn/unlimited):
// random questions from one cluster, one after another, until the visitor stops.
// The cluster is ?cluster=, else the viewer's event's cluster, else the biggest.
// `start`: skip the start card (the one-click card on the Road).
export async function UnlimitedPage({ set, requested, start = false }: { set: QuestionSet; requested?: string; start?: boolean }) {
  const [index, event, viewer] = await Promise.all([Promise.resolve(getQuestionIndex(set)), getViewerEvent(), getViewer()]);

  // One ref per distinct question (copies on several exams share an `item`);
  // `canonical` maps every copy to that one.
  const byCluster = new Map<string, string[]>();
  const firstRef = new Map<number, string>();
  const canonical = new Map<string, string>();
  for (const entry of index) {
    if (!firstRef.has(entry.item)) {
      firstRef.set(entry.item, entry.ref);
      byCluster.set(entry.cluster, [...(byCluster.get(entry.cluster) ?? []), entry.ref]);
    }
    canonical.set(entry.ref, firstRef.get(entry.item)!);
  }

  const clusters: UnlimitedCluster[] = [...byCluster.entries()]
    .map(([cluster, refs]) => ({
      cluster,
      label: clusterLabel(set, cluster),
      count: refs.length,
      href: `${SET_ROUTES[set].unlimited}?cluster=${encodeURIComponent(cluster)}`
    }))
    .sort((left, right) => right.count - left.count);

  const mine = event?.examCluster && byCluster.has(event.examCluster) ? event.examCluster : null;
  // Entrepreneurship has no PrepPlay sets of its own yet, so its events start on Core.
  const fallback = event && set === "original" && byCluster.has("Business Administration Core") ? "Business Administration Core" : clusters[0]?.cluster;
  const cluster = requested && byCluster.has(requested) ? requested : (mine ?? fallback);
  const pool = cluster ? (byCluster.get(cluster) ?? []) : [];

  // Everything they've answered in this cluster anywhere on the site, so
  // questions missed on full tests and custom practice come back here too.
  const inPool = new Set(pool);
  const testIds = [...new Set(index.filter((entry) => entry.cluster === cluster).map((entry) => entry.testId))];
  const history: ReviewEvent[] = viewer
    ? (await getAnswerHistory(testIds)).flatMap((event) => {
        const ref = canonical.get(event.ref);
        return ref && inPool.has(ref) ? [{ ...event, ref }] : [];
      })
    : [];

  return (
    <UnlimitedPracticeLoader
      set={set}
      cluster={cluster ?? ""}
      label={cluster ? clusterLabel(set, cluster) : ""}
      pool={pool}
      history={history}
      clusters={clusters}
      myCluster={mine}
      signedIn={Boolean(viewer)}
      autoStart={start && pool.length > 0}
      source={<SourceSwitch set={set} mode="unlimited" />}
    />
  );
}
