import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SegmentedControl } from "@/components/ds/SegmentedControl";
import { StatTile } from "@/components/ds/StatTile";
import { formatShortDate } from "@/components/account/tests/ui";
import { getViewer } from "@/lib/auth";
import { normalizeTimezone, TIMEZONE_COOKIE } from "@/lib/date-range";
import { getDeveloperDailyStats, getDeveloperUserStats, type DeveloperUserStats } from "@/lib/developer-stats";
import { percentOf } from "@/lib/score-scale";
import { isDeveloper } from "@/lib/share-quiz-shared";

export const metadata: Metadata = {
  title: "User stats | PrepPlay",
  robots: { index: false }
};

const WEEK_MS = 7 * 86400000;

const SORTS = ["last_active", "answered"] as const;
type Sort = (typeof SORTS)[number];
type Direction = "asc" | "desc";
const DAY_OPTIONS = ["7", "30", "90"] as const;
type DayOption = (typeof DAY_OPTIONS)[number];

type Params = { sort?: string; dir?: string; days?: string };

function href(params: { sort: Sort; dir: Direction; days: DayOption }) {
  return `/dev/users?${new URLSearchParams(params).toString()}`;
}

// Users without the value (never active) stay at the bottom either way; ties
// go to the newest account.
function sortUsers(users: DeveloperUserStats[], sort: Sort, dir: Direction) {
  const value = (user: DeveloperUserStats) =>
    sort === "answered" ? user.answered : user.last_active ? new Date(user.last_active).getTime() : null;
  return [...users].sort((a, b) => {
    const left = value(a);
    const right = value(b);
    if (left !== right) {
      if (left === null) return 1;
      if (right === null) return -1;
      return dir === "asc" ? left - right : right - left;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

// `day` is a plain calendar date ("2026-11-06") already in the viewer's zone.
function formatDay(day: string) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }).format(
    new Date(`${day}T00:00:00Z`)
  );
}

export default async function DevUsersPage({ searchParams }: { searchParams?: Promise<Params> }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login?mode=login&next=/dev/users");
  if (!isDeveloper(viewer.email)) notFound();

  const params = (await searchParams) ?? {};
  const sort: Sort = SORTS.includes(params.sort as Sort) ? (params.sort as Sort) : "last_active";
  const dir: Direction = params.dir === "asc" ? "asc" : "desc";
  const days: DayOption = DAY_OPTIONS.includes(params.days as DayOption) ? (params.days as DayOption) : "30";

  const timeZone = normalizeTimezone((await cookies()).get(TIMEZONE_COOKIE)?.value);
  const [result, daily] = await Promise.all([getDeveloperUserStats(), getDeveloperDailyStats(timeZone, Number(days))]);
  const users = result.ok ? sortUsers(result.users, sort, dir) : [];
  const now = new Date().getTime();

  const sortHeader = (key: Sort, label: string) => {
    const active = sort === key;
    const next: Direction = active && dir === "desc" ? "asc" : "desc";
    return (
      <th key={key} scope="col" aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"} className="whitespace-nowrap px-4 py-3">
        <Link href={href({ sort: key, dir: next, days })} scroll={false} className={`hover:text-fg hover:underline ${active ? "text-fg" : ""}`}>
          {label}
          <span aria-hidden="true">{active ? (dir === "asc" ? " ↑" : " ↓") : " ↕"}</span>
        </Link>
      </th>
    );
  };

  return (
    <div className="space-y-8 pb-10">
      <header className="space-y-2">
        <Link href="/dev" className="text-small font-bold text-brand-text hover:underline">
          Developer tools
        </Link>
        <h1 className="font-display text-h2 font-extrabold text-fg sm:text-h1">User stats</h1>
        <p className="max-w-2xl text-fg-muted">Every account, with sign-ups and questions answered by day. Only developers can open this page.</p>
      </header>

      {!result.ok ? (
        <p className="rounded-control bg-wrong-tint px-4 py-3 font-bold text-wrong-text">
          {result.reason === "unavailable"
            ? "User stats aren't set up yet. Run supabase/migrations/2026-11-05-developer-user-stats.sql in the Supabase SQL Editor, then reload this page."
            : "Couldn't load user stats right now."}
        </p>
      ) : (
        <>
          <section aria-label="Totals" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <StatTile boxed className="max-sm:p-4" value={users.length} label="Accounts" />
            <StatTile
              boxed
              className="max-sm:p-4"
              value={users.filter((user) => user.last_active && now - new Date(user.last_active).getTime() < WEEK_MS).length}
              label="Active in the last 7 days"
            />
            <StatTile boxed className="max-sm:p-4" value={users.reduce((sum, user) => sum + user.answered, 0)} label="Questions answered" />
            <StatTile boxed className="max-sm:p-4" value={users.reduce((sum, user) => sum + user.roleplays_judged, 0)} label="Roleplays judged" />
          </section>

          <section aria-labelledby="daily-heading" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="daily-heading" className="font-display text-h3 font-extrabold text-fg">By day</h2>
              <SegmentedControl
                label="Days shown"
                size="sm"
                scroll={false}
                value={days}
                items={DAY_OPTIONS.map((option) => ({ value: option, label: `${option} days`, href: href({ sort, dir, days: option }) }))}
              />
            </div>
            {!daily.ok ? (
              <p className="rounded-control bg-wrong-tint px-4 py-3 font-bold text-wrong-text">
                {daily.reason === "unavailable"
                  ? "Daily stats aren't set up yet. Run supabase/migrations/2026-11-06-developer-daily-stats.sql in the Supabase SQL Editor, then reload this page."
                  : "Couldn't load daily stats right now."}
              </p>
            ) : (
              <>
                <p className="text-small text-fg-muted">
                  Last {days} days: {daily.days.reduce((sum, day) => sum + day.accounts, 0).toLocaleString()} new accounts,{" "}
                  {daily.days.reduce((sum, day) => sum + day.answered, 0).toLocaleString()} questions answered.
                </p>
                <div className="max-h-[420px] overflow-y-auto rounded-card border-[1.5px] border-rule bg-page">
                  <table className="w-full text-left text-small">
                    <thead className="sticky top-0 border-b-[1.5px] border-rule bg-page text-label font-bold text-fg-muted">
                      <tr>
                        <th scope="col" className="px-4 py-3">Day</th>
                        <th scope="col" className="px-4 py-3 text-right">Accounts created</th>
                        <th scope="col" className="px-4 py-3 text-right">Questions answered</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-[1.5px] divide-rule tabular-nums text-fg">
                      {daily.days.map((day) => (
                        <tr key={day.day}>
                          <th scope="row" className="whitespace-nowrap px-4 py-2.5 text-left font-bold">{formatDay(day.day)}</th>
                          <td className={`px-4 py-2.5 text-right ${day.accounts === 0 ? "text-fg-muted" : ""}`}>{day.accounts.toLocaleString()}</td>
                          <td className={`px-4 py-2.5 text-right ${day.answered === 0 ? "text-fg-muted" : ""}`}>{day.answered.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>

          <section aria-labelledby="users-heading" className="space-y-3">
            <h2 id="users-heading" className="font-display text-h3 font-extrabold text-fg">Users</h2>
            <div className="overflow-x-auto rounded-card border-[1.5px] border-rule bg-page">
              <table className="w-full min-w-[1000px] text-left text-small">
                <thead className="border-b-[1.5px] border-rule text-label font-bold text-fg-muted">
                  <tr>
                    {["User", "Event", "Joined"].map((heading) => (
                      <th key={heading} scope="col" className="whitespace-nowrap px-4 py-3">
                        {heading}
                      </th>
                    ))}
                    {sortHeader("last_active", "Last active")}
                    {sortHeader("answered", "Answered")}
                    {["Accuracy", "Full tests", "Custom", "Best full test", "Roleplays", "Flagged"].map((heading) => (
                      <th key={heading} scope="col" className="whitespace-nowrap px-4 py-3">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y-[1.5px] divide-rule tabular-nums text-fg">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <th scope="row" className="max-w-[260px] px-4 py-3 text-left font-bold [overflow-wrap:anywhere]">
                        {user.email}
                        {user.display_name ? <span className="block text-label font-semibold text-fg-muted">{user.display_name}</span> : null}
                      </th>
                      <td className="px-4 py-3 uppercase">{user.deca_event ?? "–"}</td>
                      <td className="whitespace-nowrap px-4 py-3">{formatShortDate(user.created_at, timeZone)}</td>
                      <td className="whitespace-nowrap px-4 py-3">{user.last_active ? formatShortDate(user.last_active, timeZone) : "–"}</td>
                      <td className="px-4 py-3">{user.answered.toLocaleString()}</td>
                      <td className="px-4 py-3">{user.answered > 0 ? `${percentOf(user.correct, user.answered)}%` : "–"}</td>
                      <td className="px-4 py-3">{user.full_tests}</td>
                      <td className="px-4 py-3">{user.custom_sessions}</td>
                      <td className="px-4 py-3">{user.best_full_pct === null ? "–" : `${Math.round(user.best_full_pct)}%`}</td>
                      <td className="px-4 py-3">{user.roleplays_judged} of {user.roleplays_generated}</td>
                      <td className="px-4 py-3">{user.flagged}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
