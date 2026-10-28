import events from "@/data/events.json";

// The events people can pick as "my event": the official 2026-27 DECA events
// that have a written cluster exam. It sets the starting filters around the
// site: which exams and practice questions show first, and which event the
// roleplay generator opens on. Everyone can still switch to anything.

export type DecaEventType = "Principles" | "Series" | "Team" | "Selling" | "Campaign" | "Individual";

export type DecaCluster = {
  id: string;
  label: string;
  // Short name for the filter chips.
  short: string;
  // The `cluster` of the exams and practice sets for this cluster's events.
  examCluster: string;
};

export const DECA_CLUSTERS: DecaCluster[] = [
  { id: "business-management", label: "Business Management & Administration", short: "Business Mgmt", examCluster: "Business Management and Administration" },
  { id: "marketing", label: "Marketing", short: "Marketing", examCluster: "Marketing" },
  { id: "finance", label: "Finance", short: "Finance", examCluster: "Finance" },
  { id: "hospitality", label: "Hospitality & Tourism", short: "Hospitality", examCluster: "Hospitality and Tourism" },
  { id: "entrepreneurship", label: "Entrepreneurship", short: "Entrepreneurship", examCluster: "Entrepreneurship" },
  { id: "personal-finance", label: "Personal Financial Literacy", short: "Personal Finance", examCluster: "Personal Financial Literacy" }
];

export type DecaEvent = {
  // Saved on the profile. Matches the roleplay generator's event id when it has the event.
  id: string;
  code: string;
  // The full official name (trigger, tooltip, aria-label).
  name: string;
  // The name in picker rows, without "Series" or "Team Decision Making" (the type tag says it).
  shortName: string;
  type: DecaEventType;
  clusterId: string;
  examCluster: string;
  // Null when the roleplay generator doesn't have the cluster or event (it opens on what it can).
  roleplayClusterId: string | null;
  roleplayEventId: string | null;
};

// Principles events all take the Business Administration Core exam.
const CORE_EXAM = "Business Administration Core";

// [cluster, code, official name, type, id, row name when it isn't the official name minus "Series"/"Team Decision Making"]
const LIST: Array<[string, string, string, DecaEventType, string, string?]> = [
  ["business-management", "PBM", "Principles of Business Management and Administration", "Principles", "principles-bma"],
  ["business-management", "BLTDM", "Business Law and Ethics Team Decision Making", "Team", "bltdm-team"],
  ["business-management", "HRM", "Human Resources Management Series", "Series", "hrm-series"],
  ["marketing", "PMK", "Principles of Marketing", "Principles", "principles-marketing"],
  ["marketing", "AAM", "Apparel and Accessories Marketing Series", "Series", "aam-series"],
  ["marketing", "ASM", "Automotive Services Marketing Series", "Series", "asm-series"],
  ["marketing", "BSM", "Business Services Marketing Series", "Series", "bsm-series"],
  ["marketing", "FMS", "Food Marketing Series", "Series", "food-series"],
  ["marketing", "MCS", "Marketing Communications Series", "Series", "mcs-series"],
  ["marketing", "RMS", "Retail Merchandising Series", "Series", "rms-series"],
  ["marketing", "SEM", "Sports and Entertainment Marketing Series", "Series", "sem-series"],
  ["marketing", "BTDM", "Buying and Merchandising Team Decision Making", "Team", "btdm-team"],
  ["marketing", "MTDM", "Marketing Management Team Decision Making", "Team", "mtdm-team"],
  ["marketing", "STDM", "Sports and Entertainment Marketing Team Decision Making", "Team", "stdm-team"],
  ["marketing", "PSE", "Professional Selling", "Selling", "pse"],
  ["marketing", "IMCE", "Integrated Marketing Campaign-Event", "Campaign", "imce", "IMC: Event"],
  ["marketing", "IMCP", "Integrated Marketing Campaign-Product", "Campaign", "imcp", "IMC: Product"],
  ["marketing", "IMCS", "Integrated Marketing Campaign-Service", "Campaign", "imcs", "IMC: Service"],
  ["finance", "PFN", "Principles of Finance", "Principles", "principles-finance"],
  ["finance", "ACT", "Accounting Applications Series", "Series", "act-series"],
  ["finance", "BFS", "Business Finance Series", "Series", "bfs-series"],
  ["finance", "FTDM", "Financial Services Team Decision Making", "Team", "ftdm-team"],
  ["finance", "FCE", "Financial Consulting", "Selling", "fce"],
  ["hospitality", "PHT", "Principles of Hospitality and Tourism", "Principles", "principles-hospitality"],
  ["hospitality", "HLM", "Hotel and Lodging Management Series", "Series", "hlm-series"],
  ["hospitality", "QSRM", "Quick Serve Restaurant Management Series", "Series", "qsrm-series"],
  ["hospitality", "RFSM", "Restaurant and Food Service Management Series", "Series", "rfsm-series"],
  ["hospitality", "HTDM", "Hospitality Services Team Decision Making", "Team", "htdm-team"],
  ["hospitality", "TTDM", "Travel and Tourism Team Decision Making", "Team", "ttdm-team"],
  ["hospitality", "HTPS", "Hospitality and Tourism Professional Selling", "Selling", "htps-series"],
  ["entrepreneurship", "PEN", "Principles of Entrepreneurship", "Principles", "principles-entrepreneurship"],
  ["entrepreneurship", "ENT", "Entrepreneurship Series", "Series", "ent-series"],
  ["entrepreneurship", "ETDM", "Entrepreneurship Team Decision Making", "Team", "etdm-team"],
  ["personal-finance", "PFL", "Personal Financial Literacy", "Individual", "pfl"]
];

const roleplayEventIds = new Set(events.map((event) => event.id));
const roleplayClusterIds = new Set(events.map((event) => event.clusterId));

export const DECA_EVENTS: DecaEvent[] = LIST.map(([clusterId, code, name, type, id, shortName]) => ({
  id,
  code,
  name,
  shortName: shortName ?? name.replace(/ (Series|Team Decision Making)$/, ""),
  type,
  clusterId,
  examCluster: type === "Principles" ? CORE_EXAM : DECA_CLUSTERS.find((cluster) => cluster.id === clusterId)!.examCluster,
  roleplayClusterId: roleplayClusterIds.has(clusterId) ? clusterId : null,
  roleplayEventId: roleplayEventIds.has(id) ? id : null
}));

export function decaEventById(id: string | null | undefined) {
  return id ? DECA_EVENTS.find((event) => event.id === id) ?? null : null;
}

export function decaClusterById(id: string) {
  return DECA_CLUSTERS.find((cluster) => cluster.id === id) ?? null;
}
