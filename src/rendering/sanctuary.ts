import { WORLD } from '../game/rules';
import type { ArenaSize } from '../game/arena-size';

/** Original, static pixel art; no downloaded textures, fonts, or animation loop. */
export function drawSanctuary(context: CanvasRenderingContext2D, world: ArenaSize = WORLD): void {
  const block = (x: number, y: number, width: number, height: number, color: string) => {
    context.fillStyle = color;
    context.fillRect(x, y, width, height);
  };

  block(0, 0, world.width, world.height, '#162324');
  for (let y = 0; y < world.height; y += 16) {
    for (let x = 0; x < world.width; x += 16) {
      const variation = (x * 13 + y * 7) % 11;
      block(x + 2, y + 2, 13, 13, variation < 4 ? '#1b2928' : '#182626');
      if (variation < 3) block(x + 4, y + 6, 3, 2, '#304035');
    }
  }

  context.save(); context.translate((world.width - WORLD.width) / 2, (world.height - WORLD.height) / 2);
  // Broken flagstones lead through the clearing.
  for (let y = 140; y < world.height; y += 24) {
    for (let x = 132; x < 224; x += 24) {
      const chipped = (x + y) % 5;
      block(x + chipped, y, 21 - chipped, 19, '#35413b');
      block(x + chipped, y, 21 - chipped, 2, '#435048');
      block(x + 3, y + 16, 13, 2, '#293732');
    }
  }

  // A ruined arch, deliberately brighter than the surrounding trees.
  block(102, 132, 20, 88, '#25312e');
  block(238, 132, 20, 88, '#25312e');
  block(108, 124, 16, 84, '#536057');
  block(236, 124, 16, 84, '#46554d');
  block(124, 108, 16, 28, '#536057');
  block(220, 108, 16, 28, '#46554d');
  block(140, 98, 80, 20, '#536057');
  block(146, 98, 68, 3, '#6b7564');
  block(174, 97, 12, 25, '#b09c69');
  block(178, 103, 4, 11, '#ded0a1');
  for (const x of [108, 236]) {
    for (let y = 143; y < 208; y += 21) block(x, y, 16, 2, '#273a34');
    block(x - 6, 206, 28, 8, '#566051');
  }

  // Stones and moss beyond the path.
  for (const [x, y] of [[76, 260], [266, 245], [98, 350], [254, 378]] as const) {
    block(x, y, 22, 12, '#26342f');
    block(x + 3, y - 3, 14, 5, '#4e5a4a');
    block(x + 1, y + 7, 9, 3, '#45503b');
  }

  // Warm light and the ember are contained, preserving strong silhouettes.
  const light = context.createRadialGradient(180, 297, 2, 180, 297, 85);
  light.addColorStop(0, '#c8793638');
  light.addColorStop(1, '#c8793600');
  context.fillStyle = light;
  context.fillRect(92, 208, 176, 176);
  block(166, 308, 29, 4, '#101c1c');
  block(166, 302, 27, 5, '#725b3d');
  block(172, 305, 24, 4, '#927047');
  block(172, 292, 17, 12, '#b25b33');
  block(176, 281, 11, 20, '#e6a04b');
  block(180, 276, 4, 24, '#f5d088');
  block(174, 267, 2, 3, '#d29656');
  block(189, 259, 2, 2, '#d29656');

  // Framing trees are solid pixels rather than noisy particles.
  const tree = (x: number, y: number, size: number) => {
    block(x - 3, y + size * 0.6, 6, size * 0.6, '#182121');
    for (let tier = 0; tier < 4; tier++) {
      const halfWidth = size * (0.2 + tier * 0.1);
      block(x - halfWidth, y + tier * size * 0.17, halfWidth * 2, size * 0.22, '#0d191c');
      block(x - halfWidth + 4, y + tier * size * 0.17, halfWidth - 2, 3, '#20312c');
    }
  };
  for (const [x, y, size] of [
    [26, 5, 94], [91, -35, 110], [175, -63, 118], [271, -15, 110], [344, 14, 100],
    [18, 143, 78], [343, 163, 96], [13, 328, 90], [329, 370, 111], [49, 426, 94],
  ] as const) tree(x, y, size);

  context.restore();
  const shade = context.createRadialGradient(180, 250, 90, 180, 250, 310);
  shade.addColorStop(0, '#060e1200');
  shade.addColorStop(1, '#060e12c0');
  context.fillStyle = shade;
  context.fillRect(0, 0, world.width, world.height);
}
