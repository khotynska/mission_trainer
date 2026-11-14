// Власник: Dev 5 (Briefing UI).
// Екран «Брифінг ЦУП»: робот «Ліра» і текст дня, енергія на сьогодні, картка події з рівнем небезпеки,
// прогноз CME, стан «немає зв'язку» (перешкоди), підпис-джерело NASA DONKI (дата + ID) для суддів.
//
// Пропси за контрактом (src/game/contracts.js, розд. 3 і 6): { state, dispatch, t }.
// Тексти: briefing.* (UI), days.<textKey>.text (Content), common.day.
import { useEffect, useId, useMemo, useRef } from 'react';
import { ACTIONS } from '../game/contracts.js';
import { CONFIG } from '../game/config.js';
import '../styles/briefing.css';

const LOCALES = Object.freeze({ ua: 'uk-UA', en: 'en-US' });
const DONKI_URL = 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/';

/**
 * Вигляд подій DONKI. danger: 0 (спокійно) … DANGER_MAX.
 * Порядок небезпеки справжній: фон < спалах < CME < радіаційна буря.
 */
const EVENT_META = Object.freeze({
  QUIET: { icon: '☀️', danger: 0 },
  M: { icon: '💥', danger: 1 },
  X: { icon: '💥💥', danger: 2, wide: true },
  X5: { icon: '💥💥', danger: 3, wide: true },
  CME: { icon: '🌊', danger: 3 },
  EXTREME: { icon: '🌪️', danger: 4 },
  SEP: { icon: '☢️', danger: 4 },
});
const DANGER_MAX = 4;
/** Спалахи: у заголовку клас із event.detail; якщо його немає — загальна назва класу. */
const FLARE_FALLBACK_CLASS = Object.freeze({ M: 'M', X: 'X', X5: 'X5+' });

/** t() повертає сам ключ, якщо перекладу немає → null, щоб показати запасний текст. */
const reportedMissing = new Set();
function translateOptional(t, key, params) {
  const text = t(key, params);
  if (text !== key) return text;
  // У dev попереджаємо один раз на ключ, щоб забутий переклад було видно в консолі.
  if (import.meta.env.DEV && !reportedMissing.has(key)) {
    reportedMissing.add(key);
    console.warn(`[Briefing] Немає перекладу: ${key}`);
  }
  return null;
}

/** Унікальні дні прибуття CME, від найближчого. Інші типи контракт поки не передбачає. */
function getCmeArrivals(warnings) {
  const days = (warnings ?? [])
    .filter((w) => w?.type === 'CME' && Number.isInteger(w.inDays) && w.inDays > 0)
    .map((w) => w.inDays);
  return [...new Set(days)].sort((a, b) => a - b);
}

/** Піксельний прямокутник у сітці 24×24 (аватар Ліри). */
const Px = ({ x, y, w = 1, h = 1, className }) => <rect className={className} x={x} y={y} width={w} height={h} />;

