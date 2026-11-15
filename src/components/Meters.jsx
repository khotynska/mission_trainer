// Власник: Dev 5 (Briefing UI).
// Панель гри — проста для дітей: день місії, кнопки 🔊 ☀️ ❓ 🗺️ 🏠 і п'ять плиток стану (StatTiles).
// Пропси за контрактом (src/game/contracts.js, розд. 2 і 6): { state, dispatch, t }.
import { CONFIG } from '../game/config.js';
import HudButtons from './HudButtons.jsx';
import StatTiles from './StatTiles.jsx';
import '../styles/meters.css';

const LOCALES = Object.freeze({ ua: 'uk-UA', en: 'en-US' });

export default function Meters({ state, dispatch, t }) {
  const locale = LOCALES[state.lang] ?? LOCALES.ua;
  const phase = state.briefing?.phase === 'night' ? 'night' : 'day';

  return (
    <section className="meters" lang={locale} aria-label={t('briefing.meters.title')}>
      <div className="meters__header">
        <span className="meters__day" data-phase={phase}>
          <span aria-hidden="true">{phase === 'night' ? '🌑' : '☀️'}</span>
          {t('briefing.meters.day_of', { n: state.day, total: CONFIG.totalDays })}
        </span>
        <HudButtons state={state} dispatch={dispatch} t={t} />
      </div>
      <StatTiles state={state} t={t} />
    </section>
  );
}
