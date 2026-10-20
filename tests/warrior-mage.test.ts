import { describe, expect, it } from 'vitest';
import { TALENTS } from '../src/content/talents';
import type { TalentId } from '../src/content/talents';
import { TALENT_TUNING as T } from '../src/content/talent-tuning';
import { createRun } from '../src/game/state';
import { damageEnemy, damagePlayer } from '../src/game/damage';
import { resolveTalentEffects } from '../src/game/talent-effects';
import { updateMelee } from '../src/game/melee';
import { updateProjectiles, applyContactDamage } from '../src/game/combat';
import { updateStatuses } from '../src/game/statuses';
import { grantShield } from '../src/game/shields';
import { moveEnemies } from '../src/game/movement';
import { tickRun } from '../src/game/run';
import { RULES, STEP } from '../src/game/rules';
import { advance, bolt, enemy, STILL } from './fixtures';

const WARRIOR = TALENTS.filter((talent) => talent.branch === 'warrior').map((talent) => talent.id);
const MAGE = TALENTS.filter((talent) => talent.branch === 'mage').map((talent) => talent.id);
function setup(talents: readonly TalentId[]) {
  const run = createRun(123, talents);
  run.spawnIn = Infinity;
  run.player.attackIn = 10;
  return run;
}
const tough = (id: number, x = 210, y = 240) => ({ ...enemy(id, x, y), health: 1000, maxHealth: 1000 });

