import { PARTICIPANT_INSTRUCTIONS, SKILLS_21ST_CENTURY } from "@/lib/config";
import { getEventById, pickPerformanceIndicators } from "@/lib/data";
import type {
  EventOption,
  FinancialAnalysisCase,
  FinancialAnalysisReview,
  JudgeEvaluation,
  ParticipantRoleplay,
  PerformanceIndicator,
  RoleplayRequest
} from "@/types";

type ScenarioBank = {
  businesses: string[];
  participantRoles: string[];
  judgeRoles: string[];
  situations: string[];
  tensions: string[];
  asks: string[];
  followUps: string[];
};

type ScenarioDraft = {
  business: string;
  participantRole: string;
  judgeRole: string;
  situation: string;
  ask: string;
  tensions: string[];
};

type FinancialAnalysisAssessment = {
  matchedResults: number;
  totalResults: number;
  mentionsFormula: boolean;
  recommendationAligned: boolean;
};

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "that",
  "with",
  "from",
  "into",
  "your",
  "have",
  "this",
  "will",
  "about",
  "used",
  "uses",
  "explain",
  "nature",
  "determine",
  "develop",
  "recommend",
  "describe",
  "support",
  "improve",
  "businesses",
  "business",
  "management",
  "identify",
  "importance",
  "types",
  "concept",
  "concepts",
  "factors",
  "methods",
  "activities",
  "effective",
  "effectively",
  "within",
  "across",
  "through",
  "their",
  "them",
  "what",
  "which",
  "using",
  "used",
  "use"
]);

type ConceptFamily = {
  name: string;
  aliases: string[];
};

type ResponseAnalysis = {
  normalizedText: string;
  tokenSet: Set<string>;
  matchedConcepts: Set<string>;
  wordCount: number;
  sentenceCount: number;
  hasNumbers: boolean;
  hasRecommendation: boolean;
  hasMetrics: boolean;
  hasStakeholderAwareness: boolean;
  hasJustification: boolean;
  hasActionSteps: boolean;
  hasRiskAwareness: boolean;
  hasClosing: boolean;
  hasExamples: boolean;
  hasTimeline: boolean;
  scenarioAlignment: number;
};

const CONCEPT_FAMILIES: ConceptFamily[] = [
  {
    name: "plan",
    aliases: ["plan", "strategy", "approach", "roadmap", "proposal", "recommendation", "solution"]
  },
  {
    name: "measure",
    aliases: ["measure", "track", "monitor", "evaluate", "assessment", "kpi", "metric", "benchmark", "target"]
  },
  {
    name: "people",
    aliases: ["employee", "staff", "team", "associate", "worker", "manager", "supervisor", "leadership"]
  },
  {
    name: "customer",
    aliases: ["customer", "guest", "client", "shopper", "buyer", "visitor"]
  },
  {
    name: "communication",
    aliases: ["communicate", "communication", "explain", "present", "presentation", "share", "clarify", "feedback"]
  },
  {
    name: "train",
    aliases: ["train", "training", "coach", "coaching", "mentor", "mentoring", "onboarding", "workshop", "learning"]
  },
  {
    name: "motivation",
    aliases: ["motivate", "engage", "encourage", "recognition", "reward", "incentive", "morale"]
  },
  {
    name: "leadership",
    aliases: ["leader", "leadership", "delegate", "delegation", "guide", "supervise"]
  },
  {
    name: "culture",
    aliases: ["culture", "values", "norms", "expectations", "workplace environment", "company climate"]
  },
  {
    name: "finance",
    aliases: ["finance", "financial", "funding", "capital", "investment"]
  },
  {
    name: "budget",
    aliases: ["budget", "cost", "expense", "spending", "afford", "funding"]
  },
  {
    name: "revenue",
    aliases: ["revenue", "sales", "income", "earnings"]
  },
  {
    name: "profit",
    aliases: ["profit", "margin", "roi", "return", "payback"]
  },
  {
    name: "cashflow",
    aliases: ["cash flow", "cashflow", "liquidity", "working capital"]
  },
  {
    name: "accounting",
    aliases: ["accounting", "ledger", "journal", "bookkeeping", "record", "reporting", "reconcile"]
  },
  {
    name: "control",
    aliases: ["control", "audit", "accuracy", "verification", "check", "compliance review"]
  },
  {
    name: "law",
    aliases: ["law", "legal", "regulation", "policy", "procedure", "ethics", "ethical", "compliance", "fairness"]
  },
  {
    name: "risk",
    aliases: ["risk", "challenge", "obstacle", "concern", "mitigate", "contingency", "backup", "prevent"]
  },
  {
    name: "market",
    aliases: ["market", "marketing", "campaign", "promotion", "advertising", "outreach"]
  },
  {
    name: "audience",
    aliases: ["audience", "target market", "target audience", "segment", "customer base"]
  },
  {
    name: "brand",
    aliases: ["brand", "branding", "image", "positioning", "awareness"]
  },
  {
    name: "digital",
    aliases: ["digital", "social media", "content", "online", "website", "email", "seo"]
  },
  {
    name: "pricing",
    aliases: ["price", "pricing", "discount", "markup"]
  },
  {
    name: "service",
    aliases: ["service", "experience", "hospitality", "satisfaction", "guest service", "customer service", "quality"]
  },
  {
    name: "operations",
    aliases: ["operations", "workflow", "process", "efficiency", "productivity", "capacity", "scheduling"]
  },
  {
    name: "inventory",
    aliases: ["inventory", "stock", "merchandise", "supply", "ordering", "shrink"]
  },
  {
    name: "analyze",
    aliases: ["analyze", "analysis", "review", "research", "study", "compare", "data"]
  },
  {
    name: "relationship",
    aliases: ["relationship", "trust", "rapport", "loyalty", "retention", "partnership"]
  },
  {
    name: "negotiation",
    aliases: ["negotiate", "negotiation", "persuade", "closing", "objection", "convince"]
  },
  {
    name: "technology",
    aliases: ["technology", "system", "software", "tool", "platform", "automation"]
  },
  {
    name: "wellness",
    aliases: ["wellness", "well-being", "health", "fitness", "balance"]
  },
  {
    name: "recruit",
    aliases: ["recruit", "recruitment", "hire", "hiring", "staffing", "candidate", "selection"]
  },
  {
    name: "creativity",
    aliases: ["creative", "innovative", "innovation", "fresh", "pilot", "partnership", "tiered", "phased"]
  }
];

const METRIC_RELEVANT_CONCEPTS = new Set([
  "measure",
  "finance",
  "budget",
  "revenue",
  "profit",
  "cashflow",
  "accounting",
  "control",
  "analyze",
  "service",
  "operations"
]);

const STAKEHOLDER_RELEVANT_CONCEPTS = new Set([
  "people",
  "customer",
  "communication",
  "train",
  "motivation",
  "leadership",
  "culture",
  "relationship",
  "recruit",
  "service"
]);

const RISK_RELEVANT_CONCEPTS = new Set([
  "risk",
  "law",
  "finance",
  "budget",
  "cashflow",
  "control",
  "operations",
  "service",
  "technology"
]);

const TOKEN_CONCEPT_LOOKUP = buildTokenConceptLookup(CONCEPT_FAMILIES);

const DIFFICULTY_NOTES: Record<RoleplayRequest["difficulty"], string> = {
  easy: "The judge is mainly looking for a clear, practical recommendation with direct reasoning.",
  medium:
    "The judge expects a realistic plan, measurable outcomes, and an explanation of tradeoffs.",
  hard: "The judge is skeptical and will expect specificity, fairness, follow-through, and risk awareness."
};

