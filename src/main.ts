import './styles.css';
import { FixedClock } from './game/clock';
import { tickRun } from './game/run';
import { createRun } from './game/state';
import type { Run } from './game/state';
import { createControls } from './input/controls';
import { createArenaRenderer } from './rendering/arena';
import { chooseUpgrade } from './game/progression';
import { element, formatTime } from './ui/dom';
import { createHud } from './ui/hud';
import { createUpgradePicker } from './ui/upgrade-picker';
import { createTalentEditor } from './ui/talent-editor';
import { openBrowserProfile } from './persistence/browser-profile';
import { beginProfileRun, finishProfileRun, talentBudget } from './profile/profile';

const canvas = element<HTMLCanvasElement>('#arena');
const renderer = createArenaRenderer(canvas);
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
let mode: 'ready' | 'running' | 'paused' | 'choosing' | 'defeated' = 'ready';
let run: Run | null = null;
let frameId = 0;
let previousTime: number | null = null;

const controls = createControls(canvas, element('#joystick'), () => mode === 'running');
const profileStore = openBrowserProfile();
const talentEditor = createTalentEditor(talentButton, () => mode === 'ready' || mode === 'defeated', profileStore);
let profileRunId: number | null = null;
const picker = createUpgradePicker(element('#upgrade-picker'), (id) => {
  if (!run || mode !== 'choosing' || !chooseUpgrade(run, id)) return;
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
  overlay.hidden = false;
  title.textContent = 'A moment of quiet';
  description.textContent = 'The clearing waits. Return when you are ready.';
  startButton.textContent = 'Resume run';
  pauseButton.hidden = true;
  announcement.textContent = 'Run paused.';
  startButton.focus({ preventScroll: true });
}

function defeated(): void {
  mode = 'defeated';
  stopFrames();
  overlay.hidden = false;
  title.textContent = 'The ember fades';
  description.textContent = 'The dark has taken this clearing. Rise and try again.';
  results.hidden = false;
  if (run) results.textContent = `${formatTime(run.elapsed)} survived · ${run.kills} slain · ${run.xp} XP gathered`;
  if (run && profileRunId !== null) {
    profileStore.change((profile) => finishProfileRun(profile, profileRunId!, { outcome: 'defeat', seconds: run!.elapsed, kills: run!.kills, xp: run!.xp }));
    const result = profileStore.get().lastResult;
    const reward = element('#run-reward');
    reward.hidden = false;
    reward.textContent = result?.id === profileRunId ? `${result.insight} insight earned${result.points ? ' · +1 permanent talent point' : ''}. ${profileStore.status().notice}` : profileStore.status().notice;
    profileRunId = null;
    talentEditor.refresh();
  }
  startButton.textContent = 'Try again';
  pauseButton.hidden = true;
  announcement.textContent = 'Run ended. You can try again.';
  talentButton.hidden = false;
  startButton.focus({ preventScroll: true });
}

function openUpgradeChoice(): void {
  if (!run) return;
  mode = 'choosing';
  stopFrames();
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
  updateHud();
  if (run.status === 'defeated') defeated();
  else if (run.status === 'choosing') openUpgradeChoice();
  else frameId = requestAnimationFrame(frame);
}

function beginRun(): void {
  stopFrames();
  mode = 'running';
  overlay.hidden = true;
  results.hidden = true;
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
  frameId = requestAnimationFrame(frame);
}

function start(): void {
  if (!renderer || mode === 'running' || mode === 'choosing') return;
  if (mode !== 'paused') {
    if (!profileStore.change(beginProfileRun)) { description.textContent = profileStore.status().notice || 'The run could not be started. Reload to recover your profile.'; return; }
    const profile = profileStore.get();
    profileRunId = profile.activeRun;
    run = createRun(crypto.getRandomValues(new Uint32Array(1))[0]!, talentEditor.getBuild(), talentBudget(profile));
  }
  beginRun();
}

startButton.addEventListener('click', start, { signal: events.signal });
pauseButton.addEventListener('click', pause, { signal: events.signal });
window.addEventListener('keydown', (event) => {
  if (event.code !== 'Escape' || event.repeat) return;
  if (mode === 'choosing') { event.preventDefault(); return; }
  if (mode === 'running') { event.preventDefault(); pause(); }
  else if (mode === 'paused') { event.preventDefault(); start(); }
}, { signal: events.signal });
window.addEventListener('blur', pause, { signal: events.signal });
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); }, { signal: events.signal });
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
  import.meta.hot.dispose(() => { stopFrames(); controls.destroy(); picker.destroy(); talentEditor.destroy(); events.abort(); observer.disconnect(); });
}
