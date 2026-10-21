# Balance and performance — task 15

This report records the original 1.0 balance/performance pass. The current
1.1.0 player-feedback pass is documented in [PLAYTEST_REPORT.md](PLAYTEST_REPORT.md);
its shorter campaign and eight-slot run builds supersede the pacing below.

Measured on 2026-10-20 in the managed Linux cloud workspace: AMD EPYC 9V74,
Node 24.19.0, npm 11.9.0, Chromium 154. Shared-machine timings are diagnostics;
physical Android/tablet performance and subjective enjoyment remain unverified.

## Reproduce

From the repository root with the existing development dependencies installed:

```sh
npm run analyze -- --output /tmp/balance.json
npm run analyze -- --adaptive --output /tmp/balance-adaptive.json
npm run analyze -- --benchmark-only --output /tmp/dense.json
npm run analyze -- --seeds 42 --profile /tmp/combat.cpuprofile
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run analyze:browser -- --output /tmp/canvas.json
```

Omit the executable-path variable to use Playwright's installed browser elsewhere.
CPU profiles can be opened in Chromium DevTools. Profile recording adds overhead;
use an unprofiled run for timing comparisons. There are no extra dependencies.

`analysis/routes.ts` extends the historical test fixtures with three eight-point
hybrids without Priest talents and an initially available six-branch starter.
`simulation.ts` drives real 1/60-second ticks, movement, XP collection and offered
choices until defeat or 900 seconds. No health, damage, XP, ranks or timeline is
injected into balance routes. The pilot repeats up/right/down/left every three
seconds and cannot dodge warnings or deliberately close melee distance.

Default choices prioritize vitality, haste, magnet and fleet, then the route's
synergies and projectile upgrades. `--adaptive` instead prioritizes wellspring,
vitality, aegis and recovery when health is below 60%. It uses the same movement.
Both policies fall back to an actually offered option. Measurements include first/
last choice, health, level, kills, XP, boss duration, entity peaks and effect drops.
`healthLossTicks` counts ticks ending with lower HP; it is not total incoming damage.

`workload.ts` and the standalone browser page are separate synthetic benchmarks.
They deliberately inject high-health foes, invulnerability and every maximum
upgrade rank, exceeding a legal earned rank budget. They test caps, not viability.
The browser runner bundles the real simulation/rendering modules in production
mode into a temporary directory, serves only on loopback and cleans up afterward.
Its page and test fixtures are excluded from the game's build and PWA shell.

## Design changes and findings

- Upgrade offers retain one eligible weapon and now include an eligible survival
  option whenever both categories remain. The final slot supplies survival only
  if earlier slots did not. Weighted draws, distinct cards, prerequisites, capped
  ranks, shuffled slots and the independent spawn RNG remain intact. This supplies
  options for adaptation; it does not guarantee a particular healing card.
- Introductory intervals at 35/55/75/120 seconds change from 0.90/0.80/0.72/0.65
  to 0.95/0.90/0.85/0.75 seconds. Enemy introductions, health scaling and late waves
  remain. The first choice still arrives in 8.7–11.4 seconds across the matrix.
- Guardian health becomes 720/900/900, from 540/650/650. High-output builds previously
  skipped much of their mechanics in roughly 7–15 seconds. Final guardian arrival
  moves from 14:00 to 13:30, retaining the 15:00 finish and providing 90 seconds for
  slower builds. Warning times, damage, Resolve and healing breaks remain.
- Permanent rewards need no numerical increase: existing tests establish that
  even short defeats earn research, points expand from eight to nine/ten after
  runs two/five, all six capstones remain affordable, and rewards stop at their
  bounded ceiling. There is no loss-induced progression lock or unlimited stat grind.

All routes use eight points. Some historical routes research a capstone; the
three `/no-priest` routes and six-branch starter need no research. W = victory at
900 seconds; L = actual defeat. Seeds are always **1 / 42 / 2026**, not a sample
large enough to estimate player win rates.

| Build | Original fixed pilot | Tuned fixed pilot | Tuned adaptive pilot |
| --- | --- | --- | --- |
| Retaliation | L / W / W | L / W / W | W / W / W |
| Frost/melee | W / W / W | L / W / W | W / W / W |
| Critical/DoT | W / W / W | W / W / W | W / W / W |
| Healing/offense | W / W / W | W / W / W | W / W / W |
| Summons | W / W / W | L / W / W | W / L / W |
| Spellsteel without Priest | L / W / W | L / W / W | W / W / W |
| Venom flock without Priest | W / W / W | W / W / W | W / W / W |
| Frost flock without Priest | L / W / W | L / W / L | W / W / L |
| Six-branch starter | W / W / W | W / W / W | W / W / W |

Original fixed routes won 24/27; tuned fixed routes win 21/27; tuned adaptive
routes win 25/27. Changing offers changes the choice sequence for a seed. Choosing
defense while hurt helps the difficult opening without making every scripted
route invincible: adaptive summons still loses seed 42 at 287 seconds and frost
flock loses seed 2026 at 806 seconds. Those failures remain reported.

