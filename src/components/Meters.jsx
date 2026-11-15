// Власник: Dev 5 (Briefing UI).
// Панель гри — проста для дітей: чотири великі іконки зі шкалою й числом
// ⚡ енергія · 🫁 повітря · ☢️ радіація · 🔬 наука, день місії та кнопки 🔊 ☀️ ❓ 🏠.
// Після рішення над шкалою вистрибує «+N / −N».
//
// Пропси за контрактом (src/game/contracts.js, розд. 2 і 6): { state, dispatch, t }.
// Межі шкал беруться з CONFIG — жодних «магічних» чисел балансу в UI.
import { useId, useMemo, useState } from 'react';
import { CONFIG } from '../game/config.js';
import HudButtons from './HudButtons.jsx';
import '../styles/meters.css';

/** Пороги кольору дози як частка від CONFIG.doseLimit: зелена < 40 %, жовта 40–70 %, червона > 70 %. */
const DOSE_WARN_RATIO = 0.4;
const DOSE_DANGER_RATIO = CONFIG.goldDoseMax / CONFIG.doseLimit;
/** Нижче цього рівня шкала повітря жовтіє. */
const LIFE_LOW_THRESHOLD = 40;
const LOCALES = Object.freeze({ ua: 'uk-UA', en: 'en-US' });

const clampRatio = (value, max) => (max > 0 && Number.isFinite(value) ? Math.min(1, Math.max(0, value / max)) : 0);

function getDoseTone(dose) {
  const ratio = dose / CONFIG.doseLimit;
  if (ratio >= DOSE_DANGER_RATIO) return 'danger';
  if (ratio >= DOSE_WARN_RATIO) return 'warn';
  return 'ok';
}

/** Пам'ятає попереднє значення, щоб показати зміну (патерн «стан із попереднього рендера»). */
function useValueChange(value) {
  const [snapshot, setSnapshot] = useState({ value, delta: 0, version: 0 });
  if (!Object.is(snapshot.value, value)) {
    const next = { value, delta: value - snapshot.value, version: snapshot.version + 1 };
    setSnapshot(next);
    return next;
  }
  return snapshot;
}

function Meter({ id, icon, label, value, max, tone, trendSign, alert, valueText, format }) {
  const labelId = useId();
  const change = useValueChange(value);
  const showDelta = change.version > 0 && Math.abs(change.delta) >= 0.05;
  const trend = change.delta * trendSign > 0 ? 'good' : 'bad';

  return (
    <li className="meter" data-meter={id} data-tone={tone} data-alert={alert || undefined} data-tour={id}>
      <span className="meter__icon" aria-hidden="true">{icon}</span>
      <div className="meter__body">
        <div className="meter__top">
          <span className="meter__label" id={labelId}>{label}</span>
          <span className="meter__value">{format.value(value)}</span>
        </div>
        <div
          className="meter__track"
          role="meter"
          aria-labelledby={labelId}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={valueText}
        >
          <span className="meter__fill" style={{ '--fill': clampRatio(value, max) }} />
        </div>
      </div>
      {showDelta && (
        <span key={change.version} className="meter__delta" data-trend={trend} aria-hidden="true">
          {format.delta(change.delta)}
        </span>
      )}
    </li>
  );
}

export default function Meters({ state, dispatch, t }) {
  const locale = LOCALES[state.lang] ?? LOCALES.ua;
  const format = useMemo(() => {
    const plain = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
    const signed = new Intl.NumberFormat(locale, { maximumFractionDigits: 1, signDisplay: 'exceptZero' });
    return { value: (n) => plain.format(n), delta: (n) => signed.format(n) };
  }, [locale]);

  const phase = state.briefing?.phase === 'night' ? 'night' : 'day';
  const doseTone = getDoseTone(state.dose);
  const lifeLow = state.life < LIFE_LOW_THRESHOLD;
  const scienceDone = state.science >= CONFIG.scienceGoal;

  const meters = [
    { id: 'battery', icon: '⚡', value: state.battery, max: CONFIG.batteryMax, tone: 'battery', trendSign: 1 },
    { id: 'life', icon: '🫁', value: state.life, max: CONFIG.lifeMax, tone: lifeLow ? 'warn' : 'life', trendSign: 1, alert: lifeLow },
    { id: 'dose', icon: '☢️', value: state.dose, max: CONFIG.doseLimit, tone: doseTone, trendSign: -1, alert: doseTone === 'danger' },
    { id: 'science', icon: scienceDone ? '🏆' : '🔬', value: state.science, max: CONFIG.scienceGoal, tone: scienceDone ? 'goal' : 'science', trendSign: 1 },
  ];

  return (
    <section className="meters" lang={locale} aria-label={t('briefing.meters.title')}>
      <div className="meters__header">
        <span className="meters__day" data-phase={phase}>
          <span aria-hidden="true">{phase === 'night' ? '🌑' : '☀️'}</span>
          {t('briefing.meters.day_of', { n: state.day, total: CONFIG.totalDays })}
        </span>
        <HudButtons state={state} dispatch={dispatch} t={t} />
      </div>
      <ul className="meters__list" role="list">
        {meters.map(({ id, ...meter }) => {
          const label = t(`briefing.meters.short.${id}`);
          const reading = t('briefing.meters.value_of', { value: format.value(meter.value), max: format.value(meter.max) });
          return <Meter key={id} id={id} label={label} valueText={`${t(`common.${id}`)}: ${reading}`} format={format} {...meter} />;
        })}
      </ul>
    </section>
  );
}
