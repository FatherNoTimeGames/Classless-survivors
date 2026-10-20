import { RULES, STEP } from './rules';
import type { Point, Run, Spark } from './state';

export function addSpark(run: Run, point: Point, kind: Spark['kind']): void {
  if (run.sparks.length < RULES.maxSparks) run.sparks.push({ x: point.x, y: point.y, kind, life: RULES.sparkLifetime });
}

export function updateSparks(run: Run): void {
  for (const effect of run.sparks) effect.life -= STEP;
  run.sparks = run.sparks.filter((effect) => effect.life > 0);
}
