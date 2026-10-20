import { RULES, STEP } from './rules';
import type { Player, Run } from './state';
import type { RunStats } from './stats';
import { distance, hitTime } from './geometry';
import { addSpark } from './effects';
import { damageEnemy, damagePlayer } from './damage';

export function updateCombatTimers(player: Player): void {
  player.invulnerable = Math.max(0, player.invulnerable - STEP);
  player.attackIn = Math.max(0, player.attackIn - STEP);
}

export function updateAttacks(run: Run, stats: RunStats): void {
  const player = run.player;
  if (player.attackIn <= 0 && run.bolts.length < RULES.maxBolts) {
    const targets = run.enemies.filter((enemy) => distance(enemy, player) <= RULES.attackRange)
      .sort((a, b) => distance(a, player) - distance(b, player))
      .slice(0, Math.min(stats.projectileCount + Number(run.talentMemory.huntingCharge), RULES.maxBolts - run.bolts.length));
    for (const target of targets) {
      const dx = target.x - player.x;
      const dy = target.y - player.y;
      const gap = Math.hypot(dx, dy);
      run.bolts.push({
        x: player.x, y: player.y, id: run.nextId++,
        vx: gap > 0 ? dx / gap * RULES.boltSpeed : RULES.boltSpeed,
        vy: gap > 0 ? dy / gap * RULES.boltSpeed : 0, life: RULES.boltLifetime,
        damage: RULES.attackDamage, pierce: stats.pierce, blastRadius: stats.blastRadius, hitIds: [],
      });
    }
    if (targets.length > stats.projectileCount) run.talentMemory.huntingCharge = false;
    if (targets.length) player.attackIn = stats.attackInterval;
  }
}

export function updateProjectiles(run: Run): void {
  for (const bolt of run.bolts) {
    const end = { x: bolt.x + bolt.vx * STEP, y: bolt.y + bolt.vy * STEP };
    const hits = run.enemies.filter((enemy) => enemy.health > 0 && !bolt.hitIds.includes(enemy.id))
      .map((enemy) => ({ enemy, time: hitTime(bolt, end, enemy, RULES.enemyRadius + RULES.boltRadius) }))
      .filter((hit): hit is { enemy: typeof hit.enemy; time: number } => hit.time !== null)
      .sort((a, b) => a.time - b.time);
    for (const { enemy } of hits) {
      if (enemy.health <= 0) continue;
      damageEnemy(run, enemy, bolt.damage);
      bolt.hitIds.push(enemy.id);
      if (bolt.blastRadius > 0) {
        addSpark(run, enemy, 'burst', bolt.blastRadius);
        for (const neighbor of run.enemies) {
          if (neighbor.id !== enemy.id && distance(neighbor, enemy) <= bolt.blastRadius) {
            damageEnemy(run, neighbor, bolt.damage / 2, { source: 'blast' });
          }
        }
      }
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
  if (player.invulnerable <= 0 && run.enemies.some((enemy) =>
    enemy.grace <= 0 && distance(enemy, player) < RULES.playerRadius + RULES.enemyRadius,
  )) {
    damagePlayer(run, RULES.contactDamage);
  }
}
