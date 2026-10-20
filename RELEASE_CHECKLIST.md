# Release regression and delivery evidence — tasks 16–17

Checked on 2026-10-20 with Node 24.19.0, npm 11.9.0 and Chromium
154.0.8037.57 in the managed Linux workspace. Task 16 checks the playable game and
fixes release blockers. Task 17 packages and verifies the delivered 1.0.0 release.

## User completion criteria

| Required journey | Evidence |
| --- | --- |
| Open the game in a browser | Production shell/Canvas tests, local assets, responsive desktop/tablet/portrait layouts; PWA tests also exercise a subdirectory host. |
| Create a build using multiple branches | Talent editor journeys cover all six tabs, prerequisites, refunds, free respec, research, named builds and earned budgets. |
| Start a survival run | Keyboard/touch journeys start ordinary runs. Repeated-start checks verify reset health, XP, level and a single animation loop. |
| Move, fight, level and choose upgrades | Real rendered player/pickup navigation, combat effects, native upgrade dialogs, pause/focus recovery and valid earned choices. |
| Meet different enemies and bosses | Mixed-wave journeys observe all five enemy kinds, elites and hostile warnings. Full campaigns observe all three guardian bodies and mechanics. |
| Win or lose a run | Seeded 900-second campaigns finish with all three guardians defeated; separate ordinary health defeats, deadline and simultaneous-ending tests exercise losses. |
| Return to progression | Results/rewards appear, run identity is consumed once, researched talents and bounded point milestones remain durable. |
| Modify a build and replay | Full campaign journeys respec, reload and replay offline. New migration journeys finish three defeats, earn the tenth point and start a different three-branch build. |
| Close and return with progress | Native Chromium process shutdown/relaunch uses a persistent on-disk profile with networking disabled. Saves, settings, movement and leveling survive; unfinished combat is deliberately discarded without reward. |

The full production browser suite exercises desktop 1280×900, touch tablet
768×1024 and touch/mobile portrait 390×844 (DPR 2). Browser time is accelerated
in long journeys, while movement, attacks, XP, choices, results and saves follow
the normal application/UI. Combat state is not injected in these journeys.
Backups, malformed/future saves and denied browser APIs are explicit fixtures.

## Talent, combat and lifecycle coverage

- Existing behavioral tests assert the working effects of all **36 talents**,
  including each branch's capstone, companion ownership/inheritance, healing vs
  overhealing, final periodic ticks, lethal Frost/mark consumption and bounded
  recursive procs. Tests cover all **20 run upgrades**, their eligibility and
  their effects on actual combat. Descriptions use the same authored tuning.
- The existing catalog sweep runs every talent with prerequisites against every
  upgrade and all maximum ranks. Dense hybrid cases and full campaigns remain.
- New `tests/release-combat.test.ts` exercises **525 affordable cross-branch pairs**
  with prerequisites, covering every talent. Fifteen pairs of two complete
  capstones require twelve points and exceed the ten-point ceiling. Each legal
  pair receives 39 ranks via valid offer/selection logic and runs with both saved
  talent-list orders. It compares complete non-talent state, verifies damage/kills,
  finite health/status data, empty drained queues and finite entity/proc budgets.
- That pair sweep is a **two-second synthetic fixture**, with injected XP/foes,
  starting DoTs/Frost/marks, ward break, damage and healing. It is not a full-run
  win-rate test or evidence that every possible build/choice sequence is balanced.
- New `tests/release-soak.test.ts` plays **12 real sequential runs** through one
  profile/storage port, reloading after every outcome. All use seed 42 with varied
  builds and earned budgets; this targets lifecycle stability. Research, slots and point
  budgets follow actual progression; run XP/ranks/health/timeline are not injected.
  Eleven victories and one health defeat total about **9,965 simulated seconds**
  (2h 46m). All outcomes survive serialization/reload exactly once.
- The soak also discards an interrupted identity without rewards, earns all
  research and ten points, checks fresh run-owned state, proves old runs remain
  unchanged while later ones play, and verifies finished combat stays frozen.
  Normal campaigns have zero dropped effects and bounded queues/entities.
- New `e2e/release.spec.ts` migrates an early save on boot, saves a named build,
  finishes three ordinary defeats/restarts offline, verifies the 9→10 point
  milestone, respecs, moves with a different build and reloads an unfinished
  replay. Observed pending RAF callbacks peak at one and return to zero on each
  finish. The case runs on all three viewports.

This is accelerated logic/lifecycle testing, not hours of physical-device
endurance testing or a claim that all allocations/upgrade sequences were explored.

## Reproduced defects and fixes

The save failures were reproduced before correcting production code:

| Trigger | Observed defect | Fix and regression |
| --- | --- | --- |
| Two tabs load a future-version save; one restores a backup, then the older tab imports its reviewed backup. | The older session bypassed the stale check and overwrote newer progress. | Explicit imports now check the current stored payload even when ordinary saving is blocked by a future save. Unit and real two-tab UI tests preserve the newer primary and the original recovery payload. |
| The pre-write storage read throws while writes still work. | A write could succeed without checking whether stored progress had changed. | Continue in memory, mark the session nondurable and show the export reminder. Unit cases cover ordinary changes and imports while preserving the existing durable primary. |
| A valid local save has the maximum allowed revision and is edited or rewarded. | Incrementing the counter wrote a revision the loader rejected. | Saturate at the shared valid ceiling. Stale checks still compare the complete raw payload. Tests edit, begin/finish a run, reload and reject a duplicate reward at the ceiling. |

