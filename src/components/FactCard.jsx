// Власник: Dev 5 (Briefing UI).
// Картка «Факт дня»: великий emoji, один факт (читається за ~5 с), підпис джерела NASA.
// Пропси за контрактом (src/game/contracts.js, розд. 6): { state, dispatch, t }.
//
// Вибір факту: день N → факт з id N (src/data/facts.json, тексти — facts.<id>).
// Дні відльоту 29–30 → факти 31–32 «Наступна зупинка — Марс» (якщо вони вже є в даних).
// Таймер 5 с лише візуальний: гра не перемикається сама (WCAG 2.2.1), кнопка «Далі» доступна одразу.
import { useEffect, useId, useRef, useState } from 'react';
import { ACTIONS } from '../game/contracts.js';
import facts from '../data/facts.json';
import '../styles/fact-card.css';

/** Скільки часу дитині на прочитання (мс). Після — кнопка «Далі» м'яко підсвічується. */
const READ_TIME_MS = 5000;
/** День відльоту → id факту про Марс (домовленість з Content: факти 31–32). */
const MARS_FACT_BY_DAY = Object.freeze({ 29: 31, 30: 32 });
const LOCALES = Object.freeze({ ua: 'uk-UA', en: 'en-US' });

/**
 * @param {number} day
 * @returns {{ fact: { id: number, emoji: string, source: string }, isMars: boolean } | null}
 */
function pickFact(day) {
  if (!Array.isArray(facts) || facts.length === 0 || !Number.isInteger(day) || day < 1) return null;
  const byId = (id) => facts.find((f) => f.id === id);

  const marsFact = MARS_FACT_BY_DAY[day] && byId(MARS_FACT_BY_DAY[day]);
  if (marsFact) return { fact: marsFact, isMars: true };

  // Поки фактів менше за 30 (моки) — ідемо по колу, щоб картка завжди була.
  return { fact: byId(day) ?? facts[(day - 1) % facts.length], isMars: false };
}

export default function FactCard({ state, dispatch, t }) {
  const titleId = useId();
  const headingRef = useRef(null);
  const [readDone, setReadDone] = useState(false);
  const picked = pickFact(state.day);
  const locale = LOCALES[state.lang] ?? LOCALES.ua;

  useEffect(() => {
    window.scrollTo({ top: 0 });
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  const next = () => dispatch({ type: ACTIONS.NEXT });

  // Немає даних про факти — не блокуємо гру, лишаємо лише перехід далі.
  if (!picked) {
    return (
      <section className="screen fact" lang={locale}>
        <div className="screen__actions">
          <button type="button" className="btn btn--lg" onClick={next}>{t('common.next')}</button>
        </div>
      </section>
    );
  }

  const { fact, isMars } = picked;
  const handleTimerEnd = (event) => {
    if (event.target === event.currentTarget) setReadDone(true);
  };

  return (
    <section className="screen fact" lang={locale} data-topic={isMars ? 'mars' : 'moon'} aria-labelledby={titleId}>
      <article className="fact__card">
        <h2 id={titleId} ref={headingRef} tabIndex={-1} className="fact__title">
          <span aria-hidden="true">{isMars ? '🔴 ' : '🌟 '}</span>
          {t(isMars ? 'result.fact.mars_title' : 'result.fact.title')}
        </h2>
        <span className="fact__emoji" aria-hidden="true">{fact.emoji}</span>
        <p className="fact__text">{t(`facts.${fact.id}`)}</p>
        <p className="fact__source">{t('result.fact.source', { source: fact.source })}</p>
        <div className="fact__timer" aria-hidden="true">
          <span
            className="fact__timer-fill"
            style={{ '--read-time': `${READ_TIME_MS}ms` }}
            onAnimationEnd={handleTimerEnd}
          />
        </div>
      </article>
      <div className="screen__actions">
        <button type="button" className="btn btn--lg fact__next" data-ready={readDone || undefined} onClick={next}>
          {t('common.next')}
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  );
}
