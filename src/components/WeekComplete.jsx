// Власник: Dev 6 (Progress UI). Пропси за контрактом: { state, dispatch, t } (src/game/contracts.js).
// Кінець тижня: велика нашивка «стрибає», конфеті, мета тижня одним рядком з іконками.
import { useEffect, useState } from 'react';
import { ACTIONS } from '../game/contracts.js';
import PatchBadge from './PatchBadge.jsx';
import Confetti from './Confetti.jsx';
import { PATCH_BY_WEEK } from './patches.js';
import { addPatch, saveWeekResult, getBestWeek } from '../game/storage';
import { play } from './sfx.js';
import '../styles/progress.css';

const round1 = (n) => Math.round(n * 10) / 10;

// Читає state.lastWeekResult = { week, passed, patch }.
// Приріст дози за тиждень: state.dose − state.weekSnapshot.dose (знімок початку тижня ще не перезаписано).
export default function WeekComplete({ state, dispatch, t }) {
  const r = state.lastWeekResult || { week: 1, passed: false, patch: null };
  const patch = r.patch || PATCH_BY_WEEK[r.week];
  const doseGain = typeof r.doseGain === 'number'
    ? round1(r.doseGain)
    : state.weekSnapshot ? round1(state.dose - state.weekSnapshot.dose) : null;

  // Рекорд читаємо ДО збереження (лінива ініціалізація) — тоді подвійний ефект StrictMode
  // не перетворює «новий рекорд» на «найкращий результат: +N».
  const [previousBest] = useState(() => getBestWeek(r.week));
  const isNewBest = doseGain !== null && (previousBest === null || doseGain < previousBest);

  useEffect(() => {
    if (r.passed && patch) addPatch(patch);
    if (doseGain !== null) saveWeekResult(r.week, doseGain); // зберігає лише кращий результат
    play(r.passed ? 'badge' : 'select');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="screen week" data-passed={r.passed || undefined} aria-labelledby="week-title">
      {r.passed && <Confetti burst={r.week} />}
      <h2 id="week-title" className="week__title">{t('progress.week.title', { week: r.week })}</h2>

      <div className="week__badge">
        <PatchBadge id={patch} size={112} earned={r.passed} label={t('progress.patch.' + patch)} />
      </div>
      <p className="week__name">{t('progress.patch.' + patch)}</p>
      <p className="week__line">{r.passed ? t('progress.week.earned') : t('progress.week.notEarned')}</p>

      <p className="week__chips">
        <span className="chip">🎯 {t('progress.badge.how.' + patch)}</span>
        {doseGain !== null && (
          <span className={`chip ${isNewBest ? 'chip--ok' : ''}`}>
            ☢️ +{doseGain} · {isNewBest ? t('progress.week.newBest') : t('progress.week.best', { dose: round1(previousBest) })}
          </span>
        )}
      </p>

      <div className="screen__actions week__actions">
        <button type="button" className="btn btn--lg" onClick={() => dispatch({ type: ACTIONS.NEXT })}>
          {t('progress.week.next')} <span aria-hidden="true">▶</span>
        </button>
      </div>
    </section>
  );
}
