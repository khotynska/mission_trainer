// Власник: Dev 5 (Briefing UI).
// Екран дня — одна мультяшна сцена замість довгих текстів, і жодного очікування:
// Ліра одним реченням пояснює, що сталося на Сонці, а дилема з двох кнопок (Decision, embedded)
// доступна одразу. Годинник бази лише коротко «прокручується» до години події — це прикраса,
// яка нічого не блокує (тихі години не треба чекати).
// Підпис-джерело NASA DONKI (дата + ID) — дрібно внизу, для суддів.
//
// Пропси за контрактом (src/game/contracts.js, розд. 3 і 6): { state, dispatch, t }.
import { useEffect, useMemo, useRef, useState } from 'react';
import BaseScene, { MissionClock } from './BaseScene.jsx';
import Lira from './Lira.jsx';
import Decision from './Decision.jsx';
import { play } from './sfx.js';
import '../styles/briefing.css';

const LOCALES = Object.freeze({ ua: 'uk-UA', en: 'en-US' });
const DONKI_URL = 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/';
const EVENT_ICON = Object.freeze({ QUIET: '☀️', M: '💥', X: '💥', X5: '💥', CME: '🌊', EXTREME: '🌪️', SEP: '🌠' });
/** Скільки триває декоративна прокрутка годинника (гру вона не затримує). */
const CLOCK_SPIN_MS = 700;

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const easeOut = (x) => 1 - (1 - x) ** 3;

/** Годинник швидко докручується від 00:00 до години події. Нічого не чекає й нічого не блокує. */
function useClockSpin(stopHour, dayKey) {
  const [hour, setHour] = useState(() => (reducedMotion() ? stopHour : 0));
  const raf = useRef(0);

  useEffect(() => {
    if (reducedMotion()) return undefined;
    let start = 0;
    const tick = (now) => {
      if (!start) start = now;
      const p = Math.min(1, (now - start) / CLOCK_SPIN_MS);
      setHour(stopHour * easeOut(p));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [stopHour, dayKey]);

  return hour;
}

function forecastText(t, inDays) {
  return inDays === 1 ? t('briefing.forecast.cme_tomorrow') : t('briefing.forecast.cme', { n: inDays });
}

export default function Briefing({ state, dispatch, t }) {
  const b = state.briefing;
  const locale = LOCALES[state.lang] ?? LOCALES.ua;
  const d = b?.level;
  const stopHour = b ? Math.max(0.5, Math.min(23.5, (b.eventHour ?? 12) - (d?.leadHours ?? 0))) : 0;
  const hour = useClockSpin(stopHour, b?.day);

  const date = useMemo(() => {
    if (!b) return '';
    const parsed = new Date(`${b.date}T00:00:00Z`);
    return Number.isNaN(parsed.getTime())
      ? b.date
      : new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(parsed);
  }, [b, locale]);

  // Тривожний сигнал перед бурею — одразу, разом із питанням
  const alarmed = useRef(false);
  useEffect(() => {
    if (!alarmed.current && d && d.kind !== 'chore') {
      alarmed.current = true;
      play(d.kind === 'storm' ? 'alarm' : 'select');
    }
  }, [d]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [b?.day]);

  if (!b) return null;

  const type = b.event?.type ?? 'QUIET';
  const fast = hour < stopHour * 0.8;
  const dayText = t(`days.${b.textKey}.text`);
  const cme = b.comms ? [...new Set((b.warnings ?? []).filter((w) => w.type === 'CME').map((w) => w.inDays))].sort((x, y) => x - y) : [];
  const donkiIds = b.event?.donkiIds ?? [];

  return (
    <section className="screen day" lang={locale} aria-label={t('common.day', { n: b.day })}>
      <BaseScene
        phase={b.phase}
        event={type}
        crew="work"
        effect={d?.kind === 'chore' ? 'none' : 'approach'}
        label={t('briefing.scene.label', { state: t('briefing.scene.work') })}
      >
        <MissionClock
          hour={hour}
          eventHour={b.eventHour ?? 12}
          eventIcon={EVENT_ICON[type]}
          fast={fast}
          label={t('briefing.clock.label')}
          fastLabel={t('briefing.clock.fast')}
          tour="clock"
        />
        <span className="day__date">{date}</span>
      </BaseScene>

      <Lira mood={b.comms ? (d?.kind === 'storm' ? 'alert' : d?.kind === 'chore' ? 'happy' : 'neutral') : 'offline'} text={dayText} t={t} tour="lira">
        {(!b.comms || cme.length > 0) && (
          <p className="day__chips">
            {!b.comms && <span className="chip chip--danger">{t('briefing.no_comms')}</span>}
            {cme.map((n) => <span key={n} className="chip chip--warning">{forecastText(t, n)}</span>)}
          </p>
        )}
      </Lira>
      <Decision state={state} dispatch={dispatch} t={t} embedded />

      <footer className="source-note">
        <a href={DONKI_URL} target="_blank" rel="noopener noreferrer">
          🛰️ {t('briefing.source.real_event')} · <time dateTime={b.date}>{b.date}</time> <span aria-hidden="true">↗</span>
          <span className="visually-hidden"> {t('briefing.source.new_tab')}</span>
        </a>
        {donkiIds.length > 0 && (
          <details>
            <summary>{t('briefing.source.ids')}</summary>
            <p className="source-note__ids">{donkiIds.map((id) => <code key={id}>{id}</code>)}</p>
          </details>
        )}
      </footer>
    </section>
  );
}
