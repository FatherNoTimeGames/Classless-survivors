import { menuSection } from './game-helpers';
import { expect, test } from '@playwright/test';
import type { Locator } from '@playwright/test';
import { PRESENTATION_KEY } from '../src/persistence/presentation-store';
import { playerPosition, seedRuns } from './game-helpers';

type Audit = { contexts: AudioContext[]; gains: GainNode[]; started: number; ended: number; stoppedNow: number; analyser: AnalyserNode | null };

test('activate real synthesized audio, mute it, persist volume/motion and follow device preferences', async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
  await seedRuns(page);
  await page.addInitScript(() => {
    const audit: Audit = { contexts: [], gains: [], started: 0, ended: 0, stoppedNow: 0, analyser: null };
    Object.assign(window, { audioAudit: audit });
    const Context = window.AudioContext;
    window.AudioContext = class extends Context {
      constructor(options?: AudioContextOptions) { super(options); audit.contexts.push(this); }
    };
    const createGain = Context.prototype.createGain;
    Context.prototype.createGain = function () {
      const gain = Reflect.apply(createGain, this, []); audit.gains.push(gain);
      if (!audit.analyser) { audit.analyser = this.createAnalyser(); gain.connect(audit.analyser); }
      return gain;
    };
    const stop = OscillatorNode.prototype.stop;
    OscillatorNode.prototype.stop = function (at?: number) {
      if (at === undefined) audit.stoppedNow++;
      return Reflect.apply(stop, this, at === undefined ? [] : [at]);
    };
    const start = OscillatorNode.prototype.start;
    OscillatorNode.prototype.start = function (at?: number) {
      audit.started++; this.addEventListener('ended', () => audit.ended++, { once: true });
      return Reflect.apply(start, this, at === undefined ? [] : [at]);
    };
  });
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/');
  const activate = async (node: Locator) => testInfo.project.use.hasTouch ? node.tap() : node.click();
  await expect(page.locator('body')).toHaveAttribute('data-reduced-motion', 'true');
  expect(await page.evaluate(() => (window as unknown as { audioAudit: Audit }).audioAudit.contexts.length)).toBe(0);
  await menuSection(page, '#presentation-summary');
  await expect(page.locator('#sound-status')).toContainText('Sound starts after');
  await activate(page.locator('#enable-sound')); await expect(page.locator('#sound-status')).toContainText('Sound ready');
  expect(await page.evaluate(() => (window as unknown as { audioAudit: Audit }).audioAudit.contexts.length)).toBe(1);
  await menuSection(page, '#presentation-summary'); await activate(page.locator('#start-run'));
  // Read a real analyser tap on the master gain while native audio time advances.
  await expect.poll(async () => page.evaluate(() => {
    const analyser = (window as unknown as { audioAudit: Audit }).audioAudit.analyser!;
    const samples = new Float32Array(analyser.fftSize); analyser.getFloatTimeDomainData(samples);
    return Math.max(...samples.map(Math.abs));
  }), { timeout: 5000, intervals: [20, 50, 100] }).toBeGreaterThan(0.00001);
  expect(await page.evaluate(() => (window as unknown as { audioAudit: Audit }).audioAudit.started)).toBeGreaterThan(0);
  // A real browser audio suspension must clear pending notes and allow a gesture retry.
  await page.evaluate(() => (window as unknown as { audioAudit: Audit }).audioAudit.contexts[0]!.suspend());
  await expect(page.locator('#sound-status')).toContainText('Tap Enable sound');
  await menuSection(page, '#presentation-summary'); await activate(page.locator('#enable-sound'));
  await expect(page.locator('#sound-status')).toContainText('Sound ready');
  await menuSection(page, '#presentation-summary'); await activate(page.locator('#start-run'));
  await page.keyboard.press('KeyM');
  await expect(page.locator('#presentation-summary')).toContainText('sound off');
  expect(await page.evaluate(() => (window as unknown as { audioAudit: Audit }).audioAudit.stoppedNow)).toBeGreaterThan(0);
  await expect.poll(async () => page.evaluate(() => {
    const analyser = (window as unknown as { audioAudit: Audit }).audioAudit.analyser!;
    const samples = new Float32Array(analyser.fftSize); analyser.getFloatTimeDomainData(samples); return Math.max(...samples.map(Math.abs));
  })).toBeLessThan(0.00001);
  await expect.poll(async () => page.evaluate(() => { const audit = (window as unknown as { audioAudit: Audit }).audioAudit; return audit.ended >= audit.started; })).toBe(true);
  await page.keyboard.press('KeyM'); await menuSection(page, '#presentation-summary');
  await expect(page.locator('#start-run')).toHaveText('Resume run');
  await page.locator('#sound-volume').focus(); await page.keyboard.press('Home');
  for (let step = 0; step < 11; step++) await page.keyboard.press('ArrowRight');
  await expect(page.locator('#sound-volume-value')).toHaveText('55%');
  await page.locator('#motion-preference').selectOption('full'); await expect(page.locator('body')).toHaveAttribute('data-reduced-motion', 'false');
  await page.locator('#motion-preference').selectOption('system'); await expect(page.locator('body')).toHaveAttribute('data-reduced-motion', 'true');
  await page.emulateMedia({ reducedMotion: 'no-preference' }); await expect(page.locator('body')).toHaveAttribute('data-reduced-motion', 'false');
  await page.locator('#motion-preference').selectOption('reduced'); await expect(page.locator('body')).toHaveAttribute('data-reduced-motion', 'true');
  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), PRESENTATION_KEY);
  expect(saved).toMatchObject({ muted: false, volume: 0.55, motion: 'reduced' });
  await page.reload();
  expect(await page.evaluate(() => (window as unknown as { audioAudit: Audit }).audioAudit.contexts.length)).toBe(0);
  await expect(page.locator('body')).toHaveAttribute('data-reduced-motion', 'true');
  await menuSection(page, '#presentation-summary'); await expect(page.locator('#sound-volume')).toHaveValue('55');
  await expect(page.locator('#motion-preference')).toHaveValue('reduced');
  await menuSection(page, '#presentation-summary'); await activate(page.locator('#start-run'));
  const canvas = page.locator('#arena'); const before = await playerPosition(canvas);
  await page.keyboard.down('KeyD'); await page.waitForTimeout(250); await page.keyboard.up('KeyD');
  expect((await playerPosition(canvas)).x).toBeGreaterThan(before.x + 15);
  await activate(page.locator('#pause-run')); await menuSection(page, '#presentation-summary');
  await page.screenshot({ path: testInfo.outputPath('sound-display-settings.png'), fullPage: true });
  expect(await page.locator('.shell').evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true); expect(errors).toEqual([]);
});

