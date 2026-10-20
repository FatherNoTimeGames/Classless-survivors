import { describe, expect, it } from 'vitest';
import { createRun } from '../src/game/state';
import type { TalentId } from '../src/content/talents';
import type { DamageSource } from '../src/game/events';
import { damageEnemy } from '../src/game/damage';
import { healPlayer } from '../src/game/healing';
import { updateCompanions } from '../src/game/companions';
import { updateAttacks, updateProjectiles } from '../src/game/combat';
import { getRunStats } from '../src/game/stats';
import { applyDot, remainingDotDamage } from '../src/game/dot-state';
import type { DamageOverTime } from '../src/game/dot-state';
import { updateDamageOverTime } from '../src/game/damage-over-time';
import { resolveTalentEffects } from '../src/game/talent-effects';
import { tickRun } from '../src/game/run';
import { chooseUpgrade } from '../src/game/progression';
import { TALENT_TUNING as T } from '../src/content/talent-tuning';
import { RULES } from '../src/game/rules';
import { bolt, enemy, STILL } from './fixtures';

const WARLOCK: TalentId[] = ['soul-cinder', 'agony', 'grim-pact', 'detonation', 'soul-link', 'harvest'];
const PRIEST: TalentId[] = ['communion', 'searing-grace', 'sanctuary', 'atonement', 'martyr-ward', 'dawn-chorus'];
const HUNTER: TalentId[] = ['hunting-momentum', 'falcon', 'snare', 'pack-link', 'frost-trap', 'wild-hunt'];
const ROGUE: TalentId[] = ['expose-weakness', 'venom-edge', 'killer-instinct', 'siphon-toxin', 'contagion', 'nightfall'];
function setup(talents = WARLOCK) {
  const run = createRun(123, talents);
  run.spawnIn = Infinity;
  run.player.attackIn = 10;
  return run;
}
const tough = (id = 101, x = 210, y = 240) => ({ ...enemy(id, x, y), health: 1000, maxHealth: 1000 });
function dot(overrides: Partial<DamageOverTime> = {}): DamageOverTime {
  return { kind: 'curse', school: 'shadow', owner: 'player', damage: 3, interval: 1, remaining: 3, tickIn: 1, ...overrides };
}

describe('open curses and Soul Cinder', () => {
  it.each<DamageSource>(['ember', 'melee', 'blast', 'talent'])('%s hits apply Agony and periodic ticks cannot refresh it', (source) => {
    const run = setup(['soul-cinder', 'agony']);
    const target = tough();
    run.enemies.push(target);
    damageEnemy(run, target, 1, { source, school: 'holy' });
    expect(target.dots).toEqual([dot()]);
    for (let i = 0; i < 60; i++) updateDamageOverTime(run);
    expect(target.health).toBe(996);
    expect(target.dots[0]!.remaining).toBeCloseTo(2);
    damageEnemy(run, target, 1, { source: 'dot' });
    expect(target.dots[0]!.remaining).toBeCloseTo(2);
    damageEnemy(run, target, 1, { source });
    expect(target.dots).toHaveLength(1);
    expect(target.dots[0]!.remaining).toBe(3);
    expect(target.dots[0]!.tickIn).toBeCloseTo(1);
  });

  it.each<DamageSource>(['melee', 'talent', 'dot', 'summon'])('Soul Cinder accepts %s kills without counting its own burst chain', (source) => {
    const run = setup(['soul-cinder']);
    const neighbor = enemy(200, 210, 240);
    neighbor.health = 9;
    run.enemies.push(neighbor);
    for (let i = 0; i < 4; i++) damageEnemy(run, enemy(100 + i, 200, 240), 18, { source });
    resolveTalentEffects(run);
    expect(run.kills).toBe(5);
    expect(neighbor.health).toBe(0);
    expect(run.talentMemory.cinderKills).toBe(0);
    expect(run.effects.dropped).toBe(0);
  });
});

