# Classless Survivors — progress

## Current state

- Completed: tasks 0–3 and the separately requested modular refactor (2a).
- Playable: keyboard/floating-stick movement, automatic ember attacks, pursuing
  enemies, health/contact protection, XP collection, leveling, randomized upgrade
  choices, pause/resume, defeat/results, and clean restart.
- Task 3 delivers seven functioning run upgrades: Quickened Ember, Fleetfoot,
  Soul Gatherer, Living Ember, Forked Ember, Soul Needle, and Ashburst.
- Level choices freeze simulation and clear movement input. Batch XP queues every
  earned reward; excess XP carries over. Offers are distinct, rarity-weighted,
  level-eligible, and respect rank caps, with a weapon choice when available.
- The finite initial pool supports 20 levels without exhausting rewards early.
  XP still counts after the cap. Fresh runs reset levels, ranks, stats, and choices.
- HUD shows level/XP progress and current build. Extra targets, piercing trails,
  and non-chaining impact explosions change visible combat. Health upgrades
  correctly change maximum health and heal once.
- Original programmatic artwork is preserved. No runtime package dependencies.
- Architecture: focused simulation, content/tuning, input, rendering, and UI
  modules. run.ts coordinates ticks; progression.ts owns XP/offers/selection,
  stats.ts derives stats, damage.ts credits deaths once. See README.md's module map.
- Separate seeded randomness streams isolate offer rolls from enemy spawns.

## Standing requirements

- Complete one authorized task, validate, update this log, commit, report, and
  pause until **continue**. Make ordinary design decisions independently.
- Keep systems modular with explicit typed boundaries and state ownership.
  Keep simulation independent of the browser. Avoid large coordinator functions,
  circular dependencies, and unnecessary frameworks. See AGENTS.md.
- Prefer the simplest readable original art: Canvas shapes, vectors, or limited-
  palette pixels. Reuse readable art; elaborate asset production is unnecessary.
- Follow [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) for the complete checklist.

## Next task

**Task 4: Build the classless talent framework and visual tree.**

Wait for **continue**. Define all 36 talents across the six freely mixable
branches, prerequisites, descriptions, and cross-branch interactions. Add bounded
allocation, refunds/free respecs, accessible tooltips, build validation, and the
combat event/effect framework in focused modules. Only functioning talents may
be usable; definitions alone are not completed content. Tasks 5–7 implement the
full branch content; persistent builds/unlocks remain task 8. Test mixed-branch
allocation, invalid builds, refunds, and bounded trigger chains. Commit and pause.

## Latest validation

- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run check` passed:
  **46 unit tests**, TypeScript checks, production build, **14 browser tests**.
  No failed or skipped tests in the final run.
- Progression coverage: exact thresholds, queued rewards, leftover XP, rarity
  weighting/unlocks, capped/invalid/stale selections, whole-world choice pause,
  level-up priority over contact, all seven upgrades' actual effects, combined
  piercing/explosion kill attribution, existing-shot snapshots, final-level
  completion, and reset. Existing movement/combat regressions still pass.
- Browser tests collect actual visible XP shards, freeze for selection, choose
  upgrades using keyboard and touch, inspect improved cooldown/ranks, level again,
  and reset. Desktop, tablet, and Android portrait emulation pass, alongside
  defeat/restart, pause/focus handling, multi-touch cancellation, and shell checks.
- Reviewed desktop and phone level-choice screenshots. Inspected 23 source modules:
  no circular runtime imports. No runtime errors observed in browser checks.
- Current output: about 20.87 kB JavaScript and 6.49 kB CSS before compression.
- Runtime validated on Node 24.19.0, npm 11.9.0, system Chromium 154. README.md
  documents startup and validation. Browser tests stop their preview server.

## Remaining work and limits

- Tasks 4–17: classless talents; persistent progression; enemy/boss variety;
  temporary synergies; presentation/audio; device polish; offline/PWA; balancing;
  final regression fixes; production delivery.
- No talent tree, permanent unlocks/saves, bosses, victory condition, or offline
  installation yet. Reloading intentionally starts fresh at this stage.
- Only the starter enemy exists. Strong weapon combinations can outpace it;
  enemy variety and full-run balancing remain later milestones. Scenery is
  decorative; only arena boundaries block movement.
- Physical Android/tablet hardware and other browser engines are unverified.
  Emulation is not a hardware performance claim. Deployment is not configured.
- No current setup blockers or known failing checks.

## Milestone history

- Task 0: planning, `90daca7`.
- Task 1: project foundation/tooling, `8332fcb`.
- Task 2: playable survival loop, `50cee85`.
- Standing modularity/art requirements: `93558f1`.
- Refactor 2a: separate simulation systems, `851082a`; 244 captured full-state
  checkpoints matched the pre-refactor behavior across four seeded routes.
- Task 3 commit: `feat: add leveling and randomized run upgrades` (this milestone).
