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
  preferredInstructionalArea?: string;
  businessType?: string;
  participantRole?: string;
  judgeRole?: string;
  tensions?: string[];
  situation: string;
  ask: string;
};

type ThemeRule = {
  id: string;
  keywords: string[];
};

type ScenarioKeywordContext = {
  coreKeywordSet: Set<string>;
  broadKeywordSet: Set<string>;
  themes: string[];
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
    id: "accounting",
    keywords: ["accounting", "ledger", "journal", "reconcile", "statement", "reporting", "depreciation", "receivable", "payable", "audit"]
  },
  {
    id: "marketing",
    keywords: ["marketing", "promotion", "campaign", "brand", "audience", "pricing", "customer", "traffic"]
  },
  {
    id: "merchandising",
    keywords: ["merchandise", "display", "assortment", "retail", "inventory", "stock", "shelf", "product", "sell", "floor"]
  },
  {
    id: "hr",
    keywords: ["employee", "staff", "training", "retention", "recruit", "hiring", "culture", "wellness", "onboarding", "leadership", "supervisor", "feedback"]
  },
  {
    id: "operations",
    keywords: ["operations", "workflow", "process", "efficiency", "productivity", "scheduling", "capacity", "execution", "coordination"]
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
  },
  {
    id: "entrepreneurship",
    keywords: ["startup", "venture", "entrepreneur", "founder", "launch", "feasibility", "scale", "growth", "pilot", "businessmodel"]
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
  accounting: [/accounting|financial analysis/i, /finance/i],
  marketing: [/marketing|communications|merchandising/i, /business administration core/i],
  merchandising: [/merchandising|marketing/i],
  hr: [/human resources/i, /professional development/i, /business management/i],
  operations: [/operations/i, /business management/i, /business administration core/i],
  service: [/hospitality|tourism|hotel|restaurant|lodging/i, /professional development/i],
  selling: [/selling/i, /marketing/i, /hospitality/i],
  legal: [/law|ethics|business management/i],
  career: [/professional development/i, /human resources/i],
  entrepreneurship: [/entrepreneurship/i, /business management/i]
};

const SUPPORTIVE_AREA_PATTERNS = [/professional development/i, /business management/i, /business administration core/i];

const EVENT_THEME_HINTS: Record<string, string[]> = {
  "principles-bma": ["operations"],
  "bltdm-team": ["legal", "operations"],
  "hrm-series": ["hr"],
  "principles-finance": ["finance"],
  "act-series": ["finance", "accounting"],
  "bfs-series": ["finance"],
  "ftdm-team": ["finance"],
  "principles-marketing": ["marketing"],
  "aam-series": ["marketing", "merchandising"],
  "asm-series": ["marketing"],
  "bsm-series": ["marketing"],
  "btdm-team": ["marketing", "merchandising"],
  "food-series": ["marketing", "service"],
  "mcs-series": ["marketing"],
  "mtdm-team": ["marketing"],
  "rms-series": ["marketing", "merchandising"],
  "sem-series": ["marketing"],
  "stdm-team": ["marketing"],
  "principles-hospitality": ["service"],
  "htps-series": ["service", "selling"],
  "htdm-team": ["service"],
  "hlm-series": ["service"],
  "qsrm-series": ["service", "operations"],
  "rfsm-series": ["service", "operations"],
  "ttdm-team": ["service", "marketing"],
  "ent-series": ["entrepreneurship", "operations"],
  "etdm-team": ["entrepreneurship", "operations"]
};

