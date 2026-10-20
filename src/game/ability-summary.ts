import { COMPANIONS } from '../content/companions';
import { TALENT_TUNING as T } from '../content/talent-tuning';
import { UPGRADE_TUNING as U } from '../content/upgrade-tuning';
import { UPGRADES, upgradeRank } from '../content/upgrades';
import type { Run } from './state';
import { getRunStats } from './stats';
import { attackInterval } from './attack-timing';
import { RULES } from './rules';

/** Player-facing derived descriptions shared by the live HUD, picker and result snapshot. */
export function abilitySummary(run: Run): string[] {
  const ranks = run.progression.ranks, stats = getRunStats(ranks);
  const has = (id: typeof run.talents[number]) => run.talents.includes(id);
  const lines = [`Ember: ${RULES.attackDamage} fire · ${stats.attackInterval.toFixed(2)}s · ${stats.projectileCount} targets · ${stats.pierce} pierce · ${stats.blastRadius} blast.`];
  const blade = upgradeRank(ranks, 'longblade'), familiar = upgradeRank(ranks, 'familiar'), potency = upgradeRank(ranks, 'potency') * U.periodicDamage;
  if (has('sweeping-blade')) lines.push(`Blade: ${T.meleeDamage + blade * U.bladeDamage} physical · ${attackInterval(run, T.meleeInterval).toFixed(2)}s · ${T.meleeRange + blade * U.bladeRange} range · 120° arc.`);
  if (has('reprisal')) lines.push(`Iron Reprisal: ${T.reprisalDamage} physical within ${T.reprisalRange} after surviving health loss.`);
  for (const companion of run.companions) {
    const definition = COMPANIONS[companion.kind];
    lines.push(`${companion.kind === 'falcon' ? 'Falcon' : 'Imp'}: ${definition.damage + familiar * U.companionDamage} ${definition.school} · ${attackInterval(run, definition.interval).toFixed(2)}s · ${definition.range + familiar * U.companionRange} range${has('pack-link') ? ' · shares on-hit talents' : ' · crit/Frost-consumption talents work; other on-hit talents need Pack Link'}.`);
  }
  const venom = upgradeRank(ranks, 'venom');
  if (has('venom-edge') || venom) lines.push(`Poison: ${(has('venom-edge') ? T.poisonDamage : 1) + venom * U.venomDamage + potency} per second for ${T.poisonDuration}s. Refresh preserves tick timing.`);
  if (has('agony')) lines.push(`Curse: ${T.curseDamage + potency} shadow per second for ${T.curseDuration}s.`);
  const precision = upgradeRank(ranks, 'precision');
  if (has('killer-instinct') || precision) lines.push(`Critical hits: every ${(has('killer-instinct') ? T.criticalEvery : 6) - precision} non-periodic hits · ${T.criticalMultiplier}× damage. Companions share the cadence.`);
  const triggers: Partial<Record<keyof typeof ranks, string>> = {
    wellspring: `${U.wellspringHeal} healing every ${U.wellspringKills} kills.`,
    aegis: `${U.aegisAmount * upgradeRank(ranks, 'aegis')} ward for ${U.aegisDuration}s every ${U.aegisInterval}s while foes are present.`,
    icebrand: `Physical hits apply ${U.icebrandDuration}s Frost after damage.`,
    riposte: `${U.riposteDamage * upgradeRank(ranks, 'riposte')} physical within ${U.riposteRange} on absorption · once/${U.riposteCooldown}s · up to 8 foes.`,
    catalyst: `Critical hits pulse DoTs on ${U.catalystTargets} afflicted foes within ${U.catalystRange} · once/${U.catalystCooldown}s.`,
    benediction: `${U.benedictionDamage * upgradeRank(ranks, 'benediction')} holy within ${U.benedictionRange} after actual healing · once/${U.benedictionCooldown}s · up to ${U.benedictionTargets} foes.`,
    'frost-pact': `${U.pactDamage} arcane within ${U.pactRange} on slowed companion hits · once/${U.pactCooldown}s · up to ${U.pactTargets} foes.`,
  };
  for (const upgrade of UPGRADES) {
    if (upgradeRank(ranks, upgrade.id) && triggers[upgrade.id]) lines.push(`${upgrade.name}: ${triggers[upgrade.id]}`);
  }
  return lines;
}
