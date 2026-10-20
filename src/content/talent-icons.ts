import type { TalentId } from './talents';

/** Original 24-unit line glyphs. Each path stays readable at phone icon sizes. */
export const TALENT_ICONS: Partial<Record<TalentId, string>> = {
  reprisal: 'M12 3 20 7 18 16 12 21 6 16 4 7Z M8 13 12 8 16 13 M12 8V17',
  'sweeping-blade': 'M5 20 18 7 21 3 17 4 4 17 M3 14 10 21 M13 5Q22 8 20 16',
  spellsteel: 'M4 21 16 9 M3 16 8 21 M18 2V10 M14 6H22 M6 3 7 6 10 7 7 8 6 11 5 8 2 7 5 6Z',
  frostbreak: 'M3 21 18 6 M2 16 8 22 M16 2V10 M12 6H21 M13 3 20 10 M20 3 13 10 M15 15 18 17 16 21',
  'iron-ward': 'M12 3 21 7 19 16 12 22 5 16 3 7Z M8 11H16 M8 15H16',
  'last-stand': 'M8 4 16 4 18 12 12 17 6 12Z M12 17V23 M2 16 6 18 M22 16 18 18 M3 9H0 M21 9H24',
  'arcane-echo': 'M9 5 15 12 9 19 3 12Z M15 5 21 12 15 19',
  'rime-sigil': 'M12 2V22 M3 7 21 17 M3 17 21 7 M8 4 12 7 16 4 M8 20 12 17 16 20',
  'chain-spark': 'M9 2 3 12 10 12 6 22 16 9 10 9 14 2Z M18 5 22 9 18 13 M18 17H22',
  shatterglass: 'M12 3 20 12 12 21 4 12Z M12 3 10 11 14 13 12 21 M1 4 4 7 M20 4 23 1 M21 18 24 21',
  'mana-ward': 'M12 3 21 7 19 16 12 22 5 16 3 7Z M12 7 16 12 12 17 8 12Z',
  riftweaver: 'M9 3Q1 12 9 21 M15 3Q23 12 15 21 M12 7 16 12 12 17 8 12Z M1 12H5 M19 12H23',
  'expose-weakness': 'M2 12Q12 0 22 12Q12 24 2 12Z M12 8V16 M8 12H16',
  'venom-edge': 'M4 21 17 8 M3 16 8 21 M18 2Q12 10 18 11Q24 10 18 2Z',
  'killer-instinct': 'M12 1 14 9 22 6 17 13 22 18 14 16 12 23 10 16 2 18 7 13 2 6 10 9Z',
  'siphon-toxin': 'M8 2Q0 12 8 14Q16 12 8 2Z M16 12V22 M11 17H21',
  contagion: 'M12 3V11 M4 19 12 11 20 19 M9 3H15 M1 19H7 M17 19H23',
  nightfall: 'M18 3Q5 8 18 21Q0 23 3 8Q5 1 18 3Z M18 9V15 M15 12H21',
  'hunting-momentum': 'M3 6 9 12 3 18 M10 6 16 12 10 18 M17 6 23 12 17 18',
  falcon: 'M1 6 10 11 12 4 14 11 23 6 18 16 12 13 6 16Z M12 13V21',
  snare: 'M3 18 7 10 12 18 17 10 21 18 M2 20H22 M12 2V11 M8 7 12 11 16 7',
  'pack-link': 'M3 6 9 6 9 12 3 12Z M15 12 21 12 21 18 15 18Z M9 9 15 15',
  'frost-trap': 'M3 20H21 M5 20V13 M12 20V13 M19 20V13 M12 1V10 M7 3 17 8 M7 8 17 3',
  'wild-hunt': 'M2 12 8 6 12 12 16 6 22 12 M2 18 8 12 12 18 16 12 22 18 M12 1V7',
};
