// Decides what actually needs to travel to Firestore. Remembered per tab in sessionStorage.
import { hashText } from './reviewStore.mjs';

const STATE_KEY = 'gw-sync-state-v1';
export const DOWNLOAD_INTERVAL_MS = 10 * 60 * 1000;

// Firestore returns map keys in its own order, so hashes must not depend on key order.
export function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(value ?? null);
}

export function hashValue(value) {
  const text = stableStringify(value ?? null);
  return `${text.length}:${hashText(text)}`;
}

export const hashProgress = (progress, keys) => Object.fromEntries(keys.map(key => [key, hashValue(progress[key])]));
export const changedKeys = (progress, keys, hashes = {}) => keys.filter(key => hashValue(progress[key]) !== hashes[key]);

export function shouldDownload(state, now = Date.now()) {
  return !state.downloadedAt || now - state.downloadedAt >= DOWNLOAD_INTERVAL_MS;
}

const storage = () => {
  try { return typeof window !== 'undefined' ? window.sessionStorage : null; } catch { return null; }
};

export function readSyncState(uid, store = storage()) {
  try {
    const state = JSON.parse(store?.getItem(STATE_KEY) || 'null');
    if (state?.uid === uid) return { downloadedAt: state.downloadedAt || 0, hashes: state.hashes || {} };
  } catch { /* treat corrupt state as never synced */ }
  return { downloadedAt: 0, hashes: {} };
}

export function writeSyncState(uid, state, store = storage()) {
  try { store?.setItem(STATE_KEY, JSON.stringify({ uid, ...state })); } catch { /* the next page simply downloads again */ }
}
