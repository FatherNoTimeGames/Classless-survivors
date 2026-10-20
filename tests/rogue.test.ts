import { describe, expect, it } from 'vitest';
import { createRun } from '../src/game/state';
import type { TalentId } from '../src/content/talents';
import type { DamageSource } from '../src/game/events';
import { damageEnemy } from '../src/game/damage';
import { updateDamageOverTime } from '../src/game/damage-over-time';
import { applyDot } from '../src/game/dot-state';
import type { DamageOverTime } from '../src/game/dot-state';
import { resolveTalentEffects } from '../src/game/talent-effects';
import { enemy } from './fixtures';

const ROOTS: TalentId[] = ['expose-weakness', 'venom-edge'];
const ROGUE: TalentId[] = [...ROOTS, 'killer-instinct', 'siphon-toxin', 'contagion', 'nightfall'];
function setup(talents = ROOTS) {
  const run = createRun(123, talents);
  run.spawnIn = Infinity;
  return run;
}
const tough = (id: number, x = 200) => ({ ...enemy(id, x, 240), health: 1000, maxHealth: 1000 });
function dot(overrides: Partial<DamageOverTime> = {}): DamageOverTime {
  return { kind: 'poison', school: 'poison', owner: 'player', damage: 3, interval: 1, remaining: 2, tickIn: 1, ...overrides };
}
function ticks(run: ReturnType<typeof createRun>, count: number) {
  for (let i = 0; i < count; i++) { updateDamageOverTime(run); resolveTalentEffects(run); }
}

describe('open Rogue hit rules', () => {
  it.each<DamageSource>(['ember', 'melee', 'blast', 'talent'])('Poison and wound bonuses work for %s hits, without requiring a weapon school', (source) => {
    const run = setup();
    const target = tough(101);
    damageEnemy(run, target, 1, { source, school: 'holy' });
    expect(target.health).toBe(999);
    expect(target.dots).toHaveLength(1);
    expect(target.dots[0]).toMatchObject({ kind: 'poison', owner: 'player', damage: 3 });
    run.player.attackIn = 0.7;
    run.player.meleeIn = 1.1;
    damageEnemy(run, target, 1, { source, school: 'shadow' });
    expect(target.health).toBe(992);
    expect(run.player.attackIn).toBeCloseTo(0.55);
    expect(run.player.meleeIn).toBeCloseTo(0.95);
  });

  it('weaves weapons, spells, area hits, and companions into one critical cadence; ticks cannot crit', () => {
    const run = setup(['expose-weakness', 'killer-instinct']);
    const target = tough(101);
    damageEnemy(run, target, 1, { source: 'ember' });
    damageEnemy(run, target, 1, { source: 'melee', school: 'physical' });
    damageEnemy(run, target, 1, { source: 'dot', school: 'shadow' });
    damageEnemy(run, target, 1, { source: 'talent', school: 'holy' });
    expect(run.talentMemory.criticalHits).toBe(3);
    damageEnemy(run, target, 8, { source: 'summon', school: 'physical' });
    const hits = run.effects.pending.map(({ event }) => event).filter((event) => event.type === 'hit');
    expect(hits.map((event) => 'critical' in event && event.critical)).toEqual([false, false, false, false, true]);
    expect(hits.at(-1)!.amount).toBe(14); // Falcon crit; no Pack Link wound bonus.
    expect(run.talentMemory.criticalHits).toBe(0);
    expect(run.sparks.some((spark) => spark.kind === 'critical')).toBe(true);
  });

  it('critical multipliers include wound bonuses and cannot credit a death twice', () => {
    const run = setup(['expose-weakness', 'killer-instinct']);
    const target = tough(101);
    for (let i = 0; i < 3; i++) damageEnemy(run, target, 1);
    const before = target.health;
    damageEnemy(run, target, 10, { source: 'talent', school: 'arcane' });
    expect(before - target.health).toBe(28); // (10 + 6) * 1.75.
    const victim = enemy(102, 200, 240);
    damageEnemy(run, victim, 100);
    damageEnemy(run, victim, 100);
    expect(run.kills).toBe(1);
    expect(run.shards).toHaveLength(1);
  });
});

