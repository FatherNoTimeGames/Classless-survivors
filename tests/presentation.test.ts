import { describe, expect, it } from 'vitest';
import { decodePresentation, defaultPresentation, reducedMotion } from '../src/presentation/preferences';
import { SAVE_KEY } from '../src/persistence/profile-store';
import { createPresentationStore, PRESENTATION_KEY } from '../src/persistence/presentation-store';
import { feedbackGlyphs, pickupGlyphs } from '../src/presentation/readability';
import { addSpark } from '../src/game/effects';
import { RULES } from '../src/game/rules';
import { createRun } from '../src/game/state';
import type { Spark } from '../src/game/state';
import { drawFeedback } from '../src/rendering/feedback';
import { drawPlayer } from '../src/rendering/player';
import { TALENTS } from '../src/content/talents';
import { TALENT_ICONS } from '../src/content/talent-icons';
import { UPGRADES } from '../src/content/upgrades';
import { UPGRADE_ICONS } from '../src/content/upgrade-icons';

function recorder() {
  const geometry: unknown[][] = [];
  const context = new Proxy({}, { set(target, property, value) { Reflect.set(target, property, value); return true; }, get(target, property) {
    if (Reflect.has(target, property)) return Reflect.get(target, property);
    return (...args: unknown[]) => { if (['moveTo', 'lineTo', 'arc', 'rect', 'fillRect', 'strokeRect', 'ellipse'].includes(String(property))) geometry.push([property, ...args]); };
  } }) as CanvasRenderingContext2D;
  return { context, geometry };
}

describe('separate presentation preferences', () => {
  it('defaults to restrained volume and follows the device motion preference without creating audio', () => {
    expect(decodePresentation(null).value).toEqual({ version: 1, muted: false, volume: 0.3, motion: 'system' });
    expect(reducedMotion('system', true)).toBe(true); expect(reducedMotion('system', false)).toBe(false);
    expect(reducedMotion('full', true)).toBe(false); expect(reducedMotion('reduced', false)).toBe(true);
  });
  it.each([NaN, Infinity, -1, 1.1, '0.5', null])('rejects invalid saved volume %s', (volume) => {
    const decoded = decodePresentation(JSON.stringify({ ...defaultPresentation(), volume }));
    expect(decoded.value).toEqual(defaultPresentation()); expect(decoded.notice).not.toBe('');
  });
  it.each([['system'], {}, 'other', null])('rejects invalid motion %s', (motion) => {
    expect(decodePresentation(JSON.stringify({ ...defaultPresentation(), motion })).notice).not.toBe('');
  });
  it('preserves newer formats and never writes presentation settings over progress', () => {
    const values = new Map([[PRESENTATION_KEY, '{"version":9}'], [SAVE_KEY, 'unchanged']]);
    const store = createPresentationStore({ getItem: (key) => values.get(key) ?? null, setItem: (key, value) => { values.set(key, value); } });
    store.update({ version: 1, muted: true, volume: 0.5, motion: 'reduced' });
    expect(store.get().muted).toBe(true); expect(store.notice()).toContain('Newer');
    expect(values.get(PRESENTATION_KEY)).toBe('{"version":9}'); expect(values.get(SAVE_KEY)).toBe('unchanged');
  });
  it('round-trips settings and keeps current-tab changes usable when storage throws', () => {
    const values = new Map<string, string>(); const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
    const store = createPresentationStore(storage); store.update({ version: 1, muted: true, volume: 0.45, motion: 'full' });
    expect(createPresentationStore(storage).get()).toEqual(store.get());
    const broken = createPresentationStore({ getItem() { throw Error(); }, setItem() { throw Error(); } });
    broken.update({ version: 1, muted: true, volume: 0.25, motion: 'reduced' }); expect(broken.get().volume).toBe(0.25); expect(broken.notice()).toContain('this tab');
    const absent = createPresentationStore(null); absent.update({ ...defaultPresentation(), muted: true }); expect(absent.get().muted).toBe(true);
  });
});

