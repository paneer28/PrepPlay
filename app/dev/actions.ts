"use server";

import { revalidatePath } from "next/cache";
import { getViewer } from "@/lib/auth";
import { DEFAULT_QUESTION_COUNT, isDeveloper, MAX_QUESTION_COUNT, type ShareQuizInput } from "@/lib/share-quiz-shared";
import { shareQuizPool } from "@/lib/share-quizzes";
import { createClient } from "@/lib/supabase/server";
import { getTestById } from "@/lib/tests";
import { questionRef } from "@/lib/test-format";

type Result = { ok: true; id: string } | { ok: false; error: string };

// Developer-only; the table's RLS checks the same thing.
async function developerClient() {
  const viewer = await getViewer();
  if (!isDeveloper(viewer?.email)) return null;
  return createClient();
}

function newSlug() {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

function clean(input: ShareQuizInput) {
  const unique = (items: string[]) => [...new Set(items.map((item) => item.trim()).filter(Boolean))];
  const testIds = unique(input.testIds).filter((id) => getTestById(id));
  const questionRefs = unique(input.questionRefs).slice(0, 500);
  return {
    title: input.title.trim().slice(0, 80) || "DECA quick quiz",
    testIds,
    areas: unique(input.areas),
    questionRefs,
    questionCount: Math.min(MAX_QUESTION_COUNT, Math.max(1, Math.round(input.questionCount) || DEFAULT_QUESTION_COUNT))
  };
}

function toRow(quiz: ReturnType<typeof clean>) {
  return {
    title: quiz.title,
    test_ids: quiz.testIds,
    areas: quiz.areas,
    question_refs: quiz.questionRefs,
    question_count: quiz.questionCount
  };
}

export async function saveShareQuiz(input: ShareQuizInput, id?: string): Promise<Result> {
  const supabase = await developerClient();
  if (!supabase) return { ok: false, error: "Only developers can make quizzes." };

  const quiz = clean(input);
  if (shareQuizPool(quiz).length === 0) return { ok: false, error: "Pick at least one test or question." };

  if (id) {
    const { error } = await supabase.from("share_quizzes").update(toRow(quiz)).eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dev");
    return { ok: true, id };
  }

  // A clash on an 8-character slug is very unlikely; try a couple of times anyway.
  for (let tries = 0; tries < 3; tries += 1) {
    const slug = newSlug();
    const { error } = await supabase.from("share_quizzes").insert({ id: slug, ...toRow(quiz) });
    if (!error) {
      revalidatePath("/dev");
      return { ok: true, id: slug };
    }
    if (error.code !== "23505") return { ok: false, error: error.message };
  }

  return { ok: false, error: "Could not save the quiz. Try again." };
}

export async function setShareQuizActive(id: string, active: boolean): Promise<Result> {
  const supabase = await developerClient();
  if (!supabase) return { ok: false, error: "Only developers can change quizzes." };

  const { error } = await supabase.from("share_quizzes").update({ active }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dev");
  return { ok: true, id };
}

export async function deleteShareQuiz(id: string): Promise<Result> {
  const supabase = await developerClient();
  if (!supabase) return { ok: false, error: "Only developers can delete quizzes." };

  const { error } = await supabase.from("share_quizzes").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dev");
  return { ok: true, id };
}

export type PickableQuestion = { ref: string; number: number; question: string; area: string };

// Question text for hand-picking, one test at a time.
export async function listTestQuestions(testId: string): Promise<PickableQuestion[]> {
  const viewer = await getViewer();
  const test = isDeveloper(viewer?.email) ? getTestById(testId) : undefined;
  if (!test) return [];

  return test.questions.map((question) => ({
    ref: questionRef(test.id, question.number),
    number: question.number,
    question: question.question,
    area: question.performanceIndicator.instructionalArea?.trim() || "Other"
  }));
}
