import { RULES, STEP, WORLD } from './rules';
import type { Enemy, Player, Point } from './state';
import { TALENT_TUNING as T } from '../content/talent-tuning';
import { clamp, distance } from './geometry';

export function movePlayer(player: Player, input: Point, moveSpeed: number): void {
  const length = Math.hypot(input.x, input.y);
  const speed = moveSpeed * STEP / Math.max(1, length);
  player.moving = length > 0;
  if (input.x !== 0) player.facing = Math.sign(input.x);
  const inset = RULES.playerRadius + RULES.playerBoundaryPadding;
  player.x = clamp(player.x + input.x * speed, inset, WORLD.width - inset);
  player.y = clamp(player.y + input.y * speed, inset, WORLD.height - inset);
}

export function moveEnemies(enemies: Enemy[], player: Point): void {
  for (const enemy of enemies) {
    enemy.grace = Math.max(0, enemy.grace - STEP);
    if (enemy.grace > 0 || enemy.stun > 0 || enemy.root > 0) continue;
    const gap = distance(enemy, player);
    if (gap > 0) {
      const travel = Math.min(gap, RULES.enemySpeed * (1 - Math.max(enemy.frost > 0 ? T.frostSlow : 0, enemy.snared ? T.snareSlow : 0)) * STEP);
      enemy.x += (player.x - enemy.x) / gap * travel;
      enemy.y += (player.y - enemy.y) / gap * travel;
    }
  }
}
