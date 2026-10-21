import { WORLD } from './rules';

export interface ArenaSize { width: number; height: number }

/** Match the display without stretching sprites or increasing the total combat area. */
export function arenaSize(width: number, height: number): ArenaSize {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return { ...WORLD };
  const aspect = Math.max(1 / 3, Math.min(3, width / height));
  const area = WORLD.width * WORLD.height;
  return { width: Math.sqrt(area * aspect), height: Math.sqrt(area / aspect) };
}
