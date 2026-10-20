import { describe, expect, it } from 'vitest';
import { newProfile, talentBudget, isUnlocked, setDraft, research, saveSlot, loadSlot, beginProfileRun, finishProfileRun, RESEARCH_TALENTS } from '../src/profile/profile';
import type { Profile, RunSummary } from '../src/profile/profile';
import { decodeProfile, encodeProfile } from '../src/persistence/profile-codec';
import { createProfileStore, SAVE_KEY, BACKUP_KEY, RECOVERY_KEY } from '../src/persistence/profile-store';
import type { StoragePort } from '../src/persistence/profile-store';
import { createRun } from '../src/game/state';
import { LEGACY } from '../src/content/legacy';
import { advance, enemy } from './fixtures';

const summary: RunSummary = { outcome: 'defeat', seconds: 0, kills: 0, xp: 0 };
function completed(profile: Profile, result = summary): Profile {
  const started = beginProfileRun(profile)!;
  return finishProfileRun(started, started.activeRun!, result)!;
}
class Memory implements StoragePort {
  values = new Map<string, string>();
  failWrites = false;
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { if (this.failWrites) throw new Error('quota'); this.values.set(key, value); }
}

describe('bounded permanent progression', () => {
  it('starts with mixed-branch freedom, research choices, and free respecs', () => {
    const initial = newProfile();
    expect(talentBudget(initial)).toBe(8); expect(initial.insight).toBe(2);
    expect(setDraft(initial, ['reprisal', 'arcane-echo', 'soul-cinder'])?.draft).toHaveLength(3);
    expect(isUnlocked(initial, 'last-stand')).toBe(false);
    expect(research(initial, 'reprisal')).toBeNull();
    const unlocked = research(initial, 'last-stand')!;
    expect(unlocked.insight).toBe(1); expect(isUnlocked(unlocked, 'last-stand')).toBe(true);
    expect(research(unlocked, 'last-stand')).toBeNull();
    expect(setDraft(unlocked, [])!.unlocked).toEqual(['last-stand']);
    expect(initial.unlocked).toEqual([]);
  });

  it('even instant defeats unlock all options and reach the ten-point ceiling in five runs', () => {
    let profile = newProfile();
    for (let i = 0; i < 5; i++) profile = completed(profile);
    expect(profile.completedRuns).toBe(5); expect(talentBudget(profile)).toBe(10);
    for (const id of RESEARCH_TALENTS) profile = research(profile, id)!;
    expect(profile.unlocked).toHaveLength(6); expect(profile.insight).toBe(0);
    for (let i = 0; i < 20; i++) profile = completed(profile, { ...summary, seconds: 900, outcome: 'victory' });
    expect(profile.insight).toBe(0); expect(talentBudget(profile)).toBe(10);
    expect(profile.lastResult!.insight).toBe(0);
  });

  it('rewards survival and future victory through the same bounded boundary', () => {
    expect(completed(newProfile()).lastResult!.insight).toBe(1);
    expect(completed(newProfile(), { ...summary, seconds: 120 }).lastResult!.insight).toBe(2);
    expect(completed(newProfile(), { ...summary, seconds: 240 }).lastResult!.insight).toBe(3);
    // Four research credits remain after the two starter credits.
    expect(completed(newProfile(), { ...summary, seconds: 900, outcome: 'victory' }).lastResult!.insight).toBe(4);
  });

  it('spends a run identity once, rejects stale identities and invalid results, and records point milestones', () => {
    let profile = beginProfileRun(newProfile())!;
    expect(beginProfileRun(profile)).toBeNull();
    expect(setDraft(profile, ['reprisal'])).toBeNull(); expect(research(profile, 'last-stand')).toBeNull();
    expect(finishProfileRun(profile, 100, summary)).toBeNull();
    expect(finishProfileRun(profile, 1, { ...summary, seconds: NaN })).toBeNull();
    expect(finishProfileRun(profile, 1, { ...summary, kills: -1 })).toBeNull();
    profile = finishProfileRun(profile, 1, summary)!;
    expect(finishProfileRun(profile, 1, summary)).toBeNull();
    profile = completed(profile);
    expect(profile.lastResult!.points).toBe(1); expect(talentBudget(profile)).toBe(9);
    profile = completed(profile); profile = completed(profile); profile = completed(profile);
    expect(profile.lastResult!.points).toBe(1); expect(talentBudget(profile)).toBe(10);
  });

  it('runs an earned ten-point hybrid and enforces prerequisites, research, and current budget', () => {
    let profile = newProfile();
    const hybrid = ['reprisal', 'sweeping-blade', 'spellsteel', 'frostbreak', 'iron-ward', 'last-stand', 'arcane-echo', 'rime-sigil', 'chain-spark', 'shatterglass'] as const;
    expect(setDraft(profile, [...hybrid])).toBeNull();
    for (let i = 0; i < 5; i++) profile = completed(profile);
    expect(setDraft(profile, [...hybrid])).toBeNull(); // Research is separate from points.
    profile = research(profile, 'last-stand')!;
    profile = setDraft(profile, [...hybrid])!;
    const run = createRun(42, profile.draft, talentBudget(profile));
    expect(run.talents).toEqual(hybrid);
    run.spawnIn = Infinity;
    run.enemies.push({ ...enemy(101, 205, 240), health: 1000, maxHealth: 1000 });
    advance(run, 2);
    expect(run.status).toBe('running');
    expect(run.enemies[0]!.health).toBeLessThan(950);
    expect(run.effects.dropped).toBe(0);
    expect(setDraft(profile, ['last-stand'])).toBeNull();
  });

  it('saves independent named slots and loads snapshots without mutating other builds', () => {
    let profile = setDraft(newProfile(), ['reprisal', 'sweeping-blade'])!;
    profile = saveSlot(profile, 0, '  Steel & Frost  ')!;
    profile = setDraft(profile, ['arcane-echo'])!;
    profile = saveSlot(profile, 1, 'Echo')!;
    profile = loadSlot(profile, 0)!;
    expect(profile.draft).toEqual(['reprisal', 'sweeping-blade']);
    expect(profile.slots[0]!.name).toBe('Steel & Frost');
    profile.draft.push('spellsteel');
    expect(profile.slots[0]!.talents).toHaveLength(2);
    expect(profile.slots[1]!.talents).toEqual(['arcane-echo']);
    for (const index of [-1, 3, 0.5]) expect(saveSlot(profile, index, 'X')).toBeNull();
    expect(saveSlot(profile, 0, '   ')).toBeNull(); expect(saveSlot(profile, 0, 'x'.repeat(33))).toBeNull();
  });
});