All nine tuned fixed routes finish seed 42; all three builds without Priest
talents earn Wellspring and finish. The six-branch starter finishes all three
seeds. Successful final routes finish around levels 35–40 and retain choices
after ten minutes. Every ordinary matrix route has **zero effect-budget drops**.
The stationary retaliation control dies before the first guardian. Seeded wins
establish functioning builds and recovery paths, not universal balance.

With the fixed pilot, critical/DoT median guardian fights now take about
21/23/21 seconds; summon fights about 13/12/12. Retaliation and healing routes
take roughly 79–80 seconds for the first guardian. Their close-range offense
loses opportunities while the pilot keeps running away. Positioning remains a
meaningful tradeoff; the 90-second final window accommodates slower offense.
Boss health alone does not equalize damage across different builds.

## Profiled optimizations

The initial CPU profile put about 18% of sampled time in `resolveTalentEffects`,
with substantial additional time rebuilding upgrade handler arrays. Six dispatch
passes per tick recreated lists even when no events were waiting. Pickup distance
calculations and rebuilding projectile grids also appeared prominently.

- Build event-handler lists only when events are pending. Retain catalog order,
  current ranks, FIFO ancestry/depth/work limits and dead-foe cleanup.
- Scan only upgrades with event handlers; prepare immutable maximum-rank and stat
  metadata once. Derive stats from current clamped ranks on every call, avoiding
  invalidation state and cached-stat drift. Fractional/nonfinite fixture ranks
  now use the same rank boundary as other combat logic.
- Skip the spatial grid when there are no friendly bolts, retaining dead-foe cleanup.
- Reuse a shard's measured distance when it did not move. Collection thresholds,
  movement, XP conservation and pickup events remain unchanged.

For an implementation comparison, a temporary archive of pre-task commit
`472c005` received only the **final boss/wave/offer tuning** and the same harness.
Dependencies, seed, choice policy and balance were therefore identical. Both
versions ran nine seed-42 campaigns plus the stationary control sequentially,
with profiling disabled. **All recorded non-timing fields matched in all ten
routes/control.** The nine full campaigns took 21.34 seconds with the old
implementation and 11.40 seconds after optimization, about **47% less wall time**.
The median per campaign changed from 2.36 to 1.21 seconds. These include read-only
measurement overhead and are accelerated simulation timings, not displayed FPS.

## Dense and browser measurements

Each synthetic batch starts with 80 foes of all five kinds, two simultaneous
DoTs per foe, 32 piercing/exploding bolts, 160 shards and 64 sparks. Foes have
100,000 health; the player is invulnerable. Batches run real rules for one second
before resetting outside the measured work. No production test mode is introduced.

Node measures 1,800 tick samples after five warm-up batches:

| Dense tick | Original implementation, final tuning | Optimized |
| --- | ---: | ---: |
| Median | 1.88 ms | 1.79 ms |
| 95th percentile | 3.37 ms | 3.24 ms |
| 99th percentile | 4.64 ms | 4.73 ms |

Dense work spends most of its time actually processing effects, so the idle-work
optimization gives a much smaller benefit here. Tail timing varies on the shared
machine; the 99th percentile did not improve. No timing threshold is a CI assertion.

The browser harness takes 600 native RAF samples per viewport after 60 warm-up
frames, performing one real tick, the full Canvas renderer and a silent sound
director observation per frame. Every 60 frames the saturated fixture resets.

| Headless Chromium | Canvas buffer | Tick p95 | Canvas + director p95 | Combined callback p95 / p99 / max |
| --- | --- | ---: | ---: | ---: |
| Desktop, DPR 1 | 360×480 | 2.1 ms | 1.1 ms | 3.0 / 6.0 / 9.0 ms |
| Phone viewport, DPR 2 | 720×960 | 2.1 ms | 1.2 ms | 3.1 / 3.9 / 6.8 ms |

Recorded RAF intervals were about 16.7 ms. The harness excludes the game's DOM
HUD, live audio synthesis/output and compositor costs. It uses a cloud CPU and
headless Chromium, so it does not establish physical Android frame rates or GPU,
thermal, battery, memory, speaker or browser-engine performance. The separate
production browser suite covers the integrated HUD, controls and actual audio
behavior functionally, including offline full campaigns.

The synthetic overload reaches the existing **512-event/tick** limit and discards
505 secondary events per one-second batch (17,675 over 35 Node batches including
warm-up). Both implementations report the same drops. This is intentional bounded
overload behavior; primary damage/death drops still execute. It does not mean every
reaction fires under arbitrary saturation. Ordinary full campaigns drop none.
Enemy/bolt/shard/spark caps remain 80/32/160/64; hostile attacks, hazards, snares,
DoTs, warning counts, proc ancestry and depth also retain their finite limits.

## Validation and remaining limits

Core regression coverage includes offered-category availability across seeds and
exhausted pools, unresearched mixed builds, health-aware recovery routes, live
rank edits, empty dispatch/projectile cleanup and saturated queue recovery.
The existing talent interaction matrix, full campaigns, saves, offline shell,
touch input and browser journeys remain required. Exact milestone totals and
latest outcomes are recorded in [PROGRESS.md](PROGRESS.md).

Final release regression and delivery are tasks 16/17. Physical-device testing,
broader seeds/pilot styles and longer subjective playtesting remain useful. No
deployment target is configured, and no remote publication occurs in this task.
