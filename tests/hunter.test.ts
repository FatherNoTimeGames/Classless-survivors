import { describe, expect, it } from 'vitest';
import { ENEMIES } from '../src/content/enemies';
import { createRun } from '../src/game/state';
import type { TalentId } from '../src/content/talents';
import type { DamageSource } from '../src/game/events';
import { TALENT_TUNING as T } from '../src/content/talent-tuning';
import { damageEnemy } from '../src/game/damage';
import { updateCompanions } from '../src/game/companions';
import { updateAttacks, applyContactDamage } from '../src/game/combat';
import { getRunStats } from '../src/game/stats';
import { updateStatuses } from '../src/game/statuses';
import { placeSnare, updateSnares } from '../src/game/snares';
import { moveEnemies } from '../src/game/enemy-movement';
import { resolveTalentEffects } from '../src/game/talent-effects';
import { tickRun } from '../src/game/run';
import { chooseUpgrade } from '../src/game/progression';
import { STEP, RULES } from '../src/game/rules';
import { enemy, STILL } from './fixtures';

const HUNTER: TalentId[] = ['hunting-momentum', 'falcon', 'snare', 'pack-link', 'frost-trap', 'wild-hunt'];
const ROGUE: TalentId[] = ['expose-weakness', 'venom-edge', 'killer-instinct', 'siphon-toxin', 'contagion', 'nightfall'];
const tough = (id: number, x = 210, y = 240) => ({ ...enemy(id, x, y), health: 1000, maxHealth: 1000 });
function setup(talents = HUNTER) {
  const run = createRun(123, talents);
  run.spawnIn = Infinity;
  run.player.attackIn = 10;
  return run;
}

describe('Hunting Momentum and companions', () => {
  it.each<DamageSource>(['ember', 'melee', 'talent', 'blast', 'dot', 'summon'])('%s kills can supply Momentum without stacking charges', (source) => {
    const run = setup(['hunting-momentum']);
    damageEnemy(run, enemy(101, 20, 20), 18, { source });
    damageEnemy(run, enemy(102, 20, 20), 18, { source });
    resolveTalentEffects(run);
    expect(run.talentMemory.huntingCharge).toBe(true);
    run.player.attackIn = 0;
    run.enemies.push(tough(103));
    updateAttacks(run, getRunStats({}));
    expect(run.bolts).toHaveLength(1);
    expect(run.talentMemory.huntingCharge).toBe(true);
    run.player.attackIn = 0;
    run.enemies.push(tough(104, 250));
    updateAttacks(run, getRunStats({}));
    expect(run.bolts).toHaveLength(3);
    expect(run.talentMemory.huntingCharge).toBe(false);
  });

  it('falcons are run-owned, auto-target the nearest living in-range foe, and strike once a second', () => {
    const run = setup(['hunting-momentum', 'falcon']);
    const near = tough(101), far = tough(102, 300), outside = tough(103, 180, 450), dead = tough(104, 181);
    dead.health = 0;
    run.enemies.push(far, outside, dead, near);
    updateCompanions(run);
    expect(near.health).toBe(992);
    expect(far.health).toBe(1000);
    expect(outside.health).toBe(1000);
    expect(run.companions[0]).toMatchObject({ targetId: 101, x: near.x, y: near.y - 16, attackIn: 1 });
    updateCompanions(run);
    expect(near.health).toBe(992);
    for (let i = 0; i < 60; i++) updateCompanions(run);
    expect(near.health).toBe(984);
    const next = setup(['hunting-momentum', 'falcon']);
    expect(next.companions[0]!.attackIn).toBe(0);
    expect(next.companions[0]!.targetId).toBeNull();
    expect(setup([]).companions).toEqual([]);
  });

  it('waits without a target and credits companion kills exactly once', () => {
    const run = setup(['hunting-momentum', 'falcon']);
    updateCompanions(run);
    expect(run.companions[0]!.attackIn).toBe(0);
    const victim = enemy(101, 210, 240);
    victim.health = 8;
    run.enemies.push(victim);
    updateCompanions(run);
    resolveTalentEffects(run);
    expect(run.kills).toBe(1);
    expect(run.shards).toHaveLength(1);
    expect(run.talentMemory.huntingCharge).toBe(true);
    updateCompanions(run);
    expect(run.kills).toBe(1);
  });

  it('keeps the falcon visible while following or striking near arena edges', () => {
    const run = setup(['hunting-momentum', 'falcon']);
    run.player.x = 14;
    run.player.y = 14;
    for (let i = 0; i < 300; i++) updateCompanions(run);
    expect(run.companions[0]!.x).toBeGreaterThanOrEqual(12);
    expect(run.companions[0]!.y).toBeGreaterThanOrEqual(12);
    run.enemies.push(tough(101, 16, 16));
    updateCompanions(run);
    expect(run.companions[0]).toMatchObject({ x: 16, y: 12, targetId: 101 });
  });

  it('Pack Link adds wound bonuses, Poison, and cooldown sharing, while critical rules are always inherited', () => {
    for (const linked of [false, true]) {
      const build: TalentId[] = ['hunting-momentum', 'falcon', 'expose-weakness', 'venom-edge', 'killer-instinct'];
      if (linked) build.push('pack-link');
      const run = setup(build);
      const target = tough(101);
      target.health = 900;
      run.enemies.push(target);
      run.talentMemory.criticalHits = 3;
      updateCompanions(run);
      expect(target.health).toBe(linked ? 875.5 : 886); // (8 + 6) * 1.75, or 8 * 1.75.
      expect(target.dots).toHaveLength(Number(linked));
      if (linked) expect(target.dots[0]!.owner).toBe('companion');
      expect(run.companions[0]!.attackIn).toBeCloseTo(linked ? 0.85 : 1);
      expect(run.talentMemory.criticalHits).toBe(0);
    }
  });

  it('Pack Link carries Mage Frost to physical companion hits, enabling Shatterglass', () => {
    const run = setup(['hunting-momentum', 'falcon', 'pack-link', 'arcane-echo', 'rime-sigil', 'shatterglass']);
    const target = tough(101), neighbor = tough(102, 230);
    run.enemies.push(target, neighbor);
    updateCompanions(run);
    resolveTalentEffects(run);
    expect(target.frost).toBe(2);
    expect(target.health).toBe(992);
    run.companions[0]!.attackIn = 0;
    updateCompanions(run);
    resolveTalentEffects(run);
    expect(target.health).toBe(974); // Second falcon 8 + shatter 10.
    expect(neighbor.health).toBe(990);
    expect(target.frost).toBe(2); // The new hit reapplies inherited Frost.
    expect(run.effects.dropped).toBe(0);
  });

  it('Wild Hunt spends a charge to bypass companion cooldowns, and cannot repeat within two seconds', () => {
    const run = setup();
    const target = tough(101), second = tough(102, 250);
    run.enemies.push(target, second);
    run.companions[0]!.attackIn = 1;
    run.talentMemory.huntingCharge = true;
    run.player.attackIn = 0;
    updateAttacks(run, getRunStats({}));
    resolveTalentEffects(run);
    expect(target.health).toBe(992);
    expect(run.companions[0]!.attackIn).toBe(1);
    expect(run.talentMemory.wildHuntIn).toBe(2);
    run.talentMemory.huntingCharge = true;
    run.player.attackIn = 0;
    updateAttacks(run, getRunStats({}));
    resolveTalentEffects(run);
    expect(target.health).toBe(992);
    for (let i = 0; i < 121; i++) updateStatuses(run);
    run.talentMemory.huntingCharge = true;
    run.player.attackIn = 0;
    updateAttacks(run, getRunStats({}));
    resolveTalentEffects(run);
    expect(target.health).toBe(984);
  });
});

