import { describe, expect, it } from 'vitest';
import { createSynth } from '../src/audio/synth';
import { SOUNDS, AUDIO_LIMITS } from '../src/audio/sound-design';
import { audioSnapshot, collectSoundCues, createSoundDirector } from '../src/audio/director';
import { createRun } from '../src/game/state';

class Parameter {
  value = 0;
  setValueAtTime(value: number) { this.value = value; }
  setTargetAtTime(value: number) { this.value = value; }
  exponentialRampToValueAtTime(value: number) { this.value = value; }
  linearRampToValueAtTime(value: number) { this.value = value; }
}
class Node { connections = 0; connect() { this.connections++; } disconnect() { this.connections = 0; } }
class Gain extends Node { gain = new Parameter(); }
class Oscillator extends Node {
  frequency = new Parameter(); type = 'sine'; started = false; canceled = false;
  onended: (() => void) | null = null;
  start() { this.started = true; }
  stop(at?: number) { if (at === undefined) { this.canceled = true; this.onended?.(); } }
}
class Context {
  currentTime = 0; state = 'suspended'; destination = new Node();
  onstatechange: (() => void) | null = null; oscillators: Oscillator[] = []; gains: Gain[] = [];
  rejectResume = false; permissionDenied = false; blocked = false; brokenOscillator = false; closed = false;
  createGain() { const gain = new Gain(); this.gains.push(gain); return gain; }
  createOscillator() { if (this.brokenOscillator) throw Error(); const oscillator = new Oscillator(); this.oscillators.push(oscillator); return oscillator; }
  async resume() { if (this.permissionDenied) throw new DOMException('Gesture required', 'NotAllowedError'); if (this.rejectResume) throw Error(); if (!this.blocked) this.state = 'running'; this.onstatechange?.(); }
  async close() { this.closed = true; this.state = 'closed'; }
}
const asContext = (context: Context) => context as unknown as AudioContext;

describe('gesture-gated bounded audio', () => {
  it('creates no audio until explicit activation, reuses the context and configures master volume', async () => {
    const context = new Context(); let created = 0;
    const synth = createSynth(() => { created++; return asContext(context); });
    synth.configure({ muted: false, volume: 0.2 }); expect(synth.play('hit')).toBe(false); expect(created).toBe(0);
    expect(await synth.unlock()).toBe(true); expect(await synth.unlock()).toBe(true); expect(created).toBe(1); expect(synth.status()).toBe('ready');
    expect(context.gains[0]!.gain.value).toBe(0.2); expect(context.gains[0]!.connections).toBe(1);
    expect(synth.play('hit')).toBe(true); expect(context.oscillators[0]!.started).toBe(true); expect(context.oscillators[0]!.connections).toBe(1);
    synth.destroy(); expect(context.closed).toBe(true); expect(synth.play('hit')).toBe(false); expect(await synth.unlock()).toBe(false);
  });
  it('mute and zero volume cancel voices and never activate a new context', async () => {
    const context = new Context(); let created = 0; const synth = createSynth(() => { created++; return asContext(context); });
    synth.configure({ muted: true, volume: 0.5 }); expect(await synth.unlock()).toBe(false); expect(created).toBe(0);
    synth.configure({ muted: false, volume: 0 }); expect(await synth.unlock()).toBe(false); expect(created).toBe(0);
    synth.configure({ muted: false, volume: 0.4 }); await synth.unlock(); synth.play('level');
    synth.configure({ muted: true, volume: 0.4 }); expect(context.oscillators.every((voice) => voice.canceled)).toBe(true); expect(context.gains[0]!.gain.value).toBe(0);
    expect(synth.play('hurt')).toBe(false); synth.configure({ muted: false, volume: 0.25 }); expect(context.gains[0]!.gain.value).toBe(0.25);
  });
  it('bounds repeated cues and simultaneous voices; lifecycle cues replace combat immediately', async () => {
    const context = new Context(), synth = createSynth(() => asContext(context)); await synth.unlock();
    expect(synth.play('level')).toBe(true); expect(synth.play('hit')).toBe(false);
    context.currentTime = 0.1; expect(synth.play('critical')).toBe(true);
    context.currentTime = 0.2; expect(synth.play('hurt')).toBe(true);
    context.currentTime = 0.3; expect(synth.play('victory')).toBe(false); // 6 existing voices + 3 > 8.
    expect(context.oscillators.length).toBeLessThanOrEqual(AUDIO_LIMITS.voices);
    expect(synth.play('victory', true)).toBe(true); expect(context.oscillators.filter((voice) => !voice.canceled)).toHaveLength(3);
    synth.stop(); expect(context.oscillators.every((voice) => voice.canceled)).toBe(true);
  });
  it('releases ended voices and applies per-cue limits even after silence', async () => {
    const context = new Context(), synth = createSynth(() => asContext(context)); await synth.unlock();
    synth.play('hit'); context.oscillators[0]!.onended?.(); context.currentTime = 0.1;
    expect(synth.play('hit')).toBe(false); context.currentTime = 0.2; expect(synth.play('hit')).toBe(true);
  });
  it('degrades safely when audio is unsupported, blocked, rejected or loses oscillator allocation', async () => {
    const absent = createSynth(() => null); expect(await absent.unlock()).toBe(false); expect(absent.status()).toBe('unavailable');
    const context = new Context(); context.blocked = true; const synth = createSynth(() => asContext(context));
    expect(await synth.unlock()).toBe(false); expect(synth.status()).toBe('blocked'); expect(synth.play('hit')).toBe(false);
    context.blocked = false; expect(await synth.unlock()).toBe(true);
    context.brokenOscillator = true; expect(synth.play('hit')).toBe(false); expect(synth.status()).toBe('unavailable');
    const rejected = new Context(); rejected.rejectResume = true; const failure = createSynth(() => asContext(rejected));
    expect(await failure.unlock()).toBe(false); expect(failure.status()).toBe('unavailable');
  });
  it('allows a fresh gesture to retry an autoplay denial without creating another context', async () => {
    const context = new Context(); context.permissionDenied = true; let created = 0;
    const synth = createSynth(() => { created++; return asContext(context); });
    expect(await synth.unlock()).toBe(false); expect(synth.status()).toBe('blocked');
    context.permissionDenied = false; expect(await synth.unlock()).toBe(true); expect(created).toBe(1);
  });
  it('clears scheduled notes when the browser suspends audio, so retry cannot replay them', async () => {
    const context = new Context(), synth = createSynth(() => asContext(context)); await synth.unlock();
    synth.play('level'); context.state = 'suspended'; context.onstatechange?.();
    expect(context.oscillators.every((voice) => voice.canceled)).toBe(true); expect(synth.status()).toBe('blocked');
    context.currentTime = 1; expect(await synth.unlock()).toBe(true); expect(synth.play('hit')).toBe(true);
    expect(context.oscillators.filter((voice) => !voice.canceled)).toHaveLength(1);
  });
  it('keeps original synthesized tones short and within restrained gains/frequencies', () => {
    for (const tones of Object.values(SOUNDS)) for (const tone of tones) {
      expect(tone.gain).toBeGreaterThan(0); expect(tone.gain).toBeLessThanOrEqual(0.2);
      expect(tone.duration).toBeLessThanOrEqual(0.5); expect(tone.frequency).toBeGreaterThan(40); expect(tone.frequency).toBeLessThan(1000);
      expect(tone.offset).toBeLessThan(0.4);
    }
  });
});

