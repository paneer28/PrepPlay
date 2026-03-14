import { z } from "zod";
import { LIMITS } from "@/lib/config";

export const performanceIndicatorSchema = z.object({
  id: z.string(),
  code: z.string(),
  text: z.string(),
  clusterId: z.string(),
  instructionalArea: z.string().optional(),
  eventIds: z.array(z.string())
});

export const participantRoleplaySchema = z.object({
  id: z.string(),
  eventName: z.string(),
  cluster: z.string(),
  instructionalArea: z.string().optional(),
  participantInstructions: z.array(z.string()),
  skills21stCentury: z.array(z.string()),
  performanceIndicators: z.array(performanceIndicatorSchema),
  eventSituation: z.string()
});

export const generationResponseSchema = participantRoleplaySchema.omit({
  id: true
});

export const piScoreSchema = z.object({
  pi: z.string(),
  score: z.number().min(0).max(5),
  reason: z.string()
});

export const skillScoreSchema = z.object({
  skill: z.string(),
  score: z.number().min(0).max(5),
  reason: z.string()
});

export const judgeEvaluationSchema = z.object({
  judgeCharacterization: z.string(),
  followUpQuestions: z.array(z.string()).length(2),
  overallImpression: z.string(),
  piScores: z.array(piScoreSchema),
  skillsScores: z.array(skillScoreSchema),
  estimatedTotalScore: z.number().min(0).max(99),
  strengths: z.array(z.string()).min(1),
  weaknesses: z.array(z.string()).min(1),
  missedOpportunities: z.array(z.string()).min(1),
  improvementSuggestions: z.array(z.string()).min(1),
  sampleHighScoringOutline: z.array(z.string()).min(4).max(6)
});

export const roleplayRequestSchema = z.object({
  eventId: z.string().min(1),
  clusterId: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]),
  industry: z.string().max(120).default("").optional().transform((value) => value ?? ""),
  instructionalAreaPreference: z
    .string()
    .max(120)
    .default("")
    .optional()
    .transform((value) => value ?? ""),
  specificPerformanceIndicatorIds: z.array(z.string()).default([]),
  numberOfPis: z.number().int().min(LIMITS.minPis).max(LIMITS.maxPis)
});

export const judgeRequestSchema = z.object({
  request: roleplayRequestSchema,
  participantRoleplay: participantRoleplaySchema,
  userResponse: z
    .string()
    .min(LIMITS.minResponseCharacters, "Your response is too short to judge meaningfully.")
});
