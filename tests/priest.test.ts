import { describe, expect, it } from 'vitest';
import { createRun } from '../src/game/state';
import type { TalentId } from '../src/content/talents';
import type { DamageSource } from '../src/game/events';
import { damageEnemy, damagePlayer } from '../src/game/damage';
import { healPlayer } from '../src/game/healing';
import { grantShield } from '../src/game/shields';
import { updateStatuses } from '../src/game/statuses';
import { updatePickups } from '../src/game/pickups';
import { chooseUpgrade } from '../src/game/progression';
import { resolveTalentEffects } from '../src/game/talent-effects';
import { updateCompanions } from '../src/game/companions';
import { enemy } from './fixtures';

export const PRIEST: TalentId[] = ['communion', 'searing-grace', 'sanctuary', 'atonement', 'martyr-ward', 'dawn-chorus'];
function setup(talents = PRIEST) {
  const run = createRun(123, talents);
  run.spawnIn = Infinity;
  return run;
}
const tough = (id = 101) => ({ ...enemy(id, 210, 240), health: 1000, maxHealth: 1000 });

describe('healing, excess healing, and Sanctuary', () => {
  it.each<DamageSource>(['ember', 'melee', 'blast', 'talent', 'dot', 'summon'])('Communion accepts %s kills', (source) => {
    const run = setup(['communion']);
    run.player.health = 40;
    for (let id = 1; id <= 4; id++) damageEnemy(run, enemy(id, 20, 20), 18, { source });
    resolveTalentEffects(run);
    expect(run.player.health).toBe(43);
    expect(run.talentMemory.communionKills).toBe(0);
  });

  it('splits partial healing: only restoration powers Grace/Soul Link, only excess grows the ward', () => {
    const run = setup(['communion', 'searing-grace', 'sanctuary', 'martyr-ward', 'soul-cinder', 'grim-pact', 'soul-link']);
    const target = tough();
    run.enemies.push(target);
    run.player.health = 58;
    expect(healPlayer(run, 5)).toBe(2);
    resolveTalentEffects(run);
    expect(run.player.health).toBe(60);
    expect(run.player.shield).toEqual({ amount: 1.5, remaining: 4 });
    expect(target.health).toBe(994);
    expect(run.companions[0]!.bonusDamage).toBeCloseTo(0.8);
    healPlayer(run, 5);
    resolveTalentEffects(run);
    expect(run.player.shield.amount).toBe(4);
    expect(target.health).toBe(994);
    expect(run.companions[0]!.bonusDamage).toBeCloseTo(0.8);
  });

  it('accumulates fractional excess wards to a cap, refreshes lifetime, and never weakens stronger protection', () => {
    const run = setup();
    healPlayer(run, 1);
    resolveTalentEffects(run);
    expect(run.player.shield.amount).toBe(0.5);
    updateStatuses(run);
    healPlayer(run, 1);
    resolveTalentEffects(run);
    expect(run.player.shield).toEqual({ amount: 1, remaining: 4 });
    healPlayer(run, 100);
    resolveTalentEffects(run);
    expect(run.player.shield.amount).toBe(12);
    grantShield(run, 20, 10);
    healPlayer(run, 1);
    resolveTalentEffects(run);
    expect(run.player.shield).toEqual({ amount: 20, remaining: 10 });
  });

  it('collects all XP while Sanctuary heals at most once per second and can feed Martyr Ward', () => {
    const run = setup(['communion', 'sanctuary', 'martyr-ward']);
    run.player.health = 50;
    for (let id = 1; id <= 3; id++) run.shards.push({ id, x: 180, y: 240, value: 5 });
    updatePickups(run, 56);
    resolveTalentEffects(run);
    expect(run.xp).toBe(15);
    expect(run.shards).toEqual([]);
    expect(run.player.health).toBe(51);
    expect(chooseUpgrade(run, 'haste')).toBe(true);
    for (let i = 0; i < 61; i++) updateStatuses(run);
    run.player.health = 60;
    run.shards.push({ id: 20, x: 180, y: 240, value: 1 });
    updatePickups(run, 56);
    resolveTalentEffects(run);
    expect(run.player.shield.amount).toBe(0.5);
  });

  it('does not heal from merely attracting a shard', () => {
    const run = setup();
    run.player.health = 40;
    run.shards.push({ id: 1, x: 220, y: 240, value: 5 });
    updatePickups(run, 56);
    resolveTalentEffects(run);
    expect(run.player.health).toBe(40);
    expect(run.talentMemory.sanctuaryIn).toBe(0);
  });

  it('Communion cannot count kills caused by its own healing/offense chain', () => {
    const run = setup(['communion', 'searing-grace']);
    run.player.health = 40;
    run.talentMemory.communionKills = 3;
    const secondary = enemy(101, 210, 240);
    secondary.health = 6;
    run.enemies.push(secondary);
    damageEnemy(run, enemy(102, 20, 20), 18);
    resolveTalentEffects(run);
    expect(run.kills).toBe(2);
    expect(run.player.health).toBe(43);
    expect(run.talentMemory.communionKills).toBe(0);
    expect(run.effects.pending).toEqual([]);
    expect(run.effects.dropped).toBe(0);
  });
});

