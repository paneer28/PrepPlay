import { SegmentedControl } from "@/components/ds/SegmentedControl";
import { getViewer } from "@/lib/auth";
import { SET_ROUTES, type QuestionSet } from "@/lib/question-sets";
import { viewerHasTestsAccess } from "@/lib/tests-access-server";

// Real DECA or PrepPlay questions, for Custom and Infinite. Real DECA is the default;
// signed-out visitors start on PrepPlay, and choosing Real DECA asks them to log in.
export async function SourceSwitch({ set, mode }: { set: QuestionSet; mode: "custom" | "unlimited" }) {
  const [unlocked, viewer] = await Promise.all([viewerHasTestsAccess(), getViewer()]);
  if (!unlocked) return null;
  const real = SET_ROUTES.deca[mode];
  return (
    <SegmentedControl<QuestionSet>
      label="Question source"
      size="sm"
      value={set}
      items={[
        { value: "deca", href: viewer ? real : `/login?next=${encodeURIComponent(real)}`, label: "Real DECA" },
        { value: "original", href: SET_ROUTES.original[mode], label: "PrepPlay" }
      ]}
    />
  );
}