const TOPIC_RELEVANCE_GUARDS: Array<{
  pattern: RegExp;
  keywords: string[];
  themes: string[];
}> = [
  {
    pattern: /\b(accounting|ledger|journal|depreciation|receivable|payable|balance sheet|income statement|bookkeeping|audit)\b/i,
    keywords: ["accounting", "ledger", "journal", "depreciation", "receivable", "payable", "statement", "audit"],
    themes: ["accounting", "finance"]
  },
  {
    pattern: /\b(finance|financial|budget|capital|investment|cash flow|cashflow|profitability|liquidity|funding)\b/i,
    keywords: ["finance", "budget", "capital", "investment", "cash", "profit", "funding", "analysis"],
    themes: ["finance", "accounting"]
  },
  {
    pattern: /\b(marketing|promotion|campaign|branding|advertising|target market|target audience|market segmentation|customer profile)\b/i,
    keywords: ["marketing", "promotion", "campaign", "brand", "audience", "customer", "advertising", "pricing"],
    themes: ["marketing"]
  },
  {
    pattern: /\b(merchandising|merchandise|display|assortment|planogram|inventory|stock|shrink)\b/i,
    keywords: ["merchandise", "display", "assortment", "inventory", "stock", "retail", "shrink", "product"],
    themes: ["merchandising", "marketing", "operations"]
  },
  {
    pattern: /\b(recruit|recruitment|hire|hiring|staffing|candidate|selection|onboarding|retention|employee|supervisor)\b/i,
    keywords: ["recruit", "hire", "staff", "employee", "retention", "training", "culture", "onboarding"],
    themes: ["hr", "career"]
  },
  {
    pattern: /\b(hotel|lodging|occupancy|reservation|room rate|guest room)\b/i,
    keywords: ["hotel", "lodging", "occupancy", "reservation", "room", "guest"],
    themes: ["service"]
  },
  {
    pattern: /\b(restaurant|food service|menu|table turn|dining|quick serve)\b/i,
    keywords: ["restaurant", "food", "menu", "dining", "guest", "service", "shift"],
    themes: ["service", "operations"]
  },
  {
    pattern: /\b(travel|tourism|destination|visitor|trip|tour package|booking)\b/i,
    keywords: ["travel", "tourism", "destination", "visitor", "booking", "trip", "tour"],
    themes: ["service"]
  },
  {
    pattern: /\b(sell|selling|buyer|prospect|objection|closing|presentation approach)\b/i,
    keywords: ["sell", "selling", "buyer", "prospect", "objection", "close", "presentation", "client"],
    themes: ["selling", "marketing", "service"]
  },
  {
    pattern: /\b(startup|venture|entrepreneur|founder|feasibility|launch|business model)\b/i,
    keywords: ["startup", "venture", "entrepreneur", "founder", "launch", "growth", "feasibility", "businessmodel"],
    themes: ["entrepreneurship"]
  },
  {
    pattern: /\b(ethic|legal|law|regulation|compliance|policy|fairness)\b/i,
    keywords: ["legal", "ethics", "compliance", "policy", "risk", "regulation", "fairness"],
    themes: ["legal"]
  }
];

const SUPPORTIVE_GENERIC_KEYWORDS = new Set(
  [
    "leadership",
    "communication",
    "communicate",
    "motivation",
    "motivate",
    "training",
    "coach",
    "coaching",
    "conflict",
    "team",
    "supervisor",
    "feedback",
    "decision",
    "plan",
    "planning",
    "productivity",
    "time",
    "goal"
  ].map(canonicalizeToken)
);

type IndicatorEvaluation = {
  indicator: PerformanceIndicator;
  score: number;
  areaScore: number;
  keywordHits: number;
  broadKeywordHits: number;
  themeHits: number;
  unsupportedThemeHits: number;
  genericSupportHits: number;
  logicalFit: boolean;
  selectionFit: boolean;
  isSupportiveArea: boolean;
};

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

function buildScenarioKeywordContext(context?: ScenarioIndicatorContext): ScenarioKeywordContext {
  if (!context) {
    return {
      coreKeywordSet: new Set<string>(),
      broadKeywordSet: new Set<string>(),
      themes: []
    };
  }

  const coreKeywordSet = new Set(
    extractKeywords(
      [
        context.businessType ?? "",
        context.participantRole ?? "",
        context.judgeRole ?? "",
        ...(context.tensions ?? []),
        context.situation,
        context.ask
      ].join(" ")
    )
  );
  const broadKeywordSet = new Set(
    extractKeywords(
      [
        context.eventName,
        context.eventDescription ?? "",
        context.eventInstructionalArea ?? "",
        context.preferredInstructionalArea ?? "",
        context.businessType ?? "",
        context.participantRole ?? "",
        context.judgeRole ?? "",
        ...(context.tensions ?? []),
        context.situation,
        context.ask
      ].join(" ")
    )
  );
  const themeSource = coreKeywordSet.size > 0 ? coreKeywordSet : broadKeywordSet;

  return {
    coreKeywordSet,
    broadKeywordSet,
    themes: detectScenarioThemes(themeSource)
  };
}

function getPreferredAreaMinimum(targetCount: number) {
  return Math.max(Math.ceil(targetCount / 2), Math.ceil(targetCount * 0.75));
}

function getEventThemeHints(event?: EventOption) {
  if (!event) {
    return [];
  }

  return EVENT_THEME_HINTS[event.id] ?? [];
}

function isSupportiveArea(area: string) {
  return SUPPORTIVE_AREA_PATTERNS.some((pattern) => pattern.test(area));
}

function scoreAreaRelevance(
  area: string,
  event: EventOption | undefined,
  coreKeywordSet: Set<string>,
  broadKeywordSet: Set<string>,
  themes: string[]
) {
  const areaKeywords = getAreaHintKeywords(area);
  let score = scoreKeywordOverlap(coreKeywordSet, areaKeywords) * 2.5 + scoreKeywordOverlap(broadKeywordSet, areaKeywords) * 0.75;
  const eventThemes = getEventThemeHints(event);

  if (event?.instructionalArea?.trim() === area) {
    score += 2.5;
  }

  for (const theme of [...themes, ...eventThemes]) {
    if (THEME_AREA_MATCHERS[theme]?.some((pattern) => pattern.test(area))) {
      score += 2;
    }
  }

  if (isSupportiveArea(area) && themes.length > 0) {
    score += 1;
  }

  return score;
}