describe('melee and Warrior talents', () => {
  it('cleaves a 120-degree arc toward the nearest foe, excludes behind/out-of-range foes, and respects cooldown', () => {
    const run = setup(['reprisal', 'sweeping-blade']);
    const front = tough(101, 200), side = tough(102, 205, 265);
    const behind = tough(103, 140), far = tough(104, 235);
    run.enemies.push(front, side, behind, far);
    updateMelee(run);
    expect([front.health, side.health, behind.health, far.health]).toEqual([984, 984, 1000, 1000]);
    expect(run.player.meleeIn).toBe(T.meleeInterval);
    expect(run.sparks.find((spark) => spark.kind === 'cleave')?.angle).toBe(0);
    updateMelee(run);
    expect(front.health).toBe(984);
    for (let i = 0; i < 67; i++) updateStatuses(run);
    updateMelee(run);
    expect(front.health).toBe(968);
  });

  it('does not swing without the talent or a target, and can face a foe behind the player', () => {
    const plain = setup([]);
    plain.enemies.push(tough(101));
    updateMelee(plain);
    expect(plain.enemies[0]!.health).toBe(1000);
    const run = setup(['reprisal', 'sweeping-blade']);
    updateMelee(run);
    expect(run.player.meleeIn).toBe(0);
    const target = tough(101, 145);
    run.enemies.push(target);
    updateMelee(run);
    expect(target.health).toBe(984);
  });

  it('Spellsteel counts physical hits, fires from the victim, skips that victim, and preserves triggered attribution', () => {
    const run = setup(['reprisal', 'sweeping-blade', 'spellsteel', 'arcane-echo', 'rime-sigil']);
    const primary = tough(101, 200), secondary = tough(102, 240);
    run.enemies.push(primary, secondary);
    damageEnemy(run, primary, 1, { source: 'talent', school: 'physical' });
    for (let i = 0; i < 3; i++) damageEnemy(run, primary, 1, { source: 'melee', school: 'physical' });
    resolveTalentEffects(run);
    expect(run.bolts).toHaveLength(1);
    expect(run.bolts[0]).toMatchObject({ x: primary.x, source: 'talent', school: 'fire', damage: 12, hitIds: [101] });
    for (let i = 0; i < 12; i++) updateProjectiles(run);
    resolveTalentEffects(run);
    expect(primary.health).toBe(996);
    expect(secondary.health).toBe(988);
    expect(secondary.frost).toBe(2);
    expect(run.talentMemory.arcaneHits).toBe(1);
    expect(run.talentMemory.physicalHits).toBe(1);
  });

  it('Spellsteel cannot hit its own victim when no other target exists or exceed the projectile cap', () => {
    const run = setup(['reprisal', 'spellsteel']);
    const target = tough(101);
    run.enemies.push(target);
    for (let i = 0; i < 3; i++) damageEnemy(run, target, 1, { source: 'melee', school: 'physical' });
    resolveTalentEffects(run);
    expect(run.bolts).toHaveLength(0);
    run.enemies.push(tough(102, 240));
    run.bolts = Array.from({ length: RULES.maxBolts }, (_, id) => bolt({ id }));
    damageEnemy(run, target, 1, { source: 'melee', school: 'physical' });
    resolveTalentEffects(run);
    expect(run.bolts).toHaveLength(RULES.maxBolts);
    expect(run.talentMemory.physicalHits).toBe(3);
    run.bolts.pop();
    damageEnemy(run, target, 1, { source: 'melee', school: 'physical' });
    resolveTalentEffects(run);
    expect(run.bolts).toHaveLength(RULES.maxBolts);
    expect(run.bolts.at(-1)!.source).toBe('talent');
    expect(run.talentMemory.physicalHits).toBe(0);
  });

  it('Frostbreak consumes once for bonus damage and a stun across physical sources', () => {
    const run = setup(['reprisal', 'sweeping-blade', 'frostbreak']);
    const target = tough(101);
    run.enemies.push(target);
    target.frost = 2;
    damageEnemy(run, target, 10, { source: 'talent', school: 'physical' });
    expect(target.frost).toBe(0);
    damageEnemy(run, target, 16, { source: 'melee', school: 'physical' });
    expect(target.health).toBe(966);
    expect(target.frost).toBe(0);
    expect(target.stun).toBe(T.frostbreakStun);
    damageEnemy(run, target, 16, { source: 'melee', school: 'physical' });
    expect(target.health).toBe(950);
  });

  it('Iron Ward grants protection after surviving health loss and enforces its five-second cooldown', () => {
    const run = setup(['reprisal', 'spellsteel', 'iron-ward']);
    damagePlayer(run, 12);
    resolveTalentEffects(run);
    expect(run.player.health).toBe(48);
    expect(run.player.shield).toEqual({ amount: 8, remaining: 3 });
    run.player.invulnerable = 0;
    damagePlayer(run, 12);
    resolveTalentEffects(run);
    expect(run.player.health).toBe(44);
    expect(run.player.shield.amount).toBe(0);
    for (let i = 0; i < 301; i++) updateStatuses(run);
    run.player.invulnerable = 0;
    damagePlayer(run, 1);
    resolveTalentEffects(run);
    expect(run.player.shield.amount).toBe(8);
  });

  it('Last Stand fires once per enemy-broken shield, including a fully absorbed hit, but never on expiration', () => {
    const run = setup(WARRIOR);
    const nearby = tough(101, 210), distant = tough(102, 280);
    run.enemies.push(nearby, distant);
    grantShield(run, 8, 3);
    damagePlayer(run, 8);
    resolveTalentEffects(run);
    expect(run.player.health).toBe(60);
    expect(nearby.health).toBe(980);
    expect(distant.health).toBe(1000);
    // No health loss: neither Reprisal nor Iron Ward trigger.
    expect(run.player.shield.amount).toBe(0);
    run.player.invulnerable = 0;
    damagePlayer(run, 1);
    resolveTalentEffects(run);
    expect(nearby.health).toBe(968); // Reprisal, not another Last Stand.
    for (let i = 0; i < 181; i++) updateStatuses(run);
    resolveTalentEffects(run);
    expect(run.player.shield.amount).toBe(0);
    expect(nearby.health).toBe(968);
  });

  it('fatal health loss cannot grant a ward or fire post-death retaliation', () => {
    const run = setup(WARRIOR);
    run.player.health = 1;
    const target = tough(101);
    run.enemies.push(target);
    grantShield(run, 8, 3);
    damagePlayer(run, 12);
    resolveTalentEffects(run);
    expect(run.status).toBe('defeated');
    expect(run.player.shield.amount).toBe(0);
    expect(target.health).toBe(1000);
  });
});

