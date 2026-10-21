import { describe, expect, it } from 'vitest';
import { PROGRESSION_RULES } from '../src/content/upgrades';
import { TALENTS, talentById } from '../src/content/talents';
import type { TalentId } from '../src/content/talents';
import { validateBuild } from '../src/game/builds';
import { createRun } from '../src/game/state';
import { awardXp, chooseUpgrade } from '../src/game/progression';
import { getRunStats } from '../src/game/stats';
import { grantShield } from '../src/game/shields';
import { damagePlayer } from '../src/game/damage';
import { healPlayer } from '../src/game/healing';
import { applyDot } from '../src/game/dot-state';
import { resolveTalentEffects } from '../src/game/talent-effects';
import { tickRun } from '../src/game/run';
import { RULES } from '../src/game/rules';
import { EFFECT_LIMITS } from '../src/game/events';
import { enemy } from './fixtures';

function prerequisites(ids: readonly TalentId[]): TalentId[] {
  const selected = new Set<TalentId>();
  const add = (id: TalentId) => {
    for (const parent of talentById(id)!.requires) add(parent as TalentId);
    selected.add(id);
  };
  ids.forEach(add);
  return [...selected];
}
const pairs = TALENTS.flatMap((first, index) => TALENTS.slice(index + 1)
  .filter((second) => first.branch !== second.branch)
  .map((second) => ({ name: `${first.name} + ${second.name}`, ids: [first.id, second.id], build: prerequisites([first.id, second.id]) })))
  .filter(({ build }) => validateBuild(build, 10).valid);

describe('legal cross-branch release sweep', () => {
  it('covers every talent in an affordable cross-branch pair', () => {
    expect(new Set(pairs.flatMap(({ ids }) => ids))).toEqual(new Set(TALENTS.map((talent) => talent.id)));
  });

  it.each(pairs)('$name preserves allocation-order independence and bounded reactions', ({ build }) => {
    const runs = [createRun(42, build, 10), createRun(42, [...build].reverse(), 10)];
    for (const run of runs) {
      // Explicit fixture: earned-choice validation supplies a full legal run budget, not all maximum ranks.
      awardXp(run, 100_000);
      let choices = 0;
      while (run.status === 'choosing') {
        expect(chooseUpgrade(run, run.progression.offers[choices++ % run.progression.offers.length]!)).toBe(true);
      }
      expect(choices).toBe(PROGRESSION_RULES.maxLevel - 1);
      run.spawnIn = Infinity;
      for (let index = 0; index < 12; index++) {
        const angle = index * Math.PI / 6;
        const foe = enemy(run.nextId++, 180 + Math.cos(angle) * 50, 240 + Math.sin(angle) * 50);
        foe.health = foe.maxHealth = index < 2 ? 5 : 1000;
        foe.frost = 2; foe.holyMark = 2;
        for (const kind of ['poison', 'curse'] as const) applyDot(foe, {
          kind, school: kind === 'poison' ? 'poison' : 'shadow', owner: 'player', damage: 3,
          interval: 1, remaining: 0.5, tickIn: 0.25,
        });
        run.enemies.push(foe);
      }
      grantShield(run, 8, 3); damagePlayer(run, 9); healPlayer(run, 12); resolveTalentEffects(run);
      for (let tick = 0; tick < 120; tick++) {
        tickRun(run, { x: 0, y: 0 });
        expect(run.effects.processedThisTick).toBeLessThanOrEqual(EFFECT_LIMITS.perTick);
      }
      expect(run.status).toBe('running'); expect(run.kills).toBeGreaterThan(0);
      expect(run.enemies.length).toBeLessThanOrEqual(RULES.maxEnemies);
      expect(run.bolts.length).toBeLessThanOrEqual(RULES.maxBolts);
      expect(run.snares.length).toBeLessThanOrEqual(8);
      expect(run.shards.length).toBeLessThanOrEqual(RULES.maxShards);
      expect(run.sparks.length).toBeLessThanOrEqual(RULES.maxSparks);
      expect(run.effects.pending).toEqual([]); expect(run.effects.current).toBeNull();
      expect(run.player.health).toBeLessThanOrEqual(getRunStats(run.progression.ranks).maxHealth);
      for (const value of [run.player.health, run.player.shield.amount, ...run.enemies.flatMap((foe) =>
        [foe.x, foe.y, foe.health, ...foe.dots.flatMap((dot) => [dot.damage, dot.remaining, dot.tickIn])])]) {
        expect(Number.isFinite(value)).toBe(true); expect(value).toBeGreaterThanOrEqual(0);
      }
    }
    const [{ talents: first, ...result }, { talents: reversed, ...other }] = runs as [typeof runs[number], typeof runs[number]];
    expect(first).toEqual([...reversed].reverse());
    expect(result).toEqual(other);
  });
});
