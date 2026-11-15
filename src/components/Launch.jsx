// Власник: Dev 6. День 30: остання дилема — злетіти зараз чи почекати, поки стихне буря.
// Пропси за контрактом: state, dispatch, t (див. src/game/contracts.js, розділ ВІДЛІТ).
import { useRef, useState, useEffect } from 'react';
import { ACTIONS } from '../game/contracts.js';
import { CONFIG } from '../game/config.js';
import Lira from './Lira.jsx';
import { play, buzz } from './sfx.js';
import '../styles/dilemma.css';
import '../styles/progress.css';

const OPTIONS = [
  { id: 'now', icon: '🚀', chips: [{ icon: '☢️', text: `+${CONFIG.launchNowDose}`, tone: 'warn' }] },
  { id: 'wait', icon: '⏳', chips: [{ icon: '🫁', text: `−${CONFIG.launchWaitLife}`, tone: 'bad' }, { icon: '☢️', text: `+${CONFIG.background}`, tone: 'good' }] },
];

export default function Launch({ state, dispatch, t }) {
  const [picked, setPicked] = useState(null);
  const pending = useRef(null);
  useEffect(() => () => clearTimeout(pending.current), []);

  const choose = (id) => {
    if (picked) return;
    setPicked(id);
    play(id === 'now' ? 'launch' : 'select');
    buzz(40);
    // Лише коротка мить на старт ракети — без зайвого чекання
    pending.current = setTimeout(() => dispatch({ type: ACTIONS.LAUNCH_CHOICE, choice: id }), id === 'now' ? 500 : 0);
  };

  return (
    <section className="screen launch" data-picked={picked || undefined} aria-labelledby="launch-title">
      <div className="launch__pad" aria-hidden="true">
        <span className="launch__rocket">🚀</span>
        <span className="launch__smoke">💨</span>
      </div>
      <h2 id="launch-title" className="launch__title">{t('progress.launch.title')}</h2>
      <Lira mood="happy" text={t('progress.launch.lira', { life: state.life, dose: Math.round(state.dose) })} t={t} />
      <div className="dilemma__options">
        {OPTIONS.map((o) => (
          <button
            key={o.id}
            type="button"
            className="choice"
            data-sfx="none"
            data-state={picked === null ? undefined : picked === o.id ? 'picked' : 'dropped'}
            disabled={picked !== null}
            onClick={() => choose(o.id)}
          >
            <span className="choice__icon" aria-hidden="true">{o.icon}</span>
            <span className="choice__label">{t(`progress.launch.${o.id}`)}</span>
            <span className="choice__chips">
              {o.chips.map((c) => <span key={c.icon} className="choice__chip" data-tone={c.tone}>{c.icon} {c.text}</span>)}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
