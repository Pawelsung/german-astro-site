import React, { useEffect, useState } from 'react';
import { ArrowRight, Flame, RotateCcw, Star, Target } from 'lucide-react';
import { getLearningSummary, getReviewAction } from '../lib/progressStorage';
import { getActivity, getLastLesson } from '../lib/dailyActivity.mjs';

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

function GoalRing({ value, goal }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const ratio = Math.min(value / goal, 1);
  return (
    <div className="relative grid h-24 w-24 shrink-0 place-items-center md:h-32 md:w-32">
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgb(255 255 255 / 0.18)" strokeWidth="9" />
        <circle
          cx="50" cy="50" r={radius} fill="none" stroke="white" strokeWidth="9" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={circumference * (1 - ratio)}
          style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(.2,.8,.2,1)' }}
        />
      </svg>
      <div className="text-center leading-none">
        <div className="text-2xl font-black md:text-3xl">{value}</div>
        <div className="mt-1 text-xs font-bold text-white/70">/ {goal} 題</div>
      </div>
    </div>
  );
}

function StatTile({ icon, label, value, href }) {
  const body = (
    <>
      <span className="hidden h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 sm:grid">{icon}</span>
      <span className="min-w-0">
        <span className="block text-xs font-bold text-slate-500">{label}</span>
        <span className="block text-xl font-black text-slate-900">{value}</span>
      </span>
    </>
  );
  const cls = 'flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm sm:px-4 sm:py-3';
  return href ? <a href={href} className={`${cls} transition-colors hover:border-slate-300`}>{body}</a> : <div className={cls}>{body}</div>;
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

const EMPTY_ACTIVITY = { goal: 10, todayAnswered: 0, todayCorrect: 0, streak: 0, week: [] };

export default function LearningDashboard({ lessons = [] }) {
  // Start empty so the server render and first client render match; real data loads after mount.
  const [summary, setSummary] = useState(null);
  const [activity, setActivity] = useState(EMPTY_ACTIVITY);
  const [lastLesson, setLastLesson] = useState(null);
  const [hello, setHello] = useState('歡迎回來');

  useEffect(() => {
    const refresh = () => {
      setSummary(getLearningSummary());
      setActivity(getActivity());
      setLastLesson(getLastLesson());
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
  const reviewCount = Object.values(stats).reduce((sum, item) => sum + (item.review || 0), 0);
  const starredCount = ready
    ? summary.lesson1StarredCount + summary.lesson2StarredCount + summary.lesson3StarredCount + summary.lesson4StarredCount + summary.lesson5StarredCount + summary.lesson6StarredCount
    : 0;
  const reviewAction = ready ? getReviewAction(summary) : null;
  const hasReview = ready && reviewCount > 0;
  const primary = hasReview
    ? { href: reviewAction.href, label: reviewAction.label.replace(/^複習/, '複習 ') }
    : lastLesson
      ? { href: lastLesson.href, label: `繼續 ${lastLesson.title}` }
      : { href: lessons[0]?.href || '/lesson1-wort/', label: '從單字開始' };
  const secondary = hasReview && lastLesson && !reviewAction.href.startsWith(lastLesson.href) ? lastLesson : null;
  const goalDone = activity.todayAnswered >= activity.goal;
  const accuracy = activity.todayAnswered ? `${Math.round((activity.todayCorrect / activity.todayAnswered) * 100)}%` : '—';
  const weekMax = Math.max(activity.goal, ...activity.week.map((day) => day.answered));

  return (
    <div className="grid gap-6 md:gap-8">
      <section className="home-hero relative overflow-hidden rounded-[28px] p-5 text-white shadow-xl md:p-8">
        <div className="relative grid items-center gap-6 md:grid-cols-[1fr_auto]">
          <div className="min-w-0">
            <p className="text-sm font-bold text-white/75">{hello}</p>
            <h2 className="mt-1 text-2xl font-black leading-tight md:text-3xl">
              {goalDone ? '今日目標達成！再多練幾題吧 🎉' : `今天的任務：完成 ${activity.goal} 題`}
            </h2>
            <p className="mt-2 text-sm font-medium text-white/75">
              {hasReview ? `你有 ${reviewCount} 題待複習，先把它們清掉最有效率。` : '每天 5 分鐘，比一次讀很久更容易記住。'}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <a href={primary.href} className="home-cta inline-flex min-h-12 items-center gap-2 rounded-2xl px-5 py-3 text-base font-black shadow-lg transition-transform hover:-translate-y-0.5 active:scale-[0.98]">
                {hasReview ? <RotateCcw size={18} /> : <Target size={18} />}
                {primary.label}
                <ArrowRight size={18} />
              </a>
              {secondary && (
                <a href={secondary.href} className="rounded-2xl px-3 py-2 text-sm font-bold text-white/85 underline-offset-4 hover:underline">
                  或繼續上次：{secondary.title}
                </a>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 md:flex-col md:gap-3">
            <GoalRing value={activity.todayAnswered} goal={activity.goal} />
            <div className="grid gap-2">
              <div className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white/15 px-3 py-1.5 text-sm font-black">
                <Flame size={16} className={activity.streak ? 'text-amber-300' : 'text-white/60'} />
                {activity.streak ? `連續 ${activity.streak} 天` : '開始連續紀錄'}
              </div>
              <div className="flex h-8 items-end gap-1 md:justify-center" aria-label="最近七天作答量">
                {(activity.week.length ? activity.week : Array.from({ length: 7 }, (_, i) => ({ key: i, answered: 0 }))).map((day) => (
                  <span
                    key={day.key}
                    title={`${day.key}：${day.answered} 題`}
                    className={`w-3 rounded-full ${day.answered ? 'bg-white' : 'bg-white/25'}`}
                    style={{ height: `${Math.max(18, (day.answered / weekMax) * 100)}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2 sm:gap-3" aria-label="學習統計">
        <StatTile icon={<RotateCcw size={18} />} label="待複習" value={ready ? reviewCount : '—'} href={hasReview ? reviewAction.href : undefined} />
        <StatTile icon={<Star size={18} />} label="已收藏" value={ready ? starredCount : '—'} />
        <StatTile icon={<Target size={18} />} label="今日正確率" value={accuracy} />
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
        </div>
      </section>
    </div>
  );
}
