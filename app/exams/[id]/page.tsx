import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PracticeTestLoader } from "@/components/PracticeTestLoader";
import { getAllTests, getTestById, isOriginal } from "@/lib/tests";

type TestPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamicParams = false;

// Real exams only; originals have their own pages under /learn.
export function generateStaticParams() {
  return getAllTests("deca").map((test) => ({ id: test.id }));
}

export async function generateMetadata({ params }: TestPageProps): Promise<Metadata> {
  const { id } = await params;
  const test = getTestById(id);

  return {
    title: test ? `${test.title} | PrepPlay` : "Practice Test | PrepPlay"
  };
}

export default async function TestPage({ params }: TestPageProps) {
  const { id } = await params;
  const test = getTestById(id);

  if (!test || isOriginal(test)) {
    notFound();
  }

  return <PracticeTestLoader test={test} />;
}
