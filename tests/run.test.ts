import { describe, expect, it } from 'vitest';
import { ENEMIES } from '../src/content/enemies';
import { tickRun } from '../src/game/run';
import { RULES, STEP, WORLD } from '../src/game/rules';
import { createRun } from '../src/game/state';
import { FixedClock } from '../src/game/clock';
import { advance, bolt, emptyRun, enemy, STILL } from './fixtures';
import { chooseUpgrade } from '../src/game/progression';
import type { UpgradeId } from '../src/content/upgrades';

describe('movement and simulation timing', () => {
  it('moves at the same speed at 30, 60, and 120 rendering frames per second', () => {
    const positions = [30, 60, 120].map((fps) => {
      const run = emptyRun();
      const clock = new FixedClock();
      for (let frame = 0; frame < fps; frame++) clock.advance(1 / fps, () => tickRun(run, { x: 1, y: 0 }));
      return run.player.x;
    });
    positions.forEach((x) => expect(x).toBeCloseTo(WORLD.width / 2 + RULES.playerSpeed));
  });

  it('normalizes diagonals while retaining analog stick strength', () => {
    const diagonal = emptyRun();
    advance(diagonal, 1, { x: 1, y: 1 });
    expect(Math.hypot(diagonal.player.x - 180, diagonal.player.y - 240)).toBeCloseTo(RULES.playerSpeed);
    const analog = emptyRun();
    advance(analog, 1, { x: 0.5, y: 0 });
    expect(analog.player.x - 180).toBeCloseTo(RULES.playerSpeed / 2);
  });

  it('keeps the entire player inside each arena edge', () => {
    const run = emptyRun();
    advance(run, 10, { x: -1, y: -1 });
    expect(run.player.x).toBe(RULES.playerRadius + 4);
    expect(run.player.y).toBe(RULES.playerRadius + 4);
    advance(run, 10, { x: 1, y: 1 });
    expect(run.player.x).toBe(WORLD.width - RULES.playerRadius - 4);
    expect(run.player.y).toBe(WORLD.height - RULES.playerRadius - 4);
  });

  it('caps long-frame catch-up and clears partial time on pause/restart', () => {
    const clock = new FixedClock();
    let ticks = 0;
    clock.advance(30, () => ticks++);
    expect(ticks).toBe(15);
    clock.advance(STEP / 2, () => ticks++);
    clock.reset();
    clock.advance(STEP / 2, () => ticks++);
    expect(ticks).toBe(15);
    for (const delta of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) clock.advance(delta, () => ticks++);
    expect(ticks).toBe(15);
  });
});

describe('automatic combat', () => {
  it('targets the nearest in-range enemy, kills it, and drops XP once', () => {
    const run = emptyRun();
    run.enemies.push(enemy(101, 180, 380), enemy(102, 240, 240));
    tickRun(run, STILL);
    expect(run.bolts).toHaveLength(1);
    expect(run.bolts[0]!.vx).toBeGreaterThan(0);
    expect(run.bolts[0]!.vy).toBe(0);
    advance(run, 0.3);
    expect(run.enemies.map((target) => target.id)).toEqual([101]);
    expect(run.kills).toBe(1);
    expect(run.shards.length + run.xp / 5).toBe(1);
    expect(run.player.health).toBe(RULES.maxHealth);
  });

  it('does not shoot outside range or reuse an active cooldown', () => {
    const run = emptyRun();
    run.enemies.push(enemy(101, 16, 16));
    tickRun(run, STILL);
    expect(run.bolts).toHaveLength(0);
    run.enemies[0]!.x = 260;
    run.enemies[0]!.y = 240;
    tickRun(run, STILL);
    expect(run.bolts).toHaveLength(1);
    tickRun(run, STILL);
    expect(run.bolts).toHaveLength(1);
  });

  it('uses swept collisions and consumes a bolt at the first enemy along its path', () => {
    const run = emptyRun();
    run.player.attackIn = 10;
    // Reverse array order so hit order must come from geometry.
    run.enemies.push(enemy(102, 140, 100), enemy(101, 100, 100));
    run.bolts.push(bolt({ x: 60, y: 100, vx: 6000 }));
    tickRun(run, STILL);
    expect(run.enemies.map((target) => target.id)).toEqual([102]);
    expect(run.kills).toBe(1);
    expect(run.bolts).toHaveLength(0);
  });

  it('does not double-count a kill when two bolts overlap a target', () => {
    const run = emptyRun();
    run.player.attackIn = 10;
    run.enemies.push(enemy(101, 100, 100));
    for (const id of [201, 202]) run.bolts.push(bolt({ id }));
    tickRun(run, STILL);
    expect(run.kills).toBe(1);
    expect(run.shards).toHaveLength(1);
    expect(run.bolts).toHaveLength(1);
    advance(run, 1.1);
    expect(run.bolts).toHaveLength(0);
  });

  it('damages only on contact and gives protection against stacked enemies', () => {
    const run = emptyRun();
    run.player.attackIn = 10;
    run.enemies.push(enemy(101, 180, 240), enemy(102, 180, 240));
    tickRun(run, STILL);
    expect(run.player.health).toBe(RULES.maxHealth - ENEMIES.husk.contact);
    advance(run, 0.5);
    expect(run.player.health).toBe(RULES.maxHealth - ENEMIES.husk.contact);
    advance(run, 0.4);
    expect(run.player.health).toBe(RULES.maxHealth - 2 * ENEMIES.husk.contact);
  });

  it('moves pursuers toward the player and honors their spawn grace period', () => {
    const run = emptyRun();
    run.player.attackIn = 10;
    run.enemies.push({ ...enemy(101, 180, 290), grace: 0.3 });
    advance(run, 0.2);
    expect(run.enemies[0]!.y).toBe(290);
    advance(run, 0.3);
    expect(run.enemies[0]!.y).toBeLessThan(290);
    expect(run.player.health).toBe(RULES.maxHealth);
  });
});

