import type { Metadata } from "next";
import { PracticeWorkspace } from "@/components/PracticeWorkspace";
import { getViewer } from "@/lib/auth";
import { getRoleplayFormOptions } from "@/lib/data";
import { getViewerEvent } from "@/lib/profile";

export const metadata: Metadata = {
  title: "Roleplays | PrepPlay",
  description: "Generate a DECA-style roleplay for your event, write your response, and get judge-side feedback."
};

type Props = { searchParams: Promise<{ road?: string; difficulty?: string; area?: string }> };

const DIFFICULTIES = ["easy", "medium", "hard"] as const;
type Difficulty = (typeof DIFFICULTIES)[number];

export default async function RoleplaysPage({ searchParams }: Props) {
  const options = getRoleplayFormOptions();
  const [viewer, event, { road, difficulty, area }] = await Promise.all([getViewer(), getViewerEvent(), searchParams]);
  const myEvent = event?.roleplayClusterId ? { clusterId: event.roleplayClusterId, eventId: event.roleplayEventId } : null;

  // Set when this is a mini roleplay from the road.
  const mini = road && /^mini:[A-Z]+:(districts|state|icdc)$/.test(road)
    ? { item: road, difficulty: DIFFICULTIES.includes(difficulty as Difficulty) ? (difficulty as Difficulty) : "medium", area: area ?? "" }
    : null;

  return (
    <div data-road="roleplay">
      <PracticeWorkspace options={options} viewer={viewer} myEvent={myEvent} mini={mini} />
    </div>
  );
}
