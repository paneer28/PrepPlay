import { PracticeWorkspace } from "@/components/PracticeWorkspace";
import { getViewer } from "@/lib/auth";
import { getPracticeOptions } from "@/lib/data";
import { getViewerEvent } from "@/lib/profile";

export default async function PracticePage() {
  const options = getPracticeOptions();
  const [viewer, event] = await Promise.all([getViewer(), getViewerEvent()]);
  const myEvent = event?.roleplayClusterId ? { clusterId: event.roleplayClusterId, eventId: event.roleplayEventId } : null;

  return <PracticeWorkspace options={options} viewer={viewer} myEvent={myEvent} />;
}
