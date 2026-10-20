import { BOSSES, CAMPAIGN } from '../content/bosses';
import type { Run } from './state';

export function completeRun(run: Run, outcome: 'victory' | 'defeated', reason: Run['finishReason']): void {
  if (run.status === 'victory' || run.status === 'defeated') return;
  run.status = outcome; run.finishReason = reason;
  run.progression.offers = []; run.progression.pendingLevels = 0;
  run.effects.pending = []; run.enemyBolts = []; run.blights = []; run.campaign.dangers = []; run.bolts = [];
  run.player.moving = false;
}
/** Called after friendly damage and boss resolution, before another hostile impact or XP choice. */
export function checkDawn(run: Run): boolean {
  if (run.elapsed + 1e-8 < CAMPAIGN.duration) return false;
  run.elapsed = CAMPAIGN.duration;
  const victory = run.player.health > 0 && run.campaign.defeated.length === BOSSES.length;
  completeRun(run, victory ? 'victory' : 'defeated', victory ? 'dawn' : 'timeout');
  return true;
}
