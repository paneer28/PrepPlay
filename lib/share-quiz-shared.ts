// Share quizzes: short quizzes made on /dev and taken at /q/<id> from a QR code,
// no account needed. Safe to import from client components.

// Who can open /dev and make quizzes. Keep in sync with
// public.is_prepplay_developer() in supabase/migrations/2026-10-29-share-quizzes.sql.
export const DEVELOPER_EMAILS = ["eppendeyala@gmail.com"];

export function isDeveloper(email: string | null | undefined) {
  return Boolean(email) && DEVELOPER_EMAILS.includes(email!.trim().toLowerCase());
}

export const DEFAULT_QUESTION_COUNT = 10;
export const MAX_QUESTION_COUNT = 50;

export interface ShareQuiz {
  id: string;
  title: string;
  testIds: string[];
  areas: string[];
  questionRefs: string[];
  questionCount: number;
  active: boolean;
  plays: number;
  correctTotal: number;
  answeredTotal: number;
  createdAt: string;
}

// What the builder sends to create or edit a quiz.
export interface ShareQuizInput {
  title: string;
  testIds: string[];
  areas: string[];
  questionRefs: string[];
  questionCount: number;
}

export const shareQuizPath = (id: string) => `/q/${id}`;
