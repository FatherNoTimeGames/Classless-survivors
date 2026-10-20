# Classless Survivors — progress

## Current state

- Completed: tasks 0–2 and the separately requested modular refactor (2a).
- Repository began empty, with no project code or existing agent instructions.
- Implemented: responsive TypeScript/Vite shell, original Canvas sanctuary and
  actor artwork, keyboard/floating-stick movement, a pursuing enemy type,
  automatic ember projectiles, health/contact protection, XP shards with nearby
  attraction, mounting enemy numbers, defeat/results, and clean restart.
- Pause/resume works by button or Escape; window/tab loss automatically pauses.
  Pointer cancellation, extra fingers, held-key repeat, and input interruption
  are handled. Portrait play keeps the arena and essential controls visible.
- Toolchain validated with Node 24.19.0, npm 11.9.0, and system Chromium 154.
- Simulation uses fixed 60 Hz ticks and seeded randomness, separate from input
  and rendering. Background drawing is cached and entity/effect counts bounded.
- Simulation now has focused state, tuning, movement, spawning, combat, pickup,
  feedback, geometry, and random-generator modules. run.ts is a 22-line coordinator.
  README.md maps each responsibility to its file. Gameplay and artwork are preserved.
- Plan: [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md).

## Standing specifications

- Keep everything modular for easier debugging and changes: focused gameplay
  systems, explicit typed boundaries, and separate simulation, input, rendering,
  UI, content/tuning, and persistence. The foundation extraction is complete;
  extend focused modules and keep run.ts responsible only for tick coordination.
- Use whichever original programmatic art is easiest to produce and maintain.
  Readable monochrome/limited-palette pixel art, simple Canvas shapes, and SVG/
  vectors are all acceptable. Preserve clear silhouettes and visual cues; avoid
  spending effort on detail or replacing readable existing assets.
- These requirements are recorded in AGENTS.md and the plan. Task 3 remains
  unstarted; the user authorized the modular refactor as its own work cycle.

## Next task

**Task 3: Add leveling and randomized run upgrades.**

Wait for the user to say **continue**, then implement only task 3: XP thresholds,
paused randomized upgrade selection, a useful initial upgrade pool, eligibility/
rarity rules, and visible ability improvements. Handle several levels earned at
once and reset temporary upgrades between runs. Preserve the existing pause,
input-clearing, and restart behavior. Keep rules testable without the browser;
add progression as its own module rather than enlarging run.ts;
extend real browser journeys to choose and observe upgrades. Talents and permanent
progression remain later milestones. Update this log, test, commit, report, and pause.

## Remaining work

Tasks 3–17 in the development plan: leveling; classless talent
framework; all six branches; persistence; enemy/boss variety; temporary synergies;
presentation; device usability; offline/PWA; balancing; regression fixes; release.

## Validation and known issues

- Task 1: clean `npm ci`, initial tests/build/browser checks, and development
  server page/module requests passed. Commit: `8332fcb`.
- Task 2: `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run check`
  passed in full, including 30 unit tests, TypeScript checks, production build,
  and 11 production-browser tests. No tests failed or were skipped in the final run.
- Unit coverage includes movement at 30/60/120 rendering FPS, analog/diagonal
  movement, boundaries, fixed-clock catch-up/reset, nearest targeting, swept
  collisions, cooldowns, kill attribution, contact protection, spawn grace,
  deterministic safe spawns, pickups/XP conservation, entity caps, death/freeze,
  and restart. A real seeded run kills, gathers XP, and eventually loses.
- Browser checks cover actual rendered movement, auto-combat through defeat and
  restart on desktop/tablet/Android portrait, pause and interrupted/held keys,
  captured real touch events, multiple fingers, release/cancellation, and no
  touch scrolling. Existing scene/resize/navigation checks still pass. Reviewed
  desktop combat and phone/tablet touch screenshots. No runtime errors observed.
- Current production output is approximately 12.71 kB JavaScript and 5.02 kB CSS
  before compression. This is a foundation measurement, not full-game profiling.
- Browser tests start and stop their own production preview server.
- Run instructions are in README.md. Chromium is already installed in this cloud
  instance; set the executable-path variable above for browser checks. Other
  machines can use the documented Playwright browser installation instead.
- Task 2 milestone commit: `feat: add playable survival foundation`.
- Modular refactor: `npm run check` passed with all 30 existing unit tests,
  TypeScript checks, production build, and all 11 browser tests. Existing test
  assertions were preserved; only simulation import paths changed.
- A one-time before/after comparison matched all 244 full-state checkpoints over
  four seeded 120-second routes (stationary, rectangular, circular, and diagonal).
  The temporary verifier was removed after passing; the permanent suite remains
  self-contained. Inspected source imports and found no circular runtime imports.
- Refactor milestone commit: `refactor: separate survival simulation systems`.
- XP currently accumulates without leveling. Talents, saves, authored waves,
  enemy variety, bosses, victory, and offline installation are not implemented.
  The clearing has solid arena edges; scenery is decorative, not an obstacle map.
- No deployment target is configured or verified. Determine available hosting at
  release time; do not let that block local development.
- Physical Android/tablet testing may require hardware unavailable in this cloud
  environment. Browser emulation and device testing must be reported separately.
- No current implementation blockers or known failing checks after the refactor.

## Completion report convention

For each task record the finished behavior, validation outcomes, known issues,
commit, and next task. Stop after each completed task until **continue**. If
interrupted, record partial changes, failing checks, and exact next steps here.
