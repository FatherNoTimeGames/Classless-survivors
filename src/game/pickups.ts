import { RULES, STEP } from './rules';
import type { Point, Run } from './state';
import { distance } from './geometry';
import { addSpark } from './effects';
import { emitEffect } from './events';
import { awardXp } from './progression';

export function dropShard(run: Run, point: Point, value: number = RULES.shardValue): void {
  if (run.shards.length < RULES.maxShards) {
    run.shards.push({ x: point.x, y: point.y, id: run.nextId++, value });
  } else {
    // Preserve earned XP even when the world has reached its pickup budget.
    const nearest = run.shards.reduce((a, b) => distance(point, a) < distance(point, b) ? a : b);
    nearest.value += value;
  }
}

export function updatePickups(run: Run, magnetRadius: number): void {
  const player = run.player;
  run.shards = run.shards.filter((shard) => {
    const gap = distance(shard, player);
    if (gap <= magnetRadius && gap > RULES.pickupRadius) {
      const travel = Math.min(gap, RULES.shardSpeed * STEP);
      shard.x += (player.x - shard.x) / gap * travel;
      shard.y += (player.y - shard.y) / gap * travel;
    }
    if (distance(shard, player) <= RULES.pickupRadius) {
      awardXp(run, shard.value);
      emitEffect(run.effects, { type: 'pickup', amount: shard.value, position: { x: player.x, y: player.y } });
      addSpark(run, shard, 'pickup');
      return false;
    }
    return true;
  });
}
