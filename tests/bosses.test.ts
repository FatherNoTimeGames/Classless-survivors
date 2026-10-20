import { describe, expect, it } from 'vitest';
import { BOSSES, CAMPAIGN } from '../src/content/bosses';
import { createRun } from '../src/game/state';
import { updateEncounterSchedule, resolveBossDefeat, updateBossIntent, bossSpawnPoint } from '../src/game/bosses';
import { prepareBossPattern } from '../src/game/boss-patterns';
import { bossShapeHits, updateBossDangers } from '../src/game/boss-dangers';
import { applyDot } from '../src/game/dot-state';
import { damageEnemy, damagePlayer } from '../src/game/damage';
import { applyControl } from '../src/game/control';
import { updateStatuses } from '../src/game/statuses';
import { resolveTalentEffects } from '../src/game/talent-effects';
import { updateSpawns } from '../src/game/spawning';
import { updateEnemyAttacks } from '../src/game/enemy-attacks';
import { updateEnemies } from '../src/game/enemies';
import { updateProjectiles, applyContactDamage } from '../src/game/combat';
import { checkDawn, completeRun } from '../src/game/run-ending';
import { tickRun } from '../src/game/run';
import { STEP } from '../src/game/rules';
import { distance } from '../src/game/geometry';
import { awardXp, chooseUpgrade } from '../src/game/progression';
import { healPlayer } from '../src/game/healing';
import { grantShield } from '../src/game/shields';
import { beginProfileRun, newProfile, finishProfileRun } from '../src/profile/profile';
import type { TalentId } from '../src/content/talents';
import { advance, bolt, enemy, STILL } from './fixtures';

function encounter(index = 0, talents: TalentId[] = []) {
  const run = createRun(42, talents); run.elapsed = BOSSES[index]!.at;
  run.campaign.nextBoss = index; run.spawnIn = Infinity; updateEncounterSchedule(run);
  const boss = run.enemies[0]!; boss.grace = 0;
  return { run, boss, fight: run.campaign.active! };
}

describe('campaign scheduling and encounter boundaries', () => {
  it('starts at the authored time, clears old threats without credit, and preserves the build, XP and ranks', () => {
    const run = createRun(42, ['reprisal']); run.elapsed = 240 - STEP;
    run.enemies.push(enemy(800, 20, 20)); run.progression.ranks.haste = 2;
    run.shards.push({ id: 900, x: 100, y: 100, value: 5 });
    run.enemyBolts.push({ id: 901, x: 20, y: 20, vx: 1, vy: 0, remaining: 1, damage: 10 });
    updateEncounterSchedule(run); expect(run.campaign.active).toBeNull();
    run.elapsed += STEP; updateEncounterSchedule(run);
    expect(run.enemies).toHaveLength(1); expect(run.enemies[0]!.boss).toBe('knight');
    expect(run.enemies[0]!.grace).toBe(CAMPAIGN.arrivalGrace); expect(run.enemyBolts).toEqual([]);
    expect(run.kills).toBe(0); expect(run.xp).toBe(0); expect(run.shards).toHaveLength(1);
    expect(run.talents).toEqual(['reprisal']); expect(run.progression.ranks.haste).toBe(2);
    updateEncounterSchedule(run); expect(run.enemies).toHaveLength(1); expect(run.campaign.nextBoss).toBe(1);
  });
  it.each([{ x: 12, y: 12 }, { x: 348, y: 12 }, { x: 12, y: 468 }, { x: 348, y: 468 }, { x: 180, y: 240 }])('arrives safely within attack reach from $x,$y', (player) => {
    const point = bossSpawnPoint(player);
    expect(distance(player, point)).toBeCloseTo(155); expect(point.x).toBeGreaterThanOrEqual(32); expect(point.y).toBeGreaterThanOrEqual(32);
    expect(point.x).toBeLessThanOrEqual(328); expect(point.y).toBeLessThanOrEqual(448);
  });
  it('bounds simple reinforcements, suppresses normal spawns and leaves a healing respite after defeat', () => {
    const { run, boss, fight } = encounter();
    for (let i = 0; i < 20; i++) { fight.addIn = 0; updateBossIntent(run); }
    expect(run.enemies.filter((foe) => !foe.boss)).toHaveLength(CAMPAIGN.maxAdds);
    expect(run.enemies.filter((foe) => !foe.boss).every((foe) => ['husk', 'skitter'].includes(foe.kind))).toBe(true);
    run.spawnIn = 0; updateSpawns(run); expect(run.enemies).toHaveLength(7);
    run.player.health = 20; damageEnemy(run, boss, 10000); resolveTalentEffects(run); resolveBossDefeat(run);
    expect(run.player.health).toBe(35); expect(run.campaign.defeated).toEqual(['knight']); expect(run.campaign.active).toBeNull();
    expect(run.enemies).toEqual([]); expect(run.shards[0]!.value).toBe(90);
    resolveBossDefeat(run); expect(run.player.health).toBe(35); expect(run.kills).toBe(1);
    run.spawnIn = 0; updateSpawns(run); expect(run.enemies).toEqual([]);
    run.elapsed += 5; updateSpawns(run); expect(run.enemies).toHaveLength(1);
  });
  it('pauses the entire encounter during choices and creates fresh independent state on replay', () => {
    const { run, boss, fight } = encounter(); prepareBossPattern(run, boss, fight);
    run.status = 'choosing'; const frozen = structuredClone(run); advance(run, 5); expect(run).toEqual(frozen);
    const fresh = createRun(42); expect(fresh.campaign).toEqual({ nextBoss: 0, active: null, defeated: [], breakUntil: 0, dangers: [] });
  });
});

