import { describe, expect, it } from 'vitest';
import { TALENTS, talentById } from '../src/content/talents';
import type { TalentId } from '../src/content/talents';
import { UPGRADES } from '../src/content/upgrades';
import type { UpgradeId } from '../src/content/upgrades';
import { createRun } from '../src/game/state';
import type { Run } from '../src/game/state';
import { validateBuild } from '../src/game/builds';
import { damageEnemy, damagePlayer } from '../src/game/damage';
import { healPlayer } from '../src/game/healing';
import { chooseUpgrade } from '../src/game/progression';
import { updateCompanions } from '../src/game/companions';
import { updateMelee } from '../src/game/melee';
import { updateStatuses } from '../src/game/statuses';
import { updateProjectiles } from '../src/game/combat';
import { resolveTalentEffects } from '../src/game/talent-effects';
import { beginEffectTick, drainEffects } from '../src/game/events';
import { fireBolt } from '../src/game/projectiles';
import { STEP, RULES } from '../src/game/rules';
import { advance, bolt, enemy } from './fixtures';

function setup(build: readonly TalentId[]): Run {
  expect(validateBuild(build).valid).toBe(true);
  const run = createRun(42, build);
  run.spawnIn = Infinity;
  run.player.attackIn = 10;
  return run;
}
const tough = (id = 101, x = 205, y = 240) => ({ ...enemy(id, x, y), health: 1000, maxHealth: 1000, grace: 100 });
function select(run: Run, id: UpgradeId): void {
  run.progression.level = Math.max(run.progression.level, UPGRADES.find((entry) => entry.id === id)!.minLevel);
  run.progression.pendingLevels = 1;
  run.progression.offers = [id];
  run.status = 'choosing';
  expect(chooseUpgrade(run, id)).toBe(true);
}
function fly(run: Run, steps = 20): void {
  for (let i = 0; i < steps; i++) updateProjectiles(run);
  resolveTalentEffects(run);
}
const MAGE = TALENTS.filter((entry) => entry.branch === 'mage').map((entry) => entry.id);

