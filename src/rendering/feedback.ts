import { feedbackGlyphs } from '../presentation/readability';
import type { Spark } from '../game/state';
import { RULES } from '../game/rules';
import { TALENT_TUNING as T } from '../content/talent-tuning';

const COLORS: Record<Spark['kind'], string> = {
  hit: '#f4c77c', pickup: '#91e2ba', hurt: '#ec8b75', burst: '#ffb878',
  heal: '#91e2ba', physical: '#d6c8ae', arcane: '#90d4e2', holy: '#ffe4a1', shadow: '#bf9bd8',
  cleave: '#ece0bf', frost: '#a5dce8', lightning: '#d4c3ff', shield: '#8fbddc',
  critical: '#ffe9ad', poison: '#a8c978', root: '#a5dce8', falcon: '#c5d6bd',
  curse: '#bd9be8', detonation: '#d6a4ed', mark: '#e3c583', atonement: '#fff0c0', imp: '#ca8d9a',
};

/** Color plus shape distinguishes feedback without making more asset files. */
export function drawFeedback(context: CanvasRenderingContext2D, effects: readonly Spark[], reducedMotion = false): void {
  for (const effect of feedbackGlyphs(effects)) {
    const progress = reducedMotion ? 0.55 : 1 - effect.life / RULES.sparkLifetime;
    const radius = effect.radius ? effect.radius * progress : 3 + progress * 8;
    context.globalAlpha = Math.min(0.75, effect.life / RULES.sparkLifetime);
    context.strokeStyle = COLORS[effect.kind];
    context.lineWidth = 2;
    context.setLineDash(effect.kind === 'shadow' ? [3, 3] : []);
    context.beginPath();
    if (effect.kind === 'hit') {
      context.moveTo(effect.x - 3, effect.y + 3); context.lineTo(effect.x + 3, effect.y - 3);
    } else if (effect.kind === 'frost') {
      for (let i = 0; i < 3; i++) { const angle = i * Math.PI / 3;
        context.moveTo(effect.x - Math.cos(angle) * radius, effect.y - Math.sin(angle) * radius);
        context.lineTo(effect.x + Math.cos(angle) * radius, effect.y + Math.sin(angle) * radius); }
    } else if (effect.kind === 'curse' || effect.kind === 'detonation') {
      context.arc(effect.x, effect.y, radius, Math.PI / 2, Math.PI * 1.5);
      context.moveTo(effect.x + radius / 2, effect.y - radius);
      context.lineTo(effect.x + radius / 2, effect.y + radius);
    } else if (effect.kind === 'mark' || effect.kind === 'atonement') {
      context.rect(effect.x - radius / 2, effect.y - radius / 2, radius, radius);
      context.moveTo(effect.x, effect.y - radius); context.lineTo(effect.x, effect.y + radius);
    } else if (effect.kind === 'critical') {
      for (let i = 0; i < 8; i++) {
        const angle = i * Math.PI / 4;
        context.moveTo(effect.x + Math.cos(angle) * radius / 2, effect.y + Math.sin(angle) * radius / 2);
        context.lineTo(effect.x + Math.cos(angle) * radius, effect.y + Math.sin(angle) * radius);
      }
    } else if (effect.kind === 'poison') {
      for (const x of [-5, 0, 5]) {
        context.moveTo(effect.x + x + 2, effect.y - radius / 2 - Math.abs(x));
        context.arc(effect.x + x, effect.y - radius / 2 - Math.abs(x), 2, 0, Math.PI * 2);
      }
    } else if (effect.kind === 'shield') {
      context.moveTo(effect.x, effect.y - radius); context.lineTo(effect.x + radius, effect.y - radius / 2);
      context.lineTo(effect.x + radius / 2, effect.y + radius / 2); context.lineTo(effect.x, effect.y + radius);
      context.lineTo(effect.x - radius / 2, effect.y + radius / 2); context.lineTo(effect.x - radius, effect.y - radius / 2); context.closePath();
    } else if (effect.kind === 'root') {
      context.moveTo(effect.x - radius, effect.y + radius / 2); context.lineTo(effect.x + radius, effect.y + radius / 2);
      for (const offset of [-0.7, 0, 0.7]) { context.moveTo(effect.x + radius * offset, effect.y + radius); context.lineTo(effect.x + radius * offset, effect.y - radius / 2); }
    } else if (effect.kind === 'falcon') {
      context.moveTo(effect.x - radius, effect.y - radius / 2);
      context.lineTo(effect.x, effect.y + radius / 2);
      context.lineTo(effect.x + radius, effect.y - radius / 2);
    } else if (effect.kind === 'holy' || effect.kind === 'heal') {
      context.moveTo(effect.x - radius, effect.y); context.lineTo(effect.x + radius, effect.y);
      context.moveTo(effect.x, effect.y - radius); context.lineTo(effect.x, effect.y + radius);
    } else if (effect.kind === 'cleave') {
      const angle = effect.angle ?? 0;
      context.arc(effect.x, effect.y, radius, angle - T.meleeHalfAngle, angle + T.meleeHalfAngle);
    } else if (effect.kind === 'lightning') {
      context.moveTo(effect.x + radius / 2, effect.y - radius);
      context.lineTo(effect.x - radius / 2, effect.y);
      context.lineTo(effect.x + radius / 2, effect.y);
      context.lineTo(effect.x - radius / 2, effect.y + radius);
    } else if (effect.kind === 'arcane') {
      context.moveTo(effect.x, effect.y - radius); context.lineTo(effect.x + radius, effect.y);
      context.lineTo(effect.x, effect.y + radius); context.lineTo(effect.x - radius, effect.y);
      context.closePath();
    } else context.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
    context.stroke();
  }
  context.globalAlpha = 1;
  context.setLineDash([]);
}
