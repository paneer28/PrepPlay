import clusters from "@/data/clusters.json";
import events from "@/data/events.json";
import performanceIndicators from "@/data/performance-indicators.json";
import roleplayReferences from "@/data/roleplay-references.json";
import { DIFFICULTY_OPTIONS, LIMITS } from "@/lib/config";
import type {
  ClusterOption,
  EventOption,
  PerformanceIndicator,
  PracticeOptions,
  RoleplayReference,
  RoleplayRequest
} from "@/types";

const clusterList = clusters as ClusterOption[];
const eventList = events as EventOption[];
const performanceIndicatorList = performanceIndicators as PerformanceIndicator[];
const referenceList = roleplayReferences as RoleplayReference[];

type ScenarioIndicatorContext = {
  eventName: string;
  eventDescription?: string;
  eventInstructionalArea?: string;
  businessType?: string;
  situation: string;
  ask: string;
};

type ThemeRule = {
  id: string;
  keywords: string[];
};

const SELECTION_STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "into",
  "that",
  "this",
  "your",
  "used",
  "uses",
  "use",
  "identify",
  "explain",
  "describe",
  "develop",
  "determine",
  "effective",
  "factors",
  "types",
  "concept",
  "concepts",
  "business",
  "management"
]);

const SCENARIO_THEME_RULES: ThemeRule[] = [
  {
    id: "finance",
    keywords: ["budget", "financial", "finance", "cash", "profit", "revenue", "cost", "investment", "capital"]
  },
  {
    id: "marketing",
    keywords: ["marketing", "promotion", "campaign", "brand", "audience", "pricing", "customer", "traffic"]
  },
  {
    id: "hr",
    keywords: ["employee", "staff", "training", "retention", "recruit", "hiring", "culture", "wellness", "onboarding"]
  },
  {
    id: "operations",
    keywords: ["operations", "workflow", "process", "efficiency", "productivity", "scheduling", "capacity"]
  },
  {
    id: "service",
    keywords: ["guest", "service", "experience", "satisfaction", "lodging", "tourism", "restaurant", "hospitality"]
  },
  {
    id: "selling",
    keywords: ["sell", "selling", "buyer", "client", "prospect", "objection", "close", "presentation"]
  },
  {
    id: "legal",
    keywords: ["legal", "ethics", "compliance", "policy", "risk", "regulation", "fairness"]
  },
  {
    id: "career",
    keywords: ["career", "employment", "advancement", "promotion", "resume", "interview", "network", "job"]
  }
];

const INSTRUCTIONAL_AREA_HINTS: Array<{ pattern: RegExp; keywords: string[] }> = [
  {
    pattern: /professional development/i,
    keywords: ["career", "employment", "advancement", "network", "time", "leadership", "training", "productivity"]
  },
  {
    pattern: /business management|business administration core/i,
    keywords: ["management", "operations", "policy", "planning", "strategy", "communication", "decision"]
  },
  {
    pattern: /human resources/i,
    keywords: ["employee", "staff", "recruit", "hire", "training", "retention", "culture", "onboarding", "wellness"]
  },
  {
    pattern: /operations/i,
    keywords: ["operations", "workflow", "efficiency", "productivity", "scheduling", "process", "capacity"]
  },
  {
    pattern: /accounting/i,
    keywords: ["accounting", "record", "reporting", "statement", "ledger", "reconcile", "control"]
  },
  {
    pattern: /finance|financial/i,
    keywords: ["finance", "budget", "cash", "profit", "revenue", "investment", "cost", "analysis"]
  },
  {
    pattern: /marketing management|marketing career cluster|marketing/i,
    keywords: ["marketing", "promotion", "campaign", "brand", "audience", "customer", "traffic", "pricing"]
  },
  {
    pattern: /communications/i,
    keywords: ["message", "communication", "media", "promotion", "content", "channel"]
  },
  {
    pattern: /merchandising/i,
    keywords: ["merchandise", "inventory", "display", "assortment", "product", "stock"]
  },
  {
    pattern: /selling/i,
    keywords: ["selling", "buyer", "prospect", "objection", "close", "needs", "presentation"]
  },
  {
    pattern: /hospitality|tourism/i,
    keywords: ["guest", "service", "experience", "tourism", "travel", "booking", "lodging", "restaurant"]
  },
  {
    pattern: /hotel|lodging/i,
    keywords: ["hotel", "lodging", "occupancy", "reservation", "room", "guest"]
  },
  {
    pattern: /restaurant|food/i,
    keywords: ["restaurant", "food", "menu", "table", "dining", "guest", "shift", "service"]
  },
  {
    pattern: /travel|destination/i,
    keywords: ["travel", "destination", "booking", "visitor", "tour", "trip", "tourism"]
  }
];

