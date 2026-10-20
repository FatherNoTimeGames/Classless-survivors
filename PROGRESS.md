# Classless Survivors — progress

## Current state

- Completed: tasks 0–17, modular refactor 2a, and synergy pass 7a. Version **1.0.0**
  is packaged for static hosting; all planned implementation tasks are complete.
- Playable: keyboard/touch movement, automatic combat, XP/levels, 20 run upgrades,
  five enemy types, elites, three guardians and a 15-minute campaign. Victory and
  defeat return to persistent rewards, build planning/free respec and replay.
- All 36 talents work across six freely mixed branches. Thirty start unlocked;
  research opens six capstones. Eight starting points expand to ten after runs
  2/5. Three named builds, autosaved drafts, validated/versioned profiles,
  migration/recovery and reviewed backup import/export work. No permanent stat
  purchases. See SYNERGY_AUDIT.md for open triggers, inheritance and proc bounds.
- Original procedural audio, saved mute/volume/motion preferences, reduced motion,
  prioritized feedback, grouped XP glyphs and reused icons remain. Responsive
  play keeps a full-size HUD/toolbar with a fitted arena; short landscape uses
  a side layout. Native upgrade modals, touch ownership/cancellation, rotation,
  pointer/keyboard recovery and reading pauses remain covered by browser tests.
- Production offline/PWA support includes original icons, an integrity-checked
  atomic cache, repair/readiness/install UI and safe waiting updates. No mid-run
  takeover. Cache failures preserve a usable old release and separate local saves.
  Native restart/offline play, subdirectory hosting and two-client updates work.
- Task 15 tunes introductory density, eligible survival offers and guardian
  health. Guardians arrive at 4:00/9:00/13:30; dawn remains 15:00. Permanent rewards
  remain bounded. Multiple unresearched builds without Priest talents can win.
- Measured idle-allocation optimizations preserve handler order, live ranks,
  proc/entity limits and observable routes. Repeatable balance/profiling/Canvas
  tools and honest loss/saturation results live in [BALANCE_REPORT.md](BALANCE_REPORT.md).
- Offline runtime/client UI, build/release generation, rendering, input, local
  profile/settings storage and browser-independent simulation stay separate.
  The development benchmark harness stays outside the production game; no profile/
  settings save-format, dependency or lockfile change was needed.
- Task 16 checks all nine requested play journeys, legal talent pairs and repeated
  campaign/reload cycles. Three reproduced save defects are fixed: stale imports
  from a future-save session, unchecked writes after read failure and revision
  overflow. See [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) for evidence and limits.
- Full browser regression caught a failed-update notice race. Its deterministic
  fixture and an initial-install retry regression now pass; native failed-download
  repair/retry remains covered. Welcome/help text now matches the 13:30 guardian.
- Task 17 delivers a versioned ZIP, SHA-256 inventory/checksum, short player and
  hosting guides, and a manual GitHub Pages workflow. Separate packaging and smoke
  scripts rebuild and verify the extracted game without changing shipped gameplay.

## Standing requirements

- Complete one authorized task, validate, update progress, commit, report, then
  pause until **continue**. Make ordinary design/technical decisions independently.
- Focused typed modules and explicit ownership; run.ts coordinates simulation.
  Open cross-branch triggers, accurate descriptions, explicit companion
  inheritance and bounded procs remain priorities. See AGENTS.md.
- Reuse readable original programmatic art. No paid APIs, asset services,
  accounts or backend. See DEVELOPMENT_PLAN.md and README.md.

## Delivery and resuming

No numbered implementation tasks remain. The generated artifact is
`release/classless-survivors-1.0.0.zip`; publish only its `web/` contents to HTTPS.
[PLAYING.md](PLAYING.md) covers controls/builds/saves/offline play;
[DEPLOYMENT.md](DEPLOYMENT.md) covers development, verification and exact hosting
steps, including the prepared manual GitHub Pages workflow. Generated artifacts
are ignored by Git; recreate with `npm run release` and `npm run test:release`.
Remote hosting is the remaining external step: source must be pushed/merged to
GitHub's default branch, Pages set to GitHub Actions, then the manual workflow run;
alternatively upload `web/` to another suitable HTTPS static host. No deployment
target was configured and no push/publication was performed. Pause after delivery.

## Latest validation

- Final `npm test -- --disableConsoleIntercept`: **1,647 tests passed in 24 files**,
  including 533 new release cases. Existing talent matrix, full campaigns, progression,
  bosses, persistence, audio, presentation and offline checks pass.
  Repeated for 1.0.0: **1,647/1,647 pass**, 28.17 seconds, unchanged soak totals.
- Final `npm run build`: TypeScript and production generation pass. Approximately
  **126.31 kB JS (42.14 kB gzip), 14.41 kB CSS, 12.40 kB HTML, 3.42 kB worker**.
  PNG icons total about 6.24 kB. Task 17 produces the same game bundle/worker bytes;
  only package/lockfile release-version metadata and release tooling/docs change.
