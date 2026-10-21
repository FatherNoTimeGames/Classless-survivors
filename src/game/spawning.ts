import { RULES, STEP } from './rules';
import type { Point, Run } from './state';
import { distance } from './geometry';
import { random } from './random';
import { createEnemy } from './enemy-state';
import { waveAt, WAVE_RULES } from '../content/waves';
import type { EnemyKind, EliteKind } from '../content/enemies';

export function safeSpawnPoint(run: Run): Point {
  let position: Point = { x: RULES.spawnInset, y: RULES.spawnInset };
  for (let attempt = 0; attempt < RULES.spawnAttempts; attempt++) {
    const edge = Math.floor(random(run) * 4);
    const along = random(run);
    position = edge < 2
      ? {
        x: edge === 0 ? RULES.spawnInset : run.world.width - RULES.spawnInset,
        y: RULES.spawnInset + along * (run.world.height - RULES.spawnInset * 2),
      }
      : {
        x: RULES.spawnInset + along * (run.world.width - RULES.spawnInset * 2),
        y: edge === 2 ? RULES.spawnInset : run.world.height - RULES.spawnInset,
      };
    if (distance(position, run.player) >= RULES.spawnDistance) break;
    if (attempt === RULES.spawnAttempts - 1) {
      position = {
        x: run.player.x < run.world.width / 2 ? run.world.width - RULES.spawnInset : RULES.spawnInset,
        y: run.player.y < run.world.height / 2 ? run.world.height - RULES.spawnInset : RULES.spawnInset,
      };
    }
  }
  return position;
}

function spawnEnemy(run: Run): void {
  const position = safeSpawnPoint(run);
  const wave = waveAt(run.elapsed);
  let kind: EnemyKind = wave.pool[0]![0];
  if (wave.pool.length > 1) {
    let roll = random(run) * wave.pool.reduce((sum, entry) => sum + entry[1], 0);
    for (const entry of wave.pool) { roll -= entry[1]; if (roll < 0) { kind = entry[0]; break; } }
  }
  const elite: EliteKind = wave.eliteEvery && (run.spawned + 1) % wave.eliteEvery === 0
    ? Math.floor(run.spawned / wave.eliteEvery) % 2 === 0 ? 'swift' : 'stout' : 'none';
  run.enemies.push(createEnemy(run.nextId++, position, kind, elite, wave.health));
  run.spawned++;
}

export function updateSpawns(run: Run): void {
  if (run.campaign.active || run.elapsed < run.campaign.breakUntil) return;
  run.spawnIn -= STEP;
  if (run.spawnIn <= 0) {
    if (run.enemies.length < RULES.maxEnemies) spawnEnemy(run);
    const wave = waveAt(run.elapsed);
    run.spawnIn += wave.at === 0 ? Math.max(WAVE_RULES.introMinimumInterval, wave.interval - run.elapsed * WAVE_RULES.introAcceleration) : wave.interval;
  }
}
