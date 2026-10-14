import { redirect } from "next/navigation";
import { AuthCard } from "@/components/AuthCard";
import { getViewer } from "@/lib/auth";
import { safeNext } from "@/lib/safe-redirect";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const destination = safeNext(next);
  const viewer = await getViewer();

  if (viewer) {
    redirect(destination);
  }

  return (
    <div className="-mt-2">
      <AuthCard next={destination} reason={destination.startsWith("/tests") ? "tests" : null} />
    </div>
  );
}
