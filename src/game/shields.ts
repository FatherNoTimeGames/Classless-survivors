import type { Run } from './state';
import { emitEffect } from './events';
import { addSpark } from './effects';

/** Shields replace weaker protection, never add. Refreshing cannot weaken a ward. */
export function grantShield(run: Run, amount: number, duration: number): void {
  if ((run.status === 'defeated' || run.status === 'victory') || !Number.isFinite(amount) || amount <= 0 || !Number.isFinite(duration) || duration <= 0) return;
  run.player.shield.amount = Math.max(run.player.shield.amount, amount);
  run.player.shield.remaining = Math.max(run.player.shield.remaining, duration);
  addSpark(run, run.player, 'shield');
}

/** Overhealing is the explicit bounded exception to nonstacking ward grants. */
export function addShield(run: Run, amount: number, cap: number, duration: number): void {
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(cap) || cap <= 0) return;
  grantShield(run, Math.min(cap, run.player.shield.amount + amount), duration);
}

/** Only absorption can break a shield. Expiration/replacement never emit a break. */
export function absorbDamage(run: Run, amount: number): number {
  const shield = run.player.shield;
  const absorbed = Math.min(shield.amount, amount);
  if (absorbed <= 0) return amount;
  shield.amount -= absorbed;
  const position = { x: run.player.x, y: run.player.y };
  emitEffect(run.effects, { type: 'absorbed', amount: absorbed, position });
  if (shield.amount === 0) {
    shield.remaining = 0;
    emitEffect(run.effects, { type: 'shield-broken', amount: absorbed, position });
  }
  return amount - absorbed;
}
