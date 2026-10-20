/** Browser-independent simulation. All gameplay advances at a fixed 60 Hz. */
export const STEP = 1 / 60;
export const WORLD = { width: 360, height: 480 } as const;
export const RULES = {
  playerSpeed: 105,
  playerRadius: 8,
  maxHealth: 60,
  enemySpeed: 30,
  enemyRadius: 8,
  enemyHealth: 18,
  contactDamage: 12,
  invulnerability: 0.8,
  attackRange: 180,
  attackInterval: 0.7,
  attackDamage: 18,
  boltSpeed: 240,
  pickupRadius: 14,
  magnetRadius: 56,
  maxEnemies: 80,
  maxBolts: 32,
  maxShards: 160,
} as const;

export interface Point { x: number; y: number }
export interface Player extends Point {
  health: number;
  invulnerable: number;
  attackIn: number;
  facing: number;
  moving: boolean;
}
export interface Enemy extends Point { id: number; health: number; grace: number }
export interface Bolt extends Point { id: number; vx: number; vy: number; life: number }
export interface Shard extends Point { id: number; value: number }
export interface Spark extends Point { kind: 'hit' | 'pickup' | 'hurt'; life: number }
export interface Run {
  status: 'running' | 'defeated';
  elapsed: number;
  kills: number;
  xp: number;
  player: Player;
  enemies: Enemy[];
  bolts: Bolt[];
  shards: Shard[];
  sparks: Spark[];
  spawnIn: number;
  randomState: number;
  nextId: number;
}

export function createRun(seed: number): Run {
  return {
    status: 'running', elapsed: 0, kills: 0, xp: 0,
    player: {
      x: WORLD.width / 2, y: WORLD.height / 2, health: RULES.maxHealth,
      invulnerable: 0, attackIn: 0, facing: 1, moving: false,
    },
    enemies: [], bolts: [], shards: [], sparks: [],
    spawnIn: 0.35, randomState: (seed >>> 0) || 0x9e3779b9, nextId: 1,
  };
}

function random(run: Run): number {
  let value = run.randomState;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  run.randomState = value >>> 0;
  return run.randomState / 0x1_0000_0000;
}

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function spawnEnemy(run: Run): void {
  let position: Point = { x: 16, y: 16 };
  for (let attempt = 0; attempt < 8; attempt++) {
    const edge = Math.floor(random(run) * 4);
    const along = random(run);
    position = edge < 2
      ? { x: edge === 0 ? 16 : WORLD.width - 16, y: 16 + along * (WORLD.height - 32) }
      : { x: 16 + along * (WORLD.width - 32), y: edge === 2 ? 16 : WORLD.height - 16 };
    if (distance(position, run.player) >= 110) break;
    if (attempt === 7) {
      position = {
        x: run.player.x < WORLD.width / 2 ? WORLD.width - 16 : 16,
        y: run.player.y < WORLD.height / 2 ? WORLD.height - 16 : 16,
      };
    }
  }
  run.enemies.push({ ...position, id: run.nextId++, health: RULES.enemyHealth, grace: 0.6 });
}

/** Earliest collision along a swept bolt, including initial overlap. */
function hitTime(from: Point, to: Point, center: Point, radius: number): number | null {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const ox = from.x - center.x;
  const oy = from.y - center.y;
  const c = ox * ox + oy * oy - radius * radius;
  if (c <= 0) return 0;
  const a = dx * dx + dy * dy;
  if (a === 0) return null;
  const b = 2 * (ox * dx + oy * dy);
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return null;
  const time = (-b - Math.sqrt(discriminant)) / (2 * a);
  return time >= 0 && time <= 1 ? time : null;
}

function spark(run: Run, point: Point, kind: Spark['kind']): void {
  if (run.sparks.length < 64) run.sparks.push({ x: point.x, y: point.y, kind, life: 0.3 });
}