/** Оригінальний піксельний аватар робота «Ліра» (сітка 24×24, кольори — з CSS-токенів). */
function LiraAvatar({ offline, label }) {
  return (
    <svg className="lira-avatar" viewBox="0 0 24 24" shapeRendering="crispEdges" role="img" aria-label={label}>
      {offline ? (
        <g className="lira-avatar__offline">
          <Px x={17} y={0} /><Px x={19} y={0} /><Px x={18} y={1} /><Px x={17} y={2} /><Px x={19} y={2} />
        </g>
      ) : (
        <g className="lira-avatar__signal">
          <Px x={7} y={0} /><Px x={6} y={1} h={2} /><Px x={7} y={3} />
          <Px x={16} y={0} /><Px x={17} y={1} h={2} /><Px x={16} y={3} />
        </g>
      )}
      <Px className="lira-avatar__beacon" x={10} y={0} w={4} h={3} />
      <Px className="lira-avatar__antenna" x={11} y={3} w={2} h={3} />
      <Px className="lira-avatar__ear" x={2} y={9} w={2} h={5} />
      <Px className="lira-avatar__ear" x={20} y={9} w={2} h={5} />
      <Px className="lira-avatar__shell" x={5} y={6} w={14} h={11} />
      <Px className="lira-avatar__shell" x={4} y={7} w={16} h={9} />
      <Px className="lira-avatar__shine" x={6} y={7} w={2} h={1} />
      <Px className="lira-avatar__visor" x={7} y={8} w={10} h={6} />
      <Px className="lira-avatar__visor" x={6} y={9} w={12} h={4} />
      {offline ? (
        <g className="lira-avatar__face">
          <Px x={8} y={10} w={2} /><Px x={14} y={10} w={2} /><Px x={10} y={12} w={4} />
        </g>
      ) : (
        <>
          <Px className="lira-avatar__eye" x={8} y={9} w={2} h={2} />
          <Px className="lira-avatar__eye" x={14} y={9} w={2} h={2} />
          <g className="lira-avatar__face">
            <Px x={9} y={11} /><Px x={14} y={11} /><Px x={10} y={12} w={4} />
          </g>
        </>
      )}
      <Px className="lira-avatar__shade" x={10} y={17} w={4} h={2} />
      <Px className="lira-avatar__shell" x={6} y={19} w={12} h={5} />
      <Px className="lira-avatar__shell" x={5} y={20} w={14} h={4} />
      <Px className="lira-avatar__core" x={11} y={21} w={2} h={2} />
    </svg>
  );
}

