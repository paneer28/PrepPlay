"use client";

import dynamic from "next/dynamic";
import { LoadingState } from "@/components/LoadingState";

// The quiz restores an unfinished run from sessionStorage, which only exists in
// the browser, so it skips server rendering.
export const ShareQuizLoader = dynamic(() => import("@/components/share-quiz/ShareQuiz").then((mod) => mod.ShareQuiz), {
  ssr: false,
  loading: () => <LoadingState label="Loading your quiz" />
});
