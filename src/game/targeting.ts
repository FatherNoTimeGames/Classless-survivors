import type { Enemy, Point } from './state';
import { distance } from './geometry';

export function nearestEnemy(enemies: readonly Enemy[], origin: Point, range: number, excludeId?: number): Enemy | undefined {
  let target: Enemy | undefined;
  let nearest = range;
  for (const enemy of enemies) {
    const gap = distance(enemy, origin);
    if (enemy.health > 0 && enemy.id !== excludeId && gap <= nearest) { nearest = gap; target = enemy; }
  }
  return target;
}
