import { describe, expect, it } from 'vitest';
import { arenaSize } from '../src/game/arena-size';
import { WORLD, RULES } from '../src/game/rules';
import { createRun } from '../src/game/state';
import { movePlayer } from '../src/game/movement';
import { safeSpawnPoint } from '../src/game/spawning';
import { bossSpawnPoint } from '../src/game/bosses';
import { awardXp, chooseUpgrade, eligibleUpgrades, selectedUpgradeCount } from '../src/game/progression';
import { PROGRESSION_RULES } from '../src/content/upgrades';
import { BOSSES } from '../src/content/bosses';
import { guardianMessage } from '../src/ui/campaign-label';
import { abandonProfileRun, beginProfileRun, finishProfileRun, newProfile } from '../src/profile/profile';

describe('focused temporary builds', () => {
  it('keeps rank-ups available but rejects a forged ninth lasting upgrade without spending the reward', () => {
    const run = createRun(42);
    run.progression.ranks = { haste: 1, fleet: 1, magnet: 1, vitality: 1, fork: 1, pierce: 1, venom: 1, wellspring: 1 };
    const pool = eligibleUpgrades(20, run.progression.ranks);
    expect(pool.some((upgrade) => upgrade.id === 'haste')).toBe(true);
    expect(pool.some((upgrade) => upgrade.id === 'burst')).toBe(false);
    run.status = 'choosing'; run.progression.level = 20; run.progression.pendingLevels = 1; run.progression.offers = ['burst'];
    const before = structuredClone(run); expect(chooseUpgrade(run, 'burst')).toBe(false); expect(run).toEqual(before);
    run.progression.offers = ['haste']; expect(chooseUpgrade(run, 'haste')).toBe(true);
    expect(run.progression.ranks.haste).toBe(2); expect(selectedUpgradeCount(run.progression.ranks)).toBe(8);
  });
  it('never exceeds eight lasting types across complete, legally earned reward queues', () => {
    for (let seed = 1; seed <= 32; seed++) {
      const run = createRun(seed, ['reprisal', 'sweeping-blade', 'arcane-echo', 'expose-weakness', 'communion', 'soul-cinder', 'hunting-momentum', 'falcon']);
      awardXp(run, 1_000_000);
      let choices = 0;
      while (run.status === 'choosing') {
        expect(chooseUpgrade(run, run.progression.offers[(choices++ + seed) % run.progression.offers.length]!)).toBe(true);
        expect(selectedUpgradeCount(run.progression.ranks)).toBeLessThanOrEqual(8);
      }
      expect(choices).toBe(PROGRESSION_RULES.maxLevel - 1); expect(run.status).toBe('running');
    }
  });
});

describe('screen-shaped arenas', () => {
  it.each([[390, 650], [1280, 650], [768, 820], [568, 160]])('preserves combat area and bounds at %s×%s', (width, height) => {
    const world = arenaSize(width, height), run = createRun(42, [], undefined, world);
    expect(world.width * world.height).toBeCloseTo(WORLD.width * WORLD.height);
    expect(world.width / world.height).toBeCloseTo(Math.max(1 / 3, Math.min(3, width / height)));
    for (let step = 0; step < 2000; step++) movePlayer(run.player, { x: 1, y: 1 }, 105, run.world);
    expect(run.player.x).toBe(world.width - RULES.playerRadius - RULES.playerBoundaryPadding);
    expect(run.player.y).toBe(world.height - RULES.playerRadius - RULES.playerBoundaryPadding);
    for (let index = 0; index < 32; index++) {
      const point = safeSpawnPoint(run);
      expect(point.x).toBeGreaterThanOrEqual(16); expect(point.x).toBeLessThanOrEqual(world.width - 16);
      expect(point.y).toBeGreaterThanOrEqual(16); expect(point.y).toBeLessThanOrEqual(world.height - 16);
    }
    const boss = bossSpawnPoint(run.player, run.world);
    expect(boss.x).toBeGreaterThanOrEqual(32); expect(boss.x).toBeLessThanOrEqual(world.width - 32);
    expect(boss.y).toBeGreaterThanOrEqual(32); expect(boss.y).toBeLessThanOrEqual(world.height - 32);
  });
  it('uses safe default dimensions for unavailable viewports', () => { expect(arenaSize(0, NaN)).toEqual(WORLD); });
});

it('counts down to each guardian and explains a delayed spawn without showing negative time', () => {
  const run = createRun(42);
  expect(guardianMessage(run)).toBe('Next guardian in 03:00');
  run.elapsed = 1; expect(guardianMessage(run)).toBe('Next guardian in 02:59');
  run.elapsed = BOSSES[0].at; expect(guardianMessage(run)).toBe('Guardian arriving');
  run.campaign.active = { id: 'knight', enemyId: 1, pattern: 0, attackIn: 0, addIn: 0 };
  run.campaign.nextBoss = 1; run.elapsed = BOSSES[1].at + 10;
  expect(guardianMessage(run)).toBe('Next guardian after this fight');
});

it('abandoning consumes only the active identity, awards nothing and permits a fresh run', () => {
  const profile = beginProfileRun(newProfile())!, id = profile.activeRun!;
  const abandoned = abandonProfileRun(profile, id)!;
  expect(abandoned).toEqual({ ...profile, activeRun: null });
  expect(abandonProfileRun(profile, id + 1)).toBeNull(); expect(abandonProfileRun(abandoned, id)).toBeNull();
  expect(finishProfileRun(abandoned, id, { outcome: 'defeat', seconds: 400, kills: 200, xp: 500 })).toBeNull();
  expect(beginProfileRun(abandoned)!.activeRun).toBe(id + 1);
});
