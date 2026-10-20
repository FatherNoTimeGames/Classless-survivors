import { createRun } from '../src/game/state';
import { tickRun } from '../src/game/run';
import { chooseUpgrade } from '../src/game/progression';
import { getRunStats } from '../src/game/stats';
import type { UpgradeId } from '../src/content/upgrades';
import type { BalanceRoute } from './routes';

const MOVEMENT = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }] as const;
const CORE: readonly UpgradeId[] = ['vitality', 'haste', 'magnet', 'fleet'];
const SECONDARY: readonly UpgradeId[] = ['fork', 'pierce', 'burst'];

/** Real fixed ticks and earned choices only. This simple pilot deliberately cannot dodge warnings. */
export function simulateRoute(route: BalanceRoute, seed: number, stationary = false, adaptive = false) {
  const run = createRun(seed, [...route.talents]);
  const choices: { at: number; id: UpgradeId }[] = [];
  const bosses: { id: string; seconds: number }[] = [];
  const peaks = { enemies: 0, bolts: 0, shards: 0, sparks: 0, effects: 0 };
  let bossStarted = 0, minHealth = run.player.health, healthLossTicks = 0, ticks = 0;
  const started = performance.now();
  while (!['victory', 'defeated'].includes(run.status) && ticks < 55000) {
    while (run.status === 'choosing') {
      const hurt = adaptive && run.player.health < getRunStats(run.progression.ranks).maxHealth * 0.6;
      const priority: readonly UpgradeId[] = [...(hurt ? ['wellspring', 'vitality', 'aegis', 'recovery'] as const : []), ...CORE, ...route.priority, ...SECONDARY];
      const id = priority.find((id) => run.progression.offers.includes(id)) ?? run.progression.offers[0]!;
      if (!chooseUpgrade(run, id)) throw new Error('Pilot could not spend an earned choice');
      choices.push({ at: run.elapsed, id });
    }
    const health = run.player.health, previous = run.campaign.active;
    tickRun(run, stationary ? { x: 0, y: 0 } : MOVEMENT[Math.floor(run.elapsed / 3) % 4]!);
    ticks++;
    if (!previous && run.campaign.active) bossStarted = run.elapsed;
    if (previous && !run.campaign.active && run.campaign.defeated.includes(previous.id)) {
      bosses.push({ id: previous.id, seconds: run.elapsed - bossStarted });
    }
    minHealth = Math.min(minHealth, run.player.health);
    if (run.player.health < health) healthLossTicks++;
    peaks.enemies = Math.max(peaks.enemies, run.enemies.length);
    peaks.bolts = Math.max(peaks.bolts, run.bolts.length);
    peaks.shards = Math.max(peaks.shards, run.shards.length);
    peaks.sparks = Math.max(peaks.sparks, run.sparks.length);
    peaks.effects = Math.max(peaks.effects, run.effects.processedThisTick);
  }
  return {
    route: route.name, seed, stationary, adaptive, outcome: run.status, seconds: run.elapsed,
    level: run.progression.level, kills: run.kills, xp: run.xp, health: run.player.health,
    minHealth, healthLossTicks, firstChoice: choices[0]?.at ?? null, lastChoice: choices.at(-1)?.at ?? null,
    ranks: run.progression.ranks, bosses, peaks, effectDrops: run.effects.dropped,
    ticks, wallMs: performance.now() - started,
  };
}
