# Classless Survivors — progress

## Current state

- Completed: tasks 0–12, modular refactor 2a, and synergy pass 7a.
- Playable: keyboard/touch movement, automatic combat, XP/levels, 20 run-upgrade
  choices, five enemy types, elites, three guardians, a 15-minute campaign,
  victory/defeat, persistent rewards, free respec, saved builds, and replay.
- Task 12 adds original procedural audio, saved sound/display settings, device-
  aware reduced motion, and combat readability improvements. Existing sprites,
  backdrop and talent icons remain; all 20 upgrade cards reuse original glyphs.
  There are no new runtime dependencies, downloaded assets, paid services or backend.
- Sound starts only after an explicit gesture. Quiet synthesized cues cover
  combat, healing/wards, pickups, warnings, guardians, choices and outcomes.
  Per-cue/global intervals and eight concurrent voices bound density. Volume
  defaults to 30%; M toggles mute while the arena has focus. Mute, pause, blur,
  visibility loss and browser audio suspension clear active notes. Resume/replay
  discard stale observations; delayed activation is tied to its original run.
- Sound & display below the arena pauses active play when opened. Mute, volume,
  and System/Reduced/Full motion choices persist in a separate validated settings
  record. Newer formats are preserved; corrupt settings recover. Blocked storage
  still allows current-tab controls. Character saves/build backups are unaffected.
- Audio activation/status and retry handle browser restrictions; unavailable audio
  never blocks play. The audio director observes snapshots instead of consuming
  combat events. Tone design, browser synthesis/lifetime, preferences/storage,
  settings UI and rendering remain separate modules.
- Reduced motion follows the device by default or uses the explicit override.
  It removes decorative sprite/pickup bobs, wing flaps, shrinking arrival rings
  and expanding feedback geometry. Static glyphs may fade; actual movement,
  projectiles, status lifetimes, targeting and warnings keep their normal rules.
  No camera shake or full-screen damage flash is used.
- Nearby XP shares a visual glyph without changing real positions/value/attraction.
  Same-kind local feedback is grouped with a 28-glyph draw budget. The 64-spark
  cosmetic buffer also retains important cues over ordinary impacts when full.
  Hurt, wards, crits, cleaves and healing take priority. Frost snowflakes, arcane
  diamonds, root bars, ward shields and critical stars distinguish effect families.
- XP/friendly effects draw below hostile ground warnings; the outlined player and
  hostile projectiles remain above them. Player/pickup rendering has focused
  modules. Shared cosmetic priority tuning never changes damage or proc rules.
- All 36 talents function across six freely mixed branches. Thirty start unlocked;
  research opens six capstones. Prerequisites, tooltips, cascading refunds and free
  between-run respecs remain. See SYNERGY_AUDIT.md for inheritance and proc bounds.
- The 20 upgrade choices include twelve new powers and a recovery fallback from
  task 11. Capabilities come from talents OR acquired powers; open Frost/physical,
  absorption/retaliation, critical/DoT, healing/offense and companion paths work.
  Level 40 bounds progression with later XP growth. Second Wind prevents empty
  reward traps without granting unlimited lasting stats. Ability summaries remain.
- Guardians arrive at 4/9/14 minutes; all must fall before dawn at 15:00. Safe
  arrivals clear old threats without kill credit; controlled adds preserve kill
  builds. Guardian kills heal 25% max HP and grant 5s respite. Shared statuses,
  DoTs, crits and boss Resolve remain. Both endings freeze combat, save one-time
  rewards, show final builds and offer replay or build planning.
- Progress starts at 8 points/2 insight; completed runs 2/5 grant points 9/10.
  Research costs one insight per capstone; bounded early-loss rewards prevent
  progression traps. No permanent stat purchases. Three named slots, autosaved
  drafts, version-2 saves, migration/recovery and reviewed backups remain.
  Durable identities prevent duplicate rewards. Reloads discard unfinished combat
  and preserve completed progress/builds. No character save-format change was needed.

## Standing requirements

- Complete one authorized task, validate, update this log, commit, report, and
  pause until **continue**. Make ordinary decisions independently.
- Keep focused modules, typed boundaries and explicit state ownership. Simulation
  remains browser-independent; run.ts coordinates systems. See AGENTS.md/README.md.
- Prefer open talent triggers, explicit companion inheritance and bounded effects.
  Descriptions must match behavior. Avoid unnecessary frameworks/dependencies.
- Reuse readable original art; fill missing cues with inexpensive shapes/vectors/
  pixels. Elaborate art production is not required. Follow DEVELOPMENT_PLAN.md.

## Next task

