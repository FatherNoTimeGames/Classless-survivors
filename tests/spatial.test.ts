import { expect, it } from 'vitest';
import { spatialIndex } from '../src/game/spatial';
import { hitTime } from '../src/game/geometry';

it('matches exact brute-force circle/swept queries over cell boundaries and negative coordinates', () => {
  const entries = Array.from({ length: 1000 }, (_, id) => ({ id, x: (id * 73 % 460) - 50, y: (id * 137 % 580) - 50 }));
  const index = spatialIndex(entries);
  for (let i = 0; i < 80; i++) {
    const from = { x: i * 31 % 400 - 20, y: i * 53 % 500 - 20 }, to = { x: 400 - from.x, y: 500 - from.y };
    const radius = i % 70;
    const expectedCircle = entries.filter((entry) => Math.hypot(entry.x - from.x, entry.y - from.y) <= radius).map((entry) => entry.id).sort();
    expect(index.circle(from, radius).map((entry) => entry.id).sort()).toEqual(expectedCircle);
    const expectedHits = entries.filter((entry) => hitTime(from, to, entry, 10) !== null).map((entry) => entry.id).sort();
    const actualHits = index.segment(from, to, 10).filter((entry) => hitTime(from, to, entry, 10) !== null).map((entry) => entry.id).sort();
    expect(actualHits).toEqual(expectedHits);
    expect(new Set(index.segment(from, to, 10)).size).toBe(index.segment(from, to, 10).length);
  }
});

it('includes exact circle edges, supports empty worlds, and rebuilds after movement', () => {
  expect(spatialIndex([]).circle({ x: 0, y: 0 }, 100)).toEqual([]);
  const entry = { x: 48, y: 0 };
  expect(spatialIndex([entry]).circle({ x: 0, y: 0 }, 48)).toEqual([entry]);
  entry.x = 100;
  expect(spatialIndex([entry]).circle({ x: 0, y: 0 }, 48)).toEqual([]);
});
