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
export function fitViewport(width: number, height: number, devicePixelRatio: number): Viewport | null {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }
  const ratio = Number.isFinite(devicePixelRatio) ? Math.max(1, Math.min(2, devicePixelRatio)) : 1;
  const bufferWidth = Math.max(1, Math.round(width * ratio));
  const bufferHeight = Math.max(1, Math.round(height * ratio));
  const scale = Math.min(bufferWidth / ARENA_WIDTH, bufferHeight / ARENA_HEIGHT);
  return {
    bufferWidth,
    bufferHeight,
    scale,
    offsetX: (bufferWidth - ARENA_WIDTH * scale) / 2,
    offsetY: (bufferHeight - ARENA_HEIGHT * scale) / 2,
  };
}
