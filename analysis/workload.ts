import { UPGRADES } from '../src/content/upgrades';
import { createRun } from '../src/game/state';
import { createEnemy } from '../src/game/enemy-state';
import { applyDot } from '../src/game/dot-state';
import { RULES } from '../src/game/rules';
import { tickRun } from '../src/game/run';
import { getRunStats } from '../src/game/stats';

/** Synthetic cap workload, NOT a balance route. No production hooks or altered game rules. */
export function denseWorkload() {
  const run = createRun(42, ['reprisal', 'sweeping-blade', 'spellsteel', 'arcane-echo', 'rime-sigil', 'shatterglass', 'expose-weakness', 'venom-edge']);
  run.elapsed = 120;
  run.spawnIn = Infinity;
  run.player.invulnerable = Infinity;
  run.progression.ranks = Object.fromEntries(UPGRADES.map((upgrade) => [upgrade.id, upgrade.maxRank]));
  run.player.health = getRunStats(run.progression.ranks).maxHealth;
  for (let i = 0; i < RULES.maxEnemies; i++) {
    const angle = i * Math.PI * 2 / RULES.maxEnemies;
    const foe = createEnemy(run.nextId++, { x: 180 + Math.cos(angle) * 75, y: 240 + Math.sin(angle) * 75 },
      (['husk', 'skitter', 'archer', 'charger', 'hexer'] as const)[i % 5]);
    foe.health = foe.maxHealth = 100_000;
    foe.grace = 0;
    for (const kind of ['poison', 'curse'] as const) applyDot(foe, {
      kind, school: kind === 'poison' ? 'poison' : 'shadow', owner: 'player', damage: 3, interval: 1, remaining: 60, tickIn: 0,
    });
    run.enemies.push(foe);
  }
  for (let i = 0; i < RULES.maxBolts; i++) {
    const angle = i * Math.PI * 2 / RULES.maxBolts;
    run.bolts.push({ id: run.nextId++, x: 180, y: 240, vx: Math.cos(angle) * 240, vy: Math.sin(angle) * 240,
      life: 1, damage: 18, source: 'ember', school: 'fire', pierce: 2, blastRadius: 40, hitIds: [] });
  }
  for (let i = 0; i < RULES.maxShards; i++) run.shards.push({ id: run.nextId++, x: i % 2 ? 12 : 348, y: 12 + i % 150 * 3, value: 5 });
  for (let i = 0; i < RULES.maxSparks; i++) run.sparks.push({ kind: 'arcane', x: 30 + i % 15 * 20, y: 40 + Math.floor(i / 15) * 70, life: 0.3, radius: 16 });
  return run;
}

export function percentile(values: readonly number[], fraction: number): number {
  return [...values].sort((a, b) => a - b)[Math.min(values.length - 1, Math.floor(values.length * fraction))]!;
}

export function benchmarkSimulation() {
  const samples: number[] = [];
  let effectDrops = 0, peakEffects = 0;
  for (let batch = 0; batch < 35; batch++) {
    const run = denseWorkload();
    for (let tick = 0; tick < 60; tick++) {
      const started = performance.now();
      tickRun(run, { x: 0, y: 0 });
      if (batch >= 5) samples.push(performance.now() - started);
      peakEffects = Math.max(peakEffects, run.effects.processedThisTick);
    }
    effectDrops += run.effects.dropped;
  }
  return { samples: samples.length, medianMs: percentile(samples, 0.5), p95Ms: percentile(samples, 0.95),
    p99Ms: percentile(samples, 0.99), maxMs: Math.max(...samples), effectDrops, peakEffects };
}
