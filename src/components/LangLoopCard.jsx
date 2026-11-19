import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { ArrowRight, AudioLines, Lock } from 'lucide-react';
import { getFirebaseServices } from '../lib/firebase';

// LangLoop（跟讀練習）是獨立的網站，使用同一個 Firebase 專案登入。它會用到付費 API，
// 所以只有在 LangLoop 允許名單裡的 Google 帳號才看得到這張卡片；真正的權限檢查在 LangLoop 伺服器。
const LANGLOOP_URL = (import.meta.env.PUBLIC_LANGLOOP_URL || 'https://langloop-three.vercel.app').replace(/\/$/, '');

async function checkAccess(user) {
  const response = await fetch(`${LANGLOOP_URL}/api/auth/access`, {
    headers: { Authorization: `Bearer ${await user.getIdToken()}` }
  });
  if (!response.ok) return false;
  const data = await response.json();
  return data?.allowed === true;
}

// 把 LangLoop 生字本裡、這裡字庫也有的字排進複習。字庫只在受邀帳號才載入，所以動態匯入。
async function importSavedWords(user) {
  const response = await fetch(`${LANGLOOP_URL}/api/words`, {
    headers: { Authorization: `Bearer ${await user.getIdToken()}` }
  });
  if (!response.ok) return 0;
  const data = await response.json();
  const { importFromLangLoop } = await import('../lib/reviewBridge.js');
  return importFromLangLoop(data?.words);
}

// 用表單 POST 把登入憑證交給 LangLoop，憑證不會出現在網址裡。
function openLangLoop(idToken) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = `${LANGLOOP_URL}/api/auth/handoff`;
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = 'idToken';
  input.value = idToken;
  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();
}

export default function LangLoopCard() {
  const [user, setUser] = useState(null);
  const [opening, setOpening] = useState(false);
  const [imported, setImported] = useState(0);

  useEffect(() => {
    const services = getFirebaseServices();
    if (!services) return undefined;
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(services.auth, async (nextUser) => {
      if (!nextUser) {
        setUser(null);
        return;
      }
      try {
        const allowed = await checkAccess(nextUser);
        if (!cancelled) setUser(allowed ? nextUser : null);
        if (allowed) {
          // 生字本匯入失敗不影響卡片，下次打開首頁會再試。
          importSavedWords(nextUser)
            .then((count) => { if (!cancelled && count) setImported(count); })
            .catch((error) => console.error(error));
        }
      } catch {
        if (!cancelled) setUser(null);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  if (!user) return null;

  const handleOpen = async () => {
    setOpening(true);
    try {
      openLangLoop(await user.getIdToken());
    } catch {
      setOpening(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleOpen}
      disabled={opening}
      aria-label={opening ? 'LangLoop 跟讀練習，開啟中' : '開啟 LangLoop 跟讀練習'}
      className="langloop-card group relative flex flex-col rounded-3xl p-5 text-left shadow-sm transition-transform duration-150 ease-[var(--ease-out)] hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-wait"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="langloop-card-icon grid h-11 w-11 place-items-center rounded-2xl">
          <AudioLines size={22} />
        </span>
        <span className="langloop-card-badge inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black">
          <Lock size={11} />
          受邀課程
        </span>
      </div>
      <p className="langloop-card-muted mt-4 text-xs font-bold">特別課程，聽力與跟讀</p>
      <h3 className="langloop-card-title mt-0.5 text-lg font-black leading-snug">LangLoop 跟讀練習</h3>
      <p className="langloop-card-muted mt-1.5 line-clamp-2 text-sm leading-relaxed">
        上傳音檔或貼上文章產生語音，逐句循環播放，字幕會跟著發音亮起。
      </p>
      {imported ? (
        <p className="langloop-card-accent mt-2 text-xs font-black">已把 LangLoop 生字本的 {imported} 個字排進複習，會優先出現</p>
      ) : null}
      <div className="mt-auto pt-5">
        <span className="langloop-card-accent inline-flex items-center gap-1 text-xs font-black">
          {opening ? '開啟中…' : '開始跟讀'}
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </button>
  );
}
