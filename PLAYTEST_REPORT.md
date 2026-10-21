# Version 1.1.0 — player feedback and balance pass

The player reported a scrolling game page, almost every temporary upgrade acquired
before the final guardian, widely spaced bosses, an absolute next-boss time and no
way to abandon. This update addresses those reports without changing saved talent
builds, research or permanent progression. Checked in the managed Linux environment
with Node 24.19.0, npm 11.9.0 and Chromium 154.0.8037.57 on 2026-10-21.

## Behavior

- The document is one fixed viewport. The arena fills the area between the HUD and
  toolbar. Talents, upgrades, pause/results and the new **Menu** stay inside it.
  Short landscape places the HUD beside the full-height arena. Long menu contents scroll internally. Menu opens settings, offline/install,
  enemy help and the current run build; opening it pauses combat.
- New arenas match the available aspect ratio, with the same logical area as the
  original 360×480 field. Sprites stay proportional. Movement, spawns, companions,
  enemy projectiles, boss movement and warning geometry use run-owned bounds.
  Rotation pauses and fits the existing field without moving combat/hazards.
  The fresh HUD is populated before sizing, including restarts after a boss.
- A run has **eight distinct lasting upgrade slots**. Rank-ups take no new slot;
  Second Wind recovery takes none. All existing talent capabilities and cross-branch
  interactions remain open. A ninth new upgrade is rejected at the same progression
  boundary used by offers; forged choices cannot spend a reward.
- Level cap **24**, with thresholds
  `10 + 10 × (level − 1) + 5 × max(0, level − 10)²`. The first level still costs
  ten XP. Later decisions require sustained gathering instead of unlocking the
  entire catalog. Narrow/capped pools retain recovery, so no reward traps the run.
- Guardians arrive at **3:00 / 6:00 / 9:00**; dawn is **12:00**. Health is
  **600 / 780 / 1,000**. A queued guardian waits for its predecessor and respite;
  the countdown describes that wait instead of showing negative time. Pauses
  and upgrade selection freeze the countdown with the simulation.
- Wave health multipliers from 2:00 onward are **1.3 / 1.6 / 2.0 / 2.4**, and
  the last three spawn intervals are **0.62 / 0.50 / 0.42 seconds**. The first
  slower-XP trial proved too harsh; these changes account for the reduced upgrade
  budget while keeping escalating enemies and the original opening introductions.
- **Pause → Abandon run** ends combat and allows planning/replay. It consumes the
  active run identity without insight, completed-run credit or changes to prior
  records/builds. A stale identity cannot abandon or claim another run. Existing
  genuine defeats still earn the normal bounded progression.

## Repeatable balance evidence

```sh
npm run analyze -- --adaptive --output=/tmp/classless-final-balance.json
npm run analyze -- --adaptive --seeds=42 --arena=390x650 --output=/tmp/classless-phone-balance.json
npm run analyze -- --adaptive --seeds=42 --arena=1280x700 --output=/tmp/classless-desktop-balance.json
```

The harness uses actual simulation ticks, earned XP and legal choices. The simple
pilot turns every three seconds; it does not read/dodge warnings or hunt every XP
shard. It prioritizes survival while hurt and one gatherer rank before following
the build's tools. That priority changed to suit the finite loadout; win rates are
not a controlled comparison against the old pilot/campaign. The area variants
represent phone/desktop shapes, rather than exact measurements of every browser's
dynamic chrome. No health, damage, invulnerability or XP is injected in these runs.

| Arena | Runs | Victories | Defeats | Maximum choices before 9:00 | Maximum lasting types |
| --- | --- | --- | --- | --- | --- |
| Original 360×480, seeds 1/42/2026 | 27 | 20 | 7 | 22 of 23 | 8 |
| Phone shape, seed 42 | 9 | 7 | 2 | 22 of 23 | 8 |
| Desktop shape, seed 42 | 9 | 5 | 4 | 22 of 23 | 8 |

Every one of the nine builds wins at least one original-arena seed. Three builds
use only initially unlocked talents and no Priest allocation. Original-arena wins
finish at levels **18–24**; all 45 campaigns have **zero dropped effects**. The
earliest run to exhaust its 23 level rewards does so at **9:39**, after the third
guardian has arrived. First choices take roughly **9–13 seconds** across shapes.
There are **27 distinct lasting loadouts** across the sample. Separate stationary
negative controls still lose.

The original 1.0 seed-42 baseline confirms the report: surviving builds finished
at levels **36–40** with **16–19 distinct upgrades**. The eight-slot limit directly
prevents that convergence even for a much better player than the pilot.

The limited pilot loses with frost-flock in two original seeds and the seed-42
shape variants, and has other early/late losses. Those are recorded results,
not suppressed failures. Successful scripts establish viability, not human
enjoyment, a target player win rate or hardware performance. Further player feedback
can refine pressure and individual builds. Synthetic saturated benchmarks still
exercise the documented secondary-event cap; their drops are separate from the
zero-drop normal campaigns.

## Regression and release checks

The full unit suite covers all 36 talents, 525 affordable cross-branch pairs,
progression, migration, persistence, repeat campaigns and offline behavior. New
checks cover the eight-slot boundary, forged ninth choices, recovery, variable
arena bounds, countdowns and abandonment without duplicate rewards.

Browser journeys exercise desktop, touch tablet and Android portrait. They check
fixed page bounds, internal scrolling/focus, real movement and touch, upgrade
choices, complete offline campaigns, countdown freezing, abandon/respec/replay,
save recovery, audio and worker repair/update lifecycle. Tests read rendered pixels
using the renderer's sizing metadata; no debug combat API is shipped.

Two initial browser fixtures needed correction: respec was attempted on an empty
build (correctly disabled), and the old seed expected a ninth rare package after
its eight slots had filled. The corrected abandonment journey allocates then
respecs; the synergy journey uses seed 1, whose legal offers contain the four
tested tools within eight slots. They continue to use normal combat and earned XP.

A final rotation check also caught a portrait field becoming too small below the
HUD in short landscape. The landscape HUD now sits beside a full-height arena;
new-run sizing applies that layout before measuring. Targeted rotation, native
touch, fresh-landscape sizing and movement checks cover the corrected behavior.

Final command results and the delivered artifact are recorded in PROGRESS.md.
The 1.1.0 ZIP is built by `npm run release` and verified from the extracted files
by `npm run test:release`, including root/subdirectory offline play in all three
layouts. GitHub Pages now builds/deploys `main` pushes automatically; manual retry
remains available. Updates wait for all old game tabs/windows to close and retain
profiles. Physical phone/tablet behavior, OS installation, Firefox and Safari remain
unverified; no claim about those follows from Chromium emulation.