test('recover browser autoplay denial with a fresh gesture while gameplay remains usable', async ({ page }, testInfo) => {
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const resume = AudioContext.prototype.resume; let denied = false;
    AudioContext.prototype.resume = function () {
      if (!denied) { denied = true; return this.suspend().then(() => Promise.reject(new DOMException('Gesture required', 'NotAllowedError'))); }
      return Reflect.apply(resume, this, []);
    };
  });
  await page.goto('/'); const activate = async (node: Locator) => testInfo.project.use.hasTouch ? node.tap() : node.click();
  await activate(page.locator('#start-run')); await expect(page.locator('#sound-status')).toContainText('Tap Enable sound');
  await menuSection(page, '#presentation-summary'); await expect(page.locator('#enable-sound')).toBeEnabled();
  await activate(page.locator('#enable-sound')); await expect(page.locator('#sound-status')).toContainText('Sound ready');
  await menuSection(page, '#presentation-summary'); await activate(page.locator('#start-run')); await expect(page.locator('#pause-run')).toBeVisible();
  expect(errors).toEqual([]);
});

test('play without audio or writable storage and keep current-tab presentation controls working', async ({ page }, testInfo) => {
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, 'AudioContext', { value: undefined });
    Storage.prototype.getItem = () => { throw new DOMException('Blocked', 'SecurityError'); };
    Storage.prototype.setItem = () => { throw new DOMException('Blocked', 'SecurityError'); };
  });
  await page.clock.install(); await page.clock.pauseAt(new Date()); await page.goto('/');
  const activate = async (node: Locator) => testInfo.project.use.hasTouch ? node.tap() : node.click();
  await activate(page.locator('#start-run')); await page.clock.runFor(1100);
  await expect(page.locator('#run-time')).not.toHaveText('00:00'); await expect(page.locator('#sound-status')).toContainText('Audio is unavailable');
  await menuSection(page, '#presentation-summary'); await page.locator('#sound-muted').check();
  await page.locator('#motion-preference').selectOption('reduced'); await expect(page.locator('body')).toHaveAttribute('data-reduced-motion', 'true');
  await expect(page.locator('#presentation-save-notice')).toContainText('this tab');
  await menuSection(page, '#presentation-summary'); await activate(page.locator('#start-run')); await expect(page.locator('#pause-run')).toBeVisible();
  expect(errors).toEqual([]);
});
