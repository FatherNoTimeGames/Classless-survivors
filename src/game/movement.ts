import { RULES, STEP, WORLD } from './rules';
import type { Player, Point } from './state';
import { clamp } from './geometry';

export function movePlayer(player: Player, input: Point, moveSpeed: number): void {
  const length = Math.hypot(input.x, input.y);
  const speed = moveSpeed * STEP / Math.max(1, length);
  player.moving = length > 0;
  if (input.x !== 0) player.facing = Math.sign(input.x);
  const inset = RULES.playerRadius + RULES.playerBoundaryPadding;
  player.x = clamp(player.x + input.x * speed, inset, WORLD.width - inset);
  player.y = clamp(player.y + input.y * speed, inset, WORLD.height - inset);
}
