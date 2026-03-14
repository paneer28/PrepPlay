import { PracticeWorkspace } from "@/components/PracticeWorkspace";
import { getPracticeOptions } from "@/lib/data";

export default function PracticePage() {
  const options = getPracticeOptions();

  return <PracticeWorkspace options={options} />;
}
