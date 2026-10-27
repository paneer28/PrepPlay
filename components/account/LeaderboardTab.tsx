import { TrophyIcon } from "@phosphor-icons/react/dist/ssr";
import { LeaderboardSettings } from "@/components/account/LeaderboardSettings";
import { ButtonLink } from "@/components/ds/Button";
import { Illustration } from "@/components/ds/Illustration";
import { SegmentedControl } from "@/components/ds/SegmentedControl";
import { StatTile } from "@/components/ds/StatTile";
import { Tag } from "@/components/ds/Tag";
import { getLeaderboard, getMyLeaderboardStatus, LEADERBOARD_LIMIT, type LeaderboardRow } from "@/lib/leaderboard";
import type { LeaderboardPeriod } from "@/lib/leaderboard-shared";

const PERIODS: Array<{ value: LeaderboardPeriod; label: string; href: string }> = [
  { value: "week", label: "This week", href: "/account?tab=leaderboard&period=week" },
  { value: "all", label: "All time", href: "/account?tab=leaderboard&period=all" }
];

// Top 3 get a podium colour.
const PODIUM = [
  "bg-streak text-white shadow-[0_2px_0_var(--streak-edge)]",
  "bg-[#9aa3b5] text-white shadow-[0_2px_0_#7a8396]",
  "bg-[#c98a4b] text-white shadow-[0_2px_0_#a66c33]"
];

const count = (value: number) => value.toLocaleString("en-US");

export function normalizeLeaderboardPeriod(value: string | undefined): LeaderboardPeriod {
  return value === "all" ? "all" : "week";
}

// The dashboard's Leaderboard tab: your standing, your display name, and the
// top 50 opted-in people by practice questions answered.
export async function LeaderboardTab({ period }: { period: LeaderboardPeriod }) {
  const [board, status] = await Promise.all([getLeaderboard(period), getMyLeaderboardStatus()]);

  if (!board.ok || !status.ok) {
    const unavailable = (!board.ok && board.reason === "unavailable") || (!status.ok && status.reason === "unavailable");
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <Illustration kind="trophy" size={120} />
        <h2 className="mt-5 font-display text-h3 font-extrabold text-fg">The leaderboard isn&apos;t available right now</h2>
        <p className="mt-2 max-w-md text-fg">
          {unavailable ? "The leaderboard hasn't been set up on this site yet." : "Something went wrong while loading it. Try again in a moment."}
        </p>
      </div>
    );
  }

  const rows = board.data;
  const me = rows.find((row) => row.is_me);
  const mine = period === "week" ? status.data.week_questions : status.data.all_questions;
  // The query adds your own row after the top 50 when you're further down.
  const meOutsideTop = me && me.rank > LEADERBOARD_LIMIT ? me : null;
  const top = rows.filter((row) => row !== meOutsideTop);

  return (
    <div className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-3">
        <StatTile boxed value={me ? `#${me.rank}` : "—"} label="Your rank" detail={status.data.opted_in ? (period === "week" ? "This week" : "All time") : "Join below to get ranked"} />
        <StatTile boxed value={count(status.data.week_questions)} label="Questions this week" detail="Resets Monday" />
        <StatTile boxed value={count(status.data.all_questions)} label="Questions all time" />
      </div>

      <LeaderboardSettings displayName={status.data.display_name} optedIn={status.data.opted_in} />

      <section className="overflow-hidden rounded-card border-[1.5px] border-rule bg-page">
        <div className="flex flex-col gap-4 border-b-[1.5px] border-rule p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="font-display text-h3 font-extrabold text-fg">Leaderboard</h2>
            <p className="mt-1 text-small text-fg-muted">Ranked by practice questions answered.</p>
          </div>
          <SegmentedControl<LeaderboardPeriod> label="Leaderboard period" size="sm" value={period} items={PERIODS} scroll={false} />
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-12 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-control bg-streak-tint text-streak-text">
              <TrophyIcon size={28} weight="fill" aria-hidden="true" />
            </span>
            <h3 className="mt-4 font-display text-h3 font-extrabold text-fg">
              {period === "week" ? "Nobody's on the board this week" : "Nobody's on the board yet"}
            </h3>
            <p className="mt-1 max-w-sm text-fg">
              {mine > 0 && !status.data.opted_in
                ? `You've answered ${count(mine)}. Join above to take the top spot.`
                : "Answer some practice questions to take the top spot."}
            </p>
            <ButtonLink href="/exams" className="mt-5">
              Start practicing
            </ButtonLink>
          </div>
        ) : (
          <ol className="divide-y-[1.5px] divide-rule">
            {top.map((row) => (
              <BoardRow key={`${row.rank}-${row.display_name}`} row={row} />
            ))}
            {meOutsideTop ? (
              <>
                <li aria-hidden="true" className="py-1 text-center text-fg-muted">
                  ⋯
                </li>
                <BoardRow row={meOutsideTop} />
              </>
            ) : null}
          </ol>
        )}
      </section>

      <p className="text-label font-semibold text-fg-muted">
        Everyone with a display name appears here unless they hide themselves. This week runs from Monday 00:00 UTC. Each test counts up to its own
        number of questions, and results finished impossibly fast don&apos;t count.
      </p>
    </div>
  );
}

function BoardRow({ row }: { row: LeaderboardRow }) {
  return (
    <li className={`flex items-center gap-4 px-5 py-3 sm:px-6 ${row.is_me ? "bg-brand-tint" : ""}`} aria-current={row.is_me ? "true" : undefined}>
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-display text-small font-extrabold tabular-nums ${
          PODIUM[row.rank - 1] ?? "bg-surface text-fg-muted"
        }`}
      >
        {row.rank}
      </span>
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <span className="truncate font-bold text-fg">{row.display_name}</span>
        {row.is_me ? <Tag tone="brand">You</Tag> : null}
      </span>
      <span className="shrink-0 text-right">
        <span className="font-display text-h4 font-extrabold tabular-nums text-fg">{count(row.questions)}</span>
        <span className="ml-1 text-label font-bold text-fg-muted">{row.questions === 1 ? "question" : "questions"}</span>
      </span>
    </li>
  );
}