describe('holy marks and shared physical effects', () => {
  it.each<DamageSource>(['melee', 'talent', 'summon'])('%s physical hits consume one mark for a holy strike without re-marking', (source) => {
    const run = setup();
    const target = tough();
    run.enemies.push(target);
    damageEnemy(run, target, 1, { source: 'talent', school: 'holy' });
    resolveTalentEffects(run);
    expect(target.holyMark).toBe(5);
    damageEnemy(run, target, 10, { source, school: 'physical' });
    resolveTalentEffects(run);
    expect(target.health).toBe(981);
    expect(target.holyMark).toBe(0);
    damageEnemy(run, target, 10, { source, school: 'physical' });
    resolveTalentEffects(run);
    expect(target.health).toBe(971);
  });

  it('ignores periodic holy/physical ticks and lets unused marks expire', () => {
    const run = setup();
    const target = tough();
    run.enemies.push(target);
    damageEnemy(run, target, 1, { source: 'dot', school: 'holy' });
    resolveTalentEffects(run);
    expect(target.holyMark).toBe(0);
    damageEnemy(run, target, 1, { school: 'holy' });
    resolveTalentEffects(run);
    damageEnemy(run, target, 1, { source: 'dot', school: 'physical' });
    resolveTalentEffects(run);
    expect(target.holyMark).toBe(5);
    for (let i = 0; i < 301; i++) updateStatuses(run);
    damageEnemy(run, target, 1, { source: 'melee', school: 'physical' });
    resolveTalentEffects(run);
    expect(target.health).toBe(996);
    expect(target.holyMark).toBe(0);
  });

  it('does not resurrect or double-credit a marked foe killed by the physical hit', () => {
    const run = setup();
    const target = enemy(101, 210, 240);
    target.holyMark = 5;
    run.enemies.push(target);
    damageEnemy(run, target, 18, { source: 'melee', school: 'physical' });
    resolveTalentEffects(run);
    expect(target.health).toBe(0);
    expect(run.kills).toBe(1);
    expect(run.shards).toHaveLength(1);
    expect(run.sparks.some((spark) => spark.kind === 'atonement')).toBe(false);
  });

  it('falcons turn healing-created marks into offense without needing Pack Link', () => {
    const run = setup([...PRIEST, 'hunting-momentum', 'falcon']);
    const target = tough();
    run.enemies.push(target);
    run.player.health = 50;
    healPlayer(run, 1);
    resolveTalentEffects(run);
    updateCompanions(run);
    resolveTalentEffects(run);
    expect(target.health).toBe(978); // Grace 6 + falcon 8 + Atonement 8.
    expect(target.holyMark).toBe(0);
  });
});

describe('Dawn Chorus and protection lifecycle', () => {
  it('reacts to any shield source, including full absorption and breaks, with a one-second cooldown', () => {
    const run = setup();
    const target = tough();
    run.enemies.push(target);
    run.player.health = 50;
    grantShield(run, 8, 3);
    damagePlayer(run, 4);
    resolveTalentEffects(run);
    expect(run.player.health).toBe(52);
    expect(target.health).toBe(986); // Dawn 8 + Grace 6.
    expect(run.player.shield.amount).toBe(4);
    run.player.invulnerable = 0;
    damagePlayer(run, 1);
    resolveTalentEffects(run);
    expect(run.player.health).toBe(52);
    expect(target.health).toBe(986);
    for (let i = 0; i < 61; i++) updateStatuses(run);
    run.player.invulnerable = 0;
    damagePlayer(run, 3);
    resolveTalentEffects(run);
    expect(run.player.health).toBe(54);
    expect(target.health).toBe(972);
    expect(run.player.shield.amount).toBe(0);
  });

  it('overhealing from a fully absorbed hit can rebuild one bounded ward without an instant loop', () => {
    const run = setup();
    const target = tough();
    run.enemies.push(target);
    grantShield(run, 8, 3);
    damagePlayer(run, 8);
    resolveTalentEffects(run);
    expect(run.player.health).toBe(60);
    expect(run.player.shield.amount).toBe(1); // Dawn's wasted 2 healing, halved.
    expect(target.health).toBe(992); // No Grace from wasted healing.
    expect(run.effects.pending).toEqual([]);
    expect(run.effects.dropped).toBe(0);
  });

  it('expiration cannot trigger Dawn, and fatal hits cannot heal or retaliate after death', () => {
    const run = setup();
    const target = tough();
    run.enemies.push(target);
    run.player.health = 1;
    grantShield(run, 8, 0.01);
    updateStatuses(run);
    resolveTalentEffects(run);
    expect(run.player.health).toBe(1);
    expect(target.health).toBe(1000);
    grantShield(run, 1, 3);
    damagePlayer(run, 12);
    resolveTalentEffects(run);
    expect(run.status).toBe('defeated');
    expect(run.player.health).toBe(0);
    expect(healPlayer(run, 100)).toBe(0);
    expect(run.player.shield.amount).toBe(0);
    expect(target.health).toBe(1000);
  });
});
