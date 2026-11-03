import type { Metadata } from "next";
import { UnlimitedPage } from "@/components/unlimited/UnlimitedPage";

export const metadata: Metadata = {
  title: "Infinite Practice | PrepPlay",
  description: "Endless random DECA-style practice questions from your cluster, checked as you go."
};

export default async function LearnUnlimitedPage({ searchParams }: { searchParams: Promise<{ cluster?: string; start?: string }> }) {
  const { cluster, start } = await searchParams;
  return <UnlimitedPage set="original" requested={cluster} start={start === "1"} />;
}
