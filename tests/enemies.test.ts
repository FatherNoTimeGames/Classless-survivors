import { describe, expect, it } from 'vitest';
import { ENEMIES, ELITES, ENEMY_ATTACKS as A } from '../src/content/enemies';
import type { EnemyKind } from '../src/content/enemies';
import { WAVES, waveAt } from '../src/content/waves';
import { createEnemy } from '../src/game/enemy-state';
import { updateEnemies } from '../src/game/enemies';
import { moveEnemies } from '../src/game/enemy-movement';
import { releaseEnemyAttacks, updateEnemyAttacks } from '../src/game/enemy-attacks';
import { damageEnemy } from '../src/game/damage';
import { applyContactDamage } from '../src/game/combat';
import { resolveTalentEffects } from '../src/game/talent-effects';
import { updateSpawns } from '../src/game/spawning';
import { createRun } from '../src/game/state';
import { RULES, STEP, WORLD } from '../src/game/rules';
import { grantShield } from '../src/game/shields';
import { distance } from '../src/game/geometry';
import { tickRun } from '../src/game/run';
import { chooseUpgrade } from '../src/game/progression';
import { UPGRADES } from '../src/content/upgrades';
import type { TalentId } from '../src/content/talents';
import { advance, bolt, emptyRun, STILL } from './fixtures';

function caster(kind: EnemyKind) {
  const run = emptyRun(); run.player.x = 240; run.player.y = 240; run.player.attackIn = 100;
  const foe = createEnemy(101, { x: 100, y: 240 }, kind);
  foe.grace = 0; foe.attack.remaining = 0; run.enemies.push(foe);
  return { run, foe };
}

