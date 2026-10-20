import type { Enemy, Run } from './state';
import { damageEnemy } from './damage';
import { emitEffect } from './events';
import { STEP } from './rules';
import { addSpark } from './effects';
import { snapshotDots } from './dot-state';

const EPSILON = 1e-8;

/** Natural expiration follows the final tick; dead enemies never pay expiration healing. */
export function updateDamageOverTime(run: Run): void {
  for (const enemy of run.enemies) {
    if (enemy.health <= 0) continue;
    for (const dot of enemy.dots) {
      const activeTime = Math.min(STEP, dot.remaining);
      dot.remaining = Math.max(0, dot.remaining - STEP);
      dot.tickIn -= activeTime;
      if (dot.tickIn <= EPSILON) {
        damageEnemy(run, enemy, dot.damage, { source: 'dot', school: dot.school });
        dot.tickIn += dot.interval;
        addSpark(run, enemy, 'poison');
      }
      if (enemy.health <= 0) break;
      if (dot.remaining <= EPSILON) emitEffect(run.effects, { type: 'dot-expired', amount: dot.damage, position: { x: enemy.x, y: enemy.y } });
    }
    enemy.dots = enemy.dots.filter((dot) => dot.remaining > EPSILON);
  }
}

/** An extra tick never refreshes duration, advances the normal clock, or critically strikes. */
export function pulseDots(run: Run, enemy: Enemy): void {
  for (const dot of snapshotDots(enemy)) damageEnemy(run, enemy, dot.damage, { source: 'dot', school: dot.school });
  if (enemy.dots.length) addSpark(run, enemy, 'poison');
}
