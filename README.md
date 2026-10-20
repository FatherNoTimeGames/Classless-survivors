# Classless Survivors

A single-player dark fantasy survival roguelite built with TypeScript and Canvas.
Mix talents freely across six fantasy archetypes. No accounts or backend required.

**Current milestone:** all **36 talents across six freely mixed branches** are
implemented. Persistent progress unlocks capstones and a bounded talent budget.
Builds support melee/spell combos, critical effects,
Poison/curses, companions, healing offense, shields, and retaliation. Runs include
movement, automatic combat, XP, 20 run-upgrade choices, defeat, and replay. Local
saves, research, named builds, and backups now work. Five enemy types, two elite
modifiers, escalating waves, and three telegraphed guardians form a timed
15-minute run with victory, defeat, rewards, and return to build planning. Offline
installation remains upcoming.
See [the task list](DEVELOPMENT_PLAN.md) and [progress log](PROGRESS.md).

## Play this milestone

Open **Talents** before a run. You start with eight talent points, can mix any branches,
and may leave points unspent. Select a branch tab, then a node to inspect its
description, prerequisites, and suggested synergies. Hover/focus help and a
persistent detail panel support mouse, keyboard, and touch. Allocate a point,
refund individual talents, or use **Free respec** to clear the whole build.
Refunding a prerequisite also refunds dependent talents. All six complete branches
are available. Thirty talents are immediately unlocked; the six capstones need
research. Prerequisites and your earned point budget still apply.

| Playable talent | Branch | Behavior |
| --- | --- | --- |
| Iron Reprisal | Warrior | Surviving health loss from enemy attacks retaliates for 12 physical damage within 44 range |
| Sweeping Blade | Warrior | Auto-aim a 120° melee cleave within 50 range: 16 physical damage every 1.1s |
| Spellsteel | Warrior | Every third non-periodic physical hit fires a 12-damage ember volley within 120 range; inherits projectile upgrades; 0.25s volley limit |
| Frostbreak | Warrior | Non-periodic physical hits, including companions and retaliation, consume Frost for 8 extra physical damage and a 0.6s stun |
| Iron Ward | Warrior | Surviving health loss grants an 8-point, 3s shield; 5s cooldown |
| Last Stand | Warrior | Enemy damage breaking a shield triggers 20 physical damage within 60 range |
| Arcane Echo | Mage | Every third non-periodic fire hit strikes another nearby enemy for 9 arcane damage; linked companions qualify |
| Rime Sigil | Mage | Non-periodic fire hits and linked companion hits refresh 2s Frost, slowing enemies by 30% |
| Chain Spark | Mage | Every third arcane hit chains 10 lightning damage to a different foe within 96 range |
| Shatterglass | Mage | Physical hits consume Frost for a 10-damage arcane explosion within 36 range |
| Mana Ward | Mage | Every third triggered spell hit grants an 8-point shield for 3s |
| Riftweaver | Mage | Triggered spell hits refund 0.15s of ember, melee, and companion cooldowns, at most once per second |
| Expose Weakness | Rogue | Non-periodic hits against wounded foes add 6 damage and refund 0.15s of automatic attack cooldowns |
| Venom Edge | Rogue | Non-periodic hits apply 3 Poison damage each second for 2s; refreshes do not delay ticks |
| Killer Instinct | Rogue | Every fourth non-periodic hit crits for 1.75× damage; all schools and companions share the cadence |
| Siphon Toxin | Rogue | Natural expiration of any DoT on a surviving foe heals 2; death is not expiration |
| Contagion | Rogue | Critical hits spread all active DoTs to the two nearest other foes within 60 range, including on lethal hits |
| Nightfall | Rogue | Critical kills cause one extra tick of all active DoTs within 60 range; no recursive critical ticks |
| Ember Communion | Priest | Every fourth kill from any source attempts 3 healing; its own healing chain cannot count itself |
| Searing Grace | Priest | Requires Communion; actual healing strikes the nearest foe within 110 range for 6 holy damage |
| Sanctuary | Priest | Picking up an XP shard attempts 1 healing, at most once per second |
| Atonement | Priest | Holy hits mark for 5s; a non-periodic physical hit consumes the mark for an 8-damage holy strike if the foe survives |
| Martyr Ward | Priest | Half of excess healing accumulates as a shield, capped at 12 points with 4s refreshes |
| Dawn Chorus | Priest | Any shield absorption attempts 2 healing and strikes the nearest foe for 8 holy damage, at most once per second |
| Soul Cinder | Warlock | Every fourth kill from any source bursts for 9 shadow damage within 36 range; its own chain cannot count itself |
| Agony | Warlock | Non-periodic hits curse for 3 shadow damage each second for 3s; refreshes do not delay ticks |
| Grim Pact | Warlock | An imp fires 9-damage embers every 1.4s before haste within 180 range; inherits projectile upgrades and critical rules |
| Detonation | Warlock | Afflicted deaths explode for remaining scheduled Poison/curse damage within 36 range, capped at 18 base damage; immediate chains cannot detonate again |
| Soul Link | Warlock | Actual healing stores 40% as bonus damage for each companion's next attack, capped at 12 per companion |
| Harvest | Warlock | DoT kills attempt 2 healing and extend one nearby DoT by 1s, capped at 4s remaining |
| Hunting Momentum | Hunter | Any kill stores one additional target for the next ember volley with enough distinct targets |
| Falcon Companion | Hunter | A falcon strikes the nearest foe within 180 range for 8 physical damage each second; shares critical rules |
| Snaring Shot | Hunter | Every fourth non-periodic hit places a 2s snare within 36 range, slowing by 35%; at most eight zones |
| Pack Link | Hunter | Companions inherit wound/DoT/status effects, physical/fire triggers, and triggered-spell effects |
| Frost Trap | Hunter | Hits against any slowed foe root for 0.75s and apply 2s Frost, with a 3s cooldown per foe |
| Wild Hunt | Hunter | Spending Momentum commands all companions to strike immediately, at most once per 2s |

