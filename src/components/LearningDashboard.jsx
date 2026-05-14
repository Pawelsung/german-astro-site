import React, { useEffect, useState } from 'react';
import { ArrowRight, RotateCcw, Star } from 'lucide-react';
import { getLearningSummary } from '../lib/progressStorage';
import UserAccount from './UserAccount.jsx';

function LessonRecord({ href, label, title, primary, secondary, tone = 'amber' }) {
  const tones = {
    sky: 'text-sky-700 border-sky-100 bg-sky-50',
    emerald: 'text-emerald-700 border-emerald-100 bg-emerald-50',
    violet: 'text-violet-700 border-violet-100 bg-violet-50',
    teal: 'text-teal-700 border-teal-100 bg-teal-50',
    amber: 'text-amber-700 border-amber-100 bg-amber-50'
  };
  const toneClass = tones[tone] || tones.amber;

  return (
    <a
      href={href}
      className="grid min-w-64 grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 hover:bg-white transition-colors"
    >
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-black ${toneClass}`}>
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

function StatPill({ icon, label, value, tone }) {
  const colors = {
    rose: 'bg-rose-50 text-rose-600',
    amber: 'bg-amber-50 text-amber-700',
    slate: 'bg-slate-50 text-slate-700'
  };

  return (
    <div className={`rounded-xl px-4 py-3 ${colors[tone] || colors.slate}`}>
      <div className="mb-1 flex items-center gap-2">
        {icon}
        <span className="text-xs font-black">{label}</span>
      </div>
      <p className="text-2xl font-black">{value}</p>
    </div>
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

  const reviewCount =
    summary.lesson1ErrorCount +
    summary.lesson3WrongCount +
    summary.lesson4WrongCount +
    summary.lesson5WrongCount;
  const starredCount =
    summary.lesson2StarredCount +
    summary.lesson3StarredCount +
    summary.lesson4StarredCount +
    summary.lesson5StarredCount;
  const primaryAction =
    reviewCount > 0
      ? { href: '/lesson3-irregular-verbs/', label: '複習需要加強的內容' }
      : summary.lesson2ReviewCount > 0
        ? { href: '/lesson2-VerbWithPreposition/', label: '複習動詞與介系詞' }
        : { href: '/lesson1-wort/', label: '開始學習練習' };
  const lessonRecords = [
    {
      href: '/lesson1-wort/',
      label: '1',
      title: '單字練習',
      primary: { value: summary.lesson1ErrorCount, label: '錯誤紀錄' },
      secondary: `${summary.lesson1WordCount} 個單字`,
      tone: 'sky'
    },
    {
      href: '/lesson2-VerbWithPreposition/',
      label: '2',
      title: '動詞與介系詞',
      primary: { value: summary.lesson2ReviewCount, label: '複習' },
      secondary: `${summary.lesson2StarredCount} 個已收藏`,
      tone: 'emerald'
    },
    {
      href: '/lesson3-irregular-verbs/',
      label: '3',
      title: '不規則動詞',
      primary: { value: summary.lesson3WrongCount, label: '需要複習' },
      secondary: `${summary.lesson3StarredCount} 個已收藏`,
      tone: 'violet'
    },
    {
      href: '/lesson4-kasus/',
      label: '4',
      title: '格位練習',
      primary: { value: summary.lesson4WrongCount, label: '需要複習' },
      secondary: `${summary.lesson4StarredCount} 個已收藏`,
      tone: 'teal'
    },
    {
      href: '/lesson5-connectors/',
      label: '5',
      title: '連接詞與語序',
      primary: { value: summary.lesson5WrongCount, label: '錯題' },
      secondary: `${summary.lesson5AnsweredCount} 題已作答 · ${summary.lesson5StarredCount} 個已收藏`,
      tone: 'violet'
    }
  ];

  return (
    <section className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-slate-200 mb-8">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-3">
          <UserAccount />

          <a
            href={primaryAction.href}
            className="flex items-center justify-between gap-4 rounded-xl bg-slate-900 px-5 py-3.5 text-white hover:bg-slate-800 transition-colors"
          >
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-300">學習建議</p>
              <p className="mt-1 text-lg md:text-xl font-black">{primaryAction.label}</p>
            </div>
            <ArrowRight className="shrink-0 text-slate-300" size={24} />
          </a>
        </div>

        <div className="grid gap-3 content-start">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-2">
            <StatPill icon={<RotateCcw size={16} />} label="需要複習" value={reviewCount} tone="rose" />
            <StatPill icon={<Star size={16} className="fill-amber-400" />} label="已收藏" value={starredCount} tone="amber" />
          </div>

          <details className="rounded-xl border border-slate-200 bg-white">
            <summary className="grid cursor-pointer list-none grid-cols-[1fr_auto] items-center gap-3 px-4 py-3">
              <div>
                <h3 className="text-sm font-black text-slate-800">各課紀錄</h3>
                <p className="mt-0.5 text-xs font-bold text-slate-400">展開查看每一課的複習狀態</p>
              </div>
              <span className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-500">
                {lessonRecords.length} 課
              </span>
            </summary>

            <div className="border-t border-slate-100 p-3">
              <div className="grid max-h-72 gap-2 overflow-y-auto pr-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {lessonRecords.map((lesson) => (
                  <LessonRecord key={lesson.href} {...lesson} />
                ))}
              </div>
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}
