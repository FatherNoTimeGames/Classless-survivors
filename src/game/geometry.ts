import type { Point } from './state';

export const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Earliest collision along a swept bolt, including initial overlap. */
export function hitTime(from: Point, to: Point, center: Point, radius: number): number | null {
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
