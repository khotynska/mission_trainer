// Власник: Dev 4. Рівень дня: одне коротке питання й дві великі кнопки.
// На кожній кнопці — що саме зміниться (☢️ +3 · 😊 −5 …): гравець отримає рівно ці числа.
// Спокійний день: обираєш справу на базі, а потім робиш маленьке завдання (TapTask).
// День із бурею: таймер (можна вимкнути 🐢). Без зв'язку радіацію не видно («☢️ ?»).
// Пропси за контрактом: { state, dispatch, t } (+ embedded — коли рівень усередині брифінгу).
import { useEffect, useMemo, useRef, useState } from 'react';
import { ACTIONS } from '../game/contracts.js';
import Timer from './Timer.jsx';
import Lira from './Lira.jsx';
import TapTask from './TapTask.jsx';
import { play, buzz } from './sfx.js';
import { levelText, optionLabel } from './levelText.js';
import '../styles/dilemma.css';

const LOCALES = Object.freeze({ ua: 'uk-UA', en: 'en-US' });
/** Підказка Ліри світиться на розумнішій кнопці перші дні, поки дитина вчиться. */
const HINT_UNTIL_DAY = 10;
/** Коротка мить, щоб побачити натиск кнопки; далі — одразу результат. */
const PICK_DELAY_MS = 120;

/** Іконки-наслідки варіанта: рівно ті числа, які отримає гравець. */
function chipsOf(o) {
  const fx = o.fx;
  const c = [];
  if (fx.dose) c.push({ key: 'dose', icon: '☢️', value: fx.dose, tone: fx.dose >= 8 ? 'bad' : fx.dose >= 3 ? 'warn' : 'good' });
  if (fx.life) c.push({ key: 'life', icon: '🫁', value: fx.life, tone: fx.life > 0 ? 'good' : 'bad' });
  if (fx.mood) c.push({ key: 'mood', icon: '😊', value: fx.mood, tone: fx.mood > 0 ? 'good' : 'bad' });
  if (fx.battery) c.push({ key: 'battery', icon: '⚡', value: fx.battery, tone: fx.battery > 0 ? 'good' : 'neutral' });
  if (fx.science) c.push({ key: 'science', icon: '🔬', value: fx.science, tone: 'good' });
  if (fx.wall) c.push({ key: 'wall', icon: '🧱', text: `+${fx.wall}`, tone: 'good' });
  if (o.launch) c.push({ key: 'rocket', icon: '🚀', text: '✓', tone: 'good' });
  return c;
}

export default function Decision({ state, dispatch, t, embedded = false }) {
  const b = state.briefing;
  const lv = b?.level;
  const locale = LOCALES[state.lang] ?? LOCALES.ua;
  const [picked, setPicked] = useState(null);
  const [task, setTask] = useState(null);
  const startedAt = useRef(0);
  const pending = useRef(null);

  const fmt = useMemo(() => new Intl.NumberFormat(locale, { maximumFractionDigits: 1, signDisplay: 'exceptZero' }), [locale]);

  useEffect(() => {
    startedAt.current = performance.now();
    return () => clearTimeout(pending.current);
  }, []);

  if (!lv || !lv.options?.length) return null;

  const seconds = state.timerOn ? lv.seconds : 0;
  const showHint = b.day <= HINT_UNTIL_DAY && lv.best >= 0 && picked === null;
  const hideDose = b.comms === false && lv.kind !== 'chore';

  const send = (option, timedOut = false) => {
    const ms = performance.now() - startedAt.current;
    dispatch({ type: ACTIONS.CHOOSE, option, ms, timedOut });
  };

  const choose = (option, viaTimeout = false) => {
    if (picked !== null) return;
    const o = lv.options[option];
    if (!o?.affordable) return;
    setPicked(option);
    buzz();
    if (viaTimeout) {
      play('bad');
      send(option, true);
      return;
    }
    play('select');
    if (o.chore && o.targets?.length) {
      setTask(option); // спершу маленьке завдання
      return;
    }
    pending.current = setTimeout(() => send(option), PICK_DELAY_MS);
  };

  if (task !== null) {
    const o = lv.options[task];
    return (
      <TapTask
        key={o.id}
        icon={o.icon}
        title={t(`levels.chore.${o.id}.task`)}
        targets={o.targets}
        t={t}
        onDone={() => send(task)}
      />
    );
  }

  const body = (
    <div className="dilemma" data-kind={lv.kind} data-picked={picked ?? undefined}>
      <p className="dilemma__q">{levelText(t, b)}</p>
      <div className="dilemma__options" data-tour="choices">
        {lv.options.map((o, i) => {
          const chips = chipsOf(o);
          const label = optionLabel(t, b, o);
          const chipText = (c) => (c.key === 'dose' && hideDose ? '?' : c.text ?? fmt.format(c.value));
          const aria = `${label}: ${chips.map((c) => `${t(`decision.preview.${c.key}`)} ${chipText(c)}`).join(', ')}${o.affordable ? '' : `, ${t('decision.no_energy')}`}`;
          return (
            <button
              key={o.id}
              type="button"
              className="choice"
              data-sfx="none"
              data-hint={(showHint && lv.best === i) || undefined}
              data-state={picked === null ? undefined : picked === i ? 'picked' : 'dropped'}
              disabled={picked !== null || !o.affordable}
              aria-label={aria}
              onClick={() => choose(i)}
            >
              <span className="choice__icon" aria-hidden="true">{o.icon}</span>
              <span className="choice__label">{label}</span>
              <span className="choice__chips" aria-hidden="true">
                {chips.map((c) => (
                  <span key={c.key} className="choice__chip" data-tone={c.key === 'dose' && hideDose ? 'unknown' : c.tone}>
                    {c.icon} {chipText(c)}
                  </span>
                ))}
              </span>
              {o.notes?.includes('wall') && <span className="choice__note">{t('decision.note_wall')}</span>}
              {o.notes?.includes('sad') && <span className="choice__note">{t('decision.note_sad')}</span>}
              {!o.affordable && <span className="choice__note choice__note--bad">{t('decision.no_energy')}</span>}
              {showHint && lv.best === i && <span className="choice__hint" aria-hidden="true">💡</span>}
            </button>
          );
        })}
      </div>
      {seconds > 0 && picked === null && (
        <Timer key={`${b.day}-${seconds}`} seconds={seconds} paused={state.tutorial} onTimeout={() => choose(lv.timeout, true)} t={t} />
      )}
      {lv.seconds > 0 && picked === null && (
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

  // Окремий екран 'decision' (напр. ?screen=decision): Ліра + рівень.
  return (
    <section className="screen day" lang={locale}>
      <Lira mood={b.comms ? 'alert' : 'offline'} text={t(`days.${b.textKey}.text`)} t={t} tour="lira" />
      {body}
    </section>
  );
}
