import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { QuizBuilder, type DevTest } from "@/components/dev/QuizBuilder";
import { QuizCard } from "@/components/dev/QuizCard";
import { getViewer } from "@/lib/auth";
import { isDeveloper, shareQuizPath } from "@/lib/share-quiz-shared";
import { listShareQuizzes, shareQuizPool } from "@/lib/share-quizzes";
import { getSiteUrl } from "@/lib/site";
import { getAllTests } from "@/lib/tests";
import { formatTestMeta } from "@/lib/test-format";

export const metadata: Metadata = {
  title: "Developer tools | PrepPlay",
  robots: { index: false }
};

// Links use the address this page was opened on, so QR codes made on a preview
// or localhost point there; production gets the live domain.
async function siteOrigin() {
  const list = await headers();
  const host = list.get("x-forwarded-host") ?? list.get("host");
  if (!host) return getSiteUrl();
  const protocol = list.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

export default async function DevToolsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login?mode=login&next=/dev");
  if (!isDeveloper(viewer.email)) notFound();

  const [quizzes, origin] = await Promise.all([listShareQuizzes(), siteOrigin()]);

  const tests: DevTest[] = getAllTests().map((test) => {
    const areaCounts: Record<string, number> = {};
    for (const question of test.questions) {
      const area = question.performanceIndicator.instructionalArea?.trim() || "Other";
      areaCounts[area] = (areaCounts[area] ?? 0) + 1;
    }
    return {
      id: test.id,
      title: test.title,
      meta: formatTestMeta(test),
      cluster: test.cluster,
      original: test.original === true,
      questionCount: test.questions.length,
      areaCounts
    };
  });

  const cards = await Promise.all(
    (quizzes ?? []).map(async (quiz) => {
      const url = `${origin}${shareQuizPath(quiz.id)}`;
      const svg = await QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M" });
      return { quiz, url, svg, poolSize: shareQuizPool(quiz).length };
    })
  );

  return (
    <div className="space-y-10 pb-10">
      <header className="space-y-2">
        <p className="text-label font-bold text-fg-muted">Developer tools</p>
        <h1 className="font-display text-h2 font-extrabold text-fg sm:text-h1">QR quizzes</h1>
        <p className="max-w-2xl text-fg-muted">
          Make a short quiz from any tests or questions and share its QR code. Anyone who scans it can take the quiz on their phone with
          no account, and each person gets their own random draw. At the end they&apos;re invited to sign up.
        </p>
      </header>

      {quizzes === null ? (
        <p className="rounded-control bg-wrong-tint px-4 py-3 font-bold text-wrong-text">
          The quizzes table isn&apos;t set up yet. Run supabase/migrations/2026-10-29-share-quizzes.sql in the Supabase SQL Editor, then
          reload this page.
        </p>
      ) : null}

      <QuizBuilder tests={tests} />

      <section className="space-y-4" aria-labelledby="dev-quizzes">
        <h2 id="dev-quizzes" className="font-display text-h3 font-extrabold text-fg">
          Your quizzes
        </h2>
        {cards.length === 0 ? (
          <p className="text-fg-muted">No quizzes yet. Make one above and its QR code shows up here.</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {cards.map((card) => (
              <QuizCard key={card.quiz.id} {...card} tests={tests} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
