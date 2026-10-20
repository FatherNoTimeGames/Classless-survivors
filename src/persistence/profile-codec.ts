import { LEGACY } from '../content/legacy';
import { newProfile, RESEARCH_TALENTS, validProfileBuild, validSummary } from '../profile/profile';
import type { Profile, RunRecord } from '../profile/profile';
import { validateBuild } from '../game/builds';
import type { TalentId } from '../content/talents';

const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const integer = (value: unknown, max: number): value is number => Number.isSafeInteger(value) && (value as number) >= 0 && (value as number) <= max;
export type Decoded = { ok: true; profile: Profile; notices: string[]; repaired?: true } | { ok: false; reason: string; future?: boolean };

/** Reconstruct known fields only; never trust imported objects as application state. */
export function decodeProfile(text: string): Decoded {
  if (text.length > LEGACY.maxBackupLength) return { ok: false, reason: 'Backup is too large.' };
  let data: unknown;
  try { data = JSON.parse(text); } catch { return { ok: false, reason: 'Backup is not valid JSON.' }; }
  if (!object(data)) return { ok: false, reason: 'Backup must contain a profile.' };
  if (typeof data.version === 'number' && data.version > 2) return { ok: false, reason: 'This save needs a newer game version. Original data has been preserved.', future: true };
  if (data.version === 1) {
    // Supported early format: a build and completed-run count, no combat snapshot.
    if (!validateBuild(data.build).valid || !integer(data.completedRuns, LEGACY.maxRuns)) return { ok: false, reason: 'Legacy save is invalid.' };
    const profile = newProfile();
    profile.completedRuns = data.completedRuns;
    profile.nextRunId = data.completedRuns + 1;
    profile.draft = [...data.build as TalentId[]];
    profile.unlocked = RESEARCH_TALENTS.filter((id) => profile.draft.includes(id));
    profile.insight = Math.min(LEGACY.startingInsight, RESEARCH_TALENTS.length - profile.unlocked.length);
    return { ok: true, profile, notices: ['Updated an early save to the current format.'] };
  }
  if (data.version !== 2 || !integer(data.revision, LEGACY.maxRevision) || !integer(data.completedRuns, LEGACY.maxRuns)
    || !integer(data.insight, RESEARCH_TALENTS.length) || !integer(data.nextRunId, LEGACY.maxRunId) || data.nextRunId < 1
    || (data.activeRun !== null && (!integer(data.activeRun, LEGACY.maxRunId) || data.activeRun < 1 || data.activeRun !== data.nextRunId - 1))
    || typeof data.bestSeconds !== 'number' || !Number.isFinite(data.bestSeconds) || data.bestSeconds < 0 || data.bestSeconds > LEGACY.maxRunSeconds
    || !Array.isArray(data.unlocked) || data.unlocked.length > RESEARCH_TALENTS.length
    || new Set(data.unlocked).size !== data.unlocked.length || !data.unlocked.every((id) => RESEARCH_TALENTS.includes(id))
    || data.insight + data.unlocked.length > RESEARCH_TALENTS.length) return { ok: false, reason: 'Progression data is invalid.' };
  const profile: Profile = { version: 2, revision: data.revision, completedRuns: data.completedRuns, insight: data.insight,
    nextRunId: data.nextRunId, activeRun: data.activeRun as number | null, bestSeconds: data.bestSeconds,
    unlocked: [...data.unlocked] as TalentId[], draft: [], slots: newProfile().slots, lastResult: null };
  if (data.lastResult !== null) {
    const result = data.lastResult;
    if (!object(result) || !validSummary(result as unknown as RunRecord) || !integer(result.id, LEGACY.maxRunId) || result.id < 1
      || result.id >= profile.nextRunId || result.id === profile.activeRun || !integer(result.insight, 5) || !integer(result.points, 2)) return { ok: false, reason: 'Run result data is invalid.' };
    profile.lastResult = { outcome: result.outcome as RunRecord['outcome'], seconds: result.seconds as number, kills: result.kills as number,
      xp: result.xp as number, id: result.id, insight: result.insight, points: result.points };
  }
  const notices: string[] = [];
  if (validProfileBuild(profile, data.draft)) profile.draft = [...data.draft];
  else notices.push('An invalid active build was cleared; progression was retained.');
  if (!Array.isArray(data.slots) || data.slots.length !== LEGACY.slots) notices.push('Invalid build slots were reset; progression was retained.');
  else profile.slots = data.slots.map((slot, index) => {
    if (!object(slot) || typeof slot.name !== 'string' || !slot.name.trim() || slot.name.length > 32 || !validProfileBuild(profile, slot.talents)) {
      notices.push(`Build slot ${index + 1} was reset; progression was retained.`); return newProfile().slots[index]!;
    }
    return { name: slot.name.trim(), talents: [...slot.talents] };
  });
  return { ok: true, profile, notices, ...(notices.length ? { repaired: true as const } : {}) };
}
export const encodeProfile = (profile: Profile) => JSON.stringify(profile, null, 2);
