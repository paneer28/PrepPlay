import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ds/Button";
import { AccountMenu } from "@/components/shell/AccountMenu";
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
        <Link href="/" className="mr-auto flex items-center gap-2.5 rounded-control text-fg" aria-label="PrepPlay home">
          <Image src="/prepplay-mark.png" alt="" width={36} height={36} priority unoptimized className="h-9 w-9 rounded-[10px] object-cover" />
          <span className="hidden font-display text-h4 font-extrabold tracking-[-0.02em] sm:inline">PrepPlay</span>
        </Link>

        <nav aria-label="Main" className="flex items-center gap-0.5 sm:gap-1">
          <NavLinks signedIn={Boolean(viewer)} />
        </nav>

        <ButtonLink href="/practice" size="sm" className="ml-1">
          Practice
        </ButtonLink>

        {viewer ? (
          <>
            <NavStreak timestamps={activity} />
            <AccountMenu email={viewer.email} />
          </>
        ) : (
          <ButtonLink href="/login" size="sm" variant="secondary">
            Log in
          </ButtonLink>
        )}
      </div>
    </header>
  );
}
