import type { Run, Spark } from '../game/state';
import type { SoundCue } from './sound-design';

interface AudioSnapshot { bossId: number | null; bossKills: number; warnings: Set<string>; sparks: Set<Spark>; boltId: number; xp: number }
export function audioSnapshot(run: Run): AudioSnapshot {
  return { bossId: run.campaign.active?.enemyId ?? null, bossKills: run.campaign.defeated.length,
    warnings: new Set([...run.campaign.dangers.filter((danger) => danger.phase === 'warning').map((danger) => `b${danger.id}`),
      ...run.enemies.filter((foe) => foe.attack.phase === 'windup').map((foe) => `e${foe.id}`)]),
    sparks: new Set(run.sparks), boltId: Math.max(0, ...run.bolts.map((bolt) => bolt.id)), xp: run.xp };
}
const SPARK_CUES: Partial<Record<Spark['kind'], SoundCue>> = {
  hurt: 'hurt', heal: 'heal', shield: 'ward', critical: 'critical', cleave: 'melee', imp: 'summon', falcon: 'summon',
  arcane: 'magic', holy: 'magic', frost: 'magic', lightning: 'magic', detonation: 'magic', hit: 'hit',
};
const PRIORITY: SoundCue[] = ['hurt', 'boss', 'guardian', 'ward', 'critical', 'warning', 'heal', 'melee', 'summon', 'magic', 'hit', 'pickup'];
/** Read-only presentation observations; no gameplay events are drained or modified. */
export function collectSoundCues(previous: AudioSnapshot, run: Run): SoundCue[] {
  const current = audioSnapshot(run), cues = new Set<SoundCue>();
  if (current.bossId !== null && current.bossId !== previous.bossId) cues.add('boss');
  if (current.bossKills > previous.bossKills) cues.add('guardian');
  if ([...current.warnings].some((id) => !previous.warnings.has(id))) cues.add('warning');
  for (const spark of run.sparks) if (!previous.sparks.has(spark)) { const cue = SPARK_CUES[spark.kind]; if (cue) cues.add(cue); }
  if (current.boltId > previous.boltId) cues.add('magic');
  if (current.xp > previous.xp) cues.add('pickup');
  return PRIORITY.filter((cue) => cues.has(cue));
}
export function createSoundDirector(play: (cue: SoundCue) => boolean) {
  let previous: AudioSnapshot | null = null;
  return {
    synchronize(run: Run): void { previous = audioSnapshot(run); },
    observe(run: Run): void {
      if (previous) for (const cue of collectSoundCues(previous, run)) if (play(cue)) break;
      previous = audioSnapshot(run);
    },
  };
}
