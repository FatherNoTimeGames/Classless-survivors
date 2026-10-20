import type { TalentId } from '../src/content/talents';
import type { UpgradeId } from '../src/content/upgrades';
import { RUN_ROUTES } from '../tests/hybrid-routes';

export interface BalanceRoute { name: string; talents: readonly TalentId[]; priority: readonly UpgradeId[] }

// Include the historical routes, then broaden coverage beyond their shared Priest pair.
export const BALANCE_ROUTES: readonly BalanceRoute[] = [
  ...RUN_ROUTES,
  { name: 'spellsteel/no-priest', talents: ['reprisal', 'sweeping-blade', 'spellsteel', 'frostbreak', 'iron-ward', 'arcane-echo', 'rime-sigil', 'shatterglass'],
    priority: ['wellspring', 'aegis', 'longblade', 'icebrand', 'riposte'] },
  { name: 'venom-flock/no-priest', talents: ['hunting-momentum', 'falcon', 'pack-link', 'expose-weakness', 'venom-edge', 'killer-instinct', 'soul-cinder', 'agony'],
    priority: ['wellspring', 'aegis', 'familiar', 'venom', 'precision', 'catalyst', 'potency'] },
  { name: 'frost-flock/no-priest', talents: ['hunting-momentum', 'falcon', 'pack-link', 'snare', 'frost-trap', 'arcane-echo', 'rime-sigil', 'shatterglass'],
    priority: ['wellspring', 'aegis', 'familiar', 'frost-pact', 'icebrand'] },
  { name: 'six-branch-starter', talents: ['reprisal', 'sweeping-blade', 'arcane-echo', 'expose-weakness', 'communion', 'soul-cinder', 'hunting-momentum', 'falcon'],
    priority: ['familiar', 'longblade', 'wellspring', 'aegis'] },
];
