# Classless Survivors — progress

## Current state

- Completed: tasks 0–10, modular refactor 2a, and synergy pass 7a.
- Playable: keyboard/touch movement, automatic combat, health, XP, seven run
  upgrades, five enemy types, elites, escalating waves, three guardians, pause,
  victory/defeat, persistent rewards, free respec, saved builds, and replay.
- Task 10 adds a complete **15-minute campaign**. Guardians arrive at 4:00,
  9:00, and 14:00. Victory requires defeating all three and surviving until
  15:00. Health loss ends a run immediately; remaining guardians at dawn cause
  a deadline defeat. Pauses and level choices stop the run clock.
- Ossuary Knight warns before forward sweeps/long cleaves; Veil Matron alternates
  fan bolts and rings with safe centers; Night Sovereign marks crossed lanes,
  pools, and radial volleys. Locked geometry, dashed/solid outlines, silhouettes,
  a guardian health/advice panel, and a dawn countdown communicate each mechanic.
  Recovery shortens below half health; warnings keep their duration.
- Arrivals banish old threats without free kill credit and use safe positioning
  with 1.5s grace. Encounters suppress ordinary waves and introduce up to six
  husk/skitter reinforcements, preserving kill/healing/DoT/multi-target triggers.
  Guardian defeat drops XP, clears encounter threats, restores 25% max health
  through shared healing, and grants a five-second respite before waves resume.
- Bosses retain shared damage, crits, marks, DoTs, companion ownership, Frost,
  slows, shields, and retaliation. Resolve resists additional stuns/roots for
  three seconds after a successful hard control. Frost-consumption damage and
  Frost Trap's Frost still work during Resolve; descriptions explain this.
- Both endings freeze combat and pending choices, show results/final builds,
  save their one-time profile reward, and offer replay or build planning. A
  final-tick friendly guardian kill resolves before hostile impacts. Existing
  defeated runs cannot become victories. Result panels scroll on small screens.
- Guardian tuning/state, scheduling/AI, warning patterns, danger geometry/impact,
  completion rules, hard control, artwork, HUD, and results have focused modules.
  run.ts remains the coordinator; simulation has no browser dependencies.
- All 36 talents function across six freely mixed branches. Thirty start
  unlocked; research unlocks six capstones. Visual prerequisites, tooltips,
  cascading refunds, original icons, and free between-run respecs remain.
- Permanent progression starts at 8 points/2 insight; runs 2/5 grant points 9/10.
  Research costs 1 insight per capstone. Even instant losses earn research credit
  while needed; survival/victory add bounded bonuses. No permanent stat purchases.
- Three named build slots, autosaved drafts/research, validated version-2 saves,
  version-1 migration, previous-save recovery, storage-failure notices, and
  reviewed JSON backup import/export remain. Durable run identities prevent
  repeat/stale reward claims. Reloads discard unfinished combat without reward.
- Five normal behaviors and swift/stout elites remain. Safe edge spawns, fixed
  warnings, four ordinary windups, 24 hostile bolts, six blight pools, eight
  guardian dangers, 80 enemies, spatial queries, and bounded talent effects limit
  pressure and entity counts. Shared haste/projectile/proc-ancestry rules remain;
  see SYNERGY_AUDIT.md for inheritance and exclusions.

## Standing requirements

- Complete one authorized task, validate, update this log, commit, report, and
  pause until **continue**. Make ordinary design decisions independently.
- Keep focused modules, typed boundaries, and explicit state ownership. Simulation
  stays browser-independent; run.ts coordinates systems. See AGENTS.md and README.md.
- Prefer open talent triggers, explicit companion inheritance, and bounded effects.
  Descriptions must match behavior. No unnecessary frameworks or runtime dependencies.
- Use inexpensive original art: Canvas shapes, vectors, or limited-palette pixels.
  Reuse readable assets. Follow DEVELOPMENT_PLAN.md for the complete checklist.

## Next task

**Task 11: Deepen temporary upgrades and hybrid builds.**

Wait for **continue**. Expand useful run upgrades across all ability families and
add temporary cross-branch synergies. Include readable ability/build summaries
and sensible fallback offers. Preserve narrow/mixed builds, shared inheritance,
and bounded proc rules. Test retaliation, frost/melee, critical/DoT, healing/offense,
and summons against ordinary waves and bosses. Address the initial seven-upgrade,
level-20 pool exhausting early in full runs. Broader full-run balancing remains
task 15. Validate, document, commit, and pause; do not begin task 12 automatically.

