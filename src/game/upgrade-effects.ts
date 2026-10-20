import { UPGRADES, upgradeRank } from '../content/upgrades';
import { UPGRADE_TUNING as U } from '../content/upgrade-tuning';
import type { EffectHandler, DamageSchool } from './events';
import type { Point, Run } from './state';
import { distance } from './geometry';
import { damageEnemy } from './damage';
import { healPlayer } from './healing';
import { pulseDots } from './damage-over-time';
import { addSpark } from './effects';

function nearby(run: Run, origin: Point, radius: number, cap: number) {
  return run.enemies.filter((foe) => foe.health > 0 && distance(foe, origin) <= radius)
    .sort((a, b) => distance(a, origin) - distance(b, origin) || a.id - b.id).slice(0, cap);
}
function wave(run: Run, origin: Point, radius: number, damage: number, school: DamageSchool, cap: number): void {
  addSpark(run, origin, school === 'holy' ? 'holy' : school === 'arcane' ? 'arcane' : 'physical', radius);
  for (const foe of nearby(run, origin, radius, cap)) damageEnemy(run, foe, damage, { source: 'talent', school });
}

/** Upgrade handlers use the same FIFO ancestry/depth limits as talents, plus explicit proc cooldowns. */
const IMPLEMENTATIONS: Partial<Record<typeof UPGRADES[number]['id'], EffectHandler<Run>>> = {
  wellspring: { id: 'upgrade:wellspring', on: 'kill', apply(run) {
    if (++run.upgradeMemory.kills < U.wellspringKills) return;
    run.upgradeMemory.kills = 0; healPlayer(run, U.wellspringHeal);
  } },
  icebrand: { id: 'upgrade:icebrand', on: 'hit', apply(run, event) {
    if (event.type !== 'hit' || event.source === 'dot' || event.school !== 'physical') return;
    const foe = run.enemies.find((target) => target.id === event.targetId && target.health > 0);
    if (foe) { foe.frost = Math.max(foe.frost, U.icebrandDuration); addSpark(run, foe, 'frost'); }
  } },
  riposte: { id: 'upgrade:riposte', on: 'absorbed', apply(run, event) {
    if (run.upgradeMemory.riposteIn > 0) return;
    run.upgradeMemory.riposteIn = U.riposteCooldown;
    wave(run, event.position, U.riposteRange, U.riposteDamage * upgradeRank(run.progression.ranks, 'riposte'), 'physical', 8);
  } },
  catalyst: { id: 'upgrade:catalyst', on: 'hit', apply(run, event) {
    if (event.type !== 'hit' || !event.critical || run.upgradeMemory.catalystIn > 0) return;
    const afflicted = run.enemies.filter((foe) => foe.health > 0 && foe.dots.length && distance(foe, event.position) <= U.catalystRange)
      .sort((a, b) => distance(a, event.position) - distance(b, event.position) || a.id - b.id).slice(0, U.catalystTargets);
    if (!afflicted.length) return;
    run.upgradeMemory.catalystIn = U.catalystCooldown;
    addSpark(run, event.position, 'poison', U.catalystRange);
    for (const foe of afflicted) pulseDots(run, foe);
  } },
  benediction: { id: 'upgrade:benediction', on: 'healed', apply(run, event) {
    if (run.upgradeMemory.benedictionIn > 0) return;
    run.upgradeMemory.benedictionIn = U.benedictionCooldown;
    wave(run, event.position, U.benedictionRange, U.benedictionDamage * upgradeRank(run.progression.ranks, 'benediction'), 'holy', U.benedictionTargets);
  } },
  'frost-pact': { id: 'upgrade:frost-pact', on: 'hit', apply(run, event) {
    if (event.type !== 'hit' || event.source !== 'summon' || !event.slowed || run.upgradeMemory.pactIn > 0) return;
    run.upgradeMemory.pactIn = U.pactCooldown;
    wave(run, event.position, U.pactRange, U.pactDamage, 'arcane', U.pactTargets);
  } },
};

export function activeUpgradeEffects(run: Run): EffectHandler<Run>[] {
  return UPGRADES.filter((upgrade) => upgradeRank(run.progression.ranks, upgrade.id) > 0)
    .flatMap((upgrade) => IMPLEMENTATIONS[upgrade.id] ? [IMPLEMENTATIONS[upgrade.id]!] : []);
}
