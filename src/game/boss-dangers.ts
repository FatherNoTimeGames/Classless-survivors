import type { BossShape } from './campaign-state';
import type { Point, Run } from './state';
import { distance, hitTime } from './geometry';
import { STEP, RULES } from './rules';
import { ENEMY_ATTACKS } from '../content/enemies';
import { damagePlayer } from './damage';

export function bossShapeHits(shape: BossShape, player: Point, radius = RULES.playerRadius): boolean {
  if (shape.kind === 'volley') return false; // Released through the shared swept-projectile system.
  if (shape.kind === 'line') return hitTime(shape.from, shape.to, player, shape.width + radius) !== null;
  const gap = distance(shape.origin, player);
  if (shape.kind === 'circle') return gap <= shape.radius + radius;
  if (shape.kind === 'ring') return gap + radius >= shape.inner && gap - radius <= shape.outer;
  if (gap > shape.radius + radius) return false;
  if (gap <= radius) return true;
  const angle = Math.atan2(player.y - shape.origin.y, player.x - shape.origin.x) - shape.angle;
  const wrapped = Math.atan2(Math.sin(angle), Math.cos(angle));
  return Math.abs(wrapped) <= shape.halfAngle + Math.asin(Math.min(1, radius / gap));
}

/** Resolve after friendly offense. A killing or stunning hit cancels an unreleased warning. */
export function updateBossDangers(run: Run): void {
  for (const danger of run.campaign.dangers) {
    if (danger.phase === 'warning') {
      const owner = run.enemies.find((enemy) => enemy.id === danger.ownerId && enemy.health > 0);
      if (!owner || owner.stun > 0) { danger.remaining = 0; continue; }
      danger.remaining -= STEP;
      if (danger.remaining > 1e-8) continue;
      if (danger.shape.kind === 'volley') {
        for (const angle of danger.shape.angles) {
          if (run.enemyBolts.length >= ENEMY_ATTACKS.maxBolts) break;
          run.enemyBolts.push({ id: run.nextId++, ...danger.shape.origin, vx: Math.cos(angle) * danger.shape.speed, vy: Math.sin(angle) * danger.shape.speed, remaining: 5, damage: danger.damage });
        }
        danger.remaining = 0;
        continue;
      }
      danger.phase = 'active'; danger.remaining = danger.activeFor;
    }
    if (bossShapeHits(danger.shape, run.player)) damagePlayer(run, danger.damage);
    danger.remaining -= STEP;
  }
  run.campaign.dangers = run.campaign.dangers.filter((danger) => danger.remaining > 1e-8);
}
