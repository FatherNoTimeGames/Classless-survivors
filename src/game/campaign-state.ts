import type { BossId } from '../content/bosses';
import type { Point } from './state';

export type BossShape =
  | { kind: 'cone'; origin: Point; angle: number; radius: number; halfAngle: number }
  | { kind: 'line'; from: Point; to: Point; width: number }
  | { kind: 'ring'; origin: Point; inner: number; outer: number }
  | { kind: 'circle'; origin: Point; radius: number }
  | { kind: 'volley'; origin: Point; angles: number[]; speed: number };
export interface BossDanger {
  id: number; ownerId: number; shape: BossShape; phase: 'warning' | 'active'; remaining: number; activeFor: number; damage: number;
}
export interface BossFight { id: BossId; enemyId: number; pattern: number; attackIn: number; addIn: number }
export interface CampaignState {
  nextBoss: number; defeated: BossId[]; active: BossFight | null; breakUntil: number; dangers: BossDanger[];
}
export function createCampaign(): CampaignState {
  return { nextBoss: 0, defeated: [], active: null, breakUntil: 0, dangers: [] };
}