describe('imp and shared companion inheritance', () => {
  it('fires attributed projectiles with captured piercing, waits for targets, and honors its cooldown', () => {
    const run = setup(['soul-cinder', 'grim-pact']);
    updateCompanions(run);
    expect(run.companions[0]!.attackIn).toBe(0);
    run.player.x = 100;
    run.player.y = 100;
    const imp = run.companions[0]!;
    imp.x = 100; imp.y = 100;
    const first = tough(101, 130, 100), second = tough(102, 150, 100);
    run.enemies.push(first, second);
    run.progression.ranks.pierce = 1;
    updateCompanions(run);
    expect(run.bolts).toHaveLength(1);
    expect(run.bolts[0]).toMatchObject({ source: 'summon', school: 'fire', damage: 9, pierce: 1 });
    expect(imp.attackIn).toBe(1.4);
    run.progression.ranks.pierce = 0;
    updateCompanions(run);
    expect(run.bolts).toHaveLength(1);
    for (let i = 0; i < 20; i++) updateProjectiles(run);
    expect(first.health).toBe(991);
    expect(second.health).toBe(991);
  });

  it('Soul Link stores actual healing on every companion, caps it, and consumes each bonus once', () => {
    const run = setup([...WARLOCK, 'hunting-momentum', 'falcon']);
    const target = tough();
    run.enemies.push(target);
    run.player.health = 20;
    healPlayer(run, 20); resolveTalentEffects(run);
    expect(run.companions.map((companion) => companion.bonusDamage)).toEqual([8, 8]);
    healPlayer(run, 20); resolveTalentEffects(run);
    expect(run.companions.map((companion) => companion.bonusDamage)).toEqual([12, 12]);
    healPlayer(run, 20); resolveTalentEffects(run);
    expect(run.companions.map((companion) => companion.bonusDamage)).toEqual([12, 12]);
    updateCompanions(run);
    expect(target.health).toBe(980); // Falcon 8 + stored 12.
    expect(run.bolts[0]!.damage).toBe(21); // Imp 9 + stored 12.
    expect(run.companions.map((companion) => companion.bonusDamage)).toEqual([0, 0]);
  });

  it('healing after launch cannot change an existing shot, and failed launches preserve stored bonuses', () => {
    const run = setup(['soul-cinder', 'grim-pact', 'soul-link']);
    const target = tough();
    run.enemies.push(target);
    run.player.health = 40;
    healPlayer(run, 5); resolveTalentEffects(run);
    updateCompanions(run);
    expect(run.bolts[0]!.damage).toBe(11);
    healPlayer(run, 5); resolveTalentEffects(run);
    expect(run.bolts[0]!.damage).toBe(11);
    const imp = run.companions[0]!;
    imp.attackIn = 0;
    run.bolts = Array.from({ length: RULES.maxBolts }, (_, i) => bolt({ id: 1000 + i }));
    updateCompanions(run);
    expect(imp.bonusDamage).toBe(2);
    expect(imp.attackIn).toBe(0);
    expect(run.bolts).toHaveLength(RULES.maxBolts);
  });

  it('Pack Link lets both companion types apply curses and Mage Frost', () => {
    for (const linked of [false, true]) {
      const build: TalentId[] = ['soul-cinder', 'agony', 'grim-pact', 'hunting-momentum', 'falcon', 'arcane-echo', 'rime-sigil'];
      if (linked) build.push('pack-link');
      const run = setup(build);
      const target = tough();
      run.enemies.push(target);
      updateCompanions(run);
      resolveTalentEffects(run);
      expect(target.dots).toHaveLength(Number(linked));
      expect(target.frost).toBe(linked ? 2 : 0);
      // Reset the falcon's curse to isolate the imp's own on-hit behavior.
      target.dots = [];
      target.frost = 0;
      for (let i = 0; i < 20; i++) updateProjectiles(run);
      resolveTalentEffects(run);
      expect(target.dots).toHaveLength(Number(linked));
      expect(target.frost).toBe(linked ? 2 : 0);
      if (linked) expect(target.dots[0]!.owner).toBe('companion');
    }
  });

  it('Wild Hunt commands both companion types through their normal attack rules', () => {
    const run = setup([...HUNTER, 'soul-cinder', 'grim-pact']);
    const target = tough(), second = tough(102, 250);
    run.enemies.push(target, second);
    for (const companion of run.companions) companion.attackIn = 10;
    run.talentMemory.huntingCharge = true;
    run.player.attackIn = 0;
    updateAttacks(run, getRunStats({}));
    resolveTalentEffects(run);
    expect(target.health).toBe(992);
    expect(run.bolts.filter((shot) => shot.source === 'summon')).toHaveLength(1);
    expect(run.companions.map((companion) => companion.attackIn)).toEqual([1, 1.4]);
    expect(run.talentMemory.wildHuntIn).toBe(2);
  });
});

