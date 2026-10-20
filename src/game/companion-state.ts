import { COMPANIONS } from '../content/companions';
import type { CompanionKind } from '../content/companions';
import type { TalentId } from '../content/talents';
import type { Companion, Point } from './state';

/** Initialization stays separate from attack code to keep state construction acyclic. */
export function createCompanions(talents: readonly TalentId[], player: Point): Companion[] {
  return (Object.keys(COMPANIONS) as CompanionKind[]).filter((kind) => talents.includes(COMPANIONS[kind].talent))
    .map((kind, index) => ({
      id: -1 - index, kind, x: player.x + COMPANIONS[kind].offsetX, y: player.y + COMPANIONS[kind].offsetY,
      attackIn: 0, targetId: null, bonusDamage: 0,
    }));
}
