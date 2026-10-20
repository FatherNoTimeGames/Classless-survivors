import type { Point } from './state';

/** Ephemeral index: rebuild after movement; never retain stale positions across ticks. */
export function spatialIndex<T extends Point>(entries: readonly T[], cellSize = 48) {
  const cells = new Map<string, T[]>();
  for (const entry of entries) {
    const key = `${Math.floor(entry.x / cellSize)},${Math.floor(entry.y / cellSize)}`;
    const cell = cells.get(key) ?? []; cell.push(entry); cells.set(key, cell);
  }
  function box(left: number, top: number, right: number, bottom: number): T[] {
    const result: T[] = [];
    for (let x = Math.floor(left / cellSize); x <= Math.floor(right / cellSize); x++) {
      for (let y = Math.floor(top / cellSize); y <= Math.floor(bottom / cellSize); y++) result.push(...cells.get(`${x},${y}`) ?? []);
    }
    return result;
  }
  return {
    segment(from: Point, to: Point, padding: number): T[] {
      return box(Math.min(from.x, to.x) - padding, Math.min(from.y, to.y) - padding, Math.max(from.x, to.x) + padding, Math.max(from.y, to.y) + padding);
    },
    circle(center: Point, radius: number): T[] {
      return box(center.x - radius, center.y - radius, center.x + radius, center.y + radius)
        .filter((entry) => (entry.x - center.x) ** 2 + (entry.y - center.y) ** 2 <= radius ** 2);
    },
  };
}
