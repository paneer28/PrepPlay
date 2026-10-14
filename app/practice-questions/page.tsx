import type { Metadata } from "next";
import Link from "next/link";
import { ClusterCards } from "@/components/originals/OriginalCards";
import { TestModeSwitch } from "@/components/TestModeSwitch";
import { HeroFadeIn } from "@/components/ui/motion-wrappers";
import { originalClusters, originalProgressForViewer, originalQuestionCount } from "@/lib/originals";

export const metadata: Metadata = {
  title: "Practice Questions | PrepPlay",
  description: "Free DECA-style practice questions for Business Core, Business Management and Marketing, sorted by performance indicator."
};

export default async function PracticeQuestionsPage() {
  const clusters = originalClusters();
  const progress = await originalProgressForViewer();

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
              <Link href="/login?next=/practice-questions" className="font-bold text-brand-text hover:underline">
                Log in
              </Link>{" "}
              to save your scores to your dashboard.
            </p>
          ) : null}
        </header>
      </HeroFadeIn>

      <ClusterCards clusters={clusters} sources={progress?.sources ?? null} />
    </div>
  );
}
