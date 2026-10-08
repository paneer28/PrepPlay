import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signOutAction } from "@/app/login/actions";
import { AccountTabMemory, AccountTabs } from "@/components/account/AccountTabs";
import { RoleplaysTab } from "@/components/account/RoleplaysTab";
import { TestsTab, type TestsTabParams } from "@/components/account/tests/TestsTab";
import { ACCOUNT_TAB_COOKIE, type AccountTab } from "@/lib/account-tabs";
import { getViewer } from "@/lib/auth";

type AccountPageProps = {
  searchParams?: Promise<TestsTabParams & { tab?: string; page?: string; sort?: string }>;
};

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const viewer = await getViewer();

  if (!viewer) {
    redirect("/login");
  }

  const params = (await searchParams) ?? {};
  // The URL wins; otherwise reopen the tab used last time.
  const remembered = (await cookies()).get(ACCOUNT_TAB_COOKIE)?.value;
  const tab: AccountTab =
    params.tab === "tests" || params.tab === "roleplays"
      ? params.tab
      : remembered === "tests"
        ? "tests"
        : "roleplays";

  return (
    <div className="space-y-10 pb-10 pt-8">
      <section className="surface p-8 sm:p-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="eyebrow">Account</p>
            <h1 className="mt-3 text-4xl font-bold tracking-[-0.05em] text-ink sm:text-5xl">Your PrepPlay dashboard</h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-muted">
              Review your saved roleplays and practice tests, see how often you practice, and check your scores.
            </p>
          </div>

          <div className="surface-soft min-w-[280px] p-5">
            <p className="text-sm font-semibold text-ink">{viewer.email}</p>
            <p className="mt-2 text-sm leading-7 text-muted">
              Signed-in users get saved history, statistics, and fewer repeated roleplay situations.
            </p>
            <form action={signOutAction} className="mt-4">
              <button
                type="submit"
                className="rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-[#f8fbff]"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      </section>

      <div className="space-y-6">
        <AccountTabs active={tab} />
        <AccountTabMemory tab={tab} />

        {tab === "tests" ? (
          <TestsTab userId={viewer.id} params={params} />
        ) : (
          <div className="space-y-10">
            <RoleplaysTab userId={viewer.id} page={params.page} sort={params.sort} />
          </div>
        )}
      </div>
    </div>
  );
}