describe('versioned profile validation', () => {
  it('round-trips researched builds, slots, rewards, and in-flight identity as independent data', () => {
    let profile = completed(newProfile(), { ...summary, seconds: 90, kills: 8, xp: 40 });
    profile = research(profile, 'harvest')!;
    profile = saveSlot(setDraft(profile, ['soul-cinder', 'grim-pact'])!, 0, 'Imp')!;
    profile = beginProfileRun(profile)!;
    const decoded = decodeProfile(encodeProfile(profile));
    expect(decoded).toEqual({ ok: true, profile, notices: [] });
    if (decoded.ok) { decoded.profile.slots[0]!.talents.push('agony'); expect(profile.slots[0]!.talents).toHaveLength(2); }
  });

  it('migrates the early build format without losing an allocated capstone', () => {
    const build = ['hunting-momentum', 'falcon', 'snare', 'pack-link', 'frost-trap', 'wild-hunt'];
    const decoded = decodeProfile(JSON.stringify({ version: 1, build, completedRuns: 3 }));
    expect(decoded.ok).toBe(true);
    if (decoded.ok) {
      expect(decoded.profile.draft).toEqual(build); expect(decoded.profile.unlocked).toEqual(['wild-hunt']);
      expect(talentBudget(decoded.profile)).toBe(9);
      expect(decodeProfile(encodeProfile(decoded.profile))).toEqual({ ok: true, profile: decoded.profile, notices: [] });
    }
  });

  it('repairs builds independently while retaining earned progression and valid slots', () => {
    const profile = completed(newProfile());
    const data = { ...profile, draft: ['harvest'], slots: [{ name: 'Valid', talents: ['reprisal'] }, { name: 'Invalid', talents: ['unknown'] }, { name: 'Also valid', talents: [] }] };
    const decoded = decodeProfile(JSON.stringify(data));
    expect(decoded.ok).toBe(true);
    if (decoded.ok) {
      expect(decoded.profile.completedRuns).toBe(1); expect(decoded.profile.insight).toBe(3);
      expect(decoded.profile.draft).toEqual([]); expect(decoded.profile.slots[0]!.talents).toEqual(['reprisal']);
      expect(decoded.profile.slots[1]!.talents).toEqual([]); expect(decoded.notices).toHaveLength(2);
    }
  });

  it.each(['bad json', 'null', '[]', '{}', JSON.stringify({ ...newProfile(), insight: -1 }), JSON.stringify({ ...newProfile(), activeRun: 0 }),
    JSON.stringify({ ...newProfile(), unlocked: ['last-stand', 'last-stand'] }), JSON.stringify({ ...newProfile(), unlocked: ['reprisal'] }),
    JSON.stringify({ ...newProfile(), bestSeconds: 1e100 }), JSON.stringify({ ...newProfile(), nextRunId: 0 }),
    JSON.stringify({ ...newProfile(), lastResult: { ...summary, id: 50 } }), 'x'.repeat(LEGACY.maxBackupLength + 1),
  ])('rejects malformed or out-of-bounds data: %#', (input) => {
    expect(decodeProfile(input).ok).toBe(false);
  });
});

