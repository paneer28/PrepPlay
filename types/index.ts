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
