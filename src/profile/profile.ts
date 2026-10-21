import { TALENTS, talentById } from '../content/talents';
import type { TalentId } from '../content/talents';
import { LEGACY } from '../content/legacy';
import { validateBuild } from '../game/builds';

export interface BuildSlot { name: string; talents: TalentId[] }
export interface RunSummary { outcome: 'defeat' | 'victory'; seconds: number; kills: number; xp: number }
export interface RunRecord extends RunSummary { id: number; insight: number; points: number }
export interface Profile {
  version: 2; revision: number; completedRuns: number; insight: number;
  unlocked: TalentId[]; draft: TalentId[]; slots: BuildSlot[];
  nextRunId: number; activeRun: number | null; bestSeconds: number; lastResult: RunRecord | null;
}
export const RESEARCH_TALENTS = TALENTS.filter((talent) => talent.tier === 3).map((talent) => talent.id);
export const MAX_POINTS = LEGACY.startingPoints + LEGACY.pointMilestones.length;
export function newProfile(): Profile {
  return { version: 2, revision: 0, completedRuns: 0, insight: LEGACY.startingInsight,
    unlocked: [], draft: [], slots: Array.from({ length: LEGACY.slots }, (_, i) => ({ name: `Build ${i + 1}`, talents: [] })),
    nextRunId: 1, activeRun: null, bestSeconds: 0, lastResult: null };
}
export const talentBudget = (profile: Profile) => LEGACY.startingPoints + LEGACY.pointMilestones.filter((count) => profile.completedRuns >= count).length;
export const isUnlocked = (profile: Profile, id: TalentId) => talentById(id)!.tier < 3 || profile.unlocked.includes(id);
export function validProfileBuild(profile: Profile, build: unknown): build is TalentId[] {
  return validateBuild(build, talentBudget(profile)).valid && (build as TalentId[]).every((id) => isUnlocked(profile, id));
}
export function setDraft(profile: Profile, build: TalentId[]): Profile | null {
  return profile.activeRun === null && validProfileBuild(profile, build) ? { ...profile, draft: [...build] } : null;
}
export function research(profile: Profile, id: TalentId): Profile | null {
  if (profile.activeRun !== null || !RESEARCH_TALENTS.includes(id as typeof RESEARCH_TALENTS[number]) || isUnlocked(profile, id) || profile.insight < LEGACY.researchCost) return null;
  return { ...profile, insight: profile.insight - LEGACY.researchCost, unlocked: [...profile.unlocked, id] };
}
export function saveSlot(profile: Profile, index: number, name: string): Profile | null {
  const clean = name.trim();
  if (profile.activeRun !== null || !Number.isInteger(index) || !profile.slots[index] || !clean || clean.length > 32) return null;
  return { ...profile, slots: profile.slots.map((slot, i) => i === index ? { name: clean, talents: [...profile.draft] } : slot) };
}
export function loadSlot(profile: Profile, index: number): Profile | null {
  const slot = profile.slots[index];
  return profile.activeRun === null && slot ? setDraft(profile, slot.talents) : null;
}
export function beginProfileRun(profile: Profile): Profile | null {
  if (profile.activeRun !== null || profile.nextRunId >= LEGACY.maxRunId || !validProfileBuild(profile, profile.draft)) return null;
  return { ...profile, activeRun: profile.nextRunId, nextRunId: profile.nextRunId + 1 };
}
export function validSummary(summary: RunSummary): boolean {
  return (summary.outcome === 'defeat' || summary.outcome === 'victory') && Number.isFinite(summary.seconds)
    && summary.seconds >= 0 && summary.seconds <= LEGACY.maxRunSeconds
    && Number.isSafeInteger(summary.kills) && summary.kills >= 0 && summary.kills <= 10_000_000
    && Number.isSafeInteger(summary.xp) && summary.xp >= 0 && summary.xp <= 1_000_000_000;
}
/** Identity and consumption live in the same save transaction as the reward. */
export function finishProfileRun(profile: Profile, id: number, summary: RunSummary): Profile | null {
  if (profile.activeRun !== id || !validSummary(summary)) return null;
  const available = Math.max(0, RESEARCH_TALENTS.length - profile.unlocked.length - profile.insight);
  const insight = Math.min(available, 1 + Math.min(2, Math.floor(summary.seconds / 120)) + (summary.outcome === 'victory' ? 2 : 0));
  const next = { ...profile, activeRun: null, completedRuns: Math.min(LEGACY.maxRuns, profile.completedRuns + 1),
    insight: profile.insight + insight, bestSeconds: Math.max(profile.bestSeconds, summary.seconds) };
  const result: RunRecord = { ...summary, id, insight, points: talentBudget(next) - talentBudget(profile) };
  return { ...next, lastResult: result };
}

/** Consume the active identity without progression; abandoning cannot farm rewards. */
export function abandonProfileRun(profile: Profile, id: number): Profile | null {
  return profile.activeRun === id ? { ...profile, activeRun: null } : null;
}
