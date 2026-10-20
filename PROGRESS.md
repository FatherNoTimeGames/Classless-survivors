# Classless Survivors — progress

## Current state

- Completed: tasks 0–7 and the separately requested modular refactor (2a).
- Playable: keyboard/touch movement, automatic combat, enemies, health, XP,
  leveling, seven randomized run upgrades, pause/resume, defeat, and restart.
- Task 7: all 36 talents across all six branches function and are selectable.
  The tree has accurate descriptions, prerequisites, free respecs, and original
  icons for every talent. No preview-only nodes remain.
- Priest: all-source kill healing, actual-heal offense, throttled pickup healing,
  holy marks consumed by physical hits, bounded excess-heal shields, and offensive
  reactions to absorption from any shield source.
- Warlock: all-source kill bursts, open non-periodic curses, a piercing imp,
  detonations from remaining Poison/curse damage, actual-heal buffs for either
  companion, and periodic-kill healing/extensions for either DoT family.
- Shared companion definitions/construction keep state creation independent of
  damage code. Falcon/imp behavior shares targeting, commands, cooldowns, bonuses,
  and explicit Pack Link inheritance; live projectiles snapshot damage/piercing.
- Eight temporary points permit full branches with supporting pairs. Permanent
  points/unlocks remain task 8. Allocation order does not change handler order.
- Simple marks, distinct curse/detonation symbols, imp/falcon silhouettes, and
  fractional ward labels preserve readability. Rendering is split by responsibility.
- New runs copy the chosen build; talent changes cannot affect an existing run.
  Talent draft persists within this page session only. Temporary run upgrades
  reset separately. Permanent persistence remains task 8.
- Original programmatic art is retained; simple feedback shapes distinguish
  physical, arcane, holy, shadow, healing, and existing attack effects.
- Typed combat events carry damage source/school, hit/death origin, and actual
  healing. Processing is bounded by depth, event budgets, and handler ancestry.
  Effects store data, not functions. Fatal hits cannot trigger healing resurrection.

## Standing requirements

- Complete one authorized task, validate, update this log, commit, report, and
  pause until **continue**. Make ordinary design decisions independently.
- Keep systems modular with typed boundaries and clear state ownership. Simulation
  stays browser-independent; run.ts only coordinates systems. See AGENTS.md and
  README.md's module map. No extra frameworks or runtime package dependencies.
- Prefer open, synergistic talent triggers across branches and combat families,
  with explicit companion inheritance and bounded effects. See AGENTS.md.
- Use the simplest readable original art: Canvas shapes, vectors, or limited-
  palette pixels. Reuse readable art; avoid elaborate asset-production work.
- Follow [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) for the complete checklist.

## Next task

**Task 8: Add persistent progression and saved character builds.**

Wait for **continue**. Choose bounded run rewards and talent-point/option unlocks
that broaden build variety, with no unwinnable early-loss states or unlimited
stat growth. Add versioned validated local saves, migrations/recovery, multiple
named build slots, free between-run respecs, and export/import backups. Ensure
reloads retain progress/builds and rewards cannot be claimed twice. This build
currently has defeat only; define rewards so victory integration can use the same
boundary in task 10. Test corruption/reload/reward and build journeys, document,
commit, and pause. Keep gameplay, persistence, and UI modular.

## Latest validation

- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run check` passed:
  **165 unit tests**, TypeScript checks, production build, and **32 browser tests**.
  No failed or skipped tests in the final run.
- Reviewed desktop/tablet/phone branch and combat screenshots; all talent names,
  icons, descriptions, Close, fractional health/ward labels, and imp/falcon shapes
  remain readable. Physical hardware and other browser engines remain unverified.
- Production output: approximately 64.57 kB JavaScript (21.39 kB gzip) and 9.25 kB
  CSS uncompressed.
- Every playable talent has behavior coverage. New tests exercise actual vs excess
  healing, expiration/absorption, pickup throttling, holy marks, curses, periodic
  snapshots, exact remaining tick counts, explosion caps/nonrecursion, shared
  companion commands/buffs, shot snapshots, pause/reset, and dense hybrids.
- Dense 80-enemy dual-DoT testing exposed the former 256-event budget; the bounded
  budget is now 512, retaining six-generation depth and ancestry guards. No primary
  damage or death drops depend on processing a secondary event.
- Browser journeys cover complete supported Priest/Warlock builds and observe real
  healing cross geometry (not just pickup color), wards, holy attacks, curses,
  imp drawing, and detonations. Existing combat/input/progression checks remain.
- Inspected 56 source modules: no circular runtime imports. No new dependencies,
  external assets, accounts, paid services, or backend requirements.
- Runtime: Node 24.19.0, npm 11.9.0, system Chromium 154. README.md has commands.
  Browser tests start/stop their own production preview server.

## Remaining work and limits

- Tasks 8–17: persistent progression; enemy/boss variety; temporary synergies;
  presentation/audio; device polish; offline/PWA; balance;
  final regressions; release. Definitions alone are not completed talent content.
- No local saves/build slots, permanent unlocks, bosses, victory, or offline
  installation yet. Reloading resets this intermediate build.
- Only the starter enemy exists. Strong combinations can outpace it; full-run
  balance remains later work. Scenery is decorative; arena boundaries are solid.
- Physical Android/tablet hardware and other browser engines remain unverified.
  Emulation is not a hardware performance claim. Deployment is not configured.
- No current setup blockers or known failing checks.

## Milestone history

- Task 0: `90daca7`; task 1: `8332fcb`; task 2: `50cee85`.
- Modularity/art requirements: `93558f1`; refactor 2a: `851082a`.
- Task 3: leveling and run upgrades, `c10a1b7`.
- Task 4: classless talent framework and visual tree, `4462fd4`.
- Task 5: complete Warrior/Mage talents, shared melee/status/shield systems, and
  six-point hybrid builds, `d9eb89a`.
- Task 6: complete Rogue/Hunter talents, open hit rules, DoTs, companions, and
  eight-point supported builds, `c2c7237`.
- Task 7: complete Priest/Warlock branches and the full 36-talent catalog
  (this milestone).
