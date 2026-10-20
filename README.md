# Classless Survivors

A single-player dark fantasy survival roguelite built with TypeScript and Canvas.
Mix talents freely across six fantasy archetypes. No accounts or backend required.

**Current milestone:** the first playable survival loop. Move through a bounded
clearing, fight pursuing enemies with an automatic ember attack, gather XP, and
try again after defeat. Leveling, talents, persistent saves, bosses, and offline
installation are upcoming milestones. See
[the task list](DEVELOPMENT_PLAN.md) and [progress log](PROGRESS.md).

## Play this milestone

Choose **Enter the clearing** to begin. Move with **WASD** or **arrow keys**, or
press and drag anywhere in the arena to create a floating virtual stick (touch,
pen, or mouse). Release to stop. Keyboard movement works while the arena has
focus; click/tap it to refocus. The arena edge is solid; ruined scenery is visual.

Your ember fires automatically at nearby enemies. Green shards are XP: move
near them to attract and collect them. XP is counted for this milestone; it does
not grant levels yet. Enemy numbers build over time, and you lose when health
reaches zero. **Try again** starts a fresh run with fresh stats. There is no
victory condition or persistent progress in this milestone.

Use **Pause** or **Escape** to pause and **Resume run** or **Escape** to resume.
Leaving the browser tab/window pauses the game automatically. After an input
interruption, release and press movement keys again to resume movement.

## Develop

Use Node **24.19.0 or later within Node 24** and npm **11 or later**. The exact
development runtime is pinned in `.node-version`; dependency versions are locked.

```sh
cd /workspace/Classless-survivors
npm ci
npm run dev
```

Vite serves development on port 5173. On your own machine, open
`http://localhost:5173`. Cloud access depends on your environment's port-forwarding
support. No environment variables, credentials, or external assets are required.

## Validate

```sh
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

Browser installation is a one-time step. If Linux system libraries are missing,
use Playwright's documented `npx playwright install --with-deps chromium` setup
on a machine where you have system-package installation permission.

To use an existing Chromium instead of downloading one:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser
```

After browser setup, `npm run check` runs unit tests, type checking, production
build, and production browser tests. Set the same executable-path variable for
that command when using a system browser. `npm run test:watch` watches unit tests.

Browser checks launch their own production preview server on port 4173 and fail
if that port is already occupied. They verify real canvas pixels, local asset
loading, resize behavior, keyboard navigation, combat through defeat/restart, and
no horizontal overflow at desktop, tablet, and Android-sized viewports. Real
browser touch dispatch tests on touch-enabled profiles cover virtual-stick
movement, multiple fingers, release/cancellation, and gesture suppression. The
simulation tests cover movement across frame rates, targeting, swept collision,
damage protection, XP, spawning, bounded entities, and reset behavior.
Screenshots and failure traces are
written to ignored `test-results/`. Emulation does not replace physical device
testing, and Chromium checks do not establish support in other browser engines.

## Production

```sh
npm run build
npm run preview
```

Preview serves the built app on port 4173. Deploy the contents of `dist/` to a
static web host. Asset URLs are relative to support subdirectory hosting. The
preview command is for local validation, not a production server. HTTPS and
offline installation guidance will be completed with the PWA milestone.

## Layout

- `src/main.ts`: browser initialization and canvas lifecycle.
- `src/game/`: deterministic simulation and fixed-timestep clock, without DOM APIs.
- `src/input/`: keyboard and captured-pointer movement controls.
- `src/rendering/`: canvas sizing and original procedural scene art.
- `src/styles.css` and `index.html`: responsive, semantic page shell.
- `tests/`: unit tests for logic independent of the browser.
- `e2e/`: browser checks against the production build.

The simulation module map:

| Responsibility | Module under `src/game/` |
| --- | --- |
| Tick order and defeated-run guard | `run.ts` |
| Entity types and fresh-run state | `state.ts` |
| Dimensions, timing, and gameplay tuning | `rules.ts` |
| Player movement, boundaries, and enemy pursuit | `movement.ts` |
| Spawn pacing and safe placement | `spawning.ts` |
| Targeting, attack cooldowns, projectiles, and damage | `combat.ts` |
| XP drops, attraction, collection, and overflow merging | `pickups.ts` |
| Feedback events and their lifetimes | `effects.ts` |
| Distances, bounds, and swept collision geometry | `geometry.ts` |
| Run-owned seeded randomness | `random.ts` |
| Rendering-frame to fixed-tick scheduling | `clock.ts` |

`run.ts` coordinates the systems in a deliberate order: advance time/cooldowns,
expire feedback, move the player, spawn and move enemies, attack, resolve bolts,
collect XP, then apply contact damage. This keeps killed enemies from damaging the
player and credits nearby drops before a fatal contact. Systems mutate their own
parts of the explicit `Run` state; there is no hidden singleton state. Rendering
and input import only the state types and shared tuning they need. Keep new rules
in focused systems and add progression as its own module when task 3 begins.

Simulation/progression stays separate from rendering and input. The background
is cached, screen-density buffers are capped, and enemy/projectile/pickup/effect
counts are bounded. These are basic safeguards; full-run optimization remains a
later milestone. All current assets are original SVG or programmatic Canvas artwork;
fonts are local system fonts. All dependencies are development tools and use
open-source licenses. There are no runtime package dependencies.

Modularity and inexpensive, readable art are standing requirements. Gameplay
systems should have focused, testable modules and clear ownership; content and
tuning should be easy to find and change. New art may use simple Canvas shapes,
SVG/vectors, or monochrome/limited-palette pixels, whichever is easiest to produce.
Readable existing art can stay. See [AGENTS.md](AGENTS.md) for development guidance.
