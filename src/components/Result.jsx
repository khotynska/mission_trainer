// Власник: Dev 5 (Briefing UI).
// Екран «Що сталося»: сцена показує подію (екіпаж в укритті чи надворі), Ліра реагує одним
// реченням, великі іконки змін ⚡🫁☢️🔬, одна порада 💡 і кнопки «Далі» / «Переграти день».
// Добре рішення — звук, конфеті й радісна Ліра; погане — тривожна Ліра й пропозиція переграти.
//
// Пропси за контрактом (src/game/contracts.js, розд. 4 і 6): { state, dispatch, t }.
import { useEffect, useMemo, useRef } from 'react';
import { ACTIONS } from '../game/contracts.js';
import { CONFIG } from '../game/config.js';
import BaseScene from './BaseScene.jsx';
import Lira from './Lira.jsx';
import Confetti from './Confetti.jsx';
import { play } from './sfx.js';
import '../styles/result.css';

const LOCALES = Object.freeze({ ua: 'uk-UA', en: 'en-US' });

/** Рядки змін. polarity: +1 — зростання добре, −1 — зростання погано (доза). */
const DELTA_ROWS = Object.freeze([
  { id: 'battery', icon: '⚡', polarity: 1 },
  { id: 'life', icon: '🫁', polarity: 1 },
  { id: 'dose', icon: '☢️', polarity: -1 },
  { id: 'science', icon: '🔬', polarity: 1 },
]);

function getTrend(delta, polarity) {
  const sign = Math.sign(delta * polarity);
  if (sign > 0) return 'good';
  if (sign < 0) return 'bad';
  return 'neutral';
}

/** Звук і реакція — один раз на результат (StrictMode у dev викликає ефекти двічі). */
const celebrated = new WeakSet();

export default function Result({ state, dispatch, t }) {
  const r = state.result;
  const locale = LOCALES[state.lang] ?? LOCALES.ua;
  const headingRef = useRef(null);

  const fmt = useMemo(() => {
    const num = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
    const signed = new Intl.NumberFormat(locale, { maximumFractionDigits: 1, signDisplay: 'exceptZero' });
    const percent = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 });
    return { num: (n) => num.format(n), signed: (n) => signed.format(n), percent: (n) => percent.format(n) };
  }, [locale]);

  const mood = r?.mood ?? (r?.explanationKey === 'shield_weak' || r?.explanationKey === 'life_low' ? 'worried' : 'happy');

  useEffect(() => {
    window.scrollTo({ top: 0 });
    headingRef.current?.focus({ preventScroll: true });
    if (r && !celebrated.has(r)) {
      celebrated.add(r);
      play(mood === 'happy' ? 'good' : 'bad');
    }
  }, [r, mood]);

  if (!r) return null;

  const b = state.briefing;
  const choice = r.choice;
  const deltas = r.deltas ?? {};
  const params = {
    percent: fmt.percent(r.protection ?? 0),
    doseGain: fmt.num(r.params?.doseGain ?? deltas.dose ?? 0),
    damage: fmt.num(r.damage ?? 0),
    science: fmt.num(deltas.science ?? 0),
    life: fmt.num(state.life),
  };

  let reaction;
  if (choice?.timedOut) reaction = t('result.react.timeout', params);
  else if (choice) reaction = t(`result.react.${choice.kind}.${choice.id}`, params);
  else reaction = t(`result.${r.explanationKey ?? 'normal'}`, params);

  const sheltered = choice ? choice.id === 'shelter' || choice.id === 'hide' : (state.lastAllocation?.shield ?? 0) >= 2;
  const lesson = b?.textKey ? t(`days.${b.textKey}.lesson`) : null;
  const launchReady = r.params?.launchReady;
  const canRetry = mood === 'worried' && Boolean(state.daySnapshot);

  return (
    <section className="screen outcome" lang={locale} data-mood={mood} aria-labelledby="outcome-title">
      <h2 id="outcome-title" ref={headingRef} tabIndex={-1} className="visually-hidden">{t('result.title')}</h2>
      {mood === 'happy' && <Confetti burst={state.day} />}

      <BaseScene
        phase={b?.phase ?? 'day'}
        event={b?.event?.type ?? 'QUIET'}
        crew={sheltered ? 'shelter' : 'work'}
        effect="strike"
        label={t('briefing.scene.label', { state: t(`briefing.scene.${sheltered ? 'shelter' : 'work'}`) })}
      />

      <Lira mood={mood} text={reaction} t={t} />

      <ul className="deltas" role="list" aria-label={t('result.changes.heading')}>
        {DELTA_ROWS.map(({ id, icon, polarity }, index) => {
          const delta = deltas[id] ?? 0;
          return (
            <li key={id} className="delta" data-trend={getTrend(delta, polarity)} style={{ '--i': index }}>
              <span className="delta__icon" aria-hidden="true">{icon}</span>
              <span className="delta__value">{fmt.signed(delta)}</span>
              <span className="visually-hidden">{t(`common.${id}`)}</span>
            </li>
          );
        })}
      </ul>

      {typeof launchReady === 'boolean' && (
        <p className={`chip ${launchReady ? 'chip--ok' : 'chip--danger'} outcome__rocket`}>
          {t(launchReady ? 'result.launch.ready' : 'result.launch.not_ready', { n: CONFIG.launchPrepTokens })}
        </p>
      )}

      {lesson && lesson !== `days.${b.textKey}.lesson` && (
        <p className="tip">
          <span className="tip__icon" aria-hidden="true">💡</span>
          <span>{lesson}</span>
        </p>
      )}

      <div className="screen__actions outcome__actions">
        {canRetry && (
          <button type="button" className="btn btn--secondary" onClick={() => dispatch({ type: ACTIONS.RETRY_DAY })}>
            <span aria-hidden="true">🔁</span> {t('result.retry')}
          </button>
        )}
        <button type="button" className="btn btn--lg" onClick={() => dispatch({ type: ACTIONS.NEXT })}>
          {t('common.next')} <span aria-hidden="true">▶</span>
        </button>
      </div>
    </section>
  );
}
