import { describe, expect, it } from 'vitest';
import { BALANCE_ROUTES } from '../analysis/routes';
import { simulateRoute } from '../analysis/simulation';
import { denseWorkload } from '../analysis/workload';
import { createRun } from '../src/game/state';
import { awardXp, chooseUpgrade, choiceLevel, eligibleUpgrades } from '../src/game/progression';
import { getRunStats } from '../src/game/stats';
import { RULES } from '../src/game/rules';
import { tickRun } from '../src/game/run';
import { PROGRESSION_RULES, UPGRADES } from '../src/content/upgrades';
import { EFFECT_LIMITS } from '../src/game/events';
import { updateProjectiles } from '../src/game/combat';
import { resolveTalentEffects } from '../src/game/talent-effects';
import { damageEnemy } from '../src/game/damage';
import { enemy } from './fixtures';

describe('balance and survival choices', () => {
  it('keeps an eligible weapon and survival option across seeds, narrow builds and exhausted pools', () => {
    for (let seed = 1; seed <= 64; seed++) {
      const run = createRun(seed * 1729, seed % 2 ? [] : ['reprisal', 'sweeping-blade']);
      const spawnRandom = run.randomState;
      awardXp(run, 100_000);
      while (run.status === 'choosing') {
        const pool = eligibleUpgrades(choiceLevel(run), run.progression.ranks, run.talents);
        const offered = UPGRADES.filter((upgrade) => run.progression.offers.includes(upgrade.id));
        expect(new Set(run.progression.offers).size).toBe(run.progression.offers.length);
        for (const category of ['weapon', 'survival'] as const) {
          if (pool.some((upgrade) => upgrade.category === category)) expect(offered.some((upgrade) => upgrade.category === category)).toBe(true);
        }
        expect(chooseUpgrade(run, run.progression.offers[seed % run.progression.offers.length]!)).toBe(true);
      }
      expect(run.progression.level).toBe(PROGRESSION_RULES.maxLevel);
      expect(run.randomState).toBe(spawnRandom);
    }
  });

  // These builds use only the 30 initially unlocked talents, with eight points and no Priest.
  it.each(BALANCE_ROUTES.filter((route) => route.name.endsWith('/no-priest')))
  ('$name can finish without allocating healing talents', (route) => {
    const result = simulateRoute(route, 2026, false, true);
    expect(result.outcome).toBe('victory');
    expect(result.bosses).toHaveLength(3);
    expect(result.firstChoice).toBeLessThan(15);
    expect(result.choicesByMinute[8]).toBeLessThan(PROGRESSION_RULES.maxLevel - 1);
    expect(result.upgradeTypes).toBeLessThanOrEqual(PROGRESSION_RULES.maxUpgradeTypes);
    expect(result.effectDrops).toBe(0);
    expect(result.ranks.wellspring).toBe(1);
    expect(result.peaks.enemies).toBeLessThanOrEqual(RULES.maxEnemies);
    expect(result.peaks.bolts).toBeLessThanOrEqual(RULES.maxBolts);
    expect(result.peaks.shards).toBeLessThanOrEqual(RULES.maxShards);
    expect(result.peaks.sparks).toBeLessThanOrEqual(RULES.maxSparks);
  });

  it.each([1, 42, 2026])('an initially available six-branch build survives seed %i with late decisions', (seed) => {
    const result = simulateRoute(BALANCE_ROUTES.at(-1)!, seed);
    expect(result.outcome).toBe('victory'); expect(result.bosses).toHaveLength(3);
    expect(result.firstChoice).toBeLessThan(15); expect(result.choicesByMinute[8]).toBeLessThan(PROGRESSION_RULES.maxLevel - 1);
    expect(result.upgradeTypes).toBeLessThanOrEqual(PROGRESSION_RULES.maxUpgradeTypes);
    expect(result.healthLossTicks).toBeGreaterThan(0); expect(result.effectDrops).toBe(0);
  });

  it('stationary play still loses; earned movement and pickups matter', () => {
    const result = simulateRoute(BALANCE_ROUTES[0]!, 42, true);
    expect(result.outcome).toBe('defeated'); expect(result.seconds).toBeLessThan(240);
  });

  it.each(['retaliation', 'frost/melee', 'summons', 'spellsteel/no-priest', 'frost-flock/no-priest'])
  ('choosing survival while hurt lets %s recover on a representative full campaign', (name) => {
    const route = BALANCE_ROUTES.find((route) => route.name === name)!;
    const seed = name === 'summons' ? 42 : 2026;
    const result = simulateRoute(route, seed, false, true);
    expect(result.outcome).toBe('victory'); expect(result.bosses).toHaveLength(3);
    expect(result.minHealth).toBeGreaterThan(0); expect(result.effectDrops).toBe(0);
  });
});

describe('allocation optimizations preserve gameplay boundaries', () => {
  it('derives live stats after rank edits and clamps malformed ranks consistently', () => {
    const ranks = { haste: 2.9, vitality: Infinity, magnet: NaN, pierce: -1, fleet: 900 };
    expect(getRunStats(ranks)).toMatchObject({ attackInterval: RULES.attackInterval - 0.16, maxHealth: RULES.maxHealth,
      magnetRadius: RULES.magnetRadius, pierce: 0, moveSpeed: RULES.playerSpeed + 36 });
    ranks.haste = 0;
    expect(getRunStats(ranks).attackInterval).toBe(RULES.attackInterval);
  });

  it('cleans dead foes on idle passes and sees an upgrade acquired after an idle dispatch', () => {
    const run = createRun(42);
    const dead = enemy(101, 180, 250); dead.health = 0; run.enemies.push(dead);
    updateProjectiles(run); expect(run.enemies).toEqual([]);
    run.enemies.push(dead); resolveTalentEffects(run); expect(run.enemies).toEqual([]);
    const foe = enemy(102, 180, 250); run.enemies.push(foe);
    run.progression.ranks.icebrand = 1;
    damageEnemy(run, foe, 1, { source: 'melee', school: 'physical' }); resolveTalentEffects(run);
    expect(foe.frost).toBe(2);
  });

  it('bounds a synthetic saturated burst and drains safely again on following ticks', () => {
    const run = denseWorkload();
    for (let tick = 0; tick < 120; tick++) {
      tickRun(run, { x: 0, y: 0 });
      expect(run.effects.processedThisTick).toBeLessThanOrEqual(EFFECT_LIMITS.perTick);
      expect(run.effects.pending).toEqual([]); expect(run.effects.draining).toBe(false);
      expect(run.enemies.length).toBeLessThanOrEqual(RULES.maxEnemies);
      expect(run.bolts.length).toBeLessThanOrEqual(RULES.maxBolts);
      expect(run.sparks.length).toBeLessThanOrEqual(RULES.maxSparks);
      expect(Number.isFinite(run.player.health)).toBe(true);
    }
    // Intentional overload protection, not a claim that all synthetic reactions execute.
    expect(run.effects.dropped).toBeGreaterThan(0);
    expect(run.elapsed).toBeGreaterThan(121.9);
  });
});
