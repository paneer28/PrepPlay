import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ExamStop } from "@/components/roads/ExamStop";
import { getViewerEvent } from "@/lib/profile";
import { areaSlug, cardItem, piFromSlug } from "@/lib/road-shared";
import { checkpointRefs, examRoadFor, getFlashcard, getPi, questionsForPi, weakSpotRefs } from "@/lib/roads";
import { getQuestionsByRefs } from "@/lib/tests";

type Props = { params: Promise<{ stop: string }> };

export const metadata: Metadata = { title: "Exam road | PrepPlay", robots: { index: false } };

const CHECKPOINT_LENGTH = 10;

export default async function ExamStopPage({ params }: Props) {
  const { stop } = await params;

  if (stop.startsWith("checkpoint-")) {
    const road = examRoadFor(await getViewerEvent());
    if (!road) redirect("/learn");
    const checkpoint = road.units.flatMap((unit) => unit.stops).find((item) => item.id === stop);
    if (!checkpoint) redirect("/learn");

    return <ExamStop title="Checkpoint" summary={`Road checkpoint · ${stop.replace("checkpoint-", "").replace(/-/g, " ")}`} card={null} questions={getQuestionsByRefs(checkpointRefs(checkpoint.codes, CHECKPOINT_LENGTH), "original")} item={checkpoint.item} />;
  }

  if (stop.startsWith("weak-")) {
    const road = examRoadFor(await getViewerEvent());
    const units = road?.units.filter((unit) => areaSlug(unit.title) === stop.replace("weak-", "")) ?? [];
    if (units.length === 0) redirect("/learn");
    const codes = units.flatMap((unit) => unit.stops.filter((item) => item.kind === "pi").flatMap((item) => item.codes));
    const area = units[0].title;
    const questions = getQuestionsByRefs(await weakSpotRefs(codes, CHECKPOINT_LENGTH), "original");
    if (questions.length === 0) redirect("/learn");
    return <ExamStop title={area} summary={`Road weak spot · ${area}`} card={null} questions={questions} item={null} practice />;
  }

  const code = piFromSlug(stop);
  const pi = getPi(code);
  const flashcard = getFlashcard(code);
  if (!pi || !flashcard) notFound();

  const questions = questionsForPi(code);
  return (
    <ExamStop
      title={pi.text}
      summary={`Road · ${code}`}
      card={{ code, front: flashcard.front, back: flashcard.back, area: pi.instructionalArea }}
      questions={questions}
      item={questions.length ? null : cardItem(code)}
    />
  );
}
