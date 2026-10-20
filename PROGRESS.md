# Classless Survivors — progress

## Current state

- Completed: tasks 0–7, the modular refactor (2a), and the talent/upgrade synergy pass (7a).
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
  and explicit Pack Link inheritance; live projectiles snapshot upgrades, damage,
  ownership, and proc ancestry.
- Synergy pass (7a): haste affects all automatic attackers; fork/piercing/blasts
  affect ember, Spellsteel, and imp volleys. Physical/fire triggers cover compatible
  retaliation, explosions, and linked companions. Riftweaver refunds all attack
  timers. Shared timing and volley modules keep inheritance rules centralized.
- Spellsteel has a 0.25s volley limit and retains charged hits when no target or
  projectile slot is available. Delayed projectiles preserve proc ancestry, and
  companion explosions retain ownership. The existing event budgets are unchanged.
  See [SYNERGY_AUDIT.md](SYNERGY_AUDIT.md) for the review and intentional exclusions.
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

- `npm test`: **476 unit tests passed**, including 288 catalog/upgrade sweep cases,
  focused cross-branch regressions, and six 80-enemy hybrids at maximum upgrade ranks.
- `npm run build`: TypeScript checks and production build passed.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser`:
  **32 browser tests passed**. No failed or skipped cases in the final runs.
- Each catalog sweep uses a legal prerequisite build, each upgrade at its cap plus
  all maximum ranks, and reversed allocation order. These short routes verify real
  damage, deterministic results, finite state, entity bounds, and no dropped effects;
  they do not establish exhaustive pair coverage or full-run balance.
- Targeted checks cover melee/companion haste, timer progress, inherited fork/pierce/
  splash, companion blast ownership/Pack Link, fire counters, ward/refund triggers,
  Frost/physical companions, Living Ember healing, Soul Link volley snapshots,
  Sanctuary actual/excess healing, delayed ancestry, and Spellsteel charge limits.
- Reviewed tablet and portrait-phone screenshots of the longer Spellsteel tooltip;
  text remains readable and Close stays reachable. Existing combat, input, and
  progression journeys pass across all three viewport profiles. Physical hardware
  and other browser engines remain unverified.
- Production output: approximately 66.36 kB JavaScript (21.92 kB gzip) and 9.25 kB
  CSS uncompressed. Inspected 57 source modules: no circular runtime imports.
- Dense Spellsteel/maximum-upgrade testing exposed area-hit projectile fan-out.
  The new volley cooldown fixed the failing workload without raising the existing
  512-event limits. Tested dense hybrid routes drop no secondary events. Deliberate
  hostile fan-out/depth tests still verify that the safety caps reject excess work.
- No new dependencies, external assets, accounts, paid services, or backend needs.
  Runtime: Node 24.19.0, npm 11.9.0, system Chromium 154. README.md has commands.
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
- Task 7: complete Priest/Warlock branches and the full 36-talent catalog, `b20621d`.
- Task 7a: separately requested synergy audit, shared upgrade inheritance, open
  triggers, bounded delayed effects, and catalog/hybrid regressions (this milestone).