const SCENARIO_BANKS: Record<string, ScenarioBank> = {
  "principles-bma": {
    businesses: ["community bookstore", "small fitness studio", "family-owned bakery", "local pet supply shop"],
    participantRoles: ["management trainee", "assistant manager", "student business associate"],
    judgeRoles: ["store manager", "owner", "business supervisor"],
    situations: [
      "the business wants a stronger everyday plan for handling a common management challenge",
      "the owner wants a practical recommendation that improves operations without overcomplicating the fix",
      "a recent issue has shown that staff need clearer direction and better day-to-day execution",
      "the business needs a straightforward plan that balances customer experience and internal efficiency",
      "management wants a better everyday system for handling small operational problems before they become bigger issues",
      "the business is growing slowly and needs a practical recommendation to keep daily operations consistent"
    ],
    tensions: [
      "The judge wants a clear answer that sounds confident and easy to implement.",
      "The recommendation should stay realistic for an entry-level business setting.",
      "The plan should show basic business logic without getting overly technical.",
      "The business wants a practical next step that can be started quickly."
    ],
    asks: [
      "recommend the best next step and explain why it fits the situation",
      "outline a practical plan that the business could begin using immediately",
      "decide what action should come first and how the business would benefit"
    ],
    followUps: [
      "What would you do first if the business could only implement one part of your recommendation?",
      "How would you explain your plan to an employee who is unsure about the change?",
      "What simple measure would show that your idea is helping the business?",
      "Why is your recommendation more practical than a more complicated alternative?"
    ]
  },
  "bltdm-team": {
    businesses: ["regional apparel company", "growing logistics firm", "health products distributor", "local technology reseller"],
    participantRoles: ["student consultant on a decision-making team", "business law analyst", "ethics case consultant"],
    judgeRoles: ["chief operating officer", "compliance manager", "owner"],
    situations: [
      "leadership needs a recommendation on a legal or ethical issue before making the next business decision",
      "a recent conflict has raised concerns about compliance, fairness, and business risk",
      "the company wants guidance on how to move forward without creating avoidable legal exposure",
      "managers need a practical decision that balances ethics, business reality, and company reputation",
      "a policy concern has surfaced and leadership wants a response that protects both trust and business stability",
      "the company is facing pressure to act quickly and wants a legally and ethically sound recommendation before moving ahead"
    ],
    tensions: [
      "The judge expects you to acknowledge both legal and ethical consequences.",
      "The recommendation should reduce risk without ignoring business practicality.",
      "Leadership wants a plan that employees can understand and follow consistently.",
      "The business wants a decision that protects both trust and long-term results."
    ],
    asks: [
      "recommend the strongest course of action and justify it with sound business reasoning",
      "decide how the business should respond and what safeguard should be added next",
      "outline a practical recommendation that balances compliance, ethics, and execution"
    ],
    followUps: [
      "What is the biggest risk if the business ignores your recommendation?",
      "How would you help employees follow this decision consistently in practice?",
      "What policy or safeguard would you add to prevent the issue from happening again?",
      "How would you explain your recommendation to a leader focused only on short-term results?"
    ]
  },
  "hrm-series": {
    businesses: [
      "veterinary clinic",
      "financial consulting firm",
      "regional retail company",
      "software startup",
      "private dental practice",
      "property management company",
      "home-health provider",
      "distribution warehouse",
      "construction services firm",
      "community hospital",
      "insurance agency",
      "hospitality management company"
    ],
    participantRoles: [
      "human resources specialist",
      "training coordinator",
      "human resources manager",
      "employee relations coordinator",
      "talent development specialist",
      "people operations associate",
      "recruiting and onboarding coordinator",
      "human capital analyst"
    ],
    judgeRoles: [
      "director of human resources",
      "owner",
      "vice president of people",
      "chief operating officer",
      "regional manager",
      "director of talent development",
      "employee experience director"
    ],
    situations: [
      "new employees are not adjusting to the workplace culture as quickly as leadership hoped",
      "supervisors want stronger leadership development before promotions occur",
      "employee morale is slipping because onboarding and communication feel inconsistent",
      "the company wants a more inclusive wellness initiative that employees will actually use",
      "turnover has increased because employees do not see a clear path for growth",
      "front-line supervisors are giving inconsistent feedback and employees feel performance expectations are unclear",
      "the company is hiring quickly and wants a better onboarding process before service quality drops",
      "recent exit interviews suggest employees do not feel recognized or supported enough to stay",
      "management wants to improve internal communication after several avoidable HR misunderstandings",
      "employees are struggling with schedule changes and work-life balance during a busy season",
      "the business wants a more effective training plan before launching a new company-wide process",
      "leadership is concerned that internal promotions are not being prepared consistently enough",
      "the organization needs a practical plan to improve employee engagement across multiple departments",
      "managers need a fair response to growing conflict between experienced employees and newer hires",
      "the company wants to improve recruiting quality without slowing down hiring too much",
      "leaders want a stronger retention strategy for high-potential employees before the next busy quarter",
      "the business needs a clearer performance-management system so employees understand expectations and support",
      "the company is opening a new location and wants a stronger people plan so standards stay consistent across teams",
      "leadership wants to reduce burnout after a demanding quarter without lowering accountability or performance"
    ],
    tensions: [
      "The company has limited budget for a first rollout.",
      "Supervisors want the plan to be easy to implement during a busy quarter.",
      "Leadership wants visible results within 60 to 90 days.",
      "The solution must feel fair across employees in different roles.",
      "The judge wants a plan that front-line managers will realistically follow.",
      "The company does not want the recommendation to create more meetings without better outcomes.",
      "Employees in different departments need to feel equally supported by the plan.",
      "The recommendation should improve morale without hurting day-to-day productivity.",
      "Leadership wants to see measurable progress before approving a larger rollout.",
      "The business needs a plan that can work for both newer employees and experienced staff.",
      "Managers are already stretched thin, so the first version of the plan needs to stay simple.",
      "The company wants results without introducing a policy that feels impersonal or overly rigid."
    ],
    asks: [
      "recommend a realistic HR plan that solves the problem and can be measured over time",
      "decide what the company should implement first and how the success of the plan should be evaluated",
      "outline a practical recommendation the judge could approve today",
      "propose a people-focused solution that improves employee experience without overcomplicating execution",
      "recommend the strongest next step for leadership and explain how managers should carry it out",
      "develop a practical retention, onboarding, or development plan that can begin this quarter",
      "decide what HR action should come first and justify why it will create the most immediate impact",
      "recommend a realistic employee-support strategy and explain how the business should measure results",
      "outline a fair and workable HR improvement that leadership could communicate right away"
    ],
    followUps: [
      "How would you measure whether your recommendation is actually working after the first month?",
      "What would you do first if budget or staffing made your original plan harder to launch?",
      "How would you keep the recommendation fair for employees in different roles?",
      "What risk could cause this plan to fail, and how would you reduce it?",
      "How would you explain this recommendation to supervisors who think they already communicate well enough?",
      "What would you change if employee participation stayed low after the first rollout?",
      "How would you keep the plan practical for managers who are already very busy?",
      "What metric would tell you first whether morale is actually improving?",
      "How would you make sure this recommendation feels fair across different departments or shifts?",
      "If leadership could only approve one part of your plan today, which piece matters most and why?",
      "How would you handle resistance from employees who are skeptical about a new HR initiative?",
      "What part of your recommendation would produce the fastest visible win for the business?",
      "How would you keep the recommendation from becoming a short-term program that employees ignore later?",
      "What would you do if managers supported the plan but employees still did not trust it?",
      "How would you adapt the recommendation for a company with both remote and on-site employees?"
    ]
  },
  "bms-series": {
    businesses: ["local franchise", "distribution company", "home-services company", "small manufacturing business"],
    participantRoles: ["assistant manager", "operations analyst", "business manager"],
    judgeRoles: ["general manager", "owner", "operations director"],
    situations: [
      "workflow delays are reducing productivity and causing inconsistent service",
      "new growth has created communication problems between departments",
      "management wants to improve daily operations without disrupting customer service",
      "staffing and scheduling decisions are making it harder to hit performance goals",
      "different teams are handling the same process in different ways and results are becoming inconsistent",
      "managers want a simpler operations fix that improves accountability without slowing down service"
    ],
    tensions: [
      "The recommendation must be realistic for the current staff size.",
      "The judge does not want a plan that requires an expensive technology change.",
      "The business wants improvements quickly without lowering morale.",
      "The solution should balance efficiency with quality."
    ],
    asks: [
      "recommend an operations plan that addresses the root cause and improves execution",
      "propose a management solution with clear next steps and accountability",
      "decide what action the business should prioritize first"
    ],
    followUps: [
      "How would you make sure employees actually follow the new process?",
      "Which metric would you track first to prove the recommendation is helping?",
      "What would you say if a department manager resisted this change?",
      "How would you keep customer experience strong while making this change?"
    ]
  },
  "principles-finance": {
    businesses: ["student-run school store", "local service company", "community event business", "small online retailer"],
    participantRoles: ["finance trainee", "junior business associate", "student finance assistant"],
    judgeRoles: ["owner", "business advisor", "operations supervisor"],
    situations: [
      "the business wants a clearer finance-related decision before moving forward with the next step",
      "the owner needs a practical plan for a common finance issue but wants the explanation to stay straightforward",
      "leaders need a basic finance recommendation that improves decision-making without becoming too technical",
      "the business wants a simple financial plan that supports stability and better day-to-day choices",
      "management wants a clearer way to prioritize limited funds before making another spending decision",
      "the business is stable but wants a more financially disciplined approach to everyday decisions"
    ],
    tensions: [
      "The judge wants a recommendation that is easy to understand and act on.",
      "The plan should sound financially responsible without overcomplicating the issue.",
      "The business wants a practical next step with a visible benefit.",
      "The solution should connect clearly to basic business performance."
    ],
    asks: [
      "recommend the best next step and explain the business logic behind it",
      "outline a simple finance plan the judge could support immediately",
      "decide what the business should do first and how the result should be measured"
    ],
    followUps: [
      "What simple measure would you use first to tell whether your recommendation is helping?",
      "How would you explain this plan to someone with limited finance knowledge?",
      "What would make your recommendation safer than a more aggressive alternative?",
      "If the business could only take one action right away, what should it be?"
    ]
  },
  "act-series": {
    businesses: ["regional wholesaler", "dental practice", "equipment rental company", "local construction supplier"],
    participantRoles: ["accounting assistant", "staff accountant", "accounting coordinator"],
    judgeRoles: ["controller", "accounting manager", "owner"],
    situations: [
      "the business is seeing accounting inconsistencies that could affect reporting and decision-making",
      "leadership wants a cleaner accounting process before the next reporting period",
      "recent errors have made managers question whether records and procedures are strong enough",
      "the company needs a recommendation that improves financial accuracy and internal control",
      "accounting tasks are being completed inconsistently and the business wants a stronger process before the next close",
      "management wants a practical fix that improves recordkeeping without creating unnecessary extra work"
    ],
    tensions: [
      "The recommendation should strengthen accuracy without slowing the business too much.",
      "The judge wants practical accounting controls, not vague advice.",
      "The plan should be realistic for the current staff and reporting cycle.",
      "Leadership wants a process that is easy to monitor after implementation."
    ],
    asks: [
      "recommend the best accounting action and explain why it improves reliability",
      "outline a practical accounting process improvement with clear next steps",
      "decide what control or reporting fix the business should prioritize first"
    ],
    followUps: [
      "How would you check whether the new process is actually improving accuracy?",
      "What accounting risk remains even after your recommendation is implemented?",
      "How would you train staff to follow the updated process consistently?",
      "Why is your recommendation better than simply reviewing reports more often?"
    ]
  },
  "bfs-series": {
    businesses: ["manufacturing company", "distribution business", "growing franchise group", "commercial service provider"],
    participantRoles: ["finance analyst", "business finance coordinator", "corporate finance associate"],
    judgeRoles: ["chief financial officer", "owner", "finance manager"],
    situations: [
      "leaders need a stronger financial decision before committing resources to the next business step",
      "management wants a finance recommendation that improves business performance and protects cash flow",
      "recent decisions have raised concern about planning, budgeting, or the use of funds",
      "the company wants a financially sound action plan with clear business impact",
      "leadership wants a better way to evaluate an upcoming finance decision before committing company resources",
      "the business is growing but needs a more disciplined finance recommendation to protect near-term stability"
    ],
    tensions: [
      "The recommendation should balance growth potential with financial caution.",
      "The judge wants a decision that can be justified with realistic business reasoning.",
      "Leadership expects you to address both risk and measurable benefit.",
      "The solution should be practical for near-term implementation."
    ],
    asks: [
      "recommend the strongest business-finance action and justify why it is the best option",
      "outline a finance plan that improves performance and can be measured over time",
      "decide what financial action the company should prioritize first"
    ],
    followUps: [
      "Which financial measure would best prove that your recommendation is working?",
      "What is the biggest financial risk in your plan, and how would you reduce it?",
      "How would you explain your recommendation to a leader focused only on short-term results?",
      "What would you change if the business had a tighter budget than expected?"
    ]
  },
  "ftdm-team": {
    businesses: ["community bank", "credit union", "small accounting firm", "insurance agency"],
    participantRoles: ["financial services consultant", "business advisor", "account representative"],
    judgeRoles: ["branch manager", "owner", "finance director"],
    situations: [
      "the client wants to grow but is unsure which financial option is safest",
      "recent financial data suggests the business is making decisions without enough planning",
      "the customer is concerned about risk and wants a recommendation that feels realistic",
      "leadership wants a clearer financial action plan before making the next decision",
      "the client needs help comparing realistic financial choices before moving forward",
      "decision-makers want a financial recommendation that improves confidence without taking on unnecessary risk"
    ],
    tensions: [
      "The recommendation must be understandable to a non-expert decision-maker.",
      "The judge expects you to address both benefits and risks.",
      "The client wants a plan that feels achievable in the near term.",
      "The solution should be supported with at least one measurable outcome."
    ],
    asks: [
      "recommend a practical financial path and justify why it is the best option",
      "outline what the client should do next and how the impact should be measured",
      "explain the strongest recommendation in a way the judge can confidently support"
    ],
    followUps: [
      "What is the main risk in your recommendation, and why is it still worth considering?",
      "How would you explain this to a client who is nervous about change?",
      "What financial measure would you watch most closely after implementation?",
      "What makes your recommendation stronger than a simpler short-term option?"
    ]
  },
  "principles-marketing": {
    businesses: ["community bookstore", "small fitness studio", "local dessert shop", "campus spirit store"],
    participantRoles: ["marketing trainee", "junior promotion associate", "assistant manager"],
    judgeRoles: ["owner", "store manager", "marketing supervisor"],
    situations: [
      "the business wants a clearer promotion idea before investing more time and money",
      "customer awareness is lower than expected and management wants a practical marketing recommendation",
      "the business needs a stronger message to attract the right audience",
      "leaders want a straightforward marketing plan that is easy to explain and execute",
      "management wants a more focused marketing idea because current outreach feels too broad",
      "the business needs a practical way to increase awareness without creating a confusing promotion"
    ],
    tensions: [
      "The recommendation should stay realistic for a smaller business.",
      "The judge wants a clear target audience and a simple way to measure results.",
      "The plan should sound practical, not overly technical.",
      "The business wants an idea that staff can explain consistently."
    ],
    asks: [
      "recommend the best next marketing step and explain why it fits the situation",
      "outline a simple promotion plan the judge could support immediately",
      "decide what action should come first and how the business would benefit"
    ],
    followUps: [
      "How would you know if your target audience is actually responding to this idea?",
      "What would you change first if the plan did not perform as expected?",
      "Why is your recommendation better than a broader generic promotion?",
      "What result would you measure first to prove the plan is working?"
    ]
  },
  "aam-series": {
    businesses: ["boutique clothing retailer", "sneaker and streetwear shop", "fashion accessories store", "mall apparel brand"],
    participantRoles: ["merchandising coordinator", "retail marketing associate", "assistant buyer"],
    judgeRoles: ["store owner", "merchandising manager", "retail director"],
    situations: [
      "seasonal inventory is not moving as quickly as expected",
      "the store wants a stronger merchandising plan for a new product line",
      "customer traffic is steady, but conversion on featured items is weak",
      "management wants the product mix and in-store presentation to drive more sales",
      "the business wants a better assortment decision before investing more heavily in an upcoming season",
      "featured merchandise is getting attention but not enough purchases, and leadership wants a stronger plan"
    ],
    tensions: [
      "The recommendation must work within limited display space.",
      "The judge wants a plan that feels on-brand and customer-friendly.",
      "The business wants stronger sales without confusing shoppers.",
      "The solution should be measurable through product or traffic results."
    ],
    asks: [
      "recommend a merchandising action that will improve product performance",
      "outline the best next step for product mix, display, or presentation",
      "decide what change the store should prioritize first"
    ],
    followUps: [
      "How would you know whether the display or assortment change is working?",
      "What would you do if one featured category still underperformed after your plan?",
      "How would staff support your merchandising recommendation on the sales floor?",
      "Why is this a stronger choice than discounting everything immediately?"
    ]
  },
  "asm-series": {
    businesses: ["auto repair shop", "tire and service center", "car detailing brand", "dealership service department"],
    participantRoles: ["marketing coordinator", "customer outreach specialist", "service marketing associate"],
    judgeRoles: ["service manager", "owner", "marketing manager"],
    situations: [
      "repeat visits are weaker than management wants and local awareness feels inconsistent",
      "the business wants a stronger promotion strategy for routine services",
      "customers are not responding to current reminders and service offers",
      "management wants a marketing plan that builds trust and drives appointments",
      "leadership wants a more effective way to remind customers about recurring service needs",
      "the business needs a clearer local marketing approach that turns awareness into booked appointments"
    ],
    tensions: [
      "The recommendation needs to feel credible and customer-focused.",
      "The judge expects a realistic local marketing approach.",
      "The plan should be easy for front-line staff to explain.",
      "The business wants a clear metric tied to appointment growth or retention."
    ],
    asks: [
      "recommend the strongest local marketing action and explain why it fits the business",
      "outline a customer-focused plan to increase service demand",
      "decide what promotion or outreach step should be prioritized first"
    ],
    followUps: [
      "How would you build customer trust while promoting this offer?",
      "What measure would best show that your recommendation is working?",
      "What would you adjust if the first message did not bring in enough appointments?",
      "Why is your plan stronger than a simple discount with no follow-up?"
    ]
  },
  "bsm-series": {
    businesses: ["boutique retailer", "sports venue", "coffee chain", "local service brand"],
    participantRoles: ["marketing coordinator", "account executive", "promotion specialist"],
    judgeRoles: ["marketing director", "owner", "general manager"],
    situations: [
      "the business wants to improve customer response to a campaign that has been underperforming",
      "leaders need a stronger promotion plan to attract a clearly defined audience",
      "customer engagement is flat and management wants a more intentional strategy",
      "the business wants to stand out from competitors without confusing customers",
      "management wants a sharper message because the current campaign is not moving enough customers to act",
      "the company needs a practical promotion idea that feels more focused and better aligned to customer needs"
    ],
    tensions: [
      "The recommendation needs to match a realistic budget.",
      "The judge wants a clear target audience and measurable result.",
      "The business wants the idea to feel fresh but still practical.",
      "The plan should be easy for staff to explain and execute."
    ],
    asks: [
      "recommend a promotion strategy with clear reasoning and expected outcomes",
      "decide which marketing action should be prioritized first",
      "outline a customer-focused plan the judge could approve immediately"
    ],
    followUps: [
      "How would you know if the target audience is actually responding to your plan?",
      "What would you change if the first version of your campaign underperformed?",
      "Why is this strategy a better fit than a broader generic promotion?",
      "How would employees communicate this idea consistently to customers?"
    ]
  },
  "btdm-team": {
    businesses: ["department store", "specialty retailer", "campus bookstore", "home goods store"],
    participantRoles: ["assistant buyer", "merchandising analyst", "member of the buying team"],
    judgeRoles: ["merchandising director", "owner", "buying manager"],
    situations: [
      "the business wants to improve assortment decisions before the next selling period",
      "sales data suggests the current product mix is not matching customer demand strongly enough",
      "management needs a better buying and merchandising plan for an upcoming season",
      "the company wants a recommendation that improves both assortment and customer appeal",
      "leadership wants a stronger merchandise decision before placing the next round of orders",
      "the store needs a practical recommendation that reduces assortment risk while improving customer response"
    ],
    tensions: [
      "The recommendation should balance customer demand with inventory risk.",
      "The judge wants clear business reasoning, not only style opinions.",
      "The plan should be realistic for the current selling season.",
      "The business wants a measurable impact on sales or product performance."
    ],
    asks: [
      "recommend the strongest buying or merchandising action and justify it",
      "outline a product decision the business should prioritize first",
      "decide how the store should adjust assortment or presentation to improve results"
    ],
    followUps: [
      "What sales signal would best show that your assortment recommendation is working?",
      "How would you reduce the risk of overcommitting to the wrong product choice?",
      "What would you test first before changing the full assortment?",
      "Why is your recommendation stronger than simply adding more variety?"
    ]
  },
  "food-series": {
    businesses: ["bakery chain", "specialty snack brand", "prepared foods concept", "quick-service food brand"],
    participantRoles: ["food marketing coordinator", "brand associate", "promotion specialist"],
    judgeRoles: ["owner", "marketing director", "general manager"],
    situations: [
      "the business wants stronger customer trial for a featured item or menu category",
      "management needs a more effective promotion strategy to increase repeat purchases",
      "customer interest is uneven and the business wants a clearer marketing direction",
      "leaders want a marketing plan that improves response without creating operational confusion",
      "the brand wants a stronger way to support a limited-time food item without overwhelming staff",
      "management needs a practical promotion that improves awareness and repeat purchasing for a featured category"
    ],
    tensions: [
      "The recommendation needs to feel timely and easy for staff to execute.",
      "The judge wants a plan that is realistic for food-service operations.",
      "The business cares about repeat business, not just one-time traffic.",
      "The solution should connect to a measurable customer response."
    ],
    asks: [
      "recommend the best food-marketing action and explain why it fits the situation",
      "outline a promotion plan that could increase traffic and repeat purchases",
      "decide what marketing step the business should take first"
    ],
    followUps: [
      "How would you know whether customers are returning because of your plan?",
      "What would you change if the promotion brought traffic but not repeat business?",
      "How would staff communicate this idea consistently during busy periods?",
      "Why is this recommendation a better fit than a broader generic promotion?"
    ]
  },
  "imce-campaign": {
    businesses: ["city festival", "nonprofit 5K", "regional conference", "campus events board"],
    participantRoles: ["campaign planner", "integrated marketing coordinator", "promotion strategist"],
    judgeRoles: ["event director", "marketing manager", "organizer"],
    situations: [
      "the event needs a stronger integrated campaign to improve awareness and attendance",
      "management wants one coordinated plan instead of disconnected promotions across channels",
      "the current event marketing lacks consistency and is not reaching the right audience clearly",
      "the organization wants a practical multi-channel campaign with measurable goals",
      "leaders want a more connected event campaign because individual promotions are not building enough momentum",
      "the event team needs a clearer integrated plan that drives response before registration slows further"
    ],
    tensions: [
      "The campaign should feel consistent across all channels.",
      "The judge wants a clear audience, message, and rollout plan.",
      "The plan should be realistic for the available budget and timeline.",
      "The recommendation should include a measurable success target."
    ],
    asks: [
      "recommend an integrated campaign plan and explain how the pieces work together",
      "outline the strongest multi-channel approach for promoting the event",
      "decide what campaign element should be prioritized first and why"
    ],
    followUps: [
      "How would you keep the campaign message consistent across channels?",
      "What metric would best show that the campaign is building real event response?",
      "What would you adjust if one channel underperformed during the campaign?",
      "Why is this campaign stronger than relying on only one promotional channel?"
    ]
  },
  "mcs-series": {
    businesses: ["regional retailer", "community arts festival", "startup app", "nonprofit fundraiser"],
    participantRoles: ["communications coordinator", "brand messaging associate", "promotion specialist"],
    judgeRoles: ["marketing director", "brand manager", "owner"],
    situations: [
      "the business needs a clearer message because customer response has been inconsistent",
      "management wants stronger communication across the channels customers notice most",
      "a recent campaign lacked a clear call to action and did not connect with the audience well",
      "the organization wants a message strategy that improves awareness and response",
      "leadership wants a more unified communication approach because the current messaging feels fragmented",
      "the business needs a stronger call to action before launching the next communications push"
    ],
    tensions: [
      "The recommendation should match the audience and not feel generic.",
      "The judge wants a clear message and a sensible channel choice.",
      "The plan should be easy to deliver consistently across touchpoints.",
      "The business expects a measurable communication outcome."
    ],
    asks: [
      "recommend the strongest communications approach and explain why it will work",
      "outline a clearer message strategy with a practical rollout plan",
      "decide which communication action should be prioritized first"
    ],
    followUps: [
      "How would you tell whether the message is resonating with the audience?",
      "What would you change if awareness improved but response stayed weak?",
      "Why is this channel mix better than a broader less-focused approach?",
      "How would you keep employees or partners aligned with the campaign message?"
    ]
  },
  "mtdm-team": {
    businesses: ["multi-location retailer", "local attraction", "service business", "consumer brand"],
    participantRoles: ["member of the marketing management team", "marketing strategy analyst", "brand planning associate"],
    judgeRoles: ["general manager", "marketing director", "owner"],
    situations: [
      "the business wants a stronger growth strategy after recent marketing results underperformed",
      "management needs a clearer audience-focused plan before the next campaign cycle",
      "customer engagement is flattening and leadership wants a more intentional marketing decision",
      "the company needs a practical marketing recommendation with visible business impact",
      "leaders want a more strategic marketing move because recent tactics have felt too reactive",
      "the business needs a focused decision that can improve marketing performance without stretching the budget too far"
    ],
    tensions: [
      "The recommendation should balance creativity with practicality.",
      "The judge expects clear audience focus and measurable results.",
      "The plan should be realistic for the business size and budget.",
      "Leadership wants a strategy that staff can execute consistently."
    ],
    asks: [
      "recommend the strongest marketing-management action and justify it",
      "outline a strategic plan the judge could support immediately",
      "decide what marketing move the business should prioritize first"
    ],
    followUps: [
      "What metric would best prove your recommendation is helping the business?",
      "How would you respond if another manager preferred a broader less-focused strategy?",
      "What would you test first before fully scaling your plan?",
      "How would you keep the execution consistent across the organization?"
    ]
  },
  "pse-event": {
    businesses: ["software subscription company", "commercial cleaning service", "wellness program provider", "business training firm"],
    participantRoles: ["sales consultant", "account executive", "business development representative"],
    judgeRoles: ["purchasing manager", "owner", "operations director"],
    situations: [
      "the customer is interested but unsure whether the solution is the right fit",
      "the client wants a recommendation that clearly matches their needs and budget",
      "the decision-maker is comparing options and needs a confident, practical sales presentation",
      "the business wants a consultative selling approach that builds trust and closes effectively",
      "the buyer sees potential value but still needs a clearer reason to move ahead with the purchase",
      "the client wants a more tailored explanation before committing to a solution"
    ],
    tensions: [
      "The recommendation should sound customer-focused, not overly pushy.",
      "The judge expects you to connect features to customer needs clearly.",
      "The plan should balance persuasion with realistic business logic.",
      "The solution should include a clear next step toward closing the sale."
    ],
    asks: [
      "recommend the strongest solution for the customer and explain why it fits",
      "outline a consultative selling approach that would move the client toward a decision",
      "decide what value point or next step should be emphasized first"
    ],
    followUps: [
      "How would you respond if the customer felt your solution was too expensive?",
      "What question would you ask next to better understand the client's needs?",
      "How would you close the conversation without sounding too aggressive?",
      "Why is your recommendation a better fit than a lower-cost alternative?"
    ]
  },
  "sem-series": {
    businesses: ["minor league team", "concert venue", "esports organization", "family entertainment center"],
    participantRoles: ["marketing coordinator", "fan engagement specialist", "promotions associate"],
    judgeRoles: ["director of marketing", "general manager", "sponsorship manager"],
    situations: [
      "attendance or audience engagement is flatter than leadership wants",
      "management needs a stronger promotional idea for a specific event or time period",
      "the organization wants to improve response from a clearly defined audience segment",
      "sponsors and leadership want a marketing plan that drives more visible fan engagement",
      "the organization wants a more targeted promotion because current efforts are not energizing the audience enough",
      "leadership needs a practical idea to boost attendance or participation for an upcoming event window"
    ],
    tensions: [
      "The recommendation should fit the audience and venue experience.",
      "The judge wants a plan that is promotional but still realistic to execute.",
      "The business expects a measurable attendance or engagement result.",
      "The solution should work well with existing partners or sponsors."
    ],
    asks: [
      "recommend the strongest audience-growth or promotion strategy and justify it",
      "outline a fan-focused marketing plan with clear execution steps",
      "decide what marketing action should be prioritized first"
    ],
    followUps: [
      "How would you know whether fans are truly responding to your plan?",
      "What would you change if the promotion increased awareness but not ticket sales?",
      "How would you involve sponsors or partners in the strategy without weakening the message?",
      "Why is this recommendation a better fit than a broad generic promotion?"
    ]
  },
  "principles-hospitality": {
    businesses: ["boutique inn", "small tour operator", "local event venue", "family-owned cafe"],
    participantRoles: ["hospitality trainee", "guest experience associate", "assistant supervisor"],
    judgeRoles: ["owner", "operations manager", "general manager"],
    situations: [
      "the business wants a clearer hospitality recommendation before making its next service decision",
      "management needs a practical guest-focused plan that is easy to explain and carry out",
      "leaders want a straightforward idea to improve customer response and day-to-day execution",
      "the business needs a simple hospitality plan that balances service quality and operational reality",
      "guest feedback suggests a service issue needs attention before it affects repeat business",
      "management wants a practical hospitality improvement that staff can begin using right away"
    ],
    tensions: [
      "The recommendation should stay realistic for a smaller hospitality business.",
      "The judge wants a guest-centered plan with a clear benefit.",
      "The solution should be practical, not overly technical.",
      "The business wants a result that can be measured quickly."
    ],
    asks: [
      "recommend the best next step and explain why it fits the hospitality situation",
      "outline a practical guest-focused plan the judge could support immediately",
      "decide what action should come first and how the business would benefit"
    ],
    followUps: [
      "What simple result would show that your recommendation is helping guests?",
      "How would you explain your plan to staff who need to carry it out right away?",
      "What would you change first if the plan did not improve guest response?",
      "Why is your recommendation stronger than a more complicated alternative?"
    ]
  },
  "htps-series": {
    businesses: ["boutique hotel", "tour company", "conference venue", "destination attraction"],
    participantRoles: ["sales consultant", "guest experience specialist", "hospitality representative"],
    judgeRoles: ["sales manager", "general manager", "director of guest services"],
    situations: [
      "guest expectations are rising and the business wants a stronger service-focused recommendation",
      "the client wants a hospitality solution that improves satisfaction and repeat business",
      "management needs a polished plan that balances service quality and operational reality",
      "the business wants to recover from a poor guest experience and rebuild confidence",
      "the customer is interested but needs a clearer hospitality solution before committing to the business",
      "leadership wants a service-focused recommendation that helps rebuild trust and future bookings"
    ],
    tensions: [
      "The recommendation should protect the guest experience.",
      "The judge cares about realism and not overpromising.",
      "The plan should make sense for front-line staff to carry out.",
      "The business wants results that can be seen in guest feedback."
    ],
    asks: [
      "recommend a hospitality-focused solution and explain why it would improve guest response",
      "outline what the business should do to strengthen service and customer confidence",
      "propose the best next step for a guest-centered recovery or selling plan"
    ],
    followUps: [
      "How would you train staff to deliver this recommendation consistently?",
      "What guest-facing result would show that your idea is working?",
      "How would you respond if a guest still seemed dissatisfied after this plan?",
      "What part of your recommendation matters most to the customer experience?"
    ]
  },
  "htdm-team": {
    businesses: ["conference hotel", "resort property", "visitor attraction", "event services company"],
    participantRoles: ["member of the hospitality services team", "guest operations analyst", "service planning associate"],
    judgeRoles: ["general manager", "director of operations", "guest services manager"],
    situations: [
      "management needs a stronger hospitality service plan before an upcoming busy period",
      "guest feedback suggests the current experience is inconsistent across service touchpoints",
      "leaders want a practical recommendation that improves service while protecting operations",
      "the business needs a hospitality decision that balances guest expectations and staff execution",
      "the organization wants a better service plan before a high-volume season puts more pressure on the staff",
      "leaders need a guest-experience recommendation that improves consistency across multiple service areas"
    ],
    tensions: [
      "The recommendation should improve service without overloading staff.",
      "The judge wants a clear plan that can be implemented consistently.",
      "The business expects both guest and operational benefits.",
      "The solution should include a measurable success signal."
    ],
    asks: [
      "recommend the strongest hospitality service action and justify it",
      "outline a practical guest-experience plan with clear next steps",
      "decide what service improvement the business should prioritize first"
    ],
    followUps: [
      "How would you make sure staff follow your recommendation consistently?",
      "What guest-facing metric would best show that the plan is working?",
      "What would you change if service improved in one area but slipped in another?",
      "Why is your recommendation better than a short-term quick fix?"
    ]
  },
  "hlm-series": {
    businesses: ["airport hotel", "boutique lodge", "resort hotel", "conference property"],
    participantRoles: ["lodging manager trainee", "front office supervisor", "hotel operations associate"],
    judgeRoles: ["general manager", "rooms division manager", "director of lodging"],
    situations: [
      "guest satisfaction is slipping because one part of the lodging experience feels inconsistent",
      "management wants a stronger hotel operations plan before the next high-occupancy period",
      "recent feedback shows the property needs a clearer guest-service recommendation",
      "the hotel wants to improve occupancy support and guest confidence without disrupting operations",
      "leadership wants a more dependable lodging plan before the next busy travel period",
      "the property needs a practical recommendation that improves guest confidence without hurting front-desk efficiency"
    ],
    tensions: [
      "The recommendation should protect the guest experience from arrival through departure.",
      "The judge expects a realistic hotel operations approach.",
      "The property wants improvements that staff can execute consistently.",
      "The plan should connect to measurable guest or occupancy results."
    ],
    asks: [
      "recommend the best lodging-management action and explain why it fits the property",
      "outline a guest-focused hotel plan with realistic next steps",
      "decide what lodging improvement the property should prioritize first"
    ],
    followUps: [
      "How would you know whether guests are actually noticing the improvement?",
      "What part of the hotel operation would you monitor most closely after implementation?",
      "How would you respond if occupancy stayed steady but guest satisfaction did not improve?",
      "Why is your recommendation better than focusing only on a short-term promotion?"
    ]
  },
  "qsrm-series": {
    businesses: ["quick-serve restaurant", "busy cafe", "student dining concept", "small food-service brand"],
    participantRoles: ["restaurant supervisor", "operations trainee", "shift manager"],
    judgeRoles: ["store manager", "owner", "district manager"],
    situations: [
      "the operation is busy but service consistency is slipping",
      "management wants stronger efficiency without harming customer satisfaction",
      "staffing and workflow problems are creating bottlenecks during peak hours",
      "the business wants a practical improvement that can be implemented quickly",
      "leaders want a better shift-level process because current operations feel too reactive during rush periods",
      "the restaurant needs an operations recommendation that improves speed without reducing order accuracy"
    ],
    tensions: [
      "The recommendation must be workable during a busy shift.",
      "The judge wants a balance between speed, quality, and morale.",
      "The plan should not depend on a major budget increase.",
      "The business expects measurable operational improvement."
    ],
    asks: [
      "recommend an operational improvement plan with realistic next steps",
      "decide what the manager should prioritize first and how success should be measured",
      "outline a staffing or workflow recommendation the judge could implement soon"
    ],
    followUps: [
      "How would you keep employees bought in if the new process feels harder at first?",
      "Which operational metric would best prove your idea is helping?",
      "What part of your recommendation would you test first before a full rollout?",
      "How would this plan protect both speed and customer satisfaction?"
    ]
  },
  "rfsm-series": {
    businesses: ["casual dining restaurant", "family restaurant", "full-service concept", "local bistro"],
    participantRoles: ["restaurant manager trainee", "service manager", "food service supervisor"],
    judgeRoles: ["general manager", "owner", "restaurant director"],
    situations: [
      "guest experience is uneven and management wants a stronger restaurant plan before it affects repeat business",
      "the restaurant needs a recommendation that improves service consistency and staff execution",
      "recent feedback suggests operations and guest satisfaction are no longer aligned",
      "leadership wants a practical restaurant decision that balances quality, speed, and profitability",
      "management wants a stronger restaurant-service plan before inconsistent execution hurts loyalty further",
      "the business needs a guest-focused improvement that also keeps dining-room operations realistic for staff"
    ],
    tensions: [
      "The recommendation should protect both service quality and operational flow.",
      "The judge wants a realistic solution for a full-service environment.",
      "The plan should help staff deliver a more consistent guest experience.",
      "The business expects a measurable improvement in either service or performance."
    ],
    asks: [
      "recommend the strongest restaurant-management action and justify it",
      "outline a practical food-service plan with clear next steps",
      "decide what change the restaurant should prioritize first"
    ],
    followUps: [
      "How would you tell whether the guest experience is improving after your plan starts?",
      "What would you do if staff struggled to apply the recommendation consistently?",
      "Which operating measure would best prove that the plan is helping the restaurant?",
      "Why is your recommendation stronger than simply adding more labor?"
    ]
  },
  "ttdm-team": {
    businesses: ["tour operator", "destination marketing group", "travel agency", "visitor bureau"],
    participantRoles: ["travel and tourism analyst", "guest planning associate", "member of the tourism team"],
    judgeRoles: ["tourism director", "owner", "operations manager"],
    situations: [
      "the organization wants a stronger travel or tourism recommendation before the next promotion cycle",
      "management needs a clearer guest-experience plan to improve bookings or customer satisfaction",
      "recent response suggests the current travel offering is not connecting strongly enough with the target audience",
      "the business wants a practical tourism decision that improves both value perception and execution",
      "leaders want a more compelling travel or destination idea before interest drops during the next selling period",
      "the organization needs a clearer tourism recommendation that strengthens both guest appeal and operational follow-through"
    ],
    tensions: [
      "The recommendation should feel attractive to guests and realistic for the business.",
      "The judge expects a plan that balances experience, logistics, and promotion.",
      "The organization wants a measurable impact on bookings, response, or guest satisfaction.",
      "The solution should be practical for staff and partners to deliver."
    ],
    asks: [
      "recommend the strongest travel or tourism action and explain why it fits",
      "outline a guest-centered tourism plan with realistic next steps",
      "decide what travel or destination improvement should be prioritized first"
    ],
    followUps: [
      "How would you know whether travelers are responding to your recommendation?",
      "What would you change if interest increased but bookings did not?",
      "How would you coordinate partners or staff to make this plan work smoothly?",
      "Why is your recommendation a better fit than a broader generic tourism promotion?"
    ]
  },
  "ent-series": {
    businesses: [
      "startup coffee brand",
      "subscription fitness app",
      "student-run apparel brand",
      "local eco-friendly cleaning company",
      "mobile pet-grooming business",
      "custom dessert catering company"
    ],
    participantRoles: ["entrepreneurial founder", "venture planning associate", "startup operations lead"],
    judgeRoles: ["owner", "investor advisor", "co-founder"],
    situations: [
      "the venture needs a clearer next step before leadership commits more time and money to growth",
      "the business has traction but needs a stronger recommendation before the next planning phase begins",
      "leadership wants a practical venture decision that balances opportunity, risk, and execution",
      "the company sees potential demand but needs a sharper startup recommendation before scaling too quickly",
      "the founder wants a realistic plan that strengthens both feasibility and day-to-day follow-through",
      "recent feedback suggests the venture needs a better decision on growth, operations, or customer fit before moving forward"
    ],
    tensions: [
      "The judge expects an entrepreneurial recommendation that is realistic for a growing venture.",
      "The plan should balance innovation with practical business execution.",
      "The recommendation should show both opportunity awareness and risk control.",
      "Leadership wants a next step that feels actionable, not just creative."
    ],
    asks: [
      "recommend the strongest entrepreneurial next step and explain why it fits the venture",
      "outline a practical startup plan with clear implementation priorities",
      "decide what the venture should focus on first and justify the business logic"
    ],
    followUps: [
      "What would tell you that the venture is ready to scale this recommendation further?",
      "How would you reduce risk if the recommendation does not perform as expected at first?",
      "Which metric would best show whether the idea is actually helping the business?",
      "Why is this recommendation stronger than waiting for more information before acting?"
    ]
  },
  "etdm-team": {
    businesses: [
      "direct-to-consumer snack company",
      "community tutoring startup",
      "micro-fulfillment delivery business",
      "specialty candle brand",
      "wellness coaching startup",
      "event-planning venture"
    ],
    participantRoles: [
      "member of the entrepreneurship decision-making team",
      "venture strategy teammate",
      "startup planning analyst"
    ],
    judgeRoles: ["founder", "co-owner", "advisory board representative"],
    situations: [
      "the team needs to make a venture decision before the next stage of growth begins",
      "leadership wants a stronger entrepreneurial strategy before putting more resources behind the current idea",
      "the venture needs a recommendation that improves long-term viability without creating avoidable risk",
      "the business has momentum, but the team must decide how to strengthen execution before expanding further",
      "the founders want a practical recommendation that improves both customer value and business stability",
      "recent results suggest the team needs a clearer startup strategy before the next launch or expansion step"
    ],
    tensions: [
      "The judge expects a recommendation that balances venture growth with disciplined planning.",
      "The solution should feel realistic for a team making an entrepreneurial decision.",
      "The plan should acknowledge both upside and operational risk.",
      "Leadership wants a recommendation that can be acted on quickly and measured clearly."
    ],
    asks: [
      "recommend the strongest team-based entrepreneurial decision and justify it",
      "outline a practical startup strategy with clear next steps and priorities",
      "decide what the venture team should focus on first and explain the tradeoffs"
    ],
    followUps: [
      "How would you divide responsibilities so the team could execute this plan effectively?",
      "What early sign would show that your recommendation is not working well enough yet?",
      "How would you keep the venture focused if new ideas start competing with your main plan?",
      "Why does this recommendation make more sense than a faster but riskier option?"
    ]
  }
};

