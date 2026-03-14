import { PARTICIPANT_INSTRUCTIONS, SKILLS_21ST_CENTURY } from "@/lib/config";
import { getEventById, pickPerformanceIndicators } from "@/lib/data";
import type {
  EventOption,
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

function getScenarioBank(eventId: string) {
  const alias = SCENARIO_BANK_ALIASES[eventId];

  return SCENARIO_BANKS[eventId] ?? (alias ? SCENARIO_BANKS[alias] : undefined) ?? SCENARIO_BANKS["hrm-series"];
}

function getSupplementalSituations(event: EventOption) {
  switch (event.id) {
    case "principles-bma":
      return [
        "leadership wants a simple recommendation that improves daily execution before small issues start affecting results",
        "the business needs a clearer plan for handling an everyday management challenge without adding unnecessary complexity"
      ];
    case "bltdm-team":
      return [
        "leaders need a legally and ethically sound recommendation before a policy decision creates greater business risk",
        "a compliance concern has surfaced and management wants a practical response that protects both trust and operations"
      ];
    case "hrm-series":
      return [
        "management wants a stronger people-focused recommendation before morale, retention, or consistency slips further",
        "the company needs a realistic human-resources response that improves employee performance without creating unnecessary friction"
      ];
    case "principles-finance":
      return [
        "the business needs a clearer financial recommendation before leadership makes its next basic money decision",
        "management wants a practical finance-focused response that improves confidence in the next step without overcomplicating the issue"
      ];
    case "act-series":
      return [
        "leaders need a more reliable accounting recommendation before recordkeeping or reporting issues create bigger problems",
        "the company wants a clear financial-records plan that improves accuracy and control before the next reporting cycle"
      ];
    case "bfs-series":
      return [
        "management needs a stronger finance recommendation before cash, budgeting, or resource decisions begin limiting results",
        "the business wants a practical financial plan that balances growth, control, and risk before the next review period"
      ];
    case "ftdm-team":
      return [
        "the team needs a sound financial recommendation before a client-facing decision creates unnecessary exposure",
        "leaders want a more disciplined finance strategy that improves trust and long-term business performance"
      ];
    case "principles-marketing":
      return [
        "the business needs a clearer customer-focused recommendation before promotional momentum continues to slow",
        "leadership wants a practical marketing response that improves customer interest without making the plan too complex"
      ];
    case "aam-series":
    case "rms-series":
      return [
        "management wants a stronger merchandising recommendation before assortment or presentation issues hurt customer response",
        "the business needs a clearer retail plan that improves product appeal and selling performance at the same time"
      ];
    case "asm-series":
      return [
        "the business wants a more effective automotive-marketing recommendation before local demand slips further",
        "leadership needs a customer-trust strategy that improves traffic and response without relying on generic promotion"
      ];
    case "bsm-series":
      return [
        "the company needs a sharper business-services marketing recommendation before prospects keep delaying decisions",
        "leadership wants a more convincing market-facing plan that improves positioning and follow-through"
      ];
    case "btdm-team":
      return [
        "the team needs a stronger merchandising decision before product assortment or inventory choices weaken customer response",
        "leadership wants a buying strategy that feels more intentional before the next merchandise planning cycle"
      ];
    case "food-series":
      return [
        "the business wants a better food-marketing recommendation before customer response softens during the next selling period",
        "leaders need a practical plan that improves product appeal and customer demand without hurting everyday execution"
      ];
    case "mcs-series":
      return [
        "the business needs a clearer communication strategy before its message continues missing the target audience",
        "leadership wants a stronger marketing-communications plan that improves response and message consistency"
      ];
    case "mtdm-team":
      return [
        "the team needs a broader marketing recommendation before growth stalls in the current market",
        "leadership wants a strategy that connects audience insight, execution, and measurable results more clearly"
      ];
    case "sem-series":
    case "stdm-team":
      return [
        "leaders want a more compelling audience-growth recommendation before fan response weakens during the next promotional cycle",
        "the organization needs a marketing plan that strengthens both experience and measurable engagement"
      ];
    case "principles-hospitality":
      return [
        "the business needs a more guest-focused recommendation before service inconsistency starts shaping the experience negatively",
        "leadership wants a practical hospitality improvement that is easy for staff to carry out and easy for guests to notice"
      ];
    case "htps-series":
      return [
        "the organization wants a stronger hospitality selling recommendation before guest interest fades during the current cycle",
        "leadership needs a clearer value-focused plan that improves confidence in the hospitality offer"
      ];
    case "htdm-team":
      return [
        "the team needs a stronger service recommendation before guest satisfaction and execution drift further apart",
        "management wants a hospitality plan that improves experience quality while staying realistic for staff"
      ];
    case "hlm-series":
      return [
        "the property needs a more disciplined lodging recommendation before service inconsistency affects guest confidence",
        "leaders want a hotel-management decision that improves operations and guest experience at the same time"
      ];
    case "qsrm-series":
    case "rfsm-series":
      return [
        "the restaurant needs a stronger operating recommendation before inconsistency starts affecting both speed and guest satisfaction",
        "management wants a clearer food-service plan that improves execution without overloading the team"
      ];
    case "ttdm-team":
      return [
        "leaders want a more compelling travel recommendation before interest and bookings soften during the next cycle",
        "the organization needs a tourism plan that improves guest appeal while remaining realistic for staff and partners"
      ];
    case "ent-series":
      return [
        "the founder needs a clearer venture recommendation before committing more resources to the current growth direction",
        "leadership wants an entrepreneurial next step that strengthens feasibility without slowing momentum unnecessarily"
      ];
    case "etdm-team":
      return [
        "the venture team needs a sharper growth recommendation before expansion decisions create unnecessary risk",
        "leadership wants an entrepreneurial strategy that improves long-term viability without losing speed or creativity"
      ];
    default:
      return [
        "leadership wants a stronger recommendation before current results begin slipping further",
        "the business needs a clearer plan that improves execution while staying realistic for the team"
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

function createScenarioDraft(event: EventOption, request: RoleplayRequest): ScenarioDraft {
  const bank = getScenarioBank(event.id);
  const business = request.industry.trim() || pickOne(bank.businesses);
  const participantRole = pickOne(bank.participantRoles);
  const judgeRole = pickOne(bank.judgeRoles);
  const situation = pickOne([...bank.situations, ...getSupplementalSituations(event)]);
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

function buildEventSituation(draft: ScenarioDraft, request: RoleplayRequest, indicators: PerformanceIndicator[]) {
  const piNames = indicators.map((item) => item.text.replace(/\.$/, "")).join("; ");
  const preferredArea = request.instructionalAreaPreference.trim();

  return [
    `You are to assume the role of ${draft.participantRole} for a ${draft.business}. The ${draft.judgeRole} has asked you to help because ${draft.situation}.`,
    `The ${draft.judgeRole} wants you to ${draft.ask}. ${DIFFICULTY_NOTES[request.difficulty]}`,
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

function createJudgeCharacterization(event: EventOption) {
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

function createFollowUpQuestions(event: EventOption) {
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

function buildStrengths(piAverage: number, analysis: ResponseAnalysis) {
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

  return strengths.slice(0, 4);
}

function buildWeaknesses(piAverage: number, analysis: ResponseAnalysis) {
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

  return weaknesses.slice(0, 4);
}

function buildMissedOpportunities(piAverage: number, analysis: ResponseAnalysis) {
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

  return opportunities.slice(0, 4);
}

function buildImprovementSuggestions(piAverage: number, analysis: ResponseAnalysis) {
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

  return suggestions.slice(0, 4);
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

  return {
    id: crypto.randomUUID(),
    eventName: event.name,
    cluster: event.clusterLabel,
    instructionalArea: indicators[0]?.instructionalArea ?? event.instructionalArea,
    participantInstructions: PARTICIPANT_INSTRUCTIONS,
    skills21stCentury: SKILLS_21ST_CENTURY,
    performanceIndicators: indicators,
    eventSituation: buildEventSituation(scenarioDraft, request, indicators)
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
      (analysis.hasRiskAwareness ? 1 : 0),
    0,
    10
  );
  const estimatedTotalScore = clamp(
    Math.round((piAverage / 5) * 64) + Math.round((skillsAverage / 5) * 25) + executionBonus,
    0,
    99
  );

  const strengths = buildStrengths(piAverage, analysis);
  const weaknesses = buildWeaknesses(piAverage, analysis);
  const missedOpportunities = buildMissedOpportunities(piAverage, analysis);
  const improvementSuggestions = buildImprovementSuggestions(piAverage, analysis);

  return {
    judgeCharacterization: createJudgeCharacterization(event),
    followUpQuestions: createFollowUpQuestions(event),
    overallImpression:
      estimatedTotalScore >= 88
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
    sampleHighScoringOutline: [
      "Open by restating the problem, the business goal, and who is affected.",
      "Give one clear recommendation before listing supporting details.",
      "Explain how the plan would be implemented and who would be responsible.",
      "Tie the recommendation directly to the performance indicators and the business context.",
      "Name measurable outcomes or a timeline for judging success.",
      "Close with a confident summary and next step."
    ]
  };
}