Try **Iron Reprisal → Sweeping Blade → Frostbreak** alongside **Arcane Echo →
Rime Sigil → Shatterglass**: embers freeze foes, then a cleave consumes Frost for
bonus damage, a stun, and a burst. Both talents benefit from the same consumption,
including when the primary hit kills. Physical retaliation can also shatter Frost.
Allocate an entire six-point branch plus a two-point supporting pair, or mix paths.
Try **all Rogue talents + Hunting Momentum + Falcon Companion** for a shared
critical cadence that spreads Poison and pulses it on kills. Try **all Hunter
talents + Expose Weakness + Venom Edge** for a falcon that poisons wounded foes,
feeds snares, and roots them. **Hunting Momentum + Falcon + Pack Link + Arcane
Echo + Rime Sigil + Shatterglass** turns physical companion hits into Frost bursts.
Try **all Warlock talents + Ember Communion + Searing Grace** for curses and
healing that empower the imp. Try **all Priest talents + Iron Reprisal + Sweeping
Blade** for shield retaliation and holy marks consumed by physical attacks.
**All Priest talents + Hunting Momentum + Falcon** lets physical companion attacks
consume marks. These attacks add their holy strike only if the primary hit leaves
the foe alive, making them more useful against tougher targets.
Begin with two insight to research any two capstones. More insight and two
additional talent points are earned through finished runs, as described below.

Spellsteel counts non-periodic physical hits from melee and retaliation, plus
companions with Pack Link. Its volley skips the original victim on direct hits,
can apply Frost, feeds Arcane Echo, and inherits fork, piercing, and explosions.
A 0.25s volley limit bounds area-hit fan-out; a full charge waits for an eligible
physical hit with another target and projectile space. Frostbreak and Shatterglass
react to physical hits from any attacker, without requiring Pack Link.
Kills from any source feed Communion, Soul Cinder, and Momentum, with ancestry
guards against counting their own proc chains. Spellsteel can apply Rogue wound
bonuses, Poison, curses, and critical hits, like other non-periodic damage.
Triggered spells include nonphysical talent hits, projectile explosions, and
linked magical companion hits. Direct starting embers, physical hits, and periodic
ticks do not count for Mana Ward or Riftweaver. Shields refresh without stacking
or weakening; they absorb before health. Expiration never triggers Last Stand, and fully absorbed hits do
not trigger health-loss talents. Frost has ice prongs; stuns stop movement and
contact attacks. Cleaves use arcs, wards use an oval plus a health-line amount/timer,
and spell effects have distinct shapes. Excess healing is separate from actual
restoration: only Martyr Ward converts it, while Searing Grace and Soul Link require
restored health. Martyr Ward is the explicit capped exception to nonstacking shields.
Shield expiration cannot trigger Dawn Chorus. Fatal hits cannot resurrect the player.
Talents remain separate from randomized run upgrades.

Rogue and Hunter use open hit rules: weapons, spells, blasts, and retaliation
qualify. Periodic damage cannot crit, reapply Poison/curses, or generate hit-based snares;
periodic and companion kills still supply Momentum. Companions always share your
critical cadence and critical effects; Pack Link adds the listed noncritical
on-hit and spell-trigger effects. Fire/physical school requirements still apply.
Roots stop movement but allow contact attacks; stuns stop both. Slows use the strongest value rather than stacking. Poison can spread on
lethal hits, and Nightfall pulses those newly spread effects once. These rules
prevent recursive proc loops without limiting talents to one fantasy archetype.

Imps and falcons share ownership, targeting, cooldowns, Soul Link bonuses, and
Wild Hunt commands. Pack Link also lets either apply your on-hit Poison, curses,
Frost, snares, and roots. The imp snapshots extra targets, piercing, blast radius,
and stored damage at launch. A Soul Link bonus applies to every shot of one volley;
healing or upgrades cannot alter already-fired shots. Failed/full-budget launches
retain its stored bonus. Curse marks, holy crosses, detonation crescents, and the
horned imp silhouette distinguish the new effects with simple original shapes.

Your chosen talents are copied into the new run. Editing is available before the
first run and after either ending; paused runs cannot be respecced. **Try again** / **Play again** uses
your current talent allocation but resets temporary upgrades. Your allocation,
research, earned points, and saved build slots survive browser reloads and closure.
Combat runs themselves are not resumed after closing or reloading the page.

Choose **Enter the clearing** to begin. Move with **WASD** or **arrow keys**, or
press and drag anywhere in the arena to create a floating virtual stick (touch,
pen, or mouse). Release to stop. Keyboard movement works while the arena has
focus; click/tap it to refocus. The arena edge is solid; ruined scenery is visual.

Your ember fires automatically at nearby enemies. Green shards are XP: move
near them to attract and collect them. Ten XP earns the first level; each following
threshold costs eight more XP through level 20; later thresholds grow faster. On leveling, combat freezes while you select a
run upgrade. Tap/click a card, or use Tab and Enter/Space. Escape cannot dismiss a
level reward. If several levels are earned at once, choose once for each reward;
excess XP carries over. Held movement input is cleared before play resumes.