describe('enemy movement and readable attacks', () => {
  it('gives skitters faster pursuit and archers a retreat/hold/approach band', () => {
    const husk = createEnemy(1, { x: 100, y: 100 }), skitter = createEnemy(2, { x: 100, y: 100 }, 'skitter');
    husk.grace = 0; skitter.grace = 0;
    for (let i = 0; i < 60; i++) moveEnemies([husk, skitter], { x: 250, y: 100 });
    expect(husk.x).toBeCloseTo(130); expect(skitter.x).toBeCloseTo(153);
    const { foe } = caster('archer');
    moveEnemies([foe], { x: 120, y: 240 }); expect(foe.x).toBeLessThan(100);
    foe.x = 100; moveEnemies([foe], { x: 215, y: 240 }); expect(foe.x).toBe(100);
    moveEnemies([foe], { x: 280, y: 240 }); expect(foe.x).toBeGreaterThan(100);
  });

  it.each(['archer', 'charger', 'hexer'] as const)('%s holds a fixed aim and cannot hurt during its warning', (kind) => {
    const { run, foe } = caster(kind);
    updateEnemies(run);
    expect(foe.attack.phase).toBe('windup');
    const aim = structuredClone(foe.attack.aim), point = { x: foe.x, y: foe.y };
    run.player.y = 310;
    advance(run, ENEMIES[kind].warning - STEP * 2);
    expect(foe.attack.aim).toEqual(aim); expect({ x: foe.x, y: foe.y }).toEqual(point);
    expect(run.player.health).toBe(60); expect(run.enemyBolts).toEqual([]); expect(run.blights).toEqual([]);
  });

  it('archer arrows use the warned direction, can be dodged, and use swept impact detection', () => {
    const { run, foe } = caster('archer');
    updateEnemies(run); foe.attack.remaining = 0; run.player.y = 310;
    releaseEnemyAttacks(run);
    expect(run.enemyBolts[0]).toMatchObject({ vx: 105, vy: 0, damage: 10 });
    for (let i = 0; i < 120; i++) updateEnemyAttacks(run);
    expect(run.player.health).toBe(60);
    run.player.y = 240;
    run.enemyBolts = [{ id: 999, x: 100, y: 240, vx: 12000, vy: 0, remaining: 1, damage: 10 }];
    updateEnemyAttacks(run);
    expect(run.player.health).toBe(50); expect(run.enemyBolts).toEqual([]);
  });

  it('a charge follows its lane, is slowed by Frost, and recovers at the arena edge', () => {
    const normal = caster('charger'), slowed = caster('charger');
    for (const { run, foe } of [normal, slowed]) {
      updateEnemies(run); foe.attack.remaining = 0; releaseEnemyAttacks(run); run.player.y = 330;
    }
    slowed.foe.frost = 2;
    for (let i = 0; i < 12; i++) { moveEnemies(normal.run.enemies, normal.run.player); moveEnemies(slowed.run.enemies, slowed.run.player); }
    expect(normal.foe.x - 100).toBeCloseTo(42); expect(slowed.foe.x - 100).toBeCloseTo(29.4);
    expect(normal.foe.y).toBe(240);
    normal.foe.x = WORLD.width - 9;
    moveEnemies(normal.run.enemies, normal.run.player); moveEnemies(normal.run.enemies, normal.run.player);
    expect(normal.foe.x).toBe(WORLD.width - RULES.enemyRadius); expect(normal.foe.attack.phase).toBe('recover');
  });

  it('charge contact sweeps the traveled lane and cannot repeatedly hit through invulnerability', () => {
    const { run, foe } = caster('charger');
    foe.previous = { x: 220, y: 240 }; foe.x = 260; foe.chargedThisTick = true;
    applyContactDamage(run);
    expect(run.player.health).toBe(42);
    applyContactDamage(run); expect(run.player.health).toBe(42);
  });

  it.each(['archer', 'charger', 'hexer'] as const)('stun interrupts a %s windup; a killed caster cannot release later in the tick', (kind) => {
    const { run, foe } = caster(kind);
    updateEnemies(run); foe.attack.remaining = 0; foe.stun = 0.6; releaseEnemyAttacks(run);
    expect(foe.attack.phase).toBe('recover'); expect(run.enemyBolts).toHaveLength(0); expect(run.blights).toHaveLength(0);
    foe.stun = 0; foe.attack.phase = 'windup'; foe.attack.remaining = STEP; foe.health = 18;
    run.bolts.push(bolt({ x: foe.x, y: foe.y })); tickRun(run, STILL);
    expect(run.enemies).toHaveLength(0); expect(run.enemyBolts).toHaveLength(0); expect(run.blights).toHaveLength(0);
  });

  it.each(['swift', 'stout'] as const)('%s elite charge bonus scales with its damage modifier', (elite) => {
    const run = emptyRun();
    const foe = createEnemy(101, { x: 200, y: 240 }, 'charger', elite);
    foe.grace = 0; foe.previous = { x: 160, y: 240 }; foe.chargedThisTick = true; run.enemies.push(foe);
    applyContactDamage(run);
    expect(run.player.health).toBe(60 - (ENEMIES.charger.contact + A.dashBonus) * ELITES[elite].damage);
    // A newly applied root cancels the charge bonus; ordinary body contact still hurts.
    run.player.health = 60; run.player.invulnerable = 0; foe.root = 1; foe.x = 180;
    applyContactDamage(run);
    expect(run.player.health).toBe(60 - ENEMIES.charger.contact * ELITES[elite].damage);
  });

  it('roots interrupt charges while rooted archers still cast; rooted bodies retain contact damage', () => {
    for (const kind of ['charger', 'archer'] as const) {
      const { run, foe } = caster(kind);
      updateEnemies(run); foe.root = 1; foe.attack.remaining = 0; releaseEnemyAttacks(run);
      expect(foe.attack.phase).toBe(kind === 'charger' ? 'recover' : 'idle');
      expect(run.enemyBolts.length).toBe(kind === 'archer' ? 1 : 0);
      const oldX = foe.x; moveEnemies(run.enemies, run.player); expect(foe.x).toBe(oldX);
      run.player.x = foe.x; applyContactDamage(run); expect(run.player.health).toBeLessThan(60);
    }
  });

  it('blight activates only after warning, persists after its caster dies, and expires', () => {
    const { run, foe } = caster('hexer');
    updateEnemies(run); expect(run.blights).toHaveLength(0);
    foe.attack.remaining = 0; releaseEnemyAttacks(run);
    expect(run.blights[0]).toMatchObject({ x: 240, y: 240, radius: 24 });
    foe.health = 0; run.enemies = [];
    updateEnemyAttacks(run); expect(run.player.health).toBe(51);
    run.player.y = 300;
    for (let i = 0; i < 120; i++) updateEnemyAttacks(run);
    expect(run.blights).toHaveLength(0); expect(run.player.health).toBe(51);
  });

  it('limits simultaneous warnings and separates hexer target areas', () => {
    const run = emptyRun();
    for (let i = 0; i < 80; i++) {
      const foe = createEnemy(i + 1, { x: 80, y: 200 }, 'archer'); foe.grace = 0; foe.attack.remaining = 0; run.enemies.push(foe);
    }
    updateEnemies(run);
    expect(run.enemies.filter((foe) => foe.attack.phase === 'windup')).toHaveLength(A.maxWindups);
    const hex = caster('hexer');
    const second = createEnemy(102, { x: 100, y: 200 }, 'hexer'); second.grace = 0; second.attack.remaining = 0; hex.run.enemies.push(second);
    updateEnemies(hex.run);
    expect(hex.run.enemies.filter((foe) => foe.attack.phase === 'windup')).toHaveLength(1);
  });

  it.each([{ x: 12, y: 12 }, { x: 348, y: 12 }, { x: 12, y: 468 }, { x: 348, y: 468 }])('lets a cornered player escape a hexer warning from $x,$y', (point) => {
    const { run, foe } = caster('hexer'); run.player.x = point.x; run.player.y = point.y;
    foe.x = point.x < 180 ? 140 : 220; foe.y = point.y;
    updateEnemies(run); expect(foe.attack.phase).toBe('windup');
    const direction = { x: point.x < 180 ? 1 : -1, y: point.y < 240 ? 1 : -1 };
    advance(run, ENEMIES.hexer.warning + 0.05, direction);
    expect(run.player.health).toBe(60);
    expect(distance(run.player, foe.attack.aim)).toBeGreaterThan(A.blightRadius + RULES.playerRadius);
  });
});

