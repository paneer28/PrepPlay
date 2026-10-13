import { CompareTests } from "@/components/account/tests/CompareTests";
import { DashboardSection } from "@/components/account/tests/DashboardSection";
import type { DateBounds } from "@/lib/date-range";
import { getCompare } from "@/lib/test-results";

export async function CompareSection({ bounds, timeZone }: { bounds: DateBounds; timeZone: string }) {
  const result = await getCompare(bounds);

  return (
    <DashboardSection
      title="Full tests side by side"
      description="Your latest attempt at each full test, broken down by instructional area. Custom sessions aren't included."
    >
      {!result.ok ? (
        <p className="p-5 text-fg sm:p-6">Couldn&apos;t load this comparison right now.</p>
      ) : result.data.attempts.length === 0 ? (
        <p className="p-5 text-fg sm:p-6">No full tests in this range yet. Finish a full practice test to start comparing.</p>
      ) : (
        <CompareTests data={result.data} timeZone={timeZone} />
      )}
    </DashboardSection>
  );
}
