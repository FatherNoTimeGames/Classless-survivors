import { RULES, WORLD } from './rules';

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
    spawnIn: RULES.firstSpawnDelay, randomState: (seed >>> 0) || 0x9e3779b9, nextId: 1,
  };
}
