import Link from "next/link";
import { redirect } from "next/navigation";
import { signOutAction } from "@/app/login/actions";
import { getViewer } from "@/lib/auth";
import {
  ACCOUNT_HISTORY_PAGE_SIZE,
  type AccountHistorySort,
  getAccountHistoryPage,
  normalizeAccountHistoryPage,
  normalizeAccountHistorySort
} from "@/lib/roleplay-history";

const SORT_OPTIONS: Array<{ value: AccountHistorySort; label: string }> = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "score-high", label: "Highest score" },
  { value: "score-low", label: "Lowest score" }
];

type AccountPageProps = {
  searchParams?: Promise<{
    page?: string;
    sort?: string;
  }>;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

function buildAccountHref(page: number, sort: AccountHistorySort) {
  return `/account?page=${page}&sort=${sort}`;
}

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const viewer = await getViewer();

  if (!viewer) {
    redirect("/login");
  }

  const params = (await searchParams) ?? {};
  const sort = normalizeAccountHistorySort(params.sort);
  const requestedPage = normalizeAccountHistoryPage(params.page);
  const { history, statistics: stats, totalCount, totalPages, currentPage } = await getAccountHistoryPage(
    viewer.id,
    requestedPage,
    sort
  );
  const startCount = totalCount === 0 ? 0 : (currentPage - 1) * ACCOUNT_HISTORY_PAGE_SIZE + 1;
  const endCount = Math.min(currentPage * ACCOUNT_HISTORY_PAGE_SIZE, totalCount);

  return (
    <div className="space-y-10 pb-10 pt-8">
      <section className="surface p-8 sm:p-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="eyebrow">Account</p>
            <h1 className="mt-3 text-4xl font-bold tracking-[-0.05em] text-ink sm:text-5xl">Your PrepPlay dashboard</h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-muted">
              Review your saved roleplays, see how often you practice, and check the scores from completed rounds.
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

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <article className="surface-soft p-6">
          <p className="eyebrow">Generated</p>
          <p className="mt-3 text-4xl font-bold tracking-[-0.05em] text-ink">{stats.totalGenerated}</p>
          <p className="mt-2 text-sm leading-7 text-muted">Total roleplays created on this account.</p>
        </article>
        <article className="surface-soft p-6">
          <p className="eyebrow">Submitted</p>
          <p className="mt-3 text-4xl font-bold tracking-[-0.05em] text-ink">{stats.totalSubmitted}</p>
          <p className="mt-2 text-sm leading-7 text-muted">Rounds you completed and sent for judging.</p>
        </article>
        <article className="surface-soft p-6">
          <p className="eyebrow">Average score</p>
          <p className="mt-3 text-4xl font-bold tracking-[-0.05em] text-ink">
            {stats.averageScore ?? "--"}
          </p>
          <p className="mt-2 text-sm leading-7 text-muted">Average on submitted roleplays.</p>
        </article>
        <article className="surface-soft p-6">
          <p className="eyebrow">Best score</p>
          <p className="mt-3 text-4xl font-bold tracking-[-0.05em] text-ink">
            {stats.bestScore ?? "--"}
          </p>
          <p className="mt-2 text-sm leading-7 text-muted">
            Across {stats.uniqueEvents} events and {stats.uniqueClusters} practiced clusters.
          </p>
        </article>
      </section>

      <section className="surface overflow-hidden">
        <div className="border-b border-line/80 bg-[linear-gradient(135deg,#fbfdff,#f1f6ff)] p-7 sm:p-9">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="eyebrow">History</p>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-ink">Saved roleplays</h2>
              <p className="mt-3 max-w-3xl text-base leading-8 text-muted">
                Every generated round for your account appears here. Completed rounds also include your saved score.
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Sort history</p>
              <div className="flex flex-wrap gap-2">
                {SORT_OPTIONS.map((option) => {
                  const isActive = option.value === sort;

                  return (
                    <Link
                      key={option.value}
                      href={buildAccountHref(1, option.value)}
                      className={
                        isActive
                          ? "rounded-full bg-[linear-gradient(135deg,#2563eb,#38bdf8)] px-4 py-2 text-sm font-semibold text-white shadow-card"
                          : "rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-muted transition hover:bg-[#f8fbff] hover:text-ink"
                      }
                    >
                      {option.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-7 sm:p-9">
          <div className="flex flex-col gap-3 rounded-[1.5rem] border border-line bg-[#f8fbff] px-5 py-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>
              Showing {startCount}-{endCount} of {totalCount} saved roleplays.
            </p>
            <p>
              Page {currentPage} of {totalPages}
            </p>
          </div>

          {history.length === 0 ? (
            <div className="rounded-[1.5rem] border border-line bg-[#f8fbff] px-5 py-6 text-sm text-muted">
              No saved roleplays yet. Generate your first signed-in round from the practice page and it will appear here.
            </div>
          ) : (
            history.map((item) => (
              <article key={item.id} className="rounded-[1.6rem] border border-line bg-white p-6 shadow-card">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-line bg-[#f8fbff] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                        {item.cluster}
                      </span>
                      <span className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                        {item.submittedAt ? "Submitted" : "Generated only"}
                      </span>
                      {item.estimatedTotalScore !== null ? (
                        <span className="rounded-full bg-[linear-gradient(135deg,#2563eb,#38bdf8)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white">
                          {item.estimatedTotalScore}/99
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-4 text-2xl font-bold tracking-[-0.04em] text-ink">{item.eventName}</h3>
                    <p className="mt-2 text-sm leading-7 text-muted">
                      Generated {formatDate(item.createdAt)}
                      {item.submittedAt ? ` • Submitted ${formatDate(item.submittedAt)}` : ""}
                    </p>
                    <p className="mt-4 line-clamp-3 text-base leading-8 text-muted">
                      {item.eventSituation.split("\n\n")[0]}
                    </p>
                  </div>

                  <div className="surface-soft min-w-[220px] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Round summary</p>
                    <p className="mt-3 text-sm leading-7 text-ink">
                      {item.responseText
                        ? `${item.responseText.trim().length} response characters saved`
                        : "No response saved yet"}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-muted">
                      {item.instructionalArea ? `Primary PI area: ${item.instructionalArea}` : "PI area saved in packet"}
                    </p>
                  </div>
                </div>
              </article>
            ))
          )}

          {history.length > 0 ? (
            <div className="flex flex-col gap-4 rounded-[1.6rem] border border-line bg-white px-5 py-5 shadow-card sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-ink">Page navigation</p>
                <p className="mt-1 text-sm text-muted">
                  Move through your saved roleplays without one long scroll.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={buildAccountHref(Math.max(1, currentPage - 1), sort)}
                  className={
                    currentPage === 1
                      ? "pointer-events-none rounded-full border border-line bg-[#f3f6fb] px-4 py-2 text-sm font-semibold text-slate-400"
                      : "rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-[#f8fbff]"
                  }
                >
                  Previous
                </Link>
                <Link
                  href={buildAccountHref(Math.min(totalPages, currentPage + 1), sort)}
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none rounded-full border border-line bg-[#f3f6fb] px-4 py-2 text-sm font-semibold text-slate-400"
                      : "rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-[#f8fbff]"
                  }
                >
                  Next
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