describe('upgrades support multiple attack families', () => {
  it('haste produces more melee, falcon, and imp damage over the same time', () => {
    for (const build of [
      ['reprisal', 'sweeping-blade'], ['hunting-momentum', 'falcon'], ['soul-cinder', 'grim-pact'],
    ] satisfies TalentId[][]) {
      const plain = setup(build), faster = setup(build);
      for (let i = 0; i < 4; i++) select(faster, 'haste');
      for (const run of [plain, faster]) {
        run.enemies.push(tough());
        for (let i = 0; i < 6 / STEP; i++) {
          beginEffectTick(run.effects);
          updateStatuses(run); updateMelee(run); updateCompanions(run); updateProjectiles(run);
          resolveTalentEffects(run);
        }
      }
      expect(faster.enemies[0]!.health).toBeLessThan(plain.enemies[0]!.health);
    }
  });

  it('only haste rescales remaining timers, preserving progress for all attackers', () => {
    const run = setup(['reprisal', 'sweeping-blade', 'hunting-momentum', 'falcon', 'soul-cinder', 'grim-pact']);
    run.player.attackIn = 0.35; run.player.meleeIn = 0.55;
    run.companions[0]!.attackIn = 0.5; run.companions[1]!.attackIn = 0.7;
    select(run, 'fork');
    expect([run.player.attackIn, run.player.meleeIn, ...run.companions.map((entry) => entry.attackIn)]).toEqual([0.35, 0.55, 0.5, 0.7]);
    select(run, 'haste');
    const ratio = 0.62 / 0.7;
    for (const [actual, before] of [[run.player.attackIn, 0.35], [run.player.meleeIn, 0.55], [run.companions[0]!.attackIn, 0.5], [run.companions[1]!.attackIn, 0.7]]) {
      expect(actual).toBeCloseTo(before! * ratio);
    }
  });

  it.each(['imp', 'spellsteel'] as const)('%s volleys inherit fork, pierce, and explosions at launch', (kind) => {
    const run = setup(kind === 'imp' ? ['soul-cinder', 'grim-pact'] : ['reprisal', 'spellsteel']);
    run.player.x = 100; run.player.y = 100;
    if (run.companions[0]) { run.companions[0].x = 100; run.companions[0].y = 100; }
    const origin = tough(100, 100, 100);
    run.enemies.push(tough(101, 140, 100), tough(102, 100, 140));
    for (const id of ['fork', 'pierce', 'burst'] as const) select(run, id);
    if (kind === 'imp') updateCompanions(run);
    else {
      run.enemies.push(origin);
      for (let i = 0; i < 3; i++) damageEnemy(run, origin, 1, { source: 'melee', school: 'physical' });
      resolveTalentEffects(run);
    }
    expect(run.bolts).toHaveLength(2);
    expect(new Set(run.bolts.map((entry) => `${entry.vx},${entry.vy}`)).size).toBe(2);
    for (const shot of run.bolts) expect(shot).toMatchObject({ pierce: 1, blastRadius: 20, source: kind === 'imp' ? 'summon' : 'talent' });
    // Add one foe behind a target and one to its side: only piercing reaches the former,
    // and only the impact explosion can reach the latter (no extra launched target).
    run.enemies.push(tough(103, 170, 100), tough(104, 140, 118));
    fly(run, 22);
    expect(run.enemies.find((entry) => entry.id === 102)!.health).toBeLessThan(1000);
    expect(run.enemies.find((entry) => entry.id === 103)!.health).toBeLessThan(1000);
    expect(run.enemies.find((entry) => entry.id === 104)!.health).toBeLessThan(1000);
    expect(run.sparks.some((entry) => entry.kind === 'burst')).toBe(true);
  });

  it.each([false, true])('imp explosions retain companion ownership and Pack Link gating (linked: %s)', (linked) => {
    const run = setup(['soul-cinder', 'grim-pact', 'agony', 'expose-weakness', 'venom-edge',
      ...(linked ? ['hunting-momentum', 'falcon', 'pack-link'] as const : [])]);
    run.player.x = 100; run.player.y = 100;
    for (const companion of run.companions) { companion.x = 100; companion.y = 100; if (companion.kind === 'falcon') companion.attackIn = 100; }
    const target = tough(101, 140, 100), side = tough(102, 140, 118);
    run.enemies.push(target, side);
    select(run, 'burst'); updateCompanions(run); fly(run);
    expect(target.health).toBe(991); expect(side.health).toBe(995.5);
    for (const victim of [target, side]) {
      expect(victim.dots).toHaveLength(linked ? 2 : 0);
      expect(victim.dots.every((dot) => dot.owner === 'companion')).toBe(true);
    }
    expect(run.sparks.filter((entry) => entry.kind === 'burst')).toHaveLength(1);
  });
});