describe('read-only sound direction', () => {
  it('prioritizes new player/boss cues and never replays old sparks or mutates simulation', () => {
    const run = createRun(42), previous = audioSnapshot(run);
    run.sparks.push({ x: 180, y: 240, kind: 'hurt', life: 0.3 }, { x: 180, y: 240, kind: 'heal', life: 0.3 }); run.xp = 5;
    const snapshot = structuredClone(run); expect(collectSoundCues(previous, run)).toEqual(['hurt', 'heal', 'pickup']);
    expect(run).toEqual(snapshot); expect(collectSoundCues(audioSnapshot(run), run)).toEqual([]);
  });
  it('observes arrivals, warning starts and guardian kills without draining combat events', () => {
    const run = createRun(42), previous = audioSnapshot(run);
    run.campaign.active = { id: 'knight', enemyId: 100, pattern: 0, attackIn: 0.2, addIn: 1 };
    run.campaign.dangers.push({ id: 101, ownerId: 100, phase: 'warning', remaining: 1, activeFor: 0.2, damage: 10, shape: { kind: 'circle', origin: { x: 1, y: 1 }, radius: 24 } });
    expect(collectSoundCues(previous, run)).toEqual(['boss', 'warning']);
    const during = audioSnapshot(run); run.campaign.active = null; run.campaign.defeated.push('knight'); expect(collectSoundCues(during, run)).toContain('guardian');
    expect(run.effects.pending).toEqual([]);
  });
  it('synchronizes resume/replay so paused or prior-run events never become a backlog', () => {
    const run = createRun(42), cues: string[] = [], director = createSoundDirector((cue) => { cues.push(cue); return true; });
    director.synchronize(run); run.sparks.push({ x: 1, y: 1, kind: 'hurt', life: 0.3 }); director.observe(run); director.observe(run); expect(cues).toEqual(['hurt']);
    const fresh = createRun(42); director.synchronize(fresh); director.observe(fresh); expect(cues).toEqual(['hurt']);
    fresh.sparks.push({ x: 1, y: 1, kind: 'heal', life: 0.3 }); director.synchronize(fresh); director.observe(fresh); expect(cues).toEqual(['hurt']);
  });
});
