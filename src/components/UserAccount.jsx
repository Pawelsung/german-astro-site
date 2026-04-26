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
import { collectLocalProgress, mergeRemoteProgress } from '../lib/progressStorage';

const provider = new GoogleAuthProvider();

function getAuthErrorMessage(error) {
  const code = error?.code || '';

  const messages = {
    'auth/configuration-not-found': 'Firebase Authentication 尚未啟用，請到 Console 按 Get started。',
    'auth/operation-not-allowed': '這個登入方式尚未在 Firebase Authentication 啟用。',
    'auth/unauthorized-domain': '目前網域未加入 Firebase Auth Authorized domains。',
    'auth/popup-closed-by-user': '登入視窗已關閉，尚未完成登入。',
    'auth/cancelled-popup-request': '已取消前一個登入視窗。',
    'auth/email-already-in-use': '這個 Email 已註冊，請改用登入。',
    'auth/user-not-found': '找不到這個帳號，請先註冊。',
    'auth/wrong-password': '密碼不正確。',
    'auth/invalid-credential': '帳號或密碼不正確。',
    'auth/invalid-email': 'Email 格式不正確。',
    'auth/weak-password': '密碼至少需要 6 個字元。'
  };

  return messages[code] || error?.message || '登入失敗，請稍後再試。';
}

export default function UserAccount({ compact = false }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(hasFirebaseConfig ? '同步未啟用' : '本機模式');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const userRef = useRef(null);
  const syncTimerRef = useRef(null);

  const syncLocalProgress = useCallback(async (nextStatus = '已同步') => {
    const services = getFirebaseServices();
    const currentUser = userRef.current;
    if (!services || !currentUser) return;

    try {
      const ref = doc(services.db, 'users', currentUser.uid, 'learning', 'progress');
      await setDoc(ref, collectLocalProgress(), { merge: true });
      setStatus(nextStatus);
    } catch (error) {
      console.error(error);
      setStatus('同步失敗');
    }
  }, []);

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

      setStatus('同步中...');

      try {
        const ref = doc(services.db, 'users', nextUser.uid, 'learning', 'progress');
        const snap = await getDoc(ref);
        const merged = mergeRemoteProgress(snap.exists() ? snap.data() : {});
        await setDoc(ref, merged, { merge: true });
        window.dispatchEvent(new CustomEvent('learning-progress-updated'));
        setStatus('已同步');
      } catch (error) {
        console.error(error);
        setStatus('同步失敗');
      }
    });
  }, []);

  useEffect(() => {
    if (!user) return;

    const handleProgressUpdated = () => {
      window.clearTimeout(syncTimerRef.current);
      syncTimerRef.current = window.setTimeout(() => {
        setStatus('自動同步中...');
        syncLocalProgress('已自動同步');
      }, 700);
    };

    window.addEventListener('learning-progress-updated', handleProgressUpdated);
    return () => {
      window.removeEventListener('learning-progress-updated', handleProgressUpdated);
      window.clearTimeout(syncTimerRef.current);
    };
  }, [user, syncLocalProgress]);

  async function handleGoogleLogin() {
    const services = getFirebaseServices();
    if (!services) {
      setStatus('需設定 Firebase');
      return;
    }

    setStatus('登入中...');
    try {
      await signInWithPopup(services.auth, provider);
    } catch (error) {
      console.error(error);
      setStatus(getAuthErrorMessage(error));
    }
  }

  async function handleEmailSubmit(event, action) {
    event.preventDefault();
    const services = getFirebaseServices();
    if (!services) {
      setStatus('需設定 Firebase');
      return;
    }

    setStatus('登入中...');

    try {
      if (action === 'signup') {
        await createUserWithEmailAndPassword(services.auth, email, password);
      } else {
        await signInWithEmailAndPassword(services.auth, email, password);
      }
    } catch (error) {
      console.error(error);
      setStatus(getAuthErrorMessage(error));
    }
  }

  async function handleManualSync() {
    const services = getFirebaseServices();
    if (!services || !user) return;

    setStatus('同步中...');
    await syncLocalProgress('已同步');
  }

  async function handleLogout() {
    const services = getFirebaseServices();
    if (!services) return;
    await signOut(services.auth);
  }

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-white/90 border border-amber-100 px-3 py-1.5 text-xs font-black text-slate-500">
          {user ? user.email || '已登入' : status}
        </span>
        {user ? (
          <>
            <button onClick={handleManualSync} className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-black text-amber-700" type="button">
              同步
            </button>
            <button onClick={handleLogout} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600" type="button">
              登出
            </button>
          </>
        ) : (
          <button onClick={handleGoogleLogin} className="rounded-full bg-amber-600 px-3 py-1.5 text-xs font-black text-white disabled:opacity-50" type="button" disabled={!hasFirebaseConfig}>
            登入同步
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-amber-500">Account Sync</p>
          <h3 className="mt-1 text-base md:text-lg font-black text-slate-800">
            {user ? user.email || '已登入帳號' : '登入後跨裝置保存進度'}
          </h3>
          <p className="mt-1 text-xs md:text-sm font-bold text-slate-500">{status}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {user ? (
            <>
              <button onClick={handleManualSync} className="rounded-2xl bg-amber-600 px-4 py-2.5 text-sm font-black text-white" type="button">
                立即同步
              </button>
              <button onClick={handleLogout} className="rounded-2xl bg-white px-4 py-2.5 text-sm font-black text-slate-600 border border-slate-200" type="button">
                登出
              </button>
            </>
          ) : (
            <>
              <button onClick={handleGoogleLogin} className="rounded-2xl bg-amber-600 px-4 py-2.5 text-sm font-black text-white disabled:opacity-50" type="button" disabled={!hasFirebaseConfig}>
                Google 登入
              </button>
              <button onClick={() => setShowEmailForm((value) => !value)} className="rounded-2xl bg-white px-4 py-2.5 text-sm font-black text-slate-600 border border-slate-200" type="button">
                Email
              </button>
            </>
          )}
        </div>
      </div>

      {!hasFirebaseConfig && (
        <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-500">
          尚未設定 Firebase 環境變數，目前使用本機紀錄。
        </p>
      )}

      {showEmailForm && !user && (
        <form className="mt-4 grid gap-2 md:grid-cols-[1fr_1fr_auto_auto]">
          <input value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-400" placeholder="email" type="email" required />
          <input value={password} onChange={(event) => setPassword(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-400" placeholder="password" type="password" minLength={6} required />
          <button onClick={(event) => handleEmailSubmit(event, 'signin')} className="rounded-2xl bg-slate-800 px-4 py-3 text-sm font-black text-white" type="submit">
            登入
          </button>
          <button onClick={(event) => handleEmailSubmit(event, 'signup')} className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-700 border border-slate-200" type="submit">
            註冊
          </button>
        </form>
      )}
    </div>
  );
}