describe('open cross-branch triggers', () => {
  it('Ashburst fire hits feed Echo, Rime, Mana Ward, and all Riftweaver attack refunds', () => {
    const run = setup([...MAGE, 'soul-cinder', 'grim-pact']);
    run.player.attackIn = 0.7; run.player.meleeIn = 1.1; run.companions[0]!.attackIn = 1.4;
    run.enemies.push(tough(101, 100, 100), tough(102, 110, 115), tough(103, 90, 115));
    run.bolts.push(bolt({ blastRadius: 20 }));
    fly(run, 1);
    expect(run.enemies.every((target) => target.frost === 2)).toBe(true);
    expect(run.sparks.some((entry) => entry.kind === 'arcane')).toBe(true);
    expect(run.player.shield.amount).toBe(8);
    expect(run.player.attackIn).toBeCloseTo(0.55);
    expect(run.player.meleeIn).toBeCloseTo(0.95);
    expect(run.companions[0]!.attackIn).toBeCloseTo(1.25);
    // Periodic fire is not another on-hit trigger or spell refund.
    run.enemies[0]!.frost = 0;
    damageEnemy(run, run.enemies[0]!, 1, { source: 'dot', school: 'fire' }); resolveTalentEffects(run);
    expect(run.enemies[0]!.frost).toBe(0);
    expect(run.talentMemory.arcaneHits).toBe(0);
    expect(run.companions[0]!.attackIn).toBeCloseTo(1.25);
  });

  it.each([false, true])('linked imp fire feeds Echo and Mana Ward (linked: %s)', (linked) => {
    const run = setup(['soul-cinder', 'grim-pact', 'arcane-echo', 'chain-spark', 'mana-ward',
      ...(linked ? ['hunting-momentum', 'falcon', 'pack-link'] as const : [])]);
    run.player.x = 100; run.player.y = 100;
    run.enemies.push(tough(101, 140, 100), tough(102, 160, 140));
    const imp = run.companions.find((entry) => entry.kind === 'imp')!;
    const falcon = run.companions.find((entry) => entry.kind === 'falcon');
    if (falcon) falcon.attackIn = 100;
    for (let i = 0; i < 3; i++) {
      beginEffectTick(run.effects);
      imp.attackIn = 0; imp.x = 100; imp.y = 100;
      updateCompanions(run); fly(run);
    }
    expect(run.enemies[1]!.health).toBe(linked ? 991 : 1000);
    expect(run.player.shield.amount).toBe(linked ? 8 : 0);
  });

  it.each([false, true])('physical companion hits feed Spellsteel only with Pack Link (linked: %s)', (linked) => {
    const run = setup(['reprisal', 'spellsteel', 'hunting-momentum', 'falcon', ...(linked ? ['pack-link'] as const : [])]);
    run.enemies.push(tough(101), tough(102, 260));
    for (let i = 0; i < 3; i++) {
      run.companions[0]!.attackIn = 0;
      updateCompanions(run); resolveTalentEffects(run);
    }
    expect(run.bolts).toHaveLength(Number(linked));
    fly(run);
    expect(run.enemies[1]!.health).toBe(linked ? 988 : 1000);
  });

  it('unlinked physical companions can combine Frostbreak and Shatterglass', () => {
    const run = setup(['reprisal', 'sweeping-blade', 'frostbreak', 'arcane-echo', 'rime-sigil', 'shatterglass', 'hunting-momentum', 'falcon']);
    const primary = tough(), side = tough(102, 230);
    run.enemies.push(primary, side);
    damageEnemy(run, primary, 1); resolveTalentEffects(run);
    updateCompanions(run); resolveTalentEffects(run);
    expect(primary.health).toBe(973); expect(side.health).toBe(990);
    expect(primary.frost).toBe(0); expect(primary.stun).toBe(0.6);
  });

  it('Living Ember actual healing powers Grace and both companions; forked shots snapshot one bonus per volley', () => {
    const run = setup(['communion', 'searing-grace', 'soul-cinder', 'grim-pact', 'soul-link', 'hunting-momentum', 'falcon']);
    run.enemies.push(tough(), tough(102, 260));
    select(run, 'vitality');
    expect(run.player.health).toBe(72);
    expect(run.enemies[0]!.health).toBe(1000);
    expect(run.companions.every((entry) => entry.bonusDamage === 0)).toBe(true);
    resolveTalentEffects(run);
    expect(run.enemies[0]!.health).toBe(994);
    for (const companion of run.companions) expect(companion.bonusDamage).toBeCloseTo(4.8);
    select(run, 'fork'); updateCompanions(run);
    expect(run.bolts).toHaveLength(2);
    for (const shot of run.bolts) expect(shot.damage).toBeCloseTo(13.8);
    expect(run.companions.every((entry) => entry.bonusDamage === 0)).toBe(true);
    run.player.health -= 5; healPlayer(run, 5); resolveTalentEffects(run);
    for (const shot of run.bolts) expect(shot.damage).toBeCloseTo(13.8);
  });

  it.each([false, true])('Soul Gatherer collection powers Sanctuary actual/excess healing (wounded: %s)', (wounded) => {
    const plain = setup(['communion', 'sanctuary', 'martyr-ward', 'searing-grace']);
    const magnet = setup(['communion', 'sanctuary', 'martyr-ward', 'searing-grace']);
    select(magnet, 'magnet');
    for (const run of [plain, magnet]) {
      if (wounded) run.player.health = 40;
      run.enemies.push(tough(101, 230, 320));
      run.shards.push({ id: 200, x: 250, y: 240, value: 5 });
      advance(run, 1);
    }
    expect(plain.xp).toBe(0); expect(magnet.xp).toBe(5);
    expect(magnet.player.health).toBe(wounded ? 41 : 60);
    expect(magnet.player.shield.amount).toBe(wounded ? 0 : 0.5);
    expect(magnet.enemies[0]!.health).toBe(wounded ? 994 : 1000);
  });

  it('delayed projectile hits retain ancestry while later ordinary attacks start a fresh chain', () => {
    const run = setup([]);
    const first = tough(101, 100, 100), second = tough(102, 140, 100);
    run.enemies.push(first, second);
    let procs = 0;
    const handlers = [{ id: 'delayed-trigger', on: 'hit' as const, apply() {
      procs++;
      fireBolt(run, first, second, { damage: 1, source: 'talent', school: 'fire', excludeId: first.id });
    } }];
    damageEnemy(run, first, 1);
    drainEffects(run.effects, run, handlers);
    const shot = run.bolts[0]!;
    expect(shot.effectContext?.ancestry).toContain('delayed-trigger');
    expect(structuredClone(shot)).toEqual(shot);
    for (let i = 0; i < 12; i++) updateProjectiles(run);
    drainEffects(run.effects, run, handlers);
    expect(second.health).toBe(999); expect(procs).toBe(1); expect(run.bolts).toHaveLength(0);
    expect(run.effects.current).toBeNull();
    damageEnemy(run, first, 1);
    drainEffects(run.effects, run, handlers);
    expect(procs).toBe(2); expect(run.bolts).toHaveLength(1);
  });
});

