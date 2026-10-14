// The two kinds of questions in PrepPlay, and where each one lives in the app.
//   deca      real DECA exams (data/tests): sign-in and the access code required
//   original  PrepPlay's own questions (data/originals): free for everyone
// Safe to import from client components (no file system access here).

export type QuestionSet = "deca" | "original";

export function isOriginal(test: { original?: boolean } | null | undefined) {
  return test?.original === true;
}

export function questionSetOf(test: { original?: boolean } | null | undefined): QuestionSet {
  return isOriginal(test) ? "original" : "deca";
}

// Routes and browser storage per set. Custom practice keeps a separate saved
// session for each set so one never replaces the other.
export const SET_ROUTES = {
  deca: {
    home: "/tests",
    custom: "/tests/custom",
    session: "/tests/custom/session",
    questionsApi: "/api/practice-questions",
    sessionKey: "prepplay:custom-session",
    attemptKey: "prepplay:custom-session:attempt"
  },
  original: {
    home: "/practice-questions",
    custom: "/practice-questions/custom",
    session: "/practice-questions/custom/session",
    questionsApi: "/api/original-questions",
    sessionKey: "prepplay:original-session",
    attemptKey: "prepplay:original-session:attempt"
  }
} as const satisfies Record<QuestionSet, Record<string, string>>;

export function customAreaHref(set: QuestionSet, area: string) {
  return `${SET_ROUTES[set].custom}?area=${encodeURIComponent(area)}`;
}

// The clusters the original questions cover, as shown on /practice-questions.
// `cluster` matches the "cluster" field in the JSON files.
export const ORIGINAL_CLUSTERS = [
  { slug: "business-core", label: "Business Core", short: "Core", cluster: "Business Administration Core" },
  { slug: "business-management", label: "Business Management", short: "BMA", cluster: "Business Management and Administration" },
  { slug: "marketing", label: "Marketing", short: "MKT", cluster: "Marketing" }
] as const;

export type OriginalCluster = (typeof ORIGINAL_CLUSTERS)[number];

export function originalClusterFor(cluster: string): OriginalCluster | undefined {
  return ORIGINAL_CLUSTERS.find((item) => item.cluster === cluster);
}

export function originalClusterHref(cluster: string) {
  const match = originalClusterFor(cluster);
  return match ? `${SET_ROUTES.original.home}/${match.slug}` : SET_ROUTES.original.home;
}

export const originalSetHref = (testId: string) => `${SET_ROUTES.original.home}/set/${testId}`;

// "Set 2" from "PrepPlay Original: Marketing Set 2".
export function originalSetNumber(title: string) {
  return title.match(/Set (\d+)/i)?.[1] ?? null;
}

// "Marketing · Set 2"
export function originalSetLabel(test: { title: string; cluster: string }) {
  const cluster = originalClusterFor(test.cluster)?.label ?? test.cluster;
  const number = originalSetNumber(test.title);
  return number ? `${cluster} · Set ${number}` : test.title;
}
