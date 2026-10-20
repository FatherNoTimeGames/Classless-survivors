# Classless Survivors — progress

## Current state

- Completed: tasks 0–9, the modular refactor (2a), and the synergy pass (7a).
- Playable: keyboard/touch movement, automatic combat, health, XP, seven run
  upgrades, five enemy types, elites, escalating waves, pause/resume, defeat,
  persistent rewards, free respec, saved builds, and replay.
- Task 9: Grave Husks pursue; Gloom Skitters rush; Bone Archers hold range and
  shoot; Horned Brutes warn before straight charges; Mire Hexers warn before
  blight pools. Swift/stout elites have crown/frame/chevron cues, scaled stats,
  and 3× XP. Nine authored threat stages introduce and mix these enemies.
- Minimum spawn distance and grace remain. Locked warnings, four simultaneous
  windups, 24 hostile arrows, six spaced blight pools, and 80 enemies bound threat
  density. Stuns interrupt attacks; roots stop movement and interrupt charges,
  while rooted spellcasters can cast. Released attacks persist after caster death.
- Enemy construction, movement, intent, release/impact, tuning, and rendering have
  focused modules. A transient grid narrows friendly projectile/blast queries.
  All damage still uses shared shields, health-loss talents, and invulnerability.
- All 36 talents function across six freely mixed branches. Thirty start unlocked;
  research unlocks the six capstones. Original icons, prerequisites, tooltips,
  cascading refunds, and inexpensive readable procedural effects remain.
- Permanent progression starts with 8 points and 2 insight. Finish 2 and 5 runs
  for points 9 and 10. Capstones cost 1 insight. Even instant defeats earn insight
  while research credits remain; survival adds bonuses. There are no permanent
  combat-stat purchases. Respecs retain research and cost nothing.
- Three named build slots preserve snapshots; draft edits/research autosave.
  Version-2 local saves validate bounds, prerequisites, research, and budgets.
  Early version-1 saves migrate; damaged builds can be repaired independently.
  Damaged core data falls back to the previous save; newer formats are preserved.
- Backups support JSON download/copy and reviewed file/text restoration. Invalid
  imports retain current state. Storage failures leave in-memory play/export
  available with a notice. Progress is local to the browser and site origin.
- A saved run identity is consumed with its reward in one profile write. Repeated
  claims and stale identities are rejected. Reloads discard unfinished combat
  without a reward and retain completed progress/builds.
- Permanent rules, codec, injected storage, browser adapter, and profile UI remain
  separate from simulation. Runs receive a talent snapshot and earned budget.
- Haste, projectile upgrades, and refunds share inheritance rules. Delayed bolts
  retain proc ancestry; companion blasts retain ownership. Spellsteel has a 0.25s
  volley limit and retains charged hits when targets/space are unavailable.
  See [SYNERGY_AUDIT.md](SYNERGY_AUDIT.md) for the earlier review and exclusions.

## Standing requirements

- Complete one authorized task, validate, update this log, commit, report, and
  pause until **continue**. Make ordinary design decisions independently.
- Keep focused modules, typed boundaries, and explicit state ownership. Simulation
  stays browser-independent; run.ts coordinates systems. See AGENTS.md and README.md.
  Avoid unnecessary frameworks and runtime dependencies.
- Prefer open talent triggers, explicit companion inheritance, and bounded effects.
  Descriptions must match behavior. See AGENTS.md.
- Use inexpensive original art: Canvas shapes, vectors, or limited-palette pixels.
  Reuse readable assets. Follow DEVELOPMENT_PLAN.md for the complete checklist.

## Next task

**Task 10: Complete the timed run and boss encounters.**

Wait for **continue**. Add three bosses with distinct telegraphed positioning
mechanics across the 15-minute run, including the final encounter. Integrate
boss pacing with existing waves, safe spawns, statuses, and capped hazards.
Add victory, result summaries, rewards, and return to build planning for either
outcome. The profile reward boundary already accepts victory; combat snapshots
remain session-only. Keep boss/content/phase logic modular, test transitions and
rewards, exercise bosses in the browser, document, commit, and pause. Expanded
upgrades and full-run balancing remain tasks 11 and 15.

