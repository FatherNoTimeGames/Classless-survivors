# Classless Survivors — progress

## Current state

- Completed: tasks 0–4 and the separately requested modular refactor (2a).
- Playable: keyboard/touch movement, automatic combat, enemies, health, XP,
  leveling, seven randomized run upgrades, pause/resume, defeat, and restart.
- Task 4: six-branch connected talent trees with all 36 designs. Seven talents
  are functioning/selectable; 29 coming-soon previews are inspectable but cannot
  be allocated. Availability is explicit in the UI and validated in simulation.
- Playable talents: Iron Reprisal, Arcane Echo, Expose Weakness, Ember Communion,
  Searing Grace, Soul Cinder, and Hunting Momentum. All have behavior tests.
- Three initial points may be mixed freely across branches. Prerequisites,
  duplicate/unknown/unavailable selection, and budgets are validated. Refunds
  cascade through dependents; full respecs are free. Editor is available before
  runs and after defeat, with keyboard/touch inspection and a sticky Close control.
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

**Task 5: Implement Warrior and Mage talents.**

Wait for **continue**. Iron Reprisal and Arcane Echo already function; implement
and test the remaining five talents in each branch, updating availability only
when behavior is working. Add melee/elemental attacks, Frost/physical interactions,
shields/retaliation, and readable symbols/effects matching descriptions. Extend
branch modules and shared damage/healing/event boundaries; keep the coordinator
small. Revisit the three-point starter budget as deeper paths become playable,
while keeping a bounded budget and leaving permanent unlock progression for task 8.
Test each talent and melee/caster hybrids, document, commit, and pause.

## Latest validation

- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run check` passed:
  **66 unit tests**, TypeScript checks, production build, **17 browser tests**.
  No failed or skipped tests in the final run.
- Talent coverage: catalog completeness/acyclic prerequisites, mixed allocation,
  invalid/over-budget/planned selections, cascading refunds, build snapshots,
  proc reset, all seven effects, overheal/fatal protection, upgrade-healing hooks,
  Warrior/Rogue and Priest/Rogue interactions, and direct-vs-triggered kill rules.
- Effect tests cut recursive chains, bound unique-handler depth and fan-out,
  preserve the shared per-tick budget across drains, reject recursive draining,
  and restore queue context after handler errors. Existing progression/combat
  regressions still pass.
- Browser flows inspect all six branches using keyboard and touch, inspect locked
  previews, allocate a real prerequisite/child pair, refund both together, enforce
  points, respec, and start a three-branch build. Desktop/tablet/Android portrait
  pass alongside leveling, pause/focus, multi-touch, defeat/restart, and shell tests.
- Reviewed desktop and phone talent screenshots; Close remains visible when the
  phone editor scrolls. Inspected 39 source modules: no circular runtime imports.
- Current output: approximately 40.76 kB JavaScript and 9.12 kB CSS uncompressed.
- Runtime: Node 24.19.0, npm 11.9.0, system Chromium 154. README.md has commands.
  Browser tests start/stop their own production preview server.

## Remaining work and limits

- Tasks 5–17: remaining branch talents; permanent progression; enemy/boss variety;
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
- Task 4 commit: `feat: add classless talent framework and visual tree` (this milestone).
