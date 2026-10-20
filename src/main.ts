import './styles.css';
import { createSynth } from './audio/synth';
import { createSoundDirector } from './audio/director';
import { openPresentationStore } from './persistence/presentation-store';
import { createPresentationSettings } from './ui/presentation-settings';
import { FixedClock } from './game/clock';
import { tickRun } from './game/run';
import { createRun } from './game/state';
import type { Run } from './game/state';
import { createControls } from './input/controls';
import { createArenaRenderer } from './rendering/arena';
import { chooseUpgrade } from './game/progression';
import { element } from './ui/dom';
import { showRunResults } from './ui/run-results';
import { createHud } from './ui/hud';
import { createUpgradePicker } from './ui/upgrade-picker';
import { createTalentEditor } from './ui/talent-editor';
import { openBrowserProfile } from './persistence/browser-profile';
import { beginProfileRun, finishProfileRun, talentBudget } from './profile/profile';

const canvas = element<HTMLCanvasElement>('#arena');
const preferences = openPresentationStore();
const sound = createSynth();
const director = createSoundDirector((cue) => sound.play(cue));
const presentation = createPresentationSettings(preferences, {
  onOpen: pause,
  onChange: () => { sound.configure(preferences.get()); renderer?.draw(run); },
  onSoundGesture: () => { void sound.unlock(); },
});
sound.configure(preferences.get());
sound.onStatusChange(() => presentation.audioStatus(sound.status()));
const renderer = createArenaRenderer(canvas, () => presentation.reduced());
const overlay = element('#run-overlay');
const title = element('#overlay-title');
const description = element('#overlay-description');
const startButton = element<HTMLButtonElement>('#start-run');
const pauseButton = element<HTMLButtonElement>('#pause-run');
const talentButton = element<HTMLButtonElement>('#edit-talents');
const hud = element('#run-hud');
const hudView = createHud();
const arenaFrame = element('.arena-frame');
const announcement = element('#announcement');
const results = element('#run-results');
const clock = new FixedClock();
const events = new AbortController();
let mode: 'ready' | 'running' | 'paused' | 'choosing' | 'finished' = 'ready';
let run: Run | null = null;
let frameId = 0;
let previousTime: number | null = null;

const controls = createControls(canvas, element('#joystick'), () => mode === 'running');
const profileStore = openBrowserProfile();
const talentEditor = createTalentEditor(talentButton, () => mode === 'ready' || mode === 'finished', profileStore);
let profileRunId: number | null = null;
const picker = createUpgradePicker(element('#upgrade-picker'), (id) => {
  if (!run || mode !== 'choosing' || !chooseUpgrade(run, id)) return;
  void sound.unlock();
  sound.play('select', true);
  updateHud();
  if (run.status === 'choosing') openUpgradeChoice();
  else {
    picker.hide();
    beginRun();
    if (document.hidden) pause();
  }
});

function updateHud(): void {
  if (run) hudView.update(run);
}

function stopFrames(): void {
  cancelAnimationFrame(frameId);
  previousTime = null;
  clock.reset();
  controls.clear();
}

function pause(): void {
  if (mode !== 'running') return;
  mode = 'paused';
  stopFrames();
  sound.stop();
  overlay.hidden = false;
  title.textContent = 'A moment of quiet';
  description.textContent = 'The clearing waits. Return when you are ready.';
  startButton.textContent = 'Resume run';
  pauseButton.hidden = true;
  announcement.textContent = 'Run paused.';
  startButton.focus({ preventScroll: true });
}

function finished(): void {
  if (!run) return;
  mode = 'finished';
  stopFrames();
  sound.play(run.status === 'victory' ? 'victory' : 'defeat', true);
  canvas.inert = true;
  arenaFrame.classList.remove('is-active');
  overlay.hidden = false;
  showRunResults(run);
  element('#return-to-build').hidden = false;
  if (run && profileRunId !== null) {
    profileStore.change((profile) => finishProfileRun(profile, profileRunId!, { outcome: run!.status === 'victory' ? 'victory' : 'defeat', seconds: run!.elapsed, kills: run!.kills, xp: run!.xp }));
    const result = profileStore.get().lastResult;
    const reward = element('#run-reward');
    reward.hidden = false;
    reward.textContent = result?.id === profileRunId ? `${result.insight} insight earned${result.points ? ' · +1 permanent talent point' : ''}. ${profileStore.status().notice}` : profileStore.status().notice;
    profileRunId = null;
    talentEditor.refresh();
  }
  pauseButton.hidden = true;
  announcement.textContent = run.status === 'victory' ? 'Victory. Dawn breaks. Plan another build or play again.' : 'Run ended. Plan another build or try again.';
  talentButton.hidden = false;
  startButton.focus({ preventScroll: true });
}

