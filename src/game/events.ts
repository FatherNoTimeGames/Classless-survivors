import type { DamageOverTime } from './dot-state';

export type DamageSource = 'ember' | 'blast' | 'talent' | 'melee' | 'dot' | 'summon';
export type DamageSchool = 'physical' | 'fire' | 'arcane' | 'holy' | 'shadow' | 'frost' | 'lightning' | 'poison';
type Position = { x: number; y: number };
export type CombatEvent =
  | { type: 'hit' | 'kill'; targetId: number; amount: number; source: DamageSource; school: DamageSchool; position: Position; critical?: boolean; slowed?: boolean; dots?: readonly DamageOverTime[] }
  | { type: 'frost-consumed' | 'mark-consumed'; targetId: number; amount: number; position: Position }
  | { type: 'hurt' | 'healed' | 'shield-broken' | 'absorbed' | 'dot-expired' | 'momentum-spent' | 'overhealed' | 'pickup'; amount: number; position: Position };
export interface EffectContext { depth: number; ancestry: string[] }
interface QueuedEffect extends EffectContext { event: CombatEvent }
export interface EffectQueue {
  pending: QueuedEffect[];
  current: EffectContext | null;
  draining: boolean;
  processedThisTick: number;
  dropped: number;
  suppressed: number;
}
export interface EffectHandler<C> { id: string; on: CombatEvent['type']; apply: (context: C, event: CombatEvent) => void }
// Enough for simultaneous ticks on 80 foes with two DoTs plus their reactions.
// Ancestry and depth still stop cycles; the finite work/queue caps stop runaway fan-out.
export const EFFECT_LIMITS = { perTick: 512, pending: 512, depth: 6 } as const;

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

/** Snapshot plain data so delayed projectiles cannot restart an ancestor's proc chain. */
export function snapshotEffectContext(queue: EffectQueue): EffectContext | undefined {
  return queue.current ? { depth: queue.current.depth, ancestry: [...queue.current.ancestry] } : undefined;
}

export function withEffectContext(queue: EffectQueue, context: EffectContext | undefined, apply: () => void): void {
  const previous = queue.current;
  queue.current = context ?? null;
  try { apply(); } finally { queue.current = previous; }
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
