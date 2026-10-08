"use client";

import dynamic from "next/dynamic";
import { LoadingState } from "@/components/LoadingState";

// The test runner restores saved progress from localStorage, which only exists
// in the browser, so it skips server rendering.
export const PracticeTestLoader = dynamic(
  () => import("@/components/PracticeTestRunner").then((mod) => mod.PracticeTestRunner),
  { ssr: false, loading: () => <LoadingState label="Loading test" /> }
);

export const CustomPracticeSessionLoader = dynamic(
  () => import("@/components/CustomPracticeSession").then((mod) => mod.CustomPracticeSession),
  { ssr: false, loading: () => <LoadingState label="Loading your questions" /> }
);
