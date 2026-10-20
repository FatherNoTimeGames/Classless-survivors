import { createArenaRenderer } from '../src/rendering/arena';
import { createSoundDirector } from '../src/audio/director';
import { tickRun } from '../src/game/run';
import { denseWorkload, percentile } from './workload';

async function measure() {
  const renderer = createArenaRenderer(document.querySelector<HTMLCanvasElement>('#arena')!);
  if (!renderer) throw new Error('Canvas unavailable');
  const director = createSoundDirector(() => false);
  let run = denseWorkload(), previous = 0;
  const ticks: number[] = [], draws: number[] = [], frames: number[] = [], intervals: number[] = [];
  for (let index = 0; index < 660; index++) {
    // Reset outside the measured callback; every second starts at all friendly entity caps.
    if (index % 60 === 0) { run = denseWorkload(); director.synchronize(run); }
    await new Promise<void>((resolve) => requestAnimationFrame((time) => {
      const start = performance.now();
      tickRun(run, { x: 0, y: 0 });
      const tickEnd = performance.now();
      renderer.draw(run);
      director.observe(run);
      const end = performance.now();
      if (index >= 60) {
        ticks.push(tickEnd - start); draws.push(end - tickEnd); frames.push(end - start); intervals.push(time - previous);
      }
      previous = time;
      resolve();
    }));
  }
  const summarize = (samples: number[]) => ({ median: percentile(samples, 0.5), p95: percentile(samples, 0.95), p99: percentile(samples, 0.99), max: Math.max(...samples) });
  return { samples: frames.length, tickMs: summarize(ticks), canvasAndDirectorMs: summarize(draws),
    callbackMs: summarize(frames), frameIntervalMs: summarize(intervals),
    canvas: { width: document.querySelector('canvas')!.width, height: document.querySelector('canvas')!.height },
    note: 'Headless Chromium, synthetic ranks/health/invulnerability. Excludes HUD, actual audio output, compositor and physical-device costs.' };
}

Object.assign(window, { measure });
