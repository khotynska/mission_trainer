// Картка-підсумок спокійних днів: їх не граємо наживо — база працює на автопілоті,
// а дитина бачить коротку «перемотку» ⏩: дні-плитки, що змінилося, попередження наперед і один факт.
// Пропси за контрактом: { state, dispatch, t }. Дані — state.calmLog (див. reducer.runCalmDays).
import { useEffect, useMemo } from 'react';
import { ACTIONS } from '../game/contracts.js';
import facts from '../data/facts.json';
import Lira from './Lira.jsx';
import { play } from './sfx.js';
import '../styles/result.css';
import '../styles/calm.css';

const LOCALES = Object.freeze({ ua: 'uk-UA', en: 'en-US' });
const EVENT_ICON = Object.freeze({ QUIET: '😌', M: '✨' });
const SUM_ROWS = [
  { id: 'battery', icon: '⚡', polarity: 1 },
  { id: 'life', icon: '🫁', polarity: 1 },
  { id: 'dose', icon: '☢️', polarity: -1 },
  { id: 'science', icon: '🔬', polarity: 1 },
];
const played = new WeakSet();
const NO_DAYS = Object.freeze([]);

export default function CalmSummary({ state, dispatch, t }) {
  const log = state.calmLog ?? NO_DAYS;
  const locale = LOCALES[state.lang] ?? LOCALES.ua;

  const fmt = useMemo(() => {
    const signed = new Intl.NumberFormat(locale, { maximumFractionDigits: 1, signDisplay: 'exceptZero' });
    const date = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' });
    return { signed: (n) => signed.format(n), date: (iso) => date.format(new Date(`${iso}T00:00:00Z`)) };
  }, [locale]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    if (log.length && !played.has(log)) {
      played.add(log);
      play('whoosh');
    }
  }, [log]);

  const next = () => dispatch({ type: ACTIONS.NEXT });
  if (log.length === 0) {
    return (
      <section className="screen calm">
        <div className="screen__actions">
          <button type="button" className="btn btn--lg" onClick={next}>{t('common.next')} ▶</button>
        </div>
      </section>
    );
  }

  const from = log[0].day;
  const to = log[log.length - 1].day;
  const night = log[log.length - 1].phase === 'night';
  const totals = SUM_ROWS.map((row) => ({
    ...row,
    value: Math.round(log.reduce((sum, d) => sum + (d.deltas?.[row.id] ?? 0), 0) * 10) / 10,
  }));
  const ahead = [...new Set((log[log.length - 1].warnings ?? []).filter((w) => w.type === 'CME').map((w) => w.inDays))];
  const fact = facts.find((f) => f.id === to) ?? facts[(to - 1) % facts.length];

  return (
    <section className="screen calm" lang={locale} aria-labelledby="calm-title">
      <header className="calm__header">
        <p className="calm__ff" aria-hidden="true">⏩</p>
        <h2 id="calm-title">
          {from === to ? t('progress.calm.one', { n: from }) : t('progress.calm.range', { from, to })}
        </h2>
      </header>

      <Lira mood="happy" text={t(night ? 'progress.calm.lira_night' : 'progress.calm.lira')} t={t} compact />

      <ol className="calm__days" role="list">
        {log.map((d, i) => (
          <li key={d.day} className="calm__day" data-phase={d.phase} style={{ '--i': i }}>
            <span className="calm__day-n">{t('common.day', { n: d.day })}</span>
            <span className="calm__day-icon" aria-hidden="true">{d.phase === 'night' ? '🌑' : '☀️'}{EVENT_ICON[d.event] ?? '✨'}</span>
            <span className="calm__day-date">{fmt.date(d.date)}</span>
            {d.detail && <span className="calm__day-detail">{d.detail}</span>}
          </li>
        ))}
      </ol>

      <ul className="deltas" role="list" aria-label={t('progress.calm.sum')}>
        {totals.map(({ id, icon, polarity, value }, i) => {
          const trend = Math.sign(value * polarity) > 0 ? 'good' : Math.sign(value * polarity) < 0 ? 'bad' : 'neutral';
          return (
            <li key={id} className="delta" data-trend={trend} style={{ '--i': i + log.length }}>
              <span className="delta__icon" aria-hidden="true">{icon}</span>
              <span className="delta__value">{fmt.signed(value)}</span>
              <span className="visually-hidden">{t(`common.${id}`)}</span>
            </li>
          );
        })}
      </ul>

      {ahead.length > 0 && (
        <p className="calm__ahead">
          {ahead.map((n) => (
            <span key={n} className="chip chip--warning">
              {n === 1 ? t('briefing.forecast.cme_tomorrow') : t('briefing.forecast.cme', { n })}
            </span>
          ))}
        </p>
      )}

      {fact && (
        <p className="tip calm__fact">
          <span className="tip__icon" aria-hidden="true">{fact.emoji}</span>
          <span>{t(`facts.${fact.id}`)}</span>
        </p>
      )}

      <div className="screen__actions">
        <button type="button" className="btn btn--lg" onClick={next}>
          {t('common.next')} <span aria-hidden="true">▶</span>
        </button>
      </div>
    </section>
  );
}
