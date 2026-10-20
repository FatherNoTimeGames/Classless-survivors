# Talent and run-upgrade synergy pass

Reviewed all 36 talents and the seven current upgrades before task 8. The changes
keep combat families composable through shared modules. No new talent points,
permanent progression, or additional upgrade content were introduced.

## Shared upgrade rules

| Upgrade | Inheritance and useful interactions |
| --- | --- |
| Quickened Ember | Reduces the starting ember interval by 0.08s per rank. Applies the same proportional reduction to cleaves and both companions. More real hits feed critical cadence, statuses, and talent counters. Does not accelerate DoT ticks, proc cooldowns, or healing timers. |
| Forked Ember | Adds one distinct target per rank to starting ember, Spellsteel, and imp volleys. Hunting Momentum adds its separate target only to starting ember volleys. Melee and falcon strikes are unchanged. |
| Soul Needle | Starting ember, Spellsteel, and imp shots can hit one more foe per rank. Each shot hits a given foe directly once; those hits feed applicable counters and DoTs. |
| Ashburst | All three projectile families explode on impacts for half their captured shot damage before on-hit bonuses. Each rank adds 20 range. Explosions can crit, apply eligible statuses, and feed fire/triggered-spell effects. They cannot cause further Ashbursts. Imp explosions retain companion ownership and Pack Link requirements. Piercing can produce several impacts with overlapping blast areas. |
| Fleetfoot | Helps reach shards, evade contact, and position cleaves, retaliation, snares, and marks. No hidden damage bonus or automatic contact trigger. |
| Soul Gatherer | Extends attraction, leading to actual collections that can trigger Sanctuary, healing offense, companion buffs, or excess-heal wards. Attraction itself never grants healing; Sanctuary retains its one-second limit. |
| Living Ember | Raises maximum health before healing 12, so even a previously full player receives actual healing. This can fuel Searing Grace and Soul Link. It does not directly grant an overheal ward; only actual excess healing does that. |

All projectile properties are captured on launch. Haste rescales remaining automatic
attack timers rather than resetting them; unrelated choices leave them unchanged.
Soul Link is consumed once per companion attack, and every shot in an imp volley
receives that attack's captured bonus. A failed launch preserves the bonus.

## Branch review

- **Warrior:** Reprisal and Last Stand are physical hits, so they now contribute to
  Spellsteel and consume Frost through Frostbreak as well as Shatterglass. Spellsteel
  no longer needs a separately purchased melee ability to function. Linked physical
  companions also contribute. It inherits all three projectile upgrades, with a
  0.25s volley limit to prevent one dense cleave/retaliation spawning dozens of shots.
  Counts saturate at three; a full charge waits for a subsequent eligible physical
  hit with another target and available projectile space. Iron Ward and Last Stand
  retain health-loss/break rules; shield expiration is silent.
- **Mage:** Arcane Echo counts non-periodic fire from starting embers, Spellsteel,
  and explosions, plus linked companions. Rime uses those fire hits and any linked
  companion hit. Chain Spark and Shatterglass keep school/status requirements.
  Mana Ward and Riftweaver accept talent spells, explosions, and linked magical
  companion hits. Starting ember direct hits, physical hits, and periodic ticks
  remain excluded from those two triggers. Riftweaver refunds companion attack
  timers along with ember/melee, still only once per second.
- **Rogue:** Wound bonuses, Poison, critical cadence, spreading, expiration healing,
  and critical-kill pulses already use shared boundaries. New projectile recipients
  inherit these rules consistently. Companion blasts preserve Pack Link gating.
  DoTs never crit, reapply themselves, or count toward hit-based effects. Haste
  changes how often attacks apply effects, without shortening their tick clocks.
- **Priest:** Communion counts all kill families; Sanctuary requires collection.
  Actual healing feeds Grace, holy marks, and companion damage; excess healing
  feeds only Martyr Ward. Atonement can be consumed by retaliation and unlinked
  physical companions. Any ward can fuel Dawn Chorus and Last Stand when their
  absorption/break conditions occur. Upgrade choices freeze secondary reactions
  until simulation resumes; new maximum health/healing apply once at selection.
- **Warlock:** Curses, remaining-damage detonations, shared companion bonuses, and
  periodic-kill harvest keep their existing open triggers. The imp now benefits
  from haste, fork, and explosions as well as piercing. Pack Link permits its fire
  to feed Mage counters. Detonation uses scheduled future ticks, and its descendants
  cannot detonate again. Soul Link consumes actual healing, including Living Ember.