## Latest validation

- `npm test`: **538 unit tests passed**, including 33 enemy/spatial cases. New
  checks cover range behavior, fixed aim, warnings, charge collision/scaling/root
  interruption, blight lifetimes, spawn grace, corner escapes, wave introductions,
  elite status/XP, pause/reset, and entity/effect bounds.
- Three legal seeded hybrids (Priest/Warrior, Warlock/Priest, Mage/Priest) survive
  three minutes, gather XP, encounter every enemy and both elites, and trigger
  every warning family with no dropped secondary effects. Dense 80-enemy combat
  remains deterministic with reversed talent allocation order.
- `npm run build`: TypeScript and production build passed. Output: approximately
  88.01 kB JavaScript (29.15 kB gzip), 10.24 kB CSS, and 9.03 kB HTML.
- Full `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser`:
  **41 cases passed** across desktop, tablet, and Android portrait emulation.
  After the final elite charge/root correction, all **3 enemy-browser cases
  passed again** against the rebuilt app. No final failed or skipped cases.
- The enemy browser journey uses a legal mixed build and real upgrade choices;
  it observes all five silhouettes, every warning family, active arrows/blight,
  elite crowns, and paused combat. Existing talent, save/recovery, leveling,
  keyboard/touch, defeat, and reward journeys remain passing.
- The old idle defeat test assumed XP would approach a stationary player. Ranged
  foes keep their distance; the test now collects visible shards before checking
  defeat/rewards/restart. It retains its XP and persistence assertions.
- Reviewed desktop and phone mixed-wave screenshots: warnings, silhouettes, elite
  cues, player position, health, and wave text remain readable without horizontal
  overflow. Physical hardware and other browser engines remain unverified.
- One Node 24 sample held 80 mixed elites at high HP with maximum projectile
  upgrades for 600 ticks/sample (2 warmups, 5 measured samples). Median sample-
  average cost: **0.040 ms/tick**, range **0.035–0.046 ms/tick**. All 80 remained;
  peak hostile arrows/pools were 7/2; no effects dropped. This excludes rendering
  and does not establish mobile or full-run performance.
- Inspected 72 TypeScript source modules: no runtime import cycles. No new
  dependencies, external assets, accounts, paid services, or backend needs.
  Runtime: Node 24.19.0, npm 11.9.0, Chromium 154. Tests manage their preview server.

## Remaining work and limits

- Tasks 10–17: bosses/victory; expanded temporary hybrid upgrades; presentation/
  audio; device polish; offline/PWA; full-run balance/performance; release checks.
- No timed ending or bosses yet. Enemy variety and initial wave pacing are
  complete; full-length balance, performance, and boss integration remain.
- Combat runs are not restored after closure/reload. Clearing site data or changing
  browser/device/origin needs an exported backup. Failed writes require exporting
  in-memory progress. Scenery remains decorative; boundaries are solid.
- No offline installation or configured deployment yet. Android/tablet hardware
  and other browser engines are unverified; emulation does not prove hardware speed.
- No current setup blockers or known failing checks.

## Milestone history

- Task 0: `90daca7`; task 1: `8332fcb`; task 2: `50cee85`.
- Modularity/art requirements: `93558f1`; refactor 2a: `851082a`.
- Task 3: leveling/run upgrades, `c10a1b7`.
- Task 4: classless framework/tree, `4462fd4`.
- Task 5: Warrior/Mage, `d9eb89a`; task 6: Rogue/Hunter, `c2c7237`.
- Task 7: Priest/Warlock and 36 functioning talents, `b20621d`.
- Task 7a: synergy audit, `69b8928`; task 8: persistent progression/builds, `5af9114`.
- Task 9: enemy variety, elites, waves, warnings, spatial queries, and regressions
  (this milestone).
