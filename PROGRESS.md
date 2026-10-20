# Classless Survivors — progress

## Current state

- Completed: tasks 0–8, the modular refactor (2a), and the talent/upgrade synergy pass (7a).
- Playable: keyboard/touch movement, automatic combat, health, XP, seven run upgrades,
  pause/resume, defeat, persistent rewards, free respec, saved builds, and replay.
- All 36 talents function across six freely mixed branches. Thirty start unlocked;
  research unlocks the six capstones. Original icons, connected prerequisites,
  tooltips, cascading refunds, and readable procedural combat effects remain.
- Permanent progression starts with 8 points and 2 insight. Finish 2 and 5 runs to
  earn points 9 and 10. Each capstone costs 1 insight. Even an instant defeat earns
  insight while research credits remain; survival adds bonuses. Rewards stop when
  all research can be afforded. There are no permanent combat-stat purchases.
- Three named build slots preserve allocation snapshots. Draft edits and research
  autosave. Loading/respeccing a build leaves its saved slot/unlocks intact.
- Local version-2 saves validate bounds, prerequisites, research, and budgets. An
  early version-1 format migrates. Invalid individual builds can be repaired while
  keeping progression. Damaged core data falls back to the previous valid save;
  incompatible newer formats are preserved while play uses a temporary profile.
- Backup export downloads JSON and exposes copyable text. File/text imports are
  validated and previewed before replacement. Invalid imports retain current state.
  Storage failures leave gameplay/export available in memory with a visible notice.
- A run identity persists before combat; finishing consumes it with the reward in
  one profile write. Repeat claims and stale identities are rejected. Reloads
  discard unfinished combat without a reward and retain completed progress/builds.
- Pure permanent rules, content tuning, save codec, injected storage/recovery,
  browser adapter, and profile UI are focused modules. Simulation receives a
  validated talent snapshot/budget and never accesses browser storage.
- The synergy pass shares haste, projectile upgrades, and refunds across eligible
  attack families. Delayed bolts retain proc ancestry; companion blasts retain
  ownership. Spellsteel has a 0.25s volley limit and charged-hit retention.
  See [SYNERGY_AUDIT.md](SYNERGY_AUDIT.md) for the earlier review and exclusions.

## Standing requirements

- Complete one authorized task, validate, update this log, commit, report, and
  pause until **continue**. Make ordinary design decisions independently.
- Keep systems modular with typed boundaries and explicit state ownership.
  Simulation stays browser-independent; run.ts coordinates systems. See AGENTS.md
  and README.md's module map. Avoid extra frameworks and runtime dependencies.
- Prefer open talent triggers across branches, with explicit companion inheritance
  and bounded effects. Descriptions must match behavior. See AGENTS.md.
- Use inexpensive readable original art: Canvas shapes, vectors, or limited-palette
  pixels. Reuse readable assets; avoid elaborate asset-production work.
- Follow [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) for the complete checklist.

## Next task

**Task 9: Expand enemy variety, elites, and wave pacing.**

Wait for **continue**. Add distinct pursuers, ranged attackers, chargers, and
area-denial behaviors, elite modifiers, safe spawn pacing, and readable warnings.
Use focused enemy/content/attack modules and appropriate spatial queries/caps for
large waves. Test movement/attack behaviors and avoid unavoidable spawn/contact
hits. Preserve talents, projectile ownership, status interactions, saves, and the
portrait controls. Bosses and the timed victory loop remain task 10. Document,
validate, commit, and pause.

## Latest validation

- `npm test`: **505 unit tests passed**. The 29 profile cases cover bounded rewards,
  early-loss progression, research, ten-point builds, slots, identity consumption,
  migrations, validation/repair, fallback recovery, storage failures, imports, and
  stale-tab writes. The ten-point combat case was strengthened and all 29 profile
  tests passed again afterward. Existing combat and synergy checks remain passing.
- `npm run build`: TypeScript checks and production build passed. Final output:
  approximately 78.10 kB JavaScript (25.94 kB gzip), 10.07 kB CSS, 8.10 kB HTML.
- Full `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser`:
  **38 browser tests passed** across desktop, tablet, and Android portrait emulation.
  After final legacy-import/validation-message improvements, all **6 profile browser
  cases passed again** against the rebuilt production app. No final failed/skipped cases.
- Browser journeys cover build snapshots across reloads, research surviving respec,
  JSON download/file restore, rejected invalid imports, version-1 migration, earned
  larger builds, corrupted-save fallback, preservation of newer saves, and disabled
  storage with working play/export. Real defeat/restart journeys verify persisted
  rewards, fresh run identities, and no reward for an unfinished reload.
- Reviewed portrait-phone talent/research rendering and the expanded profile layout.
  Controls/text remain readable; no horizontal overflow. Touch, keyboard, and earlier
  combat feedback journeys pass. Physical hardware and other engines are unverified.
- Inspected 63 TypeScript source modules: no runtime import cycles. No new dependencies,
  external assets, accounts, paid services, or backend requirements.
- Runtime: Node 24.19.0, npm 11.9.0, system Chromium 154. Browser tests manage their
  own preview server. README.md documents play, saves, backup/recovery, and commands.

## Remaining work and limits

- Tasks 9–17: enemy/wave variety; bosses/victory; more temporary hybrid upgrades;
  presentation/audio; device polish; offline/PWA; full-run balance/performance;
  release regressions and delivery.
- Combat runs are not restored after closing/reloading. Permanent progress/builds
  persist locally; clearing site data or using a different origin/browser/device
  needs an exported backup. Failed local writes require exporting in-memory progress.
- Only the starter enemy exists. Strong builds can outpace it; full-run balance
  and performance are later work. Scenery is decorative; boundaries are solid.
- No bosses, victory, offline installation, or configured deployment yet. Physical
  Android/tablet hardware and other browser engines remain unverified. Emulation
  does not establish hardware performance.
- No current setup blockers or known failing checks.

## Milestone history

- Task 0: `90daca7`; task 1: `8332fcb`; task 2: `50cee85`.
- Modularity/art requirements: `93558f1`; refactor 2a: `851082a`.
- Task 3: leveling/run upgrades, `c10a1b7`.
- Task 4: classless framework/visual tree, `4462fd4`.
- Task 5: complete Warrior/Mage talents and shared combat systems, `d9eb89a`.
- Task 6: complete Rogue/Hunter talents, DoTs, companions, and roots, `c2c7237`.
- Task 7: complete Priest/Warlock and all 36 functioning talents, `b20621d`.
- Task 7a: talent/upgrade synergy audit and regressions, `69b8928`.
- Task 8: bounded persistent progression, research, saved builds, validated local
  saves, recovery, and backup import/export (this milestone).
