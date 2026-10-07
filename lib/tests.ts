import fs from "node:fs";
import path from "node:path";
import { questionRef } from "@/lib/test-format";
import type { PracticeTest, PracticeTestSummary, QuestionIndexEntry, TestQuestion } from "@/types";

// Every *.json file in this folder is a practice test. Add or remove files here;
// no page code needs to change.
const TESTS_DIR = path.join(process.cwd(), "data", "tests");

let cache: PracticeTest[] | null = null;

function loadTests(): PracticeTest[] {
  // Re-read in development so newly added files show up without a restart.
  if (cache && process.env.NODE_ENV === "production") {
    return cache;
  }

  if (!fs.existsSync(TESTS_DIR)) {
    cache = [];
    return cache;
  }

  const files = fs
    .readdirSync(TESTS_DIR)
    .filter((file) => file.toLowerCase().endsWith(".json"))
    .sort();

  const tests = files.map((file) => {
    const raw = fs.readFileSync(path.join(TESTS_DIR, file), "utf8");

    try {
      return JSON.parse(raw) as PracticeTest;
    } catch (error) {
      throw new Error(
        `Could not parse data/tests/${file}. Run "npm run validate:tests" for details. (${(error as Error).message})`
      );
    }
  });

  tests.sort(
    (left, right) =>
      left.cluster.localeCompare(right.cluster) ||
      (right.year ?? 0) - (left.year ?? 0) ||
      left.title.localeCompare(right.title)
  );

  cache = tests;
  return cache;
}

export function getAllTests(): PracticeTest[] {
  return loadTests();
}

export function getTestSummaries(): PracticeTestSummary[] {
  return loadTests().map((test) => ({
    id: test.id,
    title: test.title,
    cluster: test.cluster,
    year: test.year ?? null,
    event: test.event ?? null,
    timeLimitMinutes: test.timeLimitMinutes,
    questionCount: test.questions.length
  }));
}

export function getTestById(id: string): PracticeTest | undefined {
  return loadTests().find((test) => test.id === id);
}


export function getQuestionIndex(): QuestionIndexEntry[] {
  return loadTests().flatMap((test) =>
    test.questions.map((question) => ({
      ref: questionRef(test.id, question.number),
      testId: test.id,
      number: question.number,
      event: test.event ?? null,
      year: test.year ?? null,
      cluster: test.cluster,
      instructionalArea: question.performanceIndicator.instructionalArea?.trim() || "Other",
      piCode: question.performanceIndicator.code,
      piText: question.performanceIndicator.text || null
    }))
  );
}

// Full question data (with origin) for the given refs, in the order requested.
// Unknown refs are skipped, e.g. if a test file was removed after a session was built.
export function getQuestionsByRefs(refs: string[]): TestQuestion[] {
  const lookup = new Map<string, TestQuestion>();

  for (const test of loadTests()) {
    for (const question of test.questions) {
      lookup.set(questionRef(test.id, question.number), {
        ...question,
        origin: {
          testId: test.id,
          title: test.title,
          year: test.year ?? null,
          event: test.event ?? null,
          number: question.number
        }
      });
    }
  }

  return refs.flatMap((ref) => lookup.get(ref) ?? []);
}
