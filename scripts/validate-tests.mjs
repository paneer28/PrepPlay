#!/usr/bin/env node
// Validates every practice test in data/tests/.
// Usage: npm run validate:tests
// Exits with code 1 if any problem is found.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TESTS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "data", "tests");
const OPTION_KEYS = ["A", "B", "C", "D"];
// Test ids become page URLs under /tests/, so these are taken by other pages.
const RESERVED_IDS = ["custom"];

const problems = [];
const report = (file, question, message) => problems.push({ file, question, message });

const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

if (!fs.existsSync(TESTS_DIR)) {
  console.error(`Folder not found: ${path.relative(process.cwd(), TESTS_DIR)}`);
  process.exit(1);
}

const files = fs
  .readdirSync(TESTS_DIR)
  .filter((file) => file.toLowerCase().endsWith(".json"))
  .sort();

if (files.length === 0) {
  console.warn("No test files found in data/tests/.");
  process.exit(0);
}

const idOwners = new Map();
let questionTotal = 0;

for (const file of files) {
  let test;

  try {
    test = JSON.parse(fs.readFileSync(path.join(TESTS_DIR, file), "utf8"));
  } catch (error) {
    report(file, null, `Invalid JSON: ${error.message}`);
    continue;
  }

  if (!test || typeof test !== "object" || Array.isArray(test)) {
    report(file, null, "Top level must be a JSON object.");
    continue;
  }

  // Test-level fields
  if (!isNonEmptyString(test.id)) {
    report(file, null, `"id" is missing or empty.`);
  } else if (idOwners.has(test.id)) {
    report(file, null, `Duplicate test id "${test.id}" (also used in ${idOwners.get(test.id)}).`);
  } else {
    idOwners.set(test.id, file);
  }

  if (RESERVED_IDS.includes(test.id)) {
    report(file, null, `"id" "${test.id}" is reserved by the site. Choose a different id.`);
  }
  if (isNonEmptyString(test.id) && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(test.id)) {
    report(file, null, `"id" "${test.id}" should be lowercase letters, numbers, and dashes only (it is used in the page URL).`);
  }
  if (!isNonEmptyString(test.title)) report(file, null, `"title" is missing or empty.`);
  if (!isNonEmptyString(test.cluster)) report(file, null, `"cluster" is missing or empty.`);
  if (test.year != null && !Number.isInteger(test.year)) report(file, null, `"year" must be a whole number or null.`);
  if (test.event != null && !isNonEmptyString(test.event)) report(file, null, `"event" must be text or null.`);
  if (!(typeof test.timeLimitMinutes === "number" && test.timeLimitMinutes > 0)) {
    report(file, null, `"timeLimitMinutes" must be a positive number.`);
  }

  if (!Array.isArray(test.questions) || test.questions.length === 0) {
    report(file, null, `"questions" must be a non-empty array.`);
    continue;
  }

  questionTotal += test.questions.length;

  // Question numbers: sequential from 1 with no gaps or duplicates
  const seen = new Map();
  test.questions.forEach((question, index) => {
    const number = question?.number;
    if (!Number.isInteger(number)) {
      report(file, `#${index + 1} in list`, `"number" is missing or not a whole number.`);
      return;
    }
    if (seen.has(number)) {
      report(file, number, `Duplicate question number (also at position ${seen.get(number) + 1} in the list).`);
    } else {
      seen.set(number, index);
    }
    if (number !== index + 1) {
      report(file, number, `Out of sequence: expected question ${index + 1} at this position.`);
    }
  });

  const numbers = [...seen.keys()];
  if (numbers.length > 0) {
    const max = Math.max(...numbers);
    const missing = [];
    for (let n = 1; n <= max; n += 1) {
      if (!seen.has(n)) missing.push(n);
    }
    if (missing.length > 0) {
      report(file, null, `Missing question number(s): ${missing.join(", ")}.`);
    }
  }

  // Per-question content
  test.questions.forEach((question, index) => {
    const label = Number.isInteger(question?.number) ? question.number : `#${index + 1} in list`;

    if (!question || typeof question !== "object") {
      report(file, label, "Question must be an object.");
      return;
    }

    if (!isNonEmptyString(question.question)) report(file, label, `"question" text is missing or empty.`);

    const options = question.options;
    if (!options || typeof options !== "object" || Array.isArray(options)) {
      report(file, label, `"options" must be an object with keys A, B, C, D.`);
    } else {
      const keys = Object.keys(options);
      const extra = keys.filter((key) => !OPTION_KEYS.includes(key));
      const missingKeys = OPTION_KEYS.filter((key) => !(key in options));
      if (missingKeys.length > 0) report(file, label, `Missing option(s): ${missingKeys.join(", ")}.`);
      if (extra.length > 0) report(file, label, `Unexpected option key(s): ${extra.join(", ")}. Only A–D are allowed.`);
      for (const key of OPTION_KEYS) {
        if (key in options && !isNonEmptyString(options[key])) {
          report(file, label, `Option ${key} is empty.`);
        }
      }
    }

    if (!OPTION_KEYS.includes(question.answer)) {
      report(file, label, `"answer" must be one of A, B, C, D (got ${JSON.stringify(question.answer)}).`);
    }

    if (!isNonEmptyString(question.explanation)) report(file, label, `"explanation" is missing or empty.`);
    if (question.source != null && typeof question.source !== "string") {
      report(file, label, `"source" must be text or null.`);
    }

    const pi = question.performanceIndicator;
    if (!pi || typeof pi !== "object") {
      report(file, label, `"performanceIndicator" is missing.`);
    } else {
      if (!isNonEmptyString(pi.code)) report(file, label, `Performance indicator "code" is missing or empty.`);
      // "text" may be null or empty for now (the UI shows the code alone).
      if (pi.text != null && typeof pi.text !== "string") {
        report(file, label, `Performance indicator "text" must be text or null.`);
      }
      if (!isNonEmptyString(pi.instructionalArea)) {
        report(file, label, `Performance indicator "instructionalArea" is missing or empty (needed for the results breakdown).`);
      }
      if (pi.level != null && typeof pi.level !== "string") {
        report(file, label, `Performance indicator "level" must be text or null.`);
      }
    }
  });
}

if (problems.length === 0) {
  console.log(`✓ ${files.length} test file(s), ${questionTotal} question(s). No problems found.`);
  process.exit(0);
}

const byFile = new Map();
for (const problem of problems) {
  if (!byFile.has(problem.file)) byFile.set(problem.file, []);
  byFile.get(problem.file).push(problem);
}

for (const [file, fileProblems] of byFile) {
  console.error(`\ndata/tests/${file}`);
  for (const { question, message } of fileProblems) {
    console.error(`  ${question == null ? "File" : `Question ${question}`}: ${message}`);
  }
}

console.error(`\n✗ ${problems.length} problem(s) in ${byFile.size} of ${files.length} file(s).`);
process.exit(1);
