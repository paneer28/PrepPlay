import { PracticeWorkspace } from "@/components/PracticeWorkspace";
import { getViewer } from "@/lib/auth";
import { getPracticeOptions } from "@/lib/data";

export default async function PracticePage() {
  const options = getPracticeOptions();
  const viewer = await getViewer();

  return <PracticeWorkspace options={options} viewer={viewer} />;
}