describe('elite and talent interactions', () => {
  it.each(['swift', 'stout'] as const)('%s elites keep status and periodic rules and drop their own XP exactly once', (elite) => {
    const run = createRun(1, ['expose-weakness', 'venom-edge', 'arcane-echo', 'rime-sigil', 'shatterglass', 'reprisal', 'sweeping-blade', 'frostbreak']);
    const foe = createEnemy(100, { x: 205, y: 240 }, 'charger', elite); foe.grace = 0; run.enemies.push(foe);
    damageEnemy(run, foe, 1); resolveTalentEffects(run); expect(foe.frost).toBe(2); expect(foe.dots[0]!.kind).toBe('poison');
    damageEnemy(run, foe, 1, { source: 'melee', school: 'physical' }); resolveTalentEffects(run);
    expect(foe.stun).toBe(0.6); expect(foe.health).toBeLessThan(foe.maxHealth - 10);
    damageEnemy(run, foe, 10000); damageEnemy(run, foe, 10000);
    expect(run.kills).toBe(1); expect(run.shards).toHaveLength(1);
    expect(run.shards[0]!.value).toBe(ENEMIES.charger.xp * ELITES[elite].xp);
  });

  it('ranged attacks and blight share wards, absorption reactions, and contact invulnerability', () => {
    const run = createRun(1, ['communion', 'searing-grace', 'sanctuary', 'atonement', 'martyr-ward', 'dawn-chorus']);
    grantShield(run, 8, 3);
    run.enemyBolts.push({ id: 101, x: 180, y: 240, vx: 100, vy: 0, remaining: 1, damage: 10 });
    run.blights.push({ id: 102, x: 180, y: 240, radius: 24, remaining: 1, damage: 9 });
    updateEnemyAttacks(run); resolveTalentEffects(run);
    expect(run.player.health).toBe(60); // 8 absorbed, 2 health lost, then Dawn heals 2.
    expect(run.player.shield.amount).toBe(0); expect(run.talentMemory.dawnIn).toBe(1);
    expect(run.enemyBolts).toHaveLength(0);
  });
});

