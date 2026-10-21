// Vite loads the same TypeScript simulation used by the browser, without another dependency.
import { createServer } from 'vite';
import { parseArgs } from 'node:util';
import { writeFile } from 'node:fs/promises';
import { cpus } from 'node:os';
import { Session } from 'node:inspector/promises';

const { values } = parseArgs({ options: {
  output: { type: 'string' }, profile: { type: 'string' }, seeds: { type: 'string', default: '1,42,2026' },
  'benchmark-only': { type: 'boolean', default: false },
  adaptive: { type: 'boolean', default: false },
  arena: { type: 'string' },
} });
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const session = new Session();
try {
  const { BALANCE_ROUTES } = await server.ssrLoadModule('/analysis/routes.ts');
  const { arenaSize } = await server.ssrLoadModule('/src/game/arena-size.ts');
  let world;
  if (values.arena) {
    if (!/^\d+x\d+$/.test(values.arena)) throw new Error('Arena must be WIDTHxHEIGHT');
    world = arenaSize(...values.arena.split('x').map(Number));
  }
  const { simulateRoute } = await server.ssrLoadModule('/analysis/simulation.ts');
  const { benchmarkSimulation } = await server.ssrLoadModule('/analysis/workload.ts');
  if (values.profile) {
    session.connect();
    await session.post('Profiler.enable');
    await session.post('Profiler.start');
  }
  const results = [];
  for (const route of values['benchmark-only'] ? [] : BALANCE_ROUTES) {
    for (const seed of values.seeds.split(',').map(Number)) {
      if (!Number.isInteger(seed) || seed < 0) throw new Error('Seeds must be nonnegative integers');
      const result = simulateRoute(route, seed, false, values.adaptive, world);
      results.push(result);
      console.log(`${result.route} seed=${seed} ${result.outcome} ${result.seconds.toFixed(0)}s L${result.level} HP=${result.health.toFixed(1)} bosses=${result.bosses.map((b) => b.seconds.toFixed(1)).join('/')} ${result.wallMs.toFixed(0)}ms`);
    }
  }
  // Negative control: movement must still matter, even with a proven build.
  if (!values['benchmark-only']) results.push(simulateRoute(BALANCE_ROUTES[0], 42, true, false, world));
  const benchmark = benchmarkSimulation();
  console.log('Dense simulation:', benchmark);
  if (values.profile) {
    const { profile } = await session.post('Profiler.stop');
    await writeFile(values.profile, JSON.stringify(profile));
  }
  const report = { environment: { node: process.version, cpu: cpus()[0]?.model, platform: process.platform, arena: world }, results, benchmark };
  if (values.output) await writeFile(values.output, `${JSON.stringify(report, null, 2)}\n`);
} finally {
  session.disconnect();
  await server.close();
}