function dropShard(run: Run, point: Point): void {
  if (run.shards.length < RULES.maxShards) {
    run.shards.push({ x: point.x, y: point.y, id: run.nextId++, value: 5 });
  } else {
    // Preserve earned XP even when the world has reached its pickup budget.
    const nearest = run.shards.reduce((a, b) => distance(point, a) < distance(point, b) ? a : b);
    nearest.value += 5;
  }
}

/** One simulation tick. The caller supplies a direction, never a frame delta. */
export function tickRun(run: Run, input: Point): void {
  if (run.status !== 'running') return;
  const player = run.player;
  run.elapsed += STEP;
  player.invulnerable = Math.max(0, player.invulnerable - STEP);
  player.attackIn = Math.max(0, player.attackIn - STEP);
  for (const effect of run.sparks) effect.life -= STEP;
  run.sparks = run.sparks.filter((effect) => effect.life > 0);

  const length = Math.hypot(input.x, input.y);
  const speed = RULES.playerSpeed * STEP / Math.max(1, length);
  player.moving = length > 0;
  if (input.x !== 0) player.facing = Math.sign(input.x);
  const inset = RULES.playerRadius + 4;
  player.x = clamp(player.x + input.x * speed, inset, WORLD.width - inset);
  player.y = clamp(player.y + input.y * speed, inset, WORLD.height - inset);

  run.spawnIn -= STEP;
  if (run.spawnIn <= 0) {
    if (run.enemies.length < RULES.maxEnemies) spawnEnemy(run);
    // A simple mounting threat, replaced by authored waves in the enemy milestone.
    run.spawnIn += Math.max(0.36, 1.2 - run.elapsed * 0.012);
  }
  for (const enemy of run.enemies) {
    enemy.grace = Math.max(0, enemy.grace - STEP);
    if (enemy.grace > 0) continue;
    const gap = distance(enemy, player);
    if (gap > 0) {
      const travel = Math.min(gap, RULES.enemySpeed * STEP);
      enemy.x += (player.x - enemy.x) / gap * travel;
      enemy.y += (player.y - enemy.y) / gap * travel;
    }
  }

  if (player.attackIn <= 0 && run.bolts.length < RULES.maxBolts) {
    let target: Enemy | undefined;
    let nearest = RULES.attackRange as number;
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
        vy: gap > 0 ? dy / gap * RULES.boltSpeed : 0, life: 1,
      });
      player.attackIn = RULES.attackInterval;
    }
  }

  for (const bolt of run.bolts) {
    const end = { x: bolt.x + bolt.vx * STEP, y: bolt.y + bolt.vy * STEP };
    let victim: Enemy | undefined;
    let earliest = Number.POSITIVE_INFINITY;
    for (const enemy of run.enemies) {
      if (enemy.health <= 0) continue;
      const time = hitTime(bolt, end, enemy, RULES.enemyRadius + 2);
      if (time !== null && time < earliest) { earliest = time; victim = enemy; }
    }
    if (victim) {
      victim.health -= RULES.attackDamage;
      bolt.life = 0;
      spark(run, victim, 'hit');
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

  run.shards = run.shards.filter((shard) => {
    const gap = distance(shard, player);
    if (gap <= RULES.magnetRadius && gap > RULES.pickupRadius) {
      const travel = Math.min(gap, 130 * STEP);
      shard.x += (player.x - shard.x) / gap * travel;
      shard.y += (player.y - shard.y) / gap * travel;
    }
    if (distance(shard, player) <= RULES.pickupRadius) {
      run.xp += shard.value;
      spark(run, shard, 'pickup');
      return false;
    }
    return true;
  });

  if (player.invulnerable <= 0 && run.enemies.some((enemy) =>
    enemy.grace <= 0 && distance(enemy, player) < RULES.playerRadius + RULES.enemyRadius,
  )) {
    player.health = Math.max(0, player.health - RULES.contactDamage);
    player.invulnerable = RULES.invulnerability;
    spark(run, player, 'hurt');
    if (player.health === 0) run.status = 'defeated';
  }
}
