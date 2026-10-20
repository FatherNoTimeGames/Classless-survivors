import { describe, expect, it } from 'vitest';
import { BRANCHES, TALENTS, talentById } from '../src/content/talents';
import type { TalentId } from '../src/content/talents';
import { allocateTalent, refundTalent, validateBuild } from '../src/game/builds';
import { createRun } from '../src/game/state';
import { damageEnemy, damagePlayer } from '../src/game/damage';
import { healPlayer } from '../src/game/healing';
import { resolveTalentEffects, TALENT_IMPLEMENTATIONS } from '../src/game/talent-effects';
import { updateAttacks } from '../src/game/combat';
import { getRunStats } from '../src/game/stats';
import { tickRun } from '../src/game/run';
import { awardXp, chooseUpgrade } from '../src/game/progression';
import { enemy, STILL } from './fixtures';

function runWith(talents: TalentId[]) {
  const run = createRun(123, talents);
  run.spawnIn = Number.POSITIVE_INFINITY;
  return run;
}

describe('talent catalog and build rules', () => {
  it('defines six complete, acyclic branch designs and registers every playable talent', () => {
    expect(TALENTS).toHaveLength(36);
    expect(new Set(TALENTS.map((talent) => talent.id)).size).toBe(36);
    for (const branch of BRANCHES) expect(TALENTS.filter((talent) => talent.branch === branch.id)).toHaveLength(6);
    const visit = (id: string, ancestors: string[]) => {
      expect(ancestors).not.toContain(id);
      const talent = talentById(id);
      expect(talent).toBeDefined();
      for (const parent of talent!.requires) {
        expect(talentById(parent)!.tier).toBeLessThan(talent!.tier);
        visit(parent, [...ancestors, id]);
      }
    };
    for (const talent of TALENTS) visit(talent.id, []);
    expect(Object.keys(TALENT_IMPLEMENTATIONS).sort()).toEqual(TALENTS.filter((talent) => talent.implemented).map((talent) => talent.id).sort());
    expect(TALENTS.filter((talent) => talent.implemented)).toHaveLength(27);
  });

  it('permits mixed branches, an empty starter build, and unordered valid prerequisites', () => {
    expect(validateBuild([]).valid).toBe(true);
    expect(validateBuild(['reprisal', 'arcane-echo', 'expose-weakness']).valid).toBe(true);
    expect(validateBuild(['searing-grace', 'communion', 'hunting-momentum']).valid).toBe(true);
  });

  it('rejects unknown, duplicate, unavailable, over-budget, and prerequisite-breaking builds', () => {
    for (const build of [null, 'reprisal', [42], ['unknown'], ['reprisal', 'reprisal'], ['venom-edge'], ['sweeping-blade'], ['searing-grace'], ['reprisal', 'sweeping-blade', 'spellsteel', 'arcane-echo', 'expose-weakness', 'communion', 'soul-cinder', 'hunting-momentum', 'searing-grace']]) {
      expect(validateBuild(build).valid, JSON.stringify(build)).toBe(false);
    }
    expect(validateBuild(['searing-grace']).errors.join(' ')).toContain('Ember Communion');
  });

  it('allocates without mutating the prior build and leaves failed allocations untouched', () => {
    const original: TalentId[] = ['communion'];
    const success = allocateTalent(original, 'searing-grace');
    expect(success.build).toEqual(['communion', 'searing-grace']);
    expect(original).toEqual(['communion']);
    const failed = allocateTalent(original, 'sweeping-blade');
    expect(failed.validation.valid).toBe(false);
    expect(failed.build).toEqual(original);
  });

  it('refunds dependent talents together and preserves unrelated branches at no cost', () => {
    const build: TalentId[] = ['communion', 'searing-grace', 'arcane-echo'];
    expect(refundTalent(build, 'communion')).toEqual(['arcane-echo']);
    expect(refundTalent(build, 'searing-grace')).toEqual(['communion', 'arcane-echo']);
    expect(build).toHaveLength(3);
    expect(allocateTalent(refundTalent(build, 'communion'), 'reprisal').validation.valid).toBe(true);
  });

  it('snapshots a validated build and resets all proc memory on the next run', () => {
    const build: TalentId[] = ['hunting-momentum'];
    const run = createRun(123, build);
    build.push('reprisal');
    expect(run.talents).toEqual(['hunting-momentum']);
    run.talentMemory.huntingCharge = true;
    expect(createRun(123, build).talentMemory.huntingCharge).toBe(false);
    expect(() => createRun(1, ['searing-grace'])).toThrow('Invalid talent build');
    expect(() => createRun(1, ['sanctuary'])).toThrow('coming soon');
  });
});

