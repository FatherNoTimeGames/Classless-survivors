import { describe, expect, it } from 'vitest';
import { PROGRESSION_RULES, UPGRADES } from '../src/content/upgrades';
import type { UpgradeId } from '../src/content/upgrades';
import { awardXp, choiceLevel, chooseUpgrade, eligibleUpgrades, xpForLevel } from '../src/game/progression';
import { getRunStats } from '../src/game/stats';
import { createRun } from '../src/game/state';
import type { Run } from '../src/game/state';
import { tickRun } from '../src/game/run';
import { RULES } from '../src/game/rules';
import { advance, bolt, emptyRun, enemy, STILL } from './fixtures';

function select(run: Run, id: UpgradeId): void {
  const definition = UPGRADES.find((entry) => entry.id === id)!;
  run.progression.level = definition.minLevel;
  run.progression.pendingLevels = 1;
  run.progression.offers = [id];
  run.status = 'choosing';
  expect(chooseUpgrade(run, id)).toBe(true);
}

describe('XP and reward selection', () => {
  it('crosses exact XP thresholds and offers three distinct, eligible choices with a weapon', () => {
    const run = createRun(123);
    const spawnRandom = run.randomState;
    awardXp(run, 9);
    expect(run.progression.level).toBe(1);
    expect(run.status).toBe('running');
    awardXp(run, 1);
    expect(run.progression.level).toBe(2);
    expect(run.progression.xpIntoLevel).toBe(0);
    expect(run.progression.pendingLevels).toBe(1);
    expect(run.status).toBe('choosing');
    expect(new Set(run.progression.offers).size).toBe(3);
    expect(run.progression.offers).toContain('haste');
    expect(run.progression.offers.every((id) => eligibleUpgrades(2, {}).some((entry) => entry.id === id))).toBe(true);
    expect(run.randomState).toBe(spawnRandom);
  });

  it('queues every earned reward and preserves excess XP across successive choices', () => {
    const run = createRun(9);
    const amount = xpForLevel(1) + xpForLevel(2) + xpForLevel(3) + 5;
    awardXp(run, amount);
    expect(run.progression.level).toBe(4);
    expect(run.progression.pendingLevels).toBe(3);
    expect(choiceLevel(run)).toBe(2);
    expect(run.progression.offers).not.toContain('fork');
    chooseUpgrade(run, 'haste');
    expect(choiceLevel(run)).toBe(3);
    expect(run.status).toBe('choosing');
    expect(run.progression.offers).not.toContain('burst');
    chooseUpgrade(run, run.progression.offers[0]!);
    expect(choiceLevel(run)).toBe(4);
    chooseUpgrade(run, run.progression.offers[0]!);
    expect(run.status).toBe('running');
    expect(run.progression.pendingLevels).toBe(0);
    expect(run.progression.xpIntoLevel).toBe(5);
    expect(run.xp).toBe(amount);
    expect(Object.values(run.progression.ranks).reduce((sum, rank) => sum + rank, 0)).toBe(3);
  });

  it('rejects unknown, unoffered, capped, repeated, and post-death selections without changing state', () => {
    const run = createRun(5);
    expect(chooseUpgrade(run, 'haste')).toBe(false);
    awardXp(run, 10);
    const snapshot = structuredClone(run);
    for (const id of ['unknown', 'burst']) expect(chooseUpgrade(run, id)).toBe(false);
    expect(run).toEqual(snapshot);
    chooseUpgrade(run, 'haste');
    expect(chooseUpgrade(run, 'haste')).toBe(false);
    run.status = 'choosing';
    run.progression.offers = ['haste'];
    expect(chooseUpgrade(run, 'haste')).toBe(false);
    run.progression.pendingLevels = 1;
    run.progression.ranks.haste = 4;
    expect(chooseUpgrade(run, 'haste')).toBe(false);
    run.status = 'defeated';
    const dead = structuredClone(run);
    awardXp(run, 100);
    expect(chooseUpgrade(run, 'haste')).toBe(false);
    expect(run).toEqual(dead);
  });

  it('freezes the whole simulation during a choice and prioritizes a level reward over contact', () => {
    const run = emptyRun();
    run.player.health = RULES.contactDamage;
    run.player.attackIn = 10;
    run.enemies.push(enemy(101, 180, 240));
    run.shards.push({ id: 102, x: 180, y: 240, value: 10 });
    tickRun(run, STILL);
    expect(run.status).toBe('choosing');
    expect(run.player.health).toBe(RULES.contactDamage);
    const paused = structuredClone(run);
    advance(run, 5, { x: 1, y: 1 });
    expect(run).toEqual(paused);
    chooseUpgrade(run, 'haste');
    tickRun(run, STILL);
    expect(run.status).toBe('defeated');
  });

  it('handles huge XP awards, capped offers, and the final level without trapping progression', () => {
    const run = createRun(12);
    awardXp(run, 1_000_000);
    expect(run.progression.level).toBe(PROGRESSION_RULES.maxLevel);
    let selected = 0;
    while (run.status === 'choosing' && selected < 100) {
      expect(run.progression.offers.length).toBeGreaterThan(0);
      for (const id of run.progression.offers) {
        const definition = UPGRADES.find((entry) => entry.id === id)!;
        expect(run.progression.ranks[id] ?? 0).toBeLessThan(definition.maxRank);
      }
      chooseUpgrade(run, run.progression.offers[0]!);
      selected++;
    }
    expect(selected).toBe(PROGRESSION_RULES.maxLevel - 1);
    expect(run.status).toBe('running');
    expect(run.progression.pendingLevels).toBe(0);
    expect(run.progression.offers).toEqual([]);
    for (const definition of UPGRADES) expect(run.progression.ranks[definition.id]).toBe(definition.maxRank);
    awardXp(run, 100);
    expect(run.xp).toBe(1_000_100);
    expect(run.status).toBe('running');
    expect(run.progression.xpIntoLevel).toBe(0);
  });

  it('keeps offers reproducible, varied across seeds, and obeying rarity unlocks', () => {
    const first = createRun(33);
    const second = createRun(33);
    for (const run of [first, second]) awardXp(run, 10);
    expect(first.progression.offers).toEqual(second.progression.offers);
    const variations = new Set<string>();
    for (let seed = 1; seed <= 50; seed++) {
      const run = createRun(seed * 1729);
      awardXp(run, 10);
      variations.add(run.progression.offers.join(','));
    }
    expect(variations.size).toBeGreaterThan(3);
    expect(eligibleUpgrades(2, {}).every((entry) => entry.rarity === 'common')).toBe(true);
    expect(eligibleUpgrades(3, {}).some((entry) => entry.rarity === 'uncommon')).toBe(true);
    expect(eligibleUpgrades(3, {}).some((entry) => entry.rarity === 'rare')).toBe(false);
    expect(eligibleUpgrades(4, {}).some((entry) => entry.id === 'burst')).toBe(true);
  });

  it('ignores invalid XP and resets XP, choices, and all upgrades on a fresh run', () => {
    const run = createRun(2);
    for (const amount of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) awardXp(run, amount);
    expect(run.xp).toBe(0);
    awardXp(run, 100);
    chooseUpgrade(run, run.progression.offers[0]!);
    const fresh = createRun(2);
    expect(fresh.progression).toEqual(createRun(2).progression);
    expect(fresh.progression.ranks).toEqual({});
    expect(fresh.progression.level).toBe(1);
    expect(fresh.xp).toBe(0);
    expect(fresh.progression.pendingLevels).toBe(0);
  });

  it('weights rare offers below common offers in a reproducible sample after unlocking both', () => {
    const counts = { common: 0, uncommon: 0, rare: 0 };
    for (let seed = 1; seed <= 256; seed++) {
      const run = createRun(seed * 1729);
      run.progression.level = 4;
      run.progression.pendingLevels = 1;
      awardXp(run, 1);
      for (const id of run.progression.offers) counts[UPGRADES.find((entry) => entry.id === id)!.rarity]++;
    }
    expect(counts.rare).toBeGreaterThan(0);
    expect(counts.common).toBeGreaterThan(counts.rare * 3);
  });
});

