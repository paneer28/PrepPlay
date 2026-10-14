import Link from "next/link";
import { ButtonLink } from "@/components/ds/Button";
import { AccountMenu } from "@/components/shell/AccountMenu";
import { ContinueButton } from "@/components/shell/ContinueButton";
import { Logo } from "@/components/shell/Logo";
import { NavLinks } from "@/components/shell/NavLinks";
import { NavStreak } from "@/components/shell/NavStreak";
import { WelcomePrompt } from "@/components/shell/WelcomePrompt";
import { getActivityTimestamps } from "@/lib/activity";
import { getViewer } from "@/lib/auth";
import { getProfile } from "@/lib/profile";

export async function Header() {
  const viewer = await getViewer();
  const [activity, profile] = viewer ? await Promise.all([getActivityTimestamps(viewer.id), getProfile(viewer.id)]) : [[], null];

  return (
    <>
      <header data-site-header className="sticky top-0 z-20 border-b-[1.5px] border-rule bg-page">
        {/* Phones: logo and buttons on the first row, the three links below. */}
        <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center gap-x-2 gap-y-1 px-4 py-2.5 sm:px-6 lg:px-8">
          <Link href="/" className="mr-2 flex h-11 min-w-11 items-center rounded-control text-fg sm:mr-4" aria-label="PrepPlay home">
            <Logo height={40} compact />
          </Link>

          <nav aria-label="Main" className="order-last -ml-2 flex w-full items-center gap-1 sm:order-none sm:ml-0 sm:w-auto">
            <NavLinks />
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {viewer ? <NavStreak timestamps={activity} /> : null}
            {viewer ? <ContinueButton /> : null}
            {viewer ? (
              <AccountMenu email={viewer.email} />
            ) : (
              <ButtonLink href="/login" size="sm" variant="secondary" className="h-11">
                Log in
              </ButtonLink>
            )}
          </div>
        </div>
      </header>

      {/* Outside the sticky header so the dialog sits above everything. */}
      <WelcomePrompt signedIn={Boolean(viewer)} needsUsername={Boolean(profile && !profile.username)} leaderboardOptIn={profile?.leaderboardOptIn ?? false} />
    </>
  );
}
