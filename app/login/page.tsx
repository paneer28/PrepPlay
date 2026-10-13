import { redirect } from "next/navigation";
import { AuthCard } from "@/components/AuthCard";
import { getViewer } from "@/lib/auth";

export default async function LoginPage() {
  const viewer = await getViewer();

  if (viewer) {
    redirect("/practice");
  }

  return (
    <div className="-mt-2">
      <AuthCard />
    </div>
  );
}
