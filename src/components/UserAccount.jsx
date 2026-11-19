import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getFirebaseServices, hasFirebaseConfig } from '../lib/firebase';
import { collectLocalProgress, mergeRemoteActivity, mergeLessonValue, mergeRemoteProgress, MERGED_LESSON_KEYS, PROGRESS_KEYS, readJSON, writeJSON } from '../lib/progressStorage';
import { changedKeys, hashProgress, mergeReviewValues, readSyncState, shouldDownload, stableStringify, writeSyncState } from '../lib/cloudSync.mjs';

import { ACTIVITY_KEY } from '../lib/dailyActivity.mjs';

const provider = new GoogleAuthProvider();
const PROGRESS_DOCS = ['lesson1Words', 'lesson1Stats', 'lesson2', 'lesson3', 'lesson4', 'lesson5', 'lesson6', 'lesson7', 'lesson8', 'review', 'activity'];
const REVIEW_SYNC_DELAY = 5000;
const LESSON_SYNC_DELAY = 700;
const PULL_GAP = 30000;

function mergeUnique(a = [], b = []) {
  return [...new Set([...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])])];
}

function mergeRemoteValue(key, legacyValue, splitValue) {
  if (splitValue === undefined) return legacyValue;
  if (legacyValue === undefined) return splitValue;

  if (key === 'lesson2') {
    return {
      starred: mergeUnique(legacyValue.starred, splitValue.starred),
      srs: { ...(legacyValue.srs || {}), ...(splitValue.srs || {}) },
      history: [...(legacyValue.history || []), ...(splitValue.history || [])].slice(-250)
    };
  }

  if (key === 'lesson1Words') {
    return Array.isArray(splitValue) && splitValue.length > 0 ? splitValue : legacyValue;
  }

  if (key === 'lesson1Stats') {
    return splitValue || legacyValue;
  }

  if (key === 'lesson3' || key === 'lesson4' || key === 'lesson5' || key === 'lesson6' || key === 'lesson7' || key === 'lesson8') {
    return { ...(legacyValue || {}), ...(splitValue || {}) };
  }

  return splitValue;
}

function getAuthErrorMessage(error) {
  const code = error?.code || '';

  // Setup problems (configuration, domain, provider) are for the site owner and stay in the console.
  const messages = {
    'auth/configuration-not-found': '目前無法登入，學習紀錄先存在這台裝置。',
    'auth/operation-not-allowed': '目前無法用這個方式登入，學習紀錄先存在這台裝置。',
    'auth/unauthorized-domain': '這個網址目前無法登入，請改用正式網站登入。',
    'auth/popup-closed-by-user': '登入視窗已關閉。要同步紀錄，請再按一次登入。',
    'auth/cancelled-popup-request': '已改用新開的登入視窗。',
    'auth/popup-blocked': '登入視窗被瀏覽器擋住了，請允許彈出視窗後再按一次登入。',
    'auth/network-request-failed': '連不上網路，請確認連線後再按一次登入。',
    'auth/email-already-in-use': '這個 Email 已經註冊過，請改按登入。',
    'auth/user-not-found': '找不到這個 Email 的帳號，可以按註冊建立。',
    'auth/wrong-password': 'Email 或密碼不對，請再試一次。',
    'auth/invalid-credential': 'Email 或密碼不對，請再試一次。',
    'auth/invalid-email': 'Email 格式看起來不對，請檢查後再試一次。',
    'auth/weak-password': '密碼至少要 6 個字元。'
  };

  return messages[code] || '登入沒有完成，請稍後再按一次登入。';
}

function getSyncErrorMessage(error) {
  const code = error?.code || '';

  const messages = {
    'permission-denied': '同步沒有完成，紀錄仍在這台裝置。請重新登入後再按同步。',
    'unauthenticated': '登入已過期，紀錄仍在這台裝置。請重新登入後再按同步。',
    'resource-exhausted': '今天的雲端同步量已滿，紀錄仍在這台裝置，明天會自動再同步。',
    'unavailable': '暫時連不上雲端，紀錄仍在這台裝置，稍後會自動再同步。',
    'not-found': '雲端還沒準備好，紀錄仍在這台裝置，請稍後再按同步。'
  };

  return messages[code] || '同步沒有完成，紀錄仍在這台裝置，請稍後再按同步。';
}