const SCENARIO_BANK_ALIASES: Record<string, string> = {
  "imcp-campaign": "imce-campaign",
  "imcs-campaign": "imce-campaign",
  "rms-series": "aam-series",
  "stdm-team": "sem-series"
};

type SituationExpansionTheme = {
  primary: string;
  execution: string;
  risk: string;
  outcome: string;
  stakeholders: string;
  timeframe: string;
};

const EVENT_SITUATION_EXPANSION_THEMES: Record<string, SituationExpansionTheme> = {
  "principles-bma": {
    primary: "business-administration",
    execution: "day-to-day management",
    risk: "small execution problems turn into broader team confusion",
    outcome: "team consistency",
    stakeholders: "employees",
    timeframe: "the next busy week"
  },
  "bltdm-team": {
    primary: "legal-and-ethics",
    execution: "policy-and-compliance",
    risk: "a questionable decision damages trust and creates unnecessary exposure",
    outcome: "company credibility",
    stakeholders: "employees and customers",
    timeframe: "the next policy review"
  },
  "hrm-series": {
    primary: "human-resources",
    execution: "people-management",
    risk: "morale and retention continue slipping",
    outcome: "employee performance",
    stakeholders: "staff members",
    timeframe: "the next staffing cycle"
  },
  "principles-finance": {
    primary: "finance",
    execution: "basic money-management",
    risk: "a small financial decision becomes more expensive than expected",
    outcome: "decision confidence",
    stakeholders: "owners",
    timeframe: "the next cash review"
  },
  "act-series": {
    primary: "accounting",
    execution: "records-and-controls",
    risk: "reporting inaccuracies begin affecting decisions",
    outcome: "financial accuracy",
    stakeholders: "accounting staff",
    timeframe: "the next reporting period"
  },
  "bfs-series": {
    primary: "business-finance",
    execution: "budget-and-cash-flow",
    risk: "important resource decisions limit flexibility",
    outcome: "financial stability",
    stakeholders: "leadership teams",
    timeframe: "the next quarterly review"
  },
  "ftdm-team": {
    primary: "client-finance",
    execution: "advisory-and-risk",
    risk: "clients lose confidence in the recommendation",
    outcome: "client trust",
    stakeholders: "clients",
    timeframe: "the next advisory meeting"
  },
  "principles-marketing": {
    primary: "marketing",
    execution: "customer-outreach",
    risk: "promotional momentum continues fading",
    outcome: "customer response",
    stakeholders: "shoppers",
    timeframe: "the next campaign window"
  },
  "aam-series": {
    primary: "apparel-merchandising",
    execution: "assortment-and-display",
    risk: "featured items keep getting attention without enough purchases",
    outcome: "product sell-through",
    stakeholders: "shoppers",
    timeframe: "the next seasonal floor set"
  },
  "asm-series": {
    primary: "automotive-marketing",
    execution: "local-service-promotion",
    risk: "customers keep postponing maintenance decisions",
    outcome: "service appointments",
    stakeholders: "vehicle owners",
    timeframe: "the next promotional window"
  },
  "bsm-series": {
    primary: "business-services-marketing",
    execution: "lead-generation",
    risk: "prospects keep delaying decisions",
    outcome: "qualified demand",
    stakeholders: "prospective clients",
    timeframe: "the next sales cycle"
  },
  "btdm-team": {
    primary: "buying-and-merchandising",
    execution: "assortment-planning",
    risk: "inventory choices drift away from customer demand",
    outcome: "merchandise performance",
    stakeholders: "customers",
    timeframe: "the next buying season"
  },
  "food-series": {
    primary: "food-marketing",
    execution: "menu-promotion",
    risk: "featured products lose traction with customers",
    outcome: "repeat purchases",
    stakeholders: "guests",
    timeframe: "the next menu push"
  },
  "mcs-series": {
    primary: "marketing-communications",
    execution: "message-and-channel",
    risk: "the audience keeps missing the brand's main message",
    outcome: "campaign response",
    stakeholders: "target audiences",
    timeframe: "the next message rollout"
  },
  "mtdm-team": {
    primary: "marketing-management",
    execution: "audience-growth",
    risk: "growth stalls because the current strategy stays too reactive",
    outcome: "market performance",
    stakeholders: "customers",
    timeframe: "the next planning cycle"
  },
  "rms-series": {
    primary: "retail-merchandising",
    execution: "assortment-and-display",
    risk: "merchandise presentation keeps underperforming",
    outcome: "store sell-through",
    stakeholders: "store shoppers",
    timeframe: "the next merchandise reset"
  },
  "sem-series": {
    primary: "sports-and-entertainment-marketing",
    execution: "fan-engagement",
    risk: "attendance and energy stay flatter than leadership wants",
    outcome: "audience engagement",
    stakeholders: "fans",
    timeframe: "the next event run"
  },
  "stdm-team": {
    primary: "sports-and-entertainment team-marketing",
    execution: "fan-growth",
    risk: "the current promotion mix fails to turn attention into attendance",
    outcome: "event response",
    stakeholders: "fans and partners",
    timeframe: "the next event cycle"
  },
  "principles-hospitality": {
    primary: "hospitality",
    execution: "guest-service",
    risk: "small service issues become more noticeable to guests",
    outcome: "guest satisfaction",
    stakeholders: "guests",
    timeframe: "the next peak day"
  },
  "htps-series": {
    primary: "hospitality-selling",
    execution: "guest-needs",
    risk: "prospects keep hesitating to book",
    outcome: "booking confidence",
    stakeholders: "prospective guests",
    timeframe: "the next sales push"
  },
  "htdm-team": {
    primary: "hospitality-services",
    execution: "guest-experience",
    risk: "department coordination gaps affect service consistency",
    outcome: "service quality",
    stakeholders: "guests",
    timeframe: "the next high-volume weekend"
  },
  "hlm-series": {
    primary: "lodging-management",
    execution: "hotel-operations",
    risk: "room-readiness and service consistency begin hurting trust",
    outcome: "stay experience",
    stakeholders: "hotel guests",
    timeframe: "the next occupancy surge"
  },
  "qsrm-series": {
    primary: "quick-serve-management",
    execution: "speed-and-accuracy",
    risk: "rush-period mistakes continue affecting guest perception",
    outcome: "shift performance",
    stakeholders: "quick-service guests",
    timeframe: "the next lunch rush"
  },
  "rfsm-series": {
    primary: "restaurant-management",
    execution: "restaurant-service",
    risk: "service and kitchen coordination keep slipping",
    outcome: "guest experience",
    stakeholders: "restaurant guests",
    timeframe: "the next busy weekend"
  },
  "ttdm-team": {
    primary: "travel-and-tourism",
    execution: "destination-experience",
    risk: "interest does not convert into bookings",
    outcome: "tourism response",
    stakeholders: "travelers",
    timeframe: "the next booking cycle"
  },
  "ent-series": {
    primary: "entrepreneurship",
    execution: "venture-growth",
    risk: "resources get stretched across too many ideas",
    outcome: "venture focus",
    stakeholders: "early customers",
    timeframe: "the next launch stage"
  },
  "etdm-team": {
    primary: "entrepreneurial team-growth",
    execution: "startup-prioritization",
    risk: "different priorities slow execution",
    outcome: "venture momentum",
    stakeholders: "startup customers",
    timeframe: "the next expansion stage"
  }
};

