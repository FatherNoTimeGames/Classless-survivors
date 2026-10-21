import { BOSSES, CAMPAIGN, bossById } from '../content/bosses';
import type { ArenaSize } from './arena-size';
import type { Enemy, Point, Run } from './state';
import { createEnemy } from './enemy-state';
import { clamp, distance } from './geometry';
import { STEP, WORLD } from './rules';
import { enemySlow } from './enemy-movement';
import { safeSpawnPoint } from './spawning';
import { prepareBossPattern } from './boss-patterns';
import { healPlayer } from './healing';
import { getRunStats } from './stats';

export function bossSpawnPoint(player: Point, world: ArenaSize = WORLD): Point {
  const towardCenter = Math.atan2(world.height / 2 - player.y, world.width / 2 - player.x);
  let best = { x: world.width / 2, y: world.height / 2 }, error = Infinity;
  for (let i = 0; i < 16; i++) {
    const angle = towardCenter + i * Math.PI / 8;
    const point = { x: clamp(player.x + Math.cos(angle) * 155, 32, world.width - 32), y: clamp(player.y + Math.sin(angle) * 155, 32, world.height - 32) };
    const difference = Math.abs(distance(player, point) - 155);
    if (difference < error) { best = point; error = difference; }
  }
  return best;
}
function clearThreats(run: Run): void {
  run.enemies = []; run.enemyBolts = []; run.blights = []; run.campaign.dangers = [];
}
export function updateEncounterSchedule(run: Run): void {
  const campaign = run.campaign, definition = BOSSES[campaign.nextBoss];
  if (campaign.active || !definition || run.elapsed + 1e-8 < definition.at || run.elapsed < campaign.breakUntil) return;
  clearThreats(run);
  const enemy = createEnemy(run.nextId++, bossSpawnPoint(run.player, run.world));
  Object.assign(enemy, { boss: definition.id, radius: CAMPAIGN.radius, health: definition.health, maxHealth: definition.health, speed: definition.speed,
    contactDamage: definition.contact, rewardXp: definition.xp, grace: CAMPAIGN.arrivalGrace });
  run.enemies.push(enemy);
  campaign.active = { id: definition.id, enemyId: enemy.id, pattern: 0, attackIn: 0.6, addIn: 2 };
  campaign.nextBoss++;
}

/** Resolve once, including deaths already removed by projectile cleanup. */
export function resolveBossDefeat(run: Run): void {
  const fight = run.campaign.active;
  if (!fight || run.enemies.some((enemy) => enemy.id === fight.enemyId && enemy.health > 0)) return;
  run.campaign.defeated.push(fight.id);
  run.campaign.active = null;
  clearThreats(run);
  run.campaign.breakUntil = run.elapsed + CAMPAIGN.respite;
  run.spawnIn = 0.5;
  healPlayer(run, getRunStats(run.progression.ranks).maxHealth * CAMPAIGN.healing);
}
function moveBoss(enemy: Enemy, run: Run, keepDistance: number): void {
  if (enemy.root > 0) return;
  const gap = distance(enemy, run.player);
  if (gap === 0) return;
  const direction = keepDistance === 0 || gap > keepDistance + 12 ? 1 : gap < keepDistance - 20 ? -1 : 0;
  const travel = Math.min(gap, enemy.speed * enemySlow(enemy) * STEP) * direction;
  enemy.x = clamp(enemy.x + (run.player.x - enemy.x) / gap * travel, enemy.radius, run.world.width - enemy.radius);
  enemy.y = clamp(enemy.y + (run.player.y - enemy.y) / gap * travel, enemy.radius, run.world.height - enemy.radius);
}
export function updateBossIntent(run: Run): void {
  const fight = run.campaign.active;
  if (!fight) return;
  const enemy = run.enemies.find((foe) => foe.id === fight.enemyId && foe.health > 0);
  if (!enemy || enemy.grace > 0) return;
  const definition = bossById(fight.id);
  fight.addIn -= STEP;
  if (fight.addIn <= 0) {
    if (run.enemies.filter((foe) => !foe.boss && foe.health > 0).length < CAMPAIGN.maxAdds) {
      run.enemies.push(createEnemy(run.nextId++, safeSpawnPoint(run), fight.pattern % 2 ? 'skitter' : 'husk', 'none', 1.5));
    }
    fight.addIn += CAMPAIGN.addInterval;
  }
  if (enemy.stun > 0) {
    run.campaign.dangers = run.campaign.dangers.filter((danger) => danger.ownerId !== enemy.id || danger.phase !== 'warning');
    fight.attackIn = 0.8;
    return;
  }
  fight.attackIn = Math.max(0, fight.attackIn - STEP);
  if (run.campaign.dangers.some((danger) => danger.ownerId === enemy.id && danger.phase === 'warning')) return;
  if (fight.attackIn === 0) {
    const warning = prepareBossPattern(run, enemy, fight);
    fight.attackIn = warning + definition.recovery * (enemy.health < enemy.maxHealth / 2 ? 0.8 : 1);
  } else moveBoss(enemy, run, definition.keepDistance);
}
