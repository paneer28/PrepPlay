import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PracticeTestLoader } from "@/components/PracticeTestLoader";
import { getAllTests, getTestById } from "@/lib/tests";

type TestPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllTests().map((test) => ({ id: test.id }));
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

  if (!test) {
    notFound();
  }

  return <PracticeTestLoader test={test} />;
}
