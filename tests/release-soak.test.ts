import { expect, it } from 'vitest';
import { BALANCE_ROUTES } from '../analysis/routes';
import { TALENTS } from '../src/content/talents';
import { UPGRADES } from '../src/content/upgrades';
import type { UpgradeId } from '../src/content/upgrades';
import { createProfileStore, SAVE_KEY } from '../src/persistence/profile-store';
import { decodeProfile } from '../src/persistence/profile-codec';
import { beginProfileRun, finishProfileRun, isUnlocked, RESEARCH_TALENTS, research, saveSlot, setDraft, talentBudget } from '../src/profile/profile';
import { allocateTalent } from '../src/game/builds';
import { createRun } from '../src/game/state';
import type { Run } from '../src/game/state';
import { tickRun } from '../src/game/run';
import { chooseUpgrade } from '../src/game/progression';
import { getRunStats } from '../src/game/stats';
import { RULES } from '../src/game/rules';
import { EFFECT_LIMITS } from '../src/game/events';

function invariant(run: Run) {
  expect(run.effects.pending).toEqual([]); expect(run.effects.current).toBeNull(); expect(run.effects.draining).toBe(false);
  expect(run.effects.processedThisTick).toBeLessThanOrEqual(EFFECT_LIMITS.perTick);
  expect(run.effects.dropped).toBe(0);
  expect(run.enemies.length).toBeLessThanOrEqual(RULES.maxEnemies);
  expect(run.bolts.length).toBeLessThanOrEqual(RULES.maxBolts);
  expect(run.shards.length).toBeLessThanOrEqual(RULES.maxShards);
  expect(run.sparks.length).toBeLessThanOrEqual(RULES.maxSparks);
  expect(run.player.health).toBeLessThanOrEqual(getRunStats(run.progression.ranks).maxHealth);
  const values = [run.player.x, run.player.y, run.player.health, run.player.shield.amount,
    ...run.enemies.flatMap((foe) => [foe.x, foe.y, foe.health, ...foe.dots.flatMap((dot) => [dot.damage, dot.remaining])]),
    ...run.companions.flatMap((companion) => [companion.x, companion.y, companion.bonusDamage])];
  expect(values.every((value) => Number.isFinite(value) && value >= 0)).toBe(true);
}