function getScenarioBank(eventId: string) {
  const alias = SCENARIO_BANK_ALIASES[eventId];

  return SCENARIO_BANKS[eventId] ?? (alias ? SCENARIO_BANKS[alias] : undefined) ?? SCENARIO_BANKS["hrm-series"];
}

function getGeneratedSituationExpansion(event: EventOption) {
  const theme = EVENT_SITUATION_EXPANSION_THEMES[event.id];

  if (!theme) {
    return [] as string[];
  }

  return [
    `${theme.stakeholders} need a stronger ${theme.primary} decision before ${theme.risk}.`,
    `leadership wants a more disciplined ${theme.execution} plan that improves ${theme.outcome} without creating avoidable friction for ${theme.stakeholders}.`,
    `management needs a clearer ${theme.primary} recommendation before ${theme.timeframe} exposes the current gap in execution.`,
    `the business wants a practical ${theme.execution} response that keeps ${theme.risk} from affecting ${theme.outcome}.`,
    `leaders need a sharper ${theme.primary} strategy so ${theme.stakeholders} stay confident while the company improves ${theme.outcome}.`,
    `the organization wants a more measurable ${theme.execution} approach before ${theme.timeframe} makes the current issue harder to fix.`
  ];
}

function getSupplementalSituations(event: EventOption) {
  switch (event.id) {
    case "principles-bma":
      return [
        "leadership wants a simple recommendation that improves daily execution before small issues start affecting results",
        "the business needs a clearer plan for handling an everyday management challenge without adding unnecessary complexity",
        "the owner wants a more reliable routine for keeping employees aligned on priorities during a busy week",
        "the business needs a practical fix for inconsistent follow-through on a recurring management issue",
        "leadership wants a straightforward recommendation that improves communication and accountability across the team",
        "the company needs a simple operational adjustment before a small workflow problem starts hurting customer experience",
        "management wants a clearer day-to-day system that employees can follow without needing constant reminders",
        "the business needs a more consistent management approach before uneven execution starts affecting results"
      ];
    case "bltdm-team":
      return [
        "leaders need a legally and ethically sound recommendation before a policy decision creates greater business risk",
        "a compliance concern has surfaced and management wants a practical response that protects both trust and operations",
        "leadership needs guidance on a fairness concern before employee or customer trust begins to erode",
        "the company wants a clearer legal and ethical response before a vendor or contract issue grows more serious",
        "management needs a recommendation on how to handle a questionable decision without creating avoidable exposure",
        "leaders want a policy response that protects company reputation before the issue starts spreading internally",
        "a gray-area decision has raised concerns and the business wants a practical answer that employees can follow consistently",
        "the company needs a more disciplined compliance recommendation before a short-term shortcut creates long-term risk"
      ];
    case "hrm-series":
      return [
        "management wants a stronger people-focused recommendation before morale, retention, or consistency slips further",
        "the company needs a realistic human-resources response that improves employee performance without creating unnecessary friction",
        "leadership wants a better staffing or training recommendation before uneven supervision starts affecting results",
        "the organization needs a clearer employee-support plan before burnout or turnover becomes more visible",
        "management wants a stronger onboarding or coaching approach before new hires continue struggling to adjust",
        "the company needs a more consistent response to a workplace issue before team trust weakens further",
        "leaders want a practical culture or communication improvement that helps employees stay engaged and productive",
        "the business needs a stronger people-management plan before a recurring staff concern turns into a larger retention problem"
      ];
    case "principles-finance":
      return [
        "the business needs a clearer financial recommendation before leadership makes its next basic money decision",
        "management wants a practical finance-focused response that improves confidence in the next step without overcomplicating the issue",
        "leadership needs a simpler way to think through a foundational financial choice before committing limited resources",
        "the company wants a basic financial plan that improves decision-making without requiring advanced analysis",
        "management needs a clearer recommendation on a money-related tradeoff before the business moves too quickly",
        "the business wants a stronger entry-level finance recommendation before a small financial issue becomes more expensive",
        "leaders need a practical financial response that helps them choose the next step with better confidence",
        "the company wants a simple but measurable finance decision before current uncertainty starts slowing progress"
      ];
    case "act-series":
      return [
        "leaders need a more reliable accounting recommendation before recordkeeping or reporting issues create bigger problems",
        "the company wants a clear financial-records plan that improves accuracy and control before the next reporting cycle",
        "management needs a stronger accounting process before documentation errors start affecting confidence in the records",
        "the business wants a more disciplined reporting routine before reconciliation or tracking issues spread further",
        "leaders need a practical internal-control recommendation before small accounting mistakes become recurring problems",
        "the company wants to tighten its financial-records process before the next close or review period",
        "management needs a clearer system for handling accounting details before inaccuracy starts affecting decisions",
        "the business wants a stronger records-and-controls recommendation that employees can follow consistently"
      ];
    case "bfs-series":
      return [
        "management needs a stronger finance recommendation before cash, budgeting, or resource decisions begin limiting results",
        "the business wants a practical financial plan that balances growth, control, and risk before the next review period",
        "leaders need a better resource-allocation recommendation before an important finance choice reduces flexibility",
        "the company wants a stronger budgeting or funding approach before growth decisions become harder to support",
        "management needs a clearer response to a finance tradeoff before performance begins slipping in a preventable way",
        "the business wants a disciplined financial recommendation that improves both stability and decision quality",
        "leadership needs a more practical plan for handling a cash, cost, or funding issue before it affects results",
        "the company wants a finance recommendation that improves control while still supporting realistic business growth"
      ];
    case "ftdm-team":
      return [
        "the team needs a sound financial recommendation before a client-facing decision creates unnecessary exposure",
        "leaders want a more disciplined finance strategy that improves trust and long-term business performance",
        "the team needs a clearer financial recommendation before a customer or stakeholder loses confidence in the advice",
        "management wants a more client-friendly finance response before uncertainty starts affecting follow-through",
        "the business needs a stronger advisory recommendation that balances opportunity, clarity, and risk awareness",
        "leaders want a practical finance strategy before a complex decision creates unnecessary confusion for the client",
        "the team needs a more structured recommendation that improves both trust and measurable financial outcomes",
        "management wants a clearer finance recommendation before a risk-related question delays progress further"
      ];
    case "principles-marketing":
      return [
        "the business needs a clearer customer-focused recommendation before promotional momentum continues to slow",
        "leadership wants a practical marketing response that improves customer interest without making the plan too complex",
        "the company wants a better customer-attraction idea before awareness and response weaken further",
        "management needs a stronger promotion recommendation before the current marketing effort loses traction",
        "the business wants a clearer audience-focused plan before the next campaign or message misses the mark",
        "leaders need a practical marketing decision that improves customer response without adding unnecessary complexity",
        "the company wants a stronger foundational marketing recommendation before interest continues flattening out",
        "management needs a better promotion or outreach plan before limited visibility starts affecting results"
      ];
    case "aam-series":
    case "rms-series":
      return [
        "management wants a stronger merchandising recommendation before assortment or presentation issues hurt customer response",
        "the business needs a clearer retail plan that improves product appeal and selling performance at the same time",
        "leaders want a more intentional assortment recommendation before customers keep overlooking key merchandise",
        "the business needs a better display or merchandising approach before product interest softens further",
        "management wants a clearer retail decision that improves both presentation and item performance",
        "the company needs a stronger assortment-and-customer-fit plan before inventory choices become less effective",
        "leaders want a practical merchandising recommendation before traffic and product appeal drift apart",
        "the store needs a better retail strategy before product mix and presentation begin reducing results"
      ];
    case "asm-series":
      return [
        "the business wants a more effective automotive-marketing recommendation before local demand slips further",
        "leadership needs a customer-trust strategy that improves traffic and response without relying on generic promotion",
        "the company needs a clearer automotive-marketing plan before service demand becomes more inconsistent",
        "management wants a better local-promotion idea before customers continue delaying maintenance decisions",
        "leaders need a stronger trust-building recommendation before vehicle owners keep choosing competitors",
        "the business wants a more focused response to weak customer engagement before future promotions lose impact",
        "management needs a more convincing automotive-service positioning plan before response rates fall further",
        "the company wants a practical marketing recommendation that improves both credibility and customer action"
      ];
    case "bsm-series":
      return [
        "the company needs a sharper business-services marketing recommendation before prospects keep delaying decisions",
        "leadership wants a more convincing market-facing plan that improves positioning and follow-through",
        "the business needs a clearer value-communication strategy before prospects keep hesitating to move forward",
        "management wants a stronger lead-generation recommendation before the current outreach becomes less effective",
        "leaders need a better business-services positioning plan before customer interest softens further",
        "the company wants a more targeted marketing approach before growth slows in a preventable way",
        "management needs a sharper customer-facing recommendation before follow-up efforts continue underperforming",
        "the business wants a more practical strategy for improving response, trust, and conversion"
      ];
    case "btdm-team":
      return [
        "the team needs a stronger merchandising decision before product assortment or inventory choices weaken customer response",
        "leadership wants a buying strategy that feels more intentional before the next merchandise planning cycle",
        "the team needs a clearer assortment recommendation before current buying decisions reduce customer appeal",
        "management wants a better merchandise-planning strategy before the next season or sales period begins",
        "leaders need a stronger response to a product-mix issue before inventory choices become less effective",
        "the company wants a more disciplined buying recommendation that improves both appeal and performance",
        "the team needs a clearer approach to choosing merchandise before customer demand shifts further",
        "management wants a more practical recommendation on product selection, timing, and assortment balance"
      ];
    case "food-series":
      return [
        "the business wants a better food-marketing recommendation before customer response softens during the next selling period",
        "leaders need a practical plan that improves product appeal and customer demand without hurting everyday execution",
        "the company wants a stronger food-promotion idea before current demand levels become harder to maintain",
        "management needs a clearer marketing recommendation before a menu or product push underperforms again",
        "leaders want a better customer-response strategy before interest in a featured offering continues fading",
        "the business needs a more practical plan for improving product appeal without complicating operations",
        "management wants a stronger recommendation for driving customer interest around a food-focused offer",
        "the company needs a clearer promotional plan before repeat response to the current offering declines further"
      ];
    case "mcs-series":
      return [
        "the business needs a clearer communication strategy before its message continues missing the target audience",
        "leadership wants a stronger marketing-communications plan that improves response and message consistency",
        "the company wants a better message-and-channel recommendation before awareness efforts lose momentum",
        "management needs a clearer communications approach before audience confusion weakens the campaign further",
        "leaders want a stronger promotional-message strategy before engagement continues underperforming",
        "the business needs a more disciplined communication plan before inconsistent messaging affects response",
        "management wants a clearer recommendation on how to improve both audience reach and message clarity",
        "the company needs a stronger communications decision before the next message rollout misses expectations"
      ];
    case "mtdm-team":
      return [
        "the team needs a broader marketing recommendation before growth stalls in the current market",
        "leadership wants a strategy that connects audience insight, execution, and measurable results more clearly",
        "the team needs a stronger market-facing recommendation before audience response weakens further",
        "management wants a clearer marketing-management strategy before the next campaign cycle begins",
        "leaders need a more complete recommendation that improves positioning, execution, and customer response",
        "the company wants a stronger team-based marketing decision before growth becomes harder to regain",
        "management needs a more focused plan that ties customer insight to practical action",
        "the team wants a clearer marketing recommendation before resource use and market response drift further apart"
      ];
    case "sem-series":
    case "stdm-team":
      return [
        "leaders want a more compelling audience-growth recommendation before fan response weakens during the next promotional cycle",
        "the organization needs a marketing plan that strengthens both experience and measurable engagement",
        "management needs a stronger sports-and-entertainment recommendation before engagement starts flattening out",
        "the organization wants a clearer audience-development plan before the next promotion cycle underperforms",
        "leaders need a better fan-response strategy before attendance or participation softens further",
        "the business wants a more practical marketing recommendation that improves experience and awareness together",
        "management needs a stronger sponsor-or-audience plan before current promotional efforts lose momentum",
        "the organization wants a more compelling strategy for turning attention into measurable engagement"
      ];
    case "principles-hospitality":
      return [
        "the business needs a more guest-focused recommendation before service inconsistency starts shaping the experience negatively",
        "leadership wants a practical hospitality improvement that is easy for staff to carry out and easy for guests to notice",
        "the company needs a clearer guest-experience recommendation before routine service issues become more noticeable",
        "management wants a stronger hospitality response before customer satisfaction starts slipping further",
        "leaders need a more practical guest-focused plan before an everyday service issue affects perception more widely",
        "the business wants a clearer service recommendation that improves both execution and guest confidence",
        "management needs a stronger hospitality improvement before a small experience problem becomes more consistent",
        "the company wants a practical guest-service adjustment that employees can deliver more reliably"
      ];
    case "htps-series":
      return [
        "the organization wants a stronger hospitality selling recommendation before guest interest fades during the current cycle",
        "leadership needs a clearer value-focused plan that improves confidence in the hospitality offer",
        "management wants a stronger recommendation for presenting the hospitality offer before prospects lose interest",
        "the organization needs a better value-communication strategy before guests keep hesitating to book or commit",
        "leaders want a more convincing hospitality-selling approach before objections continue slowing decisions",
        "the business needs a clearer guest-needs recommendation before the current offer feels less compelling",
        "management wants a stronger approach to explaining benefits and fit before interest weakens further",
        "the organization needs a more confident selling recommendation that improves trust and response"
      ];
    case "htdm-team":
      return [
        "the team needs a stronger service recommendation before guest satisfaction and execution drift further apart",
        "management wants a hospitality plan that improves experience quality while staying realistic for staff",
        "leaders need a clearer team-based hospitality recommendation before service inconsistencies become harder to correct",
        "the organization wants a stronger guest-experience decision before departmental coordination weakens further",
        "management needs a more practical hospitality-services plan before recurring complaints become more visible",
        "the team wants a stronger recommendation that improves both service strategy and day-to-day execution",
        "leaders need a clearer guest-focused plan before the next busy period exposes the same service gaps again",
        "the organization wants a hospitality decision that better aligns staff execution with guest expectations"
      ];
    case "hlm-series":
      return [
        "the property needs a more disciplined lodging recommendation before service inconsistency affects guest confidence",
        "leaders want a hotel-management decision that improves operations and guest experience at the same time",
        "management wants a stronger lodging recommendation before check-in, communication, or room-readiness issues grow more noticeable",
        "the property needs a clearer hotel-service plan before guest confidence keeps slipping on key touchpoints",
        "leaders want a more practical lodging response before an operational issue starts affecting the full stay experience",
        "the hotel needs a stronger management recommendation before inconsistency across departments affects guest satisfaction",
        "management wants a better lodging strategy that improves execution while keeping the guest experience smooth",
        "the property needs a clearer room-operations recommendation before a recurring service gap hurts loyalty further"
      ];
    case "qsrm-series":
    case "rfsm-series":
      return [
        "the restaurant needs a stronger operating recommendation before inconsistency starts affecting both speed and guest satisfaction",
        "management wants a clearer food-service plan that improves execution without overloading the team",
        "leaders need a better restaurant-management response before service or order consistency weakens further",
        "the business wants a stronger food-service recommendation before guest experience and workflow drift further apart",
        "management needs a more practical restaurant plan before a recurring shift or service issue keeps hurting results",
        "the operation wants a clearer recommendation that improves both team execution and customer experience",
        "leaders need a stronger restaurant decision before speed, accuracy, or service consistency becomes harder to recover",
        "the business needs a more reliable food-service plan before a manageable issue turns into a larger operational problem"
      ];
    case "ttdm-team":
      return [
        "leaders want a more compelling travel recommendation before interest and bookings soften during the next cycle",
        "the organization needs a tourism plan that improves guest appeal while remaining realistic for staff and partners",
        "management wants a stronger tourism recommendation before destination interest becomes less consistent",
        "the business needs a clearer travel-experience plan before bookings continue lagging behind attention",
        "leaders want a more practical tourism decision before guest interest fails to convert into action",
        "the organization needs a stronger travel recommendation that improves both appeal and execution",
        "management wants a clearer tourism strategy before coordination or messaging limits response further",
        "the business needs a better destination-focused plan before a marketable travel opportunity loses momentum"
      ];
    case "ent-series":
      return [
        "the founder needs a clearer venture recommendation before committing more resources to the current growth direction",
        "leadership wants an entrepreneurial next step that strengthens feasibility without slowing momentum unnecessarily",
        "the venture needs a stronger startup recommendation before a product, pricing, or launch decision creates avoidable risk",
        "management wants a clearer entrepreneurship response before the business spreads resources too thin",
        "the founder needs a more disciplined plan before an opportunity is pursued without enough validation",
        "the company wants a stronger entrepreneurial decision before current momentum turns into unfocused growth",
        "leadership needs a more practical startup recommendation before a resource or timing choice reduces the venture's chances",
        "the venture wants a clearer next step before feedback, feasibility, and execution start pulling in different directions"
      ];
    case "etdm-team":
      return [
        "the venture team needs a sharper growth recommendation before expansion decisions create unnecessary risk",
        "leadership wants an entrepreneurial strategy that improves long-term viability without losing speed or creativity",
        "the team needs a clearer startup decision before different priorities begin slowing execution",
        "management wants a more disciplined venture recommendation before the next expansion step stretches the business too far",
        "leaders need a better entrepreneurship strategy before growth plans outpace systems and follow-through",
        "the venture team wants a clearer recommendation before promising ideas compete for the same limited resources",
        "leadership needs a stronger startup strategy before current momentum creates more risk than advantage",
        "the team wants a more practical entrepreneurial recommendation that improves focus, viability, and execution together"
      ];
    default:
      return [
        "leadership wants a stronger recommendation before current results begin slipping further",
        "the business needs a clearer plan that improves execution while staying realistic for the team",
        "management wants a more disciplined response before a recurring issue becomes harder to solve",
        "leaders need a practical recommendation that improves both confidence and follow-through",
        "the company wants a clearer next step before uncertainty starts affecting performance",
        "the business needs a stronger plan before a manageable problem grows more visible",
        "management wants a recommendation that feels more actionable, measurable, and realistic",
        "leaders need a better response before the current issue starts creating wider consequences"
      ];
  }
}

