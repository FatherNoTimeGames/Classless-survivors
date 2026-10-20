import { upgradeRank } from '../content/upgrades';
import { UPGRADE_TUNING as U } from '../content/upgrade-tuning';
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
  const rank = upgradeRank(run.progression.ranks, 'longblade');
  const range = T.meleeRange + rank * U.bladeRange;
  const damage = T.meleeDamage + rank * U.bladeDamage;
  const target = nearestEnemy(run.enemies, run.player, range);
  if (!target) return;
  const angle = Math.atan2(target.y - run.player.y, target.x - run.player.x);
  addSpark(run, run.player, 'cleave', range, angle);
  run.player.meleeIn = attackInterval(run, T.meleeInterval);
  for (const enemy of run.enemies) {
    const dx = enemy.x - run.player.x, dy = enemy.y - run.player.y;
    const gap = distance(enemy, run.player);
    const dot = gap === 0 ? 1 : (dx * Math.cos(angle) + dy * Math.sin(angle)) / gap;
    if (gap <= range && dot >= Math.cos(T.meleeHalfAngle)) {
      damageEnemy(run, enemy, damage, { source: 'melee', school: 'physical' });
    }
  }
}
