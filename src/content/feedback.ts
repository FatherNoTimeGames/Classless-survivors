/** Shared retention/draw priority for cosmetic feedback; never affects damage or proc rules. */
const PRIORITY: Partial<Record<string, number>> = { hurt: 100, shield: 90, critical: 85, cleave: 80, heal: 75, root: 70, frost: 65, holy: 60, detonation: 60 };
export const feedbackPriority = (kind: string): number => PRIORITY[kind] ?? 20;
