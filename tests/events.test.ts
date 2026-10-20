import { describe, expect, it } from 'vitest';
import { beginEffectTick, createEffectQueue, drainEffects, EFFECT_LIMITS, emitEffect } from '../src/game/events';
import type { EffectHandler } from '../src/game/events';

describe('bounded effect processing', () => {
  it('cuts a cross-handler cycle and rejects recursive draining without resetting the budget', () => {
    const queue = createEffectQueue();
    const counts = { a: 0, b: 0 };
    const handlers: EffectHandler<typeof counts>[] = [
      { id: 'a', on: 'hurt', apply(context) {
        context.a++;
        emitEffect(queue, { type: 'healed', amount: 1, position: { x: 0, y: 0 } });
        drainEffects(queue, context, handlers);
      } },
      { id: 'b', on: 'healed', apply(context) {
        context.b++;
        emitEffect(queue, { type: 'hurt', amount: 1, position: { x: 0, y: 0 } });
      } },
    ];
    emitEffect(queue, { type: 'hurt', amount: 1, position: { x: 0, y: 0 } });
    drainEffects(queue, counts, handlers);
    expect(counts).toEqual({ a: 1, b: 1 });
    expect(queue.suppressed).toBe(1);
    expect(queue.processedThisTick).toBe(3);
    expect(queue.pending).toEqual([]);
    expect(queue.current).toBeNull();
  });

  it('caps unique-handler depth even without a repeated handler', () => {
    const queue = createEffectQueue();
    const handlers: EffectHandler<null>[] = Array.from({ length: 20 }, (_, index) => ({
      id: `handler-${index}`, on: 'hurt', apply(_, event) {
        if (event.amount === index) emitEffect(queue, { type: 'hurt', amount: index + 1, position: { x: 0, y: 0 } });
      },
    }));
    emitEffect(queue, { type: 'hurt', amount: 0, position: { x: 0, y: 0 } });
    drainEffects(queue, null, handlers);
    expect(queue.processedThisTick).toBe(EFFECT_LIMITS.depth + 1);
    expect(queue.dropped).toBe(1);
  });

  it('bounds fan-out and combined drains, then allows work again on the next tick', () => {
    const queue = createEffectQueue();
    const context = { calls: 0 };
    const handlers: EffectHandler<typeof context>[] = [{ id: 'fan', on: 'hurt', apply(ctx) {
      ctx.calls++;
      for (let index = 0; index < 1000; index++) emitEffect(queue, { type: 'hurt', amount: 1, position: { x: 0, y: 0 } });
    } }];
    emitEffect(queue, { type: 'hurt', amount: 1, position: { x: 0, y: 0 } });
    drainEffects(queue, context, handlers);
    expect(queue.processedThisTick).toBe(EFFECT_LIMITS.perTick);
    expect(queue.dropped).toBeGreaterThan(0);
    expect(context.calls).toBe(1);
    emitEffect(queue, { type: 'hurt', amount: 1, position: { x: 0, y: 0 } });
    drainEffects(queue, context, handlers);
    expect(context.calls).toBe(1);
    beginEffectTick(queue);
    emitEffect(queue, { type: 'hurt', amount: 1, position: { x: 0, y: 0 } });
    drainEffects(queue, context, handlers);
    expect(context.calls).toBe(2);
    expect(queue.pending).toEqual([]);
  });

  it('restores drain state when a faulty handler throws so the error stays debuggable', () => {
    const queue = createEffectQueue();
    emitEffect(queue, { type: 'hurt', amount: 1, position: { x: 0, y: 0 } });
    expect(() => drainEffects(queue, null, [{ id: 'broken', on: 'hurt', apply() { throw new Error('effect failure'); } }])).toThrow('effect failure');
    expect(queue.current).toBeNull();
    expect(queue.draining).toBe(false);
  });
});