async function loadRemoteProgress(db, uid) {
  const legacyRef = doc(db, 'users', uid, 'learning', 'progress');
  const legacySnap = await getDoc(legacyRef);
  const remote = legacySnap.exists() ? legacySnap.data() : {};

  const docs = await Promise.all(
    PROGRESS_DOCS.map(async (key) => {
      const snap = await getDoc(doc(db, 'users', uid, 'learning', key));
      return [key, snap.exists() ? snap.data()?.value : undefined];
    })
  );

  docs.forEach(([key, value]) => {
    remote[key] = mergeRemoteValue(key, remote[key], value);
  });

  return remote;
}

async function readRemoteStamp(db, uid) {
  const snap = await getDoc(doc(db, 'users', uid, 'learning', 'progressMeta'));
  return snap.exists() ? snap.data()?.updatedAt || '' : '';
}

async function saveRemoteProgress(db, uid, progress, keys) {
  if (!keys.length) return;
  await Promise.all(
    keys.map((key) =>
      setDoc(
        doc(db, 'users', uid, 'learning', key),
        {
          value: progress[key] ?? null,
          updatedAt: progress.updatedAt
        },
        { merge: key !== 'activity' }
      )
    )
  );

  await setDoc(
    doc(db, 'users', uid, 'learning', 'progressMeta'),
    {
      updatedAt: progress.updatedAt,
      schema: 'split-progress-v1'
    },
    { merge: true }
  );
}

