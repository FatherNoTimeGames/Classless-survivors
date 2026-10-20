import type { Spark } from '../game/state';
import { RULES } from '../game/rules';

const COLORS: Record<Spark['kind'], string> = {
  hit: '#f4c77c', pickup: '#91e2ba', hurt: '#ec8b75', burst: '#ffb878',
  heal: '#91e2ba', physical: '#d6c8ae', arcane: '#90d4e2', holy: '#ffe4a1', shadow: '#bf9bd8',
};

/** Color plus shape distinguishes feedback without making more asset files. */
export function drawFeedback(context: CanvasRenderingContext2D, effects: readonly Spark[]): void {
  for (const effect of effects) {
    const progress = 1 - effect.life / RULES.sparkLifetime;
    const radius = effect.radius ? effect.radius * progress : 3 + progress * 10.5;
    context.globalAlpha = effect.life / RULES.sparkLifetime;
    context.strokeStyle = COLORS[effect.kind];
    context.lineWidth = 2;
    context.setLineDash(effect.kind === 'shadow' ? [3, 3] : []);
    context.beginPath();
    if (effect.kind === 'holy' || effect.kind === 'heal') {
      context.moveTo(effect.x - radius, effect.y); context.lineTo(effect.x + radius, effect.y);
      context.moveTo(effect.x, effect.y - radius); context.lineTo(effect.x, effect.y + radius);
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
