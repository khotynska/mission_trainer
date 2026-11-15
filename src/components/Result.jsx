// Власник: Dev 5 (Briefing UI).
// Екран «Що сталося» — причина й наслідок без сюрпризів:
//   • Ліра реагує одним реченням на твій вибір;
//   • рядок «Твій вибір»: рівно ті зміни, що були на кнопці;
//   • рядок «Щодня»: екіпаж поїв (🫁 −5), космічний фон (☢️ +1), сонячні панелі вдень (⚡ +2);
//   • «Цікавий факт» про космос після кожного рівня.
// Добре рішення — звук, конфеті й радісна Ліра; погане — тривожна Ліра й «Переграти день».
//
// Пропси за контрактом (src/game/contracts.js, розд. 4 і 6): { state, dispatch, t }.
import { useEffect, useMemo, useRef } from 'react';
import { ACTIONS } from '../game/contracts.js';
import facts from '../data/facts.json';
import BaseScene from './BaseScene.jsx';
import Lira from './Lira.jsx';
import Confetti from './Confetti.jsx';
import { reactionText } from './levelText.js';
import { play } from './sfx.js';
import '../styles/result.css';

const LOCALES = Object.freeze({ ua: 'uk-UA', en: 'en-US' });
/** Порядок і «добрий напрям» кожної зміни: +1 — зростання добре, −1 — зростання погано (радіація). */
const ROWS = Object.freeze([
  { id: 'dose', icon: '☢️', polarity: -1 },
  { id: 'life', icon: '🫁', polarity: 1 },
  { id: 'mood', icon: '😊', polarity: 1 },
  { id: 'battery', icon: '⚡', polarity: 1 },
  { id: 'science', icon: '🔬', polarity: 1 },
  { id: 'wall', icon: '🧱', polarity: 1 },
]);

const trendOf = (v, polarity) => (Math.sign(v * polarity) > 0 ? 'good' : Math.sign(v * polarity) < 0 ? 'bad' : 'neutral');

/** Звук і реакція — один раз на результат (StrictMode у dev викликає ефекти двічі). */
const celebrated = new WeakSet();

function DeltaChips({ deltas, fmt, labels = {} }) {
  const items = ROWS.filter((r) => deltas[r.id]);
  return items.map((r, i) => (
    <span key={r.id} className="delta-chip" data-trend={trendOf(deltas[r.id], r.polarity)} style={{ '--i': i }}>
      <span aria-hidden="true">{r.icon}</span> {fmt.signed(deltas[r.id])}
      {labels[r.id] && <small> {labels[r.id]}</small>}
    </span>
  ));
}

export default function Result({ state, dispatch, t }) {
  const r = state.result;
  const b = state.briefing;
  const locale = LOCALES[state.lang] ?? LOCALES.ua;
  const headingRef = useRef(null);

  const fmt = useMemo(() => {
    const signed = new Intl.NumberFormat(locale, { maximumFractionDigits: 1, signDisplay: 'exceptZero' });
    return { signed: (n) => signed.format(n) };
  }, [locale]);

  const mood = r?.mood ?? 'happy';

  useEffect(() => {
    window.scrollTo({ top: 0 });
    headingRef.current?.focus({ preventScroll: true });
    if (r && !celebrated.has(r)) {
      celebrated.add(r);
      play(mood === 'happy' ? 'good' : 'bad');
    }
  }, [r, mood]);

  if (!r || !b) return null;

  const choice = r.choice ?? { id: '', kind: 'chore', chore: false, timedOut: false };
  const reaction = reactionText(t, b, choice);
  const sheltered = (b.level?.options?.[choice.option]?.shelter ?? false);
  const daily = r.dailyDeltas ?? {};
  const night = b.phase === 'night';
  const dailyLabels = {
    life: r.cold ? t('result.daily_cold') : t('result.daily_life'),
    dose: t('result.daily_dose'),
    battery: t('result.daily_sun'),
  };
  const fact = facts.find((f) => f.id === b.day) ?? facts[(b.day - 1) % facts.length];
  const canRetry = mood === 'worried' && Boolean(state.daySnapshot);
  const choiceHasChanges = ROWS.some((row) => r.choiceDeltas?.[row.id]);

  return (
    <section className="screen outcome" lang={locale} data-mood={mood} aria-labelledby="outcome-title">
      <h2 id="outcome-title" ref={headingRef} tabIndex={-1} className="visually-hidden">{t('result.title')}</h2>
      {mood === 'happy' && <Confetti burst={state.day} />}

      <BaseScene
        phase={b.phase}
        event={b.event?.type ?? 'QUIET'}
        crew={sheltered ? 'shelter' : 'work'}
        effect={b.level?.kind === 'chore' ? 'none' : 'strike'}
        label={t('briefing.scene.label', { state: t(`briefing.scene.${sheltered ? 'shelter' : 'work'}`) })}
      />

      <Lira mood={mood} text={reaction} t={t} />

      <div className="cause-rows">
        <p className="cause-row">
          <span className="cause-row__label">{t('result.your_choice')}</span>
          {choiceHasChanges ? <DeltaChips deltas={r.choiceDeltas} fmt={fmt} /> : <span className="muted">{t('result.nothing')}</span>}
        </p>
        <p className="cause-row cause-row--daily">
          <span className="cause-row__label">📅 {t('result.daily')}</span>
          <DeltaChips deltas={daily} fmt={fmt} labels={dailyLabels} />
          {night && !daily.battery && <span className="delta-chip" data-trend="neutral">⚡ 0 <small>{t('result.daily_night')}</small></span>}
        </p>
      </div>

      {typeof r.launchReady === 'boolean' && (
        <p className={`chip ${r.launchReady ? 'chip--ok' : 'chip--danger'} outcome__rocket`}>
          {t(r.launchReady ? 'result.launch.ready' : 'result.launch.not_ready')}
        </p>
      )}

      {fact && (
        <aside className="fun-fact" aria-label={t('result.fact_title')}>
          <span className="fun-fact__emoji" aria-hidden="true">{fact.emoji}</span>
          <div>
            <p className="fun-fact__title">🤓 {t('result.fact_title')}</p>
            <p className="fun-fact__text">{t(`facts.${fact.id}`)}</p>
          </div>
        </aside>
      )}

      <div className="screen__actions outcome__actions">
        {canRetry && (
          <button type="button" className="btn btn--secondary" onClick={() => dispatch({ type: ACTIONS.RETRY_DAY })}>
            <span aria-hidden="true">🔁</span> {t('result.retry')}
          </button>
        )}
        <button type="button" className="btn btn--lg" onClick={() => dispatch({ type: ACTIONS.NEXT })}>
          {t('common.next')} <span aria-hidden="true">▶</span>
        </button>
      </div>
    </section>
  );
}
