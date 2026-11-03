import type { Metadata } from "next";
import { UnlimitedPage } from "@/components/unlimited/UnlimitedPage";

export const metadata: Metadata = {
  title: "Infinite Exam Practice | PrepPlay",
  description: "Endless random questions from real DECA cluster exams, checked as you go."
};

export default async function ExamsUnlimitedPage({ searchParams }: { searchParams: Promise<{ cluster?: string; start?: string }> }) {
  const { cluster, start } = await searchParams;
  return <UnlimitedPage set="deca" requested={cluster} start={start === "1"} />;
}