it('replays twelve real runs with research, earned budgets, saves, reloads and an interrupted identity', () => {
  const records = new Map<string, string>();
  const storage = { getItem: (key: string) => records.get(key) ?? null, setItem: (key: string, value: string) => { records.set(key, value); } };
  let store = createProfileStore(storage);
  let previous: Run | null = null, previousSnapshot: Run | null = null;
  let victories = 0, defeats = 0, totalSeconds = 0;
  const schedule = [8, 2, 4, 3, 1, 0, 5, 6, 7, 8, 4, -1];
  const directions = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }];
  for (const [cycle, routeIndex] of schedule.entries()) {
    const route = routeIndex < 0 ? { talents: [], priority: [] } : BALANCE_ROUTES[routeIndex]!;
    for (const id of RESEARCH_TALENTS) {
      if (!isUnlocked(store.get(), id) && store.get().insight > 0) expect(store.change((profile) => research(profile, id))).toBe(true);
    }
    let build = [...route.talents];
    if (routeIndex >= 0) {
      for (const talent of TALENTS) if (isUnlocked(store.get(), talent.id)) {
        build = allocateTalent(build, talent.id, talentBudget(store.get())).build;
      }
    }
    expect(store.change((profile) => setDraft(profile, build))).toBe(true);
    expect(store.change((profile) => saveSlot(profile, cycle % 3, `Soak ${cycle + 1}`))).toBe(true);
    if (cycle === 4) {
      // Closing during play does not invent rewards; the next identity must be fresh.
      expect(store.change(beginProfileRun)).toBe(true);
      const interruptedId = store.get().activeRun!, completed = store.get().completedRuns;
      store = createProfileStore(storage);
      expect(store.get().activeRun).toBeNull(); expect(store.get().completedRuns).toBe(completed);
      expect(store.change((profile) => finishProfileRun(profile, interruptedId, { outcome: 'defeat', seconds: 2, kills: 0, xp: 0 }))).toBe(false);
    }
    expect(store.change(beginProfileRun)).toBe(true);
    const profile = store.get(), id = profile.activeRun!;
    const run = createRun(42, profile.draft, talentBudget(profile));
    expect(run.progression.ranks).toEqual({}); expect(run.campaign.defeated).toEqual([]);
    expect(run.effects.pending).toEqual([]); expect(run.shards).toEqual([]); expect(run.bolts).toEqual([]);
    expect(run.player.health).toBe(RULES.maxHealth);
    expect(Object.values(run.talentMemory).every((value) => value === 0 || value === false)).toBe(true);
    expect(run.companions.every((companion) => companion.bonusDamage === 0 && companion.targetId === null)).toBe(true);
    let ticks = 0;
    while (!['victory', 'defeated'].includes(run.status) && ticks < 55000) {
      while (run.status === 'choosing') {
        const hurt = run.player.health < getRunStats(run.progression.ranks).maxHealth * 0.6;
        const priority: readonly UpgradeId[] = [
          ...(routeIndex >= 0 && hurt ? ['wellspring', 'vitality', 'aegis', 'recovery'] as const : []),
          'haste', 'magnet', ...route.priority, 'fork', 'pierce', 'burst', 'fleet',
        ];
        expect(chooseUpgrade(run, priority.find((id) => run.progression.offers.includes(id)) ?? run.progression.offers[0]!)).toBe(true);
      }
      tickRun(run, routeIndex < 0 ? { x: 0, y: 0 } : directions[Math.floor(run.elapsed / 3) % 4]!);
      ticks++;
      if (ticks % 300 === 0) invariant(run);
    }
    expect(['victory', 'defeated']).toContain(run.status); invariant(run);
    const frozen = structuredClone(run);
    for (let tick = 0; tick < 60; tick++) tickRun(run, { x: 1, y: 1 });
    expect(run).toEqual(frozen);
    if (previous) expect(previous).toEqual(previousSnapshot);
    previous = run; previousSnapshot = frozen;
    const summary = { outcome: run.status === 'victory' ? 'victory' as const : 'defeat' as const, seconds: run.elapsed, kills: run.kills, xp: run.xp };
    expect(store.change((profile) => finishProfileRun(profile, id, summary))).toBe(true);
    const saved = records.get(SAVE_KEY)!;
    expect(store.change((profile) => finishProfileRun(profile, id, summary))).toBe(false);
    expect(records.get(SAVE_KEY)).toBe(saved); expect(decodeProfile(saved).ok).toBe(true);
    store = createProfileStore(storage);
    expect(store.get().completedRuns).toBe(cycle + 1); expect(store.get().lastResult?.id).toBe(id);
    expect(store.get().draft).toEqual(build);
    expect(store.get().slots[cycle % 3]!.talents).toEqual(build);
    expect(Object.entries(run.progression.ranks).every(([id, rank]) => rank <= UPGRADES.find((upgrade) => upgrade.id === id)!.maxRank)).toBe(true);
    if (run.status === 'victory') victories++; else defeats++;
    totalSeconds += run.elapsed;
  }
  expect(victories).toBeGreaterThan(0); expect(defeats).toBeGreaterThan(0);
  expect(totalSeconds).toBeGreaterThan(3600);
  expect(store.get().completedRuns).toBe(12); expect(talentBudget(store.get())).toBe(10);
  expect(store.get().unlocked).toHaveLength(6);
  console.info(`Release soak: ${victories} victories, ${defeats} defeats, ${Math.round(totalSeconds)} simulated seconds, 12 durable outcomes.`);
}, 60000);
