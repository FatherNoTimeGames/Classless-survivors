import { createProfileStore } from './profile-store';

/** Browser storage can throw even when the property exists (private/restricted mode). */
export function openBrowserProfile() {
  try { return createProfileStore(window.localStorage); }
  catch { return createProfileStore(null); }
}
