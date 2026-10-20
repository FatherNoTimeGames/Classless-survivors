# Classless Survivors — progress

## Current state

- Completed: tasks 0–5 and the separately requested modular refactor (2a).
- Playable: keyboard/touch movement, automatic combat, enemies, health, XP,
  leveling, seven randomized run upgrades, pause/resume, defeat, and restart.
- Task 5: all six Warrior and all six Mage talents function. Seventeen of the
  36 total talents are selectable; the other 19 remain explicit coming-soon previews.
  Every usable talent has a behavior test.
- New shared systems: automatic 120° melee cleaves, attributed triggered bolts,
  Frost/slows/stuns, nonstacking expiring shields, and shield-break events.
  Branch handlers add Spellsteel, Frostbreak/Shatterglass, Chain Spark, Iron/Mana
  Ward, Last Stand, and Riftweaver without growing the tick coordinator.
- Six temporary talent points allow a complete branch or a deep Frost/melee hybrid.
  Allocation validates availability, prerequisites, duplicates, and budget. Refunds
  cascade; respecs remain free. Permanent points/unlocks remain task 8.
- Original line icons and simple feedback communicate melee arcs, lightning,
  frozen/stunned enemies, and protection. The health line shows shield amount/time.
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
- Use the simplest readable original art: Canvas shapes, vectors, or limited-
  palette pixels. Reuse readable art; avoid elaborate asset-production work.
- Follow [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) for the complete checklist.

## Next task

**Task 6: Implement Rogue and Hunter talents.**

Wait for **continue**. Expose Weakness and Hunting Momentum already function.
Implement the remaining five talents in each branch: critical hits, Poison,
critical/DoT propagation, falcon companion, inheritance, snares/roots, and Wild Hunt.
Extend focused branch/shared systems, preserve attribution and effect bounds,
and only enable nodes when working. Test each talent and cross-branch combinations,
verify browser behavior, update docs, commit, and pause. See DEVELOPMENT_PLAN.md.

## Latest validation

- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run check` passed:
  **85 unit tests**, TypeScript checks, production build, and **20 browser tests**.
  No failed or skipped tests in the final run.
- Reviewed desktop/phone branch screenshots and the phone ward HUD; icons, names,
  descriptions, and the sticky Close control remain readable. Inspected all
  44 source modules: no circular runtime imports.
- Production output: approximately 48.31 kB JavaScript (16.64 kB gzip) and 9.25 kB
  CSS uncompressed. No new dependencies or external assets.
- Unit coverage includes every playable talent, build validation/refunds, direct vs
  triggered damage, Frost/melee hybrids and lethal consumption, shield absorption/
  expiration, stun protection, proc cooldowns, and bounded deterministic dense combat.
- Browser journeys cover both full branch allocations, real cleave/ward drawing,
  and the existing mixed builds, keyboard/touch, leveling, pause, defeat/restart,
  local assets, and layout checks across desktop/tablet/Android-sized viewports.
- Runtime: Node 24.19.0, npm 11.9.0, system Chromium 154. README.md has commands.
  Browser tests start/stop their own production preview server.

## Remaining work and limits

- Tasks 6–17: Rogue/Hunter and Priest/Warlock branch completion; permanent
  progression; enemy/boss variety;
  temporary synergies; presentation/audio; device polish; offline/PWA; balance;
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
  six-point hybrid builds (this milestone).
