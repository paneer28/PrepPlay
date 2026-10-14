import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClusterIcon } from "@/components/ds/ClusterIcon";
import { SetCards } from "@/components/originals/OriginalCards";
import { TestModeSwitch } from "@/components/TestModeSwitch";
import { originalClusters, originalProgressForViewer } from "@/lib/originals";
import { ORIGINAL_CLUSTERS } from "@/lib/question-sets";

type ClusterPageProps = { params: Promise<{ cluster: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return ORIGINAL_CLUSTERS.map((cluster) => ({ cluster: cluster.slug }));
}

export async function generateMetadata({ params }: ClusterPageProps): Promise<Metadata> {
  const { cluster } = await params;
  const match = ORIGINAL_CLUSTERS.find((item) => item.slug === cluster);
  return { title: `${match?.label ?? "Practice"} practice sets | PrepPlay` };
}

export default async function ClusterSetsPage({ params }: ClusterPageProps) {
  const { cluster: slug } = await params;
  const cluster = originalClusters().find((item) => item.slug === slug);
  if (!cluster) notFound();

  const progress = await originalProgressForViewer();
  const questions = cluster.sets.reduce((sum, set) => sum + set.questionCount, 0);

  return (
    <div className="space-y-10 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/practice-questions" className="inline-flex items-center gap-1.5 rounded-control text-small font-bold text-brand-text hover:underline">
          <ArrowLeftIcon size={16} weight="bold" aria-hidden="true" />
          All clusters
        </Link>
        <TestModeSwitch active="full" set="original" fullHref={`/practice-questions/${cluster.slug}`} />
      </div>

      <header className="flex items-center gap-4">
        <ClusterIcon cluster={cluster.cluster} size={56} />
        <div>
          <h1 className="font-display text-h2 font-extrabold text-fg sm:text-h1">{cluster.label}</h1>
          <p className="text-fg">
            {cluster.sets.length} sets · {questions} questions. Each set is timed like the real exam, about a minute a question.
          </p>
        </div>
      </header>

      <SetCards sets={cluster.sets} progress={progress?.sets ?? null} />
    </div>
  );
}