function buildAreaFocusedAsk(baseAsk: string, preferredArea: string) {
  if (!preferredArea.trim()) {
    return baseAsk;
  }

  return `${baseAsk} while clearly emphasizing ${preferredArea.trim()} decisions that fit the situation`;
}

function pickOne<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function pickMany<T>(items: T[], count: number): T[] {
  const pool = [...items];
  const picked: T[] = [];

  while (pool.length > 0 && picked.length < count) {
    const index = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(index, 1)[0]);
  }

  return picked;
}

function randomInt(min: number, max: number, step = 1) {
  const count = Math.floor((max - min) / step);
  return min + Math.floor(Math.random() * (count + 1)) * step;
}

function roundTo(value: number, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function formatCurrency(value: number, decimals = 0) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

function formatPercent(value: number, decimals = 1) {
  return `${(value * 100).toFixed(decimals)}%`;
}

function formatDecimal(value: number, decimals = 2) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

function formatFactor(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 5,
    maximumFractionDigits: 5
  }).format(value);
}

function isFinancialAnalysisArea(area?: string) {
  return /financial analysis/i.test(area ?? "");
}

function createScenarioDraft(event: EventOption, request: RoleplayRequest): ScenarioDraft {
  const bank = getScenarioBank(event.id);
  const business = request.industry.trim() || pickOne(bank.businesses);
  const participantRole = pickOne(bank.participantRoles);
  const judgeRole = pickOne(bank.judgeRoles);
  const situation = pickOne([
    ...bank.situations,
    ...getSupplementalSituations(event),
    ...getGeneratedSituationExpansion(event)
  ]);
  const askBase = request.industry.trim()
    ? `develop a recommendation that fits a ${request.industry.trim()} and addresses the problem realistically`
    : pickOne(bank.asks);
  const ask = buildAreaFocusedAsk(askBase, request.instructionalAreaPreference);
  const tensions = pickMany(
    bank.tensions,
    request.difficulty === "hard" ? 3 : request.difficulty === "medium" ? 2 : 1
  );

  return {
    business,
    participantRole,
    judgeRole,
    situation,
    ask,
    tensions
  };
}

function buildCapitalInvestmentCase(draft: ScenarioDraft): FinancialAnalysisCase {
  const investment = randomInt(125000, 240000, 5000);
  const usefulLife = randomInt(7, 10);
  const salvageValue = randomInt(0, 20000, 5000);
  const discountRate = randomInt(10, 14) / 100;
  const annualInflows = randomInt(180000, 280000, 5000);
  const netAnnualCashFlow = randomInt(22000, 42000, 1000);
  const annualOutflows = annualInflows - netAnnualCashFlow;
  const discountFactor = roundTo((1 - 1 / (1 + discountRate) ** usefulLife) / discountRate, 5);

  return {
    caseType: "bfs-capital-investment",
    title: "Capital investment analysis",
    prompt: `The ${draft.judgeRole} wants you to review a proposed equipment investment for the ${draft.business} and decide whether the numbers support moving forward.`,
    formulas: [
      "Net annual cash flow = annual cash inflows - annual operating cash outflows",
      "Cash payback period = initial investment / net annual cash flow",
      "NPV = (net annual cash flow × present-value annuity factor) + present value of salvage value - initial investment"
    ],
    inputs: [
      { label: "Initial investment", value: formatCurrency(investment) },
      { label: "Estimated useful life", value: `${usefulLife} years` },
      { label: "Estimated salvage value", value: formatCurrency(salvageValue) },
      { label: `Present-value annuity factor (${usefulLife} years at ${formatPercent(discountRate, 0)})`, value: formatFactor(discountFactor) },
      { label: "Annual cash inflows", value: formatCurrency(annualInflows) },
      { label: "Annual operating cash outflows", value: formatCurrency(annualOutflows) }
    ],
    requiredOutputs: [
      "Calculate the net annual cash flow and the cash payback period.",
      "Calculate the net present value of the investment.",
      "Explain whether the investment should be approved and what risk factors management should still watch."
    ],
    dataset: {
      investment,
      usefulLife,
      salvageValue,
      discountRate,
      discountFactor,
      annualInflows,
      annualOutflows,
      netAnnualCashFlow
    }
  };
}

function buildStockFinancingCase(draft: ScenarioDraft): FinancialAnalysisCase {
  const currentDividend = randomInt(160, 280, 10) / 100;
  const growthRate = randomInt(3, 7) / 100;
  const currentStockPrice = randomInt(38, 60);
  const targetRequiredReturn = randomInt(10, 13) / 100;
  const bondCouponRate = randomInt(6, 9) / 100;

  return {
    caseType: "bfs-stock-financing",
    title: "Stock and bond financing comparison",
    prompt: `The ${draft.judgeRole} wants you to compare a stock offering against bond financing for the ${draft.business} and explain the cost-of-capital tradeoff clearly.`,
    formulas: [
      "Expected dividend next year (D1) = current dividend × (1 + growth rate)",
      "Expected rate of return = (D1 / current stock price) + growth rate",
      "Fair value using Gordon Growth = D1 / (required rate of return - growth rate)"
    ],
    inputs: [
      { label: "Current annual dividend per share", value: formatCurrency(currentDividend, 2) },
      { label: "Dividend growth rate", value: formatPercent(growthRate, 1) },
      { label: "Current stock price", value: formatCurrency(currentStockPrice) },
      { label: "Management hurdle rate for new equity", value: formatPercent(targetRequiredReturn, 1) },
      { label: "Estimated bond coupon rate if debt is issued", value: formatPercent(bondCouponRate, 1) }
    ],
    requiredOutputs: [
      "Calculate the expected dividend next year.",
      "Calculate the expected rate of return on the stock and the fair value at management's target return.",
      "Recommend whether equity or debt looks more attractive and explain the tradeoffs."
    ],
    dataset: {
      currentDividend,
      growthRate,
      currentStockPrice,
      targetRequiredReturn,
      bondCouponRate
    }
  };
}

function buildCashBudgetCase(draft: ScenarioDraft): FinancialAnalysisCase {
  const yearOneRevenue = randomInt(7600000, 8900000, 100000);
  const growthRate = randomInt(3, 6) / 100;
  const yearTwoRevenue = roundTo(yearOneRevenue * (1 + growthRate), 0);
  const yearThreeRevenue = roundTo(yearTwoRevenue * (1 + growthRate), 0);
  const landCost = randomInt(25000000, 32000000, 100000);
  const downPayment = roundTo(landCost * 0.2, 0);
  const essentialCostRate = randomInt(83, 87) / 100;
  const flexibleCostRate = roundTo(1 - essentialCostRate, 4);

  return {
    caseType: "bfs-cash-budget",
    title: "Three-year cash budget challenge",
    prompt: `The ${draft.judgeRole} wants a three-year savings plan for the ${draft.business} so the company can make a down payment on a future expansion site without creating a cash crunch.`,
    formulas: [
      "Year n revenue = prior year revenue × (1 + growth rate)",
      "Required down payment = future land cost × 20%",
      "Savings rate needed = total savings target / total projected revenue over the planning period"
    ],
    inputs: [
      { label: "Year 1 projected revenue", value: formatCurrency(yearOneRevenue) },
      { label: "Annual revenue growth rate", value: formatPercent(growthRate, 1) },
      { label: "Land cost in year 3", value: formatCurrency(landCost) },
      { label: "Required down payment", value: "20%" },
      { label: "Essential fixed and locked costs", value: formatPercent(essentialCostRate, 1) },
      { label: "Flexible cost pool available for cuts", value: formatPercent(flexibleCostRate, 1) }
    ],
    requiredOutputs: [
      "Project revenue for all three years and calculate the total down payment target.",
      "Calculate the savings rate the company needs across the three-year period.",
      "Explain whether the target is realistic and what cost-control recommendation management should make."
    ],
    dataset: {
      yearOneRevenue,
      growthRate,
      yearTwoRevenue,
      yearThreeRevenue,
      landCost,
      downPayment,
      essentialCostRate,
      flexibleCostRate
    }
  };
}

function buildRpaPaybackCase(draft: ScenarioDraft): FinancialAnalysisCase {
  const initialInvestment = randomInt(6500, 10000, 500);
  const botAnnualCost = randomInt(3000, 4500, 250);
  const hoursPerWeek = randomInt(4, 8);
  const loadedSalary = randomInt(44000, 62000, 1000);
  const hoursPerYear = 2000;

  return {
    caseType: "bfs-rpa-payback",
    title: "Automation payback analysis",
    prompt: `The ${draft.judgeRole} wants to know whether automating a repetitive accounting task at the ${draft.business} will pay back quickly enough to justify the upfront cost.`,
    formulas: [
      "Hourly labor cost = annual loaded salary / annual hours worked",
      "Annual labor savings = hours saved per week × 52 × hourly labor cost",
      "Net annual savings = annual labor savings - annual bot operating cost",
      "Payback period = initial investment / net annual savings"
    ],
    inputs: [
      { label: "Initial RPA development cost", value: formatCurrency(initialInvestment) },
      { label: "Annual bot operating cost", value: formatCurrency(botAnnualCost) },
      { label: "Employee time currently spent on the task", value: `${hoursPerWeek} hours per week` },
      { label: "Loaded annual salary including taxes and benefits", value: formatCurrency(loadedSalary) },
      { label: "Annual hours worked", value: formatDecimal(hoursPerYear, 0) }
    ],
    requiredOutputs: [
      "Calculate the hourly labor cost and annual labor savings.",
      "Calculate the net annual savings and payback period.",
      "Recommend whether the automation should move forward and explain the people impact."
    ],
    dataset: {
      initialInvestment,
      botAnnualCost,
      hoursPerWeek,
      loadedSalary,
      hoursPerYear
    }
  };
}

function buildInventoryTurnoverCase(draft: ScenarioDraft): FinancialAnalysisCase {
  const productAName = "Core product line";
  const productBName = "Specialty product line";
  const productCName = "Premium product line";
  const productA = {
    cogs: randomInt(130000, 210000, 1000),
    beginning: randomInt(12000, 26000, 500),
    ending: randomInt(13000, 28000, 500)
  };
  const productB = {
    cogs: randomInt(70000, 150000, 1000),
    beginning: randomInt(18000, 32000, 500),
    ending: randomInt(15000, 30000, 500)
  };
  const productC = {
    cogs: randomInt(150000, 260000, 1000),
    beginning: randomInt(20000, 36000, 500),
    ending: randomInt(22000, 38000, 500)
  };

  return {
    caseType: "act-inventory-turnover",
    title: "Inventory turnover review",
    prompt: `The ${draft.judgeRole} wants you to analyze product turnover for the ${draft.business} and explain which category is moving efficiently and which one needs a better inventory plan.`,
    formulas: [
      "Average inventory = (beginning inventory + ending inventory) / 2",
      "Inventory turnover ratio = cost of goods sold / average inventory"
    ],
    inputs: [
      { label: `${productAName} COGS`, value: formatCurrency(productA.cogs) },
      { label: `${productAName} beginning inventory`, value: formatCurrency(productA.beginning) },
      { label: `${productAName} ending inventory`, value: formatCurrency(productA.ending) },
      { label: `${productBName} COGS`, value: formatCurrency(productB.cogs) },
      { label: `${productBName} beginning inventory`, value: formatCurrency(productB.beginning) },
      { label: `${productBName} ending inventory`, value: formatCurrency(productB.ending) },
      { label: `${productCName} COGS`, value: formatCurrency(productC.cogs) },
      { label: `${productCName} beginning inventory`, value: formatCurrency(productC.beginning) },
      { label: `${productCName} ending inventory`, value: formatCurrency(productC.ending) }
    ],
    requiredOutputs: [
      "Calculate the inventory turnover ratio for each product line.",
      "Identify which product line is turning the fastest and which is tying up the most inventory.",
      "Recommend one accounting or operations fix that would improve inventory performance."
    ],
    dataset: {
      productAName,
      productACogs: productA.cogs,
      productABeginning: productA.beginning,
      productAEnding: productA.ending,
      productBName,
      productBCogs: productB.cogs,
      productBBeginning: productB.beginning,
      productBEnding: productB.ending,
      productCName,
      productCCogs: productC.cogs,
      productCBeginning: productC.beginning,
      productCEnding: productC.ending
    }
  };
}

function buildReceivablesTurnoverCase(draft: ScenarioDraft): FinancialAnalysisCase {
  const julySales = randomInt(150000, 190000, 1000);
  const augustSales = julySales + randomInt(4000, 18000, 1000);
  const juneAr = randomInt(18000, 32000, 500);
  const julyAr = juneAr + randomInt(3000, 16000, 500);
  const augustAr = julyAr + randomInt(2000, 18000, 500);

  return {
    caseType: "act-receivables-turnover",
    title: "Accounts receivable turnover review",
    prompt: `The ${draft.judgeRole} wants you to explain whether collections at the ${draft.business} are slowing down and what action should be taken with customers or insurers that are paying late.`,
    formulas: [
      "Average accounts receivable = (beginning A/R + ending A/R) / 2",
      "Accounts receivable turnover = sales / average accounts receivable"
    ],
    inputs: [
      { label: "June ending accounts receivable", value: formatCurrency(juneAr) },
      { label: "July sales", value: formatCurrency(julySales) },
      { label: "July ending accounts receivable", value: formatCurrency(julyAr) },
      { label: "August sales", value: formatCurrency(augustSales) },
      { label: "August ending accounts receivable", value: formatCurrency(augustAr) }
    ],
    requiredOutputs: [
      "Calculate the accounts receivable turnover for July and August.",
      "Explain whether collections improved or worsened between the two months.",
      "Recommend what should be done to speed up collections and protect cash flow."
    ],
    dataset: {
      juneAr,
      julySales,
      julyAr,
      augustSales,
      augustAr
    }
  };
}