## Latest validation

- `npm test`: **564 unit tests passed** across 15 files, including 26 campaign/
  guardian cases. Checks cover schedules, safe arrivals/corners, warning geometry
  and dodges (including released bolts), Resolve, retained Frost, roots/casts,
  interrupts, enlarged collision, shields/retaliation, DoT/companion kills, adds,
  caps, healing breaks, pause/reset, deadline ordering, frozen outcomes, and
  exactly-once profile rewards. Existing talent/progression/save checks pass.
- Two legal seeded eight-point Mage/Priest hybrids complete all **900 seconds**,
  encounter/defeat all three guardians, gather XP, and earn their upgrades from
  real ticks. No injected health, damage, ranks, kills, or clock jumps; no dropped
  effects. This demonstrates those builds' winnability, not comprehensive balance.
- `npm run build`: TypeScript and production build passed. Output: approximately
  **98.68 kB JS (32.85 kB gzip), 10.92 kB CSS, 10.40 kB HTML**. Final test edits
  also pass `npm run typecheck` and `git diff --check`.
- Full Chromium regression run: **43 passed, 1 tablet touch fixture failed**.
  Pointer tracing identified a full-page screenshot resizing the taller page
  mid-drag, intentionally clearing capture through the existing resize handler.
  The fixture now captures the viewport during that gesture. Both affected touch
  cases then passed (**2/2**, tablet and Android portrait). Across these checks,
  all **44 distinct browser cases** have passing results; none remain unresolved.
- Full guardian journeys passed on desktop, tablet, and portrait-phone emulation:
  allocate/research a mixed build, choose real upgrades, see all guardian art and
  warning/active danger drawing, pause a boss, win, save rewards, inspect results,
  respec, reload, and start fresh without duplicated rewards. Only RAF timestamps
  are accelerated (12×); the pilot sends keys using visible HUD time. This is
  functional validation, not a real-time or device-performance benchmark.
- Reviewed desktop/tablet/phone guardian/result screenshots. Health/advice,
  silhouettes, lane warnings, and result actions are readable without horizontal
  overflow. Active touch tests retain second-finger, release/cancel, and no-scroll
  assertions. Physical hardware and other browser engines remain unverified.
- Inspected **82 TypeScript source modules: no runtime import cycles**. No new
  dependencies, external assets, accounts, paid services, or backend requirements.
  Existing Node 24.19.0/npm 11.9.0/Chromium 154 setup works; no setup changes needed.

## Remaining work and limits

- Tasks 11–17: expanded temporary hybrid upgrades; presentation/audio; device
  polish; offline/PWA; full-run balance/performance; regressions and delivery.
- Initial upgrades can reach level 20 before the first guardian. Task 11 must
  improve temporary variety/pacing. Full-run balance across other archetypes is
  not established; simple scripted Priest/Warrior and Warlock/Priest routes lost
  in mid-run waves. Broader build viability remains tasks 11 and 15.
- Task 9's bounded 80-enemy Node microbenchmark excludes rendering; no new hardware
  or full-run performance claim is made. Visible XP/effect density needs the
  planned presentation and performance passes.
- Combat runs are not restored after closure/reload. Clearing data or changing
  browser/device/origin needs an exported backup. Failed writes require exporting
  in-memory progress. Scenery remains decorative; boundaries are solid.
- No offline installation or configured deployment yet. Android/tablet hardware
  and other browser engines remain unverified. No unresolved failing checks or
  setup blockers remain after the touch-fixture correction.

## Milestone history

- Task 0: `90daca7`; task 1: `8332fcb`; task 2: `50cee85`.
- Modularity/art requirements: `93558f1`; refactor 2a: `851082a`.
- Task 3: leveling/run upgrades, `c10a1b7`; task 4: tree/framework, `4462fd4`.
- Task 5: Warrior/Mage, `d9eb89a`; task 6: Rogue/Hunter, `c2c7237`.
- Task 7: Priest/Warlock and 36 functioning talents, `b20621d`.
- Task 7a: synergy audit, `69b8928`; task 8: persistent progression, `5af9114`.
- Task 9: enemy variety, elites, waves, and spatial queries, `19e3dce`.
- Task 10: timed campaign, guardians, victory/results, and progression loop
  (this milestone).
