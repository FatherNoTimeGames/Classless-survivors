import type { Run } from './state';
import { ENEMIES, ELITES, ENEMY_ATTACKS as A } from '../content/enemies';
import { STEP, RULES, WORLD } from './rules';
import { distance, hitTime } from './geometry';
import { damagePlayer } from './damage';
import { interruptAttack } from './enemies';

/** Release only after player offense: killed/stunned casters cannot finish a warning. */
export function releaseEnemyAttacks(run: Run): void {
  for (const enemy of run.enemies) {
    if (enemy.health <= 0 || enemy.grace > 0) continue;
    if (enemy.stun > 0 || (enemy.kind === 'charger' && enemy.root > 0)) { interruptAttack(enemy); continue; }
    const attack = enemy.attack;
    if (attack.phase !== 'windup' || attack.remaining > 0) continue;
    const damageScale = ELITES[enemy.elite].damage;
    if (enemy.kind === 'charger') {
      attack.phase = 'dash'; attack.remaining = A.dashDistance / A.dashSpeed;
      continue;
    }
    if (enemy.kind === 'archer' && run.enemyBolts.length < A.maxBolts) run.enemyBolts.push({
      id: run.nextId++, x: enemy.x, y: enemy.y, vx: attack.direction.x * A.arrowSpeed, vy: attack.direction.y * A.arrowSpeed,
      remaining: A.arrowLife, damage: A.arrowDamage * damageScale,
    });
    if (enemy.kind === 'hexer' && run.blights.length < A.maxBlights) run.blights.push({
      id: run.nextId++, ...attack.aim, radius: A.blightRadius, remaining: A.blightLife, damage: A.blightDamage * damageScale,
    });
    attack.phase = 'idle'; attack.remaining = ENEMIES[enemy.kind].cooldown;
  }
}
/** Released arrows and blight remain dangerous after their caster dies. All damage shares wards/iframes. */
export function updateEnemyAttacks(run: Run): void {
  for (const bolt of run.enemyBolts) {
    const end = { x: bolt.x + bolt.vx * STEP, y: bolt.y + bolt.vy * STEP };
    if (hitTime(bolt, end, run.player, RULES.playerRadius + A.arrowRadius) !== null) {
      damagePlayer(run, bolt.damage); bolt.remaining = 0;
    }
    bolt.x = end.x; bolt.y = end.y; bolt.remaining -= STEP;
  }
  run.enemyBolts = run.enemyBolts.filter((bolt) => bolt.remaining > 0 && bolt.x >= -8 && bolt.x <= WORLD.width + 8 && bolt.y >= -8 && bolt.y <= WORLD.height + 8);
  for (const zone of run.blights) {
    if (distance(zone, run.player) <= zone.radius + RULES.playerRadius) damagePlayer(run, zone.damage);
    zone.remaining -= STEP;
  }
  run.blights = run.blights.filter((zone) => zone.remaining > 0);
}
