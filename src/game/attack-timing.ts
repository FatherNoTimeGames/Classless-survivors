import type { Run } from './state';
import { RULES } from './rules';
import { getRunStats } from './stats';

/** Haste applies the same proportional interval reduction to every automatic attacker. */
export function attackInterval(run: Run, base: number): number {
  return base * getRunStats(run.progression.ranks).attackInterval / RULES.attackInterval;
}

export function refundAttacks(run: Run, seconds: number): void {
  run.player.attackIn = Math.max(0, run.player.attackIn - seconds);
  run.player.meleeIn = Math.max(0, run.player.meleeIn - seconds);
  for (const companion of run.companions) companion.attackIn = Math.max(0, companion.attackIn - seconds);
}

/** Preserve cooldown progress when choosing haste; unrelated upgrades leave timers alone. */
export function rescaleAttackTimers(run: Run, ratio: number): void {
  run.player.attackIn *= ratio;
  run.player.meleeIn *= ratio;
  for (const companion of run.companions) companion.attackIn *= ratio;
}
