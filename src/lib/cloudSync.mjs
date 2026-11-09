// Decides what actually needs to travel to Firestore. Remembered per tab in sessionStorage.
import { decodeReview, encodeReview, hashText, mergeReview } from './reviewStore.mjs';

const STATE_KEY = 'gw-sync-state-v1';

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

// `remoteAt` is the time of the latest upload from any device, which costs one read to learn.
export function shouldDownload(state, remoteAt = '') {
  return !state.downloadedAt || (state.remoteAt || '') !== (remoteAt || '');
}

// An upload replaces the cloud copy, so it must first take in what other devices put there.
export function mergeReviewValues(local, remote) {
  if (!remote) return local ?? null;
  if (!local) return remote;
  return encodeReview(mergeReview(decodeReview(local), decodeReview(remote)));
}

const storage = () => {
  try { return typeof window !== 'undefined' ? window.sessionStorage : null; } catch { return null; }
};

export function readSyncState(uid, store = storage()) {
  try {
    const state = JSON.parse(store?.getItem(STATE_KEY) || 'null');
    if (state?.uid === uid) return { downloadedAt: state.downloadedAt || 0, remoteAt: state.remoteAt || '', hashes: state.hashes || {} };
  } catch { /* treat corrupt state as never synced */ }
  return { downloadedAt: 0, remoteAt: '', hashes: {} };
}

export function writeSyncState(uid, state, store = storage()) {
  try { store?.setItem(STATE_KEY, JSON.stringify({ uid, ...state })); } catch { /* the next page simply downloads again */ }
}