describe('waves, spawning, and lifetime limits', () => {
  it('introduces all five behaviors gradually and bounds late-wave escalation', () => {
    expect(waveAt(0).pool).toEqual([['husk', 1]]);
    expect(waveAt(18).pool.map((entry) => entry[0])).toContain('skitter');
    expect(waveAt(34).pool.map((entry) => entry[0])).not.toContain('archer');
    expect(waveAt(35).pool.map((entry) => entry[0])).toContain('archer');
    expect(waveAt(55).pool.map((entry) => entry[0])).toContain('charger');
    expect(waveAt(75).pool.map((entry) => entry[0])).toHaveLength(5);
    expect(waveAt(1e9)).toBe(WAVES[WAVES.length - 1]);
  });

  it('spawns every type and elite reproducibly and safely, even with the player on an edge', () => {
    const routes = [createRun(42), createRun(42)];
    const kinds = new Set<string>(), elites = new Set<string>();
    for (const run of routes) {
      run.elapsed = 300;
      for (let i = 0; i < 120; i++) {
        run.player.x = i % 2 ? 12 : 348; run.player.y = i % 3 ? 12 : 468;
        run.enemies = []; run.spawnIn = 0; updateSpawns(run);
        const spawned = run.enemies[0]!;
        expect(distance(spawned, run.player)).toBeGreaterThanOrEqual(110);
        expect(spawned.grace).toBe(0.6); expect(spawned.attack.phase).toBe('idle');
        kinds.add(spawned.kind); elites.add(spawned.elite);
      }
    }
    expect(kinds.size).toBe(5); expect(elites).toEqual(new Set(['none', 'swift', 'stout']));
    expect(routes[0]).toEqual(routes[1]);
  });

  it('never attacks during spawn grace or rewrites existing foes on wave changes', () => {
    const { run, foe } = caster('archer'); foe.grace = 0.6;
    const oldHealth = foe.health; run.elapsed = 600;
    // Isolate wave snapshots: this fixture has already cleared the guardians.
    run.campaign.nextBoss = 3; advance(run, 0.3);
    expect(foe.x).toBe(100); expect(foe.attack.phase).toBe('idle'); expect(run.enemyBolts).toHaveLength(0);
    expect(foe.health).toBe(oldHealth);
    run.spawnIn = 0; updateSpawns(run); expect(run.enemies[1]!.maxHealth).toBeGreaterThan(ENEMIES[run.enemies[1]!.kind].health);
  });

  it('bounds arrows/zones, pauses all enemy state, and resets it for a new run', () => {
    const { run, foe } = caster('archer');
    run.enemyBolts = Array.from({ length: A.maxBolts }, (_, i) => ({ id: i, x: 100, y: 100, vx: 100, vy: 0, remaining: 1, damage: 10 }));
    updateEnemies(run); foe.attack.remaining = 0; releaseEnemyAttacks(run); expect(run.enemyBolts).toHaveLength(A.maxBolts);
    run.blights = Array.from({ length: A.maxBlights }, (_, i) => ({ id: 1000 + i, x: i * 30, y: 100, radius: 24, remaining: 1, damage: 9 }));
    for (const status of ['choosing', 'defeated'] as const) { run.status = status; const frozen = structuredClone(run); advance(run, 2); expect(run).toEqual(frozen); }
    const fresh = createRun(1); expect(fresh.enemyBolts).toEqual([]); expect(fresh.blights).toEqual([]); expect(fresh.spawned).toBe(0);
  });

  it('preserves elite XP when the pickup budget is full', () => {
    const run = emptyRun();
    run.shards = Array.from({ length: RULES.maxShards }, (_, id) => ({ id, x: 50, y: 50, value: 5 }));
    const foe = createEnemy(999, { x: 100, y: 100 }, 'hexer', 'stout');
    damageEnemy(run, foe, 10000);
    expect(run.shards).toHaveLength(RULES.maxShards);
    expect(run.shards.reduce((sum, shard) => sum + shard.value, 0)).toBe(RULES.maxShards * 5 + 30);
  });

  it('keeps mixed 80-enemy combat deterministic, finite, and within attack/effect budgets', () => {
    const build: TalentId[] = ['soul-cinder', 'agony', 'grim-pact', 'detonation', 'soul-link', 'harvest', 'communion', 'searing-grace'];
    const routes = [createRun(42, build), createRun(42, [...build].reverse())];
    for (const run of routes) {
      run.spawnIn = Infinity; run.progression.level = 20;
      run.progression.ranks = Object.fromEntries(UPGRADES.map((entry) => [entry.id, entry.maxRank]));
      const kinds = Object.keys(ENEMIES) as EnemyKind[];
      for (let i = 0; i < 80; i++) run.enemies.push(createEnemy(1000 + i, { x: 180 + Math.cos(i) * 100, y: 240 + Math.sin(i) * 130 }, kinds[i % 5]!, i % 2 ? 'swift' : 'stout', 2));
      for (let i = 0; i < 600; i++) {
        run.player.health = 60;
        tickRun(run, { x: Math.cos(i / 100), y: Math.sin(i / 100) });
        expect(run.enemyBolts.length).toBeLessThanOrEqual(A.maxBolts); expect(run.blights.length).toBeLessThanOrEqual(A.maxBlights);
        expect(run.enemies.length).toBeLessThanOrEqual(80); expect(run.bolts.length).toBeLessThanOrEqual(RULES.maxBolts);
        expect(run.effects.pending).toEqual([]); expect(run.effects.processedThisTick).toBeLessThanOrEqual(512);
        expect(run.enemies.every((enemy) => Number.isFinite(enemy.x + enemy.y + enemy.health))).toBe(true);
      }
      expect(run.effects.dropped).toBe(0);
    }
    expect(routes[0]!.enemies).toEqual(routes[1]!.enemies); expect(routes[0]!.player).toEqual(routes[1]!.player);
    expect(routes[0]!.enemyBolts).toEqual(routes[1]!.enemyBolts); expect(routes[0]!.blights).toEqual(routes[1]!.blights);
  });
});