**Task 13: Harden mobile, tablet, and desktop usability.**

Wait for **continue**. Audit portrait HUD/arena fit, thumb reach, safe areas, touch
and keyboard targets, tooltip/choice/settings access and orientation/resizing.
Exercise focus/visibility changes, pointer capture, multi-touch, resumed input and
browser gestures across phone/tablet/desktop viewports. Keep responsive UI/input
changes separate from combat rules. Record unavailable physical-device validation
explicitly. Validate, document, commit, and pause; offline/PWA remains task 14.

## Latest validation

- Final `npm test`: **1,088 unit tests passed**, 18 files. Thirty-one new cases
  cover settings validation/recovery, separate profile storage, visual grouping/
  retention budgets, static reduced-motion geometry, distinct shapes, all glyphs,
  lazy/context-reused audio, mute/volume, cue/voice limits, interruptions/retry,
  unavailable backends, and read-only/stale-free cue direction. Existing talent,
  progression, seven full-run hybrid routes, boss and persistence checks pass.
- `npm run build`: TypeScript and production build passed. Output: approximately
  **120.21 kB JS (39.86 kB gzip), 12.28 kB CSS, 11.61 kB HTML**.
- Full Chromium suite: **56/56 passed**, desktop/tablet/Android portrait emulation.
  After interruption hardening, all **9 audio/settings cases** passed again.
  After feedback-retention hardening, **4 phone cases** passed for native
  audio/settings and full guardian victory/replay. Mixed-wave checks were
  verified again: **3/3 passed** across desktop, tablet and phone. Corrected a
  test that tried to pause while a level-up choice was open; it now resolves
  that real choice first. No unresolved failures remain.
- Browser audio checks measure a waveform through a real master-gain analyser,
  oscillator cancellation and muted silence; exercise actual context suspension,
  gesture retry, volume/motion persistence, device preference changes, M, keyboard
  movement, and play with unavailable audio/storage. This verifies the native
  graph/lifecycle, not physical-speaker listening quality.
- Existing browser journeys still verify keyboard/touch, choices, each branch's
  feedback, enemy/elite warnings, save/recovery, defeat, victory, rewards, respec,
  reload and replay. Accelerated full-run cases alter only RAF input time (12×),
  never combat state; audio tests use native browser/audio time.
- Reviewed desktop/phone settings and phone mixed-wave/final-guardian screenshots:
  glyphs, silhouettes, danger lanes, blight, controls and player remain readable;
  XP clusters are less crowded. No horizontal overflow. Physical devices and
  other browser engines remain unverified.
- **100 TypeScript source modules; no runtime import cycles**. Existing Node
  24.19.0/npm 11.9.0/Chromium 154 setup works; no environment changes needed.
  No new dependencies, recordings, external assets, accounts or backend services.

## Remaining work and limits

- Tasks 13–17: device/input usability; offline/PWA; difficulty and full-run
  performance; release regressions; production delivery/deployment.
- Scripted build viability and later choices work, but challenge/reward tuning
  remains task 15. Strong late runs are not proof all builds/seeds are balanced
  or equally enjoyable. Cosmetic budgets do not establish hardware performance.
- Android/tablet hardware, physical-speaker/headphone listening and non-Chromium
  engines are unverified. Browser audio restrictions can require Enable sound;
  unsupported audio/storage keep gameplay usable. No background music loop.
- Combat runs are not restored after closure/reload. Clearing data or changing
  browser/device/origin needs a character backup. Sound/display settings are
  separate from those backups. Failed progress writes require exporting in-memory
  progress. Scenery remains decorative; boundaries are solid.
- No offline installation or configured deployment yet. No unresolved failing
  checks or setup blockers remain.

## Milestone history

- Task 0: `90daca7`; task 1: `8332fcb`; task 2: `50cee85`.
- Modularity/art requirements: `93558f1`; refactor 2a: `851082a`.
- Task 3: leveling/upgrades, `c10a1b7`; task 4: tree/framework, `4462fd4`.
- Task 5: Warrior/Mage, `d9eb89a`; task 6: Rogue/Hunter, `c2c7237`.
- Task 7: Priest/Warlock/all 36 talents, `b20621d`; synergy pass 7a: `69b8928`.
- Task 8: permanent progress, `5af9114`; task 9: enemies/waves, `19e3dce`.
- Task 10: campaign/guardians/victory, `d9ea3a4`; task 11: upgrades/hybrids,
  late progression and summaries, `f17303a`.
- Task 12: procedural audio, saved presentation settings, reduced motion,
  cosmetic budgets, layering, retained critical feedback and reused icons
  (this milestone).
