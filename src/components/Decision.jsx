// Власник: Dev 4. Дилема дня: одне коротке питання, дві великі кнопки й таймер.
// Напр. «☢️ Радіаційна буря — за 1 год!» → [🛡️ Бігти в укриття] [🔬 Закінчити дослід].
// Іконки на кнопках показують, що буде (☢️ +2,6 · 🔬 +20). Без зв'язку — лише «❓».
// Пропси за контрактом: { state, dispatch, t } (+ embedded — коли дилема всередині брифінгу).
import { useEffect, useMemo, useRef, useState } from 'react';
import { ACTIONS } from '../game/contracts.js';
import Timer from './Timer.jsx';
import Lira from './Lira.jsx';
import { play, buzz } from './sfx.js';
import '../styles/dilemma.css';

const LOCALES = Object.freeze({ ua: 'uk-UA', en: 'en-US' });
/** Підказка Ліри світиться на розумнішій кнопці перші дні, поки дитина вчиться. */
const HINT_UNTIL_DAY = 10;
/** Коротка мить, щоб побачити натиск кнопки; далі — одразу результат (без зайвого чекання). */
const PICK_DELAY_MS = 120;
/** «Час вийшов» показує вже екран результату, тож тут не чекаємо. */
const TIMEOUT_DELAY_MS = 0;

/** Іконки-наслідки варіанта. */
function previewChips(p, allocation) {
  const chips = [];
  const doseTone = p.dose >= 5 ? 'bad' : p.dose >= 2 ? 'warn' : 'good';
  chips.push({ key: 'dose', icon: '☢️', value: p.dose, sign: true, tone: doseTone });
  if (p.science > 0) chips.push({ key: 'science', icon: '🔬', value: p.science, sign: true, tone: 'good' });
  if (p.life !== 0) chips.push({ key: 'life', icon: '🫁', value: p.life, sign: true, tone: p.life > 0 ? 'good' : 'bad' });
  if (allocation.launch) chips.push({ key: 'rocket', icon: '🚀', text: '✓', tone: 'good' });
  return chips;
}

function questionKey(d) {
  if (d.kind === 'storm') return `decision.q.storm.${d.event}`;
  return `decision.q.${d.kind}`;
}

export default function Decision({ state, dispatch, t, embedded = false }) {
  const b = state.briefing;
  const d = b?.dilemma;
  const locale = LOCALES[state.lang] ?? LOCALES.ua;
  const [picked, setPicked] = useState(null);
  const [timedOut, setTimedOut] = useState(false);
  const startedAt = useRef(0);
  const pending = useRef(null);

  const fmt = useMemo(() => new Intl.NumberFormat(locale, { maximumFractionDigits: 1, signDisplay: 'exceptZero' }), [locale]);

  useEffect(() => {
    startedAt.current = performance.now();
    return () => clearTimeout(pending.current);
  }, []);

  if (!d) return null;

  const seconds = state.timerOn ? d.seconds : 0;
  const showHint = b.day <= HINT_UNTIL_DAY && d.best >= 0 && picked === null;
  const comms = b.comms !== false;

  const choose = (option, viaTimeout = false) => {
    if (picked !== null) return;
    setPicked(option);
    if (viaTimeout) {
      setTimedOut(true);
      play('bad');
    } else {
      play('select');
    }
    buzz();
    const ms = performance.now() - startedAt.current;
    pending.current = setTimeout(
      () => dispatch({ type: ACTIONS.CHOOSE, option, ms, timedOut: viaTimeout }),
      viaTimeout ? TIMEOUT_DELAY_MS : PICK_DELAY_MS,
    );
  };

  const question = t(questionKey(d), { h: d.leadHours });

  const body = (
    <div className="dilemma" data-kind={d.kind} data-picked={picked ?? undefined}>
      <p className="dilemma__q">{question}</p>
      <div className="dilemma__options" data-tour="choices">
        {d.options.map((o, i) => {
          const chips = previewChips(o.preview, o.allocation);
          const label = t(`decision.option.${o.id}`);
          const aria = comms
            ? `${label}: ${chips.map((c) => `${t(`decision.preview.${c.key}`)} ${c.text ?? fmt.format(c.value)}`).join(', ')}`
            : `${label}: ${t('decision.preview.unknown')}`;
          return (
            <button
              key={o.id}
              type="button"
              className="choice"
              data-sfx="none"
              data-safe={d.best === i || undefined}
              data-hint={(showHint && d.best === i) || undefined}
              data-state={picked === null ? undefined : picked === i ? 'picked' : 'dropped'}
              disabled={picked !== null}
              aria-label={aria}
              onClick={() => choose(i)}
            >
              <span className="choice__icon" aria-hidden="true">{o.icon}</span>
              <span className="choice__label">{label}</span>
              <span className="choice__chips" aria-hidden="true">
                {comms
                  ? chips.map((c) => (
                    <span key={c.key} className="choice__chip" data-tone={c.tone}>
                      {c.icon} {c.text ?? fmt.format(c.value)}
                    </span>
                  ))
                  : <span className="choice__chip" data-tone="unknown">❓ {t('decision.preview.no_signal')}</span>}
              </span>
              {showHint && d.best === i && <span className="choice__hint" aria-hidden="true">💡</span>}
            </button>
          );
        })}
      </div>
      {seconds > 0 && picked === null && (
        <Timer key={`${b.day}-${seconds}`} seconds={seconds} paused={state.tutorial} onTimeout={() => choose(d.timeoutOption, true)} t={t} />
      )}
      {timedOut && <p className="dilemma__timeout" role="alert">{t('decision.timeout')}</p>}
      {d.seconds > 0 && picked === null && (
        <button
          type="button"
          className="dilemma__timer-toggle"
          aria-pressed={!state.timerOn}
          onClick={() => dispatch({ type: ACTIONS.TOGGLE_TIMER })}
        >
          {t(state.timerOn ? 'decision.timer_off' : 'decision.timer_on')}
        </button>
      )}
    </div>
  );

  if (embedded) return body;

  // Окремий екран 'decision' (напр. ?screen=decision): Ліра + дилема.
  const dayText = t(`days.${b.textKey}.text`);
  return (
    <section className="screen day" lang={locale}>
      <Lira mood={comms ? 'alert' : 'offline'} text={dayText} t={t} tour="lira" />
      {body}
    </section>
  );
}