Each offer contains up to three distinct upgrades, with at least one weapon
option when available. Common upgrades appear from level 2, uncommon from level 3,
and rare from level 4. Common offers have greater selection weight. Maxed upgrades
stop appearing. **Level 40** bounds the run budget. Thresholds remain familiar
through level 20, then add `2 × (level − 20)²` XP to the base cost. This keeps choices
arriving later in a full run. XP still counts toward your total at maximum level.
Family upgrades appear only when a talent or acquired upgrade provides their
trigger. Your run choices can open new paths: Viper Ink enables periodic upgrades,
Keen Instinct enables critical synergies, Blood Wellspring enables healing offense,
and Returning Aegis enables absorption retaliation. No class restriction applies.
If fewer than three eligible lasting upgrades remain, **Second Wind** offers
immediate healing and a temporary ward. Narrow or capped builds cannot become
stuck on an empty level reward; permanent combat stats remain bounded.

| Run upgrade | Effect per rank | Rank cap |
| --- | --- | --- |
| Quickened Ember | Ember cooldown −0.08s; melee/companion intervals shorten by the same proportion | 4 |
| Fleetfoot | Movement speed +12 | 3 |
| Soul Gatherer | XP attraction range +18 | 3 |
| Living Ember | Maximum health +12; restore 12 health | 3 |
| Forked Ember | Ember, Spellsteel, and imp volleys attack one additional distinct nearby target | 2 |
| Soul Needle | Ember, Spellsteel, and imp shots pass through one additional enemy | 2 |
| Ashburst | Ember, Spellsteel, and imp impacts explode for half shot damage before on-hit bonuses; radius +20, without chaining | 2 |


| Additional run choice | Function / interaction | Rank cap |
| --- | --- | --- |
| Grave Longblade | Sweeping Blade gains 14 reach and 4 base damage per rank; its angle stays 120° | 2 |
| Lingering Venom | New/refreshed Poison and curses gain 2 tick damage per rank; tick clocks do not reset | 3 |
| Empowered Familiars | Falcon/imp gain 4 base damage and 20 target range per rank; imp shots snapshot it | 2 |
| Blood Wellspring | Any six kills attempt 4 healing; actual/excess healing use normal rules | 1 |
| Returning Aegis | With foes present, grant 6 ward per rank every 5s, lasting 4s; grants do not stack | 2 |
| Keen Instinct | Crit every 5/4 non-periodic hits, or 3/2 with Killer Instinct; companions share cadence | 2 |
| Viper Ink | All non-periodic hits apply 2s Poison, 3/5 per tick or 5/7 with Venom Edge; companions qualify without Pack Link | 2 |
| Wintersteel | Physical hits apply 2s Frost after damage; later physical hits can consume it | 1 |
| Ward Reprisal | Absorption deals 8 physical per rank to up to 8 foes within 70 range, once per second | 2 |
| Septic Catalyst | Crits pulse existing DoTs on up to 3 afflicted foes within 60 range, once per 0.75s | 1 |
| Radiant Reprieve | Actual healing deals 4 holy per rank to up to 8 foes within 90 range, once per second | 2 |
| Winter Pact | Companion hit against a slowed foe causes an 8 arcane burst within 36 range, up to 6 foes, once per 0.75s | 1 |
| Second Wind | Fallback: heal 20 and grant 8 ward for 6s; no lasting stat increase | Limited by remaining levels |

Longblade requires melee; Familiars requires a companion; Lingering Venom requires
Poison/curses; Wintersteel requires physical damage; Ward Reprisal requires a
repeatable shield source; Catalyst requires crits and DoTs; Reprieve requires
repeatable healing; Winter Pact requires a companion and Frost or snares. These
capabilities come from talents or run upgrades. Frost/physical and companion
bursts work on bosses under their existing Resolve rules.

New temporary effects share the talent FIFO/ancestry safeguards. Their cooldowns
and target caps further bound fan-out. Periodic pulses cannot crit or refresh
DoTs, and refreshes preserve tick timing. Winter Pact's arcane burst is your
triggered damage; its original companion hit retains ordinary Pack Link rules.
Viper Ink explicitly grants companion Poison, while familiar damage/range bonuses
do not grant other on-hit inheritance. Empowered imp shots live long enough to
reach their selected aim even when the imp is trailing the player.


Haste changes automatic attack intervals, not DoT timing, proc counters, or talent
cooldowns. Picking it preserves elapsed cooldown progress for every attacker;
unrelated upgrades do not reset attack timers. Projectile upgrades leave falcon
strikes and melee arcs unchanged. Ashburst retains companion ownership, so imp
explosions require Pack Link for inherited on-hit effects. Already-fired shots
retain their captured upgrades and damage. See [SYNERGY_AUDIT.md](SYNERGY_AUDIT.md)
for the talent/upgrade review, tested combinations, and intentional exclusions.

