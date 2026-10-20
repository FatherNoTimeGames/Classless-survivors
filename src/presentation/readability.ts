import { feedbackPriority } from '../content/feedback';
import type { Shard, Spark } from '../game/state';

/** Nearby XP shares one visual glyph; real pickups, value and attraction remain in simulation. */
export function pickupGlyphs(shards: readonly Shard[]): (Shard & { count: number })[] {
  const groups = new Map<string, Shard & { count: number }>();
  for (const shard of shards) {
    const key = `${Math.floor(shard.x / 12)},${Math.floor(shard.y / 12)}`;
    const group = groups.get(key);
    if (group) { group.x += shard.x; group.y += shard.y; group.value += shard.value; group.count++; }
    else groups.set(key, { ...shard, count: 1 });
  }
  return [...groups.values()].map((group) => ({ ...group, x: group.x / group.count, y: group.y / group.count }));
}
/** Prioritize useful feedback and merge same-kind local repetitions, without touching the effect queue. */
export function feedbackGlyphs(effects: readonly Spark[], limit = 28): Spark[] {
  const groups = new Set<string>();
  return [...effects].sort((a, b) => feedbackPriority(b.kind) - feedbackPriority(a.kind) || b.life - a.life)
    .filter((effect) => {
      const key = `${effect.kind}:${Math.floor(effect.x / 16)},${Math.floor(effect.y / 16)}`;
      if (groups.has(key)) return false;
      groups.add(key); return true;
    }).slice(0, limit).reverse();
}
