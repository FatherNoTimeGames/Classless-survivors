import { ENEMIES, ELITES, ENEMY_ATTACKS as A } from '../content/enemies';
import type { EnemyKind, EliteKind } from '../content/enemies';
import type { Enemy, Point } from './state';
import { RULES } from './rules';

/** Spawn snapshots preserve an existing foe's stats when the wave changes. */
export function createEnemy(id: number, point: Point, kind: EnemyKind = 'husk', elite: EliteKind = 'none', healthScale = 1): Enemy {
  const base = ENEMIES[kind], modifier = ELITES[elite];
  const health = Math.ceil(base.health * modifier.health * healthScale);
  return { ...point, id, kind, elite, boss: null, radius: RULES.enemyRadius, controlGuard: 0, health, maxHealth: health, grace: RULES.spawnGrace,
    speed: base.speed * modifier.speed, contactDamage: base.contact * modifier.damage, rewardXp: base.xp * modifier.xp,
    holyMark: 0, frost: 0, stun: 0, root: 0, rootImmune: 0, snared: false, dots: [],
    previous: { ...point }, chargedThisTick: false,
    attack: { phase: 'idle', remaining: A.initialDelay + id % A.staggerSlots * A.stagger, aim: { ...point }, direction: { x: 1, y: 0 } },
  };
}
