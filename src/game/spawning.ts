import { RULES, STEP, WORLD } from './rules';
import type { Point, Run } from './state';
import { distance } from './geometry';
import { random } from './random';

function spawnEnemy(run: Run): void {
  let position: Point = { x: RULES.spawnInset, y: RULES.spawnInset };
  for (let attempt = 0; attempt < RULES.spawnAttempts; attempt++) {
    const edge = Math.floor(random(run) * 4);
    const along = random(run);
    position = edge < 2
      ? {
        x: edge === 0 ? RULES.spawnInset : WORLD.width - RULES.spawnInset,
        y: RULES.spawnInset + along * (WORLD.height - RULES.spawnInset * 2),
      }
      : {
        x: RULES.spawnInset + along * (WORLD.width - RULES.spawnInset * 2),
        y: edge === 2 ? RULES.spawnInset : WORLD.height - RULES.spawnInset,
      };
    if (distance(position, run.player) >= RULES.spawnDistance) break;
    if (attempt === RULES.spawnAttempts - 1) {
      position = {
        x: run.player.x < WORLD.width / 2 ? WORLD.width - RULES.spawnInset : RULES.spawnInset,
        y: run.player.y < WORLD.height / 2 ? WORLD.height - RULES.spawnInset : RULES.spawnInset,
      };
    }
  }
  run.enemies.push({ ...position, id: run.nextId++, health: RULES.enemyHealth, grace: RULES.spawnGrace });
}

export function updateSpawns(run: Run): void {
  run.spawnIn -= STEP;
  if (run.spawnIn <= 0) {
    if (run.enemies.length < RULES.maxEnemies) spawnEnemy(run);
    // A simple mounting threat, replaced by authored waves in the enemy milestone.
    run.spawnIn += Math.max(RULES.minimumSpawnInterval, RULES.initialSpawnInterval - run.elapsed * RULES.spawnAcceleration);
  }
}