The fixes stay inside the injected storage/codec boundary and shared legacy limits.
No save-format version, combat balance, talent behavior, runtime dependency or
lockfile changes were needed. A failed pre-write read keeps the current page
playable and exportable; normal saving resumes by reopening after access recovers.

The first full browser run passed 93/94 cases and exposed an offline-client race
on Android emulation. The old shell remained playable, but a successful status
reply from it could erase the failure notice for a newer download. A deterministic
event-order fixture reproduced that failure. The client now retains the failed-
download notice until a retry or successful installation clears it.

That review also reproduced an initial-download retry that did nothing when
registration had no active worker. Cache/update retries now register again in
that state. A new native browser case deliberately corrupts only the worker's
initial CSS download, restores correct bytes, retries, reloads offline and moves
the player. Both client regressions and all five targeted Android PWA cases pass.
The test server now closes its own retained worker connections during teardown,
so failed assertions cannot be hidden behind a hanging server shutdown.

The welcome/help text still named the pre-balance 14:00 final guardian. Both
locations now show 13:30; browser checks compare both descriptions with the
authored guardian schedule. Combat timing itself is unchanged.

## Executed checks

```sh
npm test -- tests/release-profile.test.ts tests/profile.test.ts
npm test -- tests/release-combat.test.ts
npm test -- tests/release-soak.test.ts
npm test -- tests/offline-client.test.ts tests/offline.test.ts
npm run build
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser -- e2e/release.spec.ts --project=desktop
npm test -- --disableConsoleIntercept
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser
```

The targeted checks passed. Final unit regression: **1,647 passed in 24 files**;
console interception is disabled only to show the soak totals. TypeScript and
production generation pass. Production assets total approximately 126.31 kB JS
(42.14 kB gzip), 14.41 kB CSS, 12.40 kB HTML and a 3.42 kB service worker, plus
the existing local SVG, manifest and icons. Final production browser regression:
**97/97 passed**, two workers, 5.9 minutes. No cases were disabled to obtain a pass.
The first failure and its diagnosis remain recorded above and in
[PROGRESS.md](PROGRESS.md).

## Delivered 1.0.0 artifact

```sh
npm test -- --disableConsoleIntercept
npm run release
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:release
```

The repeated unit regression passes **1,647/1,647** (24 files, 28.17 seconds).
Release packaging passes TypeScript and rebuilds the same HTML/JS/CSS/worker bytes
as task 16; its full **97/97** browser regression remains applicable. No combat,
rendering, save, input or offline runtime code changes in task 17.

`release/classless-survivors-1.0.0.zip` is **63,837 bytes**. It contains eight
production files under `web/`, PLAYING.md, DEPLOYMENT.md, START-HERE.txt and
release-manifest.json (twelve files total). The manifest covers all other files;
the adjacent `.sha256` covers the archive. The verified archive SHA-256 is:

```text
1f7b0a58e9c6b2506dd57df7068db433e4578a32eaaef2b527287174a9f582ae
```

The smoke command extracts the actual ZIP, checks its exact file inventory and
hashes, then serves those extracted files, using fresh browser contexts:

| Served path | Desktop | Touch tablet | Android portrait |
| --- | --- | --- | --- |
| `/` | Pass | Pass | Pass |
| `/Classless-survivors/` | Pass | Pass | Pass |

All six journeys allocate and save a Warrior/Mage build through the real UI,
wait for native offline readiness, disconnect and reload from the worker cache,
verify local progress, move by keyboard or native touch, kill enemies, navigate
to real XP shards and select an earned upgrade. No state/XP injection or external
requests; no browser errors or horizontal overflow. Screenshots and a report
identifying this archive hash are generated in `release/`. Time is accelerated
with Playwright's clock; these checks do not establish physical-device performance.

Both release scripts pass Node syntax checks. The manually triggered Pages YAML
parses and uploads only `dist/` after successful tests/build. Its official action
versions were checked against their sources/current Pages template. It has not
been executed on GitHub. [DEPLOYMENT.md](DEPLOYMENT.md) provides exact setup steps.
No dependencies were added; package/lockfile version metadata is now 1.0.0.

## Remaining limits

- Physical Android/tablet ergonomics, OS installation, thermal/battery/memory
  behavior, speakers, browser chrome and real app-switch interruptions remain
  unverified. Chromium emulation does not establish Firefox/Safari support.
- Browser installation offers and visibility denial include explicit API/event
  fixtures. Real native touch, audio synthesis, storage, service workers and
  browser shutdown/relaunch are exercised separately.
- Synthetic saturation can discard secondary reactions at the existing
  512-event/tick cap. Primary damage/death drops still execute; ordinary tested
  campaigns do not saturate it. See [BALANCE_REPORT.md](BALANCE_REPORT.md).
- Local progress is tied to browser/origin/container and can be evicted or denied.
  Export backups before clearing data or switching devices. In-memory changes
  after saving fails need an export. Closing unfinished combat gives no reward.
- No deployment target was configured. The environment is connected/running with
  no hosting capability or credential binding; read-only Git access succeeds but
  the GitHub Pages API request is blocked by network policy (proxy CONNECT 403).
  There is no push, executed remote workflow or live deployment to claim. The ZIP
  is ready for HTTPS static hosting; GitHub Pages is recommended for a public repo.
  ChatGPT Sites' required static-file/service-worker support remains unverified.
