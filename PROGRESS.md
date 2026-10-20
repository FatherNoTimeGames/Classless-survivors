# Classless Survivors — progress

## Current state

- Completed: tasks 0–14, modular refactor 2a, and synergy pass 7a.
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
- Task 14 adds a relative manifest, original mask-safe 192/512px PNG install icons
  and a build-generated, versioned service worker. Production caches all actual
  emitted/public game files. Development does not register the worker.
- Every file has SHA-256 integrity verification. Atomic downloads reject missing
  or wrong-content responses without replacing a good cache. Known verified
  assets ignore host Vary headers during lookup, fixing cold offline module/CSS
  startup. Only the game root/index and listed files use the cache; unknown,
  cross-origin, non-GET and range requests pass through.
- Offline & installation pauses for reading and shows verified readiness,
  complete-copy repair, update checks, browser install offers and menu guidance.
  Blocked API access/registration leaves ordinary connected gameplay usable.
- Updates wait for all controlled game tabs/windows to close. No skipWaiting,
  forced reload or mid-run takeover. Activation removes only obsolete caches
  for the same app path; profiles, preferences and foreign caches remain separate.
  A failed update retains the old offline version and can retry online.
- A production game can reopen after a full Chromium process restart with
  networking disabled, retaining builds/settings and supporting movement,
  combat, earned upgrades and replay. Full guardian/victory/reward/respec/reload
  journeys now run offline after first caching. Installation itself remains
  optional; actual OS installation UI and physical devices are unverified.
- Offline runtime/client UI, build/release generation, rendering, input, local
  profile/settings storage and browser-independent simulation stay separate.
  No combat balance or profile/settings save-format changes this milestone.

## Standing requirements

- Complete one authorized task, validate, update progress, commit, report, then
  pause until **continue**. Make ordinary design/technical decisions independently.
- Focused typed modules and explicit ownership; run.ts coordinates simulation.
  Open cross-branch triggers, accurate descriptions, explicit companion
  inheritance and bounded procs remain priorities. See AGENTS.md.
- Reuse readable original programmatic art. No paid APIs, asset services,
  accounts or backend. See DEVELOPMENT_PLAN.md and README.md.

## Next task

**Task 15: Balance builds and optimize full runs.**

Wait for **continue**. Review actual run pacing, early progression, rewards,
upgrade offers and diverse hybrids. Use repeatable full-run simulations and
browser playtesting to tune challenge and build variety. Profile dense workloads
and optimize measured bottlenecks while preserving bounded entities/procs and
modularity. Document workloads, timings and environment limits; do not infer
Android hardware performance from desktop emulation. Validate, document, commit,
then pause. Final regression/delivery remain tasks 16/17; no deployment target is
configured. Do not silently expand into release publication.

## Latest validation

- Final `npm test`: **1,098 tests passed in 19 files**, including ten new offline
  worker/release cases. Existing talent/upgrade matrix, seven 900-second hybrid
  routes, progression, bosses, persistence, audio and presentation checks pass.
- Final `npm run build`: TypeScript and production generation pass. Approximately
  **125.67 kB JS (41.94 kB gzip), 14.41 kB CSS, 12.40 kB HTML, 3.42 kB worker**.
  PNG icons total about 6.24 kB. No dependency or lockfile changes.
- Final browser suite: **88/88 passed**. Twelve PWA cases extend the previous 76
  across Chromium desktop/tablet/Android emulation. The existing three complete campaign cases
  now disable networking after verified caching and include offline reload/replay.
- PWA tests validate the native manifest and decoded icon dimensions, remove and
  repair a cached file, close/relaunch Chromium using an on-disk profile, and
  verify HTML/JS/CSS responses actually come from the worker offline. They then
  move, fight, earn levels and choose upgrades using normal gameplay/UI.
- Two-release subdirectory-host tests use the production release emitter. Updates
  stay waiting with two game clients; after both close, the new shell activates
  offline and preserves builds, preferences and unrelated caches. Wrong-content
  HTTP-200 CSS fails integrity, keeps the old version playable offline, and
  successfully retries online. No combat state is injected.
- Installer offer/acceptance and API denial are explicit browser-event/property
  fixtures. They verify fallback/gesture boundaries, not an actual OS install.
  Visibility recovery remains a document-property fixture in headless Chromium;
  actual CDP touches, pointer capture and native audio remain separately covered.
- Reviewed the original install icon and an offline phone-panel screenshot:
  status, controls and instructions are readable; no horizontal overflow.
- The cold restart test caught a real Vary-header cache miss that normal reloads
  masked; verified-file lookup is fixed. A transient workspace command disconnect
  recovered without losing files. No setup configuration changes were needed;
  no unresolved failures or setup blockers remain.
- **103 TypeScript source modules**, with three separate build modules. Node
  24.19.0/npm 11.9.0/Chromium 154 remain the tested environment.

## Remaining work and limits

- Tasks 15–17: difficulty/reward/build balance and measured full-run performance;
  release regressions; production delivery/deployment. Seeded wins alone do not
  prove enjoyable balance or Android hardware performance.
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
  repair/status/install UI and native offline/restart journeys (this milestone).