describe('snares, roots, and Frost hybrids', () => {
  it('counts hits across weapons and spells, places a snare even on a kill, and excludes periodic ticks', () => {
    const run = setup(['hunting-momentum', 'snare']);
    const victim = tough(101);
    run.enemies.push(victim);
    for (const source of ['ember', 'melee', 'talent'] as const) damageEnemy(run, victim, 1, { source });
    damageEnemy(run, victim, 1, { source: 'dot' });
    resolveTalentEffects(run);
    expect(run.snares).toEqual([]);
    damageEnemy(run, victim, 1000, { source: 'blast' });
    resolveTalentEffects(run);
    expect(run.snares).toHaveLength(1);
    expect(run.snares[0]).toMatchObject({ x: victim.x, y: victim.y, remaining: 2, radius: 36 });
  });

  it('slows within the zone, uses the strongest slow rather than stacking, and restores movement after expiration', () => {
    const run = setup([]);
    const target = tough(101), outside = tough(102, 290);
    run.enemies.push(target, outside);
    placeSnare(run, target);
    target.frost = 2;
    updateSnares(run);
    moveEnemies([target], run.player);
    expect(210 - target.x).toBeCloseTo(ENEMIES.husk.speed * STEP * 0.65);
    expect(outside.snared).toBe(false);
    for (let i = 0; i < 121; i++) { updateStatuses(run); updateSnares(run); }
    const before = target.x;
    moveEnemies([target], run.player);
    expect(before - target.x).toBeCloseTo(ENEMIES.husk.speed * STEP);
    expect(run.snares).toEqual([]);
  });

  it('bounds zones and replaces the oldest one when the cap is reached', () => {
    const run = setup([]);
    for (let i = 0; i < 100; i++) placeSnare(run, { x: i, y: 100 });
    expect(run.snares).toHaveLength(T.maxSnares);
    expect(run.snares[0]!.x).toBe(92);
  });

  it('roots from either a snare or Mage Frost, supplies its own Frost, and enforces per-foe immunity', () => {
    for (const slow of ['snare', 'frost']) {
      const run = setup(['hunting-momentum', 'snare', 'frost-trap']);
      const target = tough(101);
      run.enemies.push(target);
      if (slow === 'snare') placeSnare(run, target);
      else target.frost = 2;
      damageEnemy(run, target, 1);
      resolveTalentEffects(run);
      expect(target.root).toBe(0.75);
      expect(target.frost).toBe(2);
      const before = target.x;
      moveEnemies(run.enemies, run.player);
      expect(target.x).toBe(before);
      for (let i = 0; i < 46; i++) updateStatuses(run);
      damageEnemy(run, target, 1);
      resolveTalentEffects(run);
      expect(target.root).toBe(0);
      for (let i = 0; i < 136; i++) updateStatuses(run);
      target.frost = 2;
      damageEnemy(run, target, 1);
      resolveTalentEffects(run);
      expect(target.root).toBe(0.75);
    }
  });

  it('a root stops movement but does not disable contact damage', () => {
    const run = setup([]);
    const target = tough(101, 180);
    target.root = 0.75;
    run.enemies.push(target);
    applyContactDamage(run);
    expect(run.player.health).toBe(48);
  });

  it('a melee hit can both shatter its consumed slow and activate Frost Trap on that same hit', () => {
    const run = setup(['hunting-momentum', 'snare', 'frost-trap', 'arcane-echo', 'rime-sigil', 'shatterglass', 'reprisal', 'sweeping-blade']);
    const target = tough(101);
    target.frost = 2;
    run.enemies.push(target);
    damageEnemy(run, target, 16, { source: 'melee', school: 'physical' });
    resolveTalentEffects(run);
    expect(target.health).toBe(974);
    expect(target.root).toBe(0.75);
    expect(target.frost).toBe(2);
    expect(run.effects.dropped).toBe(0);
  });

  it('companions need Pack Link for on-hit snares and roots', () => {
    for (const linked of [false, true]) {
      const run = setup(linked ? HUNTER : ['hunting-momentum', 'falcon', 'snare', 'frost-trap']);
      const target = tough(101);
      target.frost = 2;
      run.enemies.push(target);
      for (let i = 0; i < 4; i++) damageEnemy(run, target, 1, { source: 'summon' });
      resolveTalentEffects(run);
      expect(run.snares).toHaveLength(Number(linked));
      expect(target.root).toBe(linked ? 0.75 : 0);
    }
  });
});