function prerequisites(id: TalentId, build: TalentId[] = []): TalentId[] {
  for (const parent of talentById(id)!.requires) prerequisites(parent as TalentId, build);
  if (!build.includes(id)) build.push(id);
  return build;
}
const upgradeSets = [...UPGRADES.map((entry) => ({ name: entry.id, ranks: { [entry.id]: entry.maxRank } })),
  { name: 'all maximum ranks', ranks: Object.fromEntries(UPGRADES.map((entry) => [entry.id, entry.maxRank])) }];

describe('whole-catalog interaction sweep', () => {
  for (const talent of TALENTS) {
    it.each(upgradeSets)(`${talent.name} with $name stays deterministic and bounded`, ({ ranks }) => {
      const build = prerequisites(talent.id);
      const runs = [setup(build), setup([...build].reverse())];
      for (const run of runs) {
        run.progression.ranks = { ...ranks };
        run.player.attackIn = 0;
        for (let i = 0; i < 36; i++) run.enemies.push(tough(101 + i, 180 + Math.cos(i * Math.PI / 18) * 40, 240 + Math.sin(i * Math.PI / 18) * 40));
        damagePlayer(run, 1); healPlayer(run, 12); resolveTalentEffects(run);
        advance(run, 2);
        expect(run.status).toBe('running');
        expect(run.enemies.reduce((sum, target) => sum + target.health, 0)).toBeLessThan(36_000);
        expect(run.bolts.length).toBeLessThanOrEqual(RULES.maxBolts);
        expect(run.snares.length).toBeLessThanOrEqual(8);
        expect(run.sparks.length).toBeLessThanOrEqual(RULES.maxSparks);
        expect(run.effects.pending).toEqual([]); expect(run.effects.dropped).toBe(0);
        for (const value of [run.player.health, run.player.shield.amount, ...run.enemies.flatMap((target) => [target.x, target.y, target.health, ...target.dots.map((dot) => dot.remaining)])]) {
          expect(Number.isFinite(value)).toBe(true); expect(value).toBeGreaterThanOrEqual(0);
        }
      }
      expect(runs[0]!.enemies).toEqual(runs[1]!.enemies);
      expect(runs[0]!.player).toEqual(runs[1]!.player);
      expect(runs[0]!.talentMemory).toEqual(runs[1]!.talentMemory);
    });
  }
});

