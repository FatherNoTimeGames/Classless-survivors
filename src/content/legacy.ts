/** Permanent progression broadens builds; there are no permanent combat-stat upgrades. */
export const LEGACY = {
  startingPoints: 8, pointMilestones: [2, 5], startingInsight: 2,
  slots: 3, researchCost: 1, maxRuns: 1_000_000, maxRunId: 1_000_000_000,
  maxBackupLength: 32_768, maxRunSeconds: 3600,
} as const;
