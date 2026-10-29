import type { Metadata } from "next";
import { ButtonLink } from "@/components/ds/Button";
import { Illustration } from "@/components/ds/Illustration";
import { ShareQuizLoader } from "@/components/share-quiz/ShareQuizLoader";
import { getViewer } from "@/lib/auth";
import { drawShareQuizQuestions, getShareQuiz } from "@/lib/share-quizzes";
import { getAllTests } from "@/lib/tests";

// A share quiz from a QR code (made on /dev). No account or access code needed;
// every visit draws its own random questions.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const quiz = await getShareQuiz((await params).id);
  return {
    title: quiz ? `${quiz.title} | PrepPlay` : "Quiz | PrepPlay",
    description: "A quick quiz with real DECA exam questions. No account needed.",
    robots: { index: false }
  };
}

export default async function ShareQuizPage({ params }: Props) {
  const { id } = await params;
  const [quiz, viewer] = await Promise.all([getShareQuiz(id), getViewer()]);
  const questions = quiz?.active ? drawShareQuizQuestions(quiz) : [];

  if (!quiz || !quiz.active || questions.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center py-12 text-center">
        <Illustration kind="empty" size={140} />
        <h1 className="mt-6 font-display text-h3 font-extrabold text-fg">This quiz isn&apos;t available</h1>
        <p className="mt-2 text-fg">The link may be old or the quiz was turned off. You can still practice with PrepPlay&apos;s free questions.</p>
        <ButtonLink href="/learn" size="lg" block className="mt-6">
          Practice for free
        </ButtonLink>
      </div>
    );
  }

  const bankSize = getAllTests("deca").reduce((sum, test) => sum + test.questions.length, 0);

  return <ShareQuizLoader quizId={quiz.id} title={quiz.title} questions={questions} bankSize={bankSize} signedIn={Boolean(viewer)} />;
}
