export interface ClusterOption {
  id: string;
  label: string;
}

export interface EventOption {
  id: string;
  code: string;
  name: string;
  clusterId: string;
  clusterLabel: string;
  instructionalArea?: string;
  description?: string;
}

export interface PerformanceIndicator {
  id: string;
  code: string;
  text: string;
  clusterId: string;
  instructionalArea?: string;
  eventIds: string[];
}

export interface FinancialAnalysisInput {
  label: string;
  value: string;
}

export interface FinancialAnalysisCase {
  caseType: string;
  title: string;
  prompt: string;
  formulas: string[];
  inputs: FinancialAnalysisInput[];
  requiredOutputs: string[];
  dataset: Record<string, number | string>;
}

export interface FinancialAnalysisSolutionStep {
  label: string;
  equation: string;
  result: string;
  explanation: string;
}

export interface FinancialAnalysisAnswer {
  label: string;
  value: string;
}

export interface FinancialAnalysisReview {
  title: string;
  summary: string;
  steps: FinancialAnalysisSolutionStep[];
  finalAnswers: FinancialAnalysisAnswer[];
  recommendation: string;
  sampleConclusion: string;
}

export interface RoleplayRequest {
  eventId: string;
  clusterId: string;
  difficulty: "easy" | "medium" | "hard";
  industry: string;
  instructionalAreaPreference: string;
  specificPerformanceIndicatorIds: string[];
  numberOfPis: number;
}

export interface ParticipantRoleplay {
  id: string;
  eventName: string;
  cluster: string;
  instructionalArea?: string;
  participantInstructions: string[];
  skills21stCentury: string[];
  performanceIndicators: PerformanceIndicator[];
  eventSituation: string;
  financialAnalysis?: FinancialAnalysisCase;
}

export interface PiScore {
  pi: string;
  score: number;
  reason: string;
}

export interface SkillScore {
  skill: string;
  score: number;
  reason: string;
}

export interface JudgeEvaluation {
  judgeCharacterization: string;
  followUpQuestions: string[];
  overallImpression: string;
  piScores: PiScore[];
  skillsScores: SkillScore[];
  estimatedTotalScore: number;
  strengths: string[];
  weaknesses: string[];
  missedOpportunities: string[];
  improvementSuggestions: string[];
  sampleHighScoringOutline: string[];
  financialAnalysisReview?: FinancialAnalysisReview;
}

export interface DifficultyOption {
  value: "easy" | "medium" | "hard";
  label: string;
  description: string;
}

export interface PracticeOptions {
  clusters: ClusterOption[];
  events: EventOption[];
  difficulties: DifficultyOption[];
  performanceIndicators: PerformanceIndicator[];
}

export interface RoleplayReference {
  eventId: string;
  notes: string[];
}

export interface Viewer {
  id: string;
  email: string;
}

export interface SavedRoleplayHistoryItem {
  id: string;
  eventId: string;
  eventName: string;
  cluster: string;
  instructionalArea?: string;
  createdAt: string;
  submittedAt: string | null;
  estimatedTotalScore: number | null;
  responseText: string | null;
  eventSituation: string;
}

export interface AccountStatistics {
  totalGenerated: number;
  totalSubmitted: number;
  averageScore: number | null;
  bestScore: number | null;
  uniqueEvents: number;
  uniqueClusters: number;
}

export type TestOptionKey = "A" | "B" | "C" | "D";

export interface TestPerformanceIndicator {
  code: string;
  text: string | null;
  instructionalArea: string;
  level: string | null;
}

export interface TestQuestion {
  number: number;
  question: string;
  options: Record<TestOptionKey, string>;
  answer: TestOptionKey;
  explanation: string;
  source: string | null;
  performanceIndicator: TestPerformanceIndicator;
  // Set only on questions in a custom practice session (never in the JSON files):
  // where the question originally came from.
  origin?: QuestionOrigin;
}

export interface QuestionOrigin {
  testId: string;
  title: string;
  year: number | null;
  event: string | null;
  number: number;
}

export interface PracticeTest {
  id: string;
  title: string;
  cluster: string;
  year: number | null;
  event: string | null;
  timeLimitMinutes: number;
  questions: TestQuestion[];
}

export interface PracticeTestSummary {
  id: string;
  title: string;
  cluster: string;
  year: number | null;
  event: string | null;
  timeLimitMinutes: number;
  questionCount: number;
}

// One row per question in the pooled index used by the custom practice filters.
// Deliberately excludes question text, options, and answers to keep the page light.
export interface QuestionIndexEntry {
  ref: string;
  // Shared by copies of the same question (identical text and options) on different tests.
  item: number;
  testId: string;
  number: number;
  event: string | null;
  year: number | null;
  cluster: string;
  instructionalArea: string;
  piCode: string;
  piText: string | null;
}
