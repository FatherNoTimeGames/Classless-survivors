import { drawPlayer } from './player';
import { drawPickups } from './pickups';
import type { Run } from '../game/state';
import { drawFeedback } from './feedback';
import { drawSanctuary } from './sanctuary';
import { drawBosses, drawBossDangers } from './bosses';
import { drawEnemies } from './enemies';
import { drawEnemyWarnings, drawEnemyProjectiles } from './enemy-attacks';
import { drawCompanions } from './companions';
import { drawSnares } from './snares';
import { fitViewport } from './viewport';
import { arenaSize } from '../game/arena-size';

export function createArenaRenderer(canvas: HTMLCanvasElement, motion: () => boolean = () => false) {
  const context = canvas.getContext('2d');
  if (!context) return null;
  const backdrop = document.createElement('canvas');
  let backdropKey = '';
  const backdropContext = backdrop.getContext('2d');
  if (!backdropContext) return null;


  const block = (x: number, y: number, w: number, h: number, color: string) => {
    context.fillStyle = color;
    context.fillRect(Math.round(x), Math.round(y), w, h);
  };

  return {
    draw(run: Run | null): void {
      const bounds = canvas.getBoundingClientRect();
      const world = run?.world ?? arenaSize(bounds.width, bounds.height);
      const key = `${world.width}:${world.height}`;
      if (key !== backdropKey) {
        canvas.dataset.worldWidth = String(world.width); canvas.dataset.worldHeight = String(world.height);
        backdropKey = key; backdrop.width = Math.ceil(world.width); backdrop.height = Math.ceil(world.height);
        drawSanctuary(backdropContext, world);
      }
      const view = fitViewport(bounds.width, bounds.height, window.devicePixelRatio, world);
      if (!view) return;
      if (canvas.width !== view.bufferWidth) canvas.width = view.bufferWidth;
      if (canvas.height !== view.bufferHeight) canvas.height = view.bufferHeight;
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.setTransform(view.scale, 0, 0, view.scale, view.offsetX, view.offsetY);
      context.imageSmoothingEnabled = false;
      context.drawImage(backdrop, 0, 0);
      if (!run) return;

      context.strokeStyle = '#67714a60';
      context.lineWidth = 1;
      context.strokeRect(8, 8, world.width - 16, world.height - 16);
      const reduced = motion();
      drawPickups(context, run, reduced);
      drawSnares(context, run);
      drawEnemies(context, run, reduced);
      drawBosses(context, run, reduced);

      drawCompanions(context, run, reduced);
      for (const bolt of run.bolts) {
        context.strokeStyle = bolt.source === 'summon' ? '#dba4dc' : bolt.pierce > 0 ? '#91cfcc' : '#c17d3b';
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(bolt.x - bolt.vx * 0.035, bolt.y - bolt.vy * 0.035);
        context.lineTo(bolt.x, bolt.y);
        context.stroke();
        if (bolt.source === 'summon') {
          context.fillStyle = '#f5c7ec';
          context.beginPath();
          context.moveTo(bolt.x, bolt.y - 3); context.lineTo(bolt.x + 3, bolt.y);
          context.lineTo(bolt.x, bolt.y + 3); context.lineTo(bolt.x - 3, bolt.y);
          context.closePath(); context.fill();
        } else block(bolt.x - 2, bolt.y - 2, 4, 4, bolt.blastRadius > 0 ? '#ffb878' : '#ffe2a2');
      }
      drawFeedback(context, run.sparks, reduced);
      // Critical hostile geometry is never covered by XP, creatures or friendly effects.
      drawEnemyWarnings(context, run);
      drawBossDangers(context, run);
      drawPlayer(context, run, reduced);
      drawEnemyProjectiles(context, run);
    },
  };
}