function buildDepreciationCase(draft: ScenarioDraft): FinancialAnalysisCase {
  const purchaseCost = randomInt(3600000, 6200000, 100000);
  const rate = randomInt(4, 6) / 100;
  const purchaseYear = randomInt(2018, 2020);
  const currentYear = purchaseYear + 6;
  const nbvOpening = roundTo(purchaseCost * (1 - rate) ** (currentYear - purchaseYear), 0);

  return {
    caseType: "act-depreciation-review",
    title: "Declining-balance depreciation review",
    prompt: `The ${draft.judgeRole} wants the current-year depreciation expense for a major building used by the ${draft.business}, plus your judgment on whether any asset-life assumptions should be revisited.`,
    formulas: [
      "Declining-balance depreciation expense = opening net book value × depreciation rate",
      "Closing net book value = opening net book value - current-year depreciation expense"
    ],
    inputs: [
      { label: "Original building cost", value: formatCurrency(purchaseCost) },
      { label: "Depreciation method", value: "Declining balance" },
      { label: "Annual depreciation rate", value: formatPercent(rate, 1) },
      { label: `Opening net book value for ${currentYear}`, value: formatCurrency(nbvOpening) }
    ],
    requiredOutputs: [
      "Calculate the current-year depreciation expense.",
      "Calculate the closing net book value after this year's depreciation.",
      "Explain whether management should change useful-life assumptions immediately or review the evidence first."
    ],
    dataset: {
      purchaseCost,
      rate,
      purchaseYear,
      currentYear,
      nbvOpening
    }
  };
}

function buildNetMarginTrendCase(draft: ScenarioDraft): FinancialAnalysisCase {
  const yearOneSales = randomInt(1800000, 2600000, 50000);
  const yearTwoSales = roundTo(yearOneSales * (1 + randomInt(3, 7) / 100), 0);
  const yearThreeSales = roundTo(yearTwoSales * (1 + randomInt(2, 6) / 100), 0);
  const yearFourSales = roundTo(yearThreeSales * (1 + randomInt(1, 5) / 100), 0);
  const yearOneNetIncome = randomInt(70000, 180000, 5000);
  const yearTwoNetIncome = yearOneNetIncome + randomInt(-10000, 25000, 5000);
  const yearThreeNetIncome = yearTwoNetIncome + randomInt(-5000, 30000, 5000);
  const yearFourNetIncome = yearThreeNetIncome + randomInt(-5000, 35000, 5000);

  return {
    caseType: "act-net-margin-trend",
    title: "Net profit margin trend review",
    prompt: `The ${draft.judgeRole} wants you to review profit performance at the ${draft.business}, calculate the net profit margin trend, and explain whether margins are moving in the right direction.`,
    formulas: [
      "Net profit margin = net income / sales",
      "Margin trend analysis compares year-over-year movement in the ratio and the likely business driver"
    ],
    inputs: [
      { label: "Year 1 sales", value: formatCurrency(yearOneSales) },
      { label: "Year 1 net income", value: formatCurrency(yearOneNetIncome) },
      { label: "Year 2 sales", value: formatCurrency(yearTwoSales) },
      { label: "Year 2 net income", value: formatCurrency(yearTwoNetIncome) },
      { label: "Year 3 sales", value: formatCurrency(yearThreeSales) },
      { label: "Year 3 net income", value: formatCurrency(yearThreeNetIncome) },
      { label: "Year 4 sales", value: formatCurrency(yearFourSales) },
      { label: "Year 4 net income", value: formatCurrency(yearFourNetIncome) }
    ],
    requiredOutputs: [
      "Calculate the net profit margin for all four years.",
      "Describe the margin trend clearly instead of listing the percentages only.",
      "Recommend one financial-management action that would help strengthen the margin."
    ],
    dataset: {
      yearOneSales,
      yearOneNetIncome,
      yearTwoSales,
      yearTwoNetIncome,
      yearThreeSales,
      yearThreeNetIncome,
      yearFourSales,
      yearFourNetIncome
    }
  };
}

function createFinancialAnalysisCase(
  event: EventOption,
  draft: ScenarioDraft,
  instructionalArea?: string
) {
  if (!isFinancialAnalysisArea(instructionalArea)) {
    return undefined;
  }

  if (event.id === "bfs-series") {
    return pickOne([
      buildCapitalInvestmentCase(draft),
      buildStockFinancingCase(draft),
      buildCashBudgetCase(draft),
      buildRpaPaybackCase(draft)
    ]);
  }

  if (event.id === "act-series") {
    return pickOne([
      buildInventoryTurnoverCase(draft),
      buildReceivablesTurnoverCase(draft),
      buildDepreciationCase(draft),
      buildNetMarginTrendCase(draft)
    ]);
  }

  return undefined;
}

function buildFinancialAnalysisReview(financialAnalysis: FinancialAnalysisCase): FinancialAnalysisReview {
  const data = financialAnalysis.dataset;

  switch (financialAnalysis.caseType) {
    case "bfs-capital-investment": {
      const netAnnualCashFlow = Number(data.netAnnualCashFlow);
      const investment = Number(data.investment);
      const discountFactor = Number(data.discountFactor);
      const salvageValue = Number(data.salvageValue);
      const usefulLife = Number(data.usefulLife);
      const discountRate = Number(data.discountRate);
      const payback = roundTo(investment / netAnnualCashFlow, 2);
      const pvInflows = roundTo(netAnnualCashFlow * discountFactor, 2);
      const pvSalvage = roundTo(salvageValue / (1 + discountRate) ** usefulLife, 2);
      const npv = roundTo(pvInflows + pvSalvage - investment, 2);

      return {
        title: financialAnalysis.title,
        summary: "A strong finance answer should walk the judge through the cash-flow math, state the payback and NPV clearly, and then connect the numbers to the investment decision.",
        steps: [
          {
            label: "Net annual cash flow",
            equation: `${formatCurrency(Number(data.annualInflows))} - ${formatCurrency(Number(data.annualOutflows))}`,
            result: formatCurrency(netAnnualCashFlow),
            explanation: "This is the annual net cash benefit the project creates before considering the initial investment."
          },
          {
            label: "Cash payback period",
            equation: `${formatCurrency(investment)} / ${formatCurrency(netAnnualCashFlow)}`,
            result: `${formatDecimal(payback, 2)} years`,
            explanation: "This shows how many years it would take for the project to recover the initial outlay from net annual cash flow."
          },
          {
            label: "Present value of annual cash flows",
            equation: `${formatCurrency(netAnnualCashFlow)} × ${formatFactor(discountFactor)}`,
            result: formatCurrency(pvInflows, 2),
            explanation: "This discounts the recurring cash inflows to present value using the provided annuity factor."
          },
          {
            label: "Net present value",
            equation: `${formatCurrency(pvInflows, 2)} + ${formatCurrency(pvSalvage, 2)} - ${formatCurrency(investment)}`,
            result: formatCurrency(npv, 2),
            explanation: "A positive NPV means the project is expected to create value above the required return."
          }
        ],
        finalAnswers: [
          { label: "Net annual cash flow", value: formatCurrency(netAnnualCashFlow) },
          { label: "Cash payback period", value: `${formatDecimal(payback, 2)} years` },
          { label: "Net present value", value: formatCurrency(npv, 2) }
        ],
        recommendation:
          npv >= 0
            ? `The project looks financially supportable because the NPV is positive at ${formatCurrency(npv, 2)}. Management should still confirm the cash-flow assumptions and make sure the ${formatDecimal(payback, 2)}-year payback fits the company's risk tolerance.`
            : `The project should be treated cautiously because the NPV is negative at ${formatCurrency(npv, 2)}. Management would need stronger cash inflows, a lower upfront cost, or a different project before approving the investment.`,
        sampleConclusion:
          npv >= 0
            ? `My final numbers are net annual cash flow of ${formatCurrency(netAnnualCashFlow)}, a payback period of ${formatDecimal(payback, 2)} years, and an NPV of ${formatCurrency(npv, 2)}. Because the NPV is positive, I would recommend moving forward if management is comfortable with the payback period and the forecast assumptions.`
            : `My final numbers are net annual cash flow of ${formatCurrency(netAnnualCashFlow)}, a payback period of ${formatDecimal(payback, 2)} years, and an NPV of ${formatCurrency(npv, 2)}. Because the NPV is negative, I would not recommend approving the investment without improving the cash-flow assumptions or reducing the upfront cost.`
      };
    }
    case "bfs-stock-financing": {
      const currentDividend = Number(data.currentDividend);
      const growthRate = Number(data.growthRate);
      const currentStockPrice = Number(data.currentStockPrice);
      const targetRequiredReturn = Number(data.targetRequiredReturn);
      const bondCouponRate = Number(data.bondCouponRate);
      const nextDividend = roundTo(currentDividend * (1 + growthRate), 2);
      const expectedReturn = roundTo(nextDividend / currentStockPrice + growthRate, 4);
      const fairValue = roundTo(nextDividend / (targetRequiredReturn - growthRate), 2);

      return {
        title: financialAnalysis.title,
        summary: "A strong answer here should calculate the dividend-growth figures accurately and then use them to compare the cost and flexibility of equity versus debt financing.",
        steps: [
          {
            label: "Expected dividend next year",
            equation: `${formatCurrency(currentDividend, 2)} × (1 + ${formatPercent(growthRate, 1)})`,
            result: formatCurrency(nextDividend, 2),
            explanation: "The Gordon model needs the next expected dividend, not the current one."
          },
          {
            label: "Expected rate of return",
            equation: `(${formatCurrency(nextDividend, 2)} / ${formatCurrency(currentStockPrice)}) + ${formatPercent(growthRate, 1)}`,
            result: formatPercent(expectedReturn, 2),
            explanation: "This is the implied cost of equity based on the current price and dividend growth."
          },
          {
            label: "Fair value at management's target return",
            equation: `${formatCurrency(nextDividend, 2)} / (${formatPercent(targetRequiredReturn, 1)} - ${formatPercent(growthRate, 1)})`,
            result: formatCurrency(fairValue, 2),
            explanation: "This estimates what the stock would be worth if investors require the target return."
          }
        ],
        finalAnswers: [
          { label: "Expected dividend next year", value: formatCurrency(nextDividend, 2) },
          { label: "Expected rate of return", value: formatPercent(expectedReturn, 2) },
          { label: "Fair value at target return", value: formatCurrency(fairValue, 2) }
        ],
        recommendation:
          expectedReturn > bondCouponRate
            ? `The implied cost of equity is about ${formatPercent(expectedReturn, 2)}, which is higher than the estimated ${formatPercent(bondCouponRate, 1)} bond coupon. If the company can safely handle debt payments, bonds look cheaper, while a stock issue would preserve cash flow flexibility but dilute ownership.`
            : `The implied cost of equity is about ${formatPercent(expectedReturn, 2)}, which is close to or below the estimated ${formatPercent(bondCouponRate, 1)} bond coupon. Equity may be reasonable if management wants to avoid fixed debt payments, but the dilution tradeoff should still be explained clearly.`,
        sampleConclusion:
          expectedReturn > bondCouponRate
            ? `Using the Gordon Growth Model, I calculated next year's dividend at ${formatCurrency(nextDividend, 2)}, an expected return of ${formatPercent(expectedReturn, 2)}, and a fair value of ${formatCurrency(fairValue, 2)}. Since equity looks more expensive than the estimated bond rate, I would lean toward debt financing if the company can handle the fixed payments.`
            : `Using the Gordon Growth Model, I calculated next year's dividend at ${formatCurrency(nextDividend, 2)}, an expected return of ${formatPercent(expectedReturn, 2)}, and a fair value of ${formatCurrency(fairValue, 2)}. Since equity is competitive with the estimated bond rate, issuing stock could make sense if management wants more cash-flow flexibility and is willing to accept dilution.`
      };
    }
    case "bfs-cash-budget": {
      const yearOneRevenue = Number(data.yearOneRevenue);
      const yearTwoRevenue = Number(data.yearTwoRevenue);
      const yearThreeRevenue = Number(data.yearThreeRevenue);
      const downPayment = Number(data.downPayment);
      const flexibleCostRate = Number(data.flexibleCostRate);
      const totalRevenue = yearOneRevenue + yearTwoRevenue + yearThreeRevenue;
      const savingsRate = roundTo(downPayment / totalRevenue, 4);
      const yearOneSavings = roundTo(yearOneRevenue * savingsRate, 0);
      const yearTwoSavings = roundTo(yearTwoRevenue * savingsRate, 0);
      const yearThreeSavings = roundTo(yearThreeRevenue * savingsRate, 0);
      const shareOfFlexiblePool = roundTo(savingsRate / flexibleCostRate, 4);

      return {
        title: financialAnalysis.title,
        summary: "A strong answer should project the revenue path, translate the down-payment target into a savings rate, and then judge whether the needed cuts are realistic inside the flexible-cost pool.",
        steps: [
          {
            label: "Three-year down-payment target",
            equation: `${formatCurrency(Number(data.landCost))} × 20%`,
            result: formatCurrency(downPayment),
            explanation: "This is the amount the company needs available by the end of year three."
          },
          {
            label: "Required savings rate",
            equation: `${formatCurrency(downPayment)} / ${formatCurrency(totalRevenue)}`,
            result: formatPercent(savingsRate, 2),
            explanation: "This is the share of projected revenue the company must set aside across the three-year period."
          },
          {
            label: "Illustrative annual savings plan",
            equation: `${formatCurrency(yearOneRevenue)}, ${formatCurrency(yearTwoRevenue)}, ${formatCurrency(yearThreeRevenue)} × ${formatPercent(savingsRate, 2)}`,
            result: `${formatCurrency(yearOneSavings)} / ${formatCurrency(yearTwoSavings)} / ${formatCurrency(yearThreeSavings)}`,
            explanation: "Allocating the savings target proportionally to revenue creates a practical year-by-year cash budget."
          }
        ],
        finalAnswers: [
          { label: "Down-payment target", value: formatCurrency(downPayment) },
          { label: "Required savings rate", value: formatPercent(savingsRate, 2) },
          { label: "Yearly savings plan", value: `${formatCurrency(yearOneSavings)} / ${formatCurrency(yearTwoSavings)} / ${formatCurrency(yearThreeSavings)}` }
        ],
        recommendation:
          savingsRate <= flexibleCostRate
            ? `The target is feasible because the business needs to save about ${formatPercent(savingsRate, 2)} of revenue, which uses roughly ${formatPercent(shareOfFlexiblePool, 1)} of the flexible-cost pool. Management should pair the savings plan with a short list of temporary cost cuts and a monthly cash-budget checkpoint.`
            : `The target is aggressive because the business needs to save about ${formatPercent(savingsRate, 2)} of revenue, which is more than the flexible-cost pool can cover cleanly. Management would likely need both cost reductions and additional revenue improvements to reach the goal.`,
        sampleConclusion:
          savingsRate <= flexibleCostRate
            ? `My solution shows a down-payment target of ${formatCurrency(downPayment)} and a required savings rate of ${formatPercent(savingsRate, 2)} of projected revenue. That gives an annual savings plan of ${formatCurrency(yearOneSavings)}, ${formatCurrency(yearTwoSavings)}, and ${formatCurrency(yearThreeSavings)}, so I would recommend moving forward with a controlled cost-cutting plan and monthly cash-budget reviews.`
            : `My solution shows a down-payment target of ${formatCurrency(downPayment)} and a required savings rate of ${formatPercent(savingsRate, 2)} of projected revenue. Because that is too aggressive for the flexible-cost pool alone, I would recommend a mixed plan of targeted cost cuts plus revenue-building actions instead of relying on cuts only.`
      };
    }
    case "bfs-rpa-payback": {
      const initialInvestment = Number(data.initialInvestment);
      const botAnnualCost = Number(data.botAnnualCost);
      const hoursPerWeek = Number(data.hoursPerWeek);
      const loadedSalary = Number(data.loadedSalary);
      const hoursPerYear = Number(data.hoursPerYear);
      const hourlyCost = roundTo(loadedSalary / hoursPerYear, 2);
      const annualLaborSavings = roundTo(hoursPerWeek * 52 * hourlyCost, 2);
      const netAnnualSavings = roundTo(annualLaborSavings - botAnnualCost, 2);
      const payback = roundTo(initialInvestment / netAnnualSavings, 2);

      return {
        title: financialAnalysis.title,
        summary: "A strong finance answer should turn the weekly labor savings into annual dollars, subtract the bot's annual cost, and then state the payback period clearly before discussing the employee impact.",
        steps: [
          {
            label: "Hourly labor cost",
            equation: `${formatCurrency(loadedSalary)} / ${formatDecimal(hoursPerYear, 0)}`,
            result: formatCurrency(hourlyCost, 2),
            explanation: "This converts the loaded annual salary into an hourly cost figure."
          },
          {
            label: "Annual labor savings",
            equation: `${hoursPerWeek} × 52 × ${formatCurrency(hourlyCost, 2)}`,
            result: formatCurrency(annualLaborSavings, 2),
            explanation: "This is the annual wage-and-benefit cost of the hours that automation would save."
          },
          {
            label: "Net annual savings",
            equation: `${formatCurrency(annualLaborSavings, 2)} - ${formatCurrency(botAnnualCost)}`,
            result: formatCurrency(netAnnualSavings, 2),
            explanation: "The automation cost has to be deducted before you calculate payback."
          },
          {
            label: "Payback period",
            equation: `${formatCurrency(initialInvestment)} / ${formatCurrency(netAnnualSavings, 2)}`,
            result: `${formatDecimal(payback, 2)} years`,
            explanation: "This shows how long it takes for the annual net savings to recover the initial setup cost."
          }
        ],
        finalAnswers: [
          { label: "Annual labor savings", value: formatCurrency(annualLaborSavings, 2) },
          { label: "Net annual savings", value: formatCurrency(netAnnualSavings, 2) },
          { label: "Payback period", value: `${formatDecimal(payback, 2)} years` }
        ],
        recommendation:
          netAnnualSavings > 0
            ? `The automation has positive annual net savings of ${formatCurrency(netAnnualSavings, 2)} and a payback period of about ${formatDecimal(payback, 2)} years, so it looks supportable if management also explains how employees will be retrained or reassigned instead of simply displaced.`
            : `The automation does not currently create positive annual savings once the bot cost is included, so management should not move forward without revising the process scope or cost structure first.`,
        sampleConclusion:
          netAnnualSavings > 0
            ? `I calculated annual labor savings of ${formatCurrency(annualLaborSavings, 2)}, net annual savings of ${formatCurrency(netAnnualSavings, 2)}, and a payback period of ${formatDecimal(payback, 2)} years. Based on that, I would support the automation if the company also has a clear plan to retrain or reassign employees affected by the change.`
            : `I calculated annual labor savings of ${formatCurrency(annualLaborSavings, 2)}, but after subtracting the bot cost the net annual savings are only ${formatCurrency(netAnnualSavings, 2)}. Since the payback is not attractive, I would not recommend moving forward until the company improves the economics of the automation.`
      };
    }
    case "act-inventory-turnover": {
      const lines = [
        {
          name: String(data.productAName),
          cogs: Number(data.productACogs),
          beginning: Number(data.productABeginning),
          ending: Number(data.productAEnding)
        },
        {
          name: String(data.productBName),
          cogs: Number(data.productBCogs),
          beginning: Number(data.productBBeginning),
          ending: Number(data.productBEnding)
        },
        {
          name: String(data.productCName),
          cogs: Number(data.productCCogs),
          beginning: Number(data.productCBeginning),
          ending: Number(data.productCEnding)
        }
      ].map((line) => ({
        ...line,
        average: roundTo((line.beginning + line.ending) / 2, 2),
        turnover: roundTo(line.cogs / ((line.beginning + line.ending) / 2), 2)
      }));
      const fastest = [...lines].sort((left, right) => right.turnover - left.turnover)[0];
      const slowest = [...lines].sort((left, right) => left.turnover - right.turnover)[0];

      return {
        title: financialAnalysis.title,
        summary: "A strong accounting answer should calculate all three turnover ratios accurately, say what they mean in plain language, and recommend a fix for the slowest-moving line.",
        steps: lines.map((line) => ({
          label: `${line.name} turnover`,
          equation: `${formatCurrency(line.cogs)} / ${formatCurrency(line.average, 2)}`,
          result: `${formatDecimal(line.turnover, 2)} turns`,
          explanation: `${line.name} averages ${formatCurrency(line.average, 2)} of inventory and turns over ${formatDecimal(line.turnover, 2)} times during the period.`
        })),
        finalAnswers: lines.map((line) => ({
          label: `${line.name} turnover`,
          value: `${formatDecimal(line.turnover, 2)} turns`
        })),
        recommendation: `${fastest.name} is moving fastest at ${formatDecimal(fastest.turnover, 2)} turns, while ${slowest.name} is moving slowest at ${formatDecimal(slowest.turnover, 2)} turns. Management should review reorder levels, promotional support, or purchasing quantity on the slowest line so cash is not tied up unnecessarily.`,
        sampleConclusion: `My final ratios are ${lines.map((line) => `${line.name}: ${formatDecimal(line.turnover, 2)} turns`).join(", ")}. Because ${slowest.name} is the slowest-moving line, I would focus on tighter purchasing and better sell-through support there so less cash sits in inventory.`
      };
    }
    case "act-receivables-turnover": {
      const julyAverageAr = roundTo((Number(data.juneAr) + Number(data.julyAr)) / 2, 2);
      const augustAverageAr = roundTo((Number(data.julyAr) + Number(data.augustAr)) / 2, 2);
      const julyTurnover = roundTo(Number(data.julySales) / julyAverageAr, 2);
      const augustTurnover = roundTo(Number(data.augustSales) / augustAverageAr, 2);

      return {
        title: financialAnalysis.title,
        summary: "A strong receivables answer should calculate both monthly turnover ratios, explain the trend, and connect the accounting result to collection policy and cash-flow discipline.",
        steps: [
          {
            label: "July receivables turnover",
            equation: `${formatCurrency(Number(data.julySales))} / ${formatCurrency(julyAverageAr, 2)}`,
            result: `${formatDecimal(julyTurnover, 2)} turns`,
            explanation: "This shows how efficiently July sales were converted into collections based on the average receivables balance."
          },
          {
            label: "August receivables turnover",
            equation: `${formatCurrency(Number(data.augustSales))} / ${formatCurrency(augustAverageAr, 2)}`,
            result: `${formatDecimal(augustTurnover, 2)} turns`,
            explanation: "Comparing August with July shows whether collections are speeding up or slowing down."
          }
        ],
        finalAnswers: [
          { label: "July turnover", value: `${formatDecimal(julyTurnover, 2)} turns` },
          { label: "August turnover", value: `${formatDecimal(augustTurnover, 2)} turns` },
          { label: "Trend", value: augustTurnover >= julyTurnover ? "Collections improved" : "Collections slowed" }
        ],
        recommendation:
          augustTurnover >= julyTurnover
            ? `Collections improved from ${formatDecimal(julyTurnover, 2)} turns in July to ${formatDecimal(augustTurnover, 2)} turns in August, but the business should still keep clear follow-up procedures with patients and insurers to prevent balances from aging further.`
            : `Collections weakened from ${formatDecimal(julyTurnover, 2)} turns in July to ${formatDecimal(augustTurnover, 2)} turns in August. Management should tighten follow-up on overdue balances, verify billing accuracy quickly, and set clearer payment expectations to protect cash flow.`,
        sampleConclusion:
          augustTurnover >= julyTurnover
            ? `I calculated receivables turnover at ${formatDecimal(julyTurnover, 2)} turns for July and ${formatDecimal(augustTurnover, 2)} turns for August, so collections improved slightly. I would still recommend consistent follow-up procedures so cash flow stays strong and balances do not start aging.`
            : `I calculated receivables turnover at ${formatDecimal(julyTurnover, 2)} turns for July and ${formatDecimal(augustTurnover, 2)} turns for August, so collections slowed in August. I would recommend faster follow-up on overdue balances, tighter billing accuracy checks, and clearer payment expectations to improve cash flow.`
      };
    }
    case "act-depreciation-review": {
      const nbvOpening = Number(data.nbvOpening);
      const rate = Number(data.rate);
      const currentYear = Number(data.currentYear);
      const depreciationExpense = roundTo(nbvOpening * rate, 2);
      const closingNbv = roundTo(nbvOpening - depreciationExpense, 2);

      return {
        title: financialAnalysis.title,
        summary: "A strong answer should calculate the current depreciation expense first, then separate the accounting calculation from the management judgment about whether market conditions justify an impairment or revised useful-life estimate.",
        steps: [
          {
            label: `Depreciation expense for ${currentYear}`,
            equation: `${formatCurrency(nbvOpening)} × ${formatPercent(rate, 1)}`,
            result: formatCurrency(depreciationExpense, 2),
            explanation: "Under the declining-balance method, the current year's expense is based on the opening net book value."
          },
          {
            label: "Closing net book value",
            equation: `${formatCurrency(nbvOpening)} - ${formatCurrency(depreciationExpense, 2)}`,
            result: formatCurrency(closingNbv, 2),
            explanation: "This is the updated carrying value after recording the current year's depreciation expense."
          }
        ],
        finalAnswers: [
          { label: "Current-year depreciation expense", value: formatCurrency(depreciationExpense, 2) },
          { label: "Closing net book value", value: formatCurrency(closingNbv, 2) }
        ],
        recommendation: `The current-year depreciation expense should be recorded at ${formatCurrency(depreciationExpense, 2)}. Management should not casually reclassify the asset life or write the building down without support; instead, it should gather occupancy, market-value, and impairment evidence before making an accounting change.`,
        sampleConclusion: `My solution gives a current-year depreciation expense of ${formatCurrency(depreciationExpense, 2)} and a closing net book value of ${formatCurrency(closingNbv, 2)}. I would record that expense now, but I would only change useful-life assumptions or write the building down after reviewing proper impairment evidence.`
      };
    }
    case "act-net-margin-trend": {
      const years = [
        { year: "Year 1", sales: Number(data.yearOneSales), net: Number(data.yearOneNetIncome) },
        { year: "Year 2", sales: Number(data.yearTwoSales), net: Number(data.yearTwoNetIncome) },
        { year: "Year 3", sales: Number(data.yearThreeSales), net: Number(data.yearThreeNetIncome) },
        { year: "Year 4", sales: Number(data.yearFourSales), net: Number(data.yearFourNetIncome) }
      ].map((entry) => ({
        ...entry,
        margin: roundTo(entry.net / entry.sales, 4)
      }));
      const improving = years[years.length - 1].margin >= years[0].margin;

      return {
        title: financialAnalysis.title,
        summary: "A strong margin answer should calculate all four ratios accurately, describe the direction of the trend, and then name one management action that would actually improve profitability.",
        steps: years.map((entry) => ({
          label: `${entry.year} net profit margin`,
          equation: `${formatCurrency(entry.net)} / ${formatCurrency(entry.sales)}`,
          result: formatPercent(entry.margin, 2),
          explanation: `This shows the percentage of sales that remained as net income in ${entry.year.toLowerCase()}.`
        })),
        finalAnswers: years.map((entry) => ({
          label: `${entry.year} margin`,
          value: formatPercent(entry.margin, 2)
        })),
        recommendation: improving
          ? `The margin trend is generally improving, ending at ${formatPercent(years[3].margin, 2)} in Year 4. Management should protect that progress by watching cost discipline and making sure revenue growth is not coming from low-margin work only.`
          : `The margin trend is weakening, ending at ${formatPercent(years[3].margin, 2)} in Year 4. Management should review pricing, cost control, and product mix so revenue growth is not masking weaker profitability.`,
        sampleConclusion: `My net profit margin calculations are ${years.map((entry) => `${entry.year}: ${formatPercent(entry.margin, 2)}`).join(", ")}. ${improving ? "The trend is improving overall, so the company should protect margin quality as it grows." : "The trend is weakening overall, so the company should focus on pricing, cost control, and product mix to rebuild profitability."}`
      };
    }
    default:
      return {
        title: financialAnalysis.title,
        summary: "A strong finance answer should show the math clearly and connect the result to a business recommendation.",
        steps: [],
        finalAnswers: [],
        recommendation: "State the final number clearly, explain what it means, and tie it back to the business decision.",
        sampleConclusion: "The strongest close would state the final answer, explain the business meaning, and then recommend the next step."
      };
  }
}