- First full browser run: 93/94 passed; the Android update-notice failure was
  diagnosed/fixed, with deterministic client coverage. All five targeted Android
  PWA cases pass. Final rebuilt production run: **97/97 passed**, two workers,
  5.9 minutes. Offline campaigns, native restart, migration/replay, failed initial
  downloads, update recovery, touch controls and audio pass on all three projects.
- All 525 affordable cross-branch pairs cover every talent with prerequisites,
  valid 39-rank choice sets and reversed allocation order. Synthetic two-second
  fixtures test bounded reactions/state, complementing dedicated talent behavior.
- Twelve real sequential campaign/save/reload cycles yield 11 wins and one defeat,
  about 9,965 simulated seconds, zero dropped effects and 12 durable outcomes.
  Research, budgets 8→9→10, slots, finished-state freezing, independent run state
  and one discarded unfinished identity all pass. No combat stats/XP are injected.
- Both initial persistence regressions failed before the fix. A third read/write
  failure reproduced during audit. All pass with prior save/recovery/import cases.
  Reviewed imports cannot bypass stale checks; failed guard reads continue in
  memory with export guidance; the revision ceiling remains reloadable.
- Task-15 balance/performance findings remain in BALANCE_REPORT.md. No gameplay
  tuning changed in task 16. No dependency, lockfile or environment setup changes.
  No unresolved failures remain in the executed release checks.
- **103 TypeScript source modules**, with three separate build modules. Node
  24.19.0/npm 11.9.0/Chromium 154 remain the tested environment.
- `npm run release` rebuilds successfully and produces a **63,837-byte ZIP**:
  eight production files plus two guides, START-HERE.txt and a hashed inventory.
  `npm run test:release` verifies all twelve extracted files and the archive hash;
  **6/6 native Chromium journeys pass** at `/` and `/Classless-survivors/`, each
  in desktop, touch tablet and Android portrait layouts. Real UI saves a two-branch
  build, reloads offline, moves by keyboard/touch, kills enemies, collects actual
  XP and selects an earned level upgrade. No combat state is injected. Screenshots
  and matching-archive `smoke-results.json` are generated under `release/`.
- Release scripts pass Node syntax checks. Pages YAML parses; the manual-only
  trigger, build dependency and `dist/` upload were checked. Action versions were
  checked against official action sources/template; the workflow has not run on GitHub.
- Runtime is connected/running with no hosting capability/identity/secret bindings.
  Read-only Git access succeeds; the Pages API CONNECT request returns **403**
  from the network proxy. This is a deployment-access limit, not a failed game check.

## Remaining work and limits

- No implementation tasks remain. Hosting publication is pending as described above.
  Seeded wins alone do not prove enjoyable balance or Android hardware performance.
  Broader seeds/pilots and physical playtesting remain useful. The fixed pilot
  has six losses; the health-aware pilot has two. Synthetic saturation deliberately
  drops secondary events, retaining bounded work and primary damage.
- Physical phones/tablets, OS installation, browser chrome/notches, app switching,
  soft keyboards, pinch zoom and speaker quality remain unverified. Chromium
  emulation does not establish Safari/Firefox support or device ergonomics.
- Production offline/install support needs HTTPS (loopback is a testing exception)
  and all built files served unchanged. Browser storage can be evicted/disabled;
  installation does not guarantee retention. Open an installed app online once
  and verify readiness there. Some browser/app containers have separate storage.
- Closing/reloading discards unfinished combat without a reward. Completed
  progress remains local; export character backups before clearing data or
  switching browser/device/origin/container. Preferences are separate from those
  backups. Failed local profile writes require exporting the in-memory profile.
- No configured deployment, remote publication or push this cycle. GitHub Pages
  is the recommended free option for a public repository; ChatGPT Sites' static
  hosting/service-worker support has not been verified. Guides cover both contracts.

## Milestone history

- Tasks 0/1/2: `90daca7`, `8332fcb`, `50cee85`; modular requirements/refactor:
  `93558f1`, `851082a`.
- Tasks 3/4/5/6: `c10a1b7`, `4462fd4`, `d9eb89a`, `c2c7237`.
- Task 7: `b20621d`; synergy pass 7a: `69b8928`; tasks 8/9/10:
  `5af9114`, `19e3dce`, `d9ea3a4`.
- Tasks 11/12/13: expanded hybrid upgrades `f17303a`; procedural audio/readability
  `9e19e29`; responsive play/input recovery `6f8d4eb`.
- Task 14: offline/PWA assets, integrity-checked shell, safe waiting updates,
  repair/status/install UI and native offline/restart journeys `472c005`.
- Task 15: balance matrix, survival offers, opening/guardian tuning, profiled
  allocation reductions and independent performance harness `5b987eb`.
- Task 16: release criteria audit, legal pair/repeated-run/browser regressions
  and persistence/offline lifecycle fixes `bcb2708`.
- Task 17: version 1.0.0 packaging, verified extracted offline game, player/hosting
  guides and prepared manual GitHub Pages workflow (this milestone).