describe('read-only visual budgets and motion', () => {
  it('merges nearby XP glyphs without losing values or changing collectible positions', () => {
    const shards = [{ id: 1, x: 1, y: 2, value: 5 }, { id: 2, x: 3, y: 4, value: 10 }, { id: 3, x: 30, y: 30, value: 20 }];
    const snapshot = structuredClone(shards); const glyphs = pickupGlyphs(shards);
    expect(glyphs).toHaveLength(2); expect(glyphs[0]).toMatchObject({ x: 2, y: 3, value: 15, count: 2 });
    expect(glyphs.reduce((sum, glyph) => sum + glyph.value, 0)).toBe(35); expect(shards).toEqual(snapshot);
  });
  it('bounds and merges repeated feedback while retaining player-critical cues', () => {
    const sparks: Spark[] = Array.from({ length: 60 }, (_, index) => ({ x: index * 5, y: 100, life: 0.3, kind: 'hit' }));
    sparks.push({ x: 180, y: 240, life: 0.1, kind: 'hurt' }, { x: 180, y: 240, life: 0.1, kind: 'shield' }, { x: 180, y: 240, life: 0.1, kind: 'critical' });
    const snapshot = structuredClone(sparks), glyphs = feedbackGlyphs(sparks);
    expect(glyphs.length).toBeLessThanOrEqual(28); expect(glyphs.filter((glyph) => ['hurt', 'shield', 'critical'].includes(glyph.kind))).toHaveLength(3);
    expect(new Set(glyphs.map((glyph) => `${glyph.kind}:${Math.floor(glyph.x / 16)},${Math.floor(glyph.y / 16)}`)).size).toBe(glyphs.length);
    expect(sparks).toEqual(snapshot);
  });
  it('retains critical player cues even when ordinary impacts already filled the cosmetic buffer', () => {
    const run = createRun(42);
    for (let index = 0; index < RULES.maxSparks; index++) addSpark(run, { x: index * 5, y: 100 }, 'hit');
    for (const kind of ['hurt', 'shield', 'critical'] as const) addSpark(run, run.player, kind);
    expect(run.sparks).toHaveLength(RULES.maxSparks);
    expect(feedbackGlyphs(run.sparks).filter((spark) => ['hurt', 'shield', 'critical'].includes(spark.kind))).toHaveLength(3);
    expect(run.player.health).toBe(60); expect(run.effects.pending).toEqual([]);
  });
  it('keeps reduced spell geometry static while preserving full-motion geometry and gameplay state', () => {
    const effect: Spark = { x: 100, y: 100, kind: 'arcane', radius: 40, life: 0.3 };
    const paths: unknown[][][] = [];
    for (const reduced of [false, true]) for (const life of [0.3, 0.1]) { const trace = recorder(); drawFeedback(trace.context, [{ ...effect, life }], reduced); paths.push(trace.geometry); }
    expect(paths[0]).not.toEqual(paths[1]); expect(paths[2]).toEqual(paths[3]); expect(effect.life).toBe(0.3);
  });
  it('removes decorative player bob while leaving the actual position untouched', () => {
    const run = createRun(42); run.player.moving = true;
    const before = structuredClone(run), geometries: unknown[][][] = [];
    for (const reduced of [false, true]) for (const elapsed of [0, 0.1]) { run.elapsed = elapsed; const trace = recorder(); drawPlayer(trace.context, run, reduced); geometries.push(trace.geometry); }
    expect(geometries[0]).not.toEqual(geometries[1]); expect(geometries[2]).toEqual(geometries[3]);
    expect(run.player).toEqual(before.player);
  });
  it('distinguishes Frost snowflakes, arcane diamonds, roots and wards by geometry, not only color', () => {
    const paths = ['frost', 'arcane', 'root', 'shield'].map((kind) => { const trace = recorder(); drawFeedback(trace.context, [{ x: 100, y: 100, life: 0.2, kind: kind as Spark['kind'] }], true); return JSON.stringify(trace.geometry); });
    expect(new Set(paths).size).toBe(4);
  });
  it('provides an original glyph for every talent and every upgrade choice', () => {
    for (const talent of TALENTS) expect(TALENT_ICONS[talent.id]).toMatch(/^M/);
    for (const upgrade of UPGRADES) expect(TALENT_ICONS[UPGRADE_ICONS[upgrade.id]]).toMatch(/^M/);
  });
});
