import { createRun } from '../src/game/state';
import type { Bolt, Enemy, Point, Run } from '../src/game/state';
import { RULES, STEP } from '../src/game/rules';
import { tickRun } from '../src/game/run';

export const STILL = { x: 0, y: 0 };
export function emptyRun(seed = 123): Run {
  const run = createRun(seed);
  run.spawnIn = Number.POSITIVE_INFINITY;
  return run;
}
export function advance(run: Run, seconds: number, input: Point = STILL): void {
  for (let step = 0; step < Math.round(seconds / STEP); step++) {
    tickRun(run, input);
  }
}

export function enemy(id: number, x: number, y: number): Enemy {
  return { id, x, y, health: RULES.enemyHealth, maxHealth: RULES.enemyHealth, grace: 0, frost: 0, stun: 0 };
}
export function bolt(overrides: Partial<Bolt>): Bolt {
  return { id: 201, x: 100, y: 100, vx: 0, vy: 0, life: 1, damage: RULES.attackDamage,
    source: 'ember', school: 'fire', pierce: 0, blastRadius: 0, hitIds: [], ...overrides };
}