describe('every upgrade changes actual gameplay', () => {
  it('Quickened Ember fires more often within the same simulation time', () => {
    const base = emptyRun();
    const faster = emptyRun();
    select(faster, 'haste');
    for (const run of [base, faster]) {
      run.enemies.push({ ...enemy(101, 180, 340), health: 1000, grace: 100 });
      advance(run, 5);
    }
    expect(faster.enemies[0]!.health).toBeLessThan(base.enemies[0]!.health);
  });

  it('Fleetfoot moves farther while Soul Gatherer attracts otherwise unreachable shards', () => {
    const base = emptyRun();
    const faster = emptyRun();
    select(faster, 'fleet');
    for (const run of [base, faster]) advance(run, 0.5, { x: 1, y: 0 });
    expect(faster.player.x).toBeGreaterThan(base.player.x + 5);
    const magnet = emptyRun();
    select(magnet, 'magnet');
    const plain = emptyRun();
    for (const run of [plain, magnet]) {
      run.shards.push({ id: 101, x: 250, y: 240, value: 5 });
      advance(run, 1);
    }
    expect(plain.xp).toBe(0);
    expect(magnet.xp).toBe(5);
  });

  it('Living Ember raises maximum health and heals exactly once', () => {
    const run = emptyRun();
    run.player.health = 24;
    select(run, 'vitality');
    expect(run.player.health).toBe(36);
    expect(getRunStats(run.progression.ranks).maxHealth).toBe(72);
    expect(chooseUpgrade(run, 'vitality')).toBe(false);
    advance(run, 1);
    expect(run.player.health).toBe(36);
    expect(createRun(123).player.health).toBe(60);
  });

  it('Forked Ember fires separate bolts at distinct targets and still respects the projectile cap', () => {
    const run = emptyRun();
    select(run, 'fork');
    run.enemies.push(enemy(101, 260, 240), enemy(102, 180, 320));
    tickRun(run, STILL);
    expect(run.bolts).toHaveLength(2);
    expect(new Set(run.bolts.map((entry) => `${entry.vx},${entry.vy}`)).size).toBe(2);
    run.bolts = Array.from({ length: RULES.maxBolts - 1 }, (_, id) => bolt({ id, x: 20, y: 400, vx: 1 }));
    run.player.attackIn = 0;
    tickRun(run, STILL);
    expect(run.bolts).toHaveLength(RULES.maxBolts);
  });

  it('Soul Needle hits multiple swept targets, but never hits the same enemy twice', () => {
    const run = emptyRun();
    select(run, 'pierce');
    run.player.attackIn = 10;
    run.enemies.push(enemy(101, 100, 100), enemy(102, 140, 100));
    run.bolts.push(bolt({ x: 60, vx: 6000, pierce: getRunStats(run.progression.ranks).pierce }));
    tickRun(run, STILL);
    expect(run.kills).toBe(2);
    const overlap = emptyRun();
    overlap.player.attackIn = 10;
    overlap.enemies.push({ ...enemy(101, 100, 100), health: 100, grace: 100 });
    overlap.bolts.push(bolt({ pierce: 1 }));
    advance(overlap, 0.2);
    expect(overlap.enemies[0]!.health).toBe(82);
  });

  it('Ashburst damages neighbors at half damage, stays in range, and never chains', () => {
    const run = emptyRun();
    select(run, 'burst');
    run.player.attackIn = 10;
    run.enemies.push(enemy(101, 100, 100), enemy(102, 110, 100), enemy(103, 129, 100));
    run.bolts.push(bolt({ blastRadius: getRunStats(run.progression.ranks).blastRadius }));
    tickRun(run, STILL);
    expect(run.kills).toBe(1);
    expect(run.enemies.find((entry) => entry.id === 102)!.health).toBe(9);
    expect(run.enemies.find((entry) => entry.id === 103)!.health).toBe(18);
    expect(run.sparks.filter((entry) => entry.kind === 'burst')).toHaveLength(1);
  });

  it('piercing plus explosions credit overlapping deaths once and preserve XP', () => {
    const run = emptyRun();
    run.player.attackIn = 10;
    run.enemies.push(enemy(101, 100, 100), { ...enemy(102, 110, 100), health: 9 }, { ...enemy(103, 119, 100), health: 9 });
    run.bolts.push(bolt({ pierce: 2, blastRadius: 20 }));
    tickRun(run, STILL);
    expect(run.kills).toBe(3);
    expect(run.shards.reduce((sum, shard) => sum + shard.value, run.xp)).toBe(15);
    expect(run.enemies).toEqual([]);
  });

  it('applies a newly selected projectile upgrade to new bolts while preserving existing shots', () => {
    const run = emptyRun();
    run.enemies.push({ ...enemy(101, 180, 340), health: 100, grace: 100 });
    tickRun(run, STILL);
    const existing = run.bolts[0]!;
    select(run, 'pierce');
    expect(existing.pierce).toBe(0);
    run.player.attackIn = 0;
    tickRun(run, STILL);
    expect(run.bolts.find((entry) => entry.id !== existing.id)!.pierce).toBe(1);
    expect(existing.pierce).toBe(0);
  });
});
