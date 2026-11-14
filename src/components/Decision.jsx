// Власник: Dev 4. Екран рішення: гравець розкладає жетони дня між трьома системами.
// Пропси за контрактом: state, dispatch, t (див. src/game/contracts.js)
import { useState } from 'react';
import { CONFIG } from '../game/config.js';
import Timer from './Timer.jsx';

// Числа беремо з config.js (власник Tech Lead). Запасні значення — якщо поля ще немає.
const SHIELD = CONFIG.shield ?? [0, 0.5, 0.75, 0.9];
const LIFE_PER = CONFIG.lifePerToken ?? 10;
const SCIENCE_PER = CONFIG.sciencePerToken ?? 5;
const BATTERY_MAX = CONFIG.batteryMax ?? 12;
const LAUNCH_TOKENS = CONFIG.launchPrepTokens ?? 4;
const MAX_SHIELD = SHIELD.length - 1; // 3 жетони — далі захист не росте
const DANGER = ['CME', 'EXTREME', 'SEP']; // події, від яких треба ховатися
const LAUNCH_DAY = 29;
const TIMER_SECONDS = 90;

const SYSTEMS = ['life', 'shield', 'science'];
const ICONS = { life: '🫁', shield: '🛡️', science: '🔬' };
const COLORS = {
  life: 'var(--ok)',
  shield: 'var(--accent)',
  science: 'var(--warning)',
  launch: 'var(--danger)',
};

// Підганяє план під сьогоднішні жетони: спершу зменшує науку, потім укриття, потім життя
function fitToTokens(plan, tokens, reserved = 0) {
  const a = {
    life: Math.max(0, plan?.life ?? 0),
    shield: Math.min(Math.max(0, plan?.shield ?? 0), MAX_SHIELD),
    science: Math.max(0, plan?.science ?? 0),
  };
  let over = a.life + a.shield + a.science + reserved - tokens;
  for (const k of ['science', 'shield', 'life']) {
    const cut = Math.min(Math.max(over, 0), a[k]);
    a[k] -= cut;
    over -= cut;
  }
  return a;
}

