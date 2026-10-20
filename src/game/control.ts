import { CAMPAIGN } from '../content/bosses';
import type { Enemy } from './state';

/** Boss Resolve bounds repeated hard control. Slows and Frost-consumption damage remain effective. */
export function applyControl(enemy: Enemy, kind: 'stun' | 'root', duration: number): boolean {
  if (enemy.boss && enemy.controlGuard > 0) return false;
  enemy[kind] = Math.max(enemy[kind], duration);
  if (enemy.boss) enemy.controlGuard = CAMPAIGN.resolve;
  return true;
}