describe('boss mechanics and shared combat rules', () => {
  it.each([0, 1, 2])('guardian %i locks warning geometry, waits before damage, and has distinct patterns', (index) => {
    const { run, boss, fight } = encounter(index); run.player.x = boss.x - 50; run.player.y = boss.y;
    const shapes = new Set<string>();
    for (let i = 0; i < 3; i++) {
      run.campaign.dangers = []; prepareBossPattern(run, boss, fight);
      const warnings = structuredClone(run.campaign.dangers); warnings.forEach((warning) => shapes.add(warning.shape.kind));
      run.player.y += 10; updateBossDangers(run);
      expect(run.campaign.dangers.map((danger) => danger.shape)).toEqual(warnings.map((danger) => danger.shape));
      expect(run.player.health).toBe(60); expect(run.campaign.dangers.every((danger) => danger.phase === 'warning')).toBe(true);
    }
    expect(shapes.size).toBeGreaterThanOrEqual(2);
  });
  it('has correct cone, lane, ring and pool escape geometry including player size', () => {
    const origin = { x: 180, y: 240 };
    const cone = { kind: 'cone' as const, origin, angle: 0, radius: 90, halfAngle: Math.PI / 3 };
    expect(bossShapeHits(cone, { x: 230, y: 240 })).toBe(true); expect(bossShapeHits(cone, { x: 140, y: 240 })).toBe(false);
    expect(bossShapeHits(cone, { x: 290, y: 240 })).toBe(false);
    const ring = { kind: 'ring' as const, origin, inner: 28, outer: 64 };
    expect(bossShapeHits(ring, origin)).toBe(false); expect(bossShapeHits(ring, { x: 205, y: 240 })).toBe(true);
    expect(bossShapeHits(ring, { x: 260, y: 240 })).toBe(false);
    const line = { kind: 'line' as const, from: { x: 0, y: 240 }, to: { x: 360, y: 240 }, width: 12 };
    expect(bossShapeHits(line, { x: 40, y: 255 })).toBe(true); expect(bossShapeHits(line, { x: 40, y: 265 })).toBe(false);
    expect(bossShapeHits({ kind: 'circle', origin, radius: 24 }, { x: 200, y: 240 })).toBe(true);
  });
  it('lets a player escape each warning family with ordinary movement, including corner cross/pools', () => {
    for (const [index, pattern] of [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [2, 1], [2, 2]]) {
      const { run, boss, fight } = encounter(index); fight.pattern = pattern!;
      run.player.x = 12; run.player.y = 12; boss.x = 130; boss.y = 12;
      prepareBossPattern(run, boss, fight);
      for (let i = 0; i < 90; i++) {
        run.player.x += 105 * STEP / (index === 2 && pattern === 1 ? 1 : Math.SQRT2);
        if (!(index === 2 && pattern === 1)) run.player.y += 105 * STEP / Math.SQRT2;
        updateBossDangers(run); updateEnemyAttacks(run);
      }
      expect(run.player.health, `${index}/${pattern}`).toBe(60);
    }
  });
  it('cancels stunned warnings and gives bosses bounded hard control while retaining slow and Frost damage', () => {
    const { run, boss, fight } = encounter(0, ['reprisal', 'sweeping-blade', 'frostbreak']);
    prepareBossPattern(run, boss, fight); boss.frost = 2;
    damageEnemy(run, boss, 1, { source: 'melee', school: 'physical' }); resolveTalentEffects(run);
    expect(boss.stun).toBe(0.6); expect(boss.health).toBe(boss.maxHealth - 9); expect(boss.controlGuard).toBe(3);
    updateBossDangers(run); expect(run.campaign.dangers).toEqual([]);
    expect(applyControl(boss, 'root', 1)).toBe(false);
    boss.frost = 2; boss.stun = 0;
    damageEnemy(run, boss, 1, { source: 'melee', school: 'physical' });
    expect(boss.stun).toBe(0); expect(boss.health).toBe(boss.maxHealth - 18);
    for (let i = 0; i < 181; i++) updateStatuses(run);
    expect(applyControl(boss, 'root', 0.75)).toBe(true);
    const normal = enemy(999, 0, 0); applyControl(normal, 'stun', 1); expect(applyControl(normal, 'root', 1)).toBe(true);
  });
  it('keeps Frost Trap useful during Resolve and lets a rooted boss cast without moving', () => {
    const { run, boss, fight } = encounter(1, ['hunting-momentum', 'snare', 'frost-trap']);
    boss.snared = true; boss.controlGuard = 2;
    damageEnemy(run, boss, 1); resolveTalentEffects(run);
    expect(boss.root).toBe(0); expect(boss.frost).toBe(2); expect(boss.rootImmune).toBe(3);
    boss.controlGuard = 0; boss.rootImmune = 0;
    damageEnemy(run, boss, 1); resolveTalentEffects(run); expect(boss.root).toBe(0.75);
    const point = { x: boss.x, y: boss.y }; fight.attackIn = 0;
    updateBossIntent(run); expect({ x: boss.x, y: boss.y }).toEqual(point);
    expect(run.campaign.dangers.length).toBeGreaterThan(0);
  });
  it('keeps a larger boss hitbox, shared shields/retaliation and grace, and cancels danger on lethal friendly offense', () => {
    const { run, boss, fight } = encounter(0, ['reprisal']);
    boss.x = 180; boss.y = 210; run.player.x = 180; run.player.y = 240;
    run.bolts.push(bolt({ x: 195, y: 210, damage: 10 })); updateProjectiles(run); expect(boss.health).toBe(boss.maxHealth - 10);
    boss.y = 220; boss.grace = 1; applyContactDamage(run); expect(run.player.health).toBe(60);
    boss.grace = 0; grantShield(run, 8, 3); applyContactDamage(run); resolveTalentEffects(run);
    expect(run.player.health).toBe(52); expect(boss.health).toBe(boss.maxHealth - 22);
    prepareBossPattern(run, boss, fight); run.campaign.dangers.forEach((danger) => danger.remaining = STEP);
    boss.health = 1; run.bolts.push(bolt({ x: boss.x, y: boss.y })); run.player.invulnerable = 0;
    tickRun(run, STILL); expect(run.campaign.defeated).toEqual(['knight']); expect(run.campaign.dangers).toEqual([]);
  });
  it.each(['periodic', 'companion'] as const)('%s damage can finish a guardian and credit its XP once', (source) => {
    const { run, boss } = encounter(0, ['hunting-momentum', 'falcon']);
    boss.x = run.player.x + 50; boss.y = run.player.y; boss.health = 1; run.player.attackIn = 100;
    if (source === 'periodic') applyDot(boss, { kind: 'poison', school: 'poison', owner: 'player', damage: 3, interval: 1, remaining: 2, tickIn: STEP });
    tickRun(run, STILL);
    expect(run.campaign.defeated).toEqual(['knight']); expect(run.kills).toBe(1);
    expect(run.shards.reduce((sum, shard) => sum + shard.value, 0)).toBe(90);
    tickRun(run, STILL); expect(run.kills).toBe(1);
  });
  it('bounds hostile volleys and danger lifetimes, and allows hard-control-interrupted bosses to attack again', () => {
    const { run, boss, fight } = encounter(1);
    for (let i = 0; i < 20; i++) prepareBossPattern(run, boss, fight);
    expect(run.campaign.dangers.length).toBeLessThanOrEqual(CAMPAIGN.maxDangers);
    for (let i = 0; i < 200; i++) updateBossDangers(run);
    expect(run.campaign.dangers).toEqual([]); expect(run.enemyBolts.length).toBeLessThanOrEqual(24);
    applyControl(boss, 'stun', 0.6); updateBossIntent(run);
    for (let i = 0; i < 180; i++) { updateStatuses(run); updateEnemies(run); updateBossIntent(run); updateBossDangers(run); }
    expect(run.enemyBolts.length).toBeGreaterThan(0);
  });
});

