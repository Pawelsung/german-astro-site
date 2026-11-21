import React, { useEffect, useState } from 'react';
import { ArrowRight, AudioLines, Lock } from 'lucide-react';
import { listSavedWords, openLangLoop, useLangLoopAccess } from '../lib/langloopClient';

// LangLoop（跟讀練習）是獨立的網站，使用同一個 Firebase 專案登入。它會用到付費 API，
// 所以只有在 LangLoop 允許名單裡的 Google 帳號才看得到這張卡片；真正的權限檢查在 LangLoop 伺服器。

// 把 LangLoop 生字本裡、這裡字庫也有的字排進複習。字庫只在受邀帳號才載入，所以動態匯入。
async function importSavedWords(user) {
  const words = await listSavedWords(user);
  const { importFromLangLoop } = await import('../lib/reviewBridge.js');
  return importFromLangLoop(words);
}

export default function LangLoopCard() {
  const { status, user } = useLangLoopAccess();
  const [opening, setOpening] = useState(false);
  const [imported, setImported] = useState(0);

  useEffect(() => {
    if (status !== 'ok') return undefined;
    let cancelled = false;
    // 生字本匯入失敗不影響卡片，下次打開首頁會再試。
    importSavedWords(user)
      .then((count) => { if (!cancelled && count) setImported(count); })
      .catch((error) => console.error(error));
    return () => { cancelled = true; };
  }, [status, user]);

  if (status !== 'ok') return null;

  const handleOpen = async () => {
    setOpening(true);
    try {
      openLangLoop(await user.getIdToken());
    } catch {
      setOpening(false);
    }
  };

  return (
    <section className="langloop-card relative flex flex-col gap-4 rounded-3xl p-5 text-left shadow-sm sm:flex-row sm:items-center">
      <span className="langloop-card-icon grid h-11 w-11 shrink-0 place-items-center rounded-2xl">
        <AudioLines size={22} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="langloop-card-muted flex items-center gap-1 text-xs font-bold"><Lock size={11} />受邀帳號限定，只會看到自己的材料</p>
        <h2 className="langloop-card-title mt-0.5 text-lg font-black leading-snug">聽力練習</h2>
        <p className="langloop-card-muted mt-1 text-sm leading-relaxed">播放你在 LangLoop 勾選「放到德語網站」的材料，逐句亮起、單句循環。</p>
        {imported ? (
          <p className="langloop-card-accent mt-2 text-xs font-black">已把 LangLoop 生字本的 {imported} 個字排進複習，會優先出現</p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-col gap-2 sm:items-end">
        <a href="/listening" className="langloop-card-link group inline-flex min-h-11 items-center justify-center gap-1 rounded-2xl px-4 text-sm font-black">
          <span className="langloop-card-title">開始聽</span>
          <ArrowRight size={16} className="langloop-card-accent transition-transform group-hover:translate-x-1" />
        </a>
        <button
          type="button"
          onClick={handleOpen}
          disabled={opening}
          className="langloop-card-accent inline-flex min-h-11 items-center justify-center gap-1 text-xs font-black disabled:cursor-wait"
        >
          {opening ? '開啟中…' : '到 LangLoop 新增材料'}
        </button>
      </div>
    </section>
  );
}