describe('functioning foundation talents', () => {
  it('Iron Reprisal retaliates after surviving contact and respects contact protection', () => {
    const run = runWith(['reprisal']);
    run.player.attackIn = 10;
    run.enemies.push({ ...enemy(101, 180, 240), health: 36, maxHealth: 36 });
    tickRun(run, STILL);
    expect(run.player.health).toBe(48);
    expect(run.enemies[0]!.health).toBe(24);
    expect(run.sparks.some((spark) => spark.kind === 'physical')).toBe(true);
    tickRun(run, STILL);
    expect(run.enemies[0]!.health).toBe(24);
    const fatal = runWith(['reprisal']);
    fatal.player.health = 12;
    fatal.player.attackIn = 10;
    fatal.enemies.push({ ...enemy(101, 180, 240), health: 36, maxHealth: 36 });
    tickRun(fatal, STILL);
    expect(fatal.status).toBe('defeated');
    expect(fatal.enemies[0]!.health).toBe(36);
  });

  it('Arcane Echo triggers on the third direct hit, seeks another enemy, and cannot count itself', () => {
    const run = runWith(['arcane-echo']);
    const primary = { ...enemy(101, 200, 240), health: 100, maxHealth: 100 };
    const secondary = enemy(102, 240, 240);
    const far = enemy(103, 340, 240);
    run.enemies.push(primary, secondary, far);
    for (let hit = 0; hit < 3; hit++) damageEnemy(run, primary, 1);
    resolveTalentEffects(run);
    expect(primary.health).toBe(97);
    expect(secondary.health).toBe(9);
    expect(far.health).toBe(18);
    expect(run.talentMemory.arcaneHits).toBe(0);
    damageEnemy(run, primary, 1);
    resolveTalentEffects(run);
    expect(run.talentMemory.arcaneHits).toBe(1);
  });

  it('Expose Weakness improves wounded non-periodic hits, including blasts, but excludes periodic ticks', () => {
    const run = runWith(['expose-weakness']);
    run.player.attackIn = 0.7;
    const target = { ...enemy(101, 200, 240), health: 36, maxHealth: 36 };
    damageEnemy(run, target, 10);
    expect(target.health).toBe(26);
    expect(run.player.attackIn).toBe(0.7);
    damageEnemy(run, target, 10, { source: 'blast' });
    expect(target.health).toBe(10);
    expect(run.player.attackIn).toBeCloseTo(0.55);
    damageEnemy(run, target, 1, { source: 'dot' });
    expect(target.health).toBe(9);
    expect(run.player.attackIn).toBeCloseTo(0.55);
    damageEnemy(run, target, 1);
    expect(target.health).toBe(2);
    expect(run.player.attackIn).toBeCloseTo(0.4);
  });

  it('Ember Communion heals after four direct kills; Searing Grace turns actual healing into offense', () => {
    const run = runWith(['communion', 'searing-grace']);
    run.player.health = 54;
    const survivor = enemy(200, 220, 240);
    run.enemies.push(survivor);
    for (let id = 1; id <= 4; id++) damageEnemy(run, enemy(id, 20, 20), 18);
    resolveTalentEffects(run);
    expect(run.player.health).toBe(57);
    expect(survivor.health).toBe(12);
    expect(run.talentMemory.communionKills).toBe(0);
    expect(run.sparks.some((spark) => spark.kind === 'holy')).toBe(true);
  });

  it('overhealing and death cannot generate healing attacks or resurrect the player', () => {
    const run = runWith(['communion', 'searing-grace']);
    const target = enemy(101, 220, 240);
    run.enemies.push(target);
    expect(healPlayer(run, 3)).toBe(0);
    resolveTalentEffects(run);
    expect(target.health).toBe(18);
    run.player.health = 0;
    run.status = 'defeated';
    expect(healPlayer(run, 3)).toBe(0);
    resolveTalentEffects(run);
    expect(target.health).toBe(18);
  });

  it('Living Ember upgrades use the same actual-healing hook as talent healing', () => {
    const run = runWith(['communion', 'searing-grace']);
    run.player.health = 40;
    const target = { ...enemy(101, 220, 240), health: 36, maxHealth: 36 };
    run.enemies.push(target);
    awardXp(run, 10);
    run.progression.offers = ['vitality'];
    expect(chooseUpgrade(run, 'vitality')).toBe(true);
    expect(run.player.health).toBe(52);
    resolveTalentEffects(run);
    expect(target.health).toBe(30);
  });

  it('Soul Cinder bursts on every fourth direct kill without counting its own kills', () => {
    const run = runWith(['soul-cinder']);
    const neighbor = { ...enemy(200, 110, 100), health: 9 };
    run.enemies.push(neighbor);
    for (let id = 1; id <= 4; id++) damageEnemy(run, enemy(id, 100, 100), 18);
    resolveTalentEffects(run);
    expect(run.kills).toBe(5);
    expect(neighbor.health).toBe(0);
    expect(run.talentMemory.cinderKills).toBe(0);
    expect(run.sparks.filter((spark) => spark.kind === 'shadow')).toHaveLength(1);
    expect(run.effects.pending).toEqual([]);
  });

  it('Hunting Momentum stores one bonus, waits for enough targets, then fires one extra bolt', () => {
    const run = runWith(['hunting-momentum']);
    damageEnemy(run, enemy(99, 20, 20), 18);
    damageEnemy(run, enemy(100, 20, 20), 18);
    resolveTalentEffects(run);
    run.enemies.push(enemy(101, 260, 240));
    updateAttacks(run, getRunStats({}));
    expect(run.bolts).toHaveLength(1);
    expect(run.talentMemory.huntingCharge).toBe(true);
    run.player.attackIn = 0;
    run.enemies.push(enemy(102, 180, 320));
    updateAttacks(run, getRunStats({}));
    expect(run.bolts).toHaveLength(3);
    expect(run.talentMemory.huntingCharge).toBe(false);
  });

  it('Warrior retaliation primes Rogue wounds to finish a target the unmodified ember cannot kill', () => {
    for (const rogue of [false, true]) {
      const run = runWith(rogue ? ['reprisal', 'expose-weakness'] : ['reprisal']);
      const target = { ...enemy(101, 180, 240), health: 36, maxHealth: 36 };
      run.enemies.push(target);
      damagePlayer(run, 12);
      resolveTalentEffects(run);
      expect(target.health).toBe(24);
      damageEnemy(run, target, 18);
      expect(target.health).toBe(rogue ? 0 : 6);
      expect(run.kills).toBe(rogue ? 1 : 0);
    }
  });

  it('Priest healing primes Rogue damage and talent kills cannot feed direct-kill healing loops', () => {
    const run = runWith(['communion', 'searing-grace', 'expose-weakness']);
    run.player.health = 50;
    const target = { ...enemy(101, 220, 240), health: 36, maxHealth: 36 };
    run.enemies.push(target);
    healPlayer(run, 2);
    resolveTalentEffects(run);
    expect(target.health).toBe(30);
    damageEnemy(run, target, 18);
    expect(target.health).toBe(6);
    healPlayer(run, 2);
    resolveTalentEffects(run);
    expect(target.health).toBe(0);
    expect(run.talentMemory.communionKills).toBe(0);
    expect(run.effects.dropped).toBe(0);
  });
});
