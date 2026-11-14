// Власник: Dev 5 (Briefing UI).
// Панель стану бази: ⚡ енергія /12 · 🫁 життєзабезпечення /100 · ☢️ доза /100 · 🔬 наука до мети 150
// + фаза місячної доби (☀️ день / 🌑 ніч / 🌅 схід Сонця в дні відльоту).
//
// Пропси за контрактом (src/game/contracts.js, розд. 2 і 6): { state, dispatch, t }; dispatch не потрібен.
// Межі шкал беруться з CONFIG — жодних «магічних» чисел балансу в UI.
// Тексти: common.* (назви ресурсів, фази) і briefing.meters.* (службові підписи).
// Анімація: заповнення — покрокова CSS transition (піксель-стиль); після рішення з'являється чіп «+N / −N».
// Треки поділені на блоки: батарея — 12 жетонів, інші шкали — по 10 % (--segments).
import { useId, useMemo, useState } from 'react';
import { CONFIG } from '../game/config.js';
import '../styles/meters.css';

/** Пороги кольору дози як частка від CONFIG.doseLimit: зелена < 40 %, жовта 40–70 %, червона > 70 %. */
const DOSE_WARN_RATIO = 0.4;
const DOSE_DANGER_RATIO = 0.7;
/** Нижче цього рівня шкала життєзабезпечення жовтіє (той самий поріг, що й пояснення `life_low` у рушії). */
const LIFE_LOW_THRESHOLD = 40;
/** Тиждень 5 у days.json — дні відльоту 29–30 (на мапі місії це 🌅). */
const LAUNCH_WEEK = 5;
const LOCALES = Object.freeze({ ua: 'uk-UA', en: 'en-US' });

const clampRatio = (value, max) => (max > 0 && Number.isFinite(value) ? Math.min(1, Math.max(0, value / max)) : 0);

/** @returns {'ok' | 'warn' | 'danger'} */
function getDoseTone(dose) {
  const ratio = dose / CONFIG.doseLimit;
  if (ratio > DOSE_DANGER_RATIO) return 'danger';
  if (ratio >= DOSE_WARN_RATIO) return 'warn';
  return 'ok';
}

/** Фаза для чіпа в заголовку. Брифінгу немає (напр. екран без дня) → місячний день. */
function getPhase(briefing) {
  if (briefing?.phase === 'night') return { id: 'night', icon: '🌑', labelKey: 'common.phase_night' };
  if (briefing?.week === LAUNCH_WEEK) return { id: 'sunrise', icon: '🌅', labelKey: 'briefing.meters.phase_sunrise' };
  return { id: 'day', icon: '☀️', labelKey: 'common.phase_day' };
}

/**
 * Пам'ятає попереднє значення, щоб показати зміну після рішення.
 * Патерн «стан із попереднього рендера» (react.dev): без ефектів і таймерів, безпечно для StrictMode.
 * @param {number} value
 * @returns {{ value: number, delta: number, version: number }} version > 0 — значення змінювалось.
 */
function useValueChange(value) {
  const [snapshot, setSnapshot] = useState({ value, delta: 0, version: 0 });
  if (!Object.is(snapshot.value, value)) {
    const next = { value, delta: value - snapshot.value, version: snapshot.version + 1 };
    setSnapshot(next);
    return next;
  }
  return snapshot;
}

/**
 * Одна шкала. trendSign: +1 — зростання добре, −1 — зростання погано (доза).
 */
function Meter({ id, icon, label, value, max, tone, trendSign, status, valueText, trackStyle, format }) {
  const labelId = useId();
  const change = useValueChange(value);
  const showDelta = change.version > 0 && Math.abs(change.delta) >= 0.05;
  const trend = change.delta * trendSign > 0 ? 'good' : 'bad';

  return (
    <li className="meter" data-meter={id} data-tone={tone}>
      <div className="meter__head">
        <span className="meter__icon" aria-hidden="true">{icon}</span>
        <span className="meter__label" id={labelId}>{label}</span>
      </div>
      <div className="meter__reading">
        <span className="meter__value">{format.value(value)}</span>
        <span className="meter__max">/{format.value(max)}</span>
        {showDelta && (
          <span key={change.version} className="meter__delta" data-trend={trend} aria-hidden="true">
            {format.delta(change.delta)}
          </span>
        )}
      </div>
      <div
        className="meter__track"
        role="meter"
        aria-labelledby={labelId}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={valueText}
        style={trackStyle}
      >
        <span className="meter__fill" style={{ '--fill': clampRatio(value, max) }} />
      </div>
      <span className="meter__status">{status}</span>
    </li>
  );
}

export default function Meters({ state, t }) {
  const locale = LOCALES[state.lang] ?? LOCALES.ua;
  const format = useMemo(() => {
    const plain = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
    const signed = new Intl.NumberFormat(locale, { maximumFractionDigits: 1, signDisplay: 'exceptZero' });
    return { value: (n) => plain.format(n), delta: (n) => signed.format(n) };
  }, [locale]);

  const phase = getPhase(state.briefing);
  const doseTone = getDoseTone(state.dose);
  const lifeLow = state.life < LIFE_LOW_THRESHOLD;
  const scienceDone = state.science >= CONFIG.scienceGoal;

  const meters = [
    {
      id: 'battery', icon: '⚡', value: state.battery, max: CONFIG.batteryMax, tone: 'battery', trendSign: 1,
      status: state.battery >= CONFIG.batteryMax ? t('briefing.meters.battery_full') : '',
      trackStyle: { '--segments': CONFIG.batteryMax },
    },
    {
      id: 'life', icon: '🫁', value: state.life, max: CONFIG.lifeMax, tone: lifeLow ? 'warn' : 'life', trendSign: 1,
      status: lifeLow ? t('briefing.meters.life_low') : '',
    },
    {
      id: 'dose', icon: '☢️', value: state.dose, max: CONFIG.doseLimit, tone: doseTone, trendSign: -1,
      status: t(`briefing.meters.dose_status.${doseTone}`),
      trackStyle: { '--warn-at': `${DOSE_WARN_RATIO * 100}%`, '--danger-at': `${DOSE_DANGER_RATIO * 100}%` },
    },
    {
      id: 'science', icon: '🔬', value: state.science, max: CONFIG.scienceGoal, tone: scienceDone ? 'goal' : 'science', trendSign: 1,
      status: scienceDone ? t('briefing.meters.science_done') : t('briefing.meters.science_goal', { n: CONFIG.scienceGoal }),
    },
  ];

  return (
    <section className="meters" lang={locale} aria-label={t('briefing.meters.title')}>
      <div className="meters__header">
        <span className="chip chip--pixel meters__phase" data-phase={phase.id}>
          <span className="chip__icon" aria-hidden="true">{phase.icon}</span>
          {t(phase.labelKey)}
        </span>
        <span className="meters__day">{t('briefing.meters.day_of', { n: state.day, total: CONFIG.totalDays })}</span>
      </div>
      <ul className="meters__list" role="list">
        {meters.map(({ id, ...meter }) => {
          const label = t(`common.${id}`);
          const reading = t('briefing.meters.value_of', { value: format.value(meter.value), max: format.value(meter.max) });
          return (
            <Meter
              key={id}
              id={id}
              label={label}
              valueText={meter.status ? `${reading}, ${meter.status}` : reading}
              format={format}
              {...meter}
            />
          );
        })}
      </ul>
    </section>
  );
}