Piercing bolts have a pale trail; explosive bolts produce expanding impact rings.
Open **Run upgrades & abilities** beneath the arena to inspect damage, range,
attack cadence, companion inheritance, and every acquired upgrade's description.
The choice screen includes a keyboard/touch-accessible current-abilities summary;
the results screen shows the final ability summary for that run. These values describe base abilities;
critical hits, wounded/Frost bonuses, and stored companion bonuses can add damage.
Enemy numbers build over time, and you lose when health reaches zero. **Try again**
starts a fresh run with level 1, your chosen talents, and no run upgrades. Defeat
all three guardians and survive until **15:00** to win. Health reaching zero loses
immediately; guardians remaining at 15:00 also lose the run. Both outcomes award
persistent progress. The results show survival time, kills, XP, level, guardians,
and the final talent/upgrade build. **Return to build planning** opens free respecs.

Use **Pause** or **Escape** to pause and **Resume run** or **Escape** to resume.
Leaving the browser tab/window pauses the game automatically. After an input
interruption, release and press movement keys again to resume movement.

## Sound, motion, and combat readability

Open **Sound & display** below the arena. Opening it pauses an active run; resume
with the normal run controls. Sound defaults to a restrained **30% volume** and
starts only after **Enter the clearing** or **Enable sound**. Use **Mute sound**,
the volume slider, or **M** while the arena has focus. Reloading restores your
settings but requires another gesture before audio can start. A browser-blocked
context can be retried with Enable sound; missing audio support does not block play.

The original procedural sounds use short sine/triangle tones for attacks, impacts,
critical hits, healing, wards, pickups, warnings, guardians, leveling and outcomes.
There are no recordings, music downloads, services or background music loop. A
master gain controls volume; per-cue/global cooldowns and an eight-voice limit
bound density. Pause, mute, focus loss, hiding the page and browser audio suspension cancel active voices.
Lifecycle cues replace combat sounds; resuming/replaying never queues stale sounds.
Audio time follows the browser's audio clock rather than accelerated test frames.

**Motion** follows the device's `prefers-reduced-motion` setting by default.
Choose Reduced motion or Full motion to override it. Reduced motion removes
sprite/pickup bobs, wing flapping, arrival-ring shrinking and expanding spell
geometry. Compact static glyphs still fade, and actual movement, projectiles,
statuses, danger timing, warning shapes and targeting remain unchanged. The game
uses no camera shake or full-screen damage flashes.

The arena reuses its original pixel silhouettes and dark palette. Nearby XP
pickups share a small glyph to reduce clutter; collectible positions, values and
attraction are unchanged. Same-kind local feedback is merged, at most 28 glyphs
are drawn, and hurt/ward/critical/cleave/healing cues take priority. Important cues can replace
ordinary impacts in an already full cosmetic buffer. Friendly
feedback draws before hostile ground warnings, then the player and hostile
projectiles draw above them. Frost uses a snowflake, arcane a diamond, roots bars,
wards a shield, and critical hits a star. Talent glyphs are reused on every upgrade
card; names and descriptions identify related powers without more asset files.

Sound/motion preferences use a separately validated local settings record, not the
character profile or build backups. Corrupt settings recover to defaults; newer
formats are preserved. If storage is blocked, controls still work for the current
tab and show a notice. Progress saves and research are unaffected. Physical-speaker
listening, Android hardware performance and non-Chromium engines remain unverified.

## Enemies and waves

The wave label shows the current threat stage. Enemies appear at arena edges,
at least 110 units away, with a visible 0.6s arrival grace before moving or
attacking. Movement remains player-controlled; the warnings give time to reposition.
The **Enemy field guide** beneath the arena explains silhouettes and counterplay.

| Enemy | Behavior and counterplay | Base health / XP |
| --- | --- | --- |
| Grave Husk | Broad red silhouette; steady pursuit. Kite or cleave groups. | 18 / 5 |
| Gloom Skitter | Low green body with six legs; faster pursuit but fragile. | 12 / 5 |
| Bone Archer | Pale skeleton carrying a bow; approaches or retreats to hold range. A dotted line warns for 0.8s before a fixed-direction arrow. Step off the line. | 32 / 8 |
| Horned Brute | Wide horned silhouette; marks a dashed lane for 0.9s, charges straight for up to 150 units, then recovers. Sidestep the lane; Frost slows the dash. | 60 / 12 |
| Mire Hexer | Pointed hood and staff; marks a crossed circle for 1.2s before a 2s blight pool. Leave the circle. Targets lock at the start of the warning. | 42 / 10 |

Stuns interrupt windups and charges and prevent contact attacks. Roots stop
movement and interrupt charges; rooted archers/hexers can still cast. Kills or
stuns before release cancel the attack. Already-released arrows and blight persist
after the caster dies. All enemy damage shares shield absorption, retaliation,
Dawn Chorus, health-loss rules, and the player's 0.8s invulnerability window.
Overlapping enemies do not each deal a separate hit in the same moment.

Elites wear a crown and have a visible health bar. **Swift** elites have side
chevrons, 2.5× base health, 25% faster ordinary movement, and 25% more damage.
**Stout** elites have a square frame, 4× base health, 15% slower ordinary movement,
and 50% more damage. Both give 3× XP and retain normal Frost, roots, stuns, marks,
Poison, and curses. Charge speed/warning durations stay readable and unchanged.
Health scaling is captured when an enemy spawns; a wave change never heals or
rewrites existing foes. Higher-value XP is retained even at the pickup limit.

| Starts | Wave | Added pressure |
| --- | --- | --- |
| 0:00 | Restless clearing | Husks; gentle opening |
| 0:18 | Skittering host | Skitters join pursuit |
| 0:35 | Bone volley | Archers introduce aimed shots |
| 0:55 | Horned advance | Brutes and periodic elites appear |
| 1:15 | Blighted ground | Hexers introduce area denial |
| 2:00 | Grave tide | More frequent spawns and tougher foes |
| 4:00 | Hollow hunt | More specialist enemies and elites |
| 7:00 | Ashen siege | Denser mixed pressure |
| 10:00 | Nightfall legion | Final current wave tier; scaling is bounded |

