import { simulateRoute } from '../analysis/simulation';
import { CAMPAIGN } from '../src/content/bosses';
import { RUN_ROUTES } from './hybrid-routes';
import { describe, expect, it } from 'vitest';
import type { TalentId } from '../src/content/talents';
import { UPGRADES, PROGRESSION_RULES } from '../src/content/upgrades';
import type { UpgradeRanks } from '../src/content/upgrades';
import { createRun } from '../src/game/state';
import { tickRun } from '../src/game/run';
import { damageEnemy, damagePlayer } from '../src/game/damage';
import { resolveTalentEffects } from '../src/game/talent-effects';
import { updateProjectiles } from '../src/game/combat';
import { updateMelee } from '../src/game/melee';
import { updateCompanions } from '../src/game/companions';
import { updateDamageOverTime } from '../src/game/damage-over-time';
import { updateUpgradeTimers } from '../src/game/upgrade-timers';
import { applyDot } from '../src/game/dot-state';
import { grantShield } from '../src/game/shields';
import { healPlayer } from '../src/game/healing';
import { eligibleUpgrades, awardXp, chooseUpgrade, xpForLevel } from '../src/game/progression';
import { abilitySummary } from '../src/game/ability-summary';
import { getRunStats } from '../src/game/stats';
import { updateEncounterSchedule } from '../src/game/bosses';
import { advance, enemy, STILL } from './fixtures';

function setup(talents: TalentId[] = [], ranks: UpgradeRanks = {}) {
  const run = createRun(42, talents); run.spawnIn = Infinity;
  run.progression.level = PROGRESSION_RULES.maxLevel; run.progression.ranks = { ...ranks }; run.player.attackIn = 100;
  return run;
}
function tough(id = 101, x = 210, y = 240) { return { ...enemy(id, x, y), health: 1000, maxHealth: 1000 }; }

describe('usable upgrade offers and paced progression', () => {
  it('excludes inert family upgrades but lets run choices open other families', () => {
    const ids = (ranks: UpgradeRanks, talents: TalentId[] = []) => eligibleUpgrades(12, ranks, talents).map((entry) => entry.id);
    expect(ids({})).not.toEqual(expect.arrayContaining(['longblade', 'familiar', 'catalyst']));
    for (const id of ['longblade', 'familiar', 'potency', 'icebrand', 'riposte', 'catalyst', 'benediction', 'frost-pact']) expect(ids({})).not.toContain(id);
    expect(ids({ venom: 1, precision: 1 })).toEqual(expect.arrayContaining(['potency', 'catalyst']));
    expect(ids({ aegis: 1 })).toContain('riposte'); expect(ids({ aegis: 1, riposte: 1 })).toContain('icebrand');
    expect(ids({ wellspring: 1 })).toContain('benediction');
    expect(ids({ icebrand: 1 }, ['hunting-momentum', 'falcon'])).toEqual(expect.arrayContaining(['familiar', 'frost-pact']));
    expect(ids({}, ['reprisal', 'sweeping-blade'])).toContain('longblade');
  });
  it('rejects forged ineligible choices and lets Second Wind consume queued levels without stat creep', () => {
    const run = createRun(1); run.progression.level = 12; run.progression.pendingLevels = 1; run.status = 'choosing'; run.progression.offers = ['familiar'];
    expect(chooseUpgrade(run, 'familiar')).toBe(false);
    run.progression.ranks = Object.fromEntries(UPGRADES.filter((entry) => !entry.fallback).map((entry) => [entry.id, entry.maxRank]));
    run.progression.offers = ['recovery']; run.player.health = 10;
    const stats = getRunStats(run.progression.ranks);
    expect(chooseUpgrade(run, 'recovery')).toBe(true); expect(run.player.health).toBe(30); expect(run.player.shield.amount).toBe(8);
    expect(run.status).toBe('running'); expect(getRunStats(run.progression.ranks)).toEqual(stats);
    expect(eligibleUpgrades(40, run.progression.ranks).map((entry) => entry.id)).toEqual(['recovery']);
  });
  it('keeps the first choice quick while later progression requires sustained gathering', () => {
    expect(xpForLevel(1)).toBe(10);
    expect(xpForLevel(20)).toBeGreaterThan(xpForLevel(10) * 5);
    const run = createRun(9); awardXp(run, 3000);
    expect(run.progression.level).toBeGreaterThan(10); expect(run.progression.level).toBeLessThan(20);
    while (run.status === 'choosing') expect(chooseUpgrade(run, run.progression.offers[0]!)).toBe(true);
    expect(run.status).toBe('running');
  });
});

