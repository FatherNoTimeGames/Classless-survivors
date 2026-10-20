import type { Enemy, Run } from './state';
import { addSpark } from './effects';
import { dropShard } from './pickups';

/** Shared damage boundary: deaths and XP drops are credited exactly once. */
export function damageEnemy(run: Run, enemy: Enemy, amount: number): void {
  if (enemy.health <= 0) return;
  enemy.health -= amount;
  addSpark(run, enemy, 'hit');
  if (enemy.health <= 0) {
    run.kills++;
    dropShard(run, enemy);
  }
}
