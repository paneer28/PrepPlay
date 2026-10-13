import { Pager } from "@/components/account/tests/ui";
import { SegmentedControl } from "@/components/ds/SegmentedControl";
import { StatTile } from "@/components/ds/StatTile";
import { AreaTag, Tag } from "@/components/ds/Tag";
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

function buildAccountHref(page: number, sort: AccountHistorySort) {
  return `/account?tab=roleplays&page=${page}&sort=${sort}`;
}

// The dashboard's Roleplays tab: stat cards and saved roleplay history.
export async function RoleplaysTab({ userId, page, sort: sortParam }: { userId: string; page?: string; sort?: string }) {
  const sort = normalizeAccountHistorySort(sortParam);
  const requestedPage = normalizeAccountHistoryPage(page);
  const { history, statistics: stats, totalCount, totalPages, currentPage } = await getAccountHistoryPage(
    userId,
    requestedPage,
    sort
  );

  return (
    <div className="space-y-8">
      <section aria-label="Roleplay statistics" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatTile boxed className="max-sm:p-4" value={stats.totalGenerated} label="Generated" detail="Total roleplays created on this account." />
        <StatTile boxed className="max-sm:p-4" value={stats.totalSubmitted} label="Submitted" detail="Rounds you completed and sent for judging." />
        <StatTile boxed className="max-sm:p-4" value={stats.averageScore ?? "--"} label="Average score" detail="Average on submitted roleplays." />
        <StatTile
          boxed
          className="max-sm:p-4"
          value={stats.bestScore ?? "--"}
          label="Best score"
          detail={`Across ${stats.uniqueEvents} events and ${stats.uniqueClusters} practiced clusters.`}
        />
      </section>

      <section aria-labelledby="saved-roleplays-title" className="card space-y-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <h2 id="saved-roleplays-title" className="font-display text-h3 font-extrabold text-fg">
              Saved roleplays
            </h2>
            <p className="max-w-3xl text-small text-fg-muted">
              Every generated round for your account appears here. Completed rounds also include your saved score.
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="text-label font-bold text-fg-muted">Sort history</p>
            <SegmentedControl
              label="Sort history"
              size="sm"
              value={sort}
              items={SORT_OPTIONS.map((option) => ({ ...option, href: buildAccountHref(1, option.value) }))}
            />
          </div>
        </div>

        {history.length === 0 ? (
          <p className="rounded-control bg-surface px-5 py-6 text-fg">
            No saved roleplays yet. Generate your first signed-in round from the practice page and it will appear here.
          </p>
        ) : (
          <ul className="divide-y-[1.5px] divide-rule border-y-[1.5px] border-rule">
            {history.map((item) => (
              <li key={item.id} className="flex flex-col gap-3 py-5 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Tag>{item.cluster}</Tag>
                    <Tag tone={item.submittedAt ? "correct" : "neutral"}>{item.submittedAt ? "Submitted" : "Generated only"}</Tag>
                    {item.estimatedTotalScore !== null ? (
                      <Tag tone="brand" className="tabular-nums">
                        {item.estimatedTotalScore}/99
                      </Tag>
                    ) : null}
                  </div>
                  <h3 className="font-display text-h4 font-bold text-fg">{item.eventName}</h3>
                  <p className="text-label font-semibold text-fg-muted">
                    Generated {formatDate(item.createdAt)}
                    {item.submittedAt ? ` • Submitted ${formatDate(item.submittedAt)}` : ""}
                  </p>
                  <p className="line-clamp-2 text-small text-fg">{item.eventSituation.split("\n\n")[0]}</p>
                </div>
                <div className="shrink-0 space-y-1.5 text-small lg:w-56 lg:text-right">
                  <p className="font-bold text-fg">
                    {item.responseText ? `${item.responseText.trim().length} response characters saved` : "No response saved yet"}
                  </p>
                  {item.instructionalArea ? (
                    <p className="text-fg-muted">
                      Primary PI area: <AreaTag area={item.instructionalArea} className="ml-0.5 align-middle" />
                    </p>
                  ) : (
                    <p className="text-fg-muted">PI area saved in packet</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {totalCount > 0 ? (
          <Pager
            page={currentPage}
            pageSize={ACCOUNT_HISTORY_PAGE_SIZE}
            total={totalCount}
            noun="saved roleplays"
            hrefFor={(target) => buildAccountHref(Math.min(Math.max(1, target), totalPages), sort)}
          />
        ) : null}
      </section>
    </div>
  );
}