describe('Frost, triggered spells, and Mage talents', () => {
  it('Rime Sigil refreshes Frost on embers, slows movement by 30%, and expires cleanly', () => {
    const run = setup(['arcane-echo', 'rime-sigil']);
    const target = tough(101), plain = tough(102, 210);
    run.enemies.push(target);
    damageEnemy(run, target, 1);
    resolveTalentEffects(run);
    expect(target.frost).toBe(T.frostDuration);
    moveEnemies([target], run.player);
    moveEnemies([plain], run.player);
    expect(210 - target.x).toBeCloseTo((210 - plain.x) * 0.7);
    updateStatuses(run);
    damageEnemy(run, target, 1);
    resolveTalentEffects(run);
    expect(target.frost).toBe(2);
    for (let i = 0; i < 121; i++) updateStatuses(run);
    expect(target.frost).toBe(0);
    damageEnemy(run, target, 1, { source: 'blast' });
    resolveTalentEffects(run);
    expect(target.frost).toBe(2);
  });

  it('stunned enemies neither move nor attack until the stun expires', () => {
    const run = setup([]);
    const target = tough(101, 180);
    target.stun = 0.6;
    run.enemies.push(target);
    moveEnemies(run.enemies, { x: 200, y: 240 });
    expect(target.x).toBe(180);
    applyContactDamage(run);
    expect(run.player.health).toBe(60);
    for (let i = 0; i < 37; i++) updateStatuses(run);
    applyContactDamage(run);
    expect(run.player.health).toBe(48);
  });

  it('Chain Spark counts Arcane Echo hits and chains lightning to a different target without recursion', () => {
    const run = setup(['arcane-echo', 'chain-spark']);
    const primary = tough(101, 200), secondary = tough(102, 240);
    run.enemies.push(primary, secondary);
    for (let i = 0; i < 9; i++) damageEnemy(run, primary, 1);
    resolveTalentEffects(run);
    expect(secondary.health).toBe(973); // Three 9-damage echoes.
    expect(primary.health).toBe(981); // Nine direct hits plus one lightning chain.
    expect(run.talentMemory.chainHits).toBe(0);
    expect(run.effects.pending).toEqual([]);
    expect(run.effects.dropped).toBe(0);
    expect(run.sparks.some((spark) => spark.kind === 'lightning')).toBe(true);
  });

  it('Shatterglass bursts once per frozen physical hit, including lethal victims, with normal kill credit', () => {
    const run = setup(['arcane-echo', 'rime-sigil', 'shatterglass']);
    const primary = enemy(101, 200, 240), neighbor = tough(102, 230), far = tough(103, 300);
    primary.frost = 2;
    run.enemies.push(primary, neighbor, far);
    damageEnemy(run, primary, 18, { source: 'talent', school: 'physical' });
    resolveTalentEffects(run);
    expect(primary.health).toBe(0);
    expect(neighbor.health).toBe(990);
    expect(far.health).toBe(1000);
    expect(run.kills).toBe(1);
    expect(run.shards).toHaveLength(1);
    damageEnemy(run, neighbor, 1, { source: 'melee', school: 'physical' });
    resolveTalentEffects(run);
    expect(neighbor.health).toBe(989);
  });

  it('a six-point frost/melee hybrid gets both Frostbreak and Shatterglass from one consumption', () => {
    const run = setup(['reprisal', 'sweeping-blade', 'frostbreak', 'arcane-echo', 'rime-sigil', 'shatterglass']);
    const primary = tough(101, 205), neighbor = tough(102, 235);
    run.enemies.push(primary, neighbor);
    damageEnemy(run, primary, 1);
    resolveTalentEffects(run);
    damageEnemy(run, primary, 16, { source: 'melee', school: 'physical' });
    resolveTalentEffects(run);
    expect(primary.health).toBe(965); // Ember 1 + melee 16 + Frostbreak 8 + burst 10.
    expect(neighbor.health).toBe(990);
    expect(primary.frost).toBe(0);
    expect(primary.stun).toBe(0.6);
    expect(run.effects.dropped).toBe(0);
  });

  it('Warrior retaliation can shatter Mage Frost without needing a melee hit', () => {
    const run = setup(['reprisal', 'arcane-echo', 'rime-sigil', 'shatterglass']);
    const target = tough(101, 205);
    run.enemies.push(target);
    damageEnemy(run, target, 1);
    resolveTalentEffects(run);
    damagePlayer(run, 1);
    resolveTalentEffects(run);
    expect(target.health).toBe(977);
    expect(target.frost).toBe(0);
  });

  it('Mana Ward counts triggered spell hits, excluding direct attacks and physical retaliation', () => {
    const run = setup(['arcane-echo', 'chain-spark', 'mana-ward']);
    const primary = tough(101, 200), secondary = tough(102, 240);
    run.enemies.push(primary, secondary);
    for (let i = 0; i < 6; i++) damageEnemy(run, primary, 1);
    resolveTalentEffects(run);
    expect(run.player.shield.amount).toBe(0);
    expect(run.talentMemory.spellHits).toBe(2);
    damageEnemy(run, primary, 1, { source: 'talent', school: 'physical' });
    for (let i = 0; i < 3; i++) damageEnemy(run, primary, 1);
    resolveTalentEffects(run);
    expect(run.player.shield).toEqual({ amount: 8, remaining: 3 });
    expect(run.talentMemory.spellHits).toBe(1); // Lightning chain also counts.
  });

  it('Riftweaver refunds ember/melee cooldowns at most once a second and never below zero', () => {
    const run = setup(MAGE);
    const target = tough(101);
    run.enemies.push(target);
    run.player.attackIn = 0.7;
    run.player.meleeIn = 1.1;
    for (let i = 0; i < 4; i++) damageEnemy(run, target, 1, { source: 'talent', school: 'holy' });
    resolveTalentEffects(run);
    expect(run.player.attackIn).toBeCloseTo(0.55);
    expect(run.player.meleeIn).toBeCloseTo(0.95);
    for (let i = 0; i < 61; i++) updateStatuses(run);
    run.player.attackIn = 0.1;
    damageEnemy(run, target, 1);
    resolveTalentEffects(run);
    expect(run.player.attackIn).toBe(0.1);
    damageEnemy(run, target, 1, { source: 'talent', school: 'shadow' });
    resolveTalentEffects(run);
    expect(run.player.attackIn).toBe(0);
    expect(run.player.meleeIn).toBe(0);
  });
});

