import type { DifficultyOption } from "@/types";

export const PARTICIPANT_INSTRUCTIONS = [
  "You will have up to 10 minutes to review this information and prepare your presentation.",
  "You may make notes to use during your presentation.",
  "You will have up to 10 minutes to make your presentation to the judge.",
  "You will be evaluated on how well you demonstrate the 21st Century Skills and meet the performance indicators."
];

export const SKILLS_21ST_CENTURY = [
  "Critical Thinking - Reason effectively and use systems thinking.",
  "Problem Solving - Make judgments and decisions and solve problems.",
  "Communication - Communicate clearly.",
  "Creativity and Innovation - Show evidence of creativity."
];

export const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  {
    value: "easy",
    label: "Easy",
    description: "Cleaner facts, fewer constraints, and a more straightforward decision."
  },
  {
    value: "medium",
    label: "Medium",
    description: "Balanced realism with tradeoffs, stakeholder expectations, and moderate complexity."
  },
  {
    value: "hard",
    label: "Hard",
    description: "Higher judge pressure, tighter constraints, and more specific follow-through required."
  }
];

export const LIMITS = {
  minResponseCharacters: 80,
  minPis: 3,
  maxPis: 7
};