describe('mixed-build lifecycle and bounds', () => {
  it('pausing freezes companions, roots, snares, and periodic effects, and fresh runs clear them', () => {
    const run = setup([...HUNTER, 'expose-weakness', 'venom-edge']);
    const target = tough(101);
    run.enemies.push(target);
    damageEnemy(run, target, 1);
    placeSnare(run, target);
    run.status = 'choosing';
    const snapshot = structuredClone(run);
    tickRun(run, STILL);
    expect(run).toEqual(snapshot);
    const fresh = setup([...HUNTER, 'expose-weakness', 'venom-edge']);
    expect(fresh.snares).toEqual([]);
    expect(fresh.enemies).toEqual([]);
    expect(fresh.companions[0]!.attackIn).toBe(0);
    expect(fresh.talentMemory.criticalHits).toBe(0);
    expect(fresh.talentMemory.wildHuntIn).toBe(0);
  });

  it('full branches with supports are deterministic regardless of allocation order under dense combat', () => {
    const builds: TalentId[][] = [[...ROGUE, 'hunting-momentum', 'falcon'],
      [...HUNTER, 'arcane-echo', 'rime-sigil'], [...HUNTER, 'expose-weakness', 'venom-edge']];
    for (const build of builds) {
      const runs = [setup(build), setup([...build].reverse())];
      for (const run of runs) {
        run.player.attackIn = 0;
        for (let i = 0; i < 80; i++) run.enemies.push(tough(101 + i, 180 + Math.cos(i) * 40, 240 + Math.sin(i) * 40));
        for (let tick = 0; tick < 900; tick++) {
          while (run.status === 'choosing') chooseUpgrade(run, run.progression.offers[0]!);
          run.player.health = 60;
          tickRun(run, STILL);
        }
        expect(run.status).not.toBe('defeated');
        expect(run.snares.length).toBeLessThanOrEqual(T.maxSnares);
        expect(run.bolts.length).toBeLessThanOrEqual(RULES.maxBolts);
        expect(run.sparks.length).toBeLessThanOrEqual(RULES.maxSparks);
        expect(run.effects.pending).toEqual([]);
        expect(run.effects.dropped).toBe(0);
        expect(run.enemies.every((target) => target.dots.length <= T.maxDots)).toBe(true);
      }
      expect(runs[0]!.elapsed).toBeCloseTo(15);
      expect(runs[0]!.enemies.map((target) => ({ health: target.health, dots: target.dots })))
        .toEqual(runs[1]!.enemies.map((target) => ({ health: target.health, dots: target.dots })));
      expect(runs[0]!.kills).toBe(runs[1]!.kills);
      expect(runs[0]!.talentMemory).toEqual(runs[1]!.talentMemory);
    }
  });
});
