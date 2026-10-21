import { RULES, STEP, WORLD } from './rules';
import type { ArenaSize } from './arena-size';
import type { Enemy, Point } from './state';
import { TALENT_TUNING as T } from '../content/talent-tuning';
import { ENEMIES, ENEMY_ATTACKS as A } from '../content/enemies';
import { clamp, distance } from './geometry';

export const enemySlow = (enemy: Enemy) => 1 - Math.max(enemy.frost > 0 ? T.frostSlow : 0, enemy.snared ? T.snareSlow : 0);
function travel(enemy: Enemy, dx: number, dy: number, world: ArenaSize): void {
  enemy.x = clamp(enemy.x + dx, RULES.enemyRadius, world.width - RULES.enemyRadius);
  enemy.y = clamp(enemy.y + dy, RULES.enemyRadius, world.height - RULES.enemyRadius);
}
export function moveEnemies(enemies: Enemy[], player: Point, world: ArenaSize = WORLD): void {
  for (const enemy of enemies) {
    enemy.previous = { x: enemy.x, y: enemy.y };
    enemy.chargedThisTick = false;
    enemy.grace = Math.max(0, enemy.grace - STEP);
    if (enemy.boss || enemy.health <= 0 || enemy.grace > 0 || enemy.stun > 0 || enemy.root > 0) continue;
    if (enemy.attack.phase === 'windup' || enemy.attack.phase === 'recover') continue;
    if (enemy.attack.phase === 'dash') {
      enemy.chargedThisTick = true;
      const speed = A.dashSpeed * enemySlow(enemy) * Math.min(STEP, enemy.attack.remaining);
      const before = { x: enemy.x, y: enemy.y };
      travel(enemy, enemy.attack.direction.x * speed, enemy.attack.direction.y * speed, world);
      enemy.attack.remaining = Math.max(0, enemy.attack.remaining - STEP);
      if (enemy.attack.remaining === 0 || distance(before, enemy) < speed * 0.5) {
        enemy.attack.phase = 'recover'; enemy.attack.remaining = A.dashRecovery;
      }
      continue;
    }
    const gap = distance(enemy, player);
    if (gap === 0) continue;
    const keep = ENEMIES[enemy.kind].keepDistance;
    const direction = keep === 0 || gap > keep + A.keepDistanceOuter ? 1 : gap < keep - A.keepDistanceInner ? -1 : 0;
    const speed = Math.min(gap, enemy.speed * enemySlow(enemy) * STEP) * direction;
    travel(enemy, (player.x - enemy.x) / gap * speed, (player.y - enemy.y) / gap * speed, world);
  }
}
