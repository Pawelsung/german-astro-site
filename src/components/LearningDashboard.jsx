import React, { useEffect, useState } from 'react';
import { ArrowRight, RotateCcw, Star } from 'lucide-react';
import { getLearningSummary } from '../lib/progressStorage';
import UserAccount from './UserAccount.jsx';

function LessonRow({ href, label, title, primary, secondary }) {
  return (
    <a
      href={href}
      className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 hover:bg-amber-50 transition-colors"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-black text-amber-600 border border-amber-100">
        {label}
      </div>
      <div className="min-w-0">
        <h3 className="truncate text-sm font-black text-slate-800">{title}</h3>
        <p className="mt-0.5 text-xs font-bold text-slate-400">{secondary}</p>
      </div>
      <div className="text-right">
        <p className="text-lg font-black text-slate-800">{primary.value}</p>
        <p className="text-[11px] font-black text-slate-400">{primary.label}</p>
      </div>
    </a>
  );
}

export default function LearningDashboard() {
  const [summary, setSummary] = useState(() => getLearningSummary());

  useEffect(() => {
    const refresh = () => setSummary(getLearningSummary());
    refresh();
    window.addEventListener('storage', refresh);
    window.addEventListener('learning-progress-updated', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('learning-progress-updated', refresh);
    };
  }, []);

  const reviewCount = summary.lesson1ErrorCount + summary.lesson3WrongCount;
  const starredCount = summary.lesson2StarredCount + summary.lesson3StarredCount;
  const primaryAction =
    reviewCount > 0
      ? { href: '/lesson3-irregular-verbs/', label: '複習待加強' }
      : summary.lesson2ReviewCount > 0
        ? { href: '/lesson2-VerbWithPreposition/', label: '複習介系詞' }
        : { href: '/lesson1-wort/', label: '開始今日練習' };

  return (
    <section className="bg-white rounded-[28px] p-4 md:p-5 shadow-xl border border-amber-50 mb-10">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_1.3fr]">
        <div className="space-y-3">
          <UserAccount />

          <a
            href={primaryAction.href}
            className="flex items-center justify-between gap-4 rounded-2xl bg-slate-900 px-5 py-4 text-white hover:bg-slate-800 transition-colors"
          >
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-amber-300">今日任務</p>
              <p className="mt-1 text-xl font-black">{primaryAction.label}</p>
            </div>
            <ArrowRight className="shrink-0 text-amber-300" size={24} />
          </a>
        </div>

        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-rose-50 px-4 py-3">
              <div className="mb-2 flex items-center gap-2 text-rose-500">
                <RotateCcw size={16} />
                <span className="text-xs font-black">待加強</span>
              </div>
              <p className="text-2xl font-black text-rose-600">{reviewCount}</p>
            </div>
            <div className="rounded-2xl bg-amber-50 px-4 py-3">
              <div className="mb-2 flex items-center gap-2 text-amber-500">
                <Star size={16} className="fill-amber-400" />
                <span className="text-xs font-black">收藏</span>
              </div>
              <p className="text-2xl font-black text-amber-700">{starredCount}</p>
            </div>
          </div>

          <div className="grid gap-2">
            <LessonRow
              href="/lesson1-wort/"
              label="1"
              title="名詞練習"
              primary={{ value: summary.lesson1ErrorCount, label: '錯題' }}
              secondary={`${summary.lesson1WordCount} 個單字`}
            />
            <LessonRow
              href="/lesson2-VerbWithPreposition/"
              label="2"
              title="動詞介系詞"
              primary={{ value: summary.lesson2ReviewCount, label: '複習' }}
              secondary={`${summary.lesson2StarredCount} 個收藏`}
            />
            <LessonRow
              href="/lesson3-irregular-verbs/"
              label="3"
              title="不規則動詞"
              primary={{ value: summary.lesson3WrongCount, label: '待加強' }}
              secondary={`${summary.lesson3StarredCount} 個收藏`}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