export default function Briefing({ state, dispatch, t }) {
  const b = state.briefing;
  const uid = useId();
  const ids = { title: `${uid}-title`, event: `${uid}-event`, forecast: `${uid}-forecast` };
  const headingRef = useRef(null);
  const locale = LOCALES[state.lang] ?? LOCALES.ua;

  const intl = useMemo(() => {
    const date = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    return {
      plural: new Intl.PluralRules(locale),
      // Дата з days.json — календарний день (ISO), тому форматуємо в UTC без зсуву поясу.
      date: (iso) => {
        const parsed = new Date(`${iso}T00:00:00Z`);
        return Number.isNaN(parsed.getTime()) ? iso : date.format(parsed);
      },
    };
  }, [locale]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    headingRef.current?.focus({ preventScroll: true });
  }, [b?.day]);

  if (!b) return null;

  const type = b.event?.type;
  const meta = EVENT_META[type] ?? EVENT_META.QUIET;
  const detail = b.event?.detail ?? '';
  const isFlare = Object.hasOwn(FLARE_FALLBACK_CLASS, type);
  const donkiIds = b.event?.donkiIds ?? [];
  // Та сама формула, що в gameEngine.resolveDay: шкода = фон + подія (до множення на захист укриття).
  const damageWithoutShield = CONFIG.background + (CONFIG.dose[type] ?? 0);
  const income = b.tokens - state.battery;
  const dangerText = t('briefing.event.danger', { level: t(`briefing.event.danger_levels.${meta.danger}`) });
  const dayText = translateOptional(t, `days.${b.textKey}.text`) ?? t('briefing.lira.fallback');
  const cmeArrivals = b.comms ? getCmeArrivals(b.warnings) : [];
  const formattedDate = intl.date(b.date);

  const cmeWarningText = (inDays) => {
    if (inDays === 1) return t('briefing.forecast.cme_tomorrow');
    return translateOptional(t, `briefing.forecast.cme.${intl.plural.select(inDays)}`, { n: inDays })
      ?? t('briefing.forecast.cme.other', { n: inDays });
  };

  return (
    <section className="screen briefing" lang={locale} aria-labelledby={ids.title}>
      <header className="screen__header">
        <p className="eyebrow">
          {t('common.day', { n: b.day })} · <time dateTime={b.date}>{formattedDate}</time>
        </p>
        <h2 id={ids.title} ref={headingRef} tabIndex={-1}>{t('briefing.title')}</h2>
      </header>

      <div className="lira" data-comms={b.comms ? 'on' : 'off'}>
        <LiraAvatar offline={!b.comms} label={t(b.comms ? 'briefing.lira.avatar' : 'briefing.lira.avatar_offline')} />
        <div className="lira__bubble">
          <p className="lira__name">
            {t('briefing.lira.name')} <span className="lira__role">· {t('briefing.lira.role')}</span>
          </p>
          <p className="lira__text">{dayText}</p>
        </div>
      </div>

      {!b.comms && (
        <div className="callout callout--danger">
          <span className="callout__icon" aria-hidden="true">📡</span>
          <div className="callout__body">
            <p className="callout__title">{t('briefing.no_comms.title')}</p>
            <p>{t('briefing.no_comms.text')}</p>
            <p className="muted">{t('briefing.no_comms.why')}</p>
          </div>
        </div>
      )}

      <p className="briefing__tokens">
        <span className="chip">{t('briefing.tokens.today', { n: b.tokens })}</span>
        {income > 0 && (
          <span className="muted">
            {t(b.phase === 'night' ? 'briefing.tokens.income_night' : 'briefing.tokens.income_day', { n: income })}
          </span>
        )}
      </p>

      <article className="event-card" data-danger={meta.danger} aria-labelledby={ids.event}>
        <span className="event-card__icon" data-wide={meta.wide || undefined} aria-hidden="true">
          {meta.icon}
        </span>
        <div className="event-card__body">
          <p className="eyebrow">{t('briefing.event.heading')}</p>
          <h3 id={ids.event} className="event-card__title">
            {t(`briefing.event.types.${type}.title`, { detail: detail || FLARE_FALLBACK_CLASS[type] })}
          </h3>
          <p className="event-card__text">{t(`briefing.event.types.${type}.text`)}</p>
          <div className="event-card__meta">
            <span className="danger-level">
              <span className="danger-meter" aria-hidden="true">
                {Array.from({ length: DANGER_MAX }, (_, i) => (
                  <span key={i} className="danger-meter__bar" data-on={i < meta.danger || undefined} />
                ))}
              </span>
              {dangerText}
            </span>
            <span className="event-card__dose">{t('briefing.event.no_shield', { n: damageWithoutShield })}</span>
            {!isFlare && detail && <span className="chip">{t('briefing.event.also_flare', { detail })}</span>}
          </div>
        </div>
      </article>

      <section className="forecast" aria-labelledby={ids.forecast}>
        <h3 id={ids.forecast}>
          <span aria-hidden="true">🔮 </span>
          {t('briefing.forecast.heading')}
        </h3>
        {!b.comms && <p className="forecast__empty">{t('briefing.forecast.unavailable')}</p>}
        {b.comms && cmeArrivals.length === 0 && <p className="forecast__empty">{t('briefing.forecast.clear')}</p>}
        {cmeArrivals.length > 0 && (
          <ul className="forecast__list" role="list">
            {cmeArrivals.map((inDays) => (
              <li key={inDays} className="callout callout--warning">
                <span className="callout__icon" aria-hidden="true">⚠️</span>
                <p className="callout__title">{cmeWarningText(inDays)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="source-note">
        <p>
          {t('briefing.source.real_event')} · <time dateTime={b.date}>{formattedDate}</time>
        </p>
        {donkiIds.length > 0 && (
          <p className="source-note__ids">
            {t('briefing.source.ids')}:
            {donkiIds.map((id) => <code key={id}>{id}</code>)}
          </p>
        )}
        <p>
          <a href={DONKI_URL} target="_blank" rel="noopener noreferrer">
            {t('briefing.source.archive_link')} <span aria-hidden="true">↗</span>
            <span className="visually-hidden"> {t('briefing.source.new_tab')}</span>
          </a>
        </p>
      </footer>

      <div className="screen__actions">
        <button type="button" className="btn btn--lg" onClick={() => dispatch({ type: ACTIONS.OPEN_DECISION })}>
          {t('briefing.decide')}
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  );
}
