import { redirect } from "next/navigation";
import { AuthCard } from "@/components/AuthCard";
import { getViewer } from "@/lib/auth";

export default async function LoginPage() {
  const viewer = await getViewer();

  if (viewer) {
    redirect("/practice");
  }

  return (
    <div className="pb-10 pt-8">
      <AuthCard />
    </div>
  );
}
