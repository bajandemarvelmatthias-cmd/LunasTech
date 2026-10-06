// Display names for learning_level 0 to 4 (decision-log.md #4 sets the levels).
// Names for levels 1 to 4 are a delegated default, see open-questions.md #17.
const LEVEL_NAMES = ["Beginner", "Apprentice", "Practitioner", "Skilled", "Expert"] as const;

export function levelName(level: number): string {
  return LEVEL_NAMES[Math.min(Math.max(level, 0), LEVEL_NAMES.length - 1)];
}
