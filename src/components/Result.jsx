// Власник: Dev 5 (Briefing UI).
// Екран «Результат дня»: що сталося і чому (result.<explanationKey>), зміни ресурсів кольорами
// (+ зелене, − червоне; для дози навпаки), розбір дози «шкода → укриття → отримано»,
// стан ракети в день 29 і картка уроку дня (days.<textKey>.lesson).
//
// Пропси за контрактом (src/game/contracts.js, розд. 4 і 6): { state, dispatch, t }.
// Нові explanationKey від рушія: додати текст у result.json (UA + EN) і тон у EXPLANATION_TONE.
import { useEffect, useId, useMemo, useRef } from 'react';
import { ACTIONS } from '../game/contracts.js';
import { CONFIG } from '../game/config.js';
import '../styles/result.css';

const LOCALES = Object.freeze({ ua: 'uk-UA', en: 'en-US' });

/** Рядки змін. polarity: +1 — зростання добре, −1 — зростання погано (доза). */
const DELTA_ROWS = Object.freeze([
  { id: 'battery', icon: '⚡', polarity: 1 },
  { id: 'life', icon: '🫁', polarity: 1 },
  { id: 'dose', icon: '☢️', polarity: -1 },
  { id: 'science', icon: '🔬', polarity: 1 },
]);

/** Тон пояснення → вигляд callout. Невідомий ключ → 'info'. */
const EXPLANATION_TONE = Object.freeze({
  shield_saved: 'ok',
  quiet_science: 'ok',
  normal: 'info',
  shield_weak: 'warning',
  life_low: 'warning',
});
const TONE_ICON = Object.freeze({ ok: '✅', info: '🛰️', warning: '⚠️' });
const FALLBACK_EXPLANATION = 'normal';

/** t() повертає сам ключ, якщо перекладу немає → null, щоб показати запасний варіант. */
const reportedMissing = new Set();
function translateOptional(t, key, params) {
  const text = t(key, params);
  if (text !== key) return text;
  // У dev попереджаємо один раз на ключ, щоб забутий переклад було видно в консолі.
  if (import.meta.env.DEV && !reportedMissing.has(key)) {
    reportedMissing.add(key);
    console.warn(`[Result] Немає перекладу: ${key}`);
  }
  return null;
}

/** @returns {'good' | 'bad' | 'neutral'} */
function getTrend(delta, polarity) {
  const sign = Math.sign(delta * polarity);
  if (sign > 0) return 'good';
  if (sign < 0) return 'bad';
  return 'neutral';
}

export default function Result({ state, dispatch, t }) {
  const r = state.result;
  const uid = useId();
  const ids = { title: `${uid}-title`, changes: `${uid}-changes`, dose: `${uid}-dose`, lesson: `${uid}-lesson` };
  const headingRef = useRef(null);
  const locale = LOCALES[state.lang] ?? LOCALES.ua;

  const fmt = useMemo(() => {
    const num = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
    const signed = new Intl.NumberFormat(locale, { maximumFractionDigits: 1, signDisplay: 'exceptZero' });
    const percent = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 });
    return { num: (n) => num.format(n), signed: (n) => signed.format(n), percent: (n) => percent.format(n) };
  }, [locale]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  if (!r) return null;

  const deltas = r.deltas ?? {};
  const protection = Number.isFinite(r.protection) ? r.protection : 0;
  const receivedShare = 1 - protection;
  const doseGain = r.params?.doseGain ?? deltas.dose ?? 0;

  // Параметри для текстів: числа вже відформатовані під мову (2,6 / 2.6; 90 % / 90%).
  const params = {
    ...r.params,
    percent: fmt.percent(protection),
    received: fmt.percent(receivedShare),
    damage: fmt.num(r.damage ?? 0),
    doseGain: fmt.num(doseGain),
    life: fmt.num(state.life),
    science: fmt.num(deltas.science ?? 0),
  };

  const explanationKey = r.explanationKey ?? FALLBACK_EXPLANATION;
  const explanation = translateOptional(t, `result.${explanationKey}`, params) ?? t(`result.${FALLBACK_EXPLANATION}`, params);
  const tone = EXPLANATION_TONE[explanationKey] ?? 'info';
  const lesson = state.briefing?.textKey ? translateOptional(t, `days.${state.briefing.textKey}.lesson`) : null;
  const launchReady = r.params?.launchReady;

  return (
    <section className="screen result" lang={locale} aria-labelledby={ids.title}>
      <header className="screen__header">
        <p className="eyebrow">{t('common.day', { n: state.day })}</p>
        <h2 id={ids.title} ref={headingRef} tabIndex={-1}>{t('result.title')}</h2>
      </header>

      <div className={`callout callout--${tone}`}>
        <span className="callout__icon" aria-hidden="true">{TONE_ICON[tone]}</span>
        <p className="callout__body">{explanation}</p>
      </div>

      <section aria-labelledby={ids.changes}>
        <h3 id={ids.changes} className="visually-hidden">{t('result.changes.heading')}</h3>
        <ul className="changes" role="list">
          {DELTA_ROWS.map(({ id, icon, polarity }, index) => {
            const delta = deltas[id] ?? 0;
            return (
              <li key={id} className="change" data-trend={getTrend(delta, polarity)} style={{ '--i': index }}>
                <span className="change__icon" aria-hidden="true">{icon}</span>
                <span className="change__label">{t(`common.${id}`)}</span>
                <span className="change__numbers">
                  <span className="change__delta">{fmt.signed(delta)}</span>
                  <span className="change__now">{t('result.changes.now', { value: fmt.num(state[id] ?? 0) })}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="dose-calc card" aria-labelledby={ids.dose}>
        <h3 id={ids.dose}>
          <span aria-hidden="true">☢️ </span>
          {t('result.dose.heading')}
        </h3>
        <div
          className="dose-calc__bar"
          role="img"
          aria-label={t('result.dose.bar', params)}
          style={{ '--received': receivedShare }}
        >
          <span className="dose-calc__received" />
          <span className="dose-calc__blocked" />
        </div>
        <dl className="dose-calc__facts">
          <div>
            <dt>{t('result.dose.damage')}</dt>
            <dd>☢️ {params.damage}</dd>
          </div>
          <div>
            <dt>{t('result.dose.shield')}</dt>
            <dd data-tone="shield">🛡️ {params.percent}</dd>
          </div>
          <div>
            <dt>{t('result.dose.received')}</dt>
            <dd data-tone="received">☢️ +{params.doseGain}</dd>
          </div>
        </dl>
        <p className="dose-calc__formula">{t('result.dose.formula', params)}</p>
      </section>

      {typeof launchReady === 'boolean' && (
        <div className={`callout callout--${launchReady ? 'ok' : 'danger'}`}>
          <span className="callout__icon" aria-hidden="true">{launchReady ? '🚀' : '⛽'}</span>
          <p className="callout__body">
            {t(launchReady ? 'result.launch.ready' : 'result.launch.not_ready', { n: CONFIG.launchPrepTokens })}
          </p>
        </div>
      )}

      {lesson && (
        <aside className="lesson" aria-labelledby={ids.lesson}>
          <h3 id={ids.lesson} className="lesson__title">
            <span aria-hidden="true">📘 </span>
            {t('result.lesson.heading')}
          </h3>
          <p className="lesson__text">{lesson}</p>
        </aside>
      )}

      <div className="screen__actions">
        <button type="button" className="btn btn--lg" onClick={() => dispatch({ type: ACTIONS.NEXT })}>
          {t('common.next')}
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  );
}
