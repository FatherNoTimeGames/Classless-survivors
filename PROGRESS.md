# Classless Survivors — progress

## Current state

- Completed: tasks 0–15, modular refactor 2a, and synergy pass 7a.
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

## Standing requirements

- Complete one authorized task, validate, update progress, commit, report, then
  pause until **continue**. Make ordinary design/technical decisions independently.
- Focused typed modules and explicit ownership; run.ts coordinates simulation.
  Open cross-branch triggers, accurate descriptions, explicit companion
  inheritance and bounded procs remain priorities. See AGENTS.md.
- Reuse readable original programmatic art. No paid APIs, asset services,
  accounts or backend. See DEVELOPMENT_PLAN.md and README.md.

## Next task

**Task 16: Complete regression testing and fix release blockers.**

Wait for **continue** after task 15's committed report. Exercise the full release
criteria, every talent, high-risk combinations, migration, repeated restarts and
long-run stability. Diagnose/fix failures, document limits, commit and pause.
Task 17 delivers the production game; no deployment target is configured.

## Latest validation

- Final `npm test`: **1,114 tests passed in 20 files**, including 16 new balance/
  optimization cases. Existing talent matrix, full campaigns, progression,
  bosses, persistence, audio, presentation and offline checks pass.
- Final `npm run build`: TypeScript and production generation pass. Approximately
  **126.10 kB JS (42.10 kB gzip), 14.41 kB CSS, 12.40 kB HTML, 3.42 kB worker**.
  PNG icons total about 6.24 kB. No dependency or lockfile changes.
- Final production browser suite: **88/88 passed** (two workers, 5.4 minutes),
  including offline full campaigns, victories/rewards/respec/replay on desktop,
  tablet and Android portrait emulation. Touch interruption/recovery, actual
  synthesized audio, native browser restart and safe PWA update cases also pass.
- Nine builds × three seeds finish with 21/27 fixed-pilot wins and 25/27 wins
  when choosing defense while hurt. All nine fixed routes win seed 42; the six-
  branch starter wins all three seeds. All ordinary routes have zero dropped
  effects. Losses, differing pilot behavior and research requirements are explicit.
- Matched final tuning/seed/policy with the old implementation: all recorded
  non-timing fields match across nine campaigns/control. Accelerated campaign
  wall time drops from 21.34 to 11.40 seconds (~47%). This is not displayed FPS.
- Synthetic cap workload: optimized Node tick median/p95 about 1.79/3.24 ms;
  native Chromium simulation + Canvas/director p95 about 3.0 ms desktop and
  3.1 ms phone emulation. The extreme fixture intentionally hits the 512-event
  cap and drops secondary reactions. Limits/methods are in BALANCE_REPORT.md;
  ordinary campaigns do not saturate the queue. No physical-device claim.
- Reviewed current mixed-wave and phone final-guardian screenshots: silhouettes,
  hostile warnings, pickups and the revised guardian HUD remain readable.
  The workspace restart preserved
  work and diagnostics; no setup configuration changes were required.
- **103 TypeScript source modules**, with three separate build modules. Node
  24.19.0/npm 11.9.0/Chromium 154 remain the tested environment.

## Remaining work and limits

- Two tasks remain: 16 release regressions; 17 production delivery/deployment.
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
- No configured deployment, remote publication or push this cycle.

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
  allocation reductions and independent performance harness (this milestone).