function assessFinancialAnalysisResponse(
  response: string,
  review: FinancialAnalysisReview
): FinancialAnalysisAssessment {
  const normalizedResponse = response.toLowerCase();
  const matchedResults = review.steps.reduce((count, step) => {
    const raw = step.result.toLowerCase();
    const cleaned = raw.replace(/[$,%]/g, "").replace(/,/g, "").trim();
    const numeric = cleaned.match(/-?\d+(\.\d+)?/g) ?? [];
    const acceptedSnippets = Array.from(new Set([raw, cleaned, ...numeric].filter((snippet) => snippet.length >= 2)));

    return acceptedSnippets.some((snippet) => normalizedResponse.includes(snippet)) ? count + 1 : count;
  }, 0);
  const mentionsFormula = /\b(calculate|formula|payback|npv|turnover|margin|depreciation|rate of return|fair value|cash budget|savings rate)\b/i.test(
    response
  );
  const recommendationAligned = /\b(recommend|should|move forward|do not move forward|approve|decline|issue debt|issue stock|cut costs|tighten collections)\b/i.test(
    response
  );

  return {
    matchedResults,
    totalResults: review.steps.length,
    mentionsFormula,
    recommendationAligned
  };
}

function buildEventSituation(
  draft: ScenarioDraft,
  request: RoleplayRequest,
  indicators: PerformanceIndicator[],
  financialAnalysis?: FinancialAnalysisCase
) {
  const piNames = indicators.map((item) => item.text.replace(/\.$/, "")).join("; ");
  const preferredArea = request.instructionalAreaPreference.trim();

  return [
    `You are to assume the role of ${draft.participantRole} for a ${draft.business}. The ${draft.judgeRole} has asked you to help because ${draft.situation}.`,
    `The ${draft.judgeRole} wants you to ${draft.ask}. ${DIFFICULTY_NOTES[request.difficulty]}`,
    financialAnalysis
      ? "Use the financial-analysis worksheet below to calculate the key figures, explain what the numbers mean, and support your recommendation with the math."
      : null,
    preferredArea
      ? `Your presentation should make it clear how your recommendation connects to ${preferredArea}.`
      : null,
    `As you prepare your presentation, keep these expectations in mind: ${draft.tensions.join(" ")}.`,
    `Your ideas should directly support these performance indicators: ${piNames}.`
  ]
    .filter(Boolean)
    .join("\n\n");
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
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

function buildTokenConceptLookup(families: ConceptFamily[]) {
  const lookup = new Map<string, string>();

  for (const family of families) {
    for (const alias of family.aliases) {
      const normalizedAlias = normalizeText(alias);

      if (!normalizedAlias || normalizedAlias.includes(" ")) {
        continue;
      }

      lookup.set(canonicalizeToken(normalizedAlias), family.name);
    }
  }

  return lookup;
}

function extractKeywords(text: string) {
  return Array.from(
    new Set(
      normalizeText(text)
        .split(/\s+/)
        .map(canonicalizeToken)
        .filter((word) => word.length >= 3 && !STOP_WORDS.has(word))
    )
  );
}

function isAliasMatched(alias: string, normalizedText: string, tokenSet: Set<string>) {
  const normalizedAlias = normalizeText(alias);

  if (!normalizedAlias) {
    return false;
  }

  if (normalizedAlias.includes(" ")) {
    return ` ${normalizedText} `.includes(` ${normalizedAlias} `);
  }

  return tokenSet.has(canonicalizeToken(normalizedAlias));
}

function getMatchedConcepts(normalizedText: string, tokenSet: Set<string>) {
  const matched = new Set<string>();

  for (const family of CONCEPT_FAMILIES) {
    if (family.aliases.some((alias) => isAliasMatched(alias, normalizedText, tokenSet))) {
      matched.add(family.name);
    }
  }

  return matched;
}

function analyzeResponse(response: string, eventSituation: string): ResponseAnalysis {
  const normalizedText = normalizeText(response);
  const tokenSet = new Set(
    normalizedText
      .split(/\s+/)
      .map(canonicalizeToken)
      .filter(Boolean)
  );
  const matchedConcepts = getMatchedConcepts(normalizedText, tokenSet);
  const words = normalizedText.split(/\s+/).filter(Boolean);
  const sentences = response.split(/[.!?]+/).filter((entry) => entry.trim().length > 0);
  const scenarioKeywords = extractKeywords(eventSituation).filter((keyword) => keyword.length >= 5).slice(0, 18);
  const scenarioAlignment = scenarioKeywords.filter((keyword) => {
    const mappedConcept = TOKEN_CONCEPT_LOOKUP.get(keyword);
    return tokenSet.has(keyword) || (mappedConcept ? matchedConcepts.has(mappedConcept) : false);
  }).length;

  return {
    normalizedText,
    tokenSet,
    matchedConcepts,
    wordCount: words.length,
    sentenceCount: sentences.length,
    hasNumbers: /\d/.test(response),
    hasRecommendation:
      /\b(recommend|recommendation|suggest|proposal|propose|advise|should|best option|best approach|i would|we should)\b/i.test(
        response
      ),
    hasMetrics:
      /\b(percent|percentage|increase|decrease|measure|track|tracking|monitor|kpi|metric|metrics|benchmark|target|goal|goals|budget|roi|return|sales|revenue|profit|retention|conversion|satisfaction|occupancy|turnover)\b/i.test(
        response
      ),
    hasStakeholderAwareness:
      /\b(customer|customers|guest|guests|client|clients|employee|employees|staff|team|manager|managers|associate|associates|owner|owners|supervisor|leadership)\b/i.test(
        response
      ),
    hasJustification:
      /\b(because|so that|therefore|this will|which will|as a result|in order to|so the company can|so we can)\b/i.test(
        response
      ),
    hasActionSteps:
      /\b(first|second|third|next|then|after that|finally|step|begin by|start by|roll out|follow up|implement|launch)\b/i.test(
        response
      ),
    hasRiskAwareness:
      /\b(risk|risks|challenge|challenges|obstacle|obstacles|concern|concerns|mitigate|mitigation|backup|contingency|prevent|avoid)\b/i.test(
        response
      ),
    hasClosing: /\b(in conclusion|overall|to summarize|in summary|ultimately|in closing)\b/i.test(response),
    hasExamples: /\b(for example|for instance|such as|specifically)\b/i.test(response),
    hasTimeline: /\b(day|days|week|weeks|month|months|quarter|quarters|30|60|90|year|years)\b/i.test(response),
    scenarioAlignment
  };
}

function createJudgeCharacterization(event: EventOption, participantRoleplay: ParticipantRoleplay) {
  if (participantRoleplay.financialAnalysis) {
    return "The judge is roleplaying a finance leader who expects you to show the math, explain what the numbers mean, and then make a business recommendation instead of stopping at the calculation.";
  }

  switch (event.clusterId) {
    case "finance":
      return "The judge is roleplaying a cautious decision-maker who values clarity, risk awareness, and realistic financial reasoning.";
    case "marketing":
      return "The judge is roleplaying a manager who wants a clear target audience, a practical strategy, and measurable customer response.";
    case "hospitality":
      return "The judge is roleplaying a hospitality leader who cares most about service quality, execution, and the guest experience.";
    default:
      return "The judge is roleplaying a business leader who wants a practical recommendation, clear follow-through, and strong alignment to the performance indicators.";
  }
}

function createFollowUpQuestions(event: EventOption, participantRoleplay: ParticipantRoleplay) {
  if (participantRoleplay.financialAnalysis) {
    return [
      "Which assumption in your calculation matters the most, and how would the recommendation change if that assumption moved against you?",
      "How would you explain these numbers clearly to a manager who is not comfortable with finance terminology?"
    ];
  }

  const bank = getScenarioBank(event.id);
  return pickMany(bank.followUps, 2);
}

function evaluatePiScores(analysis: ResponseAnalysis, indicators: PerformanceIndicator[]) {
  return indicators.map((indicator) => {
    const indicatorKeywords = extractKeywords(indicator.text);
    const indicatorTokenSet = new Set(indicatorKeywords);
    const indicatorConcepts = getMatchedConcepts(normalizeText(indicator.text), indicatorTokenSet);
    const directMatches = indicatorKeywords.filter((keyword) => analysis.tokenSet.has(keyword)).length;
    const conceptMatches = [...indicatorConcepts].filter((concept) => analysis.matchedConcepts.has(concept)).length;
    const needsMetricLanguage = [...indicatorConcepts].some((concept) => METRIC_RELEVANT_CONCEPTS.has(concept));
    const needsStakeholderLanguage = [...indicatorConcepts].some((concept) =>
      STAKEHOLDER_RELEVANT_CONCEPTS.has(concept)
    );
    const needsRiskLanguage = [...indicatorConcepts].some((concept) => RISK_RELEVANT_CONCEPTS.has(concept));
    const structureSupport =
      (analysis.hasRecommendation ? 0.65 : 0) +
      (analysis.hasJustification ? 0.55 : 0) +
      (analysis.hasActionSteps ? 0.55 : 0) +
      (analysis.scenarioAlignment >= 2 ? 0.35 : 0) +
      (analysis.wordCount >= 150 ? 0.35 : 0) +
      (analysis.hasStakeholderAwareness && needsStakeholderLanguage ? 0.45 : 0) +
      ((analysis.hasMetrics || analysis.hasTimeline) && needsMetricLanguage ? 0.55 : 0) +
      (analysis.hasRiskAwareness && needsRiskLanguage ? 0.4 : 0);
    const coverageScore = directMatches * 0.95 + conceptMatches * 1.35 + structureSupport;
    let score = 1;

    if (directMatches === 0 && conceptMatches === 0) {
      score = analysis.wordCount >= 140 && analysis.hasRecommendation ? 2 : 1;
    } else {
      if (coverageScore >= 1.2) {
        score = 2;
      }
      if (coverageScore >= 2.35) {
        score = 3;
      }
      if (coverageScore >= 3.6) {
        score = 4;
      }
      if (
        coverageScore >= 4.85 &&
        analysis.wordCount >= 130 &&
        (analysis.hasJustification || analysis.hasActionSteps)
      ) {
        score = 5;
      }
    }

    if (analysis.wordCount < 90 && score > 3) {
      score -= 1;
    }

    if (score === 5 && !analysis.hasRecommendation) {
      score = 4;
    }

    return {
      pi: `${indicator.code} - ${indicator.text}`,
      score: clamp(score, 0, 5),
      reason:
        score === 5
          ? "This performance indicator was addressed directly with strong business language, clear reasoning, and usable detail."
          : score === 4
            ? "This performance indicator was handled well, though one more explicit example or tighter link would make it even stronger."
            : score === 3
              ? "This indicator was covered in a relevant way, but some of the explanation stayed broad."
              : score === 2
                ? "There was partial alignment here, but the judge would need more explicit detail to award stronger credit."
                : "This indicator was barely addressed or stayed too indirect to earn much credit."
    };
  });
}

function evaluateSkillScores(analysis: ResponseAnalysis) {
  const creativitySignal =
    analysis.matchedConcepts.has("creativity") ||
    /\b(pilot|partnership|bundle|tiered|phased|recognition program|cross-train)\b/i.test(
      analysis.normalizedText
    );
  const criticalThinking = clamp(
    1 +
      (analysis.hasRecommendation ? 1 : 0) +
      (analysis.hasJustification ? 1 : 0) +
      (analysis.hasMetrics || analysis.hasNumbers ? 1 : 0) +
      (analysis.hasRiskAwareness ? 1 : 0),
    0,
    5
  );
  const problemSolving = clamp(
    1 +
      (analysis.hasActionSteps ? 1 : 0) +
      (analysis.hasStakeholderAwareness ? 1 : 0) +
      (analysis.scenarioAlignment >= 2 ? 1 : 0) +
      (analysis.hasRiskAwareness ? 1 : 0),
    0,
    5
  );
  const communication = clamp(
    1 +
      (analysis.sentenceCount >= 5 ? 1 : 0) +
      (analysis.wordCount >= 150 ? 1 : 0) +
      (analysis.hasClosing ? 1 : 0) +
      (analysis.hasActionSteps || analysis.hasExamples ? 1 : 0),
    0,
    5
  );
  const creativity = clamp(
    1 +
      (analysis.matchedConcepts.size >= 5 ? 1 : 0) +
      (analysis.hasExamples ? 1 : 0) +
      (creativitySignal ? 1 : 0) +
      (analysis.hasRecommendation && analysis.hasActionSteps ? 1 : 0),
    0,
    5
  );

  return [
    {
      skill: SKILLS_21ST_CENTURY[0],
      score: criticalThinking,
      reason:
        criticalThinking >= 4
          ? "The response showed clear reasoning, business logic, and enough analysis to sound intentional."
          : "The response needed stronger logic, clearer tradeoffs, or more visible analysis."
    },
    {
      skill: SKILLS_21ST_CENTURY[1],
      score: problemSolving,
      reason:
        problemSolving >= 4
          ? "The answer moved beyond identifying the problem and offered a workable action plan."
          : "The response identified the issue, but the solution needed clearer execution steps."
    },
    {
      skill: SKILLS_21ST_CENTURY[2],
      score: communication,
      reason:
        communication >= 4
          ? "The response was organized enough that a judge could follow the main idea quickly."
          : "The delivery would be stronger with cleaner structure, sequencing, or a firmer close."
    },
    {
      skill: SKILLS_21ST_CENTURY[3],
      score: creativity,
      reason:
        creativity >= 4
          ? "The response included ideas that felt tailored and purposeful instead of generic."
          : "The answer could feel more distinctive with a sharper example or more original execution idea."
    }
  ];
}

function buildStrengths(
  piAverage: number,
  analysis: ResponseAnalysis,
  financeAssessment?: FinancialAnalysisAssessment
) {
  const strengths: string[] = [];

  if (analysis.hasRecommendation) {
    strengths.push("You made a direct recommendation instead of circling around the decision.");
  }
  if (analysis.hasJustification) {
    strengths.push("You explained why the plan helps the business, which makes the answer sound more judge-ready.");
  }
  if (analysis.hasActionSteps) {
    strengths.push("You gave the recommendation a workable sequence instead of leaving it as a vague idea.");
  }
  if (analysis.hasMetrics || analysis.hasTimeline) {
    strengths.push("You made the plan feel measurable with metrics or timing language.");
  }
  if (piAverage >= 4) {
    strengths.push("Your response sounded closely tied to the listed performance indicators.");
  }
  if (analysis.scenarioAlignment >= 2) {
    strengths.push("You stayed anchored to the scenario instead of giving a generic business answer.");
  }
  if (financeAssessment && financeAssessment.matchedResults >= 2) {
    strengths.push("You stated key calculation results clearly enough that a finance judge could follow the numbers.");
  }
  if (financeAssessment && financeAssessment.recommendationAligned) {
    strengths.push("You connected the math back to a recommendation instead of treating the analysis like a worksheet only.");
  }

  return strengths.slice(0, 4);
}

function buildWeaknesses(
  piAverage: number,
  analysis: ResponseAnalysis,
  financeAssessment?: FinancialAnalysisAssessment
) {
  const weaknesses: string[] = [];

  if (!analysis.hasJustification) {
    weaknesses.push("The response needed more explanation of why the recommendation works, not just what to do.");
  }
  if (!analysis.hasActionSteps) {
    weaknesses.push("The execution plan was not sequenced clearly enough for a judge to picture the rollout.");
  }
  if (!analysis.hasMetrics && !analysis.hasTimeline) {
    weaknesses.push("The recommendation needed a clearer metric, checkpoint, or timeline to feel fully business-like.");
  }
  if (!analysis.hasRiskAwareness) {
    weaknesses.push("The response would be stronger if it acknowledged a risk, obstacle, or backup plan.");
  }
  if (piAverage < 3.5) {
    weaknesses.push("Some performance indicators were addressed too generally instead of being hit explicitly.");
  }
  if (analysis.wordCount < 120) {
    weaknesses.push("The response was short enough that some competitive detail never had room to appear.");
  }
  if (financeAssessment && financeAssessment.matchedResults === 0) {
    weaknesses.push("The response talked around the finance problem without clearly stating the final calculation results.");
  }
  if (financeAssessment && !financeAssessment.recommendationAligned) {
    weaknesses.push("The answer needed a more decisive finance recommendation after the calculations were finished.");
  }

  return weaknesses.slice(0, 4);
}

function buildMissedOpportunities(
  piAverage: number,
  analysis: ResponseAnalysis,
  financeAssessment?: FinancialAnalysisAssessment
) {
  const opportunities: string[] = [];

  if (!analysis.hasMetrics && !analysis.hasTimeline) {
    opportunities.push("You left points on the table by not naming how success would be measured or when it would be reviewed.");
  }
  if (!analysis.hasExamples) {
    opportunities.push("A more scenario-specific example would have made the recommendation sound more realistic.");
  }
  if (!analysis.hasRiskAwareness) {
    opportunities.push("You could have strengthened the answer by addressing one likely obstacle and how to reduce it.");
  }
  if (analysis.scenarioAlignment < 2) {
    opportunities.push("You could have echoed more facts from the scenario so the answer felt more tailored to this exact judge roleplay.");
  }
  if (piAverage < 4) {
    opportunities.push("You could have mirrored the performance-indicator language more directly so the scoring connections were easier to hear.");
  }
  if (financeAssessment && !financeAssessment.mentionsFormula) {
    opportunities.push("You could have earned more trust by naming the finance formula or ratio before giving the final answer.");
  }

  return opportunities.slice(0, 4);
}

function buildImprovementSuggestions(
  piAverage: number,
  analysis: ResponseAnalysis,
  financeAssessment?: FinancialAnalysisAssessment
) {
  const suggestions: string[] = [];

  if (!analysis.hasActionSteps) {
    suggestions.push("Use a simple structure like problem, recommendation, implementation, and expected result.");
  }
  if (!analysis.hasJustification) {
    suggestions.push("After each recommendation, explain why it helps the business or stakeholder in this scenario.");
  }
  if (!analysis.hasMetrics && !analysis.hasTimeline) {
    suggestions.push("Add at least one KPI, checkpoint, or time frame so the plan feels measurable.");
  }
  if (!analysis.hasRiskAwareness) {
    suggestions.push("Name one likely challenge and the backup step you would take if it appears.");
  }
  if (piAverage < 4) {
    suggestions.push("Echo the PI language more directly so the judge can immediately hear the alignment.");
  }
  if (financeAssessment) {
    suggestions.push("Say the formula, plug in the numbers out loud, and then state the business conclusion in one clean sequence.");
  }

  return suggestions.slice(0, 4);
}

function buildSampleHighScoringOutline(financialAnalysis?: FinancialAnalysisCase) {
  if (financialAnalysis) {
    return [
      "Open by restating the business problem and the decision the judge needs to make.",
      "Name the formula or ratio you are using before you plug in the numbers.",
      "Walk through the key calculations clearly and state each final result out loud.",
      "Explain what the numbers mean for risk, cash flow, profitability, or control.",
      "Give one clear recommendation based on the analysis, plus one practical caution or next step.",
      "Close by summarizing both the math answer and the business recommendation."
    ];
  }

  return [
    "Open by restating the problem, the business goal, and who is affected.",
    "Give one clear recommendation before listing supporting details.",
    "Explain how the plan would be implemented and who would be responsible.",
    "Tie the recommendation directly to the performance indicators and the business context.",
    "Name measurable outcomes or a timeline for judging success.",
    "Close with a confident summary and next step."
  ];
}

export function generateParticipantRoleplay(request: RoleplayRequest): ParticipantRoleplay {
  const event = getEventById(request.eventId);

  if (!event) {
    throw new Error("Selected event was not found.");
  }

  if (event.clusterId !== request.clusterId) {
    throw new Error("Selected event does not match the selected cluster.");
  }

  const scenarioDraft = createScenarioDraft(event, request);
  const indicators = pickPerformanceIndicators(request, {
    eventName: event.name,
    eventDescription: event.description,
    eventInstructionalArea: event.instructionalArea,
    preferredInstructionalArea: request.instructionalAreaPreference,
    businessType: scenarioDraft.business,
    situation: scenarioDraft.situation,
    ask: scenarioDraft.ask
  });
  const instructionalArea = indicators[0]?.instructionalArea ?? event.instructionalArea;
  const financialAnalysis = createFinancialAnalysisCase(event, scenarioDraft, instructionalArea);

  return {
    id: crypto.randomUUID(),
    eventName: event.name,
    cluster: event.clusterLabel,
    instructionalArea,
    participantInstructions: PARTICIPANT_INSTRUCTIONS,
    skills21stCentury: SKILLS_21ST_CENTURY,
    performanceIndicators: indicators,
    eventSituation: buildEventSituation(scenarioDraft, request, indicators, financialAnalysis),
    financialAnalysis
  };
}

export function judgeParticipantResponse(
  request: RoleplayRequest,
  participantRoleplay: ParticipantRoleplay,
  userResponse: string
): JudgeEvaluation {
  const event = getEventById(request.eventId);

  if (!event) {
    throw new Error("Selected event was not found.");
  }

  const analysis = analyzeResponse(userResponse, participantRoleplay.eventSituation);
  const financialAnalysisReview = participantRoleplay.financialAnalysis
    ? buildFinancialAnalysisReview(participantRoleplay.financialAnalysis)
    : undefined;
  const financeAssessment = financialAnalysisReview
    ? assessFinancialAnalysisResponse(userResponse, financialAnalysisReview)
    : undefined;
  const piScores = evaluatePiScores(analysis, participantRoleplay.performanceIndicators);
  const skillsScores = evaluateSkillScores(analysis);
  const piAverage = piScores.reduce((sum, item) => sum + item.score, 0) / piScores.length;
  const skillsAverage =
    skillsScores.reduce((sum, item) => sum + item.score, 0) / skillsScores.length;
  const executionBonus = clamp(
    (analysis.hasRecommendation ? 2 : 0) +
      (analysis.hasJustification ? 2 : 0) +
      (analysis.hasActionSteps ? 2 : 0) +
      (analysis.hasMetrics || analysis.hasTimeline ? 2 : 0) +
      (analysis.scenarioAlignment >= 2 ? 1 : 0) +
      (analysis.hasRiskAwareness ? 1 : 0) +
      (financeAssessment?.matchedResults && financeAssessment.matchedResults > 0 ? 1 : 0) +
      (financeAssessment?.mentionsFormula ? 1 : 0) +
      (financeAssessment?.recommendationAligned ? 1 : 0),
    0,
    10
  );
  const estimatedTotalScore = clamp(
    Math.round((piAverage / 5) * 64) + Math.round((skillsAverage / 5) * 25) + executionBonus,
    0,
    99
  );

  const strengths = buildStrengths(piAverage, analysis, financeAssessment);
  const weaknesses = buildWeaknesses(piAverage, analysis, financeAssessment);
  const missedOpportunities = buildMissedOpportunities(piAverage, analysis, financeAssessment);
  const improvementSuggestions = buildImprovementSuggestions(piAverage, analysis, financeAssessment);

  return {
    judgeCharacterization: createJudgeCharacterization(event, participantRoleplay),
    followUpQuestions: createFollowUpQuestions(event, participantRoleplay),
    overallImpression:
      financialAnalysisReview && (!financeAssessment || financeAssessment.matchedResults === 0)
        ? "The response sounded finance-aware, but a judge would still want to hear the actual calculation results and recommendation more explicitly."
        : estimatedTotalScore >= 88
        ? "This would likely feel like a strong, competitive DECA response: clear, relevant, and easy for a judge to reward."
        : estimatedTotalScore >= 74
          ? "This response would likely feel competitive overall, but it still needs sharper detail or tighter PI alignment to push into top scores."
          : "This response shows the right direction, but it would probably feel too general or underdeveloped for a strong competitive score.",
    piScores,
    skillsScores,
    estimatedTotalScore,
    strengths:
      strengths.length > 0
        ? strengths
        : ["You attempted to answer the situation directly instead of avoiding the main decision."],
    weaknesses:
      weaknesses.length > 0
        ? weaknesses
        : ["The response needed more specific business logic and clearer performance-indicator coverage."],
    missedOpportunities:
      missedOpportunities.length > 0
        ? missedOpportunities
        : ["A little more scenario-specific detail would make the answer feel even more competitive."],
    improvementSuggestions:
      improvementSuggestions.length > 0
        ? improvementSuggestions
        : ["Keep the same structure, but add one more explicit metric or scenario detail to make the answer even stronger."],
    sampleHighScoringOutline: buildSampleHighScoringOutline(participantRoleplay.financialAnalysis),
    financialAnalysisReview
  };
}
