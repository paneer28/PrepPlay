import type { Metadata } from "next";
import Link from "next/link";
import { ClusterCards } from "@/components/originals/OriginalCards";
import { TestModeSwitch } from "@/components/TestModeSwitch";
import { HeroFadeIn } from "@/components/ui/motion-wrappers";
import { ViewSwitcher, type View } from "@/components/ViewSwitcher";
import { originalClusters, originalProgressForViewer, originalQuestionCount } from "@/lib/originals";
import { getViewerEvent } from "@/lib/profile";

export const metadata: Metadata = {
  title: "Practice Questions | PrepPlay",
  description: "Free DECA-style practice questions for Business Core, Business Management, Finance, Hospitality & Tourism and Marketing, sorted by performance indicator."
};

export default async function LearnPage() {
  const [progress, event] = await Promise.all([originalProgressForViewer(), getViewerEvent()]);
  // The viewer's event's cluster goes first.
  const clusters = originalClusters().sort((a, b) => Number(b.cluster === event?.examCluster) - Number(a.cluster === event?.examCluster));

  // Learn can hold more than one view; the tab bar appears once there are two.
  const views: View[] = [
    {
      id: "practice-questions",
      label: "Practice questions",
      content: <PracticeQuestions clusters={clusters} progress={progress} myCluster={event?.examCluster ?? null} />
    }
    // TODO: add the learning path as a second view when it's built.
    // { id: "path", label: "Path", content: <LearningPath /> }
  ];

  return <ViewSwitcher views={views} label="Learn" />;
}

function PracticeQuestions({
  clusters,
  progress,
  myCluster
}: {
  clusters: ReturnType<typeof originalClusters>;
  progress: Awaited<ReturnType<typeof originalProgressForViewer>>;
  myCluster: string | null;
}) {
  return (
    <div className="space-y-10 pb-10">
      <TestModeSwitch active="full" set="original" />

      <HeroFadeIn>
        <header className="max-w-2xl space-y-2">
          <h1 className="font-display text-h2 font-extrabold text-fg sm:text-h1">Practice questions</h1>
          <p className="text-[18px] text-fg">
            {originalQuestionCount()} questions written in DECA style, sorted by performance indicator. Free to use.
          </p>
          {!progress ? (
            <p className="text-small text-fg-muted">
              <Link href="/login?next=/learn" className="font-bold text-brand-text hover:underline">
                Log in
              </Link>{" "}
              to save your scores to your dashboard.
            </p>
          ) : null}
        </header>
      </HeroFadeIn>

      <ClusterCards clusters={clusters} sources={progress?.sources ?? null} myCluster={myCluster} />
    </div>
  );
}
