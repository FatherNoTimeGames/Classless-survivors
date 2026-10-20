# Classless Survivors — progress

## Current state

- Completed: tasks 0–6 and the separately requested modular refactor (2a).
- Playable: keyboard/touch movement, automatic combat, enemies, health, XP,
  leveling, seven randomized run upgrades, pause/resume, defeat, and restart.
- Task 6: all six talents function in Warrior, Mage, Rogue, and Hunter. Twenty-seven
  of 36 total talents are selectable; nine Priest/Warlock previews remain unavailable.
  Every usable talent has behavior coverage.
- Open Rogue/Hunter triggers work across weapon, spell, blast, and retaliation hits.
  Companion hits share critical cadence and critical procs; Pack Link adds wound
  bonuses, Poison, Frost, snares, and roots. Any kill can supply Hunting Momentum.
- Shared systems now include critical/wound hit modifiers, nonstacking periodic
  effects with stable tick clocks and lethal snapshots, critical spreading/pulses,
  owned falcon targeting/commands, capped snare zones, and per-enemy root immunity.
- Eight temporary points permit full branches with supporting pairs. Permanent
  points/unlocks remain task 8. Prerequisites, budgets, cascading refunds, and
  free respecs remain enforced. Allocation order does not change handler order.
- Readable line icons, bird silhouettes, poison marks, critical stars, snare circles,
  and root bars use the existing original programmatic art approach.
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

**Task 7: Implement Priest and Warlock talents.**

Wait for **continue**. Ember Communion, Searing Grace, and Soul Cinder already work.
Complete the remaining nine talents: shard healing, marks/atonement, overheal
shields/absorption reactions, curses/detonations, imp inheritance, Soul Link, and
Harvest. Reuse the generic DoT and companion systems. Keep new triggers open across
branches where practical; document attribution/inheritance and prevent proc loops.
Keep all 36 descriptions accurate, test every new talent and hybrid behavior,
validate browser flows, update docs, commit, and pause.

## Latest validation

- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run check` passed:
  **119 unit tests**, TypeScript checks, production build, and **26 browser tests**.
  No failed or skipped tests in the final run.
- Reviewed desktop/tablet/phone talent and combat screenshots. Icons, tooltips,
  Close, snare zones, and the falcon remain readable at phone sizes.
- Production output: approximately 56.92 kB JavaScript (19.34 kB gzip) and 9.25 kB
  CSS uncompressed. Physical Android hardware and other engines remain unverified.
- Unit coverage includes all usable talents, lethal snapshots/spreading, final DoT
  ticks before expiration, curse-compatible healing, shared critical cadence,
  periodic exclusions, kill attribution, companion targeting/inheritance, roots,
  snare caps, cooldowns, pause/reset, and allocation-order-independent dense builds.
- Cross-branch cases include Priest healing from expired effects, Falcon Frost into
  Shatterglass, and simultaneous melee shattering/rooting of the same slowed foe.
- Browser flows cover full branches with supporting talents and actual falcon,
  Poison, critical, snare, and Frost drawing, plus existing input/level/run journeys.
  Combat-feedback tests now fix the normal run seed after an earlier random-layout
  run missed shield contact; the test still requires real combat/drawing.
- Falcon positions remain within visible arena bounds while following/striking.
- Inspected 51 source modules: no circular runtime imports. No new dependencies,
  paid services, external assets, or backend requirements.
- Runtime: Node 24.19.0, npm 11.9.0, system Chromium 154. README.md has commands.
  Browser tests start/stop their own production preview server.

## Remaining work and limits

- Tasks 7–17: Priest/Warlock branch completion; permanent progression;
  enemy/boss variety; temporary synergies; presentation/audio; device polish; offline/PWA; balance;
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
  eight-point supported builds (this milestone).
