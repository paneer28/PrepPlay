import clusters from "@/data/clusters.json";
import events from "@/data/events.json";

// The events people can pick as "my event". It sets the starting filters around
// the site: which exams and practice questions show first, and which event the
// roleplay generator opens on. Everyone can still switch to anything.
export type DecaEvent = {
  id: string;
  name: string;
  clusterLabel: string;
  // The `cluster` of the exams and practice sets this event studies for.
  examCluster: string;
  roleplayClusterId: string;
  // Null when the roleplay generator doesn't have the event (it opens on the cluster).
  roleplayEventId: string | null;
};

const EXAM_CLUSTERS: Record<string, string> = {
  "business-management": "Business Management and Administration",
  finance: "Finance",
  marketing: "Marketing",
  hospitality: "Hospitality and Tourism",
  entrepreneurship: "Entrepreneurship"
};

// Principles events all take the Business Administration Core exam.
const CORE_EXAM = "Business Administration Core";

const roleplayEvents: DecaEvent[] = events.map((event) => ({
  id: event.id,
  name: event.name.replace(/ (Series )?Event$/, ""),
  clusterLabel: event.clusterLabel,
  examCluster: event.name.startsWith("Principles of") ? CORE_EXAM : EXAM_CLUSTERS[event.clusterId],
  roleplayClusterId: event.clusterId,
  roleplayEventId: event.id
}));

export const DECA_EVENTS: DecaEvent[] = [
  ...roleplayEvents,
  {
    id: "principles-entrepreneurship",
    name: "Principles of Entrepreneurship",
    clusterLabel: clusters.find((cluster) => cluster.id === "entrepreneurship")?.label ?? "Entrepreneurship",
    examCluster: CORE_EXAM,
    roleplayClusterId: "entrepreneurship",
    roleplayEventId: null
  }
];

export function decaEventById(id: string | null | undefined) {
  return id ? DECA_EVENTS.find((event) => event.id === id) ?? null : null;
}

// For <optgroup>s: events grouped by cluster, in the cluster order of the site.
export const DECA_EVENT_GROUPS = clusters.map((cluster) => ({
  label: cluster.label,
  events: DECA_EVENTS.filter((event) => event.roleplayClusterId === cluster.id)
}));