describe('Detonation and damage-over-time snapshots', () => {
  it.each([
    [2.5, 0.5, 9], [2.5, 0.75, 6], [0.4, 0.5, 0], [1, 1, 3],
  ])('counts only remaining scheduled ticks (duration %s, next tick %s)', (remaining, tickIn, expected) => {
    expect(remainingDotDamage(dot({ remaining, tickIn }))).toBe(expected);
  });

  it('uses a lethal curse snapshot but explosion kills cannot cause a second explosion', () => {
    const run = setup(['soul-cinder', 'agony', 'detonation']);
    const victim = enemy(101, 200, 240), secondary = enemy(102, 220, 240), outside = tough(103, 250);
    secondary.health = 9;
    run.enemies.push(victim, secondary, outside);
    damageEnemy(run, victim, 18);
    run.enemies = run.enemies.filter((target) => target.health > 0);
    resolveTalentEffects(run);
    expect(secondary.health).toBe(0);
    expect(outside.health).toBe(1000);
    expect(run.kills).toBe(2);
    expect(run.shards).toHaveLength(2);
    expect(run.sparks.filter((spark) => spark.kind === 'detonation')).toHaveLength(1);
    expect(run.effects.dropped).toBe(0);
  });

  it('accepts Poison as well as curses and caps their combined base damage', () => {
    for (const large of [false, true]) {
      const run = setup(['soul-cinder', 'agony', 'detonation']);
      const victim = enemy(101, 200, 240), neighbor = tough(102, 220);
      applyDot(victim, dot({ kind: 'poison', school: 'poison', remaining: 2 }));
      if (large) applyDot(victim, dot({ damage: 10, remaining: 4 }));
      run.enemies.push(victim, neighbor);
      damageEnemy(run, victim, 18, { source: 'dot' });
      resolveTalentEffects(run);
      expect(neighbor.health).toBe(large ? 982 : 994);
    }
  });

  it('a curse dying on its final scheduled tick has no remaining damage to detonate', () => {
    const run = setup(['soul-cinder', 'agony', 'detonation']);
    const victim = enemy(101, 200, 240), neighbor = tough(102, 220);
    victim.health = 3;
    applyDot(victim, dot({ remaining: 1 }));
    run.enemies.push(victim, neighbor);
    for (let i = 0; i < 60; i++) updateDamageOverTime(run);
    resolveTalentEffects(run);
    expect(victim.health).toBe(0);
    expect(neighbor.health).toBe(1000);
    expect(run.sparks.some((spark) => spark.kind === 'detonation')).toBe(false);
  });

  it('a lethal periodic tick detonates only future ticks, excluding the killing tick already paid', () => {
    const run = setup(['soul-cinder', 'agony', 'detonation']);
    const victim = enemy(101, 200, 240), neighbor = tough(102, 220);
    victim.health = 3;
    applyDot(victim, dot());
    run.enemies.push(victim, neighbor);
    for (let i = 0; i < 60; i++) updateDamageOverTime(run);
    resolveTalentEffects(run);
    expect(victim.health).toBe(0);
    expect(neighbor.health).toBe(994); // Two remaining 3-damage ticks.
  });
});

describe('Harvest and healing hybrids', () => {
  it('heals periodic kills and extends the shortest effect on the nearest afflicted foe without moving its tick clock', () => {
    const run = setup();
    run.player.health = 50;
    const near = tough(101, 210), farther = tough(102, 230);
    applyDot(near, dot({ kind: 'poison', school: 'poison', remaining: 1, tickIn: 0.4 }));
    applyDot(near, dot({ remaining: 2 }));
    applyDot(farther, dot({ remaining: 0.2, tickIn: 0.1 }));
    run.enemies.push(near, farther);
    damageEnemy(run, enemy(103, 200, 240), 18, { source: 'dot' });
    resolveTalentEffects(run);
    expect(run.player.health).toBe(52);
    expect(near.dots[0]).toMatchObject({ remaining: 2, tickIn: 0.4 });
    expect(near.dots[1]!.remaining).toBe(2);
    expect(farther.dots[0]!.remaining).toBe(0.2);
    expect(run.companions[0]!.bonusDamage).toBeCloseTo(0.8);
  });

  it('caps extensions at four seconds, never shortens longer effects, and ignores non-periodic kills', () => {
    const run = setup();
    run.player.health = 40;
    const target = tough();
    applyDot(target, dot({ remaining: 3.5 }));
    run.enemies.push(target);
    damageEnemy(run, enemy(102, 200, 240), 18, { source: 'dot' });
    resolveTalentEffects(run);
    expect(target.dots[0]!.remaining).toBe(4);
    damageEnemy(run, enemy(103, 200, 240), 18, { source: 'dot' });
    resolveTalentEffects(run);
    expect(target.dots[0]!.remaining).toBe(4);
    target.dots[0]!.remaining = 5;
    damageEnemy(run, enemy(104, 200, 240), 18, { source: 'dot' });
    resolveTalentEffects(run);
    expect(target.dots[0]!.remaining).toBe(5);
    expect(run.player.health).toBe(46);
    const plain = setup();
    plain.player.health = 40;
    damageEnemy(plain, enemy(101, 200, 240), 18);
    resolveTalentEffects(plain);
    expect(plain.player.health).toBe(40);
  });

  it('natural periodic kills power healing offense and companion bonuses without an instant feedback loop', () => {
    const run = setup([...WARLOCK, 'communion', 'searing-grace']);
    run.player.health = 40;
    const victim = enemy(101, 200, 240), target = tough(102, 220);
    victim.health = 3;
    applyDot(victim, dot({ kind: 'poison', school: 'poison', remaining: 1 }));
    run.enemies.push(victim, target);
    for (let i = 0; i < 60; i++) updateDamageOverTime(run);
    resolveTalentEffects(run);
    expect(run.player.health).toBe(42);
    expect(target.health).toBe(994);
    expect(target.dots.find((effect) => effect.kind === 'curse')?.remaining).toBe(3);
    expect(run.companions[0]!.bonusDamage).toBeCloseTo(0.8);
    expect(run.effects.pending).toEqual([]);
    expect(run.effects.dropped).toBe(0);
  });
});