At most four enemies wind up special attacks together. Blight casts avoid nearby
active/pending pools, and both hostile projectile and pool counts are bounded.
The arena remains capped at 80 enemies. These limits protect warning readability
and responsive play. Guardian encounters temporarily replace normal waves.
Broader upgrade content and balance across the full range of builds remain later tasks.

## Guardians and dawn

| Arrival | Guardian | Positioning |
| --- | --- | --- |
| 4:00 | Ossuary Knight | Escape its forward sweep; sidestep its long cleave |
| 9:00 | Veil Matron | Weave between fan bolts; stand inside or outside the warned ring |
| 14:00 | Night Sovereign | Leave crossed lanes diagonally; avoid marked pools and radial bolts |

Dashed gold outlines warn before an attack, then solid bright outlines mark active
areas. Aim is locked when a warning appears. Rings mark their safe center with a
check; pools carry a cross. Boss bodies have larger silhouettes and hitboxes. The
HUD shows guardian health, positioning advice, progress, and time remaining until
dawn. Below half health, guardian recovery is 20% shorter; warning times stay unchanged.

Arrival banishes normal enemies and released hostile attacks without free kill
credit, and gives the guardian 1.5 seconds of grace at a safe distance. Dropped XP,
your build, statuses on the player, and earned upgrades remain. Up to six husk/
skitter reinforcements keep on-kill, DoT, healing, and multi-target builds active.
A guardian kill drops its XP, clears remaining encounter threats, heals **25% maximum
health** through the shared healing rules, and grants five seconds before waves resume.

Bosses use ordinary marks, Frost, Poison/curses, crits, companion ownership, wards,
and retaliation rules. **Resolve** prevents permanent hard-control loops: a successful
stun or root starts three seconds of protection against more stuns/roots. Slows,
Frost application/consumption, and bonus damage still work. Stuns interrupt unreleased
warnings; roots stop movement but allow stationary casts. Released bolts remain
active until the encounter ends. Danger and projectile counts remain capped.

The run clock stops during pauses and level choices. Victory requires all three
guardians defeated and the player alive at 15:00. A friendly killing hit on the
final tick resolves before hostile damage; a previously slain run cannot win.
Combat and pending choices freeze at either ending. Finished combat is not restored
after reload, but its saved reward/result is retained and cannot be claimed again.

## Permanent progress and saved builds

Every finished run, including an early defeat, earns one insight while you still
need research credits. Surviving two and four minutes adds one each; victory adds
two more, capped by remaining research needs. Research
costs one insight per capstone and remains unlocked through every free respec.
Once your unlocked capstones plus unspent insight cover all six, insight rewards
stop. No permanent damage, health, or speed purchases exist.

Complete two runs to earn a ninth talent point, then five total runs for the tenth
and final point. Early losses count, so progression never requires winning with
an underdeveloped build. All six branches and their non-capstone talents are
available from the start. Both victories and defeats count as completed runs.

Open **Talents → Progress, saved builds & backups** to see progression and the last
result. Choose one of three build slots, enter a name, and select **Save build**.
**Load build** replaces your current allocation with that slot's snapshot. Editing
the loaded build does not change the saved slot until you save it again. Draft
allocations and research save automatically. Editing and imports are available
between runs, never during combat or an upgrade choice.

For a portable backup, expand **Backup and restore** and choose **Export backup**.
It downloads a JSON file and puts the same text in the backup box for copying.
To restore, choose a file or paste its text, select **Review backup**, check the
progress summary, then **Replace local progress**. This deliberately replaces
progress rather than merging rewards. Invalid backups leave your current profile
intact. Older supported saves are migrated; a save from a newer game is preserved
and cannot be silently overwritten by playing this version.

Saves are local to this browser and site address. Changing device, browser,
protocol, host, or port uses separate storage. Clearing site data deletes the
local copies; keep an exported backup. A previous valid save supports automatic
recovery after damaged data. Invalid builds can be cleared independently while
keeping progression. The status in Talents reports recovery or failed saving.
If local storage is disabled or full, gameplay still works in memory; export
before leaving. Stale-tab writes are rejected when a changed save is detected;
reload that tab to use the latest profile.

A run identity is saved before combat. Its reward consumes that identity in the
same profile write. Repeated defeat handling and reloads cannot claim the reward
again. Reloading discards an unfinished run without a reward and keeps completed
progress and builds. Combat snapshots and offline installation are later work.

## Develop

Use Node **24.19.0 or later within Node 24** and npm **11 or later**. The exact
development runtime is pinned in `.node-version`; dependency versions are locked.

```sh
cd /workspace/Classless-survivors
npm ci
npm run dev
```

Vite serves development on port 5173. On your own machine, open
`http://localhost:5173`. Cloud access depends on your environment's port-forwarding
support. No environment variables, credentials, or external assets are required.

## Validate

```sh
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

Browser installation is a one-time step. If Linux system libraries are missing,
use Playwright's documented `npx playwright install --with-deps chromium` setup
on a machine where you have system-package installation permission.

To use an existing Chromium instead of downloading one:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser
```

