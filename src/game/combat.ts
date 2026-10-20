import { CAMPAIGN } from '../content/bosses';
import { RULES, STEP } from './rules';
import type { Player, Run } from './state';
import type { RunStats } from './stats';
import { distance, hitTime } from './geometry';
import { addSpark } from './effects';
import { damageEnemy, damagePlayer } from './damage';
import { fireVolley } from './projectiles';
import { emitEffect, withEffectContext } from './events';
import { ELITES, ENEMY_ATTACKS as A } from '../content/enemies';
import { spatialIndex } from './spatial';

export function updateCombatTimers(player: Player): void {
  player.invulnerable = Math.max(0, player.invulnerable - STEP);
  player.attackIn = Math.max(0, player.attackIn - STEP);
}

export function updateAttacks(run: Run, stats: RunStats): void {
  const player = run.player;
  if (player.attackIn <= 0 && run.bolts.length < RULES.maxBolts) {
    const fired = fireVolley(run, player, player, RULES.attackRange, {
      damage: RULES.attackDamage, source: 'ember', school: 'fire', extraTargets: Number(run.talentMemory.huntingCharge),
    }, stats);
    if (fired > stats.projectileCount) {
      run.talentMemory.huntingCharge = false;
      emitEffect(run.effects, { type: 'momentum-spent', amount: 1, position: { x: player.x, y: player.y } });
    }
    if (fired) player.attackIn = stats.attackInterval;
  }
}

export function updateProjectiles(run: Run): void {
  const index = spatialIndex(run.enemies);
  for (const bolt of run.bolts) {
    const end = { x: bolt.x + bolt.vx * STEP, y: bolt.y + bolt.vy * STEP };
    const hits = index.segment(bolt, end, Math.max(RULES.enemyRadius, CAMPAIGN.radius) + RULES.boltRadius).filter((enemy) => enemy.health > 0 && !bolt.hitIds.includes(enemy.id))
      .map((enemy) => ({ enemy, time: hitTime(bolt, end, enemy, enemy.radius + RULES.boltRadius) }))
      .filter((hit): hit is { enemy: typeof hit.enemy; time: number } => hit.time !== null)
      .sort((a, b) => a.time - b.time || a.enemy.id - b.enemy.id);
    for (const { enemy } of hits) {
      if (enemy.health <= 0) continue;
      withEffectContext(run.effects, bolt.effectContext, () => {
        damageEnemy(run, enemy, bolt.damage, { source: bolt.source, school: bolt.school });
        if (bolt.blastRadius > 0) {
          addSpark(run, enemy, 'burst', bolt.blastRadius);
          for (const neighbor of index.circle(enemy, bolt.blastRadius).sort((a, b) => a.id - b.id)) {
            if (neighbor.id !== enemy.id) {
              // Companion explosions retain ownership and Pack Link gating.
              damageEnemy(run, neighbor, bolt.damage / 2, { source: bolt.source === 'summon' ? 'summon' : 'blast', school: bolt.school });
            }
          }
        }
      });
      bolt.hitIds.push(enemy.id);
      if (bolt.pierce > 0) bolt.pierce--;
      else { bolt.life = 0; break; }
    }
    bolt.x = end.x;
    bolt.y = end.y;
    if (bolt.life > 0) bolt.life -= STEP;
  }
  run.bolts = run.bolts.filter((bolt) => bolt.life > 0);
  run.enemies = run.enemies.filter((enemy) => enemy.health > 0);
}

export function applyContactDamage(run: Run): void {
  const player = run.player;
  if (player.invulnerable > 0) return;
  let damage = 0;
  for (const enemy of run.enemies) {
    if (enemy.health <= 0 || enemy.grace > 0 || enemy.stun > 0) continue;
    const charging = enemy.chargedThisTick && enemy.root <= 0;
    const hit = charging
      ? hitTime(enemy.previous, enemy, player, RULES.playerRadius + enemy.radius) !== null
      : distance(enemy, player) < RULES.playerRadius + enemy.radius;
    if (hit) damage = Math.max(damage, enemy.contactDamage + (charging ? A.dashBonus * ELITES[enemy.elite].damage : 0));
  }
  if (damage > 0) damagePlayer(run, damage);
}
