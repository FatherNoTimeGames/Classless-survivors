import { RULES, STEP } from './rules';
import type { Enemy, Player, Run } from './state';
import { distance, hitTime } from './geometry';
import { addSpark } from './effects';
import { dropShard } from './pickups';

export function updateCombatTimers(player: Player): void {
  player.invulnerable = Math.max(0, player.invulnerable - STEP);
  player.attackIn = Math.max(0, player.attackIn - STEP);
}

export function updateAttacks(run: Run): void {
  const player = run.player;
  if (player.attackIn <= 0 && run.bolts.length < RULES.maxBolts) {
    let target: Enemy | undefined;
    let nearest: number = RULES.attackRange;
    for (const enemy of run.enemies) {
      const gap = distance(enemy, player);
      if (gap <= nearest) { nearest = gap; target = enemy; }
    }
    if (target) {
      const dx = target.x - player.x;
      const dy = target.y - player.y;
      const gap = Math.hypot(dx, dy);
      run.bolts.push({
        x: player.x, y: player.y, id: run.nextId++,
        vx: gap > 0 ? dx / gap * RULES.boltSpeed : RULES.boltSpeed,
        vy: gap > 0 ? dy / gap * RULES.boltSpeed : 0, life: RULES.boltLifetime,
      });
      player.attackIn = RULES.attackInterval;
    }
  }
}

export function updateProjectiles(run: Run): void {
  for (const bolt of run.bolts) {
    const end = { x: bolt.x + bolt.vx * STEP, y: bolt.y + bolt.vy * STEP };
    let victim: Enemy | undefined;
    let earliest = Number.POSITIVE_INFINITY;
    for (const enemy of run.enemies) {
      if (enemy.health <= 0) continue;
      const time = hitTime(bolt, end, enemy, RULES.enemyRadius + RULES.boltRadius);
      if (time !== null && time < earliest) { earliest = time; victim = enemy; }
    }
    if (victim) {
      victim.health -= RULES.attackDamage;
      bolt.life = 0;
      addSpark(run, victim, 'hit');
      if (victim.health <= 0) {
        run.kills++;
        dropShard(run, victim);
      }
    } else {
      bolt.x = end.x;
      bolt.y = end.y;
      bolt.life -= STEP;
    }
  }
  run.bolts = run.bolts.filter((bolt) => bolt.life > 0);
  run.enemies = run.enemies.filter((enemy) => enemy.health > 0);
}

export function applyContactDamage(run: Run): void {
  const player = run.player;
  if (player.invulnerable <= 0 && run.enemies.some((enemy) =>
    enemy.grace <= 0 && distance(enemy, player) < RULES.playerRadius + RULES.enemyRadius,
  )) {
    player.health = Math.max(0, player.health - RULES.contactDamage);
    player.invulnerable = RULES.invulnerability;
    addSpark(run, player, 'hurt');
    if (player.health === 0) run.status = 'defeated';
  }
}