describe('complete catalog lifecycle and compound effects', () => {
  it('paused/defeated runs freeze new timers and fresh runs clear marks, bonuses, and imp state', () => {
    const run = setup([...WARLOCK, 'communion', 'searing-grace']);
    run.enemies.push(tough());
    run.enemies[0]!.holyMark = 5;
    run.companions[0]!.bonusDamage = 12;
    run.talentMemory.sanctuaryIn = 1;
    run.talentMemory.dawnIn = 1;
    for (const status of ['choosing', 'defeated'] as const) {
      run.status = status;
      const frozen = structuredClone(run);
      tickRun(run, STILL);
      expect(run).toEqual(frozen);
    }
    const fresh = setup([...WARLOCK, 'communion', 'searing-grace']);
    expect(fresh.companions[0]).toMatchObject({ kind: 'imp', attackIn: 0, bonusDamage: 0 });
    expect(fresh.enemies).toEqual([]);
    expect(fresh.talentMemory.sanctuaryIn).toBe(0);
    expect(fresh.talentMemory.dawnIn).toBe(0);
  });

  it('keeps dense healing, curse, crit, and companion builds bounded and independent of allocation order', () => {
    const builds: TalentId[][] = [[...PRIEST, 'soul-cinder', 'agony'], [...WARLOCK, 'communion', 'searing-grace'],
      [...ROGUE, 'soul-cinder', 'agony'], [...HUNTER, 'soul-cinder', 'grim-pact']];
    for (const build of builds) {
      const runs = [setup(build), setup([...build].reverse())];
      for (const run of runs) {
        run.player.attackIn = 0;
        for (let i = 0; i < 80; i++) {
          const target = tough(101 + i, 180 + Math.cos(i) * 40, 240 + Math.sin(i) * 40);
          target.health = target.maxHealth = i % 2 ? 36 : 250;
          run.enemies.push(target);
        }
        for (let step = 0; step < 900; step++) {
          while (run.status === 'choosing') chooseUpgrade(run, run.progression.offers[0]!);
          run.player.health = Math.max(run.player.health, 40);
          tickRun(run, STILL);
        }
        expect(run.status).not.toBe('defeated');
        expect(run.kills).toBeGreaterThan(0);
        expect(run.bolts.length).toBeLessThanOrEqual(RULES.maxBolts);
        expect(run.sparks.length).toBeLessThanOrEqual(RULES.maxSparks);
        expect(run.snares.length).toBeLessThanOrEqual(T.maxSnares);
        expect(run.companions.length).toBeLessThanOrEqual(2);
        expect(run.enemies.every((target) => target.dots.length <= T.maxDots && Number.isFinite(target.health))).toBe(true);
        expect(run.effects.pending).toEqual([]);
        expect(run.effects.dropped).toBe(0);
      }
      expect(runs[0]!.kills).toBe(runs[1]!.kills);
      expect(runs[0]!.talentMemory).toEqual(runs[1]!.talentMemory);
      expect(runs[0]!.enemies.map((target) => ({ health: target.health, dots: target.dots, mark: target.holyMark })))
        .toEqual(runs[1]!.enemies.map((target) => ({ health: target.health, dots: target.dots, mark: target.holyMark })));
    }
  });
});
