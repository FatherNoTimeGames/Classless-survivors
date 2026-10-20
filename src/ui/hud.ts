import { abilitySummary } from '../game/ability-summary';
import { createBossHud } from './boss-hud';
import { waveAt, WAVES } from '../content/waves';
import { PROGRESSION_RULES, UPGRADES } from '../content/upgrades';
import type { Run } from '../game/state';
import { getRunStats } from '../game/stats';
import { xpForLevel } from '../game/progression';
import { element, formatTime, formatAmount, setText } from './dom';
import { talentById } from '../content/talents';

/** HUD presentation reads state; it never awards XP or applies upgrades. */
export function createHud() {
  const bosses = createBossHud();
  const health = element<HTMLProgressElement>('#health');
  const healthText = element('#health-text');
  const xp = element('#run-xp');
  const kills = element('#run-kills');
  const timer = element('#run-time');
  const level = element('#run-level');
  const xpBar = element<HTMLProgressElement>('#level-progress');
  const xpLabel = element('#level-progress-text');
  const statsLabel = element('#ember-stats');
  const active = element('#active-upgrades');
  let previousRanks = '';
  let previousTalents = '';

  return {
    update(run: Run): void {
      bosses.update(run);
      const wave = waveAt(run.elapsed);
      setText(element('#wave-label'), `Wave ${WAVES.indexOf(wave) + 1} · ${wave.name}`);
      setText(element('#enemy-count'), `${run.enemies.length} foes · ${run.enemies.filter((enemy) => enemy.elite !== 'none').length} elites`);
      const stats = getRunStats(run.progression.ranks);
      const talentKey = JSON.stringify(run.talents);
      if (talentKey !== previousTalents) {
        previousTalents = talentKey;
        const list = element('#active-talents');
        list.replaceChildren();
        for (const id of run.talents) {
          const item = document.createElement('li');
          item.textContent = talentById(id)!.name;
          list.append(item);
        }
        if (!run.talents.length) {
          const item = document.createElement('li');
          item.textContent = 'No talents selected.';
          list.append(item);
        }
      }
      if (health.max !== stats.maxHealth) health.max = stats.maxHealth;
      if (health.value !== run.player.health) health.value = run.player.health;
      const shield = run.player.shield;
      setText(healthText, `${formatAmount(run.player.health)} / ${stats.maxHealth}${shield.amount > 0 ? ` · Ward ${formatAmount(shield.amount)} (${Math.ceil(shield.remaining)}s)` : ''}`);
      setText(xp, String(run.xp));
      setText(kills, String(run.kills));
      setText(timer, formatTime(run.elapsed));
      setText(level, String(run.progression.level));
      const capped = run.progression.level === PROGRESSION_RULES.maxLevel;
      xpBar.max = capped ? 1 : xpForLevel(run.progression.level);
      xpBar.value = capped ? 1 : run.progression.xpIntoLevel;
      setText(xpLabel, capped ? 'Maximum level' : `${run.progression.xpIntoLevel} / ${xpBar.max} XP`);
      const key = JSON.stringify([run.progression.ranks, run.talents]);
      if (key !== previousRanks) {
        previousRanks = key;
        setText(statsLabel, `Ember · ${stats.attackInterval.toFixed(2)}s cooldown · ${stats.projectileCount} target${stats.projectileCount === 1 ? '' : 's'} · ${stats.pierce} pierce · ${stats.blastRadius} blast range`);
        const summary = element('#ability-summary'); summary.replaceChildren();
        for (const line of abilitySummary(run)) { const item = document.createElement('li'); item.textContent = line; summary.append(item); }
        active.replaceChildren();
        for (const upgrade of UPGRADES) {
          const rank = run.progression.ranks[upgrade.id] ?? 0;
          if (!rank) continue;
          const item = document.createElement('li');
          item.textContent = upgrade.fallback ? `${upgrade.name} chosen ${rank} times` : `${upgrade.name} ${rank}/${upgrade.maxRank}`;
          const detail = document.createElement('span'); detail.className = 'upgrade-detail'; detail.textContent = upgrade.description; item.append(detail);
          active.append(item);
        }
        if (!active.childElementCount) {
          const item = document.createElement('li');
          item.textContent = 'No upgrades yet. Gather XP shards to level up.';
          active.append(item);
        }
      }
    },
  };
}
