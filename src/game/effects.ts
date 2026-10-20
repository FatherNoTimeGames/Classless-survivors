import { feedbackPriority } from '../content/feedback';
import { RULES, STEP } from './rules';
import type { Point, Run, Spark } from './state';

export function addSpark(run: Run, point: Point, kind: Spark['kind'], radius?: number, angle?: number): void {
  const effect = { x: point.x, y: point.y, kind, life: RULES.sparkLifetime, radius, angle };
  if (run.sparks.length < RULES.maxSparks) { run.sparks.push(effect); return; }
  // Important player feedback must survive a buffer already filled by ordinary impacts.
  let weakest = 0;
  for (let index = 1; index < run.sparks.length; index++) {
    if (feedbackPriority(run.sparks[index]!.kind) < feedbackPriority(run.sparks[weakest]!.kind)) weakest = index;
  }
  if (feedbackPriority(kind) > feedbackPriority(run.sparks[weakest]!.kind)) run.sparks[weakest] = effect;
}

export function updateSparks(run: Run): void {
  for (const effect of run.sparks) effect.life -= STEP;
  run.sparks = run.sparks.filter((effect) => effect.life > 0);
}