describe('run completion and durable outcomes', () => {
  it.each(['victory', 'defeated'] as const)('%s freezes all combat/progression mutations and pays its profile reward once', (status) => {
    const run = createRun(42); const foe = enemy(200, 180, 240); run.enemies.push(foe);
    if (status === 'victory') run.campaign.defeated = ['knight', 'matron', 'sovereign'];
    run.elapsed = 900; checkDawn(run); expect(run.status).toBe(status);
    const frozen = structuredClone(run);
    advance(run, 10); damageEnemy(run, foe, 100); damagePlayer(run, 100); awardXp(run, 50); healPlayer(run, 100); grantShield(run, 50, 2); resolveTalentEffects(run);
    expect(chooseUpgrade(run, 'haste')).toBe(false); expect(run).toEqual(frozen);
    let profile = beginProfileRun(newProfile())!;
    const id = profile.activeRun!;
    profile = finishProfileRun(profile, id, { outcome: status === 'victory' ? 'victory' : 'defeat', seconds: run.elapsed, kills: run.kills, xp: run.xp })!;
    expect(profile.completedRuns).toBe(1); expect(profile.activeRun).toBeNull();
    expect(finishProfileRun(profile, id, profile.lastResult!)).toBeNull();
  });
  it('requires both dawn and all three kills, and never resurrects a slain run', () => {
    const { run } = encounter();
    run.campaign.active = null; run.campaign.defeated = ['knight', 'matron', 'sovereign']; run.elapsed = 899;
    expect(checkDawn(run)).toBe(false); expect(run.status).toBe('running');
    completeRun(run, 'defeated', 'slain'); run.elapsed = 900; checkDawn(run);
    expect(run.status).toBe('defeated'); expect(run.finishReason).toBe('slain');
  });
  it('credits a final projectile kill on the deadline before a hostile impact, clears queued choices and caps elapsed', () => {
    const { run, boss } = encounter(2); run.elapsed = 900 - STEP;
    run.campaign.defeated = ['knight', 'matron']; boss.x = 180; boss.y = 220; boss.health = 1;
    run.bolts.push(bolt({ x: 180, y: 220 })); run.blights.push({ id: 999, x: 180, y: 240, radius: 24, remaining: 1, damage: 100 });
    tickRun(run, STILL);
    expect(run.status).toBe('victory'); expect(run.elapsed).toBe(900); expect(run.player.health).toBe(60);
    expect(run.progression.offers).toEqual([]); expect(run.enemyBolts).toEqual([]); expect(run.blights).toEqual([]);
    expect(run.campaign.defeated).toEqual(['knight', 'matron', 'sovereign']);
  });
  it('loses at the deadline if a guardian remains and records ordinary health defeat separately', () => {
    const { run } = encounter(); run.elapsed = 900 - STEP; tickRun(run, STILL);
    expect(run.status).toBe('defeated'); expect(run.finishReason).toBe('timeout'); expect(run.elapsed).toBe(900);
    const slain = createRun(1); damagePlayer(slain, 100); expect(slain.finishReason).toBe('slain'); expect(slain.progression.pendingLevels).toBe(0);
  });
});