- **Hunter:** Momentum remains a nonstacking extra starting-ember target, added on
  top of Forked Ember; it waits if distinct targets/slots are insufficient. Falcon
  inherits haste and shared critical rules. Pack Link now explicitly shares physical,
  fire, and triggered-spell counters alongside existing modifiers/statuses.
  Frostbreak, Shatterglass, and Atonement react to physical companion hits without
  Pack Link. Snare/root limits and Wild Hunt's shared attack/command path remain.

## Proc safety and modular boundaries

`attack-timing.ts` owns haste, timer rescaling, and refunds. `projectiles.ts` owns
shared volley targeting, rank inheritance, and launch snapshots. Branch handlers
consume those mechanics instead of duplicating weapon-specific branches.

Delayed bolts capture effect depth/ancestry, then restore it for impact and splash.
Waiting for a projectile no longer starts a fresh proc chain. Later ordinary attacks
still start independent chains. The existing six-generation and 512-event queue/tick
limits remain unchanged. Primary damage and kill drops do not depend on secondary
events. A synthetic hostile fan-out is still deliberately cut off by those limits.

## Evidence and remaining scope

- 288 catalog sweep cases: each talent with its valid prerequisites against each
  upgrade at its rank cap, plus all upgrades at maximum ranks. Each case runs the
  simulation twice with reversed allocation order, checks real damage, finite state,
  entity bounds, and zero dropped events. This is a smoke sweep, not proof of every
  possible talent pair.
- Focused regressions exercise actual melee/companion haste, all projectile upgrade
  recipients, piercing and splash damage, companion DoT ownership, fire counters,
  ward/refund triggers, physical companion synergies, Living Ember healing, forked
  Soul Link snapshots, pickup healing/overhealing, delayed ancestry, and charged
  Spellsteel saturation/launch limits.
- Six legal eight-point hybrids run against 80 foes with all upgrade ranks maximized,
  with allocation-order comparisons and zero dropped secondary events. This is a
  short logic stress route, not a full-run balance or mobile performance claim.
- Existing unit and browser journeys remain required. The browser talent journey
  also checks the longer Spellsteel description and reachable Close control on
  desktop, tablet, and portrait phone layouts.

The starting attack remains present in every build, so projectile offers always
have a recipient. Retaliation/healing-specific upgrade choices, temporary hybrid
rewards, wider enemy balance, and full-length testing remain tasks 9–11 and 15–16.
Physical Android hardware and other browser engines have not been checked here.


## Task 11 extension: temporary hybrid upgrades

The original audit above describes the seven-upgrade pool at task 7a. Task 11
adds twelve lasting upgrade choices and Second Wind recovery (20 total choices).
Definitions and prerequisites live in `content/upgrades.ts`; event tuning in
`content/upgrade-tuning.ts`; eligibility, timers, and effect handlers have separate
simulation modules. Pure ability summaries are shared by HUD, picker, and results.

- Offers check capabilities supplied by talents **or acquired upgrades**. Shields,
  healing, Poison, and critical cadence can be acquired during a run without a
  matching talent branch. Narrow builds receive recovery when the pool is short.
- Longblade changes melee damage/reach; Familiars changes both companion families'
  damage/targeting. Haste, imp projectile upgrades, shot snapshots, and Pack Link
  retain their established behavior. Projectile lifetime now covers the selected
  aim distance, including a trailing imp at its expanded range.
- Viper Ink explicitly gives companions Poison without Pack Link. Potency applies
  once when Poison/curses are created/refreshed; copied DoTs retain their snapshot.
  No periodic tick creates a new DoT or advances critical cadence.
- Wintersteel uses any non-periodic physical hit, including retaliation/companions.
  Frost is applied after damage, allowing later Frost consumption. Boss Resolve
  still bounds hard control but does not block Frost or consumption damage.
- Absorption retaliation feeds physical talents. Actual healing waves feed holy
  marks and magical triggers; excess healing remains a separate boundary. Kill
  healing accepts all kill sources. Cooldowns/caps bound these additional paths.
- Catalyst accepts crits from any non-periodic family and pulses at most three
  afflicted foes, with a shared 0.75s cooldown; pulses cannot crit/refresh themselves.
- Winter Pact accepts slowed companion hits, including snares and pre-hit Frost
  snapshots. Its bounded arcane burst is player-triggered damage, feeding arcane
  triggers. It cannot count as another companion hit and retrigger itself.
- All secondary paths use the same FIFO ancestry/depth/work limits as talents.
  Delayed shots retain their ancestry. Catalog order preserves allocation-order
  determinism. No persistent stats, save version, backend, or paid service is added.

Validation includes individual behavior/eligibility tests, five distinct hybrid
boss checks, five complete earned-upgrade 900-second routes, the existing two
Mage/Priest full routes, and the expanded 36-talents × 20-upgrades plus all-maximum
bounded interaction sweep. The full balance/presentation/device passes remain
later milestones; seeded scripted victories are not a comprehensive balance claim.
