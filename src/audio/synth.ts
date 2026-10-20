import { AUDIO_LIMITS, CUE_INTERVAL, SOUNDS } from './sound-design';
import type { SoundCue } from './sound-design';
export type SoundStatus = 'locked' | 'ready' | 'blocked' | 'unavailable';
interface Voice { oscillator: OscillatorNode; gain: GainNode }

/** Lazy Web Audio boundary. Only explicit user gestures may create/resume the context. */
export function createSynth(factory: () => AudioContext | null = () => typeof AudioContext === 'undefined' ? null : new AudioContext()) {
  let context: AudioContext | null = null, master: GainNode | null = null;
  let muted = false, volume = 0.3, destroyed = false, status: SoundStatus = 'locked';
  let listener = () => {}, lastCue = -Infinity;
  const played = new Map<SoundCue, number>(), voices = new Set<Voice>();
  const setStatus = (next: SoundStatus) => { status = next; listener(); };
  function stop(): void {
    for (const voice of voices) {
      try { voice.oscillator.stop(); } catch { /* An ended voice may already be removed by the browser. */ }
      voice.oscillator.disconnect(); voice.gain.disconnect();
    }
    voices.clear();
  }
  return {
    status: () => status,
    onStatusChange(callback: () => void): void { listener = callback; },
    configure(next: { muted: boolean; volume: number }): void {
      muted = next.muted; volume = Number.isFinite(next.volume) ? Math.max(0, Math.min(1, next.volume)) : 0;
      if (master && context) master.gain.setTargetAtTime(muted ? 0 : volume, context.currentTime, 0.015);
      if (muted || volume === 0) stop();
    },
    async unlock(): Promise<boolean> {
      if (destroyed || muted || volume === 0) return false;
      try {
        if (!context) {
          context = factory();
          if (!context) { setStatus('unavailable'); return false; }
          master = context.createGain(); master.gain.value = volume; master.connect(context.destination);
          context.onstatechange = () => {
            if (destroyed) return;
            if (context?.state !== 'running') stop();
            setStatus(context?.state === 'running' ? 'ready' : 'blocked');
          };
        }
        await context.resume();
        if (destroyed) return false;
        setStatus(context.state === 'running' ? 'ready' : 'blocked');
        return context.state === 'running';
      } catch (error) { setStatus(error instanceof Error && error.name === 'NotAllowedError' ? 'blocked' : 'unavailable'); return false; }
    },
    play(cue: SoundCue, interrupt = false): boolean {
      if (destroyed || muted || volume === 0 || !context || !master || context.state !== 'running') return false;
      if (interrupt) stop();
      const now = context.currentTime, tones = SOUNDS[cue];
      if ((!interrupt && (now - lastCue < AUDIO_LIMITS.globalInterval || now - (played.get(cue) ?? -Infinity) < CUE_INTERVAL[cue])) || voices.size + tones.length > AUDIO_LIMITS.voices) return false;
      lastCue = now; played.set(cue, now);
      try {
        for (const tone of tones) {
          const oscillator = context.createOscillator(), gain = context.createGain(), at = now + tone.offset;
          oscillator.type = tone.wave; oscillator.frequency.setValueAtTime(tone.frequency, at);
          oscillator.frequency.exponentialRampToValueAtTime(tone.endFrequency ?? tone.frequency, at + tone.duration);
          gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(tone.gain, at + 0.008);
          gain.gain.exponentialRampToValueAtTime(0.0001, at + tone.duration);
          oscillator.connect(gain); gain.connect(master);
          const voice = { oscillator, gain }; voices.add(voice);
          oscillator.onended = () => { voices.delete(voice); oscillator.disconnect(); gain.disconnect(); };
          oscillator.start(at); oscillator.stop(at + tone.duration + 0.015);
        }
      } catch { stop(); setStatus('unavailable'); return false; }
      return true;
    },
    stop,
    destroy(): void { destroyed = true; stop(); if (context) { context.onstatechange = null; void context.close().catch(() => {}); } },
  };
}