const THEME_AREA_MATCHERS: Record<string, RegExp[]> = {
  finance: [/finance|financial|accounting/i, /business administration core/i],
  marketing: [/marketing|communications|merchandising/i, /business administration core/i],
  hr: [/human resources/i, /professional development/i, /business management/i],
  operations: [/operations/i, /business management/i, /business administration core/i],
  service: [/hospitality|tourism|hotel|restaurant|lodging/i, /professional development/i],
  selling: [/selling/i, /marketing/i, /hospitality/i],
  legal: [/law|ethics|business management/i],
  career: [/professional development/i, /human resources/i]
};

const SUPPORTIVE_AREA_PATTERNS = [/professional development/i, /business management/i, /business administration core/i];

export function getPracticeOptions(): PracticeOptions {
  return {
    clusters: clusterList,
    events: eventList,
    difficulties: DIFFICULTY_OPTIONS,
    performanceIndicators: performanceIndicatorList
  };
}

export function getEventById(eventId: string) {
  return eventList.find((event) => event.id === eventId);
}

export function getReferenceNotesByEventId(eventId: string) {
  return referenceList.find((reference) => reference.eventId === eventId)?.notes ?? [];
}

function normalizeText(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function canonicalizeToken(token: string) {
  let normalized = token.toLowerCase().replace(/[^a-z0-9]/g, "");

  if (!normalized) {
    return "";
  }

  if (normalized.endsWith("ies") && normalized.length > 4) {
    normalized = `${normalized.slice(0, -3)}y`;
  } else if (normalized.endsWith("ing") && normalized.length > 5) {
    normalized = normalized.slice(0, -3);
  } else if (normalized.endsWith("ed") && normalized.length > 4) {
    normalized = normalized.slice(0, -2);
  } else if (normalized.endsWith("es") && normalized.length > 4 && !normalized.endsWith("ses")) {
    normalized = normalized.slice(0, -2);
  } else if (normalized.endsWith("s") && normalized.length > 3 && !normalized.endsWith("ss")) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}

function extractKeywords(text: string) {
  return Array.from(
    new Set(
      normalizeText(text)
        .split(/\s+/)
        .map(canonicalizeToken)
        .filter((word) => word.length >= 3 && !SELECTION_STOP_WORDS.has(word))
    )
  );
}

function scoreKeywordOverlap(keywordSet: Set<string>, candidates: string[]) {
  return candidates.reduce((total, candidate) => {
    const normalized = canonicalizeToken(candidate);
    return normalized && keywordSet.has(normalized) ? total + 1 : total;
  }, 0);
}

function detectScenarioThemes(keywordSet: Set<string>) {
  return SCENARIO_THEME_RULES
    .map((rule) => ({ id: rule.id, score: scoreKeywordOverlap(keywordSet, rule.keywords) }))
    .filter((rule) => rule.score > 0)
    .sort((left, right) => right.score - left.score)
    .map((rule) => rule.id);
}

function getAreaHintKeywords(area: string) {
  const matchedHints = INSTRUCTIONAL_AREA_HINTS.find((entry) => entry.pattern.test(area));

  return matchedHints ? matchedHints.keywords : extractKeywords(area);
}

function buildScenarioKeywordSet(context?: ScenarioIndicatorContext) {
  if (!context) {
    return new Set<string>();
  }

  return new Set(
    extractKeywords(
      [
        context.eventName,
        context.eventDescription ?? "",
        context.eventInstructionalArea ?? "",
        context.businessType ?? "",
        context.situation,
        context.ask
      ].join(" ")
    )
  );
}

function scoreAreaRelevance(area: string, event: EventOption | undefined, keywordSet: Set<string>, themes: string[]) {
  const areaKeywords = getAreaHintKeywords(area);
  let score = scoreKeywordOverlap(keywordSet, areaKeywords) * 2;

  if (event?.instructionalArea?.trim() === area) {
    score += 2.5;
  }

  for (const theme of themes) {
    if (THEME_AREA_MATCHERS[theme]?.some((pattern) => pattern.test(area))) {
      score += 2;
    }
  }

  if (SUPPORTIVE_AREA_PATTERNS.some((pattern) => pattern.test(area)) && themes.length > 0) {
    score += 1;
  }

  return score;
}

function failsRelevanceGuard(indicator: PerformanceIndicator, keywordSet: Set<string>, themes: string[]) {
  const text = normalizeText(indicator.text);
  const hasCareerPrepLanguage =
    /resume|job interview|interview techniques|employment opportunities|career information|advancement patterns|career opportunities|certification|certifications|credential|credentials|license/.test(
      text
    );

  if (hasCareerPrepLanguage) {
    const careerSignals = [
      "career",
      "employment",
      "job",
      "promotion",
      "advancement",
      "professional",
      "development",
      "recruit",
      "hire",
      "staffing",
      "network",
      "candidate",
      "applicant",
      "certification",
      "credential"
    ];
    const scenarioSupportsCareer = themes.includes("career") || scoreKeywordOverlap(keywordSet, careerSignals) > 0;

    if (!scenarioSupportsCareer) {
      return true;
    }
  }

  return false;
}

function scoreIndicatorRelevance(
  indicator: PerformanceIndicator,
  event: EventOption | undefined,
  keywordSet: Set<string>,
  themes: string[]
) {
  const indicatorKeywords = extractKeywords(indicator.text);
  const area = indicator.instructionalArea?.trim() || "General";
  const areaScore = scoreAreaRelevance(area, event, keywordSet, themes);
  const keywordHits = indicatorKeywords.filter((keyword) => keywordSet.has(keyword)).length;
  let score = areaScore + keywordHits * 3;

  if (failsRelevanceGuard(indicator, keywordSet, themes)) {
    score -= 8;
  }

  if (keywordHits === 0 && areaScore < 2.5) {
    score -= 2;
  }

  return score;
}

export function pickPerformanceIndicators(request: RoleplayRequest, context?: ScenarioIndicatorContext) {
  const event = getEventById(request.eventId);
  const relevant = performanceIndicatorList.filter((indicator) => indicator.eventIds.includes(request.eventId));

  if (relevant.length === 0) {
    throw new Error("No performance indicators were found for that event.");
  }

  const targetCount = Math.max(LIMITS.minPis, Math.min(LIMITS.maxPis, request.numberOfPis));
  const scenarioKeywords = buildScenarioKeywordSet(context);
  const scenarioThemes = detectScenarioThemes(scenarioKeywords);
  const requested = request.specificPerformanceIndicatorIds
    .map((id) => relevant.find((indicator) => indicator.id === id))
    .filter(Boolean) as PerformanceIndicator[];
  const preferredArea = request.instructionalAreaPreference.trim();
  const shouldForcePreferredArea = Boolean(preferredArea);
  const requestedIds = new Set(requested.map((indicator) => indicator.id));
  const scoredRelevant = relevant.map((indicator) => ({
    indicator,
    score: scoreIndicatorRelevance(indicator, event, scenarioKeywords, scenarioThemes)
  }));
  const groupedByArea = scoredRelevant.reduce<
    Record<string, Array<{ indicator: PerformanceIndicator; score: number }>>
  >((groups, item) => {
    const area = item.indicator.instructionalArea?.trim() || "General";

    if (!groups[area]) {
      groups[area] = [];
    }

    groups[area].push(item);
    return groups;
  }, {});
  const requestedArea = requested[0]?.instructionalArea?.trim() ?? preferredArea;
  const eligibleAreaEntries = Object.entries(groupedByArea)
    .map(([area, items]) => {
      const sorted = [...items].sort((left, right) => right.score - left.score);
      const topScores = sorted.slice(0, 3).reduce((sum, item) => sum + item.score, 0);

      return {
        area,
        items: sorted,
        score:
          topScores +
          scoreAreaRelevance(area, event, scenarioKeywords, scenarioThemes) +
          (requestedArea === area ? 10 : 0)
      };
    })
    .filter((entry) => (requestedArea ? entry.area === requestedArea : entry.items.length > 0))
    .sort((left, right) => right.score - left.score);
  const chosenArea = eligibleAreaEntries[0]?.area ?? requestedArea ?? event?.instructionalArea ?? "General";
  const primaryMinimum = Math.ceil(targetCount / 2);
  const primaryRequested = requested.filter(
    (indicator) => (indicator.instructionalArea?.trim() || "General") === chosenArea
  );
  const primaryRequestedIds = new Set(primaryRequested.map((indicator) => indicator.id));
  const primaryPool = (groupedByArea[chosenArea] ?? [])
    .filter((item) => shouldForcePreferredArea || item.score > 0 || requestedIds.has(item.indicator.id))
    .filter((item) => !primaryRequestedIds.has(item.indicator.id))
    .sort((left, right) => right.score - left.score);
  const supportPool = Object.entries(groupedByArea)
    .filter(([area]) => area !== chosenArea)
    .flatMap(([area, items]) =>
      items
        .filter((item) => item.score > 0 || requestedIds.has(item.indicator.id))
        .map((item) => ({
          indicator: item.indicator,
          score:
            item.score +
            (SUPPORTIVE_AREA_PATTERNS.some((pattern) => pattern.test(area)) ? 1.25 : 0)
        }))
    );
  const rankedFallback = scoredRelevant
    .filter((item) => !requestedIds.has(item.indicator.id))
    .sort((left, right) => right.score - left.score);
  const selection: PerformanceIndicator[] = [];

  for (const indicator of primaryRequested) {
    if (selection.length < targetCount) {
      selection.push(indicator);
    }
  }

  for (const item of primaryPool) {
    if (selection.length >= primaryMinimum) {
      break;
    }
    const indicator = item.indicator;
    if (!selection.some((item) => item.id === indicator.id)) {
      selection.push(indicator);
    }
  }

  const remainingCandidates = shouldForcePreferredArea
    ? [
        ...primaryPool.map((item) => item.indicator),
        ...supportPool.sort((left, right) => right.score - left.score).map((item) => item.indicator)
      ]
    : [...primaryPool, ...supportPool]
        .sort((left, right) => right.score - left.score)
        .map((item) => item.indicator);

  for (const indicator of remainingCandidates) {
    if (selection.length >= targetCount) {
      break;
    }
    if (!selection.some((item) => item.id === indicator.id)) {
      selection.push(indicator);
    }
  }

  for (const item of rankedFallback) {
    if (selection.length >= targetCount) {
      break;
    }
    const indicator = item.indicator;
    if (!selection.some((item) => item.id === indicator.id)) {
      selection.push(indicator);
    }
  }

  if (selection.length < targetCount) {
    throw new Error("No relevant performance indicators were available for that scenario.");
  }

  return selection.slice(0, targetCount);
}
