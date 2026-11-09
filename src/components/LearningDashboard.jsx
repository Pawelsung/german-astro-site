import React, { useEffect, useState } from 'react';
import { ArrowRight, Flame } from 'lucide-react';
import { PROGRESS_KEYS, getLearningSummary, getReviewAction, readJSON } from '../lib/progressStorage';
import { dayNumber, decodeReview } from '../lib/reviewStore.mjs';
import { TODAY_KEY, getReviewSnapshot } from '../lib/reviewQueue.mjs';
import { getActivity, getLastLesson } from '../lib/dailyActivity.mjs';
import LangLoopCard from './LangLoopCard.jsx';

const THEMES = {
  sky: { badge: 'bg-sky-100 text-sky-700', bar: 'bg-sky-500', ring: 'hover:border-sky-300', accent: 'text-sky-600' },
  emerald: { badge: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500', ring: 'hover:border-emerald-300', accent: 'text-emerald-600' },
  amber: { badge: 'bg-amber-100 text-amber-700', bar: 'bg-amber-500', ring: 'hover:border-amber-300', accent: 'text-amber-600' },
  violet: { badge: 'bg-violet-100 text-violet-700', bar: 'bg-violet-500', ring: 'hover:border-violet-300', accent: 'text-violet-600' },
  teal: { badge: 'bg-teal-100 text-teal-700', bar: 'bg-teal-500', ring: 'hover:border-teal-300', accent: 'text-teal-600' }
};

// Progress per lesson, keyed by frontmatter order. `total` falls back to the static item count.
function lessonStats(order, summary) {
  switch (order) {
    case 1: return { done: summary.lesson1PracticedCount, review: summary.lesson1ErrorCount, total: summary.lesson1WordCount };
    case 2: return { done: summary.lesson2PracticedCount, review: summary.lesson2ReviewCount };
    case 3: return { done: summary.lesson3PracticedCount, review: summary.lesson3WrongCount };
    case 4: return { done: summary.lesson4AnsweredCount, review: summary.lesson4WrongCount };
    case 5: return { done: summary.lesson5AnsweredCount, review: summary.lesson5WrongCount };
    case 6: return { done: summary.lesson6AnsweredCount, review: summary.lesson6WrongCount };
    case 7: return { done: summary.lesson7AnsweredCount, review: summary.lesson7WrongCount };
    default: return { done: 0, review: 0 };
  }
}

function greeting(date) {
  const hour = date.getHours();
  if (hour < 5) return '夜深了，還在努力';
  if (hour < 11) return '早安';
  if (hour < 14) return '午安';
  if (hour < 18) return '下午好';
  return '晚安';
}

function LessonCard({ lesson, stats, ready }) {
  const theme = THEMES[lesson.theme] || THEMES.sky;
  const total = stats.total || lesson.total || 0;
  const done = Math.min(stats.done || 0, total || Infinity);
  const percent = total ? Math.round((done / total) * 100) : 0;
  const [prefix, name] = lesson.title.includes('｜') ? lesson.title.split('｜') : ['', lesson.title];
  const kicker = `Lektion ${lesson.order} · ${lesson.category}`;
  const heading = prefix.startsWith('Lektion') ? name : prefix || name;
  return (
    <a
      href={lesson.href}
      className={`group relative flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${theme.ring}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={`grid h-11 w-11 place-items-center rounded-2xl text-lg font-black ${theme.badge}`}>{lesson.order}</span>
        <div className="flex flex-wrap justify-end gap-1.5 text-[11px] font-black">
          {ready && stats.review > 0 && (
            <span className="rounded-full bg-rose-100 px-2.5 py-1 text-rose-700">{stats.review} 待複習</span>
          )}
          {lesson.level && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{lesson.level}</span>}
        </div>
      </div>
      <p className="mt-4 text-xs font-black tracking-wide text-slate-400">{kicker}</p>
      <h3 className="mt-0.5 text-lg font-black leading-snug text-slate-900">{heading}</h3>
      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-slate-500">{lesson.description}</p>
      <div className="mt-auto pt-5">
        <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-slate-500">
          <span>{ready && total ? `已練 ${done} / ${total}` : `${lesson.minutes || 15} 分鐘`}</span>
          <span className={`inline-flex items-center gap-1 font-black ${theme.accent}`}>
            {ready && done > 0 ? '繼續' : '開始'}
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div className={`h-full rounded-full ${theme.bar}`} style={{ width: `${ready ? percent : 0}%`, transition: 'width 700ms ease' }} />
        </div>
      </div>
    </a>
  );
}

const EMPTY_ACTIVITY = { streak: 0 };
const readSnapshot = () => getReviewSnapshot(readJSON(TODAY_KEY, null), decodeReview(readJSON(PROGRESS_KEYS.review, null)), dayNumber());

export default function LearningDashboard({ lessons = [] }) {
  // Start empty so the server render and first client render match; real data loads after mount.
  const [summary, setSummary] = useState(null);
  const [activity, setActivity] = useState(EMPTY_ACTIVITY);
  const [lastLesson, setLastLesson] = useState(null);
  const [today, setToday] = useState(null);
  const [hello, setHello] = useState('歡迎回來');

  useEffect(() => {
    const refresh = () => {
      setSummary(getLearningSummary());
      setActivity(getActivity());
      setLastLesson(getLastLesson());
      setToday(readSnapshot());
    };
    refresh();
    setHello(greeting(new Date()));
    window.addEventListener('storage', refresh);
    window.addEventListener('learning-progress-updated', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('learning-progress-updated', refresh);
    };
  }, []);

  const ready = summary !== null;
  const stats = Object.fromEntries(lessons.map((lesson) => [lesson.order, ready ? lessonStats(lesson.order, summary) : { done: 0, review: 0 }]));
  // Lesson 1 words live in the daily review now, so only the grammar lessons are counted here.
  const grammarReview = Object.entries(stats).reduce((sum, [order, item]) => (order === '1' ? sum : sum + (item.review || 0)), 0);
  const reviewAction = ready ? getReviewAction(summary, { skipLesson1: true }) : null;
  const goal = today?.goal ?? 15;
  const done = today?.done ?? 0;
  const percent = Math.min(100, Math.round((done / goal) * 100));
  const headline = today?.reached ? '今天完成了' : `今日複習 ${goal} 個字`;
  const subline = today?.reached ? `已複習 ${done} 個字，想多做可以繼續。` : done ? `已完成 ${done} 個，還剩 ${goal - done} 個。` : '看字、想一下、翻開，一次一個就好。';
  const cta = today?.reached ? '再做幾個' : done ? '繼續複習' : '開始複習';

  return (
    <div className="grid gap-6 md:gap-8">
      <section className="today-card">
        <div className="today-top">
          <p>{hello}</p>
          {activity.streak > 0 && <span className="today-streak"><Flame size={15} />{activity.streak} 天</span>}
        </div>
        <h1>{today ? headline : '今日複習'}</h1>
        <p className="today-sub">{today ? subline : '\u00a0'}</p>
        <div className="today-bar" role="progressbar" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={Math.min(done, goal)} aria-label="今日複習進度"><span style={{ width: `${percent}%` }} /></div>
        <a href="/review/" className="today-cta">{cta}<ArrowRight size={18} /></a>
        {ready && (grammarReview > 0 || lastLesson) && (
          <p className="today-more">
            {grammarReview > 0
              ? <a href={reviewAction.href}>文法有 {grammarReview} 題待複習</a>
              : <a href={lastLesson.href}>繼續上次：{lastLesson.title}</a>}
          </p>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-black text-slate-900">全部課程</h2>
          <span className="text-xs font-bold text-slate-500">{lessons.length} 個主題</span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lessons.map((lesson) => (
            <LessonCard key={lesson.href} lesson={lesson} stats={stats[lesson.order]} ready={ready} />
          ))}
          <LangLoopCard />
        </div>
      </section>
    </div>
  );
}
