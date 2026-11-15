// Власник: Dev 6 (Progress UI). Евакуація — не кінець місії: можна переграти будь-який зіграний день.
// Причина — state.endReason ('dose' | 'life'); дні — state.history (див. reducer).
import { useEffect, useMemo } from 'react';
import { ACTIONS } from '../game/contracts.js';
import Lira from './Lira.jsx';
import { play } from './sfx.js';
import '../styles/progress.css';

const EVENT_ICON = Object.freeze({ QUIET: '☀️', M: '💥', X: '💥', X5: '💥', CME: '🌊', EXTREME: '🌪️', SEP: '🌠' });
const LOCALES = Object.freeze({ ua: 'uk-UA', en: 'en-US' });
const SHOW_DAYS = 6;

export default function Evacuation({ state, dispatch, t }) {
  const reason = state.endReason === 'life' ? 'life' : 'dose';
  const history = (state.history || []).slice(-SHOW_DAYS);
  const key = reason === 'dose' ? 'doseGain' : null;
  const worst = key && history.length ? history.reduce((a, h) => (h[key] > a[key] ? h : a), history[0]).day : null;
  const fmt = useMemo(
    () => new Intl.NumberFormat(LOCALES[state.lang] ?? LOCALES.ua, { maximumFractionDigits: 1, signDisplay: 'always' }),
    [state.lang],
  );

  useEffect(() => {
    play('bad');
  }, []);

  return (
    <section className="screen evac" aria-labelledby="evac-title">
      <div className="evac__art" aria-hidden="true">🚀💨</div>
      <h2 id="evac-title">{t('progress.evac.title')}</h2>
      <Lira mood="worried" text={t(reason === 'dose' ? 'progress.evac.reasonDose' : 'progress.evac.reasonLife')} t={t} />

      {history.length > 0 && (
        <>
          <p className="evac__pick">{t('progress.evac.pick')}</p>
          <ul className="evac__days" role="list">
            {history.map((h) => (
              <li key={h.day}>
                <button
                  type="button"
                  className="evac__day"
                  data-worst={h.day === worst || undefined}
                  onClick={() => dispatch({ type: ACTIONS.RETRY_DAY, day: h.day })}
                >
                  <span className="evac__day-n">{t('common.day', { n: h.day })}</span>
                  <span className="evac__day-icon" aria-hidden="true">{EVENT_ICON[h.event] ?? '☀️'}</span>
                  <span className="evac__day-dose">☢️ {fmt.format(h.doseGain)}</span>
                  {h.day === worst && <span className="evac__worst">😬 {t('progress.evac.worst')}</span>}
                  <span className="evac__replay" aria-hidden="true">🔁</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="screen__actions evac__actions">
        {state.weekSnapshot && (
          <button type="button" className="btn btn--secondary" onClick={() => dispatch({ type: ACTIONS.RESTART_WEEK })}>
            <span aria-hidden="true">⏮</span> {t('progress.evac.restart')}
          </button>
        )}
      </div>
      <p className="muted evac__safe">{t('progress.evac.patchesSafe')}</p>
    </section>
  );
}
