import type { Run } from './state';
import { TALENT_TUNING as T } from '../content/talent-tuning';
import { nearestEnemy } from './targeting';
import { distance } from './geometry';
import { addSpark } from './effects';
import { damageEnemy } from './damage';
import { attackInterval } from './attack-timing';

/** Auto-face the nearest foe; one swing hits the enemies inside a 120-degree arc. */
export function updateMelee(run: Run): void {
  if (!run.talents.includes('sweeping-blade') || run.player.meleeIn > 0) return;
  const target = nearestEnemy(run.enemies, run.player, T.meleeRange);
  if (!target) return;
  const angle = Math.atan2(target.y - run.player.y, target.x - run.player.x);
  addSpark(run, run.player, 'cleave', T.meleeRange, angle);
  run.player.meleeIn = attackInterval(run, T.meleeInterval);
  for (const enemy of run.enemies) {
    const dx = enemy.x - run.player.x, dy = enemy.y - run.player.y;
    const gap = distance(enemy, run.player);
    const dot = gap === 0 ? 1 : (dx * Math.cos(angle) + dy * Math.sin(angle)) / gap;
    if (gap <= T.meleeRange && dot >= Math.cos(T.meleeHalfAngle)) {
      damageEnemy(run, enemy, T.meleeDamage, { source: 'melee', school: 'physical' });
    }
  }
}
