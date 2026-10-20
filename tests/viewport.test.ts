import { describe, expect, it } from 'vitest';
import { ARENA_HEIGHT, ARENA_WIDTH, fitViewport } from '../src/rendering/viewport';

describe('arena viewport fitting', () => {
  it('preserves the full logical arena on a portrait phone', () => {
    const view = fitViewport(354, 472, 2)!;
    expect(view.bufferWidth).toBe(708);
    expect(view.bufferHeight).toBe(944);
    expect(view.offsetX).toBe(0);
    expect(view.offsetY).toBe(0);
    expect(ARENA_WIDTH * view.scale).toBe(view.bufferWidth);
    expect(ARENA_HEIGHT * view.scale).toBe(view.bufferHeight);
  });

  it('centers the arena horizontally in a wide surface without stretching', () => {
    const view = fitViewport(800, 480, 1)!;
    expect(view.scale).toBe(1);
    expect(view.offsetX).toBe(220);
    expect(view.offsetY).toBe(0);
  });

  it('centers the arena vertically in a tall surface', () => {
    const view = fitViewport(360, 800, 1)!;
    expect(view.scale).toBe(1);
    expect(view.offsetY).toBe(160);
    expect(view.offsetX).toBe(0);
  });

  it('caps dense-screen allocation while maintaining the same visible area', () => {
    expect(fitViewport(360, 480, 4)).toEqual(fitViewport(360, 480, 2));
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])('uses a safe pixel ratio for %s', (ratio) => {
    expect(fitViewport(360, 480, ratio)).toEqual(fitViewport(360, 480, 1));
  });

  it.each([[0, 480], [360, 0], [-1, 480], [Number.NaN, 480], [360, Number.POSITIVE_INFINITY]])(
    'skips hidden or invalid surfaces (%s × %s)', (width, height) => {
      expect(fitViewport(width, height, 2)).toBeNull();
    },
  );

  it('rounds fractional CSS sizes into valid integer backing dimensions', () => {
    const view = fitViewport(353.3, 471.1, 1.25)!;
    expect(Number.isInteger(view.bufferWidth)).toBe(true);
    expect(Number.isInteger(view.bufferHeight)).toBe(true);
    expect(ARENA_WIDTH * view.scale + view.offsetX * 2).toBeCloseTo(view.bufferWidth);
    expect(ARENA_HEIGHT * view.scale + view.offsetY * 2).toBeCloseTo(view.bufferHeight);
  });
});