describe('local storage, recovery, and reward durability', () => {
  it('persists draft and reward transactions across reloads without awarding the same run twice', () => {
    const storage = new Memory();
    let store = createProfileStore(storage);
    store.change((profile) => setDraft(profile, ['reprisal'])); store.change(beginProfileRun);
    const id = store.get().activeRun!;
    store.change((profile) => finishProfileRun(profile, id, summary));
    store = createProfileStore(storage);
    expect(store.get().completedRuns).toBe(1); expect(store.get().draft).toEqual(['reprisal']);
    expect(store.change((profile) => finishProfileRun(profile, id, summary))).toBe(false);
    expect(store.get().insight).toBe(3);
  });

  it('discards unfinished runs on reload without rewards, then issues a fresh identity', () => {
    const storage = new Memory(); const first = createProfileStore(storage); first.change(beginProfileRun);
    const id = first.get().activeRun;
    const second = createProfileStore(storage);
    expect(second.get().completedRuns).toBe(0); expect(second.get().activeRun).toBeNull();
    expect(second.status().notice).toContain('unfinished run');
    second.change(beginProfileRun); expect(second.get().activeRun).not.toBe(id);
  });

  it('recovers a valid previous save, quarantines damage, and safely writes repaired data', () => {
    const storage = new Memory(); const initial = createProfileStore(storage);
    initial.change((profile) => setDraft(profile, ['reprisal'])); initial.change((profile) => setDraft(profile, ['arcane-echo']));
    storage.setItem(SAVE_KEY, '{broken');
    const recovered = createProfileStore(storage);
    expect(recovered.get().draft).toEqual(['reprisal']); expect(recovered.status().notice).toContain('Recovered');
    expect(storage.getItem(RECOVERY_KEY)).toBe('{broken');
    recovered.change((profile) => setDraft(profile, ['communion']));
    expect(createProfileStore(storage).get().draft).toEqual(['communion']);
  });

  it('starts safely when both copies are damaged, and preserves future-version saves during play', () => {
    const storage = new Memory(); storage.setItem(SAVE_KEY, 'broken'); storage.setItem(BACKUP_KEY, 'broken');
    expect(createProfileStore(storage).get()).toEqual(newProfile());
    storage.setItem(SAVE_KEY, JSON.stringify({ version: 99, important: 'keep' }));
    const future = createProfileStore(storage);
    future.change((profile) => setDraft(profile, ['reprisal']));
    expect(future.status().blocked).toBe(true); expect(future.status().durable).toBe(false);
    expect(JSON.parse(storage.getItem(SAVE_KEY)!).version).toBe(99);
    expect(decodeProfile(future.export()).ok).toBe(true);
    expect(future.import(encodeProfile(newProfile())).ok).toBe(true);
    expect(JSON.parse(storage.getItem(RECOVERY_KEY)!).version).toBe(99);
    expect(JSON.parse(storage.getItem(SAVE_KEY)!).version).toBe(2);
  });

  it('keeps gameplay and export working when storage reads or writes fail', () => {
    const storage = new Memory(); const store = createProfileStore(storage);
    store.change(beginProfileRun); storage.failWrites = true;
    expect(store.change((profile) => finishProfileRun(profile, 1, summary))).toBe(true);
    expect(store.status().durable).toBe(false); expect(store.status().notice).toContain('in memory');
    expect(decodeProfile(store.export()).ok).toBe(true);
    // The durable pending run cannot be re-claimed by reloading.
    expect(createProfileStore(storage).get().completedRuns).toBe(0);
    const unavailable = createProfileStore({ getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } });
    expect(unavailable.change((profile) => setDraft(profile, ['communion']))).toBe(true);
    expect(unavailable.get().draft).toEqual(['communion']);
  });

  it('validates imports before replacing state and retains the previous valid primary as recovery', () => {
    const storage = new Memory(); const store = createProfileStore(storage);
    store.change((profile) => setDraft(profile, ['reprisal']));
    const previous = store.export();
    const imported = completed(setDraft(newProfile(), ['arcane-echo'])!);
    expect(store.import('{broken').ok).toBe(false); expect(store.export()).toBe(previous);
    expect(store.import(encodeProfile({ ...imported, draft: ['harvest'] })).ok).toBe(false);
    expect(store.import(encodeProfile(imported)).ok).toBe(true);
    expect(store.get().completedRuns).toBe(1); expect(store.get().draft).toEqual(['arcane-echo']);
    expect(JSON.parse(storage.getItem(BACKUP_KEY)!).draft).toEqual(['reprisal']);
    storage.failWrites = true;
    expect(store.import(previous).ok).toBe(false); expect(store.get().completedRuns).toBe(1);
  });

  it('imports a valid early-format backup through migration', () => {
    const store = createProfileStore(new Memory());
    expect(store.import(JSON.stringify({ version: 1, build: ['reprisal'], completedRuns: 2 })).ok).toBe(true);
    expect(store.get().version).toBe(2); expect(store.get().draft).toEqual(['reprisal']);
    expect(talentBudget(store.get())).toBe(9);
  });

  it('rejects stale-tab writes without overwriting newer progress', () => {
    const storage = new Memory(); const first = createProfileStore(storage), second = createProfileStore(storage);
    first.change((profile) => setDraft(profile, ['reprisal']));
    expect(second.change((profile) => setDraft(profile, ['arcane-echo']))).toBe(false);
    expect(second.status().notice).toContain('another tab');
    expect(createProfileStore(storage).get().draft).toEqual(['reprisal']);
  });
});
