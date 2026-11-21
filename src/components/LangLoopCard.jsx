import React, { useEffect, useState } from 'react';
import { ArrowRight, AudioLines } from 'lucide-react';
import { listSavedWords, useLangLoopAccess } from '../lib/langloopClient';

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

  // One compact row: the listening page itself links to LangLoop for adding materials.
  return (
    <a href="/listening" className="langloop-card group flex items-center gap-3 rounded-2xl px-4 py-3 shadow-sm">
      <span className="langloop-card-icon grid h-9 w-9 shrink-0 place-items-center rounded-xl">
        <AudioLines size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="langloop-card-title block text-base font-black leading-snug">聽力練習</span>
        <span className="langloop-card-muted block truncate text-xs font-bold">
          {imported ? `已把生字本的 ${imported} 個字排進複習` : 'LangLoop 材料 · 逐句播放、單句循環'}
        </span>
      </span>
      <span className="langloop-card-accent inline-flex shrink-0 items-center gap-1 text-sm font-black">
        開始聽
        <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
      </span>
    </a>
  );
}