describe('family improvements and explicit inheritance', () => {
  it('Longblade widens real melee reach and damage without changing its angle or cooldown', () => {
    const base = setup(['reprisal', 'sweeping-blade']), upgraded = setup(['reprisal', 'sweeping-blade'], { longblade: 2 });
    for (const run of [base, upgraded]) { run.enemies.push(tough(101, 245), tough(102, 110)); updateMelee(run); }
    expect(base.enemies[0]!.health).toBe(1000); expect(upgraded.enemies[0]!.health).toBe(976);
    expect(upgraded.enemies[1]!.health).toBe(1000); expect(upgraded.player.meleeIn).toBeCloseTo(1.1);
    expect(upgraded.sparks.find((spark) => spark.kind === 'cleave')!.radius).toBe(78);
  });
  it('improves falcon reach/damage and snapshots empowered imp shots before later rank changes', () => {
    const falcon = setup(['hunting-momentum', 'falcon'], { familiar: 1 }); falcon.enemies.push(tough(101, 375));
    updateCompanions(falcon); expect(falcon.enemies[0]!.health).toBe(988);
    const imp = setup(['soul-cinder', 'grim-pact'], { familiar: 2, fork: 1, pierce: 1, burst: 1 }); imp.enemies.push(tough(101, 375), tough(102, 370, 260));
    updateCompanions(imp); expect(imp.bolts).toHaveLength(2); expect(imp.bolts[0]).toMatchObject({ damage: 17, pierce: 1, blastRadius: 20, source: 'summon' });
    imp.progression.ranks.familiar = 0; expect(imp.bolts[0]!.damage).toBe(17);
  });
  it('summarizes companion inheritance exceptions and every active ability family', () => {
    const run = setup(['hunting-momentum', 'falcon', 'soul-cinder', 'grim-pact', 'agony', 'communion', 'searing-grace'], { familiar: 2, venom: 1, precision: 1, wellspring: 1, benediction: 1 });
    const summary = abilitySummary(run).join(' ');
    for (const text of ['Falcon:', 'Imp:', 'Poison:', 'Curse:', 'Critical hits:', 'Blood Wellspring', 'Radiant Reprieve']) expect(summary).toContain(text);
    expect(summary).toContain('crit/Frost-consumption talents work; other on-hit talents need Pack Link');
  });
  it('lets empowered imp projectiles reach maximum-range targets even while the imp trails the player', () => {
    const run = setup(['soul-cinder', 'grim-pact'], { familiar: 2 });
    run.player.x = 120; run.companions[0]!.x = 80; run.companions[0]!.y = 240;
    const foe = tough(101, 340); run.enemies.push(foe); updateCompanions(run);
    expect(run.bolts).toHaveLength(1); expect(run.bolts[0]!.life).toBeGreaterThan(1.1);
    run.progression.ranks.familiar = 0;
    for (let i = 0; i < 75; i++) updateProjectiles(run);
    expect(foe.health).toBe(983); expect(run.bolts).toEqual([]);
  });
  it('Viper Ink opens periodic play to companions without Pack Link and potency affects both periodic schools', () => {
    const run = setup(['soul-cinder', 'agony'], { venom: 2, potency: 3 }); const foe = tough(); run.enemies.push(foe);
    damageEnemy(run, foe, 1); resolveTalentEffects(run);
    expect(foe.dots.map((dot) => [dot.kind, dot.damage])).toEqual([['curse', 9], ['poison', 11]]);
    const timing = foe.dots[0]!.tickIn; damageEnemy(run, foe, 1); expect(foe.dots[0]!.tickIn).toBe(timing);
    damageEnemy(run, foe, 1, { source: 'summon', school: 'fire' }); expect(foe.dots.find((dot) => dot.kind === 'poison')!.owner).toBe('player'); // Equal refresh retains existing attribution.
    const fresh = tough(102); run.enemies.push(fresh); damageEnemy(run, fresh, 1, { source: 'summon' });
    expect(fresh.dots).toHaveLength(1); expect(fresh.dots[0]).toMatchObject({ owner: 'companion', damage: 11 });
    const before = structuredClone(fresh.dots); damageEnemy(run, fresh, 1, { source: 'dot' }); expect(fresh.dots).toEqual(before);
    for (let i = 0; i < 60; i++) updateDamageOverTime(run);
    expect(fresh.health).toBe(987); // One summon hit, one direct periodic hit, one 11-point Poison tick.
  });
  it('Keen Instinct shares a deterministic critical cadence but periodic ticks never advance it', () => {
    for (const [talents, every] of [[[], 4], [['expose-weakness', 'killer-instinct'], 2]] as [TalentId[], number][]) {
      const run = setup(talents, { precision: 2 }); const foe = tough(); run.enemies.push(foe);
      // Avoid wound bonus obscuring cadence; only the first hit needs a healthy victim.
      for (let i = 0; i < every; i++) { foe.health = foe.maxHealth; damageEnemy(run, foe, 4, { source: i % 2 ? 'summon' : 'ember' }); }
      expect(foe.health).toBe(993); expect(run.talentMemory.criticalHits).toBe(0);
      damageEnemy(run, foe, 1, { source: 'dot' }); expect(run.talentMemory.criticalHits).toBe(0);
    }
  });
});

