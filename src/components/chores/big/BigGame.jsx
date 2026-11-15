// Обгортка великої міні-гри (як у MoonShift): вступ «Як грати / Чому це важливо / час / Почати»,
// потім сама гра на сцені 960×600. «Ривок до укриття» починається з червоної радіаційної тривоги й кнопки «БІЖИ!».
import { useState } from 'react';
import { play } from '../../sfx.js';
import '../../../styles/big-games.css';

export default function BigGame({ id, t, seconds, urgent = false, title, children }) {
  const [started, setStarted] = useState(false);
  const howTo = [1, 2, 3].map((n) => t(`games.${id}.how${n}`));

  if (!started) {
    return (
      <section className="bg-intro" data-urgent={urgent || undefined} aria-label={title}>
        {urgent ? (
          <div className="bg-alarm" role="alert">
            <span className="bg-alarm__icon" aria-hidden="true">☢️</span>
            <div>
              <p className="bg-alarm__title">{t('games.alarm.title')}</p>
              <p>{t('games.alarm.text')}</p>
            </div>
          </div>
        ) : (
          <h3 className="bg-intro__title">{title}</h3>
        )}
        <div className="bg-intro__cols">
          <div>
            <p className="bg-intro__head">{t('games.how')}</p>
            <ol className="bg-intro__list">{howTo.map((h) => <li key={h}>{h}</li>)}</ol>
          </div>
          <div>
            <p className="bg-intro__head">{t('games.why')}</p>
            <p>{t(`games.${id}.teaches`)}</p>
            <p className="chip bg-intro__time">⏱️ {t('games.seconds', { n: seconds })}</p>
          </div>
        </div>
        <button
          type="button"
          className={`btn btn--lg btn--block ${urgent ? 'btn--danger' : ''}`}
          data-sfx="none"
          autoFocus
          onClick={() => { play(urgent ? 'whoosh' : 'click'); setStarted(true); }}
        >
          <span aria-hidden="true">▶</span> {urgent ? t('games.run') : t('games.start')}
        </button>
      </section>
    );
  }

  return (
    <section className="bg-stage" aria-label={title}>
      <p className="bg-stage__title">{title}</p>
      <div className="bg-stage__box">{children}</div>
    </section>
  );
}
