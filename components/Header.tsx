import Link from "next/link";
import { ButtonLink } from "@/components/ds/Button";
import { AccountMenu } from "@/components/shell/AccountMenu";
import { Logo } from "@/components/shell/Logo";
import { NavLinks } from "@/components/shell/NavLinks";
import { NavStreak } from "@/components/shell/NavStreak";
import { getActivityTimestamps } from "@/lib/activity";
import { getViewer } from "@/lib/auth";

export async function Header() {
  const viewer = await getViewer();
  const activity = viewer ? await getActivityTimestamps(viewer.id) : [];

  return (
    <header data-site-header className="sticky top-0 z-20 border-b-[1.5px] border-rule bg-page">
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center gap-2 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="mr-2 flex items-center rounded-control text-fg sm:mr-4" aria-label="PrepPlay home">
          <Logo height={40} compact />
        </Link>

        <nav aria-label="Main" className="mr-auto flex items-center gap-0.5 sm:gap-1">
          <NavLinks />
        </nav>

        {viewer ? <NavStreak timestamps={activity} /> : null}
        <ButtonLink href="/tests" size="sm" className="ml-1">
          Practice
        </ButtonLink>
        {viewer ? (
          <AccountMenu email={viewer.email} />
        ) : (
          <ButtonLink href="/login" size="sm" variant="secondary">
            Log in
          </ButtonLink>
        )}
      </div>
    </header>
  );
}
