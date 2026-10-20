import type { PresentationStore } from '../persistence/presentation-store';
import type { MotionPreference } from '../presentation/preferences';
import { reducedMotion } from '../presentation/preferences';
import type { SoundStatus } from '../audio/synth';
import { element } from './dom';

export function createPresentationSettings(store: PresentationStore, callbacks: { onOpen: () => void; onChange: () => void; onSoundGesture: () => void }) {
  const root = element<HTMLDetailsElement>('#presentation-settings');
  const mute = element<HTMLInputElement>('#sound-muted'), volume = element<HTMLInputElement>('#sound-volume');
  const motion = element<HTMLSelectElement>('#motion-preference');
  const enable = element<HTMLButtonElement>('#enable-sound');
  const media = window.matchMedia('(prefers-reduced-motion: reduce)'), events = new AbortController();
  let audioStatus: SoundStatus = 'locked';
  const isReduced = () => reducedMotion(store.get().motion, media.matches);
  function render(): void {
    const preferences = store.get();
    mute.checked = preferences.muted; volume.value = String(Math.round(preferences.volume * 100)); motion.value = preferences.motion;
    element('#sound-volume-value').textContent = `${volume.value}%`;
    document.body.dataset.reducedMotion = String(isReduced());
    element('#presentation-summary').textContent = `Sound & display · ${preferences.muted || preferences.volume === 0 ? 'sound off' : 'sound on'}`;
    element('#presentation-save-notice').textContent = store.notice();
    element('#sound-status').textContent = preferences.muted ? 'Sound is muted.' : preferences.volume === 0 ? 'Volume is zero.'
      : audioStatus === 'ready' ? 'Sound ready. M toggles mute while the arena has focus.'
        : audioStatus === 'unavailable' ? 'Audio is unavailable in this browser. Gameplay is ready.'
          : audioStatus === 'blocked' ? 'Sound paused by the browser. Tap Enable sound to retry.' : 'Sound starts after Enter the clearing or Enable sound.';
    enable.disabled = preferences.muted || preferences.volume === 0 || audioStatus === 'unavailable';
    element('#motion-status').textContent = isReduced() ? 'Reduced motion: static decorative effects. Movement and danger warnings remain.' : 'Full motion: small sprite bobs and expanding spell feedback.';
  }
  function update(): void {
    store.update({ ...store.get(), muted: mute.checked, volume: Number(volume.value) / 100, motion: motion.value as MotionPreference });
    render(); callbacks.onChange();
  }
  root.addEventListener('toggle', () => { if (root.open) callbacks.onOpen(); }, { signal: events.signal });
  mute.addEventListener('change', () => { update(); if (!mute.checked) callbacks.onSoundGesture(); }, { signal: events.signal });
  volume.addEventListener('input', () => { update(); if (!mute.checked) callbacks.onSoundGesture(); }, { signal: events.signal });
  motion.addEventListener('change', update, { signal: events.signal });
  enable.addEventListener('click', callbacks.onSoundGesture, { signal: events.signal });
  media.addEventListener('change', () => { render(); callbacks.onChange(); }, { signal: events.signal });
  render();
  return {
    reduced: isReduced,
    audioStatus(status: SoundStatus): void { audioStatus = status; render(); },
    toggleMute(): void { store.update({ ...store.get(), muted: !store.get().muted }); render(); callbacks.onChange(); if (!store.get().muted) callbacks.onSoundGesture(); },
    destroy(): void { events.abort(); },
  };
}
