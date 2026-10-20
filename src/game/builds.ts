import { TALENTS, talentById } from '../content/talents';
import type { TalentId } from '../content/talents';
import { TALENT_TUNING } from '../content/talent-tuning';

export interface BuildValidation { valid: boolean; pointsSpent: number; errors: string[] }

export function validateBuild(build: unknown, budget: number = TALENT_TUNING.points): BuildValidation {
  if (!Array.isArray(build)) return { valid: false, pointsSpent: 0, errors: ['A build must be a list of talents.'] };
  const errors: string[] = [];
  const selected = new Set<string>();
  for (const id of build) {
    if (typeof id !== 'string' || !talentById(id)) { errors.push('Unknown talent.'); continue; }
    if (selected.has(id)) errors.push(`${talentById(id)!.name} is selected twice.`);
    selected.add(id);
    if (!talentById(id)!.implemented) errors.push(`${talentById(id)!.name} is coming soon.`);
  }
  if (selected.size > budget) errors.push(`Only ${budget} talent points are available.`);
  for (const id of selected) {
    for (const prerequisite of talentById(id)!.requires) {
      if (!selected.has(prerequisite)) errors.push(`${talentById(id)!.name} requires ${talentById(prerequisite)!.name}.`);
    }
  }
  return { valid: errors.length === 0, pointsSpent: selected.size, errors };
}

export function allocateTalent(build: readonly TalentId[], id: string): { build: TalentId[]; validation: BuildValidation } {
  const next = [...build, id];
  const validation = validateBuild(next);
  return { build: validation.valid ? next as TalentId[] : [...build], validation };
}

/** Refund descendants together so removing a prerequisite never leaves an invalid build. */
export function refundTalent(build: readonly TalentId[], id: string): TalentId[] {
  let next = build.filter((entry) => entry !== id);
  let changed = true;
  while (changed) {
    const kept = next.filter((entry) => talentById(entry)!.requires.every((parent) => next.includes(parent as TalentId)));
    changed = kept.length !== next.length;
    next = kept;
  }
  return next;
}

export const availableTalentCount = TALENTS.filter((talent) => talent.implemented).length;
