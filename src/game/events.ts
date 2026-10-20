import type { DamageOverTime } from './dot-state';

export type DamageSource = 'ember' | 'blast' | 'talent' | 'melee' | 'dot' | 'summon';
export type DamageSchool = 'physical' | 'fire' | 'arcane' | 'holy' | 'shadow' | 'frost' | 'lightning' | 'poison';
type Position = { x: number; y: number };
export type CombatEvent =
  | { type: 'hit' | 'kill'; targetId: number; amount: number; source: DamageSource; school: DamageSchool; position: Position; critical?: boolean; slowed?: boolean; dots?: readonly DamageOverTime[] }
  | { type: 'frost-consumed'; targetId: number; amount: number; position: Position }
  | { type: 'hurt' | 'healed' | 'shield-broken' | 'absorbed' | 'dot-expired' | 'momentum-spent'; amount: number; position: Position };
interface Context { depth: number; ancestry: string[] }
interface QueuedEffect extends Context { event: CombatEvent }
export interface EffectQueue {
  pending: QueuedEffect[];
  current: Context | null;
  draining: boolean;
  processedThisTick: number;
  dropped: number;
  suppressed: number;
}
export interface EffectHandler<C> { id: string; on: CombatEvent['type']; apply: (context: C, event: CombatEvent) => void }
export const EFFECT_LIMITS = { perTick: 256, pending: 256, depth: 6 } as const;

export function createEffectQueue(): EffectQueue {
  return { pending: [], current: null, draining: false, processedThisTick: 0, dropped: 0, suppressed: 0 };
}

export function beginEffectTick(queue: EffectQueue): void {
  if (!queue.draining) queue.processedThisTick = 0;
}

export function emitEffect(queue: EffectQueue, event: CombatEvent): void {
  const context = queue.current ?? { depth: 0, ancestry: [] };
  if (context.depth > EFFECT_LIMITS.depth || queue.pending.length >= EFFECT_LIMITS.pending) {
    queue.dropped++;
    return;
  }
  queue.pending.push({ event, depth: context.depth, ancestry: [...context.ancestry] });
}

/** FIFO secondary effects. Ancestor suppression prevents a talent retriggering itself. */
export function drainEffects<C>(queue: EffectQueue, context: C, handlers: readonly EffectHandler<C>[]): void {
  if (queue.draining) return;
  queue.draining = true;
  try {
    while (queue.pending.length && queue.processedThisTick < EFFECT_LIMITS.perTick) {
      const entry = queue.pending.shift()!;
      queue.processedThisTick++;
      for (const handler of handlers) {
        if (handler.on !== entry.event.type) continue;
        if (entry.ancestry.includes(handler.id)) { queue.suppressed++; continue; }
        queue.current = { depth: entry.depth + 1, ancestry: [...entry.ancestry, handler.id] };
        handler.apply(context, entry.event);
      }
      queue.current = null;
    }
    queue.dropped += queue.pending.length;
    queue.pending = [];
  } finally {
    queue.current = null;
    queue.draining = false;
  }
}
