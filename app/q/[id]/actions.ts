"use server";

import { drawShareQuizQuestions, getShareQuiz } from "@/lib/share-quizzes";
import type { TestQuestion } from "@/types";

// A fresh random set of questions for "Try new questions".
export async function drawShareQuiz(id: string): Promise<TestQuestion[] | null> {
  const quiz = await getShareQuiz(id);
  return quiz?.active ? drawShareQuizQuestions(quiz) : null;
}