export default function Decision({ state, dispatch, t }) {
  const tokens = state.briefing?.tokens ?? 0;
  const day = state.briefing?.day ?? state.day;
  const isLaunchDay = day === LAUNCH_DAY;
  const eventType = state.briefing?.event?.type;

  // Стартуємо з учорашнього плану, але так, щоб він влазив у сьогоднішні жетони
  const [a, setA] = useState(() => fitToTokens(state.lastAllocation, tokens));
  const [launch, setLaunch] = useState(0); // 0 або 4 (лише день 29)
  const [timedOut, setTimedOut] = useState(false);

  const spent = a.life + a.shield + a.science + launch;
  const left = tokens - spent; // нерозподілені жетони підуть у батарею
  const burn = Math.max(0, left - BATTERY_MAX); // що не влізе в батарею, згорить
  const showDanger = DANGER.includes(eventType) && a.shield < 2;

  // Чи можна натиснути + або −
  const canAdd = (k) => !timedOut && left > 0 && (k !== 'shield' || a.shield < MAX_SHIELD);
  const canRemove = (k) => !timedOut && a[k] > 0;

  const change = (k, d) => {
    if (d > 0 && !canAdd(k)) return;
    if (d < 0 && !canRemove(k)) return;
    setA({ ...a, [k]: a[k] + d });
  };

  const toggleLaunch = () => {
    if (timedOut) return;
    if (launch > 0) setLaunch(0);
    else if (left >= LAUNCH_TOKENS) setLaunch(LAUNCH_TOKENS);
  };

  // Відправка рішення рушію (формат ALLOCATION з contracts.js)
  const submit = (plan, launchValue) => {
    const allocation = { life: plan.life, shield: plan.shield, science: plan.science };
    if (isLaunchDay) allocation.launch = launchValue;
    dispatch({ type: 'SUBMIT_ALLOCATION', allocation });
  };

  // Час вийшов: повторюємо вчорашній план (підігнаний під сьогодні) і показуємо повідомлення
  const handleTimeout = () => {
    const plan = fitToTokens(state.lastAllocation, tokens, launch);
    setA(plan);
    setTimedOut(true);
    setTimeout(() => submit(plan, launch), 1500);
  };

  // Підказка під кожною карткою: що дасть поточна кількість жетонів
  const hint = (k) => {
    if (k === 'life') return t('decision.life_hint', { n: a.life * LIFE_PER });
    if (k === 'shield') return t('decision.shield_hint', { n: Math.round(SHIELD[a.shield] * 100) });
    return t('decision.science_hint', { n: a.science * SCIENCE_PER });
  };

  // Ряд жетонів ⚡: кожен зафарбований кольором системи, куди його поклали
  const dots = [
    ...Array(a.life).fill(COLORS.life),
    ...Array(a.shield).fill(COLORS.shield),
    ...Array(a.science).fill(COLORS.science),
    ...Array(launch).fill(COLORS.launch),
    ...Array(Math.max(left, 0)).fill(null),
  ];

  return (
    <div className="screen">
      <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0 }}>{t('decision.title')}</h2>
        <button
          type="button"
          onClick={() => dispatch({ type: 'TOGGLE_TIMER' })}
          aria-pressed={state.timerOn}
          style={{
            ...styles.toggle,
            background: state.timerOn ? 'var(--accent)' : 'transparent',
          }}
        >
          {t('decision.timer_toggle')}
        </button>
      </div>

      {state.timerOn && !timedOut && (
        <Timer key={day} seconds={TIMER_SECONDS} onTimeout={handleTimeout} t={t} />
      )}

      {/* Жетони дня */}
      <div>
        <div style={styles.muted}>{t('decision.tokens_today', { n: tokens })}</div>
        <div style={styles.dots}>
          {dots.map((color, i) => (
            <span
              key={i}
              style={{
                ...styles.dot,
                background: color ?? 'transparent',
                borderColor: color ?? 'var(--moon-gray)',
              }}
            >
              ⚡
            </span>
          ))}
        </div>
      </div>

      {/* Три системи */}
      {SYSTEMS.map((k) => (
        <div key={k} style={{ ...styles.card, borderLeft: `6px solid ${COLORS[k]}` }}>
          <div style={styles.icon}>{ICONS[k]}</div>
          <div style={{ flex: 1 }}>
            <div style={styles.name}>{t(`decision.${k}`)}</div>
            <div style={styles.muted}>{hint(k)}</div>
          </div>
          <button
            type="button"
            onClick={() => change(k, -1)}
            disabled={!canRemove(k)}
            aria-label={`− ${t(`decision.${k}`)}`}
            style={{ ...styles.step, ...(canRemove(k) ? null : styles.disabled) }}
          >
            −
          </button>
          <b style={styles.count}>{a[k]}</b>
          <button
            type="button"
            onClick={() => change(k, 1)}
            disabled={!canAdd(k)}
            aria-label={`+ ${t(`decision.${k}`)}`}
            style={{ ...styles.step, ...(canAdd(k) ? null : styles.disabled) }}
          >
            +
          </button>
        </div>
      ))}

      {/* День 29: підготовка ракети */}
      {isLaunchDay && (
        <button
          type="button"
          onClick={toggleLaunch}
          aria-pressed={launch > 0}
          disabled={timedOut || (launch === 0 && left < LAUNCH_TOKENS)}
          style={{
            ...styles.card,
            ...styles.launch,
            borderLeft: `6px solid ${COLORS.launch}`,
            background: launch > 0 ? 'var(--space-panel)' : 'var(--space-dark)',
            ...(timedOut || (launch === 0 && left < LAUNCH_TOKENS) ? styles.disabled : null),
          }}
        >
          <span style={styles.name}>
            {launch > 0 ? '✅ ' : '⬜ '}
            {t('decision.launch_prep')}
          </span>
          <span style={styles.muted}>{t('decision.launch_hint')}</span>
        </button>
      )}

      {/* Підсумок і попередження */}
      <div style={styles.name}>{t('decision.tokens_left', { n: Math.min(Math.max(left, 0), BATTERY_MAX) })}</div>
      {burn > 0 && <div className="warning">{t('decision.burn', { n: burn })}</div>}
      {showDanger && <div className="danger">{t('decision.danger')}</div>}
      {timedOut && <div className="warning">{t('decision.timeout')}</div>}

      <button
        type="button"
        onClick={() => submit(a, launch)}
        disabled={timedOut || left < 0}
        style={{ ...styles.confirm, ...(timedOut ? styles.disabled : null) }}
      >
        {t('decision.confirm')}
      </button>
    </div>
  );
}

// Стилі лише цього екрана. Кольори — тільки змінні з theme.css.
const styles = {
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    background: 'var(--space-dark)',
    borderRadius: 'var(--radius)',
  },
  icon: { fontSize: 32, lineHeight: 1 },
  name: { fontWeight: 600 },
  muted: { color: 'var(--moon-gray)', fontSize: 14 },
  count: { minWidth: 28, textAlign: 'center', fontSize: 22 },
  step: { minWidth: 44, minHeight: 44, padding: 0, fontSize: 24, lineHeight: 1 },
  disabled: { opacity: 0.35, cursor: 'not-allowed' },
  dots: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  dot: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    border: '2px solid',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    transition: 'background 0.3s, border-color 0.3s',
  },
  toggle: { border: '1px solid var(--accent)', fontSize: 14, padding: '8px 12px', minHeight: 44 },
  launch: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '100%',
    color: 'var(--text)',
    textAlign: 'left',
  },
  confirm: { minHeight: 52, fontSize: 18, fontWeight: 600 },
};