describe('pickups, spawning, and run lifecycle', () => {
  it('collects nearby shards, attracts shards within reach, and leaves distant XP alone', () => {
    const run = emptyRun();
    run.shards.push({ id: 1, x: 180, y: 240, value: 5 }, { id: 2, x: 220, y: 240, value: 10 }, { id: 3, x: 300, y: 240, value: 5 });
    tickRun(run, STILL);
    expect(run.xp).toBe(5);
    expect(run.shards[0]!.x).toBeLessThan(220);
    advance(run, 0.5);
    expect(run.xp).toBe(15);
    expect(run.shards).toEqual([{ id: 3, x: 300, y: 240, value: 5 }]);
  });

  it('preserves earned XP by merging drops when the pickup limit is reached', () => {
    const run = emptyRun();
    run.player.attackIn = 10;
    for (let id = 0; id < RULES.maxShards; id++) run.shards.push({ id, x: 30, y: 30, value: 5 });
    run.enemies.push(enemy(101, 100, 100));
    run.bolts.push(bolt({}));
    tickRun(run, STILL);
    expect(run.shards).toHaveLength(RULES.maxShards);
    expect(run.shards.reduce((sum, shard) => sum + shard.value, run.xp)).toBe((RULES.maxShards + 1) * 5);
  });

  it('is deterministic for a seed and always spawns safely away from the player', () => {
    const first = createRun(123);
    const second = createRun(123);
    for (let tick = 0; tick < 180; tick++) {
      const oldIds = new Set(first.enemies.map((target) => target.id));
      tickRun(first, STILL);
      tickRun(second, STILL);
      for (const spawned of first.enemies.filter((target) => !oldIds.has(target.id))) {
        expect(Math.hypot(spawned.x - first.player.x, spawned.y - first.player.y)).toBeGreaterThanOrEqual(110);
        expect(spawned.grace).toBeGreaterThan(0);
      }
    }
    expect(first).toEqual(second);
    const other = createRun(456);
    advance(other, 3);
    expect(first.randomState).not.toBe(other.randomState);
  });

  it('respects enemy, projectile, and visual-effect budgets', () => {
    const run = emptyRun();
    run.spawnIn = 0;
    run.player.attackIn = 10;
    for (let id = 0; id < RULES.maxEnemies; id++) run.enemies.push(enemy(id + 1, 180, 40));
    tickRun(run, STILL);
    expect(run.enemies).toHaveLength(RULES.maxEnemies);
    run.player.attackIn = 0;
    for (let id = 0; id < RULES.maxBolts; id++) run.bolts.push(bolt({ id, x: 20, y: 400, vx: 1 }));
    tickRun(run, STILL);
    expect(run.bolts).toHaveLength(RULES.maxBolts);
    expect(run.sparks.length).toBeLessThanOrEqual(64);
  });

  it('ends at zero health, freezes gameplay, and starts subsequent runs cleanly', () => {
    const run = emptyRun();
    run.player.attackIn = 100;
    run.enemies.push(enemy(101, 180, 240));
    advance(run, 5);
    expect(run.status).toBe('defeated');
    expect(run.player.health).toBe(0);
    const snapshot = structuredClone(run);
    advance(run, 10, { x: 1, y: 1 });
    expect(run).toEqual(snapshot);
    const restart = createRun(123);
    expect(restart.player.health).toBe(RULES.maxHealth);
    expect(restart.elapsed + restart.xp + restart.kills).toBe(0);
    expect(restart.enemies).toEqual([]);
    expect(restart.bolts).toEqual([]);
    expect(restart.shards).toEqual([]);
    expect(restart.sparks).toEqual([]);
    expect(restart.player.attackIn + restart.player.invulnerable).toBe(0);
  });

  it('supports actual combat, XP collection, and eventual defeat without fixture enemies', () => {
    const run = createRun(8734);
    for (let tick = 0; tick < 180 / STEP; tick++) {
      if (run.status === 'choosing') {
        const priority: UpgradeId[] = ['fleet', 'magnet', 'vitality', 'haste', 'fork', 'pierce', 'burst'];
        const choice = priority.find((id) => run.progression.offers.includes(id))!;
        chooseUpgrade(run, choice);
      }
      // Actively collect early drops; ranged enemies no longer deliver XP to an idle player.
      const shard = run.elapsed < 35 ? run.shards.reduce<typeof run.shards[number] | undefined>((nearest, entry) => !nearest || Math.hypot(entry.x - run.player.x, entry.y - run.player.y) < Math.hypot(nearest.x - run.player.x, nearest.y - run.player.y) ? entry : nearest, undefined) : undefined;
      const dx = shard ? shard.x - run.player.x : 0, dy = shard ? shard.y - run.player.y : 0;
      const length = Math.hypot(dx, dy);
      tickRun(run, length > 0 ? { x: dx / length, y: dy / length } : STILL);
    }
    expect(run.kills).toBeGreaterThan(5);
    expect(run.xp).toBeGreaterThan(0);
    expect(run.status).toBe('defeated');
    expect(run.elapsed).toBeLessThan(180);
  });
});
