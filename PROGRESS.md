# Classless Survivors — progress

## Current state

- Completed: tasks 0–13, modular refactor 2a, and synergy pass 7a.
- Playable loop: keyboard/touch movement, automatic combat, XP/levels, 20 run
  upgrades, five enemy types, elites, three guardians, a 15-minute campaign,
  victory/defeat, one-time persistent rewards, free respec, saved builds and replay.
- All 36 talents function across six freely mixed branches. Thirty start unlocked;
  research opens six capstones. Starts with eight points; completed runs 2/5 grant
  points 9/10. No permanent stat purchases. Three build slots, versioned profiles,
  migration/recovery, autosaved drafts and reviewed backup import/export work.
- Open talents/upgrades support retaliation, Frost/physical, critical/DoT,
  healing/offense and companion builds. Level 40 and recovery offers bound run
  progression without empty choices. See SYNERGY_AUDIT.md and README.md for
  capabilities, inheritance, proc ancestry/work bounds and derived summaries.
- Guardians arrive at 4/9/14 minutes; all must fall before dawn at 15:00. Both
  endings freeze combat, save rewards and return to build planning/replay.
  Reloads discard unfinished combat without rewarding it and keep completed progress.
- Original procedural audio, separate saved sound/display settings, device-aware
  reduced motion, bounded/prioritized feedback, grouped visual XP and reused
  original icons remain. Audio is gesture-gated and interruption-safe; unavailable
  audio/storage retain usable current-tab controls. No new assets or dependencies.
- Task 13 replaces whole-panel shrinking with viewport-aware arena fitting. The
  full-size HUD stays above play and a thumb-reachable toolbar below; short
  landscape screens place them beside the arena. Safe-area padding, zoom support,
  44px targets, wrapping labels and 16px profile fields keep menus usable.
- Rotation pauses once; delayed media-query events cannot re-pause a resumed run.
  Resize/focus interruption clears held keys and pointer capture. First-finger
  ownership, secondary-finger release, cancellation and fresh drags are checked.
  Pausing makes the canvas inert and releases the active gesture lock. Long-press
  menus are suppressed only during active play.
- Guides, build summaries and settings pause for reading without stealing focus.
  Escape in a settings control keeps the run paused; Resume or Escape on the
  focused Resume button restarts it. Start/resume scrolls back to the play area.
  Hidden/visible events never resume automatically.
- Upgrade selection is now a native modal, independent of the arena's height,
  with background focus isolation, keyboard traversal and real touch scrolling.
  Rotation does not discard queued choices. Small-screen talent inspection,
  allocation, branch navigation, saved-build editing and close/focus return work.
- Viewport measurement, responsive styling, input, UI, rendering, audio, local
  storage and browser-independent simulation remain separate. run.ts coordinates
  simulation; Task 13 changes no combat balance or save formats.

## Standing requirements

- Complete one authorized task, validate, update this log, commit, report, then
  pause until **continue**. Make ordinary decisions independently.
- Keep focused typed modules and explicit ownership. Prefer open cross-branch
  triggers, accurate descriptions, explicit companion inheritance and bounded procs.
- Reuse readable original programmatic art. No paid assets, APIs, services,
  backend or accounts. See AGENTS.md and DEVELOPMENT_PLAN.md.

## Next task

**Task 14: Add and verify offline installation.**

Wait for **continue**. Add the app manifest, original install icons, a versioned
production service worker, required-asset caching and safe updates. Verify a real
built-game journey with networking disabled after first load, save persistence
across reopening, and cache upgrades that preserve profiles/settings. Document
Android/browser installation limits. Keep caching lifecycle separate from game
rules and local saves. Validate, document, commit, then pause; balance/performance
remains task 15. No deployment target is configured.

## Latest validation

- `npm test`: **1,088 tests passed in 18 files**. Existing talent/upgrade matrix,
  seven full-run hybrid routes, progression, bosses, saves and audio tests pass.
- `npm run build`: TypeScript and production build passed. Output approximately
  **121.59 kB JS (40.37 kB gzip), 14.41 kB CSS, 11.57 kB HTML**.
- Final browser suite: **76/76 passed** in Chromium desktop/tablet/Android
  emulation. Twenty new cases extend the previous 56 with responsive layouts,
  keyboard/pointer recovery,
  multi-touch/rotation, native modal scrolling/focus, reading pauses, small-screen
  editor journeys and visibility recovery. Existing real full-run victories,
  defeats, respec/reload/replay, native audio and saved progression remain covered.
- Responsive checks cover 280×700, 320×568, 360×640, 568×320, 844×390, 768×1024
  and 1280×720; default phone context also uses 390×844. HUD/arena/Pause stay in
  view without horizontal overflow, and the canvas keeps its aspect/pixel sizing.
  Guardian journeys additionally assert boss HUD, arena and Pause visibility.
- Visibility uses a document-property/event fixture because opening another
  headless tab does not hide the first here. Actual CDP touch input verifies stick
  ownership, secondary release, cancellation, rotation recovery and modal scrolling.
  Pointer-capture loss uses the browser capture API. Tests never inject combat state.
- Rotation notifications are deduplicated. Browser checks wait for native
  orientation events independently of mocked RAF time and complete queued level
  choices before inspecting the background. No combat rules changed to satisfy
  tests; no unresolved failures or setup blockers remain.
- Reviewed 320×568 portrait and 568×320 landscape screenshots: HUD, player,
  arena and Pause are visible and readable. Landscape build fields and scrolled
  upgrade cards are readable with Close/select controls reachable. Native audio
  checks measure a graph waveform and silence, not physical-speaker quality.
  Accelerated campaign tests change only RAF time (12×), never combat state;
  audio checks use native browser time.
- **101 TypeScript source modules**. Node 24.19.0/npm 11.9.0/Chromium 154 continue
  to work. No dependency, network, credential or environment-configuration changes.

## Remaining work and limits

- Tasks 14–17: offline/PWA; balance and measured full-run performance; release
  regressions; production delivery/deployment. Task 13 does not establish Android
  hardware performance or replace task 15's challenge/reward tuning.
- Physical phones/tablets, browser chrome/notches, OS/app switching, soft keyboards,
  pinch zoom and physical audio quality remain unverified. Chromium emulation does
  not establish other browser-engine support or real-device ergonomics.
- No offline installation yet. Runs are not restored after closure/reload. Clearing
  data or changing browser/device/origin needs a character backup. Presentation
  settings are separate from those backups. Failed writes require exporting the
  in-memory character profile. No configured deployment or publication this cycle.

## Milestone history

- Tasks 0/1/2: `90daca7`, `8332fcb`, `50cee85`; modular requirements/refactor:
  `93558f1`, `851082a`.
- Tasks 3/4/5/6: `c10a1b7`, `4462fd4`, `d9eb89a`, `c2c7237`.
- Task 7: `b20621d`; synergy pass 7a: `69b8928`; tasks 8/9/10:
  `5af9114`, `19e3dce`, `d9ea3a4`.
- Task 11: expanded run upgrades/hybrids, `f17303a`; task 12: procedural audio,
  saved presentation settings, reduced motion and readability, `9e19e29`.
- Task 13: responsive play layout, native upgrade modal, menu/touch/keyboard
  usability and interruption recovery (this milestone).
