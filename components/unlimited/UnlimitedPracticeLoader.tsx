"use client";

import dynamic from "next/dynamic";
import { LoadingState } from "@/components/LoadingState";

// Unlimited mode keeps the running session in localStorage, which only exists
// in the browser, so it skips server rendering.
export const UnlimitedPracticeLoader = dynamic(
  () => import("@/components/unlimited/UnlimitedPractice").then((mod) => mod.UnlimitedPractice),
  { ssr: false, loading: () => <LoadingState label="Loading unlimited mode" /> }
);
