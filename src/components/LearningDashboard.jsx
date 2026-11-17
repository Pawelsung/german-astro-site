import React, { useEffect, useState } from 'react';
import { ArrowRight, Flame } from 'lucide-react';
import { PROGRESS_KEYS, getLearningSummary, getReviewAction, readJSON } from '../lib/progressStorage';
import { dayNumber, decodeReview } from '../lib/reviewStore.mjs';
import { TODAY_KEY, getReviewSnapshot } from '../lib/reviewQueue.mjs';
import { getActivity, getLastLesson } from '../lib/dailyActivity.mjs';
import LangLoopCard from './LangLoopCard.jsx';

const THEMES = {
  sky: { badge: 'bg-sky-soft text-sky-ink', bar: 'bg-sky-solid', ring: 'hover:border-sky-solid', accent: 'text-sky-ink' },
  emerald: { badge: 'bg-emerald-soft text-emerald-ink', bar: 'bg-emerald-solid', ring: 'hover:border-emerald-solid', accent: 'text-emerald-ink' },
  amber: { badge: 'bg-amber-soft text-amber-ink', bar: 'bg-amber-solid', ring: 'hover:border-amber-solid', accent: 'text-amber-ink' },
  violet: { badge: 'bg-violet-soft text-violet-ink', bar: 'bg-violet-solid', ring: 'hover:border-violet-solid', accent: 'text-violet-ink' },
  teal: { badge: 'bg-teal-soft text-teal-ink', bar: 'bg-teal-solid', ring: 'hover:border-teal-solid', accent: 'text-teal-ink' }
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
      className={`group relative flex flex-col rounded-3xl border border-line bg-surface p-5 shadow-sm transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-lg ${theme.ring}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={`grid h-11 w-11 place-items-center rounded-2xl text-lg font-black ${theme.badge}`}>{lesson.order}</span>
        <div className="flex flex-wrap justify-end gap-1.5 text-xs font-black">
          {ready && stats.review > 0 && (
            <span className="rounded-full bg-rose-soft px-2.5 py-1 text-rose-ink">{stats.review} 待複習</span>
          )}
          {lesson.level && <span className="rounded-full bg-surface-muted px-2.5 py-1 text-ink-soft">{lesson.level}</span>}
        </div>
      </div>
      <p className="mt-4 text-xs font-bold text-ink-muted">{kicker}</p>
      <h3 className="mt-0.5 text-lg font-black leading-snug text-ink">{heading}</h3>
      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-muted">{lesson.description}</p>
      <div className="mt-auto pt-5">
        <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-ink-muted">
          <span>{ready && total ? `已練 ${done} / ${total}` : `${lesson.minutes || 15} 分鐘`}</span>
          <span className={`inline-flex items-center gap-1 font-black ${theme.accent}`}>
            {ready && done > 0 ? '繼續' : '開始'}
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
          <div className={`h-full w-full origin-left ${theme.bar}`} style={{ transform: `scaleX(${ready ? percent / 100 : 0})`, transition: 'transform 700ms ease-out' }} />
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
        <div className="today-bar" role="progressbar" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={Math.min(done, goal)} aria-label="今日複習進度"><span style={{ transform: `scaleX(${percent / 100})` }} /></div>
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
          <h2 className="text-lg font-black text-ink">全部課程</h2>
          <span className="text-xs font-bold text-ink-muted">{lessons.length} 個主題</span>
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
