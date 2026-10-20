import './styles.css';
import { FixedClock } from './game/clock';
import { createRun, RULES, tickRun } from './game/run';
import type { Run } from './game/run';
import { createControls } from './input/controls';
import { createArenaRenderer } from './rendering/arena';

function element<T extends HTMLElement>(selector: string): T {
  const result = document.querySelector<T>(selector);
  if (!result) throw new Error(`Missing game element: ${selector}`);
  return result;
}

const canvas = element<HTMLCanvasElement>('#arena');
const renderer = createArenaRenderer(canvas);
const overlay = element('#run-overlay');
const title = element('#overlay-title');
const description = element('#overlay-description');
const startButton = element<HTMLButtonElement>('#start-run');
const pauseButton = element<HTMLButtonElement>('#pause-run');
const hud = element('#run-hud');
const health = element<HTMLProgressElement>('#health');
const healthText = element('#health-text');
const xp = element('#run-xp');
const kills = element('#run-kills');
const timer = element('#run-time');
const announcement = element('#announcement');
const results = element('#run-results');
const clock = new FixedClock();
const events = new AbortController();
let mode: 'ready' | 'running' | 'paused' | 'defeated' = 'ready';
let run: Run | null = null;
let frameId = 0;
let previousTime: number | null = null;

const controls = createControls(canvas, element('#joystick'), () => mode === 'running');
const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
const setText = (node: HTMLElement, text: string) => { if (node.textContent !== text) node.textContent = text; };

function updateHud(): void {
  if (!run) return;
  if (health.value !== run.player.health) health.value = run.player.health;
  setText(healthText, `${run.player.health} / ${RULES.maxHealth}`);
  setText(xp, String(run.xp));
  setText(kills, String(run.kills));
  setText(timer, formatTime(run.elapsed));
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
  startButton.textContent = 'Try again';
  pauseButton.hidden = true;
  announcement.textContent = 'Run ended. You can try again.';
  startButton.focus({ preventScroll: true });
}

function frame(timestamp: number): void {
  if (mode !== 'running' || !run) return;
  if (previousTime !== null) clock.advance((timestamp - previousTime) / 1000, () => tickRun(run!, controls.read()));
  previousTime = timestamp;
  renderer?.draw(run);
  updateHud();
  if (run.status === 'defeated') defeated();
  else frameId = requestAnimationFrame(frame);
}

function start(): void {
  if (!renderer || mode === 'running') return;
  stopFrames();
  if (mode !== 'paused') run = createRun(crypto.getRandomValues(new Uint32Array(1))[0]!);
  mode = 'running';
  overlay.hidden = true;
  results.hidden = true;
  hud.hidden = false;
  pauseButton.hidden = false;
  document.body.classList.add('playing');
  element('.arena-frame').classList.add('is-active');
  announcement.textContent = 'Run started. Move with WASD, arrow keys, or drag in the clearing. Attacks are automatic.';
  canvas.focus({ preventScroll: true });
  updateHud();
  renderer.draw(run);
  frameId = requestAnimationFrame(frame);
}

startButton.addEventListener('click', start, { signal: events.signal });
pauseButton.addEventListener('click', pause, { signal: events.signal });
window.addEventListener('keydown', (event) => {
  if (event.code !== 'Escape' || event.repeat) return;
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
  import.meta.hot.dispose(() => { stopFrames(); controls.destroy(); events.abort(); observer.disconnect(); });
}
