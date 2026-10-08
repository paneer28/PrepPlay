import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { TestsAccessForm } from "@/components/TestsAccessForm";
import { hasTestsAccess, safeTestsRedirect, TESTS_ACCESS_COOKIE } from "@/lib/tests-access";

export const metadata: Metadata = {
  title: "Practice Tests | PrepPlay",
  robots: { index: false }
};

type TestsAccessPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function TestsAccessPage({ searchParams }: TestsAccessPageProps) {
  const { next } = await searchParams;
  const destination = safeTestsRedirect(next);
  const cookieStore = await cookies();

  // Already unlocked: go straight through.
  if (await hasTestsAccess(cookieStore.get(TESTS_ACCESS_COOKIE)?.value)) {
    redirect(destination);
  }

  return (
    <div className="pb-10 pt-8">
      <TestsAccessForm next={destination} />
    </div>
  );
}
