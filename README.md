# Classless Survivors

A single-player dark fantasy survival roguelite built with TypeScript and Canvas.
Mix talents freely across six fantasy archetypes. No accounts or backend required.

**Current milestone:** the classless talent foundation. Build across six branches
before a run, then move, fight, collect XP, and choose temporary upgrades.
The visual tree contains 36 talent designs; **7 are functioning and selectable**.
The other 29 are clearly marked coming soon and cannot be allocated. Full branch
content, persistent saves, bosses, and offline installation remain upcoming. See
[the task list](DEVELOPMENT_PLAN.md) and [progress log](PROGRESS.md).

## Play this milestone

Open **Talents** before a run. You have three talent points, can mix any branches,
and may leave points unspent. Select a branch tab, then a node to inspect its
description, prerequisites, and suggested synergies. Hover/focus help and a
persistent detail panel support mouse, keyboard, and touch. Allocate a point,
refund individual talents, or use **Free respec** to clear the whole build.
Refunding a prerequisite also refunds dependent talents. Planned nodes remain
inspectable, with allocation disabled.

| Playable foundation talent | Branch | Behavior |
| --- | --- | --- |
| Iron Reprisal | Warrior | Surviving contact retaliates for 12 physical damage within 44 range |
| Arcane Echo | Mage | Every third direct ember hit strikes another nearby enemy for 9 arcane damage |
| Expose Weakness | Rogue | Wounded direct-hit targets take 6 extra damage and refund 0.15s of ember cooldown |
| Ember Communion | Priest | Every fourth direct ember kill restores 3 health |
| Searing Grace | Priest | Requires Communion; actual healing strikes the nearest foe within 110 range for 6 holy damage |
| Soul Cinder | Warlock | Every fourth direct ember kill bursts for 9 shadow damage within 36 range, without chaining |
| Hunting Momentum | Hunter | A direct ember kill stores one additional target for the next attack with enough targets |

Try **Iron Reprisal + Expose Weakness + Arcane Echo** for retaliation and wounded
follow-ups, or **Ember Communion + Searing Grace + Expose Weakness** to turn healing
into damage that primes your next ember. Effects use distinct rings, diamonds,
crosses, and colors. Overhealing has no effect; fatal hits cannot be healed into
a resurrection. These talents are separate from randomized run upgrades.

Your chosen talents are copied into the new run. Editing is available before the
first run and after defeat; paused runs cannot be respecced. **Try again** uses
your current talent allocation but resets temporary upgrades. Builds currently
last only while this page remains open; local saves and slots arrive in task 8.

Choose **Enter the clearing** to begin. Move with **WASD** or **arrow keys**, or
press and drag anywhere in the arena to create a floating virtual stick (touch,
pen, or mouse). Release to stop. Keyboard movement works while the arena has
focus; click/tap it to refocus. The arena edge is solid; ruined scenery is visual.

Your ember fires automatically at nearby enemies. Green shards are XP: move
near them to attract and collect them. Ten XP earns the first level; each following
threshold costs eight more XP. On leveling, combat freezes while you select a
run upgrade. Tap/click a card, or use Tab and Enter/Space. Escape cannot dismiss a
level reward. If several levels are earned at once, choose once for each reward;
excess XP carries over. Held movement input is cleared before play resumes.

Each offer contains up to three distinct upgrades, with at least one weapon
option when available. Common upgrades appear from level 2, uncommon from level 3,
and rare from level 4. Common offers have greater selection weight. Maxed upgrades
stop appearing. The initial pool supports 20 levels; at maximum level, XP remains
counted in the run total and no more choices are required.

| Run upgrade | Effect per rank | Rank cap |
| --- | --- | --- |
| Quickened Ember | Ember cooldown −0.08 seconds | 4 |
| Fleetfoot | Movement speed +12 | 3 |
| Soul Gatherer | XP attraction range +18 | 3 |
| Living Ember | Maximum health +12; restore 12 health | 3 |
| Forked Ember | Attack one additional distinct nearby target, if available | 2 |
| Soul Needle | Each ember passes through one additional enemy | 2 |
| Ashburst | Direct hits explode for half damage; blast radius +20, without chaining | 2 |