describe('dense hybrid regression routes', () => {
  it('Spellsteel permits one volley per quarter second and retains a charge until the next physical hit', () => {
    const run = setup(['reprisal', 'spellsteel']);
    const primary = tough(), secondary = tough(102, 260);
    run.enemies.push(primary, secondary);
    for (let i = 0; i < 30; i++) damageEnemy(run, primary, 1, { source: 'talent', school: 'physical' });
    resolveTalentEffects(run);
    expect(run.bolts).toHaveLength(1);
    expect(run.talentMemory.physicalHits).toBe(3);
    for (let i = 0; i < 16; i++) updateStatuses(run);
    resolveTalentEffects(run);
    expect(run.bolts).toHaveLength(1);
    damageEnemy(run, primary, 1, { source: 'talent', school: 'physical' }); resolveTalentEffects(run);
    expect(run.bolts).toHaveLength(2);
    expect(run.talentMemory.physicalHits).toBe(0);
  });

  const hybrids: TalentId[][] = [
    ['reprisal', 'sweeping-blade', 'spellsteel', 'arcane-echo', 'rime-sigil', 'shatterglass', 'expose-weakness', 'venom-edge'],
    [...MAGE, 'soul-cinder', 'grim-pact'],
    ['hunting-momentum', 'falcon', 'pack-link', 'soul-cinder', 'grim-pact', 'agony', 'expose-weakness', 'venom-edge'],
    ['communion', 'sanctuary', 'searing-grace', 'atonement', 'martyr-ward', 'dawn-chorus', 'reprisal', 'sweeping-blade'],
    ['soul-cinder', 'agony', 'grim-pact', 'detonation', 'soul-link', 'harvest', 'communion', 'searing-grace'],
    ['expose-weakness', 'venom-edge', 'killer-instinct', 'siphon-toxin', 'contagion', 'nightfall', 'soul-cinder', 'agony'],
  ];
  it.each(hybrids.map((build, index) => ({ build, index })))('80 foes and all maximum upgrades: hybrid $index', ({ build }) => {
    const runs = [setup(build), setup([...build].reverse())];
    for (const run of runs) {
      run.progression.ranks = Object.fromEntries(UPGRADES.map((entry) => [entry.id, entry.maxRank]));
      run.progression.level = 20;
      run.player.attackIn = 0;
      for (let i = 0; i < 80; i++) run.enemies.push(tough(101 + i, 180 + Math.cos(i * Math.PI / 40) * 90, 240 + Math.sin(i * Math.PI / 40) * 90));
      for (let i = 0; i < 4 / STEP; i++) {
        // Actual heal/hurt reactions remain active during the workload.
        if (i % 60 === 0) healPlayer(run, 2);
        advance(run, STEP);
      }
      expect(run.status).toBe('running');
      expect(run.effects.dropped).toBe(0); expect(run.effects.pending).toEqual([]);
      expect(run.bolts.length).toBeLessThanOrEqual(RULES.maxBolts);
      expect(run.enemies.every((target) => Number.isFinite(target.health))).toBe(true);
    }
    expect(runs[0]!.enemies).toEqual(runs[1]!.enemies);
    expect(runs[0]!.player).toEqual(runs[1]!.player);
  });
});