describe('real seeded mixed-wave routes', () => {
  const builds: { name: string; talents: TalentId[] }[] = [
    { name: 'Priest/Warrior', talents: ['communion', 'searing-grace', 'sanctuary', 'atonement', 'martyr-ward', 'dawn-chorus', 'reprisal', 'sweeping-blade'] },
    { name: 'Warlock/Priest', talents: ['soul-cinder', 'agony', 'grim-pact', 'detonation', 'soul-link', 'harvest', 'communion', 'searing-grace'] },
    { name: 'Mage/Priest', talents: ['arcane-echo', 'rime-sigil', 'chain-spark', 'shatterglass', 'mana-ward', 'riftweaver', 'communion', 'searing-grace'] },
  ];
  it.each(builds)('$name can gather XP and reach every enemy/elite behavior over three minutes', ({ talents }) => {
    const run = createRun(42, talents);
    const kinds = new Set(), warnings = new Set(), elites = new Set();
    for (let i = 0; i < 180 / STEP && run.status !== 'defeated'; i++) {
      while (run.status === 'choosing') {
        const chosen = (['vitality', 'haste', 'magnet', 'fleet', 'fork', 'pierce', 'burst'] as const).find((id) => run.progression.offers.includes(id)) ?? run.progression.offers[0]!;
        chooseUpgrade(run, chosen);
      }
      const directions = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }];
      tickRun(run, directions[Math.floor(run.elapsed / 3) % 4]!);
      for (const foe of run.enemies) {
        kinds.add(foe.kind); elites.add(foe.elite);
        if (foe.attack.phase === 'windup') warnings.add(foe.kind);
      }
    }
    expect(run.status).toBe('running'); expect(run.elapsed).toBeCloseTo(180);
    expect(run.kills).toBeGreaterThan(100); expect(run.xp).toBeGreaterThan(500);
    expect(kinds.size).toBe(5); expect(warnings).toEqual(new Set(['archer', 'charger', 'hexer']));
    expect(elites).toEqual(new Set(['none', 'swift', 'stout'])); expect(run.effects.dropped).toBe(0);
  });
});
