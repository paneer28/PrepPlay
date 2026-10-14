import fs from "node:fs";
import path from "node:path";
import { isOriginal, type QuestionSet } from "@/lib/question-sets";
import { questionRef } from "@/lib/test-format";
import type { PracticeTest, PracticeTestSummary, QuestionIndexEntry, TestQuestion } from "@/types";

export { isOriginal, type QuestionSet } from "@/lib/question-sets";

// Every *.json file in these folders is a practice test. Add or remove files
// here; no page code needs to change. data/tests holds real DECA exams;
// data/originals holds PrepPlay's own sets (marked "original": true).
const TEST_DIRS = ["tests", "originals"].map((folder) => path.join(process.cwd(), "data", folder));

let cache: PracticeTest[] | null = null;

function loadTests(): PracticeTest[] {
  // Re-read in development so newly added files show up without a restart.
  if (cache && process.env.NODE_ENV === "production") {
    return cache;
  }

  const files = TEST_DIRS.filter((dir) => fs.existsSync(dir)).flatMap((dir) =>
    fs
      .readdirSync(dir)
      .filter((file) => file.toLowerCase().endsWith(".json"))
      .sort()
      .map((file) => path.join(dir, file))
  );

  const tests = files.map((file) => {
    const raw = fs.readFileSync(file, "utf8");

    try {
      return JSON.parse(raw) as PracticeTest;
    } catch (error) {
      throw new Error(
        `Could not parse ${path.relative(process.cwd(), file)}. Run "npm run validate:tests" for details. (${(error as Error).message})`
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

const inSet = (test: PracticeTest, set?: QuestionSet) => !set || isOriginal(test) === (set === "original");

// Every test, or only one set's: "deca" (real exams) or "original".
export function getAllTests(set?: QuestionSet): PracticeTest[] {
  return loadTests().filter((test) => inSet(test, set));
}

export function getTestSummaries(set?: QuestionSet): PracticeTestSummary[] {
  return getAllTests(set).map((test) => ({
    id: test.id,
    title: test.title,
    cluster: test.cluster,
    year: test.year ?? null,
    event: test.event ?? null,
    original: isOriginal(test),
    timeLimitMinutes: test.timeLimitMinutes,
    questionCount: test.questions.length
  }));
}

export function getTestById(id: string): PracticeTest | undefined {
  return loadTests().find((test) => test.id === id);
}


// The same question can appear on several exams. Copies with identical text and
// options share one key, so custom practice can treat them as a single item.
function duplicateKey(question: TestQuestion) {
  const { A, B, C, D } = question.options;
  return JSON.stringify([question.question, A, B, C, D]);
}

export function getQuestionIndex(set?: QuestionSet): QuestionIndexEntry[] {
  const items = new Map<string, number>();

  return getAllTests(set).flatMap((test) =>
    test.questions.map((question) => {
      const key = duplicateKey(question);
      if (!items.has(key)) items.set(key, items.size);

      return {
        ref: questionRef(test.id, question.number),
        item: items.get(key)!,
        testId: test.id,
        number: question.number,
        event: test.event ?? null,
        year: test.year ?? null,
        cluster: test.cluster,
        instructionalArea: question.performanceIndicator.instructionalArea?.trim() || "Other",
        piCode: question.performanceIndicator.code,
        piText: question.performanceIndicator.text || null,
        original: isOriginal(test)
      };
    })
  );
}

// Every question (with origin) by "<testId>#<number>" ref, optionally from one set only.
export function getQuestionLookup(set?: QuestionSet): Map<string, TestQuestion> {
  const lookup = new Map<string, TestQuestion>();

  for (const test of getAllTests(set)) {
    for (const question of test.questions) {
      lookup.set(questionRef(test.id, question.number), {
        ...question,
        origin: {
          testId: test.id,
          title: test.title,
          original: isOriginal(test),
          year: test.year ?? null,
          event: test.event ?? null,
          number: question.number
        }
      });
    }
  }

  return lookup;
}

// Full question data (with origin) for the given refs, in the order requested.
// Unknown refs are skipped, e.g. if a test file was removed after a session was built,
// and so are later copies of a question already included (see duplicateKey).
// With `set`, refs from the other set are skipped too.
export function getQuestionsByRefs(refs: string[], set?: QuestionSet): TestQuestion[] {
  const lookup = getQuestionLookup(set);
  const seen = new Set<string>();

  return refs.flatMap((ref) => {
    const question = lookup.get(ref);
    if (!question) return [];
    const key = duplicateKey(question);
    if (seen.has(key)) return [];
    seen.add(key);
    return [question];
  });
}
