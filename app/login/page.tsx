import { redirect } from "next/navigation";
import { AuthCard } from "@/components/AuthCard";
import { getViewer } from "@/lib/auth";
import { safeNext } from "@/lib/safe-redirect";

// ?mode=login opens on Log in; otherwise the page opens on sign-up.
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; mode?: string }> }) {
  const { next, mode } = await searchParams;
  const destination = safeNext(next);
  const viewer = await getViewer();

  if (viewer) {
    redirect(destination);
  }

  return (
    <div className="-mt-2">
      <AuthCard next={destination} reason={destination.startsWith("/exams") ? "tests" : null} initialMode={mode === "login" ? "login" : "signup"} />
    </div>
  );
}