describe('shared protection and lifecycle', () => {
  it('shields refresh without stacking or weakening, absorb before health, and preserve contact protection', () => {
    const run = setup([]);
    grantShield(run, 8, 3);
    updateStatuses(run);
    grantShield(run, 8, 3);
    grantShield(run, 4, 1);
    expect(run.player.shield).toEqual({ amount: 8, remaining: 3 });
    damagePlayer(run, 4);
    expect(run.player.health).toBe(60);
    expect(run.player.shield.amount).toBe(4);
    damagePlayer(run, 12);
    expect(run.player.shield.amount).toBe(4);
    run.player.invulnerable = 0;
    damagePlayer(run, 12);
    expect(run.player.health).toBe(52);
    expect(run.player.shield).toEqual({ amount: 0, remaining: 0 });
    expect(run.effects.pending.filter(({ event }) => event.type === 'shield-broken')).toHaveLength(1);
  });

  it('invalid shields are rejected, expiration is silent, and paused/defeated runs freeze all timers', () => {
    const run = setup(MAGE);
    const target = tough(101);
    target.frost = 2;
    run.enemies.push(target);
    grantShield(run, NaN, 3);
    grantShield(run, 8, Infinity);
    expect(run.player.shield.amount).toBe(0);
    grantShield(run, 8, 0.01);
    updateStatuses(run);
    expect(run.player.shield).toEqual({ amount: 0, remaining: 0 });
    expect(run.effects.pending).toEqual([]);
    grantShield(run, 8, 3);
    run.status = 'choosing';
    const snapshot = structuredClone(run);
    tickRun(run, STILL);
    expect(run).toEqual(snapshot);
    run.status = 'defeated';
    grantShield(run, 20, 5);
    expect(run.player.shield.amount).toBe(8);
  });

  it('complete branches and the frost/melee hybrid remain bounded and deterministic in dense simulation', () => {
    const builds: readonly TalentId[][] = [WARRIOR, MAGE,
      ['reprisal', 'sweeping-blade', 'frostbreak', 'arcane-echo', 'rime-sigil', 'shatterglass']];
    for (const build of builds) {
      const runs = [setup(build), setup([...build].reverse())];
      for (const run of runs) {
        run.player.attackIn = 0;
        for (let i = 0; i < 80; i++) run.enemies.push(tough(101 + i, 180 + Math.cos(i) * 40, 240 + Math.sin(i) * 40));
        for (let i = 0; i < Math.round(10 / STEP); i++) {
          // Keep the workload running, without a test-only production game mode.
          run.player.health = 60;
          advance(run, STEP);
        }
        expect(run.enemies.length).toBeLessThanOrEqual(80);
        expect(run.bolts.length).toBeLessThanOrEqual(RULES.maxBolts);
        expect(run.sparks.length).toBeLessThanOrEqual(RULES.maxSparks);
        expect(run.effects.pending).toEqual([]);
        expect(run.effects.dropped).toBe(0);
        expect(Number.isFinite(run.player.health)).toBe(true);
      }
      expect(runs[0]!.kills).toBe(runs[1]!.kills);
      expect(runs[0]!.enemies.map((e) => e.health)).toEqual(runs[1]!.enemies.map((e) => e.health));
    }
  });
});
