import { ENEMIES, ENEMY_ATTACKS as A } from '../content/enemies';
import type { Enemy, Run } from './state';
import { STEP, WORLD } from './rules';
import { clamp, distance } from './geometry';
import { moveEnemies } from './enemy-movement';

export function interruptAttack(enemy: Enemy): void {
  if (enemy.attack.phase === 'windup' || enemy.attack.phase === 'dash') {
    enemy.attack.phase = 'recover'; enemy.attack.remaining = A.dashRecovery;
  }
}
export function updateEnemies(run: Run): void {
  for (const enemy of run.enemies) {
    if (enemy.boss || enemy.health <= 0 || enemy.grace > 0) continue;
    if (enemy.stun > 0 || (enemy.kind === 'charger' && enemy.root > 0)) { interruptAttack(enemy); continue; }
    const attack = enemy.attack, definition = ENEMIES[enemy.kind];
    if (definition.attackRange === 0 || attack.phase === 'dash') continue;
    attack.remaining = Math.max(0, attack.remaining - STEP);
    if (attack.phase === 'windup') continue;
    if (attack.phase === 'recover') {
      if (attack.remaining === 0) { attack.phase = 'idle'; attack.remaining = definition.cooldown; }
      continue;
    }
    const gap = distance(enemy, run.player);
    if (attack.remaining > 0 || gap > definition.attackRange || gap < (enemy.kind === 'charger' ? A.chargeMinimumRange : A.spellMinimumRange)) continue;
    if (run.enemies.filter((foe) => foe.health > 0 && foe.attack.phase === 'windup').length >= A.maxWindups) continue;
    const aim = enemy.kind === 'hexer'
      ? { x: clamp(run.player.x, A.blightRadius + 4, WORLD.width - A.blightRadius - 4), y: clamp(run.player.y, A.blightRadius + 4, WORLD.height - A.blightRadius - 4) }
      : { x: run.player.x, y: run.player.y };
    if (enemy.kind === 'hexer') {
      const warnings = run.enemies.filter((foe) => foe.health > 0 && foe.kind === 'hexer' && foe.attack.phase === 'windup');
      if (run.blights.length + warnings.length >= A.maxBlights || run.blights.some((zone) => distance(zone, aim) < A.blightSpacing)
        || warnings.some((foe) => distance(foe.attack.aim, aim) < A.blightSpacing)) continue;
    }
    const dx = aim.x - enemy.x, dy = aim.y - enemy.y, length = Math.hypot(dx, dy);
    attack.direction = length > 0 ? { x: dx / length, y: dy / length } : { x: 1, y: 0 };
    attack.aim = enemy.kind === 'charger' ? { x: enemy.x + attack.direction.x * A.dashDistance, y: enemy.y + attack.direction.y * A.dashDistance } : aim;
    attack.phase = 'windup'; attack.remaining = definition.warning;
  }
  moveEnemies(run.enemies, run.player);
}
