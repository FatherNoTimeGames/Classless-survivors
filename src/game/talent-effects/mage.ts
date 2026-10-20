import type { EffectHandler } from '../events';
import type { Run } from '../state';
import { TALENT_TUNING as T } from '../../content/talent-tuning';
import { damageEnemy } from '../damage';
import { nearestEnemy } from '../targeting';
import { addSpark } from '../effects';
import { distance } from '../geometry';
import { grantShield } from '../shields';
import type { CombatEvent } from '../events';
import { inheritsOnHit } from '../hit-policy';
import { refundAttacks } from '../attack-timing';

export const arcaneEcho: EffectHandler<Run> = {
  id: 'arcane-echo', on: 'hit',
  apply(run, event) {
    if (event.type !== 'hit' || event.school !== 'fire' || !inheritsOnHit(run, event.source)) return;
    run.talentMemory.arcaneHits++;
    if (run.talentMemory.arcaneHits < T.echoHits) return;
    run.talentMemory.arcaneHits = 0;
    const target = nearestEnemy(run.enemies, event.position, T.echoRange, event.targetId);
    if (target) {
      addSpark(run, target, 'arcane');
      damageEnemy(run, target, T.echoDamage, { source: 'talent', school: 'arcane' });
    }
  },
};

export const rimeSigil: EffectHandler<Run> = {
  id: 'rime-sigil', on: 'hit',
  apply(run, event) {
    if (event.type !== 'hit' || !inheritsOnHit(run, event.source) || (event.school !== 'fire' && event.source !== 'summon')) return;
    const target = run.enemies.find((enemy) => enemy.id === event.targetId && enemy.health > 0);
    if (target) target.frost = T.frostDuration;
  },
};

export const chainSpark: EffectHandler<Run> = {
  id: 'chain-spark', on: 'hit',
  apply(run, event) {
    if (event.type !== 'hit' || event.school !== 'arcane') return;
    if (++run.talentMemory.chainHits < T.chainHits) return;
    run.talentMemory.chainHits = 0;
    const target = nearestEnemy(run.enemies, event.position, T.chainRange, event.targetId);
    if (target) {
      addSpark(run, target, 'lightning');
      damageEnemy(run, target, T.chainDamage, { source: 'talent', school: 'lightning' });
    }
  },
};

export const shatterglass: EffectHandler<Run> = {
  id: 'shatterglass', on: 'frost-consumed',
  apply(run, event) {
    addSpark(run, event.position, 'arcane', T.shatterRange);
    for (const enemy of run.enemies) {
      if (distance(enemy, event.position) <= T.shatterRange) damageEnemy(run, enemy, T.shatterDamage, { source: 'talent', school: 'arcane' });
    }
  },
};

function isTriggeredSpell(run: Run, event: CombatEvent): boolean {
  return event.type === 'hit' && event.school !== 'physical' && inheritsOnHit(run, event.source)
    && (event.source === 'talent' || event.source === 'blast' || event.source === 'summon');
}

export const manaWard: EffectHandler<Run> = {
  id: 'mana-ward', on: 'hit',
  apply(run, event) {
    if (!isTriggeredSpell(run, event)) return;
    if (++run.talentMemory.spellHits < T.manaWardHits) return;
    run.talentMemory.spellHits = 0;
    grantShield(run, T.wardAmount, T.wardDuration);
  },
};

export const riftweaver: EffectHandler<Run> = {
  id: 'riftweaver', on: 'hit',
  apply(run, event) {
    if (!isTriggeredSpell(run, event) || run.talentMemory.riftIn > 0) return;
    refundAttacks(run, T.riftRefund);
    run.talentMemory.riftIn = T.riftCooldown;
  },
};