describe('open temporary hybrid interactions', () => {
  it('Wellspring accepts periodic/companion kills, feeds healing offense, and handles excess separately', () => {
    const run = setup(['communion', 'searing-grace', 'sanctuary', 'martyr-ward'], { wellspring: 1 }); run.player.health = 40;
    const survivor = tough(200); run.enemies.push(survivor);
    for (let i = 0; i < 6; i++) { const foe = tough(101 + i, 300); foe.health = 1; run.enemies.push(foe); damageEnemy(run, foe, 2, { source: i % 2 ? 'summon' : 'dot' }); }
    resolveTalentEffects(run); expect(run.player.health).toBe(47); expect(survivor.health).toBe(988);
    run.player.health = 60; run.upgradeMemory.kills = 5;
    const foe = tough(110, 300); foe.health = 1; run.enemies.push(foe); damageEnemy(run, foe, 2); resolveTalentEffects(run);
    expect(run.player.health).toBe(60); expect(run.player.shield.amount).toBe(2); expect(survivor.health).toBe(988);
  });
  it('Returning Aegis respects presence, nonstacking wards, duration, and pause/reset', () => {
    const run = setup([], { aegis: 2 }); updateUpgradeTimers(run); expect(run.player.shield.amount).toBe(0);
    run.enemies.push(tough()); updateUpgradeTimers(run); expect(run.player.shield).toEqual({ amount: 12, remaining: 4 });
    grantShield(run, 20, 6); run.upgradeMemory.aegisIn = 0; updateUpgradeTimers(run); expect(run.player.shield.amount).toBe(20);
    run.status = 'choosing'; const snapshot = structuredClone(run); advance(run, 3); expect(run).toEqual(snapshot);
    expect(createRun(42).upgradeMemory).toEqual({ kills: 0, aegisIn: 0, riposteIn: 0, catalystIn: 0, benedictionIn: 0, pactIn: 0 });
  });
  it('Ward Reprisal reacts to absorption instead of health loss and can reapply/consume Frost through physical hits', () => {
    const run = setup(['reprisal', 'sweeping-blade', 'frostbreak'], { aegis: 1, riposte: 2, icebrand: 1 }); const foe = tough(); run.enemies.push(foe);
    updateUpgradeTimers(run); damagePlayer(run, 2); resolveTalentEffects(run);
    expect(run.player.health).toBe(60); expect(foe.health).toBe(984); expect(foe.frost).toBe(2);
    damageEnemy(run, foe, 1, { source: 'melee', school: 'physical' }); resolveTalentEffects(run);
    expect(foe.health).toBe(975); expect(foe.stun).toBe(0.6); expect(foe.frost).toBe(2);
    run.player.invulnerable = 0; damagePlayer(run, 2); resolveTalentEffects(run); expect(foe.health).toBe(975);
  });
  it('Catalyst pulses at most three afflicted foes, cannot crit itself, and neither refreshes nor chains', () => {
    const run = setup([], { venom: 1, precision: 2, catalyst: 1 });
    for (let i = 0; i < 5; i++) { const foe = tough(101 + i, 210 + i * 5); applyDot(foe, { kind: 'curse', school: 'shadow', owner: 'player', damage: 3, interval: 1, remaining: 3, tickIn: 1 }); run.enemies.push(foe); }
    run.talentMemory.criticalHits = 3; damageEnemy(run, run.enemies[0]!, 4); resolveTalentEffects(run);
    expect(run.enemies.map((foe) => foe.health)).toEqual([987, 997, 997, 1000, 1000]); // Crit 7 + curse/Poison pulse 6 on primary; curse only on neighbors.
    expect(run.talentMemory.criticalHits).toBe(0); expect(run.enemies[0]!.dots.every((dot) => dot.tickIn === 1)).toBe(true);
    expect(run.upgradeMemory.catalystIn).toBe(0.75); expect(run.effects.dropped).toBe(0);
  });
  it('Radiant Reprieve responds only to actual healing, creates holy marks and is limited to one wave per second', () => {
    const run = setup(['communion', 'searing-grace', 'sanctuary', 'atonement'], { benediction: 2 }); const foe = tough(); run.enemies.push(foe);
    healPlayer(run, 4); resolveTalentEffects(run); expect(foe.health).toBe(1000);
    run.player.health = 50; healPlayer(run, 4); resolveTalentEffects(run); expect(foe.health).toBe(986); expect(foe.holyMark).toBe(5);
    healPlayer(run, 4); resolveTalentEffects(run); expect(foe.health).toBe(980); // Searing Grace still works; the extra wave is cooling down.
    damageEnemy(run, foe, 1, { source: 'melee', school: 'physical' }); resolveTalentEffects(run); expect(foe.health).toBe(971);
  });
  it('Winter Pact works with a falcon without Pack Link, feeds arcane triggers, and retains a shared proc cooldown', () => {
    const run = setup(['hunting-momentum', 'falcon', 'arcane-echo', 'rime-sigil', 'chain-spark'], { 'frost-pact': 1, icebrand: 1 });
    const foe = tough(), neighbor = tough(102, 220); foe.frost = 2; run.enemies.push(foe, neighbor); run.talentMemory.chainHits = 2;
    updateCompanions(run); resolveTalentEffects(run);
    expect(foe.health).toBeLessThanOrEqual(984); expect(neighbor.health).toBeLessThan(992);
    expect(run.upgradeMemory.pactIn).toBe(0.75); expect(run.effects.dropped).toBe(0);
    const before = foe.health; damageEnemy(run, foe, 1, { source: 'summon', school: 'physical' }); resolveTalentEffects(run); expect(foe.health).toBe(before - 1);
  });
});

