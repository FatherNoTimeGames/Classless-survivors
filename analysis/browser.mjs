import { build } from 'vite';
import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir, cpus } from 'node:os';
import { join, resolve, extname } from 'node:path';
import { parseArgs } from 'node:util';

const { values } = parseArgs({ options: { output: { type: 'string' } } });
const directory = await mkdtemp(join(tmpdir(), 'classless-browser-bench-'));
let browser;
const server = createServer(async (request, response) => {
  const path = resolve(directory, `.${new URL(request.url, 'http://localhost').pathname}`);
  if (!path.startsWith(`${directory}/`)) { response.writeHead(403).end(); return; }
  try {
    const body = await readFile(path);
    response.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' })[extname(path)] ?? 'application/octet-stream');
    response.end(body);
  } catch { response.writeHead(404).end(); }
});
try {
  // Independent production-mode benchmark bundle. Never add this page to the game's release/PWA.
  await build({ configFile: false, publicDir: false, logLevel: 'error', build: {
    target: 'es2022', outDir: directory, emptyOutDir: true, rolldownOptions: { input: 'analysis/performance.html' },
  } });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  const results = [];
  for (const settings of [{ name: 'desktop', viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 },
    { name: 'phone-emulation', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }]) {
    const page = await browser.newPage(settings);
    const errors = []; page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/analysis/performance.html`);
    await page.waitForFunction(() => typeof window.measure === 'function');
    const metrics = await page.evaluate(() => window.measure());
    if (errors.length) throw new Error(errors.join('\n'));
    results.push({ name: settings.name, ...metrics });
    console.log(settings.name, JSON.stringify(metrics));
    await page.close();
  }
  const report = { environment: { node: process.version, chromium: browser.version(), cpu: cpus()[0]?.model }, results };
  if (values.output) await writeFile(values.output, `${JSON.stringify(report, null, 2)}\n`);
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
  await rm(directory, { recursive: true, force: true });
}
