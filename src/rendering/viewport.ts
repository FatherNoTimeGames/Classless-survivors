import type { ArenaSize } from '../game/arena-size';
import { WORLD } from '../game/rules';

/** Logical arena coordinates stay stable across CSS size and device density. */
export const ARENA_WIDTH = WORLD.width;
export const ARENA_HEIGHT = WORLD.height;

export interface Viewport {
  bufferWidth: number;
  bufferHeight: number;
  scale: number;
  offsetX: number;
  offsetY: number;
}

/** Fit without stretching; cap backing resolution to control mobile GPU memory. */
export function fitViewport(width: number, height: number, devicePixelRatio: number, world: ArenaSize = WORLD): Viewport | null {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }
  const ratio = Number.isFinite(devicePixelRatio) ? Math.max(1, Math.min(2, devicePixelRatio)) : 1;
  const bufferWidth = Math.max(1, Math.round(width * ratio));
  const bufferHeight = Math.max(1, Math.round(height * ratio));
  const scale = Math.min(bufferWidth / world.width, bufferHeight / world.height);
  return {
    bufferWidth,
    bufferHeight,
    scale,
    offsetX: (bufferWidth - world.width * scale) / 2,
    offsetY: (bufferHeight - world.height * scale) / 2,
  };
}