// No injected health, damage, ranks, XP, kills, or timeline: real ticks, choices and movement.
describe('complete fifteen-minute seeded hybrid routes', () => {
  const builds: TalentId[][] = [
    ['arcane-echo', 'rime-sigil', 'chain-spark', 'shatterglass', 'mana-ward', 'riftweaver', 'communion', 'searing-grace'],
    ['arcane-echo', 'rime-sigil', 'chain-spark', 'mana-ward', 'communion', 'searing-grace', 'sanctuary', 'atonement'],
  ];
  it.each(builds.map((talents, index) => ({ talents, index })))('hybrid $index completes waves, all guardians and dawn with earned upgrades', ({ talents }) => {
    const run = createRun(42, talents); const seen = new Set<string>(); let peakAdds = 0;
    for (let i = 0; i < 55000 && !['victory', 'defeated'].includes(run.status); i++) {
      while (run.status === 'choosing') chooseUpgrade(run, (['vitality', 'haste', 'magnet', 'fleet', 'fork', 'pierce', 'burst'] as const).find((id) => run.progression.offers.includes(id)) ?? run.progression.offers[0]!);
      tickRun(run, [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }][Math.floor(run.elapsed / 3) % 4]!);
      if (run.campaign.active) { seen.add(run.campaign.active.id); peakAdds = Math.max(peakAdds, run.enemies.filter((foe) => !foe.boss).length); }
    }
    expect(run.status).toBe('victory'); expect(run.elapsed).toBe(900); expect(run.player.health).toBeGreaterThan(0);
    expect(seen).toEqual(new Set(['knight', 'matron', 'sovereign'])); expect(run.campaign.defeated).toEqual(['knight', 'matron', 'sovereign']);
    expect(peakAdds).toBeGreaterThan(0); expect(peakAdds).toBeLessThanOrEqual(6); expect(run.kills).toBeGreaterThan(900);
    expect(run.xp).toBeGreaterThan(2000); expect(run.progression.level).toBeGreaterThan(20); expect(run.effects.dropped).toBe(0);
  });
});
