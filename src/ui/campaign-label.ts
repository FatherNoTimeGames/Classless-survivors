import { BOSSES, CAMPAIGN } from '../content/bosses';
import type { Run } from '../game/state';
import { formatTime } from './dom';

/** Display remaining time, including a queued guardian whose predecessor is still alive. */
export function guardianMessage(run: Run): string {
  const next = BOSSES[run.campaign.nextBoss];
  if (next) {
    if (next.at > run.elapsed) return `Next guardian in ${formatTime(Math.ceil(next.at - run.elapsed))}`;
    return run.campaign.active ? 'Next guardian after this fight' : 'Guardian arriving';
  }
  return run.campaign.active ? 'Final guardian' : `Dawn in ${formatTime(Math.ceil(Math.max(0, CAMPAIGN.duration - run.elapsed)))}`;
}
