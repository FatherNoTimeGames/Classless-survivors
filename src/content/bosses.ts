/** Authored encounter tuning, separate from simulation and artwork. */
export const CAMPAIGN = { duration: 900, radius: 16, arrivalGrace: 1.5, respite: 5, healing: 0.25, resolve: 3, maxDangers: 8, addInterval: 3.5, maxAdds: 6 } as const;
export const BOSSES = [
  { id: 'knight', name: 'Ossuary Knight', at: 240, health: 720, speed: 28, contact: 16, xp: 90, keepDistance: 0, recovery: 1.6,
    hint: 'Step behind the sweep; sidestep the long cleave.' },
  { id: 'matron', name: 'Veil Matron', at: 540, health: 900, speed: 24, contact: 14, xp: 120, keepDistance: 120, recovery: 1.5,
    hint: 'Weave between bolts. The ring has a safe center.' },
  { id: 'sovereign', name: 'Night Sovereign', at: 810, health: 900, speed: 26, contact: 18, xp: 180, keepDistance: 100, recovery: 1.3,
    hint: 'Move diagonally out of crossed lanes; leave marked pools.' },
] as const;
export type BossId = typeof BOSSES[number]['id'];
export const bossById = (id: BossId) => BOSSES.find((boss) => boss.id === id)!;
