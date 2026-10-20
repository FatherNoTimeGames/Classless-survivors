export interface Tone { frequency: number; endFrequency?: number; offset: number; duration: number; gain: number; wave: OscillatorType }
const tone = (frequency: number, duration: number, gain: number, wave: OscillatorType = 'sine', offset = 0, endFrequency?: number): Tone => ({ frequency, duration, gain, wave, offset, endFrequency });
/** Original quiet, short synthesized motifs. No recordings, downloads or music loop. */
export const SOUNDS = {
  start: [tone(196, 0.2, 0.15, 'sine'), tone(294, 0.25, 0.1, 'sine', 0.09)],
  hit: [tone(170, 0.055, 0.07, 'triangle', 0, 95)],
  melee: [tone(125, 0.09, 0.08, 'triangle', 0, 55)],
  magic: [tone(520, 0.07, 0.045, 'sine', 0, 310)],
  summon: [tone(392, 0.09, 0.055, 'triangle', 0, 294)],
  critical: [tone(660, 0.11, 0.07, 'triangle'), tone(880, 0.08, 0.035, 'sine', 0.025)],
  hurt: [tone(90, 0.18, 0.18, 'triangle', 0, 45)],
  heal: [tone(440, 0.14, 0.06), tone(554, 0.14, 0.04, 'sine', 0.04)],
  ward: [tone(330, 0.13, 0.07), tone(495, 0.15, 0.04)],
  pickup: [tone(740, 0.055, 0.025)],
  warning: [tone(160, 0.13, 0.1, 'triangle')],
  boss: [tone(98, 0.22, 0.14, 'triangle'), tone(147, 0.26, 0.1, 'triangle', 0.14)],
  guardian: [tone(262, 0.2, 0.08), tone(392, 0.22, 0.065, 'sine', 0.1)],
  level: [tone(330, 0.19, 0.1), tone(440, 0.22, 0.08, 'sine', 0.08), tone(660, 0.24, 0.06, 'sine', 0.16)],
  select: [tone(440, 0.07, 0.045)],
  victory: [tone(262, 0.3, 0.12), tone(392, 0.3, 0.1, 'sine', 0.14), tone(523, 0.45, 0.08, 'sine', 0.28)],
  defeat: [tone(196, 0.25, 0.12, 'triangle'), tone(147, 0.28, 0.09, 'triangle', 0.14), tone(98, 0.4, 0.07, 'triangle', 0.3)],
} satisfies Record<string, readonly Tone[]>;
export type SoundCue = keyof typeof SOUNDS;
export const AUDIO_LIMITS = { voices: 8, globalInterval: 0.08 } as const;
export const CUE_INTERVAL: Record<SoundCue, number> = {
  start: 0.5, hit: 0.18, melee: 0.2, magic: 0.22, summon: 0.3, critical: 0.3, hurt: 0.6,
  heal: 0.6, ward: 0.6, pickup: 0.5, warning: 0.65, boss: 1, guardian: 1, level: 0.3, select: 0.1, victory: 2, defeat: 2,
};