function hasRuleSupport(
  coreKeywordSet: Set<string>,
  broadKeywordSet: Set<string>,
  themes: string[],
  rule: { keywords: string[]; themes: string[] }
) {
  return (
    rule.themes.some((theme) => themes.includes(theme)) ||
    scoreKeywordOverlap(coreKeywordSet, rule.keywords) > 0 ||
    scoreKeywordOverlap(broadKeywordSet, rule.keywords) >= 2
  );
}

function failsRelevanceGuard(
  indicator: PerformanceIndicator,
  coreKeywordSet: Set<string>,
  broadKeywordSet: Set<string>,
  themes: string[]
) {
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
    const scenarioSupportsCareer =
      themes.includes("career") ||
      scoreKeywordOverlap(coreKeywordSet, careerSignals) > 0 ||
      scoreKeywordOverlap(broadKeywordSet, careerSignals) >= 2;

    if (!scenarioSupportsCareer) {
      return true;
    }
  }

  for (const rule of TOPIC_RELEVANCE_GUARDS) {
    if (rule.pattern.test(text) && !hasRuleSupport(coreKeywordSet, broadKeywordSet, themes, rule)) {
      return true;
    }
  }

  return false;
}

function scoreIndicatorRelevance(
  indicator: PerformanceIndicator,
  event: EventOption | undefined,
  coreKeywordSet: Set<string>,
  broadKeywordSet: Set<string>,
  themes: string[]
) {
  const indicatorKeywords = extractKeywords(`${indicator.text} ${indicator.instructionalArea ?? ""}`);
  const area = indicator.instructionalArea?.trim() || "General";
  const areaScore = scoreAreaRelevance(area, event, coreKeywordSet, broadKeywordSet, themes);
  const eventThemes = getEventThemeHints(event);
  const allowedThemes = new Set([...themes, ...eventThemes]);
  const indicatorThemes = detectScenarioThemes(new Set(indicatorKeywords));
  const keywordHits = indicatorKeywords.filter((keyword) => coreKeywordSet.has(keyword)).length;
  const broadKeywordHits = indicatorKeywords.filter((keyword) => broadKeywordSet.has(keyword)).length;
  const themeHits = indicatorThemes.filter((theme) => allowedThemes.has(theme)).length;
  const unsupportedThemeHits = indicatorThemes.filter((theme) => !allowedThemes.has(theme)).length;
  const genericSupportHits = indicatorKeywords.filter((keyword) => SUPPORTIVE_GENERIC_KEYWORDS.has(keyword)).length;
  const supportiveArea = isSupportiveArea(area);
  let score = areaScore + keywordHits * 4 + broadKeywordHits * 0.9 + themeHits * 2.75;

  if (failsRelevanceGuard(indicator, coreKeywordSet, broadKeywordSet, themes)) {
    score -= 10;
  }

  if (supportiveArea && keywordHits > 0) {
    score += 0.75;
  }

  if (genericSupportHits > 0 && keywordHits > 0 && areaScore >= 4) {
    score += 0.75;
  }

  if (unsupportedThemeHits > 0 && themeHits === 0) {
    score -= unsupportedThemeHits * 5;
  }

  if (keywordHits === 0 && broadKeywordHits === 0) {
    score -= supportiveArea ? 2.5 : 1.5;
  }

  const hasStrongDirectFit =
    keywordHits >= 2 ||
    (keywordHits >= 1 && themeHits >= 1) ||
    (!supportiveArea && keywordHits >= 1 && areaScore >= 4.25) ||
    (!supportiveArea && themeHits >= 1 && broadKeywordHits >= 2 && areaScore >= 5.25);
  const hasStrongSupportiveFit =
    supportiveArea &&
    keywordHits >= 1 &&
    (themeHits >= 1 || (genericSupportHits >= 1 && areaScore >= 5.25));
  const logicalFit =
    !failsRelevanceGuard(indicator, coreKeywordSet, broadKeywordSet, themes) &&
    !(unsupportedThemeHits > 0 && themeHits === 0) &&
    (
      hasStrongDirectFit ||
      hasStrongSupportiveFit ||
      (!supportiveArea && themeHits >= 2 && areaScore >= 5.75)
    );
  const selectionFit =
    logicalFit &&
    (
      keywordHits >= 1 ||
      (!supportiveArea && themeHits >= 1 && broadKeywordHits >= 2 && areaScore >= 5.75)
    );

  return {
    indicator,
    score,
    areaScore,
    keywordHits,
    broadKeywordHits,
    themeHits,
    unsupportedThemeHits,
    genericSupportHits,
    logicalFit,
    selectionFit,
    isSupportiveArea: supportiveArea
  } satisfies IndicatorEvaluation;
}

