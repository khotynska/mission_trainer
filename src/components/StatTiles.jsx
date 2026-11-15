// Плитки стану бази: ⚡ енергія · 🫁 їжа й повітря · 😊 настрій · ☢️ радіація · 🔬 наука.
// Однаковий вигляд і на панелі гри (Meters), і на «Зоряному шляху» (MissionMap).
// Після зміни над плиткою вистрибує «+N / −N».
import { useId, useMemo, useState } from 'react';
import { CONFIG } from '../game/config.js';

const LOCALES = Object.freeze({ ua: 'uk-UA', en: 'en-US' });
const DOSE_WARN_RATIO = 0.4;
const LOW = 0.3; // нижче 30 % — шкала жовтіє й блимає

const clampRatio = (value, max) => (max > 0 && Number.isFinite(value) ? Math.min(1, Math.max(0, value / max)) : 0);

function doseTone(dose) {
  if (dose >= CONFIG.goldDoseMax) return 'danger';
  if (dose >= CONFIG.doseLimit * DOSE_WARN_RATIO) return 'warn';
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

function Tile({ id, icon, label, value, max, tone, trendSign, alert, valueText, format }) {
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

/** @param {{ state: object, t: Function, layout?: 'row' | 'grid' }} props */
export default function StatTiles({ state, t, layout = 'row' }) {
  const locale = LOCALES[state.lang] ?? LOCALES.ua;
  const format = useMemo(() => {
    const plain = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
    const signed = new Intl.NumberFormat(locale, { maximumFractionDigits: 1, signDisplay: 'exceptZero' });
    return { value: (n) => plain.format(n), delta: (n) => signed.format(n) };
  }, [locale]);

  const dTone = doseTone(state.dose);
  const scienceDone = state.science >= CONFIG.scienceGoal;
  const low = (v, max) => v / max < LOW;
  const tiles = [
    { id: 'battery', icon: '⚡', value: state.battery, max: CONFIG.batteryMax, tone: low(state.battery, CONFIG.batteryMax) ? 'warn' : 'battery', trendSign: 1, alert: state.battery === 0 },
    { id: 'life', icon: '🫁', value: state.life, max: CONFIG.lifeMax, tone: low(state.life, CONFIG.lifeMax) ? 'warn' : 'life', trendSign: 1, alert: low(state.life, CONFIG.lifeMax) },
    { id: 'mood', icon: state.mood < CONFIG.sadMood ? '😔' : '😊', value: state.mood ?? CONFIG.startMood, max: CONFIG.moodMax, tone: low(state.mood ?? 100, CONFIG.moodMax) ? 'warn' : 'mood', trendSign: 1, alert: state.mood < CONFIG.sadMood },
    { id: 'dose', icon: '☢️', value: state.dose, max: CONFIG.doseLimit, tone: dTone, trendSign: -1, alert: dTone === 'danger' },
    { id: 'science', icon: scienceDone ? '🏆' : '🔬', value: state.science, max: CONFIG.scienceGoal, tone: scienceDone ? 'goal' : 'science', trendSign: 1 },
  ];

  return (
    <ul className="meters__list" data-layout={layout} role="list">
      {tiles.map(({ id, ...tile }) => {
        const reading = t('briefing.meters.value_of', { value: format.value(tile.value), max: format.value(tile.max) });
        return (
          <Tile
            key={id}
            id={id}
            label={t(`briefing.meters.short.${id}`)}
            valueText={`${t(`common.${id}`)}: ${reading}`}
            format={format}
            {...tile}
          />
        );
      })}
    </ul>
  );
}
