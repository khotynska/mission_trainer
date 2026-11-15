// Власник: Dev 6 (Progress UI). Пропси за контрактом: { state, dispatch, t } (src/game/contracts.js).
// Сертифікат після всіх 30 днів: медаль рангу, ім'я, підсумки іконками, усі значки місії.
import { useEffect, useState } from 'react';
import { ACTIONS } from '../game/contracts.js';
import { CONFIG } from '../game/config.js';
import { getRank } from '../game/gameEngine';
import PatchBadge from './PatchBadge.jsx';
import Confetti from './Confetti.jsx';
import { PATCHES } from './patches.js';
import { getPlayerName, savePlayerName } from '../game/storage';
import { play } from './sfx.js';
import '../styles/progress.css';

const RANK_ICON = { bronze: '🥉', silver: '🥈', gold: '🥇' };

export default function Certificate({ state, dispatch, t }) {
  const [name, setName] = useState(getPlayerName);
  // Дата видачі фіксується один раз (рендер має бути чистим — без new Date() при кожному рендері)
  const [issuedAt] = useState(() => new Date());
  const raw = getRank(state);
  const rankId = String((raw && raw.id) || raw || 'bronze').toLowerCase();
  const patches = state.patches || [];
  const earned = PATCHES.filter((p) => patches.includes(p.id)).length;
  const lang = state.lang === 'en' ? 'en-GB' : 'uk-UA';
  const dose = new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }).format(state.dose || 0);

  useEffect(() => {
    play('badge');
  }, []);

  return (
    <main className="cert-wrap" lang={state.lang === 'en' ? 'en-US' : 'uk-UA'}>
      <Confetti burst="cert" />
      <section className="cert" data-rank={rankId} aria-labelledby="cert-title">
        <p className="cert__ribbon">Junior Astronaut</p>
        <div className="cert__medal" aria-hidden="true">{RANK_ICON[rankId] ?? '🥉'}</div>
        <h1 id="cert-title" className="cert__title">{t('progress.cert.title')}</h1>
        <p className="cert__rank">{t('progress.cert.rank_' + rankId)}</p>

        <input
          className="cert__name"
          value={name}
          maxLength={30}
          placeholder={t('progress.cert.name')}
          aria-label={t('progress.cert.name')}
          onChange={(e) => {
            setName(e.target.value);
            savePlayerName(e.target.value);
          }}
        />
        <p className="cert__text">{t('progress.cert.text')}</p>

        <ul className="cert__stats" role="list">
          <li><span aria-hidden="true">📅</span> <b>{CONFIG.totalDays}</b> <span>{t('progress.cert.days')}</span></li>
          <li><span aria-hidden="true">🔬</span> <b>{state.science}</b> <span>{t('progress.cert.science')}</span></li>
          <li><span aria-hidden="true">☢️</span> <b>{dose}</b> <span>{t('progress.cert.dose')}</span></li>
          <li><span aria-hidden="true">🏅</span> <b>{earned}/{PATCHES.length}</b> <span>{t('progress.cert.badges')}</span></li>
        </ul>

        <ul className="cert__badges" role="list" aria-label={t('progress.cert.badges')}>
          {PATCHES.map((p) => (
            <li key={p.id} data-earned={patches.includes(p.id) || undefined}>
              <PatchBadge id={p.id} size={52} earned={patches.includes(p.id)} label={t('progress.patch.' + p.id)} />
              <span className="cert__badge-name">{t('progress.patch.' + p.id)}</span>
            </li>
          ))}
        </ul>

        {rankId !== 'gold' && <p className="cert__hint">🥇 {t('progress.cert.gold_hint', { science: CONFIG.scienceGoal, dose: CONFIG.goldDoseMax })}</p>}
        <p className="cert__footer">
          {issuedAt.toLocaleDateString(lang)} · {t('progress.cert.mars')}
        </p>
      </section>

      <div className="no-print cert__actions">
        <button type="button" className="btn btn--alt" onClick={() => window.print()}>
          <span aria-hidden="true">🖨️</span> {t('progress.cert.print')}
        </button>
        <button type="button" className="btn btn--secondary" onClick={() => dispatch({ type: ACTIONS.GO, screen: 'map' })}>
          <span aria-hidden="true">🗺️</span> {t('progress.start.map')}
        </button>
        <button type="button" className="btn" onClick={() => dispatch({ type: ACTIONS.START_GAME })}>
          <span aria-hidden="true">🔁</span> {t('progress.cert.again')}
        </button>
      </div>
    </main>
  );
}
