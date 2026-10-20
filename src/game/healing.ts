import type { Run } from './state';
import { getRunStats } from './stats';
import { emitEffect } from './events';
import { addSpark } from './effects';

/** Only restored health emits a healing event; overheal cannot fuel offense. */
export function healPlayer(run: Run, amount: number): number {
  if (run.status === 'defeated' || !Number.isFinite(amount) || amount <= 0) return 0;
  const actual = Math.min(amount, Math.max(0, getRunStats(run.progression.ranks).maxHealth - run.player.health));
  if (actual <= 0) return 0;
  run.player.health += actual;
  addSpark(run, run.player, 'heal');
  emitEffect(run.effects, { type: 'healed', amount: actual, position: { x: run.player.x, y: run.player.y } });
  return actual;
}
