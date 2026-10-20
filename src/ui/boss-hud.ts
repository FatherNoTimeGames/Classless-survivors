import { BOSSES, CAMPAIGN, bossById } from '../content/bosses';
import type { Run } from '../game/state';
import { element, formatTime, setText } from './dom';

export function createBossHud() {
  const panel = element('#boss-hud'), health = element<HTMLProgressElement>('#boss-health');
  return {
    update(run: Run): void {
      const fight = run.campaign.active;
      const boss = fight && run.enemies.find((enemy) => enemy.id === fight.enemyId && enemy.health > 0);
      setText(element('#campaign-progress'), `${run.campaign.defeated.length}/3 guardians · Dawn in ${formatTime(Math.max(0, CAMPAIGN.duration - run.elapsed))}`);
      const next = BOSSES[run.campaign.nextBoss];
      setText(element('#next-guardian'), next ? `Next guardian ${formatTime(next.at)}` : run.campaign.active ? 'Final guardian' : 'Survive until 15:00');
      panel.hidden = !boss;
      if (!boss || !fight) return;
      const definition = bossById(fight.id);
      setText(element('#boss-name'), `${definition.name}${boss.health < boss.maxHealth / 2 ? ' · Enraged' : ''}`);
      health.max = boss.maxHealth; health.value = boss.health;
      setText(element('#boss-health-text'), `${Math.ceil(boss.health)} / ${boss.maxHealth}`);
      const warning = run.campaign.dangers.some((danger) => danger.phase === 'warning');
      setText(element('#boss-hint'), boss.grace > 0 ? 'A guardian arrives. Keep clear of its body.' : boss.stun > 0 ? 'Interrupted. Strike now.' : warning ? definition.hint : `${definition.hint}${boss.controlGuard > 0 ? ' Resolve: hard control resisted.' : ''}`);
    },
  };
}
