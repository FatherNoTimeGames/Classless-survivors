import { TALENT_TUNING as T } from './talent-tuning';

export const BRANCHES = [
  { id: 'warrior', name: 'Warrior', symbol: '◆', theme: 'Steel, retaliation, and physical force.' },
  { id: 'mage', name: 'Mage', symbol: '✧', theme: 'Arcane echoes, frost, and spell combinations.' },
  { id: 'rogue', name: 'Rogue', symbol: '◈', theme: 'Exploit wounds, poisons, and critical openings.' },
  { id: 'priest', name: 'Priest', symbol: '✚', theme: 'Turn healing and protection into holy offense.' },
  { id: 'warlock', name: 'Warlock', symbol: '☽', theme: 'Curses, death bursts, and forbidden companions.' },
  { id: 'hunter', name: 'Hunter', symbol: '➶', theme: 'Extra targets, snares, and companion synergies.' },
] as const;
export type BranchId = typeof BRANCHES[number]['id'];
export interface TalentDefinition {
  id: string;
  branch: BranchId;
  name: string;
  tier: number;
  slot: number;
  requires: readonly string[];
  description: string;
  implemented: boolean;
  synergies: readonly BranchId[];
}

/** All 36 designs are visible; only implemented talents may be allocated. One point each. */
export const TALENTS = [
  { id: 'reprisal', branch: 'warrior', name: 'Iron Reprisal', tier: 0, slot: 0, requires: [], implemented: true,
    description: `After losing health to an enemy attack and surviving, retaliate for ${T.reprisalDamage} physical damage to enemies within ${T.reprisalRange} range.`, synergies: ['rogue', 'priest'] },
  { id: 'sweeping-blade', branch: 'warrior', name: 'Sweeping Blade', tier: 1, slot: 0, requires: ['reprisal'], implemented: true,
    description: `Automatically face the nearest foe within ${T.meleeRange} range and cleave a 120° arc for ${T.meleeDamage} physical damage every ${T.meleeInterval} seconds before haste.`, synergies: ['mage', 'rogue'] },
  { id: 'spellsteel', branch: 'warrior', name: 'Spellsteel', tier: 1, slot: 1, requires: ['reprisal'], implemented: true,
    description: `Every ${T.spellsteelHits} non-periodic physical hits fire a ${T.spellsteelDamage}-damage ember volley from the victim at other foes within ${T.spellsteelRange} range. Melee and retaliation qualify; companions need Pack Link. Inherits projectile upgrades; at most one volley every ${T.spellsteelCooldown} seconds. A full charge waits for an eligible hit, target, and projectile space.`, synergies: ['mage', 'hunter'] },
  { id: 'frostbreak', branch: 'warrior', name: 'Frostbreak', tier: 2, slot: 0, requires: ['sweeping-blade'], implemented: true,
    description: `Non-periodic physical hits against Frost, including retaliation and companions, deal ${T.frostbreakDamage} extra physical damage and consume Frost to stun for ${T.frostbreakStun} seconds. Can trigger Shatterglass on the same hit.`, synergies: ['mage', 'hunter'] },
  { id: 'iron-ward', branch: 'warrior', name: 'Iron Ward', tier: 2, slot: 1, requires: ['spellsteel'], implemented: true,
    description: `Surviving health loss grants a ${T.wardAmount}-point shield for ${T.wardDuration} seconds, once every ${T.ironWardCooldown} seconds. Shields refresh without stacking.`, synergies: ['priest', 'mage'] },
  { id: 'last-stand', branch: 'warrior', name: 'Last Stand', tier: 3, slot: 0, requires: ['frostbreak', 'iron-ward'], implemented: true,
    description: `When enemy damage breaks your shield, strike foes within ${T.lastStandRange} range for ${T.lastStandDamage} physical damage. Once per shield; expiration does not trigger it.`, synergies: ['priest', 'mage'] },

  { id: 'arcane-echo', branch: 'mage', name: 'Arcane Echo', tier: 0, slot: 0, requires: [], implemented: true,
    description: `Every ${T.echoHits} non-periodic fire hits, including Spellsteel and explosions, deal ${T.echoDamage} arcane damage to another enemy within ${T.echoRange} range of the struck foe. Companions count with Pack Link.`, synergies: ['rogue', 'hunter'] },
  { id: 'rime-sigil', branch: 'mage', name: 'Rime Sigil', tier: 1, slot: 0, requires: ['arcane-echo'], implemented: true,
    description: `Non-periodic fire hits, including explosions, apply Frost, slowing by ${T.frostSlow * 100}% for ${T.frostDuration} seconds. Companions require Pack Link and then apply Frost with any non-periodic hit. Reapplying refreshes the duration.`, synergies: ['warrior', 'hunter'] },
  { id: 'chain-spark', branch: 'mage', name: 'Chain Spark', tier: 1, slot: 1, requires: ['arcane-echo'], implemented: true,
    description: `Every ${T.chainHits} arcane hits chain ${T.chainDamage} lightning damage to another foe within ${T.chainRange} range. Lightning cannot count itself.`, synergies: ['rogue', 'warlock'] },
  { id: 'shatterglass', branch: 'mage', name: 'Shatterglass', tier: 2, slot: 0, requires: ['rime-sigil'], implemented: true,
    description: `Physical hits consume Frost to explode for ${T.shatterDamage} arcane damage within ${T.shatterRange} range, including surviving victims. Works with Frostbreak, including on lethal hits.`, synergies: ['warrior', 'hunter'] },
  { id: 'mana-ward', branch: 'mage', name: 'Mana Ward', tier: 2, slot: 1, requires: ['chain-spark'], implemented: true,
    description: `Every ${T.manaWardHits} triggered spell hits grant a ${T.wardAmount}-point shield for ${T.wardDuration} seconds; shields refresh without stacking. Talent spells, explosions, and linked companion spells count; direct embers, physical hits, and periodic ticks do not count.`, synergies: ['warrior', 'priest'] },
  { id: 'riftweaver', branch: 'mage', name: 'Riftweaver', tier: 3, slot: 0, requires: ['shatterglass', 'mana-ward'], implemented: true,
    description: `Triggered spell hits reduce ember, melee, and companion attack cooldowns by ${T.riftRefund} seconds, at most once every ${T.riftCooldown} second. Talent spells, explosions, and linked companion spells count; direct embers, physical hits, and periodic ticks do not count.`, synergies: ['warrior', 'priest', 'warlock'] },

  { id: 'expose-weakness', branch: 'rogue', name: 'Expose Weakness', tier: 0, slot: 0, requires: [], implemented: true,
    description: `Your non-periodic hits against wounded enemies deal ${T.exposedDamage} extra damage and reduce automatic attack cooldowns by ${T.exposedRefund} seconds. Companions inherit this with Pack Link.`, synergies: ['warrior', 'mage', 'warlock'] },
  { id: 'venom-edge', branch: 'rogue', name: 'Venom Edge', tier: 1, slot: 0, requires: ['expose-weakness'], implemented: true,
    description: `Your non-periodic hits apply Poison: ${T.poisonDamage} damage each second for ${T.poisonDuration} seconds. Refreshes without stacking or delaying ticks. Works with weapons, spells, and retaliation; companions need Pack Link.`, synergies: ['warrior', 'warlock'] },
  { id: 'killer-instinct', branch: 'rogue', name: 'Killer Instinct', tier: 1, slot: 1, requires: ['expose-weakness'], implemented: true,
    description: `Every ${T.criticalEvery} non-periodic hits critically strike for ${T.criticalMultiplier}× damage, across weapons, spells, and retaliation. Companions share this cadence; periodic ticks cannot crit.`, synergies: ['hunter', 'mage'] },
  { id: 'siphon-toxin', branch: 'rogue', name: 'Siphon Toxin', tier: 2, slot: 0, requires: ['venom-edge'], implemented: true,
    description: `When any damage-over-time effect expires naturally on a surviving enemy, restore ${T.siphonHeal} health. Poison and curses qualify; deaths do not count as expiration.`, synergies: ['priest', 'warlock'] },
  { id: 'contagion', branch: 'rogue', name: 'Contagion', tier: 2, slot: 1, requires: ['killer-instinct'], implemented: true,
    description: `Critical hits copy all of the victim’s active damage-over-time effects to the ${T.contagionTargets} nearest other foes within ${T.contagionRange} range, even on lethal hits. Includes Poison applied by that hit; effects do not stack.`, synergies: ['warlock', 'warrior'] },
  { id: 'nightfall', branch: 'rogue', name: 'Nightfall', tier: 3, slot: 0, requires: ['siphon-toxin', 'contagion'], implemented: true,
    description: `Critical kills trigger one extra tick of every active damage-over-time effect within ${T.nightfallRange} range. Includes effects spread by that hit. Extra ticks cannot crit or trigger another Nightfall.`, synergies: ['warlock', 'hunter'] },

  { id: 'communion', branch: 'priest', name: 'Ember Communion', tier: 0, slot: 0, requires: [], implemented: true,
    description: `Every ${T.communionKills} kills, from any source, restore ${T.communionHeal} health. Kills caused by this talent’s own healing chain do not count. Excess healing can feed Martyr Ward.`, synergies: ['hunter', 'warlock'] },
  { id: 'searing-grace', branch: 'priest', name: 'Searing Grace', tier: 1, slot: 0, requires: ['communion'], implemented: true,
    description: `Actual healing deals ${T.graceDamage} holy damage to the nearest enemy within ${T.graceRange} range. Overhealing does not trigger it.`, synergies: ['rogue', 'warlock'] },
  { id: 'sanctuary', branch: 'priest', name: 'Sanctuary', tier: 1, slot: 1, requires: ['communion'], implemented: true,
    description: `Collecting an XP shard attempts ${T.sanctuaryHeal} healing, at most once every ${T.sanctuaryCooldown} second. Excess healing can feed Martyr Ward.`, synergies: ['hunter', 'warlock'] },
  { id: 'atonement', branch: 'priest', name: 'Atonement', tier: 2, slot: 0, requires: ['searing-grace'], implemented: true,
    description: `Non-periodic holy hits mark surviving foes for ${T.markDuration} seconds. The next non-periodic physical hit consumes the mark to strike for ${T.atonementDamage} holy damage if the foe survives. Works with companions and retaliation; the bonus strike cannot reapply its own mark.`, synergies: ['warrior', 'hunter'] },
  { id: 'martyr-ward', branch: 'priest', name: 'Martyr Ward', tier: 2, slot: 1, requires: ['sanctuary'], implemented: true,
    description: `${T.martyrFraction * 100}% of excess healing adds to your shield, up to ${T.martyrCap} points, and refreshes it for ${T.martyrDuration} seconds. Does not weaken stronger shields. Excess healing cannot trigger Searing Grace or Soul Link.`, synergies: ['warrior', 'mage'] },
  { id: 'dawn-chorus', branch: 'priest', name: 'Dawn Chorus', tier: 3, slot: 0, requires: ['atonement', 'martyr-ward'], implemented: true,
    description: `Whenever any shield absorbs damage, attempt ${T.dawnHeal} healing and strike the nearest foe within ${T.dawnRange} range for ${T.dawnDamage} holy damage, once every ${T.dawnCooldown} second. Works with all shield sources, including a shield-breaking hit.`, synergies: ['warrior', 'mage'] },

  { id: 'soul-cinder', branch: 'warlock', name: 'Soul Cinder', tier: 0, slot: 0, requires: [], implemented: true,
    description: `Every ${T.cinderKills} kills, from any source, release a ${T.cinderDamage}-damage shadow burst within ${T.cinderRange} range. Kills from its own effect chain do not count.`, synergies: ['mage', 'rogue'] },
  { id: 'agony', branch: 'warlock', name: 'Agony', tier: 1, slot: 0, requires: ['soul-cinder'], implemented: true,
    description: `Your non-periodic hits apply a curse: ${T.curseDamage} shadow damage each second for ${T.curseDuration} seconds. Weapons, spells, and retaliation qualify; companions inherit with Pack Link. Refreshes do not stack or delay ticks.`, synergies: ['rogue', 'mage'] },
  { id: 'grim-pact', branch: 'warlock', name: 'Grim Pact', tier: 1, slot: 1, requires: ['soul-cinder'], implemented: true,
    description: `Summon an imp that fires ${T.impDamage}-damage embers at the nearest foe within ${T.impRange} range every ${T.impInterval} seconds before haste. Inherits haste, extra projectile targets, piercing, and explosions; shares critical rules. Pack Link shares on-hit and triggered-spell effects.`, synergies: ['hunter', 'mage'] },
  { id: 'detonation', branch: 'warlock', name: 'Detonation', tier: 2, slot: 0, requires: ['agony'], implemented: true,
    description: `Deaths carrying damage-over-time effects explode for their remaining scheduled damage within ${T.detonationRange} range. Poison and curses count; base damage is capped at ${T.detonationCap} before bonuses. Detonation and its immediate triggered hits cannot chain another explosion.`, synergies: ['rogue', 'warrior'] },
  { id: 'soul-link', branch: 'warlock', name: 'Soul Link', tier: 2, slot: 1, requires: ['grim-pact'], implemented: true,
    description: `Actual healing stores ${T.soulLinkFraction * 100}% of the amount as bonus damage for each companion’s next attack (all shots in an imp volley), capped at ${T.soulLinkCap} per companion. Works with imps and falcons. Excess healing does not count; fired shots retain their original damage.`, synergies: ['priest', 'hunter'] },
  { id: 'harvest', branch: 'warlock', name: 'Harvest', tier: 3, slot: 0, requires: ['detonation', 'soul-link'], implemented: true,
    description: `Damage-over-time kills attempt ${T.harvestHeal} healing and extend the shortest active effect on the nearest afflicted foe within ${T.harvestRange} range by ${T.harvestExtension} second, up to ${T.harvestDurationCap} seconds remaining. Poison and curses qualify; tick timing is preserved.`, synergies: ['rogue', 'priest'] },

  { id: 'hunting-momentum', branch: 'hunter', name: 'Hunting Momentum', tier: 0, slot: 0, requires: [], implemented: true,
    description: 'Any kill, including spells, damage-over-time, or companions, stores one extra ember target. The next ember volley with enough distinct targets consumes it. Does not stack.', synergies: ['rogue', 'mage'] },
  { id: 'falcon', branch: 'hunter', name: 'Falcon Companion', tier: 1, slot: 0, requires: ['hunting-momentum'], implemented: true,
    description: `Summon a falcon that strikes the nearest foe within ${T.falconRange} range for ${T.falconDamage} physical damage every ${T.falconInterval} second before haste. Shares your critical cadence and critical effects. Pack Link shares other on-hit effects.`, synergies: ['rogue', 'warrior'] },
  { id: 'snare', branch: 'hunter', name: 'Snaring Shot', tier: 1, slot: 1, requires: ['hunting-momentum'], implemented: true,
    description: `Every ${T.snareHits} non-periodic hits leave a snare at the victim for ${T.snareDuration} seconds, slowing foes within ${T.snareRange} range by ${T.snareSlow * 100}%. Any weapon or spell qualifies; companions need Pack Link. Strongest slow wins; at most ${T.maxSnares} snares.`, synergies: ['mage', 'warlock'] },
  { id: 'pack-link', branch: 'hunter', name: 'Pack Link', tier: 2, slot: 0, requires: ['falcon'], implemented: true,
    description: 'Companions inherit wound bonuses, Poison, curses, Frost, snares, and roots. Fire hits feed Arcane Echo; physical hits feed Spellsteel; magical hits feed Mana Ward and Riftweaver. Critical rules, Frostbreak, and Shatterglass already work without this talent.', synergies: ['rogue', 'warlock'] },
  { id: 'frost-trap', branch: 'hunter', name: 'Frost Trap', tier: 2, slot: 1, requires: ['snare'], implemented: true,
    description: `Your non-periodic hits against any slowed foe root it for ${T.rootDuration} seconds and apply ${T.frostDuration} seconds of Frost. Works with snares or Frost; ${T.rootCooldown}-second cooldown per foe. Companions inherit with Pack Link. Roots stop movement, not contact attacks.`, synergies: ['mage', 'warrior'] },
  { id: 'wild-hunt', branch: 'hunter', name: 'Wild Hunt', tier: 3, slot: 0, requires: ['pack-link', 'frost-trap'], implemented: true,
    description: `Consuming Hunting Momentum commands every companion to strike immediately, bypassing its cooldown. At most once every ${T.wildHuntCooldown} seconds. Any kill can supply Momentum, including companion and periodic kills.`, synergies: ['warlock', 'rogue'] },
] as const satisfies readonly TalentDefinition[];

export type TalentId = typeof TALENTS[number]['id'];
export const talentById = (id: string): TalentDefinition | undefined => TALENTS.find((talent) => talent.id === id);