Piercing bolts have a pale trail; explosive bolts produce expanding impact rings.
Open **Run upgrades** beneath the arena to inspect your ranks and ember stats.
Enemy numbers build over time, and you lose when health reaches zero. **Try again**
starts a fresh run with level 1, your chosen talents, and no run upgrades. There is no victory
condition or persistent progress in this milestone. Full enemy variety and balancing
remain later milestones; some weapon combinations can outpace the starter enemy.

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
Progression checks also exercise queued levels, invalid/capped selections, rarity,
every upgrade's gameplay effect, piercing/explosion interactions, and maximum-level
completion. Browser leveling journeys navigate to actual rendered XP shards, verify
the frozen choice screen, select with keyboard/touch, inspect the improved ability,
earn a second level, and start a fresh run.
Talent tests cover all seven functioning effects, mixed-branch synergies, valid
and invalid builds, prerequisites, cascading refunds, snapshots, and trigger
budgets/cycles. Browser checks inspect branch trees with keyboard/touch, enforce
the point limit, respec, and start a three-branch build.
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
- `src/content/`: upgrade definitions, rank caps, rarity, and progression tuning.
- `src/ui/`: DOM helpers, HUD presentation, and accessible upgrade selection.
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
| Talent allocation, validation, and cascading refunds | `builds.ts` |
| Dimensions, timing, and gameplay tuning | `rules.ts` |
| Player movement, boundaries, and enemy pursuit | `movement.ts` |
| Spawn pacing and safe placement | `spawning.ts` |
| Targeting, cooldowns, projectile hits, and enemy contact | `combat.ts` |
| Shared enemy damage, kill credit, and death drops | `damage.ts` |
| Actual healing, overheal rejection, and healing events | `healing.ts` |
| Bounded typed combat-event queue | `events.ts` |
| Talent behavior modules by branch and active-handler registry | `talent-effects/` |
| XP drops, attraction, collection, and overflow merging | `pickups.ts` |
| XP thresholds, queued levels, offers, and validated choices | `progression.ts` |
| Deriving current run stats from selected upgrade ranks | `stats.ts` |
| Feedback events and their lifetimes | `effects.ts` |
| Distances, bounds, and swept collision geometry | `geometry.ts` |
| Run-owned seeded randomness | `random.ts` |
| Shared nearest-foe queries for talent effects | `targeting.ts` |
| Rendering-frame to fixed-tick scheduling | `clock.ts` |

`run.ts` coordinates the systems in a deliberate order: advance time/cooldowns,
expire feedback, move the player, spawn and move enemies, attack, resolve bolts,
resolve talent effects, collect XP, then apply contact damage and its reactions if
no level reward paused the run. This keeps
killed enemies from damaging the player and gives a level reward priority over
contact. Systems mutate their own
parts of the explicit `Run` state; there is no hidden singleton state. Rendering
and input import only the state types and shared tuning they need. Keep new rules
in focused systems. Offer randomness has a separate run-owned seed stream, so
drawing upgrade cards does not consume enemy-spawn randomness. Projectile upgrades
are captured when a bolt is fired; existing shots retain their original properties.

Talent definitions live in `src/content/talents.ts`, with current numerical tuning
in `talent-tuning.ts`. Availability flags must match working implementations;
changing a preview flag alone does not implement a talent. Branch handlers live in
`src/game/talent-effects/`; Rogue's direct-damage modifier runs before hit events.
The editor and graph renderer are separate UI modules, and feedback drawing is
isolated in `src/rendering/feedback.ts`.

Combat effects use FIFO events with source/school information, a six-generation
depth limit, 256-event queue/tick limits, and handler-ancestry suppression. Limits
apply to secondary triggers; primary damage and death drops are applied directly.
`run.effects.dropped` and `suppressed` provide diagnostics for debugging chains.
The queue stores data only, so run state stays cloneable and contains no callbacks.

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