describe('shared periodic damage and Siphon Toxin', () => {
  it('refreshes Poison without stacking, delaying its clock, critting, or refunding cooldowns', () => {
    const run = setup([...ROOTS, 'killer-instinct']);
    const target = tough(101);
    run.enemies.push(target);
    damageEnemy(run, target, 1);
    ticks(run, 30);
    damageEnemy(run, target, 1);
    expect(target.dots).toHaveLength(1);
    expect(target.dots[0]!.remaining).toBe(2);
    expect(target.dots[0]!.tickIn).toBeCloseTo(0.5);
    run.player.attackIn = 0.7;
    ticks(run, 30);
    expect(target.health).toBe(989); // 1 + (1 + 6) + one 3-damage tick.
    expect(run.talentMemory.criticalHits).toBe(2);
    expect(run.player.attackIn).toBe(0.7);
    expect(target.dots[0]!.remaining).toBeCloseTo(1.5);
  });

  it('pays the final tick before natural expiration, heals once, and does not count a death as expiration', () => {
    const run = setup([...ROOTS, 'siphon-toxin']);
    run.player.health = 50;
    const target = tough(101);
    run.enemies.push(target);
    damageEnemy(run, target, 1);
    ticks(run, 120);
    expect(target.health).toBe(993);
    expect(target.dots).toEqual([]);
    expect(run.player.health).toBe(52);
    ticks(run, 120);
    expect(run.player.health).toBe(52);
    const doomed = enemy(102, 200, 240);
    doomed.health = 3;
    applyDot(doomed, dot());
    run.enemies.push(doomed);
    ticks(run, 120);
    expect(doomed.health).toBe(0);
    expect(run.player.health).toBe(52);
  });

  it('supports curse expiration too, and real healing feeds Priest offense without an instant loop', () => {
    const run = setup([...ROOTS, 'siphon-toxin', 'communion', 'searing-grace']);
    run.player.health = 50;
    const target = tough(101);
    run.enemies.push(target);
    applyDot(target, dot({ kind: 'curse', school: 'shadow', damage: 2, interval: 0.5, remaining: 1, tickIn: 0.5 }));
    ticks(run, 60);
    expect(run.player.health).toBe(52);
    expect(target.health).toBe(984); // Curse 4 + holy hit (6 + 6 wound bonus).
    expect(target.dots).toHaveLength(1);
    expect(target.dots[0]!.kind).toBe('poison'); // Holy hit can apply Poison.
    expect(run.effects.pending).toEqual([]);
    expect(run.effects.dropped).toBe(0);
  });

  it('rejects invalid periodic effects and refreshes a stronger effect without duplicating a kind', () => {
    const target = tough(101);
    for (const invalid of [dot({ interval: 0 }), dot({ damage: Infinity }), dot({ remaining: -1 }), dot({ tickIn: NaN })]) applyDot(target, invalid);
    expect(target.dots).toEqual([]);
    applyDot(target, dot({ damage: 6, remaining: 1, tickIn: 0.25 }));
    applyDot(target, dot({ damage: 3, owner: 'companion' }));
    expect(target.dots).toHaveLength(1);
    expect(target.dots[0]).toMatchObject({ damage: 6, remaining: 2, tickIn: 0.25, owner: 'player' });
  });
});

describe('critical propagation and Nightfall', () => {
  it('copies every active effect to the two nearest foes from a lethal hit, with independent snapshots', () => {
    const run = setup([...ROOTS, 'killer-instinct', 'contagion']);
    const victim = enemy(101, 200, 240), first = tough(102, 210), second = tough(103, 220), third = tough(104, 230), far = tough(105, 270);
    run.enemies.push(victim, first, second, third, far);
    applyDot(victim, dot({ kind: 'curse', school: 'shadow', damage: 4, remaining: 1.5, tickIn: 0.25 }));
    for (let i = 0; i < 3; i++) damageEnemy(run, tough(900 + i, 20), 1);
    damageEnemy(run, victim, 18);
    const critical = run.effects.pending.map(({ event }) => event).find((event) => event.type === 'hit' && event.critical);
    expect(critical && 'dots' in critical && critical.dots).toHaveLength(2);
    // Projectiles may remove the victim before secondary effects drain.
    run.enemies = run.enemies.filter((target) => target.health > 0);
    victim.dots[0]!.damage = 99;
    resolveTalentEffects(run);
    expect(first.dots.map((effect) => effect.kind).sort()).toEqual(['curse', 'poison']);
    expect(second.dots).toEqual(first.dots);
    expect(first.dots.find((effect) => effect.kind === 'curse')!.damage).toBe(4);
    expect(third.dots).toEqual([]);
    expect(far.dots).toEqual([]);
    first.dots[0]!.remaining = 0.1;
    expect(second.dots[0]!.remaining).toBe(1.5);
  });

  it('critical kills spread Poison before Nightfall pulses it, and secondary kills cannot chain Nightfall', () => {
    const run = setup([...ROGUE, 'hunting-momentum']);
    const victim = enemy(101, 200, 240), doomed = enemy(102, 210, 240), survivor = tough(103, 220);
    doomed.health = 3;
    run.enemies.push(victim, doomed, survivor);
    for (let i = 0; i < 3; i++) damageEnemy(run, tough(900 + i, 20), 1);
    damageEnemy(run, victim, 18);
    resolveTalentEffects(run);
    expect(doomed.health).toBe(0);
    expect(survivor.health).toBe(997); // Exactly one extra Poison tick.
    expect(survivor.dots[0]!.remaining).toBe(2);
    expect(survivor.dots[0]!.tickIn).toBe(1);
    expect(run.kills).toBe(2);
    expect(run.shards).toHaveLength(2);
    expect(run.talentMemory.huntingCharge).toBe(true);
    expect(run.player.health).toBe(60);
    expect(run.effects.pending).toEqual([]);
    expect(run.effects.dropped).toBe(0);
  });

  it('companion critical kills can propagate effects even without Pack Link', () => {
    const run = setup([...ROGUE, 'hunting-momentum', 'falcon']);
    const victim = enemy(101, 200, 240), neighbor = tough(102, 215);
    victim.health = 10;
    applyDot(victim, dot({ owner: 'companion' }));
    run.enemies.push(victim, neighbor);
    run.talentMemory.criticalHits = 3;
    damageEnemy(run, victim, 8, { source: 'summon', school: 'physical' });
    resolveTalentEffects(run);
    expect(victim.health).toBe(0);
    expect(neighbor.health).toBe(997);
    expect(neighbor.dots[0]!.owner).toBe('companion');
  });
});
