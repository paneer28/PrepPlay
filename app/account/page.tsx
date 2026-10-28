import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signOutAction } from "@/app/login/actions";
import { AccountTabMemory, AccountTabs } from "@/components/account/AccountTabs";
import { DashboardGreeting } from "@/components/account/DashboardGreeting";
import { EventSetting } from "@/components/account/EventSetting";
import { LeaderboardTab, normalizeLeaderboardPeriod } from "@/components/account/LeaderboardTab";
import { RoleplaysTab } from "@/components/account/RoleplaysTab";
import { TestsTab, type TestsTabParams } from "@/components/account/tests/TestsTab";
import { ACCOUNT_TAB_COOKIE, isAccountTab, type AccountTab } from "@/lib/account-tabs";
import { getActivityTimestamps } from "@/lib/activity";
import { getViewer } from "@/lib/auth";
import { getProfile } from "@/lib/profile";

type AccountPageProps = {
  searchParams?: Promise<TestsTabParams & { tab?: string; page?: string; sort?: string; period?: string }>;
};

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const viewer = await getViewer();

  if (!viewer) {
    redirect("/login");
  }

  const params = (await searchParams) ?? {};
  // The URL wins; otherwise reopen the tab used last time.
  const remembered = (await cookies()).get(ACCOUNT_TAB_COOKIE)?.value;
  const tab: AccountTab = isAccountTab(params.tab) ? params.tab : isAccountTab(remembered) ? remembered : "roleplays";

  const [activity, profile] = await Promise.all([getActivityTimestamps(viewer.id), getProfile(viewer.id)]);

  return (
    <div className="space-y-12 pb-10">
      <header className="space-y-5">
        <DashboardGreeting timestamps={activity} />
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-small text-fg-muted">
          <span>
            Signed in as <span className="font-bold text-fg">{viewer.email}</span>
          </span>
          <form action={signOutAction}>
            <button type="submit" className="rounded-control font-bold text-brand-text hover:underline">
              Log out
            </button>
          </form>
          <span className="basis-full">
            Signed-in users get saved history, statistics, and fewer repeated roleplay situations.
          </span>
        </div>
        {profile?.eventSupported ? <EventSetting eventId={profile.event?.id ?? null} /> : null}
      </header>

      <div className="space-y-8">
        <AccountTabs active={tab} />
        <AccountTabMemory tab={tab} />

        {tab === "tests" ? (
          <TestsTab userId={viewer.id} params={params} />
        ) : tab === "leaderboard" ? (
          <LeaderboardTab period={normalizeLeaderboardPeriod(params.period)} />
        ) : (
          <RoleplaysTab userId={viewer.id} page={params.page} sort={params.sort} />
        )}
      </div>
    </div>
  );
}