export default function UserAccount({ compact = false }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(hasFirebaseConfig ? '尚未登入' : '本機紀錄');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  // Problems the person must see even on a phone, where the header status is hidden.
  const [notice, setNotice] = useState('');
  const notify = (message) => { setStatus(message); setNotice(message); };

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 7000);
    return () => clearTimeout(timer);
  }, [notice]);
  const userRef = useRef(null);
  const syncingRef = useRef(false);
  const syncTimerRef = useRef(null);
  const pullingRef = useRef(false);
  const lastPullRef = useRef(0);

  const syncLocalProgress = useCallback(async (nextStatus = '已同步') => {
    const services = getFirebaseServices();
    const currentUser = userRef.current;
    if (!services || !currentUser) return;

    try {
      const progress = collectLocalProgress();
      const state = readSyncState(currentUser.uid);
      let keys = changedKeys(progress, PROGRESS_DOCS, state.hashes);
      // Activity could not be read with a device id; never overwrite the cloud copy with nothing.
      if (progress.activity === null) keys = keys.filter((key) => key !== 'activity');
      const toMerge = keys.filter((key) => key === 'activity' || key === 'review' || MERGED_LESSON_KEYS.includes(key));
      if (toMerge.length) {
        const snaps = await Promise.all(toMerge.map((key) => getDoc(doc(services.db, 'users', currentUser.uid, 'learning', key))));
        // Read local again after the wait, in case another answer was saved meanwhile.
        syncingRef.current = true;
        let changed = false;
        toMerge.forEach((key, index) => {
          const remote = snaps[index].exists() ? snaps[index].data()?.value : null;
          if (key === 'activity') {
            progress.activity = mergeRemoteActivity(remote);
            // If the cloud already contains the result, no activity write is needed.
            if (stableStringify(progress.activity) === stableStringify(remote)) keys = keys.filter(key => key !== 'activity');
            return;
          }
          const current = readJSON(PROGRESS_KEYS[key], null);
          progress[key] = key === 'review' ? mergeReviewValues(current, remote) : mergeLessonValue(key, current, remote);
          if (stableStringify(progress[key]) !== stableStringify(current)) {
            writeJSON(PROGRESS_KEYS[key], progress[key]);
            changed = true;
          }
        });
        if (changed) window.dispatchEvent(new CustomEvent('learning-progress-updated'));
        syncingRef.current = false;
      }
      await saveRemoteProgress(services.db, currentUser.uid, progress, keys);
      writeSyncState(currentUser.uid, { ...state, remoteAt: keys.length ? progress.updatedAt : state.remoteAt, hashes: hashProgress(progress, PROGRESS_DOCS) });
      setStatus(nextStatus);
    } catch (error) {
      console.error(error);
      setStatus(getSyncErrorMessage(error));
    }
  }, []);

  // Downloads only when some device has uploaded since this tab last looked.
  const pullRemote = useCallback(async () => {
    const services = getFirebaseServices();
    const currentUser = userRef.current;
    if (!services || !currentUser || pullingRef.current) return;
    pullingRef.current = true;
    lastPullRef.current = Date.now();
    const { uid } = currentUser;

    try {
      const remoteAt = await readRemoteStamp(services.db, uid);
      if (!shouldDownload(readSyncState(uid), remoteAt)) {
        await syncLocalProgress('已同步');
        return;
      }

      syncingRef.current = true;
      setStatus('同步中…');
      const remoteProgress = await loadRemoteProgress(services.db, uid);
      if (userRef.current?.uid !== uid) return;
      const merged = mergeRemoteProgress(remoteProgress);
      const keys = changedKeys(merged, PROGRESS_DOCS, hashProgress(remoteProgress, PROGRESS_DOCS));
      await saveRemoteProgress(services.db, uid, merged, keys);
      writeSyncState(uid, { downloadedAt: Date.now(), remoteAt: keys.length ? merged.updatedAt : remoteAt, hashes: hashProgress(merged, PROGRESS_DOCS) });
      window.dispatchEvent(new CustomEvent('learning-progress-updated'));
      setStatus('已同步');
    } catch (error) {
      console.error(error);
      setStatus(getSyncErrorMessage(error));
    } finally {
      syncingRef.current = false;
      pullingRef.current = false;
    }
  }, [syncLocalProgress]);

  useEffect(() => {
    const services = getFirebaseServices();
    if (!services) return;

    return onAuthStateChanged(services.auth, async (nextUser) => {
      userRef.current = nextUser;
      setUser(nextUser);

      if (!nextUser) {
        setStatus('本機紀錄');
        return;
      }

      await pullRemote();
    });
  }, [pullRemote]);

  useEffect(() => {
    if (!user) return;

    const handleProgressUpdated = (event) => {
      if (syncingRef.current) return;
      if (event.detail?.key && event.detail.key !== ACTIVITY_KEY && !Object.values(PROGRESS_KEYS).includes(event.detail.key)) return;
      window.clearTimeout(syncTimerRef.current);
      syncTimerRef.current = window.setTimeout(() => {
        syncTimerRef.current = null;
        setStatus('自動同步中…');
        syncLocalProgress('已自動同步');
      }, event.detail?.key === PROGRESS_KEYS.review ? REVIEW_SYNC_DELAY : LESSON_SYNC_DELAY);
    };

    // A review session ends by leaving the page, so anything still waiting goes out now.
    // Coming back to a tab left open picks up what other devices did in the meantime.
    const flushWhenHidden = () => {
      if (document.visibilityState === 'visible') {
        if (Date.now() - lastPullRef.current >= PULL_GAP) pullRemote();
        return;
      }
      if (!syncTimerRef.current) return;
      window.clearTimeout(syncTimerRef.current);
      syncTimerRef.current = null;
      syncLocalProgress('已自動同步');
    };

    window.addEventListener('learning-progress-updated', handleProgressUpdated);
    document.addEventListener('visibilitychange', flushWhenHidden);
    return () => {
      window.removeEventListener('learning-progress-updated', handleProgressUpdated);
      document.removeEventListener('visibilitychange', flushWhenHidden);
      window.clearTimeout(syncTimerRef.current);
    };
  }, [user, syncLocalProgress, pullRemote]);

  useEffect(() => {
    const warn = () => notify('這台裝置的儲存空間不夠了，請先到第 1 課匯出備份。');
    window.addEventListener('learning-storage-error', warn);
    return () => window.removeEventListener('learning-storage-error', warn);
  }, []);

  async function handleGoogleLogin() {
    const services = getFirebaseServices();
    if (!services) {
      notify('目前沒有雲端同步，學習紀錄存在這台裝置。');
      return;
    }

    setStatus('登入中…');
    try {
      await signInWithPopup(services.auth, provider);
    } catch (error) {
      console.error(error);
      notify(getAuthErrorMessage(error));
    }
  }

  async function handleEmailSubmit(event, action) {
    event.preventDefault();
    const services = getFirebaseServices();
    if (!services) {
      notify('目前沒有雲端同步，學習紀錄存在這台裝置。');
      return;
    }

    setStatus('登入中…');

    try {
      if (action === 'signup') {
        await createUserWithEmailAndPassword(services.auth, email, password);
      } else {
        await signInWithEmailAndPassword(services.auth, email, password);
      }
    } catch (error) {
      console.error(error);
      notify(getAuthErrorMessage(error));
    }
  }

  async function handleManualSync() {
    const services = getFirebaseServices();
    if (!services || !user) return;

    setStatus('同步中…');
    await syncLocalProgress('已同步');
  }

  async function handleLogout() {
    const services = getFirebaseServices();
    if (!services) return;
    await signOut(services.auth);
  }

  if (compact) {
    return (
      <div className="flex shrink-0 items-center gap-2">
        {notice && <p role="alert" className="speech-toast sm:hidden">{notice}</p>}
        <span className="hidden max-w-[14rem] truncate rounded-full bg-surface/90 border border-amber-line px-3 py-1.5 text-xs font-black text-ink-muted sm:inline-block">
          {user ? user.email || '已登入' : status}
        </span>
        {user ? (
          <>
            <button onClick={handleManualSync} className="min-h-11 rounded-full bg-amber-soft px-4 text-xs font-black text-amber-ink" type="button">
              同步
            </button>
            <button onClick={handleLogout} className="min-h-11 rounded-full bg-surface-muted px-4 text-xs font-black text-ink-soft" type="button">
              登出
            </button>
          </>
        ) : (
          <button onClick={handleGoogleLogin} className="min-h-11 rounded-full bg-amber-strong px-4 text-xs font-black text-on-solid disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-muted" type="button" disabled={!hasFirebaseConfig}>
            <span className="sm:hidden">登入</span><span className="hidden sm:inline">登入同步紀錄</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-line bg-amber-soft/80 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-base md:text-lg font-black text-ink">
            {user ? `學習紀錄同步到 ${user.email || '這個帳號'}` : '登入後同步學習紀錄'}
          </h3>
          <p className="mt-1 text-xs md:text-sm font-bold text-ink-muted">{status}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {user ? (
            <>
              <button onClick={handleManualSync} className="rounded-2xl bg-amber-strong px-4 py-2.5 text-sm font-black text-on-solid" type="button">
                立即同步
              </button>
              <button onClick={handleLogout} className="rounded-2xl bg-surface px-4 py-2.5 text-sm font-black text-ink-soft border border-line" type="button">
                登出
              </button>
            </>
          ) : (
            <>
              <button onClick={handleGoogleLogin} className="rounded-2xl bg-amber-strong px-4 py-2.5 text-sm font-black text-on-solid disabled:opacity-50" type="button" disabled={!hasFirebaseConfig}>
                Google 登入
              </button>
              <button onClick={() => setShowEmailForm((value) => !value)} className="rounded-2xl bg-surface px-4 py-2.5 text-sm font-black text-ink-soft border border-line" type="button">
                Email
              </button>
            </>
          )}
        </div>
      </div>

      {!hasFirebaseConfig && (
        <p className="mt-4 rounded-2xl bg-surface px-4 py-3 text-sm font-bold text-ink-muted">
          尚未設定 Firebase 環境變數，目前使用本機紀錄。
        </p>
      )}

      {showEmailForm && !user && (
        <form className="mt-4 grid gap-2 md:grid-cols-[1fr_1fr_auto_auto]">
          <input value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-2xl border border-line bg-surface px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-solid" placeholder="email" type="email" required />
          <input value={password} onChange={(event) => setPassword(event.target.value)} className="rounded-2xl border border-line bg-surface px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-solid" placeholder="password" type="password" minLength={6} required />
          <button onClick={(event) => handleEmailSubmit(event, 'signin')} className="rounded-2xl bg-ink px-4 py-3 text-sm font-black text-surface" type="submit">
            登入
          </button>
          <button onClick={(event) => handleEmailSubmit(event, 'signup')} className="rounded-2xl bg-surface px-4 py-3 text-sm font-black text-ink-soft border border-line" type="submit">
            註冊
          </button>
        </form>
      )}
    </div>
  );
}
