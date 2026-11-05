import { AnswerOption } from "@/components/ds/AnswerOption";
import { DashboardSection } from "@/components/account/tests/DashboardSection";
import { testsHref, type TestsTabState } from "@/components/account/tests/params";
import { UnflagButton } from "@/components/account/tests/UnflagButton";
import { formatShortDate, Pager } from "@/components/account/tests/ui";
import { DASHBOARD_PAGE_SIZE } from "@/lib/test-results-shared";
import { getFlaggedPage } from "@/lib/test-results";
import type { TestOptionKey } from "@/types";

const OPTION_KEYS: TestOptionKey[] = ["A", "B", "C", "D"];

// Questions flagged in any mode. Flags stay until removed, so the time range
// doesn't apply here; the question-set toggle does.
export async function FlaggedSection({ state, timeZone }: { state: TestsTabState; timeZone: string }) {
  const result = await getFlaggedPage(state.flaggedPage, state.set);
  // The migration hasn't been run yet: nothing can have been flagged.
  if (!result.ok && result.reason === "unavailable") return null;

  return (
    <DashboardSection title="Questions you flagged" description="Open one to see the answer and explanation. It stays here until you remove the flag.">
      {!result.ok ? (
        <p className="p-5 text-fg sm:p-6">Couldn&apos;t load your flagged questions right now.</p>
      ) : result.data.total === 0 ? (
        <p className="p-5 text-fg sm:p-6">Nothing flagged yet. Flag a question while you practice and it&apos;ll show up here.</p>
      ) : (
        <div className="space-y-5 p-5 sm:p-6">
          <ul className="divide-y-[1.5px] divide-rule border-y-[1.5px] border-rule">
            {result.data.rows.map((row) => (
              <li key={row.ref} className="py-3">
                <details className="group">
                  <summary className="flex cursor-pointer list-none flex-col gap-2 rounded-control sm:flex-row sm:items-start sm:gap-4 [&::-webkit-details-marker]:hidden">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold text-fg group-open:whitespace-normal" title={row.questionText}>
                        {row.questionText}
                      </span>
                      <span className="mt-0.5 block text-label font-semibold text-fg-muted">
                        {row.sourceLabel} · Q{row.number}
                        {row.area ? ` · ${row.area}` : ""} · {formatShortDate(row.flaggedAt, timeZone)}
                      </span>
                    </span>
                    {row.question ? (
                      <span className="shrink-0 self-start text-small font-bold text-brand-text group-hover:underline">
                        <span className="group-open:hidden">Review</span>
                        <span className="hidden group-open:inline">Close</span>
                      </span>
                    ) : null}
                  </summary>

                  {row.question ? (
                    <div className="mt-4 space-y-3">
                      <div className="grid gap-3">
                        {OPTION_KEYS.map((key) => (
                          <AnswerOption
                            key={key}
                            letter={key}
                            state={key === row.question!.answer ? "correct" : "dimmed"}
                            note={key === row.question!.answer ? "Correct answer" : undefined}
                            readOnly
                          >
                            {row.question!.options[key]}
                          </AnswerOption>
                        ))}
                      </div>
                      {row.question.explanation ? (
                        <p className="whitespace-pre-line rounded-control bg-surface px-4 py-3 text-small text-fg [overflow-wrap:anywhere]">
                          {row.question.explanation}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </details>
                <div className="mt-2">
                  <UnflagButton questionRef={row.ref} />
                </div>
              </li>
            ))}
          </ul>

          <Pager
            page={result.data.page}
            pageSize={DASHBOARD_PAGE_SIZE}
            total={result.data.total}
            noun="flagged questions"
            hrefFor={(page) => testsHref(state, { fp: page })}
          />
        </div>
      )}
    </DashboardSection>
  );
}
