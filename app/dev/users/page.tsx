import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { StatTile } from "@/components/ds/StatTile";
import { formatShortDate } from "@/components/account/tests/ui";
import { getViewer } from "@/lib/auth";
import { normalizeTimezone, TIMEZONE_COOKIE } from "@/lib/date-range";
import { getDeveloperUserStats } from "@/lib/developer-stats";
import { percentOf } from "@/lib/score-scale";
import { isDeveloper } from "@/lib/share-quiz-shared";

export const metadata: Metadata = {
  title: "User stats | PrepPlay",
  robots: { index: false }
};

const WEEK_MS = 7 * 86400000;

export default async function DevUsersPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login?mode=login&next=/dev/users");
  if (!isDeveloper(viewer.email)) notFound();

  const timeZone = normalizeTimezone((await cookies()).get(TIMEZONE_COOKIE)?.value);
  const result = await getDeveloperUserStats();
  const users = result.ok ? result.users : [];
  const now = new Date().getTime();

  return (
    <div className="space-y-8 pb-10">
      <header className="space-y-2">
        <Link href="/dev" className="text-small font-bold text-brand-text hover:underline">
          Developer tools
        </Link>
        <h1 className="font-display text-h2 font-extrabold text-fg sm:text-h1">User stats</h1>
        <p className="max-w-2xl text-fg-muted">Every account, most recently active first. Only developers can open this page.</p>
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

          <div className="overflow-x-auto rounded-card border-[1.5px] border-rule bg-page">
            <table className="w-full min-w-[1000px] text-left text-small">
              <thead className="border-b-[1.5px] border-rule text-label font-bold text-fg-muted">
                <tr>
                  {["User", "Event", "Joined", "Last active", "Answered", "Accuracy", "Full tests", "Custom", "Best full test", "Roleplays", "Flagged"].map((heading) => (
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
        </>
      )}
    </div>
  );
}