After browser setup, `npm run check` runs unit tests, type checking, production
build, and production browser tests. Set the same executable-path variable for
that command when using a system browser. `npm run test:watch` watches unit tests.

Browser checks launch their own production preview server on port 4173 and fail
if that port is already occupied. They verify real canvas pixels, local asset
loading, resize behavior, keyboard navigation, combat through defeat/restart, and
no horizontal overflow at desktop, tablet, and Android-sized viewports. Real
browser touch dispatch tests on touch-enabled profiles cover virtual-stick
movement, multiple fingers, release/cancellation, and gesture suppression. The
simulation tests cover movement across frame rates, targeting, swept collision,
damage protection, XP, spawning, bounded entities, and reset behavior.
Progression checks also exercise queued levels, invalid/capped selections, rarity,
every upgrade's gameplay effect, piercing/explosion interactions, and maximum-level
completion. Browser leveling journeys navigate to actual rendered XP shards, verify
the frozen choice screen, select with keyboard/touch, inspect the improved ability,
earn a second level, and start a fresh run.
Talent tests cover all 36 functioning effects, mixed-branch synergies, valid
and invalid builds, prerequisites, cascading refunds, snapshots, and trigger
budgets/cycles. Browser checks inspect branch trees with keyboard/touch, enforce
the point limit, respec, and start a three-branch build. Additional browser journeys
allocate full Warrior/Mage branches and observe melee/ward drawing during combat.
Rogue/Hunter browser flows allocate complete branches with supports and observe
actual falcon, Poison, critical, snare, and Frost drawing. Unit tests verify each
new talent, curse-compatible expiration/spreading, attribution, critical cadence,
companion inheritance, tick timing, and allocation-order independence. Combat
feedback journeys fix the normal run seed for repeatability; they observe real
drawing and never inject internal game state.
Priest/Warlock browser journeys allocate complete supported builds and observe
actual healing crosses, holy attacks, wards, imp drawing, curses, and detonations.
Unit tests cover each of the twelve branch talents, partial/excess healing,
pickup throttling, holy/physical marks, final and lethal periodic ticks, explosion
caps and nonrecursion, companion bonus snapshots, and dense mixed builds.
Shared-system tests cover arc targeting, attribution, Frost consumption on lethal hits,
shield absorption/expiration, stuns, cooldown limits, and dense deterministic hybrids.
Enemy tests cover approach/retreat, fixed aim, warning times, charge sweeps,
interruptions, corner escapes, projectile/hazard lifetimes, elite status/XP rules,
spawn safety, all wave introductions, pause/reset, and dense 80-enemy combat.
Spatial queries match brute-force circle and swept-collision checks over cell
boundaries. Three seeded three-minute hybrid routes reach all behaviors and both
elite modifiers while gathering real XP. The browser journey plays a legal mixed
build and observes actual silhouette, warning, arrow, blight, and crown drawing;
it does not inject enemy or combat state.
Profile tests cover bounded rewards, early-loss progression, research, earned
larger builds, slot snapshots, duplicate rewards, reloads, migrations, malformed
saves, backup recovery, import validation, storage failures, and stale-tab writes.
Browser journeys save mixed builds, respec/load/reload them, research capstones,
download and restore backups, reject bad imports, and play a restored nine-point
build. Additional cases exercise damaged saves, newer formats, and disabled
storage. The defeat/restart journey checks persisted rewards and discards an
unfinished restarted run without duplicating rewards.
Boss tests cover all three schedules and pattern families, corner escapes, locked
warnings, arrival/grace, shared status/DoT/companion/retaliation behavior, Resolve,
reinforcement/hazard caps, healing breaks, final-tick ordering, frozen outcomes, and
one-time profile rewards. Five additional legal eight-point routes cover
retaliation, Frost/melee, critical/DoT, healing/offense, and summons. Together with
the two Mage/Priest routes, they complete real 900-second simulations using earned
XP/choices and a repeatable movement route. The five new routes still earn
choices beyond ten minutes. This establishes seeded winnability and later
progression, not comprehensive difficulty balance or human playtest quality.
Upgrade tests cover meaningful family effects, snapshots, capability eligibility,
critical/periodic cadence, healing/absorption boundaries, new hybrid reactions,
recovery fallbacks, maximum-range imp impacts, and guardian interactions. The
36-talents × 20 individual upgrade cases plus all-maximum combinations check
allocation-order determinism, finite state, queue limits and entity caps.
The guardian browser journey accelerates only RAF timestamp input by 12× and sends
movement key events based on the visible clock. It allocates a real mixed build,
chooses earned upgrades, observes actual guardian art/warnings, pauses an encounter,
then checks victory, saved rewards, respec, reload, and replay. It injects no combat
state and is not a real-time performance or physical-device benchmark.
The new browser upgrade journey selects a real Warrior/Hunter/Priest build,
acquires Longblade/Familiars/Wintersteel/Winter Pact, inspects updated abilities
and readable descriptions, then reloads and verifies temporary powers reset.
Level-choice keyboard traversal includes the expandable ability summary.

Presentation tests validate preferences/recovery, separate progress storage,
visual grouping/priority budgets, static reduced-motion geometry, distinct glyphs,
and complete icon coverage. Audio tests cover gesture gating, context reuse,
volume/mute, voice/cue limits, lifecycle replacement, autoplay retry, unavailable
backends and stale-event suppression. Browser checks tap the real master output
with an analyser to measure a waveform and subsequent muted silence, verify node
cancellation, save/reload controls, device preference changes, keyboard movement,
actual browser-context retry and play without audio/storage. This validates the
sound graph, not physical speaker quality. Existing dense-wave and full guardian
journeys retain real warnings, input and progression checks.