export function pickPerformanceIndicators(request: RoleplayRequest, context?: ScenarioIndicatorContext) {
  const event = getEventById(request.eventId);
  const relevant = performanceIndicatorList.filter((indicator) => indicator.eventIds.includes(request.eventId));

  if (relevant.length === 0) {
    throw new Error("No performance indicators were found for that event.");
  }

  const targetCount = Math.max(LIMITS.minPis, Math.min(LIMITS.maxPis, request.numberOfPis));
  const { coreKeywordSet, broadKeywordSet, themes: scenarioThemes } = buildScenarioKeywordContext(context);
  const requested = request.specificPerformanceIndicatorIds
    .map((id) => relevant.find((indicator) => indicator.id === id))
    .filter(Boolean) as PerformanceIndicator[];
  const preferredArea = request.instructionalAreaPreference.trim();
  const shouldForcePreferredArea = Boolean(preferredArea);
  const requestedIds = new Set(requested.map((indicator) => indicator.id));
  const scoredRelevant = relevant.map((indicator) =>
    scoreIndicatorRelevance(indicator, event, coreKeywordSet, broadKeywordSet, scenarioThemes)
  );
  const groupedByArea = scoredRelevant.reduce<
    Record<string, IndicatorEvaluation[]>
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
      const sorted = [...items]
        .filter((item) => item.logicalFit || requestedIds.has(item.indicator.id))
        .sort((left, right) => right.score - left.score);
      const topScores = sorted.slice(0, 3).reduce((sum, item) => sum + item.score, 0);

      return {
        area,
        items: sorted,
        score:
          topScores +
          scoreAreaRelevance(area, event, coreKeywordSet, broadKeywordSet, scenarioThemes) +
          (requestedArea === area ? 10 : 0)
      };
    })
    .filter((entry) => (requestedArea ? entry.area === requestedArea : entry.items.length > 0))
    .sort((left, right) => right.score - left.score);
  const chosenArea = eligibleAreaEntries[0]?.area ?? requestedArea ?? event?.instructionalArea ?? "General";
  const primaryMinimum = shouldForcePreferredArea
    ? getPreferredAreaMinimum(targetCount)
    : Math.ceil(targetCount / 2);
  const primaryRequested = requested.filter(
    (indicator) => (indicator.instructionalArea?.trim() || "General") === chosenArea
  );
  const primaryRequestedIds = new Set(primaryRequested.map((indicator) => indicator.id));
  const primaryEntries = (groupedByArea[chosenArea] ?? [])
    .filter((item) => item.selectionFit || requestedIds.has(item.indicator.id))
    .sort((left, right) => right.score - left.score);
  const primaryPool = primaryEntries
    .filter((item) => item.score >= 4 || requestedIds.has(item.indicator.id))
    .filter((item) => !primaryRequestedIds.has(item.indicator.id))
    .sort((left, right) => right.score - left.score);
  const weakerPrimaryPool = shouldForcePreferredArea
    ? primaryEntries
        .filter((item) => item.score >= 3.25 || requestedIds.has(item.indicator.id))
        .filter((item) => !primaryRequestedIds.has(item.indicator.id))
        .sort((left, right) => right.score - left.score)
    : [];
  const supportPool = Object.entries(groupedByArea)
    .filter(([area]) => area !== chosenArea)
    .flatMap(([area, items]) =>
      items
        .filter((item) =>
          item.selectionFit &&
          (item.isSupportiveArea
            ? item.score >= 4.25 || requestedIds.has(item.indicator.id)
            : item.score >= (shouldForcePreferredArea ? 5.25 : 4.5))
        )
        .map((item) => ({
          indicator: item.indicator,
          score: item.score + (item.isSupportiveArea ? 1 : 0)
        }))
    );
  const rankedFallback = scoredRelevant
    .filter((item) => !requestedIds.has(item.indicator.id))
    .filter((item) => item.selectionFit || (item.logicalFit && item.keywordHits >= 1))
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

  for (const item of weakerPrimaryPool) {
    if (selection.length >= primaryMinimum) {
      break;
    }
    const indicator = item.indicator;
    if (!selection.some((existing) => existing.id === indicator.id)) {
      selection.push(indicator);
    }
  }

  const remainingCandidates = shouldForcePreferredArea
    ? [
        ...primaryPool.map((item) => item.indicator),
        ...weakerPrimaryPool.map((item) => item.indicator),
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
