import type { TalentId } from '../content/talents';
import { upgradeRank } from '../content/upgrades';
import type { UpgradeCapability, UpgradeRanks } from '../content/upgrades';

/** Capabilities describe observable triggers, not a character class. Run upgrades can open new paths. */
export function upgradeCapabilities(talents: readonly TalentId[], ranks: UpgradeRanks): Set<UpgradeCapability> {
  const has = (...ids: TalentId[]) => ids.some((id) => talents.includes(id));
  const ranked = (id: keyof UpgradeRanks) => upgradeRank(ranks, id) > 0;
  const capabilities = new Set<UpgradeCapability>();
  if (has('sweeping-blade')) capabilities.add('melee');
  if (has('reprisal', 'sweeping-blade', 'falcon') || ranked('riposte')) capabilities.add('physical');
  if (has('venom-edge', 'agony') || ranked('venom')) capabilities.add('periodic');
  if (has('falcon', 'grim-pact')) capabilities.add('companion');
  if (has('communion', 'sanctuary', 'siphon-toxin', 'harvest', 'dawn-chorus') || ranked('wellspring')) capabilities.add('healing');
  if (has('iron-ward', 'mana-ward', 'martyr-ward') || ranked('aegis')) capabilities.add('shield');
  if (has('killer-instinct') || ranked('precision')) capabilities.add('critical');
  if (has('rime-sigil', 'frost-trap', 'snare') || ranked('icebrand')) capabilities.add('slow');
  return capabilities;
}