describe('observable hybrid patterns against guardians', () => {
  const builds: { name: string; talents: TalentId[]; ranks: UpgradeRanks }[] = [
    { name: 'retaliation', talents: ['reprisal', 'sweeping-blade', 'spellsteel', 'frostbreak', 'iron-ward', 'last-stand'], ranks: { aegis: 2, riposte: 2 } },
    { name: 'frost/melee', talents: ['reprisal', 'sweeping-blade', 'frostbreak', 'arcane-echo', 'rime-sigil', 'shatterglass'], ranks: { longblade: 2, icebrand: 1 } },
    { name: 'critical/DoT', talents: ['expose-weakness', 'venom-edge', 'killer-instinct', 'contagion', 'siphon-toxin'], ranks: { precision: 2, potency: 3, catalyst: 1 } },
    { name: 'healing/offense', talents: ['communion', 'searing-grace', 'sanctuary', 'atonement', 'martyr-ward', 'dawn-chorus'], ranks: { wellspring: 1, benediction: 2, aegis: 1 } },
    { name: 'summons', talents: ['hunting-momentum', 'falcon', 'pack-link', 'soul-cinder', 'grim-pact', 'agony'], ranks: { familiar: 2, 'frost-pact': 1, icebrand: 1 } },
  ];
  it.each(builds)('$name retains its distinct effects and bounded procs in a real guardian fight', ({ talents, ranks }) => {
    const run = setup(talents, ranks); run.player.attackIn = 0; run.elapsed = 540; run.campaign.nextBoss = 1;
    updateEncounterSchedule(run); const boss = run.enemies[0]!; boss.grace = 0; boss.x = 215; boss.y = 240;
    const seen = new Set<string>();
    for (let i = 0; i < 600 && run.status === 'running'; i++) {
      if (i % 60 === 0) { damagePlayer(run, 1); healPlayer(run, 1); }
      tickRun(run, STILL); for (const spark of run.sparks) seen.add(spark.kind);
    }
    expect(boss.health).toBeLessThan(boss.maxHealth); expect(seen.size).toBeGreaterThan(2);
    expect(run.effects.dropped).toBe(0); expect(run.effects.pending).toEqual([]);
    expect(run.bolts.length).toBeLessThanOrEqual(32); expect(run.campaign.dangers.length).toBeLessThanOrEqual(8);
    const summary = abilitySummary(run).join(' ');
    if (ranks.longblade) expect(summary).toContain('78 range');
    if (ranks.familiar) expect(summary).toContain('220 range');
    if (ranks.precision) expect(summary).toContain('every 2 non-periodic');
    if (ranks.benediction) expect(summary).toContain('Radiant Reprieve');
    if (ranks.riposte) expect(summary).toContain('Ward Reprisal');
  });
});

describe('full earned-upgrade hybrid routes', () => {
  it.each(RUN_ROUTES)('$name completes a focused build without exhausting progression before the third boss', (route) => {
    const seed = ['retaliation', 'frost/melee'].includes(route.name) ? 2026 : 42;
    const result = simulateRoute(route, seed, false, true);
    expect(result.outcome).toBe('victory'); expect(result.seconds).toBe(CAMPAIGN.duration); expect(result.health).toBeGreaterThan(0);
    expect(result.bosses.map((boss) => boss.id)).toEqual(['knight', 'matron', 'sovereign']);
    expect(result.choicesByMinute[8]).toBeLessThan(PROGRESSION_RULES.maxLevel - 1);
    expect(result.upgradeTypes).toBeLessThanOrEqual(PROGRESSION_RULES.maxUpgradeTypes); expect(result.effectDrops).toBe(0);
    expect(route.priority.some((id) => (result.ranks[id] ?? 0) > 0)).toBe(true);
  });
});
