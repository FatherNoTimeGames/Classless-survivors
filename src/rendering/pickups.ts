import type { Run } from '../game/state';
import { pickupGlyphs } from '../presentation/readability';

export function drawPickups(context: CanvasRenderingContext2D, run: Run, reducedMotion: boolean): void {
  for (const shard of pickupGlyphs(run.shards)) {
    const bob = reducedMotion ? 0 : Math.round(Math.sin(run.elapsed * 4 + shard.id));
    const x = Math.round(shard.x), y = Math.round(shard.y) + bob, size = shard.count > 2 || shard.value >= 20 ? 4 : 3;
    context.fillStyle = '#102c24'; context.fillRect(x - size, y - size, size * 2, size * 2);
    context.fillStyle = '#2b6a52'; context.fillRect(x - 2, y - 3, 4, 6);
    context.fillStyle = '#74cbaa'; context.fillRect(x - 1, y - 4, 2, 7);
    context.fillStyle = '#b1e7c4'; context.fillRect(x - 1, y - 2, 1, 2);
    if (shard.count > 2) { context.fillStyle = '#74cbaa'; context.fillRect(x + 2, y - 1, 2, 2); }
  }
}