function openUpgradeChoice(): void {
  if (!run) return;
  mode = 'choosing';
  stopFrames();
  sound.play('level', true);
  overlay.hidden = true;
  pauseButton.hidden = true;
  canvas.inert = true;
  arenaFrame.classList.remove('is-active');
  announcement.textContent = 'Level up. Combat is paused until you choose your upgrades.';
  picker.show(run);
}

function frame(timestamp: number): void {
  if (mode !== 'running' || !run) return;
  if (previousTime !== null) clock.advance((timestamp - previousTime) / 1000, () => tickRun(run!, controls.read()));
  previousTime = timestamp;
  renderer?.draw(run);
  director.observe(run);
  updateHud();
  if (run.status === 'defeated' || run.status === 'victory') finished();
  else if (run.status === 'choosing') openUpgradeChoice();
  else frameId = requestAnimationFrame(frame);
}

function beginRun(): void {
  stopFrames();
  mode = 'running';
  overlay.hidden = true;
  results.hidden = true;
  element('#result-build').hidden = true;
  element('#return-to-build').hidden = true;
  element('#run-reward').hidden = true;
  hud.hidden = false;
  pauseButton.hidden = false;
  talentButton.hidden = true;
  document.body.classList.add('playing');
  arenaFrame.classList.add('is-active');
  element('#run-build').hidden = false;
  canvas.inert = false;
  announcement.textContent = 'Run started. Move with WASD, arrow keys, or drag in the clearing. Attacks are automatic.';
  canvas.focus({ preventScroll: true });
  updateHud();
  renderer?.draw(run);
  if (run) director.synchronize(run);
  frameId = requestAnimationFrame(frame);
}

function start(): void {
  if (!renderer || mode === 'running' || mode === 'choosing') return;
  const fresh = mode !== 'paused';
  if (fresh) {
    if (!profileStore.change(beginProfileRun)) { description.textContent = profileStore.status().notice || 'The run could not be started. Reload to recover your profile.'; return; }
    const profile = profileStore.get();
    profileRunId = profile.activeRun;
    run = createRun(crypto.getRandomValues(new Uint32Array(1))[0]!, talentEditor.getBuild(), talentBudget(profile));
  }
  beginRun();
  const startedRun = run;
  void sound.unlock().then((ready) => { if (ready && fresh && run === startedRun && mode === 'running' && !document.hidden) sound.play('start', true); });
}

startButton.addEventListener('click', start, { signal: events.signal });
element('#return-to-build').addEventListener('click', () => { if (mode === 'finished') talentButton.click(); }, { signal: events.signal });
pauseButton.addEventListener('click', pause, { signal: events.signal });
window.addEventListener('keydown', (event) => {
  if (event.code === 'KeyM' && !event.repeat && document.activeElement === canvas) { event.preventDefault(); presentation.toggleMute(); return; }
  if (event.code !== 'Escape' || event.repeat) return;
  if (mode === 'choosing') { event.preventDefault(); return; }
  if (mode === 'running') { event.preventDefault(); pause(); }
  else if (mode === 'paused') { event.preventDefault(); start(); }
}, { signal: events.signal });
window.addEventListener('blur', () => { pause(); sound.stop(); }, { signal: events.signal });
document.addEventListener('visibilitychange', () => { if (document.hidden) { pause(); sound.stop(); } }, { signal: events.signal });
// Resizing during a captured drag must not leave a stale movement direction.
window.addEventListener('resize', () => { controls.clear(); renderer?.draw(run); }, { signal: events.signal });
const observer = new ResizeObserver(() => renderer?.draw(run));
observer.observe(canvas);
renderer?.draw(null);

if (!renderer) {
  element('#canvas-error').hidden = false;
  overlay.hidden = true;
  startButton.disabled = true;
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => { stopFrames(); controls.destroy(); presentation.destroy(); sound.destroy(); picker.destroy(); talentEditor.destroy(); events.abort(); observer.disconnect(); });
}