Screenshots and failure traces are
written to ignored `test-results/`. Emulation does not replace physical device
testing, and Chromium checks do not establish support in other browser engines.

## Production

```sh
npm run build
npm run preview
```

Preview serves the built app on port 4173. Deploy the contents of `dist/` to a
static web host. Asset URLs are relative to support subdirectory hosting. The
preview command is for local validation, not a production server. HTTPS and
offline installation guidance will be completed with the PWA milestone.

## Layout

- `src/main.ts`: browser initialization and canvas lifecycle.
- `src/game/`: deterministic simulation and fixed-timestep clock, without DOM APIs.
- `src/content/`: talent/upgrade definitions and combat/permanent-progression tuning.
- `src/profile/profile.ts`: pure permanent progression, research, builds, and run rewards.
- `src/persistence/`: validated versioned codec, injected storage/recovery, and browser adapter.
- `src/ui/`: DOM helpers, HUD presentation, and accessible upgrade selection.
- `src/input/`: keyboard and captured-pointer movement controls.
- `src/rendering/`: read-only Canvas layers and original procedural scene art.
- `src/presentation/`: validated preferences and pure visual grouping/priority rules.
- `src/audio/`: original tone definitions, lazy bounded Web Audio synthesis, and read-only cue direction.
- `src/ui/presentation-settings.ts`: accessible settings and device-motion observation.
- `src/persistence/presentation-store.ts`: separate settings storage and current-tab fallback.
- `src/styles.css` and `index.html`: responsive, semantic page shell.
- `tests/`: unit tests for logic independent of the browser.
- `e2e/`: browser checks against the production build.

The simulation module map:

| Responsibility | Module under `src/game/` |
| --- | --- |
| Tick order and completed-run guard | `run.ts` |
| Entity types and fresh-run state | `state.ts` |
| Plain encounter, danger, and campaign state | `campaign-state.ts` |
| Guardian schedule, construction, movement, adds, and defeat transitions | `bosses.ts` |
| Locked warning patterns | `boss-patterns.ts` |
| Warning release, danger geometry, and shared impacts | `boss-dangers.ts` |
| Timed ending and frozen results | `run-ending.ts` |
| Shared hard control and boss Resolve | `control.ts` |
| Guardian definitions and campaign tuning | `../content/bosses.ts` |
| Talent allocation, validation, and cascading refunds | `builds.ts` |
| Dimensions, timing, and gameplay tuning | `rules.ts` |
| Player movement and boundaries | `movement.ts` |
| Per-kind approach/retreat/charge movement and shared slowing | `enemy-movement.ts` |
| Enemy construction and snapshotted stats | `enemy-state.ts` |
| Enemy intent, locked targets, windups, and interruptions | `enemies.ts` |
| Attack releases, hostile projectiles, blight, and player impacts | `enemy-attacks.ts` |
| Ephemeral grid queries for swept projectile hits and blast areas | `spatial.ts` |
| Authored wave selection, elite cadence, and safe edge spawning | `spawning.ts` |
| Enemy/elite/attack tuning and wave definitions | `../content/enemies.ts`, `../content/waves.ts` |
| Targeting, cooldowns, projectile hits, and enemy contact | `combat.ts` |
| Shared enemy damage, kill credit, and death drops | `damage.ts` |
| Automatic directional melee arcs | `melee.ts` |
| Shared projectile volleys, upgrade inheritance, and attribution snapshots | `projectiles.ts` |
| Shared automatic-attack haste, timer rescaling, and refunds | `attack-timing.ts` |
| Frost/stun/root lifetimes, consumption, and status/cooldown timers | `statuses.ts` |
| Hit eligibility and companion inheritance | `hit-policy.ts` |
| Shared wound bonuses, Poison/curse application, and critical cadence | `hit-modifiers.ts` |
| Nonstacking periodic state, refreshes, and snapshots | `dot-state.ts` |
| Periodic ticks, expiration events, and extra pulses | `damage-over-time.ts` |
| Snare placement, caps, aging, and occupancy | `snares.ts` |
| Companion definitions, including attack mode and follow offsets | `../content/companions.ts` |
| Companion construction independent of damage code | `companion-state.ts` |
| Run-owned companion targeting, cooldowns, and commands | `companions.ts` |
| Consumption of holy marks before physical damage | `marks.ts` |
| Nonstacking wards, absorption, and shield-break events | `shields.ts` |
| Actual healing, overheal rejection, and healing events | `healing.ts` |
| Bounded typed combat-event queue | `events.ts` |
| Talent behavior modules by branch and active-handler registry | `talent-effects/` |
| XP drops, attraction, collection, and overflow merging | `pickups.ts` |
| XP thresholds, queued levels, offers, and validated choices | `progression.ts` |
| Capability-based upgrade eligibility, independent of class labels | `upgrade-eligibility.ts` |
| Temporary proc counters and cooldown state | `upgrade-state.ts` |
| Temporary shields and cooldown aging | `upgrade-timers.ts` |
| Bounded upgrade event handlers sharing the talent queue | `upgrade-effects.ts` |
| Player-facing derived ability descriptions | `ability-summary.ts` |
| Upgrade definitions, requirements, rank caps, and effect tuning | `../content/upgrades.ts`, `../content/upgrade-tuning.ts` |
| Deriving current run stats from selected upgrade ranks | `stats.ts` |
| Feedback events and their lifetimes | `effects.ts` |
| Distances, bounds, and swept collision geometry | `geometry.ts` |
| Run-owned seeded randomness | `random.ts` |
| Shared nearest-foe queries for talent effects | `targeting.ts` |
| Rendering-frame to fixed-tick scheduling | `clock.ts` |

