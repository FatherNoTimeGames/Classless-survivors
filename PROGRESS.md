# Classless Survivors — progress

## Current state

- Tasks **0–18**, refactor 2a and synergy pass 7a are complete. Version **1.1.0**
  implements the latest player feedback and is deployed through GitHub Pages.
- One fixed, non-scrolling game viewport replaces the web-page layout. The arena
  fills the HUD/toolbar space (full height beside the HUD in short landscape); native
  menus contain talents, upgrades, settings,
  offline support, help, current build and results. Long menus scroll internally.
- New runs match screen aspect without stretching sprites or increasing combat
  area. Run-owned bounds cover movement, spawning, companions and boss hazards.
  Resize/rotation keeps the existing field intact and pauses once; input resets.
- Temporary builds have **eight lasting upgrade types**, rank-ups cost no extra
  slot, recovery uses none, and levels stop at **24**. Later XP costs rise faster.
  Talents remain freely mixed: all 36 across six branches and their triggers work.
- Guardians arrive at **3:00/6:00/9:00**, dawn at **12:00**. The next-guardian label
  counts down, freezes with combat and explains an overdue queued encounter.
  Guardian health and later wave pressure account for the smaller upgrade budget.
- **Pause → Abandon run** preserves prior records, builds and research, consumes
  the current identity and awards no insight/completed-run credit. Replay and
  free respec are available afterward. Genuine defeats retain their normal rewards.
- Existing local profiles, research, three named build slots, eight-to-ten permanent
  points, original procedural art/audio, touch/keyboard control and PWA integrity/
  recovery/waiting updates remain. No save migration or new dependency is required.

## Validation

- Final `npm test -- --disableConsoleIntercept --reporter=dot`: **1,656/1,656 pass**
  in 25 files (31.97 seconds). Includes 525 legal talent pairs, variable bounds,
  eight-slot/forged-choice boundaries, countdowns and abandoning without rewards.
- Repeated-run soak: **8 wins, 4 defeats, 7,585 simulated seconds**, twelve durable
  outcomes with research/builds/reload preserved and finished state frozen.
- `npm run release` passes typechecking/build and produces the **65,301-byte**
  `release/classless-survivors-1.1.0.zip`. Approximately 127.94 kB JS (42.86 gzip),
  16.13 kB CSS, 12.87 kB HTML and 3.42 kB worker, plus unchanged local icons/manifest.
- `npm run test:release`: **6/6 extracted-ZIP offline journeys pass**, covering `/`
  and `/Classless-survivors/` on desktop, tablet and Android portrait. Archive
  checksum/inventory, saved mixed build, reload, movement, kills and earned choice
  are verified. Screenshots/report are generated under `release/`.
- Initial full browser run: 100/106 pass; six failures were two outdated fixtures
  repeated across projects. Their corrected journeys pass 12/12. The final full
  regression passes **105/106**; a rotated tablet rendered the portrait field too
  small below the HUD. The corrected landscape sidebar and fresh-run measurement
  then pass **43/43** final browser cases across desktop/tablet/Android (1.4 minutes),
  including the failed rotation and three new fresh-landscape cases. All 109 current
  scenarios are covered across the full regression and scoped final rerun; no
  unresolved failure remains. No retry setting or case was disabled.
- Balance: **45 real campaigns**, **20/27 original-area wins**, **7/9 phone-shape
  wins**, **5/9 desktop-shape wins**; all nine builds have a winning original seed.
  All normal campaigns have zero dropped effects and at most eight lasting types.
  No tested campaign exhausts 23 choices before the third guardian; the earliest
  cap is 9:39. There are 27 distinct final loadouts. Negative stationary controls
  still lose. Methods, losses and limits are in [PLAYTEST_REPORT.md](PLAYTEST_REPORT.md).
- Pages YAML parses with `main` push and manual triggers; deploy depends on a
  successful unit-test/build job and uploads only `dist/`. The previously configured
  GitHub Pages site is playable according to the user's run feedback.

## Delivery and remaining work

Implementation, verification and deployment are complete. Game commit **037aa99**
was pushed to `origin/main`; automatic GitHub Pages run
[39522434216](https://github.com/FatherNoTimeGames/Classless-survivors/actions/runs/39522434216)
reports **completed successfully**. The game URL is
https://fathernotimegames.github.io/Classless-survivors/.

Normal GitHub web access verified the run. A direct live-site HTTP probe is blocked
by this workspace's proxy (CONNECT 403), so no live-browser acceptance result is
claimed; the production and extracted-file browser checks above run locally.
A docs-only follow-up records publication with `[skip ci]` to avoid rerunning the
unchanged game. `release/publication.json` records the deployed game commit/run.
No implementation tasks remain; await further player feedback.

Artifact SHA-256:
`295e6e8239504bfa014394d82185fc93dcaa262d498e05307e79049a511d168c`.
Pause after reporting this authorized cycle; await further player feedback.

[PLAYING.md](PLAYING.md) covers the new menu/control/build/save/offline behavior.
[DEPLOYMENT.md](DEPLOYMENT.md) covers development, checks and automatic/manual Pages
publication. After deployment, use **Menu → Offline & installation → Check for
updates**, then close all game tabs/installed windows and reopen to activate it.
Existing saves remain; unfinished combat is deliberately not restored after reload.

## Standing requirements and limits

- Complete one authorized work cycle, verify it, update progress, commit and report,
  then wait for the next user instruction. Preserve focused typed modules and
  independent simulation; reuse readable original programmatic assets.
- Seeded pilots establish viability and pacing, not human enjoyment or player win
  rates. The simple movement pattern misses some XP and does not dodge warnings.
  Strong players may earn upgrades faster. Synthetic overload can drop secondary
  events at the documented cap; normal measured campaigns do not.
- Physical Android/tablet ergonomics, OS installation, keyboard/browser chrome,
  app switching, speaker quality, thermal behavior, Firefox and Safari remain
  unverified. Chromium device emulation cannot establish those outcomes.
- Profiles are local to browser/origin/container and storage may be denied/evicted.
  Export backups before clearing data/changing device or after a save failure.
  Preferences are separate. Offline support needs HTTPS and unchanged release
  bytes; installation does not guarantee storage retention.

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
  guides and prepared manual GitHub Pages workflow `1494cf3`.

- Task 18: fixed viewport/internal menus, run-owned arena sizing, focused upgrades,
  guardian pacing/countdown, abandonment and verified 1.1.0 update `037aa99`.
