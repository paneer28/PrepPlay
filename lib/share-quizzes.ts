import { createClient } from "@/lib/supabase/server";
import { getAllTests, getQuestionsByRefs } from "@/lib/tests";
import { questionRef } from "@/lib/test-format";
import type { ShareQuiz } from "@/lib/share-quiz-shared";
import type { TestQuestion } from "@/types";

type ShareQuizRow = {
  id: string;
  title: string;
  test_ids: string[];
  areas: string[];
  question_refs: string[];
  question_count: number;
  active: boolean;
  plays: number;
  correct_total: number;
  answered_total: number;
  created_at: string;
};

const COLUMNS = "id, title, test_ids, areas, question_refs, question_count, active, plays, correct_total, answered_total, created_at";

function fromRow(row: ShareQuizRow): ShareQuiz {
  return {
    id: row.id,
    title: row.title,
    testIds: row.test_ids ?? [],
    areas: row.areas ?? [],
    questionRefs: row.question_refs ?? [],
    questionCount: row.question_count,
    active: row.active,
    plays: row.plays,
    correctTotal: row.correct_total,
    answeredTotal: row.answered_total,
    createdAt: row.created_at
  };
}

// One quiz by id: active ones for everyone, any for developers (RLS decides).
export async function getShareQuiz(id: string): Promise<ShareQuiz | null> {
  const supabase = await createClient();
  if (!supabase || !/^[a-z0-9]{6,16}$/.test(id)) return null;

  const { data } = await supabase.from("share_quizzes").select(COLUMNS).eq("id", id).maybeSingle<ShareQuizRow>();
  return data ? fromRow(data) : null;
}

// Every quiz, newest first. Only developers get rows back (RLS); null when the
// table is missing because the migration hasn't been run yet.
export async function listShareQuizzes(): Promise<ShareQuiz[] | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase.from("share_quizzes").select(COLUMNS).order("created_at", { ascending: false });
  if (error) return null;
  return (data as ShareQuizRow[]).map(fromRow);
}

// Every question ref a quiz can draw from: the hand-picked ones, or every
// question on its tests in its instructional areas.
export function shareQuizPool(quiz: Pick<ShareQuiz, "testIds" | "areas" | "questionRefs">): string[] {
  if (quiz.questionRefs.length > 0) return quiz.questionRefs;

  const tests = new Set(quiz.testIds);
  const areas = new Set(quiz.areas);

  return getAllTests()
    .filter((test) => tests.has(test.id))
    .flatMap((test) =>
      test.questions
        .filter((question) => areas.size === 0 || areas.has(question.performanceIndicator.instructionalArea?.trim() || "Other"))
        .map((question) => questionRef(test.id, question.number))
    );
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}

// A fresh random draw for one visitor. Hand-picked quizzes no bigger than their
// question count keep the order they were picked in.
export function drawShareQuizQuestions(quiz: ShareQuiz): TestQuestion[] {
  const pool = shareQuizPool(quiz);
  const fixed = quiz.questionRefs.length > 0 && pool.length <= quiz.questionCount;
  const questions = getQuestionsByRefs(fixed ? pool : shuffle(pool)).slice(0, quiz.questionCount);

  return questions.map((question, index) => ({ ...question, number: index + 1 }));
}
