import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { preview } from 'vite';
import { chromium, expect } from '@playwright/test';
import { collectUntilChoice, playerPosition } from '../e2e/game-helpers.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const { version } = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const name = `classless-survivors-${version}.zip`;
const output = join(root, 'release');
const directory = await mkdtemp(join(tmpdir(), 'classless-release-smoke-'));
const results = [];
let browser;
let server;
try {
  await rm(join(output, 'smoke-results.json'), { force: true });
  const archive = await readFile(join(output, name));
  const digest = createHash('sha256').update(archive).digest('hex');
  assert.equal((await readFile(join(output, `${name}.sha256`), 'utf8')).trim(), `${digest}  ${name}`);
  execFileSync('unzip', ['-q', join(output, name), '-d', directory]);
  const manifest = JSON.parse(await readFile(join(directory, 'release-manifest.json'), 'utf8'));
  assert.equal(manifest.version, version);
  assert.equal(manifest.webRoot, 'web/');
  const actual = (await readdir(directory, { recursive: true, withFileTypes: true }))
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name).slice(directory.length + 1).replaceAll('\\', '/')).sort();
  assert.deepEqual(actual, [...Object.keys(manifest.files), 'release-manifest.json'].sort());
  for (const [path, expected] of Object.entries(manifest.files)) {
    const bytes = await readFile(join(directory, path));
    assert.equal(bytes.length, expected.bytes, path);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), expected.sha256, path);
  }
  browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  await mkdir(join(output, 'screenshots'), { recursive: true });
  for (const base of ['/', '/Classless-survivors/']) {
    server = await preview({ configFile: false, base, logLevel: 'error', build: { outDir: join(directory, 'web') },
      preview: { host: '127.0.0.1', port: 0, open: false } });
    const url = `http://127.0.0.1:${server.httpServer.address().port}${base}`;
    for (const settings of [
      { name: 'desktop', viewport: { width: 1280, height: 900 } },
      { name: 'tablet', viewport: { width: 768, height: 1024 }, hasTouch: true },
      { name: 'android-portrait', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    ]) {
      const { name: device, ...options } = settings;
      const context = await browser.newContext(options);
      try {
        const page = await context.newPage();
        const errors = [];
        const external = [];
        page.on('pageerror', (error) => errors.push(error.message));
        page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
        page.on('request', (request) => { if (new URL(request.url()).origin !== new URL(url).origin) external.push(request.url()); });
        await page.clock.install(); await page.clock.pauseAt(new Date());
        await page.goto(url);
        await expect(page).toHaveTitle('Classless Survivors');
        const activate = (locator) => settings.hasTouch ? locator.tap() : locator.click();
        await activate(page.locator('#edit-talents'));
        await activate(page.getByRole('button', { name: /Inspect Iron Reprisal/ }));
        await activate(page.locator('#allocate-talent'));
        await activate(page.getByRole('tab', { name: /Mage/ }));
        await activate(page.getByRole('button', { name: /Inspect Arcane Echo/ }));
        await activate(page.locator('#allocate-talent'));
        await activate(page.locator('#profile-panel > summary'));
        await page.locator('#build-name').fill('Release hybrid'); await activate(page.locator('#save-build'));
        await expect(page.locator('#build-slot option').first()).toContainText('Release hybrid');
        await activate(page.locator('#close-talents'));
        await expect(page.locator('#offline-status')).toContainText('Offline ready');
        await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
        const saved = await page.evaluate(() => Object.entries(localStorage));
        await context.setOffline(true);
        const response = await page.reload();
        assert(response.fromServiceWorker(), 'Offline HTML must come from the extracted release worker');
        assert.deepEqual(await page.evaluate(() => Object.entries(localStorage)), saved);
        await expect(page.locator('#edit-talents')).toHaveText('Talents (2/8)');
        await activate(page.locator('#start-run'));
        const canvas = page.locator('#arena');
        const before = await playerPosition(canvas);
        if (settings.hasTouch) {
          const session = await context.newCDPSession(page);
          const bounds = await canvas.boundingBox();
          const point = { x: Math.round(bounds.x + bounds.width * 0.35), y: Math.round(bounds.y + bounds.height * 0.65) };
          await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
          point.x += 60;
          await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point] });
          await page.clock.runFor(300);
          await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
          await session.detach();
        } else {
          await page.keyboard.down('KeyD'); await page.clock.runFor(300); await page.keyboard.up('KeyD');
        }
        assert((await playerPosition(canvas)).x > before.x + 20, 'Movement must work offline');
        await page.clock.runFor(12_000); await collectUntilChoice(page, canvas);
        await activate(page.locator('#upgrade-choices button').first());
        await expect(page.locator('#run-level')).toHaveText('2');
        assert(Number(await page.locator('#run-kills').textContent()) > 0, 'Automatic combat must kill real enemies');
        await page.clock.runFor(64);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow');
        const screenshot = `${base === '/' ? 'root' : 'subdirectory'}-${device}.png`;
        await page.screenshot({ path: join(output, 'screenshots', screenshot) });
        assert.deepEqual(errors, []); assert.deepEqual(external, []);
        results.push({ base, device, passed: true });
        console.log(`PASS extracted ZIP: ${base} ${device} — saved hybrid, offline reload, movement, kills, level choice`);
      } finally { await context.close(); }
    }
    await server.close(); server = undefined;
  }
  await writeFile(join(output, 'smoke-results.json'), JSON.stringify({ version, archive: name, sha256: digest,
    chromium: browser.version(), checkedFiles: actual.length, results }, null, 2) + '\n');
} finally {
  await browser?.close();
  await server?.close();
  await rm(directory, { recursive: true, force: true });
}
