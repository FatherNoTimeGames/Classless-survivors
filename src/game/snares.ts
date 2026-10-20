import type { Point, Run } from './state';
import { TALENT_TUNING as T } from '../content/talent-tuning';
import { STEP } from './rules';
import { distance } from './geometry';

export function placeSnare(run: Run, position: Point): void {
  if (run.snares.length >= T.maxSnares) run.snares.shift();
  run.snares.push({ id: run.nextId++, x: position.x, y: position.y, remaining: T.snareDuration, radius: T.snareRange });
}

export function updateSnares(run: Run): void {
  for (const snare of run.snares) snare.remaining -= STEP;
  run.snares = run.snares.filter((snare) => snare.remaining > 0);
  for (const enemy of run.enemies) enemy.snared = run.snares.some((snare) => distance(enemy, snare) <= snare.radius);
}
