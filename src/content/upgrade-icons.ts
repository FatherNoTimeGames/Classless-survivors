import type { TalentId } from './talents';
import type { UpgradeId } from './upgrades';

/** Reuse original family glyphs; labels/descriptions distinguish related powers. */
export const UPGRADE_ICONS: Record<UpgradeId, TalentId> = {
  haste: 'riftweaver', fleet: 'hunting-momentum', magnet: 'harvest', vitality: 'communion',
  fork: 'contagion', pierce: 'sweeping-blade', burst: 'detonation', longblade: 'sweeping-blade',
  potency: 'agony', familiar: 'falcon', wellspring: 'siphon-toxin', aegis: 'iron-ward',
  precision: 'killer-instinct', venom: 'venom-edge', icebrand: 'frostbreak', riposte: 'reprisal',
  catalyst: 'nightfall', benediction: 'searing-grace', 'frost-pact': 'frost-trap', recovery: 'dawn-chorus',
};
