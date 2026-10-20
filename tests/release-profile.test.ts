import { describe, expect, it } from 'vitest';
import { newProfile, setDraft, beginProfileRun, finishProfileRun } from '../src/profile/profile';
import { decodeProfile, encodeProfile } from '../src/persistence/profile-codec';
import { createProfileStore, SAVE_KEY, BACKUP_KEY, RECOVERY_KEY } from '../src/persistence/profile-store';
import type { StoragePort } from '../src/persistence/profile-store';

class MemoryStorage implements StoragePort {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

describe('release save-boundary regressions', () => {
  it.each([false, true])('keeps changes in memory when the pre-write read fails (import: %s)', (importing) => {
    const storage = new MemoryStorage(); let readable = true;
    const store = createProfileStore({
      getItem(key) { if (!readable) throw new Error('Read access lost'); return storage.getItem(key); },
      setItem: (key, value) => storage.setItem(key, value),
    });
    const newer = encodeProfile(setDraft(newProfile(), ['communion'])!);
    storage.setItem(SAVE_KEY, newer); readable = false;
    const draft = setDraft(newProfile(), ['arcane-echo'])!;
    const ok = importing ? store.import(encodeProfile(draft)).ok : store.change(() => draft);
    expect(ok).toBe(true); expect(store.get().draft).toEqual(['arcane-echo']);
    expect(store.status().durable).toBe(false);
    expect(store.status().notice).toContain('export a backup');
    expect(storage.getItem(SAVE_KEY)).toBe(newer);
    expect(storage.getItem(BACKUP_KEY)).toBeNull();
    expect(decodeProfile(store.export()).ok).toBe(true);
  });

  it('rejects a stale import from a future-version session after another tab restores progress', () => {
    const storage = new MemoryStorage();
    const future = JSON.stringify({ version: 99, payload: 'preserve' });
    storage.setItem(SAVE_KEY, future);
    const first = createProfileStore(storage), stale = createProfileStore(storage);
    expect(first.import(encodeProfile(setDraft(newProfile(), ['reprisal'])!)).ok).toBe(true);
    const durable = storage.getItem(SAVE_KEY), backup = storage.getItem(BACKUP_KEY), recovery = storage.getItem(RECOVERY_KEY);
    const temporary = stale.export();
    const imported = stale.import(encodeProfile(setDraft(newProfile(), ['arcane-echo'])!));
    expect(imported.ok).toBe(false);
    expect(imported.message).toContain('another tab');
    expect(stale.export()).toBe(temporary);
    expect(storage.getItem(SAVE_KEY)).toBe(durable);
    expect(storage.getItem(BACKUP_KEY)).toBe(backup);
    expect(storage.getItem(RECOVERY_KEY)).toBe(recovery);
    expect(createProfileStore(storage).get().draft).toEqual(['reprisal']);
  });

  it('keeps maximum-revision imports writable and reloadable through run and reward commits', () => {
    const storage = new MemoryStorage(), store = createProfileStore(storage);
    const imported = { ...newProfile(), revision: Number.MAX_SAFE_INTEGER - 1 };
    expect(store.import(encodeProfile(imported)).ok).toBe(true);
    // A tab may already have a maximum revision from a valid backup.
    storage.setItem(SAVE_KEY, encodeProfile(imported));
    let current = createProfileStore(storage);
    expect(current.change((profile) => setDraft(profile, ['reprisal', 'sweeping-blade']))).toBe(true);
    expect(decodeProfile(storage.getItem(SAVE_KEY)!).ok).toBe(true);
    current = createProfileStore(storage);
    expect(current.get().draft).toEqual(['reprisal', 'sweeping-blade']);
    expect(current.change(beginProfileRun)).toBe(true);
    const id = current.get().activeRun!;
    expect(current.change((profile) => finishProfileRun(profile, id, { outcome: 'defeat', seconds: 20, kills: 4, xp: 20 }))).toBe(true);
    const reloaded = createProfileStore(storage);
    expect(reloaded.get().completedRuns).toBe(1);
    expect(reloaded.get().lastResult?.id).toBe(id);
    expect(reloaded.change((profile) => finishProfileRun(profile, id, { outcome: 'defeat', seconds: 20, kills: 4, xp: 20 }))).toBe(false);
    expect(decodeProfile(reloaded.export()).ok).toBe(true);
  });
});