Permanent rules and tuning are separate from combat. `profile/profile.ts` uses
pure transitions over a cloneable profile. `content/legacy.ts` owns the permanent
reward/point/slot limits. The simulation receives only a validated talent snapshot
and its earned budget. It never reads browser storage. `persistence/profile-codec.ts`
reconstructs known fields, validates finite bounds/prerequisites/research, repairs
individual damaged builds, and migrates the early `{version: 1, build,
completedRuns}` format to version 2. `profile-store.ts` owns storage failures,
previous-save recovery, and stale-write checks through an injected storage port.
Only `browser-profile.ts` acquires localStorage. `ui/profile-panel.ts` coordinates
named slots, backup previews, and restoration independently of the talent graph.

`run.ts` coordinates the systems in a deliberate order: advance time/cooldowns,
expire feedback, tick periodic damage and reactions, move the player, spawn enemies,
update snares, enemy intents, and enemy movement, attack, resolve bolts,
resolve projectile effects, cleave, strike with companions, and resolve their
effects. Collect XP, then release enemy attacks, advance hostile arrows/blight,
and apply contact damage if no level reward paused the run. This keeps killed enemies from damaging the player and gives a
level reward priority over contact. Systems mutate their own parts of the explicit
`Run` state; there is no hidden singleton state. Rendering
and input import only the state types and shared tuning they need. Keep new rules
in focused systems. Offer randomness has a separate run-owned seed stream, so
drawing upgrade cards does not consume enemy-spawn randomness. Projectile upgrades
are captured when a bolt is fired; existing shots retain their original properties.

Talent definitions live in `src/content/talents.ts`, with current numerical tuning
in `talent-tuning.ts`. Availability flags must match working implementations;
changing a preview flag alone does not implement a talent. Branch handlers live in
`src/game/talent-effects/`; shared wound/critical/Poison/curse modifiers and Frost
consumption run before hit events.
Frost consumption snapshots a separate event, allowing both talents to react even
when the victim dies. Projectile effects resolve before melee so same-tick Frost
can be consumed. Shield-break events only come from enemy damage absorption.
Simple original icons for all six branches live in `src/content/talent-icons.ts`.
Hit events snapshot critical state, active DoTs, and pre-hit slowing so lethal hits
and consuming Frost cannot erase later synergies. Handler order follows the catalog,
not allocation order. Periodic effects keep their tick clocks when refreshed and
are capped at one per kind. A paid periodic tick advances its clock before taking
a death snapshot, so Detonation counts only damage that has not already happened.
Holy marks and Atonement use one handler identity to prevent the bonus strike from
reapplying itself. Actual and excess healing have separate events. Pickups emit
collection events; the Priest handler owns Sanctuary's cooldown.
Guardian rendering, guardian HUD, and run-result presentation also have separate
read-only modules (`rendering/bosses.ts`, `ui/boss-hud.ts`, `ui/run-results.ts`).
The editor and graph renderer are separate UI modules. Feedback drawing is isolated
in `src/rendering/feedback.ts`; companions, snares, and afflictions each have a
focused renderer under `src/rendering/`. Player and pickup drawing now have their
own layers. `presentation/readability.ts` groups visual copies and prioritizes
feedback; it never merges actual collectible entities or consumes combat events.
The audio director observes run snapshots and sends bounded cues to the synth.
Preferences, browser settings UI, AudioContext lifetime, tone design and Canvas
motion variants are separate from gameplay rules.

Combat effects use FIFO events with source/school information, a six-generation
depth limit, 512-event queue/tick limits, and handler-ancestry suppression, retained by delayed projectiles. Limits
apply to secondary triggers; primary damage and death drops are applied directly.
`run.effects.dropped` and `suppressed` provide diagnostics for debugging chains.
The queue stores data only, so run state stays cloneable and contains no callbacks.
The finite event budget accommodates simultaneous ticks on 80 foes with both DoTs
and secondary reactions. Projectile collision and blast queries rebuild an ephemeral
spatial grid after movement, then use swept narrow-phase collisions. The index
never survives a tick or owns entities. Enemy attack state, projectiles, hazards,
and elite stats are plain run-owned data; rendering only reads them. Enemy body
and warning/projectile rendering live in separate focused modules. Tests retain the depth, ancestry, and fan-out safeguards;
this is not a claim of physical Android performance.

Simulation/progression stays separate from rendering and input. The background
is cached, screen-density buffers are capped, and enemy/projectile/pickup/effect
counts are bounded. These are basic safeguards; full-run optimization remains a
later milestone. All current assets are original SVG or programmatic Canvas artwork;
fonts are local system fonts. All dependencies are development tools and use
open-source licenses. There are no runtime package dependencies.

Modularity and inexpensive, readable art are standing requirements. Gameplay
systems should have focused, testable modules and clear ownership; content and
tuning should be easy to find and change. New art may use simple Canvas shapes,
SVG/vectors, or monochrome/limited-palette pixels, whichever is easiest to produce.
Readable existing art can stay. See [AGENTS.md](AGENTS.md) for development guidance.
